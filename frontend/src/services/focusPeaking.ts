// src/services/focusPeaking.ts

// Create a Web Worker instance for focus peaking processing
let worker: Worker | null = null;

// Store the last request parameters to avoid unnecessary reprocessing
let lastVideoWidth = 0;
let lastVideoHeight = 0;

/**
 * Process a video frame with camera-like focus peaking effect
 * Uses direct processing for reliability with a camera-like dotted pattern
 * 
 * @param videoElement - The video element to process
 * @param canvasElement - The canvas to draw the focus peaking effect on
 * @param color - Highlight color for the focus peaking
 * @param threshold - Edge detection threshold (lower values = more sensitive)
 * @param enabled - Whether focus peaking is enabled
 */
export function processFrame(
  videoElement: HTMLVideoElement,
  canvasElement: HTMLCanvasElement,
  color: string = '#FF0000',
  threshold: number = 30,
  enabled: boolean = true,
  intensity: number = 0.8,
  mode: string = 'highlight'
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

  // Draw the video frame
  ctx.drawImage(videoElement, 0, 0);
  
  // Get image data for processing
  const imageData = ctx.getImageData(0, 0, canvasElement.width, canvasElement.height);
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
  
  // Step 2: Apply edge detection
  // Using simplified algorithm for reliability, but with parameters
  // tuned to match camera focus peaking appearance
  for (let y = 2; y < height - 2; y += 1) {
    for (let x = 2; x < width - 2; x += 1) {
      // Skip some pixels for performance while maintaining dotted pattern
      if ((x + y) % 3 !== 0) continue;
      
      const centerIdx = y * width + x;
      
      // Apply a simple edge detection kernel (approximated Laplacian)
      const center = grayscale[centerIdx] * 4;
      const top = grayscale[(y-1) * width + x];
      const bottom = grayscale[(y+1) * width + x];
      const left = grayscale[y * width + (x-1)];
      const right = grayscale[y * width + (x+1)];
      
      // Calculate edge response - high values indicate sharp edges
      const edgeResponse = Math.abs(center - top - bottom - left - right);
      
      // Apply threshold - higher means less highlighting
      if (edgeResponse > threshold) {
        // Calculate how much above threshold - higher means sharper edge
        const edgeStrength = Math.min(1.0, (edgeResponse - threshold) / 100);
        
        // Use a deterministic pattern to create the dotted/speckled effect
        // based on pixel position and edge strength
        const patternValue = ((x * 12345 + y * 67890) % 100) / 100;
        
        // Only highlight if pattern value is below edge strength
        // This creates a dotted pattern that's denser on sharper edges
        if (patternValue < edgeStrength) {
          const idx = centerIdx * 4;
          data[idx] = colorRgb.r;
          data[idx + 1] = colorRgb.g;
          data[idx + 2] = colorRgb.b;
        }
      }
    }
  }
  
  // Put the image data back
  ctx.putImageData(imageData, 0, 0);
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