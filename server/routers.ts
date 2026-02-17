import { COOKIE_NAME } from "@shared/const";
import { getSessionCookieOptions } from "./_core/cookies";
import { systemRouter } from "./_core/systemRouter";
import { publicProcedure, router, protectedProcedure } from "./_core/trpc";
import { DEMO_USER } from "./demoUser";
import { TRPCError } from "@trpc/server";
import { z } from "zod";
import * as db from "./db";
import { evaluateSimulation, generateClientResponse } from "./evaluationService";
import { generateSpeech, detectGenderFromProfile } from "./ttsService";
import { storagePut } from "./storage";
import { nanoid } from "nanoid";
import { getDb } from "./db";
import { scenarios, simulations, messages, improvementPlans, badges, userBadges, audioMarkers, responseTemplates } from "../drizzle/schema";
import { eq, desc, and, sql, gte, isNotNull, or } from "drizzle-orm";

// Demo user procedure (no authentication required)
const demoUserProcedure = publicProcedure.use(({ ctx, next }) => {
  // Use authenticated user if available, otherwise use demo user
  const user = ctx.user || DEMO_USER;
  return next({ ctx: { ...ctx, user } });
});

// Admin and supervisor procedures now use demo user
const adminProcedure = demoUserProcedure;
const supervisorProcedure = demoUserProcedure;

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
    list: demoUserProcedure
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
    
    getById: demoUserProcedure
      .input(z.object({ id: z.number() }))
      .query(async ({ input }) => {
        const scenario = await db.getScenarioById(input.id);
        if (!scenario) {
          throw new TRPCError({ code: 'NOT_FOUND', message: 'Escenario no encontrado' });
        }
        return scenario;
      }),
    
    getByCategory: demoUserProcedure
      .input(z.object({ category: z.string() }))
      .query(async ({ input }) => {
        return await db.getScenariosByCategory(input.category);
      }),
    
    getByComplexity: demoUserProcedure
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
    mySimulations: demoUserProcedure
      .input(z.object({ limit: z.number().optional() }))
      .query(async ({ ctx, input }) => {
        return await db.getUserSimulations(ctx.user.id, input.limit);
      }),
    
    getById: demoUserProcedure
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
    
    getMessages: demoUserProcedure
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

    start: demoUserProcedure
      .input(z.object({ 
        scenarioId: z.number(),
        isPracticeMode: z.boolean().optional().default(false)
      }))
      .mutation(async ({ ctx, input }) => {
        const database = await getDb();
        if (!database) throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR' });
        
        const scenario = await db.getScenarioById(input.scenarioId);
        if (!scenario) {
          throw new TRPCError({ code: 'NOT_FOUND', message: 'Escenario no encontrado' });
        }
        
        const [result] = await database.insert(simulations).values({
          userId: ctx.user.id,
          scenarioId: input.scenarioId,
          isPracticeMode: input.isPracticeMode ? 1 : 0,
          status: 'in_progress',
        }).$returningId();
        
        return { success: true, simulationId: result.id, isPracticeMode: input.isPracticeMode };
      }),

    sendMessage: demoUserProcedure
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

          // Generate TTS audio for client response
          let audioUrl: string | undefined;
          try {
            const gender = detectGenderFromProfile(scenario.clientProfile);
            const audioBuffer = await generateSpeech({
              text: clientResponse,
              gender: gender,
              speed: 1.0,
            });

            // Upload audio to S3
            const audioKey = `tts/${ctx.user.id}/${input.simulationId}-${nanoid(8)}.mp3`;
            const uploadResult = await storagePut(audioKey, audioBuffer, "audio/mpeg");
            audioUrl = uploadResult.url;
          } catch (error) {
            console.error("[TTS] Failed to generate audio:", error);
            // Continue without audio if TTS fails
          }

          return { success: true, clientResponse, audioUrl };
        }
        
        return { success: true };
      }),

    transcribeVoice: demoUserProcedure
      .input(z.object({
        audioBlob: z.string(), // base64 encoded audio
      }))
      .mutation(async ({ input }) => {
        try {
          const { transcribeAudio } = await import('./transcriptionService');
          
          // Decode base64 to buffer
          const audioBuffer = Buffer.from(input.audioBlob, 'base64');
          
          // Transcribe with Whisper
          const transcript = await transcribeAudio(new Uint8Array(audioBuffer));
          
          return { success: true, transcript };
        } catch (error) {
          console.error('[Transcription] Error:', error);
          throw new TRPCError({ 
            code: 'INTERNAL_SERVER_ERROR', 
            message: error instanceof Error ? error.message : 'Failed to transcribe audio'
          });
        }
      }),

    complete: demoUserProcedure
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
        
        // Get scenario and messages
        const scenario = await db.getScenarioById(simulation.scenarioId);
        if (!scenario) {
          throw new TRPCError({ code: 'NOT_FOUND', message: 'Escenario no encontrado' });
        }

        const conversationMessages = await db.getSimulationMessages(input.simulationId);
        const messagesForEvaluation = conversationMessages.map(m => ({
          role: m.role,
          content: m.content
        }));

        // Evaluate with GPT only if not in practice mode
        const isPracticeMode = simulation.isPracticeMode === 1;
        const evaluation = isPracticeMode ? null : await evaluateSimulation(scenario, messagesForEvaluation as any);
        
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
        
        // Update simulation with evaluation results (or just mark as completed for practice mode)
        if (isPracticeMode) {
          // Practice mode: just mark as completed, no evaluation
          await database.update(simulations)
            .set({
              status: 'completed',
              completedAt: new Date(),
              duration,
              audioRecordingUrl,
              audioTranscript,
              transcriptSegments,
              transcriptKeywords,
              voiceMetrics,
            })
            .where(eq(simulations.id, input.simulationId));
          
          return { 
            success: true, 
            isPracticeMode: true
          };
        } else {
          // Normal mode: full evaluation
          await database.update(simulations)
            .set({
              status: 'completed',
              completedAt: new Date(),
              duration,
              overallScore: evaluation!.overallScore,
              categoryScores: JSON.stringify(evaluation!.categoryScores),
              feedback: evaluation!.feedback,
              strengths: JSON.stringify(evaluation!.strengths),
              weaknesses: JSON.stringify(evaluation!.weaknesses),
              recommendations: JSON.stringify(evaluation!.recommendations),
              pointsEarned: evaluation!.pointsEarned,
              badgesEarned: JSON.stringify(evaluation!.badgesEarned),
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
              points: ctx.user.points + evaluation!.pointsEarned
            })
            .where(eq(users.id, ctx.user.id));
          
          // Run alert checks (async, don't wait)
          const { runAlertChecks } = await import('./alertService');
          runAlertChecks(ctx.user.id, input.simulationId).catch(err => {
            console.error('[Alerts] Failed to run alert checks:', err);
          });
          
          // Update coaching plan progress
          const { updateCoachingProgress } = await import('./coachingService');
          updateCoachingProgress(ctx.user.id, simulation.scenarioId).catch(err => {
            console.error('[Coaching] Failed to update progress:', err);
          });
          
          return { 
            success: true, 
            evaluation: {
              overallScore: evaluation!.overallScore,
              pointsEarned: evaluation!.pointsEarned,
              badgesEarned: evaluation!.badgesEarned
            }
          };
        }
      }),
  }),

  // User stats and profile
  user: router({
    stats: demoUserProcedure.query(async ({ ctx }) => {
      return await db.getUserStats(ctx.user.id);
    }),
    
    profile: demoUserProcedure.query(async ({ ctx }) => {
      return ctx.user;
    }),
    
    badges: demoUserProcedure.query(async ({ ctx }) => {
      return await db.getUserBadges(ctx.user.id);
    }),
  }),

  // Improvement plans
  improvementPlans: router({
    myPlans: demoUserProcedure.query(async ({ ctx }) => {
      return await db.getUserImprovementPlans(ctx.user.id);
    }),
    
    activePlan: demoUserProcedure.query(async ({ ctx }) => {
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

  // Audio Markers router (for supervisors to add temporal markers)
  audioMarkers: router({
    list: demoUserProcedure
      .input(z.object({ simulationId: z.number() }))
      .query(async ({ input }) => {
        const database = await getDb();
        if (!database) throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR', message: 'Database not available' });
        
        return await database
          .select()
          .from(audioMarkers)
          .where(eq(audioMarkers.simulationId, input.simulationId))
          .orderBy(audioMarkers.timestamp);
      }),

    create: supervisorProcedure
      .input(z.object({
        simulationId: z.number(),
        timestamp: z.number(),
        category: z.enum(['excellent', 'good', 'needs_improvement', 'critical_error']),
        note: z.string().optional(),
      }))
      .mutation(async ({ ctx, input }) => {
        const database = await getDb();
        if (!database) throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR', message: 'Database not available' });
        
        const [marker] = await database.insert(audioMarkers).values({
          simulationId: input.simulationId,
          createdBy: ctx.user.id,
          timestamp: input.timestamp,
          category: input.category,
          note: input.note || null,
        });
        
        return { success: true, markerId: marker.insertId };
      }),

    update: supervisorProcedure
      .input(z.object({
        id: z.number(),
        category: z.enum(['excellent', 'good', 'needs_improvement', 'critical_error']).optional(),
        note: z.string().optional(),
      }))
      .mutation(async ({ ctx, input }) => {
        const database = await getDb();
        if (!database) throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR', message: 'Database not available' });
        
        // Verify ownership or admin/supervisor role
        const [existing] = await database
          .select()
          .from(audioMarkers)
          .where(eq(audioMarkers.id, input.id))
          .limit(1);
        
        if (!existing) {
          throw new TRPCError({ code: 'NOT_FOUND', message: 'Marcador no encontrado' });
        }
        
        if (existing.createdBy !== ctx.user.id && ctx.user.role !== 'admin') {
          throw new TRPCError({ code: 'FORBIDDEN', message: 'No puedes editar este marcador' });
        }
        
        await database
          .update(audioMarkers)
          .set({
            category: input.category || existing.category,
            note: input.note !== undefined ? input.note : existing.note,
          })
          .where(eq(audioMarkers.id, input.id));
        
        return { success: true };
      }),

    delete: supervisorProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ ctx, input }) => {
        const database = await getDb();
        if (!database) throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR', message: 'Database not available' });
        
        // Verify ownership or admin role
        const [existing] = await database
          .select()
          .from(audioMarkers)
          .where(eq(audioMarkers.id, input.id))
          .limit(1);
        
        if (!existing) {
          throw new TRPCError({ code: 'NOT_FOUND', message: 'Marcador no encontrado' });
        }
        
        if (existing.createdBy !== ctx.user.id && ctx.user.role !== 'admin') {
          throw new TRPCError({ code: 'FORBIDDEN', message: 'No puedes eliminar este marcador' });
        }
        
        await database.delete(audioMarkers).where(eq(audioMarkers.id, input.id));
        
        return { success: true };
      }),
  }),

  // Response templates router
  responseTemplates: router({
    list: demoUserProcedure
      .input(z.object({
        category: z.enum(['informative', 'transactional', 'fraud', 'money_laundering', 'theft', 'complaint', 'credit', 'digital_channels']).optional(),
        type: z.enum(['opening', 'development', 'objection_handling', 'closing', 'empathy', 'protocol']).optional(),
        complexity: z.number().optional(),
      }).optional())
      .query(async ({ input }) => {
        const database = await getDb();
        if (!database) throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR', message: 'Database not available' });
        
        let query = database.select().from(responseTemplates);
        
        if (input?.category) {
          query = query.where(eq(responseTemplates.category, input.category)) as any;
        }
        
        const results = await query;
        
        // Filter by type and complexity in memory (simpler than complex SQL)
        let filtered = results;
        if (input?.type) {
          filtered = filtered.filter(r => r.type === input.type);
        }
        if (input?.complexity) {
          filtered = filtered.filter(r => r.complexity === input.complexity);
        }
        
        return filtered;
      }),

    getById: demoUserProcedure
      .input(z.object({ id: z.number() }))
      .query(async ({ input }) => {
        const database = await getDb();
        if (!database) throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR', message: 'Database not available' });
        
        const [template] = await database
          .select()
          .from(responseTemplates)
          .where(eq(responseTemplates.id, input.id))
          .limit(1);
        
        if (!template) {
          throw new TRPCError({ code: 'NOT_FOUND', message: 'Respuesta modelo no encontrada' });
        }
        
        return template;
      }),
  }),

  // Coaching system router
  coaching: router({
    checkEligibility: demoUserProcedure
      .query(async ({ ctx }) => {
        const stats = await db.getUserStats(ctx.user.id);
        if (!stats) {
          return {
            eligible: false,
            simulationsCompleted: 0,
            simulationsRequired: 3
          };
        }
        const hasEnoughSimulations = stats.totalSimulations >= 3;
        return {
          eligible: hasEnoughSimulations,
          simulationsCompleted: stats.totalSimulations,
          simulationsRequired: 3
        };
      }),

    generatePlan: demoUserProcedure
      .mutation(async ({ ctx }) => {
        const { createCoachingPlan } = await import('./coachingService');
        const planId = await createCoachingPlan(ctx.user.id);
        return { success: true, planId };
      }),

    getActivePlan: demoUserProcedure
      .query(async ({ ctx }) => {
        const { getActiveCoachingPlan } = await import('./coachingService');
        const plan = await getActiveCoachingPlan(ctx.user.id);
        return plan;
      }),

    updateProgress: demoUserProcedure
      .input(z.object({ scenarioId: z.number() }))
      .mutation(async ({ ctx, input }) => {
        const { updateCoachingProgress } = await import('./coachingService');
        await updateCoachingProgress(ctx.user.id, input.scenarioId);
        return { success: true };
      }),

    // Alerts for supervisors
    getAlerts: demoUserProcedure
      .input(z.object({
        status: z.enum(['pending', 'acknowledged', 'resolved']).optional(),
        type: z.enum(['low_performance', 'stagnation', 'improvement', 'milestone']).optional(),
      }).optional())
      .query(async ({ ctx, input }) => {
        const database = await getDb();
        if (!database) throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR' });
        
        const { coachingAlerts } = await import('../drizzle/schema');
        
        // Build query conditions
        const conditions = [];
        
        // Supervisors see their team's alerts, admins see all
        if (ctx.user.role === 'supervisor' || ctx.user.role === 'coordinador') {
          conditions.push(eq(coachingAlerts.supervisorId, ctx.user.id));
        }
        // Agents see only their own alerts
        else if (ctx.user.role === 'agente' || ctx.user.role === 'analista') {
          conditions.push(eq(coachingAlerts.userId, ctx.user.id));
        }
        
        if (input?.status) {
          conditions.push(eq(coachingAlerts.status, input.status));
        }
        if (input?.type) {
          conditions.push(eq(coachingAlerts.type, input.type));
        }
        
        const alerts = await database
          .select()
          .from(coachingAlerts)
          .where(conditions.length > 0 ? and(...conditions) : undefined)
          .orderBy(desc(coachingAlerts.createdAt));
        
        // Parse metadata JSON
        return alerts.map(alert => ({
          ...alert,
          metadata: alert.metadata ? JSON.parse(alert.metadata) : {}
        }));
      }),

    acknowledgeAlert: demoUserProcedure
      .input(z.object({ alertId: z.number() }))
      .mutation(async ({ ctx, input }) => {
        const database = await getDb();
        if (!database) throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR' });
        
        const { coachingAlerts } = await import('../drizzle/schema');
        
        await database
          .update(coachingAlerts)
          .set({
            status: 'acknowledged',
            acknowledgedAt: new Date()
          })
          .where(eq(coachingAlerts.id, input.alertId));
        
        return { success: true };
      }),

    resolveAlert: demoUserProcedure
      .input(z.object({ alertId: z.number() }))
      .mutation(async ({ ctx, input }) => {
        const database = await getDb();
        if (!database) throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR' });
        
        const { coachingAlerts } = await import('../drizzle/schema');
        
        await database
          .update(coachingAlerts)
          .set({
            status: 'resolved',
            resolvedAt: new Date()
          })
          .where(eq(coachingAlerts.id, input.alertId));
        
        return { success: true };
      }),

    // Buddy System endpoints
    findBuddyCandidates: demoUserProcedure
      .query(async ({ ctx }) => {
        const { findBuddyCandidates } = await import('./coachingService');
        const candidates = await findBuddyCandidates(ctx.user.id);
        return candidates;
      }),

    createBuddyPair: demoUserProcedure
      .input(z.object({
        buddyId: z.number()
      }))
      .mutation(async ({ ctx, input }) => {
        const { createBuddyPair } = await import('./coachingService');
        const pairId = await createBuddyPair(ctx.user.id, input.buddyId);
        return { success: true, pairId };
      }),

    getBuddyPair: demoUserProcedure
      .query(async ({ ctx }) => {
        const { getBuddyPair } = await import('./coachingService');
        const pair = await getBuddyPair(ctx.user.id);
        return pair;
      }),

    updateBuddyGoal: demoUserProcedure
      .input(z.object({
        pairId: z.number(),
        sharedGoal: z.string()
      }))
      .mutation(async ({ ctx, input }) => {
        const { updateBuddyProgress } = await import('./coachingService');
        await updateBuddyProgress(input.pairId, input.sharedGoal);
        return { success: true };
      }),

    endBuddyPair: demoUserProcedure
      .input(z.object({ pairId: z.number() }))
      .mutation(async ({ ctx, input }) => {
        const { endBuddyPair } = await import('./coachingService');
        await endBuddyPair(input.pairId);
        return { success: true };
      }),
    }),

  // Analytics router
  analytics: router({
    getOverallStats: demoUserProcedure
      .input(z.object({
        userId: z.number().optional(),
        department: z.string().optional(),
      }).optional())
      .query(async ({ input }) => {
        const db = await getDb();
        if (!db) throw new Error('Database connection failed');

        // Build where conditions based on filters
        const whereConditions = [];
        
        if (input?.userId) {
          whereConditions.push(eq(simulations.userId, input.userId));
        }

        // Total simulations
        const [totalResult] = await db
          .select({ count: sql<number>`count(*)` })
          .from(simulations)
          .where(whereConditions.length > 0 ? and(...whereConditions) : undefined);
        const totalSimulations = totalResult?.count || 0;

        // Completed simulations
        const [completedResult] = await db
          .select({ count: sql<number>`count(*)` })
          .from(simulations)
          .where(
            whereConditions.length > 0
              ? and(eq(simulations.status, 'completed'), ...whereConditions)
              : eq(simulations.status, 'completed')
          );
        const completedSimulations = completedResult?.count || 0;

        // Average score
        const [avgScoreResult] = await db
          .select({ avg: sql<number>`avg(${simulations.overallScore})` })
          .from(simulations)
          .where(
            whereConditions.length > 0
              ? and(eq(simulations.status, 'completed'), ...whereConditions)
              : eq(simulations.status, 'completed')
          );
        const averageScore = Math.round(avgScoreResult?.avg || 0);

        // Active users
        const [activeUsersResult] = await db
          .select({ count: sql<number>`count(distinct ${simulations.userId})` })
          .from(simulations)
          .where(
            whereConditions.length > 0
              ? and(eq(simulations.status, 'completed'), ...whereConditions)
              : eq(simulations.status, 'completed')
          );
        const activeUsers = activeUsersResult?.count || 0;

        // Average duration (in minutes)
        const [avgDurationResult] = await db
          .select({ avg: sql<number>`avg(${simulations.duration})` })
          .from(simulations)
          .where(
            whereConditions.length > 0
              ? and(
                  eq(simulations.status, 'completed'),
                  isNotNull(simulations.duration),
                  ...whereConditions
                )
              : and(
                  eq(simulations.status, 'completed'),
                  isNotNull(simulations.duration)
                )
          );
        const averageDuration = Math.round(avgDurationResult?.avg || 0);

        return {
          totalSimulations,
          completedSimulations,
          averageScore,
          activeUsers,
          averageDuration
        };
      }),

    getCategoryPerformance: demoUserProcedure
      .input(z.object({
        userId: z.number().optional(),
        department: z.string().optional(),
      }).optional())
      .query(async ({ input }) => {
        const db = await getDb();
        if (!db) throw new Error('Database connection failed');

        const whereConditions = [eq(simulations.status, 'completed')];
        
        if (input?.userId) {
          whereConditions.push(eq(simulations.userId, input.userId));
        }

        const results = await db
          .select({
            category: scenarios.category,
            averageScore: sql<number>`round(avg(${simulations.overallScore}))`,
            totalAttempts: sql<number>`count(*)`
          })
          .from(simulations)
          .innerJoin(scenarios, eq(simulations.scenarioId, scenarios.id))
          .where(whereConditions.length > 0 ? and(...whereConditions) : undefined)
          .groupBy(scenarios.category);

        return results;
      }),

    getTimeSeriesData: demoUserProcedure
      .input(z.object({
        userId: z.number().optional(),
        department: z.string().optional(),
      }).optional())
      .query(async ({ input }) => {
        const db = await getDb();
        if (!db) throw new Error('Database connection failed');

        const thirtyDaysAgo = new Date();
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

        const whereConditions = [
          eq(simulations.status, 'completed'),
          isNotNull(simulations.completedAt),
          gte(simulations.completedAt, thirtyDaysAgo)
        ];
        
        if (input?.userId) {
          whereConditions.push(eq(simulations.userId, input.userId));
        }

        const results = await db
          .select({
            date: sql<string>`date(${simulations.completedAt})`,
            averageScore: sql<number>`round(avg(${simulations.overallScore}))`,
            simulationsCount: sql<number>`count(*)`
          })
          .from(simulations)
          .where(whereConditions.length > 0 ? and(...whereConditions) : undefined)
          .groupBy(sql`date(${simulations.completedAt})`)
          .orderBy(sql`date(${simulations.completedAt})`);

        return results;
      }),

    getLeaderboard: demoUserProcedure
      .input(z.object({
        limit: z.number().default(10),
        userId: z.number().optional(),
        department: z.string().optional(),
      }))
      .query(async ({ input }) => {
        const db = await getDb();
        if (!db) throw new Error('Database connection failed');

        const whereConditions = [eq(simulations.status, 'completed')];
        
        if (input.userId) {
          whereConditions.push(eq(simulations.userId, input.userId));
        }

        const results = await db
          .select({
            userId: simulations.userId,
            userName: sql<string>`null`,
            averageScore: sql<number>`round(avg(${simulations.overallScore}))`,
            completedSimulations: sql<number>`count(*)`,
            totalPoints: sql<number>`sum(${simulations.pointsEarned})`
          })
          .from(simulations)
          .where(and(...whereConditions))
          .groupBy(simulations.userId)
          .orderBy(
            desc(sql`avg(${simulations.overallScore})`),
            desc(sql`count(*)`)
          )
          .limit(input.limit);

        return results;
      }),

    getAgentsList: demoUserProcedure
      .query(async () => {
        const db = await getDb();
        if (!db) throw new Error('Database connection failed');

        const results = await db
          .selectDistinct({
            userId: simulations.userId,
          })
          .from(simulations)
          .where(eq(simulations.status, 'completed'));

        return results.map(r => r.userId);
      }),
  }),
  supabase: router({
    getUserStats: protectedProcedure
      .query(async ({ ctx }) => {
        try {
          const { getUserStatsFromSupabase } = await import('./supabaseService');
          return await getUserStatsFromSupabase(ctx.user.id);
        } catch (error) {
          console.error('Error fetching user stats from Supabase:', error);
          return null;
        }
      }),
    
    getUserSimulations: protectedProcedure
      .query(async ({ ctx }) => {
        try {
          const { getUserSimulationsFromSupabase } = await import('./supabaseService');
          return await getUserSimulationsFromSupabase(ctx.user.id);
        } catch (error) {
          console.error('Error fetching user simulations from Supabase:', error);
          return [];
        }
      }),
    
    getLeaderboard: publicProcedure
      .input(z.object({ limit: z.number().default(10) }))
      .query(async ({ input }) => {
        try {
          const { getLeaderboardFromSupabase } = await import('./supabaseService');
          return await getLeaderboardFromSupabase(input.limit);
        } catch (error) {
          console.error('Error fetching leaderboard from Supabase:', error);
          return [];
        }
      }),
    
    syncSimulation: protectedProcedure
      .input(z.object({
        scenarioId: z.number(),
        categoryId: z.number(),
        overallScore: z.number(),
        duration: z.number(),
        feedback: z.string(),
        categoryScores: z.record(z.string(), z.number()),
      }))
      .mutation(async ({ ctx, input }) => {
        try {
          const { syncSimulationToSupabase } = await import('./supabaseService');
          return await syncSimulationToSupabase({
            userId: ctx.user.id,
            ...input,
            completedAt: new Date(),
          });
        } catch (error) {
          console.error('Error syncing simulation to Supabase:', error);
          return null;
        }
      }),
  }),
});
export type AppRouter = typeof appRouter;
