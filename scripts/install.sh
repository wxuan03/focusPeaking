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

echo "Setting up Python virtual environment for the backend..."

# Get the directory where this script is located
SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" &> /dev/null && pwd )"
# Navigate to project root (assuming script is in scripts/ directory)
PROJECT_ROOT="$( cd "$SCRIPT_DIR/.." &> /dev/null && pwd )"

# Check if backend directory exists
if [ -d "$PROJECT_ROOT/backend" ]; then
    echo "Backend directory found. Creating virtual environment..."
    
    # Create a virtual environment in the backend directory
    python3 -m venv "$PROJECT_ROOT/backend/venv"
    
    # Activate the virtual environment
    source "$PROJECT_ROOT/backend/venv/bin/activate"
    
    # Install Python dependencies in the virtual environment
    echo "Installing Python dependencies in virtual environment..."
    pip install --upgrade pip
    pip install opencv-python numpy flask flask-cors
    
    # Deactivate the virtual environment
    deactivate
    
    echo "Python virtual environment setup complete."
    echo "To activate the environment, run: source backend/venv/bin/activate"
else
    echo "Error: Backend directory not found at $PROJECT_ROOT/backend"
    echo "Please check the project structure."
    exit 1
fi

# Get the directory where this script is located
SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" &> /dev/null && pwd )"
# Navigate to project root (assuming script is in scripts/ directory)
PROJECT_ROOT="$( cd "$SCRIPT_DIR/.." &> /dev/null && pwd )"

# Check if frontend directory exists
if [ -d "$PROJECT_ROOT/frontend" ]; then
    echo "Installing Node.js dependencies in frontend directory..."
    cd "$PROJECT_ROOT/frontend"
    npm install
else
    echo "Error: frontend directory not found at $PROJECT_ROOT/frontend"
    echo "Please check the project structure."
    exit 1
fi

echo "Creating necessary directories..."
mkdir -p "$PROJECT_ROOT/frontend/public/videos"

echo "=========================================================="
echo "  Installation complete!"
echo "=========================================================="
echo "You need to place a sample video in the frontend/public/videos directory."
echo "Downloaded video should be named 'sample.mp4' in the frontend/public/videos directory."
echo ""
echo "Run ./scripts/run.sh to start the application."