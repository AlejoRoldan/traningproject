import {
  Controller,
  Get,
  Param,
  Query,
  UseGuards,
  Request,
  Logger,
} from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';
import { JwtGuard } from '../../_core/guards/jwt.guard';
import { RoleGuard } from '../../_core/guards/role.guard';
import * as dayjs from 'dayjs';

/**
 * Analytics Controller
 *
 * Provides analytics and reporting endpoints
 */
@Controller('analytics')
@UseGuards(JwtGuard)
export class AnalyticsController {
  private readonly logger = new Logger(AnalyticsController.name);

  constructor(private prisma: PrismaService) {}

  /**
   * Get agent dashboard
   */
  @Get('dashboard')
  async getAgentDashboard(@Request() req: any) {
    try {
      const agentId = req.user.sub;

      const [stats, recentSessions, achievements] =
        await Promise.all([
          this.prisma.trainingSession.groupBy({
            by: ['status'],
            where: { agentId },
            _count: { id: true },
          }),
          this.prisma.trainingSession.findMany({
            where: { agentId },
            orderBy: { createdAt: 'desc' },
            take: 5,
            include: {
              scenario: { select: { title: true } },
              evaluation: { select: { overallScore: true } },
            },
          }),
          this.prisma.userAchievement.findMany({
            where: { userId: agentId },
            include: { achievement: true },
            take: 5,
            orderBy: { unlockedAt: 'desc' },
          }),
        ]);

      return {
        status: 'success',
        data: {
          sessionStats: stats,
          recentSessions,
          recentAchievements: achievements,
        },
      };
    } catch (error) {
      this.logger.error(
        `Get dashboard error: ${error.message}`,
      );
      throw error;
    }
  }

  /**
   * Get agent performance metrics
   */
  @Get('metrics')
  async getAgentMetrics(@Request() req: any) {
    try {
      const agentId = req.user.sub;

      const sessions =
        await this.prisma.trainingSession.findMany({
          where: {
            agentId,
            status: 'COMPLETED',
          },
          include: {
            evaluation: true,
          },
        });

      const scores = sessions
        .map((s) => s.evaluation?.overallScore || 0)
        .filter((s) => s > 0);

      const avgScore =
        scores.length > 0
          ? scores.reduce((a, b) => a + b) /
            scores.length
          : 0;

      return {
        status: 'success',
        data: {
          totalSessions: sessions.length,
          averageScore:
            Math.round(avgScore * 100) / 100,
          bestScore:
            scores.length > 0 ? Math.max(...scores) : 0,
          improvementTrend: this.calculateTrend(sessions),
        },
      };
    } catch (error) {
      this.logger.error(
        `Get metrics error: ${error.message}`,
      );
      throw error;
    }
  }

  /**
   * Get leaderboard
   */
  @Get('leaderboard')
  async getLeaderboard(
    @Query('limit') limit: string = '10',
  ) {
    try {
      const users = await this.prisma.user.findMany({
        where: { role: 'AGENT' },
        orderBy: {
          experiencePoints: 'desc',
        },
        take: parseInt(limit),
        select: {
          id: true,
          name: true,
          level: true,
          experiencePoints: true,
          currentLevelXP: true,
          department: true,
        },
      });

      return { status: 'success', data: users };
    } catch (error) {
      this.logger.error(
        `Get leaderboard error: ${error.message}`,
      );
      throw error;
    }
  }

  /**
   * Get supervisor team analytics (admin only)
   */
  @Get('team/:supervisorId')
  @UseGuards(RoleGuard)
  async getTeamAnalytics(
    @Param('supervisorId') supervisorId: string,
  ) {
    try {
      const agents = await this.prisma.user.findMany({
        where: { supervisorId },
        include: {
          _count: {
            select: { sessions: true },
          },
        },
      });

      const teamStats = {
        totalAgents: agents.length,
        totalSessions: agents.reduce(
          (sum, a) => sum + a._count.sessions,
          0,
        ),
        averageLevel:
          agents.length > 0
            ? Math.round(
                agents.reduce((sum, a) => sum + a.level, 0) /
                  agents.length,
              )
            : 0,
      };

      return { status: 'success', data: teamStats };
    } catch (error) {
      this.logger.error(
        `Get team analytics error: ${error.message}`,
      );
      throw error;
    }
  }

  /**
   * Get system analytics (admin only)
   */
  @Get('admin/system')
  @UseGuards(RoleGuard)
  async getSystemAnalytics() {
    try {
      const [users, sessions, completedSessions] =
        await Promise.all([
          this.prisma.user.count(),
          this.prisma.trainingSession.count(),
          this.prisma.trainingSession.count({
            where: { status: 'COMPLETED' },
          }),
        ]);

      return {
        status: 'success',
        data: {
          totalUsers: users,
          totalSessions: sessions,
          completedSessions,
          completionRate:
            sessions > 0
              ? Math.round(
                  (completedSessions / sessions) * 100,
                )
              : 0,
        },
      };
    } catch (error) {
      this.logger.error(
        `Get system analytics error: ${error.message}`,
      );
      throw error;
    }
  }

  /**
   * Get scenario performance
   */
  @Get('scenarios/performance')
  async getScenarioPerformance() {
    try {
      const scenarios =
        await this.prisma.scenario.findMany({
          include: {
            sessions: {
              where: { status: 'COMPLETED' },
              include: {
                evaluation: { select: { overallScore: true } },
              },
            },
          },
        });

      const performance = scenarios.map((s) => {
        const scores = s.sessions
          .map((ss) => ss.evaluation?.overallScore || 0)
          .filter((score) => score > 0);

        return {
          scenarioId: s.id,
          title: s.title,
          totalAttempts: s.sessions.length,
          avgScore:
            scores.length > 0
              ? Math.round(
                  (scores.reduce((a, b) => a + b) /
                    scores.length) *
                    100,
                ) / 100
              : 0,
        };
      });

      return { status: 'success', data: performance };
    } catch (error) {
      this.logger.error(
        `Get scenario performance error: ${error.message}`,
      );
      throw error;
    }
  }

  /**
   * Calculate improvement trend
   */
  private calculateTrend(sessions: any[]): string {
    if (sessions.length < 2) return 'insufficient_data';

    const first = sessions[sessions.length - 1];
    const latest = sessions[0];

    const firstScore =
      first.evaluation?.overallScore || 5;
    const latestScore =
      latest.evaluation?.overallScore || 5;

    const improvement = latestScore - firstScore;

    if (improvement > 1) return 'improving';
    if (improvement < -1) return 'declining';
    return 'stable';
  }
}
