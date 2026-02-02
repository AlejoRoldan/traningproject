import OpenAI from 'openai';

// Initialize OpenAI client with user's API key
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export interface ChatMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

/**
 * Generate a chat completion using OpenAI API
 */
export async function generateChatCompletion(
  messages: ChatMessage[],
  options?: {
    model?: string;
    temperature?: number;
    maxTokens?: number;
  }
): Promise<string> {
  try {
    const response = await openai.chat.completions.create({
      model: options?.model || 'gpt-4o',
      messages: messages,
      temperature: options?.temperature || 0.7,
      max_tokens: options?.maxTokens || 1000,
    });

    return response.choices[0]?.message?.content || '';
  } catch (error) {
    console.error('[OpenAI Service] Error generating chat completion:', error);
    throw new Error('Failed to generate response from OpenAI');
  }
}

/**
 * Generate a structured JSON response using OpenAI API
 */
export async function generateStructuredResponse<T>(
  messages: ChatMessage[],
  schema: {
    name: string;
    schema: Record<string, any>;
  },
  options?: {
    model?: string;
    temperature?: number;
  }
): Promise<T> {
  try {
    const response = await openai.chat.completions.create({
      model: options?.model || 'gpt-4o',
      messages: messages,
      temperature: options?.temperature || 0.7,
      response_format: {
        type: 'json_schema',
        json_schema: {
          name: schema.name,
          strict: true,
          schema: schema.schema,
        },
      },
    });

    const content = response.choices[0]?.message?.content || '{}';
    return JSON.parse(content) as T;
  } catch (error) {
    console.error('[OpenAI Service] Error generating structured response:', error);
    throw new Error('Failed to generate structured response from OpenAI');
  }
}

/**
 * Test OpenAI API connection
 */
export async function testOpenAIConnection(): Promise<boolean> {
  try {
    const response = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [{ role: 'user', content: 'Test' }],
      max_tokens: 5,
    });

    return !!response.choices[0]?.message?.content;
  } catch (error) {
    console.error('[OpenAI Service] Connection test failed:', error);
    return false;
  }
}
