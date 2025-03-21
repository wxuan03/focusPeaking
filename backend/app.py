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
    Apply focus peaking to a video frame
    
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
        
        # Use Sobel operator for edge detection
        grad_x = cv2.Sobel(blurred, cv2.CV_64F, 1, 0, ksize=3)
        grad_y = cv2.Sobel(blurred, cv2.CV_64F, 0, 1, ksize=3)
        
        # Calculate gradient magnitude
        magnitude = np.sqrt(grad_x**2 + grad_y**2)
        
        # Normalize and scale to 0-255
        magnitude = cv2.normalize(magnitude, None, 0, 255, cv2.NORM_MINMAX, cv2.CV_8UC1)
        
        # Create a mask where magnitude exceeds threshold
        _, mask = cv2.threshold(magnitude, threshold, 255, cv2.THRESH_BINARY)
        
        # Create a blank image for the overlay
        overlay = np.zeros_like(frame)
        
        # Set the color for focus areas
        b, g, r = color
        overlay[mask > 0] = [b, g, r]
        
        # Blend the original frame and the overlay
        result = cv2.addWeighted(frame, 1, overlay, 0.7, 0)
        
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
    app.run(host='0.0.0.0', port=5000, debug=False)