#!/bin/bash
# R1 Super App — Start all backend services
# Run from project root: chmod +x start-backend.sh && ./start-backend.sh

set -e
ROOT=$(pwd)

echo "🚀 Starting R1 Super App Backend..."
echo ""

# Check Docker
if ! docker info > /dev/null 2>&1; then
  echo "❌ Docker is not running. Please start Docker Desktop first."
  exit 1
fi

# Start infrastructure
echo "📦 Starting infrastructure (PostgreSQL, Redis, Kafka)..."
cd "$ROOT/infrastructure/docker"
docker compose up -d
echo "✅ Infrastructure started. Waiting 20s for Kafka..."
sleep 20

# Start Node.js services in background
echo ""
echo "🟢 Starting Node.js services..."
cd "$ROOT/services/node/user-service" && npm install --silent && node src/index.js &
sleep 2
cd "$ROOT/services/node/sos-service" && npm install --silent && node src/index.js &
sleep 1
cd "$ROOT/services/node/train-service" && npm install --silent && node src/index.js &
sleep 1
cd "$ROOT/services/node/map-service" && npm install --silent && node src/index.js &
sleep 1
echo "✅ Node.js services started"

# Spring Boot services
echo ""
echo "☕ Starting Spring Boot services (this takes 2-3 minutes)..."
cd "$ROOT/services/spring-boot/auth-service" && mvn spring-boot:run -q &
sleep 5
cd "$ROOT/services/spring-boot/payment-service" && mvn spring-boot:run -q &
sleep 3
cd "$ROOT/services/spring-boot/porter-service" && mvn spring-boot:run -q &
sleep 3
cd "$ROOT/services/spring-boot/station-dashboard-service" && mvn spring-boot:run -q &
sleep 3
cd "$ROOT/services/spring-boot/notification-service" && mvn spring-boot:run -q &
sleep 3
cd "$ROOT/services/spring-boot/ai-planner" && mvn spring-boot:run -q &
sleep 3
cd "$ROOT/services/spring-boot/ai-assistant" && mvn spring-boot:run -q &
sleep 5
cd "$ROOT/services/spring-boot/api-gateway" && mvn spring-boot:run -q &

echo ""
echo "⏳ Waiting for Spring Boot services to start..."
sleep 30

echo ""
echo "✅ All services started!"
echo ""
echo "📊 Service URLs:"
echo "  API Gateway:         http://localhost:8080"
echo "  Auth Service:        http://localhost:8081"
echo "  Porter Service:      http://localhost:8092"
echo "  Payment Service:     http://localhost:8090"
echo "  Station Dashboard:   http://localhost:8094"
echo "  Notification:        http://localhost:8093"
echo "  AI Planner:          http://localhost:8087"
echo "  AI Assistant:        http://localhost:8088"
echo "  User Service:        http://localhost:3001"
echo "  SOS Service:         http://localhost:3006"
echo "  Train Service:       http://localhost:3011"
echo "  Map Service:         http://localhost:3010"
echo "  Kafka UI:            http://localhost:8085"
echo ""
echo "🌐 Start React web: cd r1_web_final && npm install && npm run dev"
echo "📱 Start Flutter:   cd r1_flutter_final && flutter run"
echo ""
echo "Press Ctrl+C to stop all services"
wait
