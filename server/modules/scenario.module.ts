import { Module } from '@nestjs/common';
import { ScenarioController } from '../controllers/scenario.controller';
import { PrismaService } from '../database/prisma.service';
import { JwtGuard } from '../_core/guards/jwt.guard';
import { RoleGuard } from '../_core/guards/role.guard';

/**
 * Scenario Module
 *
 * Configures scenario management for training simulations
 */
@Module({
  controllers: [ScenarioController],
  providers: [
    PrismaService,
    JwtGuard,
    RoleGuard,
  ],
  exports: [PrismaService],
})
export class ScenarioModule {}
