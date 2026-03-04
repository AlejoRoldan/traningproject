import {
  IsEmail,
  IsString,
  MinLength,
  MaxLength,
  Matches,
  IsEnum,
  IsOptional,
} from 'class-validator';
import { UserRole } from '@prisma/client';

/**
 * Authentication DTOs
 *
 * Request and response data transfer objects for auth endpoints
 */

// ============================================================================
// REGISTRATION
// ============================================================================

/**
 * User registration request
 */
export class RegisterDto {
  /**
   * User email address (must be unique)
   */
  @IsEmail()
  email: string;

  /**
   * User full name
   */
  @IsString()
  @MinLength(2)
  @MaxLength(100)
  name: string;

  /**
   * User password (min 8 chars, must contain uppercase, lowercase, number)
   */
  @IsString()
  @MinLength(8)
  @Matches(
    /^(?=.*[A-Z])(?=.*[a-z])(?=.*\d)[A-Za-z\d@$!%*?&]{8,}$/,
    {
      message:
        'Password must contain uppercase, lowercase, and number',
    },
  )
  password: string;

  /**
   * User role (defaults to AGENT)
   */
  @IsEnum(UserRole)
  @IsOptional()
  role?: UserRole = UserRole.AGENT;
}

// ============================================================================
// LOGIN
// ============================================================================

/**
 * User login request
 */
export class LoginDto {
  /**
   * User email address
   */
  @IsEmail()
  email: string;

  /**
   * User password
   */
  @IsString()
  @MinLength(8)
  password: string;
}

// ============================================================================
// PASSWORD MANAGEMENT
// ============================================================================

/**
 * Password change request
 */
export class ChangePasswordDto {
  /**
   * Current password for verification
   */
  @IsString()
  @MinLength(8)
  currentPassword: string;

  /**
   * New password
   */
  @IsString()
  @MinLength(8)
  @Matches(
    /^(?=.*[A-Z])(?=.*[a-z])(?=.*\d)[A-Za-z\d@$!%*?&]{8,}$/,
    {
      message:
        'Password must contain uppercase, lowercase, and number',
    },
  )
  newPassword: string;
}

/**
 * Password reset request
 */
export class RequestPasswordResetDto {
  /**
   * Email address associated with account
   */
  @IsEmail()
  email: string;
}

/**
 * Password reset completion
 */
export class ResetPasswordDto {
  /**
   * Reset token from email
   */
  @IsString()
  resetToken: string;

  /**
   * New password
   */
  @IsString()
  @MinLength(8)
  @Matches(
    /^(?=.*[A-Z])(?=.*[a-z])(?=.*\d)[A-Za-z\d@$!%*?&]{8,}$/,
    {
      message:
        'Password must contain uppercase, lowercase, and number',
    },
  )
  newPassword: string;
}

/**
 * Token refresh request
 */
export class RefreshTokenDto {
  /**
   * Refresh token from previous login
   */
  @IsString()
  refreshToken: string;
}

// ============================================================================
// RESPONSE DTOs
// ============================================================================

/**
 * Authentication response with user and tokens
 */
export class AuthResponseDto {
  /**
   * Authenticated user data
   */
  user: {
    id: string;
    email: string;
    name: string;
    role: UserRole;
    status: string;
  };

  /**
   * JWT tokens
   */
  tokens: {
    accessToken: string;
    refreshToken?: string;
    tokenType: string;
    expiresIn: number;
  };
}

/**
 * Token response
 */
export class TokenResponseDto {
  /**
   * JWT access token
   */
  accessToken: string;

  /**
   * JWT refresh token (optional)
   */
  refreshToken?: string;

  /**
   * Token type (Bearer)
   */
  tokenType: string;

  /**
   * Token expiration in seconds
   */
  expiresIn: number;
}
