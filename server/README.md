# Backend Architecture - Contact Center Training Platform

## Overview
Enterprise-grade NestJS backend with Fastify, PostgreSQL, Redis, and OpenAI integration.

## Directory Structure

```
server/
├── _core/                          # Core framework & bootstrap
│   ├── index.ts                   # Application entry point
│   ├── app.module.ts              # NestJS main module
│   ├── middleware/                # Express/Fastify middleware
│   │   ├── cors.middleware.ts
│   │   ├── auth.middleware.ts
│   │   └── logging.middleware.ts
│   ├── filters/                   # Exception filters
│   │   ├── global-exception.filter.ts
│   │   └── http-exception.filter.ts
│   ├── guards/                    # Authentication/Authorization guards
│   │   ├── jwt.guard.ts
│   │   ├── role.guard.ts
│   │   └── feature-flag.guard.ts
│   ├── interceptors/              # Response/Request interceptors
│   │   ├── response.interceptor.ts
│   │   └── logging.interceptor.ts
│   ├── decorators/                # Custom decorators
│   │   ├── auth-user.decorator.ts
│   │   ├── rate-limit.decorator.ts
│   │   └── validate.decorator.ts
│   ├── pipes/                     # Request validation pipes
│   │   └── validation.pipe.ts
│   └── env.ts                     # Environment configuration
│
├── config/                        # Configuration modules
│   ├── database.config.ts         # PostgreSQL & Prisma setup
│   ├── redis.config.ts            # Redis client configuration
│   ├── openai.config.ts           # OpenAI API configuration
│   ├── s3.config.ts               # AWS S3 configuration
│   └── security.config.ts         # Security settings (JWT, CORS, etc)
│
├── database/                      # Database layer (Prisma)
│   ├── prisma.service.ts          # Prisma client wrapper
│   ├── seeders/                   # Data seeders
│   │   ├── scenario.seeder.ts
│   │   ├── achievement.seeder.ts
│   │   └── user.seeder.ts
│   └── migrations/                # Prisma migrations (auto-generated)
│
├── cache/                         # Redis cache layer
│   ├── redis.service.ts           # Redis wrapper
│   ├── cache.decorator.ts         # Caching decorator
│   └── cache-key.enum.ts          # Cache key constants
│
├── services/                      # Business logic services
│   ├── core/                      # Core orchestration services
│   │   ├── simulation-orchestrator.service.ts    # Main orchestration
│   │   ├── state-machine.service.ts              # Call state management
│   │   ├── ai-client-manager.service.ts          # AI client personality
│   │   └── conversation-context.service.ts       # Context management
│   │
│   ├── ai/                        # AI & ML services
│   │   ├── openai.service.ts      # OpenAI GPT-4o integration
│   │   ├── whisper.service.ts     # Speech-to-text (Whisper)
│   │   ├── tts.service.ts         # Text-to-speech (ElevenLabs/VAPI)
│   │   ├── evaluation.service.ts  # Performance evaluation engine
│   │   └── prompt-builder.service.ts # Prompt engineering
│   │
│   ├── training/                  # Training session management
│   │   ├── session.service.ts     # Session CRUD & lifecycle
│   │   ├── scenario.service.ts    # Scenario management
│   │   ├── feedback.service.ts    # Feedback generation
│   │   └── marker.service.ts      # Session markers
│   │
│   ├── voice/                     # Voice analysis & processing
│   │   ├── voice-analysis.service.ts   # Voice metrics extraction
│   │   ├── audio-processing.service.ts # Audio codec handling
│   │   ├── sentiment-analysis.service.ts
│   │   └── speaker-identification.service.ts
│   │
│   ├── user/                      # User management
│   │   ├── user.service.ts        # User CRUD
│   │   ├── auth.service.ts        # Authentication & JWT
│   │   ├── authorization.service.ts # Role-based access
│   │   └── profile.service.ts     # User profile
│   │
│   ├── gamification/              # Gamification engine
│   │   ├── xp.service.ts          # Experience points
│   │   ├── achievement.service.ts # Achievements/badges
│   │   ├── leaderboard.service.ts # Ranking system
│   │   └── level.service.ts       # Level progression
│   │
│   ├── storage/                   # File storage
│   │   ├── s3.service.ts          # AWS S3 operations
│   │   ├── audio-storage.service.ts # Audio file handling
│   │   └── storage-cleaner.service.ts
│   │
│   ├── notification/              # Notification system
│   │   ├── notification.service.ts
│   │   ├── email.service.ts
│   │   └── push.service.ts
│   │
│   └── analytics/                 # Analytics & metrics
│       ├── analytics.service.ts
│       ├── metrics.service.ts
│       └── dashboard.service.ts
│
├── controllers/                   # HTTP request handlers
│   ├── auth.controller.ts
│   ├── user.controller.ts
│   ├── scenario.controller.ts
│   ├── session.controller.ts
│   ├── feedback.controller.ts
│   ├── achievement.controller.ts
│   ├── analytics.controller.ts
│   └── health.controller.ts
│
├── websocket/                     # WebSocket implementation (CRITICAL)
│   ├── events/
│   │   ├── session-events.gateway.ts    # Main WebSocket gateway
│   │   ├── audio-stream.gateway.ts      # Real-time audio streaming
│   │   └── presence.gateway.ts          # User presence tracking
│   ├── dto/
│   │   ├── audio-chunk.dto.ts
│   │   ├── session-event.dto.ts
│   │   └── message.dto.ts
│   └── utils/
│       ├── buffer-manager.ts       # Audio buffer handling
│       └── stream-compressor.ts    # Audio compression
│
├── dtos/                          # Data Transfer Objects
│   ├── auth/
│   │   ├── login.dto.ts
│   │   ├── register.dto.ts
│   │   └── token.dto.ts
│   ├── session/
│   │   ├── create-session.dto.ts
│   │   ├── session.dto.ts
│   │   └── update-session.dto.ts
│   ├── feedback/
│   │   ├── feedback.dto.ts
│   │   └── evaluation.dto.ts
│   └── common/
│       ├── pagination.dto.ts
│       └── response.dto.ts
│
├── entities/                      # TypeORM entities (if using)
│   └── ...
│
├── utils/                         # Utility functions
│   ├── logger.ts                  # Winston/Pino logger
│   ├── helpers.ts                 # Common helpers
│   ├── validators.ts              # Custom validators
│   ├── decorators.ts              # Utility decorators
│   └── constants.ts               # Constants
│
├── strategies/                    # Authentication strategies
│   ├── jwt.strategy.ts
│   └── local.strategy.ts
│
├── jobs/                          # Background jobs (Bull Queue)
│   ├── audio-processing.job.ts
│   ├── evaluation.job.ts
│   ├── notification.job.ts
│   └── cleanup.job.ts
│
├── tests/                         # Tests (parallel to implementation)
│   ├── services/
│   ├── controllers/
│   ├── e2e/
│   └── fixtures/
│
└── README.md                      # This file
```

## Key Architectural Patterns

### 1. **Core Orchestration (Simulation Orchestrator)**
The `SimulationOrchestratorService` manages the entire training session flow:
- State transitions (initialization → conversation → evaluation → feedback)
- AI client personality management
- Context preservation
- Latency optimization (<500ms target)

### 2. **State Machine Pattern**
`StateMachineService` implements explicit state management:
```
INITIALIZED → WAITING_FOR_AGENT → AGENT_SPEAKING →
AI_RESPONDING → PLAYING_RESPONSE → (loop) → COMPLETED → EVALUATING
```

### 3. **WebSocket Real-Time Streaming**
`SessionEventsGateway` handles:
- Audio stream ingestion (WebRTC)
- Real-time transcription with Whisper
- Synchronous AI response generation
- Low-latency audio playback

### 4. **Strategy Pattern for Evaluations**
Different evaluation strategies for different scenarios:
- Empathy evaluation
- Problem resolution evaluation
- Script compliance evaluation

### 5. **Dependency Injection (NestJS)**
All services are injected, enabling:
- Easy testing with mocks
- Loose coupling
- Service reusability

## Environment Variables

See `.env.example` for complete list. Key variables:

```env
# Database
DATABASE_URL=postgresql://...
DB_SHADOW_DATABASE_URL=postgresql://...

# Redis
REDIS_URL=redis://:password@localhost:6379/0

# OpenAI
OPENAI_API_KEY=sk-...
OPENAI_ORGANIZATION_ID=...

# External Services
ELEVENLABS_API_KEY=...
VAPI_API_KEY=...

# AWS S3
AWS_REGION=us-east-1
AWS_ACCESS_KEY_ID=...
AWS_SECRET_ACCESS_KEY=...
AWS_S3_BUCKET=training-platform-audio

# Security
JWT_SECRET=...
CORS_ORIGIN=http://localhost:3000

# Logging
LOG_LEVEL=debug
LOG_FORMAT=json
```

## Installation & Development

### Prerequisites
- Node.js 22.x
- PostgreSQL 16+
- Redis 7+
- Docker (recommended)

### Setup

```bash
# Install dependencies
pnpm install

# Generate Prisma client
npx prisma generate

# Run migrations
npx prisma migrate dev

# Seed database
npm run seed

# Start development server
npm run dev
```

## Testing

```bash
# Unit tests
npm run test

# Integration tests
npm run test:integration

# E2E tests
npm run test:e2e

# Coverage
npm run test:coverage
```

## Performance Considerations

### Latency Optimization (<500ms target)
1. **Database**: Indexed queries, read replicas for analytics
2. **Redis**: Session caching, rate limiter state
3. **AI**: Streaming responses, parallel processing
4. **Audio**: WebRTC, efficient codec selection
5. **WebSocket**: Binary frames, compression

### Scalability
- Horizontal: Multiple API instances behind load balancer
- Database: PostgreSQL with read replicas
- Cache: Redis cluster
- Queue: Bull Queue for async jobs
- Storage: S3 with CloudFront CDN

## Security Checklist

- [ ] HTTPS/TLS enforced
- [ ] CSRF tokens validated
- [ ] Rate limiting enabled
- [ ] JWT secrets rotated regularly
- [ ] S3 bucket policies restricted
- [ ] Database connections use SSL
- [ ] Environment variables never committed
- [ ] Input validation on all endpoints
- [ ] SQL injection prevention (Prisma ORM)
- [ ] XSS prevention in responses

## Deployment

See `DEPLOYMENT.md` for detailed deployment instructions.
