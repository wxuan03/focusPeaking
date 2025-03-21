#!/bin/bash
# build.sh - Build the Focus Peaking Visualizer for production

# Exit on any error
set -e

echo "=========================================================="
echo "  Building Focus Peaking Visualizer for Production"
echo "=========================================================="

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

# Check if npm is installed
if ! command -v npm &> /dev/null; then
    echo "Error: npm is required but not installed."
    exit 1
fi

# Check if Python is installed
if ! command -v python3 &> /dev/null; then
    echo "Error: Python 3 is required but not installed."
    exit 1
fi

# Check for required Python packages
echo "Checking Python dependencies..."
python3 -c "import cv2, numpy, flask" 2>/dev/null || {
    echo "Error: Required Python packages not found."
    echo "Please run './install.sh' to install dependencies."
    exit 1
}

# Build React app
echo "Building React application..."
npm run build

# Copy public files to build directory if needed
echo "Copying public files to build directory..."
if [ -d "public/videos" ]; then
    mkdir -p build/videos
    cp -r public/videos/* build/videos/ 2>/dev/null || echo "No video files to copy."
fi

# Create necessary directories
echo "Creating necessary directories..."
mkdir -p build/videos

# Check if sample video exists
if [ ! -f "public/videos/sample.mp4" ] && [ ! -f "build/videos/sample.mp4" ]; then
    echo "Warning: Sample video not found."
    echo "You need to download the sample video from:"
    echo "https://drive.google.com/file/d/1h0vtWUQvB3bjYyGRKsDpHyVKVpz5jEnJ/view?usp=drive_link"
    echo "and place it in the public/videos or build/videos directory as 'sample.mp4'."
fi

# Create a production run script
cat > run_prod.sh << 'EOL'
#!/bin/bash
# Start the Focus Peaking Visualizer in production mode

echo "Starting Focus Peaking Visualizer server..."
python3 server.py "$@"
EOL

chmod +x run_prod.sh

echo "=========================================================="
echo "  Build complete!"
echo "=========================================================="
echo "Run './run_prod.sh' to start the production server."
echo "You can access the application at: http://localhost:8080"