#!/bin/bash

echo "🛑 Stopping RecovR Lost & Found System..."

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to stop a service by PID file
stop_service() {
    local service_name=$1
    local pid_file=$2
    
    if [ -f "$pid_file" ]; then
        local pid=$(cat "$pid_file")
        if ps -p $pid > /dev/null 2>&1; then
            echo -e "${BLUE}🛑 Stopping $service_name (PID: $pid)...${NC}"
            kill $pid
            sleep 3
            
            # Force kill if still running
            if ps -p $pid > /dev/null 2>&1; then
                echo -e "${YELLOW}⚠️  Force killing $service_name...${NC}"
                kill -9 $pid
            fi
            
            echo -e "${GREEN}✅ $service_name stopped${NC}"
        else
            echo -e "${YELLOW}⚠️  $service_name was not running${NC}"
        fi
        rm -f "$pid_file"
    else
        echo -e "${YELLOW}⚠️  No PID file found for $service_name${NC}"
    fi
}

# Stop services
stop_service "Frontend" "frontend.pid"
stop_service "Backend" "backend.pid"

# Also kill any remaining processes on the ports
echo -e "${BLUE}🧹 Cleaning up any remaining processes...${NC}"

# Kill processes on port 3000 (Next.js)
lsof -ti:3000 | xargs -r kill -9 2>/dev/null && echo -e "${GREEN}✅ Cleaned port 3000${NC}"

# Kill processes on port 8082 (Spring Boot)  
lsof -ti:8082 | xargs -r kill -9 2>/dev/null && echo -e "${GREEN}✅ Cleaned port 8082${NC}"

# Clean up log files
echo -e "${BLUE}🧹 Cleaning up log files...${NC}"
rm -f backend.log frontend.log

echo -e "${GREEN}🎉 RecovR system stopped successfully!${NC}"