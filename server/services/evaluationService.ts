import { invokeLLM } from '../_core/llm';
import { buildClientSystemPrompt } from './distressPromptService';
import type { Scenario } from '../../drizzle/schema';
import { evaluationLogger } from '../_core/logger';

interface Message {
  role: "agent" | "client" | "system";
  content: string;
}

interface EvaluationResult {
  overallScore: number;
  categoryScores: {
    empathy: number;
    clarity: number;
    protocol: number;
    resolution: number;
    confidence: number;
  };
  feedback: string;
  strengths: string[];
  weaknesses: string[];
  recommendations: string[];
  pointsEarned: number;
  badgesEarned: string[];
}

/**
 * Generar respuesta del cliente con nivel de estrés
 */
export async function generateClientResponseWithDistress(
  scenario: Scenario,
  conversationHistory: Message[],
  lastAgentMessage: string,
  distressLevel: number
): Promise<string> {
  return generateClientResponse(scenario, conversationHistory, lastAgentMessage, distressLevel);
}

/**
 * Evaluar simulación usando Gemini
 */
export async function evaluateSimulation(
  scenario: Scenario,
  messages: Message[]
): Promise<EvaluationResult> {
  
  const agentMessages = messages.filter(m => m.role === "agent");
  const conversationTranscript = messages
    .map(m => `[${m.role.toUpperCase()}]: ${m.content}`)
    .join("\n");

  const evaluationCriteria = JSON.parse(scenario.evaluationCriteria);
  
  const systemPrompt = `Eres un evaluador experto de desempeño en contact centers bancarios. Tu tarea es evaluar la calidad de la atención al cliente de un agente bancario durante una simulación de entrenamiento.

CONTEXTO DEL ESCENARIO:
- Título: ${scenario.title}
- Categoría: ${scenario.category}
- Nivel de complejidad: ${scenario.complexity}/5
- Descripción: ${scenario.description}
- Respuesta ideal esperada: ${scenario.idealResponse || "N/A"}

CRITERIOS DE EVALUACIÓN:
Debes evaluar al agente en las siguientes categorías (escala 0-100):

1. **Empatía** (${evaluationCriteria.empathy}% del peso total): 
   - Capacidad de conectar emocionalmente con el cliente
   - Uso de lenguaje empático y comprensivo
   - Reconocimiento de las emociones del cliente

2. **Claridad** (${evaluationCriteria.clarity}% del peso total):
   - Comunicación clara y concisa
   - Explicaciones fáciles de entender
   - Evita jerga técnica innecesaria

3. **Protocolo** (${evaluationCriteria.protocol}% del peso total):
   - Seguimiento de procedimientos bancarios
   - Verificación de identidad cuando corresponde
   - Cumplimiento de normativas y políticas

4. **Resolución** (${evaluationCriteria.resolution}% del peso total):
   - Efectividad en resolver el problema del cliente
   - Ofrece soluciones concretas
   - Cierre adecuado de la conversación

5. **Confianza** (20% del peso total):
   - Seguridad en las respuestas
   - Profesionalismo
   - Manejo de objeciones

INSTRUCCIONES:
1. Analiza cuidadosamente cada mensaje del agente
2. Asigna una puntuación de 0-100 para cada categoría
3. Calcula el promedio ponderado para la puntuación general
4. Identifica 2-4 fortalezas específicas con ejemplos
5. Identifica 2-4 debilidades específicas con ejemplos
6. Proporciona 2-4 recomendaciones accionables para mejorar
7. Escribe un feedback constructivo y motivador (2-3 párrafos)

IMPORTANTE:
- Sé justo pero constructivo
- Proporciona ejemplos específicos de la conversación
- Las recomendaciones deben ser prácticas y aplicables
- El feedback debe motivar al agente a mejorar

Responde ÚNICAMENTE con un objeto JSON válido con la siguiente estructura:
{
  "empathy": <número 0-100>,
  "clarity": <número 0-100>,
  "protocol": <número 0-100>,
  "resolution": <número 0-100>,
  "confidence": <número 0-100>,
  "feedback": "<texto del feedback>",
  "strengths": ["<fortaleza 1>", "<fortaleza 2>", ...],
  "weaknesses": ["<debilidad 1>", "<debilidad 2>", ...],
  "recommendations": ["<recomendación 1>", "<recomendación 2>", ...]
}`;

  const userPrompt = `TRANSCRIPCIÓN DE LA CONVERSACIÓN:

${conversationTranscript}

---

Evalúa el desempeño del agente basándote en la transcripción anterior y los criterios establecidos.`;

  try {
    // Usar Gemini para evaluación estructurada
    const response = await invokeLLM({
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userPrompt }
      ],
      response_format: {
        type: "json_schema",
        json_schema: {
          name: "evaluation_result",
          strict: true,
          schema: {
            type: "object",
            properties: {
              empathy: { type: "number" },
              clarity: { type: "number" },
              protocol: { type: "number" },
              resolution: { type: "number" },
              confidence: { type: "number" },
              feedback: { type: "string" },
              strengths: {
                type: "array",
                items: { type: "string" }
              },
              weaknesses: {
                type: "array",
                items: { type: "string" }
              },
              recommendations: {
                type: "array",
                items: { type: "string" }
              }
            },
            required: ["empathy", "clarity", "protocol", "resolution", "confidence", "feedback", "strengths", "weaknesses", "recommendations"],
            additionalProperties: false
          }
        }
      }
    });

    const content = response.choices[0].message.content;
    const evaluationData = JSON.parse(typeof content === 'string' ? content : JSON.stringify(content));

    // Calculate weighted overall score
    const empathyWeight = Number(evaluationCriteria.empathy) || 20;
    const clarityWeight = Number(evaluationCriteria.clarity) || 20;
    const protocolWeight = Number(evaluationCriteria.protocol) || 20;
    const resolutionWeight = Number(evaluationCriteria.resolution) || 20;
    const confidenceWeight = 20;

    const totalWeight = empathyWeight + clarityWeight + protocolWeight + resolutionWeight + confidenceWeight;
    const weights = {
      empathy: empathyWeight / totalWeight,
      clarity: clarityWeight / totalWeight,
      protocol: protocolWeight / totalWeight,
      resolution: resolutionWeight / totalWeight,
      confidence: confidenceWeight / totalWeight
    };

    const empathy = Number(evaluationData.empathy) || 75;
    const clarity = Number(evaluationData.clarity) || 75;
    const protocol = Number(evaluationData.protocol) || 75;
    const resolution = Number(evaluationData.resolution) || 75;
    const confidence = Number(evaluationData.confidence) || 75;

    const rawOverallScore = 
      empathy * weights.empathy +
      clarity * weights.clarity +
      protocol * weights.protocol +
      resolution * weights.resolution +
      confidence * weights.confidence;

    const overallScore = Number.isFinite(rawOverallScore) ? Math.round(rawOverallScore) : 75;

    // Calculate points earned
    const complexity = Number(scenario.complexity) || 1;
    const basePoints = 50;
    const complexityMultiplier = complexity * 10;
    const bonusPoints = overallScore >= 90 ? 50 : overallScore >= 80 ? 25 : overallScore >= 70 ? 10 : 0;
    const pointsEarned = Number.isFinite(basePoints + complexityMultiplier + bonusPoints) ? basePoints + complexityMultiplier + bonusPoints : 0;

    // Determine badges earned
    const badgesEarned: string[] = [];
    
    if (complexity >= 3 && overallScore >= 85) {
      badgesEarned.push("crisis_handler");
    }
    
    if (overallScore >= 95) {
      badgesEarned.push("perfectionist");
    }
    
    if (overallScore >= 80) {
      badgesEarned.push("fast_responder");
    }
    
    if (evaluationData.empathy >= 90) {
      badgesEarned.push("empathy_pro");
    }
    
    if (evaluationData.protocol >= 95) {
      badgesEarned.push("protocol_master");
    }
    
    if (evaluationData.resolution >= 90) {
      badgesEarned.push("problem_solver");
    }

    evaluationLogger.info(
      { overallScore, complexity, pointsEarned, badgesEarned },
      'Evaluación completada con Gemini'
    );

    return {
      overallScore,
      categoryScores: {
        empathy: Math.round(empathy),
        clarity: Math.round(clarity),
        protocol: Math.round(protocol),
        resolution: Math.round(resolution),
        confidence: Math.round(confidence)
      },
      feedback: evaluationData.feedback,
      strengths: evaluationData.strengths,
      weaknesses: evaluationData.weaknesses,
      recommendations: evaluationData.recommendations,
      pointsEarned,
      badgesEarned
    };

  } catch (error) {
    evaluationLogger.error({ err: error }, 'Error en evaluación con Gemini');
    
    // Fallback evaluation
    return {
      overallScore: 75,
      categoryScores: {
        empathy: 75,
        clarity: 75,
        protocol: 75,
        resolution: 75,
        confidence: 75
      },
      feedback: "La evaluación automática no pudo completarse. Por favor, consulta con tu supervisor para una evaluación manual.",
      strengths: ["Completaste la simulación"],
      weaknesses: ["No se pudo generar evaluación detallada"],
      recommendations: ["Intenta realizar la simulación nuevamente"],
      pointsEarned: 50,
      badgesEarned: []
    };
  }
}

/**
 * Generar respuesta del cliente usando Gemini
 */
export async function generateClientResponse(
  scenario: Scenario,
  conversationHistory: Message[],
  lastAgentMessage: string,
  distressLevel: number = 3
): Promise<string> {
  
  const clientProfile = JSON.parse(scenario.clientProfile);
  const conversationTranscript = conversationHistory
    .map(m => `[${m.role.toUpperCase()}]: ${m.content}`)
    .join("\n");

  const systemPrompt = buildClientSystemPrompt(
    scenario.systemPrompt,
    clientProfile,
    distressLevel
  );

  const userPrompt = `CONVERSACIÓN HASTA AHORA:
${conversationTranscript}

[AGENT]: ${lastAgentMessage}

Responde como el cliente. Tu respuesta:`;

  try {
    // Usar Gemini para generar respuesta del cliente
    const response = await invokeLLM({
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userPrompt }
      ],
      maxTokens: 150
    });

    const content = response.choices[0].message.content;
    const responseText = (typeof content === 'string' ? content : JSON.stringify(content)).trim();

    evaluationLogger.info(
      { distressLevel, responseLength: responseText.length },
      'Respuesta del cliente generada con Gemini'
    );

    return responseText.trim();
    
  } catch (error) {
    evaluationLogger.error({ err: error, distressLevel }, 'Error generando respuesta del cliente con Gemini');
    return "Entiendo. ¿Hay algo más que puedas hacer para ayudarme?";
  }
}
