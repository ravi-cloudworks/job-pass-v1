import { X } from "lucide-react"
import { Button } from "@/components/ui/button"

interface QRCodeViewerProps {
  qrUrl: string
  onClose: () => void
}

export default function QRCodeViewer({ qrUrl, onClose }: QRCodeViewerProps) {
  return (
    <div className="fixed inset-0 bg-background/80 backdrop-blur-sm z-50 flex items-center justify-center">
      <div className="relative bg-background p-8 rounded-lg shadow-lg">
        <Button variant="ghost" size="icon" className="absolute top-2 right-2" onClick={onClose}>
          <X className="h-4 w-4" />
          <span className="sr-only">Close</span>
        </Button>
        <div className="flex flex-col items-center gap-4">
          <img src={qrUrl || "./placeholder.svg"} alt="Payment QR Code" className="w-64 h-64" />
          <p className="text-center text-muted-foreground">Scan this QR code to add more credits</p>
        </div>
      </div>
    </div>
  )
}

