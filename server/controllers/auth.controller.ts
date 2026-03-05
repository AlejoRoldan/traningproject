import {
  Controller,
  Post,
  Get,
  Body,
  UseGuards,
  Request,
  HttpCode,
  HttpStatus,
  BadRequestException,
  Logger,
} from '@nestjs/common';
import { AuthService } from '../../services/user/auth.service';
import { JwtGuard } from '../../_core/guards/jwt.guard';

/**
 * Auth Controller
 *
 * HTTP endpoints for user authentication:
 * - POST /auth/register - Create new user account
 * - POST /auth/login - User login
 * - POST /auth/refresh - Refresh access token
 * - POST /auth/logout - Logout (revoke token)
 * - POST /auth/password/change - Change password
 * - POST /auth/password/reset - Request password reset
 * - GET /auth/me - Get current user
 */
@Controller('auth')
export class AuthController {
  private readonly logger = new Logger(AuthController.name);

  constructor(private authService: AuthService) {}

  /**
   * Register new user
   *
   * @param registerDto Registration data
   * @returns User and tokens
   */
  @Post('register')
  @HttpCode(HttpStatus.CREATED)
  async register(@Body() registerDto: RegisterDto) {
    try {
      this.logger.log(`Registration attempt: ${registerDto.email}`);

      const result = await this.authService.register(
        registerDto.email,
        registerDto.password,
        registerDto.name,
      );

      return {
        status: 'success',
        message: 'User registered successfully',
        data: result,
      };
    } catch (error) {
      this.logger.error(
        `Registration error: ${error.message}`,
      );
      throw error;
    }
  }

  /**
   * Login user
   *
   * @param loginDto Login credentials
   * @returns User and tokens
   */
  @Post('login')
  @HttpCode(HttpStatus.OK)
  async login(@Body() loginDto: LoginDto) {
    try {
      this.logger.log(`Login attempt: ${loginDto.email}`);

      const result = await this.authService.login(
        loginDto.email,
        loginDto.password,
      );

      return {
        status: 'success',
        message: 'Login successful',
        data: result,
      };
    } catch (error) {
      this.logger.error(`Login error: ${error.message}`);
      throw error;
    }
  }

  /**
   * Refresh access token
   *
   * @param refreshTokenDto Refresh token
   * @returns New access token
   */
  @Post('refresh')
  @HttpCode(HttpStatus.OK)
  async refreshToken(
    @Body() refreshTokenDto: RefreshTokenDto,
  ) {
    try {
      const result = await this.authService.refreshToken(
        refreshTokenDto.refreshToken,
      );

      return {
        status: 'success',
        message: 'Token refreshed',
        data: result,
      };
    } catch (error) {
      this.logger.error(
        `Token refresh error: ${error.message}`,
      );
      throw error;
    }
  }

  /**
   * Logout user (revoke token)
   *
   * @param request HTTP request (contains JWT)
   * @returns Success message
   */
  @Post('logout')
  @UseGuards(JwtGuard)
  @HttpCode(HttpStatus.OK)
  async logout(@Request() req: any) {
    try {
      const token = req.headers.authorization?.split(
        ' ',
      )[1];

      if (!token) {
        throw new BadRequestException('No token provided');
      }

      await this.authService.logout(token);

      return {
        status: 'success',
        message: 'Logged out successfully',
      };
    } catch (error) {
      this.logger.error(`Logout error: ${error.message}`);
      throw error;
    }
  }

  /**
   * Get current user
   *
   * @param request HTTP request (contains user ID)
   * @returns Current user data
   */
  @Get('me')
  @UseGuards(JwtGuard)
  @HttpCode(HttpStatus.OK)
  async getCurrentUser(@Request() req: any) {
    try {
      const userId = req.user.sub;

      const user = await this.authService.getUserById(userId);

      return {
        status: 'success',
        data: user,
      };
    } catch (error) {
      this.logger.error(`Get user error: ${error.message}`);
      throw error;
    }
  }

  /**
   * Change password
   *
   * @param request HTTP request (contains user ID)
   * @param changePasswordDto Current and new passwords
   * @returns Success message
   */
  @Post('password/change')
  @UseGuards(JwtGuard)
  @HttpCode(HttpStatus.OK)
  async changePassword(
    @Request() req: any,
    @Body() changePasswordDto: ChangePasswordDto,
  ) {
    try {
      const userId = req.user.sub;

      await this.authService.changePassword(
        userId,
        changePasswordDto.currentPassword,
        changePasswordDto.newPassword,
      );

      return {
        status: 'success',
        message: 'Password changed successfully',
      };
    } catch (error) {
      this.logger.error(
        `Password change error: ${error.message}`,
      );
      throw error;
    }
  }

  /**
   * Request password reset
   *
   * @param requestResetDto Email address
   * @returns Success message
   */
  @Post('password/reset-request')
  @HttpCode(HttpStatus.OK)
  async requestPasswordReset(
    @Body() requestResetDto: RequestResetDto,
  ) {
    try {
      const result =
        await this.authService.requestPasswordReset(
          requestResetDto.email,
        );

      return {
        status: 'success',
        message: result,
      };
    } catch (error) {
      this.logger.error(
        `Password reset request error: ${error.message}`,
      );
      throw error;
    }
  }

  /**
   * Reset password with token
   *
   * @param resetPasswordDto Reset token and new password
   * @returns Success message
   */
  @Post('password/reset')
  @HttpCode(HttpStatus.OK)
  async resetPassword(
    @Body() resetPasswordDto: ResetPasswordDto,
  ) {
    try {
      await this.authService.resetPassword(
        resetPasswordDto.userId,
        resetPasswordDto.resetToken,
        resetPasswordDto.newPassword,
      );

      return {
        status: 'success',
        message: 'Password reset successfully',
      };
    } catch (error) {
      this.logger.error(
        `Password reset error: ${error.message}`,
      );
      throw error;
    }
  }
}

// ============================================================================
// DTOs - Data Transfer Objects
// ============================================================================

export class RegisterDto {
  email: string;
  password: string;
  name: string;
}

export class LoginDto {
  email: string;
  password: string;
}

export class RefreshTokenDto {
  refreshToken: string;
}

export class ChangePasswordDto {
  currentPassword: string;
  newPassword: string;
}

export class RequestResetDto {
  email: string;
}

export class ResetPasswordDto {
  userId: string;
  resetToken: string;
  newPassword: string;
}
