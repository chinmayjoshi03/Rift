#!/bin/bash

# Start all services for Fraud Detection System
# This script starts Python model, Node.js backend, and React frontend

echo "🚀 Starting Fraud Detection System..."
echo ""

# Check if required commands exist
command -v python3 >/dev/null 2>&1 || { echo "❌ Python3 is required but not installed."; exit 1; }
command -v node >/dev/null 2>&1 || { echo "❌ Node.js is required but not installed."; exit 1; }

# Function to cleanup on exit
cleanup() {
    echo ""
    echo "🛑 Stopping all services..."
    kill $(jobs -p) 2>/dev/null
    exit
}

trap cleanup SIGINT SIGTERM

# Start Python model service
echo "📊 Starting Python Model Service (port 8000)..."
cd python-model
python3 main.py &
PYTHON_PID=$!
cd ..

# Wait for Python service to start
sleep 3

# Start Node.js backend
echo "🔧 Starting Node.js Backend (port 3001)..."
cd backend
npm start &
BACKEND_PID=$!
cd ..

# Wait for backend to start
sleep 2

# Start React frontend
echo "⚛️  Starting React Frontend (port 5173)..."
cd frontend
npm run dev &
FRONTEND_PID=$!
cd ..

echo ""
echo "✅ All services started successfully!"
echo ""
echo "📍 Service URLs:"
echo "   - Frontend:  http://localhost:5173"
echo "   - Backend:   http://localhost:3001"
echo "   - Python:    http://localhost:8000"
echo ""
echo "Press Ctrl+C to stop all services"
echo ""

# Wait for all background processes
wait
