import {
  Controller,
  Get,
  Put,
  Delete,
  Param,
  Body,
  UseGuards,
  Request,
  Query,
  Logger,
} from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';
import { JwtGuard } from '../../_core/guards/jwt.guard';
import { RoleGuard } from '../../_core/guards/role.guard';

/**
 * User Controller
 *
 * Manages user profiles and settings
 */
@Controller('users')
@UseGuards(JwtGuard)
export class UserController {
  private readonly logger = new Logger(UserController.name);

  constructor(private prisma: PrismaService) {}

  /**
   * Get all users (admin only)
   */
  @Get()
  @UseGuards(RoleGuard)
  async getAllUsers(
    @Query('role') role?: string,
    @Query('page') page: string = '1',
    @Query('limit') limit: string = '10',
  ) {
    try {
      const where: any = {};
      if (role) where.role = role;

      const [users, total] = await Promise.all([
        this.prisma.user.findMany({
          where,
          skip: (parseInt(page) - 1) * parseInt(limit),
          take: parseInt(limit),
          select: {
            id: true,
            name: true,
            email: true,
            role: true,
            level: true,
            experiencePoints: true,
            createdAt: true,
          },
        }),
        this.prisma.user.count({ where }),
      ]);

      return {
        status: 'success',
        data: users,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total,
          pages: Math.ceil(total / parseInt(limit)),
        },
      };
    } catch (error) {
      this.logger.error(
        `Get users error: ${error.message}`,
      );
      throw error;
    }
  }

  /**
   * Get user profile
   */
  @Get('profile/:userId')
  async getUserProfile(
    @Param('userId') userId: string,
  ) {
    try {
      const user = await this.prisma.user.findUnique({
        where: { id: userId },
        select: {
          id: true,
          name: true,
          email: true,
          role: true,
          level: true,
          experiencePoints: true,
          currentLevelXP: true,
          department: true,
          createdAt: true,
          lastLoginAt: true,
        },
      });

      if (!user) {
        return { status: 'error', message: 'User not found' };
      }

      return { status: 'success', data: user };
    } catch (error) {
      this.logger.error(
        `Get profile error: ${error.message}`,
      );
      throw error;
    }
  }

  /**
   * Get current user profile
   */
  @Get('me/profile')
  async getMyProfile(@Request() req: any) {
    try {
      const userId = req.user.sub;
      return this.getUserProfile(userId);
    } catch (error) {
      this.logger.error(
        `Get my profile error: ${error.message}`,
      );
      throw error;
    }
  }

  /**
   * Update user profile
   */
  @Put('profile/:userId')
  async updateUserProfile(
    @Param('userId') userId: string,
    @Body() updateProfileDto: UpdateProfileDto,
  ) {
    try {
      const user = await this.prisma.user.update({
        where: { id: userId },
        data: {
          name: updateProfileDto.name,
          department: updateProfileDto.department,
        },
        select: {
          id: true,
          name: true,
          email: true,
          role: true,
          department: true,
        },
      });

      return {
        status: 'success',
        message: 'Profile updated',
        data: user,
      };
    } catch (error) {
      this.logger.error(
        `Update profile error: ${error.message}`,
      );
      throw error;
    }
  }

  /**
   * Get user with sessions and stats (admin only)
   */
  @Get('admin/:userId')
  @UseGuards(RoleGuard)
  async getUserWithStats(
    @Param('userId') userId: string,
  ) {
    try {
      const user = await this.prisma.user.findUnique({
        where: { id: userId },
        include: {
          sessions: {
            select: {
              id: true,
              status: true,
              createdAt: true,
              evaluation: { select: { overallScore: true } },
            },
            orderBy: { createdAt: 'desc' },
            take: 10,
          },
          achievements: true,
        },
      });

      if (!user) {
        return { status: 'error', message: 'User not found' };
      }

      return { status: 'success', data: user };
    } catch (error) {
      this.logger.error(
        `Get user with stats error: ${error.message}`,
      );
      throw error;
    }
  }

  /**
   * Delete user (admin only)
   */
  @Delete(':userId')
  @UseGuards(RoleGuard)
  async deleteUser(@Param('userId') userId: string) {
    try {
      await this.prisma.user.update({
        where: { id: userId },
        data: { status: 'DELETED' },
      });

      return {
        status: 'success',
        message: 'User deleted',
      };
    } catch (error) {
      this.logger.error(`Delete user error: ${error.message}`);
      throw error;
    }
  }
}

export class UpdateProfileDto {
  name?: string;
  department?: string;
}
