import express from 'express';
import { createServer } from 'http';
import { WebSocketServer } from 'ws';
import cors from 'cors';
import dotenv from 'dotenv';
import { kafkaService, type KafkaMessage } from './services/kafkaService';

// Load environment variables
dotenv.config();

const app = express();
const server = createServer(app);
const wss = new WebSocketServer({ server });

const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Basic routes
app.get('/', (req, res) => {
  res.json({ 
    message: 'Kafka-Vue Backend Server',
    status: 'running',
    timestamp: new Date().toISOString()
  });
});

app.get('/health', (req, res) => {
  res.json({ 
    status: 'healthy',
    uptime: process.uptime(),
    timestamp: new Date().toISOString()
  });
});

// API routes
app.get('/api/status', async (req, res) => {
  const kafkaTopics = await kafkaService.listTopics();
  res.json({
    server: 'online',
    websocket: 'connected',
    clients: wss.clients.size,
    kafka: {
      connected: kafkaService.getConnectionStatus(),
      topics: kafkaTopics
    }
  });
});

// Kafka API routes
app.post('/api/kafka/send', async (req, res) => {
  try {
    const { topic, message, key } = req.body;
    
    if (!topic || !message) {
      return res.status(400).json({ error: 'Topic and message are required' });
    }

    await kafkaService.sendMessage(topic, message, key);
    res.json({ success: true, message: 'Message sent to Kafka' });
  } catch (error) {
    console.error('Error sending message to Kafka:', error);
    res.status(500).json({ error: 'Failed to send message to Kafka' });
  }
});

app.get('/api/kafka/topics', async (req, res) => {
  try {
    const topics = await kafkaService.listTopics();
    res.json({ topics });
  } catch (error) {
    console.error('Error listing Kafka topics:', error);
    res.status(500).json({ error: 'Failed to list Kafka topics' });
  }
});

app.post('/api/kafka/topics', async (req, res) => {
  try {
    const { topic, partitions = 1 } = req.body;
    
    if (!topic) {
      return res.status(400).json({ error: 'Topic name is required' });
    }

    await kafkaService.createTopicIfNotExists(topic, partitions);
    res.json({ success: true, message: `Topic "${topic}" created or already exists` });
  } catch (error) {
    console.error('Error creating Kafka topic:', error);
    res.status(500).json({ error: 'Failed to create Kafka topic' });
  }
});

// WebSocket connection handling
wss.on('connection', (ws) => {
  console.log('New WebSocket client connected');
  
  // Send welcome message
  ws.send(JSON.stringify({
    type: 'welcome',
    message: 'Connected to Kafka-Vue Backend',
    timestamp: new Date().toISOString()
  }));

  // Handle incoming messages
  ws.on('message', async (data) => {
    try {
      const message = JSON.parse(data.toString());
      console.log('Received message:', message);
      
      // Send message to Kafka if topic is specified
      if (message.topic && kafkaService.getConnectionStatus()) {
        try {
          await kafkaService.sendMessage(message.topic, {
            content: message.message,
            sender: 'websocket-client',
            timestamp: new Date().toISOString()
          });
          
          // Notify sender that message was sent to Kafka
          ws.send(JSON.stringify({
            type: 'kafka-sent',
            originalMessage: message,
            topic: message.topic,
            timestamp: new Date().toISOString()
          }));
        } catch (kafkaError) {
          console.error('Failed to send message to Kafka:', kafkaError);
          ws.send(JSON.stringify({
            type: 'kafka-error',
            error: 'Failed to send message to Kafka',
            originalMessage: message,
            timestamp: new Date().toISOString()
          }));
        }
      }
      
      // Echo message back to client
      ws.send(JSON.stringify({
        type: 'echo',
        originalMessage: message,
        timestamp: new Date().toISOString()
      }));
      
      // Broadcast to all other clients
      wss.clients.forEach((client) => {
        if (client !== ws && client.readyState === ws.OPEN) {
          client.send(JSON.stringify({
            type: 'broadcast',
            message: message,
            timestamp: new Date().toISOString()
          }));
        }
      });
    } catch (error) {
      console.error('Error parsing message:', error);
      ws.send(JSON.stringify({
        type: 'error',
        message: 'Invalid JSON format',
        timestamp: new Date().toISOString()
      }));
    }
  });

  // Handle connection close
  ws.on('close', () => {
    console.log('WebSocket client disconnected');
  });

  // Handle errors
  ws.on('error', (error) => {
    console.error('WebSocket error:', error);
  });
});

// Kafka message handler for broadcasting to WebSocket clients
const handleKafkaMessage = async (kafkaMessage: KafkaMessage) => {
  const wsMessage = {
    type: 'kafka-message',
    topic: kafkaMessage.topic,
    message: kafkaMessage.value ? JSON.parse(kafkaMessage.value) : null,
    partition: kafkaMessage.partition,
    offset: kafkaMessage.offset,
    timestamp: kafkaMessage.timestamp
  };

  // Broadcast to all connected WebSocket clients
  wss.clients.forEach((client) => {
    if (client.readyState === client.OPEN) {
      client.send(JSON.stringify(wsMessage));
    }
  });
};

// Initialize Kafka and start server
async function startServer() {
  try {
    // Start HTTP server
    server.listen(PORT, async () => {
      console.log(`🚀 Server running on port ${PORT}`);
      console.log(`📡 WebSocket server ready`);
      console.log(`🌐 HTTP: http://localhost:${PORT}`);
      console.log(`⚡ WebSocket: ws://localhost:${PORT}`);

      // Initialize Kafka
      try {
        await kafkaService.connect();
        
        // Create default topics
        await kafkaService.createTopicIfNotExists('messages', 3);
        await kafkaService.createTopicIfNotExists('notifications', 1);
        
        // Create consumer for broadcasting Kafka messages to WebSocket clients
        await kafkaService.createConsumer(
          'websocket-broadcast-group',
          ['messages', 'notifications'],
          handleKafkaMessage
        );
        
        console.log('🎯 Kafka service initialized and consumers started');
      } catch (kafkaError) {
        console.error('⚠️  Kafka connection failed, but server will continue without Kafka:', kafkaError);
      }
    });
  } catch (error) {
    console.error('❌ Failed to start server:', error);
    process.exit(1);
  }
}

// Graceful shutdown
async function shutdown() {
  console.log('🛑 Shutting down gracefully...');
  
  try {
    await kafkaService.disconnect();
  } catch (error) {
    console.error('Error disconnecting Kafka:', error);
  }
  
  server.close(() => {
    console.log('✅ Server closed');
    process.exit(0);
  });
}

process.on('SIGTERM', shutdown);
process.on('SIGINT', shutdown);

// Start the server
startServer();