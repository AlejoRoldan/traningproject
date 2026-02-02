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
  role: mysqlEnum("role", ["user", "admin", "agent", "supervisor", "trainer"]).default("agent").notNull(),
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