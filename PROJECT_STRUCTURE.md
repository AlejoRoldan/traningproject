# Project Structure Reference

## 📁 Complete Directory Layout

```
contact-center-training-platform/
│
├── 📦 client/                              # React Frontend (Next.js/Vite)
│   ├── src/
│   │   ├── components/
│   │   │   ├── ui/                        # Shadcn/UI components
│   │   │   ├── TrainingDashboard.tsx
│   │   │   ├── SimulationSession.tsx
│   │   │   ├── SyncedAudioPlayer.tsx
│   │   │   └── ...
│   │   ├── pages/
│   │   │   ├── Dashboard.tsx
│   │   │   ├── Scenarios.tsx
│   │   │   ├── SessionPlayer.tsx
│   │   │   ├── Progress.tsx
│   │   │   ├── Gamification.tsx
│   │   │   └── ...
│   │   ├── hooks/
│   │   │   ├── useTrainingSession.ts
│   │   │   ├── useAudioRecorder.ts
│   │   │   ├── useWebSocket.ts
│   │   │   └── ...
│   │   ├── lib/
│   │   │   ├── api.ts                     # tRPC client setup
│   │   │   ├── ws.ts                      # WebSocket client
│   │   │   ├── auth.ts                    # Auth helpers
│   │   │   └── ...
│   │   ├── styles/
│   │   │   └── globals.css
│   │   └── App.tsx
│   ├── public/                            # Static assets
│   ├── package.json
│   └── vite.config.ts
│
├── 🔧 server/                             # NestJS Backend
│   │
│   ├── _core/                             # Framework & Bootstrap
│   │   ├── index.ts                       # App entry point
│   │   ├── app.module.ts                  # NestJS root module
│   │   ├── env.ts                         # Environment validation
│   │   ├── middleware/
│   │   │   ├── cors.middleware.ts
│   │   │   ├── auth.middleware.ts
│   │   │   └── logging.middleware.ts
│   │   ├── filters/
│   │   │   ├── global-exception.filter.ts
│   │   │   └── http-exception.filter.ts
│   │   ├── guards/
│   │   │   ├── jwt.guard.ts
│   │   │   ├── role.guard.ts
│   │   │   └── feature-flag.guard.ts
│   │   ├── interceptors/
│   │   │   ├── response.interceptor.ts
│   │   │   └── logging.interceptor.ts
│   │   ├── decorators/
│   │   │   ├── auth-user.decorator.ts
│   │   │   ├── rate-limit.decorator.ts
│   │   │   └── validate.decorator.ts
│   │   └── pipes/
│   │       └── validation.pipe.ts
│   │
│   ├── config/                            # Configuration
│   │   ├── database.config.ts
│   │   ├── redis.config.ts
│   │   ├── openai.config.ts
│   │   ├── s3.config.ts
│   │   └── security.config.ts
│   │
│   ├── database/                          # Data Layer
│   │   ├── prisma.service.ts              # Prisma client wrapper
│   │   ├── seeders/
│   │   │   ├── scenario.seeder.ts
│   │   │   ├── achievement.seeder.ts
│   │   │   └── user.seeder.ts
│   │   └── migrations/                    # Prisma migrations
│   │
│   ├── cache/                             # Redis Layer
│   │   ├── redis.service.ts
│   │   ├── cache.decorator.ts
│   │   └── cache-key.enum.ts
│   │
│   ├── services/                          # Business Logic (CRITICAL)
│   │   │
│   │   ├── core/                          # Core Orchestration
│   │   │   ├── simulation-orchestrator.service.ts   ⭐ MAIN SERVICE
│   │   │   ├── state-machine.service.ts             ⭐
│   │   │   ├── ai-client-manager.service.ts         ⭐
│   │   │   └── conversation-context.service.ts      ⭐
│   │   │
│   │   ├── ai/                            # AI Integration
│   │   │   ├── openai.service.ts          # GPT-4o
│   │   │   ├── whisper.service.ts         # STT
│   │   │   ├── tts.service.ts             # Text-to-Speech
│   │   │   ├── evaluation.service.ts      # Performance scoring
│   │   │   └── prompt-builder.service.ts
│   │   │
│   │   ├── training/                      # Training Management
│   │   │   ├── session.service.ts
│   │   │   ├── scenario.service.ts
│   │   │   ├── feedback.service.ts
│   │   │   └── marker.service.ts
│   │   │
│   │   ├── voice/                         # Voice Analysis
│   │   │   ├── voice-analysis.service.ts
│   │   │   ├── audio-processing.service.ts
│   │   │   ├── sentiment-analysis.service.ts
│   │   │   └── speaker-identification.service.ts
│   │   │
│   │   ├── user/                          # User Management
│   │   │   ├── user.service.ts
│   │   │   ├── auth.service.ts
│   │   │   ├── authorization.service.ts
│   │   │   └── profile.service.ts
│   │   │
│   │   ├── gamification/                  # Gamification Engine
│   │   │   ├── xp.service.ts
│   │   │   ├── achievement.service.ts
│   │   │   ├── leaderboard.service.ts
│   │   │   └── level.service.ts
│   │   │
│   │   ├── storage/                       # File Storage
│   │   │   ├── s3.service.ts
│   │   │   ├── audio-storage.service.ts
│   │   │   └── storage-cleaner.service.ts
│   │   │
│   │   ├── notification/                  # Notifications
│   │   │   ├── notification.service.ts
│   │   │   ├── email.service.ts
│   │   │   └── push.service.ts
│   │   │
│   │   └── analytics/                     # Analytics
│   │       ├── analytics.service.ts
│   │       ├── metrics.service.ts
│   │       └── dashboard.service.ts
│   │
│   ├── controllers/                       # HTTP Handlers
│   │   ├── auth.controller.ts
│   │   ├── user.controller.ts
│   │   ├── scenario.controller.ts
│   │   ├── session.controller.ts
│   │   ├── feedback.controller.ts
│   │   ├── achievement.controller.ts
│   │   ├── analytics.controller.ts
│   │   └── health.controller.ts
│   │
│   ├── websocket/                         # WebSocket Implementation ⭐
│   │   ├── events/
│   │   │   ├── session-events.gateway.ts  ⭐ MAIN GATEWAY
│   │   │   ├── audio-stream.gateway.ts
│   │   │   └── presence.gateway.ts
│   │   ├── dto/
│   │   │   ├── audio-chunk.dto.ts
│   │   │   ├── session-event.dto.ts
│   │   │   └── message.dto.ts
│   │   └── utils/
│   │       ├── buffer-manager.ts
│   │       └── stream-compressor.ts
│   │
│   ├── dtos/                              # Data Transfer Objects
│   │   ├── auth/
│   │   │   ├── login.dto.ts
│   │   │   ├── register.dto.ts
│   │   │   └── token.dto.ts
│   │   ├── session/
│   │   │   ├── create-session.dto.ts
│   │   │   ├── session.dto.ts
│   │   │   └── update-session.dto.ts
│   │   ├── feedback/
│   │   │   ├── feedback.dto.ts
│   │   │   └── evaluation.dto.ts
│   │   └── common/
│   │       ├── pagination.dto.ts
│   │       └── response.dto.ts
│   │
│   ├── strategies/                        # Auth Strategies
│   │   ├── jwt.strategy.ts
│   │   └── local.strategy.ts
│   │
│   ├── jobs/                              # Background Jobs
│   │   ├── audio-processing.job.ts
│   │   ├── evaluation.job.ts
│   │   ├── notification.job.ts
│   │   └── cleanup.job.ts
│   │
│   ├── utils/                             # Utilities
│   │   ├── logger.ts                      # Winston/Pino
│   │   ├── helpers.ts
│   │   ├── validators.ts
│   │   ├── decorators.ts
│   │   └── constants.ts
│   │
│   ├── tests/                             # Tests
│   │   ├── services/
│   │   ├── controllers/
│   │   ├── e2e/
│   │   └── fixtures/
│   │
│   ├── routers.ts                         # tRPC routers
│   └── README.md
│
├── 🗄️ prisma/                             # Database Schema & Migrations
│   ├── schema.prisma                      # ⭐ Complete data model
│   └── migrations/                        # Auto-generated migrations
│
├── 📚 shared/                             # Shared Code
│   ├── types/
│   │   ├── auth.ts
│   │   ├── session.ts
│   │   ├── evaluation.ts
│   │   └── ...
│   ├── utils/
│   │   ├── formatters.ts
│   │   ├── validators.ts
│   │   └── ...
│   └── constants/
│       └── ...
│
├── 📦 Docker & Compose
│   ├── docker-compose.yaml                # ⭐ Full stack orchestration
│   ├── Dockerfile.backend                 # NestJS app
│   ├── Dockerfile.frontend                # React app
│   ├── nginx.conf                         # Nginx config
│   ├── default.conf                       # Nginx site config
│   └── .dockerignore
│
├── 🔐 Configuration Files
│   ├── .env.example                       # ⭐ Environment template
│   ├── .env.development
│   ├── .env.staging
│   ├── .env.production
│   └── .gitignore
│
├── 📄 Documentation
│   ├── ARCHITECTURE.md                    # ⭐ System design
│   ├── PROJECT_STRUCTURE.md               # This file
│   ├── README.md
│   ├── DEPLOYMENT_CHECKLIST.md
│   ├── ENVIRONMENT_GUIDE.md
│   ├── ENV_REFERENCE.md
│   ├── DATABASE_SPEC.md
│   ├── GPT4O_INTEGRATION.md
│   └── docs/
│       ├── ARCHITECTURE_DETAILED.md
│       ├── API.md
│       ├── DEPLOYMENT.md
│       └── ...
│
├── 🧪 Testing & Quality
│   ├── vitest.config.ts
│   ├── tsconfig.json
│   ├── tsconfig.build.json
│   └── jest.config.js
│
├── 🛠️ Scripts
│   ├── scripts/
│   │   ├── seed.ts
│   │   ├── validate-env.mjs
│   │   ├── init-db.sql
│   │   └── ...
│   ├── seed-scenarios.mjs
│   ├── seed-response-templates.mjs
│   └── seed-more-scenarios.mjs
│
├── Build & Package
│   ├── package.json                       # Root dependencies
│   ├── pnpm-lock.yaml                     # Lock file
│   ├── vite.config.ts
│   ├── vitest.config.ts
│   ├── tsconfig.json
│   └── .prettierrc
│
└── Version Control
    ├── .git/
    └── .gitignore
```

## Key Files Reference

| File | Purpose | Status |
|------|---------|--------|
| `prisma/schema.prisma` | Complete data model | ⭐ CREATED |
| `docker-compose.yaml` | Full stack setup | ⭐ CREATED |
| `server/services/core/simulation-orchestrator.service.ts` | Main orchestration | ⭐ CREATED |
| `server/services/core/state-machine.service.ts` | Call state management | ⭐ CREATED |
| `server/services/core/ai-client-manager.service.ts` | AI personality | ⭐ CREATED |
| `server/services/core/conversation-context.service.ts` | Context management | ⭐ CREATED |
| `server/websocket/events/session-events.gateway.ts` | Real-time WebSocket | ⭐ CREATED |
| `.env.example` | Environment variables | ⭐ CREATED |
| `ARCHITECTURE.md` | System design | ⭐ CREATED |
| `server/README.md` | Backend documentation | ⭐ CREATED |
| `Dockerfile.backend` | Backend container | ⭐ CREATED |
| `Dockerfile.frontend` | Frontend container | ⭐ CREATED |
| `nginx.conf` | Nginx configuration | ⭐ CREATED |

## Development Quick Start

```bash
# 1. Setup environment
cp .env.example .env
# Edit .env with your API keys

# 2. Start infrastructure
docker-compose up -d postgres redis

# 3. Setup database
npx prisma migrate dev

# 4. Seed data
npm run seed

# 5. Start development servers
npm run dev           # Starts both frontend and backend in watch mode

# 6. Access application
# Frontend: http://localhost:3000
# Backend API: http://localhost:3001
# PgAdmin: http://localhost:5050
```

## Critical Services to Implement Next

1. **OpenAI Service** (`server/services/ai/openai.service.ts`)
   - GPT-4o integration for evaluation and response generation
   - Prompt engineering and context management

2. **Evaluation Service** (`server/services/ai/evaluation.service.ts`)
   - Multi-dimensional scoring algorithm
   - Feedback generation

3. **Voice Analysis Service** (`server/services/voice/voice-analysis.service.ts`)
   - Whisper integration for transcription
   - Tone and confidence analysis

4. **TTS Service** (`server/services/ai/tts.service.ts`)
   - ElevenLabs or VAPI integration
   - Voice selection and synthesis

5. **Audio Processing** (`server/services/voice/audio-processing.service.ts`)
   - Codec handling
   - Audio compression and optimization

## Architecture Patterns Used

1. **Dependency Injection** - NestJS native
2. **Service Layer Pattern** - Business logic isolation
3. **Strategy Pattern** - Personality-based client management
4. **State Machine Pattern** - Call flow management
5. **Observer Pattern** - Event-driven architecture
6. **Repository Pattern** - Data abstraction (Prisma)
7. **Factory Pattern** - Service instantiation

## SOLID Principles Implementation

- **S**ingle Responsibility: Each service has one reason to change
- **O**pen/Closed: Services extensible via DI, closed for modification
- **L**iskov Substitution: Services implement consistent interfaces
- **I**nterface Segregation: Small focused service contracts
- **D**ependency Inversion: Depend on abstractions, not concrete classes
