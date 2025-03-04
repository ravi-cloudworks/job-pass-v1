'use client';

import React from 'react';
import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { useGoogleLogin } from '@react-oauth/google';
import { 
  Youtube, 
  Info, 
  ExternalLink, 
  X, 
  Copy, 
  CheckCircle, 
  Clock,
  AlertTriangle,
  ArrowRight
} from 'lucide-react';
import confetti from 'canvas-confetti';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';

interface ViewMockInterviewModalProps {
  onClose: () => void;
  videoUrl: string;
  category?: string;
  complexity?: string;
  onUploadSuccess?: (localUrl: string, youtubeUrl: string, youtubeId: string) => void;
}

export default function ViewMockInterviewModal({
  onClose,
  videoUrl: initialVideoUrl,
  category = '',
  complexity = 'Easy',
  onUploadSuccess
}: ViewMockInterviewModalProps) {
  const { toast } = useToast();
  const [videoUrl, setVideoUrl] = useState<string>(initialVideoUrl);
  const [accessToken, setAccessToken] = useState<string | null>(null);
  const [videoId, setVideoId] = useState<string | null>(null);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [showInstructions, setShowInstructions] = useState(false);
  const [successModalOpen, setSuccessModalOpen] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [isYouTubeVideoValid, setIsYouTubeVideoValid] = useState<boolean>(true);
  
  // Unified progress stage
  const [progressStage, setProgressStage] = useState<0 | 1 | 2 | 3>(0); // 0=idle, 1=instructions, 2=auth, 3=upload
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  
  // Parse combined URL format (if present)
  useEffect(() => {
    // Always handle URLs on initializing the component
    console.log('Initial URL processing:', initialVideoUrl);
    
    if (initialVideoUrl?.includes('|')) {
      const [blobUrl, youtubeUrl] = initialVideoUrl.split('|');
      // For reopened videos, prefer YouTube URL if available
      if (youtubeUrl && youtubeUrl.includes('youtu')) {
        setVideoUrl(initialVideoUrl);
        
        // Extract video ID from YouTube URL
        const videoIdMatch = youtubeUrl.match(/(?:youtu\.be\/|youtube\.com\/(?:embed\/|v\/|watch\?v=|watch\?.+&v=))([^?&/]+)/);
        const extractedVideoId = videoIdMatch ? videoIdMatch[1] : null;
        if (extractedVideoId) {
          setVideoId(extractedVideoId);
        }
      } else {
        // Fall back to blob if no YouTube URL
        setVideoUrl(blobUrl);
      }
    } else {
      setVideoUrl(initialVideoUrl);
    }
  }, [initialVideoUrl]);
  
  // Debug current state
  useEffect(() => {
    console.log('1. ViewModal - Current state:', {
      videoUrl,
      initialVideoUrl,
      parsedUrl: {
        blobUrl: videoUrl?.includes('|') ? videoUrl.split('|')[0] : videoUrl,
        youtubeUrl: videoUrl?.includes('|') ? videoUrl.split('|')[1] : null
      },
      videoId,
      isYouTubeVideo: videoUrl?.includes('youtu') || videoUrl?.includes('|'),
      urlContainsYouTube: videoUrl?.includes('youtu'),
      hasVideoId: !!videoId
    });
  }, [videoUrl, initialVideoUrl, videoId]);
  
  // Check if YouTube video is valid and extract existing videoId
  useEffect(() => {
    if (videoUrl?.includes('youtu.be/') || videoUrl?.includes('youtube.com/')) {
      // Extract video ID
      const videoIdMatch = videoUrl.match(/(?:youtu\.be\/|youtube\.com\/(?:embed\/|v\/|watch\?v=|watch\?.+&v=))([^?&/]+)/);
      const extractedVideoId = videoIdMatch ? videoIdMatch[1] : null;
      
      if (extractedVideoId) {
        // Set the video ID from URL
        setVideoId(extractedVideoId);
        
        // Check if video exists via oEmbed
        fetch(`https://www.youtube.com/oembed?url=https://www.youtube.com/watch?v=${extractedVideoId}&format=json`)
          .then(response => {
            setIsYouTubeVideoValid(response.ok);
          })
          .catch(() => {
            setIsYouTubeVideoValid(false);
          });
      }
    }
  }, [videoUrl]);
  
  // Helper function to get complexity stars
  const getComplexityStars = (complexity: string) => {
    switch(complexity) {
      case 'Easy': return '⭐';
      case 'Medium': return '⭐⭐';
      case 'Hard': return '⭐⭐⭐';
      default: return '⭐';
    }
  };

  // Start the YouTube save process
  const handleSaveToYouTube = () => {
    setIsProcessing(true);
    setProgressStage(1);
    setShowInstructions(true);
  };

  // User understood instructions
  const handleInstructionsUnderstood = () => {
    setShowInstructions(false);
    setProgressStage(2);
    login();
  };

  // Google Login handler
  const login = useGoogleLogin({
    onSuccess: async (tokenResponse) => {
      console.log('Login Success:', tokenResponse);
      setAccessToken(tokenResponse.access_token);
      setProgressStage(3);
      
      // Progress notification
      toast({
        title: "Step 1 Complete",
        description: "Successfully logged in, now uploading video...",
        duration: 3000,
      });
      
      // Automatically upload after login
      setTimeout(() => {
        if (tokenResponse.access_token) {
          uploadToYouTube(tokenResponse.access_token);
        }
      }, 1000);
    },
    onError: (error) => {
      console.error('Login Failed:', error);
      setErrorMessage("Google login failed. Please try again.");
      setIsProcessing(false);
      setProgressStage(0);
      toast({
        title: "Login Failed",
        description: "Could not login to Google",
        variant: "destructive",
        duration: 5000,
      });
    },
    flow: "implicit", // Added for better auth flow
    prompt: "consent", // Force consent screen to allow selecting different accounts
    scope: 'https://www.googleapis.com/auth/youtube.upload https://www.googleapis.com/auth/youtube https://www.googleapis.com/auth/youtube.force-ssl'
  });

  // Upload to YouTube
  const uploadToYouTube = async (token?: string) => {
    const activeToken = token || accessToken;
    
    if (!activeToken) {
      setErrorMessage("Authentication error. Please try again.");
      setIsProcessing(false);
      setProgressStage(0);
      return;
    }

    try {
      setIsUploading(true);
      setProgressStage(3);
      setUploadProgress(10);

      // Simulate progress updates
      const progressInterval = setInterval(() => {
        setUploadProgress(prev => {
          if (prev >= 90) {
            clearInterval(progressInterval);
            return prev;
          }
          return prev + Math.floor(Math.random() * 10);
        });
      }, 1000);

      // Get the video file - use blob part if combined URL
      const sourceUrl = videoUrl.includes('|') ? videoUrl.split('|')[0] : videoUrl;
      const response = await fetch(sourceUrl);
      const blob = await response.blob();
      const file = new File([blob], 'interview.webm', { type: 'video/webm' });

      // Create the metadata part
      const metadata = {
        snippet: {
          title: `Mock Interview - ${category} (${complexity})`,
          description: `Interview Category: ${category}\nComplexity: ${complexity}\nRecorded on: ${new Date().toLocaleDateString()}`,
          tags: ['mock interview', category, complexity],
          categoryId: '22' // People & Blogs category
        },
        status: {
          privacyStatus: 'unlisted'
        }
      };

      // Create the multipart body properly
      const boundary = 'foo_bar_baz';
      const delimiter = "\r\n--" + boundary + "\r\n";
      const close_delim = "\r\n--" + boundary + "--";

      const multipartRequestBody =
        delimiter +
        'Content-Type: application/json; charset=UTF-8\r\n\r\n' +
        JSON.stringify(metadata) +
        delimiter +
        'Content-Type: video/webm\r\n' +
        'Content-Transfer-Encoding: binary\r\n\r\n';

      const blob2 = new Blob([multipartRequestBody], { type: 'text/plain' });
      const blob3 = new Blob([file], { type: 'video/webm' });
      const blob4 = new Blob([close_delim], { type: 'text/plain' });

      const finalBlob = new Blob([blob2, blob3, blob4], { type: `multipart/mixed; boundary=${boundary}` });

      // Make the upload request
      const uploadResponse = await fetch(
        `https://www.googleapis.com/upload/youtube/v3/videos?part=snippet,status&uploadType=multipart`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${activeToken}`,
            'Content-Type': `multipart/mixed; boundary=${boundary}`,
            'X-Upload-Content-Length': finalBlob.size.toString(),
          },
          body: finalBlob
        }
      );

      clearInterval(progressInterval);
      setUploadProgress(100);

      if (!uploadResponse.ok) {
        const errorText = await uploadResponse.text();
        console.error('Upload response:', uploadResponse.status, errorText);
        
        // Check for common YouTube channel errors
        if (errorText.includes('youtubeSignupRequired') || 
            errorText.includes('channelNotFound') || 
            errorText.toLowerCase().includes('channel') ||
            uploadResponse.status === 401) {
          setErrorMessage("You need to create a YouTube channel before uploading");
          toast({
            title: "YouTube Channel Required",
            description: "You need to create a YouTube channel first before uploading videos.",
            variant: "destructive",
            duration: 10000,
          });
          setProgressStage(0);
          setIsProcessing(false);
          return;
        }
        
        throw new Error(`Upload failed: ${uploadResponse.status} ${errorText}`);
      }

      const result = await uploadResponse.json();

      if (result.id) {
        setVideoId(result.id);
        
        // Create YouTube URL
        const youtubeUrl = `https://youtu.be/${result.id}`;
        
        console.log('2. ViewModal - Upload success:', {
          originalVideoUrl: videoUrl,
          newYoutubeUrl: youtubeUrl,
          youtubeId: result.id
        });
        
        // Create combined URL format - keep the blob URL for now
        const combinedUrl = `${videoUrl}|${youtubeUrl}`;
        
        // Set the combined URL
        setVideoUrl(combinedUrl);
        
        // Notify parent component to update storage and delete local file
        if (onUploadSuccess) {
          console.log('3. ViewModal - Calling onUploadSuccess with:', {
            localUrl: videoUrl,
            youtubeUrl,
            youtubeId: result.id
          });
          onUploadSuccess(videoUrl, youtubeUrl, result.id);
        }
        
        // Show success modal with confetti
        setSuccessModalOpen(true);
        
        toast({
          title: "Upload Successful",
          description: "Your video has been uploaded to YouTube",
          duration: 5000,
        });
      } else {
        throw new Error(result.error?.message || "Upload failed");
      }
    } catch (error) {
      console.error('Upload error:', error);
      setErrorMessage(`${(error as Error)?.message || "Could not upload to YouTube"}`);
      toast({
        title: "Upload Failed",
        description: `${(error as Error)?.message || "Could not upload to YouTube"}`,
        variant: "destructive",
        duration: 5000,
      });
    } finally {
      setIsProcessing(false);
      setProgressStage(0);
      setUploadProgress(0);
      setIsUploading(false);
    }
  };

  // Trigger confetti effect when upload is successful
  useEffect(() => {
    if (videoId && successModalOpen) {
      setTimeout(() => {
        confetti({
          particleCount: 100,
          spread: 70,
          origin: { y: 0.6 }
        });
      }, 300);
    }
  }, [videoId, successModalOpen]);

  // Calculate progress based on stage
  const getStageProgress = () => {
    if (progressStage === 0) return 0;
    if (progressStage === 1) return 33;
    if (progressStage === 2) return 66;
    
    // Stage 3 (upload) uses uploadProgress
    const baseProgress = 66;
    const remainingProgressPercent = (uploadProgress / 100) * 34;
    return baseProgress + remainingProgressPercent;
  };

  // Parse video URL info
  const parsedUrl = {
    blobUrl: videoUrl?.includes('|') ? videoUrl.split('|')[0] : videoUrl,
    youtubeUrl: videoUrl?.includes('|') ? videoUrl.split('|')[1] : null
  };

  // Determine if the video is a YouTube video based on either videoUrl or videoId
  const isYouTubeVideo = (videoUrl?.includes('youtu') || parsedUrl.youtubeUrl != null || !!videoId);
  
  
  // For debug
  useEffect(() => {
    console.log('11. ViewModal - Rendering section:', {
      parsedUrl,
      videoId,
      isYouTubeVideo,
      isProcessing,
      hasError: !!errorMessage
    });
  }, [parsedUrl, videoId, isYouTubeVideo, isProcessing, errorMessage]);

  // Determine which player to show
  const renderVideoPlayer = () => {
    if (!isYouTubeVideoValid && videoUrl?.includes('youtu')) {
      return (
        <div className="bg-gray-100 w-full h-full flex flex-col items-center justify-center p-8 text-center">
          <AlertTriangle className="h-12 w-12 text-amber-500 mb-4" />
          <h3 className="text-lg font-medium mb-2">YouTube Video Unavailable</h3>
          <p className="text-sm text-gray-600 mb-4">
            This video is no longer available on YouTube. It may have been deleted or made private.
          </p>
        </div>
      );
    }
    
    // If we have a blob URL, use standard video player
    if (!parsedUrl.youtubeUrl) {
      return (
        <video src={parsedUrl.blobUrl} controls className="w-full h-full" />
      );
    }
    
    // If we have a YouTube URL, embed it
    if (parsedUrl.youtubeUrl) {
      const youtubeId = parsedUrl.youtubeUrl.match(/(?:youtu\.be\/|youtube\.com\/(?:embed\/|v\/|watch\?v=|watch\?.+&v=))([^?&/]+)/)?.[1];
      
      if (youtubeId) {
        return (
          <iframe 
            src={`https://www.youtube.com/embed/${youtubeId}`}
            className="w-full h-full"
            frameBorder="0"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen
          />
        );
      }
    }
    
    // Fallback to original blob URL
    return (
      <video src={parsedUrl.blobUrl} controls className="w-full h-full" />
    );
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-background/80 backdrop-blur-sm z-50 flex items-center justify-center"
    >
      <div className="bg-background rounded-lg shadow-md w-[90vw] h-[90vh] flex flex-col border border-border overflow-hidden">
        <div className="py-3 px-4 border-b flex justify-between items-center">
  
          <Button 
            variant="ghost" 
            size="icon" 
            className="rounded-full h-8 w-8" 
            onClick={onClose}
            disabled={isProcessing}
          >
            <X className="h-4 w-4" />
          </Button>
        </div>

        {/* Progress bar (visible when processing) */}
        {isProcessing && (
          <div className="px-4 py-2 bg-primary/5 border-b border-primary/20">
            <div className="space-y-1">
              <div className="flex items-center justify-between text-xs mb-1">
                <div className="flex items-center space-x-2">
                  {progressStage === 1 && <span className="text-primary font-medium">Step 1: Instructions</span>}
                  {progressStage === 2 && <span className="text-primary font-medium">Step 2: Google Authentication</span>}
                  {progressStage === 3 && <span className="text-primary font-medium">Step 3: Uploading to YouTube</span>}
                </div>
                <span className="text-muted-foreground">{Math.round(getStageProgress())}%</span>
              </div>
              <Progress value={getStageProgress()} className="h-1.5" />
            </div>
          </div>
        )}

        <div className="flex-grow grid grid-cols-1 gap-6 p-4 overflow-hidden">
          {/* Video Panel - Made fullwidth */}
          <div className="border rounded-lg overflow-hidden flex flex-col">
            <div className="flex-grow relative">
              {renderVideoPlayer()}
              {isProcessing && progressStage === 2 && (
                <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/40">
                  <div className="bg-white p-4 rounded-lg shadow-lg text-center space-y-3 max-w-sm">
                    <div className="flex justify-center">
                      <div className="flex space-x-1">
                        <div className="w-2 h-2 bg-primary rounded-full animate-bounce" style={{ animationDelay: "0ms" }}></div>
                        <div className="w-2 h-2 bg-primary rounded-full animate-bounce" style={{ animationDelay: "150ms" }}></div>
                        <div className="w-2 h-2 bg-primary rounded-full animate-bounce" style={{ animationDelay: "300ms" }}></div>
                      </div>
                    </div>
                    <p className="text-sm font-medium">Waiting for Google Authentication</p>
                    <p className="text-xs text-gray-500">Please complete the Google sign-in process</p>
                    
                    <Button 
                      variant="outline" 
                      size="sm"
                      className="mt-2 text-xs"
                      onClick={() => {
                        setIsProcessing(false);
                        setProgressStage(0);
                        setErrorMessage("Authentication canceled. Please try again with a different account.");
                      }}
                    >
                      Cancel Authentication
                    </Button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Bottom Controls Panel */}
        <div className="px-4 pb-4 pt-1 border-t">
          <div className="flex items-center gap-4">
            {parsedUrl.youtubeUrl ? (
              <div className="flex w-full items-center gap-4">
                <Alert className="flex-1 bg-green-50 border-green-200 text-green-800">
                  <CheckCircle className="h-4 w-4 text-green-600" />
                  <AlertTitle className="text-sm font-medium text-green-800">Video available on YouTube</AlertTitle>
                  <AlertDescription className="text-xs mt-1 text-green-700">
                    Your recording is published as an unlisted video
                  </AlertDescription>
                </Alert>
                
                <Button
                  onClick={() => window.open(parsedUrl.youtubeUrl || '', '_blank')}
                  size="sm"
                  className="text-xs"
                >
                  <Youtube className="mr-1.5 h-4 w-4" />
                  Open on YouTube
                </Button>
              </div>
            ) : errorMessage ? (
              <div className="flex w-full items-center gap-4">
                <Alert className="flex-1 bg-red-50 border-red-200 text-red-800">
                  <AlertTriangle className="h-4 w-4 text-red-600" />
                  <AlertTitle className="text-sm font-medium text-red-800">Error</AlertTitle>
                  <AlertDescription className="text-xs mt-1 text-red-700">
                    {errorMessage}
                    {errorMessage?.includes('YouTube channel') && (
                      <div className="mt-2">
                        <a 
                          href="https://www.youtube.com/create_channel" 
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center text-blue-600 hover:underline font-medium"
                        >
                          <ExternalLink className="h-3 w-3 mr-1" />
                          Click here to create a YouTube channel
                        </a>
                        <p className="mt-1 text-xs text-red-600">
                          After creating your channel, return here and try again
                        </p>
                      </div>
                    )}
                  </AlertDescription>
                </Alert>
                
                <Button
                  onClick={() => {
                    setErrorMessage(null);
                    handleSaveToYouTube();
                  }}
                  disabled={isProcessing}
                  variant="default"
                  size="sm"
                  className="text-xs"
                >
                  <ArrowRight className="mr-1.5 h-4 w-4" />
                  Try Again
                </Button>
              </div>
            ) : isProcessing ? (
              <div className="flex-1">
                <Alert className="bg-primary/5 border-primary/20">
                  <Info className="h-4 w-4 text-primary" />
                  <AlertTitle className="text-sm font-medium">Processing your recording</AlertTitle>
                  <AlertDescription className="text-xs mt-1">
                    Please complete all steps to save your recording
                  </AlertDescription>
                </Alert>
              </div>
            ) : (
              <div className="flex w-full items-center gap-4">
                <Alert className="flex-1 bg-primary/5 border-primary/20">
                  <Info className="h-4 w-4 text-primary" />
                  <AlertTitle className="text-sm font-medium">Save your recording</AlertTitle>
                  <AlertDescription className="text-xs mt-1">
                    Save your recording to YouTube as an unlisted video
                  </AlertDescription>
                </Alert>
                
                <Button
                  onClick={handleSaveToYouTube}
                  disabled={isProcessing}
                  variant="default"
                  size="sm"
                  className="text-xs"
                >
                  <Youtube className="mr-1.5 h-4 w-4" />
                  Save to YouTube
                </Button>
              </div>
            )}
          </div>
        </div>
      </div>
      
      {/* Instructions Modal - Stage 1 */}
      <Dialog open={showInstructions} onOpenChange={(open) => {
        if (!open && isProcessing) {
          // Reset when user closes dialog manually
          setIsProcessing(false);
          setProgressStage(0);
        }
        setShowInstructions(open);
      }}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>YouTube Upload Instructions</DialogTitle>
            <DialogDescription>
              Please follow these steps to successfully upload your video:
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <h3 className="font-medium">Before you begin:</h3>
              <ul className="list-disc pl-5 space-y-1 text-sm">
                <li>You must have a YouTube channel associated with your Google account</li>
                <li>If you don't have a YouTube channel yet, you'll need to create one first</li>
              </ul>
            </div>
            
            <div className="space-y-2">
              <h3 className="font-medium">Step 1: Login Process (TWO SCREENS)</h3>
              <ul className="list-disc pl-5 space-y-1 text-sm">
                <li>After clicking "I Understand", you'll see Google's login screens</li>
                <li><strong>First screen</strong>: Choose your Google account</li>
                <li><strong>Second screen</strong>: You'll see two options - your email account and YouTube account</li>
                <li><strong className="text-red-500">IMPORTANT: You MUST select the YouTube option</strong>, not your email</li>
                <li>Selecting your email account instead of YouTube will cause an authorization error</li>
              </ul>
            </div>
            
            <div className="space-y-2">
              <h3 className="font-medium">Step 2: Creating a YouTube Channel (if needed)</h3>
              <ul className="list-disc pl-5 space-y-1 text-sm">
                <li>If you don't see a YouTube option on the second screen, you need to create a channel first</li>
                <li>
                  <a 
                    href="https://www.youtube.com/create_channel" 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="text-blue-500 underline flex items-center"
                  >
                    Click here to create a YouTube channel
                    <ExternalLink className="h-3 w-3 ml-1" />
                  </a>
                </li>
                <li>Sign in with your Google account</li>
                <li>Follow the prompts to complete channel creation</li>
                <li>Return to this page and try again - you should now see two options on the second screen</li>
              </ul>
            </div>
          </div>
          <DialogFooter>
            <Button onClick={handleInstructionsUnderstood}>I Understand</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      
      {/* Success Modal */}
      <Dialog open={successModalOpen} onOpenChange={setSuccessModalOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-center">
              <div className="flex items-center justify-center space-x-2">
                <CheckCircle className="h-5 w-5 text-green-600" />
                <span className="text-xl">Upload Successful!</span>
              </div>
            </DialogTitle>
          </DialogHeader>
          <div className="flex flex-col items-center justify-center space-y-6 py-6">
            <div className="text-center space-y-2">
              <p className="text-lg">Your video has been uploaded to YouTube</p>
              <p className="text-sm text-muted-foreground">It's available as an unlisted video on your channel</p>
            </div>
            
            <div className="w-full p-4 bg-muted rounded-md">
              <p className="font-medium mb-2">Video Link:</p>
              <a 
                href={parsedUrl.youtubeUrl || `https://youtu.be/${videoId || ''}`} 
                target="_blank"
                rel="noopener noreferrer" 
                className="text-blue-500 hover:text-blue-700 hover:underline flex items-center justify-center gap-2 p-3 bg-card rounded border border-border transition-colors"
              >
                <Youtube className="h-5 w-5" />
                {parsedUrl.youtubeUrl || `https://youtu.be/${videoId || ''}`}
              </a>
            </div>
            
            <div className="flex gap-4">
              <Button 
                onClick={() => {
                  navigator.clipboard.writeText(parsedUrl.youtubeUrl || `https://youtu.be/${videoId || ''}`);
                  toast({
                    title: "Link copied",
                    description: "YouTube URL copied to clipboard",
                    duration: 3000,
                  });
                }}
                variant="outline"
                size="sm"
                className="text-xs"
              >
                <Copy className="mr-1.5 h-4 w-4" />
                Copy Link
              </Button>
              <Button 
                onClick={() => window.open(parsedUrl.youtubeUrl || `https://youtu.be/${videoId || ''}`, '_blank')}
                size="sm"
                className="text-xs"
              >
                <Youtube className="mr-1.5 h-4 w-4" />
                Open Video
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </motion.div>
  );
}