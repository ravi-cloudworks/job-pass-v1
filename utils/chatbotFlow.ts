import defaultChatbotFlowData from "../chatbot-flow.json"
import companyRegistry from "../config/company-registry.json"

console.log('🔄 chatbotFlow.ts module loading');

// Type definition for company registry
interface CompanyData {
  name: string
  jsonFile: string
  logo: string
}

interface CompanyRegistry {
  companies: {
    [companyId: string]: CompanyData
  }
  default: string
}

export interface ChatbotNode {
  question: string
  options?: string[]
  text?: string
  parent?: string
  isEndpoint?: boolean
  questionSetId?: {
    [key: string]: {
      standard: {
        [level: string]: string[]
      }
    }
  }
}

export interface ChatbotOption {
  text: string
}

export interface Metadata {
  version?: string
  lastUpdated?: string
  company?: string
  description?: string
  defaultLanguage?: string
}

export interface ChatbotFlow {
  metadata?: Metadata
  nodes: { [key: string]: ChatbotNode }
  options: { [key: string]: ChatbotOption }
}

/**
 * Gets the company ID from the URL search parameters
 * @returns The company ID or null if not present
 */
export function getCompanyIdFromUrl(): string | null {
  if (typeof window !== 'undefined') {
    const params = new URLSearchParams(window.location.search)
    const companyId = params.get('company_id');
    console.log(`🔍 Getting company_id from URL: "${companyId}"`);
    return companyId;
  }
  return null
}

// Cache to store loaded flows
const flowCache: Record<string, ChatbotFlow> = {}

/**
 * Extracts metadata from a partial JSON string using regex
 * @param partialJson The partial JSON string
 * @returns The extracted metadata or null if not found
 */
function extractMetadata(partialJson: string): Metadata | null {
  try {
    // Look for metadata object at the beginning of the JSON
    const metadataMatch = partialJson.match(/"metadata"\s*:\s*({[^}]+})/);
    
    if (metadataMatch && metadataMatch[1]) {
      // Create a properly formed JSON object
      const validJson = `{"metadata":${metadataMatch[1]}}`;
      const parsed = JSON.parse(validJson);
      return parsed.metadata;
    }
    return null;
  } catch (error) {
    console.error('Error extracting metadata:', error);
    return null;
  }
}

/**
 * Performs a partial read of a file to extract just the metadata
 * @param filename The file to read
 * @returns The extracted metadata or null if failed
 */
async function fetchMetadataFromFile(filename: string): Promise<Metadata | null> {
  try {
    console.log(`Fetching metadata from ${filename}`);
    
    // In a production environment, we'd use Range headers
    // For local development with imports, we'll simulate by reading the whole file
    // and then only processing the first part
    let module;
    
    // Conditional import based on filename
    if (filename.includes('ibm')) {
      module = await import('../chatbot-flow-ibm.json');
    } else if (filename.includes('cisco')) {
      module = await import('../chatbot-flow-cisco.json');
    } else {
      return null;
    }
    
    // Convert to string to simulate partial read
    const fullJson = JSON.stringify(module.default);
    const partialJson = fullJson.substring(0, 200); // Simulate reading only first 500 bytes
    
    console.log('Partial JSON (first 500 bytes):', partialJson);
    
    // Extract metadata from partial JSON
    const metadata = extractMetadata(partialJson);
    console.log('Extracted metadata:', metadata);
    return metadata;
  } catch (error) {
    console.error(`Error fetching metadata from ${filename}:`, error);
    return null;
  }
}

/**
 * Loads the appropriate chatbot flow based on the company ID
 * with efficient caching using partial reads
 * @param companyId The company ID to load flow for
 * @returns The chatbot flow data
 */
export async function loadChatbotFlow(companyId: string | null): Promise<ChatbotFlow> {
  // If no company ID is provided, return default flow
  if (!companyId) {
    console.log('Using default chatbot flow');
    return defaultChatbotFlowData as ChatbotFlow;
  }
  
  console.log(`Loading flow for company ID: ${companyId}`);
  
  // Check if the company ID exists in the registry
  if (companyRegistry.companies && companyId in companyRegistry.companies) {
    const companyData = companyRegistry.companies[companyId as keyof typeof companyRegistry.companies];
    console.log(`Found company in registry: ${companyId} (${companyData.name})`);
    
    try {
      // Check localStorage first if we're in a browser environment
      if (typeof window !== 'undefined') {
        const cachedDataString = localStorage.getItem(`${companyId}-flow-data`);
        
        if (cachedDataString) {
          try {
            console.log(`Found cached data for ${companyId}`);
            const cachedData = JSON.parse(cachedDataString);
            const cachedMetadata = cachedData.metadata;
            
            // Check if we have lastUpdated before trying to parse it
            if (cachedMetadata?.lastUpdated) {
              const cachedLastUpdated = new Date(cachedMetadata.lastUpdated).getTime();
              
              console.log(`Cached data timestamp: ${cachedMetadata.lastUpdated}`);
              
              // Fetch just the metadata to check if we need to update
              const filename = companyData.jsonFile;
              const currentMetadata = await fetchMetadataFromFile(filename);
              
              if (currentMetadata?.lastUpdated) {
                const serverLastUpdated = new Date(currentMetadata.lastUpdated).getTime();
                console.log(`Server data timestamp: ${currentMetadata.lastUpdated}`);
                
                if (cachedLastUpdated >= serverLastUpdated) {
                  console.log(`✅ Using cached flow for company: ${companyId} (cache is current)`);
                  return cachedData.data;
                }
                
                console.log(`⚠️ Cache outdated for company: ${companyId}, fetching updated data`);
              }
            } else {
              console.log(`Cached data has no timestamp, fetching fresh data`);
            }
          } catch (e) {
            console.warn(`Error parsing cached data for company ${companyId}:`, e);
            // Continue to fetch fresh data
          }
        } else {
          console.log(`No cached data found for ${companyId}`);
        }
      }
      
      // If we reach here, we need to fetch fresh data
      let flowData: ChatbotFlow;
      
      console.log(`📥 Fetching full flow data for company: ${companyId}`);
      
      // Hard-code specific imports for now, based on company ID
      if (companyId === 'ibm') {
        const module = await import('../chatbot-flow-ibm.json');
        flowData = module.default as ChatbotFlow;
      } else if (companyId === 'cisco') {
        const module = await import('../chatbot-flow-cisco.json');
        flowData = module.default as ChatbotFlow;
      } else {
        // Fallback to default if the specific JSON isn't available
        console.warn(`No specific import available for company ${companyId}, using default`);
        flowData = defaultChatbotFlowData as ChatbotFlow;
      }
      
      // Store in memory cache
      flowCache[companyId] = flowData;
      
      // Also store in localStorage for persistence across sessions
      if (typeof window !== 'undefined' && flowData.metadata?.lastUpdated) {
        localStorage.setItem(`${companyId}-flow-data`, JSON.stringify({
          metadata: flowData.metadata,
          data: flowData
        }));
        console.log(`💾 Stored flow data in localStorage for company: ${companyId}`);
      }
      
      return flowData;
    } catch (error) {
      console.error(`Error loading flow for company ${companyId}:`, error);
    }
  } else {
    console.warn(`Company ID "${companyId}" not found in registry`);
  }
  
  // If company ID is not in registry or loading fails, fall back to default
  console.warn(`Using default flow (company ID "${companyId}" not found or load failed)`);
  return defaultChatbotFlowData as ChatbotFlow;
}

// Initial load with default flow (synchronous)
export let chatbotFlow: ChatbotFlow = defaultChatbotFlowData as ChatbotFlow;
console.log('⚡ Initial default flow loaded synchronously');

// Add a listener for DOM content loaded
if (typeof window !== 'undefined') {
  console.log('📣 Setting up initialization for browser environment');
  
  // Create a flag to track initialization state
  let isInitializing = false;
  let isInitialized = false;
  
  const initializeFlow = async () => {
    if (isInitializing || isInitialized) {
      console.log('🔄 Flow initialization already in progress or completed');
      return;
    }
    
    isInitializing = true;
    const companyId = getCompanyIdFromUrl();
    console.log(`🔍 Initialization checking for company_id in URL: "${companyId}"`);
    
    if (companyId) {
      // Check if company exists in registry before trying to load
      if (companyRegistry.companies && companyId in companyRegistry.companies) {
        try {
          console.log(`🔄 Loading flow for company ID: ${companyId}`);
          const flowData = await loadChatbotFlow(companyId);
          chatbotFlow = flowData;
          console.log(`✅ Successfully loaded flow for company ID: ${companyId}`);
          isInitialized = true;
          
          // IMPORTANT: Dispatch the company-flow-ready event
          window.dispatchEvent(new CustomEvent('company-flow-ready'));
          console.log(`📣 Dispatched company-flow-ready event for ${companyId}`);
          
        } catch (error) {
          console.error('❌ Error initializing company flow:', error);
          // Dispatch error event
          window.dispatchEvent(new CustomEvent('company-flow-error', { 
            detail: { companyId, error: 'Failed to load company flow' } 
          }));
        }
      } else {
        // Invalid company ID
        console.error(`❌ Invalid company ID: "${companyId}" not found in registry`);
        // Dispatch invalid company event
        window.dispatchEvent(new CustomEvent('company-flow-error', { 
          detail: { companyId, error: 'Invalid company ID' } 
        }));
      }
    } else {
      console.log('ℹ️ No company ID found in URL, using default flow');
      // IMPORTANT: Dispatch the company-flow-ready event for default flow too
      window.dispatchEvent(new CustomEvent('company-flow-ready'));
      console.log(`📣 Dispatched company-flow-ready event for default flow`);
      isInitialized = true;
    }
    
    isInitializing = false;
  };

  // Execute initialization when DOM is fully loaded to ensure all parameters are available
  if (document.readyState === 'loading') {
    console.log('🔄 Document still loading, adding DOMContentLoaded listener');
    document.addEventListener('DOMContentLoaded', () => {
      console.log('🔄 DOMContentLoaded fired, initializing flow');
      initializeFlow();
    });
  } else {
    console.log('🔄 Document already loaded, initializing flow immediately');
    initializeFlow();
  }
  
  // Also listen for URL changes (for Single Page Apps)
  window.addEventListener('popstate', () => {
    console.log('🔄 URL changed, re-initializing flow');
    isInitialized = false;
    initializeFlow();
  });
}

export function getNode(key: string): ChatbotNode {
  console.log(`🔍 Getting node with key: "${key}" from flow`);
  console.log(`🔍 Current root question: "${chatbotFlow.nodes.root.question}"`);
  
  const node = chatbotFlow.nodes[key];
  if (!node) {
    console.warn(`⚠️ Node with key "${key}" not found in chatbot flow`);
    
    // Check if it's an option instead
    const option = chatbotFlow.options[key];
    if (option) {
      console.log(`✓ Found option with key "${key}": ${option.text}`);
      return {
        question: `You selected ${option.text}. What complexity level do you prefer?`,
        options: ["Easy", "Medium", "Hard"],
        isEndpoint: true,
        text: option.text,
      };
    }
    console.error(`❌ Node or option with key "${key}" not found in chatbot flow.`);
    return {
      question: "I'm sorry, but I couldn't find the next question. Let's start over.",
      options: ["root"],
    };
  }
  
  console.log(`✓ Found node with key "${key}": ${node.text || node.question}`);
  return {
    ...node,
    question: node.question || node.text || "",
  };
}

export function getOptionText(option: string): string {
  // Special cases
  if (option === "start_over") {
    return "Start Over Again";
  }

  // For other options, replace underscores with spaces and capitalize first letter
  return option
    .split('_')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(' ');
}

export function getQuestionSetId(node: ChatbotNode, complexity: string): string | undefined {
  console.log('Getting question set ID for:', {
    nodeText: node.text,
    complexity: complexity,
    hasQuestionSetId: !!node.questionSetId
  });

  // Early return if no node or complexity
  if (!node || !complexity) {
    console.log('No node or complexity provided');
    return undefined;
  }

  // Check if we're dealing with an option node (from getNode function)
  if (node.question?.includes('You selected') && node.text) {
    // Find the corresponding parent node from chatbotFlow
    const parentNodeEntry = Object.entries(chatbotFlow.nodes).find(([_, parentNode]) => {
      return parentNode.options?.some(option => {
        const optionText = chatbotFlow.options[option]?.text;
        return optionText === node.text;
      });
    });

    if (parentNodeEntry) {
      const [parentNodeKey, parentNode] = parentNodeEntry;
      console.log('Found parent node:', parentNodeKey, parentNode);

      // Get the option key that matches our text
      const optionKey = parentNode.options?.find(option => 
        chatbotFlow.options[option]?.text === node.text
      );

      if (optionKey && parentNode.questionSetId?.[optionKey]?.standard) {
        const questionSetId = parentNode.questionSetId[optionKey].standard[complexity.toLowerCase()]?.[0];
        console.log('Found question set ID:', questionSetId);
        return questionSetId;
      }
    }
  }

  // Check direct node questionSetId if it exists
  if (node.questionSetId && node.text) {
    const key = Object.keys(node.questionSetId)[0];
    if (key) {
      const questionSetId = node.questionSetId[key].standard[complexity.toLowerCase()]?.[0];
      console.log('Found direct question set ID:', questionSetId);
      return questionSetId;
    }
  }

  console.log('No question set ID found');
  return undefined;
}