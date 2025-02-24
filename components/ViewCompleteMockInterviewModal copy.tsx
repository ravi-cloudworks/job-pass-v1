import React, { useState } from 'react';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { useGoogleLogin } from '@react-oauth/google';
import { google } from 'googleapis';
import { Youtube } from 'lucide-react';

// Replace with your Client ID from Google Cloud Console
const CLIENT_ID = 'your-client-id';

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

  // Google Login handler
  const login = useGoogleLogin({
    onSuccess: async (tokenResponse) => {
      setAccessToken(tokenResponse.access_token);
      setIsAuthenticated(true);
      toast({
        title: "Successfully logged in",
        description: "You can now upload to YouTube",
      });
    },
    onError: () => {
      toast({
        title: "Login Failed",
        description: "Could not login to Google",
        variant: "destructive",
      });
    },
    scope: 'https://www.googleapis.com/auth/youtube.upload',
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
      setUploadProgress(0);

      // Create YouTube client
      const youtube = google.youtube('v3');
      const oauth2Client = new google.auth.OAuth2();
      oauth2Client.setCredentials({ access_token: accessToken });

      // Get the video file
      const response = await fetch(videoUrl);
      const blob = await response.blob();
      const videoFile = new File([blob], 'interview.webm', { type: 'video/webm' });

      // Prepare the upload
      const res = await youtube.videos.insert({
        auth: oauth2Client,
        part: ['snippet', 'status'],
        requestBody: {
          snippet: {
            title: `Mock Interview - ${new Date().toLocaleDateString()}`,
            description: `Interview Category: ${category}\nComplexity: ${complexity}`,
            tags: ['mock interview']
          },
          status: {
            privacyStatus: 'unlisted'
          }
        },
        media: {
          body: videoFile
        }
      }, {
        onUploadProgress: (e) => {
          const progress = Math.round((e.bytesRead / videoFile.size) * 100);
          setUploadProgress(progress);
        }
      });

      if (res.data.id) {
        const videoUrl = `https://youtu.be/${res.data.id}`;
        toast({
          title: "Upload Successful",
          description: "Your video has been uploaded to YouTube",
        });
        // You might want to pass this URL back to parent component
        onClose();
      }

    } catch (error) {
      console.error('Upload error:', error);
      toast({
        title: "Upload Failed",
        description: "Could not upload video to YouTube",
        variant: "destructive",
      });
    } finally {
      setIsUploading(false);
      setUploadProgress(0);
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
            {!isAuthenticated ? (
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