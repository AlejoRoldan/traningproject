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
 * Feedback DTOs
 *
 * Request and response data transfer objects for feedback endpoints
 */

// ============================================================================
// CREATE/SUBMIT FEEDBACK
// ============================================================================

/**
 * Submit feedback on a training session
 */
export class SubmitFeedbackDto {
  /**
   * Training session ID
   */
  @IsString()
  sessionId: string;

  /**
   * Empathy score (1-10)
   */
  @IsNumber()
  @Min(1)
  @Max(10)
  empathyScore: number;

  /**
   * Clarity score (1-10)
   */
  @IsNumber()
  @Min(1)
  @Max(10)
  clarityScore: number;

  /**
   * Protocol adherence score (1-10)
   */
  @IsNumber()
  @Min(1)
  @Max(10)
  protocolScore: number;

  /**
   * Problem resolution score (1-10)
   */
  @IsNumber()
  @Min(1)
  @Max(10)
  resolutionScore: number;

  /**
   * Confidence score (1-10)
   */
  @IsNumber()
  @Min(1)
  @Max(10)
  confidenceScore: number;

  /**
   * Overall performance score (1-10)
   */
  @IsNumber()
  @Min(1)
  @Max(10)
  overallScore: number;

  /**
   * Key strengths demonstrated
   */
  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  strengths?: string[];

  /**
   * Areas for improvement
   */
  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  weaknesses?: string[];

  /**
   * Specific actionable recommendations
   */
  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  recommendations?: string[];

  /**
   * Detailed feedback text
   */
  @IsString()
  @IsOptional()
  detailedFeedback?: string;

  /**
   * Keywords effectively used
   */
  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  keywordsUsed?: string[];

  /**
   * Important keywords missed
   */
  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  missedKeywords?: string[];

  /**
   * Visibility level for feedback
   */
  @IsEnum(['PRIVATE', 'SUPERVISOR', 'PUBLIC'])
  @IsOptional()
  visibility?: 'PRIVATE' | 'SUPERVISOR' | 'PUBLIC';
}

// ============================================================================
// QUERY DTOs
// ============================================================================

/**
 * Query parameters for listing feedback
 */
export class FeedbackQueryDto {
  /**
   * Page number
   */
  @IsOptional()
  page?: number = 1;

  /**
   * Results per page
   */
  @IsOptional()
  limit?: number = 10;

  /**
   * Filter by minimum score
   */
  @IsNumber()
  @Min(1)
  @Max(10)
  @IsOptional()
  minScore?: number;

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

// ============================================================================
// RESPONSE DTOs
// ============================================================================

/**
 * Feedback response
 */
export class FeedbackResponseDto {
  /**
   * Feedback ID
   */
  id: string;

  /**
   * Session ID
   */
  sessionId: string;

  /**
   * Agent/user ID
   */
  agentId: string;

  /**
   * Supervisor who provided feedback
   */
  supervisorId?: string;

  /**
   * Empathy score (1-10)
   */
  empathyScore: number;

  /**
   * Clarity score (1-10)
   */
  clarityScore: number;

  /**
   * Protocol score (1-10)
   */
  protocolScore: number;

  /**
   * Resolution score (1-10)
   */
  resolutionScore: number;

  /**
   * Confidence score (1-10)
   */
  confidenceScore: number;

  /**
   * Overall score (1-10)
   */
  overallScore: number;

  /**
   * Strengths list
   */
  strengths: string[];

  /**
   * Weaknesses list
   */
  weaknesses: string[];

  /**
   * Recommendations
   */
  recommendations: string[];

  /**
   * Detailed feedback text
   */
  detailedFeedback: string;

  /**
   * Keywords used
   */
  keywordsUsed: string[];

  /**
   * Keywords missed
   */
  missedKeywords: string[];

  /**
   * Feedback visibility
   */
  visibility: 'PRIVATE' | 'SUPERVISOR' | 'PUBLIC';

  /**
   * Creation timestamp
   */
  createdAt: Date;

  /**
   * Last update timestamp
   */
  updatedAt: Date;
}

/**
 * Feedback statistics for an agent
 */
export class FeedbackStatsDto {
  /**
   * Total feedback entries
   */
  totalFeedback: number;

  /**
   * Average empathy score
   */
  avgEmpathyScore: number;

  /**
   * Average clarity score
   */
  avgClarityScore: number;

  /**
   * Average protocol score
   */
  avgProtocolScore: number;

  /**
   * Average resolution score
   */
  avgResolutionScore: number;

  /**
   * Average confidence score
   */
  avgConfidenceScore: number;

  /**
   * Average overall score
   */
  avgOverallScore: number;

  /**
   * Most common strengths
   */
  topStrengths: Array<{ text: string; count: number }>;

  /**
   * Most common weaknesses
   */
  topWeaknesses: Array<{ text: string; count: number }>;

  /**
   * Most frequently recommended areas
   */
  topRecommendations: Array<{ text: string; count: number }>;
}

/**
 * Paginated feedback response
 */
export class PaginatedFeedbackDto {
  /**
   * Array of feedback entries
   */
  data: FeedbackResponseDto[];

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
