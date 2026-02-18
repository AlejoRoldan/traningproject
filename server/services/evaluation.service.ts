import {
  evaluateSimulationWithGPT,
  generatePersonalizedFeedback,
  analyzeTrendAnalysis,
} from "../openai-client";
import { supabase } from "../supabase-client";

/**
 * Evalúa una simulación completada usando GPT-4o
 * Guarda los resultados en Supabase
 */
export async function evaluateCompletedSimulation(
  simulationId: string,
  userId: string,
  scenarioTitle: string,
  scenarioContext: string
) {
  try {
    if (!supabase) {
      return {
        success: false,
        error: "Supabase client not initialized",
      };
    }

    // Obtener mensajes de la simulación
    const { data: messages, error: messagesError } = await supabase
      .from("messages")
      .select("*")
      .eq("simulation_id", simulationId)
      .order("created_at", { ascending: true });

    if (messagesError) throw messagesError;

    if (!messages || messages.length === 0) {
      return {
        success: false,
        error: "No messages found for this simulation",
      };
    }

    // Separar mensajes de agente y cliente
    const agentMessages = messages
      .filter((m: any) => m.role === "agent")
      .map((m: any) => ({
        role: "agent",
        content: m.content,
      }));

    const customerMessages = messages
      .filter((m: any) => m.role === "customer")
      .map((m: any) => ({
        role: "customer",
        content: m.content,
      }));

    // Evaluar con GPT-4o
    const evaluationResult = await evaluateSimulationWithGPT(
      agentMessages,
      customerMessages,
      scenarioContext,
      scenarioTitle
    );

    if (!evaluationResult.success) {
      return {
        success: false,
        error: evaluationResult.error,
      };
    }

    // Guardar evaluación en Supabase
    const { data: evaluation, error: saveError } = await supabase
      .from("evaluations")
      .insert({
        simulation_id: simulationId,
        overall_score: evaluationResult.evaluation.overall_score,
        communication_score: evaluationResult.evaluation.communication_score,
        empathy_score: evaluationResult.evaluation.empathy_score,
        problem_solving_score:
          evaluationResult.evaluation.problem_solving_score,
        compliance_score: evaluationResult.evaluation.compliance_score,
        professionalism_score:
          evaluationResult.evaluation.professionalism_score,
        strengths: evaluationResult.evaluation.strengths,
        areas_for_improvement:
          evaluationResult.evaluation.areas_for_improvement,
        key_feedback: evaluationResult.evaluation.key_feedback,
        recommendations: evaluationResult.evaluation.recommendations,
        evaluated_at: new Date().toISOString(),
      })
      .select()
      .single();

    if (saveError) throw saveError;

    // Generar feedback personalizado
    const feedbackResult = await generatePersonalizedFeedback(
      userId,
      evaluationResult.evaluation
    );

    if (feedbackResult.success) {
      // Guardar feedback en la tabla de evaluaciones o en una tabla separada
      await supabase
        .from("evaluations")
        .update({
          personalized_feedback: feedbackResult.feedback,
        })
        .eq("id", evaluation.id);
    }

    return {
      success: true,
      evaluation: evaluation,
      feedback: feedbackResult.feedback,
      usage: evaluationResult.usage,
    };
  } catch (error) {
    console.error("Error evaluating simulation:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
}

/**
 * Obtiene el análisis de tendencias para un usuario
 */
export async function getUserTrendAnalysis(userId: string) {
  try {
    if (!supabase) {
      return {
        success: false,
        error: "Supabase client not initialized",
      };
    }

    // Obtener últimas 10 simulaciones del usuario
    const { data: simulations, error: simError } = await supabase
      .from("simulations")
      .select(
        `
        id,
        scenario_id,
        status,
        created_at,
        evaluations (
          overall_score,
          communication_score,
          empathy_score,
          problem_solving_score,
          compliance_score,
          professionalism_score
        )
      `
      )
      .eq("user_id", userId)
      .order("created_at", { ascending: false })
      .limit(10);

    if (simError) throw simError;

    if (!simulations || simulations.length === 0) {
      return {
        success: false,
        error: "No simulations found for this user",
      };
    }

    // Preparar datos para análisis de tendencias
    const simulationHistory = simulations.map((sim: any) => ({
      simulation_id: sim.id,
      date: sim.created_at,
      scores: sim.evaluations?.[0] || {},
    }));

    // Analizar tendencias con GPT-4o
    const trendResult = await analyzeTrendAnalysis(simulationHistory);

    if (!trendResult.success) {
      return {
        success: false,
        error: trendResult.error,
      };
    }

    return {
      success: true,
      analysis: trendResult.analysis,
      simulation_count: simulations.length,
      usage: trendResult.usage,
    };
  } catch (error) {
    console.error("Error analyzing trends:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
}

/**
 * Obtiene evaluaciones recientes para un usuario
 */
export async function getUserRecentEvaluations(userId: string, limit = 5) {
  try {
    if (!supabase) {
      return {
        success: false,
        error: "Supabase client not initialized",
      };
    }

    const { data: evaluations, error } = await supabase
      .from("evaluations")
      .select(
        `
        id,
        simulation_id,
        overall_score,
        communication_score,
        empathy_score,
        problem_solving_score,
        compliance_score,
        professionalism_score,
        key_feedback,
        evaluated_at,
        simulations (
          id,
          scenario_id,
          created_at,
          scenarios (
            title
          )
        )
      `
      )
      .eq("simulations.user_id", userId)
      .order("evaluated_at", { ascending: false })
      .limit(limit);

    if (error) throw error;

    return {
      success: true,
      evaluations: evaluations || [],
    };
  } catch (error) {
    console.error("Error fetching recent evaluations:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
      evaluations: [],
    };
  }
}

/**
 * Calcula estadísticas de desempeño para un usuario
 */
export async function calculateUserPerformanceStats(userId: string) {
  try {
    if (!supabase) {
      return {
        success: false,
        error: "Supabase client not initialized",
      };
    }

    const { data: evaluations, error } = await supabase
      .from("evaluations")
      .select("*")
      .eq("simulations.user_id", userId);

    if (error) throw error;

    if (!evaluations || evaluations.length === 0) {
      return {
        success: true,
        stats: {
          total_simulations: 0,
          average_score: 0,
          best_score: 0,
          worst_score: 0,
          improvement_trend: "no_data",
        },
      };
    }

    const scores = evaluations
      .map((e: any) => e.overall_score)
      .filter((s: any) => s !== null);

    const stats = {
      total_simulations: evaluations.length,
      average_score:
        scores.length > 0
          ? Math.round(scores.reduce((a: number, b: number) => a + b, 0) / scores.length)
          : 0,
      best_score: scores.length > 0 ? Math.max(...scores) : 0,
      worst_score: scores.length > 0 ? Math.min(...scores) : 0,
      improvement_trend:
        scores.length > 1
          ? scores[scores.length - 1] > scores[0]
            ? "improving"
            : "declining"
          : "stable",
    };

    return {
      success: true,
      stats,
    };
  } catch (error) {
    console.error("Error calculating performance stats:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
      stats: null,
    };
  }
}
