# Contact Center Training Platform - System Architecture

## Executive Summary

This is an enterprise-grade SaaS platform for training contact center agents in Paraguay using AI-powered simulations with voice interactions. The system evaluates agent performance in real-time and provides personalized feedback.

## Core Principles

### 1. **Real-Time Interactivity (<500ms Latency)**
- WebSocket streaming for audio
- Redis caching for fast access
- Parallel processing where possible
- Async evaluation post-session

### 2. **SOLID Architecture**
- **S**: SimulationOrchestratorService handles only orchestration
- **O**: Services are extensible via dependency injection
- **L**: Abstract interfaces for all dependencies
- **I**: Small focused service contracts
- **D**: Depends on abstractions, not concrete implementations

### 3. **Personality-Driven Simulations**
- AI client has realistic personality (angry, confused, friendly, demanding)
- Uses Paraguay Spanish with Guaraní phrases for authenticity
- Behavioral patterns change based on agent performance
- Dynamic difficulty adjustment

### 4. **Comprehensive Evaluation**
- Multi-dimensional scoring (empathy, clarity, protocol, resolution, confidence)
- Voice analysis (tone, pace, confidence, professionalism)
- Real-time feedback with actionable recommendations
- Gamification to motivate continuous improvement

## System Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                        PRESENTATION LAYER                    │
│  (React 19 + Next.js + TailwindCSS + Shadcn/UI)             │
│  ├─ Dashboard (Agent Performance View)                      │
│  ├─ Scenario Selection & Training UI                        │
│  ├─ Real-time Audio Control (Record/Playback)              │
│  ├─ Session Review & Analysis                               │
│  └─ Supervisor Team Dashboard                               │
└──────────────────────┬──────────────────────────────────────┘
                       │ WebSocket + tRPC (Type-safe)
┌──────────────────────▼──────────────────────────────────────┐
│                     API GATEWAY LAYER                        │
│  (Express/Fastify with NestJS)                              │
│  ├─ Authentication (JWT)                                    │
│  ├─ Authorization (Role-based)                              │
│  ├─ Rate Limiting                                           │
│  ├─ Request Validation                                      │
│  └─ Error Handling & Logging                                │
└──────────────────────┬──────────────────────────────────────┘
                       │
      ┌────────────────┼────────────────┐
      │                │                │
      ▼                ▼                ▼
┌──────────────┐ ┌──────────────┐ ┌──────────────┐
│  WebSocket   │ │ REST/tRPC    │ │ Background   │
│  Gateway     │ │  Endpoints   │ │   Jobs       │
│              │ │              │ │  (Bull)      │
└──────┬───────┘ └──────┬───────┘ └──────┬───────┘
       │                │                │
       └────────────────┼────────────────┘
                        │
┌───────────────────────▼───────────────────────────────────────┐
│            CORE ORCHESTRATION LAYER (Critical)                │
│                                                               │
│  ┌─────────────────────────────────────────────────────────┐ │
│  │  Simulation Orchestrator Service                        │ │
│  │  ├─ Session Lifecycle Management                       │ │
│  │  ├─ Real-time State Management                         │ │
│  │  ├─ Audio Processing Pipeline                          │ │
│  │  └─ Evaluation Triggering                              │ │
│  └─────────────────────────────────────────────────────────┘ │
│                                                               │
│  ┌─────────────────────────────────────────────────────────┐ │
│  │  State Machine Service (Call Flow)                     │ │
│  │  ├─ INITIALIZED                                        │ │
│  │  ├─ WAITING_FOR_AGENT                                  │ │
│  │  ├─ AGENT_SPEAKING → AI_RESPONDING → PLAYING_RESPONSE │ │
│  │  ├─ PAUSED                                             │ │
│  │  ├─ EVALUATING                                         │ │
│  │  └─ COMPLETED / FAILED / CANCELLED                     │ │
│  └─────────────────────────────────────────────────────────┘ │
│                                                               │
│  ┌─────────────────────────────────────────────────────────┐ │
│  │  Conversation Context Service                          │ │
│  │  ├─ Full History Management                            │ │
│  │  ├─ Sliding Context Window (Last 10 messages)         │ │
│  │  ├─ Metrics Collection                                 │ │
│  │  └─ Transcript Generation                              │ │
│  └─────────────────────────────────────────────────────────┘ │
│                                                               │
│  ┌─────────────────────────────────────────────────────────┐ │
│  │  AI Client Manager Service                             │ │
│  │  ├─ Personality Selection & Configuration              │ │
│  │  ├─ Behavioral Pattern Management                      │ │
│  │  ├─ Dynamic Difficulty Adjustment                      │ │
│  │  └─ Prompt Generation for GPT-4o                       │ │
│  └─────────────────────────────────────────────────────────┘ │
└───────────────────────┬───────────────────────────────────────┘
                        │
        ┌───────────────┼───────────────┐
        │               │               │
        ▼               ▼               ▼
┌──────────────┐ ┌──────────────┐ ┌──────────────┐
│  AI SERVICES │ │ VOICE        │ │  STORAGE     │
│              │ │ SERVICES     │ │              │
│ • OpenAI     │ │              │ │ • S3 Audio   │
│ • Prompt     │ │ • Whisper    │ │ • Presigned  │
│ • Eval       │ │ • ElevenLabs │ │   URLs       │
└──────┬───────┘ │ • VAPI       │ └──────┬───────┘
       │         │ • Analysis   │        │
       │         └──────┬───────┘        │
       └─────────────────┼────────────────┘
                         │
┌────────────────────────▼────────────────────────────────────┐
│                  DATA LAYER                                 │
│                                                            │
│  ┌──────────────────────────────────────────────────────┐ │
│  │  PostgreSQL (Primary Data Store)                    │ │
│  │  ├─ Users (Agents, Supervisors, Admins)           │ │
│  │  ├─ Scenarios (Training Cases)                     │ │
│  │  ├─ Training Sessions & Evaluations                │ │
│  │  ├─ Feedback & Markers                             │ │
│  │  ├─ Gamification (XP, Achievements)                │ │
│  │  └─ Audit Logs                                     │ │
│  └──────────────────────────────────────────────────────┘ │
│                                                            │
│  ┌──────────────────────────────────────────────────────┐ │
│  │  Redis (Cache & Sessions)                           │ │
│  │  ├─ Session Metadata                                │ │
│  │  ├─ Conversation Context                            │ │
│  │  ├─ State Machine State                             │ │
│  │  ├─ Rate Limiter Counters                           │ │
│  │  └─ User Sessions (JWT)                             │ │
│  └──────────────────────────────────────────────────────┘ │
└────────────────────────────────────────────────────────────┘
```

## Service Layer Details

### 1. **Simulation Orchestrator Service** (Core)
**Responsibility**: Master orchestrator of the entire training session lifecycle

```
Session Flow:
1. initializeSession(agentId, scenarioId)
   ├─ Validate agent & scenario
   ├─ Create session in database
   ├─ Initialize AI client personality
   ├─ Setup conversation context
   ├─ Generate client greeting
   └─ Return sessionId + greeting

2. processAgentSpeech(sessionId, audioBuffer) [Real-time]
   ├─ Validate session state
   ├─ Transcribe audio (Whisper)
   ├─ Update conversation context
   ├─ Generate AI response (GPT-4o)
   ├─ Synthesize to speech (ElevenLabs/VAPI)
   ├─ Record metrics
   └─ Return transcription + response (target <500ms)

3. completeSession(sessionId)
   ├─ Mark session as COMPLETED
   ├─ Retrieve full transcript
   ├─ Run comprehensive evaluation (GPT-4o)
   ├─ Analyze voice metrics
   ├─ Generate feedback & recommendations
   ├─ Award XP & check achievements
   └─ Return complete evaluation
```

### 2. **State Machine Service**
**Responsibility**: Explicit state management for call flow

Prevents invalid transitions and ensures consistent state:
- `INITIALIZED` → `WAITING_FOR_AGENT`
- `WAITING_FOR_AGENT` → `AGENT_SPEAKING` → `AI_RESPONDING` → `PLAYING_RESPONSE` → (loop to WAITING_FOR_AGENT)
- Any state → `PAUSED` or `CANCELLED` or `FAILED`
- Last response → `COMPLETED` → `EVALUATING`

Uses Redis for atomic operations and prevents race conditions.

### 3. **AI Client Manager Service**
**Responsibility**: Personality management and behavioral orchestration

Personality Profiles:
```
1. ANGRY Customer
   - Tone: Aggressive
   - Voice: Male, 1.2x speed
   - Characteristics: Impatient, demanding, sarcastic
   - Keywords: "inaceptable", "ahora", "gerente"

2. CONFUSED Customer
   - Tone: Uncertain
   - Voice: Female, 0.9x speed
   - Characteristics: Low comprehension, many questions
   - Keywords: "no entiendo", "¿qué?", "explicame"

3. FRIENDLY Customer
   - Tone: Warm
   - Voice: Female, normal speed
   - Characteristics: Patient, cooperative, appreciative
   - Keywords: "gracias", "entiendo", "no te preocupes"

4. DEMANDING Customer
   - Tone: Stern
   - Voice: Male, 1.15x speed
   - Characteristics: Professional, high expectations, low tolerance
   - Keywords: "inmediato", "eficiencia", "competencia"
```

Each personality generates specific system prompts for GPT-4o that guide response generation.

### 4. **Conversation Context Service**
**Responsibility**: Maintain conversation state and history

- Stores full conversation transcript in Redis for speed
- Manages sliding context window (last 10 messages) for token efficiency
- Tracks metrics (turns, interruptions, latency)
- Generates transcripts for evaluation
- Provides context summaries

### 5. **WebSocket Gateway** (Session Events)
**Responsibility**: Real-time bidirectional communication

Events:
```
Client → Server:
├─ session:initialize {agentId, scenarioId}
├─ audio:chunk {sessionId, chunk: Uint8Array, isLast: boolean}
├─ session:complete {sessionId}
├─ session:pause {sessionId}
├─ session:resume {sessionId}
└─ session:status {sessionId}

Server → Client:
├─ connection:ready
├─ session:initialized {sessionId, clientGreeting, audioUrl}
├─ session:paused
├─ session:resumed
├─ audio:response {transcription, clientResponse, audioUrl, latency}
├─ session:completed {evaluation, scores, feedback, xpAwarded}
└─ session:error {code, message}
```

## Data Flow - Real-Time Conversation Example

```
1. INITIALIZATION (0-100ms)
   Client Browser
   ├─ WebSocket Connect
   ├─ Emit: session:initialize
   └─> Server: SimulationOrchestratorService
       ├─ Create session (DB)
       ├─ AI client setup
       ├─ Generate greeting
       ├─> OpenAI API (Greeting generation)
       ├─> TTS (Audio synthesis)
       └─ Emit: session:initialized + greeting

2. AGENT SPEAKS (100-500ms per turn)
   Agent (Browser Audio Recording)
   ├─ Record audio
   ├─ Emit: audio:chunk
   └─> Server: WebSocket Handler
       ├─ Buffer audio chunks
       ├─ On final chunk:
       ├─> Whisper (Transcription)
       ├─> SimulationOrchestratorService.processAgentSpeech
       ├─> Update context
       ├─> GPT-4o (Generate response)
       ├─> TTS (Synthesize audio)
       ├─> Update metrics
       └─ Emit: audio:response

   Agent (Browser)
   ├─ Receive response
   ├─ Play audio
   ├─ Show transcription
   └─ Ready for next input

3. SESSION COMPLETE (200-1000ms)
   Agent
   ├─ Emit: session:complete
   └─> Server: SimulationOrchestratorService.completeSession
       ├─ Mark COMPLETED
       ├─> Full evaluation (GPT-4o)
       ├─> Voice analysis
       ├─> Save evaluation record (DB)
       ├─> Award XP
       ├─> Check achievements
       └─ Emit: session:completed + full evaluation

   Agent
   ├─ Show evaluation
   ├─ Show feedback
   ├─ Show improvements made
   └─ Option to review or try new scenario
```

## Performance Optimizations

### 1. **Latency (<500ms target)**
- Redis caching for session metadata
- Database connection pooling
- Parallel API calls (OpenAI + TTS)
- Streaming responses where possible
- Audio compression before transmission

### 2. **Throughput**
- Horizontal scaling: Multiple API instances
- Read replicas for analytics queries
- CDN for static assets
- Async evaluation (not blocking client)
- Background jobs for heavy processing

### 3. **Storage**
- S3 for audio files (with lifecycle policies)
- PostgreSQL for structured data
- Redis for ephemeral session data
- Compression for audio archives

## Security Architecture

### 1. **Authentication**
- JWT tokens with 24-hour expiration
- Refresh token rotation
- Token stored in httpOnly cookies

### 2. **Authorization**
- Role-based access control (RBAC)
- Role types: AGENT, SUPERVISOR, ADMIN, SYSTEM
- Resource-level permissions (agents can only view own sessions)

### 3. **Data Protection**
- TLS/SSL for all communication
- Database encryption at rest (AWS RDS)
- S3 encryption and presigned URLs for audio
- PII redaction in logs

### 4. **Input Validation**
- Schema validation (Zod) on all inputs
- SQL injection prevention (Prisma ORM)
- XSS prevention in responses
- CSRF tokens for state-changing operations

### 5. **Rate Limiting**
- 10 req/s per IP (general endpoints)
- 50 req/s per IP (API endpoints)
- WebSocket message rate limiting

## Deployment Architecture

### Development
```
docker-compose up
├─ PostgreSQL + Redis
├─ Node.js backend (watch mode)
├─ React frontend (Vite dev server)
├─ PgAdmin for DB inspection
└─ Mailhog for email testing
```

### Staging/Production
```
AWS ECS/EKS
├─ Application Load Balancer
├─ Auto-scaling group (2-10 instances)
├─ RDS PostgreSQL (Multi-AZ)
├─ ElastiCache Redis (Multi-AZ)
├─ S3 for audio storage
├─ CloudFront CDN
└─ CloudWatch monitoring
```

## Monitoring & Observability

### Metrics
- Request latency (p50, p95, p99)
- Evaluation accuracy
- Session completion rate
- Error rates by type
- WebSocket connection health

### Logging
- Winston/Pino JSON logs
- Request/Response tracing
- Error stack traces
- Performance metrics per operation
- Audit trail for sensitive operations

### Alerts
- API error rate > 1%
- Latency p95 > 1000ms
- Database connection pool exhausted
- S3 upload failures
- Evaluation service unavailable

## Future Enhancements

### Phase 2
- Multi-language support (Spanish variants, Portuguese, English)
- Advanced dialogue flow customization
- Supervisor real-time listening (coaching)
- Integration with HR systems
- Advanced analytics dashboard

### Phase 3
- Conversational AI fine-tuning per company
- Video simulation (support agent performance)
- Mobile app (iOS/Android)
- AI-powered coaching recommendations
- Integration with LMS platforms

## Technology Decisions

| Layer | Technology | Rationale |
|-------|-----------|-----------|
| Frontend | React 19 | Modern, component-based, large ecosystem |
| Build | Vite | Fast development, ES modules, optimal bundle |
| Styling | TailwindCSS | Utility-first, responsive, dark mode support |
| Backend | NestJS | Structured, DI, modular, enterprise-ready |
| Server | Fastify | Fast HTTP, lightweight, minimal overhead |
| Database | PostgreSQL | ACID, JSON support, advanced indexing |
| Cache | Redis | Fast in-memory, pub/sub, session management |
| ORM | Prisma | Type-safe, migrations, excellent DX |
| API | tRPC | End-to-end type safety, no code generation |
| AI | OpenAI GPT-4o | SOTA reasoning, instruction following |
| Speech-to-Text | Whisper | Accurate, multilingual, offline capable |
| Text-to-Speech | ElevenLabs | Low-latency, natural, voice selection |
| Storage | AWS S3 | Scalable, durable, cost-effective |
| Infrastructure | Docker/ECS | Containerized, portable, orchestrated |

---

## References

- [NestJS Documentation](https://docs.nestjs.com/)
- [Prisma Documentation](https://www.prisma.io/docs/)
- [WebSocket Best Practices](https://socket.io/docs/)
- [OpenAI API Reference](https://platform.openai.com/docs/api-reference)
- [AWS Architecture Best Practices](https://aws.amazon.com/architecture/)
