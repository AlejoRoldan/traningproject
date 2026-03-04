#!/usr/bin/env tsx

/**
 * Script de Simulación Completa con Gemini
 * 
 * Ejecuta una simulación de entrenamiento completa:
 * 1. Carga escenario real
 * 2. Simula conversación agente-cliente
 * 3. Evalúa desempeño con Gemini
 * 4. Genera reporte detallado
 */

import { evaluateSimulation, generateClientResponse } from '../server/services/evaluationService';
import type { Scenario } from '../drizzle/schema';
import { writeFileSync } from 'fs';
import { join } from 'path';

// Datos de escenario real para simulación
const realScenario: Scenario = {
  id: 1,
  title: 'Reporte de Fraude Bancario - Tarjeta de Crédito',
  description: 'Cliente reporta transacciones no autorizadas en su tarjeta de crédito. El agente debe verificar identidad, bloquear la tarjeta, iniciar investigación y ofrecer protección.',
  category: 'fraud',
  complexity: 4,
  estimatedDuration: 20,
  systemPrompt: 'Eres un cliente preocupado por fraude en tu tarjeta de crédito. Acabas de recibir alertas de transacciones en ciudades donde no estabas. Estás ansioso pero confías en el banco.',
  clientProfile: JSON.stringify({
    name: 'Carlos Mendoza',
    age: 45,
    gender: 'male',
    emotion: 'worried',
    context: 'Detected suspicious transactions in different cities',
    background: 'Premium customer since 10 years',
    accountType: 'Business Plus',
    monthlySpend: '$15,000'
  }),
  evaluationCriteria: JSON.stringify({
    empathy: 25,
    clarity: 20,
    protocol: 30,
    resolution: 20,
    confidence: 5
  }),
  idealResponse: 'Verify identity, block card immediately, explain investigation process, offer fraud protection, provide timeline for resolution',
  tags: ['fraud', 'security', 'empathy', 'crisis'],
  isActive: 1,
  createdBy: 1,
  createdAt: new Date(),
  updatedAt: new Date(),
};

// Simulación de conversación realista
interface Message {
  role: 'agent' | 'client' | 'system';
  content: string;
}

const simulationMessages: Message[] = [
  {
    role: 'agent',
    content: 'Buenos días, ¿en qué puedo ayudarle?'
  },
  {
    role: 'client',
    content: 'Hola, tengo un problema grave. Acabo de recibir alertas de mi banco sobre transacciones que yo no hice. Hay cargos en Miami y Nueva York, ¡pero estoy aquí en Bogotá!'
  },
  {
    role: 'agent',
    content: 'Entiendo perfectamente su preocupación. Es muy importante que actuemos rápido. Para poder ayudarle, necesito verificar su identidad. ¿Podría confirmarme su número de cédula y los últimos 4 dígitos de su tarjeta?'
  },
  {
    role: 'client',
    content: 'Claro, mi cédula es 1234567890 y los últimos dígitos de mi tarjeta son 4829.'
  },
  {
    role: 'agent',
    content: 'Perfecto, he verificado su identidad. Voy a bloquear su tarjeta inmediatamente para evitar más transacciones no autorizadas. Esto tomará solo unos segundos.'
  },
  {
    role: 'client',
    content: 'Gracias, eso me tranquiliza. ¿Qué pasa ahora con el dinero que ya me robaron?'
  },
  {
    role: 'agent',
    content: 'Excelente pregunta. He bloqueado su tarjeta exitosamente. Ahora voy a iniciar una investigación formal de fraude. Nuestro equipo especializado revisará cada transacción no autorizada. Típicamente, el proceso toma 10 días hábiles, pero podemos reembolsar fondos en 3-5 días si la evidencia es clara. Mientras tanto, le enviaremos una tarjeta de reemplazo por mensajería express.'
  },
  {
    role: 'client',
    content: 'Eso suena bien. ¿Hay algo que deba hacer de mi parte? ¿Necesito cambiar mis contraseñas?'
  },
  {
    role: 'agent',
    content: 'Muy buena pregunta. Sí, le recomiendo cambiar su contraseña de banca en línea y también revisar sus otras cuentas. Le voy a enviar un link de seguridad a su correo registrado. Además, le activaré protección de fraude premium sin costo adicional durante 6 meses. ¿Tiene alguna otra pregunta?'
  },
  {
    role: 'client',
    content: 'No, creo que está todo claro. Gracias por tu ayuda y rapidez. Me siento mucho mejor ahora.'
  }
];

async function runSimulation() {
  console.log('🚀 Iniciando Simulación de Entrenamiento con Gemini\n');
  console.log('='.repeat(70));
  console.log('ESCENARIO:', realScenario.title);
  console.log('COMPLEJIDAD:', realScenario.complexity + '/5');
  console.log('CATEGORÍA:', realScenario.category);
  console.log('='.repeat(70));
  console.log();

  // Mostrar conversación
  console.log('📝 CONVERSACIÓN SIMULADA:\n');
  simulationMessages.forEach((msg, idx) => {
    const role = msg.role === 'agent' ? '👨‍💼 AGENTE' : '👤 CLIENTE';
    console.log(`[${idx + 1}] ${role}:`);
    console.log(`    "${msg.content}"\n`);
  });

  console.log('='.repeat(70));
  console.log('🔍 EVALUANDO DESEMPEÑO CON GEMINI...\n');

  try {
    // Ejecutar evaluación
    const evaluation = await evaluateSimulation(realScenario, simulationMessages);

    console.log('✅ EVALUACIÓN COMPLETADA\n');
    console.log('📊 RESULTADOS:\n');

    // Mostrar scores
    console.log('Puntuación General:', evaluation.overallScore + '/100');
    console.log('\nScores por Categoría:');
    console.log('  • Empatía:', evaluation.categoryScores.empathy + '/100');
    console.log('  • Claridad:', evaluation.categoryScores.clarity + '/100');
    console.log('  • Protocolo:', evaluation.categoryScores.protocol + '/100');
    console.log('  • Resolución:', evaluation.categoryScores.resolution + '/100');
    console.log('  • Confianza:', evaluation.categoryScores.confidence + '/100');

    console.log('\n💰 Puntos Ganados:', evaluation.pointsEarned);
    console.log('🏆 Badges Obtenidos:', evaluation.badgesEarned.length > 0 ? evaluation.badgesEarned.join(', ') : 'Ninguno');

    console.log('\n📝 FEEDBACK:\n');
    console.log(evaluation.feedback);

    console.log('\n✨ FORTALEZAS:');
    evaluation.strengths.forEach((strength, idx) => {
      console.log(`  ${idx + 1}. ${strength}`);
    });

    console.log('\n⚠️ ÁREAS DE MEJORA:');
    evaluation.weaknesses.forEach((weakness, idx) => {
      console.log(`  ${idx + 1}. ${weakness}`);
    });

    console.log('\n💡 RECOMENDACIONES:');
    evaluation.recommendations.forEach((rec, idx) => {
      console.log(`  ${idx + 1}. ${rec}`);
    });

    // Generar reporte JSON
    const report = {
      timestamp: new Date().toISOString(),
      scenario: {
        title: realScenario.title,
        category: realScenario.category,
        complexity: realScenario.complexity
      },
      evaluation,
      conversationLength: simulationMessages.length,
      agentMessages: simulationMessages.filter(m => m.role === 'agent').length,
      clientMessages: simulationMessages.filter(m => m.role === 'client').length
    };

    const reportPath = join(process.cwd(), 'simulation-report.json');
    writeFileSync(reportPath, JSON.stringify(report, null, 2));

    console.log('\n' + '='.repeat(70));
    console.log('✅ Simulación completada exitosamente');
    console.log('📄 Reporte guardado en:', reportPath);
    console.log('='.repeat(70));

    process.exit(0);
  } catch (error) {
    console.error('\n❌ Error durante la simulación:');
    console.error((error as Error).message);
    console.error('\nStack:', (error as Error).stack);
    process.exit(1);
  }
}

runSimulation();
