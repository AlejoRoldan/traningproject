import { Module } from '@nestjs/common';
import { UserController } from '../controllers/user.controller';
import { PrismaService } from '../database/prisma.service';
import { JwtGuard } from '../_core/guards/jwt.guard';
import { RoleGuard } from '../_core/guards/role.guard';

/**
 * User Module
 *
 * Configures user management and profile endpoints
 */
@Module({
  controllers: [UserController],
  providers: [
    PrismaService,
    JwtGuard,
    RoleGuard,
  ],
  exports: [PrismaService],
})
export class UserModule {}
