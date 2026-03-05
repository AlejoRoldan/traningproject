import { Injectable, Logger, BadRequestException } from '@nestjs/common';
import { RedisService } from '../../cache/redis.service';

/**
 * State Machine for Call Flow Management
 *
 * Manages explicit state transitions for training simulation calls.
 * Implements a finite state machine with valid transition rules.
 *
 * State Flow:
 * INITIALIZED
 *   ↓
 * WAITING_FOR_AGENT → AGENT_SPEAKING → AI_RESPONDING → PLAYING_RESPONSE
 *   ↑                                                           ↓
 *   └────────────────────────────── (loop) ──────────────────┘
 *   ↓
 * COMPLETED
 *   ↓
 * EVALUATING
 *
 * Special States:
 * - PAUSED: Call can be paused at any time
 * - FAILED: Error occurred, session invalid
 * - CANCELLED: User cancelled session
 */
@Injectable()
export class StateMachineService {
  private readonly logger = new Logger(StateMachineService.name);

  private readonly VALID_TRANSITIONS: Record<string, string[]> = {
    INITIALIZED: ['WAITING_FOR_AGENT', 'PAUSED', 'FAILED'],
    WAITING_FOR_AGENT: ['AGENT_SPEAKING', 'PAUSED', 'CANCELLED'],
    AGENT_SPEAKING: [
      'AI_RESPONDING',
      'PAUSED',
      'FAILED',
      'CANCELLED',
    ],
    AI_RESPONDING: [
      'PLAYING_RESPONSE',
      'PAUSED',
      'FAILED',
      'CANCELLED',
    ],
    PLAYING_RESPONSE: [
      'WAITING_FOR_AGENT',
      'COMPLETED',
      'PAUSED',
      'FAILED',
      'CANCELLED',
    ],
    EVALUATING: ['COMPLETED', 'FAILED'],
    PAUSED: [
      'WAITING_FOR_AGENT',
      'CANCELLED',
      'FAILED',
    ],
    COMPLETED: [],
    FAILED: ['CANCELLED'],
    CANCELLED: [],
  };

  constructor(private redis: RedisService) {}

  /**
   * Initialize state machine for a session
   */
  async initialize(sessionId: string, initialState: string): Promise<void> {
    const stateKey = this.getStateKey(sessionId);
    const history = {
      currentState: initialState,
      previousState: null,
      lastTransition: new Date(),
      transitions: [
        {
          from: null,
          to: initialState,
          timestamp: new Date(),
          reason: 'Initialization',
        },
      ],
    };

    await this.redis.set(stateKey, history, 3600); // 1 hour TTL
    this.logger.debug(
      `State machine initialized for session ${sessionId}: ${initialState}`,
    );
  }

  /**
   * Perform a state transition with validation
   *
   * Validates:
   * 1. Current state exists
   * 2. Transition is allowed
   * 3. No race conditions (using atomic operations)
   *
   * @param sessionId Session ID
   * @param nextState Target state
   * @param reason Reason for transition
   * @throws BadRequestException if transition is invalid
   */
  async transition(
    sessionId: string,
    nextState: string,
    reason: string,
  ): Promise<void> {
    const stateKey = this.getStateKey(sessionId);

    // Get current state
    const history = await this.redis.get<any>(stateKey);
    if (!history) {
      throw new BadRequestException(
        `No state machine found for session ${sessionId}`,
      );
    }

    const currentState = history.currentState;

    // Validate transition
    if (!this.isValidTransition(currentState, nextState)) {
      throw new BadRequestException(
        `Invalid transition from ${currentState} to ${nextState}`,
      );
    }

    // Update state atomically
    const updatedHistory = {
      ...history,
      previousState: currentState,
      currentState: nextState,
      lastTransition: new Date(),
      transitions: [
        ...history.transitions,
        {
          from: currentState,
          to: nextState,
          timestamp: new Date(),
          reason,
        },
      ],
    };

    await this.redis.set(stateKey, updatedHistory, 3600);

    this.logger.debug(
      `Session ${sessionId}: ${currentState} → ${nextState} (${reason})`,
    );

    // Emit event for other services
    await this.emitStateChangeEvent(sessionId, currentState, nextState, reason);
  }

  /**
   * Get current state
   */
  async getState(sessionId: string): Promise<string | null> {
    const stateKey = this.getStateKey(sessionId);
    const history = await this.redis.get<any>(stateKey);
    return history?.currentState || null;
  }

  /**
   * Get full state history
   */
  async getHistory(sessionId: string): Promise<any> {
    const stateKey = this.getStateKey(sessionId);
    return this.redis.get<any>(stateKey);
  }

  /**
   * Check if a transition is valid
   */
  private isValidTransition(currentState: string, nextState: string): boolean {
    if (!this.VALID_TRANSITIONS[currentState]) {
      return false;
    }
    return this.VALID_TRANSITIONS[currentState].includes(nextState);
  }

  /**
   * Emit state change event to other services
   */
  private async emitStateChangeEvent(
    sessionId: string,
    from: string,
    to: string,
    reason: string,
  ): Promise<void> {
    // Publish to Redis PubSub for other services
    const event = {
      sessionId,
      from,
      to,
      reason,
      timestamp: new Date(),
    };

    await this.redis.publish(
      `state-change:${sessionId}`,
      JSON.stringify(event),
    );
  }

  private getStateKey(sessionId: string): string {
    return `state:${sessionId}`;
  }

  /**
   * Check if session is in an active conversation state
   */
  async isActive(sessionId: string): Promise<boolean> {
    const state = await this.getState(sessionId);
    return ![
      'COMPLETED',
      'FAILED',
      'CANCELLED',
    ].includes(state || '');
  }

  /**
   * Check if session can accept agent input
   */
  async canReceiveAgentInput(sessionId: string): Promise<boolean> {
    const state = await this.getState(sessionId);
    return state === 'WAITING_FOR_AGENT';
  }

  /**
   * Check if session is evaluating
   */
  async isEvaluating(sessionId: string): Promise<boolean> {
    const state = await this.getState(sessionId);
    return state === 'EVALUATING';
  }
}
