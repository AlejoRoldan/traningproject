import {
  pgTable,
  uuid,
  text,
  integer,
  decimal,
  timestamp,
  pgEnum,
  jsonb,
  index,
  check,
} from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';

// ============================================================================
// ENUMS
// ============================================================================

export const userRoleEnum = pgEnum('user_role', ['agente', 'supervisor', 'admin']);
export const difficultyLevelEnum = pgEnum('difficulty_level', ['junior', 'intermediate', 'senior', 'expert']);
export const markerCategoryEnum = pgEnum('marker_category', ['excelente', 'bueno', 'mejora', 'critico']);

// ============================================================================
// TABLAS
// ============================================================================

/**
 * Tabla de Usuarios (Extensión del Auth de Supabase)
 */
export const users = pgTable(
  'users',
  {
    id: uuid('id').primaryKey(),
    full_name: text('full_name').notNull(),
    role: userRoleEnum('role').default('agente'),
    experience_level: difficultyLevelEnum('experience_level').default('junior'),
    total_xp: integer('total_xp').default(0),
    created_at: timestamp('created_at', { withTimezone: true }).defaultNow(),
  },
  (table) => ({
    roleIndex: index('idx_users_role').on(table.role),
    experienceLevelIndex: index('idx_users_experience_level').on(table.experience_level),
  })
);

/**
 * Tabla de Escenarios (Los Prompts del Cliente)
 */
export const scenarios = pgTable(
  'scenarios',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    title: text('title').notNull(),
    description: text('description'),
    difficulty: difficultyLevelEnum('difficulty').notNull(),
    category: text('category'), // Ej: 'Fraude', 'Lavado de Activos'
    system_prompt: text('system_prompt').notNull(), // El "alma" del cliente IA
    voice_id: text('voice_id'), // ID de voz de OpenAI TTS (ej: 'alloy', 'shimmer')
    created_at: timestamp('created_at', { withTimezone: true }).defaultNow(),
  },
  (table) => ({
    difficultyIndex: index('idx_scenarios_difficulty').on(table.difficulty),
    categoryIndex: index('idx_scenarios_category').on(table.category),
  })
);

/**
 * Tabla de Simulaciones (Cabecera de la sesión)
 */
export const simulations = pgTable(
  'simulations',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    user_id: uuid('user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    scenario_id: uuid('scenario_id').references(() => scenarios.id),
    audio_url_s3: text('audio_url_s3'), // Link al bucket de AWS S3
    duration_seconds: integer('duration_seconds'),
    overall_score: decimal('overall_score', { precision: 3, scale: 2 }), // Score de 0.00 a 5.00
    status: text('status').default('completed'), // 'in_progress', 'completed', 'failed'
    created_at: timestamp('created_at', { withTimezone: true }).defaultNow(),
  },
  (table) => ({
    userIdIndex: index('idx_simulations_user_id').on(table.user_id),
    scenarioIdIndex: index('idx_simulations_scenario_id').on(table.scenario_id),
    createdAtIndex: index('idx_simulations_created_at').on(table.created_at),
    statusIndex: index('idx_simulations_status').on(table.status),
  })
);

/**
 * Tabla de Mensajes (Transcripción por turnos)
 */
export const messages = pgTable(
  'messages',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    simulation_id: uuid('simulation_id')
      .notNull()
      .references(() => simulations.id, { onDelete: 'cascade' }),
    role: text('role').notNull(), // 'client' o 'agent'
    content: text('content').notNull(),
    sentiment_score: jsonb('sentiment_score'), // Ej: {"sentiment": "enojado", "intensity": 0.8}
    timestamp_seconds: decimal('timestamp_seconds', { precision: 6, scale: 2 }), // Para sincronización con audio
    created_at: timestamp('created_at', { withTimezone: true }).defaultNow(),
  },
  (table) => ({
    simulationIdIndex: index('idx_messages_simulation_id').on(table.simulation_id),
    roleCheck: check('role_check', `role IN ('client', 'agent')`),
  })
);

/**
 * Tabla de Evaluaciones de IA (El veredicto de GPT-4o)
 */
export const evaluations = pgTable(
  'evaluations',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    simulation_id: uuid('simulation_id')
      .notNull()
      .references(() => simulations.id, { onDelete: 'cascade' }),
    score_empathy: integer('score_empathy'),
    score_clarity: integer('score_clarity'),
    score_protocol: integer('score_protocol'),
    score_resolution: integer('score_resolution'),
    score_confidence: integer('score_confidence'),
    critical_errors: text('critical_errors').array(), // Array de strings con errores
    strengths: text('strengths').array(),
    weaknesses: text('weaknesses').array(),
    action_plan: text('action_plan'), // Recomendación IA
    raw_ai_response: jsonb('raw_ai_response'), // Respuesta cruda de GPT-4o
    created_at: timestamp('created_at', { withTimezone: true }).defaultNow(),
  },
  (table) => ({
    simulationIdIndex: index('idx_evaluations_simulation_id').on(table.simulation_id),
    scoreEmpathyCheck: check('score_empathy_check', 'score_empathy BETWEEN 1 AND 5'),
    scoreClarityCheck: check('score_clarity_check', 'score_clarity BETWEEN 1 AND 5'),
    scoreProtocolCheck: check('score_protocol_check', 'score_protocol BETWEEN 1 AND 5'),
    scoreResolutionCheck: check('score_resolution_check', 'score_resolution BETWEEN 1 AND 5'),
    scoreConfidenceCheck: check('score_confidence_check', 'score_confidence BETWEEN 1 AND 5'),
  })
);

/**
 * Tabla de Marcadores (Feedback Humano del Supervisor)
 */
export const markers = pgTable(
  'markers',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    simulation_id: uuid('simulation_id')
      .notNull()
      .references(() => simulations.id, { onDelete: 'cascade' }),
    supervisor_id: uuid('supervisor_id').references(() => users.id),
    category: markerCategoryEnum('category').notNull(),
    note: text('note'),
    timestamp_seconds: decimal('timestamp_seconds', { precision: 6, scale: 2 }).notNull(),
    created_at: timestamp('created_at', { withTimezone: true }).defaultNow(),
  },
  (table) => ({
    simulationIdIndex: index('idx_markers_simulation_id').on(table.simulation_id),
    supervisorIdIndex: index('idx_markers_supervisor_id').on(table.supervisor_id),
  })
);

// ============================================================================
// RELACIONES (Drizzle Relations)
// ============================================================================

export const usersRelations = relations(users, ({ many }) => ({
  simulations: many(simulations),
  supervisedMarkers: many(markers),
}));

export const scenariosRelations = relations(scenarios, ({ many }) => ({
  simulations: many(simulations),
}));

export const simulationsRelations = relations(simulations, ({ one, many }) => ({
  user: one(users, {
    fields: [simulations.user_id],
    references: [users.id],
  }),
  scenario: one(scenarios, {
    fields: [simulations.scenario_id],
    references: [scenarios.id],
  }),
  messages: many(messages),
  evaluation: one(evaluations),
  markers: many(markers),
}));

export const messagesRelations = relations(messages, ({ one }) => ({
  simulation: one(simulations, {
    fields: [messages.simulation_id],
    references: [simulations.id],
  }),
}));

export const evaluationsRelations = relations(evaluations, ({ one }) => ({
  simulation: one(simulations, {
    fields: [evaluations.simulation_id],
    references: [simulations.id],
  }),
}));

export const markersRelations = relations(markers, ({ one }) => ({
  simulation: one(simulations, {
    fields: [markers.simulation_id],
    references: [simulations.id],
  }),
  supervisor: one(users, {
    fields: [markers.supervisor_id],
    references: [users.id],
  }),
}));

// ============================================================================
// TIPOS EXPORTADOS
// ============================================================================

export type User = typeof users.$inferSelect;
export type NewUser = typeof users.$inferInsert;

export type Scenario = typeof scenarios.$inferSelect;
export type NewScenario = typeof scenarios.$inferInsert;

export type Simulation = typeof simulations.$inferSelect;
export type NewSimulation = typeof simulations.$inferInsert;

export type Message = typeof messages.$inferSelect;
export type NewMessage = typeof messages.$inferInsert;

export type Evaluation = typeof evaluations.$inferSelect;
export type NewEvaluation = typeof evaluations.$inferInsert;

export type Marker = typeof markers.$inferSelect;
export type NewMarker = typeof markers.$inferInsert;
