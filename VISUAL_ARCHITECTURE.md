# 🎨 Visual Architecture Diagrams

## 1. System Architecture Overview

```
┌────────────────────────────────────────────────────────────────────────┐
│                        🌐 PRESENTATION LAYER 🌐                        │
│                    React 19 + Next.js + Tailwind CSS                    │
│                                                                          │
│  ┌─────────────────┬──────────────────┬─────────────────┬────────────┐ │
│  │   Dashboard     │   Scenario UI    │  Training UI    │  Analytics  │ │
│  │   (Agent View)  │  (Selection)     │  (Recording)    │  (Reports)  │ │
│  └─────────────────┴──────────────────┴─────────────────┴────────────┘ │
│                                                                          │
│  ┌──────────────────────────────────────────────────────────────────┐  │
│  │                   Real-Time Components                            │  │
│  │  • Audio Recorder & Playback                                     │  │
│  │  • WebSocket Connection (Session Events)                         │  │
│  │  • Live Transcription Display                                    │  │
│  │  • Evaluation Results View                                       │  │
│  └──────────────────────────────────────────────────────────────────┘  │
└────────────────────┬─────────────────────────────────────────────────────┘
                     │ WebSocket (wss://) + tRPC Type-Safe API
                     │ JSON RPC with automatic TypeScript validation
                     ▼
┌────────────────────────────────────────────────────────────────────────┐
│                    🔌 API GATEWAY LAYER (NestJS) 🔌                    │
│                       Express + Fastify + tRPC                         │
│                                                                          │
│  ┌─────────────────┬──────────────────┬─────────────────┬────────────┐ │
│  │   Auth Guard    │  Rate Limiter    │  CORS Handler  │  Validator  │ │
│  │   (JWT)         │  (10-50 req/s)   │  (Domains)     │  (Zod)      │ │
│  └─────────────────┴──────────────────┴─────────────────┴────────────┘ │
│                                                                          │
│  ┌──────────────────────────────────────────────────────────────────┐  │
│  │  tRPC Router                                                      │  │
│  │  ├─ auth: { login, register, refresh, logout }                  │  │
│  │  ├─ session: { initialize, complete, status }                   │  │
│  │  ├─ scenario: { list, get, create, update }                     │  │
│  │  ├─ feedback: { create, list, get }                             │  │
│  │  └─ analytics: { dashboard, metrics, leaderboard }              │  │
│  └──────────────────────────────────────────────────────────────────┘  │
└────────────────────┬─────────────────────────────────────────────────────┘
                     │ Internal Service Calls
                     ▼
┌────────────────────────────────────────────────────────────────────────┐
│              ⚙️  CORE ORCHESTRATION LAYER (Critical) ⚙️                │
│                                                                          │
│  ┌────────────────────────────────────────────────────────────────┐    │
│  │  🎯 SimulationOrchestratorService (Master Controller)          │    │
│  │  • Session lifecycle management                                 │    │
│  │  • Real-time conversation orchestration                         │    │
│  │  • Evaluation triggering & XP award                             │    │
│  │  • State transition coordination                                │    │
│  └────────────────┬─────────────────────────────────────────────────┘   │
│                   ├─────────────────────────────────────────┐            │
│                   │                                         │            │
│  ┌─────────────┐  │  ┌──────────────────┐  ┌──────────────┐│            │
│  │  State      │◄─┘  │  AI Client       │  │ Conversation ││            │
│  │  Machine    │     │  Manager         │  │ Context      ││            │
│  │             │     │                  │  │              ││            │
│  │ INITIALIZED │     │ Personalities:   │  │ • Transcript ││            │
│  │  ↓          │     │ • Angry          │  │ • History    ││            │
│  │ WAITING     │     │ • Confused       │  │ • Metrics    ││            │
│  │  ↓          │     │ • Friendly       │  │ • Context    ││            │
│  │ SPEAKING    │     │ • Demanding      │  │   Window     ││            │
│  │  ↓          │     │                  │  │              ││            │
│  │ AI_RESP     │     │ + Localization   │  │ + Dynamic    ││            │
│  │  ↓          │     │   (Paraguay ES)  │  │   Adaptation ││            │
│  │ PLAYING     │     └──────────────────┘  └──────────────┘│            │
│  │  ↓          │                                             │            │
│  │ COMPLETED   │                                             │            │
│  └─────────────┘                                             │            │
└───────────────────────────────────────────────────────────────┘            │
                                                                             │
│  ┌─────────────────────────────────────────────────────────────────┐     │
│  │  📊 Support Services                                            │     │
│  │  ├─ Logger (Winston/Pino)  ├─ Cache (Redis) ├─ Metrics         │     │
│  │  ├─ Error Handler          └─ Health Check   └─ Tracing        │     │
│  └─────────────────────────────────────────────────────────────────┘     │
└────────────────────┬──────────────────────────────────────────────────────┘
                     │
        ┌────────────┼────────────┐
        │            │            │
        ▼            ▼            ▼
┌──────────────┐ ┌──────────────┐ ┌──────────────┐
│ AI SERVICES  │ │ VOICE SVCS   │ │ TRAINING SVC │
│              │ │              │ │              │
│ • OpenAI     │ │ • Whisper    │ │ • Session    │
│ • Prompt     │ │ • ElevenLabs │ │ • Scenario   │
│ • Eval       │ │ • VAPI       │ │ • Feedback   │
│ • Streaming  │ │ • Analysis   │ │ • Markers    │
└──────┬───────┘ └──────┬───────┘ └──────┬───────┘
       │                │                │
       └────────────────┼────────────────┘
                        │
        ┌───────────────┴────────────────┐
        │                                │
        ▼                                ▼
┌─────────────────────┐      ┌──────────────────────┐
│ AWS Services        │      │ Storage Services     │
│                     │      │                      │
│ • S3 (Audio)        │      │ • Audio Upload       │
│ • Presigned URLs    │      │ • File Management    │
│ • CloudFront (CDN)  │      │ • Cleanup            │
└─────────────────────┘      └──────────────────────┘
```

---

## 2. Real-Time Conversation Flow

```
┌──────────┐                              ┌──────────────────┐
│          │                              │                  │
│  AGENT   │                              │   AI SERVER      │
│(Browser) │                              │  (NestJS)        │
│          │                              │                  │
└────┬─────┘                              └────────┬─────────┘
     │                                             │
     │ 1. session:initialize                       │
     ├────────────────────────────────────────────>│
     │                                             │
     │                                 ┌─ Validate agent & scenario
     │                                 ├─ Create session in DB
     │                                 ├─ Setup AI client personality
     │                                 ├─ Gen greeting (GPT-4o)
     │                                 └─ Generate greeting audio (TTS)
     │                                             │
     │   2. session:initialized + greeting       │
     │<────────────────────────────────────────────┤
     │                                             │
     │  [Agent starts recording]                  │
     │  [Button: Start Conversation]              │
     │                                             │
     ├─ 3a. audio:chunk ─────────────────────────>│
     │      (WebRTC audio)                        │
     │                                  ┌─ Buffer chunks
     │                                  ├─ Transcribe (Whisper)
     │                                  ├─ Update context
     │├─ 3b. audio:chunk ────────────────>│
     ││      (more audio)                 ├─ Generate response (GPT-4o)
     │                                  ├─ Synthesize audio (TTS)
     ││  [Agent finishes speaking]        ├─ Record metrics
     ├─ 3c. audio:chunk (isLast=true) ────>│  └─ Calculate latency
     │      [Process complete audio]      │
     │                                             │
     │   4. audio:response                        │
     │<────────────────────────────────────────────┤
     │   {                                         │
     │     transcription: "Hola...",              │
     │     clientResponse: "Buenos días...",      │
     │     audioUrl: "s3://...",                  │
     │     latency: 385ms ✓                       │
     │   }                                         │
     │                                             │
     │  [Play client audio]                       │
     │  [Show transcriptions]                     │
     │                                             │
     │  [Agent responds to client]                │
     │                                             │
     ├─ 5a. audio:chunk ──────────────────────────> (repeat)
     │
     │  ... [conversation continues] ...
     │
     │  [Agent ends training]                     │
     ├─ 10. session:complete ─────────────────────>│
     │                                  ┌─ Mark COMPLETED
     │                                  ├─ Run evaluation (GPT-4o)
     │                                  ├─ Voice analysis
     │                                  ├─ Award XP & achievements
     │                                  └─ Generate feedback
     │                                             │
     │  11. session:completed                     │
     │<────────────────────────────────────────────┤
     │  {                                          │
     │    evaluationId: "...",                    │
     │    overallScore: 8.5,                      │
     │    scores: {...},                          │
     │    feedback: "Great empathy, but...",      │
     │    xpAwarded: 25                           │
     │  }                                          │
     │                                             │
     │  [Display evaluation]                      │
     │  [Show improvements]                       │
     │  [Offer next scenario]                     │
     │                                             │
```

---

## 3. Data Flow - Session Evaluation

```
┌─────────────────────────────────────────────────────────────────┐
│                  SESSION EVALUATION PIPELINE                     │
└─────────────────────────────────────────────────────────────────┘

1️⃣  SESSION COMPLETION
    └─ Mark status: COMPLETED
    └─ Timestamp: completedAt
    └─ Duration: calculated in seconds

2️⃣  CONVERSATION RETRIEVAL
    └─ Full transcript from context cache
    └─ All agent & client messages
    └─ Timestamps for each exchange

3️⃣  AI EVALUATION (GPT-4o)
    ┌─ Input:
    │  • Scenario details
    │  • Client personality profile
    │  • Complete conversation
    │  • Agent profile & role
    │
    └─ Processing:
       ├─ Empathy Analysis
       │  └─ Did agent show understanding?
       │  └─ Score: 1-10
       │
       ├─ Clarity Evaluation
       │  └─ Were responses clear & professional?
       │  └─ Score: 1-10
       │
       ├─ Protocol Compliance
       │  └─ Did agent follow script/procedures?
       │  └─ Score: 1-10
       │
       ├─ Problem Resolution
       │  └─ Did agent solve the issue?
       │  └─ Score: 1-10 (0-100% for complex problems)
       │
       ├─ Confidence Building
       │  └─ Did agent inspire confidence?
       │  └─ Score: 1-10
       │
       ├─ Strengths Identification
       │  └─ List of positive behaviors observed
       │
       ├─ Weaknesses Identification
       │  └─ List of areas for improvement
       │
       ├─ Recommendations
       │  └─ Specific, actionable feedback
       │
       └─ Keyword Analysis
          ├─ Keywords used
          └─ Keywords missed

4️⃣  VOICE ANALYSIS
    ├─ Speech Rate
    │  └─ Words per minute
    ├─ Pause Analysis
    │  ├─ Pause count
    │  └─ Average pause duration
    ├─ Clarity Assessment
    │  └─ Articulation clarity (0-100)
    ├─ Confidence Detection
    │  └─ low / medium / high
    ├─ Empathy Detection
    │  └─ Detected from tone (0-100)
    ├─ Professionalism
    │  └─ Professional tone level (0-100)
    ├─ Enthusiasm
    │  └─ low / medium / high
    └─ Tone Description
       └─ Natural language description

5️⃣  XP CALCULATION
    ├─ Base XP from scenario: scenario.estimatedXP
    │
    └─ Score Multiplier:
       ├─ Score >= 90: 1.5x bonus (Expert level)
       ├─ Score >= 75: 1.25x bonus (Good level)
       ├─ Score >= 60: 1.0x normal (Acceptable level)
       └─ Score <  60: 0.5x reduced (Needs improvement)

    └─ Final XP = baseXP × multiplier

6️⃣  ACHIEVEMENT CHECK
    ├─ Perfect Score (90+)? → "Perfect Run" badge
    ├─ First Training? → "First Step" badge
    ├─ Total Score > 500? → "Expert" level unlock
    ├─ Empathy > 9 (5+ sessions)? → "Empath" badge
    ├─ All scenarios completed? → "Master" badge
    └─ Consecutive perfects? → "Streak" badges

7️⃣  RECORD STORAGE
    ├─ SessionEvaluation record created
    │  ├─ evaluationId (primary)
    │  ├─ sessionId (foreign key)
    │  ├─ All 5 scores
    │  ├─ overallScore (calculated)
    │  ├─ strengths array
    │  ├─ weaknesses array
    │  ├─ recommendations array
    │  ├─ detailedFeedback text
    │  ├─ keywordsUsed array
    │  ├─ missedKeywords array
    │  └─ evaluatedAt timestamp
    │
    └─ VoiceAnalysis record created
       └─ Related to evaluation via evaluationId

8️⃣  USER UPDATE
    ├─ Increment experiencePoints by xpAwarded
    ├─ Recalculate level:
    │  └─ Level = floor(totalXP / 100) + 1
    ├─ Update currentLevelXP
    └─ Update lastTrainingCompletedAt

9️⃣  RESPONSE TO CLIENT
    └─ Return to agent:
       ├─ evaluationId
       ├─ overallScore
       ├─ Breakdown scores:
       │  ├─ empathy
       │  ├─ clarity
       │  ├─ protocol
       │  ├─ resolution
       │  └─ confidence
       ├─ Voice metrics (if voice analysis enabled)
       ├─ Feedback text
       ├─ Recommendations array
       ├─ xpAwarded
       ├─ New level (if leveled up)
       └─ New badges (if achievements unlocked)
```

---

## 4. Service Dependency Graph

```
                    ┌─────────────────────────────────┐
                    │  SimulationOrchestratorService  │ (Master)
                    │  (Session Lifecycle)            │
                    └────────────┬────────────────────┘
                                 │
                ┌────────────────┼────────────────┐
                │                │                │
                ▼                ▼                ▼
    ┌──────────────────────┐ ┌──────────────┐ ┌──────────────┐
    │ StateMachineService  │ │ AIClientMgr  │ │ ContextService
    │ (Call State)         │ │ (Personality)│ │ (Conversation)
    │                      │ │              │ │
    │ • INITIALIZED        │ │ • Profiles   │ │ • History
    │ • WAITING_FOR_AGENT  │ │ • Prompts    │ │ • Context Window
    │ • AGENT_SPEAKING     │ │ • Dynamic    │ │ • Metrics
    │ • AI_RESPONDING      │ │   Adjust     │ │ • Summary
    │ • PLAYING_RESPONSE   │ │              │ │
    │ • COMPLETED          │ └──────────────┘ └──────────────┘
    │ • EVALUATING         │
    │ • FAILED/CANCELLED   │
    └──────┬───────────────┘
           │
           │ Delegates to
           │
       ┌───┴────┬──────────┬─────────────┐
       │        │          │             │
       ▼        ▼          ▼             ▼
   ┌─────────────────────────────────────────────────────────┐
   │            AI SERVICES (External APIs)                  │
   │                                                          │
   │  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐  │
   │  │ OpenAI       │  │ Whisper      │  │ ElevenLabs/  │  │
   │  │ Service      │  │ Service      │  │ VAPI Service │  │
   │  │              │  │              │  │              │  │
   │  │ • GPT-4o     │  │ • Audio →    │  │ • Text →     │  │
   │  │   (Responses │  │   Transcript │  │   Speech     │  │
   │  │   & Eval)    │  │              │  │ • Voice      │  │
   │  │ • Streaming  │  │ • Confidence │  │   Selection  │  │
   │  │   Responses  │  │   Level      │  │ • Speed      │  │
   │  └──────────────┘  └──────────────┘  └──────────────┘  │
   │                                                          │
   │  ┌──────────────┐  ┌──────────────┐                     │
   │  │ Evaluation   │  │ Voice        │                     │
   │  │ Service      │  │ Analysis     │                     │
   │  │              │  │              │                     │
   │  │ • Scoring    │  │ • Metrics    │                     │
   │  │ • Feedback   │  │ • Tone       │                     │
   │  │ • Keywords   │  │ • Confidence │                     │
   │  │              │  │ • Empathy    │                     │
   │  └──────────────┘  └──────────────┘                     │
   └─────────────────────────────────────────────────────────┘
       │
       └─ Depends on
       │
   ┌──────────────────────────────────┐
   │     INFRASTRUCTURE LAYER          │
   │                                  │
   │  ┌────────────────────────────┐ │
   │  │ PrismaService (Database)   │ │
   │  │ • Session CRUD             │ │
   │  │ • Evaluation storage       │ │
   │  │ • User XP/Level updates    │ │
   │  └────────────────────────────┘ │
   │                                  │
   │  ┌────────────────────────────┐ │
   │  │ RedisService (Cache)       │ │
   │  │ • Session metadata         │ │
   │  │ • Conversation context     │ │
   │  │ • State machine state      │ │
   │  │ • Rate limiter             │ │
   │  └────────────────────────────┘ │
   │                                  │
   │  ┌────────────────────────────┐ │
   │  │ S3Service (Storage)        │ │
   │  │ • Audio file upload        │ │
   │  │ • Presigned URLs           │ │
   │  │ • Cleanup/Archival         │ │
   │  └────────────────────────────┘ │
   └──────────────────────────────────┘
```

---

## 5. Database Schema Relationships

```
┌─────────────┐
│   User      │◄─────────────┐
├─────────────┤              │ (Supervisor)
│ id          │              │
│ email       │              │
│ name        │              │ ┌────────────────┐
│ role        │ (Agent)      ├─┤ Supervisor     │
│ department  │              │ └────────────────┘
│ xp          │              │
│ level       │              │
└────────┬────┘              │
         │                   │
         │ (1:N)             │
         ▼                   │
┌────────────────────────┐   │
│ TrainingSession        │   │
├────────────────────────┤   │
│ id                     │   │
│ agentId  ◄─────────────┘
│ scenarioId ───┐
│ status       │
│ startedAt    │
│ completedAt  │
│ transcription│
│ audioUrl     │
│ audioSize    │
└────┬─────────┘
     │ (1:1)
     ▼
┌──────────────────────┐         ┌──────────────────┐
│ SessionEvaluation    │─────────►│ VoiceAnalysis    │
├──────────────────────┤         ├──────────────────┤
│ id                   │         │ id               │
│ sessionId (FK)       │         │ evaluationId(FK) │
│ empathyScore         │         │ speechRate       │
│ clarityScore         │         │ pauseCount       │
│ protocolScore        │         │ clarityScore     │
│ resolutionScore      │         │ confidenceLevel  │
│ confidenceScore      │         │ empathyDetection │
│ overallScore         │         │ professionalism  │
│ strengths[]          │         │ enthusiasm       │
│ weaknesses[]         │         │ voiceTone        │
│ recommendations[]    │         │ recommendations  │
│ keywordsUsed[]       │         └──────────────────┘
│ missedKeywords[]     │
└──────────────────────┘

┌──────────────┐         ┌────────────────────┐
│ Scenario     │◄────────┤ TrainingSession    │
├──────────────┤         │ (1:N)              │
│ id           │         └────────────────────┘
│ title        │
│ description  │         ┌────────────────────┐
│ category     │         │ SessionMarker      │
│ difficulty   │◄────────┤ (Supervisor Marks) │
│ clientName   │         │ (1:N)              │
│ personality  │         └────────────────────┘
│ context      │
│ language     │         ┌────────────────────┐
└──────────────┘         │ SessionFeedback    │
                         │ (1:N)              │
                         └────────────────────┘

┌──────────────────┐
│ Achievement      │
├──────────────────┤
│ id               │
│ name             │
│ description      │
│ badge            │◄──┐
│ requiredXP       │   │ (M:N)
│ requiredScore    │   │
│ rarity           │   │
└────────┬─────────┘   │
         │             │
         └─────┬───────┘
               │
         ┌─────▼──────────────┐
         │ UserAchievement    │
         ├────────────────────┤
         │ userId             │
         │ achievementId      │
         │ unlockedAt         │
         └────────────────────┘
         (Links User to Achievement)
```

---

## 6. Call State Machine Diagram

```
                          ┌──────────────────┐
                          │  INITIALIZED     │
                          │  (Session Setup) │
                          └────────┬─────────┘
                                   │
                                   ▼
                    ┌──────────────────────────────┐
                    │  WAITING_FOR_AGENT           │
                    │  (Ready for input)           │◄──────┐
                    └────────┬───────────────────────┘      │
                             │                              │
                             ▼                              │
                    ┌──────────────────┐                     │
                    │ AGENT_SPEAKING   │                     │
                    │ (Recording audio)│                     │
                    └────────┬─────────┘                     │
                             │                              │
                             ▼                              │
                    ┌──────────────────┐                     │
                    │ AI_RESPONDING    │                     │
                    │ (Processing)     │                     │
                    └────────┬─────────┘                     │
                             │                              │
                             ▼                              │
                    ┌──────────────────┐                     │
                    │ PLAYING_RESPONSE │                     │
                    │ (Client speaks)  │                     │
                    └────────┬─────────┘                     │
                             │                              │
                             ├──────────────────────────────┘
                             │
                             ▼
                    ┌──────────────────┐
                    │  COMPLETED       │
                    │  (End of loop)   │
                    └────────┬─────────┘
                             │
                             ▼
                    ┌──────────────────┐
                    │  EVALUATING      │
                    │  (Assessment)    │
                    └────────┬─────────┘
                             │
                             ▼
                    ┌──────────────────┐
                    │  FINAL (Done)    │
                    └──────────────────┘

Special Transitions (Allowed from Any State):
├─ → PAUSED (User pause button)
├─ → FAILED (Error occurred)
└─ → CANCELLED (User cancelled)
```

---

## 7. Component Interaction Diagram

```
Frontend (React)
├─ SessionRecorder Component
│  └─ Audio Context API → WebRTC MediaRecorder
│  └─ WebSocket Client (socket.io)
│
├─ SessionPlayer Component
│  └─ HTML5 <audio> element
│  └─ Synced transcript display
│
└─ EvaluationDisplay Component
   └─ Charts for scoring
   └─ Feedback rendering

         │
         │ socket.io/WebSocket
         │
Backend (NestJS)
├─ SessionEventsGateway
│  └─ @SubscribeMessage handlers
│  └─ Socket connection tracking
│
├─ SessionOrchestratorService
│  ├─ initializeSession()
│  ├─ processAgentSpeech()
│  └─ completeSession()
│
├─ Supporting Services
│  ├─ OpenAI Service → GPT-4o API
│  ├─ Whisper Service → Transcription
│  ├─ TTS Service → Speech synthesis
│  └─ Evaluation Service → Scoring
│
└─ Data Layer
   ├─ Prisma (PostgreSQL)
   ├─ Redis Cache
   └─ S3 Storage
```

---

This visual architecture provides a complete picture of how all components interact to deliver the training platform experience.
