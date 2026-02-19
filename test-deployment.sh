#!/bin/bash

# Deployment Testing Script
# Tests all deployed services to verify they're working correctly

echo "🧪 Testing FinTrace Deployment"
echo "================================"
echo ""

# Colors for output
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Service URLs
BACKEND_URL="https://fraud-detection-backend-pvxj.onrender.com"
FRONTEND_URL="https://fintrace-eight.vercel.app"

# Test 1: Backend Health Check
echo "1️⃣  Testing Backend Health..."
BACKEND_HEALTH=$(curl -s -o /dev/null -w "%{http_code}" "${BACKEND_URL}/api/health" 2>&1)

if [ "$BACKEND_HEALTH" = "200" ]; then
    echo -e "${GREEN}✅ Backend is healthy (HTTP 200)${NC}"
else
    echo -e "${RED}❌ Backend is down (HTTP ${BACKEND_HEALTH})${NC}"
    echo -e "${YELLOW}   Check Render dashboard and logs${NC}"
fi
echo ""

# Test 2: Backend CORS Configuration
echo "2️⃣  Testing CORS Configuration..."
CORS_TEST=$(curl -s -H "Origin: ${FRONTEND_URL}" \
     -H "Access-Control-Request-Method: POST" \
     -H "Access-Control-Request-Headers: Content-Type" \
     -X OPTIONS \
     -w "%{http_code}" \
     -o /dev/null \
     "${BACKEND_URL}/api/analyze" 2>&1)

if [ "$CORS_TEST" = "204" ] || [ "$CORS_TEST" = "200" ]; then
    echo -e "${GREEN}✅ CORS is configured correctly${NC}"
else
    echo -e "${RED}❌ CORS configuration issue (HTTP ${CORS_TEST})${NC}"
    echo -e "${YELLOW}   Backend may not allow frontend origin${NC}"
fi
echo ""

# Test 3: Config Endpoint
echo "3️⃣  Testing Config Endpoint..."
CONFIG_TEST=$(curl -s -o /dev/null -w "%{http_code}" "${BACKEND_URL}/api/config" 2>&1)

if [ "$CONFIG_TEST" = "200" ]; then
    echo -e "${GREEN}✅ Config endpoint working${NC}"
else
    echo -e "${RED}❌ Config endpoint failed (HTTP ${CONFIG_TEST})${NC}"
fi
echo ""

# Test 4: Frontend Accessibility
echo "4️⃣  Testing Frontend..."
FRONTEND_TEST=$(curl -s -o /dev/null -w "%{http_code}" "${FRONTEND_URL}" 2>&1)

if [ "$FRONTEND_TEST" = "200" ]; then
    echo -e "${GREEN}✅ Frontend is accessible${NC}"
else
    echo -e "${RED}❌ Frontend is down (HTTP ${FRONTEND_TEST})${NC}"
fi
echo ""

# Summary
echo "================================"
echo "📊 Test Summary"
echo "================================"

if [ "$BACKEND_HEALTH" = "200" ] && [ "$FRONTEND_TEST" = "200" ]; then
    echo -e "${GREEN}✅ All critical services are operational${NC}"
    echo ""
    echo "🌐 Access your app at: ${FRONTEND_URL}"
else
    echo -e "${RED}❌ Some services are not working${NC}"
    echo ""
    echo "📝 Next Steps:"
    echo "   1. Check Render dashboard for backend logs"
    echo "   2. Verify environment variables are set"
    echo "   3. Ensure services are not sleeping (free tier)"
    echo "   4. Review DEPLOYMENT_STATUS.md for detailed fixes"
fi
echo ""
