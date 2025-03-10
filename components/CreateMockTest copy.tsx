"use client"

import React, { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
} from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Label } from "@/components/ui/label"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  Download,
  Loader2,
  RefreshCw,
  ChevronLeft,
  ChevronRight,
  Clock
} from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { motion, AnimatePresence } from "framer-motion"
import { marked } from 'marked'

interface Template {
  id: string
  name: string
  file: string
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

// Predefined categories
const PREDEFINED_CATEGORIES = [
  "Frontend Development",
  "Backend Development",
  "DevOps",
  "Full Stack Development",
  "AI Development", 
  "Database Design"
];

export default function CreateMockTest() {
  const { toast } = useToast()
  const [templates, setTemplates] = useState<Template[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [categories] = useState<string[]>(PREDEFINED_CATEGORIES)
  
  // Form state
  const [testId, setTestId] = useState("")
  const [title, setTitle] = useState("")
  const [timeLimit, setTimeLimit] = useState(1800) // Default to 30 minutes
  const [complexity, setComplexity] = useState("Medium")
  const [category, setCategory] = useState("")
  const [markdownContent, setMarkdownContent] = useState("")
  
  // Preview state
  const [previewJson, setPreviewJson] = useState<QuestionSet | null>(null)
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0)

  // Set default category
  useEffect(() => {
    if (categories.length > 0) {
      setCategory(categories[0]);
    }
  }, [categories]);

  // Load sample templates
  useEffect(() => {
    const loadTemplates = async () => {
      try {
        const response = await fetch('./data/sample-tests/sample-mock-interview-list.json')
        if (response.ok) {
          const data = await response.json()
          setTemplates(data)
          console.log("got the template - sample-mock-interview-list.json")
        }
      } catch (error) {
        console.error("Failed to load templates:", error)
      }
    }
    
    loadTemplates()
  }, [])

  // Load a template
  const loadTemplate = async (templateId: string) => {
    setIsLoading(true)
    try {
      const template = templates.find(t => t.id === templateId);
      if (!template) {
        throw new Error("Template not found");
      }
      
      const response = await fetch(`./data/sample-tests/${template.file}`)
      if (response.ok) {
        const data = await response.json()
        setTestId(data.id)
        
        // Set title without markdown formatting
        setTitle(data.title.split('\n')[0].replace(/^#\s+/, ''))
        
        setTimeLimit(data.time_limit)
        
        // Convert questions to markdown without question numbering
        let questionsMarkdown = data.questions.map((q: any) => {
          return `${q.question}\n\n`
        }).join('---\n\n')
        
        setMarkdownContent(questionsMarkdown)
        
        // Update preview
        const testJson: QuestionSet = {
          id: data.id,
          title: `# ${data.title.split('\n')[0].replace(/^#\s+/, '')}`,
          time_limit: data.time_limit,
          questions: data.questions
        }
        
        setPreviewJson(testJson)
        setCurrentQuestionIndex(0)
        
        toast({
          title: "Template loaded",
          description: `Loaded template: ${data.title.split('\n')[0].replace(/^#\s+/, '')}`,
        })
      }
    } catch (error) {
      console.error("Failed to load template:", error)
      toast({
        title: "Error",
        description: "Failed to load template",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  // Parse markdown to JSON
  const parseMarkdownToJson = () => {
    try {
      // Split by horizontal rule
      const questionBlocks = markdownContent.split('---').map(block => block.trim()).filter(Boolean)
      
      const questions = questionBlocks.map((block, index) => {
        return {
          id: `q${index + 1}`,
          question: block
        }
      })
      
      // Validate title length
      if (title.length > 30) {
        toast({
          title: "Title too long",
          description: "Title should be 30 characters or less",
          variant: "destructive",
        })
        return null
      }
      
      const testJson: QuestionSet = {
        id: testId || `TEST-${Math.random().toString(36).substring(2, 8).toUpperCase()}`,
        title: `# ${title}`,
        time_limit: timeLimit,
        questions: questions
      }
      
      setPreviewJson(testJson)
      setCurrentQuestionIndex(0) // Reset to first question when updating
      
      toast({
        title: "Preview Updated",
        description: `Generated preview with ${questions.length} questions`,
      })
      
      return testJson
    } catch (error) {
      console.error("Failed to parse markdown:", error)
      toast({
        title: "Parsing Error",
        description: "Failed to convert markdown to JSON format",
        variant: "destructive",
      })
      return null
    }
  }

  // Download JSON
  const downloadJson = () => {
    const json = parseMarkdownToJson()
    if (json) {
      const blob = new Blob([JSON.stringify(json, null, 2)], { type: 'application/json' })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `${json.id}.json`
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      URL.revokeObjectURL(url)
      
      toast({
        title: "JSON Downloaded",
        description: `File saved as ${json.id}.json`,
      })
    }
  }

  // Insert example template
  const insertExampleTemplate = () => {
    const template = `# Basic Concept
Explain what is X and how it differs from Y.

---

# Code Analysis
Look at this code snippet:

\`\`\`javascript
function example() {
  console.log("Hello world");
}
\`\`\`

What does this code do and how would you improve it?

---

# Implementation Challenge
Write a function that does Z with these requirements:
1. Must handle edge cases
2. Should be efficient

Explain your approach.
`
    setMarkdownContent(template)
  }

  // Handle question navigation
  const handleNextQuestion = () => {
    if (previewJson && currentQuestionIndex < previewJson.questions.length - 1) {
      setCurrentQuestionIndex(prev => prev + 1)
    }
  }

  const handlePreviousQuestion = () => {
    if (currentQuestionIndex > 0) {
      setCurrentQuestionIndex(prev => prev - 1)
    }
  }

  // Helper function to get complexity stars
  const getComplexityStars = (complexity: string) => {
    switch (complexity) {
      case 'Easy': return '⭐';
      case 'Medium': return '⭐⭐';
      case 'Advanced': return '⭐⭐⭐';
      default: return '⭐';
    }
  }

  // Format time as MM:SS
  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins}:${secs.toString().padStart(2, '0')}`
  }

  return (
    <div className="container mx-auto py-6">
      <h1 className="text-2xl font-bold mb-6">Create Mock Interview Test</h1>
      
      <div className="grid grid-cols-2 gap-6">
        {/* Editor Side */}
        <Card className="col-span-1">
          <CardContent className="pt-6">
            <Tabs defaultValue="settings">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="settings">Test Information</TabsTrigger>
                <TabsTrigger value="questions">Questions</TabsTrigger>
              </TabsList>
              
              {/* Test Settings Tab */}
              <TabsContent value="settings" className="space-y-4 pt-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="test-id">Test ID</Label>
                    <Input
                      id="test-id"
                      placeholder="FRONT-BEG-001"
                      value={testId}
                      onChange={(e) => setTestId(e.target.value)}
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="title">Title (max 30 chars)</Label>
                    <Input
                      id="title"
                      placeholder="Frontend Development Basics"
                      value={title}
                      onChange={(e) => {
                        if (e.target.value.length <= 30) {
                          setTitle(e.target.value)
                        }
                      }}
                      maxLength={30}
                    />
                    <div className="text-xs text-right text-muted-foreground">
                      {title.length}/30
                    </div>
                  </div>
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="complexity">Complexity</Label>
                    <Select 
                      value={complexity} 
                      onValueChange={setComplexity}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select complexity" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Easy">Easy</SelectItem>
                        <SelectItem value="Medium">Medium</SelectItem>
                        <SelectItem value='Advanced'>Advanced</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="category">Category</Label>
                    <Select 
                      value={category} 
                      onValueChange={setCategory}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select category" />
                      </SelectTrigger>
                      <SelectContent>
                        {categories.map((cat) => (
                          <SelectItem key={cat} value={cat}>
                            {cat}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                
                <div className="space-y-2">
                  <Label>Time Limit</Label>
                  <div className="flex space-x-2">
                    <Button 
                      type="button" 
                      variant={timeLimit === 900 ? "default" : "outline"}
                      className="flex-1"
                      onClick={() => setTimeLimit(900)}
                    >
                      <Clock className="mr-2 h-4 w-4" />
                      15 Minutes
                    </Button>
                    <Button 
                      type="button" 
                      variant={timeLimit === 1800 ? "default" : "outline"}
                      className="flex-1"
                      onClick={() => setTimeLimit(1800)}
                    >
                      <Clock className="mr-2 h-4 w-4" />
                      30 Minutes
                    </Button>
                    <Button 
                      type="button" 
                      variant={timeLimit === 2700 ? "default" : "outline"}
                      className="flex-1"
                      onClick={() => setTimeLimit(2700)}
                    >
                      <Clock className="mr-2 h-4 w-4" />
                      45 Minutes
                    </Button>
                  </div>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="template">Load Template</Label>
                  <Select onValueChange={loadTemplate}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select template" />
                    </SelectTrigger>
                    <SelectContent>
                      {templates.map((template) => (
                        <SelectItem key={template.id} value={template.id}>
                          {template.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </TabsContent>
              
              {/* Questions Tab */}
              <TabsContent value="questions" className="pt-4">
                <Tabs defaultValue="editor">
                  <TabsList className="grid w-full grid-cols-2">
                    <TabsTrigger value="editor">Editor</TabsTrigger>
                    <TabsTrigger value="guide">Markdown Guide</TabsTrigger>
                  </TabsList>
                  <TabsContent value="editor" className="space-y-4 pt-4">
                    {/* <div className="flex justify-end">
                      <Button variant="ghost" size="sm" onClick={insertExampleTemplate}>
                        Insert Example
                      </Button>
                    </div> */}
                    <Textarea
                      value={markdownContent}
                      onChange={(e) => setMarkdownContent(e.target.value)}
                      placeholder="Enter your questions here..."
                      className="min-h-[400px] font-mono text-sm"
                    />
                    <div className="text-xs text-muted-foreground">
                      Use --- to separate questions
                    </div>
                  </TabsContent>
                  <TabsContent value="guide" className="pt-4">
                    <div className="prose prose-sm max-w-none p-4 border rounded-md">
                      <h3>Markdown Guide</h3>
                      <p>Use markdown to format your questions:</p>
                      <ul>
                        <li><code># Heading 1</code> - Main heading</li>
                        <li><code>## Heading 2</code> - Sub heading</li>
                        <li><code>**bold**</code> - <strong>Bold text</strong></li>
                        <li><code>*italic*</code> - <em>Italic text</em></li>
                        <li><code>```code```</code> - Code blocks</li>
                        <li><code>- item</code> - Bullet lists</li>
                        <li><code>1. item</code> - Numbered lists</li>
                      </ul>
                      <h4>Question Format</h4>
                      <p>Separate each question with <code>---</code></p>
                      <p>Each question should have a clear title and detailed content.</p>
                    </div>
                  </TabsContent>
                </Tabs>
              </TabsContent>
            </Tabs>
          </CardContent>
          <CardFooter className="flex justify-between">
            <Button variant="outline" onClick={parseMarkdownToJson}>
              <RefreshCw className="mr-2 h-4 w-4" />
              Update Preview
            </Button>
            <Button variant="secondary" onClick={downloadJson}>
              <Download className="mr-2 h-4 w-4" />
              Download JSON
            </Button>
          </CardFooter>
        </Card>

        {/* Preview Side */}
        <Card className="col-span-1">
          <CardHeader className="py-3 px-4 border-b flex justify-between items-center">
            <div className="flex flex-col">
              <div className="flex items-center gap-2 mb-1">
                <span className="text-xs font-medium px-2 py-0.5 rounded-full bg-blue-50 text-blue-700 border border-blue-200">
                  {getComplexityStars(complexity)} {complexity}
                </span>
                {category && (
                  <span className="text-xs font-medium px-2 py-0.5 rounded-full bg-gray-50 text-gray-700 border border-gray-200">
                    {category}
                  </span>
                )}
              </div>
              <h1 className="text-lg font-semibold">
                {title || "New Interview Test"}
              </h1>
            </div>
          </CardHeader>
          
          <div className="py-3 px-4 bg-primary/5 border-b border-primary/20 flex items-center">
            <span className="text-sm font-medium">
              Time limit: {formatTime(timeLimit)}
            </span>
          </div>
          
          <CardContent className="flex-grow p-0">
            {isLoading ? (
              <div className="flex items-center justify-center h-[600px]">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
                <span className="ml-2">Loading...</span>
              </div>
            ) : previewJson && previewJson.questions.length > 0 ? (
              <div className="flex flex-col h-[600px]">
                <AnimatePresence mode="wait">
                  <motion.div
                    key={currentQuestionIndex}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    transition={{ duration: 0.2 }}
                    className="flex-grow flex flex-col p-4 overflow-auto"
                  >
                    <div className="flex items-center mb-2">
                      <span className="text-xs text-muted-foreground">
                        Question {currentQuestionIndex + 1} of {previewJson.questions.length}
                      </span>
                    </div>
                    <div className="flex-grow overflow-y-auto mb-4">
                      <div
                        dangerouslySetInnerHTML={{
                          __html: `
                            <style>
                              .md-content h1 { font-size: 1.8em; font-weight: bold; margin-bottom: 0.5em; }
                              .md-content h2 { font-size: 1.5em; font-weight: bold; margin-bottom: 0.5em; }
                              .md-content pre { background-color: #f4f4f4; padding: 1rem; border-radius: 4px; }
                              .md-content ul { list-style-type: disc; margin-left: 1.5em; }
                              .md-content ol { list-style-type: decimal; margin-left: 1.5em; }
                              .md-content code { background-color: #f4f4f4; padding: 0.2em 0.4em; border-radius: 3px; font-family: monospace; }
                            </style>
                            <div class="md-content">${marked(previewJson.questions[currentQuestionIndex]?.question || "")}</div>
                          `
                        }}
                        className="question-content"
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
                        disabled={currentQuestionIndex === previewJson.questions.length - 1}
                        variant="ghost"
                        size="sm"
                        className="text-xs"
                      >
                        Next <ChevronRight className="ml-1 h-4 w-4" />
                      </Button>
                    </div>
                  </motion.div>
                </AnimatePresence>
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center h-[600px] text-center p-6">
                <div className="mb-4">
                  <RefreshCw className="h-10 w-10 text-muted-foreground mx-auto mb-2" />
                  <h3 className="text-lg font-medium">No Preview Available</h3>
                </div>
                <p className="text-sm text-muted-foreground max-w-md">
                  Write your questions in the markdown editor and click "Update Preview" to see how they will appear to students.
                </p>
              </div>
            )}
          </CardContent>
          <CardFooter className="justify-center p-3 border-t">
            <div className="text-xs text-muted-foreground">
              This is how students will see your questions during the mock interview
            </div>
          </CardFooter>
        </Card>
      </div>
    </div>
  )
}