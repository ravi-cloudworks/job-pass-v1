import { useState, useEffect, useRef, useCallback } from "react"
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
  AlertDialogAction,
  AlertDialogCancel,
} from "@/components/ui/alert-dialog"
import { motion, AnimatePresence } from "framer-motion"
import { getNode, getOptionText, getQuestionSetId, type ChatbotNode } from "@/utils/chatbotFlow"
import { Card, CardContent } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"

interface ChatMessage {
  role: "ai" | "user";
  content: string;
  type?: "text" | "image-generation" | "payment-options";
  options?: string[];
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
  Hard: 45
}

const validatePrepaidCode = async (code: string): Promise<boolean> => {
  // Dummy validation that always returns true
  // TODO: Replace with actual validation logic
  await new Promise(resolve => setTimeout(resolve, 1000)); // Simulate API call delay
  return true;
}

// Typing effect component
function TypingEffect({ text, messageIndex, onComplete }: {
  text: string;
  messageIndex: number;
  onComplete: (index: number, text: string) => void;
}) {
  const [displayedText, setDisplayedText] = useState("");
  const [isComplete, setIsComplete] = useState(false);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    // Clear any existing timeouts
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }

    // Reset state
    setDisplayedText("");
    setIsComplete(false);

    // Add a small delay before starting to ensure component is fully mounted
    timeoutRef.current = setTimeout(() => {
      let fullText = "";
      const typeNextChar = (index: number) => {
        if (index >= text.length) {
          setIsComplete(true);

          // Add a small delay before marking as complete
          setTimeout(() => {
            onComplete(messageIndex, text);
          }, 300);
          return;
        }

        fullText += text.charAt(index);
        setDisplayedText(fullText);

        // Schedule next character
        timeoutRef.current = setTimeout(() => typeNextChar(index + 1), 20);
      };

      // Start typing from the first character
      typeNextChar(0);
    }, 50);

    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, [text, messageIndex, onComplete]);

  return (
    <>
      {displayedText}
      {!isComplete && <span className="inline-block w-1.5 h-4 ml-0.5 align-[-0.1em] bg-current opacity-70 animate-pulse">|</span>}
    </>
  );
}

export default function Chat({ onSendMessage, onGenerateImage }: ChatProps) {
  const [chatHistory, setChatHistory] = useState<ChatMessage[]>([])
  const [currentNode, setCurrentNode] = useState<ChatbotNode>(getNode("root"))
  const [isAiThinking, setIsAiThinking] = useState(false)
  const [remainingMinutes, setRemainingMinutes] = useState(15) // Initial minutes
  const [complexity, setComplexity] = useState<string | null>(null)
  const [showConfirmation, setShowConfirmation] = useState(false)
  const [pendingComplexity, setPendingComplexity] = useState<string | null>(null)
  const chatEndRef = useRef<HTMLDivElement>(null)
  const [showPrepaidCodeDialog, setShowPrepaidCodeDialog] = useState(false)
  const [prepaidCode, setPrepaidCode] = useState("")
  const [displayedTextMap, setDisplayedTextMap] = useState<{ [key: number]: string }>({})

  const handleTypingComplete = useCallback((index: number, text: string) => {
    setDisplayedTextMap(prev => ({ ...prev, [index]: text }));
  }, []);


  const [isProcessingComplexity, setIsProcessingComplexity] = useState(false);


  useEffect(() => {
    // Check if the current node is the root node by comparing with the root node object
    const rootNode = getNode("root");
    const isRootNode = currentNode === rootNode;

    setChatHistory([
      {
        role: "ai",
        content: currentNode.question,
        options: isRootNode
          ? [...(currentNode.options || [])]  // No "start_over" for root node
          : [...(currentNode.options || []), "start_over"], // Add "start_over" for all other nodes
      }
    ]);
  }, [currentNode]);

  const scrollToBottom = () => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }

  useEffect(() => {
    scrollToBottom()
  }, [chatHistory, displayedTextMap])

  const handleOptionClick = async (option: string) => {
    if (option === "start_over") {
      // Always reset to root node
      setCurrentNode(getNode("root"));

      // Root question should never have "start over" option
      setChatHistory([{
        role: "ai",
        content: getNode("root").question,
        options: [...(getNode("root").options || [])] // No "start_over"
      }]);

      setComplexity(null);
      setDisplayedTextMap({});

      setTimeout(() => {
        handleTypingComplete(0, getNode("root").question);
      }, 100);
      return;
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
    if (isProcessingComplexity) return; // Prevent multiple selections

    const requiredMinutes = COMPLEXITY_MINUTES[selectedComplexity as keyof typeof COMPLEXITY_MINUTES];

    if (remainingMinutes < requiredMinutes) {
      const paymentOptionsMessage: ChatMessage = {
        role: "ai",
        type: "payment-options",
        content: "Insufficient minutes remaining. Please choose a payment option:",
        options: ["use_prepaid_code"]
      };
      setChatHistory(prev => [...prev, paymentOptionsMessage]);
      setPendingComplexity(selectedComplexity);
      return;
    }

    setPendingComplexity(selectedComplexity);
    setIsProcessingComplexity(true); // Set processing state
    setShowConfirmation(true);
  };

  const handlePaymentOption = async (option: string) => {
    if (option === "use_prepaid_code") {
      setShowPrepaidCodeDialog(true)
    }
  }

  const handleConfirmation = async (confirmed: boolean) => {
    setShowConfirmation(false)

    if (!confirmed || !pendingComplexity) {
      setIsProcessingComplexity(false); // Reset if canceled
      return;
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
      setIsProcessingComplexity(false) // Add this line to reset the state

      const aiResponse: ChatMessage = {
        role: "ai",
        type: "image-generation",
        content: `Your AI interview for ${categoryPath} with ${pendingComplexity} complexity has been generated successfully! You can find "New" in Assessment Vault.`,
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
      setIsProcessingComplexity(false);
    }
  }

  const handlePrepaidCodeSubmit = async () => {
    try {
      const isValidCode = await validatePrepaidCode(prepaidCode)

      if (isValidCode) {
        setShowPrepaidCodeDialog(false)
        setPrepaidCode("")

        // Calculate new remaining minutes
        const newRemainingMinutes = remainingMinutes + 30
        setRemainingMinutes(newRemainingMinutes)

        // Use the new value directly when checking
        if (pendingComplexity) {
          const requiredMinutes = COMPLEXITY_MINUTES[pendingComplexity as keyof typeof COMPLEXITY_MINUTES]

          if (newRemainingMinutes >= requiredMinutes) {
            setPendingComplexity(pendingComplexity)
            setShowConfirmation(true)
          } else {
            const paymentOptionsMessage: ChatMessage = {
              role: "ai",
              type: "payment-options",
              content: "Insufficient minutes remaining. Please choose a payment option:",
              options: ["use_prepaid_code"]
            }
            setChatHistory(prev => [...prev, paymentOptionsMessage])
          }
        }
      } else {
        // Show error message
        const errorMessage: ChatMessage = {
          role: "ai",
          content: "Invalid prepaid code. Please try again.",
          options: ["use_prepaid_code"],
        }
        setChatHistory(prev => [...prev, errorMessage])
      }
    } catch (error) {
      console.error("Error validating prepaid code:", error)
    }
  }

  const formatMinutes = (minutes: number) => {
    const hours = Math.floor(minutes / 60)
    const mins = minutes % 60
    return `${hours}h ${mins}m`
  }

  // Extract option rendering to a separate function for cleaner code
  const renderOptions = (options: string[]) => {
    return options.map((option, i) => (
      <Button
        key={i}
        variant={option === "use_prepaid_code" ? "default" : "secondary"}
        size="sm"
        disabled={isProcessingComplexity && (
          option === "Easy" ||
          option === "Medium" ||
          option === "Hard" ||
          option === "start_over"
        )}
        className={`w-full text-left justify-start text-xs 
    ${isProcessingComplexity && (option === "Easy" || option === "Medium" || option === "Hard" || option === "start_over")
            ? "opacity-50 cursor-not-allowed" // Add disabled styling
            : "hover:scale-102 transition-transform"
          } ${option === "use_prepaid_code"
            ? "bg-primary hover:bg-primary/90 text-primary-foreground"
            : option === "Easy" || option === "Medium" || option === "Hard"
              ? "bg-blue-50 border border-blue-200 hover:bg-blue-100 text-blue-800"
              : option === "start_over"
                ? "bg-gray-100 hover:bg-gray-200 text-gray-800"
                : "bg-white hover:bg-gray-50 border border-gray-200 shadow-sm"
          }`}
        onClick={() => {
          if (isProcessingComplexity && (
            option === "Easy" ||
            option === "Medium" ||
            option === "Hard" ||
            option === "start_over"
          )) {
            return; // Additional guard in onClick
          } else if (option === "use_prepaid_code") {
            handlePaymentOption(option);
          } else if (option === "Easy" || option === "Medium" || option === "Hard") {
            handleComplexitySelection(option);
          } else {
            handleOptionClick(option);
          }
        }}
      >
        {option === "use_prepaid_code" ? (
          <div className="flex items-center">
            <span className="mr-2 text-xs">💳</span>
            <span>Use Prepaid Code</span>
          </div>
        ) : option === "start_over" ? (
          <div className="flex items-center">
            <span className="mr-2 text-xs">🔄</span>
            <span>{getOptionText(option)}</span>
          </div>
        ) : option === "Easy" || option === "Medium" || option === "Hard" ? (
          <div className="flex items-center">
            <span className="mr-2 text-xs">{option === "Easy" ? "⭐" : option === "Medium" ? "⭐⭐" : "⭐⭐⭐"}</span>
            <span>{option}</span>
            <span className="ml-2 text-xs font-normal text-gray-500">
              ({COMPLEXITY_MINUTES[option as keyof typeof COMPLEXITY_MINUTES]} min)
            </span>
          </div>
        ) : (
          <div className="flex items-center">
            <span className="mr-2 text-xs">→</span>
            <span>{getOptionText(option)}</span>
          </div>
        )}
      </Button>
    ));
  };

  return (
    <div className="flex flex-col h-full bg-background">
      <div className="py-3 px-4 border-b">
        <Alert className="border-primary/20 bg-primary/5">
          <Clock className="h-4 w-4 text-primary" />
          <AlertTitle className="text-sm font-medium">Time Remaining: {formatMinutes(remainingMinutes)}</AlertTitle>
        </Alert>
      </div>
      <ScrollArea className="flex-1 px-4 py-3">
        <AnimatePresence initial={false} mode="sync">
          {chatHistory.map((msg, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, height: 0, marginBottom: 0, overflow: "hidden" }}
              transition={{ duration: 0.3, ease: [0.4, 0, 0.2, 1] }}
              className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"} mb-5`}
            >
              <div className={`flex items-start max-w-[80%] ${msg.role === "user" ? "flex-row-reverse" : "flex-row"}`}>
                <Avatar className={`w-8 h-8 ${msg.role === "user" ? "ml-3" : "mr-3"} flex-shrink-0`}>
                  <AvatarFallback className={msg.role === "user" ? "bg-primary" : "bg-muted"}>
                    {msg.role === "ai" ? <Bot className="w-4 h-4 text-foreground/80" /> : <User className="w-4 h-4 text-primary-foreground" />}
                  </AvatarFallback>
                </Avatar>

                <div
                  className={`p-3 rounded-lg ${msg.role === "user"
                    ? "bg-primary text-primary-foreground"
                    : "bg-muted text-foreground"
                    }`}
                >
                  <p className="text-sm">
                    {msg.role === "ai" ? (
                      <TypingEffect
                        text={msg.content}
                        messageIndex={index}
                        onComplete={handleTypingComplete}
                      />
                    ) : (
                      msg.content
                    )}
                  </p>

                  {msg.options && (
                    <>
                      {/* For AI messages, only show options after typing completes */}
                      {msg.role === "ai" ? (
                        displayedTextMap[index] === msg.content && (
                          <motion.div
                            initial={{ opacity: 0, y: 5 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.3 }}
                            className="mt-3 space-y-2"
                          >
                            {/* Options buttons */}
                            {renderOptions(msg.options)}
                          </motion.div>
                        )
                      ) : (
                        /* For user messages, always show options */
                        <div className="mt-3 space-y-2">
                          {/* Options buttons */}
                          {renderOptions(msg.options)}
                        </div>
                      )}
                    </>
                  )}
                </div>


              </div>
            </motion.div>
          ))}
        </AnimatePresence>
        {isAiThinking && (
          <div className="flex justify-start mb-4">
            <div className="flex items-start">
              <Avatar className="w-8 h-8 mr-3 flex-shrink-0">
                <AvatarFallback className="bg-muted">
                  <Bot className="w-4 h-4 text-foreground/80" />
                </AvatarFallback>
              </Avatar>
              <Card className="p-2 bg-muted border-none shadow-none">
                <CardContent className="p-2">
                  <ThinkingAnimation />
                </CardContent>
              </Card>
            </div>
          </div>
        )}
        <div ref={chatEndRef} />
      </ScrollArea>

      <AlertDialog open={showConfirmation} onOpenChange={setShowConfirmation}>
        <AlertDialogContent className="sm:max-w-md">
          <AlertDialogHeader>
            <AlertDialogTitle>Confirm Interview Generation</AlertDialogTitle>
            <AlertDialogDescription className="space-y-4">
              <div className="border rounded-lg p-4 bg-muted/50">
                <p className="font-medium mb-2 text-sm">Selected Interview Details:</p>
                <div className="space-y-2 text-sm">
                  <p><span className="text-muted-foreground">Category:</span> {currentNode.text}</p>
                  <p><span className="text-muted-foreground">Complexity:</span> {pendingComplexity}</p>
                  <p><span className="text-muted-foreground">Duration:</span> {COMPLEXITY_MINUTES[pendingComplexity as keyof typeof COMPLEXITY_MINUTES]} minutes</p>
                </div>
              </div>
              <div className="flex gap-2 items-start p-3 bg-amber-50 rounded-md border border-amber-200">
                <Clock className="h-4 w-4 text-amber-600 mt-0.5 flex-shrink-0" />
                <p className="text-amber-800 text-sm">
                  This action will deduct {COMPLEXITY_MINUTES[pendingComplexity as keyof typeof COMPLEXITY_MINUTES]} minutes
                  from your remaining time and cannot be reversed.
                </p>
              </div>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="mt-4">
            <AlertDialogCancel onClick={() => handleConfirmation(false)}>
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={() => handleConfirmation(true)}
              className="bg-primary hover:bg-primary/90"
            >
              Generate Interview
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog open={showPrepaidCodeDialog} onOpenChange={setShowPrepaidCodeDialog}>
        <AlertDialogContent className="sm:max-w-md">
          <AlertDialogHeader>
            <AlertDialogTitle>Enter Prepaid Code</AlertDialogTitle>
            <AlertDialogDescription>
              Please enter your prepaid code to add more minutes.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="prepaid-code" className="text-right text-sm">
                Code
              </Label>
              <Input
                id="prepaid-code"
                value={prepaidCode}
                onChange={(e) => setPrepaidCode(e.target.value)}
                className="col-span-3"
                placeholder="Enter your code"
              />
            </div>
          </div>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setShowPrepaidCodeDialog(false)}>
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction onClick={handlePrepaidCodeSubmit}>
              Submit
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}



function ThinkingAnimation() {
  const [currentStep, setCurrentStep] = useState(0);
  const [completedSteps, setCompletedSteps] = useState<number[]>([]);
  const [startTime] = useState(Date.now());

  const steps = [
    "AI is generating",
    "Generating your questions",
    "Generating your video infrastructure",
    "Finalizing your interview"
  ];

  useEffect(() => {
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
      clearInterval(progressionInterval);
    };
  }, [startTime]); // Only depend on startTime

  return (
    <div className="space-y-3">
      {steps.map((step, index) => (
        <div key={index} className="flex items-center space-x-3 min-h-[1.75rem]">
          <div className="w-6 flex justify-center">
            {completedSteps.includes(index) ? (
              <span className="text-green-500 text-base animate-fade-in">✓</span>
            ) : currentStep === index ? (
              <div className="flex space-x-1">
                <div className="w-1.5 h-1.5 bg-primary rounded-full animate-bounce" style={{ animationDelay: "0ms" }}></div>
                <div className="w-1.5 h-1.5 bg-primary rounded-full animate-bounce" style={{ animationDelay: "150ms" }}></div>
                <div className="w-1.5 h-1.5 bg-primary rounded-full animate-bounce" style={{ animationDelay: "300ms" }}></div>
              </div>
            ) : (
              <span className="w-4"></span>
            )}
          </div>
          <span className={`transition-colors duration-300 text-sm ${completedSteps.includes(index)
            ? 'text-green-500 font-medium'
            : currentStep === index
              ? 'text-primary font-medium'
              : 'text-muted-foreground'
            }`}>
            {step}
          </span>
        </div>
      ))}
    </div>
  );
}