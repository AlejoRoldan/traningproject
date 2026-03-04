import { Module } from '@nestjs/common';
import { AnalyticsController } from '../controllers/analytics.controller';
import { PrismaService } from '../database/prisma.service';
import { JwtGuard } from '../_core/guards/jwt.guard';
import { RoleGuard } from '../_core/guards/role.guard';

/**
 * Analytics Module
 *
 * Configures analytics and reporting endpoints for dashboards
 */
@Module({
  controllers: [AnalyticsController],
  providers: [
    PrismaService,
    JwtGuard,
    RoleGuard,
  ],
  exports: [PrismaService],
})
export class AnalyticsModule {}
