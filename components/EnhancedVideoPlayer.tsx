import React, { useRef, useEffect } from 'react';
import { X, Download, Share2, Image } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Progress } from '@/components/ui/progress';
import { useToast } from "@/hooks/use-toast";

interface EnhancedVideoPlayerProps {
  videoUrl: string;
  onClose: () => void;
  onDownload: (
    videoRef: HTMLVideoElement,
    containerRef: HTMLDivElement,
    background: string,
    blurIntensity: number,
    showBorder: boolean,
    showShadow: boolean,
    aspectRatio: { width: number; height: number }
  ) => Promise<void>;
  onSelectBackground: () => void;
  backgroundImage: File | null;
  processing: boolean;
  progress: number;
  category?: string;
  complexity?: string;
}

export default function EnhancedVideoPlayer({ 
  videoUrl, 
  onClose,
  onDownload,
  onSelectBackground,
  backgroundImage,
  processing,
  progress,
  category,
  complexity
}: EnhancedVideoPlayerProps) {
  const { toast } = useToast();
  const [showBorder, setShowBorder] = React.useState(true);
  const [showShadow, setShowShadow] = React.useState(true);
  const [showControls, setShowControls] = React.useState(true);
  const [backgroundPreviewUrl, setBackgroundPreviewUrl] = React.useState<string>('');
  const videoRef = useRef<HTMLVideoElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // Create object URL for background image preview
  useEffect(() => {
    if (backgroundImage) {
      const url = URL.createObjectURL(backgroundImage);
      setBackgroundPreviewUrl(url);
      return () => URL.revokeObjectURL(url);
    }
  }, [backgroundImage]);

  const handleDownloadClick = () => {
    if (!videoRef.current || !containerRef.current) {
      toast({
        title: "Error",
        description: "Video element not found"
      });
      return;
    }

    if (!backgroundImage) {
      toast({
        title: "Error",
        description: "Please select a background image first"
      });
      return;
    }

    // Using fixed 720p aspect ratio
    onDownload(
      videoRef.current,
      containerRef.current,
      'bg', // This is no longer used since we pass backgroundImage directly
      8, // Fixed blur value
      showBorder,
      showShadow,
      { width: 1280, height: 720 } // Fixed 720p resolution
    );
  };

  const handleShare = async () => {
    try {
      if (navigator.share) {
        await navigator.share({
          title: 'Mock Interview Recording',
          text: 'Check out my mock interview recording',
          url: videoUrl
        });
      } else {
        await navigator.clipboard.writeText(videoUrl);
        toast({
          title: "Link Copied",
          description: "Video link copied to clipboard"
        });
      }
    } catch (error) {
      console.error('Share error:', error);
      toast({
        title: "Share Failed",
        description: "Unable to share the video"
      });
    }
  };

  return (
    <div className="fixed inset-0 bg-background/80 backdrop-blur-sm z-50 flex items-center justify-center p-6">
      <div className="bg-background rounded-xl shadow-2xl w-[95vw] h-[95vh] flex flex-col">
        {/* Header */}
        <div className="p-4 flex justify-between items-center border-b">
          <div className="flex items-center gap-4">
            <h2 className="text-xl font-semibold">Video Preview</h2>
            {category && (
              <span className="px-2 py-1 rounded-full bg-blue-100 text-blue-800 text-sm">
                {category}
              </span>
            )}
            {complexity && (
              <span className="px-2 py-1 rounded-full bg-blue-100 text-blue-800 text-sm">
                {complexity}
              </span>
            )}
          </div>
          <Button variant="ghost" size="icon" onClick={onClose}>
            <X className="h-5 w-5" />
          </Button>
        </div>

        {/* Main Content */}
        <div className="flex flex-1 gap-6 p-6 overflow-hidden">
          {/* Video Preview Area */}
          <div ref={containerRef} 
               className="flex-1 rounded-xl overflow-hidden flex items-center justify-center relative"
               style={{
                 background: backgroundPreviewUrl ? `url(${backgroundPreviewUrl})` : '#1f2937',
                 backgroundSize: 'cover',
                 backgroundPosition: 'center'
               }}>
            <div className="relative aspect-video w-[640px]">
              <video
                ref={videoRef}
                src={videoUrl}
                controls={showControls}
                className={`w-full h-full object-contain ${showBorder ? 'ring-4 ring-white/20' : ''} ${showShadow ? 'shadow-2xl' : ''}`}
              >
                Your browser does not support the video tag.
              </video>
            </div>
          </div>

          {/* Controls Panel */}
          <div className="w-72 bg-gray-50 dark:bg-gray-900 rounded-xl p-4 space-y-6 overflow-y-auto">
            {/* Background Image Selection */}
            <div className="space-y-4">
              <h3 className="font-medium">Background Image</h3>
              <Button 
                onClick={onSelectBackground}
                className="w-full gap-2"
                variant={backgroundImage ? "secondary" : "default"}
              >
                <Image className="h-4 w-4" />
                {backgroundImage ? 'Change Background' : 'Select Background'}
              </Button>
              {backgroundImage && (
                <p className="text-sm text-gray-500 break-all">
                  Selected: {backgroundImage.name}
                </p>
              )}
            </div>

            {/* Video Controls */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span>Show Border</span>
                <Switch checked={showBorder} onCheckedChange={setShowBorder} />
              </div>
              <div className="flex items-center justify-between">
                <span>Show Shadow</span>
                <Switch checked={showShadow} onCheckedChange={setShowShadow} />
              </div>
              <div className="flex items-center justify-between">
                <span>Show Controls</span>
                <Switch checked={showControls} onCheckedChange={setShowControls} />
              </div>
            </div>

            {/* Info Note */}
            <div className="text-sm text-muted-foreground">
              <p>Video will be rendered at 720p (1280×720) resolution with your selected background image.</p>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 border-t space-y-4">
          {processing && (
            <div className="px-4">
              <div className="flex justify-between mb-2">
                <span className="text-sm text-gray-500">Converting to MP4...</span>
                <span className="text-sm text-gray-500">{progress}%</span>
              </div>
              <Progress value={progress} className="w-full" />
            </div>
          )}
          <div className="flex justify-end gap-3">
            <Button variant="outline" onClick={handleShare} className="gap-2">
              <Share2 className="h-4 w-4" />
              Share
            </Button>
            <Button 
              onClick={handleDownloadClick} 
              disabled={processing || !backgroundImage}
              className="gap-2"
            >
              <Download className="h-4 w-4" />
              {processing ? 'Processing...' : 'Download MP4'}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}