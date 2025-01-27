import { useState, useEffect, useRef } from "react"
import { Button } from "@/components/ui/button"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Bot, User, Wallet } from "lucide-react"
import { Alert, AlertTitle } from "@/components/ui/alert"
import QRCodeViewer from "./QRCodeViewer"
import { motion, AnimatePresence } from "framer-motion"
import { getNode, getOptionText, getQuestionSetId, type ChatbotNode } from "@/utils/chatbotFlow"

interface ChatMessage {
  role: "ai" | "user";
  content: string;
  type?: "text" | "qr-payment" | "image-generation";
  options?: string[];
  qrData?: {
    amount: number;
    paymentUrl: string;
  };
  imageUrl?: string;
  questionSetId?: string;
}


interface ChatProps {
  onSendMessage: (message: string) => void
  onGenerateImage: (prompt: string, questionSetId: string | undefined) => Promise<string>
}

export default function Chat({ onSendMessage, onGenerateImage }: ChatProps) {
  const [chatHistory, setChatHistory] = useState<ChatMessage[]>([])
  const [currentNode, setCurrentNode] = useState<ChatbotNode>(getNode("root"))
  const [isAiThinking, setIsAiThinking] = useState(false)
  const [selectedQR, setSelectedQR] = useState<string | null>(null)
  const [credits, setCredits] = useState(3) // Start with 3 credits for testing
  const [complexity, setComplexity] = useState<string | null>(null)
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
  }, [currentNode, currentNode.question, currentNode.options]) // Added currentNode.question to dependencies

  const scrollToBottom = () => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }

  useEffect(() => {
    scrollToBottom()
  }, [chatHistory, chatEndRef]) // Added chatEndRef to dependencies

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

    if (credits <= 0) {
      const paymentMessage: ChatMessage = {
        role: "ai",
        type: "qr-payment",
        content: "Insufficient credits. Please scan the QR code to add more credits.",
        qrData: {
          amount: 10,
          paymentUrl: "/placeholder.svg?height=200&width=200&text=Sample+QR+Code",
        },
      }
      setChatHistory((prev) => [...prev, paymentMessage])
      return
    }

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

  const handleComplexitySelection = async (selectedComplexity: string) => {
  setComplexity(selectedComplexity);
  const complexityMessage: ChatMessage = { role: "user", content: selectedComplexity };
  setChatHistory(prev => [...prev, complexityMessage]);

  if (credits <= 0) {
    const paymentMessage: ChatMessage = {
      role: "ai",
      type: "qr-payment",
      content: "Insufficient credits. Please scan the QR code to add more credits.",
      qrData: {
        amount: 10,
        paymentUrl: "/placeholder.svg?height=200&width=200&text=Sample+QR+Code",
      },
    };
    setChatHistory(prev => [...prev, paymentMessage]);
    return;
  }

  setCredits(prev => prev - 1);
  setIsAiThinking(true);
  
  try {
    const questionSetId = getQuestionSetId(currentNode, selectedComplexity);
    if (!questionSetId) {
      throw new Error("No valid question set found for the selected complexity");
    }
    
    const prompt = `${currentNode.text || ""} - ${selectedComplexity}`;
    const imageUrl = await onGenerateImage(prompt, questionSetId);
    
    setIsAiThinking(false);
    const aiResponse: ChatMessage = {
      role: "ai",
      type: "image-generation",
      content: `I've generated an image based on "${prompt}". You can see it in the gallery on the right.`,
      options: ["start_over"],
      imageUrl: imageUrl,
      questionSetId: questionSetId,
    };
    setChatHistory(prev => [...prev, aiResponse]);
  } catch (error) {
    console.error("Error in handleComplexitySelection:", error);
    setIsAiThinking(false);
    const errorMessage: ChatMessage = {
      role: "ai",
      content: "I'm sorry, there was an error generating AI Interview. Please try again.",
      options: ["start_over"],
    };
    setChatHistory(prev => [...prev, errorMessage]);
  }
};

  return (
    <div className="flex flex-col h-full">
      <div className="p-2 border-b">
        <Alert>
          <Wallet className="h-4 w-4" />
          <AlertTitle className="text-sm">Credits: {credits}</AlertTitle>
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
                  className={`p-3 rounded-lg ${
                    msg.role === "user" ? "bg-blue-500 text-white" : "bg-gray-200 text-gray-800"
                  }`}
                >
                  <p>{msg.content}</p>
                  {msg.type === "qr-payment" && msg.qrData && (
                    <div className="mt-2 cursor-pointer" onClick={() => setSelectedQR(msg.qrData?.paymentUrl || null)}>
                      <img
                        src={msg.qrData.paymentUrl || "/placeholder.svg"}
                        alt="Payment QR Code"
                        className="w-32 h-32 mx-auto"
                      />
                      <p className="text-sm text-center mt-2">Click to enlarge QR code</p>
                    </div>
                  )}
                  {msg.type === "image-generation" && msg.imageUrl && (
                    <div className="mt-2">
                      <img
                        src={msg.imageUrl || "/placeholder.svg"}
                        alt="Generated Image"
                        className="w-full h-auto rounded-lg"
                      />
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
                            option === "Easy" || option === "Medium" || option === "Strong"
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
    </div>
  )
}

function ThinkingAnimation() {
  const [dots, setDots] = useState("")

  useEffect(() => {
    const interval = setInterval(() => {
      setDots((prev) => (prev.length >= 3 ? "" : prev + "."))
    }, 500)

    return () => clearInterval(interval)
  }, [])

  return (
    <div className="flex items-center space-x-1">
      <span>AI is thinking</span>
      <span className="w-8 text-left">{dots}</span>
    </div>
  )
}

