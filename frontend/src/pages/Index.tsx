
import React, { useEffect, useState } from 'react';
import VideoPlayer from '@/components/VideoPlayer';
import { toast } from 'sonner';

const Index = () => {
  const [isLoading, setIsLoading] = useState(true);
  const videoSrc = '/sample.mp4';
  
  useEffect(() => {
    // Check if the video file exists
    fetch(videoSrc)
      .then(response => {
        if (!response.ok) {
          throw new Error('Video file not found');
        }
        setIsLoading(false);
      })
      .catch(error => {
        console.error('Error loading video:', error);
        toast.error('Video file not found', {
          description: 'Please download the sample video and place it in the public directory as "sample.mp4"',
        });
        setIsLoading(false);
      });
  }, [videoSrc]);

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-b from-black to-zinc-900 p-4">
      <header className="mb-12 text-center animate-fade-in">
        <div className="inline-block mb-3 px-3 py-1 bg-white/5 rounded-full text-xs font-medium tracking-wide text-zinc-400">
          Focus Peaking Visualizer
        </div>
        <h1 className="text-4xl font-light tracking-tight mb-2 text-white">
          <span className="font-medium">Focus</span>VISION
        </h1>
        <p className="text-zinc-400 max-w-md mx-auto">
          Visualize areas of sharp focus in video with an interactive overlay
        </p>
      </header>

      <main className="w-full max-w-5xl mx-auto">
        {isLoading ? (
          <div className="bg-white/5 rounded-xl aspect-video flex items-center justify-center animate-pulse">
            <p className="text-zinc-400">Loading video...</p>
          </div>
        ) : (
          <VideoPlayer src={videoSrc} className="shadow-2xl shadow-black/50 rounded-xl animate-fade-in" />
        )}
      </main>

      <footer className="mt-12 text-center text-zinc-500 text-sm animate-fade-in">
        <p>
          Place the sample video file in the public directory as "sample.mp4"
        </p>
      </footer>
    </div>
  );
};

export default Index;
