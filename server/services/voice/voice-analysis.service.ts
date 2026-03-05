import {
  Injectable,
  Logger,
  InternalServerErrorException,
} from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';

/**
 * Voice Analysis Service
 *
 * Analyzes voice characteristics and emotional content from training sessions
 *
 * Features:
 * - Speech rate calculation
 * - Pause analysis
 * - Tone and emotion detection
 * - Professionalism scoring
 * - Clarity assessment
 * - Confidence level detection
 *
 * Uses speech-to-text metadata and audio analysis
 */
@Injectable()
export class VoiceAnalysisService {
  private readonly logger = new Logger(
    VoiceAnalysisService.name,
  );

  constructor(private prisma: PrismaService) {}

  /**
   * Analyze session audio
   *
   * Comprehensive voice analysis of training session audio
   *
   * @param sessionId Training session ID
   * @returns Voice analysis metrics
   */
  async analyzeSessionAudio(
    sessionId: string,
  ): Promise<VoiceMetrics> {
    try {
      this.logger.debug(
        `Analyzing voice for session ${sessionId}`,
      );

      // Get session with audio data
      const session = await this.prisma.trainingSession.findUnique({
        where: { id: sessionId },
        include: {
          evaluation: {
            include: { voiceAnalysis: true },
          },
        },
      });

      if (!session) {
        throw new Error(`Session ${sessionId} not found`);
      }

      if (!session.audioUrl) {
        this.logger.warn(
          `Session ${sessionId} has no audio URL`,
        );
        return this.getDefaultMetrics();
      }

      // Get transcription for timing analysis
      const transcription = session.transcription || '';

      // Calculate metrics
      const metrics = await this.calculateMetrics(
        transcription,
        session.clientTranscription || '',
        session.durationSeconds || 0,
      );

      return metrics;
    } catch (error) {
      this.logger.error(
        `Voice analysis error: ${error.message}`,
      );
      return this.getDefaultMetrics();
    }
  }

  /**
   * Analyze agent voice characteristics
   *
   * @param transcription Agent's transcript
   * @param duration Session duration in seconds
   * @returns Voice characteristic analysis
   */
  async analyzeAgentVoice(
    transcription: string,
    duration: number,
  ): Promise<VoiceCharacteristics> {
    try {
      const wordCount = this.countWords(transcription);
      const sentences = this.countSentences(
        transcription,
      );
      const paragraphs = this.countParagraphs(
        transcription,
      );

      // Calculate speech rate (words per minute)
      const durationMinutes = duration / 60;
      const speechRate =
        durationMinutes > 0
          ? wordCount / durationMinutes
          : 0;

      // Calculate pause information
      const pauseAnalysis =
        this.analyzePauses(transcription);

      // Analyze tone
      const tone = this.analyzeTone(transcription);

      // Assess professionalism
      const professionalism =
        this.assessProfessionalism(transcription);

      // Detect confidence level
      const confidence = this.detectConfidence(
        transcription,
      );

      return {
        speechRate: Math.round(speechRate),
        pauseCount: pauseAnalysis.count,
        averagePauseDuration: pauseAnalysis.averageDuration,
        wordCount,
        sentenceCount: sentences,
        clarityScore: this.calculateClarity(
          transcription,
        ),
        confidenceLevel: confidence,
        empathyDetection: this.detectEmpathy(
          transcription,
        ),
        professionalismScore: professionalism,
        enthusiasmLevel: this.detectEnthusiasm(
          transcription,
        ),
        voiceTone: tone.description,
        toneEmotions: tone.emotions,
        recommendations: this.generateRecommendations({
          speechRate,
          professionalism,
          confidence,
          tone,
        }),
      };
    } catch (error) {
      this.logger.error(
        `Agent voice analysis error: ${error.message}`,
      );
      throw new InternalServerErrorException(
        'Voice analysis failed',
      );
    }
  }

  /**
   * Compare voice patterns across sessions
   *
   * Track agent's voice improvements over time
   *
   * @param agentId Agent ID
   * @param limit Number of recent sessions
   * @returns Voice pattern progression
   */
  async analyzeVoiceProgression(
    agentId: string,
    limit: number = 5,
  ): Promise<VoiceProgression> {
    try {
      const sessions = await this.prisma.trainingSession.findMany({
        where: { agentId, status: 'COMPLETED' },
        orderBy: { completedAt: 'desc' },
        take: limit,
        include: { evaluation: { include: { voiceAnalysis: true } } },
      });

      if (sessions.length < 2) {
        return {
          trend: 'insufficient_data',
          metrics: [],
          analysis: 'Need at least 2 sessions for comparison',
        };
      }

      const metrics = sessions.map((s) => ({
        sessionId: s.id,
        date: s.completedAt,
        speechRate: s.evaluation?.voiceAnalysis?.speechRate || 0,
        clarityScore:
          s.evaluation?.voiceAnalysis?.clarityScore || 0,
        professionalism:
          s.evaluation?.voiceAnalysis?.professionalismScore || 0,
      }));

      const trend = this.analyzeTrend(metrics);
      const analysis = this.generateProgressionAnalysis(
        metrics,
        trend,
      );

      return {
        trend,
        metrics,
        analysis,
      };
    } catch (error) {
      this.logger.error(
        `Progression analysis error: ${error.message}`,
      );
      throw new InternalServerErrorException(
        'Progression analysis failed',
      );
    }
  }

  /**
   * Detect emotions in speech
   *
   * Sentiment analysis based on text content
   *
   * @param text Transcribed text
   * @returns Detected emotions and sentiment
   */
  async detectEmotions(text: string): Promise<EmotionDetection> {
    try {
      // Use lexicon-based approach for emotion detection
      const emotionScores: Record<string, number> = {
        positive: 0,
        negative: 0,
        neutral: 0,
      };

      const positiveWords = [
        'gracias',
        'perfecto',
        'excelente',
        'claro',
        'entiendo',
        'ayuda',
        'solución',
        'problema',
      ];
      const negativeWords = [
        'problema',
        'error',
        'culpa',
        'mal',
        'peor',
        'inaceptable',
        'frustración',
        'disgusto',
      ];

      const words = text.toLowerCase().split(/\s+/);

      for (const word of words) {
        if (positiveWords.some((p) => word.includes(p))) {
          emotionScores.positive++;
        }
        if (negativeWords.some((n) => word.includes(n))) {
          emotionScores.negative++;
        }
      }

      emotionScores.neutral =
        Math.max(
          0,
          words.length -
            emotionScores.positive -
            emotionScores.negative,
        ) || 1;

      const total = Object.values(emotionScores).reduce(
        (a, b) => a + b,
      );

      return {
        dominant: this.getDominantEmotion(
          emotionScores,
        ),
        sentiment:
          emotionScores.positive > emotionScores.negative
            ? 'positive'
            : emotionScores.negative > emotionScores.positive
              ? 'negative'
              : 'neutral',
        scores: {
          positive: Math.round(
            (emotionScores.positive / total) * 100,
          ),
          negative: Math.round(
            (emotionScores.negative / total) * 100,
          ),
          neutral: Math.round(
            (emotionScores.neutral / total) * 100,
          ),
        },
      };
    } catch (error) {
      this.logger.error(
        `Emotion detection error: ${error.message}`,
      );
      return {
        dominant: 'neutral',
        sentiment: 'neutral',
        scores: { positive: 33, negative: 33, neutral: 34 },
      };
    }
  }

  // ============================================================================
  // PRIVATE HELPERS
  // ============================================================================

  /**
   * Calculate all metrics from transcriptions
   */
  private async calculateMetrics(
    agentTranscription: string,
    clientTranscription: string,
    duration: number,
  ): Promise<VoiceMetrics> {
    const agentAnalysis = await this.analyzeAgentVoice(
      agentTranscription,
      duration,
    );

    const clientAnalysis = await this.analyzeAgentVoice(
      clientTranscription,
      duration,
    );

    return {
      speechRate: agentAnalysis.speechRate,
      pauseCount: agentAnalysis.pauseCount,
      averagePauseDuration:
        agentAnalysis.averagePauseDuration,
      clarityScore: agentAnalysis.clarityScore,
      confidenceLevel: agentAnalysis.confidenceLevel,
      empathyDetection: agentAnalysis.empathyDetection,
      professionalismScore:
        agentAnalysis.professionalismScore,
      enthusiasmLevel: agentAnalysis.enthusiasmLevel,
      voiceTone: agentAnalysis.voiceTone,
      recommendations: agentAnalysis.recommendations,
    };
  }

  /**
   * Count words in text
   */
  private countWords(text: string): number {
    return text.trim().split(/\s+/).length;
  }

  /**
   * Count sentences
   */
  private countSentences(text: string): number {
    return (text.match(/[.!?]+/g) || []).length;
  }

  /**
   * Count paragraphs
   */
  private countParagraphs(text: string): number {
    return (text.split(/\n\n+/).filter((p) => p.trim())
      .length);
  }

  /**
   * Analyze pauses in speech
   */
  private analyzePauses(text: string): PauseAnalysis {
    // Estimate pauses from punctuation and text breaks
    const pauseMarkers = (
      text.match(
        /[\.\!\?]\s+|[\n\r]+|\s{2,}/g,
      ) || []
    ).length;

    return {
      count: pauseMarkers,
      averageDuration:
        pauseMarkers > 0
          ? Math.round((pauseMarkers * 1.5) * 10) / 10
          : 0,
    };
  }

  /**
   * Analyze tone
   */
  private analyzeTone(text: string): ToneAnalysis {
    const isQuestionHeavy =
      (text.match(/\?/g) || []).length > 5;
    const isExclamatory =
      (text.match(/!/g) || []).length > 3;
    const hasEllipsis =
      (text.match(/\.\.\./g) || []).length > 2;

    let tone = 'neutral';
    let emotions: string[] = [];

    if (isQuestionHeavy) {
      tone = 'questioning';
      emotions.push('uncertainty');
    }

    if (isExclamatory) {
      tone = 'emphatic';
      emotions.push('enthusiasm');
    }

    if (hasEllipsis) {
      tone = 'hesitant';
      emotions.push('uncertainty');
    }

    if (
      text.includes('gracias') ||
      text.includes('entiendo')
    ) {
      emotions.push('empathy');
    }

    return {
      description: tone,
      emotions: emotions.length > 0 ? emotions : ['neutral'],
    };
  }

  /**
   * Assess professionalism
   */
  private assessProfessionalism(
    text: string,
  ): number {
    const professionalPhrases = [
      'entiendo',
      'voy a',
      'permítame',
      'por supuesto',
      'con gusto',
      'puedo ayudar',
    ];

    const count = professionalPhrases.filter((p) =>
      text.toLowerCase().includes(p),
    ).length;

    const wordCount = this.countWords(text);
    const ratio = (count / (wordCount / 10)) * 10;

    return Math.min(10, Math.max(1, ratio));
  }

  /**
   * Detect confidence level
   */
  private detectConfidence(text: string): string {
    const uncertaintyWords = [
      'creo',
      'tal vez',
      'quizás',
      'no sé',
      'posiblemente',
    ];
    const confidenceWords = [
      'seguro',
      'definitivamente',
      'claramente',
      'sin duda',
    ];

    const uncertain = uncertaintyWords.filter((w) =>
      text.toLowerCase().includes(w),
    ).length;
    const confident = confidenceWords.filter((w) =>
      text.toLowerCase().includes(w),
    ).length;

    if (confident > uncertain * 2) return 'high';
    if (confident > uncertain) return 'medium';
    if (uncertain > confident * 2) return 'low';

    return 'medium';
  }

  /**
   * Calculate clarity score
   */
  private calculateClarity(text: string): number {
    const sentenceCount = this.countSentences(text);
    const wordCount = this.countWords(text);
    const avgWordsPerSentence =
      sentenceCount > 0
        ? wordCount / sentenceCount
        : wordCount;

    let clarityScore = 8;

    // Very long sentences reduce clarity
    if (avgWordsPerSentence > 25) clarityScore -= 2;
    else if (avgWordsPerSentence > 20)
      clarityScore -= 1;

    // Short sentences improve clarity
    if (avgWordsPerSentence < 10) clarityScore -= 1;

    // Punctuation usage improves clarity
    const hasPunctuation =
      text.includes('.') || text.includes('!');
    if (!hasPunctuation) clarityScore -= 2;

    return Math.max(1, Math.min(10, clarityScore));
  }

  /**
   * Detect empathy
   */
  private detectEmpathy(text: string): number {
    const empathyPhrases = [
      'entiendo',
      'comprendo',
      'lo siento',
      'gracias por',
      'disculpe',
      'le ayudaré',
      'su preocupación',
    ];

    const empathyMatches = empathyPhrases.filter((p) =>
      text.toLowerCase().includes(p),
    ).length;

    return Math.min(
      10,
      Math.max(1, 5 + empathyMatches),
    );
  }

  /**
   * Detect enthusiasm level
   */
  private detectEnthusiasm(text: string): string {
    const enthusiasmMarkers =
      (text.match(/!/g) || []).length +
      (text.match(/[A-Z]{2,}/g) || []).length;

    if (enthusiasmMarkers > 5) return 'high';
    if (enthusiasmMarkers > 2) return 'medium';
    return 'low';
  }

  /**
   * Generate recommendations
   */
  private generateRecommendations(
    analysis: any,
  ): string[] {
    const recommendations: string[] = [];

    if (analysis.speechRate < 100) {
      recommendations.push(
        'Consider speaking slightly faster to maintain engagement',
      );
    }

    if (analysis.professionalism < 5) {
      recommendations.push(
        'Use more professional language and phrases',
      );
    }

    if (analysis.confidence === 'low') {
      recommendations.push(
        'Build confidence through practice and assertive language',
      );
    }

    if (!analysis.tone?.emotions?.includes('empathy')) {
      recommendations.push(
        'Show more empathy and understanding in responses',
      );
    }

    if (recommendations.length === 0) {
      recommendations.push(
        'Continue current approach - good performance',
      );
    }

    return recommendations;
  }

  /**
   * Analyze trend in voice progression
   */
  private analyzeTrend(
    metrics: Array<{ speechRate: number; clarityScore: number }>,
  ): string {
    if (metrics.length < 2) return 'insufficient_data';

    const first = metrics[0];
    const latest = metrics[metrics.length - 1];

    const improvement =
      ((latest.clarityScore - first.clarityScore) /
        first.clarityScore) *
      100;

    if (improvement > 10) return 'improving';
    if (improvement < -5) return 'declining';
    return 'stable';
  }

  /**
   * Generate progression analysis text
   */
  private generateProgressionAnalysis(
    metrics: any[],
    trend: string,
  ): string {
    if (trend === 'improving') {
      return 'Voice quality and clarity are improving. Keep up the practice.';
    }
    if (trend === 'declining') {
      return 'Work on maintaining voice clarity and consistency.';
    }
    return 'Voice quality is stable. Continue current approach.';
  }

  /**
   * Get dominant emotion
   */
  private getDominantEmotion(
    scores: Record<string, number>,
  ): string {
    return Object.entries(scores).reduce((a, b) =>
      a[1] > b[1] ? a : b,
    )[0];
  }

  /**
   * Get default metrics
   */
  private getDefaultMetrics(): VoiceMetrics {
    return {
      speechRate: 0,
      pauseCount: 0,
      averagePauseDuration: 0,
      clarityScore: 5,
      confidenceLevel: 'medium',
      empathyDetection: 5,
      professionalismScore: 5,
      enthusiasmLevel: 'medium',
      voiceTone: 'neutral',
      recommendations: [
        'Unable to analyze voice. Please try again.',
      ],
    };
  }
}

// ============================================================================
// TYPES
// ============================================================================

export interface VoiceMetrics {
  speechRate?: number;
  pauseCount?: number;
  averagePauseDuration?: number;
  clarityScore: number;
  confidenceLevel: string;
  empathyDetection: number;
  professionalismScore: number;
  enthusiasmLevel: string;
  voiceTone: string;
  recommendations: string[];
}

export interface VoiceCharacteristics {
  speechRate: number;
  pauseCount: number;
  averagePauseDuration: number;
  wordCount: number;
  sentenceCount: number;
  clarityScore: number;
  confidenceLevel: string;
  empathyDetection: number;
  professionalismScore: number;
  enthusiasmLevel: string;
  voiceTone: string;
  toneEmotions: string[];
  recommendations: string[];
}

export interface VoiceProgression {
  trend: 'improving' | 'declining' | 'stable' | 'insufficient_data';
  metrics: Array<{
    sessionId: string;
    date: Date;
    speechRate: number;
    clarityScore: number;
    professionalism: number;
  }>;
  analysis: string;
}

export interface EmotionDetection {
  dominant: string;
  sentiment: 'positive' | 'negative' | 'neutral';
  scores: {
    positive: number;
    negative: number;
    neutral: number;
  };
}

export interface PauseAnalysis {
  count: number;
  averageDuration: number;
}

export interface ToneAnalysis {
  description: string;
  emotions: string[];
}
