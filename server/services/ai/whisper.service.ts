import {
  Injectable,
  Logger,
  BadRequestException,
  InternalServerErrorException,
} from '@nestjs/common';
import OpenAI from 'openai';
import * as fs from 'fs';
import * as path from 'path';

/**
 * Whisper Service
 *
 * Speech-to-Text (STT) integration with OpenAI Whisper API
 *
 * Features:
 * - Multi-language support (including Paraguay Spanish)
 * - Automatic language detection
 * - Confidence scoring
 * - Timestamp extraction
 * - Prompt context for better accuracy
 * - Automatic file cleanup
 *
 * Target latency: <300ms for typical audio chunks
 */
@Injectable()
export class WhisperService {
  private readonly logger = new Logger(WhisperService.name);
  private client: OpenAI;
  private tmpDir = path.join(process.cwd(), 'tmp', 'audio');

  constructor() {
    this.client = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
    });

    // Ensure temp directory exists
    if (!fs.existsSync(this.tmpDir)) {
      fs.mkdirSync(this.tmpDir, { recursive: true });
    }
  }

  /**
   * Transcribe audio buffer
   *
   * Converts audio bytes to text with language support
   *
   * @param audioBuffer Raw audio data (WebRTC, WAV, MP3, etc)
   * @param language Language hint (e.g., 'es-PY' for Paraguay Spanish)
   * @param prompt Context prompt for better accuracy
   * @returns Transcription result with confidence
   */
  async transcribe(
    audioBuffer: Buffer,
    language: string = 'es',
    prompt?: string,
  ): Promise<TranscriptionResult> {
    const startTime = Date.now();

    // Validate audio buffer
    if (!audioBuffer || audioBuffer.length === 0) {
      throw new BadRequestException('Audio buffer is empty');
    }

    if (audioBuffer.length > 25 * 1024 * 1024) {
      throw new BadRequestException(
        'Audio file exceeds 25MB limit',
      );
    }

    const tempFile = await this.saveAudioToFile(audioBuffer);

    try {
      this.logger.debug(
        `Transcribing ${audioBuffer.length} bytes (${language})`,
      );

      // Build context prompt for better accuracy
      const contextPrompt =
        prompt ||
        this.buildContextPrompt(language);

      const transcription = await this.client.audio.transcriptions.create({
        file: fs.createReadStream(tempFile),
        model: 'whisper-1',
        language: this.normalizeLanguage(language),
        prompt: contextPrompt,
        response_format: 'verbose_json', // Get confidence scores
        temperature: 0.2, // Lower temp for more consistent results
      });

      const latency = Date.now() - startTime;

      if (latency > 3000) {
        this.logger.warn(
          `Slow transcription: ${latency}ms for ${audioBuffer.length} bytes`,
        );
      }

      return {
        text: transcription.text,
        language: transcription.language,
        confidence:
          this.estimateConfidence(transcription),
        duration: transcription.duration,
        latency,
        raw: transcription,
      };
    } catch (error) {
      this.logger.error(
        `Whisper transcription error: ${error.message}`,
      );

      if (
        error.message.includes('400') ||
        error.message.includes('Bad Request')
      ) {
        throw new BadRequestException(
          'Invalid audio format or corrupted audio file',
        );
      }

      throw new InternalServerErrorException(
        'Failed to transcribe audio',
      );
    } finally {
      // Cleanup temp file
      await this.cleanupFile(tempFile);
    }
  }

  /**
   * Transcribe audio file from URL
   *
   * Useful for S3 presigned URLs or external sources
   *
   * @param audioUrl URL to audio file
   * @param language Language hint
   * @returns Transcription result
   */
  async transcribeFromUrl(
    audioUrl: string,
    language: string = 'es',
  ): Promise<TranscriptionResult> {
    try {
      this.logger.debug(`Transcribing from URL: ${audioUrl}`);

      // Download audio file
      const response = await fetch(audioUrl);
      if (!response.ok) {
        throw new Error(`Failed to fetch audio: ${response.status}`);
      }

      const audioBuffer = Buffer.from(
        await response.arrayBuffer(),
      );

      return this.transcribe(audioBuffer, language);
    } catch (error) {
      this.logger.error(
        `Transcription from URL error: ${error.message}`,
      );
      throw new InternalServerErrorException(
        'Failed to transcribe audio from URL',
      );
    }
  }

  /**
   * Batch transcribe multiple audio files
   *
   * Process multiple audio chunks in parallel
   * Useful for session review with full transcript
   *
   * @param audioBuffers Array of audio buffers
   * @param language Language for transcription
   * @returns Array of transcription results
   */
  async transcribeBatch(
    audioBuffers: Buffer[],
    language: string = 'es',
  ): Promise<TranscriptionResult[]> {
    this.logger.debug(
      `Batch transcribing ${audioBuffers.length} files`,
    );

    try {
      // Process in parallel with limit to avoid rate limiting
      const batchSize = 5; // OpenAI rate limits
      const results: TranscriptionResult[] = [];

      for (let i = 0; i < audioBuffers.length; i += batchSize) {
        const batch = audioBuffers.slice(
          i,
          i + batchSize,
        );
        const batchResults = await Promise.all(
          batch.map((buffer) =>
            this.transcribe(buffer, language),
          ),
        );
        results.push(...batchResults);
      }

      return results;
    } catch (error) {
      this.logger.error(
        `Batch transcription error: ${error.message}`,
      );
      throw new InternalServerErrorException(
        'Batch transcription failed',
      );
    }
  }

  /**
   * Detect language of audio
   *
   * Automatic language identification
   * Useful when language is unknown
   *
   * @param audioBuffer Audio data
   * @returns Detected language code and confidence
   */
  async detectLanguage(
    audioBuffer: Buffer,
  ): Promise<LanguageDetection> {
    const tempFile = await this.saveAudioToFile(audioBuffer);

    try {
      const transcription = await this.client.audio.transcriptions.create({
        file: fs.createReadStream(tempFile),
        model: 'whisper-1',
        response_format: 'verbose_json',
      });

      return {
        language: transcription.language,
        confidence: 0.85, // Whisper doesn't provide explicit confidence
        alternatives: [
          {
            language: 'es',
            code: 'spa',
            name: 'Spanish',
          },
          {
            language: 'pt',
            code: 'por',
            name: 'Portuguese',
          },
        ],
      };
    } catch (error) {
      this.logger.error(
        `Language detection error: ${error.message}`,
      );
      throw new InternalServerErrorException(
        'Language detection failed',
      );
    } finally {
      await this.cleanupFile(tempFile);
    }
  }

  /**
   * Get quality metrics for transcription
   *
   * Analyzes transcription quality:
   * - Confidence scores
   * - Potential errors
   * - Clarity assessment
   *
   * @param text Transcribed text
   * @param confidence Raw confidence
   * @returns Quality metrics
   */
  analyzeQuality(
    text: string,
    confidence?: number,
  ): TranscriptionQuality {
    const wordCount = text.split(/\s+/).length;
    const hasNumbers = /\d/.test(text);
    const hasPunctuation = /[.!?]/.test(text);
    const isCapitalized =
      text[0] === text[0].toUpperCase();

    return {
      isClean: wordCount > 2 && hasPunctuation,
      confidence: confidence || 0.85,
      wordCount,
      quality:
        confidence && confidence > 0.9
          ? 'excellent'
          : confidence && confidence > 0.75
            ? 'good'
            : confidence && confidence > 0.6
              ? 'acceptable'
              : 'poor',
      likelyErrors: this.detectPotentialErrors(text),
    };
  }

  // ============================================================================
  // PRIVATE HELPERS
  // ============================================================================

  /**
   * Save audio buffer to temporary file
   */
  private async saveAudioToFile(
    buffer: Buffer,
  ): Promise<string> {
    const filename = `audio_${Date.now()}_${Math.random().toString(36).substring(7)}.wav`;
    const filepath = path.join(this.tmpDir, filename);

    return new Promise((resolve, reject) => {
      fs.writeFile(filepath, buffer, (err) => {
        if (err) reject(err);
        else resolve(filepath);
      });
    });
  }

  /**
   * Clean up temporary file
   */
  private async cleanupFile(filepath: string): Promise<void> {
    try {
      if (fs.existsSync(filepath)) {
        fs.unlinkSync(filepath);
      }
    } catch (error) {
      this.logger.warn(`Failed to cleanup ${filepath}: ${error.message}`);
    }
  }

  /**
   * Normalize language code for Whisper API
   *
   * Converts formats like 'es-PY' to 'es'
   */
  private normalizeLanguage(language: string): string {
    if (!language) return 'en';

    // Extract main language code (before dash)
    const mainCode = language.split('-')[0].toLowerCase();

    // Map of valid Whisper language codes
    const validCodes: Record<string, string> = {
      es: 'es', // Spanish
      pt: 'pt', // Portuguese
      en: 'en', // English
      fr: 'fr', // French
      de: 'de', // German
      it: 'it', // Italian
      ja: 'ja', // Japanese
      ko: 'ko', // Korean
      zh: 'zh', // Chinese
      ru: 'ru', // Russian
      ar: 'ar', // Arabic
    };

    return validCodes[mainCode] || 'en';
  }

  /**
   * Build context prompt for better accuracy
   *
   * Context helps Whisper understand domain-specific terms
   */
  private buildContextPrompt(language: string): string {
    if (language.startsWith('es')) {
      // Spanish context (Paraguay)
      return `Context: This is a customer service training conversation in Paraguay.
      Common terms: cliente, factura, servicio, pago, problema, solucionar, ayuda, información.
      Guaraní phrases may appear: che, niko, pytyvõ, hẽ.
      Focus on accurate transcription of customer complaints and agent responses.`;
    }

    if (language.startsWith('pt')) {
      // Portuguese context
      return `Context: This is a customer service training conversation in Portuguese.
      Common terms: cliente, fatura, serviço, pagamento, problema, resolver, ajuda, informação.`;
    }

    return 'Context: This is a customer service training conversation.';
  }

  /**
   * Estimate confidence from transcription result
   */
  private estimateConfidence(
    transcription: any,
  ): number {
    // Whisper doesn't provide confidence scores directly
    // Estimate based on text quality
    const text = transcription.text || '';

    if (text.length < 5) return 0.5; // Very short text = low confidence
    if (text.length > 500) return 0.95; // Longer text = higher confidence
    if (/[0-9]/.test(text)) return 0.92; // Numbers = good confidence
    if (/[.,!?]/.test(text)) return 0.88; // Punctuation = good confidence

    return 0.85; // Default
  }

  /**
   * Detect potential transcription errors
   */
  private detectPotentialErrors(text: string): string[] {
    const errors: string[] = [];

    // Check for garbled text
    if (/[^a-záéíóúñüàäöß\s0-9.,!?;:—\-()]/gi.test(text)) {
      errors.push('Contains unusual characters');
    }

    // Check for repeated characters (speech stuttering)
    if (/(.)\1{3,}/.test(text)) {
      errors.push('Contains repeated characters');
    }

    // Check for ALL CAPS (usually indicates emphasis, possible error)
    if (text.toUpperCase() === text && text.length > 10) {
      errors.push('All caps text may indicate emphasis or error');
    }

    return errors;
  }
}

// ============================================================================
// TYPES
// ============================================================================

export interface TranscriptionResult {
  text: string;
  language?: string;
  confidence: number;
  duration?: number;
  latency: number;
  raw?: any;
}

export interface TranscriptionQuality {
  isClean: boolean;
  confidence: number;
  wordCount: number;
  quality: 'excellent' | 'good' | 'acceptable' | 'poor';
  likelyErrors: string[];
}

export interface LanguageDetection {
  language: string;
  confidence: number;
  alternatives: Array<{
    language: string;
    code: string;
    name: string;
  }>;
}
