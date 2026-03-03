import {
  Injectable,
  Logger,
  InternalServerErrorException,
} from '@nestjs/common';
import { OpenAIService } from './openai.service';
import {
  TrainingSession,
  Scenario,
  User,
} from '@prisma/client';

/**
 * Evaluation Service
 *
 * Comprehensive performance evaluation engine for training sessions
 *
 * Features:
 * - Multi-dimensional scoring (5 dimensions)
 * - Prompt-based GPT-4o evaluation
 * - Feedback generation
 * - Keyword tracking
 * - Contextual analysis
 * - Score normalization and validation
 *
 * Scoring Dimensions:
 * 1. Empathy (1-10) - Understanding and emotional connection
 * 2. Clarity (1-10) - Communication clarity and professionalism
 * 3. Protocol (1-10) - Adherence to procedures and script
 * 4. Resolution (1-10) - Problem-solving effectiveness
 * 5. Confidence (1-10) - Inspiring trust and confidence
 */
@Injectable()
export class EvaluationService {
  private readonly logger = new Logger(EvaluationService.name);

  constructor(private openai: OpenAIService) {}

  /**
   * Evaluate complete training session
   *
   * Performs comprehensive evaluation of agent performance
   * using GPT-4o analysis and multi-dimensional scoring
   *
   * @param session The training session
   * @param clientProfile AI client personality profile
   * @param conversation Complete conversation history
   * @returns Comprehensive evaluation result
   */
  async evaluateSession(
    session: TrainingSession,
    clientProfile: any,
    conversation: string,
  ): Promise<EvaluationResult> {
    try {
      this.logger.log(
        `Evaluating session ${session.id}`,
      );

      // Build evaluation prompt
      const evaluationPrompt = this.buildEvaluationPrompt(
        session,
        clientProfile,
        conversation,
      );

      // Get GPT-4o evaluation
      const evaluation =
        await this.openai.evaluatePerformance(
          evaluationPrompt,
        );

      // Calculate overall score
      const overallScore = this.calculateOverallScore(
        evaluation,
      );

      // Validate and normalize scores
      const validatedEvaluation = this.validateScores(
        evaluation,
        overallScore,
      );

      this.logger.log(
        `Session ${session.id} evaluated: ${validatedEvaluation.overallScore.toFixed(2)}/10`,
      );

      return validatedEvaluation;
    } catch (error) {
      this.logger.error(
        `Session evaluation error: ${error.message}`,
      );
      // Return default evaluation on error
      return this.getDefaultEvaluation();
    }
  }

  /**
   * Evaluate specific competency
   *
   * Focus evaluation on one specific competency area
   *
   * @param competency Which aspect to evaluate (empathy, clarity, etc)
   * @param conversation Conversation text
   * @returns Competency-specific score and feedback
   */
  async evaluateCompetency(
    competency: 'empathy' | 'clarity' | 'protocol' | 'resolution' | 'confidence',
    conversation: string,
  ): Promise<CompetencyEvaluation> {
    try {
      const prompt = `
      Analyze the following customer service conversation for ${competency}.

      Conversation:
      ${conversation}

      Provide a JSON evaluation with:
      {
        "score": <1-10 number>,
        "evidence": "<specific examples from conversation>",
        "strengths": [<list of what was done well>],
        "improvements": [<specific areas to improve>],
        "reasoning": "<detailed explanation>"
      }
      `;

      const result = await this.openai.generateText(
        prompt,
        { maxTokens: 500, temperature: 0.3 },
      );

      // Parse result
      try {
        const parsed = JSON.parse(result);
        return {
          competency,
          score: Math.max(1, Math.min(10, parsed.score)),
          evidence: parsed.evidence,
          strengths: parsed.strengths || [],
          improvements: parsed.improvements || [],
          reasoning: parsed.reasoning,
        };
      } catch {
        // Fallback if JSON parsing fails
        return {
          competency,
          score: 5,
          evidence: result,
          strengths: [],
          improvements: [],
          reasoning:
            'Evaluation could not be fully parsed',
        };
      }
    } catch (error) {
      this.logger.error(
        `Competency evaluation error: ${error.message}`,
      );
      throw new InternalServerErrorException(
        'Competency evaluation failed',
      );
    }
  }

  /**
   * Generate personalized feedback
   *
   * Creates actionable feedback based on evaluation scores
   *
   * @param evaluation Completed evaluation
   * @param agentName Agent's name
   * @returns Personalized feedback text
   */
  async generateFeedback(
    evaluation: EvaluationResult,
    agentName: string,
  ): Promise<string> {
    try {
      const scores = {
        empathy: evaluation.empathyScore,
        clarity: evaluation.clarityScore,
        protocol: evaluation.protocolScore,
        resolution: evaluation.resolutionScore,
        confidence: evaluation.confidenceScore,
      };

      const lowestArea = Object.entries(scores).reduce(
        (a, b) => (a[1] < b[1] ? a : b),
      )[0];

      const highestArea = Object.entries(scores).reduce(
        (a, b) => (a[1] > b[1] ? a : b),
      )[0];

      const feedbackPrompt = `
      Generate personalized, encouraging feedback for ${agentName} based on this evaluation:

      Overall Score: ${evaluation.overallScore.toFixed(2)}/10
      Empathy: ${evaluation.empathyScore}/10
      Clarity: ${evaluation.clarityScore}/10
      Protocol: ${evaluation.protocolScore}/10
      Resolution: ${evaluation.resolutionScore}/10
      Confidence: ${evaluation.confidenceScore}/10

      Strengths: ${evaluation.strengths.join(', ')}
      Areas to improve: ${evaluation.weaknesses.join(', ')}
      Recommendations: ${evaluation.recommendations.join(', ')}

      Highest performing area: ${highestArea}
      Area needing most improvement: ${lowestArea}

      Create encouraging feedback that acknowledges successes, identifies clear improvement areas,
      and provides specific next steps. The tone should be constructive and motivating.
      `;

      const feedback = await this.openai.generateText(
        feedbackPrompt,
        { maxTokens: 800, temperature: 0.7 },
      );

      return feedback;
    } catch (error) {
      this.logger.error(
        `Feedback generation error: ${error.message}`,
      );
      return (
        'Unable to generate personalized feedback. Please contact your supervisor.'
      );
    }
  }

  /**
   * Score specific behaviors
   *
   * Evaluate the presence/quality of specific behaviors
   *
   * @param behaviors List of behaviors to check for
   * @param conversation Conversation text
   * @returns Behavior scores
   */
  async scoreBehaviors(
    behaviors: string[],
    conversation: string,
  ): Promise<BehaviorScore[]> {
    try {
      const prompt = `
      Analyze the following conversation for specific agent behaviors.

      Conversation:
      ${conversation}

      Rate these behaviors on a scale of 1-10:
      ${behaviors.map((b, i) => `${i + 1}. ${b}`).join('\n')}

      Return JSON:
      {
        "scores": [
          {"behavior": "<behavior name>", "score": <1-10>, "evidence": "<quote or example>"}
        ]
      }
      `;

      const result = await this.openai.generateText(
        prompt,
        { maxTokens: 600, temperature: 0.3 },
      );

      try {
        const parsed = JSON.parse(result);
        return parsed.scores.map((s: any) => ({
          behavior: s.behavior,
          score: Math.max(1, Math.min(10, s.score)),
          evidence: s.evidence,
        }));
      } catch {
        return behaviors.map((b) => ({
          behavior: b,
          score: 5,
          evidence: 'Unable to evaluate',
        }));
      }
    } catch (error) {
      this.logger.error(
        `Behavior scoring error: ${error.message}`,
      );
      throw new InternalServerErrorException(
        'Behavior scoring failed',
      );
    }
  }

  /**
   * Compare performance across sessions
   *
   * Analyze agent's progression across multiple sessions
   *
   * @param evaluations Array of evaluations to compare
   * @returns Progression analysis
   */
  analyzeProgression(
    evaluations: EvaluationResult[],
  ): ProgressionAnalysis {
    if (evaluations.length < 2) {
      return {
        trend: 'insufficient_data',
        overallProgress: 0,
        dimensionTrends: {},
        improvement: 'Need at least 2 sessions for comparison',
      };
    }

    const first = evaluations[0];
    const latest = evaluations[evaluations.length - 1];

    const dimensions = [
      'empathy',
      'clarity',
      'protocol',
      'resolution',
      'confidence',
    ];

    const dimensionTrends: Record<
      string,
      { start: number; current: number; change: number }
    > = {};

    for (const dim of dimensions) {
      const key = `${dim}Score` as keyof EvaluationResult;
      const startScore =
        (first[key] as number) || 0;
      const currentScore =
        (latest[key] as number) || 0;
      dimensionTrends[dim] = {
        start: startScore,
        current: currentScore,
        change: currentScore - startScore,
      };
    }

    const overallProgress =
      ((latest.overallScore - first.overallScore) /
        first.overallScore) *
      100;

    const trend =
      overallProgress > 10
        ? 'strong_improvement'
        : overallProgress > 0
          ? 'slight_improvement'
          : overallProgress < -10
            ? 'regression'
            : 'stable';

    return {
      trend,
      overallProgress: Math.round(overallProgress),
      dimensionTrends,
      improvement: this.generateProgressionMessage(
        overallProgress,
        dimensionTrends,
      ),
    };
  }

  /**
   * Benchmark against performance levels
   *
   * Compare performance against defined levels
   *
   * @param score Overall score
   * @returns Performance level and description
   */
  benchmarkScore(score: number): PerformanceLevel {
    if (score >= 9) {
      return {
        level: 'expert',
        label: 'Expert Level',
        description:
          'Exceptional performance. Ready for quality assurance role.',
        xpMultiplier: 1.5,
      };
    }

    if (score >= 8) {
      return {
        level: 'advanced',
        label: 'Advanced',
        description:
          'Strong performance with room for minor refinements.',
        xpMultiplier: 1.25,
      };
    }

    if (score >= 7) {
      return {
        level: 'proficient',
        label: 'Proficient',
        description:
          'Good performance meeting standards.',
        xpMultiplier: 1.0,
      };
    }

    if (score >= 6) {
      return {
        level: 'acceptable',
        label: 'Acceptable',
        description:
          'Meeting basic standards. Focus on improvement areas.',
        xpMultiplier: 0.75,
      };
    }

    return {
      level: 'developing',
      label: 'Developing',
      description:
        'Needs improvement. Focus on training priorities.',
      xpMultiplier: 0.5,
    };
  }

  // ============================================================================
  // PRIVATE HELPERS
  // ============================================================================

  /**
   * Build evaluation prompt for GPT-4o
   */
  private buildEvaluationPrompt(
    session: TrainingSession,
    clientProfile: any,
    conversation: string,
  ): string {
    return `
    Evaluate the following customer service training session.

    CLIENT PROFILE:
    - Name: ${clientProfile.name}
    - Personality: ${clientProfile.personality}
    - Context: ${clientProfile.context}
    - Tone: ${clientProfile.tone}

    CONVERSATION:
    ${conversation}

    Provide a comprehensive evaluation in JSON format with these scores (1-10 scale):

    {
      "empathyScore": <1-10>,
      "clarityScore": <1-10>,
      "protocolScore": <1-10>,
      "resolutionScore": <1-10>,
      "confidenceScore": <1-10>,
      "strengths": [<list of key strengths>],
      "weaknesses": [<list of areas for improvement>],
      "recommendations": [<specific actionable recommendations>],
      "detailedFeedback": "<comprehensive feedback paragraph>",
      "keywordsUsed": [<list of effective keywords/phrases used>],
      "missedKeywords": [<list of important keywords not used>]
    }

    Guidelines:
    - Empathy: Did the agent show understanding and emotional connection?
    - Clarity: Were responses clear, professional, and well-structured?
    - Protocol: Did the agent follow company procedures and script?
    - Resolution: Did the agent effectively solve the customer's problem?
    - Confidence: Did the agent inspire trust and confidence in the customer?

    Be fair but objective. Acknowledge both strengths and areas for improvement.
    `;
  }

  /**
   * Calculate overall score as weighted average
   */
  private calculateOverallScore(
    evaluation: any,
  ): number {
    const scores = [
      evaluation.empathyScore,
      evaluation.clarityScore,
      evaluation.protocolScore,
      evaluation.resolutionScore,
      evaluation.confidenceScore,
    ].filter((s) => typeof s === 'number');

    if (scores.length === 0) return 5;

    const sum = scores.reduce((a, b) => a + b, 0);
    return sum / scores.length;
  }

  /**
   * Validate and normalize scores
   */
  private validateScores(
    evaluation: any,
    overallScore: number,
  ): EvaluationResult {
    return {
      empathyScore: this.normalizeScore(
        evaluation.empathyScore,
      ),
      clarityScore: this.normalizeScore(
        evaluation.clarityScore,
      ),
      protocolScore: this.normalizeScore(
        evaluation.protocolScore,
      ),
      resolutionScore: this.normalizeScore(
        evaluation.resolutionScore,
      ),
      confidenceScore: this.normalizeScore(
        evaluation.confidenceScore,
      ),
      overallScore: this.normalizeScore(overallScore),
      strengths: evaluation.strengths || [],
      weaknesses: evaluation.weaknesses || [],
      recommendations: evaluation.recommendations || [],
      detailedFeedback: evaluation.detailedFeedback || '',
      keywordsUsed: evaluation.keywordsUsed || [],
      missedKeywords: evaluation.missedKeywords || [],
    };
  }

  /**
   * Normalize score to 1-10 range
   */
  private normalizeScore(score: any): number {
    const num = typeof score === 'number' ? score : 5;
    return Math.max(1, Math.min(10, Math.round(num * 10) / 10));
  }

  /**
   * Get default evaluation on error
   */
  private getDefaultEvaluation(): EvaluationResult {
    return {
      empathyScore: 5,
      clarityScore: 5,
      protocolScore: 5,
      resolutionScore: 5,
      confidenceScore: 5,
      overallScore: 5,
      strengths: ['Unable to evaluate'],
      weaknesses: ['Evaluation system unavailable'],
      recommendations: [
        'Please contact support to retry evaluation',
      ],
      detailedFeedback:
        'Evaluation could not be completed. Please try again later.',
      keywordsUsed: [],
      missedKeywords: [],
    };
  }

  /**
   * Generate progression message
   */
  private generateProgressionMessage(
    progress: number,
    trends: Record<
      string,
      { start: number; current: number; change: number }
    >,
  ): string {
    if (progress > 20) {
      return 'Excellent progress! Keep up the great work.';
    }

    if (progress > 5) {
      return 'Good improvement shown. Continue focusing on weak areas.';
    }

    if (progress < -10) {
      return 'Performance has declined. Review recent training and focus on fundamentals.';
    }

    return 'Performance is stable. Focus on improving specific competencies.';
  }
}

// ============================================================================
// TYPES
// ============================================================================

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

export interface CompetencyEvaluation {
  competency: string;
  score: number;
  evidence: string;
  strengths: string[];
  improvements: string[];
  reasoning: string;
}

export interface BehaviorScore {
  behavior: string;
  score: number;
  evidence: string;
}

export interface ProgressionAnalysis {
  trend:
    | 'strong_improvement'
    | 'slight_improvement'
    | 'stable'
    | 'regression'
    | 'insufficient_data';
  overallProgress: number;
  dimensionTrends: Record<
    string,
    { start: number; current: number; change: number }
  >;
  improvement: string;
}

export interface PerformanceLevel {
  level:
    | 'expert'
    | 'advanced'
    | 'proficient'
    | 'acceptable'
    | 'developing';
  label: string;
  description: string;
  xpMultiplier: number;
}
