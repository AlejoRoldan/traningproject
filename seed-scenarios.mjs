import { drizzle } from "drizzle-orm/mysql2";
import { scenarios } from "./drizzle/schema.ts";
import * as dotenv from "dotenv";

dotenv.config();

const db = drizzle(process.env.DATABASE_URL);

const sampleScenarios = [
  {
    title: "Consulta de Saldo - Nivel Básico",
    description: "Cliente llama para consultar el saldo de su cuenta corriente. Escenario simple para practicar atención básica y protocolo de verificación.",
    category: "informative",
    complexity: 1,
    estimatedDuration: 5,
    systemPrompt: "Eres un cliente bancario que llama para consultar su saldo. Eres amable y cooperativo. Proporcionas tu información cuando se te solicita.",
    clientProfile: JSON.stringify({
      emotion: "neutral",
      initialContext: "El cliente necesita conocer su saldo actual",
      initialMessage: "Hola, buenos días. Quisiera saber cuánto saldo tengo en mi cuenta corriente."
    }),
    evaluationCriteria: JSON.stringify({
      empathy: 20,
      clarity: 30,
      protocol: 30,
      resolution: 20
    }),
    idealResponse: "Saludo profesional, verificación de identidad, consulta del saldo, confirmación y despedida cordial.",
    tags: JSON.stringify(["básico", "consulta", "saldo"]),
    isActive: 1
  },
  {
    title: "Bloqueo de Tarjeta por Pérdida",
    description: "Cliente reporta pérdida de tarjeta de débito y solicita bloqueo inmediato. Practica manejo de urgencias y protocolo de seguridad.",
    category: "transactional",
    complexity: 2,
    estimatedDuration: 8,
    systemPrompt: "Eres un cliente preocupado que perdió su tarjeta de débito. Estás nervioso pero cooperativo. Necesitas bloquearla urgentemente.",
    clientProfile: JSON.stringify({
      emotion: "worried",
      initialContext: "El cliente perdió su tarjeta y está preocupado por su seguridad",
      initialMessage: "¡Hola! Perdí mi tarjeta de débito y necesito bloquearla urgentemente. ¿Me pueden ayudar?"
    }),
    evaluationCriteria: JSON.stringify({
      empathy: 25,
      clarity: 25,
      protocol: 30,
      resolution: 20
    }),
    idealResponse: "Tranquilizar al cliente, verificar identidad, bloquear tarjeta, explicar próximos pasos para reemplazo.",
    tags: JSON.stringify(["intermedio", "bloqueo", "tarjeta", "urgencia"]),
    isActive: 1
  },
  {
    title: "Reporte de Transacción Fraudulenta",
    description: "Cliente identifica cargos no reconocidos en su cuenta. Escenario complejo que requiere protocolo de fraude y empatía.",
    category: "fraud",
    complexity: 4,
    estimatedDuration: 15,
    systemPrompt: "Eres un cliente muy molesto que descubrió cargos fraudulentos en su cuenta. Estás enojado y exiges solución inmediata. Tienes detalles de las transacciones sospechosas.",
    clientProfile: JSON.stringify({
      emotion: "angry",
      initialContext: "El cliente descubrió transacciones fraudulentas y está muy molesto",
      initialMessage: "¡Necesito hablar con alguien YA! Hay cargos en mi cuenta que yo no hice. ¡Esto es un robo!"
    }),
    evaluationCriteria: JSON.stringify({
      empathy: 30,
      clarity: 20,
      protocol: 35,
      resolution: 15
    }),
    idealResponse: "Mantener calma, mostrar empatía, seguir protocolo de fraude, documentar transacciones, iniciar investigación, explicar proceso y tiempos.",
    tags: JSON.stringify(["avanzado", "fraude", "seguridad", "conflicto"]),
    isActive: 1
  },
  {
    title: "Sospecha de Lavado de Activos",
    description: "Cliente realiza múltiples transacciones sospechosas. Escenario de máxima complejidad que requiere protocolo regulatorio estricto.",
    category: "money_laundering",
    complexity: 5,
    estimatedDuration: 20,
    systemPrompt: "Eres un cliente que intenta realizar transacciones inusuales. Eres evasivo con las preguntas sobre el origen de los fondos. Intentas presionar para que se procesen las transacciones rápidamente.",
    clientProfile: JSON.stringify({
      emotion: "defensive",
      initialContext: "El cliente quiere realizar transacciones sospechosas y evita dar explicaciones claras",
      initialMessage: "Necesito transferir una suma importante a varias cuentas diferentes. ¿Pueden procesarlo hoy mismo?"
    }),
    evaluationCriteria: JSON.stringify({
      empathy: 15,
      clarity: 20,
      protocol: 45,
      resolution: 20
    }),
    idealResponse: "Seguir estrictamente protocolo KYC/AML, hacer preguntas obligatorias, documentar respuestas, escalar a compliance si es necesario, no procesar hasta completar verificaciones.",
    tags: JSON.stringify(["experto", "lavado", "compliance", "regulatorio"]),
    isActive: 1
  },
  {
    title: "Solicitud de Crédito Personal",
    description: "Cliente consulta sobre opciones de crédito personal. Practica asesoramiento financiero y presentación de productos.",
    category: "credit",
    complexity: 3,
    estimatedDuration: 12,
    systemPrompt: "Eres un cliente interesado en obtener un crédito personal. Tienes preguntas sobre tasas, plazos y requisitos. Eres analítico y quieres comparar opciones.",
    clientProfile: JSON.stringify({
      emotion: "curious",
      initialContext: "El cliente está evaluando opciones de crédito para un proyecto personal",
      initialMessage: "Buenos días, estoy interesado en solicitar un crédito personal. ¿Qué opciones tienen disponibles?"
    }),
    evaluationCriteria: JSON.stringify({
      empathy: 20,
      clarity: 35,
      protocol: 25,
      resolution: 20
    }),
    idealResponse: "Entender necesidad del cliente, explicar opciones claramente, detallar requisitos, tasas y plazos, guiar proceso de solicitud.",
    tags: JSON.stringify(["intermedio", "crédito", "asesoramiento", "productos"]),
    isActive: 1
  },
  {
    title: "Reclamo por Cargo Incorrecto",
    description: "Cliente reclama por un cargo que considera incorrecto. Practica manejo de quejas y resolución de conflictos.",
    category: "complaint",
    complexity: 3,
    estimatedDuration: 10,
    systemPrompt: "Eres un cliente molesto por un cargo que consideras incorrecto en tu estado de cuenta. Quieres una explicación y solución. Puedes ser insistente pero razonable.",
    clientProfile: JSON.stringify({
      emotion: "frustrated",
      initialContext: "El cliente vio un cargo que no reconoce y quiere aclaración",
      initialMessage: "Hola, tengo un cargo en mi cuenta que no entiendo. Dice 'comisión por mantenimiento' pero yo tengo cuenta sin costo. ¿Qué pasó?"
    }),
    evaluationCriteria: JSON.stringify({
      empathy: 30,
      clarity: 25,
      protocol: 20,
      resolution: 25
    }),
    idealResponse: "Escuchar activamente, mostrar empatía, investigar el cargo, explicar claramente, ofrecer solución o compensación si corresponde.",
    tags: JSON.stringify(["intermedio", "reclamo", "servicio", "resolución"]),
    isActive: 1
  },
  {
    title: "Asistencia con Banca Digital",
    description: "Cliente tiene problemas para usar la app móvil del banco. Practica soporte técnico y paciencia didáctica.",
    category: "digital_channels",
    complexity: 2,
    estimatedDuration: 10,
    systemPrompt: "Eres un cliente mayor que no está familiarizado con tecnología. Tienes dificultades para usar la app del banco. Necesitas explicaciones paso a paso y eres un poco lento para seguir instrucciones.",
    clientProfile: JSON.stringify({
      emotion: "confused",
      initialContext: "El cliente no puede acceder a su banca móvil y necesita ayuda técnica",
      initialMessage: "Disculpe, instalé la aplicación del banco en mi teléfono pero no puedo entrar. Me pide un usuario y no sé cuál es."
    }),
    evaluationCriteria: JSON.stringify({
      empathy: 30,
      clarity: 35,
      protocol: 15,
      resolution: 20
    }),
    idealResponse: "Ser paciente, dar instrucciones claras y paso a paso, verificar comprensión, ofrecer alternativas si es necesario.",
    tags: JSON.stringify(["básico", "digital", "soporte", "paciencia"]),
    isActive: 1
  },
  {
    title: "Robo de Identidad Reportado",
    description: "Cliente sospecha que su identidad fue robada y usada para abrir cuentas. Escenario crítico de seguridad.",
    category: "theft",
    complexity: 5,
    estimatedDuration: 18,
    systemPrompt: "Eres un cliente muy preocupado y asustado porque recibiste notificaciones de cuentas que no abriste. Sospechas robo de identidad. Estás ansioso y necesitas ayuda urgente.",
    clientProfile: JSON.stringify({
      emotion: "scared",
      initialContext: "El cliente cree ser víctima de robo de identidad",
      initialMessage: "¡Por favor ayúdenme! Recibí correos de que abrieron cuentas a mi nombre pero yo no hice eso. Creo que robaron mi identidad."
    }),
    evaluationCriteria: JSON.stringify({
      empathy: 35,
      clarity: 20,
      protocol: 35,
      resolution: 10
    }),
    idealResponse: "Tranquilizar al cliente, seguir protocolo de seguridad, documentar todo, escalar a departamento de fraude, explicar pasos de protección.",
    tags: JSON.stringify(["experto", "robo", "identidad", "seguridad", "crisis"]),
    isActive: 1
  }
];

async function seedScenarios() {
  console.log("🌱 Insertando escenarios de ejemplo...");
  
  try {
    for (const scenario of sampleScenarios) {
      await db.insert(scenarios).values(scenario);
      console.log(`✅ Insertado: ${scenario.title}`);
    }
    
    console.log("\n🎉 ¡Escenarios insertados exitosamente!");
    console.log(`Total: ${sampleScenarios.length} escenarios`);
    
  } catch (error) {
    console.error("❌ Error al insertar escenarios:", error);
    process.exit(1);
  }
  
  process.exit(0);
}

seedScenarios();
