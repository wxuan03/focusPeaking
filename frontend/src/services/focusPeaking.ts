// src/services/focusPeaking.ts

// Store the last request parameters to avoid unnecessary reprocessing
let lastVideoWidth = 0;
let lastVideoHeight = 0;

/**
 * Process a video frame with camera-like focus peaking effect using outline mode
 * 
 * @param videoElement - The video element to process
 * @param canvasElement - The canvas to draw the focus peaking effect on
 * @param color - Highlight color for the focus peaking
 * @param threshold - Edge detection threshold (lower values = more sensitive)
 * @param enabled - Whether focus peaking is enabled
 * @param intensity - The strength of the outline effect (0.0 to 1.0)
 * @param mode - Always set to 'outline' but kept for API compatibility
 */
export function processFrame(
  videoElement: HTMLVideoElement,
  canvasElement: HTMLCanvasElement,
  color: string = '#FF0000',
  threshold: number = 30,
  enabled: boolean = true,
  intensity: number = 0.8,
  mode: string = 'outline' // Parameter kept for API compatibility
): void {
  // Skip processing if focus peaking is disabled
  if (!enabled) {
    const ctx = canvasElement.getContext('2d');
    if (ctx) {
      ctx.clearRect(0, 0, canvasElement.width, canvasElement.height);
    }
    return;
  }

  // Resize canvas to match video dimensions if needed
  if (canvasElement.width !== videoElement.videoWidth || 
      canvasElement.height !== videoElement.videoHeight) {
    canvasElement.width = videoElement.videoWidth;
    canvasElement.height = videoElement.videoHeight;
  }

  // Get canvas context
  const ctx = canvasElement.getContext('2d');
  if (!ctx) {
    console.error("Failed to get canvas context");
    return;
  }

  // Clear the canvas
  ctx.clearRect(0, 0, canvasElement.width, canvasElement.height);
  
  // Draw the video frame to an off-screen canvas for processing
  const offscreenCanvas = document.createElement('canvas');
  offscreenCanvas.width = canvasElement.width;
  offscreenCanvas.height = canvasElement.height;
  const offscreenCtx = offscreenCanvas.getContext('2d');
  
  if (!offscreenCtx) {
    console.error("Failed to get offscreen canvas context");
    return;
  }
  
  // Draw the video frame to the offscreen canvas
  offscreenCtx.drawImage(videoElement, 0, 0);
  
  // Get image data for processing
  const imageData = offscreenCtx.getImageData(0, 0, offscreenCanvas.width, offscreenCanvas.height);
  const data = imageData.data;
  const width = canvasElement.width;
  const height = canvasElement.height;
  
  // Parse the color
  const colorRgb = hexToRgb(color);
  
  // Step 1: Convert to grayscale for edge detection
  const grayscale = new Uint8Array(width * height);
  for (let y = 0; y < height; y += 1) {
    for (let x = 0; x < width; x += 1) {
      const idx = (y * width + x) * 4;
      grayscale[y * width + x] = Math.round(
        (data[idx] * 0.299 + data[idx + 1] * 0.587 + data[idx + 2] * 0.114)
      );
    }
  }
  
  // Create a new ImageData for the outline only
  const outlineData = new ImageData(width, height);
  const outlinePixels = outlineData.data;
  
  // Apply outline edge detection optimized for focus peaking
  for (let y = 1; y < height - 1; y += 1) {
    for (let x = 1; x < width - 1; x += 1) {
      const centerIdx = y * width + x;
      
      // Apply a simple edge detection kernel (Sobel operator)
      const center = grayscale[centerIdx];
      const top = grayscale[(y-1) * width + x];
      const bottom = grayscale[(y+1) * width + x];
      const left = grayscale[y * width + (x-1)];
      const right = grayscale[y * width + (x+1)];
      
      // Calculate horizontal and vertical gradients
      const gx = Math.abs(right - left);
      const gy = Math.abs(bottom - top);
      
      // Combined gradient magnitude
      const edgeResponse = Math.sqrt(gx*gx + gy*gy);
      
      // Apply threshold with intensity adjustment
      if (edgeResponse > threshold) {
        const outlineIdx = (y * width + x) * 4;
        
        // Calculate alpha based on edge strength and intensity
        const edgeStrength = Math.min(255, (edgeResponse - threshold) * 2);
        const alpha = Math.min(255, edgeStrength * intensity);
        
        // Set pixel color with calculated alpha
        outlinePixels[outlineIdx] = colorRgb.r;     // R
        outlinePixels[outlineIdx + 1] = colorRgb.g; // G
        outlinePixels[outlineIdx + 2] = colorRgb.b; // B
        outlinePixels[outlineIdx + 3] = alpha;      // A
      }
    }
  }
  
  // Draw the outline to the main canvas
  ctx.putImageData(outlineData, 0, 0);
}

/**
 * Convert a hex color string to RGB components
 */
function hexToRgb(hex: string): { r: number, g: number, b: number } {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  return result
    ? {
        r: parseInt(result[1], 16),
        g: parseInt(result[2], 16),
        b: parseInt(result[3], 16)
      }
    : { r: 255, g: 0, b: 0 }; // Default to red if parsing fails
}