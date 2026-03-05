import mysql from 'mysql2/promise';
import dotenv from 'dotenv';
dotenv.config();

const conn = await mysql.createConnection(process.env.DATABASE_URL);

// ─── Badges ───────────────────────────────────────────────────────────────────
const badges = [
  { key: 'primera_simulacion', name: 'Primera Simulación', description: 'Completaste tu primera simulación', icon: 'Target', category: 'completion', xpBonus: 50 },
  { key: 'racha_3', name: 'Racha de 3 Días', description: 'Mantuviste una racha de 3 días consecutivos', icon: 'Flame', category: 'streak', xpBonus: 100 },
  { key: 'racha_7', name: 'Racha Semanal', description: 'Mantuviste una racha de 7 días consecutivos', icon: 'Zap', category: 'streak', xpBonus: 250 },
  { key: 'score_perfecto', name: 'Score Perfecto', description: 'Obtuviste 100/100 en una simulación', icon: 'Star', category: 'performance', xpBonus: 200 },
  { key: 'top_10', name: 'Top 10 Semanal', description: 'Estuviste en el top 10 del ranking semanal', icon: 'Trophy', category: 'ranking', xpBonus: 150 },
  { key: 'experto_reclamos', name: 'Experto en Reclamos', description: 'Completaste 10 simulaciones de Reclamos con score > 85', icon: 'Shield', category: 'performance', xpBonus: 300 },
  { key: 'maestro_empatia', name: 'Maestro de Empatía', description: 'Obtuviste 90+ en Empatía en 5 simulaciones', icon: 'Heart', category: 'performance', xpBonus: 200 },
  { key: 'velocista', name: 'Velocista', description: 'Completaste 5 simulaciones en un solo día', icon: 'Zap', category: 'completion', xpBonus: 150 },
];

for (const b of badges) {
  await conn.execute(
    'INSERT IGNORE INTO badges (`key`, name, description, icon, category, xpBonus) VALUES (?, ?, ?, ?, ?, ?)',
    [b.key, b.name, b.description, b.icon, b.category, b.xpBonus]
  );
}
console.log('✓ Badges seeded');

// ─── Scenarios ────────────────────────────────────────────────────────────────
const scenarios = [
  {
    title: 'Cliente furioso por doble cobro en tarjeta',
    description: 'Un cliente llama muy molesto porque detectó un cargo duplicado en su tarjeta de crédito. Necesita una solución inmediata.',
    category: 'reclamos',
    difficulty: 'dificil',
    xpReward: 120,
    durationMin: 5,
    durationMax: 8,
    clientName: 'Roberto Méndez',
    clientPersona: 'Hombre de 45 años, empresario, muy exigente y poco tolerante con los errores bancarios. Habla rápido y con tono elevado.',
    clientTone: 'molesto',
    clientGender: 'masculino',
    initialMessage: 'Necesito hablar con alguien AHORA. Me cobraron dos veces el mismo monto en mi tarjeta y esto es inaceptable. ¿Qué clase de banco es este?',
    systemPrompt: `Eres Roberto Méndez, un cliente bancario furioso. Detectaste un doble cobro de $450.000 en tu tarjeta de crédito del día de ayer. Estás muy molesto y exiges una solución inmediata. 
    
    Comportamiento:
    - Habla con tono elevado y urgente
    - Si el agente no se disculpa primero, aumenta tu molestia
    - Si el agente muestra empatía real, baja un poco el tono
    - Exige saber cuándo se revertirá el cobro (respuesta correcta: 24-48 horas hábiles)
    - Si el agente no verifica tu identidad antes de dar información, recuérdaselo con molestia
    - Pregunta si recibirás confirmación por escrito
    - Si el agente transfiere sin resolver, di que ya te transfirieron 3 veces
    
    Información del caso: Doble cobro de $450.000 del comercio "Supermercado Central" el día de ayer.`,
    idealResponseHints: 'Verificar identidad, disculparse, empatizar, explicar proceso de reversión (24-48h), dar número de caso, ofrecer confirmación por email',
    empathyWeight: '0.30',
    clarityWeight: '0.20',
    protocolWeight: '0.20',
    resolutionWeight: '0.20',
    professionalismWeight: '0.10',
    competencies: JSON.stringify(['Empatía', 'Resolución']),
    totalCompleted: 342,
    avgScore: '72.00',
  },
  {
    title: 'Consulta sobre requisitos de tarjeta Dúo',
    description: 'Un cliente interesado en solicitar la tarjeta Dúo quiere conocer todos los requisitos y beneficios antes de decidir.',
    category: 'productos',
    difficulty: 'facil',
    xpReward: 60,
    durationMin: 3,
    durationMax: 5,
    clientName: 'Ana Rodríguez',
    clientPersona: 'Mujer de 32 años, empleada, curiosa y detallista. Hace muchas preguntas antes de tomar decisiones.',
    clientTone: 'amable',
    clientGender: 'femenino',
    initialMessage: 'Hola, buenos días. Me interesa solicitar la tarjeta Dúo que vi en su publicidad. ¿Me pueden explicar qué necesito para solicitarla?',
    systemPrompt: `Eres Ana Rodríguez, una clienta interesada en la tarjeta Dúo. Eres amable pero detallista.
    
    Preguntas que harás:
    - ¿Cuáles son los requisitos de ingresos?
    - ¿Cuál es el límite de crédito inicial?
    - ¿Tiene comisión anual?
    - ¿Cuánto tiempo tarda la aprobación?
    - ¿Puedo hacer el trámite online?
    
    Información esperada de la tarjeta Dúo:
    - Ingreso mínimo: $1.500.000
    - Límite inicial: hasta $3.000.000 según evaluación
    - Sin comisión anual el primer año
    - Aprobación: 3-5 días hábiles
    - Trámite 100% digital disponible
    
    Si el agente da información incorrecta o incompleta, pregunta de nuevo amablemente.`,
    idealResponseHints: 'Saludar cordialmente, verificar identidad si aplica, explicar requisitos completos, mencionar beneficios, ofrecer iniciar el proceso',
    empathyWeight: '0.15',
    clarityWeight: '0.35',
    protocolWeight: '0.25',
    resolutionWeight: '0.15',
    professionalismWeight: '0.10',
    competencies: JSON.stringify(['Protocolo', 'Claridad']),
    totalCompleted: 891,
    avgScore: '88.00',
  },
  {
    title: 'Negociación de plan de pagos por mora',
    description: 'Un cliente con 3 cuotas atrasadas de su préstamo personal busca un acuerdo de pago. La situación es delicada.',
    category: 'cobranzas',
    difficulty: 'experto',
    xpReward: 200,
    durationMin: 8,
    durationMax: 10,
    clientName: 'Carlos Benítez',
    clientPersona: 'Hombre de 38 años, trabajador independiente que perdió un contrato importante. Está avergonzado pero a la defensiva.',
    clientTone: 'ansioso',
    clientGender: 'masculino',
    initialMessage: 'Me llamaron varias veces... sé que estoy atrasado con el préstamo. Quiero ver qué opciones tengo porque en este momento no puedo pagar todo.',
    systemPrompt: `Eres Carlos Benítez, un cliente con 3 cuotas atrasadas de $180.000 cada una en su préstamo personal. Perdiste un contrato de trabajo hace 2 meses.
    
    Comportamiento:
    - Estás avergonzado pero a la defensiva si sientes presión
    - Si el agente es empático, abres más sobre tu situación
    - Puedes pagar $100.000 ahora y $150.000 por mes
    - Tienes miedo de que te reporten al buró de crédito
    - Preguntas: ¿Puedo refinanciar? ¿Habrá recargos? ¿Afecta mi historial?
    
    Si el agente presiona demasiado o amenaza, te pones a la defensiva y dices que consultarás con un abogado.
    Si el agente es comprensivo y ofrece opciones reales, muestras disposición a pagar.`,
    idealResponseHints: 'Empatizar sin juzgar, escuchar situación, explicar opciones de refinanciamiento, negociar plan realista, explicar impacto en historial crediticio, formalizar acuerdo',
    empathyWeight: '0.25',
    clarityWeight: '0.20',
    protocolWeight: '0.15',
    resolutionWeight: '0.30',
    professionalismWeight: '0.10',
    competencies: JSON.stringify(['Resolución', 'Profesionalismo']),
    totalCompleted: 128,
    avgScore: '65.00',
  },
  {
    title: 'Cross-sell de seguro con tarjeta de crédito',
    description: 'Durante una llamada de servicio, identificar oportunidad y ofrecer seguro de vida vinculado a la tarjeta.',
    category: 'ventas',
    difficulty: 'medio',
    xpReward: 100,
    durationMin: 5,
    durationMax: 7,
    clientName: 'María Fernández',
    clientPersona: 'Mujer de 40 años, madre de familia, conservadora con el dinero pero abierta a protección familiar.',
    clientTone: 'neutral',
    clientGender: 'femenino',
    initialMessage: 'Hola, llamo porque quiero saber el saldo disponible de mi tarjeta de crédito.',
    systemPrompt: `Eres María Fernández, clienta que llama por una consulta de saldo. Tienes tarjeta de crédito hace 3 años, buen historial.
    
    Comportamiento:
    - Inicialmente solo quieres el saldo (respuesta: $2.150.000 disponibles)
    - Si el agente ofrece el seguro de forma natural (no forzada), escuchas
    - Preguntas clave: ¿Cuánto cuesta? ¿Qué cubre? ¿Puedo cancelarlo?
    - Costo: $15.000/mes debitado de la tarjeta
    - Cobertura: vida, invalidez, desempleo
    - Cancelación: en cualquier momento sin penalidad
    - Si el agente presiona demasiado, dices "lo voy a pensar"
    - Si la presentación es clara y natural, aceptas el seguro`,
    idealResponseHints: 'Resolver consulta principal primero, identificar oportunidad, presentar beneficio relevante para el perfil, manejar objeciones, cerrar sin presionar',
    empathyWeight: '0.15',
    clarityWeight: '0.30',
    protocolWeight: '0.20',
    resolutionWeight: '0.20',
    professionalismWeight: '0.15',
    competencies: JSON.stringify(['Claridad', 'Protocolo']),
    totalCompleted: 567,
    avgScore: '79.00',
  },
  {
    title: 'Primer día: bienvenida al cliente nuevo',
    description: 'Un cliente acaba de abrir su primera cuenta y llama para activarla y conocer los servicios disponibles.',
    category: 'onboarding',
    difficulty: 'facil',
    xpReward: 50,
    durationMin: 3,
    durationMax: 4,
    clientName: 'Diego Sosa',
    clientPersona: 'Joven de 24 años, primer banco. Entusiasta pero no conoce los servicios bancarios.',
    clientTone: 'amable',
    clientGender: 'masculino',
    initialMessage: 'Hola! Acabo de abrir mi cuenta ayer y me dijeron que tenía que llamar para activar la tarjeta de débito. ¿Cómo hago?',
    systemPrompt: `Eres Diego Sosa, joven que abrió su primera cuenta bancaria ayer. Estás emocionado pero no sabes mucho de banca.
    
    Preguntas que harás:
    - ¿Cómo activo la tarjeta?
    - ¿Puedo usar la app del banco?
    - ¿Cuánto puedo retirar por día?
    - ¿Tiene costo el mantenimiento de la cuenta?
    
    Respuestas esperadas:
    - Activación: por cajero automático o app con el PIN que llegó por SMS
    - App: disponible en iOS y Android, buscar "Kaitel Bank"
    - Límite diario: $500.000 en cajero, $2.000.000 en compras
    - Mantenimiento: gratis con 1 movimiento al mes
    
    Si el agente es amable y claro, terminas la llamada muy satisfecho.`,
    idealResponseHints: 'Dar bienvenida cálida, verificar identidad, guiar activación paso a paso, mencionar app y servicios digitales, preguntar si tiene más dudas',
    empathyWeight: '0.20',
    clarityWeight: '0.30',
    protocolWeight: '0.25',
    resolutionWeight: '0.15',
    professionalismWeight: '0.10',
    competencies: JSON.stringify(['Empatía', 'Profesionalismo']),
    totalCompleted: 1203,
    avgScore: '91.00',
  },
  {
    title: 'Reclamo por demora en entrega de tarjeta',
    description: 'El cliente lleva 3 semanas esperando su tarjeta nueva y está frustrado con la demora.',
    category: 'reclamos',
    difficulty: 'medio',
    xpReward: 90,
    durationMin: 5,
    durationMax: 7,
    clientName: 'Patricia Villalba',
    clientPersona: 'Mujer de 50 años, jubilada, paciente pero ya llegó al límite de su paciencia.',
    clientTone: 'molesto',
    clientGender: 'femenino',
    initialMessage: 'Buenas tardes. Hace 3 semanas solicité la renovación de mi tarjeta y todavía no llega. Ya llamé dos veces antes y me dijeron que esperara.',
    systemPrompt: `Eres Patricia Villalba, clienta que espera su tarjeta de débito renovada hace 3 semanas. Ya llamaste 2 veces antes.
    
    Comportamiento:
    - Estás cansada de esperar y de las respuestas vagas
    - Si el agente revisa el estado y da información concreta, te calmas
    - Preguntas: ¿Dónde está mi tarjeta? ¿Cuándo llega? ¿Por qué tardó tanto?
    - Estado real: tarjeta enviada hace 5 días, en camino, llega en 2-3 días hábiles
    - Pides que te llamen cuando llegue
    - Si el agente no puede darte información concreta, escalas el reclamo`,
    idealResponseHints: 'Disculparse por la espera, verificar estado del envío, dar fecha estimada concreta, registrar seguimiento, ofrecer llamada de confirmación',
    empathyWeight: '0.25',
    clarityWeight: '0.25',
    protocolWeight: '0.20',
    resolutionWeight: '0.20',
    professionalismWeight: '0.10',
    competencies: JSON.stringify(['Empatía', 'Resolución']),
    totalCompleted: 456,
    avgScore: '76.00',
  },
  {
    title: 'Cliente solicita cancelar cuenta',
    description: 'Un cliente quiere cancelar su cuenta por mala experiencia. El objetivo es retenerlo o gestionar la baja correctamente.',
    category: 'reclamos',
    difficulty: 'experto',
    xpReward: 180,
    durationMin: 7,
    durationMax: 10,
    clientName: 'Fernando Aquino',
    clientPersona: 'Hombre de 35 años, profesional, decidido. Tuvo problemas con comisiones que considera injustas.',
    clientTone: 'molesto',
    clientGender: 'masculino',
    initialMessage: 'Quiero cancelar mi cuenta. Estoy harto de las comisiones que me cobran sin avisar. Esto es un abuso.',
    systemPrompt: `Eres Fernando Aquino, cliente decidido a cancelar su cuenta por comisiones que considera abusivas.
    
    Situación: Te cobraron $12.000 de comisión por mantenimiento cuando creías tener cuenta gratuita.
    
    Comportamiento:
    - Estás decidido pero escuchas si hay solución real
    - Si el agente solo se disculpa sin ofrecer solución, insistes en cancelar
    - Si el agente ofrece revertir la comisión Y explica cómo evitarla, consideras quedarte
    - Preguntas: ¿Por qué me cobraron? ¿Pueden revertirlo? ¿Cómo evito esto?
    - Si el agente gestiona la cancelación, preguntas si hay penalidad y cuánto tarda
    
    Condición para retención: Reversión de la comisión + explicación clara de condiciones gratuitas.`,
    idealResponseHints: 'Escuchar sin interrumpir, empatizar, investigar el cargo, ofrecer reversión si aplica, explicar condiciones, intentar retención con beneficio concreto, gestionar baja si insiste',
    empathyWeight: '0.25',
    clarityWeight: '0.20',
    protocolWeight: '0.15',
    resolutionWeight: '0.25',
    professionalismWeight: '0.15',
    competencies: JSON.stringify(['Resolución', 'Empatía', 'Profesionalismo']),
    totalCompleted: 89,
    avgScore: '61.00',
  },
  {
    title: 'Explicar beneficios del préstamo personal',
    description: 'Un cliente interesado en un préstamo personal quiere comparar opciones y entender todos los costos.',
    category: 'ventas',
    difficulty: 'medio',
    xpReward: 80,
    durationMin: 4,
    durationMax: 6,
    clientName: 'Lucía Giménez',
    clientPersona: 'Mujer de 28 años, empleada pública, analítica y comparadora. Quiere el mejor trato posible.',
    clientTone: 'neutral',
    clientGender: 'femenino',
    initialMessage: 'Hola, estoy pensando en pedir un préstamo personal de $2.000.000. ¿Me pueden explicar las condiciones?',
    systemPrompt: `Eres Lucía Giménez, interesada en un préstamo personal de $2.000.000. Eres analítica y comparas opciones.
    
    Preguntas que harás:
    - ¿Cuál es la tasa de interés?
    - ¿Cuántas cuotas puedo elegir?
    - ¿Hay seguro obligatorio?
    - ¿Cuánto sería la cuota mensual?
    - ¿Puedo cancelar anticipadamente?
    
    Información del préstamo:
    - Tasa: 3.5% mensual (TNA 42%)
    - Plazos: 12, 18, 24, 36 meses
    - Seguro de vida: incluido (0.15% del saldo)
    - Cuota a 24 meses: aprox $115.000
    - Cancelación anticipada: sin penalidad
    
    Si el agente da información clara y completa, muestras interés en continuar el proceso.`,
    idealResponseHints: 'Escuchar necesidad, presentar condiciones completas, calcular cuota estimada, mencionar beneficios diferenciadores, invitar a continuar el proceso',
    empathyWeight: '0.10',
    clarityWeight: '0.35',
    protocolWeight: '0.20',
    resolutionWeight: '0.25',
    professionalismWeight: '0.10',
    competencies: JSON.stringify(['Claridad', 'Protocolo']),
    totalCompleted: 678,
    avgScore: '83.00',
  },
  {
    title: 'Reporte de tarjeta robada - Caso urgente',
    description: 'Un cliente reporta el robo de su tarjeta y necesita bloqueo inmediato y orientación sobre los pasos a seguir.',
    category: 'fraude',
    difficulty: 'dificil',
    xpReward: 150,
    durationMin: 6,
    durationMax: 9,
    clientName: 'Jorge Paredes',
    clientPersona: 'Hombre de 42 años, muy asustado y confundido. Acaba de ser víctima de robo hace 20 minutos.',
    clientTone: 'urgente',
    clientGender: 'masculino',
    initialMessage: 'Ayuda! Me robaron la cartera hace un momento y tenía mis tarjetas. Necesito bloquearlas YA antes de que las usen.',
    systemPrompt: `Eres Jorge Paredes, víctima de robo hace 20 minutos. Estás muy asustado y necesitas ayuda urgente.
    
    Comportamiento:
    - Estás en estado de shock, hablas rápido y confundido
    - Necesitas bloqueo inmediato de 2 tarjetas (débito y crédito)
    - Preguntas urgentes: ¿Ya usaron mis tarjetas? ¿Qué hago si hicieron compras? ¿Cuándo tengo nuevas tarjetas?
    - Si el agente es calmado y eficiente, te tranquilizas gradualmente
    - Preguntas adicionales: ¿Necesito hacer denuncia policial? ¿El banco cubre el fraude?
    
    Información esperada:
    - Bloqueo inmediato disponible
    - Revisión de últimas transacciones
    - Proceso de disputa si hay cargos no reconocidos
    - Nuevas tarjetas en 5-7 días hábiles
    - Sí se recomienda denuncia policial`,
    idealResponseHints: 'Tranquilizar al cliente, verificar identidad con urgencia, bloquear tarjetas inmediatamente, revisar últimas transacciones, explicar proceso de disputa, orientar sobre denuncia policial',
    empathyWeight: '0.25',
    clarityWeight: '0.20',
    protocolWeight: '0.30',
    resolutionWeight: '0.20',
    professionalismWeight: '0.05',
    competencies: JSON.stringify(['Protocolo', 'Empatía', 'Resolución']),
    totalCompleted: 234,
    avgScore: '74.00',
  },
];

for (const s of scenarios) {
  await conn.execute(
    `INSERT INTO scenarios (title, description, category, difficulty, xpReward, durationMin, durationMax, 
     clientName, clientPersona, clientTone, clientGender, initialMessage, systemPrompt, idealResponseHints,
     empathyWeight, clarityWeight, protocolWeight, resolutionWeight, professionalismWeight,
     competencies, totalCompleted, avgScore, isActive)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, true)`,
    [s.title, s.description, s.category, s.difficulty, s.xpReward, s.durationMin, s.durationMax,
     s.clientName, s.clientPersona, s.clientTone, s.clientGender, s.initialMessage, s.systemPrompt, s.idealResponseHints,
     s.empathyWeight, s.clarityWeight, s.protocolWeight, s.resolutionWeight, s.professionalismWeight,
     s.competencies, s.totalCompleted, s.avgScore]
  );
}
console.log('✓ Scenarios seeded');

// ─── Library Resources ────────────────────────────────────────────────────────
const resources = [
  { title: 'Cómo manejar un cliente enojado paso a paso', description: 'Guía completa con técnicas probadas para desescalar situaciones de alta tensión emocional en llamadas bancarias.', category: 'empatia', type: 'guia', readingMinutes: 5, rating: '4.8', views: 1234, content: '# Cómo manejar un cliente enojado\n\n## 1. Escucha activa sin interrumpir\nDeja que el cliente exprese toda su frustración antes de responder. El silencio activo demuestra respeto.\n\n## 2. Valida sus emociones\nUsa frases como: "Entiendo perfectamente su frustración" o "Tiene toda la razón en estar molesto".\n\n## 3. Pide disculpas de forma genuina\nNo uses disculpas genéricas. Sé específico: "Lamento mucho que haya tenido esta experiencia con nosotros".\n\n## 4. Toma control con soluciones\nUna vez que el cliente se calma, presenta opciones concretas y plazos reales.\n\n## 5. Confirma la solución\nAntes de cerrar, confirma que el cliente está satisfecho con la resolución.' },
  { title: 'Protocolo de verificación de identidad bancaria', description: 'Procedimiento estándar para verificar la identidad del cliente antes de brindar información o realizar operaciones.', category: 'protocolo', type: 'procedimiento', readingMinutes: 3, rating: '4.5', views: 890, content: '# Protocolo de Verificación de Identidad\n\n## Pasos obligatorios\n1. Solicitar nombre completo\n2. Número de documento de identidad\n3. Fecha de nacimiento\n4. Último movimiento o saldo aproximado\n\n## Regla de oro\nNUNCA brindar información de cuenta sin completar los 4 pasos de verificación.\n\n## Casos especiales\n- Cliente que no recuerda datos: escalar a supervisor\n- Terceros autorizados: verificar poder notarial en sistema' },
  { title: 'Técnicas de escucha activa en llamadas', description: 'Video tutorial con ejemplos reales de cómo practicar la escucha activa para mejorar la satisfacción del cliente.', category: 'empatia', type: 'video', readingMinutes: 8, rating: '4.9', views: 2100, content: '# Técnicas de Escucha Activa\n\n## ¿Qué es la escucha activa?\nEs la capacidad de prestar atención completa al cliente, comprender su mensaje y responder de manera apropiada.\n\n## Técnicas clave\n- **Parafrasear**: "Si entiendo bien, usted dice que..."\n- **Clarificar**: "¿Podría explicarme un poco más sobre...?"\n- **Resumir**: "Entonces el problema principal es..."\n- **Validar**: "Entiendo que esto es importante para usted"' },
  { title: 'Guía rápida: Tarjeta Dúo - beneficios y requisitos', description: 'Ficha técnica completa de la Tarjeta Dúo con todos los beneficios, requisitos y condiciones para ofrecer a clientes.', category: 'productos', type: 'ficha', readingMinutes: 4, rating: '4.3', views: 567, content: '# Tarjeta Dúo - Ficha Técnica\n\n## Beneficios principales\n- 2% cashback en supermercados\n- Sin comisión anual el primer año\n- Seguro de compras incluido\n- Cuotas sin interés en comercios adheridos\n\n## Requisitos\n- Ingreso mínimo: $1.500.000\n- Antigüedad laboral: 6 meses\n- Sin antecedentes negativos\n\n## Límites\n- Inicial: hasta $3.000.000\n- Máximo: $8.000.000 según historial' },
  { title: 'Cómo resolver doble cobro en 5 minutos', description: 'Guía paso a paso para gestionar reclamos de doble cobro de forma eficiente y dejar al cliente satisfecho.', category: 'resolucion', type: 'guia', readingMinutes: 6, rating: '4.7', views: 1567, content: '# Resolución de Doble Cobro\n\n## Pasos del proceso\n1. Verificar identidad del cliente\n2. Acceder al historial de transacciones\n3. Confirmar el doble cargo en el sistema\n4. Iniciar solicitud de reversión\n5. Dar número de caso al cliente\n6. Informar plazo: 24-48 horas hábiles\n7. Ofrecer confirmación por email\n\n## Tiempo máximo de gestión\n5 minutos para iniciar el proceso de reversión.' },
  { title: 'Manejo de objeciones: el cliente quiere cancelar', description: 'Técnicas avanzadas para retener clientes que solicitan cancelar sus productos o cuentas.', category: 'manejo_objeciones', type: 'guia', readingMinutes: 7, rating: '4.6', views: 943, content: '# Retención de Clientes\n\n## Proceso de retención\n1. Escuchar sin interrumpir el motivo de cancelación\n2. Empatizar genuinamente\n3. Investigar la causa raíz\n4. Ofrecer solución específica al problema\n5. Presentar beneficios que el cliente podría perder\n6. Proponer alternativa antes de procesar la baja\n\n## Frases efectivas\n- "Entiendo su decisión. Antes de procesar, ¿me permite revisar si podemos resolver lo que le molestó?"\n- "Muchos clientes que tuvieron este problema encontraron que..."' },
  { title: 'Checklist de cierre de llamada profesional', description: 'Lista de verificación para asegurar que cada llamada cierre de forma completa y profesional.', category: 'protocolo', type: 'checklist', readingMinutes: 2, rating: '4.4', views: 2300, content: '# Checklist de Cierre de Llamada\n\n## Antes de cerrar\n- [ ] El problema del cliente fue resuelto o escalado correctamente\n- [ ] Se dio número de caso o referencia si aplica\n- [ ] Se informaron los próximos pasos y plazos\n- [ ] Se ofreció asistencia adicional\n\n## Frase de cierre\n"¿Hay algo más en lo que pueda ayudarle hoy?"\n\n## Despedida estándar\n"Fue un placer atenderle. Que tenga un excelente día. Hasta luego."' },
  { title: 'Frases prohibidas en atención al cliente', description: 'Referencia rápida de frases que nunca deben usarse en llamadas y sus alternativas profesionales.', category: 'protocolo', type: 'referencia', readingMinutes: 3, rating: '4.8', views: 3400, content: '# Frases Prohibidas y sus Alternativas\n\n| Frase Prohibida | Alternativa Profesional |\n|---|---|\n| "No sé" | "Permítame verificar esa información" |\n| "No es mi culpa" | "Entiendo la situación, voy a ayudarle" |\n| "Cálmese" | "Entiendo su frustración" |\n| "Eso no es posible" | "Lo que puedo hacer por usted es..." |\n| "Tiene que..." | "Le recomendaría..." |\n| "No puedo hacer nada" | "Lo que está dentro de mis posibilidades es..."' },
  { title: 'Técnicas de venta consultiva en banca', description: 'Metodología para identificar necesidades del cliente y ofrecer productos financieros de forma natural y ética.', category: 'ventas', type: 'guia', readingMinutes: 9, rating: '4.5', views: 1120, content: '# Venta Consultiva Bancaria\n\n## El método SPIN\n- **S**ituación: ¿Cuál es la situación actual del cliente?\n- **P**roblema: ¿Qué necesidad o problema tiene?\n- **I**mplicación: ¿Qué pasa si no resuelve el problema?\n- **N**ecesidad: ¿Cómo nuestro producto resuelve su necesidad?\n\n## Regla de oro\nNunca ofrecer un producto que el cliente no necesita. La confianza a largo plazo vale más que una venta inmediata.' },
  { title: 'Protocolo de casos de fraude y seguridad', description: 'Procedimiento completo para gestionar reportes de fraude, robo de tarjetas y accesos no autorizados.', category: 'protocolo', type: 'procedimiento', readingMinutes: 6, rating: '4.9', views: 1890, content: '# Protocolo de Fraude\n\n## Pasos inmediatos\n1. Verificar identidad del titular\n2. Bloquear tarjeta/cuenta afectada inmediatamente\n3. Registrar reporte en sistema con número de caso\n4. Revisar últimas 24 horas de transacciones\n5. Informar proceso de disputa\n\n## Información al cliente\n- Plazo de investigación: 5-10 días hábiles\n- Proceso de disputa: formulario disponible en app/sucursal\n- Recomendación: hacer denuncia policial\n- Nueva tarjeta: 5-7 días hábiles\n\n## NUNCA\n- Pedir contraseñas o PIN al cliente\n- Confirmar datos sensibles sin verificación previa' },
];

for (const r of resources) {
  await conn.execute(
    `INSERT INTO library_resources (title, description, category, type, readingMinutes, rating, views, content, isActive)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, true)`,
    [r.title, r.description, r.category, r.type, r.readingMinutes, r.rating, r.views, r.content]
  );
}
console.log('✓ Library resources seeded');

await conn.end();
console.log('\n✅ Seed completed successfully!');
