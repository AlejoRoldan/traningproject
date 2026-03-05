import { Module } from '@nestjs/common';
import { SessionController } from '../controllers/session.controller';
import { SessionService } from '../services/training/session.service';
import { PrismaService } from '../database/prisma.service';
import { RedisService } from '../cache/redis.service';
import { SimulationOrchestratorService } from '../services/core/simulation-orchestrator.service';
import { StateMachineService } from '../services/core/state-machine.service';
import { AIClientManagerService } from '../services/core/ai-client-manager.service';
import { ConversationContextService } from '../services/core/conversation-context.service';
import { OpenAIService } from '../services/ai/openai.service';
import { WhisperService } from '../services/ai/whisper.service';
import { TTSService } from '../services/ai/tts.service';
import { EvaluationService } from '../services/ai/evaluation.service';
import { VoiceAnalysisService } from '../services/voice/voice-analysis.service';
import { PromptBuilderService } from '../services/ai/prompt-builder.service';
import { JwtGuard } from '../_core/guards/jwt.guard';
import { SessionEventsGateway } from '../gateways/session-events.gateway';

/**
 * Session Module
 *
 * Configures training session management, orchestration, and real-time WebSocket events
 */
@Module({
  controllers: [SessionController],
  providers: [
    SessionService,
    SimulationOrchestratorService,
    StateMachineService,
    AIClientManagerService,
    ConversationContextService,
    OpenAIService,
    WhisperService,
    TTSService,
    EvaluationService,
    VoiceAnalysisService,
    PromptBuilderService,
    PrismaService,
    RedisService,
    JwtGuard,
    SessionEventsGateway,
  ],
  exports: [
    SessionService,
    SimulationOrchestratorService,
    ConversationContextService,
  ],
})
export class SessionModule {}
