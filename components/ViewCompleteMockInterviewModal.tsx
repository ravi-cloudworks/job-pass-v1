import React from "react"
import { motion } from "framer-motion"
import { Button } from "@/components/ui/button"
import { X, Download, Share2 } from "lucide-react"
import { useToast } from "@/hooks/use-toast"

interface ViewCompleteMockInterviewModalProps {
  onClose: () => void
  videoUrl: string
  category?: string
  complexity?: string
}

export default function ViewCompleteMockInterviewModal({ 
  onClose, 
  videoUrl,
  category,
  complexity 
}: ViewCompleteMockInterviewModalProps) {
  const { toast } = useToast()

  const handleDownload = () => {
    try {
      const link = document.createElement('a');
      link.href = videoUrl;
      link.download = `mock-interview-${Date.now()}.webm`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      toast({
        title: "Download Started",
        description: "Your interview video is being downloaded."
      });
    } catch (error) {
      console.error("Download error:", error);
      toast({
        title: "Download Failed",
        description: "Failed to download the video. Please try again."
      });
    }
  }

  const handleShare = async () => {
    try {
      if (navigator.share) {
        await navigator.share({
          title: 'Mock Interview Recording',
          text: 'Check out my mock interview recording',
          url: videoUrl
        });
      } else {
        // Fallback - copy to clipboard
        await navigator.clipboard.writeText(videoUrl);
        toast({
          title: "Link Copied",
          description: "Video link copied to clipboard"
        });
      }
    } catch (error) {
      console.error("Share error:", error);
      toast({
        title: "Share Failed",
        description: "Unable to share the video"
      });
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-background/80 backdrop-blur-sm z-50 flex items-center justify-center"
    >
      <div className="bg-background p-6 rounded-lg shadow-lg w-[85vw] h-[85vh] flex flex-col">
        {/* Header */}
        <div className="flex flex-col mb-4">
          <div className="flex justify-between items-start">
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-2">
                {category && (
                  <span className="text-sm font-medium px-2 py-1 rounded-full bg-blue-100 text-blue-800">
                    {category}
                  </span>
                )}
                {complexity && (
                  <span className="text-sm font-medium px-2 py-1 rounded-full bg-blue-100 text-blue-800">
                    {complexity}
                  </span>
                )}
              </div>
              <h2 className="text-2xl font-bold">Interview Recording</h2>
            </div>
            <Button variant="ghost" size="icon" onClick={onClose}>
              <X className="h-5 w-5" />
            </Button>
          </div>
        </div>

        {/* Video Player */}
        <div className="flex-grow bg-black rounded-lg overflow-hidden relative">
          {videoUrl ? (
            <video 
              src={videoUrl} 
              controls 
              className="w-full h-full"
            >
              Your browser does not support the video tag.
            </video>
          ) : (
            <div className="flex items-center justify-center h-full text-white">
              <p>Video not available</p>
            </div>
          )}
        </div>

        {/* Action Buttons */}
        <div className="flex justify-end items-center space-x-3 mt-4">
          <Button 
            variant="outline"
            onClick={handleShare}
            disabled={!videoUrl}
            className="gap-2"
          >
            <Share2 className="h-4 w-4" />
            Share
          </Button>
          <Button 
            variant="default"
            onClick={handleDownload}
            disabled={!videoUrl}
            className="gap-2"
          >
            <Download className="h-4 w-4" />
            Download Recording
          </Button>
        </div>
      </div>
    </motion.div>
  )
}