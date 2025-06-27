#!/bin/bash

# RECOVR System Startup Script
# This script starts the entire RECOVR system using Docker Compose

echo "🚀 Starting RECOVR - Lost & Found System"
echo "======================================"

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

# Check if Docker daemon is running
if ! docker info &> /dev/null; then
    echo "❌ Docker daemon is not running. Please start Docker first."
    exit 1
fi

# Create environment file if it doesn't exist
if [ ! -f .env ]; then
    echo "📝 Creating environment file..."
    cp .env.docker .env
    echo "✅ Environment file created. You can edit .env to customize configuration."
fi

# Create necessary directories
echo "📁 Creating necessary directories..."
mkdir -p uploads
mkdir -p python-detection/models
mkdir -p python-detection/detections
mkdir -p python-detection/logs

# Pull latest images (optional)
echo "🔄 Pulling latest Docker images..."
docker-compose pull

# Start services
echo "🏗️ Building and starting services..."
docker-compose up --build -d

# Wait for services to be healthy
echo "⏳ Waiting for services to start..."
sleep 10

# Check service health
echo "🏥 Checking service health..."

# Check MySQL
if docker-compose exec -T mysql mysqladmin ping -h localhost --silent; then
    echo "✅ MySQL is running"
else
    echo "⚠️ MySQL is not responding yet"
fi

# Check Backend
if curl -f http://localhost:8082/actuator/health &> /dev/null; then
    echo "✅ Backend API is running"
else
    echo "⚠️ Backend API is not responding yet"
fi

# Check AI Detection
if curl -f http://localhost:5003/health &> /dev/null; then
    echo "✅ AI Detection service is running"
else
    echo "⚠️ AI Detection service is not responding yet"
fi

# Check Frontend
if curl -f http://localhost:3000 &> /dev/null; then
    echo "✅ Frontend is running"
else
    echo "⚠️ Frontend is not responding yet"
fi

echo ""
echo "🎉 RECOVR System Started!"
echo "========================"
echo "🌐 Frontend:        http://localhost:3000"
echo "🔧 Backend API:     http://localhost:8082"
echo "🤖 AI Detection:    http://localhost:5003"
echo "🗄️ Database:        localhost:3306"
echo ""
echo "📊 View logs:       docker-compose logs -f"
echo "🛑 Stop system:     docker-compose down"
echo "🔄 Restart:         docker-compose restart"
echo ""

# Show running containers
echo "📋 Running containers:"
docker-compose ps

echo ""
echo "✨ Ready to use! Open http://localhost:3000 in your browser"