#!/bin/bash
# install.sh - Install dependencies for the Focus Peaking Visualizer

# Exit on any error
set -e

echo "=========================================================="
echo "  Installing Focus Peaking Visualizer Dependencies"
echo "=========================================================="

# Check if Python is installed
if ! command -v python3 &> /dev/null; then
    echo "Error: Python 3 is required but not installed."
    exit 1
fi

# Check if pip is installed
if ! command -v pip3 &> /dev/null; then
    echo "Error: pip3 is required but not installed."
    exit 1
fi

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    echo "Error: Node.js is required but not installed."
    exit 1
fi

# Check Node.js version
NODE_VERSION=$(node -v | cut -d 'v' -f 2)
NODE_MAJOR_VERSION=$(echo $NODE_VERSION | cut -d '.' -f 1)
if [ "$NODE_MAJOR_VERSION" -lt 20 ]; then
    echo "Error: Node.js v20.10.0 or newer is required. Current version: $NODE_VERSION"
    exit 1
fi

echo "Installing Python dependencies..."
pip3 install --no-cache-dir opencv-python numpy flask flask-cors

echo "Installing Node.js dependencies..."
npm install

echo "Creating necessary directories..."
mkdir -p public/videos

echo "=========================================================="
echo "  Installation complete!"
echo "=========================================================="
echo "You need to place a sample video in the public/videos directory."
echo "Downloaded video should be named 'sample.mp4' in the public/videos directory."
echo ""
echo "Run ./run.sh to start the application."