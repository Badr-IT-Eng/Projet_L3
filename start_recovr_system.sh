#!/bin/bash

# RECOVR System Startup Script
# Properly initializes and starts all services with proper error handling

set -e  # Exit on any error

echo "🚀 Starting RECOVR Lost & Found System..."
echo "========================================"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to print colored output
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

# Function to check if a service is running
check_service() {
    local port=$1
    local service_name=$2
    
    if curl -s "http://localhost:$port" > /dev/null 2>&1; then
        print_success "$service_name is running on port $port"
        return 0
    else
        print_warning "$service_name is not responding on port $port"
        return 1
    fi
}

# Function to wait for a service to start
wait_for_service() {
    local port=$1
    local service_name=$2
    local max_attempts=30
    local attempt=1
    
    print_status "Waiting for $service_name to start on port $port..."
    
    while [ $attempt -le $max_attempts ]; do
        if curl -s "http://localhost:$port" > /dev/null 2>&1; then
            print_success "$service_name is ready!"
            return 0
        fi
        
        echo -n "."
        sleep 2
        attempt=$((attempt + 1))
    done
    
    print_error "$service_name failed to start within $(($max_attempts * 2)) seconds"
    return 1
}

# Check if required commands exist
check_dependencies() {
    print_status "Checking dependencies..."
    
    local missing_deps=()
    
    if ! command -v node &> /dev/null; then
        missing_deps+=("node")
    fi
    
    if ! command -v npm &> /dev/null; then
        missing_deps+=("npm")
    fi
    
    if ! command -v java &> /dev/null; then
        missing_deps+=("java")
    fi
    
    if ! command -v python3 &> /dev/null; then
        missing_deps+=("python3")
    fi
    
    if ! command -v mysql &> /dev/null; then
        missing_deps+=("mysql")
    fi
    
    if [ ${#missing_deps[@]} -ne 0 ]; then
        print_error "Missing required dependencies: ${missing_deps[*]}"
        echo "Please install the missing dependencies and try again."
        exit 1
    fi
    
    print_success "All dependencies are available"
}

# Setup environment variables
setup_environment() {
    print_status "Setting up environment..."
    
    # Create .env file if it doesn't exist
    if [ ! -f .env ]; then
        if [ -f .env.example ]; then
            cp .env.example .env
            print_success "Created .env file from .env.example"
        else
            print_warning ".env.example not found, creating basic .env file"
            cat > .env << EOF
NEXTAUTH_SECRET=your-super-secret-key-here-change-this-in-production
NEXTAUTH_URL=http://localhost:3000
NEXT_PUBLIC_BACKEND_URL=http://localhost:8082
BACKEND_URL=http://localhost:8082
NEXT_PUBLIC_DETECTION_API_URL=http://localhost:5002
DETECTION_API_URL=http://localhost:5002
NODE_ENV=development
EOF
        fi
    fi
    
    # Source environment variables
    if [ -f .env ]; then
        set -a
        source .env
        set +a
        print_success "Environment variables loaded"
    fi
}

# Start MySQL database
start_database() {
    print_status "Checking MySQL database..."
    
    # Check if MySQL is running
    if ! mysqladmin ping -h localhost --silent; then
        print_warning "MySQL is not running. Please start MySQL first."
        print_status "On Ubuntu/Debian: sudo systemctl start mysql"
        print_status "On macOS with Homebrew: brew services start mysql"
        return 1
    fi
    
    print_success "MySQL is running"
    
    # Check if database exists
    if mysql -h localhost -u ${DATABASE_USERNAME:-recovr_user} -p${DATABASE_PASSWORD:-Recovr@2024} -e "USE recovr_db;" 2>/dev/null; then
        print_success "Database 'recovr_db' exists"
    else
        print_warning "Database 'recovr_db' does not exist or credentials are incorrect"
        print_status "Please ensure the database is set up according to README.md"
        return 1
    fi
}

# Install frontend dependencies
install_frontend_deps() {
    print_status "Installing frontend dependencies..."
    
    if [ ! -d "node_modules" ]; then
        npm install
        print_success "Frontend dependencies installed"
    else
        print_success "Frontend dependencies already installed"
    fi
}

# Install backend dependencies
install_backend_deps() {
    print_status "Installing backend dependencies..."
    
    cd spring-backend
    
    if [ ! -d "target" ]; then
        if [ -f "mvnw" ]; then
            ./mvnw clean install -DskipTests
        else
            mvn clean install -DskipTests
        fi
        print_success "Backend dependencies installed"
    else
        print_success "Backend dependencies already installed"
    fi
    
    cd ..
}

# Install Python dependencies
install_python_deps() {
    print_status "Setting up Python detection service..."
    
    cd python-detection
    
    # Create virtual environment if it doesn't exist
    if [ ! -d "venv" ]; then
        python3 -m venv venv
        print_success "Python virtual environment created"
    fi
    
    # Activate virtual environment and install dependencies
    source venv/bin/activate
    
    if [ -f "requirements-unified.txt" ]; then
        pip install -r requirements-unified.txt
        print_success "Python dependencies installed"
    else
        print_warning "requirements-unified.txt not found, using existing requirements.txt"
        if [ -f "requirements.txt" ]; then
            pip install -r requirements.txt
        fi
    fi
    
    # Download YOLO model if not exists
    if [ ! -f "yolov8n.pt" ]; then
        python3 -c "from ultralytics import YOLO; YOLO('yolov8n.pt')"
        print_success "YOLO model downloaded"
    fi
    
    deactivate
    cd ..
}

# Start Spring Boot backend
start_backend() {
    print_status "Starting Spring Boot backend..."
    
    cd spring-backend
    
    # Start backend in background
    if [ -f "mvnw" ]; then
        nohup ./mvnw spring-boot:run > ../logs/backend.log 2>&1 &
    else
        nohup mvn spring-boot:run > ../logs/backend.log 2>&1 &
    fi
    
    backend_pid=$!
    echo $backend_pid > ../logs/backend.pid
    
    cd ..
    
    # Wait for backend to start
    if wait_for_service 8082 "Spring Boot Backend"; then
        print_success "Backend started successfully (PID: $backend_pid)"
    else
        print_error "Failed to start backend"
        return 1
    fi
}

# Start Python detection service
start_detection_service() {
    print_status "Starting Python detection service..."
    
    cd python-detection
    source venv/bin/activate
    
    # Start the unified detection API
    if [ -f "unified_detection_api.py" ]; then
        nohup python3 unified_detection_api.py > ../logs/python-api.log 2>&1 &
    else
        print_warning "Unified API not found, starting strict detection API as fallback"
        nohup python3 strict_detection_api.py > ../logs/python-api.log 2>&1 &
    fi
    
    detection_pid=$!
    echo $detection_pid > ../logs/python-api.pid
    
    deactivate
    cd ..
    
    # Wait for detection service to start
    if wait_for_service 5002 "Python Detection Service"; then
        print_success "Detection service started successfully (PID: $detection_pid)"
    else
        print_warning "Detection service failed to start (this is optional)"
    fi
}

# Start Next.js frontend
start_frontend() {
    print_status "Starting Next.js frontend..."
    
    # Start frontend in background
    nohup npm run dev > logs/frontend.log 2>&1 &
    frontend_pid=$!
    echo $frontend_pid > logs/frontend.pid
    
    # Wait for frontend to start
    if wait_for_service 3000 "Next.js Frontend"; then
        print_success "Frontend started successfully (PID: $frontend_pid)"
    else
        print_error "Failed to start frontend"
        return 1
    fi
}

# Create logs directory
mkdir -p logs

# Main execution
print_status "Starting RECOVR system initialization..."

check_dependencies
setup_environment

# Start database check
if ! start_database; then
    print_error "Database check failed. Please fix database issues and try again."
    exit 1
fi

# Install dependencies
install_frontend_deps
install_backend_deps
install_python_deps

# Start services
print_status "Starting services..."

start_backend
start_detection_service  # This is optional and won't fail the startup
start_frontend

echo
echo "========================================"
print_success "🎉 RECOVR System Started Successfully!"
echo "========================================"
echo
echo "📊 Service Status:"
check_service 3000 "Frontend (Next.js)"
check_service 8082 "Backend (Spring Boot)"
check_service 5002 "Detection Service (Python)"
echo
echo "🔗 Access Points:"
echo "   Frontend:  http://localhost:3000"
echo "   Backend:   http://localhost:8082"
echo "   Detection: http://localhost:5002/health"
echo
echo "📋 Default Login:"
echo "   Username: admin"
echo "   Password: admin123"
echo
echo "📄 Log Files:"
echo "   Frontend: logs/frontend.log"
echo "   Backend:  logs/backend.log"
echo "   Python:   logs/python-api.log"
echo
echo "🛑 To stop all services: ./stop_recovr_system.sh"
echo

# Keep script running to monitor services
print_status "Monitoring services... Press Ctrl+C to stop monitoring (services will continue running)"

trap 'echo; print_status "Monitoring stopped. Services are still running."; exit 0' INT

while true; do
    sleep 30
    
    # Basic health check
    if ! check_service 3000 "Frontend" >/dev/null 2>&1; then
        print_warning "Frontend service seems to be down"
    fi
    
    if ! check_service 8082 "Backend" >/dev/null 2>&1; then
        print_warning "Backend service seems to be down"
    fi
done