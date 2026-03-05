import {
  IsString,
  IsOptional,
  IsEnum,
  IsEmail,
  MinLength,
  MaxLength,
} from 'class-validator';
import { UserRole, UserStatus } from '@prisma/client';

/**
 * User DTOs
 *
 * Request and response data transfer objects for user endpoints
 */

// ============================================================================
// UPDATE PROFILE
// ============================================================================

/**
 * Update user profile
 */
export class UpdateProfileDto {
  /**
   * User full name
   */
  @IsString()
  @MinLength(2)
  @MaxLength(100)
  @IsOptional()
  name?: string;

  /**
   * Department or team
   */
  @IsString()
  @MaxLength(100)
  @IsOptional()
  department?: string;

  /**
   * Phone number
   */
  @IsString()
  @MaxLength(20)
  @IsOptional()
  phone?: string;

  /**
   * Profile picture URL
   */
  @IsString()
  @IsOptional()
  profilePictureUrl?: string;
}

// ============================================================================
// ADMIN OPERATIONS
// ============================================================================

/**
 * Update user role and status (admin only)
 */
export class UpdateUserAdminDto {
  /**
   * User role
   */
  @IsEnum(UserRole)
  @IsOptional()
  role?: UserRole;

  /**
   * Account status
   */
  @IsEnum(UserStatus)
  @IsOptional()
  status?: UserStatus;

  /**
   * User level (0-100)
   */
  @IsOptional()
  level?: number;

  /**
   * Department
   */
  @IsString()
  @MaxLength(100)
  @IsOptional()
  department?: string;

  /**
   * Supervisor ID (for agents)
   */
  @IsString()
  @IsOptional()
  supervisorId?: string;
}

// ============================================================================
// RESPONSE DTOs
// ============================================================================

/**
 * User profile response
 */
export class UserProfileDto {
  /**
   * User ID
   */
  id: string;

  /**
   * Email address
   */
  email: string;

  /**
   * Full name
   */
  name: string;

  /**
   * User role
   */
  role: UserRole;

  /**
   * Account status
   */
  status: UserStatus;

  /**
   * User level (1-100)
   */
  level: number;

  /**
   * Experience points
   */
  experiencePoints: number;

  /**
   * XP progress in current level
   */
  currentLevelXP: number;

  /**
   * Department
   */
  department?: string;

  /**
   * Phone number
   */
  phone?: string;

  /**
   * Profile picture URL
   */
  profilePictureUrl?: string;

  /**
   * Last login timestamp
   */
  lastLoginAt?: Date;

  /**
   * Account creation timestamp
   */
  createdAt: Date;

  /**
   * Last profile update
   */
  updatedAt: Date;
}

/**
 * User list response (admin)
 */
export class UserListDto {
  /**
   * Array of users
   */
  data: UserProfileDto[];

  /**
   * Total count
   */
  total: number;

  /**
   * Current page
   */
  page: number;

  /**
   * Results per page
   */
  limit: number;
}

/**
 * User statistics
 */
export class UserStatsDto {
  /**
   * Total users
   */
  totalUsers: number;

  /**
   * Active users
   */
  activeUsers: number;

  /**
   * Total agents
   */
  totalAgents: number;

  /**
   * Total supervisors
   */
  totalSupervisors: number;

  /**
   * Total admins
   */
  totalAdmins: number;
}

/**
 * Leaderboard entry
 */
export class LeaderboardEntryDto {
  /**
   * User ID
   */
  id: string;

  /**
   * User name
   */
  name: string;

  /**
   * User level
   */
  level: number;

  /**
   * Total experience points
   */
  experiencePoints: number;

  /**
   * Current level XP
   */
  currentLevelXP: number;

  /**
   * Department
   */
  department?: string;

  /**
   * User rank on leaderboard
   */
  rank: number;
}
