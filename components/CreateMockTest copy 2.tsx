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
  Clock,
  AlertTriangle,
  CheckCircle,
  ImageOff
} from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { motion, AnimatePresence } from "framer-motion"
import { marked } from 'marked'
import DOMPurify from 'dompurify'
import { Progress } from "@/components/ui/progress"
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"

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

interface ValidationError {
  type: string
  message: string
  line?: number
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

// Max character limits
const MAX_CHARS = 7500;
const MAX_QUESTIONS = 30;

// Trusted domains for images
const TRUSTED_DOMAINS = [
  'miro.medium.com',
  'cdn.educba.com',
  'assets.digitalocean.com',
  'www.washington.edu',
  'cdn-images-1.medium.com',
  'cdn.jsdelivr.net',
  'd2slcw3kip6qmk.cloudfront.net',
  'mdn.mozillademos.org',
  'www.tutorialspoint.com',
  // Add more trusted domains as needed
];

export default function CreateMockTest() {
  const { toast } = useToast()
  const [templates, setTemplates] = useState<Template[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [categories] = useState<string[]>(PREDEFINED_CATEGORIES)

  // Form state
  const [testId, setTestId] = useState("")
  const [title, setTitle] = useState("")
  const [timeLimit, setTimeLimit] = useState(900) // Default to 15 minutes
  const [complexity, setComplexity] = useState("Medium")
  const [category, setCategory] = useState("")
  const [markdownContent, setMarkdownContent] = useState("")

  // Preview state
  const [previewJson, setPreviewJson] = useState<QuestionSet | null>(null)
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0)

  // Validation state
  const [validationErrors, setValidationErrors] = useState<ValidationError[]>([])
  const [isValidating, setIsValidating] = useState(false)
  const [validationProgress, setValidationProgress] = useState(0)
  const [brokenImages, setBrokenImages] = useState<string[]>([])

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

  // Modified checkImageUrls to be more robust
  const checkImageUrls = async (markdown: string): Promise<string[]> => {
    console.log(`[IMAGE_CHECK] Starting image URL check on content (${markdown.length} chars)`);

    const imgRegex = /!\[.*?\]\((.*?)\)/g;
    const imageUrls: string[] = [];
    let match;

    // Extract all image URLs from the markdown
    while ((match = imgRegex.exec(markdown)) !== null) {
      if (match[1]) {
        imageUrls.push(match[1].trim());
        console.log(`[IMAGE_CHECK] Found image URL: ${match[1].trim()}`);
      }
    }

    console.log(`[IMAGE_CHECK] Found ${imageUrls.length} total image URLs in content`);

    if (imageUrls.length === 0) {
      console.log(`[IMAGE_CHECK] No images to check, returning empty list`);
      setBrokenImages([]);
      return [];
    }

    const brokenUrlsList: string[] = [];

    // Check each image URL
    for (const url of imageUrls) {
      console.log(`[IMAGE_CHECK] Validating URL: ${url}`);

      try {
        // Check if URL is from trusted domain
        const urlObj = new URL(url);
        const domain = urlObj.hostname;

        if (!TRUSTED_DOMAINS.includes(domain)) {
          console.log(`[IMAGE_CHECK] Untrusted domain: ${domain} for URL: ${url}`);
          brokenUrlsList.push(`${url} (untrusted domain: ${domain})`);
          continue;
        }

        // Try to load the image
        console.log(`[IMAGE_CHECK] Checking if image can be loaded: ${url}`);
        const isValid = await new Promise<boolean>((resolve) => {
          const img = new Image();
          img.onload = () => {
            console.log(`[IMAGE_CHECK] Image loaded successfully: ${url}`);
            resolve(true);
          };
          img.onerror = () => {
            console.log(`[IMAGE_CHECK] Image failed to load: ${url}`);
            resolve(false);
          };
          img.src = url;
          // Set a timeout in case the image hangs
          setTimeout(() => {
            console.log(`[IMAGE_CHECK] Image load timeout: ${url}`);
            resolve(false);
          }, 5000);
        });

        if (!isValid) {
          console.log(`[IMAGE_CHECK] Adding to broken URLs: ${url} (cannot be loaded)`);
          brokenUrlsList.push(`${url} (cannot be loaded)`);
        }
      } catch (err) {
        console.log(`[IMAGE_CHECK] Invalid URL format: ${url}, Error: ${err}`);
        brokenUrlsList.push(`${url} (invalid URL format)`);
      }
    }

    console.log(`[IMAGE_CHECK] Found ${brokenUrlsList.length} broken/untrusted images: ${JSON.stringify(brokenUrlsList)}`);

    // Update the state with the broken URLs
    setBrokenImages(brokenUrlsList);
    return brokenUrlsList;
  };

  const debugLog = (message: string, data?: any) => {
    console.log(`[DEBUG] ${message}`, data || '');
  };

  // Fix validateContent to avoid dependency on state and prevent race conditions
  const validateContent = async (content: string): Promise<ValidationError[]> => {
    console.log(`[VALIDATE] Starting validation on content (${content.length} chars)`);
    const errors: ValidationError[] = [];
    setIsValidating(true);
    setValidationProgress(0);

    try {
      // 1. Check character limit
      if (content.length > MAX_CHARS) {
        console.log(`[VALIDATE] Character limit exceeded: ${content.length}/${MAX_CHARS}`);
        errors.push({
          type: 'character_limit',
          message: `Content exceeds maximum ${MAX_CHARS} characters (${content.length} chars)`,
        });
      }
      setValidationProgress(20);

      // 2. Check question count
      const questions = content.split('---').filter(q => q.trim().length > 0);
      console.log(`[VALIDATE] Found ${questions.length} questions`);

      if (questions.length > MAX_QUESTIONS) {
        console.log(`[VALIDATE] Too many questions: ${questions.length}/${MAX_QUESTIONS}`);
        errors.push({
          type: 'question_limit',
          message: `Too many questions: ${questions.length}/${MAX_QUESTIONS} maximum`,
        });
      }
      setValidationProgress(35);

      // 3. Check for empty questions
      questions.forEach((q, idx) => {
        if (q.trim().length === 0) {
          console.log(`[VALIDATE] Empty question at index ${idx + 1}`);
          errors.push({
            type: 'empty_question',
            message: `Question ${idx + 1} is empty`,
            line: content.split('\\n').findIndex(line => line.includes('---')) + 1,
          });
        }
      });
      setValidationProgress(50);

      // 4. Check for unmatched markdown delimiters
      // 4.1 Code blocks
      const codeBlockCount = (content.match(/```/g) || []).length;
      console.log(`[VALIDATE] Found ${codeBlockCount} code block delimiters`);

      if (codeBlockCount % 2 !== 0) {
        console.log(`[VALIDATE] Unmatched code block delimiters`);
        errors.push({
          type: 'unmatched_delimiter',
          message: 'Unmatched code block delimiter (```).',
          line: content.lastIndexOf('```'),
        });
      }

      // 4.2 Check for other potential delimiter issues
      // Add more delimiter checks here if needed

      setValidationProgress(65);

      // 5. Check image URLs - this must be the last step
      console.log(`[VALIDATE] Checking image URLs...`);
      const brokenUrls = await checkImageUrls(content);
      if (brokenUrls.length > 0) {
        console.log(`[VALIDATE] Found ${brokenUrls.length} broken/untrusted image URLs`);
        brokenUrls.forEach(url => {
          errors.push({
            type: 'broken_image',
            message: `Broken or untrusted image: ${url}`,
          });
        });
      }
      setValidationProgress(100);

    } catch (err) {
      console.error("[VALIDATE] Error during validation:", err);
      errors.push({
        type: 'internal_error',
        message: 'Internal validation error occurred.',
      });
    } finally {
      setIsValidating(false);
      setValidationProgress(0);
      console.log(`[VALIDATE] Validation complete. Found ${errors.length} errors.`);
    }

    return errors;
  };

  // Load a template
  const loadTemplate = async (templateId: string) => {
    setIsLoading(true);
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

        // Validate the content
        const errors = await validateContent(questionsMarkdown);
        setValidationErrors(errors);

        if (errors.length > 0) {
          toast({
            title: "Template loaded with warnings",
            description: `${errors.length} issue(s) found in this template.`,
            variant: "destructive",
          });
        } else {
          toast({
            title: "Template loaded",
            description: `Loaded template: ${data.title.split('\n')[0].replace(/^#\s+/, '')}`,
          });
        }
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

  // Modified parseMarkdownToJson to be more robust
  const parseMarkdownToJson = async () => {
    console.log(`[PARSE] Starting to parse markdown to JSON`);

    // Use the current markdown content
    const content = markdownContent;

    try {
      // Run validation first to update error states
      console.log(`[PARSE] Running validation before parsing`);
      const errors = await validateContent(content);
      setValidationErrors(errors);

      // Split by horizontal rule
      const questionBlocks = content.split('---').map(block => block.trim()).filter(Boolean);
      console.log(`[PARSE] Found ${questionBlocks.length} question blocks after splitting`);

      const questions = questionBlocks.map((block, index) => {
        return {
          id: `q${index + 1}`,
          question: DOMPurify.sanitize(block) // Sanitize each question content
        };
      });

      // Create the preview JSON
      const testJson: QuestionSet = {
        id: testId || `TEST-${Math.random().toString(36).substring(2, 8).toUpperCase()}`,
        title: `# ${title}`,
        time_limit: timeLimit,
        questions: questions
      };

      console.log(`[PARSE] Created test JSON with ${questions.length} questions`);

      // Always update the preview regardless of validation errors
      setPreviewJson(testJson);
      setCurrentQuestionIndex(0); // Reset to first question when updating

      // Show toast only when explicitly requested (not during URL replacement)
      // and only when there are no errors or we're ignoring errors
      if (errors.length === 0) {
        toast({
          title: "Preview Updated",
          description: `Generated preview with ${questions.length} questions`,
        });
      } else {
        console.log(`[PARSE] Not showing success toast due to ${errors.length} validation errors`);
      }

      console.log(`[PARSE] Parsing complete and preview updated`);
      return testJson;
    } catch (err) {
      console.error("[PARSE] Error parsing markdown:", err);
      toast({
        title: "Parsing Error",
        description: "Failed to convert markdown to JSON format",
        variant: "destructive",
      });
      return null;
    }
  };


  // Download JSON
  const downloadJson = async () => {
    const json = await parseMarkdownToJson()
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

  const handleImageUrlUpdate = async (oldUrl: string, newUrl: string) => {
    // Create a new content string with the replaced URL
    const updatedContent = markdownContent.replace(
      new RegExp(`!\\[.*?\\]\\(${oldUrl.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&')}\\)`, 'g'),
      (match) => match.replace(oldUrl, newUrl)
    );

    // Set the updated content
    setMarkdownContent(updatedContent);

    // We don't need to call parseMarkdownToJson() here since the useEffect will handle it
    // But we need to wait for the state update to complete
  };

  useEffect(() => {
    // Skip validation during initial render with empty content
    if (!markdownContent) {
      console.log(`[EFFECT] Skipping validation for empty content`);
      return;
    }

    // Skip if we're already validating
    if (isValidating) {
      console.log(`[EFFECT] Validation already in progress, skipping...`);
      return;
    }

    console.log(`[EFFECT] Content changed, scheduling validation`);

    // Use a debounce to avoid too frequent validations
    const timeoutId = setTimeout(async () => {
      console.log(`[EFFECT] Running validation after content change`);
      await parseMarkdownToJson();
    }, 500); // 500ms debounce

    // Clear timeout on cleanup
    return () => {
      clearTimeout(timeoutId);
    };
  }, [markdownContent]);

  // Add a useEffect to trigger validation when markdownContent changes
  useEffect(() => {
    parseMarkdownToJson();
  }, [markdownContent]);

  // Define the URL replacement function
  const handleUrlReplacement = async (oldUrl: string, newUrl: string, inputElement: HTMLInputElement) => {
    console.log(`[FIX] Starting URL replacement: ${oldUrl} -> ${newUrl}`);
    
    // Get current content before replacement
    const currentContent = markdownContent;
    
    // Create pattern and replace
    const pattern = new RegExp(`!\\[.*?\\]\\(${oldUrl.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&')}\\)`, 'g');
    const updatedContent = currentContent.replace(pattern, (match) => {
      console.log(`[FIX] Replacing: ${match}`);
      return match.replace(oldUrl, newUrl);
    });
    
    // Check if anything actually changed
    if (updatedContent === currentContent) {
      console.log(`[FIX] No matches found for URL: ${oldUrl}`);
      toast({
        title: "No changes made",
        description: "The URL pattern was not found in the content",
        variant: "destructive",
      });
      inputElement.value = '';
      return;
    }
    
    // IMPORTANT - Clear existing broken images and validation errors
    setBrokenImages([]);
    setValidationErrors([]);
    
    // Update markdown content
    console.log(`[FIX] Setting updated content (${updatedContent.length} chars)`);
    setMarkdownContent(updatedContent);
    inputElement.value = '';
    
    // Wait for state update
    await new Promise(resolve => setTimeout(resolve, 100));
    
    // The key fix: directly use the updated content for validation, not reading from state
    console.log(`[FIX] Manually validating updated content`);
    const brokenUrls = await checkImageUrls(updatedContent);
    
    // If there are no broken images, validation passes
    if (brokenUrls.length === 0) {
      console.log(`[FIX] No broken images found after replacement`);
      toast({
        title: "URL replaced",
        description: "Image URL successfully updated",
      });
    } else {
      console.log(`[FIX] Found ${brokenUrls.length} broken URLs after replacement`);
      // Run full validation with the updated content
      const errors = await validateContent(updatedContent);
      setValidationErrors(errors);
      
      toast({
        title: "URL replaced with issues",
        description: `Fixed URL but found ${brokenUrls.length} other image issues`,
        variant: "destructive"
      });
    }
  };

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

  // Get question count
  const getQuestionCount = () => {
    return markdownContent.split('---').filter(q => q.trim()).length;
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
                  <Label htmlFor="template">Want to start fast? </Label>
                  <Select onValueChange={loadTemplate}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select Fast Start Template" />
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
                    <div className="flex justify-between items-center">
                      <div className="flex items-center space-x-2">
                        <TooltipProvider>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <div className="flex items-center space-x-1 text-xs">
                                <span className={markdownContent.length > MAX_CHARS ? "text-red-500 font-medium" : "text-muted-foreground"}>
                                  {markdownContent.length}/{MAX_CHARS}
                                </span>
                                <span className="text-muted-foreground">chars</span>
                              </div>
                            </TooltipTrigger>
                            <TooltipContent>
                              <p>Maximum {MAX_CHARS} characters allowed</p>
                            </TooltipContent>
                          </Tooltip>
                        </TooltipProvider>

                        <TooltipProvider>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <div className="flex items-center space-x-1 text-xs">
                                <span className={getQuestionCount() > MAX_QUESTIONS ? "text-red-500 font-medium" : "text-muted-foreground"}>
                                  {getQuestionCount()}/{MAX_QUESTIONS}
                                </span>
                                <span className="text-muted-foreground">questions</span>
                              </div>
                            </TooltipTrigger>
                            <TooltipContent>
                              <p>Maximum {MAX_QUESTIONS} questions allowed</p>
                            </TooltipContent>
                          </Tooltip>
                        </TooltipProvider>
                      </div>

                      {/* <Button variant="ghost" size="sm" onClick={insertExampleTemplate}>
                        Insert Example
                      </Button> */}
                    </div>

                    <Textarea
                      value={markdownContent}
                      onChange={(e) => {
                        // Allow deletion even if over the limit
                        if (e.target.value.length <= MAX_CHARS || e.target.value.length < markdownContent.length) {
                          setMarkdownContent(e.target.value)
                        }
                      }}
                      placeholder="Enter your questions here..."
                      className="min-h-[400px] font-mono text-sm"
                    />

                    <div className="text-xs text-muted-foreground">
                      Use --- to separate questions
                    </div>

                    {/* Display validation errors */}
                    {validationErrors.length > 0 && (
                      <Alert variant="destructive" className="mt-4">
                        <AlertTriangle className="h-4 w-4" />
                        <AlertTitle>Validation Issues</AlertTitle>
                        <AlertDescription>
                          <ul className="mt-2 text-sm space-y-1">
                            {validationErrors.map((error, i) => (
                              <li key={i} className="flex items-start">
                                <span className="mr-2">•</span>
                                <span>{error.message}</span>
                              </li>
                            ))}
                          </ul>
                        </AlertDescription>
                      </Alert>
                    )}

                    {/* Display broken images */}
                    {brokenImages.length > 0 && (
                      <Alert variant="destructive" className="mt-4">
                        <ImageOff className="h-4 w-4" />
                        <AlertTitle>Image Issues ({brokenImages.length})</AlertTitle>
                        <AlertDescription>
                          <ul className="mt-2 text-sm space-y-1">
                            {brokenImages.map((url, i) => {
                              const actualUrl = url.split(' ')[0]; // Extract just the URL part
                              const errorType = url.includes('(') ? url.split('(')[1].replace(')', '') : '';

                              return (
                                <li key={i} className="flex items-start text-xs">
                                  <span className="mr-2">•</span>
                                  <div className="flex-1">
                                    <div className="mb-1 break-all">
                                      <span>{url}</span>
                                    </div>
                                    <div className="mt-1 flex space-x-2">
                                      <Input
                                        placeholder="New URL"
                                        className="h-6 text-xs w-full"
                                        onKeyDown={(e) => {
                                          if (e.key === 'Enter') {
                                            console.log(`[UI] Enter key pressed for URL replacement`);
                                            handleUrlReplacement(actualUrl, e.currentTarget.value, e.currentTarget);
                                          }
                                        }}
                                      />
                                      <Button
                                        size="sm"
                                        className="h-6 text-xs"
                                        onClick={(evt) => {
                                          console.log(`[UI] Replace button clicked`);
                                          const input = (evt.currentTarget.previousElementSibling as HTMLInputElement);
                                          if (input.value) {
                                            handleUrlReplacement(actualUrl, input.value, input);
                                          } else {
                                            toast({
                                              title: "Empty URL",
                                              description: "Please enter a replacement URL",
                                              variant: "destructive",
                                            });
                                          }
                                        }}
                                      >
                                        Replace
                                      </Button>
                                    </div>
                                  </div>
                                </li>
                              );
                            })}
                          </ul>
                        </AlertDescription>
                      </Alert>
                    )}
                    {/* Validation in progress */}
                    {isValidating && (
                      <div className="space-y-2 mt-4">
                        <div className="flex justify-between items-center text-xs text-muted-foreground">
                          <span>Validating content...</span>
                          <span>{validationProgress}%</span>
                        </div>
                        <Progress value={validationProgress} className="h-1" />
                      </div>
                    )}
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
                        <li><code>![alt text](image-url)</code> - Images</li>
                      </ul>
                      <h4>Question Format</h4>
                      <p>Separate each question with <code>---</code></p>
                      <p>Each question should have a clear title and detailed content.</p>

                      <h4>Validation Rules</h4>
                      <ul>
                        <li>Maximum {MAX_CHARS} characters total</li>
                        <li>Maximum {MAX_QUESTIONS} questions</li>
                        <li>Images must be from trusted domains</li>
                        <li>No empty questions allowed</li>
                        <li>All markdown delimiters must be matched</li>
                      </ul>
                    </div>
                  </TabsContent>
                </Tabs>
              </TabsContent>
            </Tabs>
          </CardContent>
          <CardFooter className="flex justify-between">
            <Button
              variant="outline"
              onClick={parseMarkdownToJson}
              disabled={isValidating}
            >
              {isValidating ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Validating...
                </>
              ) : (
                <>
                  <RefreshCw className="mr-2 h-4 w-4" />
                  Update Interview Preview
                </>
              )}
            </Button>
            <Button
              variant="secondary"
              onClick={downloadJson}
              disabled={validationErrors.length > 0 || isValidating}
            >
              {/* <Download className="mr-2 h-4 w-4" /> */}
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
              <h1 className="text-lg font-semibold justify-center">
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
                          __html: DOMPurify.sanitize(`
                            <style>
                              .md-content h1 { font-size: 1.8em; font-weight: bold; margin-bottom: 0.5em; }
                              .md-content h2 { font-size: 1.5em; font-weight: bold; margin-bottom: 0.5em; }
                              .md-content pre { background-color: #f4f4f4; padding: 1rem; border-radius: 4px; }
                              .md-content ul { list-style-type: disc; margin-left: 1.5em; }
                              .md-content ol { list-style-type: decimal; margin-left: 1.5em; }
                              .md-content code { background-color: #f4f4f4; padding: 0.2em 0.4em; border-radius: 3px; font-family: monospace; }
                              .md-content img { max-width: 100%; height: auto; border-radius: 4px; }
                              .md-content pre code { background-color: transparent; padding: 0; }
                            </style>
                            <div class="md-content">${marked(previewJson.questions[currentQuestionIndex]?.question || "")}</div>
                          `)
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

                    {/* Image preload script for preview */}
                    <script dangerouslySetInnerHTML={{
                      __html: `
                        document.addEventListener('DOMContentLoaded', () => {
                          const images = document.querySelectorAll('.md-content img');
                          images.forEach(img => {
                            img.addEventListener('error', () => {
                              img.style.border = '1px solid red';
                              img.style.padding = '8px';
                              const errorMsg = document.createElement('div');
                              errorMsg.textContent = 'Image failed to load';
                              errorMsg.style.color = 'red';
                              errorMsg.style.fontSize = '12px';
                              img.parentNode.insertBefore(errorMsg, img.nextSibling);
                            });
                          });
                        });
                      `
                    }} />
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
                  Write your questions in the Mock Interview editor and click "Update Preview".
                </p>
              </div>
            )}
          </CardContent>
          <CardFooter className="justify-center p-3 border-t">
            <div className="text-xs text-muted-foreground">
              {brokenImages.length > 0 ? (
                <div className="flex items-center text-amber-600">
                  <ImageOff className="h-3 w-3 mr-1" />
                  <span>Warning: {brokenImages.length} broken or untrusted images</span>
                </div>
              ) : (
                <div className="flex items-center">
                  <CheckCircle className="h-3 w-3 mr-1 text-green-600" />
                  <span>This is how people will see your questions during the mock interview</span>
                </div>
              )}
            </div>
          </CardFooter>
        </Card>
      </div>
    </div>
  )
}