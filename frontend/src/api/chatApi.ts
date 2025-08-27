
import { OpenAI } from 'openai';

// Initialize OpenAI with a default empty string for the API key
// DEPRECATED: Direct OpenAI usage - Using backend API instead for security
// In a production environment, this should be handled more securely
// through environment variables properly exposed to the client
/*
const openai = new OpenAI({
  apiKey: import.meta.env.VITE_OPENAI_API_KEY || "",
  dangerouslyAllowBrowser: true // For client-side usage
});
*/

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  createdAt?: Date;
}

export async function generateChatCompletion(messages: ChatMessage[]): Promise<ChatMessage> {
  try {
    // For security, redirect to backend API instead of using client-side OpenAI
    const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || window.location.origin;
    
    const response = await fetch(`${API_BASE_URL}/api/generate-content`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        messages: messages.map(msg => ({
          role: msg.role,
          content: msg.content
        }))
      }),
    });

    if (!response.ok) {
      throw new Error(`API error: ${response.status}`);
    }

    const data = await response.json();
    
    return {
      id: data.id || Date.now().toString(),
      role: 'assistant',
      content: data.content || "I'm sorry, I don't have a response for that.",
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
