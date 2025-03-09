// components/tests/TestManager.tsx
"use client"

import { useState, useEffect } from "react"
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
}

export default function TestManager({ companyId, user, testId, view = 'new' }: TestManagerProps) {
  const router = useRouter();

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

  // Complexity content state
  const [complexityContent, setComplexityContent] = useState<{
    [key: string]: { markdown: string, preview: any | null }
  }>({
    Easy: { markdown: "", preview: null },
    Medium: { markdown: "", preview: null },
    Advanced: { markdown: "", preview: null }
  });

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
                setMarkdownContent(testData.markdown_content);
                setTimeLimit(testData.time_limit);
              }
            }
          }
        }
      } catch (error) {
        console.error("Error loading data:", error);
        toast.error("Failed to load data");
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
            setMarkdownContent(data.markdown_content || "");
            setTimeLimit(data.time_limit || 900);
            
            // Parse for preview
            if (data.markdown_content) {
              const questions = data.markdown_content
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
          toast.error("Failed to load test content");
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
      toast.error("Category name cannot be empty");
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
            last_modified_by: user.id,
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
            last_modified_by: user.id,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          });
      }
      
      toast.success("Category added successfully");
      setNewCategoryName("");
      setShowAddCategoryDialog(false);
    } catch (error) {
      console.error("Error saving category:", error);
      toast.error("Failed to save category");
    }
  };

  // Add new test to category
  const handleAddTest = async () => {
    if (!selectedCategory) {
      toast.error("No category selected");
      return;
    }
    
    if (!newTestName.trim()) {
      toast.error("Test name cannot be empty");
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
      const findAndUpdateCategory = (nodes: MenuNode[]): boolean => {
        if (!selectedCategory) return false;
        
        for (let i = 0; i < nodes.length; i++) {
          if (nodes[i].id === selectedCategory.id) {
            // Create a local reference to the current node to help TypeScript track the changes
            const currentNode = nodes[i];
            
            // Initialize the children array if it doesn't exist
            if (!currentNode.children) {
              currentNode.children = [];
            }
            
            // Now we can safely push to the array
            currentNode.children.push(newTest);
            return true;
          }
          
          // For the recursive case, be extra careful with type checking
          const children = nodes[i].children;
          if (children && children.length > 0) {
            // Pass a copy or explicitly cast to avoid TypeScript confusion
            const result = findAndUpdateCategory([...children]);
            if (result) {
              return true;
            }
          }
        }
        return false;
      };
      
      findAndUpdateCategory(updatedMenu);
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
            updated_at: new Date().toISOString(),
            last_modified_by: user.id
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
            last_modified_by: user.id
          });
      }
      
      setShowAddTestDialog(false);
      setNewTestName("");
      toast.success("Test added successfully");
      
    } catch (error) {
      console.error("Error adding test:", error);
      toast.error("Failed to add test");
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
            updated_at: new Date().toISOString(),
            last_modified_by: user?.id || null
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
            last_modified_by: user?.id || null,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          });
      }
      
      setMenuStructure(updatedStructure);
      toast.success("Deleted successfully");
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
      toast.error("Failed to delete");
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
    
    // Load saved content for this complexity
    setMarkdownContent(complexityContent[complexity]?.markdown || "");
    setPreviewJson(complexityContent[complexity]?.preview);
    
    if (selectedNode && selectedNode.testIds) {
      const testId = selectedNode.testIds[complexity.toLowerCase() as keyof typeof selectedNode.testIds];
      
      if (testId) {
        // Load test content for this complexity
        await loadTestContent(testId).catch(error => {
          // If loading fails, keep the content from complexityContent
          console.log("Could not load test from database, using cached content");
          // No need to clear content here
        });
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
          
          // Set empty preview
          if (selectedNode) {
            setPreviewJson({
              id: testId,
              title: selectedNode.name,
              time_limit: complexityLevel ? complexityLevel.time * 60 : 900,
              questions: []
            });
          }
          
          return null;
        } else {
          throw error;
        }
      }
      
      setTestContent(data);
      setMarkdownContent(data.markdown_content || "");
      const complexityLevel = COMPLEXITY_LEVELS.find(c => c.name === selectedComplexity);
      setTimeLimit(complexityLevel ? complexityLevel.time * 60 : 900);
      
      // Parse questions for preview if content exists
      if (data.markdown_content) {
        const questions = data.markdown_content
          .split('---')
          .map((q: string, i: number) => ({ id: `q${i+1}`, question: q.trim() }))
          .filter((q: {id: string, question: string}) => q.question);
        
        const preview = {
          id: testId,
          title: data.title,
          time_limit: data.time_limit,
          questions: questions
        };
        
        setPreviewJson(preview);
        
        // Save to complexity content
        setComplexityContent(prev => ({
          ...prev,
          [selectedComplexity]: { 
            markdown: data.markdown_content, 
            preview: preview 
          }
        }));
      }
      return data;
    } catch (error) {
      console.error("Error loading test:", error);
      // Don't clear content on error
      throw error;
    }
  };

  // Save test content
  const handleSaveContent = async () => {
    if (!selectedNode || !selectedNode.testIds) {
      toast.error("No test selected");
      return;
    }
    
    setIsSaving(true);
    
    try {
      // Get the test ID for the current complexity
      const testId = selectedNode.testIds?.[selectedComplexity.toLowerCase() as keyof typeof selectedNode.testIds];
      
      if (!testId) {
        toast.error("Test ID not found for selected complexity");
        setIsSaving(false);
        return;
      }
      
      // Validate content
      const validationResult = validateContent(markdownContent);
      if (validationResult.errors.length > 0) {
        setValidationErrors(validationResult.errors);
        setShowValidationDialog(true);
        setIsSaving(false);
        return;
      }
      
      // Parse questions for preview
      const questions = markdownContent
        .split('---')
        .map((q, i) => ({ id: `q${i+1}`, question: q.trim() }))
        .filter(q => q.question);
      
      const preview = {
        id: testId,
        title: selectedNode.name,
        time_limit: timeLimit,
        questions: questions
      };
      
      // Check if test exists
      const { data: existingTest } = await supabase
        .from("tests")
        .select("id")
        .eq("id", testId)
        .single();
      
      if (!existingTest) {
        // Create new test
        await supabase
          .from("tests")
          .insert({
            id: testId,
            title: selectedNode.name,
            company_id: companyId,
            complexity: selectedComplexity.toUpperCase(),
            category: selectedNode.name,
            time_limit: timeLimit,
            markdown_content: markdownContent,
            created_at: new Date().toISOString()
          });
      } else {
        // Update existing test - only include fields that need to be updated
        await supabase
          .from("tests")
          .update({
            title: selectedNode.name,
            complexity: selectedComplexity.toUpperCase(),
            category: selectedNode.name,
            time_limit: timeLimit,
            markdown_content: markdownContent
          })
          .eq("id", testId);
      }
      
      // Update complexity content
      setComplexityContent(prev => ({
        ...prev,
        [selectedComplexity]: { 
          markdown: markdownContent, 
          preview: preview 
        }
      }));
      
      setPreviewJson(preview);
      toast.success("Saved successfully");
    } catch (error) {
      console.error("Error saving content:", error);
      toast.error("Failed to save content");
    } finally {
      setIsSaving(false);
    }
  };

  // Preview test
  const handlePreview = () => {
    if (!markdownContent.trim()) {
      toast.error("No content to preview");
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
  const validateContent = (content: string): { errors: ValidationError[] } => {
    const errors: ValidationError[] = [];
    
    // Check if content is too long
    if (content.length > MAX_CHARS) {
      errors.push({
        type: 'error',
        message: `Content exceeds maximum length (${content.length}/${MAX_CHARS} characters)`
      });
    }
    
    // Check number of questions
    const questions = content.split('---').filter(q => q.trim());
    if (questions.length === 0) {
      errors.push({
        type: 'error',
        message: 'No questions found. Use "---" to separate questions.'
      });
    } else if (questions.length > MAX_QUESTIONS) {
      errors.push({
        type: 'error',
        message: `Too many questions (${questions.length}/${MAX_QUESTIONS} max)`
      });
    }
    
    // Check for image URLs from untrusted domains
    const imgRegex = /!\[.*?\]\((https?:\/\/[^)]+)\)/g;
    let match;
    const untrustedImages = [];
    
    while ((match = imgRegex.exec(content)) !== null) {
      const url = match[1];
      try {
        const domain = new URL(url).hostname;
        if (!TRUSTED_DOMAINS.includes(domain)) {
          untrustedImages.push(url);
        }
      } catch (e) {
        untrustedImages.push(url);
      }
    }
    
    if (untrustedImages.length > 0) {
      errors.push({
        type: 'warning',
        message: `Found ${untrustedImages.length} images from untrusted domains. Only use images from: ${TRUSTED_DOMAINS.join(', ')}`
      });
    }
    
    return { errors };
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

  // Add conditional rendering based on view
  if (view === 'list') {
    // Render test list view (previously in TestList.tsx)
    // ...
  }
  
  if (view === 'detail' && testId) {
    // Render test detail view (previously in TestDetail.tsx)
    // ...
  }
  
  if (view === 'flow' && companyId) {
    // Render flow manager view (previously in TestFlowManager.tsx)
    // ...
  }

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
          {selectedNode && selectedNode.testIds ? (
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
                <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
                  <TabsList className="w-full">
                    <TabsTrigger value="questions" className="flex-1">Questions</TabsTrigger>
                    <TabsTrigger value="preview" className="flex-1">Preview</TabsTrigger>
                  </TabsList>
                  
                  <TabsContent value="questions" className="p-4">
                    <div className="space-y-4">
                      <Textarea
                        value={markdownContent}
                        onChange={(e) => setMarkdownContent(e.target.value)}
                        placeholder="# Question 1&#10;&#10;Your question content here&#10;&#10;---&#10;&#10;# Question 2"
                        className="font-mono min-h-[400px]"
                      />
                      <div className="flex justify-between text-xs text-muted-foreground">
                        <span>{markdownContent.length}/{MAX_CHARS} characters</span>
                        <span>{markdownContent.split('---').filter(q => q.trim()).length}/{MAX_QUESTIONS} questions</span>
                      </div>
                      
                      <div className="flex justify-end space-x-2">
                        <Button 
                          variant="outline" 
                          onClick={handlePreview}
                          disabled={!markdownContent.trim()}
                        >
                          Preview
                        </Button>
                        <Button 
                          onClick={handleSaveContent}
                          disabled={isSaving || !markdownContent.trim()}
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
                  </TabsContent>
                  
                  <TabsContent value="preview" className="p-0">
                    <div className="h-[500px] overflow-hidden">
                      {previewJson && previewJson.questions.length > 0 ? (
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
                          
                          <AnimatePresence mode="wait">
                            <motion.div
                              key={currentQuestionIndex}
                              initial={{ opacity: 0, y: 10 }}
                              animate={{ opacity: 1, y: 0 }}
                              exit={{ opacity: 0, y: -10 }}
                              transition={{ duration: 0.2 }}
                              className="flex-grow overflow-auto p-4"
                            >
                              <div
                                dangerouslySetInnerHTML={{
                                  __html: DOMPurify.sanitize(marked.parse(previewJson.questions[currentQuestionIndex]?.question || "", { async: false }))
                                }}
                                className="prose prose-sm max-w-none dark:prose-invert"
                              />
                            </motion.div>
                          </AnimatePresence>
                          
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
                </Tabs>
              </CardContent>
            </>
          ) : (
            <div className="flex flex-col items-center justify-center h-64 text-center p-6">
              <p className="text-muted-foreground">
                Select a test from the left panel to edit its content
              </p>
            </div>
          )}
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
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Validation Issues</DialogTitle>
            <DialogDescription>
              Please fix the following issues before saving:
            </DialogDescription>
          </DialogHeader>
          <div className="py-4 max-h-[60vh] overflow-auto">
            <ul className="space-y-2">
              {validationErrors.map((error, index) => (
                <li key={index} className={`p-2 rounded ${error.type === 'error' ? 'bg-destructive/10' : 'bg-amber-500/10'}`}>
                  <div className="flex items-start">
                    {error.type === 'error' ? (
                      <AlertTriangle className="h-5 w-5 text-destructive mr-2 flex-shrink-0" />
                    ) : (
                      <AlertTriangle className="h-5 w-5 text-amber-500 mr-2 flex-shrink-0" />
                    )}
                    <span>{error.message}</span>
                  </div>
                </li>
              ))}
            </ul>
          </div>
          <DialogFooter>
            <Button onClick={() => setShowValidationDialog(false)}>
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}