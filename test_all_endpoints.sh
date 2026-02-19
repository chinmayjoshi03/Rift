#!/bin/bash

# Comprehensive Endpoint Testing Script
# Tests all endpoints in the fraud detection system

echo "🧪 Testing All Endpoints - Fraud Detection System"
echo "=================================================="
echo ""

# Colors for output
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Counters
TOTAL=0
PASSED=0
FAILED=0

# Function to test endpoint
test_endpoint() {
    local name=$1
    local method=$2
    local url=$3
    local data=$4
    local expected_code=$5
    
    TOTAL=$((TOTAL + 1))
    echo -n "Testing: $name ... "
    
    if [ "$method" == "GET" ]; then
        response=$(curl -s -w "\n%{http_code}" "$url")
    elif [ "$method" == "POST" ] && [ -n "$data" ]; then
        response=$(curl -s -w "\n%{http_code}" -X POST "$url" $data)
    else
        response=$(curl -s -w "\n%{http_code}" -X "$method" "$url")
    fi
    
    http_code=$(echo "$response" | tail -n1)
    body=$(echo "$response" | sed '$d')
    
    if [ "$http_code" == "$expected_code" ]; then
        echo -e "${GREEN}✓ PASS${NC} (HTTP $http_code)"
        PASSED=$((PASSED + 1))
        return 0
    else
        echo -e "${RED}✗ FAIL${NC} (Expected $expected_code, got $http_code)"
        echo "   Response: $(echo $body | head -c 100)..."
        FAILED=$((FAILED + 1))
        return 1
    fi
}

echo "📍 PYTHON SERVICE ENDPOINTS (Port 8000)"
echo "----------------------------------------"

# Python Health Check
test_endpoint "Python Health Check" "GET" "http://localhost:8000/health" "" "200"

# Python Original Detect
test_endpoint "Python /detect (Original)" "POST" "http://localhost:8000/detect" \
    "-F 'file=@sample_transactions.csv'" "200"

# Python Enhanced Detect - Default
test_endpoint "Python /detect/enhanced (Default)" "POST" "http://localhost:8000/detect/enhanced" \
    "-F 'file=@sample_transactions.csv'" "200"

# Python Enhanced Detect - Conservative
test_endpoint "Python /detect/enhanced (Conservative)" "POST" \
    "http://localhost:8000/detect/enhanced?preset=conservative" \
    "-F 'file=@sample_transactions.csv'" "200"

# Python Enhanced Detect - Aggressive
test_endpoint "Python /detect/enhanced (Aggressive)" "POST" \
    "http://localhost:8000/detect/enhanced?preset=aggressive" \
    "-F 'file=@sample_transactions.csv'" "200"

# Python Enhanced Detect - Custom Score
test_endpoint "Python /detect/enhanced (Custom Score)" "POST" \
    "http://localhost:8000/detect/enhanced?min_score=55" \
    "-F 'file=@sample_transactions.csv'" "200"

# Python Enhanced Detect - No Validation
test_endpoint "Python /detect/enhanced (No Validation)" "POST" \
    "http://localhost:8000/detect/enhanced?enable_validation=false" \
    "-F 'file=@sample_transactions.csv'" "200"

# Python Config
test_endpoint "Python /config" "GET" "http://localhost:8000/config" "" "200"

# Python Config Presets - Aggressive
test_endpoint "Python /config/presets/aggressive" "GET" \
    "http://localhost:8000/config/presets/aggressive" "" "200"

# Python Config Presets - Conservative
test_endpoint "Python /config/presets/conservative" "GET" \
    "http://localhost:8000/config/presets/conservative" "" "200"

# Python Config Presets - Balanced
test_endpoint "Python /config/presets/balanced" "GET" \
    "http://localhost:8000/config/presets/balanced" "" "200"

# Python Metrics
test_endpoint "Python /metrics" "GET" "http://localhost:8000/metrics" "" "200"

echo ""
echo "📍 NODE.JS BACKEND ENDPOINTS (Port 3001)"
echo "----------------------------------------"

# Node.js Health Check
test_endpoint "Node.js Health Check" "GET" "http://localhost:3001/api/health" "" "200"

# Node.js Upload and Analyze
echo -n "Testing: Node.js /api/analyze ... "
response=$(curl -s -w "\n%{http_code}" -X POST "http://localhost:3001/api/analyze" \
    -F "file=@sample_transactions.csv")
http_code=$(echo "$response" | tail -n1)
body=$(echo "$response" | sed '$d')

if [ "$http_code" == "200" ]; then
    echo -e "${GREEN}✓ PASS${NC} (HTTP $http_code)"
    PASSED=$((PASSED + 1))
    TOTAL=$((TOTAL + 1))
    
    # Extract jobId for subsequent tests
    JOB_ID=$(echo "$body" | python -c "import sys, json; print(json.load(sys.stdin)['jobId'])" 2>/dev/null)
    
    if [ -n "$JOB_ID" ]; then
        echo "   Job ID: $JOB_ID"
        
        # Wait for processing
        echo -n "   Waiting for analysis to complete (5s) ... "
        sleep 5
        echo "done"
        
        # Test SSE Stream
        test_endpoint "Node.js /api/stream/:jobId" "GET" \
            "http://localhost:3001/api/stream/$JOB_ID" "" "200"
        
        # Test Results
        test_endpoint "Node.js /api/results/:jobId" "GET" \
            "http://localhost:3001/api/results/$JOB_ID" "" "200"
    else
        echo -e "   ${YELLOW}⚠ Warning: Could not extract jobId${NC}"
    fi
else
    echo -e "${RED}✗ FAIL${NC} (Expected 200, got $http_code)"
    FAILED=$((FAILED + 1))
    TOTAL=$((TOTAL + 1))
fi

echo ""
echo "=================================================="
echo "📊 TEST SUMMARY"
echo "=================================================="
echo "Total Tests:  $TOTAL"
echo -e "Passed:       ${GREEN}$PASSED${NC}"
echo -e "Failed:       ${RED}$FAILED${NC}"
echo ""

if [ $FAILED -eq 0 ]; then
    echo -e "${GREEN}✓ All tests passed!${NC}"
    exit 0
else
    echo -e "${RED}✗ Some tests failed${NC}"
    exit 1
fi
