// components/tests/TestManager.tsx
"use client"

import { useState, useEffect, useRef } from "react"
import { useRouter } from "next/navigation"
import { supabase } from "@/lib/supabase"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Textarea } from "@/components/ui/textarea"
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible"
import { Loader2, Save, ChevronRight, RefreshCw, Clock, AlertTriangle, ImageOff, ChevronDown, Edit, Trash, Plus, FolderPlus } from "lucide-react"
import { toast } from "sonner"
import Breadcrumbs from "../layout/Breadcrumbs"
import { motion, AnimatePresence } from "framer-motion"
import { marked } from 'marked'
import DOMPurify from 'dompurify'
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Progress } from "@/components/ui/progress"
import { useToast } from "@/hooks/use-toast"

// Constants
const MAX_CHARS = 5000;
const MAX_QUESTIONS = 30;
const TRUSTED_DOMAINS = [
  'i.postimg.cc',
  'i.imgur.com',
  'miro.medium.com',
  'cdn-images-1.medium.com'
];

// Complexity levels
const COMPLEXITY_LEVELS = [
  { name: "Easy", time: 15 },
  { name: "Medium", time: 30 },
  { name: "Advanced", time: 45 }
];

interface TestManagerProps {
  companyId?: string | null;
  user: any;
  testId?: string | null;
  view?: string;
}

interface MenuNode {
  id: string;
  name: string;
  children?: MenuNode[];
  testIds?: {
    easy?: string;
    medium?: string;
    advanced?: string;
  };
}

interface TestContent {
  id: string;
  title: string;
  category: string;
  complexity: string;
  time_limit: number;
  markdown_content: string;
  json_content: any;
}

interface ValidationError {
  type: string;
  message: string;
  line?: number;
  complexity?: string;
}

// Add this near your other interfaces
interface BrokenImage {
  url: string;
  error: string;
}

// Define an interface for the test content to avoid TypeScript errors
interface TestContentData {
  id: string;
  title: string;
  content: string;
  company_id: string | null | undefined;
  complexity: string;
  category?: string;
  time_limit?: number;
  created_at?: string;
}

// Add these functions near the top of the file, after the interfaces

// Basic content validation
const validateContent = (content: string): { errors: ValidationError[] } => {
  const errors: ValidationError[] = [];
  
  // Basic checks
  if (content.length > MAX_CHARS) {
    errors.push({
      type: 'error',
      message: `Content exceeds maximum length (${content.length}/${MAX_CHARS} characters)`
    });
  }
  
  const questions = content.split('---').filter(q => q.trim());
  if (questions.length > MAX_QUESTIONS) {
    errors.push({
      type: 'error',
      message: `Too many questions (${questions.length}/${MAX_QUESTIONS} max)`
    });
  }
  
  return { errors };
};

// Markdown structure validation
const validateMarkdownStructure = (content: string): ValidationError[] => {
  const errors: ValidationError[] = [];
  
  // Check for matching code blocks
  const codeBlockCount = (content.match(/```/g) || []).length;
  if (codeBlockCount % 2 !== 0) {
    errors.push({
      type: 'syntax',
      message: 'Unclosed code block found'
    });
  }
  
  // Check for proper question structure but don't require headings
  const questions = content.split('---').filter(q => q.trim());
  questions.forEach((q, idx) => {
    // Remove the heading check
    if (q.length < 50) {
      errors.push({
        type: 'content',
        message: `Question ${idx + 1} seems too short`
      });
    }
  });
  
  return errors;
};

// Image URL validation
const checkImageUrls = async (content: string): Promise<string[]> => {
  const brokenUrls: string[] = [];
  const imgRegex = /!\[.*?\]\((https?:\/\/[^)]+)\)/g;
  const matches = Array.from(content.matchAll(imgRegex));
  
  for (const match of matches) {
    const url = match[1];
    try {
      const domain = new URL(url).hostname;
      if (!TRUSTED_DOMAINS.includes(domain)) {
        brokenUrls.push(`${url} (untrusted domain: ${domain})`);
        continue;
      }
      
      // Check if image loads
      const isValid = await new Promise<boolean>((resolve) => {
        const img = new Image();
        img.onload = () => resolve(true);
        img.onerror = () => resolve(false);
        img.src = url;
        setTimeout(() => resolve(false), 5000); // 5s timeout
      });
      
      if (!isValid) {
        brokenUrls.push(`${url} (failed to load)`);
      }
    } catch (err) {
      brokenUrls.push(`${url} (invalid URL format)`);
    }
  }
  
  return brokenUrls;
};

export default function TestManager({ companyId, user, testId, view = 'new' }: TestManagerProps) {
  const router = useRouter();
  const { toast } = useToast();

  // Menu structure state
  const [menuStructure, setMenuStructure] = useState<MenuNode[]>([]);
  const [expandedNodes, setExpandedNodes] = useState<string[]>([]);
  const [selectedNode, setSelectedNode] = useState<MenuNode | null>(null);
  const [showAddCategoryDialog, setShowAddCategoryDialog] = useState(false);
  const [showAddTestDialog, setShowAddTestDialog] = useState(false);
  const [newCategoryName, setNewCategoryName] = useState("");
  const [newTestName, setNewTestName] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<MenuNode | null>(null);
  
  // Test content state
  const [selectedComplexity, setSelectedComplexity] = useState<string>("Easy");
  const [testContent, setTestContent] = useState<TestContent | null>(null);
  const [markdownContent, setMarkdownContent] = useState<string>("");
  const [timeLimit, setTimeLimit] = useState<number>(900); // 15 minutes
  const [activeTab, setActiveTab] = useState<string>("questions");
  
  // UI state
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isSaving, setIsSaving] = useState<boolean>(false);
  const [validationErrors, setValidationErrors] = useState<ValidationError[]>([]);
  const [previewJson, setPreviewJson] = useState<any | null>(null);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [nodeToDelete, setNodeToDelete] = useState<MenuNode | null>(null);
  const [companyName, setCompanyName] = useState<string>("");
  const [showValidationDialog, setShowValidationDialog] = useState(false);
  const [showValidationProgress, setShowValidationProgress] = useState(0);
  const [isValidating, setIsValidating] = useState(false);

  const [showImageFixDialog, setShowImageFixDialog] = useState(false);
 
  // Complexity content state
  const [complexityContent, setComplexityContent] = useState<{
    [key: string]: { markdown: string, preview: any | null }
  }>({
    Easy: { markdown: "", preview: null },
    Medium: { markdown: "", preview: null },
    Advanced: { markdown: "", preview: null }
  });

  // In your component, add state for broken images
  const [brokenImages, setBrokenImages] = useState<string[]>([]);

  // Add undo/redo history state
  const [history, setHistory] = useState<{time: number, content: string}[]>([]);
  const [historyIndex, setHistoryIndex] = useState(-1);
  const historyLimit = 50; // Maximum number of history states to keep
  const historyDebounceTime = 2000; // Time in ms between history snapshots
  const lastHistoryUpdateRef = useRef<number>(0);
  
  // Add save status tracking
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'success' | 'error'>('idle');
  const saveTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  
  // Track if content has been modified since last save
  const [isModified, setIsModified] = useState(false);
  
  // Add this state to track validation status for each complexity
  const [complexityValidation, setComplexityValidation] = useState<{
    [key: string]: { isValid: boolean; errors: ValidationError[] }
  }>({
    Easy: { isValid: false, errors: [] },
    Medium: { isValid: false, errors: [] },
    Advanced: { isValid: false, errors: [] }
  });
  
  // Handle content changes with time-based history tracking
  const handleContentChange = (newContent: string) => {
    // Update content immediately
    setMarkdownContent(newContent);
    setIsModified(true);
    
    // Add to history only after debounce time has passed
    const now = Date.now();
    if (now - lastHistoryUpdateRef.current > historyDebounceTime) {
      // If we're not at the end of history, truncate it
      if (historyIndex < history.length - 1) {
        setHistory(history.slice(0, historyIndex + 1));
      }
      
      // Add new content to history
      const newHistory = [...history.slice(-historyLimit + 1), {time: now, content: newContent}];
      setHistory(newHistory);
      setHistoryIndex(newHistory.length - 1);
      lastHistoryUpdateRef.current = now;
    }
  };
  
  // Undo function
  const handleUndo = () => {
    if (historyIndex > 0) {
      const newIndex = historyIndex - 1;
      setHistoryIndex(newIndex);
      setMarkdownContent(history[newIndex].content);
      setIsModified(true);
    }
  };
  
  // Redo function
  const handleRedo = () => {
    if (historyIndex < history.length - 1) {
      const newIndex = historyIndex + 1;
      setHistoryIndex(newIndex);
      setMarkdownContent(history[newIndex].content);
      setIsModified(true);
    }
  };
  
  // Initialize history when a new test is selected
  useEffect(() => {
    if (markdownContent) {
      const now = Date.now();
      setHistory([{time: now, content: markdownContent}]);
      setHistoryIndex(0);
      lastHistoryUpdateRef.current = now;
      setIsModified(false);
    }
  }, [selectedNode?.id, selectedComplexity]);

  // Load menu structure and company info
  useEffect(() => {
    async function loadData() {
      setIsLoading(true);
      try {
        // Fetch company info
        const { data: companyData, error: companyError } = await supabase
          .from("companies")
          .select("name")
          .eq("id", companyId)
          .single();
        
        if (companyError) throw companyError;
        setCompanyName(companyData.name);
        
        // Fetch menu structure
        const { data: menuData, error: menuError } = await supabase
          .from("test_menus")
          .select("menu_json")
          .eq("company_id", companyId)
          .single();
        
        if (menuError) {
          if (menuError.code === 'PGRST116') {
            // No menu found, initialize with empty structure
            setMenuStructure([]);
          } else {
            throw menuError;
          }
        } else {
          setMenuStructure(menuData.menu_json || []);
          
          // If testId is provided, find and select the corresponding test
          if (testId) {
            // Find the test in the menu structure
            let foundTest: MenuNode | null = null;
            let foundComplexity: string | null = null;
            
            for (const category of menuData.menu_json || []) {
              if (category.children) {
                for (const test of category.children) {
                  if (test.testIds) {
                    // Check each complexity level
                    for (const complexity of COMPLEXITY_LEVELS) {
                      const complexityKey = complexity.name.toLowerCase() as keyof typeof test.testIds;
                      if (test.testIds[complexityKey] === testId) {
                        foundTest = test;
                        foundComplexity = complexity.name;
                        break;
                      }
                    }
                    if (foundTest) break;
                  }
                }
              }
              if (foundTest) break;
            }
            
            // If found, select the test and load its content
            if (foundTest && foundComplexity) {
              setSelectedNode(foundTest);
              setSelectedComplexity(foundComplexity);
              
              // Load test content
              const { data: testData, error: testError } = await supabase
                .from("tests")
                .select("*")
                .eq("id", testId)
                .single();
              
              if (!testError && testData) {
                setTestContent(testData);
                setMarkdownContent(testData.content || "");
                setTimeLimit(testData.time_limit);
              }
            }
          }
        }
      } catch (error) {
        console.error("Error loading data:", error);
        toast({
          title: "Error",
          description: "Failed to load data",
          variant: "destructive"
        });
      } finally {
        setIsLoading(false);
      }
    }
    
    loadData();
  }, [companyId, testId]);

  // Toggle node expansion
  const toggleNodeExpansion = (nodeId: string) => {
    setExpandedNodes(prev => 
      prev.includes(nodeId) 
        ? prev.filter(id => id !== nodeId)
        : [...prev, nodeId]
    );
  };

  // Select a node (category or test)
  const handleNodeSelect = async (node: MenuNode) => {
    setSelectedNode(node);
    
    // If it's a test node (has testIds)
    if (node.testIds) {
      const testId = node.testIds[selectedComplexity.toLowerCase() as keyof typeof node.testIds] || "";
      
      if (testId) {
        // Load test content
        try {
          const { data, error } = await supabase
            .from("tests")
            .select("*")
            .eq("id", testId)
            .single();
          
          if (error) {
            if (error.code === 'PGRST116') {
              // No content found for this test/complexity yet
              console.log("No content found for this test/complexity yet");
              setTestContent(null);
              setMarkdownContent("");
              const complexityLevel = COMPLEXITY_LEVELS.find(c => c.name === selectedComplexity);
              setTimeLimit(complexityLevel ? complexityLevel.time * 60 : 900);
            } else {
              throw error;
            }
          } else {
            setTestContent(data);
            setMarkdownContent(data.content || "");
            setTimeLimit(data.time_limit || 900);
            
            // Parse for preview
            if (data.content) {
              const questions = data.content
                .split('---')
                .map((q: string, i: number) => ({ id: `q${i+1}`, question: q.trim() }))
                .filter((q: {id: string, question: string}) => q.question);
              
              setPreviewJson({
                id: testId,
                title: node.name,
                time_limit: data.time_limit,
                questions: questions
              });
            }
          }
        } catch (error) {
          console.error("Error loading test:", error);
          toast({
            title: "Error",
            description: "Failed to load test content",
            variant: "destructive"
          });
        }
      } else {
        // New test for this complexity
        setTestContent(null);
        setMarkdownContent("");
        const complexityLevel = COMPLEXITY_LEVELS.find(c => c.name === selectedComplexity);
        setTimeLimit(complexityLevel ? complexityLevel.time * 60 : 900);
      }
    }
  };

  // Add new category
  const handleAddCategory = async () => {
    if (!newCategoryName.trim()) {
      toast({
        title: "Error",
        description: "Category name cannot be empty",
        variant: "destructive"
      });
      return;
    }
    
    const newCategory: MenuNode = {
      id: `category-${Date.now()}`,
      name: newCategoryName.trim(),
      children: []
    };
    
    const updatedStructure = [...menuStructure, newCategory];
    setMenuStructure(updatedStructure);
    
    // Save to database
    try {
      // Check if a menu already exists for this company
      const { data, error } = await supabase
        .from("test_menus")
        .select("id")
        .eq("company_id", companyId)
        .maybeSingle();
      
      if (error && error.code !== 'PGRST116') throw error;
      
      if (data?.id) {
        // Update existing menu
        await supabase
          .from("test_menus")
          .update({
            menu_json: updatedStructure,
            updated_at: new Date().toISOString()
          })
          .eq("company_id", companyId);
      } else {
        // Create new menu
        await supabase
          .from("test_menus")
          .insert({
            company_id: companyId,
            menu_json: updatedStructure,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          });
      }
      
      toast({
        title: "Success",
        description: "Category added successfully",
        variant: "default"
      });
      setNewCategoryName("");
      setShowAddCategoryDialog(false);
    } catch (error) {
      console.error("Error saving category:", error);
      toast({
        title: "Error",
        description: "Failed to save category",
        variant: "destructive"
      });
    }
  };

  // Add new test to category
  const handleAddTest = async () => {
    if (!selectedCategory) {
      toast({
        title: "Error",
        description: "No category selected",
        variant: "destructive"
      });
      return;
    }
    
    if (!newTestName.trim()) {
      toast({
        title: "Error",
        description: "Test name cannot be empty",
        variant: "destructive"
      });
      return;
    }
    
    // Generate test IDs for each complexity
    const timestamp = Date.now();
    const baseId = newTestName.trim()
      .toUpperCase()
      .replace(/[^A-Z0-9]/g, '-')
      .substring(0, 20);
    
    const testIds = {
      easy: `${baseId}-EASY-${timestamp}`,
      medium: `${baseId}-MED-${timestamp}`,
      advanced: `${baseId}-ADV-${timestamp}`
    };
    
    const newTest: MenuNode = {
      id: `test-${timestamp}`,
      name: newTestName.trim(),
      testIds
    };
    
    try {
      // First, create empty test records for each complexity
      for (const complexity of Object.keys(testIds)) {
        const testId = testIds[complexity as keyof typeof testIds];
        const complexityName = complexity.toLowerCase();
        const complexityLevel = COMPLEXITY_LEVELS.find(c => c.name.toLowerCase() === complexityName) || COMPLEXITY_LEVELS[0];
        const timeLimit = complexityLevel.time * 60;
        
        // Create test record with required fields
        await supabase
          .from("tests")
          .insert({
            id: testId,
            title: newTestName.trim(),
            company_id: companyId,
            complexity: complexity.toUpperCase(),
            category: selectedCategory.name,
            time_limit: timeLimit,
            created_at: new Date().toISOString()
          });
      }
      
      // Update menu structure
      const updatedMenu = [...menuStructure];

      // Find the selected category and add the new test
      for (let i = 0; i < updatedMenu.length; i++) {
        // Check if selectedCategory exists and has an id
        if (selectedCategory && updatedMenu[i].id === selectedCategory.id) {
          // Ensure children is an array
          if (!updatedMenu[i].children) {
            updatedMenu[i].children = [];
          }
          
          // TypeScript needs reassurance that children exists and is an array
          const children = updatedMenu[i].children;
          if (Array.isArray(children)) {
            // Now TypeScript knows it's a valid array
            children.push(newTest);
          }
          
          break;
        }
      }
      
      setMenuStructure(updatedMenu);
      
      // Check if menu record exists
      const { data: existingMenu } = await supabase
        .from("test_menus")
        .select("id")
        .eq("company_id", companyId)
        .single();
      
      if (existingMenu) {
        // Update existing menu
        await supabase
          .from("test_menus")
          .update({
            menu_json: updatedMenu,
            menu_text: JSON.stringify(updatedMenu),
            updated_at: new Date().toISOString()
          })
          .eq("company_id", companyId);
      } else {
        // Create new menu
        await supabase
          .from("test_menus")
          .insert({
            company_id: companyId,
            menu_json: updatedMenu,
            menu_text: JSON.stringify(updatedMenu),
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          });
      }
      
      setShowAddTestDialog(false);
      setNewTestName("");
      toast({
        title: "Success",
        description: "Test added successfully",
        variant: "default"
      });
      
      // Force re-render of the tree
      setExpandedNodes([...expandedNodes, selectedCategory.id]);
      
    } catch (error) {
      console.error("Error adding test:", error);
      toast({
        title: "Error",
        description: "Failed to add test",
        variant: "destructive"
      });
    }
  };

  // Delete node (category or test)
  const handleDeleteNode = async () => {
    if (!nodeToDelete) return;
    
    try {
      let updatedStructure;
      
      if (nodeToDelete.children) {
        // It's a category
        updatedStructure = menuStructure.filter(category => category.id !== nodeToDelete.id);
      } else {
        // It's a test
        updatedStructure = menuStructure.map(category => {
          if (category.children?.some(test => test.id === nodeToDelete.id)) {
            return {
              ...category,
              children: category.children.filter(test => test.id !== nodeToDelete.id)
            };
          }
          return category;
        });
        
        // If it's a test, delete test content from tests table
        if (nodeToDelete.testIds) {
          for (const complexity of Object.keys(nodeToDelete.testIds)) {
            const testId = nodeToDelete.testIds[complexity as keyof typeof nodeToDelete.testIds];
            if (testId) {
              await supabase
                .from("tests")
                .delete()
                .eq("id", testId);
            }
          }
        }
      }
      
      // Filter out any empty categories (no name or no valid ID)
      updatedStructure = updatedStructure.filter(category => 
        category.id && category.name && category.name.trim() !== ""
      );
      
      // Check if a menu record already exists for this company
      const { data: existingMenu, error: menuError } = await supabase
        .from("test_menus")
        .select("id")
        .eq("company_id", companyId)
        .maybeSingle();
      
      if (menuError && menuError.code !== 'PGRST116') {
        throw menuError;
      }
      
      // Save to database - use UPDATE if record exists, INSERT if it doesn't
      if (existingMenu?.id) {
        // Update existing menu
        await supabase
          .from("test_menus")
          .update({
            menu_json: updatedStructure,
            menu_text: JSON.stringify(updatedStructure),
            updated_at: new Date().toISOString()
          })
          .eq("company_id", companyId);
      } else {
        // Create new menu
        await supabase
          .from("test_menus")
          .insert({
            company_id: companyId,
            menu_json: updatedStructure,
            menu_text: JSON.stringify(updatedStructure),
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          });
      }
      
      setMenuStructure(updatedStructure);
      toast({
        title: "Success",
        description: "Deleted successfully",
        variant: "default"
      });
      setShowDeleteDialog(false);
      setNodeToDelete(null);
      
      // Clear selection if deleted node was selected
      if (selectedNode?.id === nodeToDelete.id) {
        setSelectedNode(null);
        setTestContent(null);
        setMarkdownContent("");
      }
    } catch (error) {
      console.error("Error deleting:", error);
      toast({
        title: "Error",
        description: "Failed to delete",
        variant: "destructive"
      });
    }
  };

  // Change complexity level
  const handleComplexityChange = async (complexity: string) => {
    // Save current content before switching
    if (selectedNode) {
      setComplexityContent(prev => ({
        ...prev,
        [selectedComplexity]: { 
          markdown: markdownContent, 
          preview: previewJson 
        }
      }));
    }
    
    setSelectedComplexity(complexity);
    
    // Set time limit based on complexity
    const complexityLevel = COMPLEXITY_LEVELS.find(c => c.name === complexity);
    setTimeLimit(complexityLevel ? complexityLevel.time * 60 : 900);
    
    if (selectedNode && selectedNode.testIds) {
      const testId = selectedNode.testIds[complexity.toLowerCase() as keyof typeof selectedNode.testIds];
      
      // First check if we have cached content
      if (complexityContent[complexity]?.markdown) {
        setMarkdownContent(complexityContent[complexity].markdown);
        setPreviewJson(complexityContent[complexity].preview);
      } else if (testId) {
        // If no cached content, try loading from database
        await loadTestContent(testId).catch(error => {
          console.log("Could not load test from database, using empty content");
          setMarkdownContent("");
          setPreviewJson(null);
        });
      } else {
        // New test for this complexity
        setMarkdownContent("");
        setPreviewJson(null);
      }
    }
  };

  // Load test content
  const loadTestContent = async (testId: string) => {
    try {
      const { data, error } = await supabase
        .from("tests")
        .select("*")
        .eq("id", testId)
        .single();
      
      if (error) {
        if (error.code === 'PGRST116') {
          // No content found for this test/complexity yet
          console.log("No content found for this test/complexity yet");
          setTestContent(null);
          setMarkdownContent("");
          const complexityLevel = COMPLEXITY_LEVELS.find(c => c.name === selectedComplexity);
          setTimeLimit(complexityLevel ? complexityLevel.time * 60 : 900);
          return null;
        } else {
          throw error;
        }
      }
      
      setTestContent(data);
      setMarkdownContent(data.content || "");
      setTimeLimit(data.time_limit || 900);
      
      // Parse for preview if content exists
      if (data.content) {
        const questions = data.content
          .split('---')
          .map((q: string, i: number) => ({ id: `q${i+1}`, question: q.trim() }))
          .filter((q: {id: string, question: string}) => q.question);
        
        setPreviewJson({
          id: testId,
          title: data.title,
          time_limit: data.time_limit,
          questions: questions
        });
        
        // Save to complexity content cache
        setComplexityContent(prev => ({
          ...prev,
          [selectedComplexity]: { 
            markdown: data.content, 
            preview: {
              id: testId,
              title: data.title,
              time_limit: data.time_limit,
              questions: questions
            }
          }
        }));
      }
      
      return data;
    } catch (error) {
      console.error("Error loading test:", error);
      toast({
        title: "Error",
        description: "Failed to load test content",
        variant: "destructive"
      });
      throw error;
    }
  };

  // Enhanced save function that handles all complexities
  const handleSaveContent = async () => {
    if (!selectedNode || !selectedNode.testIds) {
      toast({
        title: "Error",
        description: "No test selected",
        variant: "destructive"
      });
      return;
    }
    
    setIsSaving(true);
    setSaveStatus('saving');
    
    try {
      // Store current complexity to restore it later
      const currentComplexity = selectedComplexity;
      
      // Save current content to complexity content
      setComplexityContent(prev => ({
        ...prev,
        [currentComplexity]: { 
          markdown: markdownContent, 
          preview: null 
        }
      }));
      
      // Validate all complexities
      const validationResults: {
        [key: string]: { isValid: boolean; errors: ValidationError[] }
      } = {
        Easy: { isValid: false, errors: [] },
        Medium: { isValid: false, errors: [] },
        Advanced: { isValid: false, errors: [] }
      };
      
      // Check which complexities have content
      const hasContent: Record<string, boolean> = {
        Easy: (complexityContent.Easy?.markdown?.trim().length ?? 0) > 0 || 
              (currentComplexity === 'Easy' && markdownContent.trim().length > 0),
        Medium: (complexityContent.Medium?.markdown?.trim().length ?? 0) > 0 || 
                (currentComplexity === 'Medium' && markdownContent.trim().length > 0),
        Advanced: (complexityContent.Advanced?.markdown?.trim().length ?? 0) > 0 || 
                  (currentComplexity === 'Advanced' && markdownContent.trim().length > 0)
      };
      
      // If no content in any complexity, show error
      if (!hasContent.Easy && !hasContent.Medium && !hasContent.Advanced) {
        toast({
          title: "Error",
          description: "Please add content for at least one complexity level",
          variant: "destructive"
        });
        setIsSaving(false);
        setSaveStatus('error');
        return;
      }
      
      // Validate each complexity that has content
      for (const complexity of COMPLEXITY_LEVELS) {
        const complexityName = complexity.name;
        const content = complexityName === currentComplexity 
          ? markdownContent 
          : complexityContent[complexityName].markdown;
        
        if (content.trim().length > 0) {
          const errors = await enhancedValidateContent(content);
          validationResults[complexityName] = {
            isValid: errors.length === 0,
            errors: errors
          };
        } else {
          // Skip validation for empty content
          validationResults[complexityName] = { isValid: true, errors: [] };
        }
      }
      
      // Update validation state
      setComplexityValidation(validationResults);
      
      // Check if any complexity has validation errors
      const hasErrors = Object.values(validationResults).some(
        result => !result.isValid && result.errors.length > 0
      );
      
      if (hasErrors) {
        // Find which complexity has errors
        const complexitiesWithErrors = Object.entries(validationResults)
          .filter(([_, result]) => !result.isValid && result.errors.length > 0)
          .map(([complexity, _]) => complexity);
        
        // Show dialog with errors for each complexity
        setValidationErrors(
          complexitiesWithErrors.flatMap(complexity => 
            validationResults[complexity].errors.map(error => ({
              ...error,
              complexity: complexity
            }))
          )
        );
        
        // Show validation dialog with complexity information
        setShowValidationDialog(true);
        setIsSaving(false);
        setSaveStatus('error');
        return;
      }
      
      // Save each complexity that has content
      const savedTests = [];
      
      for (const complexity of COMPLEXITY_LEVELS) {
        const complexityName = complexity.name;
        const content = complexityName === currentComplexity 
          ? markdownContent 
          : complexityContent[complexityName].markdown;
        
        if (content.trim().length > 0) {
          // Get the test ID for this complexity
          const complexityKey = complexityName.toLowerCase() as keyof typeof selectedNode.testIds;
          let testId = selectedNode.testIds[complexityKey];
          
          // If no testId exists for this complexity, create one
          if (!testId) {
            testId = `${selectedNode.name.replace(/\s+/g, '-')}-${complexityName.toUpperCase()}-${Date.now()}`;
            
            // Update the node's testIds with the new ID
            const updatedTestIds = {
              ...selectedNode.testIds,
              [complexityKey]: testId
            };
            
            // Update the menu structure with the new testId
            const updatedMenu = [...menuStructure];
            const findAndUpdateCategory = (categories: MenuNode[]): boolean => {
              if (!selectedNode) return false;
              
              for (let i = 0; i < categories.length; i++) {
                const category = categories[i];
                
                if (category.children) {
                  for (let j = 0; j < category.children.length; j++) {
                    if (category.children[j].id === selectedNode.id) {
                      category.children[j] = {
                        ...category.children[j],
                        testIds: updatedTestIds
                      };
                      return true;
                    }
                  }
                }
              }
              return false;
            };
            
            findAndUpdateCategory(updatedMenu);
            setMenuStructure(updatedMenu);
          }
          
          // Create test content object
          const testContent: TestContentData = {
            id: testId,
            title: selectedNode.name,
            content: content,
            complexity: complexityName.toUpperCase(),
            company_id: companyId,
            category: findParentCategory(selectedNode, menuStructure),
            time_limit: complexity.time * 60 // Convert minutes to seconds
          };
          
          // Add optional properties
          if (!testId || testId.includes('new_')) {
            testContent.created_at = new Date().toISOString();
          }
          
          // Save to tests table
          const { data: savedTest, error: testError } = await supabase
            .from("tests")
            .upsert(testContent, { onConflict: 'id' })
            .select();
          
          if (testError) {
            console.error(`Error saving ${complexityName} test:`, testError);
            throw testError;
          }
          
          savedTests.push(savedTest);
        }
      }
      
      // Update menu structure in database
      const { data: existingMenu, error: menuQueryError } = await supabase
        .from("test_menus")
        .select("id")
        .eq("company_id", companyId)
        .maybeSingle();
      
      if (menuQueryError && menuQueryError.code !== 'PGRST116') {
        console.error("Error checking for existing menu:", menuQueryError);
        throw menuQueryError;
      }
      
      let menuUpdateResult;
      if (existingMenu?.id) {
        menuUpdateResult = await supabase
          .from("test_menus")
          .update({
            menu_json: menuStructure,
            updated_at: new Date().toISOString()
          })
          .eq("company_id", companyId);
      } else {
        menuUpdateResult = await supabase
          .from("test_menus")
          .insert({
            company_id: companyId,
            menu_json: menuStructure,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          });
      }
      
      if (menuUpdateResult.error) {
        console.error("Error updating menu structure:", menuUpdateResult.error);
        throw menuUpdateResult.error;
      }
      
      // Mark as not modified after successful save
      setIsModified(false);
      setSaveStatus('success');
      
      // Show success message with complexity info
      const savedComplexities = savedTests.length > 0 
        ? COMPLEXITY_LEVELS
            .filter(c => hasContent[c.name])
            .map(c => c.name)
            .join(", ")
        : "all";
      
      toast({
        title: "Success",
        description: `Content saved for ${savedComplexities} complexity levels`,
        variant: "default"
      });
      
      // Reset success status after a delay
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current);
      }
      saveTimeoutRef.current = setTimeout(() => {
        setSaveStatus('idle');
      }, 3000);
      
    } catch (error) {
      console.error("Error saving content:", error);
      toast({
        title: "Error",
        description: "Failed to save content",
        variant: "destructive"
      });
      setSaveStatus('error');
    } finally {
      setIsSaving(false);
    }
  };

  // Preview test
  const handlePreview = () => {
    if (!markdownContent.trim()) {
      toast({
        title: "Error",
        description: "No content to preview",
        variant: "destructive"
      });
      return;
    }
    
    // Parse markdown to JSON
    const questions = markdownContent
      .split('---')
      .map((q: string, i: number) => ({ id: `q${i+1}`, question: q.trim() }))
      .filter((q: {id: string, question: string}) => q.question);
    
    const previewData = {
      id: selectedNode?.testIds?.[selectedComplexity.toLowerCase() as keyof typeof selectedNode.testIds] || "preview",
      title: selectedNode?.name || "Preview",
      time_limit: timeLimit,
      questions
    };
    
    setPreviewJson(previewData);
    setCurrentQuestionIndex(0);
    setActiveTab("preview");
  };

  // Navigate between questions in preview
  const handlePreviousQuestion = () => {
    if (currentQuestionIndex > 0) {
      setCurrentQuestionIndex(prev => prev - 1);
    }
  };

  const handleNextQuestion = () => {
    if (previewJson && currentQuestionIndex < previewJson.questions.length - 1) {
      setCurrentQuestionIndex(prev => prev + 1);
    }
  };

  // Render tree node
  const renderTreeNode = (node: MenuNode) => {
    const isCategory = Boolean(node.children);
    
    return (
      <div key={node.id} className="mb-1">
        <Collapsible
          open={expandedNodes.includes(node.id)}
          onOpenChange={() => toggleNodeExpansion(node.id)}
        >
          <div 
            className={`flex items-center justify-between p-2 rounded-md ${
              selectedNode?.id === node.id ? 'bg-muted' : 'hover:bg-muted/50'
            }`}
            onClick={() => handleNodeSelect(node)}
          >
            <div className="flex items-center">
              {isCategory ? (
                <CollapsibleTrigger asChild>
                  <Button variant="ghost" size="icon" className="h-6 w-6 p-0">
                    <ChevronDown className={`h-4 w-4 transition-transform duration-200 ${
                      expandedNodes.includes(node.id) ? '' : '-rotate-90'
                    }`} />
                  </Button>
                </CollapsibleTrigger>
              ) : (
                <div className="w-6" />
              )}
              <span className={`ml-1 ${isCategory ? 'font-medium' : ''}`}>
                {node.name}
              </span>
            </div>
            
            <div className="flex items-center space-x-1">
              {isCategory ? (
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-6 w-6"
                  onClick={(e) => {
                    e.stopPropagation();
                    setSelectedCategory(node);
                    setShowAddTestDialog(true);
                  }}
                >
                  <Plus className="h-3 w-3" />
                </Button>
              ) : null}
              
              <Button
                variant="ghost"
                size="icon"
                className="h-6 w-6"
                onClick={(e) => {
                  e.stopPropagation();
                  setNodeToDelete(node);
                  setShowDeleteDialog(true);
                }}
              >
                <Trash className="h-3 w-3" />
              </Button>
            </div>
          </div>
          
          {isCategory && node.children && (
            <CollapsibleContent>
              <div className="pl-4 mt-1 border-l-2 border-muted">
                {node.children.map(childNode => (
                  <div
                    key={childNode.id}
                    className={`flex items-center justify-between p-2 rounded-md ${
                      selectedNode?.id === childNode.id ? 'bg-muted' : 'hover:bg-muted/50'
                    }`}
                    onClick={() => handleNodeSelect(childNode)}
                  >
                    <span className={isTestIncomplete(childNode) ? 'text-red-500' : ''}>
                      {childNode.name}
                    </span>
                    
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-6 w-6"
                      onClick={(e) => {
                        e.stopPropagation();
                        setNodeToDelete(childNode);
                        setShowDeleteDialog(true);
                      }}
                    >
                      <Trash className="h-3 w-3" />
                    </Button>
                  </div>
                ))}
              </div>
            </CollapsibleContent>
          )}
        </Collapsible>
      </div>
    );
  };

  // Add a validation function
  const enhancedValidateContent = async (content: string): Promise<ValidationError[]> => {
    const errors: ValidationError[] = [];
    setIsValidating(true);
    setShowValidationProgress(0);

    try {
      // 1. Basic checks
      if (content.length > MAX_CHARS) {
        errors.push({
          type: 'character_limit',
          message: `Content exceeds maximum ${MAX_CHARS} characters (${content.length} chars)`,
        });
      }
      setShowValidationProgress(20);

      // 2. Count questions
      const questions = content.split('---').filter(q => q.trim().length > 0);
      if (questions.length > MAX_QUESTIONS) {
        errors.push({
          type: 'question_limit',
          message: `Too many questions: ${questions.length}/${MAX_QUESTIONS} maximum`,
        });
      }
      setShowValidationProgress(40);

      // 3. Image validation
      const brokenUrls = await checkImageUrls(content);
      if (brokenUrls.length > 0) {
        brokenUrls.forEach(url => {
          errors.push({
            type: 'broken_image',
            message: `Broken or untrusted image: ${url}`,
          });
        });
      }
      setShowValidationProgress(60);

      // 4. Question format validation
      questions.forEach((q, idx) => {
        if (!q.includes('#')) {
          errors.push({
            type: 'format',
            message: `Question ${idx + 1} missing title (# heading)`
          });
        }
        if (q.length < 30) {
          errors.push({
            type: 'content',
            message: `Question ${idx + 1} seems too short (30 characters minimum)`
          });
        }
      });
      setShowValidationProgress(80);

      // 5. Code block validation
      if (content.includes('```') && 
          (content.split('```').length - 1) % 2 !== 0) {
        errors.push({
          type: 'syntax',
          message: 'Unclosed code block found'
        });
      }
      setShowValidationProgress(100);

    } catch (err) {
      console.error("Validation error:", err);
      errors.push({
        type: 'internal_error',
        message: 'Internal validation error occurred'
      });
    } finally {
      setIsValidating(false);
      setShowValidationProgress(0);
    }

    return errors;
  };

  // Add this function to check if a test has content for the current complexity
  function hasContentForCurrentComplexity() {
    return markdownContent.trim().length > 0;
  }

  // Add this function to check if a test is incomplete
  function isTestIncomplete(node: MenuNode): boolean {
    if (!node.testIds) return false;
    
    // Check if all complexity levels have content
    return !Object.keys(node.testIds).every(complexity => {
      const testId = node.testIds?.[complexity as keyof typeof node.testIds];
      return testId && testId.length > 0;
    });
  }

  // Move handleUrlReplacement inside the component
  const handleUrlReplacement = async (oldUrl: string, newUrl: string, input: HTMLInputElement) => {
    if (!newUrl.trim()) {
      toast({
        title: "Error",
        description: "Please enter a replacement URL",
        variant: "destructive"
      });
      return;
    }
    
    try {
      // Validate new URL
      const domain = new URL(newUrl).hostname;
      if (!TRUSTED_DOMAINS.includes(domain)) {
        toast({
          title: "Error",
          description: "URL must be from a trusted domain",
          variant: "destructive"
        });
        return;
      }
      
      // Replace URL in content
      const pattern = new RegExp(`!\\[.*?\\]\\(${oldUrl.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&')}\\)`, 'g');
      const updatedContent = markdownContent.replace(pattern, (match: string) => {
        return match.replace(oldUrl, newUrl);
      });
      
      setMarkdownContent(updatedContent);
      input.value = ''; // Clear input
      
      // Revalidate content
      const validationResult = await enhancedValidateContent(updatedContent);
      setValidationErrors(validationResult);
      
      toast({
        title: "Success",
        description: "URL replaced successfully",
        variant: "default"
      });
      
      // If no more broken images, close the dialog
      if (validationResult.filter(e => e.type === 'broken_image').length === 0) {
        setShowImageFixDialog(false);
      }
    } catch (err) {
      toast({
        title: "Error",
        description: "Please enter a valid URL",
        variant: "destructive"
      });
    }
  };

  // Handle paste for image URLs
  const handlePaste = (e: React.ClipboardEvent<HTMLTextAreaElement>) => {
    // Log that the paste event was triggered
    console.log('[PASTE] Paste event triggered');

    // Get pasted content
    const pastedText = e.clipboardData.getData('text');
    console.log('[PASTE] Pasted text:', pastedText);

    // Check if it looks like a URL
    if (pastedText.trim().startsWith('http')) {
      console.log('[PASTE] Text appears to be a URL');

      // A more flexible check for image URLs
      const hasImageExtension = /(jpg|jpeg|png|gif|webp|svg)/i.test(pastedText);
      const hasImageKeyword = /(image|photo|picture)/i.test(pastedText);

      console.log('[PASTE] Has image extension:', hasImageExtension);
      console.log('[PASTE] Has image keyword:', hasImageKeyword);

      if (hasImageExtension || hasImageKeyword) {
        console.log('[PASTE] Converting to markdown image format');
        e.preventDefault(); // Prevent default paste

        // Get cursor position
        const textarea = e.currentTarget;
        const cursorPos = textarea.selectionStart || 0;
        console.log('[PASTE] Cursor position:', cursorPos);

        // Get text before and after cursor
        const textBefore = textarea.value.substring(0, cursorPos);
        const textAfter = textarea.value.substring(cursorPos);

        // Convert to markdown image format
        const markdownImage = `![](${pastedText.trim()})`;
        console.log('[PASTE] Generated markdown:', markdownImage);

        // Create new content
        const newContent = textBefore + markdownImage + textAfter;

        // Update the state
        setMarkdownContent(newContent);

        // Move cursor after the inserted text
        setTimeout(() => {
          textarea.selectionStart = cursorPos + markdownImage.length;
          textarea.selectionEnd = cursorPos + markdownImage.length;
        }, 0);

        // Show confirmation
        toast({
          title: "Success",
          description: "URL converted to markdown image format",
          variant: "default"
        });
      }
    }
  };

  // Right Panel - Content Editor (updated version)
  const renderContentEditor = () => {
    if (!selectedNode || !selectedNode.testIds) {
      return (
        <div className="flex flex-col items-center justify-center h-64 text-center p-6">
          <p className="text-muted-foreground">
            Select a test from the left panel to edit its content
          </p>
        </div>
      );
    }

    return (
      <>
        <CardHeader className="pb-2">
          <div className="flex justify-between items-center">
            <CardTitle>{selectedNode.name}</CardTitle>
            <div className="flex space-x-2 mt-4">
              {COMPLEXITY_LEVELS.map(level => (
                <Button
                  key={level.name}
                  variant={selectedComplexity === level.name ? "default" : "outline"}
                  onClick={() => handleComplexityChange(level.name)}
                  className="flex-1"
                >
                  {level.name}
                  <span className="text-xs ml-1 opacity-80">{level.time}m</span>
                </Button>
              ))}
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <Tabs value={activeTab} onValueChange={(value) => {
            setActiveTab(value);
            // If switching to preview tab, generate preview
            if (value === "preview") {
              handlePreview();
            }
          }}>
            <TabsList className="mb-4">
              <TabsTrigger value="questions">Questions</TabsTrigger>
              <TabsTrigger value="preview">Preview</TabsTrigger>
              <TabsTrigger value="validation">Validation</TabsTrigger>
            </TabsList>
            
            <TabsContent value="questions">
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <div className="flex items-center space-x-2">
                    <div className="flex items-center space-x-1 text-xs">
                      <span className={markdownContent.length > MAX_CHARS ? "text-red-500 font-medium" : "text-muted-foreground"}>
                        {markdownContent.length}/{MAX_CHARS}
                      </span>
                      <span className="text-muted-foreground">chars</span>
                    </div>

                    <div className="flex items-center space-x-1 text-xs">
                      <span className={markdownContent.split('---').filter(q => q.trim()).length > MAX_QUESTIONS ? "text-red-500 font-medium" : "text-muted-foreground"}>
                        {markdownContent.split('---').filter(q => q.trim()).length}/{MAX_QUESTIONS}
                      </span>
                      <span className="text-muted-foreground">questions</span>
                    </div>
                  </div>
                  
                  {/* Undo/Redo buttons */}
                  <div className="flex space-x-1">
                    <Button 
                      variant="outline" 
                      size="sm" 
                      onClick={handleUndo}
                      disabled={historyIndex <= 0}
                      className="h-8 px-2"
                    >
                      Undo
                    </Button>
                    <Button 
                      variant="outline" 
                      size="sm" 
                      onClick={handleRedo}
                      disabled={historyIndex >= history.length - 1}
                      className="h-8 px-2"
                    >
                      Redo
                    </Button>
                  </div>
                </div>
                
                <Textarea
                  value={markdownContent}
                  onChange={(e) => handleContentChange(e.target.value)}
                  onPaste={handlePaste}
                  placeholder="# Question 1&#10;&#10;Your question content here&#10;&#10;---&#10;&#10;# Question 2"
                  className="font-mono min-h-[400px]"
                />
                
                <div className="text-xs text-muted-foreground">
                  Use --- to separate questions. Images must be from trusted domains ({TRUSTED_DOMAINS.join(', ')}).
                </div>
                
                {/* Validation in progress */}
                {isValidating && (
                  <div className="space-y-2 mt-4">
                    <div className="flex justify-between items-center text-xs text-muted-foreground">
                      <span>Validating content...</span>
                      <span>{showValidationProgress}%</span>
                    </div>
                    <Progress value={showValidationProgress} className="h-1" />
                  </div>
                )}
              </div>
            </TabsContent>
            
            <TabsContent value="preview">
              <div className="h-[500px] overflow-hidden">
                {previewJson && previewJson.questions && previewJson.questions.length > 0 ? (
                  <div className="flex flex-col h-full">
                    <div className="p-3 border-b flex justify-between items-center">
                      <span className="text-sm font-medium">
                        Question {currentQuestionIndex + 1} of {previewJson.questions.length}
                      </span>
                      <span className="text-sm">
                        <Clock className="h-4 w-4 inline mr-1" />
                        {timeLimit / 60} minutes
                      </span>
                    </div>
                    
                    <div
                      key={currentQuestionIndex}
                      className="flex-grow overflow-auto p-4"
                    >
                      <div
                        dangerouslySetInnerHTML={{
                          __html: DOMPurify.sanitize(marked.parse(previewJson.questions[currentQuestionIndex]?.question || "", { async: false }))
                        }}
                        className="prose prose-sm max-w-none dark:prose-invert"
                      />
                    </div>
                    
                    <div className="p-3 border-t flex justify-between">
                      <Button
                        onClick={handlePreviousQuestion}
                        disabled={currentQuestionIndex === 0}
                        variant="outline"
                        size="sm"
                      >
                        <ChevronRight className="h-4 w-4 mr-1 rotate-180" />
                        Previous
                      </Button>
                      <Button
                        onClick={handleNextQuestion}
                        disabled={currentQuestionIndex === previewJson.questions.length - 1}
                        variant="outline"
                        size="sm"
                      >
                        Next
                        <ChevronRight className="h-4 w-4 ml-1" />
                      </Button>
                    </div>
                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center h-full text-center p-6">
                    <div className="mb-4">
                      <RefreshCw className="h-10 w-10 text-muted-foreground mx-auto mb-2" />
                      <h3 className="text-lg font-medium">No Preview Available</h3>
                    </div>
                    <p className="text-sm text-muted-foreground max-w-md">
                      Write your questions and click "Preview" to see how they will appear.
                    </p>
                  </div>
                )}
              </div>
            </TabsContent>
            
            <TabsContent value="validation">
              {/* ... existing validation tab content ... */}
            </TabsContent>
          </Tabs>
        </CardContent>
      </>
    );
  };

  // // Add conditional rendering based on view
  // if (view === 'list') {
  //   // Render test list view (previously in TestList.tsx)
  //   // ...
  // }
  
  // if (view === 'detail' && testId) {
  //   // Render test detail view (previously in TestDetail.tsx)
  //   // ...
  // }
  
  // if (view === 'flow' && companyId) {
  //   // Render flow manager view (previously in TestFlowManager.tsx)
  //   // ...
  // }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <span className="ml-2 text-lg">Loading...</span>
      </div>
    );
  }

  // Default view (test editor)
  return (
    <>
      <Breadcrumbs items={[
        { label: "Companies", onClick: () => router.push("/companies?view=list") },
        { label: companyName, onClick: () => router.push(`/tests?view=list&companyId=${companyId}`) },
        { label: "Test Manager" },
      ]} />

      {/* <div className="mb-6">
        <h1 className="text-2xl font-bold mb-2">Test Manager</h1>
        <p className="text-gray-500">
          Manage test structure and content
        </p>
      </div> */}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Panel - Tree View */}
        <Card className="lg:col-span-1">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle>Test Structure</CardTitle>
            <Button 
              size="sm"
              onClick={() => setShowAddCategoryDialog(true)}
            >
              <FolderPlus className="h-4 w-4 mr-1" />
              Add Category
            </Button>
          </CardHeader>
          <CardContent>
            <div className="space-y-1">
              {menuStructure.length > 0 ? (
                menuStructure.map(node => renderTreeNode(node))
              ) : (
                <div className="text-center p-8 text-muted-foreground">
                  <p>No categories defined</p>
                  <p className="text-sm mt-2">Add a category to get started</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Right Panel - Content Editor */}
        <Card className="lg:col-span-2">
          {renderContentEditor()}
          <div className="flex justify-between items-center p-4 border-t">
            <div className="text-sm">
              {isModified && <span className="text-amber-500">Unsaved changes</span>}
              {saveStatus === 'success' && <span className="text-green-500">Saved successfully</span>}
              {saveStatus === 'error' && <span className="text-red-500">Save failed</span>}
            </div>
            <div className="flex space-x-2">
              {/* <Button 
                variant="outline"
                onClick={() => handlePreview()}
                disabled={!markdownContent.trim()}
              >
                Preview
              </Button> */}
              <Button 
                onClick={handleSaveContent}
                disabled={isSaving}
              >
                {isSaving ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Saving...
                  </>
                ) : (
                  <>
                    <Save className="mr-2 h-4 w-4" />
                    Save
                  </>
                )}
              </Button>
            </div>
          </div>
        </Card>
      </div>

      {/* Add Category Dialog */}
      <Dialog open={showAddCategoryDialog} onOpenChange={setShowAddCategoryDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add Category</DialogTitle>
            <DialogDescription>
              Create a new category for organizing tests
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <Label htmlFor="category-name">Category Name</Label>
            <Input
              id="category-name"
              value={newCategoryName}
              onChange={(e) => setNewCategoryName(e.target.value)}
              placeholder="e.g., ML Engineer"
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowAddCategoryDialog(false)}>
              Cancel
            </Button>
            <Button onClick={handleAddCategory}>Add Category</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Add Test Dialog */}
      <Dialog open={showAddTestDialog} onOpenChange={setShowAddTestDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add Test</DialogTitle>
            <DialogDescription>
              Add a new test to {selectedCategory?.name}
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <Label htmlFor="test-name">Test Name</Label>
            <Input
              id="test-name"
              value={newTestName}
              onChange={(e) => setNewTestName(e.target.value)}
              placeholder="e.g., Mathematics"
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowAddTestDialog(false)}>
              Cancel
            </Button>
            <Button onClick={handleAddTest}>Add Test</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Confirm Deletion</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete {nodeToDelete?.children ? 'category' : 'test'} "{nodeToDelete?.name}"?
              {nodeToDelete?.children && nodeToDelete.children.length > 0 && (
                <p className="text-destructive mt-2">
                  This will also delete all tests within this category!
                </p>
              )}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowDeleteDialog(false)}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleDeleteNode}>
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Validation Dialog */}
      <Dialog open={showValidationDialog} onOpenChange={setShowValidationDialog}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Content Validation Issues</DialogTitle>
            <DialogDescription>
              Please fix the following issues before saving:
            </DialogDescription>
          </DialogHeader>
          <div className="max-h-[60vh] overflow-y-auto">
            {validationErrors.map((error, index) => (
              <Alert key={index} variant="destructive" className="mb-2">
                <AlertTriangle className="h-4 w-4" />
                <AlertTitle>
                  {error.complexity ? `${error.complexity} Complexity: ` : ''}
                  {error.type.charAt(0).toUpperCase() + error.type.slice(1)} Issue
                </AlertTitle>
                <AlertDescription>{error.message}</AlertDescription>
              </Alert>
            ))}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowValidationDialog(false)}>
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Image Fix Dialog */}
      <Dialog open={showImageFixDialog} onOpenChange={setShowImageFixDialog}>
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle>Fix Image Issues</DialogTitle>
            <DialogDescription>
              The following images need to be fixed before saving:
            </DialogDescription>
          </DialogHeader>
          <div className="py-4 max-h-[60vh] overflow-auto">
            <Alert variant="destructive" className="mb-4">
              <ImageOff className="h-4 w-4" />
              <AlertTitle>Image Issues ({brokenImages.length})</AlertTitle>
              <AlertDescription>
                <p className="mb-2">Images must be from trusted domains: {TRUSTED_DOMAINS.join(', ')}</p>
                <ul className="mt-2 text-sm space-y-3">
                  {brokenImages.map((url, i) => {
                    const actualUrl = url.split(' ')[0]; // Extract just the URL part
                    const errorType = url.includes('(') ? url.split('(')[1].replace(')', '') : '';

                    return (
                      <li key={i} className="flex items-start text-xs">
                        <div className="flex-1">
                          <div className="mb-1 break-all">
                            <span>{url}</span>
                          </div>
                          <div className="mt-1 flex space-x-2">
                            <Input
                              placeholder="New URL"
                              className="h-8 text-xs"
                              onKeyDown={(e) => {
                                if (e.key === 'Enter') {
                                  handleUrlReplacement(actualUrl, e.currentTarget.value, e.currentTarget);
                                }
                              }}
                            />
                            <Button
                              size="sm"
                              className="h-8"
                              onClick={(evt) => {
                                const input = evt.currentTarget.previousElementSibling as HTMLInputElement;
                                if (input.value) {
                                  handleUrlReplacement(actualUrl, input.value, input);
                                } else {
                                  toast({
                                    title: "Error",
                                    description: "Please enter a replacement URL",
                                    variant: "destructive"
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
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowImageFixDialog(false)}>
              Close
            </Button>
            <Button 
              onClick={handleSaveContent}
              disabled={brokenImages.length > 0}
            >
              {brokenImages.length > 0 ? "Fix All Images First" : "Save Anyway"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}

// Add the findParentCategory function
const findParentCategory = (node: MenuNode, menuStructure: MenuNode[]): string => {
  for (const category of menuStructure) {
    if (category.children && category.children.some(child => child.id === node.id)) {
      return category.name;
    }
  }
  return ""; // Default if no parent category found
};