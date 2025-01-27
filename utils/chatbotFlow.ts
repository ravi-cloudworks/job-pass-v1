import chatbotFlowData from "../chatbot-flow.json"

export interface ChatbotNode {
  question: string
  options?: string[]
  text?: string
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

export function getOptionText(key: string): string {
  if (chatbotFlow.options[key]) {
    return chatbotFlow.options[key].text
  }
  if (chatbotFlow.nodes[key]) {
    return chatbotFlow.nodes[key].text || key
  }
  return key
}

export function getQuestionSetId(node: ChatbotNode, complexity: string): string | undefined {
  console.log("Node in getQuestionSetId:", node);
  console.log("Complexity:", complexity);

  // Find parent node that contains questionSetId
  if (node.text === "Python + Django") {
    const backendNode = chatbotFlow.nodes["backend_dev"];
    if (backendNode?.questionSetId?.python_django?.standard) {
      return backendNode.questionSetId.python_django.standard[complexity.toLowerCase()]?.[0];
    }
  }

  // Original logic for other cases
  if (node?.questionSetId && node.text) {
    const questionSet = node.questionSetId[node.text.toLowerCase()];
    if (questionSet?.standard) {
      return questionSet.standard[complexity.toLowerCase()]?.[0];
    }
  }

  return undefined;
}

