import React, { useState, useEffect } from 'react';
import { useToast } from '@/hooks/use-toast';
import EnhancedVideoPlayer from './EnhancedVideoPlayer';
import { FFmpeg } from '@ffmpeg/ffmpeg';
import { fetchFile } from '@ffmpeg/util';

// FFmpeg CDN URLs
const FFMPEG_CORE_URL = 'https://unpkg.com/@ffmpeg/core@0.12.4/dist/umd/ffmpeg-core.js';
const FFMPEG_WASM_URL = 'https://unpkg.com/@ffmpeg/core@0.12.4/dist/umd/ffmpeg-core.wasm';

interface ViewCompleteMockInterviewModalProps {
  onClose: () => void;
  videoUrl: string;
  category?: string;
  complexity?: string;
}

export default function ViewCompleteMockInterviewModal({
  onClose,
  videoUrl,
  category,
  complexity,
}: ViewCompleteMockInterviewModalProps) {
  const { toast } = useToast();
  const [ffmpeg, setFFmpeg] = useState<FFmpeg | null>(null);
  const [processing, setProcessing] = useState(false);
  const [progress, setProgress] = useState(0);

  // Initialize FFmpeg
  useEffect(() => {
    const loadFFmpeg = async () => {
      try {
        const ffmpegInstance = new FFmpeg();
        
        // Set up progress logger
        ffmpegInstance.on('log', ({ message }) => {
          // Log messages contain progress information
          if (message.includes('FFMPEG_END')) {
            toast({
              title: 'FFmpeg Loaded',
              description: 'Video processor is ready.',
              duration: 2000,
            });
          }
        });

        ffmpegInstance.on('progress', ({ progress: progressVal }) => {
          setProgress(Math.round(progressVal * 100));
        });

        // Load FFmpeg with CDN URLs
        await ffmpegInstance.load({
          coreURL: FFMPEG_CORE_URL,
          wasmURL: FFMPEG_WASM_URL
        });
        
        setFFmpeg(ffmpegInstance);
      } catch (error) {
        console.error('Error loading FFmpeg:', error);
        toast({
          title: 'Video Processing Unavailable',
          description: 'Failed to load video processor. Please try again later.',
          duration: 4000,
        });
      }
    };

    loadFFmpeg();

    // Cleanup function
    return () => {
      if (ffmpeg) {
        ffmpeg.terminate();
      }
    };
  }, []);

  const handleDownload = async () => {
    if (!ffmpeg) {
      toast({
        title: "Error",
        description: "Video processing is not available. Please try again later.",
      });
      return;
    }

    try {
      setProcessing(true);
      setProgress(0);

      toast({
        title: "Processing Started",
        description: "Converting your video to MP4. Please wait...",
        duration: 5000,
      });

      // Fetch and process the video
      const videoData = await fetchFile(videoUrl);
      await ffmpeg.writeFile('input.webm', videoData);

      // Convert to MP4 with high quality settings
      await ffmpeg.exec([
        '-i', 'input.webm',
        '-c:v', 'libx264',
        '-preset', 'medium',
        '-crf', '23',
        '-c:a', 'aac',
        '-strict', 'experimental',
        '-b:a', '128k',
        '-movflags', '+faststart',
        'output.mp4'
      ]);

      // Read the output file
      const data = await ffmpeg.readFile('output.mp4');
      const blob = new Blob([data], { type: 'video/mp4' });
      const url = URL.createObjectURL(blob);

      // Trigger download
      const link = document.createElement('a');
      link.href = url;
      link.download = `interview-${Date.now()}.mp4`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

      // Cleanup
      await ffmpeg.deleteFile('input.webm');
      await ffmpeg.deleteFile('output.mp4');

      toast({
        title: "Download Complete",
        description: "Your video has been converted and saved as MP4.",
      });
    } catch (error) {
      console.error('Processing error:', error);
      toast({
        title: "Processing Failed",
        description: "There was an error processing your video. Please try again.",
      });
    } finally {
      setProcessing(false);
      setProgress(0);
    }
  };

  return (
    <EnhancedVideoPlayer
      videoUrl={videoUrl}
      onClose={onClose}
      onDownload={handleDownload}
      processing={processing}
      progress={progress}
      category={category}
      complexity={complexity}
    />
  );
}