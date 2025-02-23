import { useState } from "react"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Pin, Star, Clock } from "lucide-react"
import { Button } from "@/components/ui/button"
import { format } from "date-fns"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { ScrollArea } from "@/components/ui/scroll-area"
import MockInterviewModal from "./MockInterviewModal"
import ViewCompleteMockInterviewModal from "./ViewCompleteMockInterviewModal"

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

interface ImageGalleryProps {
  images: ImageData[]
  filter: string
  onFilterChange: (filter: string) => void
  onToggleFavorite: (index: number) => void
  onCompleteInterview: (index: number, videoUrl: string) => void
}

const COMPLEXITY_STYLES: Record<ComplexityLevel, {
  background: string;
  border: string;
  text: string;
  badge: string;
}> = {
  'Easy': {
    background: 'bg-blue-50 hover:bg-blue-100',
    border: 'border-blue-200',
    text: 'text-blue-700',
    badge: 'bg-blue-100 text-blue-800'
  },
  'Medium': {
    background: 'bg-purple-50 hover:bg-purple-100',
    border: 'border-purple-200',
    text: 'text-purple-700',
    badge: 'bg-purple-100 text-purple-800'
  },
  'Hard': {
    background: 'bg-orange-50 hover:bg-orange-100',
    border: 'border-orange-200',
    text: 'text-orange-700',
    badge: 'bg-orange-100 text-orange-800'
  }
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

  // Sort images based on the active tab
  const sortedImages = [...images].sort((a, b) => {
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

  const handleImageClick = (index: number) => {
    const image = filteredImages[index]
    const originalIndex = images.findIndex(img => img === image)

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

  const renderImages = (imagesToRender: ImageData[]) => (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 p-4">
      {imagesToRender.map((image, index) => {
        // Ensure complexity is a valid value, default to 'Easy' if not
        const complexity = image.complexity && ['Easy', 'Medium', 'Hard'].includes(image.complexity)
          ? image.complexity
          : 'Easy'
        const styles = COMPLEXITY_STYLES[complexity]

        return (
          <div
            key={index}
            className={`relative group cursor-pointer rounded-lg border-2 overflow-hidden transition-all duration-200 
              ${styles.background} ${styles.border} hover:shadow-lg`}
            onClick={() => handleImageClick(index)}
          >
            <div className="p-4">
              {/* Header with Category and Complexity */}
              <div className="mb-4">
                <div className="flex items-center justify-between">
                  <span className={`px-3 py-1 rounded-full text-sm font-medium ${styles.badge}`}>
                    {complexity}
                  </span>
                  {image.isCompleted && (
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-8 w-8 p-0"
                      onClick={(e) => {
                        e.stopPropagation()
                        const originalIndex = images.findIndex(img => img === image)
                        onToggleFavorite(originalIndex)
                      }}
                    >
                      <Star
                        className={`h-5 w-5 ${image.isFavorite ? "fill-yellow-400 text-yellow-400" : "text-gray-400"
                          }`}
                      />
                    </Button>
                  )}
                </div>
                <h3 className={`font-semibold text-lg ${styles.text} mt-3`}>
                  {image.category}
                </h3>
              </div>

              {/* Status Badge */}
              <div className="mb-4">
                <span className={`px-2 py-1 text-xs font-medium rounded-full
                  ${image.isCompleted
                    ? 'bg-green-100 text-green-800'
                    : 'bg-blue-100 text-blue-800'
                  }`}
                >
                  {image.isCompleted ? 'Completed' : 'Ready to Start'}
                </span>
              </div>

              {/* Dates */}
              <div className="space-y-2 text-sm text-gray-600">
                <div className="flex items-center">
                  <Clock className="w-4 h-4 mr-2" />
                  <span>Created: {format(image.createdAt, "MMM d, yyyy")}</span>
                </div>
                {image.completedAt && (
                  <div className="flex items-center">
                    <Clock className="w-4 h-4 mr-2" />
                    <span>Completed: {format(image.completedAt, "MMM d, yyyy")}</span>
                  </div>
                )}
              </div>
            </div>
          </div>
        )
      })}
    </div>
  )

  return (
    <div className="flex flex-col h-full">
      <div className="flex justify-between items-center p-4 border-b">
        <h2 className="text-lg font-semibold">Success Vault</h2>
        {/* <Select value={filter} onValueChange={onFilterChange}>
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
        </Select> */}
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
          <TabsContent value="new" className="m-0">
            {newImages.length > 0 ? (
              renderImages(filteredImages)
            ) : (
              <Alert>
                <AlertTitle>No pending interviews</AlertTitle>
                <AlertDescription>Please use the AI INTERVIEW ASSISTANT to generate interviews.</AlertDescription>
              </Alert>
            )}
          </TabsContent>
          <TabsContent value="completed" className="m-0">
            {completedImages.length > 0 ? (
              renderImages(filteredImages)
            ) : (
              <Alert>
                <AlertTitle>No completed interviews</AlertTitle>
                <AlertDescription>Complete a mock interview to see it here.</AlertDescription>
              </Alert>
            )}
          </TabsContent>
          <TabsContent value="favorites" className="m-0">
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
          category={images[selectedImageIndex].category}     // Add this
          complexity={images[selectedImageIndex].complexity} // Add this
        />
      )}

{showCompletedInterview && selectedImageIndex !== null && (
  <ViewCompleteMockInterviewModal
    onClose={handleCloseModal}
    videoUrl={images[selectedImageIndex].videoUrl || ""}
    category={images[selectedImageIndex].category}
    complexity={images[selectedImageIndex].complexity}
  />
)}
    </div>
  )
}