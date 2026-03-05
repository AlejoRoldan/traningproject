import {
  boolean,
  decimal,
  int,
  json,
  mysqlEnum,
  mysqlTable,
  text,
  timestamp,
  varchar,
} from "drizzle-orm/mysql-core";

// ─── Users & Roles ────────────────────────────────────────────────────────────

export const users = mysqlTable("users", {
  id: int("id").autoincrement().primaryKey(),
  openId: varchar("openId", { length: 64 }).notNull().unique(),
  name: text("name"),
  email: varchar("email", { length: 320 }),
  loginMethod: varchar("loginMethod", { length: 64 }),
  role: mysqlEnum("role", ["gerente", "supervisor", "coordinador", "analista", "agente", "admin"]).default("agente").notNull(),
  teamId: int("teamId"),
  avatarUrl: text("avatarUrl"),
  // Gamification
  xpTotal: int("xpTotal").default(0).notNull(),
  level: mysqlEnum("level", ["junior", "intermedio", "senior", "experto"]).default("junior").notNull(),
  currentStreak: int("currentStreak").default(0).notNull(),
  maxStreak: int("maxStreak").default(0).notNull(),
  lastActivityDate: timestamp("lastActivityDate"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  lastSignedIn: timestamp("lastSignedIn").defaultNow().notNull(),
});

export type User = typeof users.$inferSelect;
export type InsertUser = typeof users.$inferInsert;

// ─── Teams ────────────────────────────────────────────────────────────────────

export const teams = mysqlTable("teams", {
  id: int("id").autoincrement().primaryKey(),
  name: varchar("name", { length: 128 }).notNull(),
  supervisorId: int("supervisorId"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

// ─── Scenarios ────────────────────────────────────────────────────────────────

export const scenarios = mysqlTable("scenarios", {
  id: int("id").autoincrement().primaryKey(),
  title: varchar("title", { length: 256 }).notNull(),
  description: text("description"),
  category: mysqlEnum("category", ["reclamos", "productos", "ventas", "cobranzas", "onboarding", "fraude"]).notNull(),
  difficulty: mysqlEnum("difficulty", ["facil", "medio", "dificil", "experto"]).notNull(),
  xpReward: int("xpReward").default(100).notNull(),
  durationMin: int("durationMin").default(5).notNull(),
  durationMax: int("durationMax").default(10).notNull(),
  // Client persona
  clientName: varchar("clientName", { length: 128 }),
  clientPersona: text("clientPersona"),
  clientTone: mysqlEnum("clientTone", ["neutral", "molesto", "urgente", "amable", "desconfiado", "ansioso"]).default("neutral"),
  clientGender: mysqlEnum("clientGender", ["masculino", "femenino"]).default("masculino"),
  // Scenario content
  initialMessage: text("initialMessage").notNull(),
  systemPrompt: text("systemPrompt").notNull(),
  idealResponseHints: text("idealResponseHints"),
  // Evaluation weights (must sum to 1.0)
  empathyWeight: decimal("empathyWeight", { precision: 3, scale: 2 }).default("0.20"),
  clarityWeight: decimal("clarityWeight", { precision: 3, scale: 2 }).default("0.20"),
  protocolWeight: decimal("protocolWeight", { precision: 3, scale: 2 }).default("0.20"),
  resolutionWeight: decimal("resolutionWeight", { precision: 3, scale: 2 }).default("0.20"),
  professionalismWeight: decimal("professionalismWeight", { precision: 3, scale: 2 }).default("0.20"),
  // Competencies highlighted
  competencies: json("competencies").$type<string[]>(),
  // Stats
  totalCompleted: int("totalCompleted").default(0).notNull(),
  avgScore: decimal("avgScore", { precision: 5, scale: 2 }).default("0.00"),
  isActive: boolean("isActive").default(true).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type Scenario = typeof scenarios.$inferSelect;

// ─── Simulation Sessions ──────────────────────────────────────────────────────

export const simulationSessions = mysqlTable("simulation_sessions", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  scenarioId: int("scenarioId").notNull(),
  status: mysqlEnum("status", ["in_progress", "completed", "abandoned"]).default("in_progress").notNull(),
  isPracticeMode: boolean("isPracticeMode").default(false).notNull(),
  startedAt: timestamp("startedAt").defaultNow().notNull(),
  completedAt: timestamp("completedAt"),
  durationSeconds: int("durationSeconds"),
  // Evaluation results
  overallScore: int("overallScore"),
  empathyScore: int("empathyScore"),
  clarityScore: int("clarityScore"),
  protocolScore: int("protocolScore"),
  resolutionScore: int("resolutionScore"),
  professionalismScore: int("professionalismScore"),
  xpEarned: int("xpEarned").default(0).notNull(),
  // AI Feedback
  strengths: json("strengths").$type<string[]>(),
  weaknesses: json("weaknesses").$type<string[]>(),
  recommendations: json("recommendations").$type<string[]>(),
  aiFeedbackSummary: text("aiFeedbackSummary"),
  // Audio
  audioUrl: text("audioUrl"),
  transcription: text("transcription"),
});

export type SimulationSession = typeof simulationSessions.$inferSelect;

// ─── Simulation Messages ──────────────────────────────────────────────────────

export const simulationMessages = mysqlTable("simulation_messages", {
  id: int("id").autoincrement().primaryKey(),
  sessionId: int("sessionId").notNull(),
  role: mysqlEnum("role", ["agent", "client"]).notNull(),
  content: text("content").notNull(),
  timestamp: timestamp("timestamp").defaultNow().notNull(),
  audioUrl: text("audioUrl"),
});

export type SimulationMessage = typeof simulationMessages.$inferSelect;

// ─── Badges ───────────────────────────────────────────────────────────────────

export const badges = mysqlTable("badges", {
  id: int("id").autoincrement().primaryKey(),
  key: varchar("key", { length: 64 }).notNull().unique(),
  name: varchar("name", { length: 128 }).notNull(),
  description: text("description"),
  icon: varchar("icon", { length: 64 }),
  category: mysqlEnum("category", ["performance", "streak", "completion", "ranking", "special"]).default("performance"),
  xpBonus: int("xpBonus").default(0),
});

export const userBadges = mysqlTable("user_badges", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  badgeId: int("badgeId").notNull(),
  earnedAt: timestamp("earnedAt").defaultNow().notNull(),
  sessionId: int("sessionId"),
});

export type Badge = typeof badges.$inferSelect;
export type UserBadge = typeof userBadges.$inferSelect;

// ─── Library Resources ────────────────────────────────────────────────────────

export const libraryResources = mysqlTable("library_resources", {
  id: int("id").autoincrement().primaryKey(),
  title: varchar("title", { length: 256 }).notNull(),
  description: text("description"),
  category: mysqlEnum("category", ["empatia", "resolucion", "protocolo", "productos", "manejo_objeciones", "ventas", "cobranzas"]).notNull(),
  type: mysqlEnum("type", ["guia", "video", "procedimiento", "checklist", "ficha", "referencia"]).notNull(),
  content: text("content"),
  externalUrl: text("externalUrl"),
  readingMinutes: int("readingMinutes").default(5),
  rating: decimal("rating", { precision: 3, scale: 1 }).default("0.0"),
  totalRatings: int("totalRatings").default(0),
  views: int("views").default(0),
  isActive: boolean("isActive").default(true).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type LibraryResource = typeof libraryResources.$inferSelect;

// ─── Daily Activity ───────────────────────────────────────────────────────────

export const dailyActivity = mysqlTable("daily_activity", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  date: varchar("date", { length: 10 }).notNull(), // YYYY-MM-DD
  simulationsCount: int("simulationsCount").default(0).notNull(),
  avgScore: decimal("avgScore", { precision: 5, scale: 2 }).default("0.00"),
  xpEarned: int("xpEarned").default(0).notNull(),
});

// ─── Weekly Goals ─────────────────────────────────────────────────────────────

export const weeklyGoals = mysqlTable("weekly_goals", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  weekStart: varchar("weekStart", { length: 10 }).notNull(), // YYYY-MM-DD (Monday)
  requiredSimulations: int("requiredSimulations").default(5).notNull(),
  completedSimulations: int("completedSimulations").default(0).notNull(),
  completedDays: json("completedDays").$type<string[]>().default([]),
});
