#!/usr/bin/env bash
# BlockMind AI - Linux/macOS One-Click Startup Script

echo "========================================================"
echo "       BlockMind AI - Offline Blockchain Assistant      "
echo "========================================================"
echo ""

# Check Python
if ! command -v python3 &> /dev/null; then
    echo "[ERROR] python3 could not be found. Please install Python 3.9+."
    exit 1
fi

# Check Node
if ! command -v node &> /dev/null; then
    echo "[ERROR] node could not be found. Please install Node.js 18+."
    exit 1
fi

echo "[1/3] Setting up Backend..."
cd backend || exit
if [ ! -d "venv" ]; then
    python3 -m venv venv
fi
source venv/bin/activate
pip install -r requirements.txt
cd ..

echo "[2/3] Setting up Frontend..."
cd frontend || exit
npm install
cd ..

echo "========================================================"
echo "Starting BlockMind AI Services..."
echo "Backend API : http://localhost:8000"
echo "Frontend UI : http://localhost:5173"
echo "========================================================"

# Start backend in background
(cd backend && source venv/bin/activate && python3 app.py) &
BACKEND_PID=$!

# Start frontend in background
(cd frontend && npm run dev) &
FRONTEND_PID=$!

trap "kill $BACKEND_PID $FRONTEND_PID" EXIT

echo "BlockMind AI running! Press Ctrl+C to stop all services."
wait
