"use client"

import { useState } from "react"
import Chat from "@/components/Chat"
import ImageGallery from "@/components/ImageGallery"
import { useToast } from "@/hooks/use-toast"  // Update this import
import { chatbotFlow } from "@/utils/chatbotFlow"

interface ImageData {
  url: string
  createdAt: Date
  isFavorite: boolean
  isCompleted: boolean
  videoUrl?: string
  questionSetId?: string
}

export default function ChatPage() {
  const [images, setImages] = useState<ImageData[]>([])
  const [filter, setFilter] = useState<string>("all")
  const { toast } = useToast()  // Use the hook

  // console.log("Chatbot flow loaded:", chatbotFlow)

  const addImage = async (prompt: string, questionSetId?: string) => {
    console.log("Adding image with prompt:", prompt, "questionSetId:", questionSetId)

    try {
      // Simulate image generation delay
      await new Promise(resolve => setTimeout(resolve, 3000))

      const newImage = `./placeholder.svg?height=300&width=300&text=${encodeURIComponent(prompt)}`

      if (!questionSetId) {
        console.warn("No questionSetId provided for image generation")
      }

      const newImageData: ImageData = {
        url: newImage,
        createdAt: new Date(),
        isFavorite: false,
        isCompleted: false,
        questionSetId: questionSetId
      }

      setImages(prev => [...prev, newImageData])
      return newImage

    } catch (error) {
      console.error("Error adding image:", error)
      toast({
        title: "Error",
        description: "Failed to generate image. Please try again.",
        variant: "destructive"
      })
      throw error
    }
  }

  const toggleFavorite = (index: number) => {
    setImages(prev => {
      const newImages = [...prev]
      const currentFavorites = newImages.filter(img => img.isFavorite && img.isCompleted).length

      if (!newImages[index].isFavorite && currentFavorites >= 10) {
        toast({
          title: "Favorite limit reached",
          description: "You can only have up to 10 favorite interviews. Please remove a favorite before adding a new one."
        })
        return newImages
      }

      newImages[index] = { ...newImages[index], isFavorite: !newImages[index].isFavorite }
      return newImages
    })
  }

  const completeInterview = (index: number, videoUrl: string) => {
    console.log("completeInterview called in page with index:", index, "videoUrl:", videoUrl);
  
    if (index < 0 || index >= images.length) {
      console.error("Invalid image index:", index);
      return;
    }
  
    const image = images[index];
    if (image.isCompleted) {
      console.warn("Interview already completed");
      return;
    }
  
    setImages(prev => {
      const newImages = [...prev];
      newImages[index] = {
        ...newImages[index],
        isCompleted: true,
        videoUrl: videoUrl // Store the full blob URL
      };
      return newImages;
    });
  };

  return (
    <div className="container mx-auto px-2 py-4 h-[calc(100vh-4rem)] flex flex-col">
      {/* <h1 className="text-2xl font-bold mb-4">AI Image Chat</h1> */}
      <div className="flex-1 grid grid-cols-10 gap-4 overflow-hidden">
        <div className="col-span-4 border rounded-lg overflow-hidden">
          <Chat
            onSendMessage={console.log}
            onGenerateImage={(prompt, questionSetId) => {
              console.log("Generating image with questionSetId:", questionSetId)
              return addImage(prompt, questionSetId)
            }}
          />
        </div>
        <div className="col-span-6 border rounded-lg overflow-hidden">
          <ImageGallery
            images={images}
            filter={filter}
            onFilterChange={setFilter}
            onToggleFavorite={toggleFavorite}
            onCompleteInterview={completeInterview}
          />
        </div>
      </div>
    </div>
  )
}

