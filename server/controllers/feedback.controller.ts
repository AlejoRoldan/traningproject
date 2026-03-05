import {
  Controller,
  Get,
  Post,
  Param,
  Body,
  UseGuards,
  Request,
  Query,
  Logger,
} from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';
import { JwtGuard } from '../../_core/guards/jwt.guard';

/**
 * Feedback Controller
 *
 * Manages feedback on training sessions
 */
@Controller('feedback')
@UseGuards(JwtGuard)
export class FeedbackController {
  private readonly logger = new Logger(FeedbackController.name);

  constructor(private prisma: PrismaService) {}

  /**
   * Get feedback for a session
   */
  @Get('session/:sessionId')
  async getSessionFeedback(
    @Param('sessionId') sessionId: string,
  ) {
    try {
      const feedback = await this.prisma.sessionFeedback.findMany({
        where: { sessionId },
        include: {
          provider: { select: { id: true, name: true } },
        },
        orderBy: { createdAt: 'desc' },
      });

      return { status: 'success', data: feedback };
    } catch (error) {
      this.logger.error(
        `Get feedback error: ${error.message}`,
      );
      throw error;
    }
  }

  /**
   * Get all feedback for an agent
   */
  @Get('agent/:agentId')
  async getAgentFeedback(
    @Param('agentId') agentId: string,
    @Query('page') page: string = '1',
    @Query('limit') limit: string = '10',
  ) {
    try {
      const [feedback, total] = await Promise.all([
        this.prisma.sessionFeedback.findMany({
          where: {
            session: { agentId },
          },
          skip: (parseInt(page) - 1) * parseInt(limit),
          take: parseInt(limit),
          include: {
            provider: { select: { id: true, name: true } },
            session: {
              select: { id: true, createdAt: true },
            },
          },
          orderBy: { createdAt: 'desc' },
        }),
        this.prisma.sessionFeedback.count({
          where: {
            session: { agentId },
          },
        }),
      ]);

      return {
        status: 'success',
        data: feedback,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total,
          pages: Math.ceil(total / parseInt(limit)),
        },
      };
    } catch (error) {
      this.logger.error(
        `Get agent feedback error: ${error.message}`,
      );
      throw error;
    }
  }

  /**
   * Create feedback for a session
   */
  @Post()
  async createFeedback(
    @Request() req: any,
    @Body() createFeedbackDto: CreateFeedbackDto,
  ) {
    try {
      const supervisorId = req.user.sub;

      const feedback =
        await this.prisma.sessionFeedback.create({
          data: {
            ...createFeedbackDto,
            providedBy: supervisorId,
          },
          include: {
            provider: { select: { id: true, name: true } },
          },
        });

      return {
        status: 'success',
        message: 'Feedback created',
        data: feedback,
      };
    } catch (error) {
      this.logger.error(
        `Create feedback error: ${error.message}`,
      );
      throw error;
    }
  }

  /**
   * Get feedback stats for agent
   */
  @Get('stats/:agentId')
  async getFeedbackStats(
    @Param('agentId') agentId: string,
  ) {
    try {
      const [positive, negative, neutral] =
        await Promise.all([
          this.prisma.sessionFeedback.count({
            where: {
              session: { agentId },
              isPositive: true,
            },
          }),
          this.prisma.sessionFeedback.count({
            where: {
              session: { agentId },
              isPositive: false,
            },
          }),
          this.prisma.sessionFeedback.count({
            where: {
              session: { agentId },
            },
          }),
        ]);

      return {
        status: 'success',
        data: {
          total: neutral,
          positive,
          negative,
          neutralRatio:
            neutral > 0
              ? Math.round((neutral - positive - negative) / neutral * 100)
              : 0,
        },
      };
    } catch (error) {
      this.logger.error(
        `Get feedback stats error: ${error.message}`,
      );
      throw error;
    }
  }
}

export class CreateFeedbackDto {
  sessionId: string;
  category: string;
  content: string;
  isPositive: boolean;
  visibility?: string;
}
