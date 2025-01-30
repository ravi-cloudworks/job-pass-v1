import React, { useState, useEffect, useRef } from 'react';
import { useToast } from '@/hooks/use-toast';
import EnhancedVideoPlayer from './EnhancedVideoPlayer';
import { FFmpeg } from '@ffmpeg/ffmpeg';
import { fetchFile } from '@ffmpeg/util';

const FFMPEG_CORE_URL = 'https://unpkg.com/@ffmpeg/core@0.12.4/dist/umd/ffmpeg-core.js';
const FFMPEG_WASM_URL = 'https://unpkg.com/@ffmpeg/core@0.12.4/dist/umd/ffmpeg-core.wasm';

// Output dimensions
const OUTPUT_WIDTH = 1920;
const OUTPUT_HEIGHT = 1080;
const VIDEO_WIDTH = 1280;
const VIDEO_HEIGHT = 720;

interface ViewCompleteMockInterviewModalProps {
  onClose: () => void;
  videoUrl: string;
  category?: string;
  complexity?: string | 'Easy' | 'Medium' | 'Hard';
}

export default function ViewCompleteMockInterviewModal({
  onClose,
  videoUrl,
  category = '',
  complexity = 'Easy',
}: ViewCompleteMockInterviewModalProps) {
  const { toast } = useToast();
  const [ffmpeg, setFFmpeg] = useState<FFmpeg | null>(null);
  const [processing, setProcessing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [backgroundImage, setBackgroundImage] = useState<File | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const loadFFmpeg = async () => {
      try {
        console.log('Creating FFmpeg instance...');
        const ffmpegInstance = new FFmpeg();
        
        // Track total frames for better progress calculation
        let totalFrames = 0;
        let currentFrame = 0;

        ffmpegInstance.on('log', ({ message }) => {
          console.log('FFmpeg Log:', message);
          
          // Get total frames from input video info
          if (message.includes('Stream #0:1') && message.includes('fps')) {
            const fpsMatch = message.match(/(\d+(\.\d+)?) fps/);
            const durationMatch = message.match(/Duration: (\d{2}):(\d{2}):(\d{2})/);
            if (fpsMatch && durationMatch) {
              const fps = parseFloat(fpsMatch[1]);
              const hours = parseInt(durationMatch[1]);
              const minutes = parseInt(durationMatch[2]);
              const seconds = parseInt(durationMatch[3]);
              totalFrames = fps * (hours * 3600 + minutes * 60 + seconds);
            }
          }

          // Track frame processing
          const frameMatch = message.match(/frame=\s*(\d+)/);
          if (frameMatch) {
            currentFrame = parseInt(frameMatch[1]);
            if (totalFrames > 0) {
              const progress = (currentFrame / totalFrames) * 100;
              setProgress(Math.min(Math.round(progress), 100));
            }
          }
        });

        await ffmpegInstance.load({
          coreURL: FFMPEG_CORE_URL,
          wasmURL: FFMPEG_WASM_URL
        });
        
        console.log('FFmpeg loaded successfully');
        setFFmpeg(ffmpegInstance);
      } catch (error) {
        console.error('Error loading FFmpeg:', error);
        toast({
          title: 'Video Processing Unavailable',
          description: 'Failed to load video processor. Please try again later.',
        });
      }
    };

    loadFFmpeg();

    return () => {
      if (ffmpeg) {
        ffmpeg.terminate();
      }
    };
  }, []);

  // Function to construct FFmpeg command
  const constructFFmpegCommand = (showBorderProp: boolean) => {
    const xPos = (OUTPUT_WIDTH - VIDEO_WIDTH) / 2;
    const yPos = (OUTPUT_HEIGHT - VIDEO_HEIGHT) / 2;

    const filterComplex = [
      // Scale background to full HD and pad if needed
      `[1:v]scale=${OUTPUT_WIDTH}:${OUTPUT_HEIGHT}:force_original_aspect_ratio=decrease,pad=${OUTPUT_WIDTH}:${OUTPUT_HEIGHT}:(ow-iw)/2:(oh-ih)/2[bg]`,
      // Scale video to 720p
      `[0:v]scale=${VIDEO_WIDTH}:${VIDEO_HEIGHT}:force_original_aspect_ratio=decrease,pad=${VIDEO_WIDTH}:${VIDEO_HEIGHT}:(ow-iw)/2:(oh-ih)/2[scaled]`,
      // Overlay video on background
      `[bg][scaled]overlay=${xPos}:${yPos}[main]`
    ];

    // Add border if enabled
    let lastOutput = '[main]';
    if (showBorderProp) {
      filterComplex.push(`${lastOutput}drawbox=x=${xPos}:y=${yPos}:w=${VIDEO_WIDTH}:h=${VIDEO_HEIGHT}:color=white@0.2:thickness=4[bordered]`);
      lastOutput = '[bordered]';
    }

    return {
      command: [
        '-i', 'input.webm',
        '-i', 'background.png',
        '-filter_complex', filterComplex.join(';'),
        '-map', lastOutput,
        '-map', '0:a?',
        '-c:v', 'libx264',
        '-preset', 'medium',
        '-crf', '23',
        '-c:a', 'aac',
        '-b:a', '192k',
        '-movflags', '+faststart',
        '-y',
        'output.mp4'
      ],
      filterComplex
    };
  };

  const handleDownload = async (
    videoRef: HTMLVideoElement,
    containerRef: HTMLDivElement,
    background: string,
    blurIntensity: number,
    showBorderProp: boolean,
    showShadowProp: boolean,
    aspectRatio: { width: number; height: number }
  ): Promise<void> => {
    console.group('Video Processing Operation');
    console.log('Starting video processing...');

    if (!ffmpeg || !backgroundImage) {
      console.log('Missing FFmpeg or background image');
      console.groupEnd();
      toast({
        title: "Error",
        description: "Please select a background image first.",
      });
      return;
    }

    try {
      setProcessing(true);
      setProgress(0);

      // Step 1: File reading - 10% of progress
      setProgress(5);
      const videoData = await fetchFile(videoUrl);
      setProgress(10);

      // Step 2: Background preparation - 20% of progress
      const reader = new FileReader();
      const backgroundData = await new Promise<Uint8Array>((resolve, reject) => {
        reader.onload = () => {
          const arrayBuffer = reader.result as ArrayBuffer;
          resolve(new Uint8Array(arrayBuffer));
        };
        reader.onerror = () => reject(reader.error);
        reader.readAsArrayBuffer(backgroundImage);
      });
      setProgress(20);

      // Step 3: Writing files - 30% of progress
      await ffmpeg.writeFile('input.webm', videoData);
      setProgress(25);
      await ffmpeg.writeFile('background.png', backgroundData);
      setProgress(30);

      // Step 4: FFmpeg processing - 30% to 90%
      const { command } = constructFFmpegCommand(showBorderProp);
      console.log('FFmpeg command:', command.join(' '));
      await ffmpeg.exec(command);

      // Step 5: Read and create download - 90% to 100%
      setProgress(90);
      const data = await ffmpeg.readFile('output.mp4');
      setProgress(95);

      const blob = new Blob([data], { type: 'video/mp4' });
      const url = URL.createObjectURL(blob);

      const link = document.createElement('a');
      link.href = url;
      link.download = `styled-interview-${Date.now()}.mp4`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

      // Cleanup
      await ffmpeg.deleteFile('input.webm');
      await ffmpeg.deleteFile('background.png');
      await ffmpeg.deleteFile('output.mp4');

      setProgress(100);
      console.log('Operation completed successfully');
      console.groupEnd();

      toast({
        title: "Download Complete",
        description: "Your styled video has been saved as MP4.",
      });
    } catch (error: any) {
      console.error('Operation failed with error:', error);
      console.groupEnd();
      toast({
        title: "Processing Failed",
        description: error?.message || "There was an error processing your video. Please try again.",
      });
    } finally {
      setProcessing(false);
      setProgress(0);
    }
  };

  return (
    <>
      <input
        type="file"
        ref={fileInputRef}
        accept="image/*"
        onChange={(e) => setBackgroundImage(e.target.files?.[0] || null)}
        className="hidden"
      />
      <EnhancedVideoPlayer
        videoUrl={videoUrl}
        onClose={onClose}
        onDownload={handleDownload}
        onSelectBackground={() => fileInputRef.current?.click()}
        backgroundImage={backgroundImage}
        processing={processing}
        progress={progress}
        category={category}
        complexity={complexity}
      />
    </>
  );
}