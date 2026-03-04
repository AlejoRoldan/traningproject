/**
 * Gemini API Integration
 * 
 * Wrapper para Google Gemini API con soporte para:
 * - Chat completions (LLM)
 * - Speech-to-Text (transcripción)
 * - Text-to-Speech (síntesis de voz)
 */

import { ENV } from "./env";

const GEMINI_API_BASE = "https://generativelanguage.googleapis.com/v1beta/models";

export interface GeminiMessage {
  role: "user" | "model";
  parts: Array<{
    text?: string;
    inlineData?: {
      mimeType: string;
      data: string; // base64
    };
  }>;
}

export interface GeminiChatRequest {
  contents: GeminiMessage[];
  generationConfig?: {
    temperature?: number;
    topK?: number;
    topP?: number;
    maxOutputTokens?: number;
    stopSequences?: string[];
  };
  safetySettings?: Array<{
    category: string;
    threshold: string;
  }>;
  systemInstruction?: {
    parts: Array<{ text: string }>;
  };
}

export interface GeminiChatResponse {
  candidates: Array<{
    content: {
      parts: Array<{ text: string }>;
      role: string;
    };
    finishReason: string;
    index: number;
  }>;
  usageMetadata?: {
    promptTokenCount: number;
    candidatesTokenCount: number;
    totalTokenCount: number;
  };
}

/**
 * Llamar a Gemini API para chat completions
 */
export async function callGeminiChat(
  request: GeminiChatRequest,
  model: string = "gemini-2.0-flash"
): Promise<GeminiChatResponse> {
  if (!ENV.GEMINI_API_KEY) {
    throw new Error("GEMINI_API_KEY is not configured");
  }

  const url = `${GEMINI_API_BASE}/${model}:generateContent?key=${ENV.GEMINI_API_KEY}`;

  const response = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(request),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(
      `Gemini API error: ${response.status} ${response.statusText} – ${errorText}`
    );
  }

  return (await response.json()) as GeminiChatResponse;
}

/**
 * Convertir mensajes de formato OpenAI a formato Gemini
 */
export function convertOpenAIToGemini(
  messages: Array<{ role: string; content: string }>
): GeminiMessage[] {
  return messages.map((msg) => ({
    role: msg.role === "assistant" ? "model" : "user",
    parts: [{ text: msg.content }],
  }));
}

/**
 * Convertir respuesta de Gemini a formato compatible con OpenAI
 */
export function convertGeminiToOpenAI(response: GeminiChatResponse): {
  content: string;
  role: string;
} {
  if (!response.candidates || response.candidates.length === 0) {
    throw new Error("No candidates in Gemini response");
  }

  const candidate = response.candidates[0];
  const text = candidate.content.parts
    .filter((part) => part.text)
    .map((part) => part.text)
    .join("");

  return {
    role: "assistant",
    content: text,
  };
}

/**
 * Transcribir audio usando Gemini Speech-to-Text
 * (Nota: Gemini no tiene Speech-to-Text directo, usaremos el modelo multimodal)
 */
export async function transcribeAudioWithGemini(
  audioBase64: string,
  mimeType: string = "audio/webm"
): Promise<string> {
  const request: GeminiChatRequest = {
    contents: [
      {
        role: "user",
        parts: [
          {
            inlineData: {
              mimeType,
              data: audioBase64,
            },
          },
          {
            text: "Transcribe this audio to text. Return only the transcription without any additional commentary.",
          },
        ],
      },
    ],
  };

  const response = await callGeminiChat(request);
  const result = convertGeminiToOpenAI(response);
  return result.content;
}

/**
 * Generar síntesis de voz usando Google Cloud Text-to-Speech
 * (Nota: Gemini no tiene TTS nativo, pero podemos usar Google Cloud TTS)
 */
export async function synthesizeSpeechWithGemini(
  text: string,
  languageCode: string = "es-ES",
  voiceName: string = "es-ES-Neural2-A"
): Promise<Buffer> {
  // Usar Google Cloud Text-to-Speech API
  const url = "https://texttospeech.googleapis.com/v1/text:synthesize";

  const response = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "X-Goog-Api-Key": ENV.GEMINI_API_KEY,
    },
    body: JSON.stringify({
      input: { text },
      voice: {
        languageCode,
        name: voiceName,
      },
      audioConfig: {
        audioEncoding: "MP3",
        pitch: 0,
        speakingRate: 1,
      },
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(
      `Google TTS error: ${response.status} ${response.statusText} – ${errorText}`
    );
  }

  const data = (await response.json()) as {
    audioContent: string;
  };

  // audioContent es base64
  return Buffer.from(data.audioContent, "base64");
}

/**
 * Voces disponibles en Google Cloud TTS
 */
export const AVAILABLE_VOICES = {
  es_ES_female: "es-ES-Neural2-A",
  es_ES_male: "es-ES-Neural2-B",
  es_MX_female: "es-MX-Neural2-A",
  es_MX_male: "es-MX-Neural2-B",
  es_US_female: "es-US-Neural2-A",
  es_US_male: "es-US-Neural2-B",
};

/**
 * Seleccionar voz según género y región
 */
export function selectGeminiVoice(
  gender?: "male" | "female",
  region: string = "es_ES"
): string {
  const key = `${region}_${gender || "female"}` as keyof typeof AVAILABLE_VOICES;
  return AVAILABLE_VOICES[key] || AVAILABLE_VOICES.es_ES_female;
}
