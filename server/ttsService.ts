import OpenAI from "openai";
import { invokeLLM } from "./_core/llm";

/**
 * Servicio de Text-to-Speech usando OpenAI TTS API
 * Genera audio realista para las respuestas del cliente durante simulaciones
 */

// Voces disponibles en OpenAI TTS
// alloy: neutral, nova: femenina joven, shimmer: femenina suave
// echo: masculina, fable: masculina británica, onyx: masculina profunda
type TTSVoice = "alloy" | "echo" | "fable" | "onyx" | "nova" | "shimmer";

interface TTSOptions {
  text: string;
  voice?: TTSVoice;
  gender?: "male" | "female";
  speed?: number; // 0.25 to 4.0
}

/**
 * Selecciona la voz apropiada según el género del cliente
 */
function selectVoice(gender?: "male" | "female"): TTSVoice {
  if (gender === "female") {
    // Alternar entre voces femeninas para variedad
    const femaleVoices: TTSVoice[] = ["nova", "shimmer"];
    return femaleVoices[Math.floor(Math.random() * femaleVoices.length)];
  } else if (gender === "male") {
    // Alternar entre voces masculinas
    const maleVoices: TTSVoice[] = ["echo", "fable", "onyx"];
    return maleVoices[Math.floor(Math.random() * maleVoices.length)];
  }
  // Por defecto, voz neutral
  return "alloy";
}

/**
 * Genera audio usando OpenAI TTS API
 * @returns Buffer con el audio en formato MP3
 */
export async function generateSpeech(options: TTSOptions): Promise<Buffer> {
  const { text, voice, gender, speed = 1.0 } = options;

  // Usar OpenAI si está configurado
  if (process.env.OPENAI_API_KEY) {
    try {
      const openai = new OpenAI({
        apiKey: process.env.OPENAI_API_KEY,
      });

      const selectedVoice = voice || selectVoice(gender);

      const response = await openai.audio.speech.create({
        model: "tts-1", // tts-1 es más rápido, tts-1-hd es mejor calidad
        voice: selectedVoice,
        input: text,
        speed: speed,
      });

      // Convertir response a Buffer
      const arrayBuffer = await response.arrayBuffer();
      return Buffer.from(arrayBuffer);
    } catch (error) {
      console.error("[TTS] Error generating speech with OpenAI:", error);
      throw new Error("Failed to generate speech");
    }
  }

  // Fallback: generar audio silencioso si no hay API key
  // En producción, esto debería usar un servicio alternativo o retornar error
  console.warn("[TTS] OPENAI_API_KEY not configured, returning silent audio");
  return generateSilentAudio(text.length);
}

/**
 * Genera un buffer de audio silencioso como fallback
 * Útil para desarrollo sin API key
 */
function generateSilentAudio(textLength: number): Buffer {
  // Calcular duración aproximada (150 palabras por minuto)
  const words = textLength / 5; // Aproximadamente 5 caracteres por palabra
  const durationSeconds = (words / 150) * 60;

  // Generar MP3 silencioso simple (header mínimo)
  // En producción real, usar una biblioteca como `ffmpeg` para generar audio válido
  const silentMp3Header = Buffer.from([
    0xff,
    0xfb,
    0x90,
    0x00, // MP3 header
  ]);

  // Repetir para aproximar la duración
  const frames = Math.ceil(durationSeconds * 38.28); // ~38.28 frames por segundo
  return Buffer.concat(Array(frames).fill(silentMp3Header));
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
