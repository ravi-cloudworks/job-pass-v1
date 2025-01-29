import React, { useState, useEffect, useRef } from 'react';
import { useToast } from '@/hooks/use-toast';
import EnhancedVideoPlayer from './EnhancedVideoPlayer';
import { FFmpeg } from '@ffmpeg/ffmpeg';
import { fetchFile } from '@ffmpeg/util';

const FFMPEG_CORE_URL = 'https://unpkg.com/@ffmpeg/core@0.12.4/dist/umd/ffmpeg-core.js';
const FFMPEG_WASM_URL = 'https://unpkg.com/@ffmpeg/core@0.12.4/dist/umd/ffmpeg-core.wasm';

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
        
        ffmpegInstance.on('log', ({ message }: { message: string }) => {
          console.log('FFmpeg Log:', message);
          if (message.toLowerCase().includes('error') || message.toLowerCase().includes('failed')) {
            console.warn('Potential FFmpeg error:', message);
          }
        });

        ffmpegInstance.on('progress', ({ progress: progressVal }: { progress: number }) => {
          console.log('Progress:', progressVal);
          setProgress(Math.round(progressVal * 100));
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

  const handleDownload = async (
    videoRef: HTMLVideoElement,
    containerRef: HTMLDivElement,
    background: string,
    blurIntensity: number,
    showBorderProp: boolean,
    showShadowProp: boolean,
    aspectRatio: { width: number; height: number }
  ): Promise<void> => {
    // Start a new console group for this operation
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

      // Log initial state
      console.log('Initial state:', {
        videoUrl,
        backgroundImage: backgroundImage.name,
        showBorder: showBorderProp,
        showShadow: showShadowProp,
      });

      // Step 1: Prepare files
      console.group('Step 1: File Preparation');
      console.log('Fetching video data...');
      const videoData = await fetchFile(videoUrl);
      console.log('Video data size:', videoData.length);

      console.log('Reading background image...');
      const reader = new FileReader();
      const backgroundData = await new Promise<Uint8Array>((resolve, reject) => {
        reader.onload = () => {
          const arrayBuffer = reader.result as ArrayBuffer;
          resolve(new Uint8Array(arrayBuffer));
        };
        reader.onerror = () => reject(reader.error);
        reader.readAsArrayBuffer(backgroundImage);
      });
      console.log('Background image size:', backgroundData.length);
      console.groupEnd();

      // Step 2: Write files to FFmpeg
      console.group('Step 2: Writing Files to FFmpeg');
      console.log('Writing input.webm...');
      await ffmpeg.writeFile('input.webm', videoData);
      console.log('Writing background.png...');
      await ffmpeg.writeFile('background.png', backgroundData);
      
      const files = await ffmpeg.listDir('/');
      console.log('Files in FFmpeg filesystem:', files);
      console.groupEnd();

      // Step 3: Prepare FFmpeg command
      console.group('Step 3: FFmpeg Command Preparation');
      // Simplified filter complex with fixed expressions
      const filterComplex = [
        // Scale background to 720p
        '[1:v]scale=1280:720[bg]',
        // Scale video
        '[0:v]scale=640:480[scaled]',
        // Overlay video on background centered
        '[bg][scaled]overlay=x=(1280-640)/2:y=(720-480)/2[v0]'
      ];

      if (showBorderProp) {
        // Add border with fixed coordinates
        filterComplex.push('[v0]drawbox=x=320:y=120:w=640:h=480:color=white@0.2:thickness=2[v1]');
      }

      const lastOutput = showBorderProp ? '[v1]' : '[v0]';

      // Construct FFmpeg command
      const ffmpegCommand = [
        '-i', 'input.webm',
        '-i', 'background.png',
        '-filter_complex', filterComplex.join(';'),
        '-map', lastOutput,
        '-map', '0:a?',
        '-c:v', 'libx264',
        '-preset', 'ultrafast',
        '-crf', '28',
        '-c:a', 'aac',
        '-b:a', '128k',
        '-y',
        'output.mp4'
      ];

      // Log command in readable format
      console.log('FFmpeg command:');
      console.log('ffmpeg \\');
      ffmpegCommand.forEach((part, index) => {
        if (index % 2 === 0 && part.startsWith('-')) {
          console.log(`  ${part} ${ffmpegCommand[index + 1]} \\`);
        }
      });
      console.groupEnd();

      // Step 4: Execute FFmpeg
      console.group('Step 4: FFmpeg Execution');
      console.log('Starting FFmpeg execution...');
      await ffmpeg.exec(ffmpegCommand);
      console.log('FFmpeg execution completed');

      const outputFiles = await ffmpeg.listDir('/');
      console.log('Files after FFmpeg execution:', outputFiles);
      console.groupEnd();

      // Step 5: Read and download output
      console.group('Step 5: File Download');
      console.log('Reading output.mp4...');
      const data = await ffmpeg.readFile('output.mp4');
      console.log('Output file size:', data.length);

      const blob = new Blob([data], { type: 'video/mp4' });
      console.log('Created blob size:', blob.size);
      const url = URL.createObjectURL(blob);

      const link = document.createElement('a');
      link.href = url;
      link.download = `styled-interview-${Date.now()}.mp4`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
      console.log('Download initiated');
      console.groupEnd();

      // Cleanup
      console.group('Step 6: Cleanup');
      await ffmpeg.deleteFile('input.webm');
      await ffmpeg.deleteFile('background.png');
      await ffmpeg.deleteFile('output.mp4');
      console.log('Cleanup completed');
      console.groupEnd();

      console.log('Operation completed successfully');
      console.groupEnd(); // End main group

      toast({
        title: "Download Complete",
        description: "Your styled video has been saved as MP4.",
      });
    } catch (error: any) {
      console.error('Operation failed with error:', {
        name: error?.name,
        message: error?.message,
        stack: error?.stack,
        code: error?.code,
        errno: error?.errno,
      });
      console.groupEnd(); // End main group even on error
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