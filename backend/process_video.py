import cv2
import numpy as np
import os
import sys
import argparse
import logging

# Configure logging
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

def hex_to_bgr(hex_color):
    """Convert hex color string to BGR tuple for OpenCV"""
    hex_color = hex_color.lstrip('#')
    # Convert to BGR (OpenCV uses BGR, not RGB)
    return (
        int(hex_color[4:6], 16),  # Blue
        int(hex_color[2:4], 16),  # Green
        int(hex_color[0:2], 16)   # Red
    )

def apply_focus_peaking(frame, threshold=30, color=(0, 0, 255)):
    """
    Apply focus peaking to a video frame - mimicking camera focus peaking
    
    Args:
        frame: Input video frame
        threshold: Edge detection threshold (lower values detect more edges)
        color: BGR tuple for the highlight color
        
    Returns:
        Frame with focus peaking overlay
    """
    try:
        # Convert to grayscale for edge detection
        gray = cv2.cvtColor(frame, cv2.COLOR_BGR2GRAY)
        
        # Apply Gaussian blur to reduce noise
        blurred = cv2.GaussianBlur(gray, (5, 5), 0)
        
        # Use Laplacian for edge detection
        # Laplacian detects areas of rapid intensity change which correlates well with areas in focus
        laplacian = cv2.Laplacian(blurred, cv2.CV_64F, ksize=3)
        
        # Get absolute values to detect both rising and falling edges
        laplacian_abs = np.absolute(laplacian)
        
        # Normalize to 0-255 range
        laplacian_norm = cv2.normalize(laplacian_abs, None, 0, 255, cv2.NORM_MINMAX, cv2.CV_8U)
        
        # Apply threshold to isolate the highest frequency details (sharpest edges)
        _, edges = cv2.threshold(laplacian_norm, threshold, 255, cv2.THRESH_BINARY)
        
        # Create a blank image for the overlay
        overlay = np.zeros_like(frame)
        
        # Set the color only for edge pixels
        overlay[edges > 0] = color
        
        # Blend the original frame and the overlay
        # Using addWeighted with alpha value similar to camera implementations
        result = cv2.addWeighted(frame, 1, overlay, 0.8, 0)
        
        return result
    except Exception as e:
        logger.error(f"Error in focus peaking: {str(e)}")
        return frame

def process_video(input_path, output_path, threshold=30, color='#FF0000'):
    """
    Process video with focus peaking and save the result
    
    Args:
        input_path: Path to input video
        output_path: Path to save output video with focus peaking
        threshold: Edge detection threshold
        color: Hex color code for focus peaking
    """
    try:
        # Convert hex color to BGR
        bgr_color = hex_to_bgr(color)
        
        # Open input video
        cap = cv2.VideoCapture(input_path)
        if not cap.isOpened():
            logger.error(f"Error: Could not open video file {input_path}")
            return False
        
        # Get video properties
        width = int(cap.get(cv2.CAP_PROP_FRAME_WIDTH))
        height = int(cap.get(cv2.CAP_PROP_FRAME_HEIGHT))
        fps = cap.get(cv2.CAP_PROP_FPS)
        frame_count = int(cap.get(cv2.CAP_PROP_FRAME_COUNT))
        
        logger.info(f"Processing video: {width}x{height} at {fps} FPS, {frame_count} frames")
        
        # Create output video writer
        fourcc = cv2.VideoWriter_fourcc(*'mp4v')
        out = cv2.VideoWriter(output_path, fourcc, fps, (width, height))
        
        # Process each frame
        frame_idx = 0
        while cap.isOpened():
            ret, frame = cap.read()
            if not ret:
                break
                
            # Apply focus peaking
            overlay = apply_focus_peaking(frame, threshold, bgr_color)
            
            # Blend original frame with overlay
            result = cv2.addWeighted(frame, 1, overlay, 0.7, 0)
            
            # Write frame to output video
            out.write(result)
            
            # Log progress every 100 frames
            frame_idx += 1
            if frame_idx % 100 == 0:
                logger.info(f"Processed {frame_idx}/{frame_count} frames ({frame_idx/frame_count*100:.1f}%)")
        
        # Release resources
        cap.release()
        out.release()
        
        logger.info(f"Video processing complete. Output saved to {output_path}")
        return True
    except Exception as e:
        logger.error(f"Error processing video: {str(e)}")
        return False

if __name__ == "__main__":
    parser = argparse.ArgumentParser(description='Apply focus peaking to a video')
    parser.add_argument('input', help='Input video file path')
    parser.add_argument('--output', help='Output video file path (defaults to input_focuspeaking.mp4)')
    parser.add_argument('--threshold', type=int, default=30, help='Edge detection threshold (5-50, lower=more sensitive)')
    parser.add_argument('--color', default='#FF0000', help='Highlight color in hex format (#RRGGBB)')
    
    args = parser.parse_args()
    
    # Set default output path if not specified
    if not args.output:
        base_name = os.path.splitext(args.input)[0]
        args.output = f"{base_name}_focuspeaking.mp4"
    
    # Process video
    success = process_video(args.input, args.output, args.threshold, args.color)
    
    if success:
        sys.exit(0)
    else:
        sys.exit(1)