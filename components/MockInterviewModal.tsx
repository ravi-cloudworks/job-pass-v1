"use client"

import React, { useState, useEffect, useRef } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import {
  ChevronLeft,
  ChevronRight,
  VideoOff,
  X,
  Play,
  CheckSquare,
  Loader2,
  Clock,
  AlertTriangle
} from "lucide-react"
import ReactMarkdown from "react-markdown"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { useToast } from "@/hooks/use-toast"
import html2canvas from 'html2canvas'

// import remarkGfm from 'remark-gfm';
import { marked } from 'marked';

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
  const [showCompleteConfirmation, setShowCompleteConfirmation] = useState(false)
  const [isRecordingPaused, setIsRecordingPaused] = useState(false)

  // Refs
  const questionContainerRef = useRef<HTMLDivElement>(null)
  const videoRef = useRef<HTMLVideoElement>(null)
  const mediaRecorderRef = useRef<MediaRecorder | null>(null)
  const webcamChunks = useRef<Blob[]>([])
  const streamRef = useRef<MediaStream | null>(null)
  const screenStreamRef = useRef<MediaStream | null>(null)
  const composedStreamRef = useRef<MediaStream | null>(null)

  // Initialize camera
  const initializeCamera = async () => {
    setError(null)
    try {
      //console.log("Initializing camera preview...")

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
        //console.log("Camera initialized successfully")
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
        //console.log("Fetching questions for ID:", questionSetId)

        const urls = [
          `data/mock-interviews/${questionSetId}.json`,
        ]

        let response = null
        let successUrl = ''

        for (const url of urls) {
          try {
            //console.log("Attempting to fetch from:", url)
            response = await fetch(url)
            if (response.ok) {
              successUrl = url
              break
            }
          } catch (err) {
            //console.log("Failed to fetch from:", url, err)
          }
        }

        if (!response || !response.ok) {
          throw new Error(`Failed to fetch from any URL. Last status: ${response?.status}`)
        }

        //console.log("Successfully fetched from:", successUrl)
        const data: QuestionSet = await response.json()
        //console.log("Fetched data:", data)

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
    if (isInterviewStarted && timeLeft > 0 && !isRecordingPaused) {
      timer = setInterval(() => {
        setTimeLeft(prev => prev - 1)
      }, 1000)
    } else if (timeLeft === 0 && isInterviewStarted) {
      handleCompleteInterview()
    }
    return () => clearInterval(timer)
  }, [isInterviewStarted, timeLeft, isRecordingPaused])

  // Take snapshot of question section
  const takeSnapshot = async () => {
    if (!questionContainerRef.current) return null

    try {
      // Target the active question content
      const contentSection = isInterviewStarted
        ? questionContainerRef.current.querySelector('.question-content')
        : questionContainerRef.current.querySelector('.content-section');

      if (!(contentSection instanceof HTMLElement)) {
        console.error('Content section not found')
        return null
      }

      //console.log("Capturing content for question:", currentQuestionIndex)

      // Set specific dimensions for the capture
      const snapshot = await html2canvas(contentSection, {
        backgroundColor: 'white',
        scale: window.devicePixelRatio || 1,
        width: Math.floor(VIDEO_CONFIG.WIDTH * 0.6),
        height: VIDEO_CONFIG.HEIGHT,
        useCORS: true,
        logging: true
      })

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
  const startScreenRecording = async () => {
    if (!questionContainerRef.current) return

    try {
      // Get screen capture stream
      const screenStream = await navigator.mediaDevices.getDisplayMedia({
        video: true,
        audio: true,
        preferCurrentTab: true,
        systemAudio: 'include'
      } as DisplayMediaStreamOptions)

      // Store screen stream reference
      screenStreamRef.current = screenStream

      // Get microphone stream
      const micStream = await navigator.mediaDevices.getUserMedia({
        audio: true
      })

      // Create a new composed stream
      const composedStream = new MediaStream()

      // Add the screen video track
      screenStream.getVideoTracks().forEach((videoTrack) => {
        composedStream.addTrack(videoTrack)
      })

      // Create audio context to mix audio streams
      const audioContext = new AudioContext()
      const destination = audioContext.createMediaStreamDestination()

      // Add screen audio if available
      if (screenStream.getAudioTracks().length > 0) {
        const screenSource = audioContext.createMediaStreamSource(screenStream)
        const screenGain = audioContext.createGain()
        screenGain.gain.value = 1.0
        screenSource.connect(screenGain).connect(destination)
      }

      // Add microphone audio
      const micSource = audioContext.createMediaStreamSource(micStream)
      const micGain = audioContext.createGain()
      micGain.gain.value = 1.0
      micSource.connect(micGain).connect(destination)

      // Add the combined audio to the composed stream
      destination.stream.getAudioTracks().forEach((audioTrack) => {
        composedStream.addTrack(audioTrack)
      })

      // Store the composed stream reference
      composedStreamRef.current = composedStream

      // Setup MediaRecorder with the composed stream
      const mediaRecorder = new MediaRecorder(composedStream, {
        mimeType: 'video/webm;codecs=vp9,opus'
      })

      mediaRecorderRef.current = mediaRecorder
      webcamChunks.current = []

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          webcamChunks.current.push(event.data)
        }
      }

      // Start recording
      mediaRecorder.start(1000)
      setInterviewStartTime(Date.now())
      setIsInterviewStarted(true)

      // Setup cleanup when screen share stops
      screenStream.getVideoTracks()[0].onended = () => {
        if (!isRecordingPaused) {
          handleCompleteInterview()
        }
      }

    } catch (err) {
      console.error("Error starting screen recording:", err)
      toast({
        title: "Recording Error",
        description: "Failed to start screen recording. Please try again.",
        variant: "destructive"
      })
    }
  }

  // Handle pausing and resuming recording
  const pauseRecording = () => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state === "recording") {
      mediaRecorderRef.current.pause()
      setIsRecordingPaused(true)
    }
  }

  const resumeRecording = () => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state === "paused") {
      mediaRecorderRef.current.resume()
      setIsRecordingPaused(false)
    }
  }

  // Handle question navigation
  const handleQuestionChange = async () => {
    if (isInterviewStarted) {
      //console.log("Taking snapshot for question:", currentQuestionIndex)
      const snapshot = await takeSnapshot()
      if (snapshot) {
        //console.log("Snapshot taken at:", snapshot.timestamp, "ms from start")
        setQuestionSnapshots(prev => [...prev, snapshot])
      }
    }
  }

  const handleNextQuestion = () => {
    if (currentQuestionIndex < questions.length - 1) {
      //console.log("Moving to next question")
      setCurrentQuestionIndex(prev => prev + 1)
    }
  }

  const handlePreviousQuestion = () => {
    if (currentQuestionIndex > 0) {
      //console.log("Moving to previous question")
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
    await startScreenRecording()
  }

  // Handle interview completion request
  const handleCompleteRequest = () => {
    // If time has already run out, complete immediately
    if (timeLeft <= 0) {
      handleCompleteInterview()
      return
    }

    // Otherwise, pause recording and show confirmation dialog
    pauseRecording()
    setShowCompleteConfirmation(true)
  }

  const handleConfirmationResponse = (confirmed: boolean) => {
    setShowCompleteConfirmation(false)

    if (confirmed) {
      // User confirmed completion
      handleCompleteInterview()
    } else {
      // User canceled, resume recording
      resumeRecording()
    }
  }



  const handleCompleteInterview = async () => {
    if (!mediaRecorderRef.current || !isInterviewStarted) return

    mediaRecorderRef.current.stop()
    setIsInterviewStarted(false)
    setIsRecordingPaused(false)
    setIsProcessing(true)

    try {
      // Add a delay to ensure all data is collected
      await new Promise(resolve => setTimeout(resolve, 1500)) // 1.5 second delay


      const finalBlob = new Blob(webcamChunks.current, { type: 'video/webm' })
      const finalVideoUrl = URL.createObjectURL(finalBlob)

      // Stop all media tracks
      if (screenStreamRef.current) {
        screenStreamRef.current.getTracks().forEach(track => {
          track.stop()
        })
        screenStreamRef.current = null
      }

      if (composedStreamRef.current) {
        composedStreamRef.current.getTracks().forEach(track => {
          track.stop()
        })
        composedStreamRef.current = null
      }

      if (mediaRecorderRef.current.stream) {
        mediaRecorderRef.current.stream.getTracks().forEach(track => {
          track.stop()
        })
      }

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

  // Cleanup effect
  useEffect(() => {
    return () => {
      // Cleanup all streams on unmount
      if (screenStreamRef.current) {
        screenStreamRef.current.getTracks().forEach(track => {
          track.stop()
        })
        screenStreamRef.current = null
      }
      if (composedStreamRef.current) {
        composedStreamRef.current.getTracks().forEach(track => {
          track.stop()
        })
        composedStreamRef.current = null
      }
    }
  }, [])

  // Helper function to get complexity stars
  const getComplexityStars = (complexity: string) => {
    switch (complexity) {
      case 'Easy': return '⭐';
      case 'Medium': return '⭐⭐';
      case 'Hard': return '⭐⭐⭐';
      default: return '⭐';
    }
  }

  // Format time as MM:SS
  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins}:${secs.toString().padStart(2, '0')}`
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
        <div className="bg-background p-6 rounded-lg shadow-md flex flex-col items-center">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <p className="mt-4 text-sm text-muted-foreground">Loading interview questions...</p>
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
        <div className="bg-background p-6 rounded-lg shadow-md w-[400px]">
          <div className="mb-4 space-y-3">
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">Processing recording</span>
              <span className="font-medium">{Math.round(processProgress)}%</span>
            </div>
            <Progress value={processProgress} className="h-2" />
          </div>
          <div className="flex space-x-1">
            <div className="w-1.5 h-1.5 bg-primary rounded-full animate-bounce" style={{ animationDelay: "0ms" }}></div>
            <div className="w-1.5 h-1.5 bg-primary rounded-full animate-bounce" style={{ animationDelay: "150ms" }}></div>
            <div className="w-1.5 h-1.5 bg-primary rounded-full animate-bounce" style={{ animationDelay: "300ms" }}></div>
          </div>
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
      <div ref={questionContainerRef} className="bg-background rounded-lg shadow-md w-[90vw] h-[90vh] flex flex-col border border-border overflow-hidden">
        {/* Header */}
        <div className="py-3 px-4 border-b flex justify-between items-center">
          <div className="flex flex-col">
            <div className="flex items-center gap-2 mb-1">
              {category && (
                <span className="text-xs font-medium px-2 py-0.5 rounded-full bg-blue-50 text-blue-700 border border-blue-200">
                  {getComplexityStars(complexity || 'Easy')} {complexity}
                </span>
              )}
              {category && (
                <span className="text-xs font-medium px-2 py-0.5 rounded-full bg-gray-50 text-gray-700 border border-gray-200">
                  {category}
                </span>
              )}
            </div>
            <h1 className="text-lg font-semibold">
              {title.split('\n')[0].replace(/^#\s+/, '')}
            </h1>
          </div>

          {!isInterviewStarted && (
            <Button variant="ghost" size="icon" className="rounded-full h-8 w-8" onClick={onClose}>
              <X className="h-4 w-4" />
            </Button>
          )}
        </div>

        {/* Timer Bar when interview started */}
        {isInterviewStarted && (
          <div className={`px-4 py-2 flex items-center justify-between ${isRecordingPaused
            ? "bg-amber-50 border-b border-amber-200"
            : "bg-primary/5 border-b border-primary/20"
            }`}>
            <div className="flex items-center">
              <Clock className={`h-4 w-4 mr-2 ${isRecordingPaused ? "text-amber-600" : "text-primary"}`} />
              <span className="text-sm font-medium">
                Time remaining: {formatTime(timeLeft)}
              </span>
            </div>

            {isRecordingPaused && (
              <div className="flex items-center">
                <span className="text-xs font-medium text-amber-600 flex items-center">
                  <AlertTriangle className="h-3 w-3 mr-1" />
                  Recording paused
                </span>
              </div>
            )}
          </div>
        )}

        {/* Main Content */}
        <div className="flex-grow grid grid-cols-5 gap-6 p-4 overflow-hidden">
          {/* Left Panel - Instructions/Questions */}
          <div className="content-section col-span-3 border rounded-lg overflow-hidden flex flex-col">
            {!isInterviewStarted ? (
              <div className="flex-grow flex flex-col p-4">
                <div className="space-y-5">
                  {/* Main Instructions */}
                  <div className="bg-primary/5 border border-primary/20 rounded-lg overflow-hidden">
                    <div className="bg-primary/10 border-b border-primary/20 px-4 py-2 flex items-center">
                      <CheckSquare className="h-5 w-5 text-primary mr-2" />
                      <h3 className="text-base font-medium text-primary">Interview Instructions</h3>
                    </div>
                    <div className="p-4">
                      <ul className="space-y-3 text-sm">
                        <li className="flex items-start">
                          <div className="bg-primary/20 h-5 w-5 rounded-full flex items-center justify-center text-xs text-primary font-medium mr-2 mt-0.5 flex-shrink-0">1</div>
                          <div>Take a moment to position yourself and check your camera view</div>
                        </li>
                        <li className="flex items-start">
                          <div className="bg-primary/20 h-5 w-5 rounded-full flex items-center justify-center text-xs text-primary font-medium mr-2 mt-0.5 flex-shrink-0">2</div>
                          <div>Each response will be recorded for your review</div>
                        </li>
                        <li className="flex items-start">
                          <div className="bg-primary/20 h-5 w-5 rounded-full flex items-center justify-center text-xs text-primary font-medium mr-2 mt-0.5 flex-shrink-0">3</div>
                          <div>You'll have {Math.floor(timeLeft / 60)} minutes to complete all questions</div>
                        </li>
                        <li className="flex items-start">
                          <div className="bg-primary/20 h-5 w-5 rounded-full flex items-center justify-center text-xs text-primary font-medium mr-2 mt-0.5 flex-shrink-0">4</div>
                          <div>Ensure you speak clearly and maintain good posture</div>
                        </li>
                      </ul>
                    </div>
                  </div>

                  {/* Checklist */}
                  <div className="rounded-lg border border-amber-200 overflow-hidden">
                    <div className="bg-amber-50 px-4 py-2 border-b border-amber-200 flex items-center">
                      <Clock className="h-5 w-5 text-amber-600 mr-2" />
                      <h3 className="text-base font-medium text-amber-800">Before you begin</h3>
                    </div>
                    <div className="bg-amber-50/50 p-4">
                      <div className="space-y-2.5">
                        <label className="flex items-center text-sm text-amber-900">
                          <input type="checkbox" className="h-4 w-4 rounded border-amber-300 text-amber-600 mr-2" />
                          <span>Ensure you're in a quiet environment</span>
                        </label>
                        <label className="flex items-center text-sm text-amber-900">
                          <input type="checkbox" className="h-4 w-4 rounded border-amber-300 text-amber-600 mr-2" />
                          <span>Check your camera position and lighting</span>
                        </label>
                        <label className="flex items-center text-sm text-amber-900">
                          <input type="checkbox" className="h-4 w-4 rounded border-amber-300 text-amber-600 mr-2" />
                          <span>Test your microphone</span>
                        </label>
                        <label className="flex items-center text-sm text-amber-900">
                          <input type="checkbox" className="h-4 w-4 rounded border-amber-300 text-amber-600 mr-2" />
                          <span>Have water nearby if needed</span>
                        </label>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              <AnimatePresence mode="wait">
                <motion.div
                  key={currentQuestionIndex}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  transition={{ duration: 0.2 }}
                  className="flex-grow flex flex-col p-4"
                >
                  <div className="flex items-center mb-2">
                    <span className="text-xs text-muted-foreground">
                      Question {currentQuestionIndex + 1} of {questions.length}
                    </span>
                  </div>
                  <div className="question-content flex-grow overflow-y-auto mb-4">
                    <div
                      dangerouslySetInnerHTML={{
                        __html: `
                            <style>
                              .md-content h1 { font-size: 1.8em; font-weight: bold; margin-bottom: 0.5em; }
                              .md-content h2 { font-size: 1.5em; font-weight: bold; margin-bottom: 0.5em; }
                              .md-content pre { background-color: #f4f4f4; padding: 1rem; border-radius: 4px; }
                              .md-content ul { list-style-type: disc; margin-left: 1.5em; }
                              .md-content ol { list-style-type: decimal; margin-left: 1.5em; }
                            </style>
                            <div class="md-content">${marked(questions[currentQuestionIndex]?.question || "")}</div>
                          `
                      }}
                      className="question-content flex-grow overflow-y-auto mb-4"
                    />
                  </div>
                  <div className="flex justify-between mt-auto pt-2 border-t">
                    <Button
                      onClick={handlePreviousQuestion}
                      disabled={currentQuestionIndex === 0}
                      variant="ghost"
                      size="sm"
                      className="text-xs"
                    >
                      <ChevronLeft className="mr-1 h-4 w-4" /> Previous
                    </Button>
                    <Button
                      onClick={handleNextQuestion}
                      disabled={currentQuestionIndex === questions.length - 1}
                      variant="ghost"
                      size="sm"
                      className="text-xs"
                    >
                      Next <ChevronRight className="ml-1 h-4 w-4" />
                    </Button>
                  </div>
                </motion.div>
              </AnimatePresence>
            )}
          </div>

          {/* Right Panel - Video Preview */}
          <div className="col-span-2 flex flex-col space-y-4">
            <div className="flex-grow rounded-lg overflow-hidden relative border border-gray-200 bg-gray-50">
              {error && (
                <Alert variant="destructive" className="absolute top-4 left-4 right-4 z-10">
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
                  <VideoOff className="h-12 w-12 text-gray-400 mb-4" />
                  <p className="text-sm text-gray-600">Camera preview unavailable</p>
                </div>
              )}
              {isStreaming && !isInterviewStarted && (
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="border border-dashed border-gray-300 rounded-lg w-2/3 h-2/3 flex items-center justify-center">
                    <p className="text-xs text-gray-500">Position yourself within the frame</p>
                  </div>
                </div>
              )}

              {/* Recording paused overlay */}
              {isRecordingPaused && (
                <div className="absolute inset-0 bg-amber-900/20 flex flex-col items-center justify-center">
                  <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 shadow-md max-w-xs text-center">
                    <AlertTriangle className="h-8 w-8 text-amber-600 mx-auto mb-2" />
                    <p className="text-sm font-medium text-amber-800">Recording paused</p>
                    <p className="text-xs text-amber-700 mt-1">Please confirm or cancel to continue</p>
                  </div>
                </div>
              )}
            </div>

            {/* Controls */}
            {!isInterviewStarted ? (
              <div className="flex items-center justify-between">
                <div className="flex items-center text-sm">
                  <Clock className="h-4 w-4 mr-2 text-muted-foreground" />
                  <span className="text-muted-foreground">Duration: {formatTime(timeLeft)}</span>
                </div>
                <Button
                  size="sm"
                  onClick={handleStartInterview}
                  disabled={timeLeft === 0 || questions.length === 0 || !isStreaming}
                  variant="default"
                  className="text-xs"
                >
                  <Play className="mr-1.5 h-4 w-4" /> Start Interview
                </Button>
              </div>
            ) : (
              <Button
                size="sm"
                onClick={handleCompleteRequest}
                variant="outline"
                className="text-xs border-blue-200 bg-blue-50 text-blue-700 hover:bg-blue-100"
              >
                <CheckSquare className="mr-1.5 h-4 w-4" /> Complete Interview
              </Button>
            )}
          </div>
        </div>
      </div>

      {/* Confirmation Dialog */}
      <AlertDialog open={showCompleteConfirmation} onOpenChange={setShowCompleteConfirmation}>
        <AlertDialogContent className="sm:max-w-md">
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center">
              <AlertTriangle className="h-5 w-5 text-amber-600 mr-2" />
              <span>Confirm Interview Completion</span>
            </AlertDialogTitle>
            <AlertDialogDescription className="space-y-4">
              <div className="border rounded-lg p-4 bg-amber-50/50 border-amber-200">
                <p className="font-medium mb-2 text-sm text-amber-900">Warning: You still have time remaining</p>
                <div className="space-y-2 text-sm text-amber-800">
                  <p className="flex items-center">
                    <Clock className="h-4 w-4 mr-2 text-amber-600" />
                    <span>Time remaining: <span className="font-medium">{formatTime(timeLeft)}</span></span>
                  </p>
                  <p>Completing now will end your interview early and the remaining time will be lost.</p>
                </div>
              </div>
              <div className="flex items-start p-3 bg-gray-50 rounded-md border border-gray-200">
                <div className="text-gray-800 text-sm">
                  Are you sure you want to complete your interview now?
                </div>
              </div>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="mt-4">
            <AlertDialogCancel
              onClick={() => handleConfirmationResponse(false)}
              className="text-xs"
            >
              Continue Recording
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={() => handleConfirmationResponse(true)}
              className="bg-blue-600 hover:bg-blue-700 text-xs"
            >
              Complete & Save
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </motion.div>
  )
}