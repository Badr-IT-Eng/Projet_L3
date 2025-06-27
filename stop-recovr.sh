#!/bin/bash

# RECOVR System Stop Script
# This script stops the entire RECOVR system

echo "🛑 Stopping RECOVR - Lost & Found System"
echo "======================================="

# Stop all services
echo "⏹️ Stopping all services..."
docker-compose down

# Optional: Remove volumes (uncomment if you want to reset data)
# echo "🗑️ Removing data volumes..."
# docker-compose down -v

# Optional: Remove images (uncomment if you want to clean up completely)
# echo "🧹 Removing Docker images..."
# docker-compose down --rmi all

echo ""
echo "✅ RECOVR System stopped successfully!"
echo ""
echo "🔄 To start again: ./start-recovr.sh"
echo "🧹 To clean up completely: docker-compose down -v --rmi all"