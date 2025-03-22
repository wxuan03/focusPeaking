import React, { useEffect, useRef, useState } from 'react';
import { cn } from '@/lib/utils';
import { processFrame } from '@/services/focusPeaking';
import ControlPanel, { FocusPeakingMode } from '@/components/ControlPanel';
import { Play, Pause, Volume2, VolumeX, RotateCcw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import { toast } from 'sonner';

interface VideoPlayerProps {
  src: string;
  className?: string;
}

const VideoPlayer: React.FC<VideoPlayerProps> = ({ src, className }) => {
  // References
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animationRef = useRef<number | null>(null);
  
  // Playback state
  const [isPlaying, setIsPlaying] = useState(false);
  const [duration, setDuration] = useState(0);
  const [currentTime, setCurrentTime] = useState(0);
  const [volume, setVolume] = useState(1);
  const [isMuted, setIsMuted] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);
  const [showControls, setShowControls] = useState(true);
  
  // Focus peaking settings
  const [enabled, setEnabled] = useState(true);
  const [color, setColor] = useState('#FF4A4A'); // Default red
  const [threshold, setThreshold] = useState(25); // Adjusted default for better results
  const [intensity, setIntensity] = useState(80); // New intensity control (percentage)
  const [mode, setMode] = useState<FocusPeakingMode>('highlight'); // New mode option
  
  // Control visibility timeout
  const controlsTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Initialize video player
  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;
    
    // Set up event listeners
    const onLoadedMetadata = () => {
      setDuration(video.duration);
      setIsLoading(false);
    };
    
    const onTimeUpdate = () => {
      setCurrentTime(video.currentTime);
    };
    
    const onEnded = () => {
      setIsPlaying(false);
    };

    const onError = () => {
      setHasError(true);
      setIsLoading(false);
      toast.error("Failed to load video", {
        description: "Please check that the video file exists at the specified path."
      });
    };
    
    const onCanPlay = () => {
      setIsLoading(false);
    };
    
    const onWaiting = () => {
      setIsLoading(true);
    };
    
    const onPlaying = () => {
      setIsLoading(false);
    };
    
    // Add event listeners
    video.addEventListener('loadedmetadata', onLoadedMetadata);
    video.addEventListener('timeupdate', onTimeUpdate);
    video.addEventListener('ended', onEnded);
    video.addEventListener('error', onError);
    video.addEventListener('canplay', onCanPlay);
    video.addEventListener('waiting', onWaiting);
    video.addEventListener('playing', onPlaying);
    
    // Load the video
    video.load();
    
    // Remove event listeners on cleanup
    return () => {
      video.removeEventListener('loadedmetadata', onLoadedMetadata);
      video.removeEventListener('timeupdate', onTimeUpdate);
      video.removeEventListener('ended', onEnded);
      video.removeEventListener('error', onError);
      video.removeEventListener('canplay', onCanPlay);
      video.removeEventListener('waiting', onWaiting);
      video.removeEventListener('playing', onPlaying);
      
      // Stop animation frame
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }

      // Clear control visibility timeout
      if (controlsTimeoutRef.current) {
        clearTimeout(controlsTimeoutRef.current);
      }
    };
  }, [src]);
  
  // Handle focus peaking animation frame
  useEffect(() => {
    const video = videoRef.current;
    const canvas = canvasRef.current;
    if (!video || !canvas) return;
    
    const renderFocusPeaking = () => {
      if (video.readyState >= 2) { // HAVE_CURRENT_DATA or higher
        // Add mode and intensity to the processing options
        processFrame(video, canvas, color, threshold, enabled, intensity / 100, mode);
      }
      animationRef.current = requestAnimationFrame(renderFocusPeaking);
    };
    
    // Start animation frame
    animationRef.current = requestAnimationFrame(renderFocusPeaking);
    
    // Cleanup animation frame
    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
        animationRef.current = null;
      }
    };
  }, [enabled, color, threshold, intensity, mode]);
  
  // Play/pause the video
  const togglePlay = () => {
    const video = videoRef.current;
    if (!video) return;
    
    if (isPlaying) {
      video.pause();
      setIsPlaying(false);
    } else {
      video.play().then(() => {
        setIsPlaying(true);
      }).catch(err => {
        toast.error("Failed to play video", {
          description: "Please check that the video file is accessible."
        });
        console.error("Error playing video:", err);
      });
    }
  };
  
  // Toggle focus peaking
  const toggleFocusPeaking = () => {
    setEnabled(!enabled);
  };
  
  // Reset video to beginning
  const resetVideo = () => {
    const video = videoRef.current;
    if (!video) return;
    
    video.currentTime = 0;
    setCurrentTime(0);
    if (!isPlaying) {
      togglePlay();
    }
  };
  
  // Handle color change
  const handleColorChange = (newColor: string) => {
    setColor(newColor);
  };
  
  // Handle threshold change
  const handleThresholdChange = (newThreshold: number) => {
    setThreshold(newThreshold);
  };
  
  // Handle intensity change
  const handleIntensityChange = (newIntensity: number) => {
    setIntensity(newIntensity);
  };
  
  // Handle mode change
  const handleModeChange = (newMode: FocusPeakingMode) => {
    setMode(newMode);
  };
  
  // Handle seek
  const handleSeek = (values: number[]) => {
    const video = videoRef.current;
    if (!video) return;
    
    video.currentTime = values[0];
    setCurrentTime(values[0]);
  };
  
  // Handle volume change
  const handleVolumeChange = (values: number[]) => {
    const video = videoRef.current;
    if (!video) return;
    
    const newVolume = values[0];
    video.volume = newVolume;
    setVolume(newVolume);
    
    if (newVolume === 0) {
      setIsMuted(true);
      video.muted = true;
    } else if (isMuted) {
      setIsMuted(false);
      video.muted = false;
    }
  };
  
  // Toggle mute
  const toggleMute = () => {
    const video = videoRef.current;
    if (!video) return;
    
    if (isMuted) {
      video.muted = false;
      video.volume = volume || 0.5;
      setIsMuted(false);
    } else {
      video.muted = true;
      setIsMuted(true);
    }
  };
  
  // Format time (seconds to MM:SS)
  const formatTime = (time: number) => {
    const minutes = Math.floor(time / 60);
    const seconds = Math.floor(time % 60);
    return `${minutes}:${seconds < 10 ? '0' : ''}${seconds}`;
  };

  // Control visibility handling
  const showControlsTemporarily = () => {
    setShowControls(true);
    
    // Clear any existing timeout
    if (controlsTimeoutRef.current) {
      clearTimeout(controlsTimeoutRef.current);
    }
    
    // Set a new timeout to hide controls after 3 seconds
    controlsTimeoutRef.current = setTimeout(() => {
      setShowControls(false);
    }, 3000);
  };
  
  return (
    <div 
      className={cn(
        "relative w-full max-w-5xl mx-auto overflow-hidden rounded-xl shadow-xl", 
        className
      )}
      onMouseEnter={() => setShowControls(true)}
      onMouseLeave={() => {
        if (isPlaying) {
          setShowControls(false);
        }
      }}
      onMouseMove={showControlsTemporarily}
    >
      {/* Video element */}
      <video
        ref={videoRef}
        className="w-full h-auto bg-black"
        playsInline
        onClick={togglePlay}
        poster="/video-poster.jpg"
      >
        <source src={src} type="video/mp4" />
        Your browser does not support the video tag.
      </video>
      
      {/* Focus peaking canvas overlay */}
      <canvas
        ref={canvasRef}
        className="focus-peaking-canvas"
        style={{ 
          position: 'absolute',
          top: 0,
          left: 0,
          width: '100%',
          height: '100%',
          pointerEvents: 'none',
          opacity: enabled ? 1 : 0,
          transition: 'opacity 0.3s ease',
          // Apply different blend modes based on the selected mode
          mixBlendMode: mode === 'highlight' ? 'screen' : 
                        mode === 'outline' ? 'normal' : 
                        'overlay' // contrast mode
        }}
      />
      
      {/* Loading overlay */}
      {isLoading && (
        <div className="absolute inset-0 flex items-center justify-center bg-black/50">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white"></div>
        </div>
      )}
      
      {/* Error overlay */}
      {hasError && (
        <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/80 text-white">
          <div className="text-red-500 text-xl mb-4">Error Loading Video</div>
          <p className="text-center max-w-md px-4">
            The video could not be loaded. Please check that the file exists at:<br/>
            <code className="text-yellow-300 text-sm">public/videos/sample.mp4</code>
          </p>
        </div>
      )}
      
      {/* Play button overlay (only visible when paused) */}
      {!isPlaying && !hasError && !isLoading && (
        <div 
          className="absolute inset-0 flex items-center justify-center cursor-pointer"
          onClick={togglePlay}
        >
          <div className="bg-black/50 rounded-full p-6 transition-transform hover:scale-110">
            <Play className="h-12 w-12 text-white" />
          </div>
        </div>
      )}
      
      {/* Video controls */}
      <div 
        className={cn(
          "absolute bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-black/80 to-transparent",
          "transition-opacity duration-300 ease-in-out",
          showControls ? "opacity-100" : "opacity-0"
        )}
      >
        <div className="flex flex-col space-y-2">
          {/* Progress bar */}
          <div className="flex items-center space-x-2 text-white">
            <span className="text-xs">{formatTime(currentTime)}</span>
            <Slider
              value={[currentTime]}
              min={0}
              max={duration || 100}
              step={0.1}
              onValueChange={handleSeek}
              className="flex-1"
            />
            <span className="text-xs">{formatTime(duration)}</span>
          </div>
          
          {/* Controls */}
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <Button
                variant="ghost"
                size="icon"
                onClick={togglePlay}
                className="text-white hover:text-white/80"
                aria-label={isPlaying ? "Pause" : "Play"}
              >
                {isPlaying ? (
                  <Pause className="h-5 w-5" />
                ) : (
                  <Play className="h-5 w-5" />
                )}
              </Button>
              
              <Button
                variant="ghost"
                size="icon"
                onClick={resetVideo}
                className="text-white hover:text-white/80"
                aria-label="Restart video"
              >
                <RotateCcw className="h-4 w-4" />
              </Button>
              
              <div className="flex items-center space-x-2">
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={toggleMute}
                  className="text-white hover:text-white/80"
                  aria-label={isMuted ? "Unmute" : "Mute"}
                >
                  {isMuted ? (
                    <VolumeX className="h-5 w-5" />
                  ) : (
                    <Volume2 className="h-5 w-5" />
                  )}
                </Button>
                <Slider
                  value={[isMuted ? 0 : volume]}
                  min={0}
                  max={1}
                  step={0.01}
                  onValueChange={handleVolumeChange}
                  className="w-24 md:w-32"
                />
              </div>
            </div>
            
            {/* Focus peaking controls (moved to separate component) */}
            <ControlPanel
              enabled={enabled}
              onToggle={toggleFocusPeaking}
              color={color}
              onColorChange={handleColorChange}
              threshold={threshold}
              onThresholdChange={handleThresholdChange}
              intensity={intensity}
              onIntensityChange={handleIntensityChange}
              mode={mode}
              onModeChange={handleModeChange}
              className="hidden md:flex"
            />
          </div>
        </div>
      </div>
      
      {/* Mobile focus peaking controls (visible on smaller screens) */}
      <div 
        className={cn(
          "fixed bottom-6 left-1/2 transform -translate-x-1/2 md:hidden",
          "transition-opacity duration-300 ease-in-out",
          showControls ? "opacity-100" : "opacity-0"
        )}
      >
        <ControlPanel
          enabled={enabled}
          onToggle={toggleFocusPeaking}
          color={color}
          onColorChange={handleColorChange}
          threshold={threshold}
          onThresholdChange={handleThresholdChange}
          intensity={intensity}
          onIntensityChange={handleIntensityChange}
          mode={mode}
          onModeChange={handleModeChange}
          className="glassmorphism rounded-full px-3 py-2"
        />
      </div>
    </div>
  );
};

export default VideoPlayer;