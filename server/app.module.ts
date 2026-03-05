import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { PrismaService } from './database/prisma.service';
import { RedisService } from './cache/redis.service';
import { AuthModule } from './modules/auth.module';
import { SessionModule } from './modules/session.module';
import { ScenarioModule } from './modules/scenario.module';
import { UserModule } from './modules/user.module';
import { FeedbackModule } from './modules/feedback.module';
import { AnalyticsModule } from './modules/analytics.module';
import { SessionEventsGateway } from './gateways/session-events.gateway';

/**
 * Root Application Module
 *
 * Central module that imports all feature modules and configures:
 * - Environment variables via ConfigModule
 * - Database access via PrismaService
 * - Caching via RedisService
 * - Real-time events via WebSocket gateway
 * - All feature modules (Auth, Session, Scenario, User, Feedback, Analytics)
 *
 * Module Structure:
 * - AuthModule: User authentication and JWT management
 * - SessionModule: Training session orchestration and management
 * - ScenarioModule: Training scenario CRUD operations
 * - UserModule: User profile and management
 * - FeedbackModule: Session feedback and performance tracking
 * - AnalyticsModule: Dashboards and reporting
 */
@Module({
  imports: [
    // Load environment variables
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env',
    }),

    // Feature modules
    AuthModule,
    SessionModule,
    ScenarioModule,
    UserModule,
    FeedbackModule,
    AnalyticsModule,
  ],
  providers: [
    PrismaService,
    RedisService,
    SessionEventsGateway,
  ],
  exports: [
    PrismaService,
    RedisService,
  ],
})
export class AppModule {}
