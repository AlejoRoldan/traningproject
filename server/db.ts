import { eq, desc, and, gte, lte, sql } from "drizzle-orm";
import { drizzle } from "drizzle-orm/mysql2";
import { 
  InsertUser, 
  users, 
  scenarios, 
  simulations, 
  messages, 
  improvementPlans, 
  badges, 
  userBadges, 
  teamStats,
  type Scenario,
  type Simulation,
  type ImprovementPlan,
  type Badge
} from "../drizzle/schema";
import { ENV } from './_core/env';

let _db: ReturnType<typeof drizzle> | null = null;

// Lazily create the drizzle instance so local tooling can run without a DB.
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

export async function upsertUser(user: InsertUser): Promise<void> {
  if (!user.openId) {
    throw new Error("User openId is required for upsert");
  }

  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot upsert user: database not available");
    return;
  }

  try {
    const values: InsertUser = {
      openId: user.openId,
    };
    const updateSet: Record<string, unknown> = {};

    const textFields = ["name", "email", "loginMethod", "department"] as const;
    type TextField = (typeof textFields)[number];

    const assignNullable = (field: TextField) => {
      const value = user[field];
      if (value === undefined) return;
      const normalized = value ?? null;
      values[field] = normalized;
      updateSet[field] = normalized;
    };

    textFields.forEach(assignNullable);

    if (user.lastSignedIn !== undefined) {
      values.lastSignedIn = user.lastSignedIn;
      updateSet.lastSignedIn = user.lastSignedIn;
    }
    
    if (user.role !== undefined) {
      values.role = user.role;
      updateSet.role = user.role;
    } else if (user.openId === ENV.ownerOpenId) {
      values.role = 'admin';
      updateSet.role = 'admin';
    } else {
      values.role = 'agent'; // Default role
      updateSet.role = 'agent';
    }

    if (user.supervisorId !== undefined) {
      values.supervisorId = user.supervisorId;
      updateSet.supervisorId = user.supervisorId;
    }

    if (user.level !== undefined) {
      values.level = user.level;
      updateSet.level = user.level;
    }

    if (user.points !== undefined) {
      values.points = user.points;
      updateSet.points = user.points;
    }

    if (!values.lastSignedIn) {
      values.lastSignedIn = new Date();
    }

    if (Object.keys(updateSet).length === 0) {
      updateSet.lastSignedIn = new Date();
    }

    await db.insert(users).values(values).onDuplicateKeyUpdate({
      set: updateSet,
    });
  } catch (error) {
    console.error("[Database] Failed to upsert user:", error);
    throw error;
  }
}

export async function getUserByOpenId(openId: string) {
  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot get user: database not available");
    return undefined;
  }

  const result = await db.select().from(users).where(eq(users.openId, openId)).limit(1);

  return result.length > 0 ? result[0] : undefined;
}

// Scenarios queries
export async function getAllScenarios() {
  const db = await getDb();
  if (!db) return [];
  
  return await db.select().from(scenarios).where(eq(scenarios.isActive, 1)).orderBy(scenarios.complexity, scenarios.title);
}

export async function getScenarioById(id: number) {
  const db = await getDb();
  if (!db) return undefined;
  
  const result = await db.select().from(scenarios).where(eq(scenarios.id, id)).limit(1);
  return result.length > 0 ? result[0] : undefined;
}

export async function getScenariosByCategory(category: string) {
  const db = await getDb();
  if (!db) return [];
  
  return await db.select().from(scenarios)
    .where(and(eq(scenarios.category, category as any), eq(scenarios.isActive, 1)))
    .orderBy(scenarios.complexity);
}

export async function getScenariosByComplexity(complexity: number) {
  const db = await getDb();
  if (!db) return [];
  
  return await db.select().from(scenarios)
    .where(and(eq(scenarios.complexity, complexity), eq(scenarios.isActive, 1)))
    .orderBy(scenarios.title);
}

// Simulations queries
export async function getUserSimulations(userId: number, limit: number = 10) {
  const db = await getDb();
  if (!db) return [];
  
  return await db.select().from(simulations)
    .where(eq(simulations.userId, userId))
    .orderBy(desc(simulations.startedAt))
    .limit(limit);
}

export async function getSimulationById(id: number) {
  const db = await getDb();
  if (!db) return undefined;
  
  const result = await db.select().from(simulations).where(eq(simulations.id, id)).limit(1);
  return result.length > 0 ? result[0] : undefined;
}

export async function getSimulationMessages(simulationId: number) {
  const db = await getDb();
  if (!db) return [];
  
  return await db.select().from(messages)
    .where(eq(messages.simulationId, simulationId))
    .orderBy(messages.timestamp);
}

// User statistics
export async function getUserStats(userId: number) {
  const db = await getDb();
  if (!db) return null;
  
  const userSims = await db.select().from(simulations)
    .where(and(eq(simulations.userId, userId), eq(simulations.status, 'completed')));
  
  if (userSims.length === 0) {
    return {
      totalSimulations: 0,
      averageScore: 0,
      completionRate: 0,
      totalPoints: 0
    };
  }
  
  const totalScore = userSims.reduce((sum, sim) => sum + (sim.overallScore || 0), 0);
  const totalPoints = userSims.reduce((sum, sim) => sum + (sim.pointsEarned || 0), 0);
  
  return {
    totalSimulations: userSims.length,
    averageScore: Math.round(totalScore / userSims.length),
    completionRate: 100, // All are completed in this query
    totalPoints
  };
}

// Improvement plans queries
export async function getUserImprovementPlans(userId: number) {
  const db = await getDb();
  if (!db) return [];
  
  return await db.select().from(improvementPlans)
    .where(eq(improvementPlans.userId, userId))
    .orderBy(desc(improvementPlans.createdAt));
}

export async function getActiveImprovementPlan(userId: number) {
  const db = await getDb();
  if (!db) return undefined;
  
  const result = await db.select().from(improvementPlans)
    .where(and(eq(improvementPlans.userId, userId), eq(improvementPlans.status, 'active')))
    .orderBy(desc(improvementPlans.createdAt))
    .limit(1);
  
  return result.length > 0 ? result[0] : undefined;
}

// Badges queries
export async function getAllBadges() {
  const db = await getDb();
  if (!db) return [];
  
  return await db.select().from(badges).orderBy(badges.category, badges.rarity);
}

export async function getUserBadges(userId: number) {
  const db = await getDb();
  if (!db) return [];
  
  return await db.select({
    badge: badges,
    earnedAt: userBadges.earnedAt,
    simulationId: userBadges.simulationId
  })
  .from(userBadges)
  .innerJoin(badges, eq(userBadges.badgeId, badges.id))
  .where(eq(userBadges.userId, userId))
  .orderBy(desc(userBadges.earnedAt));
}

// Team/Supervisor queries
export async function getTeamMembers(supervisorId: number) {
  const db = await getDb();
  if (!db) return [];
  
  return await db.select().from(users)
    .where(eq(users.supervisorId, supervisorId))
    .orderBy(users.name);
}

export async function getDepartmentMembers(department: string) {
  const db = await getDb();
  if (!db) return [];
  
  return await db.select().from(users)
    .where(eq(users.department, department))
    .orderBy(users.name);
}

export async function getTeamStats(supervisorId: number, period: 'daily' | 'weekly' | 'monthly') {
  const db = await getDb();
  if (!db) return [];
  
  return await db.select().from(teamStats)
    .where(and(eq(teamStats.supervisorId, supervisorId), eq(teamStats.period, period)))
    .orderBy(desc(teamStats.periodDate))
    .limit(30);
}
