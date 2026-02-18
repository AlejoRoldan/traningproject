import {
  pgTable,
  pgEnum,
  serial,
  uuid,
  varchar,
  text,
  integer,
  timestamp,
  boolean,
  jsonb,
  uniqueIndex,
  foreignKey,
  index,
} from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';

/**
 * PostgreSQL Schema for KTP (Kaitel Training Platform)
 * Migrated from MySQL to PostgreSQL for Supabase compatibility
 */

// ============================================================================
// ENUMS
// ============================================================================

export const userRoleEnum = pgEnum('user_role', [
  'gerente',
  'supervisor',
  'coordinador',
  'analista',
  'agente',
  'admin',
]);

export const userLevelEnum = pgEnum('user_level', [
  'junior',
  'intermediate',
  'senior',
  'expert',
]);

export const scenarioCategoryEnum = pgEnum('scenario_category', [
  'informative',
  'transactional',
  'fraud',
  'money_laundering',
  'theft',
  'complaint',
  'credit',
  'digital_channels',
]);

export const simulationStatusEnum = pgEnum('simulation_status', [
  'in_progress',
  'completed',
  'abandoned',
]);

export const messageRoleEnum = pgEnum('message_role', ['agent', 'client', 'system']);

export const audioMarkerCategoryEnum = pgEnum('audio_marker_category', [
  'excellent',
  'good',
  'needs_improvement',
  'critical_error',
]);

export const improvementPlanStatusEnum = pgEnum('improvement_plan_status', [
  'active',
  'completed',
  'cancelled',
]);

export const badgeCategoryEnum = pgEnum('badge_category', [
  'empathy',
  'protocol',
  'resolution',
  'crisis',
  'speed',
  'consistency',
]);

export const badgeRarityEnum = pgEnum('badge_rarity', [
  'common',
  'rare',
  'epic',
  'legendary',
]);

export const teamStatsPeriodEnum = pgEnum('team_stats_period', [
  'daily',
  'weekly',
  'monthly',
]);

export const responseTemplateTypeEnum = pgEnum('response_template_type', [
  'opening',
  'development',
  'objection_handling',
  'closing',
  'empathy',
  'protocol',
]);

export const coachingPlanStatusEnum = pgEnum('coaching_plan_status', [
  'active',
  'completed',
  'cancelled',
]);

export const coachingAlertTypeEnum = pgEnum('coaching_alert_type', [
  'low_performance',
  'stagnation',
  'improvement',
  'milestone',
]);

export const coachingAlertSeverityEnum = pgEnum('coaching_alert_severity', [
  'low',
  'medium',
  'high',
  'critical',
]);

export const coachingAlertStatusEnum = pgEnum('coaching_alert_status', [
  'pending',
  'acknowledged',
  'resolved',
]);

export const buddyPairStatusEnum = pgEnum('buddy_pair_status', [
  'suggested',
  'accepted',
  'active',
  'completed',
  'declined',
]);

export const microLearningTypeEnum = pgEnum('micro_learning_type', [
  'video',
  'article',
  'quiz',
  'infographic',
]);

export const microLearningLevelEnum = pgEnum('micro_learning_level', [
  'basico',
  'intermedio',
  'avanzado',
  'experto',
]);

export const learningProgressStatusEnum = pgEnum('learning_progress_status', [
  'started',
  'in_progress',
  'completed',
]);

export const improvementPlanGeneratedByEnum = pgEnum('improvement_plan_generated_by', [
  'automatic',
  'supervisor',
  'trainer',
]);

// ============================================================================
// TABLES
// ============================================================================

// Users table - Core user table backing auth flow
export const users = pgTable(
  'users',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    openId: varchar('open_id', { length: 64 }).notNull().unique(),
    name: text('name'),
    email: varchar('email', { length: 320 }).unique(),
    loginMethod: varchar('login_method', { length: 64 }),
    role: userRoleEnum('role').default('agente').notNull(),
    department: varchar('department', { length: 100 }),
    supervisorId: uuid('supervisor_id'),
    level: userLevelEnum('level').default('junior'),
    points: integer('points').default(0).notNull(),
    badges: jsonb('badges'), // JSON array of badge IDs
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
    lastSignedIn: timestamp('last_signed_in', { withTimezone: true }).defaultNow().notNull(),
  },
  table => ({
    emailIdx: index('users_email_idx').on(table.email),
    openIdIdx: index('users_open_id_idx').on(table.openId),
  })
);

export type User = typeof users.$inferSelect;
export type InsertUser = typeof users.$inferInsert;

// Scenarios table - Training scenarios library
export const scenarios = pgTable(
  'scenarios',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    title: varchar('title', { length: 200 }).notNull(),
    description: text('description').notNull(),
    category: scenarioCategoryEnum('category').notNull(),
    complexity: integer('complexity').notNull(), // 1-5
    estimatedDuration: integer('estimated_duration').notNull(), // minutes
    systemPrompt: text('system_prompt').notNull(),
    clientProfile: jsonb('client_profile').notNull(), // JSON
    evaluationCriteria: jsonb('evaluation_criteria').notNull(), // JSON
    idealResponse: text('ideal_response'),
    tags: jsonb('tags'), // JSON array
    isActive: boolean('is_active').default(true).notNull(),
    createdBy: uuid('created_by'),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
  },
  table => ({
    categoryIdx: index('scenarios_category_idx').on(table.category),
    createdByIdx: index('scenarios_created_by_idx').on(table.createdBy),
  })
);

export type Scenario = typeof scenarios.$inferSelect;
export type InsertScenario = typeof scenarios.$inferInsert;

// Simulations table - Training sessions
export const simulations = pgTable(
  'simulations',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    userId: uuid('user_id').notNull(),
    scenarioId: uuid('scenario_id').notNull(),
    isPracticeMode: boolean('is_practice_mode').default(false).notNull(),
    status: simulationStatusEnum('status').default('in_progress').notNull(),
    startedAt: timestamp('started_at', { withTimezone: true }).defaultNow().notNull(),
    completedAt: timestamp('completed_at', { withTimezone: true }),
    duration: integer('duration'), // seconds
    transcript: jsonb('transcript'), // JSON array of messages
    overallScore: integer('overall_score'), // 0-100
    categoryScores: jsonb('category_scores'), // JSON object
    feedback: text('feedback'),
    strengths: jsonb('strengths'), // JSON array
    weaknesses: jsonb('weaknesses'), // JSON array
    recommendations: jsonb('recommendations'), // JSON array
    pointsEarned: integer('points_earned').default(0),
    badgesEarned: jsonb('badges_earned'), // JSON array
    audioRecordingUrl: text('audio_recording_url'), // S3 URL
    audioTranscript: text('audio_transcript'), // Whisper API transcription
    transcriptSegments: jsonb('transcript_segments'), // JSON: Whisper segments
    transcriptKeywords: jsonb('transcript_keywords'), // JSON: detected keywords
    voiceMetrics: jsonb('voice_metrics'), // JSON: speech rate, pauses, sentiment
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  },
  table => ({
    userIdIdx: index('simulations_user_id_idx').on(table.userId),
    scenarioIdIdx: index('simulations_scenario_id_idx').on(table.scenarioId),
    statusIdx: index('simulations_status_idx').on(table.status),
  })
);

export type Simulation = typeof simulations.$inferSelect;
export type InsertSimulation = typeof simulations.$inferInsert;

// Messages table - Individual messages within simulations
export const messages = pgTable(
  'messages',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    simulationId: uuid('simulation_id').notNull(),
    role: messageRoleEnum('role').notNull(),
    content: text('content').notNull(),
    timestamp: timestamp('timestamp', { withTimezone: true }).defaultNow().notNull(),
    evaluationNote: text('evaluation_note'),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  },
  table => ({
    simulationIdIdx: index('messages_simulation_id_idx').on(table.simulationId),
  })
);

export type Message = typeof messages.$inferSelect;
export type InsertMessage = typeof messages.$inferInsert;

// Audio Markers table - Temporal markers added by supervisors
export const audioMarkers = pgTable(
  'audio_markers',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    simulationId: uuid('simulation_id').notNull(),
    createdBy: uuid('created_by').notNull(),
    timestamp: integer('timestamp').notNull(), // seconds in audio
    category: audioMarkerCategoryEnum('category').notNull(),
    note: text('note'),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
  },
  table => ({
    simulationIdIdx: index('audio_markers_simulation_id_idx').on(table.simulationId),
  })
);

export type AudioMarker = typeof audioMarkers.$inferSelect;
export type InsertAudioMarker = typeof audioMarkers.$inferInsert;

// Evaluations table - Evaluation results for simulations
export const evaluations = pgTable(
  'evaluations',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    simulationId: uuid('simulation_id').notNull().unique(),
    clarity: integer('clarity'), // 0-100
    empathy: integer('empathy'), // 0-100
    responseSpeed: integer('response_speed'), // 0-100
    problemSolving: integer('problem_solving'), // 0-100
    professionalism: integer('professionalism'), // 0-100
    followUp: integer('follow_up'), // 0-100
    overallScore: integer('overall_score'), // 0-100
    feedback: text('feedback'),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  },
  table => ({
    simulationIdIdx: index('evaluations_simulation_id_idx').on(table.simulationId),
  })
);

export type Evaluation = typeof evaluations.$inferSelect;
export type InsertEvaluation = typeof evaluations.$inferInsert;

// Improvement Plans table
export const improvementPlans = pgTable(
  'improvement_plans',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    userId: uuid('user_id').notNull(),
    title: varchar('title', { length: 200 }).notNull(),
    description: text('description').notNull(),
    generatedBy: improvementPlanGeneratedByEnum('generated_by').notNull(),
    createdBy: uuid('created_by').notNull(),
    status: improvementPlanStatusEnum('status').default('active').notNull(),
    weaknessAreas: jsonb('weakness_areas'), // JSON array
    recommendedScenarios: jsonb('recommended_scenarios'), // JSON array
    goals: jsonb('goals'), // JSON array
    progress: integer('progress').default(0).notNull(), // 0-100
    startDate: timestamp('start_date', { withTimezone: true }).defaultNow().notNull(),
    targetDate: timestamp('target_date', { withTimezone: true }),
    completedAt: timestamp('completed_at', { withTimezone: true }),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
  },
  table => ({
    userIdIdx: index('improvement_plans_user_id_idx').on(table.userId),
  })
);

export type ImprovementPlan = typeof improvementPlans.$inferSelect;
export type InsertImprovementPlan = typeof improvementPlans.$inferInsert;

// Badges table - Catalog of available badges
export const badges = pgTable('badges', {
  id: uuid('id').primaryKey().defaultRandom(),
  name: varchar('name', { length: 100 }).notNull(),
  description: text('description').notNull(),
  icon: varchar('icon', { length: 50 }).notNull(),
  category: badgeCategoryEnum('category').notNull(),
  criteria: jsonb('criteria').notNull(), // JSON
  rarity: badgeRarityEnum('rarity').default('common').notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
});

export type Badge = typeof badges.$inferSelect;
export type InsertBadge = typeof badges.$inferInsert;

// User Badges table - Badges earned by users
export const userBadges = pgTable(
  'user_badges',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    userId: uuid('user_id').notNull(),
    badgeId: uuid('badge_id').notNull(),
    earnedAt: timestamp('earned_at', { withTimezone: true }).defaultNow().notNull(),
    simulationId: uuid('simulation_id'),
  },
  table => ({
    userIdIdx: index('user_badges_user_id_idx').on(table.userId),
    badgeIdIdx: index('user_badges_badge_id_idx').on(table.badgeId),
  })
);

export type UserBadge = typeof userBadges.$inferSelect;
export type InsertUserBadge = typeof userBadges.$inferInsert;

// Team Stats table - Aggregated statistics by team/department
export const teamStats = pgTable(
  'team_stats',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    department: varchar('department', { length: 100 }).notNull(),
    supervisorId: uuid('supervisor_id'),
    period: teamStatsPeriodEnum('period').notNull(),
    periodDate: timestamp('period_date', { withTimezone: true }).notNull(),
    totalSimulations: integer('total_simulations').default(0).notNull(),
    averageScore: integer('average_score'), // 0-100
    topPerformers: jsonb('top_performers'), // JSON array
    commonWeaknesses: jsonb('common_weaknesses'), // JSON array
    improvementRate: integer('improvement_rate'), // percentage
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  },
  table => ({
    departmentIdx: index('team_stats_department_idx').on(table.department),
    supervisorIdIdx: index('team_stats_supervisor_id_idx').on(table.supervisorId),
  })
);

export type TeamStat = typeof teamStats.$inferSelect;
export type InsertTeamStat = typeof teamStats.$inferInsert;

// Response Templates table - Model responses for training
export const responseTemplates = pgTable(
  'response_templates',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    category: scenarioCategoryEnum('category').notNull(),
    type: responseTemplateTypeEnum('type').notNull(),
    title: varchar('title', { length: 200 }).notNull(),
    content: text('content').notNull(),
    context: text('context'), // When to use this response
    tags: jsonb('tags'), // JSON array
    complexity: integer('complexity').notNull(), // 1-5
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
  },
  table => ({
    categoryIdx: index('response_templates_category_idx').on(table.category),
  })
);

export type ResponseTemplate = typeof responseTemplates.$inferSelect;
export type InsertResponseTemplate = typeof responseTemplates.$inferInsert;

// Team Assignments table - Assign users to teams/departments
export const teamAssignments = pgTable(
  'team_assignments',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    userId: uuid('user_id').notNull(),
    teamName: varchar('team_name', { length: 100 }).notNull(),
    department: varchar('department', { length: 100 }).notNull(),
    area: varchar('area', { length: 100 }),
    managerId: uuid('manager_id'),
    supervisorId: uuid('supervisor_id'),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
  },
  table => ({
    userIdIdx: index('team_assignments_user_id_idx').on(table.userId),
  })
);

export type TeamAssignment = typeof teamAssignments.$inferSelect;
export type InsertTeamAssignment = typeof teamAssignments.$inferInsert;

// Coaching Plans table - AI-generated personalized improvement plans
export const coachingPlans = pgTable(
  'coaching_plans',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    userId: uuid('user_id').notNull(),
    status: coachingPlanStatusEnum('status').default('active').notNull(),
    generatedAt: timestamp('generated_at', { withTimezone: true }).defaultNow().notNull(),
    expiresAt: timestamp('expires_at', { withTimezone: true }),
    weaknessAnalysis: jsonb('weakness_analysis'), // JSON
    strengthsAnalysis: jsonb('strengths_analysis'), // JSON
    priorityAreas: jsonb('priority_areas'), // JSON array
    recommendedScenarios: jsonb('recommended_scenarios'), // JSON array
    weeklyGoal: text('weekly_goal'),
    estimatedWeeks: integer('estimated_weeks'),
    completedScenarios: jsonb('completed_scenarios'), // JSON array
    progress: integer('progress').default(0).notNull(), // 0-100
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
  },
  table => ({
    userIdIdx: index('coaching_plans_user_id_idx').on(table.userId),
  })
);

export type CoachingPlan = typeof coachingPlans.$inferSelect;
export type InsertCoachingPlan = typeof coachingPlans.$inferInsert;

// Coaching Alerts table - Automatic alerts for supervisors
export const coachingAlerts = pgTable(
  'coaching_alerts',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    userId: uuid('user_id').notNull(),
    supervisorId: uuid('supervisor_id'),
    type: coachingAlertTypeEnum('type').notNull(),
    severity: coachingAlertSeverityEnum('severity').default('medium').notNull(),
    title: varchar('title', { length: 255 }).notNull(),
    message: text('message').notNull(),
    metadata: jsonb('metadata'), // JSON
    status: coachingAlertStatusEnum('status').default('pending').notNull(),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
    acknowledgedAt: timestamp('acknowledged_at', { withTimezone: true }),
    resolvedAt: timestamp('resolved_at', { withTimezone: true }),
  },
  table => ({
    userIdIdx: index('coaching_alerts_user_id_idx').on(table.userId),
    supervisorIdIdx: index('coaching_alerts_supervisor_id_idx').on(table.supervisorId),
  })
);

export type CoachingAlert = typeof coachingAlerts.$inferSelect;
export type InsertCoachingAlert = typeof coachingAlerts.$inferInsert;

// Buddy Pairs table - Pairing agents with complementary strengths
export const buddyPairs = pgTable(
  'buddy_pairs',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    agentId1: uuid('agent_id_1').notNull(),
    agentId2: uuid('agent_id_2').notNull(),
    status: buddyPairStatusEnum('status').default('suggested').notNull(),
    matchScore: integer('match_score'), // 0-100
    matchReason: text('match_reason'),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
    acceptedAt: timestamp('accepted_at', { withTimezone: true }),
    completedAt: timestamp('completed_at', { withTimezone: true }),
    sharedGoal: text('shared_goal'),
    targetWeeks: integer('target_weeks').default(4).notNull(),
  },
  table => ({
    agentId1Idx: index('buddy_pairs_agent_id_1_idx').on(table.agentId1),
    agentId2Idx: index('buddy_pairs_agent_id_2_idx').on(table.agentId2),
  })
);

export type BuddyPair = typeof buddyPairs.$inferSelect;
export type InsertBuddyPair = typeof buddyPairs.$inferInsert;

// Micro-Learning Content table
export const microLearningContent = pgTable(
  'micro_learning_content',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    title: varchar('title', { length: 255 }).notNull(),
    description: text('description'),
    type: microLearningTypeEnum('type').notNull(),
    url: varchar('url', { length: 500 }),
    duration: integer('duration'), // seconds
    thumbnail: varchar('thumbnail', { length: 500 }),
    category: scenarioCategoryEnum('category'),
    skill: varchar('skill', { length: 100 }),
    level: microLearningLevelEnum('level').default('basico').notNull(),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
    viewCount: integer('view_count').default(0).notNull(),
    avgRating: varchar('avg_rating', { length: 10 }).default('0').notNull(),
  },
  table => ({
    categoryIdx: index('micro_learning_content_category_idx').on(table.category),
  })
);

export type MicroLearningContent = typeof microLearningContent.$inferSelect;
export type InsertMicroLearningContent = typeof microLearningContent.$inferInsert;

// Learning Progress table
export const learningProgress = pgTable(
  'learning_progress',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    userId: uuid('user_id').notNull(),
    contentId: uuid('content_id').notNull(),
    status: learningProgressStatusEnum('status').default('started').notNull(),
    progressPercent: integer('progress_percent').default(0).notNull(),
    startedAt: timestamp('started_at', { withTimezone: true }).defaultNow().notNull(),
    completedAt: timestamp('completed_at', { withTimezone: true }),
    timeSpent: integer('time_spent').default(0).notNull(), // seconds
    rating: integer('rating'), // 1-5
    feedback: text('feedback'),
  },
  table => ({
    userIdIdx: index('learning_progress_user_id_idx').on(table.userId),
    contentIdIdx: index('learning_progress_content_id_idx').on(table.contentId),
  })
);

export type LearningProgress = typeof learningProgress.$inferSelect;
export type InsertLearningProgress = typeof learningProgress.$inferInsert;

// ============================================================================
// RELATIONS
// ============================================================================

export const usersRelations = relations(users, ({ many, one }) => ({
  simulations: many(simulations),
  improvementPlans: many(improvementPlans),
  userBadges: many(userBadges),
  teamAssignments: many(teamAssignments),
  coachingPlans: many(coachingPlans),
  coachingAlerts: many(coachingAlerts),
  learningProgress: many(learningProgress),
  supervisor: one(users, {
    fields: [users.supervisorId],
    references: [users.id],
  }),
}));

export const scenariosRelations = relations(scenarios, ({ many }) => ({
  simulations: many(simulations),
}));

export const simulationsRelations = relations(simulations, ({ one, many }) => ({
  user: one(users, {
    fields: [simulations.userId],
    references: [users.id],
  }),
  scenario: one(scenarios, {
    fields: [simulations.scenarioId],
    references: [scenarios.id],
  }),
  messages: many(messages),
  audioMarkers: many(audioMarkers),
  evaluation: one(evaluations),
}));

export const messagesRelations = relations(messages, ({ one }) => ({
  simulation: one(simulations, {
    fields: [messages.simulationId],
    references: [simulations.id],
  }),
}));

export const audioMarkersRelations = relations(audioMarkers, ({ one }) => ({
  simulation: one(simulations, {
    fields: [audioMarkers.simulationId],
    references: [simulations.id],
  }),
}));

export const evaluationsRelations = relations(evaluations, ({ one }) => ({
  simulation: one(simulations, {
    fields: [evaluations.simulationId],
    references: [simulations.id],
  }),
}));

export const badgesRelations = relations(badges, ({ many }) => ({
  userBadges: many(userBadges),
}));

export const userBadgesRelations = relations(userBadges, ({ one }) => ({
  user: one(users, {
    fields: [userBadges.userId],
    references: [users.id],
  }),
  badge: one(badges, {
    fields: [userBadges.badgeId],
    references: [badges.id],
  }),
}));

export const microLearningContentRelations = relations(microLearningContent, ({ many }) => ({
  learningProgress: many(learningProgress),
}));

export const learningProgressRelations = relations(learningProgress, ({ one }) => ({
  user: one(users, {
    fields: [learningProgress.userId],
    references: [users.id],
  }),
  content: one(microLearningContent, {
    fields: [learningProgress.contentId],
    references: [microLearningContent.id],
  }),
}));
