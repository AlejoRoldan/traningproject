import { getDb } from '../db';
import { simulations, coachingAlerts, users, teamAssignments } from '../../drizzle/schema';
import { eq, desc, and, sql } from "drizzle-orm";

/**
 * Alert Service
 * 
 * Automatically generates alerts for supervisors based on agent performance.
 */

interface AlertData {
  userId: number;
  supervisorId: number | null;
  type: 'low_performance' | 'stagnation' | 'improvement' | 'milestone';
  severity: 'low' | 'medium' | 'high' | 'critical';
  title: string;
  message: string;
  metadata: Record<string, any>;
}

/**
 * Get supervisor ID for a given agent
 */
async function getSupervisorId(userId: number): Promise<number | null> {
  const db = await getDb();
  if (!db) return null;

  // First check if user has direct supervisor
  const [user] = await db
    .select()
    .from(users)
    .where(eq(users.id, userId))
    .limit(1);

  if (user?.supervisorId) {
    return user.supervisorId;
  }

  // Otherwise, check team assignments
  const [assignment] = await db
    .select()
    .from(teamAssignments)
    .where(eq(teamAssignments.userId, userId))
    .limit(1);

  return assignment?.supervisorId || null;
}

/**
 * Create coaching alert
 */
async function createAlert(alertData: AlertData): Promise<void> {
  const db = await getDb();
  if (!db) throw new Error('Database connection failed');

  await db.insert(coachingAlerts).values({
    userId: alertData.userId,
    supervisorId: alertData.supervisorId,
    type: alertData.type,
    severity: alertData.severity,
    title: alertData.title,
    message: alertData.message,
    metadata: JSON.stringify(alertData.metadata),
    status: 'pending'
  });
}

/**
 * Check for low performance pattern (3+ consecutive simulations <60%)
 */
export async function checkLowPerformance(userId: number): Promise<void> {
  const db = await getDb();
  if (!db) throw new Error('Database connection failed');

  // Get last 5 completed simulations
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
    .limit(5);

  if (recentSims.length < 3) return;

  // Check if last 3 are all below 60
  const last3 = recentSims.slice(0, 3);
  const allBelow60 = last3.every(sim => {
    const score = sim.overallScore || 0;
    return score < 60;
  });

  if (allBelow60) {
    const avgScore = Math.round(
      last3.reduce((sum, sim) => sum + (sim.overallScore || 0), 0) / 3
    );

    const supervisorId = await getSupervisorId(userId);

    await createAlert({
      userId,
      supervisorId,
      type: 'low_performance',
      severity: avgScore < 50 ? 'critical' : 'high',
      title: 'Rendimiento Bajo Detectado',
      message: `El agente ha tenido 3 simulaciones consecutivas con puntuación baja (promedio: ${avgScore}%). Se recomienda intervención inmediata.`,
      metadata: {
        avgScore,
        simulationIds: last3.map(s => s.id),
        pattern: 'consecutive_low_scores'
      }
    });
  }
}

/**
 * Check for stagnation (no improvement in 5+ simulations)
 */
export async function checkStagnation(userId: number): Promise<void> {
  const db = await getDb();
  if (!db) throw new Error('Database connection failed');

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
    .limit(7);

  if (recentSims.length < 5) return;

  // Calculate trend: compare first 3 vs last 3
  const oldest3 = recentSims.slice(4, 7);
  const newest3 = recentSims.slice(0, 3);

  if (oldest3.length < 3 || newest3.length < 3) return;

  const oldAvg = oldest3.reduce((sum, sim) => sum + (sim.overallScore || 0), 0) / 3;
  const newAvg = newest3.reduce((sum, sim) => sum + (sim.overallScore || 0), 0) / 3;

  // If improvement is less than 3 points, consider it stagnation
  const improvement = newAvg - oldAvg;

  if (improvement < 3 && improvement > -3) {
    const supervisorId = await getSupervisorId(userId);

    await createAlert({
      userId,
      supervisorId,
      type: 'stagnation',
      severity: 'medium',
      title: 'Estancamiento Detectado',
      message: `El agente no ha mostrado mejora significativa en las últimas simulaciones (promedio: ${Math.round(newAvg)}%). Considere revisar el plan de coaching.`,
      metadata: {
        oldAvg: Math.round(oldAvg),
        newAvg: Math.round(newAvg),
        improvement: Math.round(improvement),
        pattern: 'no_improvement'
      }
    });
  }
}

/**
 * Check for significant improvement (15+ points increase in weak category)
 */
export async function checkImprovement(userId: number, currentSimulation: any): Promise<void> {
  const db = await getDb();
  if (!db) throw new Error('Database connection failed');

  // Get previous 5 simulations
  const previousSims = await db
    .select()
    .from(simulations)
    .where(
      and(
        eq(simulations.userId, userId),
        eq(simulations.status, 'completed'),
        sql`${simulations.isPracticeMode} = 0`,
        sql`${simulations.id} < ${currentSimulation.id}`
      )
    )
    .orderBy(desc(simulations.completedAt))
    .limit(5);

  if (previousSims.length < 3) return;

  const currentScores = typeof currentSimulation.categoryScores === 'string'
    ? JSON.parse(currentSimulation.categoryScores)
    : currentSimulation.categoryScores;

  if (!currentScores) return;

  // Calculate average scores for each category from previous sims
  const categoryAverages: Record<string, number> = {};
  
  for (const sim of previousSims) {
    const scores = typeof sim.categoryScores === 'string'
      ? JSON.parse(sim.categoryScores)
      : sim.categoryScores;
    
    if (!scores) continue;

    for (const [category, score] of Object.entries(scores)) {
      if (!categoryAverages[category]) {
        categoryAverages[category] = 0;
      }
      categoryAverages[category] += score as number;
    }
  }

  // Find categories with significant improvement
  for (const [category, currentScore] of Object.entries(currentScores)) {
    const prevAvg = categoryAverages[category] / previousSims.length;
    const improvement = (currentScore as number) - prevAvg;

    if (improvement >= 15) {
      const supervisorId = await getSupervisorId(userId);

      await createAlert({
        userId,
        supervisorId,
        type: 'improvement',
        severity: 'low',
        title: '¡Mejora Significativa!',
        message: `El agente ha mejorado significativamente en ${category} (+${Math.round(improvement)} puntos). ¡Felicítalo!`,
        metadata: {
          category,
          previousAvg: Math.round(prevAvg),
          currentScore: Math.round(currentScore as number),
          improvement: Math.round(improvement),
          pattern: 'significant_improvement'
        }
      });
    }
  }
}

/**
 * Check for milestones (coaching plan completed, level up, etc.)
 */
export async function checkMilestone(userId: number, milestoneType: string, metadata: Record<string, any>): Promise<void> {
  const supervisorId = await getSupervisorId(userId);

  const milestoneMessages: Record<string, { title: string; message: string }> = {
    coaching_plan_completed: {
      title: 'Plan de Coaching Completado',
      message: 'El agente ha completado exitosamente su plan de coaching. Considera generar un nuevo plan o reconocer su logro.'
    },
    level_up: {
      title: 'Nivel Alcanzado',
      message: `El agente ha alcanzado el nivel ${metadata.newLevel}. ¡Celebra este logro!`
    },
    expert_achieved: {
      title: '¡Nivel Experto Alcanzado!',
      message: 'El agente ha alcanzado el nivel experto en todas las categorías. Considera asignarle como mentor.'
    }
  };

  const milestone = milestoneMessages[milestoneType];
  if (!milestone) return;

  await createAlert({
    userId,
    supervisorId,
    type: 'milestone',
    severity: 'low',
    title: milestone.title,
    message: milestone.message,
    metadata: {
      milestoneType,
      ...metadata
    }
  });
}

/**
 * Run all alert checks after a simulation is completed
 */
export async function runAlertChecks(userId: number, simulationId: number): Promise<void> {
  const db = await getDb();
  if (!db) return;

  const [simulation] = await db
    .select()
    .from(simulations)
    .where(eq(simulations.id, simulationId))
    .limit(1);

  if (!simulation || simulation.isPracticeMode) return;

  // Run checks in parallel
  await Promise.all([
    checkLowPerformance(userId),
    checkStagnation(userId),
    checkImprovement(userId, simulation)
  ]);
}
