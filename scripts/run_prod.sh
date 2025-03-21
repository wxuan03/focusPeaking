#!/bin/bash
# run_prod.sh - Start the Focus Peaking Visualizer in production mode

# Exit on any error
set -e

echo "=========================================================="
echo "  Starting Focus Peaking Visualizer (Production Mode)"
echo "=========================================================="

# Check if Python is installed
if ! command -v python3 &> /dev/null; then
    echo "Error: Python 3 is required but not installed."
    exit 1
fi

# Check if build directory exists
if [ ! -d "frontend/build" ]; then
    echo "Error: Build directory does not exist."
    echo "Please run './scripts/build.sh' first to build the application."
    exit 1
fi

# Change to backend directory
cd backend

# Check if sample video exists
if [ ! -d "../frontend/build/videos" ]; then
    mkdir -p "../frontend/build/videos"
fi

if [ ! -f "../frontend/build/videos/sample.mp4" ]; then
    echo "Warning: Sample video not found at ../frontend/build/videos/sample.mp4"
    echo "You may need to download it from:"
    echo "https://drive.google.com/file/d/1h0vtWUQvB3bjYyGRKsDpHyVKVpz5jEnJ/view?usp=drive_link"
    echo "and place it in the frontend/build/videos directory."
fi

# Start the server
echo "Starting production server..."
python3 server.py --host 0.0.0.0 --port 8080 $@

echo ""
echo "=========================================================="
echo "  Server stopped."
echo "=========================================================="