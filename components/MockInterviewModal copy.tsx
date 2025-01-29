"use client"

import React, { useState, useEffect, useRef } from "react"
import { motion } from "framer-motion"
import { Button } from "@/components/ui/button"
import { ChevronLeft, ChevronRight, VideoOff, X, Play, CheckSquare, Loader2 } from "lucide-react"
import ReactMarkdown from "react-markdown"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { useToast } from "@/hooks/use-toast"

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

export default function MockInterviewModal({
  onClose,
  onComplete,
  questionSetId,
  category,
  complexity
}: MockInterviewModalProps) {
  const { toast } = useToast()
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [isInterviewStarted, setIsInterviewStarted] = useState(false);
  const [isStreaming, setIsStreaming] = useState(false);
  const [timeLeft, setTimeLeft] = useState(0);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [title, setTitle] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [startTime, setStartTime] = useState<number | null>(null);

  const videoRef = useRef<HTMLVideoElement>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const streamRef = useRef<MediaStream | null>(null);

  // Add new ref for the content area
const contentRef = useRef<HTMLDivElement>(null);

  // Initialize camera on mount
  useEffect(() => {
    initializeCamera();

    return () => {
      if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'recording') {
        mediaRecorderRef.current.stop();
      }
      stopWebcam();
    };
  }, []);

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
      } catch (error) {
        console.error("Error loading questions:", error)
        setError(`Failed to load interview questions`)
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
        setTimeLeft((prevTime) => prevTime - 1)
      }, 1000)
    } else if (timeLeft === 0 && isInterviewStarted) {
      handleCompleteInterview()
    }
    return () => clearInterval(timer)
  }, [isInterviewStarted, timeLeft])

  const stopWebcam = () => {
    try {
      if (streamRef.current) {
        const tracks = streamRef.current.getTracks();
        tracks.forEach(track => {
          try {
            track.stop();
            console.log(`Stopped track: ${track.kind}`);
          } catch (e) {
            console.error(`Error stopping track ${track.kind}:`, e);
          }
        });
        streamRef.current = null;
      }
      if (videoRef.current) {
        videoRef.current.srcObject = null;
      }
      setIsStreaming(false);
    } catch (error) {
      console.error("Error in stopWebcam:", error);
    }
  };

  const initializeCamera = async () => {
    setError(null);
    try {
      console.log("Initializing camera preview...");

      if (streamRef.current) {
        stopWebcam();
      }

      const stream = await navigator.mediaDevices.getUserMedia({
        video: true,
        audio: false
      });

      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        streamRef.current = stream;

        await new Promise((resolve) => {
          if (videoRef.current) {
            videoRef.current.onloadedmetadata = () => {
              resolve(true);
            };
          }
        });

        setIsStreaming(true);
        setError(null);
        console.log("Camera initialized successfully");
      }
    } catch (err) {
      console.error("Camera preview error:", err);
      setError("Unable to access camera. Please check permissions and try again.");
      setIsStreaming(false);
    }
  };

  const startRecording = async () => {
    try {
      if (!contentRef.current) {
        console.error("Content area not found");
        return;
      }
  
      // Clean up any existing streams
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop());
      }
  
      // Get webcam and audio stream
      const webcamStream = await navigator.mediaDevices.getUserMedia({
        video: true,
        audio: true
      });
  
      // Get screen capture of the content div
      const displayStream = await navigator.mediaDevices.getDisplayMedia({
        video: {
          displaySurface: 'window',
          width: { ideal: 1920 },
          height: { ideal: 1080 },
          frameRate: { ideal: 30 }
        }
      });
  
      // Combine streams (video from screen, audio from webcam)
      const tracks = [
        ...displayStream.getVideoTracks(),
        ...webcamStream.getAudioTracks()
      ];
      const combinedStream = new MediaStream(tracks);
  
      // Setup video preview (show webcam in preview, but record combined stream)
      if (videoRef.current) {
        videoRef.current.srcObject = webcamStream;
        streamRef.current = combinedStream;
      }
  
      const mediaRecorder = new MediaRecorder(combinedStream, {
        mimeType: 'video/webm;codecs=vp8',
        videoBitsPerSecond: 3000000 // Higher bitrate for UI clarity
      });
  
      mediaRecorderRef.current = mediaRecorder;
      const chunks: Blob[] = [];
  
      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          chunks.push(event.data);
        }
      };
  
      mediaRecorder.onstop = () => {
        // Stop all tracks from both streams
        webcamStream.getTracks().forEach(track => {
          track.stop();
          console.log(`Stopped webcam track: ${track.kind}`);
        });
  
        displayStream.getTracks().forEach(track => {
          track.stop();
          console.log(`Stopped display track: ${track.kind}`);
        });
  
        if (streamRef.current) {
          streamRef.current.getTracks().forEach(track => track.stop());
          streamRef.current = null;
        }
  
        // Create final video
        const blob = new Blob(chunks, { type: 'video/webm' });
        const videoUrl = URL.createObjectURL(blob);
  
        // Update states
        setIsInterviewStarted(false);
        setStartTime(null);
        setIsStreaming(false);
  
        // Clean up video preview
        if (videoRef.current) {
          videoRef.current.srcObject = null;
        }
  
        toast({
          title: "Interview Completed",
          description: "Your mock interview recording has been saved."
        });
  
        onComplete(videoUrl);
      };
  
      // Start recording
      mediaRecorder.start(1000);
      setStartTime(Date.now());
      
      toast({
        title: "Recording Started",
        description: "Recording both screen and camera. Complete interview when ready."
      });
  
    } catch (err) {
      console.error("Recording error:", err);
      stopWebcam();
      toast({
        title: "Recording Error",
        description: "Failed to start recording. Please grant screen and camera permissions."
      });
    }
  };

  const handleStartInterview = async () => {
    if (questions.length === 0) {
      setError("No questions available");
      return;
    }
    setIsInterviewStarted(true);
    await startRecording();
  };

  const handleCompleteInterview = () => {
    if (isInterviewStarted && mediaRecorderRef.current) {
      if (mediaRecorderRef.current.state === 'recording') {
        mediaRecorderRef.current.requestData();
        mediaRecorderRef.current.stop();
        // Cleanup will be handled in the onstop handler
      }
    }
  };

  const handleClose = () => {
    stopWebcam();
    onClose();
  };

  const handleNextQuestion = () => {
    if (currentQuestionIndex < questions.length - 1) {
      setCurrentQuestionIndex((prevIndex) => prevIndex + 1)
    }
  }

  const handlePreviousQuestion = () => {
    if (currentQuestionIndex > 0) {
      setCurrentQuestionIndex((prevIndex) => prevIndex - 1)
    }
  }

  useEffect(() => {
    if (isInterviewStarted) {
      const handleBeforeUnload = (e: BeforeUnloadEvent) => {
        console.log('Attempting to leave page during interview');
        e.preventDefault();
        // Just show warning, don't do cleanup
        const message = 'Are you sure you want to leave? Your interview progress will be lost.';
        e.returnValue = message;
        return message;
      };

      const handleUnload = () => {
        // Only do cleanup when actually leaving
        console.log('Page actually unloading');
        if (mediaRecorderRef.current?.state === 'recording') {
          mediaRecorderRef.current.stop();
        }
        stopWebcam();
        // Future backend update would go here
      };

      window.addEventListener('beforeunload', handleBeforeUnload);
      window.addEventListener('unload', handleUnload);

      return () => {
        window.removeEventListener('beforeunload', handleBeforeUnload);
        window.removeEventListener('unload', handleUnload);
      };
    }
  }, [isInterviewStarted]);

 

  // ... Rest of your existing JSX code remains the same ...

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

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-background/80 backdrop-blur-sm z-50 flex items-center justify-center"
    >
      <div ref={contentRef} className="bg-background p-8 rounded-lg shadow-lg w-[90vw] h-[90vh] flex flex-col">
        {/* Header Section */}
        <div className="flex flex-col mb-6">
          <div className="flex justify-between items-start mb-4">
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-2">
                <span className="text-sm font-medium px-2 py-1 rounded-full bg-blue-100 text-blue-800">
                  {category}
                </span>
                <span className="text-sm font-medium px-2 py-1 rounded-full bg-blue-100 text-blue-800">
                  {complexity}
                </span>
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
              <Button variant="ghost" size="icon" onClick={handleClose}>
                <X className="h-6 w-6" />
              </Button>
            )}
          </div>
        </div>

        <div className="flex-grow grid grid-cols-5 gap-8">
          {/* Left Panel - Instructions/Questions */}
          <div className="col-span-3 space-y-6 border rounded-lg p-6 flex flex-col">
            {!isInterviewStarted ? (
              <div className="flex-grow flex flex-col justify-between">
                <div className="space-y-6">
                  <div className="prose dark:prose-invert max-w-none">
                    <h2 className="text-xl font-semibold mb-4">Interview Instructions</h2>
                    <ul className="space-y-2 text-sm text-gray-600">
                      <li>You'll be presented with technical questions about Django MVT Architecture</li>
                      <li>Take a moment to position yourself and check your camera view</li>
                      <li>Each response will be recorded for your review</li>
                      <li>You'll have {Math.floor(timeLeft / 60)} minutes to complete all questions</li>
                    </ul>
                  </div>

                  <div className="bg-blue-50 p-4 rounded-lg">
                    <h3 className="text-sm font-medium text-blue-800 mb-2">Before you begin:</h3>
                    <ul className="text-sm text-blue-700 space-y-1">
                      <li>Ensure you're in a quiet environment</li>
                      <li>Check your camera position and lighting</li>
                      <li>Test your microphone</li>
                    </ul>
                  </div>
                </div>
              </div>
            ) : (
              <>
                <div className="text-2xl font-semibold flex-grow flex items-center justify-center overflow-y-auto">
                  <ReactMarkdown className="prose dark:prose-invert">
                    {questions[currentQuestionIndex]?.question || "No question available"}
                  </ReactMarkdown>
                </div>
                <div className="flex justify-between">
                  <Button onClick={handlePreviousQuestion} disabled={currentQuestionIndex === 0}>
                    <ChevronLeft className="mr-2 h-4 w-4" /> Previous
                  </Button>
                  <Button onClick={handleNextQuestion} disabled={currentQuestionIndex === questions.length - 1}>
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
                className={isInterviewStarted ? "bg-red-500 hover:bg-red-600" : "bg-blue-500 hover:bg-blue-600"}
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