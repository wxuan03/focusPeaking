#!/usr/bin/env python3
# validate_video.py - Validates video files and optionally pre-processes them with focus peaking

import os
import sys
import argparse
import cv2
import numpy as np
import shutil
import logging
from datetime import datetime

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(levelname)s - %(message)s',
    handlers=[
        logging.StreamHandler(),
        logging.FileHandler('video_processor.log')
    ]
)
logger = logging.getLogger(__name__)

def validate_video(video_path):
    """
    Validate that the video file exists and can be opened
    
    Args:
        video_path: Path to the video file
        
    Returns:
        dict: Video information if valid, None if invalid
    """
    if not os.path.exists(video_path):
        logger.error(f"Error: Video file does not exist: {video_path}")
        return None
    
    try:
        # Attempt to open the video file
        cap = cv2.VideoCapture(video_path)
        if not cap.isOpened():
            logger.error(f"Error: Could not open video file: {video_path}")
            return None
        
        # Get video information
        width = int(cap.get(cv2.CAP_PROP_FRAME_WIDTH))
        height = int(cap.get(cv2.CAP_PROP_FRAME_HEIGHT))
        fps = cap.get(cv2.CAP_PROP_FPS)
        frame_count = int(cap.get(cv2.CAP_PROP_FRAME_COUNT))
        duration = frame_count / fps if fps > 0 else 0
        
        # Check for reasonable dimensions
        if width <= 0 or height <= 0:
            logger.error(f"Error: Invalid video dimensions: {width}x{height}")
            cap.release()
            return None
        
        # Check if we can read at least one frame
        ret, frame = cap.read()
        if not ret:
            logger.error("Error: Could not read any frames from the video")
            cap.release()
            return None
            
        # Release resources
        cap.release()
        
        return {
            'width': width,
            'height': height,
            'fps': fps,
            'frame_count': frame_count,
            'duration': duration
        }
    except Exception as e:
        logger.error(f"Error validating video: {str(e)}")
        return None

def copy_video_to_public(src_path, public_dir):
    """
    Copy the video file to the public directory
    
    Args:
        src_path: Source video path
        public_dir: Public directory to copy to
        
    Returns:
        str: Path to the copied video file
    """
    # Ensure public videos directory exists
    videos_dir = os.path.join(public_dir, 'videos')
    os.makedirs(videos_dir, exist_ok=True)
    
    # Destination path
    dest_path = os.path.join(videos_dir, 'sample.mp4')
    
    try:
        # Copy the file
        shutil.copyfile(src_path, dest_path)
        logger.info(f"Video copied to {dest_path}")
        return dest_path
    except Exception as e:
        logger.error(f"Error copying video: {str(e)}")
        return None

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
    Apply focus peaking to a video frame using Sobel edge detection
    
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
        overlay[mask > 0] = color
        
        # Blend the original frame and the overlay
        result = cv2.addWeighted(frame, 1, overlay, 0.7, 0)
        
        return result
    except Exception as e:
        logger.error(f"Error in focus peaking: {str(e)}")
        return frame

def preprocess_video(input_path, output_path, threshold=30, color='#FF0000'):
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
            result = apply_focus_peaking(frame, threshold, bgr_color)
            
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

def main():
    parser = argparse.ArgumentParser(description='Video validator and preprocessor for Focus Peaking Visualizer')
    parser.add_argument('input', help='Input video file path')
    parser.add_argument('--validate-only', action='store_true', help='Only validate the video, do not process or copy it')
    parser.add_argument('--preprocess', action='store_true', help='Pre-process the video with focus peaking')
    parser.add_argument('--threshold', type=int, default=30, help='Edge detection threshold (5-50, lower=more sensitive)')
    parser.add_argument('--color', default='#FF0000', help='Highlight color in hex format (#RRGGBB)')
    parser.add_argument('--public-dir', default='./public', help='Public directory path')
    
    args = parser.parse_args()
    
    # Validate the video
    logger.info(f"Validating video: {args.input}")
    video_info = validate_video(args.input)
    
    if not video_info:
        logger.error("Video validation failed")
        return 1
    
    logger.info(f"Video validated successfully: {video_info['width']}x{video_info['height']}, "
                f"{video_info['fps']:.2f} FPS, {video_info['duration']:.2f} seconds")
    
    if args.validate_only:
        return 0
    
    # Copy the video to the public directory
    copy_result = copy_video_to_public(args.input, args.public_dir)
    if not copy_result:
        logger.error("Failed to copy video to public directory")
        return 1
    
    # Pre-process the video if requested
    if args.preprocess:
        timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
        output_path = os.path.join(args.public_dir, 'videos', f'sample_processed_{timestamp}.mp4')
        
        logger.info(f"Pre-processing video with focus peaking (threshold={args.threshold}, color={args.color})")
        preprocess_result = preprocess_video(args.input, output_path, args.threshold, args.color)
        
        if not preprocess_result:
            logger.error("Video pre-processing failed")
            return 1
        
        logger.info(f"Video pre-processed successfully: {output_path}")
    
    return 0

if __name__ == "__main__":
    sys.exit(main())