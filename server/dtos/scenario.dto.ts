import {
  IsString,
  IsEnum,
  IsOptional,
  MaxLength,
  MinLength,
  IsArray,
} from 'class-validator';

/**
 * Scenario DTOs
 *
 * Request and response data transfer objects for scenario endpoints
 */

// ============================================================================
// SCENARIO CATEGORIES
// ============================================================================

export enum ScenarioCategory {
  BILLING_DISPUTE = 'BILLING_DISPUTE',
  TECHNICAL_ISSUE = 'TECHNICAL_ISSUE',
  ACCOUNT_CLOSURE = 'ACCOUNT_CLOSURE',
  FRAUD_REPORT = 'FRAUD_REPORT',
  PAYMENT_PLAN = 'PAYMENT_PLAN',
  PRODUCT_INQUIRY = 'PRODUCT_INQUIRY',
}

export enum DifficultyLevel {
  EASY = 'EASY',
  MEDIUM = 'MEDIUM',
  HARD = 'HARD',
}

export enum PersonalityType {
  ANGRY = 'ANGRY',
  CONFUSED = 'CONFUSED',
  FRIENDLY = 'FRIENDLY',
  DEMANDING = 'DEMANDING',
}

// ============================================================================
// CREATE/UPDATE SCENARIO
// ============================================================================

/**
 * Create a new scenario
 */
export class CreateScenarioDto {
  /**
   * Scenario title
   */
  @IsString()
  @MinLength(5)
  @MaxLength(200)
  title: string;

  /**
   * Detailed scenario description
   */
  @IsString()
  @MinLength(20)
  @MaxLength(5000)
  description: string;

  /**
   * Scenario category
   */
  @IsEnum(ScenarioCategory)
  category: ScenarioCategory;

  /**
   * Difficulty level
   */
  @IsEnum(DifficultyLevel)
  difficulty: DifficultyLevel;

  /**
   * AI client personality type
   */
  @IsEnum(PersonalityType)
  personality: PersonalityType;

  /**
   * Expected learning objectives
   */
  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  objectives?: string[];

  /**
   * Key phrases to listen for
   */
  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  keyPhrases?: string[];

  /**
   * Common mistakes to avoid
   */
  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  commonMistakes?: string[];
}

/**
 * Update scenario
 */
export class UpdateScenarioDto {
  /**
   * Scenario title
   */
  @IsString()
  @MinLength(5)
  @MaxLength(200)
  @IsOptional()
  title?: string;

  /**
   * Detailed scenario description
   */
  @IsString()
  @MinLength(20)
  @MaxLength(5000)
  @IsOptional()
  description?: string;

  /**
   * Scenario category
   */
  @IsEnum(ScenarioCategory)
  @IsOptional()
  category?: ScenarioCategory;

  /**
   * Difficulty level
   */
  @IsEnum(DifficultyLevel)
  @IsOptional()
  difficulty?: DifficultyLevel;

  /**
   * AI client personality type
   */
  @IsEnum(PersonalityType)
  @IsOptional()
  personality?: PersonalityType;

  /**
   * Expected learning objectives
   */
  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  objectives?: string[];

  /**
   * Key phrases to listen for
   */
  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  keyPhrases?: string[];

  /**
   * Common mistakes to avoid
   */
  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  commonMistakes?: string[];
}

// ============================================================================
// RESPONSE DTOs
// ============================================================================

/**
 * Scenario response
 */
export class ScenarioResponseDto {
  /**
   * Scenario ID
   */
  id: string;

  /**
   * Scenario title
   */
  title: string;

  /**
   * Scenario description
   */
  description: string;

  /**
   * Scenario category
   */
  category: ScenarioCategory;

  /**
   * Difficulty level
   */
  difficulty: DifficultyLevel;

  /**
   * AI client personality
   */
  personality: PersonalityType;

  /**
   * Learning objectives
   */
  objectives: string[];

  /**
   * Key phrases to use
   */
  keyPhrases: string[];

  /**
   * Common mistakes to avoid
   */
  commonMistakes: string[];

  /**
   * Creation timestamp
   */
  createdAt: Date;

  /**
   * Update timestamp
   */
  updatedAt: Date;
}

/**
 * Scenario list response
 */
export class ScenarioListDto {
  /**
   * Array of scenarios
   */
  data: ScenarioResponseDto[];

  /**
   * Total count
   */
  total: number;
}
