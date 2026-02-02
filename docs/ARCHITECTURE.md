# 🏗️ Arquitectura del Sistema

## Visión General

Kaitel Training Platform sigue una arquitectura de **aplicación web full-stack moderna** con separación clara entre frontend y backend, comunicación type-safe mediante tRPC, y servicios externos para IA y almacenamiento.

```
┌─────────────────────────────────────────────────────────────┐
│                        FRONTEND                              │
│  ┌──────────────────────────────────────────────────────┐  │
│  │  React 19 + TypeScript + TailwindCSS + shadcn/ui    │  │
│  │  - Dashboard, Scenarios, Simulations, Progress      │  │
│  │  - SyncedAudioPlayer, TrainingDashboardLayout       │  │
│  │  - tRPC Client (type-safe API calls)                │  │
│  └──────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────┘
                              ↕ HTTP/tRPC
┌─────────────────────────────────────────────────────────────┐
│                        BACKEND                               │
│  ┌──────────────────────────────────────────────────────┐  │
│  │  Node.js 22 + Express 4 + tRPC 11                   │  │
│  │  - routers.ts (API procedures)                       │  │
│  │  - evaluationService.ts (GPT evaluation)             │  │
│  │  - voiceAnalysisService.ts (Whisper + analysis)     │  │
│  │  - keywordDetectionService.ts (keyword extraction)   │  │
│  │  - db.ts (Drizzle ORM helpers)                       │  │
│  └──────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────┘
         ↕                    ↕                    ↕
┌─────────────┐      ┌──────────────┐      ┌──────────────┐
│   MySQL/    │      │  OpenAI API  │      │   AWS S3     │
│   TiDB      │      │  GPT-4o +    │      │  (Audio      │
│  (Database) │      │  Whisper     │      │  Storage)    │
└─────────────┘      └──────────────┘      └──────────────┘
```

---

## Capas de la Aplicación

### 1. Capa de Presentación (Frontend)

**Tecnologías**: React 19, TypeScript, TailwindCSS 4, shadcn/ui, Wouter

**Responsabilidades**:
- Renderizar interfaces de usuario reactivas y accesibles
- Gestionar estado local de componentes
- Comunicarse con el backend mediante tRPC hooks
- Manejar navegación del lado del cliente
- Reproducir audio y sincronizar con transcripciones

**Componentes Clave**:

| Componente | Propósito |
|------------|-----------|
| `TrainingDashboardLayout` | Layout principal con sidebar y navegación |
| `Dashboard` | Página de inicio con métricas y resumen |
| `Scenarios` | Biblioteca de escenarios de entrenamiento |
| `SimulationSession` | Interfaz de simulación en tiempo real |
| `SimulationDetail` | Vista detallada con audio, transcripción y análisis |
| `SyncedAudioPlayer` | Reproductor sincronizado con marcadores |
| `Progress` | Analíticas y progreso del usuario |
| `Gamification` | Badges, niveles y logros |
| `Team` | Dashboard para supervisores |

**Flujo de Datos**:
1. Usuario interactúa con UI
2. Componente llama a tRPC hook (`trpc.*.useQuery/useMutation`)
3. TanStack Query gestiona cache y estado del servidor
4. Respuesta se renderiza en la UI

---

### 2. Capa de Lógica de Negocio (Backend)

**Tecnologías**: Node.js 22, Express 4, tRPC 11, Drizzle ORM

**Responsabilidades**:
- Exponer API type-safe mediante tRPC procedures
- Validar inputs con Zod schemas
- Ejecutar lógica de negocio (evaluaciones, análisis)
- Interactuar con base de datos mediante Drizzle ORM
- Orquestar llamadas a servicios externos (OpenAI, S3)

**Routers Principales**:

| Router | Procedimientos | Descripción |
|--------|----------------|-------------|
| `auth` | `me`, `logout` | Gestión de sesión (deshabilitado en demo) |
| `scenarios` | `list`, `getById`, `getByCategory`, `getByComplexity` | CRUD de escenarios |
| `simulations` | `start`, `sendMessage`, `complete`, `mySimulations`, `getById`, `getMessages` | Gestión de simulaciones |
| `user` | `stats`, `profile`, `badges` | Información del usuario |
| `improvementPlans` | `myPlans`, `activePlan` | Planes de mejora personalizados |
| `audioMarkers` | `list`, `create`, `update`, `delete` | Marcadores temporales |

**Servicios Especializados**:

**`evaluationService.ts`**
- Genera respuestas del cliente usando GPT-4o basándose en el perfil del escenario
- Evalúa el desempeño del agente en cinco dimensiones
- Calcula puntuaciones y genera feedback personalizado

**`voiceAnalysisService.ts`**
- Transcribe audio con Whisper API
- Calcula métricas de habla (velocidad, pausas)
- Analiza sentimiento del texto con LLM
- Genera puntuación vocal global e insights

**`keywordDetectionService.ts`**
- Detecta palabras clave bancarias en transcripciones
- Categoriza keywords (productos, acciones, emociones, fraude)
- Retorna posiciones y contexto de cada keyword

---

### 3. Capa de Persistencia (Base de Datos)

**Tecnología**: MySQL 8.0+ o TiDB (compatible con MySQL)

**ORM**: Drizzle ORM para queries type-safe

**Esquema de Tablas**:

#### `users`
Almacena información de usuarios (agentes, supervisores, trainers, admins).

| Campo | Tipo | Descripción |
|-------|------|-------------|
| `id` | INT (PK) | ID auto-incremental |
| `openId` | VARCHAR(64) UNIQUE | Identificador OAuth (demo: "demo-user-kaitel") |
| `name` | TEXT | Nombre completo |
| `email` | VARCHAR(320) | Correo electrónico |
| `role` | ENUM | `agent`, `supervisor`, `trainer`, `admin` |
| `level` | ENUM | `junior`, `intermediate`, `senior`, `expert` |
| `points` | INT | Puntos de experiencia acumulados |
| `badges` | JSON | Array de IDs de badges desbloqueados |

#### `scenarios`
Define escenarios de entrenamiento.

| Campo | Tipo | Descripción |
|-------|------|-------------|
| `id` | INT (PK) | ID auto-incremental |
| `title` | VARCHAR(255) | Título del escenario |
| `description` | TEXT | Descripción detallada |
| `category` | VARCHAR(100) | `consulta`, `reclamo`, `fraude`, `lavado`, `robo`, etc. |
| `complexity` | INT | 1-5 (básico a experto) |
| `clientProfile` | JSON | Perfil del cliente (nombre, emoción, situación) |
| `expectedBehaviors` | JSON | Array de comportamientos esperados del agente |
| `isActive` | BOOLEAN | Si está disponible para entrenamiento |

#### `simulations`
Registra sesiones de simulación.

| Campo | Tipo | Descripción |
|-------|------|-------------|
| `id` | INT (PK) | ID auto-incremental |
| `userId` | INT (FK) | Referencia a `users.id` |
| `scenarioId` | INT (FK) | Referencia a `scenarios.id` |
| `status` | ENUM | `in_progress`, `completed` |
| `score` | INT | Puntuación global (0-100) |
| `evaluation` | JSON | Detalle de evaluación (scores por dimensión, feedback) |
| `audioRecordingUrl` | TEXT | URL de S3 del audio grabado |
| `audioTranscript` | TEXT | Transcripción completa de Whisper |
| `transcriptSegments` | JSON | Segmentos con timestamps |
| `transcriptKeywords` | JSON | Palabras clave detectadas |
| `voiceMetrics` | JSON | Métricas vocales (tono, velocidad, pausas) |
| `pointsEarned` | INT | Puntos ganados en esta simulación |
| `badgesEarned` | JSON | Badges desbloqueados |
| `startedAt` | TIMESTAMP | Inicio de la simulación |
| `completedAt` | TIMESTAMP | Finalización de la simulación |

#### `messages`
Mensajes intercambiados durante simulaciones.

| Campo | Tipo | Descripción |
|-------|------|-------------|
| `id` | INT (PK) | ID auto-incremental |
| `simulationId` | INT (FK) | Referencia a `simulations.id` |
| `role` | ENUM | `agent`, `client` |
| `content` | TEXT | Contenido del mensaje |
| `timestamp` | TIMESTAMP | Momento del mensaje |

#### `audioMarkers`
Marcadores temporales agregados por supervisores.

| Campo | Tipo | Descripción |
|-------|------|-------------|
| `id` | INT (PK) | ID auto-incremental |
| `simulationId` | INT (FK) | Referencia a `simulations.id` |
| `userId` | INT (FK) | Supervisor que creó el marcador |
| `timestamp` | FLOAT | Posición en segundos del audio |
| `category` | ENUM | `excellent`, `good`, `needs_improvement`, `critical_error` |
| `note` | TEXT | Comentario del supervisor |
| `createdAt` | TIMESTAMP | Fecha de creación |

#### `badges`
Definición de badges disponibles.

| Campo | Tipo | Descripción |
|-------|------|-------------|
| `id` | INT (PK) | ID auto-incremental |
| `name` | VARCHAR(100) | Nombre del badge |
| `description` | TEXT | Descripción del logro |
| `icon` | VARCHAR(50) | Nombre del icono de Lucide React |
| `color` | VARCHAR(50) | Color del badge (Tailwind class) |
| `requirement` | JSON | Condiciones para desbloquear |

#### `improvementPlans`
Planes de mejora personalizados.

| Campo | Tipo | Descripción |
|-------|------|-------------|
| `id` | INT (PK) | ID auto-incremental |
| `userId` | INT (FK) | Referencia a `users.id` |
| `weaknesses` | JSON | Array de debilidades identificadas |
| `recommendations` | JSON | Array de recomendaciones |
| `assignedScenarios` | JSON | Array de IDs de escenarios sugeridos |
| `status` | ENUM | `active`, `completed` |
| `createdAt` | TIMESTAMP | Fecha de creación |

**Índices Importantes**:
- `users.openId` (UNIQUE)
- `simulations.userId` + `simulations.completedAt` (para queries de historial)
- `messages.simulationId` + `messages.timestamp` (para ordenar mensajes)
- `audioMarkers.simulationId` (para cargar marcadores)

---

### 4. Servicios Externos

#### OpenAI API

**GPT-4o** (Evaluación y Generación)
- **Endpoint**: `https://api.openai.com/v1/chat/completions`
- **Uso**: Generar respuestas del cliente, evaluar desempeño del agente, analizar sentimiento
- **Configuración**: `model: "gpt-4o"`, `temperature: 0.7` para respuestas, `0.3` para evaluación
- **Fallback**: LLM de Manus si `OPENAI_API_KEY` no está configurada

**Whisper** (Transcripción de Audio)
- **Endpoint**: `https://api.openai.com/v1/audio/transcriptions`
- **Uso**: Transcribir grabaciones de simulaciones con timestamps
- **Configuración**: `model: "whisper-1"`, `response_format: "verbose_json"` para obtener segmentos
- **Límite**: 25 MB por archivo (compresión automática en frontend)

#### AWS S3 (Almacenamiento)

**Bucket**: `kaitel-training-audio` (configurable)

**Estructura de Keys**:
```
simulations/
  ├── {userId}/
  │   ├── {simulationId}-{timestamp}.webm
  │   └── ...
```

**Configuración**:
- **ACL**: `public-read` para permitir reproducción directa desde frontend
- **Lifecycle**: Archivar a Glacier después de 90 días
- **CORS**: Habilitado para `https://kaitel-training.manus.space`

**Seguridad**:
- Keys con sufijos aleatorios para prevenir enumeración
- Metadata en base de datos (path, URL, owner, mime, size)
- Presigned URLs para acceso temporal (opcional)

---

## Flujos de Datos Principales

### Flujo 1: Inicio de Simulación

```
1. Usuario selecciona escenario en frontend
   ↓
2. Frontend llama a trpc.simulations.start.useMutation({ scenarioId })
   ↓
3. Backend crea registro en tabla `simulations` con status="in_progress"
   ↓
4. Backend retorna simulationId y clientProfile
   ↓
5. Frontend inicia grabación de audio (MediaRecorder API)
   ↓
6. Frontend muestra interfaz de chat con perfil del cliente
```

### Flujo 2: Interacción Durante Simulación

```
1. Usuario escribe mensaje en frontend
   ↓
2. Frontend guarda mensaje localmente y llama a trpc.simulations.sendMessage.useMutation()
   ↓
3. Backend guarda mensaje del agente en tabla `messages`
   ↓
4. Backend llama a evaluationService.generateClientResponse()
   ↓
5. evaluationService llama a OpenAI GPT-4o con contexto del escenario
   ↓
6. GPT-4o retorna respuesta del cliente
   ↓
7. Backend guarda respuesta del cliente en tabla `messages`
   ↓
8. Backend retorna respuesta al frontend
   ↓
9. Frontend muestra respuesta del cliente en el chat
```

### Flujo 3: Finalización y Evaluación

```
1. Usuario completa simulación en frontend
   ↓
2. Frontend detiene grabación y obtiene Blob de audio
   ↓
3. Frontend llama a trpc.simulations.complete.useMutation({ simulationId, audioBlob })
   ↓
4. Backend sube audio a S3 usando storagePut()
   ↓
5. Backend llama a voiceAnalysisService.analyzeVoice(audioUrl)
   ↓
6. voiceAnalysisService llama a Whisper API para transcripción
   ↓
7. voiceAnalysisService calcula métricas de habla (velocidad, pausas)
   ↓
8. voiceAnalysisService llama a LLM para análisis de sentimiento
   ↓
9. voiceAnalysisService llama a keywordDetectionService
   ↓
10. Backend llama a evaluationService.evaluateSimulation()
   ↓
11. evaluationService llama a GPT-4o para evaluar desempeño
   ↓
12. Backend calcula puntos y badges ganados
   ↓
13. Backend actualiza registro de `simulations` con todos los datos
   ↓
14. Backend actualiza `users.points` y `users.badges`
   ↓
15. Backend retorna evaluación completa al frontend
   ↓
16. Frontend redirige a página de detalle con resultados
```

### Flujo 4: Reproducción con Marcadores

```
1. Supervisor abre detalle de simulación
   ↓
2. Frontend carga simulación con trpc.simulations.getById.useQuery()
   ↓
3. Frontend carga marcadores con trpc.audioMarkers.list.useQuery()
   ↓
4. Frontend renderiza SyncedAudioPlayer con audio, transcripción y marcadores
   ↓
5. Supervisor hace clic en "Agregar Marcador" durante reproducción
   ↓
6. Frontend muestra modal con categoría y nota
   ↓
7. Supervisor guarda marcador
   ↓
8. Frontend llama a trpc.audioMarkers.create.useMutation()
   ↓
9. Backend guarda marcador en tabla `audioMarkers`
   ↓
10. Frontend actualiza timeline con nuevo marcador
```

---

## Patrones de Diseño

### 1. **Separation of Concerns**
- Frontend solo maneja presentación y estado de UI
- Backend maneja lógica de negocio y persistencia
- Servicios externos encapsulados en módulos específicos

### 2. **Type-Safe Communication**
- tRPC garantiza tipos compartidos entre frontend y backend
- Zod valida inputs en tiempo de ejecución
- TypeScript previene errores en tiempo de compilación

### 3. **Repository Pattern**
- `db.ts` actúa como capa de abstracción sobre Drizzle ORM
- Queries complejas encapsuladas en funciones reutilizables
- Facilita testing y cambio de ORM si es necesario

### 4. **Service Layer**
- Lógica de negocio compleja separada en servicios dedicados
- `evaluationService`, `voiceAnalysisService`, `keywordDetectionService`
- Permite testing unitario y reutilización

### 5. **Optimistic Updates**
- Frontend actualiza UI inmediatamente antes de confirmar con backend
- TanStack Query revierte cambios si la mutación falla
- Mejora percepción de velocidad

### 6. **Async Processing**
- Transcripción y análisis de voz se ejecutan de forma asíncrona
- Usuario no espera a que termine el procesamiento
- Resultados se muestran cuando están disponibles

---

## Consideraciones de Seguridad

### Autenticación (Deshabilitada en Demo)
- Sistema OAuth de Manus disponible pero no activo
- Usuario demo (`DEMO_USER`) se usa por defecto
- Para producción: habilitar `protectedProcedure` y OAuth

### Autorización
- Roles definidos: `agent`, `supervisor`, `trainer`, `admin`
- Procedimientos específicos por rol (deshabilitados en demo)
- Para producción: validar `ctx.user.role` en cada procedimiento

### Validación de Inputs
- Todos los inputs validados con Zod schemas
- Prevención de SQL injection mediante Drizzle ORM
- Sanitización de contenido generado por usuarios

### Protección de Datos Sensibles
- API keys almacenadas en variables de entorno
- Nunca exponer `OPENAI_API_KEY` en frontend
- Conexión a base de datos con SSL en producción

### Rate Limiting (Recomendado para Producción)
- Limitar llamadas a OpenAI API por usuario/IP
- Prevenir abuso de endpoints costosos
- Implementar con middleware de Express

---

## Escalabilidad

### Cuellos de Botella Actuales
1. **Transcripción de audio**: Whisper API puede tardar 10-30 segundos
2. **Evaluación con GPT**: Cada evaluación toma 5-15 segundos
3. **Base de datos**: Queries complejas sin cache

### Estrategias de Optimización

**Corto Plazo (0-100 usuarios)**
- Procesamiento asíncrono de audio (no bloquear UI)
- Cache de escenarios en memoria (raramente cambian)
- Índices en columnas frecuentemente consultadas

**Mediano Plazo (100-1000 usuarios)**
- Queue system (RabbitMQ/SQS) para procesamiento de audio
- Redis para cache de sesiones y queries frecuentes
- CDN para assets estáticos y audio
- Réplicas de lectura de base de datos

**Largo Plazo (1000+ usuarios)**
- Microservicios: API Gateway, Evaluation Service, Voice Analysis Service
- Base de datos distribuida (TiDB Cloud con auto-scaling)
- Kubernetes para orquestación de contenedores
- Monitoreo con Prometheus + Grafana

---

## Monitoreo y Observabilidad

### Métricas Clave
- **Latencia de API**: Tiempo de respuesta de procedimientos tRPC
- **Tasa de error**: Porcentaje de requests fallidos
- **Uso de OpenAI API**: Tokens consumidos y costo
- **Almacenamiento S3**: Tamaño total y crecimiento
- **Usuarios activos**: DAU/MAU

### Logging
- Logs estructurados en formato JSON
- Niveles: `debug`, `info`, `warn`, `error`
- Logs de auditoría para acciones críticas (evaluaciones, marcadores)

### Alertas
- Tasa de error > 5%
- Latencia de API > 2 segundos (p95)
- Costo de OpenAI API > presupuesto mensual
- Almacenamiento S3 > 80% del límite

---

## Próximas Mejoras Arquitectónicas

1. **WebSockets para Simulaciones en Tiempo Real**
   - Eliminar polling, usar conexiones bidireccionales
   - Respuestas del cliente instantáneas

2. **Procesamiento de Audio en el Edge**
   - Comprimir audio en el navegador antes de subir
   - Reducir tiempo de subida y costos de S3

3. **Cache Distribuido con Redis**
   - Cache de escenarios, badges, y stats de usuarios
   - Invalidación automática cuando cambian datos

4. **Event Sourcing para Simulaciones**
   - Almacenar eventos (mensaje enviado, evaluación completada)
   - Reconstruir estado de simulación desde eventos
   - Facilita auditoría y debugging

5. **GraphQL Subscriptions para Supervisores**
   - Notificaciones en tiempo real cuando agente completa simulación
   - Dashboard de supervisores se actualiza automáticamente

---

**Autor**: Manus AI  
**Última actualización**: Febrero 2026  
**Versión**: 1.0.0
