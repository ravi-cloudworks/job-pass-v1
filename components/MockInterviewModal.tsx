"use client"

import React, { useState, useEffect, useRef } from "react"
import { motion } from "framer-motion"
import { Button } from "@/components/ui/button"
import { ChevronLeft, ChevronRight, VideoOff, X, Play, CheckSquare, Loader2 } from "lucide-react"
import ReactMarkdown from "react-markdown"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { useToast } from "@/components/ui/toast"



interface MockInterviewModalProps {
  onClose: () => void
  onComplete: (videoUrl: string) => void
  questionSetId?: string
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

export default function MockInterviewModal({ onClose, onComplete, questionSetId }: MockInterviewModalProps) {
  // First, declare all state variables at the top
  const { addToast } = useToast();
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [isInterviewStarted, setIsInterviewStarted] = useState(false);
  const [isStreaming, setIsStreaming] = useState(false);
  const [timeLeft, setTimeLeft] = useState(0);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [title, setTitle] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [recordedChunks, setRecordedChunks] = useState<Blob[]>([]);
  const [recordingStartTime, setRecordingStartTime] = useState<number | null>(null);
  const [startTime, setStartTime] = useState<number | null>(null);
  
  // Refs declarations
  const videoRef = useRef<HTMLVideoElement>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const streamRef = useRef<MediaStream | null>(null);

  // Initialize webcam
  const startWebcam = async () => {
    try {
      console.log("Initializing camera...")
      const stream = await navigator.mediaDevices.getUserMedia({ 
        video: true,
        audio: true
      });
      
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        streamRef.current = stream;
        setIsStreaming(true);
        setError(null);
        console.log("Webcam started successfully");
      }
    } catch (err) {
      console.error("Camera initialization error:", err);
      setError("Failed to access webcam. Please check permissions.");
      addToast({
        title: "Camera Error",
        description: "Failed to access webcam. Please check permissions."
      });
    }
  };

  // Stop webcam
  const stopWebcam = () => {
    if (videoRef.current && videoRef.current.srcObject) {
      // Type assertion to tell TypeScript this is a MediaStream
      const stream = videoRef.current.srcObject as MediaStream;
      const tracks = stream.getTracks();
      tracks.forEach(track => {
        console.log(`Stopping track: ${track.kind}`);
        track.stop();
      });
      videoRef.current.srcObject = null;
      streamRef.current = null;
      setIsStreaming(false);
    }
  };

  // Cleanup on unmount
  useEffect(() => {
    return () => {
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
        const response = await fetch(`/data/mock-interviews/${questionSetId}.json`)
        if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`)
        
        const data: QuestionSet = await response.json()
        setQuestions(data.questions)
        setTitle(data.title)
        setTimeLeft(data.time_limit)
      } catch (error) {
        console.error("Error loading questions:", error)
        setError(`Failed to load interview questions: ${error}`)
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

  const startRecording = async () => {
    if (!streamRef.current) return;
  
    try {
      const mediaRecorder = new MediaRecorder(streamRef.current, {
        mimeType: 'video/webm;codecs=vp8',
        videoBitsPerSecond: 500000
      });
  
      mediaRecorderRef.current = mediaRecorder;
      const chunks: Blob[] = [];  // Keep chunks in local scope
  
      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          chunks.push(event.data);
          console.log("Chunk added - Current chunks:", chunks.length);
          console.log("Chunk size:", event.data.size, "bytes");
        }
      };
  
      mediaRecorder.onstop = () => {
        console.log("MediaRecorder stopped - Final chunks count:", chunks.length);
        // Create blob and handle completion here instead of in handleCompleteInterview
        const blob = new Blob(chunks, { type: 'video/webm' });
        
        const duration = (Date.now() - startTime!) / 1000;
        console.log("Recording duration:", duration, "seconds");
        console.log("Total recorded chunks:", chunks.length);
        console.log("Total blob size:", blob.size, "bytes");
        console.log("Individual chunk sizes:", chunks.map(chunk => chunk.size));
  
        const videoUrl = URL.createObjectURL(blob);
        setIsInterviewStarted(false);
        setStartTime(null);
  
        addToast({
          title: "Interview Completed",
          description: "Your mock interview has been saved."
        });
  
        onComplete(videoUrl);
      };
  
      mediaRecorder.start(1000);
      setStartTime(Date.now());
      console.log("Recording started at:", new Date().toISOString());
    } catch (err) {
      console.error("Error starting recording:", err);
      addToast({
        title: "Recording Error",
        description: "Failed to start recording. Please try again."
      });
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      mediaRecorderRef.current.stop();
      console.log("Recording stopped");
    }
  };

  const handleStartInterview = async () => {
    if (questions.length === 0) {
      setError("No questions available");
      return;
    }
    await startWebcam();  // Start webcam first
    if (streamRef.current) {  // Only start recording if webcam started successfully
      setIsInterviewStarted(true);
      await startRecording();
    }
  };

  const handleCompleteInterview = () => {
    if (isInterviewStarted && mediaRecorderRef.current) {
      if (mediaRecorderRef.current.state === 'recording') {
        mediaRecorderRef.current.requestData();  // Request any final data
        mediaRecorderRef.current.stop();  // This will trigger the onstop handler
      }
      stopWebcam();
    }
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

  if (error) {
    return (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-background/80 backdrop-blur-sm z-50 flex items-center justify-center"
      >
        <div className="bg-background p-8 rounded-lg shadow-lg w-[90vw] max-w-md">
          <Alert variant="destructive">
            <AlertTitle>Error</AlertTitle>
            <AlertDescription>{error}</AlertDescription>
          </Alert>
          <Button className="mt-4 w-full" onClick={onClose}>
            Close
          </Button>
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
      <div className="bg-background p-8 rounded-lg shadow-lg w-[90vw] h-[90vh] flex flex-col">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-3xl font-bold">Mock Interview</h2>
          {!isInterviewStarted && (
            <Button variant="ghost" size="icon" onClick={onClose}>
              <X className="h-6 w-6" />
            </Button>
          )}
        </div>
        <div className="flex-grow grid grid-cols-5 gap-8">
          <div className="col-span-3 space-y-6 border rounded-lg p-6 flex flex-col">
            {!isInterviewStarted ? (
              <div className="flex-grow flex flex-col justify-center items-center text-center">
                <h3 className="text-2xl font-semibold mb-4">Welcome to Your Mock Interview</h3>
                <ReactMarkdown className="prose dark:prose-invert mb-6">{title}</ReactMarkdown>
                <p className="text-lg mb-6">
                  This mock interview will help you prepare for real job interviews. You'll be presented with common
                  interview questions and have a specific time to practice your responses.
                </p>
                <p className="text-lg mb-6">
                  Click "Start Interview" when you're ready to begin. Make sure your webcam is enabled to record your
                  responses.
                </p>
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
          <div className="col-span-2 space-y-6 flex flex-col">
            <div className="flex-grow aspect-[4/3] bg-gray-200 rounded-lg overflow-hidden relative">
              {error && (
                <div className="absolute top-0 left-0 right-0 bg-red-500 text-white p-2 text-sm">
                  {error}
                </div>
              )}
              <video
                ref={videoRef}
                autoPlay
                playsInline
                className="w-full h-full object-cover"
                style={{ transform: 'scaleX(-1)' }}
              />
              {!isStreaming && (
                <div className="absolute inset-0 flex items-center justify-center">
                  <VideoOff className="h-24 w-24 text-gray-400" />
                </div>
              )}
            </div>
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
                disabled={timeLeft === 0 || questions.length === 0}
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