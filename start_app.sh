#!/bin/bash

echo "🚀 Starting RecovR Lost & Found System..."

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Check if MySQL is running
echo -e "${BLUE}📊 Checking MySQL connection...${NC}"
if ! mysql -u root -p -e "SELECT 1;" 2>/dev/null; then
    echo -e "${RED}❌ MySQL is not running or not accessible. Please start MySQL first.${NC}"
    echo -e "${YELLOW}To start MySQL:${NC}"
    echo "  sudo systemctl start mysql"
    echo "  # OR"
    echo "  sudo service mysql start"
    exit 1
fi

echo -e "${GREEN}✅ MySQL is running${NC}"

# Function to start Spring Boot backend
start_backend() {
    echo -e "${BLUE}🔧 Starting Spring Boot backend...${NC}"
    cd spring-backend
    
    # Check if Maven wrapper exists
    if [ ! -f "./mvnw" ]; then
        echo -e "${RED}❌ Maven wrapper not found in spring-backend directory${NC}"
        exit 1
    fi
    
    # Start Spring Boot in background
    nohup ./mvnw spring-boot:run > ../backend.log 2>&1 &
    BACKEND_PID=$!
    echo $BACKEND_PID > ../backend.pid
    
    echo -e "${GREEN}✅ Spring Boot backend started (PID: $BACKEND_PID)${NC}"
    echo -e "${YELLOW}📋 Backend logs: tail -f backend.log${NC}"
    
    cd ..
}

# Function to start Next.js frontend
start_frontend() {
    echo -e "${BLUE}⚡ Starting Next.js frontend...${NC}"
    
    # Check if .env.local exists
    if [ ! -f ".env.local" ]; then
        echo -e "${YELLOW}📝 Creating .env.local file...${NC}"
        cat > .env.local << EOF
# NextAuth Configuration
NEXTAUTH_SECRET=ThisIsATemporarySecretForDevelopmentOnly123456789
NEXTAUTH_URL=http://localhost:3000

# Backend API Configuration
NEXT_PUBLIC_API_URL=http://localhost:8082

# Development Settings
NODE_ENV=development
EOF
    fi
    
    # Install dependencies if node_modules doesn't exist
    if [ ! -d "node_modules" ]; then
        echo -e "${YELLOW}📦 Installing Node.js dependencies...${NC}"
        npm install
    fi
    
    # Start Next.js in background
    nohup npm run dev > frontend.log 2>&1 &
    FRONTEND_PID=$!
    echo $FRONTEND_PID > frontend.pid
    
    echo -e "${GREEN}✅ Next.js frontend started (PID: $FRONTEND_PID)${NC}"
    echo -e "${YELLOW}📋 Frontend logs: tail -f frontend.log${NC}"
}

# Function to wait for services
wait_for_services() {
    echo -e "${BLUE}⏳ Waiting for services to start...${NC}"
    
    # Wait for backend
    echo "Waiting for backend (port 8082)..."
    timeout=60
    while [ $timeout -gt 0 ]; do
        if curl -s http://localhost:8082/actuator/health >/dev/null 2>&1; then
            echo -e "${GREEN}✅ Backend is ready${NC}"
            break
        fi
        sleep 2
        timeout=$((timeout-2))
    done
    
    # Wait for frontend
    echo "Waiting for frontend (port 3000)..."
    timeout=60
    while [ $timeout -gt 0 ]; do
        if curl -s http://localhost:3000 >/dev/null 2>&1; then
            echo -e "${GREEN}✅ Frontend is ready${NC}"
            break
        fi
        sleep 2
        timeout=$((timeout-2))
    done
}

# Main execution
echo -e "${BLUE}🔄 Starting services...${NC}"

start_backend
start_frontend
wait_for_services

echo -e "${GREEN}🎉 RecovR System is now running!${NC}"
echo -e "${BLUE}📱 Access the application:${NC}"
echo "  🌐 Frontend: http://localhost:3000"
echo "  🔧 Backend API: http://localhost:8082"
echo "  👤 User Login: http://localhost:3000/auth/signin"
echo "  🛡️  Admin Login: http://localhost:3000/admin/login"
echo ""
echo -e "${YELLOW}📋 Default Admin Credentials:${NC}"
echo "  Username: admin"
echo "  Password: admin123"
echo ""
echo -e "${BLUE}🛑 To stop the services:${NC}"
echo "  ./stop_app.sh"
echo ""
echo -e "${YELLOW}📊 Monitor logs:${NC}"
echo "  Backend: tail -f backend.log"
echo "  Frontend: tail -f frontend.log"