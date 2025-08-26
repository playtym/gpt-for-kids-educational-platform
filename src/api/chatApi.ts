
// API configuration for production deployment
const API_BASE_URL = import.meta.env.PROD 
  ? '/api' // Vercel serverless functions
  : 'http://localhost:3000/api'; // Local development

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  createdAt?: Date;
}

export async function sendChatMessage(
  messages: ChatMessage[],
  systemPrompt = "You are an educational AI assistant that helps users explore and learn about various topics."
) {
  try {
    // Get the last user message
    const lastUserMessage = messages.filter(msg => msg.role === 'user').pop();
    
    if (!lastUserMessage) {
      throw new Error('No user message found');
    }

    // Call our serverless API
    const response = await fetch(`${API_BASE_URL}/chat`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        message: lastUserMessage.content,
        mode: 'learn',
        ageGroup: '8-10'
      }),
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();

    if (!data.success) {
      throw new Error(data.error || 'API request failed');
    }

    // Return the response in the expected format
    return {
      id: Date.now().toString(),
      role: 'assistant',
      content: data.response.shortAnswer || "I'm sorry, I don't have a response for that.",
      createdAt: new Date(),
    };
  } catch (error) {
    console.error("Error in chat completion:", error);
    return {
      id: Date.now().toString(),
      role: 'assistant',
      content: "I'm sorry, there was an error processing your request. Please try again later.",
      createdAt: new Date(),
    };
  }
}

export function getGuideSystemPrompt() {
  return `You are an educational exploration guide in a learning adventure app. 
  Your job is to help users explore topics, create learning quests, and embark on educational journeys.
  Keep your answers concise, engaging, and tailored for educational exploration.
  Suggest potential quests related to user interests when appropriate.
  Always maintain a friendly, encouraging tone suitable for learners of all ages.`;
}
