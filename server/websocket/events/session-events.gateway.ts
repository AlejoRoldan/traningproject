import {
  WebSocketGateway,
  WebSocketServer,
  SubscribeMessage,
  OnGatewayConnection,
  OnGatewayDisconnect,
  ConnectedSocket,
  MessageBody,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { Logger, Injectable, BadRequestException } from '@nestjs/common';
import { SimulationOrchestratorService } from '../../services/core/simulation-orchestrator.service';
import { StateMachineService } from '../../services/core/state-machine.service';
import { ConversationContextService } from '../../services/core/conversation-context.service';
import { AudioStreamGateway } from './audio-stream.gateway';

/**
 * WebSocket Gateway for Real-Time Training Sessions
 *
 * Handles:
 * - Session initialization and lifecycle
 * - Event messaging between client and server
 * - Presence tracking
 * - Error handling and recovery
 *
 * CRITICAL: Target <500ms latency for audio streaming
 *
 * Protocol:
 * 1. Client connects to WebSocket
 * 2. Client emits 'session:initialize' with agentId and scenarioId
 * 3. Server initializes simulation and returns client greeting
 * 4. Client starts recording and emits audio chunks via 'audio:chunk'
 * 5. Server processes audio and responds with client response
 * 6. Loop continues until client emits 'session:complete'
 */
@Injectable()
@WebSocketGateway({
  namespace: '/training',
  cors: {
    origin: process.env.CORS_ORIGIN || 'http://localhost:3000',
    credentials: true,
  },
  transports: ['websocket'],
  pingTimeout: 60000,
  pingInterval: 25000,
})
export class SessionEventsGateway
  implements OnGatewayConnection, OnGatewayDisconnect
{
  @WebSocketServer()
  server: Server;

  private readonly logger = new Logger(SessionEventsGateway.name);

  // Track active sessions
  private activeSessions = new Map<string, SessionSocket>();

  constructor(
    private orchestrator: SimulationOrchestratorService,
    private stateMachine: StateMachineService,
    private context: ConversationContextService,
    private audioStream: AudioStreamGateway,
  ) {}

  /**
   * Handle client connection
   *
   * - Authenticate user
   * - Setup session tracking
   * - Ready for session initialization
   */
  async handleConnection(client: Socket) {
    try {
      const userId = client.handshake.auth.userId;
      const token = client.handshake.auth.token;

      if (!userId || !token) {
        this.logger.warn(
          `Connection attempt without auth: ${client.id}`,
        );
        client.disconnect(true);
        return;
      }

      // In production, validate JWT token here
      // await this.authService.validateToken(token);

      const sessionSocket: SessionSocket = {
        clientId: client.id,
        userId,
        connectedAt: Date.now(),
        sessionId: null,
        audioBuffer: Buffer.alloc(0),
        isRecording: false,
      };

      this.activeSessions.set(client.id, sessionSocket);

      this.logger.log(
        `Client connected: ${client.id} (User: ${userId})`,
      );

      client.emit('connection:ready', {
        clientId: client.id,
        timestamp: new Date(),
        message: 'Ready to initialize training session',
      });
    } catch (error) {
      this.logger.error(`Connection error: ${error.message}`);
      client.disconnect(true);
    }
  }

  /**
   * Handle client disconnection
   *
   * - Clean up active session
   * - Save any pending data
   * - Notify other observers
   */
  async handleDisconnect(client: Socket) {
    const sessionSocket = this.activeSessions.get(client.id);

    if (sessionSocket?.sessionId) {
      try {
        // Cancel session if still in progress
        const state = await this.stateMachine.getState(
          sessionSocket.sessionId,
        );
        if (state && state !== 'COMPLETED') {
          await this.orchestrator.cancelSession(
            sessionSocket.sessionId,
            'Client disconnected',
          );
        }
      } catch (error) {
        this.logger.error(
          `Error cleaning up session on disconnect: ${error.message}`,
        );
      }
    }

    this.activeSessions.delete(client.id);
    this.logger.log(`Client disconnected: ${client.id}`);
  }

  /**
   * Initialize a new training session
   *
   * @event session:initialize
   * Payload: { agentId: string, scenarioId: string }
   *
   * Response:
   * {
   *   sessionId: string,
   *   clientGreeting: string,
   *   audioUrl?: string,
   *   timestamp: Date
   * }
   */
  @SubscribeMessage('session:initialize')
  async handleSessionInitialize(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: any,
  ) {
    try {
      const { agentId, scenarioId } = data;

      if (!agentId || !scenarioId) {
        throw new BadRequestException(
          'agentId and scenarioId are required',
        );
      }

      this.logger.log(
        `Initializing session: agent=${agentId}, scenario=${scenarioId}`,
      );

      // Initialize simulation
      const { sessionId, clientGreeting, audioUrl } =
        await this.orchestrator.initializeSession(agentId, scenarioId);

      // Track session
      const sessionSocket = this.activeSessions.get(client.id)!;
      sessionSocket.sessionId = sessionId;

      client.emit('session:initialized', {
        sessionId,
        clientGreeting,
        audioUrl,
        timestamp: new Date(),
        message: 'Session ready for conversation',
      });

      this.logger.log(`Session initialized: ${sessionId}`);
    } catch (error) {
      this.logger.error(`Session initialization error: ${error.message}`);
      client.emit('session:error', {
        code: 'INIT_FAILED',
        message: error.message,
        timestamp: new Date(),
      });
    }
  }

  /**
   * Handle incoming audio chunk from agent
   *
   * @event audio:chunk
   * Payload: { sessionId: string, chunk: Uint8Array, isLast: boolean }
   *
   * Processing pipeline:
   * 1. Buffer audio chunks
   * 2. When complete, transcribe with Whisper
   * 3. Generate AI response
   * 4. Stream response back to client
   */
  @SubscribeMessage('audio:chunk')
  async handleAudioChunk(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: any,
  ) {
    try {
      const { sessionId, chunk, isLast } = data;

      if (!sessionId) {
        throw new BadRequestException('sessionId is required');
      }

      // Validate session state
      const state = await this.stateMachine.getState(sessionId);
      if (!state) {
        throw new BadRequestException(`Session ${sessionId} not found`);
      }

      if (state !== 'WAITING_FOR_AGENT') {
        throw new BadRequestException(
          `Session is in ${state} state, cannot receive audio`,
        );
      }

      const sessionSocket = this.activeSessions.get(client.id);
      if (!sessionSocket) {
        throw new BadRequestException('Client session not found');
      }

      // Convert chunk to buffer
      const audioChunk = Buffer.from(chunk);

      // Buffer the audio chunk
      sessionSocket.audioBuffer = Buffer.concat([
        sessionSocket.audioBuffer,
        audioChunk,
      ]);

      // If this is the final chunk, process the complete audio
      if (isLast) {
        await this.processCompleteAudio(
          client,
          sessionId,
          sessionSocket.audioBuffer,
        );
        sessionSocket.audioBuffer = Buffer.alloc(0); // Reset buffer
      } else {
        // Acknowledge chunk received
        client.emit('audio:chunk-received', {
          sessionId,
          size: audioChunk.length,
          bufferSize: sessionSocket.audioBuffer.length,
          timestamp: new Date(),
        });
      }
    } catch (error) {
      this.logger.error(`Audio chunk error: ${error.message}`);
      client.emit('audio:error', {
        code: 'CHUNK_ERROR',
        message: error.message,
        timestamp: new Date(),
      });
    }
  }

  /**
   * Mark session as complete
   *
   * @event session:complete
   * Payload: { sessionId: string }
   *
   * Response:
   * {
   *   evaluationId: string,
   *   overallScore: number,
   *   scores: Record<string, number>,
   *   feedback: string
   * }
   */
  @SubscribeMessage('session:complete')
  async handleSessionComplete(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: any,
  ) {
    try {
      const { sessionId } = data;

      if (!sessionId) {
        throw new BadRequestException('sessionId is required');
      }

      this.logger.log(`Completing session: ${sessionId}`);

      // Complete the session
      const evaluation = await this.orchestrator.completeSession(
        sessionId,
      );

      client.emit('session:completed', {
        ...evaluation,
        timestamp: new Date(),
        message: 'Session evaluation complete',
      });

      this.logger.log(
        `Session completed: ${sessionId}, Score: ${evaluation.overallScore}`,
      );
    } catch (error) {
      this.logger.error(`Session completion error: ${error.message}`);
      client.emit('session:error', {
        code: 'COMPLETION_FAILED',
        message: error.message,
        timestamp: new Date(),
      });
    }
  }

  /**
   * Pause session
   */
  @SubscribeMessage('session:pause')
  async handleSessionPause(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: any,
  ) {
    try {
      const { sessionId } = data;
      await this.stateMachine.transition(
        sessionId,
        'PAUSED',
        'User paused',
      );

      client.emit('session:paused', {
        sessionId,
        timestamp: new Date(),
      });
    } catch (error) {
      this.logger.error(`Pause error: ${error.message}`);
      client.emit('session:error', {
        code: 'PAUSE_FAILED',
        message: error.message,
        timestamp: new Date(),
      });
    }
  }

  /**
   * Resume paused session
   */
  @SubscribeMessage('session:resume')
  async handleSessionResume(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: any,
  ) {
    try {
      const { sessionId } = data;
      await this.stateMachine.transition(
        sessionId,
        'WAITING_FOR_AGENT',
        'User resumed',
      );

      client.emit('session:resumed', {
        sessionId,
        timestamp: new Date(),
      });
    } catch (error) {
      this.logger.error(`Resume error: ${error.message}`);
      client.emit('session:error', {
        code: 'RESUME_FAILED',
        message: error.message,
        timestamp: new Date(),
      });
    }
  }

  /**
   * Get session status
   */
  @SubscribeMessage('session:status')
  async handleSessionStatus(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: any,
  ) {
    try {
      const { sessionId } = data;

      const state = await this.stateMachine.getState(sessionId);
      const summary = await this.context.getSummary(sessionId);

      client.emit('session:status-update', {
        sessionId,
        state,
        summary,
        timestamp: new Date(),
      });
    } catch (error) {
      this.logger.error(`Status error: ${error.message}`);
    }
  }

  // ============================================================================
  // PRIVATE HELPERS
  // ============================================================================

  /**
   * Process complete audio buffer
   *
   * The critical real-time processing pipeline.
   * Target: <500ms from audio end to response start
   */
  private async processCompleteAudio(
    client: Socket,
    sessionId: string,
    audioBuffer: Buffer,
  ): Promise<void> {
    const startTime = Date.now();

    try {
      // Process the complete audio and get response
      const { transcription, clientResponse, audioUrl } =
        await this.orchestrator.processAgentSpeech(
          sessionId,
          audioBuffer,
        );

      const latency = Date.now() - startTime;

      // Stream response back to client
      client.emit('audio:response', {
        sessionId,
        transcription,
        clientResponse,
        audioUrl,
        latency,
        timestamp: new Date(),
      });

      // Log performance metrics
      if (latency > 500) {
        this.logger.warn(
          `Audio processing latency exceeded: ${latency}ms for session ${sessionId}`,
        );
      } else {
        this.logger.debug(
          `Audio processed in ${latency}ms for session ${sessionId}`,
        );
      }
    } catch (error) {
      this.logger.error(
        `Audio processing error: ${error.message}`,
      );
      client.emit('audio:error', {
        code: 'PROCESSING_ERROR',
        message: error.message,
        timestamp: new Date(),
      });
    }
  }
}

// ============================================================================
// TYPES
// ============================================================================

interface SessionSocket {
  clientId: string;
  userId: string;
  connectedAt: number;
  sessionId: string | null;
  audioBuffer: Buffer;
  isRecording: boolean;
}
