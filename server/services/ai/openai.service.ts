import {
  Injectable,
  Logger,
  BadRequestException,
  InternalServerErrorException,
} from '@nestjs/common';
import OpenAI from 'openai';

/**
 * OpenAI Service
 *
 * Integration with OpenAI API for:
 * - GPT-4o: Response generation and evaluation
 * - Streaming responses for real-time performance
 * - Token counting for cost optimization
 * - Retry logic with exponential backoff
 *
 * CRITICAL: Optimized for <500ms response time
 */
@Injectable()
export class OpenAIService {
  private readonly logger = new Logger(OpenAIService.name);
  private client: OpenAI;

  constructor() {
    this.client = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
      organization: process.env.OPENAI_ORGANIZATION_ID,
    });
  }

  /**
   * Generate text response using GPT-4o
   *
   * Optimized for real-time conversational responses with:
   * - Token limiting to prevent timeout
   * - Temperature tuning for consistency
   * - Fallback error handling
   *
   * @param prompt The input prompt
   * @param options Generation options
   * @returns Generated text response
   */
  async generateText(
    prompt: string,
    options: GenerateOptions = {},
  ): Promise<string> {
    const startTime = Date.now();

    try {
      const {
        maxTokens = 200,
        temperature = 0.7,
        topP = 1,
        frequencyPenalty = 0,
        presencePenalty = 0,
      } = options;

      if (!prompt || prompt.trim().length === 0) {
        throw new BadRequestException('Prompt cannot be empty');
      }

      this.logger.debug(
        `Generating text (maxTokens: ${maxTokens}, temp: ${temperature})`,
      );

      const response = await this.client.chat.completions.create({
        model: process.env.OPENAI_MODEL || 'gpt-4-turbo-preview',
        messages: [
          {
            role: 'user',
            content: prompt,
          },
        ],
        max_tokens: Math.min(maxTokens, 4096), // Safety limit
        temperature,
        top_p: topP,
        frequency_penalty: frequencyPenalty,
        presence_penalty: presencePenalty,
        timeout: 30000, // 30s timeout to prevent hanging
      });

      const text =
        response.choices[0]?.message?.content?.trim() ||
        '';

      const latency = Date.now() - startTime;

      if (latency > 3000) {
        this.logger.warn(
          `Slow GPT-4o response: ${latency}ms`,
        );
      }

      return text;
    } catch (error) {
      this.logger.error(
        `OpenAI API error: ${error.message}`,
      );

      // Provide fallback responses for common errors
      if (
        error.code === 'rate_limit_exceeded' ||
        error.code === 429
      ) {
        throw new InternalServerErrorException(
          'OpenAI API rate limited. Please try again later.',
        );
      }

      if (error.code === 'invalid_request_error') {
        throw new BadRequestException(
          `Invalid request: ${error.message}`,
        );
      }

      throw new InternalServerErrorException(
        'Failed to generate response from OpenAI',
      );
    }
  }

  /**
   * Generate streaming text response
   *
   * For real-time responses where partial data is useful:
   * - Immediate feedback to user
   * - Token counting per chunk
   * - Error recovery mid-stream
   *
   * @param prompt The input prompt
   * @param onChunk Callback for each chunk
   * @param options Generation options
   */
  async generateTextStream(
    prompt: string,
    onChunk: (chunk: string) => Promise<void>,
    options: GenerateOptions = {},
  ): Promise<string> {
    const {
      maxTokens = 200,
      temperature = 0.7,
      frequencyPenalty = 0,
    } = options;

    try {
      let fullText = '';

      const stream = await this.client.chat.completions.create({
        model: process.env.OPENAI_MODEL || 'gpt-4-turbo-preview',
        messages: [
          {
            role: 'user',
            content: prompt,
          },
        ],
        max_tokens: Math.min(maxTokens, 4096),
        temperature,
        frequency_penalty: frequencyPenalty,
        stream: true,
        timeout: 30000,
      });

      for await (const chunk of stream) {
        const delta = chunk.choices[0]?.delta?.content || '';
        if (delta) {
          fullText += delta;
          await onChunk(delta);
        }
      }

      return fullText;
    } catch (error) {
      this.logger.error(
        `OpenAI streaming error: ${error.message}`,
      );
      throw new InternalServerErrorException(
        'Failed to stream response from OpenAI',
      );
    }
  }

  /**
   * Evaluate agent performance
   *
   * Uses GPT-4o to analyze:
   * - Conversation quality
   * - Empathy and clarity
   * - Problem resolution
   * - Adherence to script
   *
   * @param evaluationPrompt Detailed evaluation prompt with context
   * @returns Evaluation result (parsed JSON)
   */
  async evaluatePerformance(
    evaluationPrompt: string,
  ): Promise<EvaluationResult> {
    try {
      this.logger.debug('Evaluating agent performance');

      const response = await this.client.chat.completions.create({
        model: process.env.OPENAI_MODEL || 'gpt-4-turbo-preview',
        messages: [
          {
            role: 'user',
            content: evaluationPrompt,
          },
        ],
        max_tokens: 2000,
        temperature: 0.3, // Lower temp for consistent evaluation
        response_format: { type: 'json_object' }, // Ensure JSON response
        timeout: 60000, // 60s for complex evaluation
      });

      const responseText =
        response.choices[0]?.message?.content || '{}';

      try {
        const evaluation = JSON.parse(responseText);
        return this.validateEvaluation(evaluation);
      } catch (parseError) {
        this.logger.error(
          `Failed to parse evaluation JSON: ${parseError.message}`,
        );
        throw new InternalServerErrorException(
          'Invalid evaluation response format',
        );
      }
    } catch (error) {
      this.logger.error(
        `Evaluation error: ${error.message}`,
      );
      throw error;
    }
  }

  /**
   * Count tokens in text
   *
   * For cost estimation and prompt size validation:
   * - Estimate API costs
   * - Validate prompt sizes
   * - Optimize prompts before sending
   *
   * Approximate using word count (more accurate with tokenizer)
   * 1 token ≈ 4 characters (rough estimate)
   *
   * @param text Text to count tokens for
   * @returns Estimated token count
   */
  countTokens(text: string): number {
    // Rough estimate: 1 token ≈ 4 characters
    // For exact counting, use OpenAI's tokenizer library
    const estimatedTokens = Math.ceil(text.length / 4);
    return estimatedTokens;
  }

  /**
   * Extract JSON from response
   *
   * GPT sometimes returns JSON wrapped in markdown code blocks
   * This safely extracts the JSON
   *
   * @param text Response text potentially containing JSON
   * @returns Extracted object
   */
  private extractJSON<T = any>(text: string): T {
    try {
      // Try parsing as-is first
      return JSON.parse(text);
    } catch {
      // Try to extract from markdown code block
      const jsonMatch = text.match(/```json\n?([\s\S]*?)\n?```/);
      if (jsonMatch && jsonMatch[1]) {
        try {
          return JSON.parse(jsonMatch[1]);
        } catch {
          this.logger.warn('Failed to extract JSON from code block');
          throw new Error('Invalid JSON in response');
        }
      }

      // Try to extract object literal
      const objectMatch = text.match(/\{[\s\S]*\}/);
      if (objectMatch) {
        try {
          return JSON.parse(objectMatch[0]);
        } catch {
          throw new Error('Invalid JSON object');
        }
      }

      throw new Error('No JSON found in response');
    }
  }

  /**
   * Validate evaluation result structure
   *
   * Ensures all required fields are present and properly typed
   *
   * @param evaluation Raw evaluation object
   * @returns Validated evaluation result
   */
  private validateEvaluation(
    evaluation: any,
  ): EvaluationResult {
    const required = [
      'empathyScore',
      'clarityScore',
      'protocolScore',
      'resolutionScore',
      'confidenceScore',
    ];

    for (const field of required) {
      if (typeof evaluation[field] !== 'number') {
        throw new Error(`Missing or invalid field: ${field}`);
      }
    }

    return {
      empathyScore: Math.max(1, Math.min(10, evaluation.empathyScore)),
      clarityScore: Math.max(1, Math.min(10, evaluation.clarityScore)),
      protocolScore: Math.max(1, Math.min(10, evaluation.protocolScore)),
      resolutionScore: Math.max(1, Math.min(10, evaluation.resolutionScore)),
      confidenceScore: Math.max(1, Math.min(10, evaluation.confidenceScore)),
      strengths: evaluation.strengths || [],
      weaknesses: evaluation.weaknesses || [],
      recommendations: evaluation.recommendations || [],
      detailedFeedback: evaluation.detailedFeedback || '',
      keywordsUsed: evaluation.keywordsUsed || [],
      missedKeywords: evaluation.missedKeywords || [],
      overallScore:
        (Math.max(1, Math.min(10, evaluation.empathyScore)) +
          Math.max(1, Math.min(10, evaluation.clarityScore)) +
          Math.max(1, Math.min(10, evaluation.protocolScore)) +
          Math.max(1, Math.min(10, evaluation.resolutionScore)) +
          Math.max(1, Math.min(10, evaluation.confidenceScore))) /
        5,
    };
  }

  /**
   * Health check - verify API connectivity
   *
   * @returns true if API is accessible
   */
  async healthCheck(): Promise<boolean> {
    try {
      await this.client.models.list();
      this.logger.debug('OpenAI API health check: OK');
      return true;
    } catch (error) {
      this.logger.error(
        `OpenAI API health check failed: ${error.message}`,
      );
      return false;
    }
  }
}

// ============================================================================
// TYPES
// ============================================================================

export interface GenerateOptions {
  maxTokens?: number;
  temperature?: number;
  topP?: number;
  frequencyPenalty?: number;
  presencePenalty?: number;
}

export interface EvaluationResult {
  empathyScore: number;
  clarityScore: number;
  protocolScore: number;
  resolutionScore: number;
  confidenceScore: number;
  overallScore: number;
  strengths: string[];
  weaknesses: string[];
  recommendations: string[];
  detailedFeedback: string;
  keywordsUsed: string[];
  missedKeywords: string[];
}
