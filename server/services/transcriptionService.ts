import { transcribeAudioWithGemini } from '../_core/gemini';

/**
 * Servicio de transcripción de audio usando Gemini
 * Convierte audio a texto usando el modelo multimodal de Gemini
 */

export async function transcribeAudio(audioBlob: Uint8Array): Promise<string> {
  try {
    // Convertir Uint8Array a base64
    const buffer = Buffer.from(audioBlob);
    const base64Audio = buffer.toString('base64');
    
    // Transcribir usando Gemini
    const transcription = await transcribeAudioWithGemini(
      base64Audio,
      'audio/webm'
    );

    return transcription;
  } catch (error) {
    console.error('Error transcribing audio with Gemini:', error);
    throw new Error('Failed to transcribe audio');
  }
}

/**
 * Transcribir audio desde URL
 */
export async function transcribeAudioFromUrl(audioUrl: string): Promise<string> {
  try {
    // Descargar audio desde URL
    const response = await fetch(audioUrl);
    if (!response.ok) {
      throw new Error(`Failed to fetch audio: ${response.statusText}`);
    }

    const arrayBuffer = await response.arrayBuffer();
    const audioBlob = new Uint8Array(arrayBuffer);

    // Transcribir
    return transcribeAudio(audioBlob);
  } catch (error) {
    console.error('Error transcribing audio from URL:', error);
    throw new Error('Failed to transcribe audio from URL');
  }
}
