import { invokeLLM } from "./_core/llm";
import { generateStructuredResponse, generateChatCompletion, type ChatMessage } from "./openaiService";
import type { Scenario } from "../drizzle/schema";

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

// Check if OpenAI API key is configured
const useOpenAI = !!process.env.OPENAI_API_KEY;

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
    let evaluationData;

    if (useOpenAI) {
      // Use OpenAI API
      const messages: ChatMessage[] = [
        { role: "system", content: systemPrompt },
        { role: "user", content: userPrompt }
      ];

      evaluationData = await generateStructuredResponse(messages, {
        name: "evaluation_result",
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
      });
    } else {
      // Use Manus built-in LLM
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
      evaluationData = JSON.parse(typeof content === 'string' ? content : JSON.stringify(content));
    }

    // Calculate weighted overall score
    const weights = {
      empathy: evaluationCriteria.empathy / 100,
      clarity: evaluationCriteria.clarity / 100,
      protocol: evaluationCriteria.protocol / 100,
      resolution: evaluationCriteria.resolution / 100,
      confidence: 0.20 // Fixed 20% weight
    };

    // Ensure all values are valid numbers
    const empathy = Number(evaluationData.empathy) || 75;
    const clarity = Number(evaluationData.clarity) || 75;
    const protocol = Number(evaluationData.protocol) || 75;
    const resolution = Number(evaluationData.resolution) || 75;
    const confidence = Number(evaluationData.confidence) || 75;

    const overallScore = Math.round(
      empathy * weights.empathy +
      clarity * weights.clarity +
      protocol * weights.protocol +
      resolution * weights.resolution +
      confidence * weights.confidence
    );

    // Calculate points earned based on score and complexity
    const basePoints = Math.round(overallScore * scenario.complexity);
    const bonusPoints = overallScore >= 90 ? 50 : overallScore >= 80 ? 25 : 0;
    const pointsEarned = basePoints + bonusPoints;

    // Determine badges earned
    const badgesEarned: string[] = [];
    if (evaluationData.empathy >= 90) badgesEarned.push("empathy_pro");
    if (evaluationData.protocol >= 95) badgesEarned.push("protocol_master");
    if (evaluationData.resolution >= 90) badgesEarned.push("problem_solver");
    if (scenario.complexity >= 4 && overallScore >= 85) badgesEarned.push("crisis_handler");
    if (overallScore >= 95) badgesEarned.push("excellence_award");

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
    console.error("Error en evaluación con GPT:", error);
    
    // Fallback evaluation if GPT fails
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

export async function generateClientResponse(
  scenario: Scenario,
  conversationHistory: Message[],
  lastAgentMessage: string
): Promise<string> {
  
  const clientProfile = JSON.parse(scenario.clientProfile);
  const conversationTranscript = conversationHistory
    .map(m => `[${m.role.toUpperCase()}]: ${m.content}`)
    .join("\n");

  const systemPrompt = `${scenario.systemPrompt}

PERFIL DEL CLIENTE:
- Emoción: ${clientProfile.emotion}
- Contexto: ${clientProfile.initialContext}

INSTRUCCIONES:
- Responde como el cliente descrito en el perfil
- Mantén la emoción y personalidad consistentes
- Sé realista y natural en tus respuestas
- Si el agente resuelve bien tu problema, muestra satisfacción
- Si el agente no sigue el protocolo o no te ayuda bien, muestra frustración
- Mantén respuestas breves (1-3 oraciones)
- No repitas información que ya diste
- Responde en español de Paraguay`;

  const userPrompt = `CONVERSACIÓN HASTA AHORA:
${conversationTranscript}

[AGENT]: ${lastAgentMessage}

Responde como el cliente. Tu respuesta:`;

  try {
    let responseText: string;

    if (useOpenAI) {
      // Use OpenAI API
      const messages: ChatMessage[] = [
        { role: "system", content: systemPrompt },
        { role: "user", content: userPrompt }
      ];

      responseText = await generateChatCompletion(messages, {
        model: 'gpt-4o',
        temperature: 0.8,
        maxTokens: 150
      });
    } else {
      // Use Manus built-in LLM
      const response = await invokeLLM({
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userPrompt }
        ]
      });

      const content = response.choices[0].message.content;
      responseText = (typeof content === 'string' ? content : JSON.stringify(content)).trim();
    }

    return responseText.trim();
    
  } catch (error) {
    console.error("Error generando respuesta del cliente:", error);
    return "Entiendo. ¿Hay algo más que puedas hacer para ayudarme?";
  }
}
