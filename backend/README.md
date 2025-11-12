# Kafka-Vue Backend

A Node.js backend server with TypeScript, Express, and WebSocket support.

## Features

- 🚀 Express.js server with TypeScript
- ⚡ WebSocket support for real-time communication
- 🔄 CORS enabled for frontend integration
- 🛡️ Environment variable configuration
- 📊 Health check endpoints
- 🔄 Hot reload for development

## Getting Started

### Prerequisites

- Node.js (version 18 or higher)
- npm or yarn

### Installation

1. Navigate to the backend directory:
   ```bash
   cd backend
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Copy environment variables:
   ```bash
   cp .env.example .env
   ```

4. Start the development server:
   ```bash
   npm run dev
   ```

## Available Scripts

- `npm run dev` - Start development server with hot reload
- `npm run build` - Build the TypeScript project
- `npm start` - Start the production server
- `npm run clean` - Clean the build directory

## API Endpoints

### HTTP Endpoints

- `GET /` - Server status and information
- `GET /health` - Health check endpoint
- `GET /api/status` - API status with WebSocket client count

### WebSocket

Connect to `ws://localhost:3000` for real-time communication.

#### Message Types

- `welcome` - Sent when client connects
- `echo` - Echo back received messages
- `broadcast` - Broadcast messages to other clients
- `error` - Error messages

## Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| PORT | Server port | 3000 |
| NODE_ENV | Environment mode | development |

## Project Structure

```
backend/
├── src/
│   └── index.ts          # Main server file
├── dist/                 # Build output (generated)
├── .env                  # Environment variables
├── .gitignore           # Git ignore rules
├── package.json         # Dependencies and scripts
├── tsconfig.json        # TypeScript configuration
└── README.md            # This file
```

## Development

The server supports hot reload during development. Any changes to TypeScript files will automatically restart the server.

## Production

1. Build the project:
   ```bash
   npm run build
   ```

2. Start the production server:
   ```bash
   npm start
   ```