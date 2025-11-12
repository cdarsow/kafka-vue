# Kafka-Vue Real-time Application

A full-stack real-time application combining **Vue.js** frontend, **Node.js** backend with WebSocket support, and **Apache Kafka** for event streaming.

## 🏗️ Architecture

```
┌─────────────────┐    WebSocket     ┌─────────────────┐    Kafka     ┌─────────────────┐
│   Vue Frontend  │ ◄──────────────► │ Node.js Backend │ ◄──────────► │  Kafka Cluster  │
│   (Port 5173)   │                  │   (Port 3000)   │              │   (Port 9092)   │
└─────────────────┘                  └─────────────────┘              └─────────────────┘
```

## 🚀 Quick Start

### Prerequisites

- **Node.js** (v18 or higher)
- **Docker** and **Docker Compose**
- **Make** (optional, for easier commands)

### 1. Clone and Setup

```bash
git clone <your-repo>
cd kafka-vue
```

**Option A: Using Make (recommended)**
```bash
make install
```

**Option B: Manual installation**
```bash
cd backend && npm install
cd ../frontend && npm install
```

### 2. Start Kafka

```bash
make kafka-up
```

### 3. Start Applications

**Option A: Using Make (recommended)**
```bash
# Terminal 1: Start backend
make backend

# Terminal 2: Start frontend  
make frontend
```

**Option B: Manual start**
```bash
# Terminal 1: Backend
cd backend && npm run dev

# Terminal 2: Frontend
cd frontend && npm run dev
```

## 📚 Available Services

| Service | URL | Description |
|---------|-----|-------------|
| **Frontend** | http://localhost:5173 | Vue.js application |
| **Backend** | http://localhost:3000 | Node.js API server |
| **WebSocket** | ws://localhost:3000 | Real-time communication |
| **Kafka UI** | http://localhost:8080 | Kafka management interface |
| **Kafka Broker** | localhost:9092 | Kafka message broker |

## 🛠️ Make Commands

```bash
make help           # Show all available commands
make install        # Install dependencies for backend and frontend
make kafka-up       # Start Kafka (Zookeeper, Kafka, Kafka UI)
make kafka-down     # Stop Kafka
make kafka-ui       # Open Kafka UI in browser
make backend        # Start backend server
make frontend       # Start frontend server
make producer       # Start CLI message producer
make status         # Show service status
make clean          # Clean up Docker resources
```

## 🏗️ Project Structure

```
kafka-vue/
├── backend/                 # Node.js TypeScript backend
│   ├── src/
│   │   └── index.ts        # Main server with Express & WebSocket
│   ├── package.json
│   └── tsconfig.json
├── frontend/                # Vue.js TypeScript frontend
│   ├── src/
│   │   ├── components/
│   │   │   └── WebSocketDemo.vue
│   │   ├── composables/
│   │   │   └── useWebSocket.ts
│   │   └── views/
│   │       └── WebSocketView.vue
│   └── package.json
├── docker-compose.yml       # Kafka setup (Zookeeper, Kafka, Kafka UI)
├── Makefile                 # Development commands
└── README.md
```

## 🔧 Kafka Integration

### Docker Setup
- **Zookeeper** - Kafka coordination service
- **Kafka Broker** - Message streaming platform
- **Kafka UI** - Web interface for management

### 📝 Command Line Producer

The application includes a powerful CLI producer for sending messages directly to Kafka topics:

#### Quick Start
```bash
# Make sure Kafka is running
make kafka-up

# Start the producer CLI
make producer
```

#### Manual Start
```bash
cd backend
npm run producer
```

#### Usage
Once started, the producer provides an interactive CLI:

```bash
📤 Enter message: Hello Kafka!
💬 Message sent to "messages": "Hello Kafka!"

📤 Enter message: /notify System update complete
🔔 Message sent to "notifications": "System update complete"
```

#### Available Commands
- **Regular messages**: Just type your message and press Enter → sends to `messages` topic
- **Notifications**: `/notify <message>` → sends to `notifications` topic  
- **Help**: `/help` or `/?` → shows available commands
- **Exit**: `/quit`, `/exit`, or `Ctrl+C` → gracefully shuts down

#### Features
- ✅ **Auto-connection** to Kafka broker
- ✅ **Topic auto-creation** (messages, notifications)
- ✅ **Message metadata** (timestamp, sender, unique ID)
- ✅ **Graceful shutdown** with cleanup
- ✅ **Error handling** and connection retry
- ✅ **Real-time feedback** with emojis and status

#### Message Format
Each message sent includes:
```json
{
  "content": "Your message here",
  "sender": "cli-producer", 
  "timestamp": "2025-11-12T10:30:00.000Z",
  "id": "abc123def"
}
```

## 🧪 Testing the Setup

### 1. Test Backend
```bash
curl http://localhost:3000
curl http://localhost:3000/health
curl http://localhost:3000/api/status
```

### 2. Test WebSocket
1. Open frontend: http://localhost:5173
2. Navigate to WebSocket page
3. Send messages and see real-time updates

### 3. Test Kafka
1. Open Kafka UI: http://localhost:8080
2. View topics and messages
3. Create and manage topics

### 4. Test Producer CLI
```bash
# Start the producer
make producer

# Send test messages
Hello from CLI!
/notify Test notification
/quit
```

Then check Kafka UI to see your messages in the topics.

## 🔄 Development Workflow

### 1. Install Dependencies
```bash
make install     # Install backend and frontend dependencies
```

### 2. Start Infrastructure
```bash
make kafka-up    # Start Kafka
```

### 3. Start Applications
```bash
make backend      # Terminal 1
make frontend     # Terminal 2
make producer     # Terminal 3 (optional - for CLI testing)
```

### 4. Develop
- Backend auto-reloads on TypeScript changes
- Frontend hot-reloads on Vue component changes
- WebSocket connections maintain state
- Producer CLI for real-time message testing

### 5. Monitor & Test
- Check service status: `make status`
- View Kafka messages: Kafka UI at http://localhost:8080
- Send test messages: Producer CLI (`make producer`)
- View WebSocket messages: Frontend demo interface

## 🐳 Docker Compose Configuration

### Setup (`docker-compose.yml`)
Includes:
- Zookeeper
- Kafka Broker
- Kafka UI

## 🔧 Configuration

### Backend Environment Variables
```bash
PORT=3000
NODE_ENV=development
# Add Kafka connection settings as needed
```

### Frontend Configuration
- WebSocket URL: `ws://localhost:3000`
- API Base URL: `http://localhost:3000`

## 📄 License

MIT License - feel free to use this project as a starting point for your own applications!