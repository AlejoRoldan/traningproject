import OpenAI from 'openai';

let openai: OpenAI | null = null;

function getOpenAI(): OpenAI | null {
  if (!process.env.OPENAI_API_KEY) {
    return null;
  }
  
  if (!openai) {
    openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
    });
  }
  
  return openai;
}

export async function transcribeAudio(audioBlob: Uint8Array): Promise<string> {
  const client = getOpenAI();
  
  if (!client) {
    throw new Error('OpenAI API key not configured. Please add OPENAI_API_KEY to your environment variables.');
  }

  try {
    // Create a File object from the buffer
    const file = new File([Buffer.from(audioBlob)], 'audio.webm', { type: 'audio/webm' });
    
    const transcription = await client.audio.transcriptions.create({
      file: file,
      model: 'whisper-1',
      language: 'es', // Spanish
      response_format: 'text'
    });

    return transcription;
  } catch (error) {
    console.error('Error transcribing audio:', error);
    throw new Error('Failed to transcribe audio');
  }
}
