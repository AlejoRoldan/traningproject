import { drizzle } from 'drizzle-orm/mysql2';
import mysql from 'mysql2/promise';
import * as schema from './drizzle/schema.ts';

const connection = await mysql.createConnection(process.env.DATABASE_URL);
const db = drizzle(connection, { schema, mode: 'default' });

const responseTemplates = [
  // INFORMATIVE - Opening
  {
    category: 'informative',
    type: 'opening',
    title: 'Saludo profesional y verificación de identidad',
    content: 'Buenos días/tardes, mi nombre es [Nombre]. Gracias por comunicarse con [Banco]. Para poder asistirle de manera segura, ¿podría proporcionarme su número de documento de identidad?',
    context: 'Usar al inicio de cualquier consulta informativa para establecer protocolo de seguridad',
    tags: JSON.stringify(['saludo', 'verificación', 'protocolo']),
    complexity: 1
  },
  {
    category: 'informative',
    type: 'development',
    title: 'Proporcionar información de saldo',
    content: 'Perfecto, he verificado su cuenta. Su saldo actual es de $[monto]. Los últimos movimientos registrados son: [detalles]. ¿Necesita información adicional sobre alguna transacción específica?',
    context: 'Después de verificar identidad, proporcionar información clara y completa',
    tags: JSON.stringify(['saldo', 'movimientos', 'claridad']),
    complexity: 1
  },
  {
    category: 'informative',
    type: 'closing',
    title: 'Cierre con confirmación de satisfacción',
    content: '¿Hay algo más en lo que pueda asistirle hoy? ... Perfecto. Gracias por comunicarse con nosotros. Que tenga un excelente día.',
    context: 'Cerrar consultas informativas asegurando satisfacción del cliente',
    tags: JSON.stringify(['cierre', 'satisfacción', 'cortesía']),
    complexity: 1
  },

  // TRANSACTIONAL - Opening
  {
    category: 'transactional',
    type: 'opening',
    title: 'Apertura para transacciones',
    content: 'Buenos días/tardes. Entiendo que desea realizar una [tipo de transacción]. Con gusto le asisto. Para proceder de manera segura, necesito verificar su identidad. ¿Podría proporcionarme su número de documento?',
    context: 'Inicio de cualquier proceso transaccional',
    tags: JSON.stringify(['transacción', 'verificación', 'seguridad']),
    complexity: 2
  },
  {
    category: 'transactional',
    type: 'development',
    title: 'Guía paso a paso para transacción',
    content: 'Perfecto. Voy a guiarle en el proceso paso a paso. Primero, necesito que me confirme: 1) El monto exacto, 2) La cuenta de destino, 3) El concepto del pago. ¿Tiene esta información a mano?',
    context: 'Durante el proceso de una transacción, asegurar claridad',
    tags: JSON.stringify(['guía', 'paso a paso', 'confirmación']),
    complexity: 2
  },
  {
    category: 'transactional',
    type: 'protocol',
    title: 'Confirmación de datos antes de ejecutar',
    content: 'Antes de procesar la transacción, permítame confirmar los datos: Monto: $[monto], Cuenta destino: [cuenta], Concepto: [concepto]. ¿Es correcto? Una vez confirmado, la operación no podrá revertirse.',
    context: 'Antes de ejecutar cualquier transacción, confirmar todos los detalles',
    tags: JSON.stringify(['confirmación', 'seguridad', 'irreversible']),
    complexity: 2
  },

  // FRAUD - Opening
  {
    category: 'fraud',
    type: 'opening',
    title: 'Respuesta inmediata a reporte de fraude',
    content: 'Entiendo su preocupación y tomaremos acción inmediata. Su seguridad es nuestra prioridad. Voy a iniciar el protocolo de seguridad ahora mismo. ¿Los cargos no reconocidos ya fueron realizados o solo recibió una solicitud sospechosa?',
    context: 'Primera respuesta ante reporte de fraude, transmitir urgencia y control',
    tags: JSON.stringify(['fraude', 'urgencia', 'seguridad']),
    complexity: 3
  },
  {
    category: 'fraud',
    type: 'protocol',
    title: 'Bloqueo preventivo de tarjeta',
    content: 'Por seguridad, voy a proceder con el bloqueo inmediato de su tarjeta para evitar cargos adicionales. Esto toma efecto en este momento. Luego iniciaremos la investigación de los cargos no reconocidos. ¿Está de acuerdo?',
    context: 'Acción inmediata para prevenir más daño',
    tags: JSON.stringify(['bloqueo', 'prevención', 'protocolo']),
    complexity: 3
  },
  {
    category: 'fraud',
    type: 'empathy',
    title: 'Empatía en situación de fraude',
    content: 'Comprendo que esta situación es muy estresante. Quiero asegurarle que estamos aquí para ayudarle y que tomaremos todas las medidas necesarias para resolver esto. No está solo en este proceso.',
    context: 'Mostrar empatía genuina mientras se mantiene profesionalismo',
    tags: JSON.stringify(['empatía', 'tranquilidad', 'apoyo']),
    complexity: 3
  },

  // COMPLAINT - Opening
  {
    category: 'complaint',
    type: 'opening',
    title: 'Apertura empática ante reclamo',
    content: 'Lamento mucho escuchar sobre su experiencia. Entiendo su frustración y quiero ayudarle a resolver esta situación. ¿Podría contarme con detalle qué sucedió para poder asistirle de la mejor manera?',
    context: 'Inicio de gestión de reclamo, validar emoción del cliente',
    tags: JSON.stringify(['reclamo', 'empatía', 'escucha activa']),
    complexity: 2
  },
  {
    category: 'complaint',
    type: 'objection_handling',
    title: 'Manejo de objeción con validación',
    content: 'Entiendo completamente su punto de vista y tiene razón en sentirse [emoción]. Permítame revisar qué podemos hacer para solucionar esto. ¿Le parece si exploramos juntos las opciones disponibles?',
    context: 'Cuando el cliente expresa desacuerdo o frustración',
    tags: JSON.stringify(['validación', 'solución', 'colaboración']),
    complexity: 3
  },
  {
    category: 'complaint',
    type: 'closing',
    title: 'Cierre con seguimiento de reclamo',
    content: 'He registrado su reclamo con el número [número]. Recibirá una respuesta en un máximo de [plazo] días hábiles. ¿Hay algo más en lo que pueda asistirle? Nuevamente, lamento las molestias ocasionadas.',
    context: 'Cerrar reclamo asegurando seguimiento',
    tags: JSON.stringify(['seguimiento', 'registro', 'disculpa']),
    complexity: 2
  },

  // CREDIT - Opening
  {
    category: 'credit',
    type: 'opening',
    title: 'Consulta sobre productos crediticios',
    content: 'Con gusto le asesoro sobre nuestras opciones de crédito. Para poder ofrecerle las mejores alternativas según su perfil, ¿podría contarme cuál es el monto aproximado que necesita y el plazo en el que desearía pagarlo?',
    context: 'Inicio de asesoramiento crediticio',
    tags: JSON.stringify(['crédito', 'asesoramiento', 'necesidades']),
    complexity: 2
  },
  {
    category: 'credit',
    type: 'development',
    title: 'Explicación de condiciones crediticias',
    content: 'Basado en su perfil, tenemos las siguientes opciones: [opciones]. La tasa de interés es del [%], el plazo puede ser de [meses/años], y la cuota mensual aproximada sería de $[monto]. ¿Alguna de estas opciones se ajusta a lo que busca?',
    context: 'Presentar opciones de crédito de forma clara',
    tags: JSON.stringify(['opciones', 'tasas', 'claridad']),
    complexity: 3
  },

  // DIGITAL_CHANNELS - Opening
  {
    category: 'digital_channels',
    type: 'opening',
    title: 'Soporte técnico para banca digital',
    content: 'Entiendo que está teniendo dificultades con [canal digital]. Con gusto le ayudo a resolverlo. Para poder asistirle mejor, ¿podría decirme qué mensaje de error aparece o qué sucede exactamente cuando intenta [acción]?',
    context: 'Inicio de soporte técnico para canales digitales',
    tags: JSON.stringify(['soporte técnico', 'digital', 'diagnóstico']),
    complexity: 2
  },
  {
    category: 'digital_channels',
    type: 'development',
    title: 'Guía paso a paso para solución técnica',
    content: 'Vamos a resolver esto juntos. Le voy a guiar paso a paso. Primero, ¿podría verificar si tiene la última versión de la aplicación instalada? Puede verificarlo en [ubicación]. Mientras tanto, yo reviso su cuenta desde mi sistema.',
    context: 'Resolución técnica con paciencia didáctica',
    tags: JSON.stringify(['guía', 'paciencia', 'solución']),
    complexity: 2
  },

  // MONEY_LAUNDERING - Protocol
  {
    category: 'money_laundering',
    type: 'protocol',
    title: 'Solicitud de información adicional (protocolo AML)',
    content: 'Para procesar su solicitud, necesito solicitarle información adicional según nuestros protocolos de cumplimiento. ¿Podría indicarme el origen de los fondos y el propósito de esta transacción?',
    context: 'Cuando se detectan patrones inusuales que requieren verificación',
    tags: JSON.stringify(['AML', 'cumplimiento', 'verificación']),
    complexity: 4
  },
  {
    category: 'money_laundering',
    type: 'protocol',
    title: 'Escalamiento a área de cumplimiento',
    content: 'Entiendo. Para proceder con esta operación, necesito que un especialista de nuestro área de cumplimiento revise la documentación. Esto es un procedimiento estándar para transacciones de este tipo. ¿Podría proporcionarme [documentos necesarios]?',
    context: 'Cuando se requiere escalamiento sin alarmar al cliente',
    tags: JSON.stringify(['escalamiento', 'cumplimiento', 'documentación']),
    complexity: 5
  },

  // THEFT - Opening
  {
    category: 'theft',
    type: 'opening',
    title: 'Respuesta inmediata a reporte de robo',
    content: 'Lamento mucho lo sucedido. Vamos a tomar acción inmediata para proteger sus cuentas. Primero, voy a proceder con el bloqueo de [tarjeta/cuenta/acceso digital] en este momento para evitar uso no autorizado. ¿Tiene acceso a otro medio de pago mientras resolvemos esto?',
    context: 'Primera respuesta ante robo, acción inmediata',
    tags: JSON.stringify(['robo', 'bloqueo', 'urgencia']),
    complexity: 3
  },
  {
    category: 'theft',
    type: 'protocol',
    title: 'Recopilación de información para denuncia',
    content: 'Para proceder con la investigación, necesito que me proporcione: 1) Fecha y hora aproximada del robo, 2) Lugar donde ocurrió, 3) Si ya realizó la denuncia policial. Esta información es fundamental para el proceso.',
    context: 'Recopilar información necesaria para investigación',
    tags: JSON.stringify(['investigación', 'denuncia', 'información']),
    complexity: 3
  },
  {
    category: 'theft',
    type: 'empathy',
    title: 'Apoyo emocional en caso de robo',
    content: 'Entiendo que esta es una situación muy difícil. Quiero que sepa que estamos tomando todas las medidas necesarias para proteger sus fondos y que lo acompañaremos en todo el proceso de resolución.',
    context: 'Brindar contención emocional en situación de robo',
    tags: JSON.stringify(['empatía', 'contención', 'apoyo']),
    complexity: 3
  },
];

console.log('Insertando respuestas modelo...');
for (const template of responseTemplates) {
  await db.insert(schema.responseTemplates).values(template);
}

console.log(`✅ ${responseTemplates.length} respuestas modelo insertadas correctamente`);
await connection.end();
