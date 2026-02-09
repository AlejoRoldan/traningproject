import { getDb } from "./db";
import { simulations, scenarios, coachingPlans, coachingAlerts } from "../drizzle/schema";
import { eq, desc, and, gte, lte, sql } from "drizzle-orm";
import { invokeLLM } from "./_core/llm";

/**
 * Coaching Service
 * 
 * Analyzes agent performance and generates personalized improvement plans using AI.
 */

interface WeaknessAnalysis {
  category: string;
  currentScore: number;
  gap: number;
  priority: 'high' | 'medium' | 'low';
  trend: 'improving' | 'stable' | 'declining';
}

interface StrengthAnalysis {
  category: string;
  currentScore: number;
  consistency: number; // 0-100
}

interface CoachingPlanData {
  weaknessAnalysis: WeaknessAnalysis[];
  strengthsAnalysis: StrengthAnalysis[];
  priorityAreas: string[];
  recommendedScenarios: number[];
  weeklyGoal: string;
  estimatedWeeks: number;
}

/**
 * Analyze agent's recent performance and detect weaknesses
 */
export async function analyzeAgentPerformance(userId: number): Promise<{
  weaknesses: WeaknessAnalysis[];
  strengths: StrengthAnalysis[];
}> {
  const db = await getDb();
  if (!db) throw new Error('Database connection failed');
  
  // Get last 10 completed simulations
  const recentSims = await db
    .select()
    .from(simulations)
    .where(
      and(
        eq(simulations.userId, userId),
        eq(simulations.status, 'completed'),
        sql`${simulations.isPracticeMode} = 0`
      )
    )
    .orderBy(desc(simulations.completedAt))
    .limit(10);

  if (recentSims.length < 3) {
    throw new Error('Not enough simulations to generate coaching plan. Complete at least 3 simulations.');
  }

  // Calculate category averages
  const categoryScores: Record<string, number[]> = {};
  
  for (const sim of recentSims) {
    if (!sim.categoryScores) continue;
    
    const scores = typeof sim.categoryScores === 'string' 
      ? JSON.parse(sim.categoryScores) 
      : sim.categoryScores;
    
    for (const [category, score] of Object.entries(scores)) {
      if (!categoryScores[category]) {
        categoryScores[category] = [];
      }
      categoryScores[category].push(score as number);
    }
  }

  // Detect weaknesses (avg < 70)
  const weaknesses: WeaknessAnalysis[] = [];
  const strengths: StrengthAnalysis[] = [];
  
  for (const [category, scores] of Object.entries(categoryScores)) {
    const avg = scores.reduce((a, b) => a + b, 0) / scores.length;
    const stdDev = Math.sqrt(
      scores.reduce((sq, n) => sq + Math.pow(n - avg, 2), 0) / scores.length
    );
    const consistency = Math.max(0, 100 - stdDev * 2); // Lower std dev = higher consistency
    
    // Calculate trend (compare first half vs second half)
    const midpoint = Math.floor(scores.length / 2);
    const firstHalf = scores.slice(0, midpoint);
    const secondHalf = scores.slice(midpoint);
    const firstAvg = firstHalf.reduce((a, b) => a + b, 0) / firstHalf.length;
    const secondAvg = secondHalf.reduce((a, b) => a + b, 0) / secondHalf.length;
    const trend = secondAvg > firstAvg + 3 ? 'improving' : 
                  secondAvg < firstAvg - 3 ? 'declining' : 'stable';
    
    if (avg < 70) {
      weaknesses.push({
        category,
        currentScore: Math.round(avg),
        gap: Math.round(70 - avg),
        priority: avg < 60 ? 'high' : avg < 65 ? 'medium' : 'low',
        trend
      });
    } else if (avg >= 75) {
      strengths.push({
        category,
        currentScore: Math.round(avg),
        consistency: Math.round(consistency)
      });
    }
  }

  // Sort weaknesses by priority (high first) and gap (larger first)
  weaknesses.sort((a, b) => {
    const priorityOrder = { high: 0, medium: 1, low: 2 };
    if (priorityOrder[a.priority] !== priorityOrder[b.priority]) {
      return priorityOrder[a.priority] - priorityOrder[b.priority];
    }
    return b.gap - a.gap;
  });

  return { weaknesses, strengths };
}

/**
 * Generate personalized coaching plan using AI
 */
export async function generateCoachingPlan(userId: number): Promise<CoachingPlanData> {
  const { weaknesses, strengths } = await analyzeAgentPerformance(userId);
  
  if (weaknesses.length === 0) {
    throw new Error('No areas for improvement detected. Agent is performing well across all categories.');
  }

  // Get recommended scenarios based on weaknesses
  const db = await getDb();
  if (!db) throw new Error('Database connection failed');
  const recommendedScenarios: number[] = [];
  
  // For each weakness, find 2-3 scenarios in that category
  for (const weakness of weaknesses.slice(0, 3)) { // Top 3 weaknesses
    const categoryMap: Record<string, string> = {
      empathy: 'complaint',
      clarity: 'informative',
      protocol: 'fraud',
      resolution: 'transactional',
      confidence: 'credit'
    };
    
    const scenarioCategory = categoryMap[weakness.category] || 'informative';
    
    const scenariosInCategory = await db
      .select()
      .from(scenarios)
      .where(
        and(
          eq(scenarios.category, scenarioCategory as any),
          eq(scenarios.isActive, 1)
        )
      )
      .limit(2);
    
    recommendedScenarios.push(...scenariosInCategory.map(s => s.id));
  }

  // Generate AI-powered coaching plan
  const prompt = `
Eres un coach experto en contact centers bancarios del Grupo Vázquez (Banco Itaú, Seguros Itaú, RCI).

Analiza el desempeño del agente y genera un plan de coaching personalizado.

**Debilidades detectadas:**
${JSON.stringify(weaknesses, null, 2)}

**Fortalezas:**
${JSON.stringify(strengths, null, 2)}

Genera un plan de coaching en formato JSON con esta estructura:
{
  "priorityAreas": ["área 1", "área 2", "área 3"], // Máximo 3 áreas prioritarias
  "weeklyGoal": "Objetivo semanal claro y alcanzable (ej: 'Practicar 3 escenarios de Fraude esta semana')",
  "estimatedWeeks": número de semanas estimadas para ver mejora significativa (1-8),
  "improvementStrategy": "Estrategia de mejora en 2-3 oraciones",
  "keyFocusPoints": ["punto clave 1", "punto clave 2", "punto clave 3"] // Qué debe enfocarse el agente
}

Sé específico, motivador y realista. El objetivo es ayudar al agente a mejorar de forma concreta.
`;

  const response = await invokeLLM({
    messages: [{ role: 'user', content: prompt }],
    response_format: { type: 'json_object' }
  });

  const content = response.choices[0].message.content;
  const aiPlan = JSON.parse(typeof content === 'string' ? content : JSON.stringify(content));

  return {
    weaknessAnalysis: weaknesses,
    strengthsAnalysis: strengths,
    priorityAreas: aiPlan.priorityAreas || [],
    recommendedScenarios: recommendedScenarios.slice(0, 5), // Max 5 scenarios
    weeklyGoal: aiPlan.weeklyGoal || 'Completar 3 simulaciones esta semana',
    estimatedWeeks: aiPlan.estimatedWeeks || 4
  };
}

/**
 * Create or update coaching plan for an agent
 */
export async function createCoachingPlan(userId: number): Promise<number> {
  const db = await getDb();
  if (!db) throw new Error('Database connection failed');
  
  // Check if there's an active plan
  const existingPlans = await db
    .select()
    .from(coachingPlans)
    .where(
      and(
        eq(coachingPlans.userId, userId),
        eq(coachingPlans.status, 'active')
      )
    );

  // Cancel existing active plans
  for (const plan of existingPlans) {
    await db
      .update(coachingPlans)
      .set({ status: 'cancelled' })
      .where(eq(coachingPlans.id, plan.id));
  }

  // Generate new plan
  const planData = await generateCoachingPlan(userId);
  
  const expiresAt = new Date();
  expiresAt.setDate(expiresAt.getDate() + (planData.estimatedWeeks * 7));

  const [result] = await db
    .insert(coachingPlans)
    .values({
      userId,
      status: 'active',
      weaknessAnalysis: JSON.stringify(planData.weaknessAnalysis),
      strengthsAnalysis: JSON.stringify(planData.strengthsAnalysis),
      priorityAreas: JSON.stringify(planData.priorityAreas),
      recommendedScenarios: JSON.stringify(planData.recommendedScenarios),
      weeklyGoal: planData.weeklyGoal,
      estimatedWeeks: planData.estimatedWeeks,
      completedScenarios: JSON.stringify([]),
      progress: 0,
      expiresAt
    })
    .$returningId();

  return result.id;
}

/**
 * Update coaching plan progress
 */
export async function updateCoachingProgress(userId: number, completedScenarioId: number): Promise<void> {
  const db = await getDb();
  if (!db) throw new Error('Database connection failed');
  
  // Get active plan
  const [activePlan] = await db
    .select()
    .from(coachingPlans)
    .where(
      and(
        eq(coachingPlans.userId, userId),
        eq(coachingPlans.status, 'active')
      )
    )
    .limit(1);

  if (!activePlan) return;

  const recommendedScenarios = JSON.parse(activePlan.recommendedScenarios || '[]');
  const completedScenarios = JSON.parse(activePlan.completedScenarios || '[]');

  // Check if this scenario is in the recommended list
  if (!recommendedScenarios.includes(completedScenarioId)) return;

  // Add to completed if not already there
  if (!completedScenarios.includes(completedScenarioId)) {
    completedScenarios.push(completedScenarioId);
    
    // Calculate progress
    const progress = Math.round((completedScenarios.length / recommendedScenarios.length) * 100);
    
    await db
      .update(coachingPlans)
      .set({
        completedScenarios: JSON.stringify(completedScenarios),
        progress,
        status: progress >= 100 ? 'completed' : 'active'
      })
      .where(eq(coachingPlans.id, activePlan.id));
  }
}

/**
 * Get active coaching plan for an agent
 */
export async function getActiveCoachingPlan(userId: number) {
  const db = await getDb();
  if (!db) throw new Error('Database connection failed');
  
  const [plan] = await db
    .select()
    .from(coachingPlans)
    .where(
      and(
        eq(coachingPlans.userId, userId),
        eq(coachingPlans.status, 'active')
      )
    )
    .orderBy(desc(coachingPlans.generatedAt))
    .limit(1);

  if (!plan) return null;

  // Parse JSON fields
  return {
    ...plan,
    weaknessAnalysis: JSON.parse(plan.weaknessAnalysis || '[]'),
    strengthsAnalysis: JSON.parse(plan.strengthsAnalysis || '[]'),
    priorityAreas: JSON.parse(plan.priorityAreas || '[]'),
    recommendedScenarios: JSON.parse(plan.recommendedScenarios || '[]'),
    completedScenarios: JSON.parse(plan.completedScenarios || '[]')
  };
}

/**
 * BUDDY SYSTEM
 * 
 * Intelligent matching algorithm that pairs agents with complementary strengths/weaknesses
 */

interface BuddyCandidate {
  userId: number;
  name: string;
  role: string;
  area: string;
  strengths: StrengthAnalysis[];
  weaknesses: WeaknessAnalysis[];
  compatibilityScore: number;
  matchReasons: string[];
}

/**
 * Find buddy candidates for an agent
 * 
 * Matching criteria:
 * 1. Complementary skills: Buddy's strength matches agent's weakness
 * 2. Similar experience level (same role or adjacent)
 * 3. Same area/department for easier interaction
 * 4. Not already paired
 */
export async function findBuddyCandidates(userId: number): Promise<BuddyCandidate[]> {
  const db = await getDb();
  if (!db) throw new Error('Database connection failed');
  
  // Try to get agent's profile and performance
  let weaknesses: WeaknessAnalysis[] = [];
  let strengths: StrengthAnalysis[] = [];
  let hasPerformanceData = false;
  
  try {
    const analysis = await analyzeAgentPerformance(userId);
    weaknesses = analysis.weaknesses;
    strengths = analysis.strengths;
    hasPerformanceData = true;
  } catch (error) {
    // User doesn't have enough simulations yet, show general candidates
    hasPerformanceData = false;
  }
  
  // Get agent's info
  const [agent] = await db
    .select()
    .from(simulations)
    .where(eq(simulations.userId, userId))
    .limit(1);
  
  if (!agent) throw new Error('Agent not found');
  
  // Get all other agents who have completed at least 3 simulations
  const allAgents = await db
    .select({
      userId: simulations.userId,
      count: sql<number>`count(*)`.as('count')
    })
    .from(simulations)
    .where(
      and(
        eq(simulations.status, 'completed'),
        sql`${simulations.isPracticeMode} = 0`
      )
    )
    .groupBy(simulations.userId)
    .having(sql`count(*) >= 3`);
  
  const candidates: BuddyCandidate[] = [];
  
  for (const candidate of allAgents) {
    if (candidate.userId === userId) continue; // Skip self
    
    try {
      const candidatePerf = await analyzeAgentPerformance(candidate.userId);
      
      // Calculate compatibility score
      let compatibilityScore = 0;
      const matchReasons: string[] = [];
      
      if (hasPerformanceData) {
        // Check for complementary skills
        for (const weakness of weaknesses) {
          const candidateStrength = candidatePerf.strengths.find(
            s => s.category === weakness.category && s.currentScore >= 75
          );
          
          if (candidateStrength) {
            compatibilityScore += 30;
            matchReasons.push(`Fuerte en ${weakness.category} (tu debilidad)`);
          }
        }
        
        // Check if candidate has weaknesses where agent is strong
        for (const strength of strengths) {
          const candidateWeakness = candidatePerf.weaknesses.find(
            w => w.category === strength.category
          );
          
          if (candidateWeakness) {
            compatibilityScore += 20;
            matchReasons.push(`Puedes ayudar en ${strength.category}`);
          }
        }
        
        // Bonus for mutual benefit (both can help each other)
        if (matchReasons.length >= 2) {
          compatibilityScore += 20;
          matchReasons.push('Beneficio mutuo');
        }
      } else {
        // No performance data yet, show general compatibility
        compatibilityScore = 50; // Base score for preview
        
        // Highlight candidate's top strengths
        const topStrengths = candidatePerf.strengths.slice(0, 2);
        for (const strength of topStrengths) {
          matchReasons.push(`Experto en ${strength.category}`);
        }
        
        if (matchReasons.length === 0) {
          matchReasons.push('Agente experimentado');
        }
      }
      
      // Only include candidates with some compatibility
      if (compatibilityScore > 0) {
        candidates.push({
          userId: candidate.userId,
          name: `Agente ${candidate.userId}`, // TODO: Get real name from users table
          role: 'Agente', // TODO: Get from users table
          area: 'Contact Center', // TODO: Get from team_assignments
          strengths: candidatePerf.strengths,
          weaknesses: candidatePerf.weaknesses,
          compatibilityScore,
          matchReasons
        });
      }
    } catch (error) {
      // Skip candidates with insufficient data
      continue;
    }
  }
  
  // Sort by compatibility score (highest first)
  candidates.sort((a, b) => b.compatibilityScore - a.compatibilityScore);
  
  return candidates.slice(0, 5); // Return top 5 matches
}

/**
 * Create a buddy pair
 */
export async function createBuddyPair(
  agentId: number,
  buddyId: number
): Promise<number> {
  const db = await getDb();
  if (!db) throw new Error('Database connection failed');
  
  // Import buddyPairs from schema
  const { buddyPairs } = await import('../drizzle/schema');
  
  // Check if either agent is already in an active buddy pair
  const existingPairs = await db
    .select()
    .from(buddyPairs)
    .where(
      and(
        sql`(${buddyPairs.agentId1} = ${agentId} OR ${buddyPairs.agentId2} = ${agentId} OR ${buddyPairs.agentId1} = ${buddyId} OR ${buddyPairs.agentId2} = ${buddyId})`,
        eq(buddyPairs.status, 'active')
      )
    );
  
  if (existingPairs.length > 0) {
    throw new Error('One or both agents are already in an active buddy pair');
  }
  
  // Create the pair
  const [result] = await db
    .insert(buddyPairs)
    .values({
      agentId1: agentId,
      agentId2: buddyId,
      status: 'active'
    })
    .$returningId();
  
  return result.id;
}

/**
 * Get buddy pair for an agent
 */
export async function getBuddyPair(userId: number) {
  const db = await getDb();
  if (!db) throw new Error('Database connection failed');
  
  const { buddyPairs } = await import('../drizzle/schema');
  
  const [pair] = await db
    .select()
    .from(buddyPairs)
    .where(
      and(
        sql`(${buddyPairs.agentId1} = ${userId} OR ${buddyPairs.agentId2} = ${userId})`,
        eq(buddyPairs.status, 'active')
      )
    )
    .limit(1);
  
  if (!pair) return null;
  
  // Determine who is the buddy (the other person)
  const buddyUserId = pair.agentId1 === userId ? pair.agentId2 : pair.agentId1;
  
  return {
    ...pair,
    buddyUserId
  };
}

/**
 * Update buddy pair progress
 */
export async function updateBuddyProgress(
  pairId: number,
  sharedGoal?: string
): Promise<void> {
  const db = await getDb();
  if (!db) throw new Error('Database connection failed');
  
  const { buddyPairs } = await import('../drizzle/schema');
  
  await db
    .update(buddyPairs)
    .set({
      sharedGoal
    })
    .where(eq(buddyPairs.id, pairId));
}

/**
 * End a buddy pair
 */
export async function endBuddyPair(pairId: number): Promise<void> {
  const db = await getDb();
  if (!db) throw new Error('Database connection failed');
  
  const { buddyPairs } = await import('../drizzle/schema');
  
  await db
    .update(buddyPairs)
    .set({ status: 'completed' })
    .where(eq(buddyPairs.id, pairId));
}
