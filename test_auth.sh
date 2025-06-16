#!/bin/bash

echo "🧪 Testing RecovR Authentication System..."
echo

# Colors
GREEN='\033[0;32m'
RED='\033[0;31m'
BLUE='\033[0;34m'
NC='\033[0m'

# Test admin login
echo -e "${BLUE}1. Testing admin login...${NC}"
ADMIN_RESPONSE=$(curl -s http://localhost:8082/api/auth/signin \
  -X POST \
  -H "Content-Type: application/json" \
  -d '{"username":"admin","password":"admin123"}')

if echo "$ADMIN_RESPONSE" | grep -q "ROLE_ADMIN"; then
    echo -e "${GREEN}✅ Admin login successful${NC}"
    echo "Admin credentials: admin/admin123"
else
    echo -e "${RED}❌ Admin login failed${NC}"
    echo "Response: $ADMIN_RESPONSE"
fi

echo

# Test frontend access
echo -e "${BLUE}2. Testing frontend access...${NC}"
FRONTEND_RESPONSE=$(curl -s -I http://localhost:3000)

if echo "$FRONTEND_RESPONSE" | grep -q "200 OK"; then
    echo -e "${GREEN}✅ Frontend accessible at http://localhost:3000${NC}"
else
    echo -e "${RED}❌ Frontend not accessible${NC}"
fi

echo

# Test API health
echo -e "${BLUE}3. Testing backend API...${NC}"
API_RESPONSE=$(curl -s http://localhost:8082/api/auth/signin -X POST -H "Content-Type: application/json" -d '{}')

if echo "$API_RESPONSE" | grep -q "Invalid"; then
    echo -e "${GREEN}✅ Backend API responding correctly${NC}"
else
    echo -e "${RED}❌ Backend API issue${NC}"
    echo "Response: $API_RESPONSE"
fi

echo
echo "🎯 Test Summary:"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "📱 Frontend: http://localhost:3000"
echo "🔧 Backend: http://localhost:8082"
echo "👤 Admin Login: http://localhost:3000/auth/signin"
echo "   └─ Username: admin"
echo "   └─ Password: admin123"
echo "🛡️  Admin Dashboard: Visible in navbar after login"
echo "📝 User Registration: http://localhost:3000/auth/register"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"