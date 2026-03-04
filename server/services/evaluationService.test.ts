import { describe, it, expect, beforeEach, vi } from 'vitest';
import { evaluateSimulation, generateClientResponse } from './evaluationService';
import type { Scenario } from '../../drizzle/schema';
import { invokeLLM } from '../_core/llm';

/**
 * Test Suite: evaluationService.ts (Migrado a Gemini)
 * 
 * Cubre:
 * - Evaluación de simulaciones con Gemini
 * - Generación de respuestas del cliente
 * - Cálculo de puntajes y badges
 * - Manejo de errores de Gemini
 * - Entradas vacías y malformadas
 */

// Mock del servicio LLM (Gemini)
vi.mock('../_core/llm', () => ({
  invokeLLM: vi.fn(),
}));

vi.mock('./distressPromptService', () => ({
  buildClientSystemPrompt: vi.fn((prompt, profile, level) => 
    `System prompt for ${profile.name} at level ${level}`
  ),
}));

// Fixture: Escenario de prueba
const mockScenario: Scenario = {
  id: 1,
  title: 'Reporte de Fraude Bancario',
  description: 'Cliente reporta transacción sospechosa',
  category: 'fraud',
  complexity: 3,
  estimatedDuration: 15,
  systemPrompt: 'Eres un cliente preocupado por fraude',
  clientProfile: JSON.stringify({
    name: 'María García',
    age: 35,
    emotion: 'worried',
    context: 'Detected suspicious transaction',
    background: 'Regular customer since 5 years'
  }),
  evaluationCriteria: JSON.stringify({
    empathy: 25,
    clarity: 20,
    protocol: 30,
    resolution: 20,
    confidence: 5
  }),
  idealResponse: 'Verify identity, block transaction, provide support',
  tags: ['fraud', 'security', 'empathy'],
  isActive: 1,
  createdBy: 1,
  createdAt: new Date(),
  updatedAt: new Date(),
};

// Fixture: Mensajes de conversación
const mockMessages = [
  {
    role: 'agent' as const,
    content: 'Buen día, ¿en qué puedo ayudarle?'
  },
  {
    role: 'client' as const,
    content: 'Necesito reportar una transacción sospechosa en mi cuenta.'
  },
  {
    role: 'agent' as const,
    content: 'Entiendo su preocupación. Voy a verificar su identidad primero para seguridad.'
  },
  {
    role: 'client' as const,
    content: 'Claro, mi número de cédula es 123456789.'
  },
  {
    role: 'agent' as const,
    content: 'Perfecto. He verificado su identidad. Ahora voy a bloquear esa transacción de inmediato.'
  }
];

// Fixture: Respuesta exitosa de evaluación (Gemini)
const mockEvaluationResponse = {
  choices: [{
    message: {
      content: JSON.stringify({
        empathy: 92,
        clarity: 88,
        protocol: 95,
        resolution: 90,
        confidence: 85,
        feedback: 'Excelente manejo de la situación. Mostraste empatía genuina y seguiste todos los protocolos de seguridad.',
        strengths: [
          'Verificación rápida de identidad',
          'Comunicación clara y empática',
          'Resolución efectiva del problema'
        ],
        weaknesses: [
          'Podrías haber ofrecido más detalles sobre el proceso'
        ],
        recommendations: [
          'Explica más detalladamente los pasos de seguridad',
          'Ofrece opciones adicionales de protección'
        ]
      })
    }
  }]
};

// Fixture: Respuesta de cliente
const mockClientResponse = {
  choices: [{
    message: {
      content: 'Gracias por su ayuda. Me siento más tranquilo ahora.'
    }
  }]
};

describe('evaluationService (Gemini)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(invokeLLM).mockResolvedValue(mockEvaluationResponse as any);
  });

  describe('evaluateSimulation - Casos de Éxito', () => {
    it('debe evaluar una conversación correctamente y retornar estructura válida', async () => {
      const result = await evaluateSimulation(mockScenario, mockMessages);

      expect(result).toHaveProperty('overallScore');
      expect(result).toHaveProperty('categoryScores');
      expect(result).toHaveProperty('feedback');
      expect(result).toHaveProperty('strengths');
      expect(result).toHaveProperty('weaknesses');
      expect(result).toHaveProperty('recommendations');
      expect(result).toHaveProperty('pointsEarned');
      expect(result).toHaveProperty('badgesEarned');
    });

    it('debe calcular overallScore entre 0-100', async () => {
      const result = await evaluateSimulation(mockScenario, mockMessages);

      expect(result.overallScore).toBeGreaterThanOrEqual(0);
      expect(result.overallScore).toBeLessThanOrEqual(100);
      expect(Number.isInteger(result.overallScore)).toBe(true);
    });

    it('debe retornar categoryScores válidos para todas las categorías', async () => {
      const result = await evaluateSimulation(mockScenario, mockMessages);

      const categories = ['empathy', 'clarity', 'protocol', 'resolution', 'confidence'];
      for (const category of categories) {
        expect(result.categoryScores).toHaveProperty(category);
        const score = result.categoryScores[category as keyof typeof result.categoryScores];
        expect(score).toBeGreaterThanOrEqual(0);
        expect(score).toBeLessThanOrEqual(100);
        expect(Number.isInteger(score)).toBe(true);
      }
    });

    it('debe calcular pointsEarned basado en score y complejidad', async () => {
      const result = await evaluateSimulation(mockScenario, mockMessages);

      expect(result.pointsEarned).toBeGreaterThanOrEqual(0);
      expect(Number.isInteger(result.pointsEarned)).toBe(true);
    });

    it('debe otorgar badges cuando se cumplen criterios', async () => {
      const result = await evaluateSimulation(mockScenario, mockMessages);

      expect(Array.isArray(result.badgesEarned)).toBe(true);
      
      const validBadges = ['empathy_pro', 'protocol_master', 'problem_solver', 'crisis_handler', 'fast_responder', 'perfectionist'];
      result.badgesEarned.forEach(badge => {
        expect(validBadges).toContain(badge);
      });
    });

    it('debe retornar arrays no vacíos para strengths, weaknesses y recommendations', async () => {
      const result = await evaluateSimulation(mockScenario, mockMessages);

      expect(Array.isArray(result.strengths)).toBe(true);
      expect(result.strengths.length).toBeGreaterThan(0);
      expect(Array.isArray(result.weaknesses)).toBe(true);
      expect(result.weaknesses.length).toBeGreaterThan(0);
      expect(Array.isArray(result.recommendations)).toBe(true);
      expect(result.recommendations.length).toBeGreaterThan(0);
    });

    it('debe retornar feedback no vacío', async () => {
      const result = await evaluateSimulation(mockScenario, mockMessages);

      expect(typeof result.feedback).toBe('string');
      expect(result.feedback.length).toBeGreaterThan(0);
    });

    it('debe otorgar badge empathy_pro cuando empathy >= 90', async () => {
      vi.mocked(invokeLLM).mockResolvedValue({
        choices: [{
          message: {
            content: JSON.stringify({
              empathy: 92,
              clarity: 75,
              protocol: 75,
              resolution: 75,
              confidence: 75,
              feedback: 'Test',
              strengths: ['Test'],
              weaknesses: ['Test'],
              recommendations: ['Test']
            })
          }
        }]
      } as any);

      const result = await evaluateSimulation(mockScenario, mockMessages);
      expect(result.badgesEarned).toContain('empathy_pro');
    });

    it('debe otorgar badge protocol_master cuando protocol >= 95', async () => {
      vi.mocked(invokeLLM).mockResolvedValue({
        choices: [{
          message: {
            content: JSON.stringify({
              empathy: 75,
              clarity: 75,
              protocol: 96,
              resolution: 75,
              confidence: 75,
              feedback: 'Test',
              strengths: ['Test'],
              weaknesses: ['Test'],
              recommendations: ['Test']
            })
          }
        }]
      } as any);

      const result = await evaluateSimulation(mockScenario, mockMessages);
      expect(result.badgesEarned).toContain('protocol_master');
    });

    it('debe otorgar badge crisis_handler para escenarios complejos con score alto', async () => {
      const complexScenario = { ...mockScenario, complexity: 4 };
      
      vi.mocked(invokeLLM).mockResolvedValue({
        choices: [{
          message: {
            content: JSON.stringify({
              empathy: 85,
              clarity: 85,
              protocol: 85,
              resolution: 85,
              confidence: 85,
              feedback: 'Test',
              strengths: ['Test'],
              weaknesses: ['Test'],
              recommendations: ['Test']
            })
          }
        }]
      } as any);

      const result = await evaluateSimulation(complexScenario, mockMessages);
      expect(result.badgesEarned).toContain('crisis_handler');
    });

    it('debe otorgar bonus points cuando score >= 90', async () => {
      const result = await evaluateSimulation(mockScenario, mockMessages);
      
      // basePoints = 50, complexityMultiplier = 30, bonusPoints = 50 (score >= 90)
      // total = 50 + 30 + 50 = 130
      expect(result.pointsEarned).toBeGreaterThanOrEqual(100);
    });
  });

  describe('evaluateSimulation - Casos de Error', () => {
    it('debe retornar evaluación fallback cuando Gemini falla', async () => {
      vi.mocked(invokeLLM).mockRejectedValue(new Error('Gemini API Error'));

      const result = await evaluateSimulation(mockScenario, mockMessages);

      expect(result.overallScore).toBe(75);
      expect(result.categoryScores.empathy).toBe(75);
      expect(result.categoryScores.clarity).toBe(75);
      expect(result.categoryScores.protocol).toBe(75);
      expect(result.categoryScores.resolution).toBe(75);
      expect(result.categoryScores.confidence).toBe(75);
      expect(result.pointsEarned).toBe(50);
      expect(result.badgesEarned).toEqual([]);
    });

    it('debe manejar respuesta Gemini con JSON inválido', async () => {
      vi.mocked(invokeLLM).mockResolvedValue({
        choices: [{
          message: {
            content: 'Invalid JSON response'
          }
        }]
      } as any);

      const result = await evaluateSimulation(mockScenario, mockMessages);

      expect(result.overallScore).toBe(75);
    });

    it('debe manejar respuesta Gemini con campos faltantes', async () => {
      vi.mocked(invokeLLM).mockResolvedValue({
        choices: [{
          message: {
            content: JSON.stringify({
              empathy: 80,
              // Faltan otros campos
            })
          }
        }]
      } as any);

      const result = await evaluateSimulation(mockScenario, mockMessages);

      // Cuando faltan campos, se usan valores por defecto (75)
      // Con empathy=80 y otros=75, el promedio es ~76
      expect(result.overallScore).toBeGreaterThanOrEqual(70);
      expect(result.overallScore).toBeLessThanOrEqual(80);
    });

    it('debe manejar timeout de Gemini API', async () => {
      const timeoutError = new Error('API timeout');
      vi.mocked(invokeLLM).mockRejectedValue(timeoutError);

      const result = await evaluateSimulation(mockScenario, mockMessages);

      expect(result.overallScore).toBe(75);
      expect(result.feedback).toContain('evaluación automática no pudo completarse');
    });
  });

  describe('evaluateSimulation - Entradas Vacías/Malformadas', () => {
    it('debe manejar array de mensajes vacío', async () => {
      const result = await evaluateSimulation(mockScenario, []);

      expect(result).toBeDefined();
      expect(result.overallScore).toBeGreaterThanOrEqual(0);
      expect(result.overallScore).toBeLessThanOrEqual(100);
    });

    it('debe manejar mensajes con contenido vacío', async () => {
      const emptyMessages = [
        { role: 'agent' as const, content: '' },
        { role: 'client' as const, content: '' },
      ];

      const result = await evaluateSimulation(mockScenario, emptyMessages);

      expect(result).toBeDefined();
      expect(result.overallScore).toBeGreaterThanOrEqual(0);
    });

    it('debe manejar mensajes con caracteres especiales', async () => {
      const specialMessages = [
        { role: 'agent' as const, content: '¡Hola! ¿Cómo está? 😊' },
        { role: 'client' as const, content: 'Bien, gracias. ¡Excelente! 🎉' },
      ];

      const result = await evaluateSimulation(mockScenario, specialMessages);

      expect(result).toBeDefined();
      expect(result.overallScore).toBeGreaterThanOrEqual(0);
    });

    it('debe manejar mensajes muy largos', async () => {
      const longContent = 'A'.repeat(5000);
      const longMessages = [
        { role: 'agent' as const, content: longContent },
        { role: 'client' as const, content: longContent },
      ];

      const result = await evaluateSimulation(mockScenario, longMessages);

      expect(result).toBeDefined();
    });
  });

  describe('generateClientResponse - Casos de Éxito', () => {
    it('debe generar respuesta del cliente correctamente', async () => {
      vi.mocked(invokeLLM).mockResolvedValue(mockClientResponse as any);

      const response = await generateClientResponse(
        mockScenario,
        mockMessages,
        'Mensaje del agente',
        3
      );

      expect(typeof response).toBe('string');
      expect(response.length).toBeGreaterThan(0);
    });

    it('debe generar respuesta con diferentes niveles de estrés', async () => {
      vi.mocked(invokeLLM).mockResolvedValue(mockClientResponse as any);

      for (let distressLevel = 1; distressLevel <= 5; distressLevel++) {
        const response = await generateClientResponse(
          mockScenario,
          mockMessages,
          'Mensaje',
          distressLevel
        );

        expect(typeof response).toBe('string');
        expect(response.length).toBeGreaterThan(0);
      }
    });

    it('debe retornar respuesta sin espacios en blanco al inicio/final', async () => {
      vi.mocked(invokeLLM).mockResolvedValue({
        choices: [{
          message: {
            content: '  Respuesta con espacios  '
          }
        }]
      } as any);

      const response = await generateClientResponse(
        mockScenario,
        mockMessages,
        'Mensaje',
        3
      );

      expect(response).toBe('Respuesta con espacios');
    });
  });

  describe('generateClientResponse - Casos de Error', () => {
    it('debe retornar respuesta fallback cuando Gemini falla', async () => {
      vi.mocked(invokeLLM).mockRejectedValue(new Error('Gemini Error'));

      const response = await generateClientResponse(
        mockScenario,
        mockMessages,
        'Mensaje',
        3
      );

      expect(response).toBe('Entiendo. ¿Hay algo más que puedas hacer para ayudarme?');
    });

    it('debe manejar respuesta Gemini vacía', async () => {
      vi.mocked(invokeLLM).mockResolvedValue({
        choices: [{
          message: {
            content: ''
          }
        }]
      } as any);

      const response = await generateClientResponse(
        mockScenario,
        mockMessages,
        'Mensaje',
        3
      );

      expect(typeof response).toBe('string');
    });

    it('debe manejar clientProfile JSON inválido', async () => {
      const invalidScenario = {
        ...mockScenario,
        clientProfile: 'invalid json'
      };

      try {
        await generateClientResponse(
          invalidScenario,
          mockMessages,
          'Mensaje',
          3
        );
      } catch (error) {
        expect(error).toBeDefined();
      }
    });

    it('debe manejar timeout de Gemini', async () => {
      vi.mocked(invokeLLM).mockRejectedValue(new Error('Request timeout'));

      const response = await generateClientResponse(
        mockScenario,
        mockMessages,
        'Mensaje',
        3
      );

      expect(response).toBe('Entiendo. ¿Hay algo más que puedas hacer para ayudarme?');
    });
  });

  describe('generateClientResponse - Entradas Vacías/Malformadas', () => {
    it('debe manejar conversationHistory vacío', async () => {
      vi.mocked(invokeLLM).mockResolvedValue(mockClientResponse as any);

      const response = await generateClientResponse(
        mockScenario,
        [],
        'Primer mensaje del agente',
        3
      );

      expect(typeof response).toBe('string');
    });

    it('debe manejar lastAgentMessage vacío', async () => {
      vi.mocked(invokeLLM).mockResolvedValue(mockClientResponse as any);

      const response = await generateClientResponse(
        mockScenario,
        mockMessages,
        '',
        3
      );

      expect(typeof response).toBe('string');
    });

    it('debe manejar distressLevel fuera de rango', async () => {
      vi.mocked(invokeLLM).mockResolvedValue(mockClientResponse as any);

      const response1 = await generateClientResponse(
        mockScenario,
        mockMessages,
        'Mensaje',
        0
      );

      const response2 = await generateClientResponse(
        mockScenario,
        mockMessages,
        'Mensaje',
        10
      );

      expect(typeof response1).toBe('string');
      expect(typeof response2).toBe('string');
    });
  });

  describe('Integración y Flujos Completos', () => {
    it('debe completar flujo de evaluación de principio a fin', async () => {
      vi.mocked(invokeLLM).mockResolvedValue(mockEvaluationResponse as any);

      const result = await evaluateSimulation(mockScenario, mockMessages);

      expect(result.overallScore).toBeGreaterThanOrEqual(0);
      expect(result.categoryScores).toBeDefined();
      expect(result.feedback).toBeDefined();
      expect(result.strengths.length).toBeGreaterThan(0);
      expect(result.weaknesses.length).toBeGreaterThan(0);
      expect(result.recommendations.length).toBeGreaterThan(0);
      expect(result.pointsEarned).toBeGreaterThanOrEqual(0);
      expect(Array.isArray(result.badgesEarned)).toBe(true);
    });

    it('debe generar respuesta del cliente después de evaluación', async () => {
      vi.mocked(invokeLLM)
        .mockResolvedValueOnce(mockEvaluationResponse as any)
        .mockResolvedValueOnce(mockClientResponse as any);

      const evaluation = await evaluateSimulation(mockScenario, mockMessages);
      const clientResponse = await generateClientResponse(
        mockScenario,
        mockMessages,
        'Mensaje del agente',
        3
      );

      expect(evaluation.overallScore).toBeGreaterThanOrEqual(0);
      expect(typeof clientResponse).toBe('string');
      expect(clientResponse.length).toBeGreaterThan(0);
    });
  });
});
