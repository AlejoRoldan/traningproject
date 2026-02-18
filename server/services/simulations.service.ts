/**
 * Simulations Service
 * Capa de envoltura que encapsula la lógica de Supabase para tRPC
 * Proporciona fallback automático a MySQL si Supabase no está disponible
 */

import { TRPCError } from '@trpc/server';
import * as supabaseClient from '../supabase-client';
import * as db from '../db';
import { getDb } from '../db';
import { simulations, messages } from '../../drizzle/schema';
import { eq } from 'drizzle-orm';

export interface SimulationInput {
  userId: string | number;
  scenarioId: string | number;
  isPracticeMode?: boolean;
}

export interface MessageInput {
  simulationId: string | number;
  role: 'agent' | 'client';
  content: string;
}

export interface CompleteSimulationInput {
  simulationId: string | number;
  overallScore: number;
}

/**
 * Obtener simulaciones del usuario
 * Intenta Supabase primero, fallback a MySQL
 */
export async function getUserSimulations(userId: string | number, limit: number = 5) {
  try {
    const simulations = await supabaseClient.getUserSimulationsFromSupabase(
      String(userId),
      limit
    );
    if (simulations && simulations.length > 0) {
      return simulations;
    }
  } catch (error) {
    console.warn('[SimulationsService] Supabase unavailable for getUserSimulations:', error);
  }

  // Fallback a MySQL
  try {
    return await db.getUserSimulations(Number(userId), limit);
  } catch (fallbackError) {
    console.error('[SimulationsService] MySQL fallback also failed:', fallbackError);
    throw new TRPCError({
      code: 'INTERNAL_SERVER_ERROR',
      message: 'No se pudieron obtener las simulaciones',
    });
  }
}

/**
 * Crear nueva simulación
 * Intenta Supabase primero, fallback a MySQL
 */
export async function createSimulation(input: SimulationInput) {
  try {
    const result = await supabaseClient.createSimulationInSupabase({
      user_id: String(input.userId),
      scenario_id: String(input.scenarioId),
      is_practice_mode: input.isPracticeMode || false,
    });
    return {
      success: true,
      simulationId: result.id,
      source: 'supabase',
    };
  } catch (error) {
    console.warn('[SimulationsService] Supabase unavailable for createSimulation:', error);
  }

  // Fallback a MySQL
  try {
    const database = await getDb();
    if (!database) {
      throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR' });
    }

    const [result] = await database
      .insert(simulations)
      .values({
        userId: Number(input.userId),
        scenarioId: Number(input.scenarioId),
        isPracticeMode: input.isPracticeMode ? 1 : 0,
        status: 'in_progress',
      })
      .$returningId();

    return {
      success: true,
      simulationId: result.id,
      source: 'mysql',
    };
  } catch (fallbackError) {
    console.error('[SimulationsService] MySQL fallback also failed:', fallbackError);
    throw new TRPCError({
      code: 'INTERNAL_SERVER_ERROR',
      message: 'Error al crear simulación',
    });
  }
}

/**
 * Agregar mensaje a simulación
 * Intenta Supabase primero, fallback a MySQL
 */
export async function addMessage(input: MessageInput) {
  try {
    const result = await supabaseClient.addMessageToSupabase({
      simulation_id: String(input.simulationId),
      role: input.role,
      content: input.content,
    });
    return {
      success: true,
      messageId: result.id,
      source: 'supabase',
    };
  } catch (error) {
    console.warn('[SimulationsService] Supabase unavailable for addMessage:', error);
  }

  // Fallback a MySQL
  try {
    const database = await getDb();
    if (!database) {
      throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR' });
    }

    const [result] = await database
      .insert(messages)
      .values({
        simulationId: Number(input.simulationId),
        role: input.role,
        content: input.content,
      })
      .$returningId();

    return {
      success: true,
      messageId: result.id,
      source: 'mysql',
    };
  } catch (fallbackError) {
    console.error('[SimulationsService] MySQL fallback also failed:', fallbackError);
    throw new TRPCError({
      code: 'INTERNAL_SERVER_ERROR',
      message: 'Error al guardar mensaje',
    });
  }
}

/**
 * Completar simulación
 * Intenta Supabase primero, fallback a MySQL
 */
export async function completeSimulation(input: CompleteSimulationInput) {
  try {
    const result = await supabaseClient.completeSimulationInSupabase(
      String(input.simulationId),
      {
        overall_score: input.overallScore,
      }
    );
    return {
      success: true,
      simulationId: result.id,
      source: 'supabase',
    };
  } catch (error) {
    console.warn('[SimulationsService] Supabase unavailable for completeSimulation:', error);
  }

  // Fallback a MySQL
  try {
    const database = await getDb();
    if (!database) {
      throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR' });
    }

    await database
      .update(simulations)
      .set({
        status: 'completed',
        overallScore: input.overallScore,
      })
      .where(eq(simulations.id, Number(input.simulationId)));

    return {
      success: true,
      simulationId: Number(input.simulationId),
      source: 'mysql',
    };
  } catch (fallbackError) {
    console.error('[SimulationsService] MySQL fallback also failed:', fallbackError);
    throw new TRPCError({
      code: 'INTERNAL_SERVER_ERROR',
      message: 'Error al completar simulación',
    });
  }
}

/**
 * Obtener simulación por ID
 * Intenta Supabase primero, fallback a MySQL
 */
export async function getSimulationById(simulationId: string | number) {
  try {
    const simulation = await supabaseClient.getSimulationFromSupabase(String(simulationId));
    if (simulation) {
      return simulation;
    }
  } catch (error) {
    console.warn('[SimulationsService] Supabase unavailable for getSimulationById:', error);
  }

  // Fallback a MySQL
  try {
    return await db.getSimulationById(Number(simulationId));
  } catch (fallbackError) {
    console.error('[SimulationsService] MySQL fallback also failed:', fallbackError);
    throw new TRPCError({
      code: 'NOT_FOUND',
      message: 'Simulación no encontrada',
    });
  }
}

/**
 * Obtener mensajes de simulación
 * Intenta Supabase primero, fallback a MySQL
 */
export async function getSimulationMessages(simulationId: string | number) {
  try {
    return await db.getSimulationMessages(Number(simulationId));
  } catch (error) {
    console.error('[SimulationsService] Error getting simulation messages:', error);
    throw new TRPCError({
      code: 'INTERNAL_SERVER_ERROR',
      message: 'Error al obtener mensajes',
    });
  }
}
