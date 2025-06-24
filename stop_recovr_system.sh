#!/bin/bash

# RECOVR System Shutdown Script
# Properly stops all services and cleans up resources

set -e

echo "🛑 Stopping RECOVR Lost & Found System..."
echo "========================================"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

print_status() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Function to stop a service by PID file
stop_service() {
    local pid_file=$1
    local service_name=$2
    
    if [ -f "$pid_file" ]; then
        local pid=$(cat "$pid_file")
        
        if ps -p $pid > /dev/null 2>&1; then
            print_status "Stopping $service_name (PID: $pid)..."
            kill $pid
            
            # Wait for graceful shutdown
            local count=0
            while ps -p $pid > /dev/null 2>&1 && [ $count -lt 10 ]; do
                sleep 1
                count=$((count + 1))
            done
            
            # Force kill if still running
            if ps -p $pid > /dev/null 2>&1; then
                print_warning "Force killing $service_name..."
                kill -9 $pid
            fi
            
            print_success "$service_name stopped"
        else
            print_warning "$service_name was not running (stale PID file)"
        fi
        
        rm -f "$pid_file"
    else
        print_warning "No PID file found for $service_name"
    fi
}

# Stop all services by port (fallback method)
stop_by_port() {
    local port=$1
    local service_name=$2
    
    local pid=$(lsof -ti :$port 2>/dev/null || echo "")
    
    if [ -n "$pid" ]; then
        print_status "Stopping $service_name on port $port (PID: $pid)..."
        kill $pid 2>/dev/null || true
        
        # Wait and force kill if necessary
        sleep 2
        if ps -p $pid > /dev/null 2>&1; then
            kill -9 $pid 2>/dev/null || true
        fi
        
        print_success "$service_name stopped"
    fi
}

# Create logs directory if it doesn't exist
mkdir -p logs

print_status "Stopping all RECOVR services..."

# Stop services using PID files
stop_service "logs/frontend.pid" "Next.js Frontend"
stop_service "logs/backend.pid" "Spring Boot Backend"
stop_service "logs/python-api.pid" "Python Detection Service"

# Fallback: stop by port if PID files didn't work
print_status "Checking for any remaining services on known ports..."
stop_by_port 3000 "Frontend"
stop_by_port 8082 "Backend"
stop_by_port 5002 "Detection Service"

# Additional cleanup for Node.js processes
print_status "Cleaning up any remaining Node.js processes..."
pkill -f "next dev" 2>/dev/null || true
pkill -f "npm run dev" 2>/dev/null || true

# Additional cleanup for Java processes
print_status "Cleaning up any remaining Java processes..."
pkill -f "spring-boot:run" 2>/dev/null || true
pkill -f "recovr" 2>/dev/null || true

# Additional cleanup for Python processes
print_status "Cleaning up any remaining Python detection processes..."
pkill -f "detection_api" 2>/dev/null || true
pkill -f "unified_detection_api" 2>/dev/null || true
pkill -f "strict_detection_api" 2>/dev/null || true

# Clean up temporary files
print_status "Cleaning up temporary files..."

# Remove temporary detection files
rm -f python-detection/temp_*.jpg 2>/dev/null || true
rm -f python-detection/frame_*.jpg 2>/dev/null || true

# Remove log files if requested
if [ "$1" == "--clean-logs" ]; then
    print_status "Cleaning log files..."
    rm -f logs/*.log
    rm -f logs/*.pid
    rm -f *.log
    print_success "Log files cleaned"
fi

# Final verification
print_status "Verifying all services are stopped..."

services_running=0

if lsof -ti :3000 >/dev/null 2>&1; then
    print_warning "Port 3000 is still in use"
    services_running=1
fi

if lsof -ti :8082 >/dev/null 2>&1; then
    print_warning "Port 8082 is still in use"
    services_running=1
fi

if lsof -ti :5002 >/dev/null 2>&1; then
    print_warning "Port 5002 is still in use"
    services_running=1
fi

echo
echo "========================================"
if [ $services_running -eq 0 ]; then
    print_success "🎉 All RECOVR services stopped successfully!"
else
    print_warning "⚠️  Some services may still be running. You may need to restart them manually."
fi
echo "========================================"
echo
echo "📄 Log files preserved in logs/ directory"
echo "🔄 To restart the system: ./start_recovr_system.sh"
echo
if [ "$1" != "--clean-logs" ]; then
    echo "💡 To stop and clean logs: $0 --clean-logs"
fi