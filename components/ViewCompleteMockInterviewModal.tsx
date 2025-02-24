'use client'

import React, { useState } from 'react';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
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
  const [accessToken, setAccessToken] = useState<string | null>(null);

  // Google Login handler
  const login = useGoogleLogin({
    onSuccess: async (tokenResponse) => {
      console.log('Login Success:', tokenResponse);
      setAccessToken(tokenResponse.access_token);
      setIsAuthenticated(true);
      toast({
        title: "Successfully logged in",
        description: "Google authentication successful",
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
    scope: 'https://www.googleapis.com/auth/youtube.upload'
  });

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
            <Button 
              onClick={() => login()}
              className="ml-auto"
            >
              <Youtube className="mr-2 h-4 w-4" />
              {isAuthenticated ? 'Connected to YouTube' : 'Sign in with Google'}
            </Button>

            <Button
              variant="outline"
              onClick={onClose}
            >
              Close
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}