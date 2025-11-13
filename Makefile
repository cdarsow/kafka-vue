.PHONY: help install kafka-up kafka-down kafka-restart kafka-logs kafka-ui backend frontend producer dev clean status

help:
	@echo "Available commands:"
	@echo "  install       - Install dependencies for backend and frontend"
	@echo "  kafka-up      - Start Kafka cluster (KRaft mode, Kafka UI)"
	@echo "  kafka-down    - Stop Kafka cluster"
	@echo "  kafka-restart - Restart Kafka cluster"
	@echo "  kafka-logs    - Show Kafka logs"
	@echo "  kafka-ui      - Open Kafka UI in browser"
	@echo "  backend       - Start backend server"
	@echo "  frontend      - Start frontend server"
	@echo "  producer      - Start CLI message producer"
	@echo "  dev           - Start both backend and frontend"
	@echo "  clean         - Clean up Docker volumes and containers"
	@echo "  status        - Show status of all services"

## Install dependencies
install:
	@echo "📦 Installing dependencies..."
	@echo "Installing backend dependencies..."
	cd backend && npm install
	@echo "Installing frontend dependencies..."
	cd frontend && npm install
	@echo "✅ All dependencies installed successfully!"

## Kafka cluster management
kafka-up:
	@echo "🚀 Starting Kafka cluster (KRaft mode)..."
	docker-compose up -d
	@echo "✅ Kafka cluster is starting up!"
	@echo "📊 Kafka UI will be available at: http://localhost:8080"
	@echo "🔗 Kafka broker at: localhost:9092"
	@echo "🎉 Running without Zookeeper - KRaft mode enabled!"

kafka-down:
	@echo "🛑 Stopping Kafka cluster..."
	docker-compose down
	@echo "✅ Kafka cluster stopped!"

kafka-restart: kafka-down kafka-up

## Show Kafka logs
kafka-logs:
	docker-compose logs -f kafka

## Open Kafka UI in browser
kafka-ui:
	@echo "🌐 Opening Kafka UI..."
	open http://localhost:8080 || xdg-open http://localhost:8080 || echo "Please open http://localhost:8080 in your browser"

## Backend server
backend:
	@echo "🖥️  Starting backend server..."
	cd backend && npm run dev

## Frontend server
frontend:
	@echo "🎨 Starting frontend server..."
	cd frontend && npm run dev

## Kafka CLI Producer
producer:
	@echo "📝 Starting Kafka CLI Producer..."
	cd backend && npm run producer

## Start both backend and frontend (requires multiple terminals)
dev:
	@echo "🚀 Starting development environment..."
	@echo "Run these commands in separate terminals:"
	@echo "  make backend"
	@echo "  make frontend"
	@echo "  make kafka-up"

## Clean up Docker volumes and containers
clean:
	@echo "🧹 Cleaning up Docker resources..."
	docker-compose down -v
	@echo "✅ Cleanup complete!"

## Show status of all services
status:
	@echo "📊 Service Status:"
	@echo "=================="
	@echo "Docker Containers:"
	docker ps --filter "name=kafka-vue" --format "table {{.Names}}\t{{.Status}}\t{{.Ports}}"
	@echo ""
	@echo "Available URLs:"
	@echo "- Kafka UI: http://localhost:8080"
	@echo "- Frontend: http://localhost:5173"
	@echo "- Backend: http://localhost:3000"
	@echo "- Kafka Broker: localhost:9092"
