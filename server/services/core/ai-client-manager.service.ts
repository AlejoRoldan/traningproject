import { Injectable, Logger } from '@nestjs/common';
import { Scenario, ClientLanguage } from '@prisma/client';

/**
 * AI Client Manager Service
 *
 * Manages the personality, behavior, and characteristics of the AI client
 * in simulations. Each client has:
 * - Personality type (angry, confused, friendly, demanding)
 * - Voice characteristics (gender, accent, speed)
 * - Behavioral patterns
 * - Language preferences (Paraguay Spanish with Guaraní influence)
 *
 * Strategy Pattern: Different personalities implement different behaviors
 */
@Injectable()
export class AIClientManagerService {
  private readonly logger = new Logger(AIClientManagerService.name);

  /**
   * Personality definitions with behavioral traits
   */
  private readonly personalityProfiles: Record<string, any> = {
    angry: {
      name: 'Angry Customer',
      description:
        'Cliente enojado, exigente, tono elevado, respuestas cortas',
      tone: 'aggressive',
      voiceGender: 'male',
      speechRate: 1.2, // Faster than normal
      characteristics: {
        interruptRate: 0.4, // 40% chance to interrupt
        sarcasmLevel: 0.7, // High sarcasm
        patienceLevel: 0.2, // Low patience
        demandingLevel: 0.9, // Very demanding
      },
      keywords: [
        'inaceptable',
        'insatisfecho',
        'ahora',
        'quiero hablar',
        'gerente',
      ],
      systemPromptAddition: `
      Eres un cliente muy enojado y exigente. Hablas con tono elevado y con prisa.
      Respuestas cortas y directas. Interrumpes frecuentemente. No tienes paciencia.
      Demandas resultados inmediatos. Considera usar expresiones paraguayas como
      "che, pytyvõ" (oye, por favor) con tono de frustración.
      `,
    },

    confused: {
      name: 'Confused Customer',
      description:
        'Cliente confundido, necesita explicaciones claras, lento en comprensión',
      tone: 'uncertain',
      voiceGender: 'female',
      speechRate: 0.9, // Slower than normal
      characteristics: {
        interruptRate: 0.2,
        clarityNeeded: 0.9, // Needs clear explanations
        comprehensionLevel: 0.3, // Low comprehension
        questionRate: 0.8, // Many questions
      },
      keywords: [
        'no entiendo',
        '¿qué?',
        '¿cómo?',
        '¿por qué?',
        'explicame',
      ],
      systemPromptAddition: `
      Eres un cliente confundido que no entiende fácilmente. Haces muchas preguntas.
      Necesitas explicaciones claras y detalladas. Hablas lentamente, dudando.
      Frequentemente dices "no entiendo bien" y "puede explicar nuevamente".
      Usa expresiones como "nde, osea" (no, osea) para expresar confusión.
      `,
    },

    friendly: {
      name: 'Friendly Customer',
      description:
        'Cliente amable, cooperativo, tono cálido, paciente, buen oyente',
      tone: 'warm',
      voiceGender: 'female',
      speechRate: 1.0, // Normal
      characteristics: {
        patience: 0.95, // Very patient
        cooperationLevel: 0.9, // Cooperative
        friendlinessLevel: 0.95, // Very friendly
        interruptRate: 0.05, // Rarely interrupts
      },
      keywords: [
        'claro',
        'gracias',
        'entiendo',
        'está bien',
        'no te preocupes',
      ],
      systemPromptAddition: `
      Eres un cliente muy amable y cooperativo. Tienes una actitud positiva.
      Escuchas atentamente, eres paciente y comprensivo. Hablas con calidez.
      Agradeces el servicio. Expresas confianza en el agente.
      Usa expresiones cálidas como "che, gracias niko" (oye, gracias mucho).
      `,
    },

    demanding: {
      name: 'Demanding Customer',
      description:
        'Cliente exigente, requiere soluciones rápidas, profesional pero implacable',
      tone: 'stern',
      voiceGender: 'male',
      speechRate: 1.15,
      characteristics: {
        professionalismLevel: 0.95,
        demandingLevel: 0.95,
        expectations: 'very_high',
        toleranceLevel: 0.3, // Low tolerance
      },
      keywords: [
        'necesito',
        'inmediato',
        'eficiencia',
        'solución',
        'competencia',
      ],
      systemPromptAddition: `
      Eres un cliente ejecutivo muy exigente. Valoras la eficiencia y competencia.
      Hablas profesionalmente pero con autoridad. Tienes altas expectativas.
      Demandas soluciones inmediatas y claras. No aceptas excusas.
      Eres directo: "Necesito que se resuelva ahora, sin demoras".
      `,
    },
  };

  /**
   * Create a client personality for a scenario
   *
   * Strategy Pattern: Select and configure personality based on scenario
   *
   * @param scenario The training scenario
   * @returns Client profile with all characteristics
   */
  async createClientPersonality(
    scenario: Scenario,
  ): Promise<ClientProfile> {
    this.logger.debug(
      `Creating client personality for scenario: ${scenario.id}`,
    );

    const personality = this.getPersonalityProfile(scenario.clientPersonality);

    const clientProfile: ClientProfile = {
      id: this.generateClientId(),
      name: scenario.clientName,
      personality: scenario.clientPersonality,
      tone: personality.tone,
      voiceGender: personality.voiceGender,
      speechRate: personality.speechRate,
      language: scenario.clientLanguage,
      context: scenario.clientContext,
      initialPrompt: scenario.initialPrompt,
      characteristics: personality.characteristics,
      keywords: personality.keywords,
      systemPromptAddition: personality.systemPromptAddition,
      expectedFlow: scenario.expectedFlow || undefined,
    };

    return clientProfile;
  }

  /**
   * Get personality profile by name
   */
  private getPersonalityProfile(
    personalityName: string,
  ): any {
    const personality =
      this.personalityProfiles[personalityName.toLowerCase()];
    if (!personality) {
      this.logger.warn(
        `Unknown personality: ${personalityName}, using friendly`,
      );
      return this.personalityProfiles['friendly'];
    }
    return personality;
  }

  /**
   * Generate system prompt for GPT-4o
   *
   * Incorporates:
   * - Personality characteristics
   * - Scenario context
   * - Language preferences (Paraguay Spanish + Guaraní)
   * - Behavioral expectations
   *
   * @param clientProfile Client profile
   * @param scenario Scenario details
   * @returns System prompt for GPT-4o
   */
  buildSystemPrompt(
    clientProfile: ClientProfile,
    scenario: any,
  ): string {
    return `
    Eres un cliente de un banco en Paraguay. Aquí están tus características:

    NOMBRE: ${clientProfile.name}
    PERSONALIDAD: ${clientProfile.personality.toUpperCase()}
    CONTEXTO: ${clientProfile.context}

    TONO DE VOZ: ${clientProfile.tone}
    VELOCIDAD DE HABLA: ${clientProfile.speechRate}

    INSTRUCCIONES DE COMPORTAMIENTO:
    ${clientProfile.systemPromptAddition}

    INDICACIONES IMPORTANTES:
    1. Responde de manera natural y conversacional
    2. Usa expresiones paraguayas reales para más realismo
    3. Mantén tu personalidad consistente durante toda la conversación
    4. Si el agente te propone una solución, reacciona según tu tipo de personalidad
    5. Complica la conversación si es apropiado para el escenario
    6. Valida las propuestas de solución con tu nivel de exigencia

    PALABRAS CLAVE A USAR: ${clientProfile.keywords.join(', ')}

    CONTEXTO DE LA SITUACIÓN:
    ${scenario.description}

    OBJETIVO: Evaluar la capacidad del agente para manejar tu tipo de cliente específico.
    El agente debe demostrar empatía, conocimiento del producto, y habilidades de resolución de problemas.
    `;
  }

  /**
   * Adjust personality based on agent's performance
   *
   * Real-time adaptation:
   * - If agent is struggling: friendly client becomes more patient
   * - If agent is performing well: demanding client becomes more challenging
   * - Maintains fair evaluation while staying in character
   */
  async adjustPersonalityBasedOnPerformance(
    clientProfile: ClientProfile,
    performanceMetrics: any,
  ): Promise<ClientProfile> {
    // This would implement dynamic difficulty adjustment
    // For now, return unchanged
    return clientProfile;
  }

  /**
   * Generate a response directive for the AI client
   *
   * Returns guidance for how the client should respond to agent input
   */
  generateResponseDirective(
    clientProfile: ClientProfile,
    agentInput: string,
  ): string {
    const personality = this.personalityProfiles[clientProfile.personality];

    // Build directive based on personality
    const directive = {
      considerInterrupting:
        Math.random() < personality.characteristics.interruptRate,
      showFrustration:
        clientProfile.personality === 'angry' ||
        clientProfile.personality === 'demanding',
      askForClarification:
        clientProfile.personality === 'confused',
      expressThankfulness:
        clientProfile.personality === 'friendly',
    };

    return JSON.stringify(directive);
  }

  private generateClientId(): string {
    return `client_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }
}

// ============================================================================
// TYPES
// ============================================================================

export interface ClientProfile {
  id: string;
  name: string;
  personality: string;
  tone: string;
  voiceGender: 'male' | 'female';
  speechRate: number;
  language: ClientLanguage;
  context: string;
  initialPrompt: string;
  characteristics: Record<string, any>;
  keywords: string[];
  systemPromptAddition: string;
  expectedFlow?: string;
}
