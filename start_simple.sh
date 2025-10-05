#!/bin/bash

# Simple development server startup
# Run this in two separate terminals

echo "🚀 Space Debris Analyzer Development Setup"
echo ""
echo "📋 To run both frontend and backend:"
echo ""
echo "Terminal 1 (Backend):"
echo "  cd backend"
echo "  python app.py"
echo ""
echo "Terminal 2 (Frontend):"
echo "  cd public"
echo "  npm start"
echo ""
echo "🌐 URLs:"
echo "  Frontend: http://localhost:3000"
echo "  Backend:  http://localhost:5001"
echo ""
echo "💡 The frontend automatically proxies API calls to the backend"
echo ""

# Check if we're in the right directory
if [ ! -f "backend/app.py" ] || [ ! -f "public/package.json" ]; then
    echo "❌ Please run this script from the project root directory"
    exit 1
fi

# Check Python virtual environment
if [ ! -d "venv" ]; then
    echo "⚠️  Virtual environment not found. Creating one..."
    python3 -m venv venv
    source venv/bin/activate
    pip install -r backend/requirements.txt
    echo "✅ Virtual environment created and dependencies installed"
else
    echo "✅ Virtual environment found"
fi

# Check Node modules
if [ ! -d "public/node_modules" ]; then
    echo "⚠️  Node modules not found. Installing..."
    cd public
    npm install
    cd ..
    echo "✅ Node modules installed"
else
    echo "✅ Node modules found"
fi

echo ""
echo "🎯 Ready to start! Use the commands above in separate terminals."
