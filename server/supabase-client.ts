import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.warn("[Supabase] Missing credentials - Supabase integration disabled");
}

export const supabase = supabaseUrl && supabaseServiceKey
  ? createClient(supabaseUrl, supabaseServiceKey)
  : null;

// User queries
export async function getUserFromSupabase(userId: string) {
  if (!supabase) return null;

  try {
    const { data, error } = await supabase
      .from("users")
      .select("*")
      .eq("id", userId)
      .single();

    if (error) {
      console.error("[Supabase] Error fetching user:", error);
      return null;
    }

    return data;
  } catch (error) {
    console.error("[Supabase] Error fetching user:", error);
    return null;
  }
}

export async function upsertUserToSupabase(userData: any) {
  if (!supabase) {
    console.warn("[Supabase] Client not available");
    return null;
  }

  try {
    const { data, error } = await supabase
      .from("users")
      .upsert([userData], { onConflict: "id" })
      .select()
      .single();

    if (error) {
      console.error("[Supabase] Error upserting user:", error);
      throw error;
    }

    return data;
  } catch (error) {
    console.error("[Supabase] Error upserting user:", error);
    throw error;
  }
}

// Simulation queries
export async function getUserSimulationsFromSupabase(userId: string, limit = 5) {
  if (!supabase) return [];

  try {
    const { data, error } = await supabase
      .from("simulations")
      .select(
        `
        id,
        user_id,
        scenario_id,
        status,
        started_at,
        completed_at,
        duration_seconds,
        overall_score,
        scenarios (
          id,
          title,
          description
        )
      `
      )
      .eq("user_id", userId)
      .order("started_at", { ascending: false })
      .limit(limit);

    if (error) {
      console.error("[Supabase] Error fetching simulations:", error);
      return [];
    }

    return (data || []).map((sim: any) => ({
      id: sim.id,
      title: sim.scenarios?.title || "Unknown Scenario",
      score: sim.overall_score || 0,
      status: sim.status,
      startedAt: sim.started_at,
      completedAt: sim.completed_at,
      duration: sim.duration_seconds,
    }));
  } catch (error) {
    console.error("[Supabase] Error fetching simulations:", error);
    return [];
  }
}

export async function getSimulationFromSupabase(simulationId: string) {
  if (!supabase) return null;

  try {
    const { data, error } = await supabase
      .from("simulations")
      .select(
        `
        *,
        scenarios (*),
        evaluations (*),
        messages (*)
      `
      )
      .eq("id", simulationId)
      .single();

    if (error) {
      console.error("[Supabase] Error fetching simulation:", error);
      return null;
    }

    return data;
  } catch (error) {
    console.error("[Supabase] Error fetching simulation:", error);
    return null;
  }
}

export async function createSimulationInSupabase(data: {
  user_id: string;
  scenario_id: string;
  is_practice_mode?: boolean;
}) {
  if (!supabase) {
    throw new Error("Supabase client not available");
  }

  try {
    const { data: result, error } = await supabase
      .from("simulations")
      .insert([
        {
          user_id: data.user_id,
          scenario_id: data.scenario_id,
          is_practice_mode: data.is_practice_mode || false,
          status: "in_progress",
          started_at: new Date().toISOString(),
        },
      ])
      .select()
      .single();

    if (error) {
      console.error("[Supabase] Error creating simulation:", error);
      throw error;
    }

    return result;
  } catch (error) {
    console.error("[Supabase] Error creating simulation:", error);
    throw error;
  }
}

export async function completeSimulationInSupabase(
  simulationId: string,
  data: {
    overall_score: number;
    feedback?: string;
    strengths?: string[];
    weaknesses?: string[];
  }
) {
  if (!supabase) {
    throw new Error("Supabase client not available");
  }

  try {
    const { data: result, error } = await supabase
      .from("simulations")
      .update({
        status: "completed",
        completed_at: new Date().toISOString(),
        overall_score: data.overall_score,
        feedback: data.feedback,
        strengths: data.strengths,
        weaknesses: data.weaknesses,
      })
      .eq("id", simulationId)
      .select()
      .single();

    if (error) {
      console.error("[Supabase] Error completing simulation:", error);
      throw error;
    }

    return result;
  } catch (error) {
    console.error("[Supabase] Error completing simulation:", error);
    throw error;
  }
}

// Message queries
export async function addMessageToSupabase(data: {
  simulation_id: string;
  role: "agent" | "client" | "system";
  content: string;
}) {
  if (!supabase) {
    throw new Error("Supabase client not available");
  }

  try {
    const { data: result, error } = await supabase
      .from("messages")
      .insert([
        {
          simulation_id: data.simulation_id,
          role: data.role,
          content: data.content,
          timestamp: new Date().toISOString(),
        },
      ])
      .select()
      .single();

    if (error) {
      console.error("[Supabase] Error adding message:", error);
      throw error;
    }

    return result;
  } catch (error) {
    console.error("[Supabase] Error adding message:", error);
    throw error;
  }
}

export async function getSimulationMessagesFromSupabase(simulationId: string) {
  if (!supabase) return [];

  try {
    const { data, error } = await supabase
      .from("messages")
      .select("*")
      .eq("simulation_id", simulationId)
      .order("timestamp", { ascending: true });

    if (error) {
      console.error("[Supabase] Error fetching messages:", error);
      return [];
    }

    return data || [];
  } catch (error) {
    console.error("[Supabase] Error fetching messages:", error);
    return [];
  }
}

// Scenario queries
export async function getScenariosFromSupabase(filters?: {
  category?: string;
  complexity?: number;
}) {
  if (!supabase) return [];

  try {
    let query = supabase.from("scenarios").select("*");

    if (filters?.category) {
      query = query.eq("category", filters.category);
    }

    if (filters?.complexity) {
      query = query.eq("complexity", filters.complexity);
    }

    const { data, error } = await query;

    if (error) {
      console.error("[Supabase] Error fetching scenarios:", error);
      return [];
    }

    return data || [];
  } catch (error) {
    console.error("[Supabase] Error fetching scenarios:", error);
    return [];
  }
}

export async function getScenarioFromSupabase(scenarioId: string) {
  if (!supabase) return null;

  try {
    const { data, error } = await supabase
      .from("scenarios")
      .select("*")
      .eq("id", scenarioId)
      .single();

    if (error) {
      console.error("[Supabase] Error fetching scenario:", error);
      return null;
    }

    return data;
  } catch (error) {
    console.error("[Supabase] Error fetching scenario:", error);
    return null;
  }
}

// User stats
export async function getUserStatsFromSupabase(userId: string) {
  if (!supabase) {
    return {
      totalSimulations: 0,
      completedSimulations: 0,
      averageScore: 0,
      inProgressCount: 0,
    };
  }

  try {
    const { data, error } = await supabase
      .from("simulations")
      .select("status, overall_score")
      .eq("user_id", userId);

    if (error) {
      console.error("[Supabase] Error fetching user stats:", error);
      return {
        totalSimulations: 0,
        completedSimulations: 0,
        averageScore: 0,
        inProgressCount: 0,
      };
    }

    const simulations = data || [];
    const totalSimulations = simulations.length;
    const completedSimulations = simulations.filter(
      (s: any) => s.status === "completed"
    ).length;
    const averageScore =
      simulations.length > 0
        ? Math.round(
            simulations.reduce((sum: number, s: any) => sum + (s.overall_score || 0), 0) /
              simulations.length
          )
        : 0;

    return {
      totalSimulations,
      completedSimulations,
      averageScore,
      inProgressCount: simulations.filter((s: any) => s.status === "in_progress")
        .length,
    };
  } catch (error) {
    console.error("[Supabase] Error fetching user stats:", error);
    return {
      totalSimulations: 0,
      completedSimulations: 0,
      averageScore: 0,
      inProgressCount: 0,
    };
  }
}
