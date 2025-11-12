import { ref, reactive } from 'vue'

export type MessageType = 'welcome' | 'echo' | 'broadcast' | 'error' | 'user' | 'kafka-message' | 'kafka-sent' | 'kafka-error'

export interface WebSocketMessage {
  type: MessageType
  message?: string | object
  originalMessage?: string | object
  timestamp?: string | number
  topic?: string
  partition?: number
  offset?: string
}

export interface ConnectionStatus {
  isConnected: boolean
  isConnecting: boolean
  error: string | null
  reconnectAttempts: number
}

class WebSocketService {
  private ws: WebSocket | null = null
  private url: string
  private reconnectInterval: number = 5000
  private maxReconnectAttempts: number = 5
  
  public messages = ref<WebSocketMessage[]>([])
  public status = reactive<ConnectionStatus>({
    isConnected: false,
    isConnecting: false,
    error: null,
    reconnectAttempts: 0
  })

  constructor(url: string = 'ws://localhost:3000') {
    this.url = url
  }

  connect(): void {
    if (this.ws?.readyState === WebSocket.OPEN) {
      console.log('WebSocket is already connected')
      return
    }

    this.status.isConnecting = true
    this.status.error = null

    try {
      this.ws = new WebSocket(this.url)
      this.setupEventListeners()
    } catch {
      this.handleError('Failed to create WebSocket connection')
    }
  }

  private setupEventListeners(): void {
    if (!this.ws) return

    this.ws.onopen = () => {
      console.log('WebSocket connected')
      this.status.isConnected = true
      this.status.isConnecting = false
      this.status.error = null
      this.status.reconnectAttempts = 0
    }

    this.ws.onmessage = (event) => {
      try {
        const data: WebSocketMessage = JSON.parse(event.data)
        
        // Ensure timestamp is present and valid
        if (!data.timestamp) {
          data.timestamp = new Date().toISOString()
        }
        
        // If message has a nested timestamp, prefer that
        if (data.message && typeof data.message === 'object' && 'timestamp' in data.message) {
          const nestedTimestamp = (data.message as Record<string, unknown>).timestamp
          if (typeof nestedTimestamp === 'string' || typeof nestedTimestamp === 'number') {
            data.timestamp = nestedTimestamp.toString()
          }
        }
        
        this.messages.value.push(data)
        console.log('Received message:', data)
      } catch (error) {
        console.error('Failed to parse message:', error)
        this.handleError('Failed to parse incoming message')
      }
    }

    this.ws.onclose = (event) => {
      console.log('WebSocket disconnected:', event.code, event.reason)
      this.status.isConnected = false
      this.status.isConnecting = false
      
      if (event.code !== 1000 && this.status.reconnectAttempts < this.maxReconnectAttempts) {
        this.reconnect()
      }
    }

    this.ws.onerror = (error) => {
      console.error('WebSocket error:', error)
      this.handleError('WebSocket connection error')
    }
  }

  private reconnect(): void {
    this.status.reconnectAttempts++
    console.log(`Attempting to reconnect... (${this.status.reconnectAttempts}/${this.maxReconnectAttempts})`)
    
    setTimeout(() => {
      this.connect()
    }, this.reconnectInterval)
  }

  private handleError(message: string): void {
    this.status.error = message
    this.status.isConnecting = false
    this.status.isConnected = false
  }

  sendMessage(message: string | object): void {
    if (!this.ws || this.ws.readyState !== WebSocket.OPEN) {
      this.handleError('WebSocket is not connected')
      return
    }

    try {
      const messageToSend = {
        type: 'user' as MessageType,
        message,
        timestamp: new Date().toISOString()
      }
      
      this.ws.send(JSON.stringify(messageToSend))
      console.log('Sent message:', messageToSend)
    } catch (error) {
      console.error('Failed to send message:', error)
      this.handleError('Failed to send message')
    }
  }

  disconnect(): void {
    if (this.ws) {
      this.ws.close(1000, 'Client initiated disconnect')
      this.ws = null
    }
    this.status.isConnected = false
    this.status.isConnecting = false
  }

  clearMessages(): void {
    this.messages.value = []
  }
}

// Create a singleton instance
export const webSocketService = new WebSocketService()

// Composable for using WebSocket in components
export function useWebSocket() {
  return {
    messages: webSocketService.messages,
    status: webSocketService.status,
    connect: () => webSocketService.connect(),
    disconnect: () => webSocketService.disconnect(),
    sendMessage: (message: string | object) => webSocketService.sendMessage(message),
    clearMessages: () => webSocketService.clearMessages()
  }
}