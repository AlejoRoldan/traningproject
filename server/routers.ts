import { COOKIE_NAME } from "@shared/const";
import { getSessionCookieOptions } from "./_core/cookies";
import { systemRouter } from "./_core/systemRouter";
import { publicProcedure, protectedProcedure, router } from "./_core/trpc";
import { TRPCError } from "@trpc/server";
import { z } from "zod";
import * as db from "./db";
import { evaluateSimulation, generateClientResponse } from "./evaluationService";
import { getDb } from "./db";
import { scenarios, simulations, messages, improvementPlans, badges, userBadges } from "../drizzle/schema";
import { eq, desc } from "drizzle-orm";

// Admin-only procedure
const adminProcedure = protectedProcedure.use(({ ctx, next }) => {
  if (ctx.user.role !== 'admin' && ctx.user.role !== 'supervisor') {
    throw new TRPCError({ code: 'FORBIDDEN', message: 'Acceso denegado' });
  }
  return next({ ctx });
});

// Supervisor procedure (includes admin)
const supervisorProcedure = protectedProcedure.use(({ ctx, next }) => {
  if (ctx.user.role !== 'admin' && ctx.user.role !== 'supervisor' && ctx.user.role !== 'trainer') {
    throw new TRPCError({ code: 'FORBIDDEN', message: 'Acceso denegado' });
  }
  return next({ ctx });
});

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

  // Scenarios router
  scenarios: router({
    list: protectedProcedure
      .input(z.object({
        category: z.string().optional(),
        complexity: z.number().optional(),
        isActive: z.boolean().optional(),
      }).optional())
      .query(async ({ input }) => {
        const filters = input || {};
        
        // If no filters, return all
        if (!filters.category && !filters.complexity && filters.isActive === undefined) {
          return await db.getAllScenarios();
        }
        
        // Apply filters
        let result = await db.getAllScenarios();
        
        if (filters.category) {
          result = result.filter(s => s.category === filters.category);
        }
        
        if (filters.complexity) {
          result = result.filter(s => s.complexity === filters.complexity);
        }
        
        if (filters.isActive !== undefined) {
          const activeValue = filters.isActive ? 1 : 0;
          result = result.filter(s => s.isActive === activeValue);
        }
        
        return result;
      }),
    
    getById: protectedProcedure
      .input(z.object({ id: z.number() }))
      .query(async ({ input }) => {
        const scenario = await db.getScenarioById(input.id);
        if (!scenario) {
          throw new TRPCError({ code: 'NOT_FOUND', message: 'Escenario no encontrado' });
        }
        return scenario;
      }),
    
    getByCategory: protectedProcedure
      .input(z.object({ category: z.string() }))
      .query(async ({ input }) => {
        return await db.getScenariosByCategory(input.category);
      }),
    
    getByComplexity: protectedProcedure
      .input(z.object({ complexity: z.number().min(1).max(5) }))
      .query(async ({ input }) => {
        return await db.getScenariosByComplexity(input.complexity);
      }),

    create: supervisorProcedure
      .input(z.object({
        title: z.string(),
        description: z.string(),
        category: z.enum(['informative', 'transactional', 'fraud', 'money_laundering', 'theft', 'complaint', 'credit', 'digital_channels']),
        complexity: z.number().min(1).max(5),
        estimatedDuration: z.number(),
        systemPrompt: z.string(),
        clientProfile: z.string(),
        evaluationCriteria: z.string(),
        idealResponse: z.string().optional(),
        tags: z.array(z.string()).optional(),
      }))
      .mutation(async ({ ctx, input }) => {
        const database = await getDb();
        if (!database) throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR' });
        
        const result = await database.insert(scenarios).values({
          ...input,
          clientProfile: input.clientProfile,
          evaluationCriteria: input.evaluationCriteria,
          tags: input.tags ? JSON.stringify(input.tags) : null,
          createdBy: ctx.user.id,
        });
        
        return { success: true, id: 0 };
      }),
  }),

  // Simulations router
  simulations: router({
    mySimulations: protectedProcedure
      .input(z.object({ limit: z.number().optional() }))
      .query(async ({ ctx, input }) => {
        return await db.getUserSimulations(ctx.user.id, input.limit);
      }),
    
    getById: protectedProcedure
      .input(z.object({ id: z.number() }))
      .query(async ({ ctx, input }) => {
        const simulation = await db.getSimulationById(input.id);
        if (!simulation) {
          throw new TRPCError({ code: 'NOT_FOUND', message: 'Simulación no encontrada' });
        }
        
        // Check if user owns this simulation or is supervisor/admin
        if (simulation.userId !== ctx.user.id && ctx.user.role !== 'admin' && ctx.user.role !== 'supervisor') {
          throw new TRPCError({ code: 'FORBIDDEN', message: 'No tienes acceso a esta simulación' });
        }
        
        return simulation;
      }),
    
    getMessages: protectedProcedure
      .input(z.object({ simulationId: z.number() }))
      .query(async ({ ctx, input }) => {
        const simulation = await db.getSimulationById(input.simulationId);
        if (!simulation) {
          throw new TRPCError({ code: 'NOT_FOUND' });
        }
        
        if (simulation.userId !== ctx.user.id && ctx.user.role !== 'admin' && ctx.user.role !== 'supervisor') {
          throw new TRPCError({ code: 'FORBIDDEN' });
        }
        
        return await db.getSimulationMessages(input.simulationId);
      }),

    start: protectedProcedure
      .input(z.object({ scenarioId: z.number() }))
      .mutation(async ({ ctx, input }) => {
        const database = await getDb();
        if (!database) throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR' });
        
        const scenario = await db.getScenarioById(input.scenarioId);
        if (!scenario) {
          throw new TRPCError({ code: 'NOT_FOUND', message: 'Escenario no encontrado' });
        }
        
        const result = await database.insert(simulations).values({
          userId: ctx.user.id,
          scenarioId: input.scenarioId,
          status: 'in_progress',
        });
        
        return { success: true, simulationId: 0 };
      }),

    sendMessage: protectedProcedure
      .input(z.object({
        simulationId: z.number(),
        content: z.string(),
      }))
      .mutation(async ({ ctx, input }) => {
        const database = await getDb();
        if (!database) throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR' });
        
        const simulation = await db.getSimulationById(input.simulationId);
        if (!simulation || simulation.userId !== ctx.user.id) {
          throw new TRPCError({ code: 'FORBIDDEN' });
        }
        
        if (simulation.status !== 'in_progress') {
          throw new TRPCError({ code: 'BAD_REQUEST', message: 'La simulación no está activa' });
        }
        
        // Save agent message
        await database.insert(messages).values({
          simulationId: input.simulationId,
          role: 'agent',
          content: input.content,
        });

        // Generate client response using GPT
        const scenario = await db.getScenarioById(simulation.scenarioId);
        if (scenario) {
          const conversationHistory = await db.getSimulationMessages(input.simulationId);
          const historyForGPT = conversationHistory.map(m => ({
            role: m.role,
            content: m.content
          }));
          
          const clientResponse = await generateClientResponse(
            scenario,
            historyForGPT as any,
            input.content
          );

          // Save client response
          await database.insert(messages).values({
            simulationId: input.simulationId,
            role: 'client',
            content: clientResponse,
          });

          return { success: true, clientResponse };
        }
        
        return { success: true };
      }),

    complete: protectedProcedure
      .input(z.object({
        simulationId: z.number(),
        audioBlob: z.string().optional(), // base64 encoded audio
      }))
      .mutation(async ({ ctx, input }) => {
        const database = await getDb();
        if (!database) throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR' });
        
        const simulation = await db.getSimulationById(input.simulationId);
        if (!simulation || simulation.userId !== ctx.user.id) {
          throw new TRPCError({ code: 'FORBIDDEN' });
        }
        
        // Get scenario and messages for evaluation
        const scenario = await db.getScenarioById(simulation.scenarioId);
        if (!scenario) {
          throw new TRPCError({ code: 'NOT_FOUND', message: 'Escenario no encontrado' });
        }

        const conversationMessages = await db.getSimulationMessages(input.simulationId);
        const messagesForEvaluation = conversationMessages.map(m => ({
          role: m.role,
          content: m.content
        }));

        // Evaluate with GPT
        const evaluation = await evaluateSimulation(scenario, messagesForEvaluation as any);
        
        const duration = Math.floor((Date.now() - simulation.startedAt.getTime()) / 1000);
        
        // Upload audio to S3 and analyze voice if provided
        let audioRecordingUrl: string | null = null;
        let audioTranscript: string | null = null;
        let transcriptSegments: string | null = null;
        let transcriptKeywords: string | null = null;
        let voiceMetrics: string | null = null;
        
        if (input.audioBlob) {
          try {
            const { storagePut } = await import('./storage');
            const audioBuffer = Buffer.from(input.audioBlob, 'base64');
            const audioKey = `simulations/${ctx.user.id}/${input.simulationId}-${Date.now()}.webm`;
            const { url } = await storagePut(audioKey, audioBuffer, 'audio/webm');
            audioRecordingUrl = url;
            
            // Analyze voice (transcription + sentiment + metrics)
            try {
              const { analyzeVoice } = await import('./voiceAnalysisService');
              const voiceAnalysis = await analyzeVoice(url);
              audioTranscript = voiceAnalysis.transcript;
              transcriptSegments = JSON.stringify(voiceAnalysis.segments);
              transcriptKeywords = JSON.stringify(voiceAnalysis.keywords);
              voiceMetrics = JSON.stringify(voiceAnalysis.metrics);
              console.log('[Simulation] Voice analysis completed. Overall voice score:', voiceAnalysis.metrics.overallVoiceScore);
            } catch (voiceError) {
              console.error('[Simulation] Voice analysis failed:', voiceError);
              // Continue without voice analysis if it fails
            }
          } catch (error) {
            console.error('Error uploading audio to S3:', error);
            // Continue without audio if upload fails
          }
        }
        
        // Update simulation with evaluation results
        await database.update(simulations)
          .set({
            status: 'completed',
            completedAt: new Date(),
            duration,
            overallScore: evaluation.overallScore,
            categoryScores: JSON.stringify(evaluation.categoryScores),
            feedback: evaluation.feedback,
            strengths: JSON.stringify(evaluation.strengths),
            weaknesses: JSON.stringify(evaluation.weaknesses),
            recommendations: JSON.stringify(evaluation.recommendations),
            pointsEarned: evaluation.pointsEarned,
            badgesEarned: JSON.stringify(evaluation.badgesEarned),
            audioRecordingUrl,
            audioTranscript,
            transcriptSegments,
            transcriptKeywords,
            voiceMetrics,
          })
          .where(eq(simulations.id, input.simulationId));

        // Update user points
        const { users } = await import('../drizzle/schema');
        await database.update(users)
          .set({
            points: ctx.user.points + evaluation.pointsEarned
          })
          .where(eq(users.id, ctx.user.id));
        
        return { 
          success: true, 
          evaluation: {
            overallScore: evaluation.overallScore,
            pointsEarned: evaluation.pointsEarned,
            badgesEarned: evaluation.badgesEarned
          }
        };
      }),
  }),

  // User stats and profile
  user: router({
    stats: protectedProcedure.query(async ({ ctx }) => {
      return await db.getUserStats(ctx.user.id);
    }),
    
    profile: protectedProcedure.query(async ({ ctx }) => {
      return ctx.user;
    }),
    
    badges: protectedProcedure.query(async ({ ctx }) => {
      return await db.getUserBadges(ctx.user.id);
    }),
  }),

  // Improvement plans
  improvementPlans: router({
    myPlans: protectedProcedure.query(async ({ ctx }) => {
      return await db.getUserImprovementPlans(ctx.user.id);
    }),
    
    activePlan: protectedProcedure.query(async ({ ctx }) => {
      return await db.getActiveImprovementPlan(ctx.user.id);
    }),
  }),

  // Supervisor/Admin features
  supervisor: router({
    teamMembers: supervisorProcedure.query(async ({ ctx }) => {
      if (ctx.user.role === 'supervisor') {
        return await db.getTeamMembers(ctx.user.id);
      }
      // Admin can see all users
      const database = await getDb();
      if (!database) return [];
      const { users } = await import('../drizzle/schema');
      return await database.select().from(users);
    }),
    
    teamStats: supervisorProcedure
      .input(z.object({ 
        period: z.enum(['daily', 'weekly', 'monthly']).optional() 
      }))
      .query(async ({ ctx, input }) => {
        return await db.getTeamStats(ctx.user.id, input.period || 'weekly');
      }),
  }),
});

export type AppRouter = typeof appRouter;
