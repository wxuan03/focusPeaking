// src/services/focusPeaking.ts

// Create a Web Worker instance for focus peaking processing
let worker: Worker | null = null;

// Store the last request parameters to avoid unnecessary reprocessing
let lastVideoWidth = 0;
let lastVideoHeight = 0;

/**
 * Process a video frame with focus peaking effect
 * This function captures a frame from the video, processes it with edge detection,
 * and draws the result on the canvas
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
  color: string = '#FF4A4A',
  threshold: number = 30,
  enabled: boolean = true
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
  const ctx = canvasElement.getContext('2d', { willReadFrequently: true });
  if (!ctx) return;

  // Check if we need to initialize or recreate the worker
  if (!worker) {
    try {
      // Create the web worker
      const workerBlob = new Blob(
        [
          // Include the worker code directly to make it work in all environments
          `self.onmessage = function(e) {
            const { imageData, threshold, color } = e.data;
            const result = applyFocusPeaking(imageData, threshold, color);
            self.postMessage({ imageData: result });
          };
          
          function hexToRgb(hex) {
            const result = /^#?([a-f\\d]{2})([a-f\\d]{2})([a-f\\d]{2})$/i.exec(hex);
            return result ? {
              r: parseInt(result[1], 16),
              g: parseInt(result[2], 16),
              b: parseInt(result[3], 16)
            } : { r: 255, g: 0, b: 0 };
          }
          
          function applyFocusPeaking(imageData, threshold, colorHex) {
            const width = imageData.width;
            const height = imageData.height;
            const data = imageData.data;
            
            const result = new ImageData(width, height);
            const resultData = result.data;
            
            const highlightColor = hexToRgb(colorHex);
            
            const grayscale = new Uint8Array(width * height);
            for (let y = 0; y < height; y++) {
              for (let x = 0; x < width; x++) {
                const idx = (y * width + x) * 4;
                grayscale[y * width + x] = Math.round(
                  (data[idx] * 0.299 + data[idx + 1] * 0.587 + data[idx + 2] * 0.114)
                );
              }
            }
            
            for (let y = 1; y < height - 1; y++) {
              for (let x = 1; x < width - 1; x++) {
                const tl = grayscale[(y - 1) * width + (x - 1)];
                const t  = grayscale[(y - 1) * width + x];
                const tr = grayscale[(y - 1) * width + (x + 1)];
                const l  = grayscale[y * width + (x - 1)];
                const r  = grayscale[y * width + (x + 1)];
                const bl = grayscale[(y + 1) * width + (x - 1)];
                const b  = grayscale[(y + 1) * width + x];
                const br = grayscale[(y + 1) * width + (x + 1)];
                
                const gx = -tl - 2 * l - bl + tr + 2 * r + br;
                const gy = -tl - 2 * t - tr + bl + 2 * b + br;
                
                const g = Math.sqrt(gx * gx + gy * gy);
                
                const idx = (y * width + x) * 4;
                
                resultData[idx] = data[idx];
                resultData[idx + 1] = data[idx + 1];
                resultData[idx + 2] = data[idx + 2];
                resultData[idx + 3] = 255;
                
                if (g > threshold) {
                  resultData[idx] = highlightColor.r;
                  resultData[idx + 1] = highlightColor.g;
                  resultData[idx + 2] = highlightColor.b;
                  resultData[idx + 3] = 255;
                } else {
                  // Make non-edge pixels transparent
                  resultData[idx + 3] = 0;
                }
              }
            }
            
            // Set border pixels
            for (let y = 0; y < height; y++) {
              for (let x = 0; x < width; x++) {
                if (y === 0 || y === height - 1 || x === 0 || x === width - 1) {
                  const idx = (y * width + x) * 4;
                  // Make border pixels transparent
                  resultData[idx + 3] = 0;
                }
              }
            }
            
            return result;
          }`
        ],
        { type: 'application/javascript' }
      );
      
      worker = new Worker(URL.createObjectURL(workerBlob));
      
      // Set up message handler to receive processed data
      worker.onmessage = (e) => {
        if (e.data.imageData) {
          ctx.putImageData(e.data.imageData, 0, 0);
        }
      };
      
      worker.onerror = (error) => {
        console.error('Web Worker error:', error);
        // Fall back to synchronous processing on error
        processSynchronously(ctx, videoElement, color, threshold);
      };
      
    } catch (error) {
      console.error('Error creating web worker:', error);
      // Fall back to synchronous processing if web workers aren't supported
      processSynchronously(ctx, videoElement, color, threshold);
      return;
    }
  }
  
  // Check if video dimensions have changed
  if (lastVideoWidth !== videoElement.videoWidth || 
      lastVideoHeight !== videoElement.videoHeight) {
    lastVideoWidth = videoElement.videoWidth;
    lastVideoHeight = videoElement.videoHeight;
  }
  
  try {
    // Draw the current video frame to the canvas
    ctx.drawImage(videoElement, 0, 0, canvasElement.width, canvasElement.height);
    
    // Get the image data from the canvas
    const imageData = ctx.getImageData(0, 0, canvasElement.width, canvasElement.height);
    
    // Process the image data in the web worker
    worker.postMessage({
      imageData,
      threshold,
      color
    });
  } catch (error) {
    console.error('Error processing video frame:', error);
    processSynchronously(ctx, videoElement, color, threshold);
  }
}

/**
 * Fallback function for synchronous processing when Web Workers aren't available
 */
function processSynchronously(
  ctx: CanvasRenderingContext2D,
  videoElement: HTMLVideoElement,
  color: string,
  threshold: number
): void {
  // Draw the video frame
  ctx.drawImage(videoElement, 0, 0);
  
  // Get the image data
  const imageData = ctx.getImageData(0, 0, ctx.canvas.width, ctx.canvas.height);
  const data = imageData.data;
  const width = ctx.canvas.width;
  const height = ctx.canvas.height;
  
  // Parse the color
  const colorRgb = hexToRgb(color);
  
  // Apply Sobel operator for edge detection
  for (let y = 1; y < height - 1; y++) {
    for (let x = 1; x < width - 1; x++) {
      const idx = (y * width + x) * 4;
      
      // Get grayscale value for surrounding pixels
      const tl = getGrayscale(data, width, y-1, x-1);
      const t  = getGrayscale(data, width, y-1, x);
      const tr = getGrayscale(data, width, y-1, x+1);
      const l  = getGrayscale(data, width, y, x-1);
      const r  = getGrayscale(data, width, y, x+1);
      const bl = getGrayscale(data, width, y+1, x-1);
      const b  = getGrayscale(data, width, y+1, x);
      const br = getGrayscale(data, width, y+1, x+1);
      
      // Apply Sobel operator
      const gx = -tl - 2 * l - bl + tr + 2 * r + br;
      const gy = -tl - 2 * t - tr + bl + 2 * b + br;
      
      // Calculate gradient magnitude
      const g = Math.sqrt(gx * gx + gy * gy);
      
      // Apply threshold to determine if this is an edge
      if (g > threshold) {
        // Highlight with focus peaking color
        data[idx] = colorRgb.r;
        data[idx + 1] = colorRgb.g;
        data[idx + 2] = colorRgb.b;
      } else {
        // Make non-edge pixels transparent
        data[idx + 3] = 0;
      }
    }
  }
  
  // Put the modified image data back to the canvas
  ctx.putImageData(imageData, 0, 0);
}

/**
 * Helper function to get grayscale value of a pixel
 */
function getGrayscale(data: Uint8ClampedArray, width: number, y: number, x: number): number {
  const idx = (y * width + x) * 4;
  // Standard grayscale conversion formula
  return 0.299 * data[idx] + 0.587 * data[idx + 1] + 0.114 * data[idx + 2];
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
    : { r: 255, g: 74, b: 74 }; // Default to red if parsing fails
}