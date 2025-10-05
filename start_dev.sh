#!/bin/bash

# Space Debris Analyzer Development Server
# Runs both frontend and backend simultaneously

echo "🚀 Starting Space Debris Analyzer Development Environment..."

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to kill background processes on exit
cleanup() {
    echo -e "\n${YELLOW}🛑 Shutting down servers...${NC}"
    if [ ! -z "$BACKEND_PID" ]; then
        kill $BACKEND_PID 2>/dev/null
        echo -e "${GREEN}✅ Backend server stopped${NC}"
    fi
    if [ ! -z "$FRONTEND_PID" ]; then
        kill $FRONTEND_PID 2>/dev/null
        echo -e "${GREEN}✅ Frontend server stopped${NC}"
    fi
    exit 0
}

# Set up signal handlers
trap cleanup SIGINT SIGTERM

# Check if virtual environment exists
if [ ! -d "venv" ]; then
    echo -e "${YELLOW}⚠️  Virtual environment not found. Creating one...${NC}"
    python3 -m venv venv
fi

# Activate virtual environment
echo -e "${BLUE}🔧 Activating Python virtual environment...${NC}"
source venv/bin/activate

# Install Python dependencies
echo -e "${BLUE}📦 Installing Python dependencies...${NC}"
pip install -r backend/requirements.txt

# Check if Node modules exist
if [ ! -d "public/node_modules" ]; then
    echo -e "${YELLOW}⚠️  Node modules not found. Installing...${NC}"
    cd public
    npm install
    cd ..
fi

# Create uploads directory if it doesn't exist
mkdir -p backend/uploads

echo -e "${GREEN}🎯 Starting servers...${NC}"
echo -e "${BLUE}Backend: http://localhost:5001${NC}"
echo -e "${BLUE}Frontend: http://localhost:3000${NC}"
echo -e "${YELLOW}Press Ctrl+C to stop both servers${NC}"
echo ""

# Start backend server
echo -e "${GREEN}🐍 Starting Flask backend server...${NC}"
cd backend
python app.py &
BACKEND_PID=$!
cd ..

# Wait a moment for backend to start
sleep 2

# Start frontend server
echo -e "${GREEN}⚛️  Starting React frontend server...${NC}"
cd public
npm start &
FRONTEND_PID=$!
cd ..

# Wait for both servers to start
sleep 3

echo -e "${GREEN}✅ Both servers are running!${NC}"
echo -e "${BLUE}📱 Frontend: http://localhost:3000${NC}"
echo -e "${BLUE}🔧 Backend API: http://localhost:5001${NC}"
echo -e "${YELLOW}💡 The frontend will automatically proxy API calls to the backend${NC}"
echo ""

# Keep script running and show status
while true; do
    # Check if processes are still running
    if ! kill -0 $BACKEND_PID 2>/dev/null; then
        echo -e "${RED}❌ Backend server stopped unexpectedly${NC}"
        cleanup
    fi
    if ! kill -0 $FRONTEND_PID 2>/dev/null; then
        echo -e "${RED}❌ Frontend server stopped unexpectedly${NC}"
        cleanup
    fi
    sleep 5
done
