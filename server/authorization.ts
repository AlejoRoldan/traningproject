import { TRPCError } from "@trpc/server";
import { getDb } from "./db";
import { teamAssignments, users } from "../drizzle/schema";
import { eq } from "drizzle-orm";

/**
 * Roles de Kaitel basados en organigrama real
 */
export type KaitelRole = "gerente" | "supervisor" | "coordinador" | "analista" | "agente" | "admin";

/**
 * Jerarquía de roles (de mayor a menor autoridad)
 */
const ROLE_HIERARCHY: Record<KaitelRole, number> = {
  admin: 6,
  gerente: 5,
  supervisor: 4,
  coordinador: 3,
  analista: 2,
  agente: 1,
};

/**
 * Middleware para requerir uno o más roles específicos
 * @param allowedRoles - Array de roles permitidos
 * @returns Middleware function para tRPC
 */
export function requireRole(allowedRoles: KaitelRole[]) {
  return async ({ ctx, next }: { ctx: any; next: any }) => {
    if (!ctx.user) {
      throw new TRPCError({
        code: "UNAUTHORIZED",
        message: "Debes iniciar sesión para acceder a este recurso",
      });
    }

    const userRole = ctx.user.role as KaitelRole;
    
    if (!allowedRoles.includes(userRole)) {
      throw new TRPCError({
        code: "FORBIDDEN",
        message: `Esta acción requiere uno de los siguientes roles: ${allowedRoles.join(", ")}`,
      });
    }

    return next({ ctx });
  };
}

/**
 * Middleware para requerir un nivel mínimo en la jerarquía
 * @param minRole - Rol mínimo requerido
 * @returns Middleware function para tRPC
 */
export function requireMinRole(minRole: KaitelRole) {
  return async ({ ctx, next }: { ctx: any; next: any }) => {
    if (!ctx.user) {
      throw new TRPCError({
        code: "UNAUTHORIZED",
        message: "Debes iniciar sesión para acceder a este recurso",
      });
    }

    const userRole = ctx.user.role as KaitelRole;
    const userLevel = ROLE_HIERARCHY[userRole] || 0;
    const minLevel = ROLE_HIERARCHY[minRole];

    if (userLevel < minLevel) {
      throw new TRPCError({
        code: "FORBIDDEN",
        message: `Esta acción requiere rol de ${minRole} o superior`,
      });
    }

    return next({ ctx });
  };
}

/**
 * Verifica si un usuario tiene acceso a un equipo específico
 * - Gerentes y Admin: acceso a todos los equipos
 * - Supervisores: solo su equipo asignado
 * - Coordinadores: solo su área asignada
 * - Analistas y Agentes: solo sus propios datos
 */
export async function canAccessTeamData(userId: number, userRole: KaitelRole, targetUserId: number): Promise<boolean> {
  // Admin y Gerentes tienen acceso total
  if (userRole === "admin" || userRole === "gerente") {
    return true;
  }

  // Agentes y Analistas solo pueden ver sus propios datos
  if (userRole === "agente" || userRole === "analista") {
    return userId === targetUserId;
  }

  // Supervisores y Coordinadores: verificar asignación de equipo
  const db = await getDb();
  if (!db) return false;

  const [userAssignment] = await db.select().from(teamAssignments).where(eq(teamAssignments.userId, userId)).limit(1);
  const [targetAssignment] = await db.select().from(teamAssignments).where(eq(teamAssignments.userId, targetUserId)).limit(1);

  if (!userAssignment || !targetAssignment) {
    return false;
  }

  // Supervisores pueden ver su equipo
  if (userRole === "supervisor") {
    return userAssignment.teamName === targetAssignment.teamName;
  }

  // Coordinadores pueden ver su área
  if (userRole === "coordinador") {
    return userAssignment.area === targetAssignment.area && userAssignment.area !== null;
  }

  return false;
}

/**
 * Verifica si un usuario puede modificar datos de otro usuario
 * - Gerentes: pueden modificar a todos excepto otros gerentes
 * - Supervisores: pueden modificar solo a agentes de su equipo
 * - Otros: no pueden modificar a nadie
 */
export async function canModifyUser(userId: number, userRole: KaitelRole, targetUserId: number, targetRole: KaitelRole): Promise<boolean> {
  // Nadie puede modificarse a sí mismo a través de esta función
  if (userId === targetUserId) {
    return false;
  }

  // Admin puede modificar a todos
  if (userRole === "admin") {
    return true;
  }

  // Gerentes pueden modificar a todos excepto admin y otros gerentes
  if (userRole === "gerente") {
    return targetRole !== "admin" && targetRole !== "gerente";
  }

  // Supervisores solo pueden modificar agentes de su equipo
  if (userRole === "supervisor") {
    if (targetRole !== "agente") {
      return false;
    }

    const db = await getDb();
    if (!db) return false;

    const [userAssignment] = await db.select().from(teamAssignments).where(eq(teamAssignments.userId, userId)).limit(1);
    const [targetAssignment] = await db.select().from(teamAssignments).where(eq(teamAssignments.userId, targetUserId)).limit(1);

    if (!userAssignment || !targetAssignment) {
      return false;
    }

    return userAssignment.teamName === targetAssignment.teamName;
  }

  // Coordinadores, Analistas y Agentes no pueden modificar a nadie
  return false;
}

/**
 * Obtiene los IDs de usuarios que el usuario actual puede ver
 * Útil para filtrar consultas de datos
 */
export async function getAccessibleUserIds(userId: number, userRole: KaitelRole): Promise<number[]> {
  const db = await getDb();
  if (!db) return [userId];

  // Admin y Gerentes pueden ver a todos
  if (userRole === "admin" || userRole === "gerente") {
    const allUsers = await db.select({ id: users.id }).from(users);
    return allUsers.map((u: any) => u.id);
  }

  // Agentes y Analistas solo se ven a sí mismos
  if (userRole === "agente" || userRole === "analista") {
    return [userId];
  }

  // Supervisores y Coordinadores: obtener usuarios de su equipo/área
  const [userAssignment] = await db.select().from(teamAssignments).where(eq(teamAssignments.userId, userId)).limit(1);

  if (!userAssignment) {
    return [userId]; // Si no tiene asignación, solo ve sus propios datos
  }

  let teamMembers: typeof teamAssignments.$inferSelect[] = [];

  if (userRole === "supervisor") {
    teamMembers = await db.select().from(teamAssignments).where(eq(teamAssignments.teamName, userAssignment.teamName));
  } else if (userRole === "coordinador" && userAssignment.area) {
    teamMembers = await db.select().from(teamAssignments).where(eq(teamAssignments.area, userAssignment.area));
  }

  return teamMembers.map((tm: any) => tm.userId);
}
