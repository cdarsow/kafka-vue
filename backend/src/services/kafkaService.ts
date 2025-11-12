import { Kafka, Producer, Consumer, EachMessagePayload } from 'kafkajs';

export interface KafkaMessage {
  topic: string;
  partition: number;
  offset: string;
  timestamp: string;
  key: string | null;
  value: string | null;
  headers: Record<string, any>;
}

export class KafkaService {
  private kafka: Kafka;
  private producer: Producer | null = null;
  private consumers: Map<string, Consumer> = new Map();
  private isConnected = false;

  constructor() {
    this.kafka = new Kafka({
      clientId: 'kafka-vue-backend',
      brokers: [process.env.KAFKA_BROKER || 'localhost:9092'],
      retry: {
        initialRetryTime: 300,
        retries: 10
      }
    });
  }

  async connect(): Promise<void> {
    try {
      // Initialize producer
      this.producer = this.kafka.producer();
      await this.producer.connect();
      
      this.isConnected = true;
      console.log('✅ Kafka service connected');
    } catch (error) {
      console.error('❌ Failed to connect to Kafka:', error);
      throw error;
    }
  }

  async disconnect(): Promise<void> {
    try {
      // Disconnect producer
      if (this.producer) {
        await this.producer.disconnect();
        this.producer = null;
      }

      // Disconnect all consumers
      for (const [groupId, consumer] of this.consumers) {
        await consumer.disconnect();
      }
      this.consumers.clear();

      this.isConnected = false;
      console.log('✅ Kafka service disconnected');
    } catch (error) {
      console.error('❌ Error disconnecting from Kafka:', error);
    }
  }

  async sendMessage(topic: string, message: string | object, key?: string): Promise<void> {
    if (!this.producer || !this.isConnected) {
      throw new Error('Kafka producer is not connected');
    }

    try {
      const messageValue = typeof message === 'string' ? message : JSON.stringify(message);
      
      await this.producer.send({
        topic,
        messages: [
          {
            key: key || null,
            value: messageValue,
            timestamp: Date.now().toString()
          }
        ]
      });

      console.log(`📤 Message sent to topic "${topic}":`, messageValue);
    } catch (error) {
      console.error(`❌ Failed to send message to topic "${topic}":`, error);
      throw error;
    }
  }

  async createConsumer(
    groupId: string, 
    topics: string[], 
    messageHandler: (message: KafkaMessage) => Promise<void>
  ): Promise<void> {
    try {
      if (this.consumers.has(groupId)) {
        console.log(`Consumer group "${groupId}" already exists`);
        return;
      }

      const consumer = this.kafka.consumer({ groupId });
      await consumer.connect();
      
      // Subscribe to topics
      for (const topic of topics) {
        await consumer.subscribe({ topic, fromBeginning: false });
      }

      // Start consuming messages
      await consumer.run({
        eachMessage: async (payload: EachMessagePayload) => {
          const { topic, partition, message } = payload;
          
          const kafkaMessage: KafkaMessage = {
            topic,
            partition,
            offset: message.offset,
            timestamp: message.timestamp || Date.now().toString(),
            key: message.key?.toString() || null,
            value: message.value?.toString() || null,
            headers: message.headers || {}
          };

          try {
            await messageHandler(kafkaMessage);
            console.log(`📥 Processed message from topic "${topic}":`, kafkaMessage.value);
          } catch (error) {
            console.error(`❌ Error processing message from topic "${topic}":`, error);
          }
        }
      });

      this.consumers.set(groupId, consumer);
      console.log(`✅ Consumer group "${groupId}" created and listening to topics: ${topics.join(', ')}`);
    } catch (error) {
      console.error(`❌ Failed to create consumer group "${groupId}":`, error);
      throw error;
    }
  }

  async createTopicIfNotExists(topic: string, numPartitions = 1): Promise<void> {
    try {
      const admin = this.kafka.admin();
      await admin.connect();

      const existingTopics = await admin.listTopics();
      
      if (!existingTopics.includes(topic)) {
        await admin.createTopics({
          topics: [
            {
              topic,
              numPartitions,
              replicationFactor: 1
            }
          ]
        });
        console.log(`✅ Topic "${topic}" created`);
      } else {
        console.log(`📋 Topic "${topic}" already exists`);
      }

      await admin.disconnect();
    } catch (error) {
      console.error(`❌ Failed to create topic "${topic}":`, error);
      throw error;
    }
  }

  getConnectionStatus(): boolean {
    return this.isConnected;
  }

  async listTopics(): Promise<string[]> {
    try {
      const admin = this.kafka.admin();
      await admin.connect();
      const topics = await admin.listTopics();
      await admin.disconnect();
      return topics;
    } catch (error) {
      console.error('❌ Failed to list topics:', error);
      return [];
    }
  }
}

// Export singleton instance
export const kafkaService = new KafkaService();