import chatbotFlowData from "../chatbot-flow.json"

export interface ChatbotNode {
  question: string
  options?: string[]
  text?: string
  parent?: string  // Add parent property
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

export interface ChatbotFlow {
  nodes: { [key: string]: ChatbotNode }
  options: { [key: string]: ChatbotOption }
}

export const chatbotFlow: ChatbotFlow = chatbotFlowData as ChatbotFlow

export function getNode(key: string): ChatbotNode {
  const node = chatbotFlow.nodes[key]
  if (!node) {
    // Check if it's an option instead
    const option = chatbotFlow.options[key]
    if (option) {
      return {
        question: `You selected ${option.text}. What complexity level do you prefer?`,
        options: ["Easy", "Medium", "Hard"],
        isEndpoint: true,
        text: option.text,
      }
    }
    console.error(`Node or option with key "${key}" not found in chatbot flow.`)
    return {
      question: "I'm sorry, but I couldn't find the next question. Let's start over.",
      options: ["root"],
    }
  }
  return {
    ...node,
    question: node.question || node.text || "",
  }
}


export function getOptionText(option: string): string {
  // Special cases
  if (option === "start_over") {
    return "Start Over Again"
  }

  // For other options, replace underscores with spaces and capitalize first letter
  return option
    .split('_')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(' ')
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
