import { X } from "lucide-react"
import { Button } from "@/components/ui/button"

interface ImageViewerProps {
  image: string
  onClose: () => void
}

export default function ImageViewer({ image, onClose }: ImageViewerProps) {
  return (
    <div className="fixed inset-0 bg-background/80 backdrop-blur-sm z-50 flex items-center justify-center">
      <div className="relative max-w-3xl max-h-[90vh] overflow-auto">
        <Button
          variant="ghost"
          size="icon"
          className="absolute top-2 right-2 text-foreground bg-background/50 rounded-full"
          onClick={onClose}
        >
          <X className="h-4 w-4" />
          <span className="sr-only">Close</span>
        </Button>
        <img src={image || "/placeholder.svg"} alt="Full size" className="max-w-full max-h-full object-contain" />
      </div>
    </div>
  )
}

