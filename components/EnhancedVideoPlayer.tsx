import React, { useRef } from 'react';
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
  const videoRef = useRef<HTMLVideoElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [backgroundPreviewUrl, setBackgroundPreviewUrl] = React.useState<string>('');

  // Create object URL for background image preview
  React.useEffect(() => {
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

    onDownload(
      videoRef.current,
      containerRef.current,
      'bg',
      8,
      showBorder,
      showShadow,
      { width: 1920, height: 1080 }
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
        <div className="flex flex-1 gap-6 p-6 overflow-hidden" ref={containerRef}>
          {/* Video Preview Area */}
          <div className="flex-1 rounded-xl overflow-hidden flex items-center justify-center p-4">
            {/* Container maintaining 16:9 aspect ratio */}
            <div className="w-full relative" style={{ paddingBottom: '56.25%' }}> {/* 9/16 = 0.5625 */}
              {/* Content container */}
              <div className="absolute inset-0 flex items-center justify-center">
                {/* Background and video container */}
                <div className="relative w-full h-full"
                     style={{
                       maxWidth: '1920px',
                       maxHeight: '1080px',
                       aspectRatio: '16/9',
                     }}>
                  {/* Background Image */}
                  {backgroundPreviewUrl && (
                    <div className="absolute inset-0" 
                         style={{
                           backgroundImage: `url(${backgroundPreviewUrl})`,
                           backgroundSize: 'contain',
                           backgroundPosition: 'center',
                           backgroundRepeat: 'no-repeat',
                         }}
                    />
                  )}
                  
                  {/* Video Container - centered with padding */}
                  <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2"
                       style={{
                         width: '66.67%',  /* 1280px relative to 1920px */
                         height: '66.67%', /* 720px relative to 1080px */
                       }}>
                    <video
                      ref={videoRef}
                      src={videoUrl}
                      controls={true}
                      className={`w-full h-full object-contain
                        ${showBorder ? 'ring-4 ring-white/20' : ''}
                        ${showShadow ? 'shadow-2xl' : ''}`}
                    >
                      Your browser does not support the video tag.
                    </video>
                  </div>
                </div>
              </div>
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
            </div>

            {/* Info Note */}
            <div className="text-sm text-muted-foreground">
              <p>Video will be rendered at 1080p (1920×1080) resolution with your selected background image.</p>
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