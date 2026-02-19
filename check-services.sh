#!/bin/bash

echo "🔍 Checking Services Status..."
echo ""

# Check Python service
echo -n "Python Model (port 8000): "
if curl -s http://localhost:8000/health > /dev/null 2>&1; then
    echo "✅ Running"
else
    echo "❌ Not running"
    echo "   Start with: cd python-model && python3 main.py"
fi

# Check Backend service
echo -n "Node.js Backend (port 3001): "
if curl -s http://localhost:3001/api/health > /dev/null 2>&1; then
    echo "✅ Running"
else
    echo "❌ Not running"
    echo "   Start with: cd backend && npm start"
fi

# Check Frontend service
echo -n "React Frontend (port 5173): "
if curl -s http://localhost:5173 > /dev/null 2>&1; then
    echo "✅ Running"
else
    echo "❌ Not running"
    echo "   Start with: cd frontend && npm run dev"
fi

echo ""
echo "💡 To start all services at once, run: ./start-all.sh"
