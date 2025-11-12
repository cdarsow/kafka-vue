#!/usr/bin/env node

import * as readline from 'readline';
import { kafkaService } from './services/kafkaService';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

class KafkaProducer {
  private rl: readline.Interface;
  private isRunning = false;

  constructor() {
    this.rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout
    });
  }

  async start(): Promise<void> {
    try {
      console.log('🚀 Starting Kafka Producer CLI...');
      
      // Connect to Kafka
      await kafkaService.connect();
      
      // Ensure topics exist
      await kafkaService.createTopicIfNotExists('messages', 3);
      await kafkaService.createTopicIfNotExists('notifications', 1);
      
      console.log('✅ Connected to Kafka successfully!');
      console.log('📝 Type messages to send to Kafka topics:');
      console.log('💡 Commands:');
      console.log('   - Just type a message to send to "messages" topic');
      console.log('   - /notify <message> to send to "notifications" topic');
      console.log('   - /quit or Ctrl+C to exit');
      console.log('---------------------------------------------------');

      this.isRunning = true;
      this.startPrompt();

    } catch (error) {
      console.error('❌ Failed to start Kafka producer:', error);
      process.exit(1);
    }
  }

  private startPrompt(): void {
    if (!this.isRunning) return;

    this.rl.question('📤 Enter message: ', async (input) => {
      if (!input.trim()) {
        this.startPrompt();
        return;
      }

      try {
        await this.handleInput(input.trim());
      } catch (error) {
        console.error('❌ Error processing input:', error);
      }
      
      this.startPrompt();
    });
  }

  private async handleInput(input: string): Promise<void> {
    if (input === '/quit' || input === '/exit') {
      await this.shutdown();
      return;
    }

    // Handle notification command
    if (input.startsWith('/notify ')) {
      const message = input.substring(8);
      if (message) {
        await this.sendMessage('notifications', message);
      } else {
        console.log('⚠️  Usage: /notify <message>');
      }
      return;
    }

    // Handle help command
    if (input === '/help' || input === '/?') {
      console.log('💡 Available commands:');
      console.log('   - Just type a message to send to "messages" topic');
      console.log('   - /notify <message> to send to "notifications" topic');
      console.log('   - /quit to exit');
      return;
    }

    // Default: send to messages topic
    await this.sendMessage('messages', input);
  }

  private async sendMessage(topic: string, message: string): Promise<void> {
    try {
      const messageData = {
        content: message,
        sender: 'cli-producer',
        timestamp: new Date().toISOString(),
        id: Math.random().toString(36).substr(2, 9)
      };

      await kafkaService.sendMessage(topic, messageData);
      
      const topicEmoji = topic === 'notifications' ? '🔔' : '💬';
      console.log(`${topicEmoji} Message sent to "${topic}": "${message}"`);
      
    } catch (error) {
      console.error(`❌ Failed to send message to ${topic}:`, error);
    }
  }

  async shutdown(): Promise<void> {
    console.log('\n🛑 Shutting down producer...');
    this.isRunning = false;
    
    try {
      await kafkaService.disconnect();
      console.log('✅ Disconnected from Kafka');
    } catch (error) {
      console.error('❌ Error disconnecting from Kafka:', error);
    }
    
    this.rl.close();
    process.exit(0);
  }
}

// Handle graceful shutdown
const producer = new KafkaProducer();

process.on('SIGINT', async () => {
  await producer.shutdown();
});

process.on('SIGTERM', async () => {
  await producer.shutdown();
});

// Start the producer
producer.start().catch((error) => {
  console.error('❌ Failed to start producer:', error);
  process.exit(1);
});