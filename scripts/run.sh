#!/bin/bash
# run.sh - Start the Focus Peaking Visualizer in development mode

# Exit on any error
set -e

echo "=========================================================="
echo "  Starting Focus Peaking Visualizer (Development Mode)"
echo "=========================================================="

# Get the directory where this script is located
SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" &> /dev/null && pwd )"
# Navigate to project root (assuming script is in scripts/ directory)
PROJECT_ROOT="$( cd "$SCRIPT_DIR/.." &> /dev/null && pwd )"

# Check if frontend directory exists
if [ ! -d "$PROJECT_ROOT/frontend" ]; then
    echo "Error: frontend directory not found at $PROJECT_ROOT/frontend"
    exit 1
fi

# Change to frontend directory
cd "$PROJECT_ROOT/frontend"

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    echo "Error: Node.js is required but not installed."
    exit 1
fi

# Check if sample video exists
if [ ! -d "public/videos" ]; then
    mkdir -p public/videos
fi

if [ ! -f "public/videos/sample.mp4" ]; then
    echo "Warning: Sample video not found at public/videos/sample.mp4"
    echo "You may need to download it from:"
    echo "https://drive.google.com/file/d/1h0vtWUQvB3bjYyGRKsDpHyVKVpz5jEnJ/view?usp=drive_link"
    echo "and place it in the public/videos directory."
fi

# Check if backend directory exists
if [ ! -d "$PROJECT_ROOT/backend" ]; then
    echo "Warning: Backend directory not found at $PROJECT_ROOT/backend"
    echo "The application may not function correctly without the backend."
fi

# Start Python backend server if it exists
BACKEND_PID=""
if [ -d "$PROJECT_ROOT/backend" ]; then
    echo "Starting Python backend server..."
    cd "$PROJECT_ROOT/backend"
    
    # Check for virtual environment
    if [ -d "venv" ]; then
        echo "Activating virtual environment..."
        source venv/bin/activate
        python server.py &
        BACKEND_PID=$!
        deactivate
    else
        echo "Virtual environment not found, using system Python..."
        python3 server.py &
        BACKEND_PID=$!
    fi
    
    echo "Backend server started."
    
    # Go back to frontend directory
    cd "$PROJECT_ROOT/frontend"
fi

# Start React development server
echo "Starting React frontend..."
npm run dev &
FRONTEND_PID=$!

# Wait for a moment to let the servers start
sleep 3

echo ""
echo "=========================================================="
echo "  Focus Peaking Visualizer is running in Development Mode!"
echo "=========================================================="
echo "Access the application at the URL shown above (likely http://localhost:5173)"
echo ""
echo "Press Ctrl+C to stop the servers."

# Wait for Ctrl+C
if [ -n "$BACKEND_PID" ]; then
    trap "kill $FRONTEND_PID $BACKEND_PID; echo 'Shutting down frontend and backend...'; exit 0" INT TERM
else
    trap "kill $FRONTEND_PID; echo 'Shutting down frontend...'; exit 0" INT TERM
fi
wait