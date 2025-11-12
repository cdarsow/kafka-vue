<template>
  <div class="kafka-messages">
    <div class="header">
      <h2>📡 Kafka Messages Stream</h2>
      <div class="connection-status">
        <span 
          :class="statusClass"
          class="status-indicator"
        >
          {{ statusText }}
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

    <div class="messages-container">
      <h3>Kafka Events ({{ kafkaMessages.length }})</h3>
      <div class="messages-list">
        <div 
          v-for="(message, index) in kafkaMessages" 
          :key="index"
          :class="getMessageClass(message)"
          class="message"
        >
          <div class="message-header">
            <div class="message-info">
              <span class="message-topic" v-if="message.topic">
                {{ getTopicIcon(message.topic) }} {{ message.topic }}
              </span>
              <span v-if="!message.topic" class="message-type">
                {{ getMessageTypeIcon(message.type) }} {{ message.type }}
              </span>
            </div>
            <span class="message-time" :title="getFullTimestamp(message.timestamp)">
              🕒 {{ formatTime(message.timestamp) }}
            </span>
          </div>
          <div class="message-content">
            <div class="content-text" v-html="formatMessageText(message)"></div>
            <div v-if="message.partition !== undefined" class="metadata">
              Partition: {{ message.partition }} | Offset: {{ message.offset }}
            </div>
          </div>
        </div>
        
        <div v-if="kafkaMessages.length === 0" class="empty-state">
          {{ status.isConnected ? 'No Kafka messages yet. Use the CLI producer to send some!' : 'Connect to start receiving Kafka messages' }}
        </div>
      </div>
    </div>

    <div class="instructions" v-if="status.isConnected">
      <h4>💡 How to send messages:</h4>
      <div class="instruction-item">
        <strong>1. Start CLI Producer:</strong>
        <code>cd backend && npm run producer</code>
      </div>
      <div class="instruction-item">
        <strong>2. Type messages:</strong> They will appear here in real-time!
      </div>
      <div class="instruction-item">
        <strong>3. Commands:</strong>
        <ul>
          <li><code>Hello World</code> - sends to "messages" topic</li>
          <li><code>/notify Important update</code> - sends to "notifications" topic</li>
        </ul>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, onUnmounted } from 'vue'
import { useWebSocket, type WebSocketMessage } from '../composables/useWebSocket'

const { messages, status, connect, disconnect, clearMessages } = useWebSocket()

const kafkaMessages = computed(() => 
  messages.value.filter(msg => msg.type === 'kafka-message')
)

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

function getMessageClass(message: WebSocketMessage) {
  const baseClass = {
    'message-kafka': message.type === 'kafka-message'
  }
  
  if (message.topic === 'notifications') {
    return { ...baseClass, 'message-notification': true }
  }
  
  return { ...baseClass, 'message-regular': true }
}

function formatTime(timestamp: string | number | undefined): string {
  if (!timestamp) {
    return new Date().toLocaleTimeString()
  }
  
  try {
    // Handle different timestamp formats
    let date: Date
    
    if (typeof timestamp === 'string') {
      // Try parsing as ISO string first, then as number
      if (timestamp.includes('T') || timestamp.includes('-')) {
        date = new Date(timestamp)
      } else {
        // Might be a timestamp as string
        date = new Date(parseInt(timestamp))
      }
    } else if (typeof timestamp === 'number') {
      // If timestamp is in seconds, convert to milliseconds
      date = new Date(timestamp < 1e12 ? timestamp * 1000 : timestamp)
    } else {
      date = new Date()
    }
    
    // Validate date
    if (isNaN(date.getTime())) {
      return new Date().toLocaleTimeString()
    }
    
    return date.toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: false
    })
  } catch (error) {
    console.warn('Error formatting timestamp:', timestamp, error)
    return new Date().toLocaleTimeString()
  }
}

function formatMessageText(message: WebSocketMessage): string {
  const text = getMessageText(message)
  console.log(message);
  // If it looks like JSON, format it with syntax highlighting
  if (text.startsWith('{') || text.startsWith('[')) {
    try {
      const parsed = JSON.parse(text)
      const formatted = JSON.stringify(parsed, null, 2)
      return `<code>${escapeHtml(formatted)}</code>`
    } catch {
      // Not valid JSON, return as is
      return escapeHtml(text)
    }
  }
  
  return escapeHtml(text)
}

function getMessageText(message: WebSocketMessage): string {
  if (typeof message.message === 'string') {
    return message.message
  }
  
  if (message.message && typeof message.message === 'object') {
    // Handle structured Kafka messages
    const msg = message.message as Record<string, unknown>
    
    // Check for content field first
    if (msg.content && typeof msg.content === 'string') {
      return msg.content
    }
    
    // Check for other common message fields
    if (msg.text && typeof msg.text === 'string') {
      return msg.text
    }
    
    if (msg.body && typeof msg.body === 'string') {
      return msg.body
    }
    
    if (msg.data && typeof msg.data === 'string') {
      return msg.data
    }
    
    // If it's a simple object with only a few fields, try to display nicely
    const keys = Object.keys(msg)
    if (keys.length <= 3 && keys.includes('timestamp')) {
      const displayFields = keys.filter(k => k !== 'timestamp' && k !== 'id')
      if (displayFields.length === 1 && displayFields[0]) {
        const value = msg[displayFields[0]]
        if (typeof value === 'string') {
          return value
        }
      }
    }
    
    // Fallback to JSON with better formatting
    return JSON.stringify(message.message, null, 2)
  }
  
  return 'Empty message'
}

function escapeHtml(text: string): string {
  const div = document.createElement('div')
  div.textContent = text
  return div.innerHTML
}

function getTopicIcon(topic: string): string {
  switch (topic) {
    case 'messages': return '💬'
    case 'notifications': return '🔔'
    case 'events': return '⚡'
    case 'errors': return '❌'
    default: return '📂'
  }
}

function getMessageTypeIcon(type: string): string {
  switch (type) {
    case 'kafka-message': return '📡'
    case 'welcome': return '👋'
    case 'echo': return '🔄'
    case 'broadcast': return '📢'
    case 'error': return '❌'
    default: return '💬'
  }
}

function getFullTimestamp(timestamp?: string | number): string {
  if (!timestamp) {
    return new Date().toLocaleString()
  }
  
  try {
    let date: Date
    
    if (typeof timestamp === 'string') {
      if (timestamp.includes('T') || timestamp.includes('-')) {
        date = new Date(timestamp)
      } else {
        date = new Date(parseInt(timestamp))
      }
    } else {
      date = new Date(timestamp < 1e12 ? timestamp * 1000 : timestamp)
    }
    
    if (isNaN(date.getTime())) {
      return new Date().toLocaleString()
    }
    
    return date.toLocaleString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: false
    })
  } catch {
    return new Date().toLocaleString()
  }
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
.kafka-messages {
  max-width: 900px;
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

.messages-container {
  margin-bottom: 30px;
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
  border-left: 4px solid #007bff;
}

.message.message-notification {
  border-left-color: #ffc107;
  background: #fffdf2;
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

.message-info {
  display: flex;
  align-items: center;
  gap: 8px;
}

.message-topic {
  font-weight: 600;
  color: #495057;
  background: #e9ecef;
  padding: 2px 6px;
  border-radius: 3px;
  font-size: 11px;
}

.message-type {
  font-weight: 600;
  color: #6c757d;
  background: #f8f9fa;
  padding: 2px 6px;
  border-radius: 3px;
  font-size: 11px;
}

.message-time {
  color: #6c757d;
}

.message-content {
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
}

.content-text {
  font-size: 14px;
  line-height: 1.4;
  margin-bottom: 5px;
  white-space: pre-wrap;
  word-break: break-word;
  color: #000000;
}

.content-text code {
  background: #f8f9fa;
  border: 1px solid #e9ecef;
  border-radius: 4px;
  padding: 8px;
  font-family: 'Monaco', 'Menlo', 'Ubuntu Mono', monospace;
  font-size: 12px;
  display: block;
  overflow-x: auto;
}

.metadata {
  font-size: 11px;
  color: #6c757d;
  font-style: italic;
}

.empty-state {
  text-align: center;
  color: #6c757d;
  padding: 40px 20px;
  font-style: italic;
}

.instructions {
  background: #f8f9fa;
  border: 1px solid #dee2e6;
  border-radius: 8px;
  padding: 20px;
  margin-top: 20px;
}

.instructions h4 {
  margin: 0 0 15px 0;
  color: #495057;
}

.instruction-item {
  margin-bottom: 10px;
}

.instruction-item strong {
  color: #495057;
}

.instruction-item code {
  background: #e9ecef;
  padding: 2px 6px;
  border-radius: 3px;
  font-family: 'Monaco', 'Menlo', monospace;
  font-size: 12px;
}

.instruction-item ul {
  margin: 5px 0 0 20px;
  padding: 0;
}

.instruction-item li {
  margin: 2px 0;
}
</style>