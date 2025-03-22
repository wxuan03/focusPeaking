# app.py
from flask import Flask, Response, render_template, request
from flask_cors import CORS
import cv2
import numpy as np
import base64
import logging

app = Flask(__name__, static_folder='../build', static_url_path='/')
CORS(app)  # Enable CORS for all routes

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

def apply_focus_peaking(frame, threshold=30, color=(0, 0, 255)):
    """
    Apply focus peaking to a video frame - mimicking camera focus peaking
    
    Args:
        frame: Input video frame
        threshold: Edge detection threshold (lower values detect more edges)
        color: RGB tuple for the highlight color
        
    Returns:
        Frame with focus peaking applied
    """
    try:
        # Convert to grayscale for edge detection
        gray = cv2.cvtColor(frame, cv2.COLOR_BGR2GRAY)
        
        # Apply Gaussian blur to reduce noise
        blurred = cv2.GaussianBlur(gray, (5, 5), 0)
        
        # Use Laplacian operator to detect areas of rapid intensity change
        # This is better for focus peaking as it detects areas of high frequency detail
        laplacian = cv2.Laplacian(blurred, cv2.CV_64F, ksize=3)
        
        # Get absolute values to capture both dark-to-light and light-to-dark edges
        laplacian_abs = np.absolute(laplacian)
        
        # Convert to 8-bit
        laplacian_norm = cv2.normalize(laplacian_abs, None, 0, 255, cv2.NORM_MINMAX, cv2.CV_8U)
        
        # Apply threshold to get only the sharpest edges (in-focus areas)
        _, edges = cv2.threshold(laplacian_norm, threshold, 255, cv2.THRESH_BINARY)
        
        # Optional: thin the edges for cleaner outlines
        kernel = np.ones((2, 2), np.uint8)
        edges = cv2.morphologyEx(edges, cv2.MORPH_OPEN, kernel)
        
        # Create a blank image for the overlay
        overlay = np.zeros_like(frame)
        
        # Set the color only for edge pixels
        b, g, r = color
        overlay[edges > 0] = [b, g, r]
        
        # Blend the original frame and the overlay
        # Using lower alpha for more subtle highlighting like real cameras
        result = cv2.addWeighted(frame, 1, overlay, 0.8, 0)
        
        return result
    except Exception as e:
        logger.error(f"Error in focus peaking: {str(e)}")
        return frame

@app.route('/')
def index():
    return app.send_static_file('index.html')

@app.route('/api/process_frame', methods=['POST'])
def process_frame():
    """
    API endpoint to process a single video frame
    """
    try:
        # Get parameters from request
        data = request.json
        frame_data = data.get('frame')
        threshold = int(data.get('threshold', 30))
        color_hex = data.get('color', '#FF0000').lstrip('#')
        
        # Convert hex color to RGB
        color = tuple(int(color_hex[i:i+2], 16) for i in (4, 2, 0))  # BGR format for OpenCV
        
        # Decode base64 image
        frame_data = frame_data.split(',')[1]
        frame_bytes = base64.b64decode(frame_data)
        np_arr = np.frombuffer(frame_bytes, np.uint8)
        frame = cv2.imdecode(np_arr, cv2.IMREAD_COLOR)
        
        # Apply focus peaking
        result = apply_focus_peaking(frame, threshold, color)
        
        # Encode the result as base64
        _, buffer = cv2.imencode('.jpg', result)
        result_base64 = base64.b64encode(buffer).decode('utf-8')
        
        return {'result': f'data:image/jpeg;base64,{result_base64}'}
    except Exception as e:
        logger.error(f"Error processing frame: {str(e)}")
        return {'error': str(e)}, 500

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5001, debug=False)