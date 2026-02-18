import { transcribeAudio } from '../_core/voiceTranscription';
import { invokeLLM } from '../_core/llm';

export interface VoiceMetrics {
  speechRate: number; // words per minute
  averagePauseDuration: number; // seconds
  totalSpeakingTime: number; // seconds
  sentimentScores: {
    confidence: number; // 0-100
    empathy: number; // 0-100
    professionalism: number; // 0-100
    clarity: number; // 0-100
    enthusiasm: number; // 0-100
  };
  overallVoiceScore: number; // 0-100
  insights: string[];
}

interface WhisperSegment {
  id: number;
  seek: number;
  start: number;
  end: number;
  text: string;
  tokens: number[];
  temperature: number;
  avg_logprob: number;
  compression_ratio: number;
  no_speech_prob: number;
}

interface WhisperResponse {
  text: string;
  language: string;
  duration: number;
  segments?: WhisperSegment[];
}

/**
 * Transcribe audio and analyze voice metrics
 */
export async function analyzeVoice(audioUrl: string): Promise<{
  transcript: string;
  segments: WhisperSegment[];
  keywords: string[];
  metrics: VoiceMetrics;
}> {
  try {
    // Step 1: Transcribe audio with Whisper
    console.log('[Voice Analysis] Starting transcription...');
    const transcriptionResult = await transcribeAudio({
      audioUrl,
      language: 'es', // Spanish for Paraguay
    }) as WhisperResponse;

    const transcript = transcriptionResult.text;
    const segments = transcriptionResult.segments || [];

    console.log('[Voice Analysis] Transcription completed:', transcript.substring(0, 100));

    // Step 2: Calculate speech metrics from segments
    const speechMetrics = calculateSpeechMetrics(transcript, segments);

    // Step 3: Analyze sentiment using LLM
    const sentimentScores = await analyzeSentiment(transcript);

    // Step 4: Build complete metrics object
    const partialMetrics = {
      ...speechMetrics,
      sentimentScores,
      overallVoiceScore: 0,
      insights: [] as string[],
    };

    // Step 5: Calculate overall voice score
    partialMetrics.overallVoiceScore = calculateOverallVoiceScore(partialMetrics);

    // Step 6: Generate insights
    partialMetrics.insights = generateInsights(partialMetrics);

    const metrics: VoiceMetrics = partialMetrics;

    console.log('[Voice Analysis] Analysis completed. Overall score:', metrics.overallVoiceScore);

    // Step 7: Detect keywords
    const { detectKeywords } = await import('./keywordDetectionService');
    const keywordAnalysis = detectKeywords(transcript);
    const keywords = keywordAnalysis.keywords;

    console.log('[Voice Analysis] Detected', keywords.length, 'unique keywords');

    return {
      transcript,
      segments,
      keywords,
      metrics,
    };
  } catch (error) {
    console.error('[Voice Analysis] Error:', error);
    throw new Error('Error al analizar el audio');
  }
}

/**
 * Calculate speech rate, pauses, and speaking time from Whisper segments
 */
function calculateSpeechMetrics(
  transcript: string,
  segments: WhisperSegment[]
): Pick<VoiceMetrics, 'speechRate' | 'averagePauseDuration' | 'totalSpeakingTime'> & { sentimentScores: VoiceMetrics['sentimentScores'] } {
  const wordCount = transcript.split(/\s+/).filter(w => w.length > 0).length;

  if (segments.length === 0) {
    // Fallback if no segments available
    return {
      speechRate: 0,
      averagePauseDuration: 0,
      totalSpeakingTime: 0,
      sentimentScores: {
        confidence: 0,
        empathy: 0,
        professionalism: 0,
        clarity: 0,
        enthusiasm: 0,
      },
    };
  }

  // Calculate total speaking time (sum of all segment durations)
  const totalSpeakingTime = segments.reduce((sum, seg) => sum + (seg.end - seg.start), 0);

  // Calculate speech rate (words per minute)
  const speechRate = totalSpeakingTime > 0 ? (wordCount / totalSpeakingTime) * 60 : 0;

  // Calculate pauses (gaps between segments)
  const pauses: number[] = [];
  for (let i = 1; i < segments.length; i++) {
    const pauseDuration = segments[i].start - segments[i - 1].end;
    if (pauseDuration > 0.1) {
      // Only count pauses > 100ms
      pauses.push(pauseDuration);
    }
  }

  const averagePauseDuration = pauses.length > 0 
    ? pauses.reduce((sum, p) => sum + p, 0) / pauses.length 
    : 0;

  return {
    speechRate: Math.round(speechRate),
    averagePauseDuration: Math.round(averagePauseDuration * 100) / 100,
    totalSpeakingTime: Math.round(totalSpeakingTime * 100) / 100,
    sentimentScores: {
      confidence: 0,
      empathy: 0,
      professionalism: 0,
      clarity: 0,
      enthusiasm: 0,
    },
  };
}

/**
 * Analyze sentiment and tone from transcript using LLM
 */
async function analyzeSentiment(transcript: string): Promise<VoiceMetrics['sentimentScores']> {
  try {
    const response = await invokeLLM({
      messages: [
        {
          role: 'system',
          content: `Eres un experto en análisis de comunicación para contact centers bancarios. 
Analiza el siguiente texto de un agente de servicio al cliente y evalúa su tono en estas dimensiones:
- Confianza: ¿Habla con seguridad y conocimiento?
- Empatía: ¿Muestra comprensión y preocupación por el cliente?
- Profesionalismo: ¿Mantiene un tono apropiado y cortés?
- Claridad: ¿Se expresa de forma clara y comprensible?
- Entusiasmo: ¿Muestra energía y disposición para ayudar?

Responde SOLO con un objeto JSON válido con las puntuaciones (0-100) para cada dimensión.`,
        },
        {
          role: 'user',
          content: `Transcripción del agente:\n\n${transcript}`,
        },
      ],
      response_format: {
        type: 'json_schema',
        json_schema: {
          name: 'sentiment_analysis',
          strict: true,
          schema: {
            type: 'object',
            properties: {
              confidence: { type: 'number', description: 'Nivel de confianza (0-100)' },
              empathy: { type: 'number', description: 'Nivel de empatía (0-100)' },
              professionalism: { type: 'number', description: 'Nivel de profesionalismo (0-100)' },
              clarity: { type: 'number', description: 'Nivel de claridad (0-100)' },
              enthusiasm: { type: 'number', description: 'Nivel de entusiasmo (0-100)' },
            },
            required: ['confidence', 'empathy', 'professionalism', 'clarity', 'enthusiasm'],
            additionalProperties: false,
          },
        },
      },
    });

    const content = response.choices[0]?.message?.content;
    if (!content || typeof content !== 'string') {
      throw new Error('No response from LLM');
    }

    const scores = JSON.parse(content);
    return {
      confidence: Math.round(scores.confidence),
      empathy: Math.round(scores.empathy),
      professionalism: Math.round(scores.professionalism),
      clarity: Math.round(scores.clarity),
      enthusiasm: Math.round(scores.enthusiasm),
    };
  } catch (error) {
    console.error('[Voice Analysis] Sentiment analysis error:', error);
    // Return neutral scores if analysis fails
    return {
      confidence: 50,
      empathy: 50,
      professionalism: 50,
      clarity: 50,
      enthusiasm: 50,
    };
  }
}

/**
 * Calculate overall voice score from metrics
 */
function calculateOverallVoiceScore(metrics: Omit<VoiceMetrics, 'overallVoiceScore' | 'insights'>): number {
  const { speechRate, sentimentScores } = metrics;

  // Ideal speech rate for Spanish: 140-160 words per minute
  const speechRateScore = calculateSpeechRateScore(speechRate);

  // Average sentiment scores (weighted)
  const sentimentScore = (
    sentimentScores.confidence * 0.25 +
    sentimentScores.empathy * 0.25 +
    sentimentScores.professionalism * 0.20 +
    sentimentScores.clarity * 0.20 +
    sentimentScores.enthusiasm * 0.10
  );

  // Combined score (60% sentiment, 40% speech rate)
  const overallScore = sentimentScore * 0.6 + speechRateScore * 0.4;

  return Math.round(overallScore);
}

/**
 * Calculate speech rate score (0-100)
 */
function calculateSpeechRateScore(speechRate: number): number {
  // Ideal range: 140-160 wpm
  // Acceptable range: 120-180 wpm
  if (speechRate >= 140 && speechRate <= 160) {
    return 100;
  } else if (speechRate >= 120 && speechRate < 140) {
    // Linear interpolation from 80 to 100
    return 80 + ((speechRate - 120) / 20) * 20;
  } else if (speechRate > 160 && speechRate <= 180) {
    // Linear interpolation from 100 to 80
    return 100 - ((speechRate - 160) / 20) * 20;
  } else if (speechRate < 120) {
    // Too slow: score decreases rapidly
    return Math.max(0, 80 - (120 - speechRate));
  } else {
    // Too fast: score decreases rapidly
    return Math.max(0, 80 - (speechRate - 180));
  }
}

/**
 * Generate insights based on metrics
 */
function generateInsights(metrics: Omit<VoiceMetrics, 'insights'>): string[] {
  const insights: string[] = [];

  // Speech rate insights
  if (metrics.speechRate < 120) {
    insights.push('Hablas demasiado lento. Intenta aumentar un poco el ritmo para mantener el interés del cliente.');
  } else if (metrics.speechRate > 180) {
    insights.push('Hablas demasiado rápido. Reduce el ritmo para que el cliente pueda procesar la información.');
  } else if (metrics.speechRate >= 140 && metrics.speechRate <= 160) {
    insights.push('Excelente ritmo de habla. Mantienes un equilibrio perfecto entre claridad y dinamismo.');
  }

  // Sentiment insights
  const { sentimentScores } = metrics;
  
  if (sentimentScores.confidence < 60) {
    insights.push('Trabaja en proyectar más confianza. Usa un tono firme y evita palabras de duda.');
  }
  
  if (sentimentScores.empathy < 60) {
    insights.push('Muestra más empatía hacia el cliente. Usa frases como "entiendo su preocupación" o "comprendo su situación".');
  }
  
  if (sentimentScores.clarity < 60) {
    insights.push('Mejora la claridad de tu comunicación. Usa frases cortas y evita tecnicismos innecesarios.');
  }
  
  if (sentimentScores.enthusiasm < 50) {
    insights.push('Aumenta tu energía y entusiasmo. Un tono más positivo mejora la experiencia del cliente.');
  }

  // Positive reinforcement
  if (sentimentScores.confidence >= 80) {
    insights.push('¡Excelente confianza! Tu seguridad transmite profesionalismo.');
  }
  
  if (sentimentScores.empathy >= 80) {
    insights.push('¡Gran empatía! El cliente se siente escuchado y comprendido.');
  }

  return insights;
}
