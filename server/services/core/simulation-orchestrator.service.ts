import { Injectable, Logger, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';
import { RedisService } from '../../cache/redis.service';
import { StateMachineService } from './state-machine.service';
import { AIClientManagerService } from './ai-client-manager.service';
import { ConversationContextService } from './conversation-context.service';
import { OpenAIService } from '../ai/openai.service';
import { EvaluationService } from '../ai/evaluation.service';
import { PromptBuilderService } from '../ai/prompt-builder.service';
import { WhisperService } from '../ai/whisper.service';
import { VoiceAnalysisService } from '../voice/voice-analysis.service';
import { TTSService } from '../ai/tts.service';
import { User, Scenario, TrainingSession, SessionStatus } from '@prisma/client';

/**
 * SimulationOrchestratorService
 *
 * Core orchestration engine for training simulations.
 * Manages the entire flow of a training session:
 * - Call state transitions
 * - AI client personality & responses
 * - Real-time audio processing
 * - Session evaluation & feedback
 *
 * SOLID Principles Applied:
 * - Single Responsibility: Orchestration only, delegates to specialized services
 * - Open/Closed: Extensible through dependency injection
 * - Liskov Substitution: Uses interfaces for all dependencies
 * - Interface Segregation: Small focused services
 * - Dependency Inversion: Depends on abstractions, not concrete classes
 */
@Injectable()
export class SimulationOrchestratorService {
  private readonly logger = new Logger(SimulationOrchestratorService.name);

  constructor(
    private prisma: PrismaService,
    private redis: RedisService,
    private stateMachine: StateMachineService,
    private aiClientManager: AIClientManagerService,
    private conversationContext: ConversationContextService,
    private openai: OpenAIService,
    private evaluation: EvaluationService,
    private promptBuilder: PromptBuilderService,
    private whisper: WhisperService,
    private voiceAnalysis: VoiceAnalysisService,
    private tts: TTSService,
  ) {}

  /**
   * Initialize a new training simulation session
   *
   * Responsibilities:
   * 1. Validate agent & scenario
   * 2. Create session record
   * 3. Setup AI client personality
   * 4. Initialize conversation context
   * 5. Set initial state machine state
   * 6. Cache session for real-time access
   *
   * @param agentId Agent performing the simulation
   * @param scenarioId Scenario to train on
   * @returns Initialized session with client greeting
   */
  async initializeSession(
    agentId: string,
    scenarioId: string,
  ): Promise<{
    sessionId: string;
    clientGreeting: string;
    audioUrl?: string;
  }> {
    try {
      this.logger.log(
        `Initializing session for agent ${agentId} on scenario ${scenarioId}`,
      );

      // Validate inputs
      const [agent, scenario] = await Promise.all([
        this.validateAgent(agentId),
        this.validateScenario(scenarioId),
      ]);

      // Create session in database
      const session = await this.prisma.trainingSession.create({
        data: {
          agentId,
          scenarioId,
          status: SessionStatus.IN_PROGRESS,
        },
      });

      // Initialize AI client personality
      const clientProfile = await this.aiClientManager.createClientPersonality(
        scenario,
      );

      // Initialize conversation context
      await this.conversationContext.initialize(session.id, {
        clientProfile,
        scenario,
        agent,
      });

      // Set initial state
      await this.stateMachine.initialize(session.id, 'INITIALIZED');

      // Generate client greeting
      const greeting = await this.generateClientGreeting(session.id, scenario);

      // Generate and cache greeting audio
      let audioUrl: string | undefined;
      if (greeting.text) {
        audioUrl = await this.tts.generate(greeting.text, {
          voiceGender: clientProfile.voiceGender,
          language: scenario.clientLanguage,
          speed: 1.0,
        });
      }

      // Cache session metadata for WebSocket access
      await this.cacheSessionMetadata(session.id, {
        agentId,
        scenarioId,
        clientProfile,
      });

      // Transition state to WAITING_FOR_AGENT
      await this.stateMachine.transition(
        session.id,
        'WAITING_FOR_AGENT',
        'Client greeting generated',
      );

      this.logger.log(`Session ${session.id} initialized successfully`);

      return {
        sessionId: session.id,
        clientGreeting: greeting.text,
        audioUrl,
      };
    } catch (error) {
      this.logger.error(`Failed to initialize session: ${error.message}`);
      throw error;
    }
  }

  /**
   * Process agent speech and generate AI client response
   *
   * Real-time conversation loop:
   * 1. Transcribe agent audio using Whisper
   * 2. Update conversation context
   * 3. Generate AI client response using GPT-4o
   * 4. Synthesize response to speech
   * 5. Update session state
   * 6. Collect metrics for evaluation
   *
   * Target latency: <500ms from audio end to response start
   *
   * @param sessionId Active session ID
   * @param audioBuffer Raw audio data (WebRTC)
   * @returns AI response text and audio
   */
  async processAgentSpeech(
    sessionId: string,
    audioBuffer: Buffer,
  ): Promise<{
    transcription: string;
    clientResponse: string;
    audioUrl?: string;
  }> {
    const startTime = Date.now();

    try {
      // Transition to AGENT_SPEAKING
      await this.stateMachine.transition(
        sessionId,
        'AGENT_SPEAKING',
        'Processing agent speech',
      );

      // Get conversation context
      const context = await this.conversationContext.get(sessionId);
      if (!context) {
        throw new BadRequestException(
          `Session ${sessionId} context not found`,
        );
      }

      // 1. Transcribe agent audio
      const transcription = await this.transcribeAgentAudio(
        sessionId,
        audioBuffer,
      );

      // 2. Update conversation context with agent message
      await this.conversationContext.addMessage(sessionId, {
        role: 'agent',
        content: transcription,
        timestamp: new Date(),
      });

      // 3. Generate AI client response
      const clientResponse = await this.generateClientResponse(
        sessionId,
        context,
        transcription,
      );

      // 4. Synthesize to speech
      const audioUrl = await this.tts.generate(clientResponse, {
        voiceGender: context.clientProfile.voiceGender,
        language: context.scenario.clientLanguage,
        speed: context.clientProfile.speechRate,
      });

      // 5. Update context with client response
      await this.conversationContext.addMessage(sessionId, {
        role: 'client',
        content: clientResponse,
        timestamp: new Date(),
      });

      // 6. Collect metrics
      const latency = Date.now() - startTime;
      await this.recordProcessingMetrics(sessionId, {
        speechLatency: latency,
        agentTranscriptionLength: transcription.length,
        clientResponseLength: clientResponse.length,
      });

      // Warn if latency exceeds target
      if (latency > 500) {
        this.logger.warn(
          `Latency exceeded 500ms: ${latency}ms for session ${sessionId}`,
        );
      }

      // Transition to AI_RESPONDING
      await this.stateMachine.transition(
        sessionId,
        'AI_RESPONDING',
        'Client response generated',
      );

      return {
        transcription,
        clientResponse,
        audioUrl,
      };
    } catch (error) {
      this.logger.error(
        `Failed to process agent speech: ${error.message}`,
      );
      throw error;
    }
  }

  /**
   * End training session and trigger evaluation
   *
   * Responsibilities:
   * 1. Mark session as complete
   * 2. Retrieve full conversation transcript
   * 3. Perform comprehensive evaluation using GPT-4o
   * 4. Analyze agent voice metrics
   * 5. Generate feedback and recommendations
   * 6. Award experience points and achievements
   * 7. Store evaluation results
   *
   * @param sessionId Session to complete
   * @returns Complete evaluation with scores and feedback
   */
  async completeSession(sessionId: string): Promise<{
    evaluationId: string;
    overallScore: number;
    scores: Record<string, number>;
    feedback: string;
    xpAwarded: number;
  }> {
    try {
      this.logger.log(`Completing session ${sessionId}`);

      // Get session and context
      const session = await this.prisma.trainingSession.findUnique({
        where: { id: sessionId },
        include: { scenario: true, agent: true },
      });

      if (!session) {
        throw new BadRequestException(`Session ${sessionId} not found`);
      }

      const context = await this.conversationContext.get(sessionId);

      // Mark as completed
      const completedSession = await this.prisma.trainingSession.update({
        where: { id: sessionId },
        data: {
          status: SessionStatus.COMPLETED,
          completedAt: new Date(),
          durationSeconds: Math.floor(
            (Date.now() - session.startedAt.getTime()) / 1000,
          ),
        },
      });

      // Transition state
      await this.stateMachine.transition(
        sessionId,
        'EVALUATING',
        'Session completion started',
      );

      // Get full conversation transcript
      const transcript = await this.conversationContext.getTranscript(
        sessionId,
      );

      // 1. Perform comprehensive evaluation
      const evaluation = await this.evaluation.evaluateSession(
        session,
        context.clientProfile,
        transcript,
      );

      // 2. Analyze voice metrics
      const voiceMetrics = await this.voiceAnalysis.analyzeSessionAudio(
        sessionId,
      );

      // 3. Create evaluation record
      const evaluationRecord = await this.prisma.sessionEvaluation.create({
        data: {
          sessionId,
          empathyScore: evaluation.empathyScore,
          clarityScore: evaluation.clarityScore,
          protocolScore: evaluation.protocolScore,
          resolutionScore: evaluation.resolutionScore,
          confidenceScore: evaluation.confidenceScore,
          overallScore: evaluation.overallScore,
          strengths: evaluation.strengths,
          weaknesses: evaluation.weaknesses,
          recommendations: evaluation.recommendations,
          detailedFeedback: evaluation.detailedFeedback,
          keywordsUsed: evaluation.keywordsUsed,
          missedKeywords: evaluation.missedKeywords,
          voiceAnalysis: {
            create: {
              speechRate: voiceMetrics.speechRate,
              pauseCount: voiceMetrics.pauseCount,
              averagePauseDuration: voiceMetrics.averagePauseDuration,
              clarityScore: voiceMetrics.clarityScore,
              confidenceLevel: voiceMetrics.confidenceLevel,
              empathyDetection: voiceMetrics.empathyDetection,
              professionalismScore: voiceMetrics.professionalismScore,
              enthusiasmLevel: voiceMetrics.enthusiasmLevel,
              voiceTone: voiceMetrics.voiceTone,
              recommendations: voiceMetrics.recommendations,
            },
          },
        },
        include: { voiceAnalysis: true },
      });

      // 4. Calculate and award XP
      const xpAwarded = this.calculateXPAwarded(
        session.scenario,
        evaluation.overallScore,
      );

      await this.prisma.user.update({
        where: { id: session.agentId },
        data: {
          experiencePoints: {
            increment: xpAwarded,
          },
        },
      });

      // 5. Check for new achievements
      await this.checkAndAwardAchievements(session.agentId, evaluationRecord);

      // 6. Final state transition
      await this.stateMachine.transition(
        sessionId,
        'COMPLETED',
        'Evaluation completed',
      );

      // 7. Clear session cache
      await this.redis.delete(`session:${sessionId}`);

      this.logger.log(
        `Session ${sessionId} completed with score ${evaluation.overallScore}`,
      );

      return {
        evaluationId: evaluationRecord.id,
        overallScore: evaluation.overallScore,
        scores: {
          empathy: evaluation.empathyScore,
          clarity: evaluation.clarityScore,
          protocol: evaluation.protocolScore,
          resolution: evaluation.resolutionScore,
          confidence: evaluation.confidenceScore,
        },
        feedback: evaluation.detailedFeedback,
        xpAwarded,
      };
    } catch (error) {
      this.logger.error(`Failed to complete session: ${error.message}`);
      throw error;
    }
  }

  /**
   * Cancel session without evaluation
   */
  async cancelSession(
    sessionId: string,
    reason: string,
  ): Promise<TrainingSession> {
    return this.prisma.trainingSession.update({
      where: { id: sessionId },
      data: {
        status: SessionStatus.CANCELLED,
      },
    });
  }

  // ============================================================================
  // PRIVATE HELPER METHODS
  // ============================================================================

  private async validateAgent(agentId: string): Promise<User> {
    const agent = await this.prisma.user.findUnique({
      where: { id: agentId },
    });

    if (!agent) {
      throw new BadRequestException(`Agent ${agentId} not found`);
    }

    if (agent.status !== 'ACTIVE') {
      throw new BadRequestException(`Agent ${agentId} is not active`);
    }

    return agent;
  }

  private async validateScenario(scenarioId: string): Promise<Scenario> {
    const scenario = await this.prisma.scenario.findUnique({
      where: { id: scenarioId },
    });

    if (!scenario) {
      throw new BadRequestException(`Scenario ${scenarioId} not found`);
    }

    if (!scenario.isActive) {
      throw new BadRequestException(`Scenario ${scenarioId} is not active`);
    }

    return scenario;
  }

  private async generateClientGreeting(
    sessionId: string,
    scenario: Scenario,
  ): Promise<{ text: string }> {
    const prompt = this.promptBuilder.buildGreetingPrompt(scenario);

    const greeting = await this.openai.generateText(prompt, {
      maxTokens: 100,
      temperature: 0.7,
    });

    return { text: greeting };
  }

  private async transcribeAgentAudio(
    sessionId: string,
    audioBuffer: Buffer,
  ): Promise<string> {
    return this.whisper.transcribe(audioBuffer, 'es-PY');
  }

  private async generateClientResponse(
    sessionId: string,
    context: any,
    agentTranscription: string,
  ): Promise<string> {
    const prompt = this.promptBuilder.buildResponsePrompt(
      context.clientProfile,
      context.scenario,
      context.conversationHistory,
      agentTranscription,
    );

    return this.openai.generateText(prompt, {
      maxTokens: 200,
      temperature: 0.8,
      frequencyPenalty: 0.5,
    });
  }

  private async cacheSessionMetadata(
    sessionId: string,
    metadata: any,
  ): Promise<void> {
    await this.redis.set(
      `session:${sessionId}`,
      metadata,
      3600, // 1 hour TTL
    );
  }

  private async recordProcessingMetrics(
    sessionId: string,
    metrics: any,
  ): Promise<void> {
    await this.redis.lpush(
      `metrics:${sessionId}`,
      JSON.stringify(metrics),
    );
  }

  private calculateXPAwarded(
    scenario: Scenario,
    overallScore: number,
  ): number {
    // Base XP from scenario difficulty
    const baseXP = scenario.estimatedXP || 10;

    // Bonus multiplier based on score
    let multiplier = 1;
    if (overallScore >= 90) multiplier = 1.5;
    else if (overallScore >= 75) multiplier = 1.25;
    else if (overallScore >= 60) multiplier = 1;
    else multiplier = 0.5;

    return Math.round(baseXP * multiplier);
  }

  private async checkAndAwardAchievements(
    agentId: string,
    evaluation: any,
  ): Promise<void> {
    // Check various achievement criteria
    // This would be delegated to an AchievementService in real implementation
    // Examples: "Perfect Score", "First Training", "Empathy Expert", etc.
  }
}
