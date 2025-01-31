"use client"

import React, { useState, useEffect, useRef } from "react"
import { motion } from "framer-motion"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import { ChevronLeft, ChevronRight, VideoOff, X, Play, CheckSquare, Loader2 } from "lucide-react"
import ReactMarkdown from "react-markdown"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { useToast } from "@/hooks/use-toast"
import html2canvas from 'html2canvas'

// Video configuration constants
const VIDEO_CONFIG = {
  WIDTH: 1280,
  HEIGHT: 720,
  FPS: 30,
  BITRATE: 2500000,
  WEBCAM_SCALE: 0.4,
} as const;

interface MockInterviewModalProps {
  onClose: () => void
  onComplete: (videoUrl: string) => void
  questionSetId?: string
  category?: string
  complexity?: string
}

interface Question {
  id: string
  question: string
}

interface QuestionSet {
  id: string
  title: string
  time_limit: number
  questions: Question[]
}

interface QuestionSnapshot {
  timestamp: number
  imageData: HTMLCanvasElement
  questionIndex: number
}

export default function MockInterviewModal({
  onClose,
  onComplete,
  questionSetId,
  category,
  complexity
}: MockInterviewModalProps) {
  const { toast } = useToast()

  // State management
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0)
  const [isInterviewStarted, setIsInterviewStarted] = useState(false)
  const [isStreaming, setIsStreaming] = useState(false)
  const [timeLeft, setTimeLeft] = useState(0)
  const [questions, setQuestions] = useState<Question[]>([])
  const [title, setTitle] = useState("")
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [isProcessing, setIsProcessing] = useState(false)
  const [processProgress, setProcessProgress] = useState(0)
  const [questionSnapshots, setQuestionSnapshots] = useState<QuestionSnapshot[]>([])
  const [interviewStartTime, setInterviewStartTime] = useState(0)

  // Refs
  const questionContainerRef = useRef<HTMLDivElement>(null)
  const videoRef = useRef<HTMLVideoElement>(null)
  const mediaRecorderRef = useRef<MediaRecorder | null>(null)
  const webcamChunks = useRef<Blob[]>([])
  const streamRef = useRef<MediaStream | null>(null)

  // Initialize camera
  const initializeCamera = async () => {
    setError(null)
    try {
      console.log("Initializing camera preview...")

      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop())
      }
      if (videoRef.current) {
        videoRef.current.srcObject = null
      }

      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          width: { ideal: VIDEO_CONFIG.WIDTH },
          height: { ideal: VIDEO_CONFIG.HEIGHT }
        },
        audio: true
      })

      if (videoRef.current) {
        videoRef.current.srcObject = stream
        streamRef.current = stream

        await new Promise((resolve) => {
          if (videoRef.current) {
            videoRef.current.onloadedmetadata = () => resolve(true)
          }
        })

        setIsStreaming(true)
        setError(null)
        console.log("Camera initialized successfully")
      }
    } catch (err) {
      console.error("Camera preview error:", err)
      setError("Unable to access camera. Please check permissions.")
      setIsStreaming(false)
    }
  }

  // Cleanup function
  const stopWebcam = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop())
      streamRef.current = null
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null
    }
    setIsStreaming(false)
  }

  // Initialize camera on mount
  useEffect(() => {
    initializeCamera()
    return () => {
      stopWebcam()
    }
  }, [])

  // Questions fetch effect
  useEffect(() => {
    if (!questionSetId) {
      setError("No question set ID provided")
      setIsLoading(false)
      return
    }

    const fetchQuestions = async () => {
      try {
        setIsLoading(true)
        const response = await fetch(`./data/mock-interviews/${questionSetId}.json`)
        if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`)

        const data: QuestionSet = await response.json()
        setQuestions(data.questions)
        setTitle(data.title)
        setTimeLeft(data.time_limit)
      } catch (err) {
        console.error("Error loading questions:", err)
        setError("Failed to load interview questions")
      } finally {
        setIsLoading(false)
      }
    }

    fetchQuestions()
  }, [questionSetId])

  // Timer effect
  useEffect(() => {
    let timer: NodeJS.Timeout
    if (isInterviewStarted && timeLeft > 0) {
      timer = setInterval(() => {
        setTimeLeft(prev => prev - 1)
      }, 1000)
    } else if (timeLeft === 0 && isInterviewStarted) {
      handleCompleteInterview()
    }
    return () => clearInterval(timer)
  }, [isInterviewStarted, timeLeft])

  // Take snapshot of question section
  // Take snapshot of question section
  const takeSnapshot = async () => {
    if (!questionContainerRef.current) return null
  
    try {
      // Instead of .content-section, let's target the active question content
      const contentSection = isInterviewStarted 
        ? questionContainerRef.current.querySelector('.text-2xl.font-semibold.flex-grow')
        : questionContainerRef.current.querySelector('.content-section');
  
      if (!(contentSection instanceof HTMLElement)) {
        console.error('Content section not found')
        return null
      }
  
      console.log("Capturing content for question:", currentQuestionIndex) // Debug log
      
      // Set specific dimensions for the capture
      const snapshot = await html2canvas(contentSection, {
        backgroundColor: 'white',
        scale: window.devicePixelRatio || 1,
        width: Math.floor(VIDEO_CONFIG.WIDTH * 0.6), // Make sure width is integer
        height: VIDEO_CONFIG.HEIGHT,
        useCORS: true,
        logging: true // Enable logging for debugging
      })
  
      console.log("Snapshot dimensions:", snapshot.width, "x", snapshot.height) // Debug log
  
      return {
        timestamp: Date.now() - interviewStartTime,
        imageData: snapshot,
        questionIndex: currentQuestionIndex
      }
    } catch (err) {
      console.error("Error taking snapshot:", err)
      return null
    }
  }

  // Start recording
  const startRecording = async () => {
    if (!streamRef.current) return

    setInterviewStartTime(Date.now())

    // Take initial snapshot
    const initialSnapshot = await takeSnapshot()
    if (initialSnapshot) {
      setQuestionSnapshots([initialSnapshot])
    }

    // Setup MediaRecorder for webcam
    const mediaRecorder = new MediaRecorder(streamRef.current, {
      mimeType: 'video/webm;codecs=vp9,opus',
      videoBitsPerSecond: VIDEO_CONFIG.BITRATE
    })

    mediaRecorderRef.current = mediaRecorder
    webcamChunks.current = []

    mediaRecorder.ondataavailable = (event) => {
      if (event.data.size > 0) {
        webcamChunks.current.push(event.data)
      }
    }

    mediaRecorder.start(1000)
    setIsInterviewStarted(true)
  }

  // Process final video
  const processVideo = async (webcamBlob: Blob, snapshots: QuestionSnapshot[]) => {
    const canvas = document.createElement('canvas')
    canvas.width = VIDEO_CONFIG.WIDTH
    canvas.height = VIDEO_CONFIG.HEIGHT
    const ctx = canvas.getContext('2d')
    if (!ctx) throw new Error("Could not get canvas context")

    const videoElement = document.createElement('video')
    videoElement.src = URL.createObjectURL(webcamBlob)
    await new Promise(resolve => {
      videoElement.onloadedmetadata = resolve
    })
    videoElement.currentTime = 0

    const totalFrames = Math.ceil(videoElement.duration * VIDEO_CONFIG.FPS)
    let processedFrames = 0

    const finalStream = canvas.captureStream(VIDEO_CONFIG.FPS)
    const finalRecorder = new MediaRecorder(finalStream, {
      mimeType: 'video/webm;codecs=vp9,opus'
    })

    const finalChunks: Blob[] = []
    finalRecorder.ondataavailable = (e) => {
      if (e.data.size > 0) finalChunks.push(e.data)
    }

    return new Promise<string>((resolve, reject) => {
      finalRecorder.onstop = () => {
        const finalBlob = new Blob(finalChunks, { type: 'video/webm' })
        const url = URL.createObjectURL(finalBlob)
        resolve(url)
      }

      const processFrame = async () => {
        if (videoElement.currentTime >= videoElement.duration) {
          finalRecorder.stop()
          return
        }
      
        ctx.fillStyle = '#ffffff'
        ctx.fillRect(0, 0, canvas.width, canvas.height)
      
        // Draw question section (left side)
        const currentTime = videoElement.currentTime * 1000
        const currentSnapshot = snapshots.reduce((prev, curr) => {
          return (curr.timestamp <= currentTime && curr.timestamp > prev.timestamp) ? curr : prev
        }, snapshots[0])
      
        ctx.drawImage(currentSnapshot.imageData, 0, 0)
      
        // Calculate webcam dimensions maintaining 4:3 aspect ratio
        const maxWidth = canvas.width * VIDEO_CONFIG.WEBCAM_SCALE
        const maxHeight = canvas.height * 0.4 // Limit height to 40% of canvas
      
        // Get actual video dimensions
        const videoRatio = videoElement.videoWidth / videoElement.videoHeight
        let finalWidth, finalHeight
      
        if (videoRatio > 4/3) {
          // Video is wider than 4:3
          finalWidth = maxWidth
          finalHeight = maxWidth * (3/4)
        } else {
          // Video is taller than 4:3
          finalHeight = maxHeight
          finalWidth = maxHeight * (4/3)
        }
      
        const webcamX = canvas.width - finalWidth - 20
        const webcamY = 20
      
        // Draw webcam with corrected dimensions
        ctx.save()
        ctx.translate(webcamX + finalWidth, webcamY)
        ctx.scale(-1, 1)
        ctx.drawImage(videoElement, 0, 0, finalWidth, finalHeight)
        ctx.restore()
      
        processedFrames++
        setProcessProgress((processedFrames / totalFrames) * 100)
      
        videoElement.currentTime += 1 / VIDEO_CONFIG.FPS
        requestAnimationFrame(processFrame)
      }

      finalRecorder.start()
      processFrame()
    })
  }

  // Handle question navigation
  const handleQuestionChange = async () => {
    if (isInterviewStarted) {
      console.log("Taking snapshot for question:", currentQuestionIndex)
      const snapshot = await takeSnapshot()
      if (snapshot) {
        console.log("Snapshot taken at:", snapshot.timestamp, "ms from start")
        setQuestionSnapshots(prev => [...prev, snapshot])
      }
    }
  }
  

  const handleNextQuestion = () => {
    if (currentQuestionIndex < questions.length - 1) {
      console.log("Moving to next question")
      setCurrentQuestionIndex(prev => prev + 1)
    }
  }

  const handlePreviousQuestion = () => {
    if (currentQuestionIndex > 0) {
      console.log("Moving to previous question")
      setCurrentQuestionIndex(prev => prev - 1)
    }
  }

  useEffect(() => {
    if (isInterviewStarted) {
      handleQuestionChange()
    }
  }, [currentQuestionIndex])

  // Handle interview start/complete
  const handleStartInterview = async () => {
    if (questions.length === 0) {
      setError("No questions available")
      return
    }
    await startRecording()
  }

  const handleCompleteInterview = async () => {
    if (!mediaRecorderRef.current || !isInterviewStarted) return
  
    mediaRecorderRef.current.stop()
    setIsInterviewStarted(false)
    setIsProcessing(true)
  
    try {
      const webcamBlob = new Blob(webcamChunks.current, { type: 'video/webm' })
      console.log("Created webcam blob, size:", webcamBlob.size) // Debug log
  
      const finalVideoUrl = await processVideo(webcamBlob, questionSnapshots)
      console.log("Question snapshots count:", questionSnapshots.length) // Debug log
      console.log("Snapshots timestamps:", questionSnapshots.map(s => s.timestamp)) // Debug log
  
      // Force download
      const a = document.createElement('a')
      a.href = finalVideoUrl
      a.download = `interview-${Date.now()}.webm`
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
  
      onComplete(finalVideoUrl)
    } catch (err) {
      console.error("Error processing video:", err)
      toast({
        title: "Processing Error",
        description: "Failed to process the recording. Please try again.",
        variant: "destructive"
      })
    } finally {
      setIsProcessing(false)
      setProcessProgress(0)
    }
  }

  // Loading state
  if (isLoading) {
    return (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-background/80 backdrop-blur-sm z-50 flex items-center justify-center"
      >
        <div className="bg-background p-8 rounded-lg shadow-lg flex flex-col items-center">
          <Loader2 className="h-8 w-8 animate-spin" />
          <p className="mt-4">Loading interview questions...</p>
        </div>
      </motion.div>
    )
  }

  // Processing state
  if (isProcessing) {
    return (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-background/80 backdrop-blur-sm z-50 flex items-center justify-center"
      >
        <div className="bg-background p-8 rounded-lg shadow-lg w-[400px]">
          <Progress value={processProgress} className="mb-4" />
          <p className="text-center">Processing recording... {Math.round(processProgress)}%</p>
        </div>
      </motion.div>
    )
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-background/80 backdrop-blur-sm z-50 flex items-center justify-center"
    >
      <div ref={questionContainerRef} className="bg-background p-8 rounded-lg shadow-lg w-[90vw] h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex flex-col mb-6">
          <div className="flex justify-between items-start mb-4">
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
              <h1 className="text-3xl font-bold">
                {title.split('\n')[0].replace(/^#\s+/, '')}
              </h1>
              {title.split('\n')[1] && (
                <p className="text-lg text-gray-600 mt-1">
                  {title.split('\n')[1].replace(/^##\s+/, '')}
                </p>
              )}
            </div>
            {!isInterviewStarted && (
              <Button variant="ghost" size="icon" onClick={onClose}>
                <X className="h-6 w-6" />
              </Button>
            )}
          </div>
        </div>

        {/* Main Content */}
        <div className="flex-grow grid grid-cols-5 gap-8">
          {/* Left Panel - Instructions/Questions */}
          <div className="content-section col-span-3 space-y-6 border rounded-lg p-6 flex flex-col">
            {!isInterviewStarted ? (
              <div className="flex-grow flex flex-col justify-between">
                <div className="space-y-6">
                  <div className="prose dark:prose-invert max-w-none">
                    <h2 className="text-xl font-semibold mb-4">Interview Instructions</h2>
                    <ul className="space-y-2 text-sm text-gray-600">
                      <li>Take a moment to position yourself and check your camera view</li>
                      <li>Each response will be recorded for your review</li>
                      <li>You'll have {Math.floor(timeLeft / 60)} minutes to complete all questions</li>
                      <li>Ensure you speak clearly and maintain good posture</li>
                    </ul>
                  </div>

                  <div className="bg-blue-50 p-4 rounded-lg">
                    <h3 className="text-sm font-medium text-blue-800 mb-2">Before you begin:</h3>
                    <ul className="text-sm text-blue-700 space-y-1">
                      <li>Ensure you're in a quiet environment</li>
                      <li>Check your camera position and lighting</li>
                      <li>Test your microphone</li>
                      <li>Have water nearby if needed</li>
                    </ul>
                  </div>
                </div>
              </div>
            ) : (
              <>
                <div className="text-2xl font-semibold flex-grow overflow-y-auto">
                  <ReactMarkdown className="prose dark:prose-invert">
                    {questions[currentQuestionIndex]?.question || "No question available"}
                  </ReactMarkdown>
                </div>
                <div className="flex justify-between mt-4">
                  <Button
                    onClick={handlePreviousQuestion}
                    disabled={currentQuestionIndex === 0}
                    variant="outline"
                  >
                    <ChevronLeft className="mr-2 h-4 w-4" /> Previous
                  </Button>
                  <Button
                    onClick={handleNextQuestion}
                    disabled={currentQuestionIndex === questions.length - 1}
                    variant="outline"
                  >
                    Next <ChevronRight className="ml-2 h-4 w-4" />
                  </Button>
                </div>
              </>
            )}
          </div>

          {/* Right Panel - Video Preview */}
          <div className="col-span-2 space-y-6 flex flex-col">
            <div className="flex-grow aspect-[4/3] bg-gray-100 rounded-lg overflow-hidden relative">
              {error && (
                <Alert variant="destructive" className="absolute top-4 left-4 right-4">
                  <AlertTitle>Camera Error</AlertTitle>
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}
              <video
                ref={videoRef}
                autoPlay
                playsInline
                muted
                className="w-full h-full object-cover"
                style={{ transform: 'scaleX(-1)' }}
              />
              {!isStreaming && (
                <div className="absolute inset-0 flex flex-col items-center justify-center bg-gray-50">
                  <VideoOff className="h-16 w-16 text-gray-400 mb-4" />
                  <p className="text-sm text-gray-600">Camera preview unavailable</p>
                </div>
              )}
              {isStreaming && !isInterviewStarted && (
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="border-2 border-dashed border-gray-300 rounded-lg w-2/3 h-2/3 flex items-center justify-center">
                    <p className="text-sm text-gray-500">Position yourself within the frame</p>
                  </div>
                </div>
              )}
            </div>

            {/* Controls */}
            <div className="flex justify-between items-center">
              <div className="text-2xl font-semibold">
                {isInterviewStarted ? (
                  <>
                    Time left: {Math.floor(timeLeft / 60)}:{(timeLeft % 60).toString().padStart(2, "0")}
                  </>
                ) : (
                  <>
                    Duration: {Math.floor(timeLeft / 60)}:00
                  </>
                )}
              </div>
              <Button
                size="lg"
                onClick={isInterviewStarted ? handleCompleteInterview : handleStartInterview}
                disabled={timeLeft === 0 || questions.length === 0 || !isStreaming}
                className={`${isInterviewStarted
                    ? "bg-red-500 hover:bg-red-600"
                    : "bg-blue-500 hover:bg-blue-600"
                  } text-white`}
              >
                {isInterviewStarted ? (
                  <>
                    <CheckSquare className="mr-2 h-5 w-5" /> Complete & Save
                  </>
                ) : (
                  <>
                    <Play className="mr-2 h-5 w-5" /> Start Interview
                  </>
                )}
              </Button>
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  )
}