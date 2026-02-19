#!/bin/bash

echo "🚀 Building and deploying Fraud Detection System with Docker..."
echo ""

# Check if Docker is installed
if ! command -v docker &> /dev/null; then
    echo "❌ Docker is not installed. Please install Docker first."
    exit 1
fi

# Check if Docker Compose is installed
if ! command -v docker-compose &> /dev/null; then
    echo "❌ Docker Compose is not installed. Please install Docker Compose first."
    exit 1
fi

# Stop existing containers
echo "🛑 Stopping existing containers..."
docker-compose down

# Build images
echo "🔨 Building Docker images..."
docker-compose build

# Start services
echo "▶️  Starting services..."
docker-compose up -d

# Wait for services to be healthy
echo "⏳ Waiting for services to be healthy..."
sleep 10

# Check service health
echo ""
echo "🔍 Checking service health..."

# Check Python service
if curl -s http://localhost:8000/health > /dev/null; then
    echo "✅ Python Model Service: Running"
else
    echo "❌ Python Model Service: Not responding"
fi

# Check Backend service
if curl -s http://localhost:3001/api/health > /dev/null; then
    echo "✅ Backend Service: Running"
else
    echo "❌ Backend Service: Not responding"
fi

# Check Frontend service
if curl -s http://localhost:5173 > /dev/null; then
    echo "✅ Frontend Service: Running"
else
    echo "❌ Frontend Service: Not responding"
fi

echo ""
echo "✨ Deployment complete!"
echo ""
echo "📍 Service URLs:"
echo "   - Frontend:  http://localhost:5173"
echo "   - Backend:   http://localhost:3001"
echo "   - Python:    http://localhost:8000"
echo ""
echo "📊 View logs: docker-compose logs -f"
echo "🛑 Stop services: docker-compose down"
echo ""
