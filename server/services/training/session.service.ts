import {
  Injectable,
  Logger,
  BadRequestException,
  NotFoundException,
  InternalServerErrorException,
} from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';
import { TrainingSession, SessionStatus } from '@prisma/client';
import * as dayjs from 'dayjs';

/**
 * Session Service
 *
 * Manages training session CRUD operations and lifecycle
 *
 * Features:
 * - Create new sessions
 * - Retrieve sessions with filters
 * - Update session status and metadata
 * - Delete/archive sessions
 * - Session statistics and analytics
 * - Pagination support
 */
@Injectable()
export class SessionService {
  private readonly logger = new Logger(SessionService.name);

  constructor(private prisma: PrismaService) {}

  /**
   * Create a new training session
   *
   * @param agentId Agent performing training
   * @param scenarioId Scenario to train on
   * @returns Created session
   */
  async createSession(
    agentId: string,
    scenarioId: string,
  ): Promise<TrainingSession> {
    try {
      // Validate inputs
      const [agent, scenario] = await Promise.all([
        this.prisma.user.findUnique({
          where: { id: agentId },
        }),
        this.prisma.scenario.findUnique({
          where: { id: scenarioId },
        }),
      ]);

      if (!agent) {
        throw new NotFoundException(
          `Agent ${agentId} not found`,
        );
      }

      if (!scenario) {
        throw new NotFoundException(
          `Scenario ${scenarioId} not found`,
        );
      }

      if (!scenario.isActive) {
        throw new BadRequestException(
          'Scenario is not available for training',
        );
      }

      const session = await this.prisma.trainingSession.create({
        data: {
          agentId,
          scenarioId,
          status: SessionStatus.IN_PROGRESS,
        },
        include: {
          scenario: true,
          agent: { select: { id: true, name: true, email: true } },
        },
      });

      this.logger.log(
        `Session created: ${session.id} for agent ${agentId}`,
      );

      return session;
    } catch (error) {
      this.logger.error(
        `Create session error: ${error.message}`,
      );
      throw error;
    }
  }

  /**
   * Get session by ID
   *
   * @param sessionId Session ID
   * @returns Session with relations
   */
  async getSessionById(sessionId: string): Promise<TrainingSession> {
    try {
      const session =
        await this.prisma.trainingSession.findUnique({
          where: { id: sessionId },
          include: {
            scenario: true,
            agent: true,
            evaluation: {
              include: { voiceAnalysis: true },
            },
            markers: true,
            feedback: true,
          },
        });

      if (!session) {
        throw new NotFoundException(
          `Session ${sessionId} not found`,
        );
      }

      return session;
    } catch (error) {
      this.logger.error(
        `Get session error: ${error.message}`,
      );
      throw error;
    }
  }

  /**
   * Get all sessions for an agent
   *
   * @param agentId Agent ID
   * @param options Pagination and filtering
   * @returns Paginated sessions
   */
  async getAgentSessions(
    agentId: string,
    options: SessionQueryOptions = {},
  ): Promise<PaginatedSessions> {
    try {
      const {
        page = 1,
        limit = 10,
        status,
        fromDate,
        toDate,
      } = options;

      const skip = (page - 1) * limit;

      // Build filter
      const where: any = { agentId };

      if (status) {
        where.status = status;
      }

      if (fromDate || toDate) {
        where.createdAt = {};
        if (fromDate) {
          where.createdAt.gte = new Date(fromDate);
        }
        if (toDate) {
          where.createdAt.lte = new Date(toDate);
        }
      }

      // Get sessions
      const [sessions, total] = await Promise.all([
        this.prisma.trainingSession.findMany({
          where,
          skip,
          take: limit,
          orderBy: { createdAt: 'desc' },
          include: {
            scenario: { select: { id: true, title: true } },
            evaluation: {
              select: { overallScore: true },
            },
          },
        }),
        this.prisma.trainingSession.count({ where }),
      ]);

      return {
        data: sessions,
        pagination: {
          page,
          limit,
          total,
          pages: Math.ceil(total / limit),
        },
      };
    } catch (error) {
      this.logger.error(
        `Get agent sessions error: ${error.message}`,
      );
      throw error;
    }
  }

  /**
   * Update session status
   *
   * @param sessionId Session ID
   * @param status New status
   * @returns Updated session
   */
  async updateSessionStatus(
    sessionId: string,
    status: SessionStatus,
  ): Promise<TrainingSession> {
    try {
      const session =
        await this.prisma.trainingSession.update({
          where: { id: sessionId },
          data: {
            status,
            completedAt:
              status === SessionStatus.COMPLETED
                ? new Date()
                : undefined,
          },
        });

      this.logger.log(
        `Session ${sessionId} status updated to ${status}`,
      );

      return session;
    } catch (error) {
      this.logger.error(
        `Update session status error: ${error.message}`,
      );
      throw error;
    }
  }

  /**
   * Update session with audio and transcription
   *
   * @param sessionId Session ID
   * @param updateData Data to update
   * @returns Updated session
   */
  async updateSession(
    sessionId: string,
    updateData: SessionUpdateInput,
  ): Promise<TrainingSession> {
    try {
      const session =
        await this.prisma.trainingSession.update({
          where: { id: sessionId },
          data: updateData,
        });

      return session;
    } catch (error) {
      this.logger.error(`Update session error: ${error.message}`);
      throw error;
    }
  }

  /**
   * Get session statistics
   *
   * @param agentId Agent ID
   * @returns Statistics for agent's sessions
   */
  async getSessionStats(agentId: string): Promise<SessionStats> {
    try {
      const sessions =
        await this.prisma.trainingSession.findMany({
          where: { agentId, status: SessionStatus.COMPLETED },
          include: {
            evaluation: { select: { overallScore: true } },
          },
        });

      if (sessions.length === 0) {
        return {
          totalSessions: 0,
          completedSessions: 0,
          averageScore: 0,
          bestScore: 0,
          lastSessionDate: null,
          sessionsLastWeek: 0,
        };
      }

      const scores = sessions
        .map((s) => s.evaluation?.overallScore || 0)
        .filter((s) => s > 0);

      const weekAgo = dayjs().subtract(7, 'day').toDate();
      const sessionsLastWeek = sessions.filter(
        (s) => s.completedAt && s.completedAt > weekAgo,
      ).length;

      return {
        totalSessions: sessions.length,
        completedSessions: sessions.length,
        averageScore:
          scores.length > 0
            ? Math.round(
                (scores.reduce((a, b) => a + b) / scores.length) *
                  100,
              ) / 100
            : 0,
        bestScore:
          scores.length > 0
            ? Math.max(...scores)
            : 0,
        lastSessionDate:
          sessions[0]?.completedAt || null,
        sessionsLastWeek,
      };
    } catch (error) {
      this.logger.error(
        `Get session stats error: ${error.message}`,
      );
      throw new InternalServerErrorException(
        'Failed to get session statistics',
      );
    }
  }

  /**
   * Get recent sessions across all agents
   *
   * Admin endpoint for monitoring
   *
   * @param limit Number of sessions to return
   * @returns Recent sessions
   */
  async getRecentSessions(limit: number = 20): Promise<TrainingSession[]> {
    try {
      return this.prisma.trainingSession.findMany({
        orderBy: { createdAt: 'desc' },
        take: limit,
        include: {
          agent: { select: { id: true, name: true } },
          scenario: { select: { id: true, title: true } },
          evaluation: {
            select: { overallScore: true },
          },
        },
      });
    } catch (error) {
      this.logger.error(
        `Get recent sessions error: ${error.message}`,
      );
      throw error;
    }
  }

  /**
   * Delete session (soft delete)
   *
   * @param sessionId Session ID
   */
  async deleteSession(sessionId: string): Promise<void> {
    try {
      // In production, implement soft delete
      // For now, just mark as cancelled
      await this.updateSessionStatus(
        sessionId,
        SessionStatus.CANCELLED,
      );

      this.logger.log(`Session ${sessionId} deleted`);
    } catch (error) {
      this.logger.error(`Delete session error: ${error.message}`);
      throw error;
    }
  }

  /**
   * Get session with full transcript
   *
   * @param sessionId Session ID
   * @returns Session with formatted transcript
   */
  async getSessionTranscript(sessionId: string): Promise<SessionTranscript> {
    try {
      const session = await this.getSessionById(sessionId);

      if (!session.transcription) {
        throw new BadRequestException(
          'No transcription available for this session',
        );
      }

      return {
        sessionId: session.id,
        agentName: session.agent.name,
        scenarioTitle: session.scenario.title,
        createdAt: session.createdAt,
        duration: session.durationSeconds || 0,
        transcription: session.transcription,
        clientTranscription:
          session.clientTranscription || '',
        evaluation: session.evaluation || undefined,
      };
    } catch (error) {
      this.logger.error(
        `Get transcript error: ${error.message}`,
      );
      throw error;
    }
  }

  /**
   * Archive old sessions
   *
   * Background job to clean up old sessions
   * (in production, move to S3 archive)
   *
   * @param daysOld Sessions older than this many days
   * @returns Number of archived sessions
   */
  async archiveOldSessions(daysOld: number = 90): Promise<number> {
    try {
      const cutoffDate = dayjs()
        .subtract(daysOld, 'day')
        .toDate();

      const result = await this.prisma.trainingSession.updateMany({
        where: {
          completedAt: {
            lt: cutoffDate,
          },
          status: SessionStatus.COMPLETED,
        },
        data: {
          status: SessionStatus.COMPLETED, // Mark as archived (could use separate status)
        },
      });

      this.logger.log(
        `Archived ${result.count} sessions older than ${daysOld} days`,
      );

      return result.count;
    } catch (error) {
      this.logger.error(
        `Archive sessions error: ${error.message}`,
      );
      throw error;
    }
  }
}

// ============================================================================
// TYPES
// ============================================================================

export interface SessionQueryOptions {
  page?: number;
  limit?: number;
  status?: SessionStatus;
  fromDate?: string;
  toDate?: string;
}

export interface SessionUpdateInput {
  status?: SessionStatus;
  audioUrl?: string;
  audioSize?: number;
  audioMimeType?: string;
  transcription?: string;
  clientTranscription?: string;
  durationSeconds?: number;
  completedAt?: Date;
}

export interface PaginatedSessions {
  data: TrainingSession[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    pages: number;
  };
}

export interface SessionStats {
  totalSessions: number;
  completedSessions: number;
  averageScore: number;
  bestScore: number;
  lastSessionDate: Date | null;
  sessionsLastWeek: number;
}

export interface SessionTranscript {
  sessionId: string;
  agentName: string;
  scenarioTitle: string;
  createdAt: Date;
  duration: number;
  transcription: string;
  clientTranscription: string;
  evaluation?: any;
}
