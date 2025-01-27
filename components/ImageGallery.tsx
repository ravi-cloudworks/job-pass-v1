import { useState } from "react"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Pin, Star } from "lucide-react"
import { Button } from "@/components/ui/button"
import { format } from "date-fns"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { ScrollArea } from "@/components/ui/scroll-area"
import MockInterviewModal from "./MockInterviewModal"
import ViewCompleteMockInterviewModal from "./ViewCompleteMockInterviewModal"

import { useToast } from "@/hooks/use-toast"  // Update this import


interface ImageData {
  url: string
  createdAt: Date
  isFavorite: boolean
  isCompleted: boolean
  videoUrl?: string
  questionSetId?: string
}

interface ImageGalleryProps {
  images: ImageData[]
  filter: string
  onFilterChange: (filter: string) => void
  onToggleFavorite: (index: number) => void
  onCompleteInterview: (index: number, videoUrl: string) => void  // Modified to accept videoUrl
}

export default function ImageGallery({
  images,
  filter,
  onFilterChange,
  onToggleFavorite,
  onCompleteInterview,
}: ImageGalleryProps) {
  const filterOptions = ["all", "landscape", "portrait", "abstract"]
  const [activeTab, setActiveTab] = useState<"new" | "completed" | "favorites">("new")
  const [selectedImageIndex, setSelectedImageIndex] = useState<number | null>(null)
  const [showCompletedInterview, setShowCompletedInterview] = useState(false)
  const [showMockInterview, setShowMockInterview] = useState(false)

  const newImages = images.filter((img) => !img.isCompleted)
  const completedImages = images.filter((img) => img.isCompleted)
  const favoriteImages = images.filter((img) => img.isFavorite && img.isCompleted)

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

  const handleImageClick = (index: number) => {
 const image = filteredImages[index];
 const originalIndex = images.findIndex(img => img === image);
 
 if (image.isCompleted) {
   setSelectedImageIndex(originalIndex);
   setShowCompletedInterview(true);
   setShowMockInterview(false);
 } else if (image.questionSetId) {
   setSelectedImageIndex(originalIndex);
   setShowMockInterview(true);
   setShowCompletedInterview(false);
 }
};

const handleCloseModal = () => {
 setSelectedImageIndex(null);
 setShowCompletedInterview(false);
 setShowMockInterview(false);
};

const handleCompleteInterview = (videoUrl: string) => {  // Add videoUrl parameter
  if (selectedImageIndex !== null) {
    onCompleteInterview(selectedImageIndex, videoUrl);  // Pass videoUrl to parent
    handleCloseModal();
  }
};

  const renderImages = (imagesToRender: ImageData[]) => (
    <div className="grid grid-cols-3 gap-2">
      {imagesToRender.map((image, index) => (
        <div key={index} className="relative group">
          <img
            src={image.url || "./placeholder.svg"}
            alt={`Generated image ${index + 1}`}
            className="w-full h-auto rounded-lg cursor-pointer"
            onClick={() => handleImageClick(index)}
          />
          {image.isCompleted && (
            <div className="absolute top-2 right-2 flex space-x-2">
              <Button
                variant="secondary"
                size="icon"
                className="w-5 h-5 rounded-full p-0"
                onClick={(e) => {
                  e.stopPropagation()
                  const originalIndex = images.findIndex(img => img === image);
                  onToggleFavorite(originalIndex)
                }}
              >
                {image.isFavorite ? (
                  <Star className="h-2.5 w-2.5 fill-yellow-400 text-yellow-400" />
                ) : (
                  <Star className="h-2.5 w-2.5" />
                )}
              </Button>
            </div>
          )}
          <div className="absolute bottom-0 left-0 right-0 flex justify-between items-center text-[10px] text-white bg-black bg-opacity-75 px-1 py-0.5">
            <span>{format(image.createdAt, "MMM d, yy")}</span>
            {image.isFavorite && image.isCompleted && <Pin className="h-2.5 w-2.5 text-yellow-400" />}
          </div>
        </div>
      ))}
    </div>
  );

  return (
    <div className="flex flex-col h-full">
      <div className="flex justify-between items-center p-2 border-b">
        <h2 className="text-lg font-semibold">Your AI Assisted Interviews</h2>
        <Select value={filter} onValueChange={onFilterChange}>
          <SelectTrigger className="w-[120px]">
            <SelectValue placeholder="Filter" />
          </SelectTrigger>
          <SelectContent>
            {filterOptions.map((option) => (
              <SelectItem key={option} value={option}>
                {option.charAt(0).toUpperCase() + option.slice(1)}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      <Tabs
        value={activeTab}
        onValueChange={(value) => setActiveTab(value as "new" | "completed" | "favorites")}
        className="flex-1 flex flex-col"
      >
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="new">New</TabsTrigger>
          <TabsTrigger value="completed">Completed</TabsTrigger>
          <TabsTrigger value="favorites">Favorites</TabsTrigger>
        </TabsList>
        <ScrollArea className="flex-1">
          <TabsContent value="new" className="m-0 p-2">
         {newImages.length > 0 ? (
              renderImages(filteredImages)
            ) : (
              <Alert>
                <AlertTitle>No New interviews</AlertTitle>
                <AlertDescription>Please use the chatbot to generate AI interviews.</AlertDescription>
              </Alert>
            )}
          </TabsContent>
          <TabsContent value="completed" className="m-0 p-2">
            {completedImages.length > 0 ? (
              renderImages(filteredImages)
            ) : (
              <Alert>
                <AlertTitle>No completed interviews</AlertTitle>
                <AlertDescription>Complete a mock interview to see it here.</AlertDescription>
              </Alert>
            )}
          </TabsContent>
          <TabsContent value="favorites" className="m-0 p-2">
            {favoriteImages.length > 0 ? (
              renderImages(filteredImages)
            ) : (
              <Alert>
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
          questionSetId={images[selectedImageIndex].questionSetId}
        />
      )}
      
      {showCompletedInterview && selectedImageIndex !== null && (
        <ViewCompleteMockInterviewModal
          onClose={handleCloseModal}
          videoUrl={images[selectedImageIndex].videoUrl || ""}
        />
      )}
    </div>
  );
}

