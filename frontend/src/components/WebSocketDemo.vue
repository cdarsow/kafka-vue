<template>
  <div class="websocket-demo">
    <div class="header">
      <h2>🚀 WebSocket Connection Demo</h2>
      <div class="connection-status">
        <span 
          :class="statusClass"
          class="status-indicator"
        >
          {{ statusText }}
        </span>
        <span v-if="status.error" class="error-message">
          {{ status.error }}
        </span>
        <span v-if="status.reconnectAttempts > 0" class="reconnect-info">
          Reconnect attempts: {{ status.reconnectAttempts }}
        </span>
      </div>
    </div>

    <div class="controls">
      <button 
        @click="connect" 
        :disabled="status.isConnected || status.isConnecting"
        class="btn btn-primary"
      >
        {{ status.isConnecting ? 'Connecting...' : 'Connect' }}
      </button>
      
      <button 
        @click="disconnect" 
        :disabled="!status.isConnected"
        class="btn btn-secondary"
      >
        Disconnect
      </button>
      
      <button 
        @click="clearMessages"
        class="btn btn-warning"
      >
        Clear Messages
      </button>
    </div>

    <div class="message-input" v-if="status.isConnected">
      <div class="input-group">
        <input 
          v-model="newMessage"
          @keyup.enter="sendMessage"
          placeholder="Type a message..."
          class="message-field"
        />
        <button 
          @click="sendMessage"
          :disabled="!newMessage.trim()"
          class="btn btn-success"
        >
          Send
        </button>
      </div>
    </div>

    <div class="messages-container">
      <h3>Messages ({{ messages.length }})</h3>
      <div class="messages-list">
        <div 
          v-for="(message, index) in messages" 
          :key="index"
          :class="getMessageClass(message.type)"
          class="message"
        >
          <div class="message-header">
            <span class="message-type">{{ message.type }}</span>
            <span class="message-time">{{ formatTime(message.timestamp) }}</span>
          </div>
          <div class="message-content">
            <pre>{{ formatMessageContent(message) }}</pre>
          </div>
        </div>
        
        <div v-if="messages.length === 0" class="empty-state">
          {{ status.isConnected ? 'No messages yet. Send one!' : 'Connect to start receiving messages' }}
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { useWebSocket, type WebSocketMessage } from '../composables/useWebSocket'

const { messages, status, connect, disconnect, sendMessage: sendWSMessage, clearMessages } = useWebSocket()

const newMessage = ref('')

const statusClass = computed(() => ({
  'status-connected': status.isConnected,
  'status-connecting': status.isConnecting,
  'status-disconnected': !status.isConnected && !status.isConnecting,
  'status-error': status.error
}))

const statusText = computed(() => {
  if (status.error) return 'Error'
  if (status.isConnected) return 'Connected'
  if (status.isConnecting) return 'Connecting...'
  return 'Disconnected'
})

function sendMessage() {
  if (!newMessage.value.trim()) return
  
  sendWSMessage(newMessage.value)
  newMessage.value = ''
}

function getMessageClass(type: string) {
  return {
    'message-welcome': type === 'welcome',
    'message-echo': type === 'echo',
    'message-broadcast': type === 'broadcast',
    'message-error': type === 'error',
    'message-user': type === 'user'
  }
}

function formatTime(timestamp: string) {
  return new Date(timestamp).toLocaleTimeString()
}

function formatMessageContent(message: WebSocketMessage) {
  if (message.type === 'echo' && message.originalMessage) {
    return `Echo: ${JSON.stringify(message.originalMessage, null, 2)}`
  }
  if (message.message) {
    return typeof message.message === 'string' 
      ? message.message 
      : JSON.stringify(message.message, null, 2)
  }
  return JSON.stringify(message, null, 2)
}

// Auto-connect on component mount
onMounted(() => {
  connect()
})

// Cleanup on unmount
onUnmounted(() => {
  disconnect()
})
</script>

<style scoped>
.websocket-demo {
  max-width: 800px;
  margin: 0 auto;
  padding: 20px;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
}

.header {
  text-align: center;
  margin-bottom: 30px;
}

.header h2 {
  color: #2c3e50;
  margin-bottom: 15px;
}

.connection-status {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 10px;
  flex-wrap: wrap;
}

.status-indicator {
  padding: 4px 12px;
  border-radius: 12px;
  font-weight: 600;
  font-size: 14px;
}

.status-connected {
  background: #d4edda;
  color: #155724;
}

.status-connecting {
  background: #fff3cd;
  color: #856404;
}

.status-disconnected {
  background: #f8d7da;
  color: #721c24;
}

.status-error {
  background: #f5c6cb;
  color: #721c24;
}

.error-message {
  color: #dc3545;
  font-size: 14px;
}

.reconnect-info {
  color: #6c757d;
  font-size: 12px;
}

.controls {
  display: flex;
  gap: 10px;
  justify-content: center;
  margin-bottom: 20px;
  flex-wrap: wrap;
}

.btn {
  padding: 8px 16px;
  border: none;
  border-radius: 4px;
  font-weight: 600;
  cursor: pointer;
  transition: background-color 0.2s;
}

.btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.btn-primary {
  background: #007bff;
  color: white;
}

.btn-primary:hover:not(:disabled) {
  background: #0056b3;
}

.btn-secondary {
  background: #6c757d;
  color: white;
}

.btn-secondary:hover:not(:disabled) {
  background: #545b62;
}

.btn-warning {
  background: #ffc107;
  color: #212529;
}

.btn-warning:hover:not(:disabled) {
  background: #e0a800;
}

.btn-success {
  background: #28a745;
  color: white;
}

.btn-success:hover:not(:disabled) {
  background: #1e7e34;
}

.message-input {
  margin-bottom: 20px;
}

.input-group {
  display: flex;
  gap: 10px;
  max-width: 500px;
  margin: 0 auto;
}

.message-field {
  flex: 1;
  padding: 8px 12px;
  border: 1px solid #ddd;
  border-radius: 4px;
  font-size: 16px;
}

.message-field:focus {
  outline: none;
  border-color: #007bff;
}

.messages-container {
  margin-top: 30px;
}

.messages-container h3 {
  color: #2c3e50;
  margin-bottom: 15px;
  text-align: center;
}

.messages-list {
  max-height: 400px;
  overflow-y: auto;
  border: 1px solid #ddd;
  border-radius: 8px;
  padding: 10px;
  background: #f8f9fa;
}

.message {
  background: white;
  border-radius: 6px;
  padding: 12px;
  margin-bottom: 10px;
  box-shadow: 0 1px 3px rgba(0,0,0,0.1);
}

.message:last-child {
  margin-bottom: 0;
}

.message-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 8px;
  font-size: 12px;
}

.message-type {
  font-weight: 600;
  text-transform: uppercase;
  padding: 2px 6px;
  border-radius: 3px;
}

.message-welcome .message-type {
  background: #d1ecf1;
  color: #0c5460;
}

.message-echo .message-type {
  background: #e2e3e5;
  color: #383d41;
}

.message-broadcast .message-type {
  background: #d4edda;
  color: #155724;
}

.message-error .message-type {
  background: #f8d7da;
  color: #721c24;
}

.message-user .message-type {
  background: #cce5ff;
  color: #004085;
}

.message-time {
  color: #6c757d;
}

.message-content {
  font-family: 'Monaco', 'Menlo', monospace;
  font-size: 13px;
}

.message-content pre {
  margin: 0;
  white-space: pre-wrap;
  word-wrap: break-word;
  color: #000000;
}

.empty-state {
  text-align: center;
  color: #6c757d;
  padding: 40px 20px;
  font-style: italic;
}
</style>