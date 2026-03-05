import {
  IsString,
  IsOptional,
  IsNumber,
  Min,
  Max,
  IsArray,
  IsEnum,
} from 'class-validator';

/**
 * Session DTOs
 *
 * Request and response data transfer objects for training session endpoints
 */

// ============================================================================
// CREATE/START SESSION
// ============================================================================

/**
 * Start a new training session
 */
export class StartSessionDto {
  /**
   * Scenario ID to use for this session
   */
  @IsString()
  scenarioId: string;

  /**
   * Optional supervisor notes
   */
  @IsString()
  @IsOptional()
  notes?: string;
}

// ============================================================================
// QUERY DTOs
// ============================================================================

/**
 * Query parameters for listing sessions
 */
export class ListSessionsQueryDto {
  /**
   * Page number (1-indexed)
   */
  @IsNumber()
  @Min(1)
  @IsOptional()
  page?: number = 1;

  /**
   * Results per page
   */
  @IsNumber()
  @Min(1)
  @Max(100)
  @IsOptional()
  limit?: number = 10;

  /**
   * Filter by session status (INITIALIZED, COMPLETED, etc)
   */
  @IsString()
  @IsOptional()
  status?: string;

  /**
   * Filter by date range (YYYY-MM-DD)
   */
  @IsString()
  @IsOptional()
  from?: string;

  /**
   * Filter by date range (YYYY-MM-DD)
   */
  @IsString()
  @IsOptional()
  to?: string;
}

/**
 * Query parameters for leaderboard
 */
export class LeaderboardQueryDto {
  /**
   * Number of top agents to return
   */
  @IsNumber()
  @Min(1)
  @Max(1000)
  @IsOptional()
  limit?: number = 10;

  /**
   * Sort direction
   */
  @IsString()
  @IsOptional()
  sortBy?: 'xp' | 'level' | 'completionRate';
}

// ============================================================================
// COMPLETE SESSION
// ============================================================================

/**
 * Complete a training session
 */
export class CompleteSessionDto {
  /**
   * Session end status
   */
  @IsEnum(['COMPLETED', 'ABANDONED'])
  status: 'COMPLETED' | 'ABANDONED';

  /**
   * Supervisor notes (optional)
   */
  @IsString()
  @IsOptional()
  supervisorNotes?: string;
}

// ============================================================================
// RESPONSE DTOs
// ============================================================================

/**
 * Training session response
 */
export class SessionResponseDto {
  /**
   * Session ID
   */
  id: string;

  /**
   * Agent/user ID
   */
  agentId: string;

  /**
   * Scenario ID
   */
  scenarioId: string;

  /**
   * Session status
   */
  status: string;

  /**
   * Overall evaluation score (if completed)
   */
  overallScore?: number;

  /**
   * Session creation timestamp
   */
  createdAt: Date;

  /**
   * Session completion timestamp
   */
  completedAt?: Date;

  /**
   * Duration in seconds
   */
  durationSeconds?: number;
}

/**
 * Session with transcript
 */
export class SessionWithTranscriptDto extends SessionResponseDto {
  /**
   * Full conversation transcript
   */
  transcript: Array<{
    role: 'agent' | 'client';
    content: string;
    timestamp: Date;
  }>;
}

/**
 * Session statistics
 */
export class SessionStatsDto {
  /**
   * Total sessions
   */
  totalSessions: number;

  /**
   * Completed sessions
   */
  completedSessions: number;

  /**
   * Average score
   */
  averageScore: number;

  /**
   * Best score
   */
  bestScore: number;

  /**
   * Completion rate percentage
   */
  completionRate: number;
}

/**
 * Paginated sessions response
 */
export class PaginatedSessionsDto {
  /**
   * Array of sessions
   */
  data: SessionResponseDto[];

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

  /**
   * Total pages
   */
  pages: number;
}
