#!/usr/bin/env python3
# server.py - Simple Python server for Focus Peaking Visualizer

import os
import argparse
import logging
import sys
from flask import Flask, send_from_directory
from werkzeug.serving import run_simple

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

# Create Flask app
app = Flask(__name__, static_folder='build')

# Routes
@app.route('/', defaults={'path': ''})
@app.route('/<path:path>')
def serve(path):
    """Serve the static files from the build directory"""
    if path and os.path.exists(os.path.join(app.static_folder, path)):
        return send_from_directory(app.static_folder, path)
    else:
        return send_from_directory(app.static_folder, 'index.html')

def main():
    """Main function to start the server"""
    parser = argparse.ArgumentParser(description='Focus Peaking Visualizer Server')
    parser.add_argument('--host', default='0.0.0.0', help='Host to bind to')
    parser.add_argument('--port', type=int, default=8080, help='Port to listen on')
    parser.add_argument('--debug', action='store_true', help='Enable debug mode')
    
    args = parser.parse_args()
    
    # Check if build directory exists
    if not os.path.exists('build'):
        logger.error("Error: Build directory does not exist.")
        logger.error("Please run 'npm run build' first to build the React app.")
        return 1
    
    # Check if sample video exists
    video_path = os.path.join('public', 'videos', 'sample.mp4')
    if not os.path.exists(video_path):
        logger.warning("Warning: Sample video not found at %s", video_path)
        logger.warning("You may need to download it from the Google Drive link in the README.")
    
    # Log startup message
    logger.info("Starting Focus Peaking Visualizer Server on %s:%d", args.host, args.port)
    
    # Run the server
    try:
        if args.debug:
            app.debug = True
            app.run(host=args.host, port=args.port, debug=True)
        else:
            run_simple(args.host, args.port, app, threaded=True)
    except Exception as e:
        logger.error("Error starting server: %s", str(e))
        return 1
    
    return 0

if __name__ == '__main__':
    sys.exit(main())