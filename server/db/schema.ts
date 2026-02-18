import { int, mysqlEnum, mysqlTable, text, timestamp, varchar } from "drizzle-orm/mysql-core";

/**
 * Core user table backing auth flow.
 * Extend this file with additional tables as your product grows.
 * Columns use camelCase to match both database fields and generated types.
 */
export const users = mysqlTable("users", {
  id: int("id").autoincrement().primaryKey(),
  openId: varchar("openId", { length: 64 }).notNull().unique(),
  name: text("name"),
  email: varchar("email", { length: 320 }),
  loginMethod: varchar("loginMethod", { length: 64 }),
  role: mysqlEnum("role", ["gerente", "supervisor", "coordinador", "analista", "agente", "admin"]).default("agente").notNull(),
  department: varchar("department", { length: 100 }),
  supervisorId: int("supervisorId"),
  level: mysqlEnum("level", ["junior", "intermediate", "senior", "expert"]).default("junior"),
  points: int("points").default(0).notNull(),
  badges: text("badges"), // JSON array of badge IDs
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  lastSignedIn: timestamp("lastSignedIn").defaultNow().notNull(),
});

export type User = typeof users.$inferSelect;
export type InsertUser = typeof users.$inferInsert;

// Scenarios table - Training scenarios library
export const scenarios = mysqlTable("scenarios", {
  id: int("id").autoincrement().primaryKey(),
  title: varchar("title", { length: 200 }).notNull(),
  description: text("description").notNull(),
  category: mysqlEnum("category", [
    "informative",
    "transactional",
    "fraud",
    "money_laundering",
    "theft",
    "complaint",
    "credit",
    "digital_channels"
  ]).notNull(),
  complexity: int("complexity").notNull(), // 1-5
  estimatedDuration: int("estimatedDuration").notNull(), // minutes
  systemPrompt: text("systemPrompt").notNull(),
  clientProfile: text("clientProfile").notNull(), // JSON
  evaluationCriteria: text("evaluationCriteria").notNull(), // JSON
  idealResponse: text("idealResponse"),
  tags: text("tags"), // JSON array
  isActive: int("isActive").default(1).notNull(), // boolean as int
  createdBy: int("createdBy"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type Scenario = typeof scenarios.$inferSelect;
export type InsertScenario = typeof scenarios.$inferInsert;

// Simulations table - Training sessions
export const simulations = mysqlTable("simulations", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  scenarioId: int("scenarioId").notNull(),
  isPracticeMode: int("isPracticeMode").default(0).notNull(), // boolean: 1 = practice (no evaluation), 0 = normal
  status: mysqlEnum("status", ["in_progress", "completed", "abandoned"]).default("in_progress").notNull(),
  startedAt: timestamp("startedAt").defaultNow().notNull(),
  completedAt: timestamp("completedAt"),
  duration: int("duration"), // seconds
  transcript: text("transcript"), // JSON array of messages
  overallScore: int("overallScore"), // 0-100
  categoryScores: text("categoryScores"), // JSON object
  feedback: text("feedback"),
  strengths: text("strengths"), // JSON array
  weaknesses: text("weaknesses"), // JSON array
  recommendations: text("recommendations"), // JSON array
  pointsEarned: int("pointsEarned").default(0),
  badgesEarned: text("badgesEarned"), // JSON array
  audioRecordingUrl: text("audioRecordingUrl"), // S3 URL of audio recording
  audioTranscript: text("audioTranscript"), // Whisper API transcription (full text)
  transcriptSegments: text("transcriptSegments"), // JSON: Whisper segments with timestamps
  transcriptKeywords: text("transcriptKeywords"), // JSON: detected keywords
  voiceMetrics: text("voiceMetrics"), // JSON: speech rate, pauses, sentiment, etc.
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type Simulation = typeof simulations.$inferSelect;
export type InsertSimulation = typeof simulations.$inferInsert;

/**
 * Audio Markers - Temporal markers added by supervisors during playback
 */
export const audioMarkers = mysqlTable("audio_markers", {
  id: int("id").autoincrement().primaryKey(),
  simulationId: int("simulationId").notNull(),
  createdBy: int("createdBy").notNull(), // userId of supervisor/trainer
  timestamp: int("timestamp").notNull(), // seconds in audio
  category: mysqlEnum("category", ["excellent", "good", "needs_improvement", "critical_error"]).notNull(),
  note: text("note"), // Optional comment
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type AudioMarker = typeof audioMarkers.$inferSelect;
export type InsertAudioMarker = typeof audioMarkers.$inferInsert;

// Messages table - Individual messages within simulations
export const messages = mysqlTable("messages", {
  id: int("id").autoincrement().primaryKey(),
  simulationId: int("simulationId").notNull(),
  role: mysqlEnum("role", ["agent", "client", "system"]).notNull(),
  content: text("content").notNull(),
  timestamp: timestamp("timestamp").defaultNow().notNull(),
  evaluationNote: text("evaluationNote"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type Message = typeof messages.$inferSelect;
export type InsertMessage = typeof messages.$inferInsert;

// Improvement plans table
export const improvementPlans = mysqlTable("improvement_plans", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  title: varchar("title", { length: 200 }).notNull(),
  description: text("description").notNull(),
  generatedBy: mysqlEnum("generatedBy", ["automatic", "supervisor", "trainer"]).notNull(),
  createdBy: int("createdBy").notNull(),
  status: mysqlEnum("status", ["active", "completed", "cancelled"]).default("active").notNull(),
  weaknessAreas: text("weaknessAreas"), // JSON array
  recommendedScenarios: text("recommendedScenarios"), // JSON array of scenario IDs
  goals: text("goals"), // JSON array
  progress: int("progress").default(0).notNull(), // 0-100
  startDate: timestamp("startDate").defaultNow().notNull(),
  targetDate: timestamp("targetDate"),
  completedAt: timestamp("completedAt"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type ImprovementPlan = typeof improvementPlans.$inferSelect;
export type InsertImprovementPlan = typeof improvementPlans.$inferInsert;

// Badges table - Catalog of available badges
export const badges = mysqlTable("badges", {
  id: int("id").autoincrement().primaryKey(),
  name: varchar("name", { length: 100 }).notNull(),
  description: text("description").notNull(),
  icon: varchar("icon", { length: 50 }).notNull(),
  category: mysqlEnum("category", ["empathy", "protocol", "resolution", "crisis", "speed", "consistency"]).notNull(),
  criteria: text("criteria").notNull(), // JSON
  rarity: mysqlEnum("rarity", ["common", "rare", "epic", "legendary"]).default("common").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type Badge = typeof badges.$inferSelect;
export type InsertBadge = typeof badges.$inferInsert;

// User badges table - Badges earned by users
export const userBadges = mysqlTable("user_badges", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  badgeId: int("badgeId").notNull(),
  earnedAt: timestamp("earnedAt").defaultNow().notNull(),
  simulationId: int("simulationId"),
});

export type UserBadge = typeof userBadges.$inferSelect;
export type InsertUserBadge = typeof userBadges.$inferInsert;

// Team stats table - Aggregated statistics by team/department
export const teamStats = mysqlTable("team_stats", {
  id: int("id").autoincrement().primaryKey(),
  department: varchar("department", { length: 100 }).notNull(),
  supervisorId: int("supervisorId"),
  period: mysqlEnum("period", ["daily", "weekly", "monthly"]).notNull(),
  periodDate: timestamp("periodDate").notNull(),
  totalSimulations: int("totalSimulations").default(0).notNull(),
  averageScore: int("averageScore"), // 0-100
  topPerformers: text("topPerformers"), // JSON array
  commonWeaknesses: text("commonWeaknesses"), // JSON array
  improvementRate: int("improvementRate"), // percentage
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type TeamStat = typeof teamStats.$inferSelect;
export type InsertTeamStat = typeof teamStats.$inferInsert;

// Response templates table - Model responses for training
export const responseTemplates = mysqlTable("response_templates", {
  id: int("id").autoincrement().primaryKey(),
  category: mysqlEnum("category", [
    "informative",
    "transactional",
    "fraud",
    "money_laundering",
    "theft",
    "complaint",
    "credit",
    "digital_channels"
  ]).notNull(),
  type: mysqlEnum("type", ["opening", "development", "objection_handling", "closing", "empathy", "protocol"]).notNull(),
  title: varchar("title", { length: 200 }).notNull(),
  content: text("content").notNull(),
  context: text("context"), // When to use this response
  tags: text("tags"), // JSON array
  complexity: int("complexity").notNull(), // 1-5, matching scenario complexity
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type ResponseTemplate = typeof responseTemplates.$inferSelect;
export type InsertResponseTemplate = typeof responseTemplates.$inferInsert;

// Team assignments table - Assign users to teams/departments
export const teamAssignments = mysqlTable("team_assignments", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  teamName: varchar("teamName", { length: 100 }).notNull(), // e.g., "Equipo Inbound Center - Banco Itaú"
  department: varchar("department", { length: 100 }).notNull(), // e.g., "Experiencia Presencial", "Tecnología"
  area: varchar("area", { length: 100 }), // e.g., "Calidad", "IA", "STI"
  managerId: int("managerId"), // Gerente responsable
  supervisorId: int("supervisorId"), // Supervisor directo
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type TeamAssignment = typeof teamAssignments.$inferSelect;
export type InsertTeamAssignment = typeof teamAssignments.$inferInsert;

// Coaching plans table - AI-generated personalized improvement plans
export const coachingPlans = mysqlTable("coaching_plans", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  status: mysqlEnum("status", ["active", "completed", "cancelled"]).default("active").notNull(),
  generatedAt: timestamp("generatedAt").defaultNow().notNull(),
  expiresAt: timestamp("expiresAt"),
  
  // AI-generated analysis
  weaknessAnalysis: text("weaknessAnalysis"), // JSON with detected weaknesses by category
  strengthsAnalysis: text("strengthsAnalysis"), // JSON with detected strengths
  priorityAreas: text("priorityAreas"), // JSON array of priority areas
  
  // Recommendations
  recommendedScenarios: text("recommendedScenarios"), // JSON array of scenario IDs
  weeklyGoal: text("weeklyGoal"), // Weekly goal (e.g., "Practice 3 Fraud scenarios this week")
  estimatedWeeks: int("estimatedWeeks"), // Estimated weeks to complete the plan
  
  // Progress
  completedScenarios: text("completedScenarios"), // JSON array of completed scenario IDs
  progress: int("progress").default(0).notNull(), // Progress percentage (0-100)
});

export type CoachingPlan = typeof coachingPlans.$inferSelect;
export type InsertCoachingPlan = typeof coachingPlans.$inferInsert;

// Coaching alerts table - Automatic alerts for supervisors
export const coachingAlerts = mysqlTable("coaching_alerts", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(), // Agent who triggered the alert
  supervisorId: int("supervisorId"), // Assigned supervisor
  type: mysqlEnum("type", ["low_performance", "stagnation", "improvement", "milestone"]).notNull(),
  severity: mysqlEnum("severity", ["low", "medium", "high", "critical"]).default("medium").notNull(),
  
  title: varchar("title", { length: 255 }).notNull(),
  message: text("message").notNull(),
  metadata: text("metadata"), // JSON with additional data (scores, simulations, etc.)
  
  status: mysqlEnum("status", ["pending", "acknowledged", "resolved"]).default("pending").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  acknowledgedAt: timestamp("acknowledgedAt"),
  resolvedAt: timestamp("resolvedAt"),
});

export type CoachingAlert = typeof coachingAlerts.$inferSelect;
export type InsertCoachingAlert = typeof coachingAlerts.$inferInsert;

// Buddy pairs table - Pairing agents with complementary strengths
export const buddyPairs = mysqlTable("buddy_pairs", {
  id: int("id").autoincrement().primaryKey(),
  agentId1: int("agentId1").notNull(),
  agentId2: int("agentId2").notNull(),
  
  status: mysqlEnum("status", ["suggested", "accepted", "active", "completed", "declined"]).default("suggested").notNull(),
  matchScore: int("matchScore"), // Compatibility score (0-100)
  matchReason: text("matchReason"), // Explanation of the matching
  
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  acceptedAt: timestamp("acceptedAt"),
  completedAt: timestamp("completedAt"),
  
  // Buddy system goals
  sharedGoal: text("sharedGoal"),
  targetWeeks: int("targetWeeks").default(4).notNull(),
});

export type BuddyPair = typeof buddyPairs.$inferSelect;
export type InsertBuddyPair = typeof buddyPairs.$inferInsert;

// Micro-learning content table - Videos, articles, and resources
export const microLearningContent = mysqlTable("micro_learning_content", {
  id: int("id").autoincrement().primaryKey(),
  title: varchar("title", { length: 255 }).notNull(),
  description: text("description"),
  type: mysqlEnum("type", ["video", "article", "quiz", "infographic"]).notNull(),
  
  // Content
  url: varchar("url", { length: 500 }), // URL of the video/resource
  duration: int("duration"), // Duration in seconds
  thumbnail: varchar("thumbnail", { length: 500 }),
  
  // Categorization
  category: mysqlEnum("category", [
    "informative",
    "transactional",
    "fraud",
    "money_laundering",
    "theft",
    "complaint",
    "credit",
    "digital_channels"
  ]),
  skill: varchar("skill", { length: 100 }), // Specific skill (empathy, clarity, protocol, etc.)
  level: mysqlEnum("level", ["basico", "intermedio", "avanzado", "experto"]).default("basico").notNull(),
  
  // Metadata
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  viewCount: int("viewCount").default(0).notNull(),
  avgRating: varchar("avgRating", { length: 10 }).default("0").notNull(),
});

export type MicroLearningContent = typeof microLearningContent.$inferSelect;
export type InsertMicroLearningContent = typeof microLearningContent.$inferInsert;

// Learning progress table - Tracking content consumed by each agent
export const learningProgress = mysqlTable("learning_progress", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  contentId: int("contentId").notNull(),
  
  status: mysqlEnum("status", ["started", "in_progress", "completed"]).default("started").notNull(),
  progressPercent: int("progressPercent").default(0).notNull(),
  
  startedAt: timestamp("startedAt").defaultNow().notNull(),
  completedAt: timestamp("completedAt"),
  timeSpent: int("timeSpent").default(0).notNull(), // Seconds
  
  rating: int("rating"), // 1-5 stars
  feedback: text("feedback"),
});

export type LearningProgress = typeof learningProgress.$inferSelect;
export type InsertLearningProgress = typeof learningProgress.$inferInsert;


// Admin Feedback table - Messages from admins to agents
export const adminFeedback = mysqlTable("admin_feedback", {
  id: int("id").autoincrement().primaryKey(),
  fromAdminId: int("from_admin_id").notNull(),
  toAgentId: int("to_agent_id").notNull(),
  title: varchar("title", { length: 255 }).notNull(),
  message: text("message").notNull(),
  feedbackType: mysqlEnum("feedback_type", ["note", "praise", "improvement", "urgent", "follow_up"]).default("note").notNull(),
  priority: mysqlEnum("priority", ["low", "medium", "high"]).default("medium").notNull(),
  isRead: int("is_read").default(0).notNull(), // boolean as int
  readAt: timestamp("read_at"),
  isArchived: int("is_archived").default(0).notNull(), // boolean as int
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type AdminFeedback = typeof adminFeedback.$inferSelect;
export type InsertAdminFeedback = typeof adminFeedback.$inferInsert;

// Feedback Replies table - Responses to feedback
export const feedbackReplies = mysqlTable("feedback_replies", {
  id: int("id").autoincrement().primaryKey(),
  feedbackId: int("feedback_id").notNull(),
  fromUserId: int("from_user_id").notNull(),
  message: text("message").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type FeedbackReply = typeof feedbackReplies.$inferSelect;
export type InsertFeedbackReply = typeof feedbackReplies.$inferInsert;

// Feedback Attachments table - Files attached to feedback
export const feedbackAttachments = mysqlTable("feedback_attachments", {
  id: int("id").autoincrement().primaryKey(),
  feedbackId: int("feedback_id").notNull(),
  fileName: varchar("file_name", { length: 255 }).notNull(),
  fileUrl: varchar("file_url", { length: 512 }).notNull(),
  fileType: varchar("file_type", { length: 50 }),
  fileSize: int("file_size"),
  uploadedBy: int("uploaded_by").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type FeedbackAttachment = typeof feedbackAttachments.$inferSelect;
export type InsertFeedbackAttachment = typeof feedbackAttachments.$inferInsert;
