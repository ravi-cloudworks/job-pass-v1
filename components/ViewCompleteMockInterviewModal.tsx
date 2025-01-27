import React from "react"
import { motion } from "framer-motion"
import { Button } from "@/components/ui/button"
import { X, Download } from "lucide-react"
import { useToast } from "@/components/ui/toast"

interface ViewCompleteMockInterviewModalProps {
  onClose: () => void
  videoUrl: string
}

export default function ViewCompleteMockInterviewModal({ onClose, videoUrl }: ViewCompleteMockInterviewModalProps) {
  const { addToast } = useToast()

  const handleDownload = () => {
    try {
      // Create a download link
      const link = document.createElement('a');
      link.href = videoUrl; // This should now be a blob URL
      link.download = `mock-interview-${Date.now()}.webm`;

      // Trigger download
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      addToast({
        title: "Download Started",
        description: "Your interview video is being downloaded."
      });
    } catch (error) {
      console.error("Download error:", error);
      addToast({
        title: "Download Failed",
        description: "Failed to download the video. Please try again."
      });
    }
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-background/80 backdrop-blur-sm z-50 flex items-center justify-center"
    >
      <div className="bg-background p-8 rounded-lg shadow-lg w-[90vw] h-[90vh] flex flex-col">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-3xl font-bold">Completed Mock Interview</h2>
          <Button variant="ghost" size="icon" onClick={onClose}>
            <X className="h-6 w-6" />
          </Button>
        </div>
        <div className="flex-grow flex flex-col">
          {videoUrl ? (
            <video 
              src={videoUrl} 
              controls 
              className="w-full h-full max-h-[calc(100%-4rem)] object-contain bg-black rounded-lg"
            >
              Your browser does not support the video tag.
            </video>
          ) : (
            <div className="flex items-center justify-center h-full">
              <p>Video not available</p>
            </div>
          )}
          <div className="flex justify-end space-x-4 mt-4">
            <Button onClick={handleDownload} variant="secondary" disabled={!videoUrl}>
              <Download className="mr-2 h-4 w-4" /> Download
            </Button>
          </div>
        </div>
      </div>
    </motion.div>
  )
}