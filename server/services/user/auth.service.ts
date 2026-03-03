import {
  Injectable,
  Logger,
  BadRequestException,
  UnauthorizedException,
  ConflictException,
  InternalServerErrorException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { PrismaService } from '../../database/prisma.service';
import { RedisService } from '../../cache/redis.service';
import { User, UserRole, UserStatus } from '@prisma/client';

/**
 * Authentication Service
 *
 * Manages user authentication and authorization:
 * - User registration and login
 * - JWT token generation and validation
 * - Password hashing and verification
 * - Session management
 * - Token refresh logic
 * - User roles and permissions
 *
 * Security Features:
 * - Bcrypt password hashing (12 rounds)
 * - JWT with expiration
 * - Token blacklisting
 * - Rate limiting ready
 * - Secure password reset
 */
@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);
  private readonly BCRYPT_ROUNDS = 12;
  private readonly TOKEN_EXPIRY = '24h';
  private readonly REFRESH_TOKEN_EXPIRY = '7d';

  constructor(
    private prisma: PrismaService,
    private jwtService: JwtService,
    private redis: RedisService,
  ) {}

  /**
   * Register a new user
   *
   * @param email User email
   * @param password Raw password
   * @param name User full name
   * @param role User role (default: AGENT)
   * @returns User and tokens
   */
  async register(
    email: string,
    password: string,
    name: string,
    role: UserRole = UserRole.AGENT,
  ): Promise<AuthResponse> {
    try {
      // Validate input
      this.validateEmail(email);
      this.validatePassword(password);

      if (!name || name.trim().length === 0) {
        throw new BadRequestException('Name is required');
      }

      // Check if user exists
      const existingUser =
        await this.prisma.user.findUnique({
          where: { email },
        });

      if (existingUser) {
        throw new ConflictException(
          'User with this email already exists',
        );
      }

      // Hash password
      const passwordHash = await bcrypt.hash(
        password,
        this.BCRYPT_ROUNDS,
      );

      // Create user
      const user = await this.prisma.user.create({
        data: {
          email,
          passwordHash,
          name,
          role,
          status: UserStatus.ACTIVE,
        },
      });

      this.logger.log(`User registered: ${email}`);

      // Generate tokens
      const tokens = await this.generateTokens(user);

      // Return safe user data (no password hash)
      return {
        user: this.sanitizeUser(user),
        tokens,
      };
    } catch (error) {
      this.logger.error(`Registration error: ${error.message}`);
      throw error;
    }
  }

  /**
   * Login user
   *
   * @param email User email
   * @param password Raw password
   * @returns User and tokens on success
   */
  async login(
    email: string,
    password: string,
  ): Promise<AuthResponse> {
    try {
      // Find user
      const user = await this.prisma.user.findUnique({
        where: { email },
      });

      if (!user) {
        throw new UnauthorizedException(
          'Invalid email or password',
        );
      }

      // Check status
      if (user.status !== UserStatus.ACTIVE) {
        throw new UnauthorizedException(
          'User account is not active',
        );
      }

      // Verify password
      const isValid = await bcrypt.compare(
        password,
        user.passwordHash,
      );

      if (!isValid) {
        this.logger.warn(`Failed login attempt: ${email}`);
        throw new UnauthorizedException(
          'Invalid email or password',
        );
      }

      // Update last login
      await this.prisma.user.update({
        where: { id: user.id },
        data: { lastLoginAt: new Date() },
      });

      // Generate tokens
      const tokens = await this.generateTokens(user);

      this.logger.log(`User logged in: ${email}`);

      return {
        user: this.sanitizeUser(user),
        tokens,
      };
    } catch (error) {
      this.logger.error(`Login error: ${error.message}`);
      throw error;
    }
  }

  /**
   * Validate JWT token
   *
   * @param token JWT token
   * @returns Decoded token payload
   */
  async validateToken(token: string): Promise<TokenPayload> {
    try {
      // Check if token is blacklisted
      const isBlacklisted = await this.redis.get(
        `blacklist:${token}`,
      );
      if (isBlacklisted) {
        throw new UnauthorizedException(
          'Token has been revoked',
        );
      }

      // Verify token
      const payload = this.jwtService.verify<TokenPayload>(
        token,
      );

      return payload;
    } catch (error) {
      if (error.name === 'TokenExpiredError') {
        throw new UnauthorizedException('Token expired');
      }

      if (error.name === 'JsonWebTokenError') {
        throw new UnauthorizedException('Invalid token');
      }

      throw new UnauthorizedException(
        'Token validation failed',
      );
    }
  }

  /**
   * Refresh access token
   *
   * @param refreshToken Refresh token
   * @returns New access token
   */
  async refreshToken(
    refreshToken: string,
  ): Promise<TokenResponse> {
    try {
      const payload =
        this.jwtService.verify<TokenPayload>(refreshToken, {
          ignoreExpiration: false,
        });

      if (payload.type !== 'refresh') {
        throw new UnauthorizedException(
          'Invalid token type',
        );
      }

      // Get user from database
      const user = await this.prisma.user.findUnique({
        where: { id: payload.sub },
      });

      if (!user || user.status !== UserStatus.ACTIVE) {
        throw new UnauthorizedException(
          'User not found or inactive',
        );
      }

      // Generate new access token
      const newAccessToken = this.jwtService.sign(
        {
          sub: user.id,
          email: user.email,
          role: user.role,
          type: 'access',
        },
        { expiresIn: this.TOKEN_EXPIRY },
      );

      return {
        accessToken: newAccessToken,
        tokenType: 'Bearer',
        expiresIn: this.getExpirySeconds(this.TOKEN_EXPIRY),
      };
    } catch (error) {
      this.logger.error(
        `Token refresh error: ${error.message}`,
      );
      throw new UnauthorizedException('Invalid refresh token');
    }
  }

  /**
   * Logout user (revoke token)
   *
   * @param token Token to revoke
   */
  async logout(token: string): Promise<void> {
    try {
      const payload = this.jwtService.decode(token);

      if (!payload || !payload.exp) {
        throw new BadRequestException('Invalid token');
      }

      // Add token to blacklist
      const ttl = payload.exp - Math.floor(Date.now() / 1000);
      if (ttl > 0) {
        await this.redis.set(
          `blacklist:${token}`,
          'true',
          ttl,
        );
      }

      this.logger.log('User logged out');
    } catch (error) {
      this.logger.error(`Logout error: ${error.message}`);
      throw error;
    }
  }

  /**
   * Change user password
   *
   * @param userId User ID
   * @param currentPassword Current password
   * @param newPassword New password
   */
  async changePassword(
    userId: string,
    currentPassword: string,
    newPassword: string,
  ): Promise<void> {
    try {
      const user = await this.prisma.user.findUnique({
        where: { id: userId },
      });

      if (!user) {
        throw new BadRequestException('User not found');
      }

      // Verify current password
      const isValid = await bcrypt.compare(
        currentPassword,
        user.passwordHash,
      );

      if (!isValid) {
        throw new UnauthorizedException(
          'Current password is incorrect',
        );
      }

      // Validate new password
      this.validatePassword(newPassword);

      // Hash new password
      const newPasswordHash = await bcrypt.hash(
        newPassword,
        this.BCRYPT_ROUNDS,
      );

      // Update password
      await this.prisma.user.update({
        where: { id: userId },
        data: { passwordHash: newPasswordHash },
      });

      this.logger.log(`Password changed for user ${userId}`);
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
   * @param email User email
   * @returns Reset token (in production, send via email)
   */
  async requestPasswordReset(email: string): Promise<string> {
    try {
      const user = await this.prisma.user.findUnique({
        where: { email },
      });

      if (!user) {
        // Don't reveal if email exists (security)
        this.logger.log(`Password reset requested for ${email}`);
        return 'Reset instructions sent if email exists';
      }

      // Generate reset token
      const resetToken = this.jwtService.sign(
        {
          sub: user.id,
          type: 'reset',
        },
        { expiresIn: '1h' },
      );

      // Store reset token in Redis
      await this.redis.set(
        `reset:${user.id}`,
        resetToken,
        3600, // 1 hour
      );

      // In production, send email with reset link
      this.logger.log(
        `Password reset token generated for ${email}`,
      );

      return resetToken;
    } catch (error) {
      this.logger.error(
        `Password reset request error: ${error.message}`,
      );
      throw new InternalServerErrorException(
        'Failed to process password reset request',
      );
    }
  }

  /**
   * Reset password with token
   *
   * @param userId User ID
   * @param resetToken Reset token
   * @param newPassword New password
   */
  async resetPassword(
    userId: string,
    resetToken: string,
    newPassword: string,
  ): Promise<void> {
    try {
      // Verify reset token
      const storedToken = await this.redis.get(
        `reset:${userId}`,
      );

      if (!storedToken || storedToken !== resetToken) {
        throw new UnauthorizedException(
          'Invalid or expired reset token',
        );
      }

      // Validate new password
      this.validatePassword(newPassword);

      // Hash new password
      const passwordHash = await bcrypt.hash(
        newPassword,
        this.BCRYPT_ROUNDS,
      );

      // Update password
      await this.prisma.user.update({
        where: { id: userId },
        data: { passwordHash },
      });

      // Remove reset token
      await this.redis.delete(`reset:${userId}`);

      this.logger.log(`Password reset for user ${userId}`);
    } catch (error) {
      this.logger.error(
        `Password reset error: ${error.message}`,
      );
      throw error;
    }
  }

  /**
   * Get user by ID
   *
   * @param userId User ID
   * @returns User data without password
   */
  async getUserById(userId: string): Promise<SafeUser> {
    try {
      const user = await this.prisma.user.findUnique({
        where: { id: userId },
      });

      if (!user) {
        throw new BadRequestException('User not found');
      }

      return this.sanitizeUser(user);
    } catch (error) {
      this.logger.error(`Get user error: ${error.message}`);
      throw error;
    }
  }

  /**
   * Check if user has role
   *
   * @param userId User ID
   * @param roles Required roles
   * @returns true if user has one of the roles
   */
  async hasRole(
    userId: string,
    roles: UserRole[],
  ): Promise<boolean> {
    try {
      const user = await this.prisma.user.findUnique({
        where: { id: userId },
      });

      if (!user) {
        return false;
      }

      return roles.includes(user.role);
    } catch (error) {
      this.logger.error(`Role check error: ${error.message}`);
      return false;
    }
  }

  // ============================================================================
  // PRIVATE HELPERS
  // ============================================================================

  /**
   * Generate JWT tokens (access + refresh)
   */
  private async generateTokens(user: User): Promise<TokenResponse> {
    const payload: TokenPayload = {
      sub: user.id,
      email: user.email,
      role: user.role,
      type: 'access',
    };

    const accessToken = this.jwtService.sign(payload, {
      expiresIn: this.TOKEN_EXPIRY,
    });

    const refreshPayload: TokenPayload = {
      ...payload,
      type: 'refresh',
    };

    const refreshToken = this.jwtService.sign(
      refreshPayload,
      { expiresIn: this.REFRESH_TOKEN_EXPIRY },
    );

    return {
      accessToken,
      refreshToken,
      tokenType: 'Bearer',
      expiresIn: this.getExpirySeconds(this.TOKEN_EXPIRY),
    };
  }

  /**
   * Convert expiry string to seconds
   */
  private getExpirySeconds(expiry: string): number {
    const match = expiry.match(/(\d+)([hdm])/);
    if (!match) return 86400; // 24 hours default

    const value = parseInt(match[1], 10);
    const unit = match[2];

    switch (unit) {
      case 'h':
        return value * 3600;
      case 'd':
        return value * 86400;
      case 'm':
        return value * 60;
      default:
        return 86400;
    }
  }

  /**
   * Validate email format
   */
  private validateEmail(email: string): void {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    if (!email || !emailRegex.test(email)) {
      throw new BadRequestException('Invalid email format');
    }
  }

  /**
   * Validate password strength
   *
   * Requirements:
   * - At least 8 characters
   * - At least one uppercase letter
   * - At least one lowercase letter
   * - At least one number
   */
  private validatePassword(password: string): void {
    if (!password || password.length < 8) {
      throw new BadRequestException(
        'Password must be at least 8 characters',
      );
    }

    if (!/[A-Z]/.test(password)) {
      throw new BadRequestException(
        'Password must contain an uppercase letter',
      );
    }

    if (!/[a-z]/.test(password)) {
      throw new BadRequestException(
        'Password must contain a lowercase letter',
      );
    }

    if (!/\d/.test(password)) {
      throw new BadRequestException(
        'Password must contain a number',
      );
    }
  }

  /**
   * Remove sensitive data from user object
   */
  private sanitizeUser(user: User): SafeUser {
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { passwordHash, ...safeUser } = user;
    return safeUser as SafeUser;
  }
}

// ============================================================================
// TYPES
// ============================================================================

export interface AuthResponse {
  user: SafeUser;
  tokens: TokenResponse;
}

export interface TokenResponse {
  accessToken: string;
  refreshToken?: string;
  tokenType: string;
  expiresIn: number;
}

export interface TokenPayload {
  sub: string;
  email: string;
  role: UserRole;
  type: 'access' | 'refresh' | 'reset';
  iat?: number;
  exp?: number;
}

export type SafeUser = Omit<User, 'passwordHash'>;
