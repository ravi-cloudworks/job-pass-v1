import { createClient } from '@supabase/supabase-js';
import defaultChatbotFlowData from "../chatbot-flow.json";

import { supabase, supabaseUrl } from '@/lib/supabase';

console.log('🔄 chatbotFlow.ts module loading');


// Storage bucket name
const STORAGE_BUCKET = "chatbot-flows";

// Flags to control fetching behavior
const SKIP_CHATFLOW_METADATA_CHECK = true;
const SKIP_COMPANY_REGISTRY_METADATA_CHECK = true;

// Export these types for use in other components
export interface CompanyData {
  id: string;
  name: string;
  json_file: string;
  logo: string;
  updated_at: string;
}

export interface CompanyRegistry {
  companies: {
    [companyId: string]: {
      name: string;
      jsonFile: string;
      logo: string;
    }
  };
  default: string;
  lastUpdated?: string;
}

export interface ChatbotNode {
  question: string;
  options?: string[];
  text?: string;
  parent?: string;
  isEndpoint?: boolean;
  questionSetId?: {
    [key: string]: {
      standard: {
        [level: string]: string[]
      }
    }
  }
}

export interface ChatbotOption {
  text: string;
}

export interface Metadata {
  version?: string;
  lastUpdated?: string;
  company?: string;
  description?: string;
  defaultLanguage?: string;
}

export interface ChatbotFlow {
  metadata?: Metadata;
  nodes: { [key: string]: ChatbotNode };
  options: { [key: string]: ChatbotOption };
}

/**
 * Gets the company ID from the URL search parameters
 * @returns The company ID or null if not present
 */
export function getCompanyIdFromUrl(): string | null {
  if (typeof window !== 'undefined') {
    const params = new URLSearchParams(window.location.search);
    const companyId = params.get('company_id');
    console.log(`🔍 Getting company_id from URL: "${companyId}"`);
    return companyId;
  }
  return null;
}

// Cache for company registry
let companyRegistryCache: CompanyRegistry | null = null;

// Export the registry itself for use in other components
export let companyRegistry: CompanyRegistry = {
  companies: {},
  default: 'chatbot-flow.json'
};

// Cache to store loaded flows
const flowCache: Record<string, ChatbotFlow> = {};

/**
 * Loads the company registry from Supabase or local storage
 */
export async function loadCompanyRegistry(): Promise<CompanyRegistry> {
  // Check localStorage first if we're in a browser environment
  if (typeof window !== 'undefined') {
    const cachedDataString = localStorage.getItem('company-registry-data');

    if (cachedDataString) {
      try {
        console.log(`Found cached company registry`);
        const cachedData = JSON.parse(cachedDataString);

        // If skip flag is true, use cached data without checking for updates
        if (SKIP_COMPANY_REGISTRY_METADATA_CHECK) {
          console.log(`⚡ Using cached company registry (skipping metadata check)`);
          companyRegistry = cachedData;
          return cachedData;
        }

        // Check if we should fetch updated data
        if (cachedData.lastUpdated) {
          const cachedLastUpdated = new Date(cachedData.lastUpdated).getTime();
          // TODO: Add logic to check if data is fresh
          // For now, just use the cached data if it exists
          companyRegistry = cachedData;
          return cachedData;
        }
      } catch (e) {
        console.warn(`Error parsing cached company registry:`, e);
      }
    }
  }

  // If we reach here, we need to fetch from Supabase
  try {
    console.log('📥 Fetching company registry from Supabase');

    const { data, error } = await supabase
      .from('companies')
      .select('id, name, json_file, logo, updated_at')
      .order('name');

    console.log("READ COMPANIES TABLE FROM SUPABASE")

    if (error) {
      throw new Error(`Error fetching company registry: ${error.message}`);
    }

    if (!data || data.length === 0) {
      throw new Error('No companies found in registry');
    }

    // Transform data to expected format
    const registry: CompanyRegistry = {
      companies: {},
      default: 'chatbot-flow.json',
      lastUpdated: new Date().toISOString()
    };

    data.forEach((company: CompanyData) => {
      registry.companies[company.id] = {
        name: company.name,
        jsonFile: company.json_file,
        logo: company.logo
      };
    });

    // Store in memory cache and localStorage
    companyRegistryCache = registry;
    companyRegistry = registry;

    if (typeof window !== 'undefined') {
      localStorage.setItem('company-registry-data', JSON.stringify(registry));
      console.log('💾 Stored company registry in localStorage');
    }

    return registry;
  } catch (error) {
    console.error('Error loading company registry:', error);

    // Return a minimal registry if needed for fallback
    const fallbackRegistry = {
      companies: {
        default: {
          name: 'Default',
          jsonFile: 'chatbot-flow.json',
          logo: 'default-logo.svg'
        }
      },
      default: 'chatbot-flow.json'
    };

    companyRegistry = fallbackRegistry;
    return fallbackRegistry;
  }
}

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
  // For partial file reading with range header
  console.log(`Fetching metadata from ${filename}`);

  try {
    // Create a signed URL for the file
    const { data: signedURLData, error: signedURLError } = await supabase
      .storage
      .from(STORAGE_BUCKET)
      .createSignedUrl(filename, 60); // URL valid for 60 seconds

    if (signedURLError) {
      console.error('Signed URL error details:', signedURLError);
      throw new Error(`Failed to create signed URL: ${signedURLError.message}`);
    }

    // Use the signed URL with a range header
    const response = await fetch(signedURLData.signedUrl, {
      headers: {
        'Range': 'bytes=0-200' // First 200 bytes for metadata
      }
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch metadata: ${response.status} ${response.statusText}`);
    }

    // Get the partial JSON text
    const partialJson = await response.text();
    console.log('Partial JSON (first 200 bytes):', partialJson);

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
    const companyData = companyRegistry.companies[companyId];
    console.log(`Found company in registry: ${companyId} (${companyData.name})`);

    try {
      // Check localStorage first if we're in a browser environment
      if (typeof window !== 'undefined') {
        const cachedDataString = localStorage.getItem(`${companyId}-flow-data`);

        if (cachedDataString) {
          try {
            console.log(`Found cached data for ${companyId}`);
            const cachedData = JSON.parse(cachedDataString);

            // If SKIP flag is true, use cached data without checking for updates
            if (SKIP_CHATFLOW_METADATA_CHECK) {
              console.log(`⚡ Using cached flow for company: ${companyId} (skipping metadata check)`);
              return cachedData.data;
            }

            const cachedMetadata = cachedData.metadata;

            // Check if we have lastUpdated before trying to parse it
            if (cachedMetadata?.lastUpdated) {
              const cachedLastUpdated = new Date(cachedMetadata.lastUpdated).getTime();

              console.log(`Cached data timestamp: ${cachedMetadata.lastUpdated}`);

              // Fetch just the metadata to check if we need to update
              const jsonFile = companyData.jsonFile;
              const currentMetadata = await fetchMetadataFromFile(jsonFile);

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

      const jsonFile = companyData.jsonFile;

      console.log(`Fetching from storage bucket: ${STORAGE_BUCKET}, file: ${jsonFile}`);

      // Use the Supabase client's storage methods to download the file
      const { data, error } = await supabase
        .storage
        .from(STORAGE_BUCKET)
        .download(jsonFile);

      if (error) {
        console.error('Storage download error details:', error);
        throw new Error(`Failed to fetch flow data: ${error.message || JSON.stringify(error)}`);
      }

      // Convert the downloaded data to text
      const text = await data.text();

      // Parse the JSON text
      try {
        flowData = JSON.parse(text) as ChatbotFlow;
      } catch (error) {
        // Use a different variable name to avoid redeclaration
        // and properly handle the error type
        const jsonError = error instanceof Error
          ? error.message
          : 'Unknown JSON parsing error';

        throw new Error(`Failed to parse JSON data: ${jsonError}`);
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

/**
 * Initialize the chatbot flow system
 */
export async function initializeChatbot() {
  try {
    // First load the company registry
    await loadCompanyRegistry();
    console.log('✅ Loaded company registry');

    // Then try to load company specific flow if URL has company_id
    const companyId = getCompanyIdFromUrl();
    if (companyId) {
      chatbotFlow = await loadChatbotFlow(companyId);
    }

    // Dispatch event that flow is ready
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('company-flow-ready'));
      console.log(`📣 Dispatched company-flow-ready event`);
    }
  } catch (error) {
    console.error('Error initializing chatbot:', error);
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('company-flow-error', {
        detail: { error: 'Failed to initialize chatbot' }
      }));
    }
  }
}

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

    try {
      await initializeChatbot();
      isInitialized = true;
    } catch (error) {
      console.error('Error in initializeFlow:', error);
    } finally {
      isInitializing = false;
    }
  };

  // Execute initialization when DOM is fully loaded
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
        options: ["Easy", "Medium", 'Advanced'],
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