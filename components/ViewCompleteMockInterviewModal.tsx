'use client';

import React from 'react';
import { useState } from 'react';
import { useEffect } from 'react';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { useGoogleLogin } from '@react-oauth/google';
import { Youtube, Info, ExternalLink } from 'lucide-react';
import confetti from 'canvas-confetti';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';

interface ViewCompleteMockInterviewModalProps {
  onClose: () => void;
  videoUrl: string;
  category?: string;
  complexity?: string;
}

export default function ViewCompleteMockInterviewModal({
  onClose,
  videoUrl,
  category = '',
  complexity = 'Easy',
}: ViewCompleteMockInterviewModalProps) {
  const { toast } = useToast();
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [accessToken, setAccessToken] = useState<string | null>(null);
  const [videoId, setVideoId] = useState<string | null>(null);
  const [instructionsOpen, setInstructionsOpen] = useState(false);
  const [successModalOpen, setSuccessModalOpen] = useState(false);
  
  // Trigger confetti effect when upload is successful
  useEffect(() => {
    if (videoId) {
      setSuccessModalOpen(true);
      // Fire the confetti with a slight delay to ensure modal is visible
      setTimeout(() => {
        confetti({
          particleCount: 100,
          spread: 70,
          origin: { y: 0.6 }
        });
      }, 300);
    }
  }, [videoId]);

  // Google Login handler
  const login = useGoogleLogin({
    onSuccess: async (tokenResponse) => {
      console.log('Login Success:', tokenResponse);
      setAccessToken(tokenResponse.access_token);
      setIsAuthenticated(true);
      toast({
        title: "Successfully logged in",
        description: "You can now upload to YouTube",
        duration: 5000, // Extended duration
      });
    },
    onError: (error) => {
      console.error('Login Failed:', error);
      toast({
        title: "Login Failed",
        description: "Could not login to Google",
        variant: "destructive",
        duration: 5000, // Extended duration
      });
    },
    scope: 'https://www.googleapis.com/auth/youtube.upload https://www.googleapis.com/auth/youtube https://www.googleapis.com/auth/youtube.force-ssl'
  });

  const uploadToYouTube = async () => {
    if (!accessToken) {
      toast({
        title: "Not authenticated",
        description: "Please login first",
        variant: "destructive",
        duration: 5000, // Extended duration
      });
      return;
    }

    try {
      setIsUploading(true);
      setUploadProgress(10);

      // Get the video file
      const response = await fetch(videoUrl);
      const blob = await response.blob();
      const file = new File([blob], 'interview.webm', { type: 'video/webm' });

      // Create the metadata part
      const metadata = {
        snippet: {
          title: `Mock Interview - ${new Date().toLocaleDateString()}`,
          description: `Interview Category: ${category}\nComplexity: ${complexity}`,
          tags: ['mock interview'],
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
            'Authorization': `Bearer ${accessToken}`,
            'Content-Type': `multipart/mixed; boundary=${boundary}`,
            'X-Upload-Content-Length': finalBlob.size.toString(),
          },
          body: finalBlob
        }
      );

      if (!uploadResponse.ok) {
        const errorText = await uploadResponse.text();
        console.error('Upload response:', uploadResponse.status, errorText);
        
        if (errorText.includes('youtubeSignupRequired')) {
          toast({
            title: "YouTube Channel Required",
            description: "You need to create a YouTube channel first. Click here to set it up.",
            variant: "destructive",
            duration: 10000, // Extended duration
            action: (
              <Button 
                variant="outline" 
                onClick={() => window.open('https://www.youtube.com', '_blank')}
                className="flex items-center"
              >
                <ExternalLink className="mr-1 h-4 w-4" />
                Create Channel
              </Button>
            ),
          });
          return;
        }
        
        throw new Error(`Upload failed: ${uploadResponse.status} ${errorText}`);
      }

      const result = await uploadResponse.json();

      if (result.id) {
        setVideoId(result.id);
        toast({
          title: "Upload Successful",
          description: "Your video has been uploaded to YouTube",
          duration: 5000, // Extended duration
        });
      } else {
        throw new Error(result.error?.message || "Upload failed");
      }
    } catch (error) {
      console.error('Upload error:', error);
      toast({
        title: "Upload Failed",
        description: `${(error as Error)?.message || "Could not upload to YouTube"}`,
        variant: "destructive",
        duration: 5000, // Extended duration
      });
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-background/80 backdrop-blur-sm z-50 flex items-center justify-center">
      <Card className="w-[90vw] h-[90vh] flex flex-col">
        <CardContent className="flex flex-col h-full p-6 gap-6">
          {/* Video Preview */}
          <div className="flex-grow relative rounded-lg overflow-hidden bg-black">
            <video
              src={videoUrl}
              controls
              className="w-full h-full object-contain"
            />
          </div>

          {/* Controls */}
          <div className="flex items-center gap-4">
            {videoId ? (
              <>
                <div className="flex flex-col mr-auto">
                  <div className="text-sm font-medium">
                    Video uploaded successfully!
                  </div>
                  <a 
                    href={`https://youtu.be/${videoId}`}
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="text-xs text-blue-500 hover:text-blue-700 hover:underline mt-1"
                  >
                    Click this YouTube link
                  </a>
                </div>
                <Button
                  onClick={() => window.open(`https://youtu.be/${videoId}`, '_blank')}
                  className="ml-auto"
                >
                  <Youtube className="mr-2 h-4 w-4" />
                  Open on YouTube
                </Button>
              </>
            ) : !isAuthenticated ? (
              <>
                <Dialog open={instructionsOpen} onOpenChange={setInstructionsOpen}>
                  <DialogTrigger asChild>
                    <Button variant="outline" className="flex gap-1">
                      <Info className="h-4 w-4" />
                      Read Before Login
                    </Button>
                  </DialogTrigger>
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
                        <h3 className="font-medium">Step 1: Login Process</h3>
                        <ul className="list-disc pl-5 space-y-1 text-sm">
                          <li>Click "Sign in with Google" button</li>
                          <li>When asked to "Choose an account", select your <strong>YouTube brand account</strong> (not your personal Gmail)</li>
                          <li>If you only see your Gmail account, you may need to create a YouTube channel first</li>
                        </ul>
                      </div>
                      
                      <div className="space-y-2">
                        <h3 className="font-medium">Step 2: Creating a YouTube Channel (if needed)</h3>
                        <ul className="list-disc pl-5 space-y-1 text-sm">
                          <li>Visit <a href="https://www.youtube.com" target="_blank" className="text-blue-500 underline">YouTube.com</a></li>
                          <li>Sign in with your Google account</li>
                          <li>Click on your profile picture → Create a channel</li>
                          <li>Follow the prompts to complete channel creation</li>
                          <li>Return to this page and try again with your new YouTube account</li>
                        </ul>
                      </div>
                    </div>
                    <div className="flex justify-end">
                      <Button onClick={() => setInstructionsOpen(false)}>Close</Button>
                    </div>
                  </DialogContent>
                </Dialog>
                
                <Button
                  onClick={() => login()}
                  disabled={isUploading}
                  className="ml-auto"
                >
                  <Youtube className="mr-2 h-4 w-4" />
                  Sign in with Google
                </Button>
              </>
            ) : (
              <Button
                onClick={uploadToYouTube}
                disabled={isUploading}
                className="ml-auto"
              >
                {isUploading ? 'Uploading...' : 'Upload to YouTube'}
              </Button>
            )}

            <Button
              variant="outline"
              onClick={onClose}
              disabled={isUploading}
            >
              Close
            </Button>
          </div>

          {/* Progress Bar */}
          {isUploading && (
            <div className="space-y-2">
              <Progress value={uploadProgress} />
              <p className="text-sm text-center text-muted-foreground">
                Uploading to YouTube: {uploadProgress}%
              </p>
            </div>
          )}
        </CardContent>
      </Card>
      
      {/* Success Modal */}
      <Dialog open={successModalOpen} onOpenChange={setSuccessModalOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-center text-xl">Upload Successful! 🎉</DialogTitle>
          </DialogHeader>
          <div className="flex flex-col items-center justify-center space-y-6 py-6">
            <div className="text-center space-y-2">
              <p className="text-lg">Your video has been uploaded to YouTube</p>
              <p className="text-sm text-muted-foreground">It's available as an unlisted video on your channel</p>
            </div>
            
            <div className="w-full p-4 bg-muted rounded-md">
              <p className="font-medium mb-2">Video Link:</p>
              <a 
                href={`https://youtu.be/${videoId}`} 
                target="_blank"
                rel="noopener noreferrer" 
                className="text-blue-500 hover:text-blue-700 hover:underline flex items-center justify-center gap-2 p-3 bg-card rounded border border-border"
              >
                <Youtube className="h-5 w-5" />
                https://youtu.be/{videoId}
              </a>
            </div>
            
            <div className="flex gap-4">
              <Button 
                onClick={() => {
                  navigator.clipboard.writeText(`https://youtu.be/${videoId}`);
                  toast({
                    title: "Link copied",
                    description: "YouTube URL copied to clipboard",
                    duration: 3000,
                  });
                }}
                variant="outline"
              >
                Copy Link
              </Button>
              <Button 
                onClick={() => window.open(`https://youtu.be/${videoId}`, '_blank')}
              >
                Open Video
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}