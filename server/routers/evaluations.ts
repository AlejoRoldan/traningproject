import { router, protectedProcedure } from "../_core/trpc";
import { z } from "zod";
import {
  evaluateCompletedSimulation,
  getUserTrendAnalysis,
  getUserRecentEvaluations,
  calculateUserPerformanceStats,
} from "../services/evaluation.service";

export const evaluationsRouter = router({
  /**
   * Evalúa una simulación completada usando GPT-4o
   */
  evaluateSimulation: protectedProcedure
    .input(
      z.object({
        simulationId: z.string(),
        scenarioTitle: z.string(),
        scenarioContext: z.string(),
      })
    )
    .mutation(async ({ input, ctx }) => {
      const result = await evaluateCompletedSimulation(
        input.simulationId,
        String(ctx.user.id),
        input.scenarioTitle,
        input.scenarioContext
      );

      if (!result.success) {
        throw new Error(result.error);
      }

      return {
        evaluation: result.evaluation,
        feedback: result.feedback,
        usage: result.usage,
      };
    }),

  /**
   * Obtiene el análisis de tendencias para el usuario actual
   */
  getTrendAnalysis: protectedProcedure.query(async ({ ctx }) => {
    const result = await getUserTrendAnalysis(String(ctx.user.id));

    if (!result.success) {
      throw new Error(result.error);
    }

    return {
      analysis: result.analysis,
      simulationCount: result.simulation_count,
      usage: result.usage,
    };
  }),

  /**
   * Obtiene evaluaciones recientes del usuario actual
   */
  getRecentEvaluations: protectedProcedure
    .input(
      z.object({
        limit: z.number().min(1).max(20).optional().default(5),
      })
    )
    .query(async ({ input, ctx }) => {
      const result = await getUserRecentEvaluations(String(ctx.user.id), input.limit);

      if (!result.success) {
        throw new Error(result.error);
      }

      return {
        evaluations: result.evaluations,
      };
    }),

  /**
   * Calcula estadísticas de desempeño para el usuario actual
   */
  getPerformanceStats: protectedProcedure.query(async ({ ctx }) => {
    const result = await calculateUserPerformanceStats(String(ctx.user.id));

    if (!result.success) {
      throw new Error(result.error);
    }

    return {
      stats: result.stats,
    };
  }),

  /**
   * Obtiene evaluación detallada de una simulación específica
   */
  getSimulationEvaluation: protectedProcedure
    .input(
      z.object({
        simulationId: z.string(),
      })
    )
    .query(async ({ input, ctx }) => {
      // Esta función obtendría los detalles de una evaluación específica
      // Implementar según sea necesario
      return {
        simulationId: input.simulationId,
        userId: ctx.user.id,
      };
    }),
});
