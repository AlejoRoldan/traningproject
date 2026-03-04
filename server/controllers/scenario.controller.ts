import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Param,
  Body,
  Query,
  UseGuards,
  HttpCode,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';
import { JwtGuard } from '../../_core/guards/jwt.guard';
import { RoleGuard } from '../../_core/guards/role.guard';

/**
 * Scenario Controller
 *
 * Manages training scenarios (customer service cases)
 */
@Controller('scenarios')
@UseGuards(JwtGuard)
export class ScenarioController {
  private readonly logger = new Logger(ScenarioController.name);

  constructor(private prisma: PrismaService) {}

  /**
   * Get all scenarios
   */
  @Get()
  async getAllScenarios(
    @Query('category') category?: string,
    @Query('difficulty') difficulty?: string,
    @Query('page') page: string = '1',
    @Query('limit') limit: string = '10',
  ) {
    try {
      const where: any = { isActive: true };

      if (category) where.category = category;
      if (difficulty) where.difficulty = difficulty;

      const [scenarios, total] = await Promise.all([
        this.prisma.scenario.findMany({
          where,
          skip: (parseInt(page) - 1) * parseInt(limit),
          take: parseInt(limit),
          orderBy: { createdAt: 'desc' },
        }),
        this.prisma.scenario.count({ where }),
      ]);

      return {
        status: 'success',
        data: scenarios,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total,
          pages: Math.ceil(total / parseInt(limit)),
        },
      };
    } catch (error) {
      this.logger.error(
        `Get scenarios error: ${error.message}`,
      );
      throw error;
    }
  }

  /**
   * Get scenario by ID
   */
  @Get(':scenarioId')
  async getScenario(
    @Param('scenarioId') scenarioId: string,
  ) {
    try {
      const scenario =
        await this.prisma.scenario.findUnique({
          where: { id: scenarioId },
        });

      if (!scenario) {
        return { status: 'error', message: 'Scenario not found' };
      }

      return { status: 'success', data: scenario };
    } catch (error) {
      this.logger.error(
        `Get scenario error: ${error.message}`,
      );
      throw error;
    }
  }

  /**
   * Create scenario (admin only)
   */
  @Post()
  @UseGuards(RoleGuard)
  @HttpCode(HttpStatus.CREATED)
  async createScenario(
    @Body() createScenarioDto: CreateScenarioDto,
  ) {
    try {
      const scenario = await this.prisma.scenario.create({
        data: {
          ...createScenarioDto,
          isActive: true,
        },
      });

      return {
        status: 'success',
        message: 'Scenario created',
        data: scenario,
      };
    } catch (error) {
      this.logger.error(
        `Create scenario error: ${error.message}`,
      );
      throw error;
    }
  }

  /**
   * Update scenario (admin only)
   */
  @Put(':scenarioId')
  @UseGuards(RoleGuard)
  async updateScenario(
    @Param('scenarioId') scenarioId: string,
    @Body() updateScenarioDto: UpdateScenarioDto,
  ) {
    try {
      const scenario =
        await this.prisma.scenario.update({
          where: { id: scenarioId },
          data: updateScenarioDto,
        });

      return { status: 'success', data: scenario };
    } catch (error) {
      this.logger.error(
        `Update scenario error: ${error.message}`,
      );
      throw error;
    }
  }

  /**
   * Delete scenario (admin only)
   */
  @Delete(':scenarioId')
  @UseGuards(RoleGuard)
  async deleteScenario(
    @Param('scenarioId') scenarioId: string,
  ) {
    try {
      await this.prisma.scenario.update({
        where: { id: scenarioId },
        data: { isActive: false },
      });

      return {
        status: 'success',
        message: 'Scenario deleted',
      };
    } catch (error) {
      this.logger.error(
        `Delete scenario error: ${error.message}`,
      );
      throw error;
    }
  }
}

export class CreateScenarioDto {
  title: string;
  description: string;
  category: string;
  difficulty: string;
  clientName: string;
  clientPersonality: string;
  clientContext: string;
  initialPrompt: string;
  keywordTargets?: string[];
  estimatedXP?: number;
}

export class UpdateScenarioDto {
  title?: string;
  description?: string;
  isActive?: boolean;
}
