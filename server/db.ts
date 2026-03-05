import { and, asc, desc, eq, gt, gte, inArray, like, or, sql } from "drizzle-orm";
import { drizzle } from "drizzle-orm/mysql2";
import {
  Badge,
  InsertUser,
  LibraryResource,
  Scenario,
  SimulationMessage,
  SimulationSession,
  User,
  badges,
  dailyActivity,
  libraryResources,
  scenarios,
  simulationMessages,
  simulationSessions,
  userBadges,
  users,
  weeklyGoals,
} from "../drizzle/schema";

let _db: ReturnType<typeof drizzle> | null = null;

export async function getDb() {
  if (!_db && process.env.DATABASE_URL) {
    try {
      _db = drizzle(process.env.DATABASE_URL);
    } catch (error) {
      console.warn("[Database] Failed to connect:", error);
      _db = null;
    }
  }
  return _db;
}

// ─── User Helpers ─────────────────────────────────────────────────────────────

export async function upsertUser(user: InsertUser): Promise<void> {
  if (!user.openId) throw new Error("User openId is required for upsert");
  const db = await getDb();
  if (!db) return;

  const values: InsertUser = { openId: user.openId };
  const updateSet: Record<string, unknown> = {};

  const textFields = ["name", "email", "loginMethod"] as const;
  for (const field of textFields) {
    const value = user[field];
    if (value === undefined) continue;
    const normalized = value ?? null;
    values[field] = normalized;
    updateSet[field] = normalized;
  }

  if (user.lastSignedIn !== undefined) {
    values.lastSignedIn = user.lastSignedIn;
    updateSet.lastSignedIn = user.lastSignedIn;
  }
  if (!values.lastSignedIn) values.lastSignedIn = new Date();
  if (Object.keys(updateSet).length === 0) updateSet.lastSignedIn = new Date();

  await db.insert(users).values(values).onDuplicateKeyUpdate({ set: updateSet });
}

export async function getUserByOpenId(openId: string): Promise<User | undefined> {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(users).where(eq(users.openId, openId)).limit(1);
  return result[0];
}

export async function getUserById(id: number): Promise<User | undefined> {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(users).where(eq(users.id, id)).limit(1);
  return result[0];
}

export async function updateUserXP(userId: number, xpToAdd: number): Promise<User | undefined> {
  const db = await getDb();
  if (!db) return undefined;

  const user = await getUserById(userId);
  if (!user) return undefined;

  const newXP = (user.xpTotal ?? 0) + xpToAdd;
  const newLevel = calculateLevel(newXP);

  await db.update(users)
    .set({ xpTotal: newXP, level: newLevel, updatedAt: new Date() })
    .where(eq(users.id, userId));

  return getUserById(userId);
}

export function calculateLevel(xp: number): "junior" | "intermedio" | "senior" | "experto" {
  if (xp >= 6000) return "experto";
  if (xp >= 3000) return "senior";
  if (xp >= 1000) return "intermedio";
  return "junior";
}

export function levelThresholds() {
  return { junior: 0, intermedio: 1000, senior: 3000, experto: 6000 };
}

// ─── Scenario Helpers ─────────────────────────────────────────────────────────

export async function getScenarios(filters?: {
  category?: string;
  difficulty?: string;
  search?: string;
}): Promise<Scenario[]> {
  const db = await getDb();
  if (!db) return [];

  let query = db.select().from(scenarios).where(eq(scenarios.isActive, true));

  const conditions = [eq(scenarios.isActive, true)];
  if (filters?.category && filters.category !== "todas") {
    conditions.push(eq(scenarios.category, filters.category as any));
  }
  if (filters?.difficulty && filters.difficulty !== "todas") {
    conditions.push(eq(scenarios.difficulty, filters.difficulty as any));
  }
  if (filters?.search) {
    conditions.push(like(scenarios.title, `%${filters.search}%`));
  }

  return db.select().from(scenarios).where(and(...conditions)).orderBy(asc(scenarios.difficulty));
}

export async function getScenarioById(id: number): Promise<Scenario | undefined> {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(scenarios).where(eq(scenarios.id, id)).limit(1);
  return result[0];
}

// ─── Simulation Helpers ───────────────────────────────────────────────────────

export async function createSimulationSession(data: {
  userId: number;
  scenarioId: number;
  isPracticeMode: boolean;
}): Promise<SimulationSession | undefined> {
  const db = await getDb();
  if (!db) return undefined;

  const result = await db.insert(simulationSessions).values({
    userId: data.userId,
    scenarioId: data.scenarioId,
    isPracticeMode: data.isPracticeMode,
    status: "in_progress",
    startedAt: new Date(),
  });

  const insertId = (result as any)[0]?.insertId;
  if (!insertId) return undefined;

  const session = await db.select().from(simulationSessions).where(eq(simulationSessions.id, insertId)).limit(1);
  return session[0];
}

export async function getSessionById(id: number): Promise<SimulationSession | undefined> {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(simulationSessions).where(eq(simulationSessions.id, id)).limit(1);
  return result[0];
}

export async function getSessionMessages(sessionId: number): Promise<SimulationMessage[]> {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(simulationMessages)
    .where(eq(simulationMessages.sessionId, sessionId))
    .orderBy(asc(simulationMessages.timestamp));
}

export async function addMessage(data: {
  sessionId: number;
  role: "agent" | "client";
  content: string;
}): Promise<SimulationMessage | undefined> {
  const db = await getDb();
  if (!db) return undefined;

  const result = await db.insert(simulationMessages).values({
    sessionId: data.sessionId,
    role: data.role,
    content: data.content,
    timestamp: new Date(),
  });

  const insertId = (result as any)[0]?.insertId;
  if (!insertId) return undefined;

  const msg = await db.select().from(simulationMessages).where(eq(simulationMessages.id, insertId)).limit(1);
  return msg[0];
}

export async function completeSession(
  sessionId: number,
  evaluation: {
    overallScore: number;
    empathyScore: number;
    clarityScore: number;
    protocolScore: number;
    resolutionScore: number;
    professionalismScore: number;
    xpEarned: number;
    strengths: string[];
    weaknesses: string[];
    recommendations: string[];
    aiFeedbackSummary: string;
    durationSeconds: number;
  }
): Promise<void> {
  const db = await getDb();
  if (!db) return;

  await db.update(simulationSessions)
    .set({
      status: "completed",
      completedAt: new Date(),
      durationSeconds: evaluation.durationSeconds,
      overallScore: evaluation.overallScore,
      empathyScore: evaluation.empathyScore,
      clarityScore: evaluation.clarityScore,
      protocolScore: evaluation.protocolScore,
      resolutionScore: evaluation.resolutionScore,
      professionalismScore: evaluation.professionalismScore,
      xpEarned: evaluation.xpEarned,
      strengths: evaluation.strengths,
      weaknesses: evaluation.weaknesses,
      recommendations: evaluation.recommendations,
      aiFeedbackSummary: evaluation.aiFeedbackSummary,
    })
    .where(eq(simulationSessions.id, sessionId));
}

export async function getUserSessions(userId: number, limit = 20): Promise<SimulationSession[]> {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(simulationSessions)
    .where(and(eq(simulationSessions.userId, userId), eq(simulationSessions.status, "completed")))
    .orderBy(desc(simulationSessions.completedAt))
    .limit(limit);
}

// ─── Dashboard Helpers ────────────────────────────────────────────────────────

export async function getUserDashboardStats(userId: number) {
  const db = await getDb();
  if (!db) return null;

  const completedSessions = await db.select().from(simulationSessions)
    .where(and(
      eq(simulationSessions.userId, userId),
      eq(simulationSessions.status, "completed"),
      eq(simulationSessions.isPracticeMode, false)
    ));

  const totalCompleted = completedSessions.length;
  const avgScore = totalCompleted > 0
    ? Math.round(completedSessions.reduce((sum, s) => sum + (s.overallScore ?? 0), 0) / totalCompleted)
    : 0;

  const user = await getUserById(userId);
  const recentSessions = await getUserSessions(userId, 5);

  // Weekly progress
  const today = new Date();
  const weekStart = getWeekStart(today);
  const weekGoal = await db.select().from(weeklyGoals)
    .where(and(eq(weeklyGoals.userId, userId), eq(weeklyGoals.weekStart, weekStart)))
    .limit(1);

  // Recommended scenario based on weakest dimension
  const recommendedScenario = await getRecommendedScenario(userId, completedSessions);

  return {
    totalCompleted,
    avgScore,
    currentStreak: user?.currentStreak ?? 0,
    xpTotal: user?.xpTotal ?? 0,
    level: user?.level ?? "junior",
    recentSessions,
    weeklyGoal: weekGoal[0] ?? null,
    recommendedScenario,
  };
}

async function getRecommendedScenario(userId: number, sessions: SimulationSession[]): Promise<Scenario | undefined> {
  const db = await getDb();
  if (!db) return undefined;

  if (sessions.length === 0) {
    const result = await db.select().from(scenarios)
      .where(and(eq(scenarios.isActive, true), eq(scenarios.difficulty, "facil")))
      .limit(1);
    return result[0];
  }

  // Find weakest dimension
  const recent = sessions.slice(0, 10);
  const avgEmpathy = avg(recent.map(s => s.empathyScore ?? 0));
  const avgClarity = avg(recent.map(s => s.clarityScore ?? 0));
  const avgProtocol = avg(recent.map(s => s.protocolScore ?? 0));
  const avgResolution = avg(recent.map(s => s.resolutionScore ?? 0));
  const avgProfessionalism = avg(recent.map(s => s.professionalismScore ?? 0));

  const weakest = Math.min(avgEmpathy, avgClarity, avgProtocol, avgResolution, avgProfessionalism);
  let categoryFilter: string | undefined;

  if (weakest === avgEmpathy) categoryFilter = "reclamos";
  else if (weakest === avgClarity) categoryFilter = "productos";
  else if (weakest === avgProtocol) categoryFilter = "fraude";
  else if (weakest === avgResolution) categoryFilter = "cobranzas";
  else categoryFilter = "ventas";

  const result = await db.select().from(scenarios)
    .where(and(eq(scenarios.isActive, true), eq(scenarios.category, categoryFilter as any)))
    .limit(1);

  return result[0];
}

function avg(arr: number[]): number {
  if (arr.length === 0) return 0;
  return arr.reduce((a, b) => a + b, 0) / arr.length;
}

function getWeekStart(date: Date): string {
  const d = new Date(date);
  const day = d.getDay();
  const diff = d.getDate() - day + (day === 0 ? -6 : 1);
  d.setDate(diff);
  return d.toISOString().split("T")[0];
}

// ─── Performance Helpers ──────────────────────────────────────────────────────

export async function getUserPerformanceStats(userId: number) {
  const db = await getDb();
  if (!db) return null;

  const sessions = await db.select().from(simulationSessions)
    .where(and(
      eq(simulationSessions.userId, userId),
      eq(simulationSessions.status, "completed"),
      eq(simulationSessions.isPracticeMode, false)
    ))
    .orderBy(desc(simulationSessions.completedAt))
    .limit(20);

  if (sessions.length === 0) {
    return {
      overallScore: 0,
      empathy: 0,
      clarity: 0,
      protocol: 0,
      resolution: 0,
      professionalism: 0,
      recentActivity: [],
      totalSessions: 0,
    };
  }

  const overallScore = Math.round(avg(sessions.map(s => s.overallScore ?? 0)));
  const empathy = Math.round(avg(sessions.map(s => s.empathyScore ?? 0)));
  const clarity = Math.round(avg(sessions.map(s => s.clarityScore ?? 0)));
  const protocol = Math.round(avg(sessions.map(s => s.protocolScore ?? 0)));
  const resolution = Math.round(avg(sessions.map(s => s.resolutionScore ?? 0)));
  const professionalism = Math.round(avg(sessions.map(s => s.professionalismScore ?? 0)));

  // Last 7 days activity
  const recentActivity = await getLast7DaysActivity(userId);

  return {
    overallScore,
    empathy,
    clarity,
    protocol,
    resolution,
    professionalism,
    recentActivity,
    totalSessions: sessions.length,
  };
}

async function getLast7DaysActivity(userId: number) {
  const db = await getDb();
  if (!db) return [];

  const days = [];
  for (let i = 6; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    const dateStr = d.toISOString().split("T")[0];
    days.push(dateStr);
  }

  const activity = await db.select().from(dailyActivity)
    .where(and(
      eq(dailyActivity.userId, userId),
      inArray(dailyActivity.date, days)
    ));

  return days.map(date => {
    const found = activity.find(a => a.date === date);
    return {
      date,
      simulationsCount: found?.simulationsCount ?? 0,
      avgScore: found ? Number(found.avgScore) : 0,
    };
  });
}

// ─── Ranking Helpers ──────────────────────────────────────────────────────────

export async function getLeaderboard(limit = 20) {
  const db = await getDb();
  if (!db) return [];

  return db.select({
    id: users.id,
    name: users.name,
    xpTotal: users.xpTotal,
    level: users.level,
    currentStreak: users.currentStreak,
  })
    .from(users)
    .orderBy(desc(users.xpTotal))
    .limit(limit);
}

// ─── Gamification Helpers ─────────────────────────────────────────────────────

export async function updateStreak(userId: number): Promise<number> {
  const db = await getDb();
  if (!db) return 0;

  const user = await getUserById(userId);
  if (!user) return 0;

  const today = new Date().toISOString().split("T")[0];
  const lastActivity = user.lastActivityDate
    ? new Date(user.lastActivityDate).toISOString().split("T")[0]
    : null;

  let newStreak = user.currentStreak ?? 0;

  if (lastActivity === today) {
    // Already active today, no change
  } else if (lastActivity === getYesterday()) {
    newStreak += 1;
  } else {
    newStreak = 1;
  }

  const newMax = Math.max(newStreak, user.maxStreak ?? 0);

  await db.update(users)
    .set({ currentStreak: newStreak, maxStreak: newMax, lastActivityDate: new Date() })
    .where(eq(users.id, userId));

  return newStreak;
}

function getYesterday(): string {
  const d = new Date();
  d.setDate(d.getDate() - 1);
  return d.toISOString().split("T")[0];
}

export async function checkAndAwardBadges(userId: number, sessionId: number, score: number): Promise<Badge[]> {
  const db = await getDb();
  if (!db) return [];

  const user = await getUserById(userId);
  if (!user) return [];

  const allBadges = await db.select().from(badges);
  const userBadgesList = await db.select().from(userBadges).where(eq(userBadges.userId, userId));
  const earnedKeys = new Set(
    userBadgesList.map(ub => allBadges.find(b => b.id === ub.badgeId)?.key).filter(Boolean)
  );

  const newBadges: Badge[] = [];

  const completedSessions = await db.select().from(simulationSessions)
    .where(and(eq(simulationSessions.userId, userId), eq(simulationSessions.status, "completed")));

  // Primera simulación
  if (!earnedKeys.has("primera_simulacion") && completedSessions.length >= 1) {
    const badge = allBadges.find(b => b.key === "primera_simulacion");
    if (badge) { await awardBadge(userId, badge.id, sessionId); newBadges.push(badge); }
  }

  // Score perfecto
  if (!earnedKeys.has("score_perfecto") && score >= 95) {
    const badge = allBadges.find(b => b.key === "score_perfecto");
    if (badge) { await awardBadge(userId, badge.id, sessionId); newBadges.push(badge); }
  }

  // Racha 3 días
  if (!earnedKeys.has("racha_3") && (user.currentStreak ?? 0) >= 3) {
    const badge = allBadges.find(b => b.key === "racha_3");
    if (badge) { await awardBadge(userId, badge.id, sessionId); newBadges.push(badge); }
  }

  // Racha 7 días
  if (!earnedKeys.has("racha_7") && (user.currentStreak ?? 0) >= 7) {
    const badge = allBadges.find(b => b.key === "racha_7");
    if (badge) { await awardBadge(userId, badge.id, sessionId); newBadges.push(badge); }
  }

  return newBadges;
}

async function awardBadge(userId: number, badgeId: number, sessionId: number): Promise<void> {
  const db = await getDb();
  if (!db) return;
  await db.insert(userBadges).values({ userId, badgeId, sessionId, earnedAt: new Date() });
}

export async function getUserBadges(userId: number): Promise<(Badge & { earnedAt: Date })[]> {
  const db = await getDb();
  if (!db) return [];

  const result = await db.select({
    id: badges.id,
    key: badges.key,
    name: badges.name,
    description: badges.description,
    icon: badges.icon,
    category: badges.category,
    xpBonus: badges.xpBonus,
    earnedAt: userBadges.earnedAt,
  })
    .from(userBadges)
    .innerJoin(badges, eq(userBadges.badgeId, badges.id))
    .where(eq(userBadges.userId, userId))
    .orderBy(desc(userBadges.earnedAt));

  return result as any;
}

// ─── Library Helpers ──────────────────────────────────────────────────────────

export async function getLibraryResources(filters?: {
  category?: string;
  search?: string;
}): Promise<LibraryResource[]> {
  const db = await getDb();
  if (!db) return [];

  const conditions = [eq(libraryResources.isActive, true)];
  if (filters?.category && filters.category !== "todas") {
    conditions.push(eq(libraryResources.category, filters.category as any));
  }
  if (filters?.search) {
    conditions.push(like(libraryResources.title, `%${filters.search}%`));
  }

  return db.select().from(libraryResources)
    .where(and(...conditions))
    .orderBy(desc(libraryResources.views));
}

export async function getResourceById(id: number): Promise<LibraryResource | undefined> {
  const db = await getDb();
  if (!db) return undefined;

  await db.update(libraryResources)
    .set({ views: sql`${libraryResources.views} + 1` })
    .where(eq(libraryResources.id, id));

  const result = await db.select().from(libraryResources).where(eq(libraryResources.id, id)).limit(1);
  return result[0];
}

// ─── Daily Activity Update ────────────────────────────────────────────────────

export async function updateDailyActivity(userId: number, score: number, xpEarned: number): Promise<void> {
  const db = await getDb();
  if (!db) return;

  const today = new Date().toISOString().split("T")[0];

  const existing = await db.select().from(dailyActivity)
    .where(and(eq(dailyActivity.userId, userId), eq(dailyActivity.date, today)))
    .limit(1);

  if (existing.length > 0) {
    const current = existing[0];
    const newCount = (current.simulationsCount ?? 0) + 1;
    const newAvg = ((Number(current.avgScore) * (newCount - 1)) + score) / newCount;
    await db.update(dailyActivity)
      .set({
        simulationsCount: newCount,
        avgScore: newAvg.toFixed(2),
        xpEarned: (current.xpEarned ?? 0) + xpEarned,
      })
      .where(and(eq(dailyActivity.userId, userId), eq(dailyActivity.date, today)));
  } else {
    await db.insert(dailyActivity).values({
      userId,
      date: today,
      simulationsCount: 1,
      avgScore: score.toFixed(2),
      xpEarned,
    });
  }

  // Update weekly goal
  const weekStart = getWeekStart(new Date());
  const weekGoal = await db.select().from(weeklyGoals)
    .where(and(eq(weeklyGoals.userId, userId), eq(weeklyGoals.weekStart, weekStart)))
    .limit(1);

  const todayDay = new Date().toLocaleDateString("es", { weekday: "short" }).toLowerCase();

  if (weekGoal.length > 0) {
    const current = weekGoal[0];
    const completedDays = (current.completedDays as string[]) ?? [];
    if (!completedDays.includes(today)) {
      completedDays.push(today);
    }
    await db.update(weeklyGoals)
      .set({
        completedSimulations: (current.completedSimulations ?? 0) + 1,
        completedDays: completedDays,
      })
      .where(and(eq(weeklyGoals.userId, userId), eq(weeklyGoals.weekStart, weekStart)));
  } else {
    await db.insert(weeklyGoals).values({
      userId,
      weekStart,
      requiredSimulations: 5,
      completedSimulations: 1,
      completedDays: [today],
    });
  }
}

// ─── Admin Helpers ────────────────────────────────────────────────────────────

export async function getAllUsers(limit = 50) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(users).orderBy(desc(users.xpTotal)).limit(limit);
}

export async function getTeamStats(supervisorId: number) {
  const db = await getDb();
  if (!db) return [];

  const teamMembers = await db.select().from(users).where(eq(users.teamId, supervisorId));
  return teamMembers;
}
