#!/bin/bash
# run.sh - Start the Focus Peaking Visualizer in development mode

# Exit on any error
set -e

echo "=========================================================="
echo "  Starting Focus Peaking Visualizer (Development Mode)"
echo "=========================================================="

# Change to frontend directory
cd frontend

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

# Start React development server
echo "Starting React frontend..."
npm run dev &
FRONTEND_PID=$!

# Wait for a moment to let the server start
sleep 3

echo ""
echo "=========================================================="
echo "  Focus Peaking Visualizer is running in Development Mode!"
echo "=========================================================="
echo "Access the application at: http://localhost:8080"
echo ""
echo "Press Ctrl+C to stop the servers."

# Wait for Ctrl+C
trap "kill $FRONTEND_PID; echo 'Shutting down...'; exit 0" INT TERM
wait