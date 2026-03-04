import { ttsLogger } from '../_core/logger';
import { synthesizeSpeechWithGemini, selectGeminiVoice } from '../_core/gemini';

/**
 * Servicio de Text-to-Speech usando Google Cloud TTS (via Gemini API Key)
 * Genera audio realista para las respuestas del cliente durante simulaciones
 */

interface TTSOptions {
  text: string;
  gender?: "male" | "female";
  speed?: number; // 0.25 to 4.0 (no soportado directamente en Google TTS)
  region?: string; // es_ES, es_MX, es_US
}

/**
 * Genera audio usando Google Cloud Text-to-Speech
 * @returns Buffer con el audio en formato MP3
 */
export async function generateSpeech(options: TTSOptions): Promise<Buffer> {
  const { text, gender = "female", region = "es_ES" } = options;

  try {
    // Seleccionar voz según género y región
    const voiceName = selectGeminiVoice(gender, region);

    // Generar síntesis de voz
    const audioBuffer = await synthesizeSpeechWithGemini(
      text,
      region === "es_MX" ? "es-MX" : region === "es_US" ? "es-US" : "es-ES",
      voiceName
    );

    ttsLogger.info(
      { textLength: text.length, voiceName, region },
      "Speech generated successfully"
    );

    return audioBuffer;
  } catch (error) {
    ttsLogger.error({ err: error }, "Error generating speech with Gemini");
    throw new Error("Failed to generate speech");
  }
}

/**
 * Detecta el género del cliente desde su perfil
 */
export function detectGenderFromProfile(clientProfile: any): "male" | "female" {
  const profile = JSON.stringify(clientProfile).toLowerCase();

  // Buscar indicadores de género en el perfil
  const femaleIndicators = [
    "señora",
    "sra",
    "ella",
    "mujer",
    "femenino",
    "female",
    "woman",
    "she",
    "her",
  ];
  const maleIndicators = [
    "señor",
    "sr",
    "él",
    "hombre",
    "masculino",
    "male",
    "man",
    "he",
    "him",
  ];

  const hasFemaleIndicator = femaleIndicators.some((indicator) =>
    profile.includes(indicator)
  );
  const hasMaleIndicator = maleIndicators.some((indicator) =>
    profile.includes(indicator)
  );

  if (hasFemaleIndicator && !hasMaleIndicator) {
    return "female";
  } else if (hasMaleIndicator && !hasFemaleIndicator) {
    return "male";
  }

  // Por defecto, alternar aleatoriamente
  return Math.random() > 0.5 ? "female" : "male";
}

/**
 * Voces disponibles por región
 */
export const AVAILABLE_REGIONS = {
  es_ES: "España",
  es_MX: "México",
  es_US: "Estados Unidos",
};
