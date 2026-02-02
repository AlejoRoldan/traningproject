# Especificación de Base de Datos - Kaitel Training Platform

## Modelo de Datos

### Tabla: users (ya existe, extender)
Campos adicionales necesarios:
- `role`: enum('user', 'admin', 'agent', 'supervisor', 'trainer') - Rol del usuario
- `department`: varchar(100) - Departamento al que pertenece
- `supervisorId`: int - ID del supervisor asignado (FK a users)
- `level`: enum('junior', 'intermediate', 'senior', 'expert') - Nivel actual del agente
- `points`: int - Puntos acumulados de gamificación
- `badges`: json - Array de badges obtenidos

### Tabla: scenarios
Escenarios de entrenamiento disponibles
- `id`: int PK autoincrement
- `title`: varchar(200) - Título del escenario
- `description`: text - Descripción detallada
- `category`: enum('informative', 'transactional', 'fraud', 'money_laundering', 'theft', 'complaint', 'credit', 'digital_channels') - Categoría del caso
- `complexity`: int (1-5) - Nivel de complejidad
- `estimatedDuration`: int - Duración estimada en minutos
- `systemPrompt`: text - Prompt para GPT que define el comportamiento del cliente
- `clientProfile`: json - Perfil del cliente simulado (emoción, contexto, objetivo)
- `evaluationCriteria`: json - Criterios específicos de evaluación
- `idealResponse`: text - Respuesta ideal o guía
- `tags`: json - Tags para búsqueda y filtrado
- `isActive`: boolean - Si está disponible para uso
- `createdBy`: int - Usuario que creó el escenario (FK a users)
- `createdAt`: timestamp
- `updatedAt`: timestamp

### Tabla: simulations
Sesiones de entrenamiento realizadas
- `id`: int PK autoincrement
- `userId`: int - Agente que realizó la simulación (FK a users)
- `scenarioId`: int - Escenario utilizado (FK a scenarios)
- `status`: enum('in_progress', 'completed', 'abandoned') - Estado de la simulación
- `startedAt`: timestamp - Inicio de la simulación
- `completedAt`: timestamp - Finalización de la simulación
- `duration`: int - Duración real en segundos
- `transcript`: json - Array de mensajes de la conversación
- `overallScore`: decimal(5,2) - Puntuación general (0-100)
- `categoryScores`: json - Puntuaciones por categoría
- `feedback`: text - Feedback generado por GPT
- `strengths`: json - Array de fortalezas identificadas
- `weaknesses`: json - Array de debilidades identificadas
- `recommendations`: json - Array de recomendaciones
- `pointsEarned`: int - Puntos ganados en esta simulación
- `badgesEarned`: json - Badges obtenidos en esta simulación
- `createdAt`: timestamp

### Tabla: messages
Mensajes individuales dentro de simulaciones
- `id`: int PK autoincrement
- `simulationId`: int - Simulación a la que pertenece (FK a simulations)
- `role`: enum('agent', 'client', 'system') - Quién envió el mensaje
- `content`: text - Contenido del mensaje
- `timestamp`: timestamp - Momento del mensaje
- `evaluationNote`: text - Nota de evaluación específica para este mensaje
- `createdAt`: timestamp

### Tabla: improvement_plans
Planes de mejora personalizados
- `id`: int PK autoincrement
- `userId`: int - Agente al que se asigna el plan (FK a users)
- `title`: varchar(200) - Título del plan
- `description`: text - Descripción del plan
- `generatedBy`: enum('automatic', 'supervisor', 'trainer') - Origen del plan
- `createdBy`: int - Usuario que creó el plan (FK a users)
- `status`: enum('active', 'completed', 'cancelled') - Estado del plan
- `weaknessAreas`: json - Áreas de debilidad identificadas
- `recommendedScenarios`: json - IDs de escenarios recomendados
- `goals`: json - Objetivos específicos del plan
- `progress`: int (0-100) - Progreso del plan
- `startDate`: date - Fecha de inicio
- `targetDate`: date - Fecha objetivo de completación
- `completedAt`: timestamp
- `createdAt`: timestamp
- `updatedAt`: timestamp

### Tabla: badges
Catálogo de badges disponibles
- `id`: int PK autoincrement
- `name`: varchar(100) - Nombre del badge
- `description`: text - Descripción del logro
- `icon`: varchar(50) - Identificador del ícono
- `category`: enum('empathy', 'protocol', 'resolution', 'crisis', 'speed', 'consistency') - Categoría del badge
- `criteria`: json - Criterios para obtener el badge
- `rarity`: enum('common', 'rare', 'epic', 'legendary') - Rareza del badge
- `createdAt`: timestamp

### Tabla: user_badges
Relación de badges obtenidos por usuarios
- `id`: int PK autoincrement
- `userId`: int - Usuario que obtuvo el badge (FK a users)
- `badgeId`: int - Badge obtenido (FK a badges)
- `earnedAt`: timestamp - Cuándo se obtuvo
- `simulationId`: int - Simulación en la que se obtuvo (FK a simulations, nullable)

### Tabla: team_stats
Estadísticas agregadas por equipo/departamento
- `id`: int PK autoincrement
- `department`: varchar(100) - Departamento
- `supervisorId`: int - Supervisor del equipo (FK a users)
- `period`: enum('daily', 'weekly', 'monthly') - Período de agregación
- `periodDate`: date - Fecha del período
- `totalSimulations`: int - Total de simulaciones realizadas
- `averageScore`: decimal(5,2) - Puntuación promedio del equipo
- `topPerformers`: json - Top 3 agentes del período
- `commonWeaknesses`: json - Debilidades comunes del equipo
- `improvementRate`: decimal(5,2) - Tasa de mejora del equipo
- `createdAt`: timestamp

## Índices Recomendados
- users: (role), (supervisorId), (level)
- scenarios: (category), (complexity), (isActive)
- simulations: (userId), (scenarioId), (status), (startedAt)
- messages: (simulationId), (timestamp)
- improvement_plans: (userId), (status), (createdBy)
- user_badges: (userId), (badgeId)
- team_stats: (department), (supervisorId), (periodDate)

## Relaciones Principales
- users.supervisorId → users.id (supervisor)
- scenarios.createdBy → users.id
- simulations.userId → users.id
- simulations.scenarioId → scenarios.id
- messages.simulationId → simulations.id
- improvement_plans.userId → users.id
- improvement_plans.createdBy → users.id
- user_badges.userId → users.id
- user_badges.badgeId → badges.id
- user_badges.simulationId → simulations.id
- team_stats.supervisorId → users.id
