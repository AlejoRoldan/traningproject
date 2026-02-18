import OpenAI from "openai";

// Inicializar cliente de OpenAI
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

/**
 * Evalúa una conversación de simulación usando GPT-4o
 * Retorna métricas de desempeño basadas en análisis real
 */
export async function evaluateSimulationWithGPT(
  agentMessages: Array<{ role: string; content: string }>,
  customerMessages: Array<{ role: string; content: string }>,
  scenarioContext: string,
  scenarioTitle: string
) {
  try {
    // Combinar mensajes en un formato legible
    const conversationText = formatConversation(agentMessages, customerMessages);

    // Crear prompt para GPT-4o
    const evaluationPrompt = `
Eres un experto en evaluación de agentes de contact center bancario. Tu tarea es analizar la siguiente conversación de simulación y proporcionar una evaluación detallada.

CONTEXTO DEL ESCENARIO:
Título: ${scenarioTitle}
Descripción: ${scenarioContext}

CONVERSACIÓN:
${conversationText}

Por favor, analiza la conversación y proporciona una evaluación en formato JSON con los siguientes campos:

{
  "overall_score": <número 0-100>,
  "communication_score": <número 0-100>,
  "empathy_score": <número 0-100>,
  "problem_solving_score": <número 0-100>,
  "compliance_score": <número 0-100>,
  "professionalism_score": <número 0-100>,
  "strengths": [<lista de fortalezas identificadas>],
  "areas_for_improvement": [<lista de áreas de mejora>],
  "key_feedback": "<feedback constructivo y específico>",
  "recommendations": [<lista de recomendaciones concretas>]
}

Sé específico, constructivo y basa tu evaluación en mejores prácticas de atención al cliente bancario.
`;

    // Llamar a GPT-4o
    const response = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        {
          role: "system",
          content:
            "Eres un evaluador experto de agentes de contact center bancario. Proporciona evaluaciones detalladas y constructivas basadas en mejores prácticas de la industria.",
        },
        {
          role: "user",
          content: evaluationPrompt,
        },
      ],
      temperature: 0.7,
      max_tokens: 2000,
      response_format: { type: "json_object" },
    });

    // Extraer y parsear la respuesta
    const evaluationText =
      response.choices[0].message.content || "{}";
    const evaluation = JSON.parse(evaluationText);

    return {
      success: true,
      evaluation,
      usage: {
        prompt_tokens: response.usage?.prompt_tokens || 0,
        completion_tokens: response.usage?.completion_tokens || 0,
        total_tokens: response.usage?.total_tokens || 0,
      },
    };
  } catch (error) {
    console.error("Error evaluating simulation with GPT-4o:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
      evaluation: null,
    };
  }
}

/**
 * Genera feedback personalizado para un agente basado en su desempeño
 */
export async function generatePersonalizedFeedback(
  agentName: string,
  evaluationResults: Record<string, unknown>,
  previousPerformance?: Record<string, unknown>
) {
  try {
    const feedbackPrompt = `
Eres un coach de desarrollo profesional para agentes de contact center bancario.

INFORMACIÓN DEL AGENTE:
Nombre: ${agentName}

EVALUACIÓN ACTUAL:
${JSON.stringify(evaluationResults, null, 2)}

${
  previousPerformance
    ? `DESEMPEÑO ANTERIOR:
${JSON.stringify(previousPerformance, null, 2)}`
    : ""
}

Por favor, genera un feedback personalizado que:
1. Reconozca los logros y fortalezas del agente
2. Identifique áreas específicas de mejora
3. Proporcione acciones concretas para el desarrollo
4. Sea motivador y constructivo
5. Incluya recursos o entrenamientos recomendados

Formato: Texto narrativo, profesional pero amable.
`;

    const response = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        {
          role: "system",
          content:
            "Eres un coach profesional experto en desarrollo de agentes de contact center. Tu feedback es específico, constructivo y motivador.",
        },
        {
          role: "user",
          content: feedbackPrompt,
        },
      ],
      temperature: 0.8,
      max_tokens: 1500,
    });

    return {
      success: true,
      feedback: response.choices[0].message.content,
      usage: {
        prompt_tokens: response.usage?.prompt_tokens || 0,
        completion_tokens: response.usage?.completion_tokens || 0,
        total_tokens: response.usage?.total_tokens || 0,
      },
    };
  } catch (error) {
    console.error("Error generating personalized feedback:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
      feedback: null,
    };
  }
}

/**
 * Analiza tendencias de desempeño a lo largo del tiempo
 */
export async function analyzeTrendAnalysis(
  simulationHistory: Array<Record<string, unknown>>
) {
  try {
    const trendPrompt = `
Analiza el siguiente historial de desempeño de simulaciones y proporciona un análisis de tendencias:

HISTORIAL:
${JSON.stringify(simulationHistory, null, 2)}

Por favor, proporciona un análisis en formato JSON con:
{
  "trend_direction": "improving" | "declining" | "stable",
  "key_improvements": [<áreas donde ha mejorado>],
  "areas_needing_attention": [<áreas que necesitan atención>],
  "consistency_score": <0-100>,
  "recommendations_for_next_steps": [<recomendaciones>],
  "estimated_readiness_for_promotion": <0-100>
}
`;

    const response = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        {
          role: "system",
          content:
            "Eres un analista de datos de recursos humanos especializado en evaluación de desempeño de agentes de contact center.",
        },
        {
          role: "user",
          content: trendPrompt,
        },
      ],
      temperature: 0.7,
      max_tokens: 1500,
      response_format: { type: "json_object" },
    });

    const analysisText = response.choices[0].message.content || "{}";
    const analysis = JSON.parse(analysisText);

    return {
      success: true,
      analysis,
      usage: {
        prompt_tokens: response.usage?.prompt_tokens || 0,
        completion_tokens: response.usage?.completion_tokens || 0,
        total_tokens: response.usage?.total_tokens || 0,
      },
    };
  } catch (error) {
    console.error("Error analyzing trends:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
      analysis: null,
    };
  }
}

/**
 * Formatea la conversación en un texto legible
 */
function formatConversation(
  agentMessages: Array<{ role: string; content: string }>,
  customerMessages: Array<{ role: string; content: string }>
): string {
  const allMessages = [...agentMessages, ...customerMessages].sort(
    (a, b) => {
      const aIndex = agentMessages.indexOf(a);
      const bIndex = customerMessages.indexOf(b);
      return aIndex - bIndex;
    }
  );

  return allMessages
    .map((msg) => `${msg.role.toUpperCase()}: ${msg.content}`)
    .join("\n\n");
}

export default openai;
