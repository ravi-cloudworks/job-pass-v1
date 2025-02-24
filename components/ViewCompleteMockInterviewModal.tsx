'use client';

import React, { useState } from 'react';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { useGoogleLogin } from '@react-oauth/google';
import { Youtube } from 'lucide-react';

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

  // Google Login handler
  const login = useGoogleLogin({
    onSuccess: async (tokenResponse) => {
      console.log('Login Success:', tokenResponse);
      setAccessToken(tokenResponse.access_token);
      setIsAuthenticated(true);
      toast({
        title: "Successfully logged in",
        description: "You can now upload to YouTube",
      });
    },
    onError: (error) => {
      console.error('Login Failed:', error);
      toast({
        title: "Login Failed",
        description: "Could not login to Google",
        variant: "destructive",
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
            description: "Please visit YouTube.com to create your channel first, then try again.",
            variant: "destructive",
          });
          window.open('https://www.youtube.com', '_blank');
          return;
        }
        
        throw new Error(`Upload failed: ${uploadResponse.status} ${errorText}`);
      }

      const result = await uploadResponse.json();

      if (result.id) {
        setVideoId(result.id);
        toast({
          title: "Upload Successful",
          description: "Your video has been uploaded to YouTube"
        });
      } else {
        throw new Error(result.error?.message || "Upload failed");
      }
    } catch (error) {
      console.error('Upload error:', error);
      toast({
        title: "Upload Failed",
        description: `${(error as Error)?.message || "Could not upload to YouTube"}`,
        variant: "destructive"
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
                <div className="mr-auto text-sm text-muted-foreground">
                  Video uploaded successfully!
                </div>
                <Button
                  onClick={() => window.open(`https://youtu.be/${videoId}`, '_blank')}
                  className="ml-auto"
                >
                  Open on YouTube
                </Button>
              </>
            ) : !isAuthenticated ? (
              <Button
                onClick={() => login()}
                disabled={isUploading}
                className="ml-auto"
              >
                <Youtube className="mr-2 h-4 w-4" />
                Sign in with Google
              </Button>
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
    </div>
  );
}