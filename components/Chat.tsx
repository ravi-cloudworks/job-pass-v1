import { useState, useEffect, useRef } from "react"
import { Button } from "@/components/ui/button"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Bot, User, Clock } from "lucide-react"
import { Alert, AlertTitle } from "@/components/ui/alert"
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import QRCodeViewer from "./QRCodeViewer"
import { motion, AnimatePresence } from "framer-motion"
import { getNode, getOptionText, getQuestionSetId, type ChatbotNode } from "@/utils/chatbotFlow"

import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import {
  AlertDialogAction,
  AlertDialogCancel,

} from "@/components/ui/alert-dialog"
import {  AlertDescription } from "@/components/ui/alert"
import { Label } from "@/components/ui/label"

interface ChatMessage {
  role: "ai" | "user";
  content: string;
  type?: "text" | "qr-payment" | "image-generation";
  options?: string[];
  qrData?: {
    amount: number;
    paymentUrl: string;
  };
  complexity?: string;
  category?: string;
  questionSetId?: string;
}

interface ChatProps {
  onSendMessage: (message: string) => void;
  onGenerateImage: (prompt: string, questionSetId: string | undefined, complexity: string, category: string) => Promise<string>;
}

const COMPLEXITY_MINUTES = {
  Easy: 15,
  Medium: 30,
  Strong: 45
}



export default function Chat({ onSendMessage, onGenerateImage }: ChatProps) {
  const [chatHistory, setChatHistory] = useState<ChatMessage[]>([])
  const [currentNode, setCurrentNode] = useState<ChatbotNode>(getNode("root"))
  const [isAiThinking, setIsAiThinking] = useState(false)
  const [selectedQR, setSelectedQR] = useState<string | null>(null)
  const [remainingMinutes, setRemainingMinutes] = useState(120) // 2 hours in minutes
  const [complexity, setComplexity] = useState<string | null>(null)
  const [showConfirmation, setShowConfirmation] = useState(false)
  const [pendingComplexity, setPendingComplexity] = useState<string | null>(null)
  const chatEndRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    // Initialize chat with the root question
    setChatHistory([
      {
        role: "ai",
        content: currentNode.question,
        options: [...(currentNode.options || []), "start_over"],
      },
    ])
  }, [currentNode])

  const scrollToBottom = () => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }

  useEffect(() => {
    scrollToBottom()
  }, [chatHistory])

  const handleOptionClick = async (option: string) => {
    if (option === "start_over") {
      setCurrentNode(getNode("root"))
      setChatHistory([
        {
          role: "ai",
          content: getNode("root").question,
          options: [...(getNode("root").options || []), "start_over"],
        },
      ])
      setComplexity(null)
      return
    }

    const newUserMessage: ChatMessage = { role: "user", content: getOptionText(option) }
    setChatHistory((prev) => [...prev, newUserMessage])

    setIsAiThinking(true)
    onSendMessage(option)

    const nextNode = getNode(option)
    setCurrentNode(nextNode)

    const aiResponse: ChatMessage = {
      role: "ai",
      content: nextNode.question,
      options: [...(nextNode.options || []), "start_over"],
    }
    setChatHistory((prev) => [...prev, aiResponse])

    setIsAiThinking(false)
  }

  const handleComplexitySelection = (selectedComplexity: string) => {
    const requiredMinutes = COMPLEXITY_MINUTES[selectedComplexity as keyof typeof COMPLEXITY_MINUTES]

    if (remainingMinutes < requiredMinutes) {
      const paymentMessage: ChatMessage = {
        role: "ai",
        type: "qr-payment",
        content: "Insufficient minutes remaining. Please purchase more time to continue.",
        qrData: {
          amount: 10,
          paymentUrl: "./placeholder.svg?height=200&width=200&text=Sample+QR+Code",
        },
      }
      setChatHistory(prev => [...prev, paymentMessage])
      return
    }

    setPendingComplexity(selectedComplexity)
    setShowConfirmation(true)
  }

  const handleConfirmation = async (confirmed: boolean) => {
    setShowConfirmation(false)
    
    if (!confirmed || !pendingComplexity) {
      return
    }

    const requiredMinutes = COMPLEXITY_MINUTES[pendingComplexity as keyof typeof COMPLEXITY_MINUTES]
    const complexityMessage: ChatMessage = { role: "user", content: pendingComplexity }
    setChatHistory(prev => [...prev, complexityMessage])
    
    setRemainingMinutes(prev => prev - requiredMinutes)
    setComplexity(pendingComplexity)
    setIsAiThinking(true)
    
    try {
      const questionSetId = getQuestionSetId(currentNode, pendingComplexity)
      
      if (!questionSetId) {
        throw new Error("No valid question set found for the selected complexity")
      }
      
      // Build the full category path
      let categoryPath = currentNode.text || ""
      let currentParent = currentNode.parent
      while (currentParent) {
        const parentNode = getNode(currentParent)
        if (parentNode.text) {
          categoryPath = `${parentNode.text} > ${categoryPath}`
        }
        currentParent = parentNode.parent
      }
      
      const prompt = `${categoryPath} - ${pendingComplexity}`
      
      // Wait for animation steps to complete (40 seconds total)
      await new Promise(resolve => setTimeout(resolve, 40000));
      
      // Only start image generation after animation completes
      const imageUrl = await onGenerateImage(prompt, questionSetId, pendingComplexity, categoryPath)
      
      setIsAiThinking(false)
      const aiResponse: ChatMessage = {
        role: "ai",
        type: "image-generation",
        content: `Your AI interview for ${categoryPath} with ${pendingComplexity} complexity has been generated successfully! You can find "New" in Success Vault.`,
        options: ["start_over"],
        questionSetId: questionSetId,
        complexity: pendingComplexity,
        category: categoryPath
      }
      setChatHistory(prev => [...prev, aiResponse])
    } catch (error) {
      console.error("Error in handleComplexitySelection:", error)
      setIsAiThinking(false)
      const errorMessage: ChatMessage = {
        role: "ai",
        content: "I'm sorry, there was an error generating AI Interview. Please try again.",
        options: ["start_over"],
      }
      setChatHistory(prev => [...prev, errorMessage])
    }
  }

  
  const formatMinutes = (minutes: number) => {
    const hours = Math.floor(minutes / 60)
    const mins = minutes % 60
    return `${hours}h ${mins}m`
  }

  return (
    <div className="flex flex-col h-full">
      <div className="p-2 border-b">
        <Alert>
          <Clock className="h-4 w-4" />
          <AlertTitle className="text-sm">Time Remaining: {formatMinutes(remainingMinutes)}</AlertTitle>
        </Alert>
      </div>
      <ScrollArea className="flex-1 p-2">
        <AnimatePresence>
          {chatHistory.map((msg, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.3 }}
              className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"} mb-4`}
            >
              <div className={`flex items-start max-w-[70%] ${msg.role === "user" ? "flex-row-reverse" : "flex-row"}`}>
                <Avatar className="w-8 h-8 mr-2">
                  <AvatarFallback>
                    {msg.role === "ai" ? <Bot className="w-5 h-5" /> : <User className="w-5 h-5" />}
                  </AvatarFallback>
                </Avatar>
                <div
                  className={`p-3 rounded-lg ${msg.role === "user" ? "bg-blue-500 text-white" : "bg-gray-200 text-gray-800"
                    }`}
                >
                  <p>{msg.content}</p>
                  {msg.type === "qr-payment" && msg.qrData && (
                    <div className="mt-2 cursor-pointer" onClick={() => setSelectedQR(msg.qrData?.paymentUrl || null)}>
                      <img
                        src={msg.qrData.paymentUrl || "./placeholder.svg"}
                        alt="Payment QR Code"
                        className="w-32 h-32 mx-auto"
                      />
                      <p className="text-sm text-center mt-2">Click to enlarge QR code</p>
                    </div>
                  )}

                  {msg.options && (
                    <div className="mt-2 space-y-2">
                      {msg.options.map((option, i) => (
                        <Button
                          key={i}
                          variant="outline"
                          size="sm"
                          className="w-full text-left justify-start"
                          onClick={() =>
                            option === "Easy" || option === "Medium" || option === "Hard"
                              ? handleComplexitySelection(option)
                              : handleOptionClick(option)
                          }
                        >
                          {getOptionText(option)}
                        </Button>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </motion.div>
          ))}
        </AnimatePresence>
        {isAiThinking && (
          <div className="flex justify-start mb-4">
            <div className="flex items-start">
              <Avatar className="w-8 h-8 mr-2">
                <AvatarFallback>
                  <Bot className="w-5 h-5" />
                </AvatarFallback>
              </Avatar>
              <div className="p-3 rounded-lg bg-gray-200 text-gray-800">
                <ThinkingAnimation />
              </div>
            </div>
          </div>
        )}
        <div ref={chatEndRef} />
      </ScrollArea>
      {selectedQR && <QRCodeViewer qrUrl={selectedQR} onClose={() => setSelectedQR(null)} />}

      <AlertDialog open={showConfirmation} onOpenChange={setShowConfirmation}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirm Interview Generation</AlertDialogTitle>
            <AlertDialogDescription className="space-y-4">
              <div className="border rounded-lg p-4 bg-gray-50">
                <p className="font-medium mb-2">Selected Interview Details:</p>
                <div className="space-y-2">
                  <p><span className="text-gray-600">Category:</span> {currentNode.text}</p>
                  <p><span className="text-gray-600">Complexity:</span> {pendingComplexity}</p>
                  <p><span className="text-gray-600">Duration:</span> {COMPLEXITY_MINUTES[pendingComplexity as keyof typeof COMPLEXITY_MINUTES]} minutes</p>
                </div>
              </div>
              <p className="text-yellow-600">
                ⚠️ This action will deduct {COMPLEXITY_MINUTES[pendingComplexity as keyof typeof COMPLEXITY_MINUTES]} minutes
                from your remaining time and cannot be reversed.
              </p>
              <p className="font-medium">Do you want to proceed?</p>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <Button variant="outline" onClick={() => handleConfirmation(false)}>
              Cancel
            </Button>
            <Button
              onClick={() => handleConfirmation(true)}
              className="bg-blue-500 hover:bg-blue-600 text-white"
            >
              Generate Interview
            </Button>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}

function ThinkingAnimation() {
  const [currentStep, setCurrentStep] = useState(0);
  const [dots, setDots] = useState("");
  const [completedSteps, setCompletedSteps] = useState<number[]>([]);
  const [startTime] = useState(Date.now());

  const steps = [
    "AI is generating",
    "Generating your questions",
    "Generating your video infrastructure",
    "Finalizing your interview"
  ];

  useEffect(() => {
    // Dots animation
    const dotsInterval = setInterval(() => {
      setDots((prev) => (prev.length >= 3 ? "" : prev + "."));
    }, 500);

    // Step progression based on elapsed time
    const progressionInterval = setInterval(() => {
      const elapsedTime = Date.now() - startTime;
      const stepDuration = 10000; // 10 seconds per step

      const currentStepIndex = Math.min(
        Math.floor(elapsedTime / stepDuration),
        steps.length - 1
      );

      setCurrentStep(currentStepIndex);

      // Update completed steps
      const newCompletedSteps = [];
      for (let i = 0; i < currentStepIndex; i++) {
        newCompletedSteps.push(i);
      }
      setCompletedSteps(newCompletedSteps);

    }, 100); // Check progress every 100ms for smooth updates

    return () => {
      clearInterval(dotsInterval);
      clearInterval(progressionInterval);
    };
  }, [startTime]); // Only depend on startTime

  return (
    <div className="space-y-3 p-2">
      {steps.map((step, index) => (
        <div key={index} className="flex items-center space-x-3 min-h-[2rem]">
          <div className="w-6 flex justify-center">
            {completedSteps.includes(index) ? (
              <span className="text-green-500 text-lg animate-fade-in">✓</span>
            ) : currentStep === index ? (
              <span className="w-4 text-blue-500">{dots}</span>
            ) : (
              <span className="w-4"></span>
            )}
          </div>
          <span className={`transition-colors duration-300 ${completedSteps.includes(index)
              ? 'text-green-500 font-medium'
              : currentStep === index
                ? 'text-blue-500'
                : 'text-gray-400'
            }`}>
            {step}
          </span>
        </div>
      ))}
    </div>
  );
}