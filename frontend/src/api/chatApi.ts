
import { OpenAI } from 'openai';

// Initialize OpenAI with a default empty string for the API key
// In a production environment, this should be handled more securely
// through environment variables properly exposed to the client
const openai = new OpenAI({
  apiKey: import.meta.env.VITE_OPENAI_API_KEY || "",
  dangerouslyAllowBrowser: true // For client-side usage
});

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
    // Format messages for OpenAI with proper typing
    const formattedMessages = [
      { 
        role: 'system' as const, 
        content: systemPrompt 
      },
      ...messages.map(msg => ({
        role: msg.role as 'user' | 'assistant' | 'system',
        content: msg.content
      }))
    ];

    // Call OpenAI API
    const response = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: formattedMessages,
      temperature: 0.7,
      max_tokens: 500,
    });

    // Return the response
    return {
      id: response.id,
      role: 'assistant',
      content: response.choices[0].message.content || "I'm sorry, I don't have a response for that.",
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
