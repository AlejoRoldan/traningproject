import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { AuthService } from '../services/user/auth.service';
import { AuthController } from '../controllers/auth.controller';
import { PrismaService } from '../database/prisma.service';
import { RedisService } from '../cache/redis.service';
import { JwtGuard } from '../_core/guards/jwt.guard';
import { JwtStrategy } from '../_core/strategies/jwt.strategy';

/**
 * Authentication Module
 *
 * Configures authentication service, JWT strategy, and auth-related guards
 */
@Module({
  imports: [
    JwtModule.register({
      secret: process.env.JWT_SECRET || 'your-secret-key',
      signOptions: { expiresIn: '24h' },
    }),
  ],
  controllers: [AuthController],
  providers: [
    AuthService,
    PrismaService,
    RedisService,
    JwtGuard,
    JwtStrategy,
  ],
  exports: [AuthService, JwtGuard],
})
export class AuthModule {}
