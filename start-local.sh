#!/bin/bash

echo "🚀 Starting Fraud Detection System Locally"
echo ""

# Check if Python is installed
if ! command -v python &> /dev/null; then
    echo "❌ Python is not installed"
    exit 1
fi

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    echo "❌ Node.js is not installed"
    exit 1
fi

echo "📦 Installing dependencies..."
echo ""

# Install Python dependencies
echo "Installing Python dependencies..."
cd python-model
pip install -r requirements.txt
cd ..

# Install Node.js dependencies
echo "Installing Node.js dependencies..."
cd backend
npm install
cd ..

echo ""
echo "✅ Dependencies installed"
echo ""
echo "🐍 Starting Python Model Service on port 8000..."

# Start Python service in background
cd python-model
python main.py &
PYTHON_PID=$!
cd ..

# Wait for Python service to start
sleep 3

echo "🟢 Python service started (PID: $PYTHON_PID)"
echo ""
echo "📡 Starting Node.js Backend on port 3001..."

# Start Node.js service
cd backend
PORT=3001 PYTHON_SERVICE_URL=http://localhost:8000 node src/server.js &
NODE_PID=$!
cd ..

# Wait for Node.js service to start
sleep 2

echo "🟢 Node.js backend started (PID: $NODE_PID)"
echo ""
echo "✅ All services running!"
echo ""
echo "📊 Health checks:"
echo "   Python:  http://localhost:8000/health"
echo "   Node.js: http://localhost:3001/api/health"
echo ""
echo "🧪 Test with sample CSV:"
echo "   curl -X POST http://localhost:3001/api/analyze -F \"file=@sample_transactions.csv\""
echo ""
echo "Press Ctrl+C to stop all services"
echo ""

# Wait for Ctrl+C
trap "echo ''; echo '🛑 Stopping services...'; kill $PYTHON_PID $NODE_PID; exit" INT
wait
