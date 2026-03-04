import { Module } from '@nestjs/common';
import { FeedbackController } from '../controllers/feedback.controller';
import { PrismaService } from '../database/prisma.service';
import { JwtGuard } from '../_core/guards/jwt.guard';
import { RoleGuard } from '../_core/guards/role.guard';

/**
 * Feedback Module
 *
 * Configures feedback management for agent evaluations
 */
@Module({
  controllers: [FeedbackController],
  providers: [
    PrismaService,
    JwtGuard,
    RoleGuard,
  ],
  exports: [PrismaService],
})
export class FeedbackModule {}
