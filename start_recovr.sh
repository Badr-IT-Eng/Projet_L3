#!/bin/bash

# 🎯 RECOVR System Launcher
# Starts the complete Lost & Found management system with object detection

clear
echo "🎯 RECOVR - Lost & Found Management System"
echo "=========================================="
echo ""

# Function to check if a command exists
command_exists() {
    command -v "$1" >/dev/null 2>&1
}

# Function to check if a port is in use
port_in_use() {
    netstat -tuln | grep ":$1 " >/dev/null 2>&1
}

# Function to start Spring Boot backend
start_backend() {
    echo "🚀 Starting Spring Boot Backend..."
    cd spring-backend-jdbc
    
    if [ ! -f "./mvnw" ]; then
        echo "❌ Maven wrapper not found!"
        echo "Run the setup first: ./setup_project.sh"
        exit 1
    fi
    
    if port_in_use 8082; then
        echo "⚠️ Port 8082 already in use"
        echo "Backend might already be running"
    else
        echo "Starting backend on port 8082..."
        ./mvnw spring-boot:run &
        BACKEND_PID=$!
        echo "Backend PID: $BACKEND_PID"
    fi
    
    cd ..
}

# Function to start Next.js frontend
start_frontend() {
    echo "🌐 Starting Next.js Frontend..."
    
    if [ ! -d "node_modules" ]; then
        echo "Installing Node.js dependencies..."
        npm install
    fi
    
    if port_in_use 3000; then
        echo "⚠️ Port 3000 already in use"
        echo "Frontend might already be running"
    else
        echo "Starting frontend on port 3000..."
        npm run dev &
        FRONTEND_PID=$!
        echo "Frontend PID: $FRONTEND_PID"
    fi
}

# Function to start detection service
start_detection() {
    echo "📸 Starting Object Detection Service..."
    cd detection-service
    
    # Check if virtual environment exists
    if [ ! -d "venv" ]; then
        echo "Creating Python virtual environment..."
        python3 -m venv venv
    fi
    
    # Activate virtual environment
    source venv/bin/activate
    
    # Install dependencies
    if [ ! -f "requirements_installed.flag" ]; then
        echo "Installing Python dependencies..."
        pip install -r requirements.txt
        touch requirements_installed.flag
    fi
    
    # Check setup
    echo "Running setup test..."
    python test_setup.py
    
    if [ $? -eq 0 ]; then
        echo "✅ Setup test passed!"
        echo ""
        echo "🎥 Object Detection Service will start..."
        echo "Press ENTER to continue or Ctrl+C to skip detection service"
        read -r
        
        python start_detection.py
    else
        echo "❌ Setup test failed!"
        echo "Please fix the issues before starting detection service"
    fi
    
    cd ..
}

# Function to display system status
show_status() {
    echo ""
    echo "📊 RECOVR System Status"
    echo "======================"
    
    # Check backend
    if port_in_use 8082; then
        echo "✅ Backend: Running on http://localhost:8082"
    else
        echo "❌ Backend: Not running"
    fi
    
    # Check frontend
    if port_in_use 3000; then
        echo "✅ Frontend: Running on http://localhost:3000"
    else
        echo "❌ Frontend: Not running"
    fi
    
    # Check PyTorch models
    model_count=$(ls stable_model_epoch_*.pth 2>/dev/null | wc -l)
    if [ "$model_count" -gt 0 ]; then
        echo "✅ PyTorch Models: $model_count model(s) found"
    else
        echo "❌ PyTorch Models: No models found"
    fi
    
    echo ""
}

# Function to show help
show_help() {
    echo "Usage: $0 [OPTION]"
    echo ""
    echo "Options:"
    echo "  all        Start all services (backend + frontend + detection)"
    echo "  backend    Start only Spring Boot backend"
    echo "  frontend   Start only Next.js frontend"
    echo "  detection  Start only object detection service"
    echo "  status     Show system status"
    echo "  test       Run detection service setup test"
    echo "  stop       Stop all services"
    echo "  help       Show this help message"
    echo ""
    echo "Examples:"
    echo "  $0 all         # Start complete system"
    echo "  $0 backend     # Start only backend"
    echo "  $0 status      # Check what's running"
    echo ""
}

# Function to stop services
stop_services() {
    echo "🛑 Stopping RECOVR services..."
    
    # Kill processes on ports 3000 and 8082
    if port_in_use 3000; then
        echo "Stopping frontend (port 3000)..."
        pkill -f "next dev" 2>/dev/null || true
        lsof -ti:3000 | xargs kill -9 2>/dev/null || true
    fi
    
    if port_in_use 8082; then
        echo "Stopping backend (port 8082)..."
        pkill -f "mvnw spring-boot:run" 2>/dev/null || true
        lsof -ti:8082 | xargs kill -9 2>/dev/null || true
    fi
    
    # Kill Python detection processes
    pkill -f "start_detection.py" 2>/dev/null || true
    pkill -f "object_detector.py" 2>/dev/null || true
    
    echo "✅ Services stopped"
}

# Main script logic
case "${1:-all}" in
    "all")
        show_status
        echo ""
        echo "Starting complete RECOVR system..."
        start_backend
        sleep 5
        start_frontend
        sleep 3
        start_detection
        ;;
    "backend")
        start_backend
        echo "✅ Backend started! Check http://localhost:8082"
        ;;
    "frontend")
        start_frontend
        echo "✅ Frontend started! Check http://localhost:3000"
        ;;
    "detection")
        start_detection
        ;;
    "status")
        show_status
        ;;
    "test")
        cd detection-service
        python test_setup.py
        ;;
    "stop")
        stop_services
        ;;
    "help"|"-h"|"--help")
        show_help
        ;;
    *)
        echo "❌ Unknown option: $1"
        show_help
        exit 1
        ;;
esac

echo ""
echo "🎯 RECOVR System Ready!"
echo "====================="
echo "Frontend: http://localhost:3000"
echo "Backend API: http://localhost:8082"
echo "Object Detection: Camera-based real-time detection"
echo ""
echo "Press Ctrl+C to stop services" 