import {
  Controller,
  Post,
  Get,
  Put,
  Delete,
  Param,
  Body,
  Query,
  UseGuards,
  Request,
  HttpCode,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { SessionService } from '../../services/training/session.service';
import { SimulationOrchestratorService } from '../../services/core/simulation-orchestrator.service';
import { JwtGuard } from '../../_core/guards/jwt.guard';
import { RoleGuard } from '../../_core/guards/role.guard';

/**
 * Session Controller
 *
 * HTTP endpoints for training session management:
 * - POST /sessions - Start new training session
 * - GET /sessions/:id - Get session details
 * - GET /sessions - Get agent sessions
 * - PUT /sessions/:id/complete - Complete session
 * - GET /sessions/:id/transcript - Get session transcript
 * - GET /sessions/stats/:agentId - Get session statistics
 * - DELETE /sessions/:id - Cancel session
 */
@Controller('sessions')
@UseGuards(JwtGuard)
export class SessionController {
  private readonly logger = new Logger(SessionController.name);

  constructor(
    private sessionService: SessionService,
    private orchestrator: SimulationOrchestratorService,
  ) {}

  /**
   * Start a new training session
   *
   * @param request HTTP request (contains user ID)
   * @param startSessionDto Session parameters
   * @returns Created session with client greeting
   */
  @Post()
  @HttpCode(HttpStatus.CREATED)
  async startSession(
    @Request() req: any,
    @Body() startSessionDto: StartSessionDto,
  ) {
    try {
      const agentId = req.user.sub;

      this.logger.log(
        `Starting session for agent ${agentId}`,
      );

      // Create session in database
      const session = await this.sessionService.createSession(
        agentId,
        startSessionDto.scenarioId,
      );

      // Initialize simulation with orchestrator
      const initResult =
        await this.orchestrator.initializeSession(
          agentId,
          startSessionDto.scenarioId,
        );

      return {
        status: 'success',
        message: 'Session started',
        data: {
          sessionId: session.id,
          clientGreeting: initResult.clientGreeting,
          audioUrl: initResult.audioUrl,
          scenario: session.scenario,
        },
      };
    } catch (error) {
      this.logger.error(
        `Start session error: ${error.message}`,
      );
      throw error;
    }
  }

  /**
   * Get session details
   *
   * @param sessionId Session ID
   * @returns Complete session data with evaluation
   */
  @Get(':sessionId')
  async getSession(@Param('sessionId') sessionId: string) {
    try {
      const session =
        await this.sessionService.getSessionById(sessionId);

      return {
        status: 'success',
        data: session,
      };
    } catch (error) {
      this.logger.error(
        `Get session error: ${error.message}`,
      );
      throw error;
    }
  }

  /**
   * Get all sessions for agent
   *
   * @param request HTTP request (contains user ID)
   * @param query Pagination and filtering options
   * @returns Paginated sessions
   */
  @Get()
  async getAgentSessions(
    @Request() req: any,
    @Query() query: SessionQueryDto,
  ) {
    try {
      const agentId = req.user.sub;

      const result =
        await this.sessionService.getAgentSessions(
          agentId,
          {
            page: query.page ? parseInt(query.page, 10) : 1,
            limit: query.limit
              ? parseInt(query.limit, 10)
              : 10,
            status: query.status as any,
            fromDate: query.fromDate,
            toDate: query.toDate,
          },
        );

      return {
        status: 'success',
        data: result.data,
        pagination: result.pagination,
      };
    } catch (error) {
      this.logger.error(
        `Get sessions error: ${error.message}`,
      );
      throw error;
    }
  }

  /**
   * Complete session and trigger evaluation
   *
   * @param sessionId Session ID
   * @returns Evaluation results
   */
  @Put(':sessionId/complete')
  async completeSession(
    @Param('sessionId') sessionId: string,
  ) {
    try {
      this.logger.log(`Completing session ${sessionId}`);

      const evaluation =
        await this.orchestrator.completeSession(sessionId);

      return {
        status: 'success',
        message: 'Session completed',
        data: evaluation,
      };
    } catch (error) {
      this.logger.error(
        `Complete session error: ${error.message}`,
      );
      throw error;
    }
  }

  /**
   * Get session transcript
   *
   * @param sessionId Session ID
   * @returns Session transcript with formatting
   */
  @Get(':sessionId/transcript')
  async getTranscript(
    @Param('sessionId') sessionId: string,
  ) {
    try {
      const transcript =
        await this.sessionService.getSessionTranscript(
          sessionId,
        );

      return {
        status: 'success',
        data: transcript,
      };
    } catch (error) {
      this.logger.error(
        `Get transcript error: ${error.message}`,
      );
      throw error;
    }
  }

  /**
   * Get session statistics for agent
   *
   * @param request HTTP request (contains user ID)
   * @returns Session statistics
   */
  @Get('stats/agent')
  async getStats(@Request() req: any) {
    try {
      const agentId = req.user.sub;

      const stats =
        await this.sessionService.getSessionStats(agentId);

      return {
        status: 'success',
        data: stats,
      };
    } catch (error) {
      this.logger.error(
        `Get stats error: ${error.message}`,
      );
      throw error;
    }
  }

  /**
   * Cancel session
   *
   * @param sessionId Session ID
   * @returns Success message
   */
  @Delete(':sessionId')
  async cancelSession(
    @Param('sessionId') sessionId: string,
  ) {
    try {
      await this.sessionService.deleteSession(sessionId);

      return {
        status: 'success',
        message: 'Session cancelled',
      };
    } catch (error) {
      this.logger.error(
        `Cancel session error: ${error.message}`,
      );
      throw error;
    }
  }

  /**
   * Get recent sessions (admin only)
   *
   * @param query Limit parameter
   * @returns Recent sessions across all agents
   */
  @Get('admin/recent')
  @UseGuards(RoleGuard)
  async getRecentSessions(
    @Query('limit') limit?: string,
  ) {
    try {
      const sessions =
        await this.sessionService.getRecentSessions(
          limit ? parseInt(limit, 10) : 20,
        );

      return {
        status: 'success',
        data: sessions,
      };
    } catch (error) {
      this.logger.error(
        `Get recent sessions error: ${error.message}`,
      );
      throw error;
    }
  }
}

// ============================================================================
// DTOs - Data Transfer Objects
// ============================================================================

export class StartSessionDto {
  scenarioId: string;
}

export class SessionQueryDto {
  page?: string;
  limit?: string;
  status?: string;
  fromDate?: string;
  toDate?: string;
}

export class UpdateSessionDto {
  status?: string;
  transcription?: string;
  audioUrl?: string;
}
