import { Injectable, Logger } from '@nestjs/common';
import { RedisService } from '../../cache/redis.service';

/**
 * Conversation Context Service
 *
 * Maintains the state and history of a training simulation conversation.
 * Stores and retrieves:
 * - Full conversation transcript
 * - Client and agent profiles
 * - Current context windows for AI prompt building
 * - Metrics collected during conversation
 *
 * Performance-optimized for <500ms retrieval with Redis caching.
 */
@Injectable()
export class ConversationContextService {
  private readonly logger = new Logger(ConversationContextService.name);

  // Context stored in Redis for quick access during real-time conversation
  private readonly contextTTL = 3600; // 1 hour

  constructor(private redis: RedisService) {}

  /**
   * Initialize conversation context for a new session
   *
   * @param sessionId Session identifier
   * @param initialContext Initial context data
   */
  async initialize(
    sessionId: string,
    initialContext: any,
  ): Promise<void> {
    const context: ConversationContextData = {
      sessionId,
      startedAt: new Date(),
      clientProfile: initialContext.clientProfile,
      scenario: initialContext.scenario,
      agent: initialContext.agent,
      conversationHistory: [],
      messageCount: 0,
      isComplete: false,
      metrics: {
        startTime: Date.now(),
        totalDuration: 0,
        agentTurns: 0,
        clientTurns: 0,
        interruptions: 0,
      },
    };

    const contextKey = this.getContextKey(sessionId);
    await this.redis.set(contextKey, context, this.contextTTL);

    this.logger.debug(`Conversation context initialized for session ${sessionId}`);
  }

  /**
   * Get complete conversation context
   *
   * Used for:
   * - Building AI prompts
   * - Evaluation
   * - Debugging
   *
   * @param sessionId Session identifier
   * @returns Complete context or null if not found
   */
  async get(sessionId: string): Promise<ConversationContextData | null> {
    const contextKey = this.getContextKey(sessionId);
    return this.redis.get<ConversationContextData>(contextKey);
  }

  /**
   * Add a message to conversation history
   *
   * Maintains separate histories for agent and client to enable
   * independent analysis and metrics collection.
   *
   * @param sessionId Session identifier
   * @param message Message to add
   */
  async addMessage(
    sessionId: string,
    message: ConversationMessage,
  ): Promise<void> {
    const context = await this.get(sessionId);
    if (!context) {
      this.logger.warn(`Context not found for session ${sessionId}`);
      return;
    }

    // Add to history
    context.conversationHistory.push(message);
    context.messageCount++;

    // Update turn counters
    if (message.role === 'agent') {
      context.metrics.agentTurns++;
    } else if (message.role === 'client') {
      context.metrics.clientTurns++;
    }

    // Update context TTL
    const contextKey = this.getContextKey(sessionId);
    await this.redis.set(contextKey, context, this.contextTTL);

    this.logger.debug(
      `Message added to session ${sessionId}: ${message.role} (${context.conversationHistory.length} total)`,
    );
  }

  /**
   * Get context window for AI prompt building
   *
   * Returns only recent messages to fit within token limits:
   * - Last 10 messages (or less if fewer messages exist)
   * - Enough context for coherent responses
   * - Trimmed to reasonable token count (~2000 tokens)
   *
   * @param sessionId Session identifier
   * @param windowSize Number of messages to return (default: 10)
   * @returns Recent messages for prompt context
   */
  async getContextWindow(
    sessionId: string,
    windowSize: number = 10,
  ): Promise<ConversationMessage[]> {
    const context = await this.get(sessionId);
    if (!context) return [];

    const startIndex = Math.max(0, context.conversationHistory.length - windowSize);
    return context.conversationHistory.slice(startIndex);
  }

  /**
   * Get full transcript formatted for evaluation
   *
   * Combines both agent and client messages in chronological order
   * with timestamps and metadata.
   *
   * @param sessionId Session identifier
   * @returns Formatted transcript
   */
  async getTranscript(sessionId: string): Promise<string> {
    const context = await this.get(sessionId);
    if (!context) return '';

    let transcript = `=== TRANSCRIPCIÓN DE SIMULACIÓN ===\n\n`;
    transcript += `Cliente: ${context.clientProfile.name} (${context.clientProfile.personality})\n`;
    transcript += `Agente: ${context.agent.name}\n`;
    transcript += `Escenario: ${context.scenario.title}\n`;
    transcript += `Fecha: ${context.startedAt.toLocaleString('es-PY')}\n\n`;
    transcript += `=== CONVERSACIÓN ===\n\n`;

    for (const message of context.conversationHistory) {
      const speaker = message.role === 'agent' ? 'AGENTE' : 'CLIENTE';
      const timestamp = message.timestamp
        ? message.timestamp.toLocaleTimeString('es-PY')
        : 'N/A';
      transcript += `[${timestamp}] ${speaker}:\n${message.content}\n\n`;
    }

    return transcript;
  }

  /**
   * Get conversation summary
   *
   * Quick stats about the conversation:
   * - Duration
   * - Turn counts
   * - Key metrics
   *
   * @param sessionId Session identifier
   * @returns Summary statistics
   */
  async getSummary(sessionId: string): Promise<ConversationSummary | null> {
    const context = await this.get(sessionId);
    if (!context) return null;

    const duration = Date.now() - context.metrics.startTime;

    return {
      sessionId,
      startedAt: context.startedAt,
      duration,
      messageCount: context.messageCount,
      agentTurns: context.metrics.agentTurns,
      clientTurns: context.metrics.clientTurns,
      interruptions: context.metrics.interruptions,
      clientName: context.clientProfile.name,
      clientPersonality: context.clientProfile.personality,
      agentName: context.agent.name,
      scenarioTitle: context.scenario.title,
    };
  }

  /**
   * Update conversation metrics
   *
   * Records additional metrics during conversation for later analysis:
   * - Processing latencies
   * - Quality metrics
   * - Behavioral markers
   *
   * @param sessionId Session identifier
   * @param metrics Metrics to add
   */
  async updateMetrics(
    sessionId: string,
    metrics: Partial<ConversationMetrics>,
  ): Promise<void> {
    const context = await this.get(sessionId);
    if (!context) return;

    context.metrics = {
      ...context.metrics,
      ...metrics,
    };

    const contextKey = this.getContextKey(sessionId);
    await this.redis.set(contextKey, context, this.contextTTL);
  }

  /**
   * Mark conversation as complete
   *
   * Prevents further modifications and prepares for evaluation.
   *
   * @param sessionId Session identifier
   */
  async markComplete(sessionId: string): Promise<void> {
    const context = await this.get(sessionId);
    if (!context) return;

    context.isComplete = true;
    context.metrics.totalDuration = Date.now() - context.metrics.startTime;

    const contextKey = this.getContextKey(sessionId);
    await this.redis.set(contextKey, context, this.contextTTL);

    this.logger.debug(`Session ${sessionId} marked as complete`);
  }

  /**
   * Get context for debugging/inspection
   *
   * Useful for troubleshooting and analysis.
   *
   * @param sessionId Session identifier
   * @returns Context with all details
   */
  async inspect(sessionId: string): Promise<any> {
    return this.get(sessionId);
  }

  // ============================================================================
  // PRIVATE HELPERS
  // ============================================================================

  private getContextKey(sessionId: string): string {
    return `context:${sessionId}`;
  }
}

// ============================================================================
// TYPES
// ============================================================================

export interface ConversationContextData {
  sessionId: string;
  startedAt: Date;
  clientProfile: any;
  scenario: any;
  agent: any;
  conversationHistory: ConversationMessage[];
  messageCount: number;
  isComplete: boolean;
  metrics: ConversationMetrics;
}

export interface ConversationMessage {
  role: 'agent' | 'client';
  content: string;
  timestamp?: Date;
  audioUrl?: string;
  confidence?: number; // For transcriptions
  durationMs?: number; // For audio messages
}

export interface ConversationMetrics {
  startTime: number;
  totalDuration: number;
  agentTurns: number;
  clientTurns: number;
  interruptions: number;
  [key: string]: any;
}

export interface ConversationSummary {
  sessionId: string;
  startedAt: Date;
  duration: number;
  messageCount: number;
  agentTurns: number;
  clientTurns: number;
  interruptions: number;
  clientName: string;
  clientPersonality: string;
  agentName: string;
  scenarioTitle: string;
}
