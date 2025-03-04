import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { format } from "date-fns"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Star, Clock, FileCheck, ArrowRight, Youtube } from "lucide-react"
import { motion } from "framer-motion"
import MockInterviewModal from "./MockInterviewModal"
import ViewMockInterviewModal from "./ViewMockInterviewModal"

type ComplexityLevel = 'Easy' | 'Medium' | 'Hard';

interface ImageData {
  url: string
  createdAt: Date
  completedAt?: Date
  isFavorite: boolean
  isCompleted: boolean
  videoUrl?: string
  questionSetId?: string
  complexity: ComplexityLevel
  category: string
}


interface InterviewVaultProps {
  images: ImageData[]
  filter: string
  onFilterChange: (filter: string) => void
  onToggleFavorite: (index: number) => void
  onCompleteInterview: (index: number, videoUrl: string) => void
  onUpdateImage?: (index: number, updatedData: Partial<ImageData>) => void
}

export default function InterviewVault({
  images,
  filter,
  onFilterChange,
  onToggleFavorite,
  onCompleteInterview,
  onUpdateImage
}: InterviewVaultProps) {
  const [activeTab, setActiveTab] = useState<"new" | "completed" | "favorites">("new")
  const [selectedImageIndex, setSelectedImageIndex] = useState<number | null>(null)
  const [showCompletedInterview, setShowCompletedInterview] = useState(false)
  const [showMockInterview, setShowMockInterview] = useState(false)
  const [localImages, setLocalImages] = useState<ImageData[]>(images)
  
  // Update local state when prop changes
  useEffect(() => {
    setLocalImages(images);
  }, [images])

  // Sort images based on the active tab
  const sortedImages = [...localImages].sort((a, b) => {
    if (activeTab === "completed" && a.completedAt && b.completedAt) {
      return b.completedAt.getTime() - a.completedAt.getTime()
    }
    return b.createdAt.getTime() - a.createdAt.getTime()
  })

  const newImages = sortedImages.filter((img) => !img.isCompleted)
  const completedImages = sortedImages.filter((img) => img.isCompleted)
  const favoriteImages = sortedImages.filter((img) => img.isFavorite && img.isCompleted)

  const filteredImages =
    filter === "all"
      ? activeTab === "new"
        ? newImages
        : activeTab === "completed"
          ? completedImages
          : favoriteImages
      : (activeTab === "new" ? newImages : activeTab === "completed" ? completedImages : favoriteImages).filter((img) =>
        img.url.includes(filter),
      )

  // Determines if a video URL is a YouTube URL (either directly or part of a combined URL)
  const isYouTubeVideo = (videoUrl?: string) => {
    if (!videoUrl) return false;
    
    // If it's a combined URL format (blob|youtube)
    if (videoUrl.includes('|')) {
      const parts = videoUrl.split('|');
      return parts.length > 1 && parts[1].includes('youtu');
    }
    
    // Direct YouTube URL
    return videoUrl.includes('youtu');
  };
  
  // Helper to get clean URL for display/reopening
  const getCleanVideoUrl = (videoUrl?: string) => {
    if (!videoUrl) return "";
    
    // If this is a reopened interview with combined URL, use only YouTube part
    if (videoUrl.includes('|')) {
      const [blobUrl, youtubeUrl] = videoUrl.split('|');
      // When reopening from vault, prefer YouTube URL if available
      return youtubeUrl || blobUrl;
    }
    
    return videoUrl;
  };

  const handleImageClick = (index: number) => {
    const image = filteredImages[index]
    const originalIndex = localImages.findIndex(img => img === image)

    if (image.isCompleted) {
      setSelectedImageIndex(originalIndex)
      setShowCompletedInterview(true)
      setShowMockInterview(false)
    } else if (image.questionSetId) {
      setSelectedImageIndex(originalIndex)
      setShowMockInterview(true)
      setShowCompletedInterview(false)
    }
  }

  const handleCloseModal = () => {
    setSelectedImageIndex(null)
    setShowCompletedInterview(false)
    setShowMockInterview(false)
  }

  const handleCompleteInterview = (videoUrl: string) => {
    if (selectedImageIndex !== null) {
      onCompleteInterview(selectedImageIndex, videoUrl)
      handleCloseModal()
    }
  }
  
  const handleYoutubeUploadSuccess = (localUrl: string, youtubeUrl: string, youtubeId: string) => {
    console.log('5. InterviewVault - handleYoutubeUploadSuccess called with:', {
      localUrl,
      youtubeUrl,
      youtubeId,
      selectedImageIndex
    });
    
    if (selectedImageIndex !== null && onUpdateImage) {
      console.log('6. InterviewVault - Before update, current state:', {
        currentVideoUrl: localImages[selectedImageIndex].videoUrl,
        isYouTube: localImages[selectedImageIndex].videoUrl?.includes('youtu')
      });
      
      // Create combined URL with both blob and YouTube URLs
      const combinedUrl = `${localUrl}|${youtubeUrl}`;
      
      // Update local state immediately
      const updatedImages = [...localImages];
      updatedImages[selectedImageIndex] = {
        ...updatedImages[selectedImageIndex],
        videoUrl: combinedUrl
      };
      
      console.log('7. InterviewVault - Setting local images with new videoUrl:', combinedUrl);
      setLocalImages(updatedImages);
      
      // Update the image with YouTube information via parent component
      console.log('8. InterviewVault - Calling onUpdateImage to update parent state');
      onUpdateImage(selectedImageIndex, {
        videoUrl: combinedUrl
      });
      
      console.log('9. InterviewVault - YouTube upload success handling complete');
    }
  }

  // Get complexity star rating
  const getComplexityStars = (complexity: ComplexityLevel) => {
    switch(complexity) {
      case 'Easy': return '⭐';
      case 'Medium': return '⭐⭐';
      case 'Hard': return '⭐⭐⭐';
      default: return '⭐';
    }
  }

  const renderImages = (imagesToRender: ImageData[]) => (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 p-4">
      {imagesToRender.map((image, index) => {
        const complexity = image.complexity || 'Easy';
        const hasYouTube = isYouTubeVideo(image.videoUrl);

        return (
          <motion.div
            key={index}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, ease: [0.4, 0, 0.2, 1] }}
            className="flex flex-col"
          >
            <div
              className="relative rounded-lg border border-gray-200 shadow-sm bg-white hover:shadow-md hover:border-primary/20 transition-all duration-200 cursor-pointer overflow-hidden"
              onClick={() => handleImageClick(index)}
            >
              <div className="p-4">
                {/* Header */}
                <div className="flex items-start justify-between mb-3">
                  <div className="flex flex-col">
                    <span className="text-xs font-medium text-gray-500 mb-1">
                      {getComplexityStars(complexity)} {complexity}
                    </span>
                    <h3 className="font-medium text-lg text-foreground line-clamp-2">
                      {image.category}
                    </h3>
                  </div>
                  
                  {image.isCompleted && (
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-8 w-8 p-0 rounded-full"
                      onClick={(e) => {
                        e.stopPropagation()
                        const originalIndex = localImages.findIndex(img => img === image)
                        onToggleFavorite(originalIndex)
                      }}
                    >
                      <Star
                        className={`h-4 w-4 ${image.isFavorite ? "fill-yellow-400 text-yellow-400" : "text-gray-400"}`}
                      />
                    </Button>
                  )}
                </div>
                
                {/* Status */}
                <div className="mb-3">
                  {image.isCompleted ? (
                    <div className="flex items-center font-medium text-xs">
                      {hasYouTube ? (
                        <div className="flex items-center text-red-600">
                          <Youtube className="w-3.5 h-3.5 mr-1" />
                          <span>Private Video</span>
                        </div>
                      ) : (
                        <div className="flex items-center text-green-600">
                          <FileCheck className="w-3.5 h-3.5 mr-1" />
                          <span>Completed</span>
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="flex items-center text-primary font-medium text-xs">
                      <ArrowRight className="w-3.5 h-3.5 mr-1" />
                      <span>Ready to start</span>
                    </div>
                  )}
                </div>

                {/* Dates */}
                <div className="space-y-1.5 text-xs text-muted-foreground">
                  <div className="flex items-center">
                    <Clock className="w-3 h-3 mr-1.5" />
                    <span>Created: {format(image.createdAt, "MMM d, yyyy")}</span>
                  </div>
                  {image.completedAt && (
                    <div className="flex items-center">
                      <Clock className="w-3 h-3 mr-1.5" />
                      <span>Completed: {format(image.completedAt, "MMM d, yyyy")}</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Call-to-action footer */}
              <div className={`px-4 py-2 text-xs font-medium ${
                image.isCompleted 
                  ? hasYouTube
                    ? "bg-red-50 text-red-700"
                    : "bg-green-50 text-green-700" 
                  : "bg-blue-50 text-primary"
              }`}>
                {image.isCompleted 
                  ? hasYouTube 
                    ? "View Recording" 
                    : "View Recording" 
                  : "Start Interview"
                }
              </div>
            </div>
          </motion.div>
        )
      })}
    </div>
  )

  return (
    <div className="flex flex-col h-full bg-background">
      <div className="py-3 px-4 border-b">
        <h2 className="text-lg font-semibold">Assessment Vault</h2>
      </div>
      <Tabs
        value={activeTab}
        onValueChange={(value) => setActiveTab(value as "new" | "completed" | "favorites")}
        className="flex-1 flex flex-col"
      >
        <TabsList className="grid w-full grid-cols-3 px-4 py-2">
          <TabsTrigger value="new">New</TabsTrigger>
          <TabsTrigger value="completed">Completed</TabsTrigger>
          <TabsTrigger value="favorites">Favorites</TabsTrigger>
        </TabsList>
        <ScrollArea className="flex-1">
          <TabsContent value="new" className="m-0">
            {newImages.length > 0 ? (
              renderImages(filteredImages)
            ) : (
              <Alert className="m-4 border-primary/20 bg-primary/5">
                <AlertTitle>No pending interviews</AlertTitle>
                <AlertDescription>Please use the AI INTERVIEW ASSISTANT to generate interviews.</AlertDescription>
              </Alert>
            )}
          </TabsContent>
          <TabsContent value="completed" className="m-0">
            {completedImages.length > 0 ? (
              renderImages(filteredImages)
            ) : (
              <Alert className="m-4 border-primary/20 bg-primary/5">
                <AlertTitle>No completed interviews</AlertTitle>
                <AlertDescription>Complete a mock interview to see it here.</AlertDescription>
              </Alert>
            )}
          </TabsContent>
          <TabsContent value="favorites" className="m-0">
            {favoriteImages.length > 0 ? (
              renderImages(filteredImages)
            ) : (
              <Alert className="m-4 border-primary/20 bg-primary/5">
                <AlertTitle>No favorites yet</AlertTitle>
                <AlertDescription>Star your favorite completed interviews to see them here.</AlertDescription>
              </Alert>
            )}
          </TabsContent>
        </ScrollArea>
      </Tabs>

      {showMockInterview && selectedImageIndex !== null && !showCompletedInterview && (
        <MockInterviewModal
          onClose={handleCloseModal}
          onComplete={handleCompleteInterview}
          questionSetId={localImages[selectedImageIndex].questionSetId}
          category={localImages[selectedImageIndex].category}
          complexity={localImages[selectedImageIndex].complexity}
        />
      )}

      {showCompletedInterview && selectedImageIndex !== null && (
        <ViewMockInterviewModal
          onClose={handleCloseModal}
          videoUrl={localImages[selectedImageIndex].videoUrl || ""}
          category={localImages[selectedImageIndex].category}
          complexity={localImages[selectedImageIndex].complexity}
          onUploadSuccess={handleYoutubeUploadSuccess}
        />
      )}
    </div>
  )
}