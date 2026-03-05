import { TRPCError } from "@trpc/server";
import { z } from "zod";
import { COOKIE_NAME } from "@shared/const";
import { getSessionCookieOptions } from "./_core/cookies";
import { systemRouter } from "./_core/systemRouter";
import { protectedProcedure, publicProcedure, router } from "./_core/trpc";
import { invokeLLM } from "./_core/llm";
import {
  addMessage,
  checkAndAwardBadges,
  completeSession,
  createSimulationSession,
  getAllUsers,
  getDb,
  getLeaderboard,
  getLibraryResources,
  getResourceById,
  getScenarioById,
  getScenarios,
  getSessionById,
  getSessionMessages,
  getUserBadges,
  getUserById,
  getUserDashboardStats,
  getUserPerformanceStats,
  getUserSessions,
  updateDailyActivity,
  updateStreak,
  updateUserXP,
  levelThresholds,
} from "./db";

// ─── Role Guards ──────────────────────────────────────────────────────────────

const supervisorProcedure = protectedProcedure.use(({ ctx, next }) => {
  const allowedRoles = ["gerente", "supervisor", "coordinador", "admin"];
  if (!allowedRoles.includes(ctx.user.role)) {
    throw new TRPCError({ code: "FORBIDDEN", message: "Acceso restringido a supervisores o superiores" });
  }
  return next({ ctx });
});

const adminProcedure = protectedProcedure.use(({ ctx, next }) => {
  if (ctx.user.role !== "admin" && ctx.user.role !== "gerente") {
    throw new TRPCError({ code: "FORBIDDEN", message: "Acceso restringido a administradores" });
  }
  return next({ ctx });
});

// ─── Evaluation Service ───────────────────────────────────────────────────────

async function evaluateSimulation(
  messages: { role: "agent" | "client"; content: string }[],
  scenario: { title: string; idealResponseHints: string | null; empathyWeight: string | null; clarityWeight: string | null; protocolWeight: string | null; resolutionWeight: string | null; professionalismWeight: string | null }
) {
  const conversation = messages
    .map(m => `${m.role === "agent" ? "AGENTE" : "CLIENTE"}: ${m.content}`)
    .join("\n");

  const prompt = `Eres un evaluador experto de agentes de contact center bancario. Evalúa la siguiente conversación de entrenamiento.

ESCENARIO: ${scenario.title}
PAUTAS IDEALES: ${scenario.idealResponseHints ?? "No especificadas"}

CONVERSACIÓN:
${conversation}

Evalúa al AGENTE (no al cliente) en estas 5 dimensiones del 0 al 100:

1. EMPATÍA: Capacidad de conectar emocionalmente, validar sentimientos, usar lenguaje empático
2. CLARIDAD: Explicaciones claras, comprensibles, sin jerga técnica innecesaria
3. PROTOCOLO: Cumplimiento de procedimientos bancarios (verificación de identidad, registro de caso, etc.)
4. RESOLUCIÓN: Capacidad de resolver el problema del cliente de forma efectiva
5. PROFESIONALISMO: Tono profesional, cortés, manejo adecuado de la situación

Responde SOLO con JSON válido en este formato exacto:
{
  "empathy": <número 0-100>,
  "clarity": <número 0-100>,
  "protocol": <número 0-100>,
  "resolution": <número 0-100>,
  "professionalism": <número 0-100>,
  "strengths": ["fortaleza 1", "fortaleza 2", "fortaleza 3"],
  "weaknesses": ["debilidad 1", "debilidad 2"],
  "recommendations": ["recomendación 1", "recomendación 2", "recomendación 3"],
  "summary": "Resumen ejecutivo de 2-3 oraciones sobre el desempeño del agente"
}`;

  try {
    const response = await invokeLLM({
      messages: [
        { role: "system", content: "Eres un evaluador experto de contact centers bancarios. Responde solo con JSON válido." },
        { role: "user", content: prompt },
      ],
      response_format: {
        type: "json_schema",
        json_schema: {
          name: "evaluation_result",
          strict: true,
          schema: {
            type: "object",
            properties: {
              empathy: { type: "number" },
              clarity: { type: "number" },
              protocol: { type: "number" },
              resolution: { type: "number" },
              professionalism: { type: "number" },
              strengths: { type: "array", items: { type: "string" } },
              weaknesses: { type: "array", items: { type: "string" } },
              recommendations: { type: "array", items: { type: "string" } },
              summary: { type: "string" },
            },
            required: ["empathy", "clarity", "protocol", "resolution", "professionalism", "strengths", "weaknesses", "recommendations", "summary"],
            additionalProperties: false,
          },
        },
      },
    });

    const rawContent = response.choices[0]?.message?.content;
    const content = typeof rawContent === "string" ? rawContent : null;
    if (!content) throw new Error("No response from LLM");

    const parsed = JSON.parse(content);

    // Validate and clamp scores
    const clamp = (v: number) => (Number.isFinite(v) ? Math.min(100, Math.max(0, Math.round(v))) : 70);

    const empathy = clamp(parsed.empathy);
    const clarity = clamp(parsed.clarity);
    const protocol = clamp(parsed.protocol);
    const resolution = clamp(parsed.resolution);
    const professionalism = clamp(parsed.professionalism);

    // Weighted overall score
    const ew = Number(scenario.empathyWeight) || 0.2;
    const cw = Number(scenario.clarityWeight) || 0.2;
    const pw = Number(scenario.protocolWeight) || 0.2;
    const rw = Number(scenario.resolutionWeight) || 0.2;
    const prw = Number(scenario.professionalismWeight) || 0.2;
    const totalWeight = ew + cw + pw + rw + prw;

    const rawScore = (empathy * ew + clarity * cw + protocol * pw + resolution * rw + professionalism * prw) / totalWeight;
    const overallScore = Number.isFinite(rawScore) ? Math.min(100, Math.max(0, Math.round(rawScore))) : 70;

    return {
      overallScore,
      empathyScore: empathy,
      clarityScore: clarity,
      protocolScore: protocol,
      resolutionScore: resolution,
      professionalismScore: professionalism,
      strengths: Array.isArray(parsed.strengths) ? parsed.strengths.slice(0, 5) : [],
      weaknesses: Array.isArray(parsed.weaknesses) ? parsed.weaknesses.slice(0, 5) : [],
      recommendations: Array.isArray(parsed.recommendations) ? parsed.recommendations.slice(0, 5) : [],
      aiFeedbackSummary: typeof parsed.summary === "string" ? parsed.summary : "",
    };
  } catch (error) {
    console.error("[Evaluation] Error:", error);
    return {
      overallScore: 70,
      empathyScore: 70,
      clarityScore: 70,
      protocolScore: 70,
      resolutionScore: 70,
      professionalismScore: 70,
      strengths: ["Completó la simulación"],
      weaknesses: ["Evaluación automática no disponible"],
      recommendations: ["Intenta nuevamente para obtener feedback detallado"],
      aiFeedbackSummary: "No fue posible evaluar automáticamente esta sesión. Por favor intenta de nuevo.",
    };
  }
}

// ─── AI Tips Service ──────────────────────────────────────────────────────────

async function getAITips(stats: { empathy: number; clarity: number; protocol: number; resolution: number; professionalism: number }) {
  try {
    const response = await invokeLLM({
      messages: [
        {
          role: "system",
          content: "Eres un coach experto en atención al cliente bancario. Genera consejos breves y accionables.",
        },
        {
          role: "user",
          content: `Un agente de contact center bancario tiene estos scores promedio:
- Empatía: ${stats.empathy}/100
- Claridad: ${stats.clarity}/100
- Protocolo: ${stats.protocol}/100
- Resolución: ${stats.resolution}/100
- Profesionalismo: ${stats.professionalism}/100

Genera 3 consejos específicos y accionables para las 3 dimensiones más bajas. Responde en JSON:
{
  "tips": [
    {"dimension": "nombre", "tip": "consejo específico de máximo 2 oraciones"},
    {"dimension": "nombre", "tip": "consejo específico de máximo 2 oraciones"},
    {"dimension": "nombre", "tip": "consejo específico de máximo 2 oraciones"}
  ]
}`,
        },
      ],
      response_format: {
        type: "json_schema",
        json_schema: {
          name: "ai_tips",
          strict: true,
          schema: {
            type: "object",
            properties: {
              tips: {
                type: "array",
                items: {
                  type: "object",
                  properties: {
                    dimension: { type: "string" },
                    tip: { type: "string" },
                  },
                  required: ["dimension", "tip"],
                  additionalProperties: false,
                },
              },
            },
            required: ["tips"],
            additionalProperties: false,
          },
        },
      },
    });

    const rawContent2 = response.choices[0]?.message?.content;
    const content = typeof rawContent2 === "string" ? rawContent2 : null;
    if (!content) return [];
    const parsed = JSON.parse(content);
    return parsed.tips ?? [];
  } catch {
    return [
      { dimension: "Empatía", tip: "Intenta reflejar las emociones del cliente: 'Entiendo que esto es frustrante para usted...'" },
      { dimension: "Protocolo", tip: "Recuerda siempre verificar la identidad antes de compartir información de la cuenta." },
      { dimension: "Resolución", tip: "Antes de transferir, verifica si puedes resolver con las herramientas disponibles." },
    ];
  }
}

// ─── App Router ───────────────────────────────────────────────────────────────

export const appRouter = router({
  system: systemRouter,

  auth: router({
    me: publicProcedure.query(opts => opts.ctx.user),
    logout: publicProcedure.mutation(({ ctx }) => {
      const cookieOptions = getSessionCookieOptions(ctx.req);
      ctx.res.clearCookie(COOKIE_NAME, { ...cookieOptions, maxAge: -1 });
      return { success: true } as const;
    }),
  }),

  // ─── Scenarios ─────────────────────────────────────────────────────────────
  scenarios: router({
    list: publicProcedure
      .input(z.object({
        category: z.string().optional(),
        difficulty: z.string().optional(),
        search: z.string().optional(),
      }).optional())
      .query(async ({ input }) => {
        return getScenarios(input);
      }),

    byId: publicProcedure
      .input(z.object({ id: z.number() }))
      .query(async ({ input }) => {
        const scenario = await getScenarioById(input.id);
        if (!scenario) throw new TRPCError({ code: "NOT_FOUND" });
        return scenario;
      }),
  }),

  // ─── Simulations ───────────────────────────────────────────────────────────
  simulations: router({
    start: protectedProcedure
      .input(z.object({
        scenarioId: z.number(),
        isPracticeMode: z.boolean().default(false),
      }))
      .mutation(async ({ ctx, input }) => {
        const scenario = await getScenarioById(input.scenarioId);
        if (!scenario) throw new TRPCError({ code: "NOT_FOUND" });

        const session = await createSimulationSession({
          userId: ctx.user.id,
          scenarioId: input.scenarioId,
          isPracticeMode: input.isPracticeMode,
        });
        if (!session) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });

        // Add initial client message
        await addMessage({
          sessionId: session.id,
          role: "client",
          content: scenario.initialMessage,
        });

        return { session, scenario };
      }),

    getSession: protectedProcedure
      .input(z.object({ sessionId: z.number() }))
      .query(async ({ ctx, input }) => {
        const session = await getSessionById(input.sessionId);
        if (!session) throw new TRPCError({ code: "NOT_FOUND" });
        if (session.userId !== ctx.user.id) throw new TRPCError({ code: "FORBIDDEN" });

        const messages = await getSessionMessages(input.sessionId);
        const scenario = await getScenarioById(session.scenarioId);

        return { session, messages, scenario };
      }),

    sendMessage: protectedProcedure
      .input(z.object({
        sessionId: z.number(),
        content: z.string().min(1).max(2000),
      }))
      .mutation(async ({ ctx, input }) => {
        const session = await getSessionById(input.sessionId);
        if (!session) throw new TRPCError({ code: "NOT_FOUND" });
        if (session.userId !== ctx.user.id) throw new TRPCError({ code: "FORBIDDEN" });
        if (session.status !== "in_progress") throw new TRPCError({ code: "BAD_REQUEST", message: "La sesión ya finalizó" });

        const scenario = await getScenarioById(session.scenarioId);
        if (!scenario) throw new TRPCError({ code: "NOT_FOUND" });

        // Save agent message
        await addMessage({ sessionId: input.sessionId, role: "agent", content: input.content });

        // Get conversation history
        const messages = await getSessionMessages(input.sessionId);
        const history = messages.map(m => ({
          role: m.role === "agent" ? "user" as const : "assistant" as const,
          content: m.content,
        }));

        // Generate client response
        const clientResponse = await invokeLLM({
          messages: [
            { role: "system", content: scenario.systemPrompt },
            ...history,
          ],
        });

        const rawContent = clientResponse.choices[0]?.message?.content;
        const clientContent = typeof rawContent === "string" ? rawContent : "...";

        const clientMsg = await addMessage({
          sessionId: input.sessionId,
          role: "client",
          content: clientContent,
        });

        return { agentMessage: input.content, clientMessage: clientContent };
      }),

    complete: protectedProcedure
      .input(z.object({ sessionId: z.number() }))
      .mutation(async ({ ctx, input }) => {
        const session = await getSessionById(input.sessionId);
        if (!session) throw new TRPCError({ code: "NOT_FOUND" });
        if (session.userId !== ctx.user.id) throw new TRPCError({ code: "FORBIDDEN" });
        if (session.status !== "in_progress") throw new TRPCError({ code: "BAD_REQUEST" });

        const scenario = await getScenarioById(session.scenarioId);
        if (!scenario) throw new TRPCError({ code: "NOT_FOUND" });

        const messages = await getSessionMessages(input.sessionId);
        const agentMessages = messages.filter(m => m.role === "agent");

        if (agentMessages.length === 0) {
          throw new TRPCError({ code: "BAD_REQUEST", message: "Debes enviar al menos un mensaje antes de finalizar" });
        }

        const durationSeconds = Math.round((Date.now() - new Date(session.startedAt).getTime()) / 1000);

        let evaluation;
        if (session.isPracticeMode) {
          // Practice mode: no real evaluation
          evaluation = {
            overallScore: 0,
            empathyScore: 0,
            clarityScore: 0,
            protocolScore: 0,
            resolutionScore: 0,
            professionalismScore: 0,
            strengths: [],
            weaknesses: [],
            recommendations: ["Modo práctica: sin evaluación. Sigue practicando!"],
            aiFeedbackSummary: "Sesión de práctica completada. No se generó evaluación.",
          };
        } else {
          evaluation = await evaluateSimulation(
            messages.map(m => ({ role: m.role, content: m.content })),
            scenario
          );
        }

        const xpEarned = session.isPracticeMode ? 0 : Math.round((evaluation.overallScore / 100) * scenario.xpReward);

        await completeSession(input.sessionId, { ...evaluation, xpEarned, durationSeconds });

        if (!session.isPracticeMode) {
          await updateUserXP(ctx.user.id, xpEarned);
          await updateStreak(ctx.user.id);
          await updateDailyActivity(ctx.user.id, evaluation.overallScore, xpEarned);
          const newBadges = await checkAndAwardBadges(ctx.user.id, input.sessionId, evaluation.overallScore);

          const updatedUser = await getUserById(ctx.user.id);
          return { evaluation, xpEarned, newBadges, user: updatedUser };
        }

        return { evaluation, xpEarned: 0, newBadges: [], user: await getUserById(ctx.user.id) };
      }),

    history: protectedProcedure
      .input(z.object({ limit: z.number().default(20) }).optional())
      .query(async ({ ctx, input }) => {
        const sessions = await getUserSessions(ctx.user.id, input?.limit ?? 20);
        const scenarioIds = Array.from(new Set(sessions.map(s => s.scenarioId)));
        const scenarioMap: Record<number, any> = {};
        for (const id of scenarioIds) {
          const s = await getScenarioById(id);
          if (s) scenarioMap[id] = s;
        }
        return sessions.map(s => ({ ...s, scenario: scenarioMap[s.scenarioId] }));
      }),
  }),

  // ─── Dashboard ─────────────────────────────────────────────────────────────
  dashboard: router({
    stats: protectedProcedure.query(async ({ ctx }) => {
      return getUserDashboardStats(ctx.user.id);
    }),
  }),

  // ─── Performance ───────────────────────────────────────────────────────────
  performance: router({
    stats: protectedProcedure.query(async ({ ctx }) => {
      const stats = await getUserPerformanceStats(ctx.user.id);
      return stats;
    }),

    tips: protectedProcedure.query(async ({ ctx }) => {
      const stats = await getUserPerformanceStats(ctx.user.id);
      if (!stats || stats.totalSessions === 0) {
        return [
          { dimension: "Empatía", tip: "Intenta reflejar las emociones del cliente: 'Entiendo que esto es frustrante para usted...'" },
          { dimension: "Protocolo", tip: "Recuerda siempre verificar la identidad antes de compartir información de la cuenta." },
          { dimension: "Resolución", tip: "Antes de transferir, verifica si puedes resolver con las herramientas disponibles." },
        ];
      }
      return getAITips({
        empathy: stats.empathy,
        clarity: stats.clarity,
        protocol: stats.protocol,
        resolution: stats.resolution,
        professionalism: stats.professionalism,
      });
    }),
  }),

  // ─── Ranking ───────────────────────────────────────────────────────────────
  ranking: router({
    leaderboard: protectedProcedure
      .input(z.object({ limit: z.number().default(20) }).optional())
      .query(async ({ input }) => {
        return getLeaderboard(input?.limit ?? 20);
      }),
  }),

  // ─── Gamification ──────────────────────────────────────────────────────────
  gamification: router({
    badges: protectedProcedure.query(async ({ ctx }) => {
      return getUserBadges(ctx.user.id);
    }),

    profile: protectedProcedure.query(async ({ ctx }) => {
      const user = await getUserById(ctx.user.id);
      if (!user) throw new TRPCError({ code: "NOT_FOUND" });
      const thresholds = levelThresholds();
      const levels = ["junior", "intermedio", "senior", "experto"] as const;
      const currentLevelIndex = levels.indexOf(user.level as any);
      const nextLevel = levels[currentLevelIndex + 1];
      const currentThreshold = thresholds[user.level as keyof typeof thresholds] ?? 0;
      const nextThreshold = nextLevel ? thresholds[nextLevel] : null;
      const xpInLevel = (user.xpTotal ?? 0) - currentThreshold;
      const xpNeeded = nextThreshold ? nextThreshold - currentThreshold : null;

      return {
        ...user,
        nextLevel,
        xpInLevel,
        xpNeeded,
        progressPercent: xpNeeded ? Math.round((xpInLevel / xpNeeded) * 100) : 100,
      };
    }),
  }),

  // ─── Library ───────────────────────────────────────────────────────────────
  library: router({
    list: publicProcedure
      .input(z.object({
        category: z.string().optional(),
        search: z.string().optional(),
      }).optional())
      .query(async ({ input }) => {
        return getLibraryResources(input);
      }),

    byId: publicProcedure
      .input(z.object({ id: z.number() }))
      .query(async ({ input }) => {
        const resource = await getResourceById(input.id);
        if (!resource) throw new TRPCError({ code: "NOT_FOUND" });
        return resource;
      }),
  }),

  // ─── Admin ─────────────────────────────────────────────────────────────────
  admin: router({
    users: supervisorProcedure.query(async () => {
      return getAllUsers(100);
    }),

    userDetail: supervisorProcedure
      .input(z.object({ userId: z.number() }))
      .query(async ({ input }) => {
        const user = await getUserById(input.userId);
        if (!user) throw new TRPCError({ code: "NOT_FOUND" });
        const sessions = await getUserSessions(input.userId, 10);
        const performance = await getUserPerformanceStats(input.userId);
        const badges = await getUserBadges(input.userId);
        return { user, sessions, performance, badges };
      }),
  }),
});

export type AppRouter = typeof appRouter;
