import { supabase } from "./supabaseClient";

/**
 * Sincronizar datos de simulaciones completadas a Supabase
 */
export async function syncSimulationToSupabase(simulationData: {
  userId: number;
  scenarioId: number;
  categoryId: number;
  overallScore: number;
  duration: number;
  completedAt: Date;
  feedback: string;
  categoryScores: Record<string, number>;
}) {
  try {
    const { data, error } = await supabase
      .from("simulations")
      .insert([
        {
          user_id: simulationData.userId,
          scenario_id: simulationData.scenarioId,
          category_id: simulationData.categoryId,
          overall_score: simulationData.overallScore,
          duration: simulationData.duration,
          completed_at: simulationData.completedAt.toISOString(),
          feedback: simulationData.feedback,
          category_scores: simulationData.categoryScores,
          synced_at: new Date().toISOString(),
        },
      ])
      .select();

    if (error) {
      console.error("Error syncing simulation to Supabase:", error);
      return null;
    }

    return data?.[0] || null;
  } catch (error) {
    console.error("Error syncing simulation to Supabase:", error);
    return null;
  }
}

/**
 * Obtener datos de usuario desde Supabase
 */
export async function getUserFromSupabase(userId: number) {
  try {
    const { data, error } = await supabase
      .from("users")
      .select("*")
      .eq("id", userId)
      .single();

    if (error) {
      console.error("Error fetching user from Supabase:", error);
      return null;
    }

    return data;
  } catch (error) {
    console.error("Error fetching user from Supabase:", error);
    return null;
  }
}

/**
 * Obtener estadísticas de usuario desde Supabase
 */
export async function getUserStatsFromSupabase(userId: number) {
  try {
    const { data, error } = await supabase
      .from("user_stats")
      .select("*")
      .eq("user_id", userId)
      .single();

    if (error) {
      console.error("Error fetching user stats from Supabase:", error);
      return null;
    }

    return data;
  } catch (error) {
    console.error("Error fetching user stats from Supabase:", error);
    return null;
  }
}

/**
 * Obtener todas las simulaciones de un usuario desde Supabase
 */
export async function getUserSimulationsFromSupabase(userId: number) {
  try {
    const { data, error } = await supabase
      .from("simulations")
      .select("*")
      .eq("user_id", userId)
      .order("completed_at", { ascending: false });

    if (error) {
      console.error("Error fetching user simulations from Supabase:", error);
      return [];
    }

    return data || [];
  } catch (error) {
    console.error("Error fetching user simulations from Supabase:", error);
    return [];
  }
}

/**
 * Actualizar perfil de usuario en Supabase
 */
export async function updateUserProfileInSupabase(
  userId: number,
  updates: Record<string, any>
) {
  try {
    const { data, error } = await supabase
      .from("users")
      .update(updates)
      .eq("id", userId)
      .select();

    if (error) {
      console.error("Error updating user profile in Supabase:", error);
      return null;
    }

    return data?.[0] || null;
  } catch (error) {
    console.error("Error updating user profile in Supabase:", error);
    return null;
  }
}

/**
 * Obtener leaderboard desde Supabase
 */
export async function getLeaderboardFromSupabase(limit: number = 10) {
  try {
    const { data, error } = await supabase
      .from("user_stats")
      .select("user_id, total_points, average_score")
      .order("total_points", { ascending: false })
      .limit(limit);

    if (error) {
      console.error("Error fetching leaderboard from Supabase:", error);
      return [];
    }

    return data || [];
  } catch (error) {
    console.error("Error fetching leaderboard from Supabase:", error);
    return [];
  }
}
