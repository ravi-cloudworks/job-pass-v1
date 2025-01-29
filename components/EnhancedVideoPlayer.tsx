import React, { useState, useRef } from 'react';
import { X, Download, Share2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Slider } from '@/components/ui/slider';
import { Progress } from '@/components/ui/progress';
import { useToast } from "@/hooks/use-toast";


type GradientType = 'aurora' | 'sunset' | 'ocean' | 'forest' | 'cosmic';
type AspectRatioType = '16:9' | '4:3' | '1:1' | '9:16';

const gradients: Record<GradientType, string> = {
  aurora: 'bg-gradient-to-br from-purple-500 via-blue-500 to-green-400',
  sunset: 'bg-gradient-to-br from-orange-500 via-red-500 to-purple-500',
  ocean: 'bg-gradient-to-br from-blue-400 via-blue-600 to-blue-800',
  forest: 'bg-gradient-to-br from-green-400 via-green-600 to-green-800',
  cosmic: 'bg-gradient-to-br from-indigo-500 via-purple-500 to-pink-500'
};

const aspectRatioDimensions: Record<AspectRatioType, { width: number; height: number }> = {
  '16:9': { width: 1920, height: 1080 },
  '4:3': { width: 1440, height: 1080 },
  '1:1': { width: 1080, height: 1080 },
  '9:16': { width: 1080, height: 1920 }
};

interface EnhancedVideoPlayerProps {
  videoUrl: string;
  onClose: () => void;
  onDownload: () => void;
  processing: boolean;
  progress: number;
  category?: string;
  complexity?: string;
}

export default function EnhancedVideoPlayer({
  videoUrl,
  onClose,
  onDownload,
  processing,
  progress,
  category,
  complexity
}: EnhancedVideoPlayerProps) {
  const { toast } = useToast();
  const [background, setBackground] = useState<GradientType>('aurora');
  const [aspectRatio, setAspectRatio] = useState<AspectRatioType>('16:9');
  const [showBorder, setShowBorder] = useState(true);
  const [showShadow, setShowShadow] = useState(true);
  const [blurIntensity, setBlurIntensity] = useState(8);
  const [showControls, setShowControls] = useState(true);
  const videoRef = useRef<HTMLVideoElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

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
            className={`flex-1 ${gradients[background]} p-8 rounded-xl overflow-hidden flex items-center justify-center`}>
            <div className={`relative aspect-ratio-container`}
              style={{
                aspectRatio: `${aspectRatioDimensions[aspectRatio].width} / ${aspectRatioDimensions[aspectRatio].height}`,
                width: '100%',
                maxHeight: '100%'
              }}>
              <video
                ref={videoRef}
                src={videoUrl}
                controls={showControls}
                className={`
                  w-full h-full object-contain
                  ${showBorder ? 'ring-4 ring-white/20' : ''}
                  ${showShadow ? 'shadow-2xl' : ''}
                `}
              >
                Your browser does not support the video tag.
              </video>
            </div>
          </div>

          {/* Controls Panel */}
          <div className="w-72 bg-gray-50 dark:bg-gray-900 rounded-xl p-4 space-y-6 overflow-y-auto">
            <div className="space-y-4">
              <h3 className="font-medium">Background</h3>
              <Select
                defaultValue={background}
                onValueChange={(value: GradientType) => setBackground(value)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="aurora">Aurora</SelectItem>
                  <SelectItem value="sunset">Sunset</SelectItem>
                  <SelectItem value="ocean">Ocean</SelectItem>
                  <SelectItem value="forest">Forest</SelectItem>
                  <SelectItem value="cosmic">Cosmic</SelectItem>
                </SelectContent>
              </Select>
            </div>


            <div className="space-y-4">
              <h3 className="font-medium">Aspect Ratio</h3>
              <Select
                defaultValue={aspectRatio}
                onValueChange={(value: AspectRatioType) => setAspectRatio(value)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="16:9">16:9 (1920×1080)</SelectItem>
                  <SelectItem value="4:3">4:3 (1440×1080)</SelectItem>
                  <SelectItem value="1:1">1:1 (1080×1080)</SelectItem>
                  <SelectItem value="9:16">9:16 (1080×1920)</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-4">
              <h3 className="font-medium">Background Blur</h3>
              <Slider
                value={[blurIntensity]}
                min={0}
                max={16}
                step={2}
                onValueChange={(value) => setBlurIntensity(value[0])}
              />
            </div>

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
              onClick={onDownload} 
              disabled={processing}
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