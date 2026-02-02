import mysql from 'mysql2/promise';
import 'dotenv/config';

const scenarios = [
  // INFORMATIVAS (3 adicionales)
  {
    title: "Consulta de Saldo y Movimientos",
    description: "Cliente llama para verificar el saldo actual de su cuenta corriente y revisar los últimos movimientos realizados.",
    category: "informative",
    complexity: 1,
    estimatedDuration: 5,
    clientProfile: JSON.stringify({
      name: "María González",
      age: 35,
      gender: "female",
      personality: "Tranquila y directa",
      initialContext: "Cliente habitual que necesita información rápida sobre su cuenta.",
      initialMessage: "Buen día, necesito saber cuánto saldo tengo en mi cuenta corriente por favor.",
      goals: ["Obtener saldo actual", "Revisar últimos 5 movimientos"],
      concerns: ["Verificar un débito que no reconoce"]
    }),
    evaluationCriteria: JSON.stringify({
      mustProvide: ["Saludo profesional", "Verificación de identidad", "Información de saldo", "Listado de movimientos"],
      mustAvoid: ["Dar información sin verificar identidad", "Ser impaciente"]
    })
  },
  {
    title: "Información sobre Tarjeta de Crédito",
    description: "Cliente consulta sobre límite de crédito disponible, fecha de cierre y opciones de pago mínimo.",
    category: "informative",
    complexity: 2,
    estimatedDuration: 7,
    clientProfile: JSON.stringify({
      name: "Carlos Benítez",
      age: 42,
      gender: "male",
      personality: "Detallista y pregunta mucho",
      initialContext: "Cliente quiere entender mejor su tarjeta de crédito antes de hacer una compra grande.",
      initialMessage: "Hola, quiero saber cuánto tengo disponible en mi tarjeta y cuándo vence el pago.",
      goals: ["Conocer límite disponible", "Entender fecha de cierre", "Opciones de pago"],
      concerns: ["No quiere pagar intereses altos"]
    }),
    evaluationCriteria: JSON.stringify({
      mustProvide: ["Límite total y disponible", "Fecha de cierre y vencimiento", "Explicación clara de opciones de pago"],
      mustAvoid: ["Usar términos técnicos sin explicar", "Apurar al cliente"]
    })
  },
  {
    title: "Consulta de Requisitos para Préstamo Personal",
    description: "Cliente interesado en solicitar un préstamo personal consulta sobre requisitos, tasas y plazos disponibles.",
    category: "informative",
    complexity: 2,
    estimatedDuration: 10,
    clientProfile: JSON.stringify({
      name: "Rosa Martínez",
      age: 29,
      gender: "female",
      personality: "Interesada pero cautelosa",
      initialContext: "Primera vez que considera un préstamo, necesita información clara.",
      initialMessage: "Buenos días, quiero saber qué necesito para sacar un préstamo personal.",
      goals: ["Conocer requisitos", "Entender tasas de interés", "Saber plazos disponibles"],
      concerns: ["No quiere comprometerse si no puede pagar"]
    }),
    evaluationCriteria: JSON.stringify({
      mustProvide: ["Lista clara de requisitos", "Explicación de tasas", "Opciones de plazos", "Proceso de solicitud"],
      mustAvoid: ["Presionar para solicitar ya", "Información incompleta"]
    })
  },

  // TRANSACCIONALES (3 adicionales)
  {
    title: "Transferencia Nacional Urgente",
    description: "Cliente necesita realizar una transferencia bancaria nacional urgente y requiere asistencia para completarla.",
    category: "transactional",
    complexity: 2,
    estimatedDuration: 8,
    clientProfile: JSON.stringify({
      name: "Jorge Acosta",
      age: 38,
      gender: "male",
      personality: "Apurado y algo estresado",
      initialContext: "Necesita enviar dinero urgente a un familiar en otra ciudad.",
      initialMessage: "Necesito hacer una transferencia urgente, ¿me pueden ayudar?",
      goals: ["Completar transferencia", "Confirmar que llegue hoy"],
      concerns: ["Que el dinero llegue rápido", "Comisiones"]
    }),
    evaluationCriteria: JSON.stringify({
      mustProvide: ["Guía paso a paso", "Información de comisiones", "Tiempo estimado", "Número de confirmación"],
      mustAvoid: ["Dar información incorrecta", "No confirmar datos del destinatario"]
    })
  },
  {
    title: "Activación de Tarjeta de Débito Nueva",
    description: "Cliente recibió su tarjeta de débito nueva y necesita activarla para poder usarla.",
    category: "transactional",
    complexity: 1,
    estimatedDuration: 5,
    clientProfile: JSON.stringify({
      name: "Ana López",
      age: 25,
      gender: "female",
      personality: "Amigable y colaboradora",
      initialContext: "Primera tarjeta de débito, necesita ayuda para activarla.",
      initialMessage: "Hola, me llegó mi tarjeta nueva y no sé cómo activarla.",
      goals: ["Activar tarjeta", "Configurar PIN"],
      concerns: ["Que sea seguro", "No equivocarse"]
    }),
    evaluationCriteria: JSON.stringify({
      mustProvide: ["Proceso de activación claro", "Instrucciones para PIN", "Confirmación de activación"],
      mustAvoid: ["Pedir información sensible innecesaria", "Proceso confuso"]
    })
  },
  {
    title: "Cambio de Límite de Tarjeta de Crédito",
    description: "Cliente solicita aumento del límite de su tarjeta de crédito para una compra importante.",
    category: "transactional",
    complexity: 3,
    estimatedDuration: 12,
    clientProfile: JSON.stringify({
      name: "Roberto Silva",
      age: 45,
      gender: "male",
      personality: "Serio y directo",
      initialContext: "Cliente con buen historial quiere aumentar su límite temporalmente.",
      initialMessage: "Necesito aumentar el límite de mi tarjeta para una compra grande.",
      goals: ["Solicitar aumento", "Conocer proceso", "Tiempo de aprobación"],
      concerns: ["Que sea rápido", "Requisitos adicionales"]
    }),
    evaluationCriteria: JSON.stringify({
      mustProvide: ["Explicar proceso de evaluación", "Requisitos necesarios", "Tiempo estimado", "Alternativas"],
      mustAvoid: ["Prometer aprobación", "Desanimar sin evaluar"]
    })
  },

  // FRAUDE (3 adicionales)
  {
    title: "Compras No Reconocidas en Tarjeta",
    description: "Cliente reporta múltiples compras en su tarjeta que no realizó, posible clonación.",
    category: "fraud",
    complexity: 4,
    estimatedDuration: 15,
    clientProfile: JSON.stringify({
      name: "Patricia Rojas",
      age: 52,
      gender: "female",
      personality: "Preocupada y algo alterada",
      initialContext: "Detectó 3 compras online que no hizo en las últimas 24 horas.",
      initialMessage: "¡Ayuda! Hay compras en mi tarjeta que yo no hice, creo que me robaron los datos.",
      goals: ["Bloquear tarjeta", "Recuperar dinero", "Evitar más cargos"],
      concerns: ["Perder su dinero", "Que siga pasando"]
    }),
    evaluationCriteria: JSON.stringify({
      mustProvide: ["Bloqueo inmediato", "Proceso de reclamo", "Tranquilidad", "Pasos de seguridad"],
      mustAvoid: ["Culpar al cliente", "Demorar el bloqueo", "No tomar en serio"]
    })
  },
  {
    title: "Llamada Sospechosa Solicitando Datos",
    description: "Cliente recibió una llamada de alguien haciéndose pasar por el banco solicitando datos personales.",
    category: "fraud",
    complexity: 3,
    estimatedDuration: 10,
    clientProfile: JSON.stringify({
      name: "Miguel Fernández",
      age: 60,
      gender: "male",
      personality: "Confundido y desconfiado",
      initialContext: "Recibió llamada pidiendo su PIN y número de tarjeta, sospecha que es fraude.",
      initialMessage: "Me llamaron diciendo que eran del banco y me pidieron mi PIN, ¿eso es normal?",
      goals: ["Confirmar si era el banco", "Proteger su cuenta", "Saber qué hacer"],
      concerns: ["Ya dio algún dato", "Que le roben"]
    }),
    evaluationCriteria: JSON.stringify({
      mustProvide: ["Confirmar que el banco nunca pide PIN", "Verificar seguridad de cuenta", "Educar sobre phishing"],
      mustAvoid: ["Alarmar innecesariamente", "No verificar la cuenta"]
    })
  },
  {
    title: "Retiro No Autorizado en Cajero",
    description: "Cliente reporta un retiro de efectivo que no realizó, posible skimming en cajero automático.",
    category: "fraud",
    complexity: 4,
    estimatedDuration: 12,
    clientProfile: JSON.stringify({
      name: "Laura Benítez",
      age: 34,
      gender: "female",
      personality: "Molesta y exigente",
      initialContext: "Vio un retiro de 2,000,000 Gs que no hizo, sospecha del cajero que usó ayer.",
      initialMessage: "Hay un retiro en mi cuenta que yo no hice, quiero que me devuelvan mi plata ya.",
      goals: ["Recuperar dinero", "Bloquear tarjeta", "Investigar"],
      concerns: ["Que no le crean", "Perder su dinero"]
    }),
    evaluationCriteria: JSON.stringify({
      mustProvide: ["Bloqueo inmediato", "Proceso de investigación", "Tiempo estimado", "Medidas de seguridad"],
      mustAvoid: ["Prometer devolución inmediata", "Desestimar el reclamo"]
    })
  },

  // LAVADO DE ACTIVOS (3 adicionales)
  {
    title: "Depósitos Frecuentes en Efectivo",
    description: "Cliente realiza depósitos en efectivo muy frecuentes por montos justos debajo del límite de reporte.",
    category: "money_laundering",
    complexity: 5,
    estimatedDuration: 20,
    clientProfile: JSON.stringify({
      name: "Ricardo Vera",
      age: 48,
      gender: "male",
      personality: "Evasivo y nervioso",
      initialContext: "Hace 10-15 depósitos mensuales de montos similares, siempre en efectivo.",
      initialMessage: "Quiero saber por qué me están pidiendo documentos adicionales para mis depósitos.",
      goals: ["Evitar proporcionar documentación", "Seguir depositando"],
      concerns: ["Que investiguen sus fondos", "Bloqueo de cuenta"]
    }),
    evaluationCriteria: JSON.stringify({
      mustProvide: ["Explicar políticas AML", "Solicitar documentación", "Escalar a cumplimiento"],
      mustAvoid: ["Acusar directamente", "Permitir continuar sin verificación"]
    })
  },
  {
    title: "Transferencias Internacionales Inusuales",
    description: "Cliente sin historial de operaciones internacionales comienza a enviar grandes sumas al exterior.",
    category: "money_laundering",
    complexity: 5,
    estimatedDuration: 18,
    clientProfile: JSON.stringify({
      name: "Sandra Méndez",
      age: 55,
      gender: "female",
      personality: "Impaciente y defensiva",
      initialContext: "Cuenta dormida por años, ahora envía USD 50,000 a paraísos fiscales.",
      initialMessage: "¿Por qué me bloquean las transferencias? Es mi dinero y hago lo que quiero.",
      goals: ["Completar transferencias", "Evitar preguntas"],
      concerns: ["Que retengan sus fondos", "Investigación"]
    }),
    evaluationCriteria: JSON.stringify({
      mustProvide: ["Explicar procedimientos KYC", "Solicitar origen de fondos", "Mantener calma profesional"],
      mustAvoid: ["Procesar sin verificar", "Confrontar agresivamente"]
    })
  },
  {
    title: "Estructuración de Transacciones (Smurfing)",
    description: "Múltiples personas depositan pequeñas cantidades en la misma cuenta en el mismo día.",
    category: "money_laundering",
    complexity: 5,
    estimatedDuration: 15,
    clientProfile: JSON.stringify({
      name: "Pedro Ramírez",
      age: 40,
      gender: "male",
      personality: "Tranquilo pero esquivo",
      initialContext: "Su cuenta recibe 20 depósitos pequeños de diferentes personas el mismo día.",
      initialMessage: "Tengo un negocio y mis clientes me pagan así, ¿cuál es el problema?",
      goals: ["Justificar los depósitos", "Continuar operando"],
      concerns: ["Que cierren su cuenta", "Reporte a autoridades"]
    }),
    evaluationCriteria: JSON.stringify({
      mustProvide: ["Solicitar documentación del negocio", "Explicar señales de alerta", "Escalar a cumplimiento"],
      mustAvoid: ["Aceptar explicación sin verificar", "Ignorar patrón sospechoso"]
    })
  },

  // ROBO (3 adicionales)
  {
    title: "Robo de Celular con Banca Móvil",
    description: "Cliente reporta robo de celular donde tenía instalada la app de banca móvil con sesión activa.",
    category: "theft",
    complexity: 4,
    estimatedDuration: 10,
    clientProfile: JSON.stringify({
      name: "Claudia Torres",
      age: 28,
      gender: "female",
      personality: "Asustada y apurada",
      initialContext: "Le robaron el celular hace 30 minutos, teme que accedan a su cuenta.",
      initialMessage: "¡Me robaron el celular con la app del banco abierta! ¡Bloqueen todo por favor!",
      goals: ["Bloquear acceso a la app", "Proteger su dinero", "Cambiar claves"],
      concerns: ["Que le roben todo", "Transacciones no autorizadas"]
    }),
    evaluationCriteria: JSON.stringify({
      mustProvide: ["Bloqueo inmediato de app", "Desactivación de sesiones", "Cambio de contraseñas", "Monitoreo de cuenta"],
      mustAvoid: ["Demorar el bloqueo", "Proceso complicado"]
    })
  },
  {
    title: "Robo de Chequera y Documentos",
    description: "Cliente reporta robo de chequera junto con documentos de identidad, riesgo de falsificación.",
    category: "theft",
    complexity: 4,
    estimatedDuration: 12,
    clientProfile: JSON.stringify({
      name: "Fernando Gómez",
      age: 55,
      gender: "male",
      personality: "Preocupado y metódico",
      initialContext: "Le robaron el auto con su chequera y cédula dentro.",
      initialMessage: "Me robaron la chequera y mi cédula, necesito bloquear los cheques urgente.",
      goals: ["Bloquear chequera", "Evitar uso fraudulento", "Obtener nueva chequera"],
      concerns: ["Que falsifiquen cheques", "Responsabilidad por cheques falsos"]
    }),
    evaluationCriteria: JSON.stringify({
      mustProvide: ["Bloqueo de chequera", "Alerta en sistema", "Proceso de denuncia", "Nueva chequera"],
      mustAvoid: ["No documentar números de cheques", "Demorar el bloqueo"]
    })
  },
  {
    title: "Robo de Tarjeta en Cajero Automático",
    description: "Cliente reporta que su tarjeta fue retenida por el cajero y cuando volvió ya no estaba.",
    category: "theft",
    complexity: 3,
    estimatedDuration: 8,
    clientProfile: JSON.stringify({
      name: "Gabriela Núñez",
      age: 42,
      gender: "female",
      personality: "Molesta y desconfiada",
      initialContext: "El cajero retuvo su tarjeta, fue a buscar ayuda y cuando volvió ya no estaba.",
      initialMessage: "El cajero se tragó mi tarjeta y cuando volví ya no estaba, alguien se la llevó.",
      goals: ["Bloquear tarjeta", "Verificar si hubo retiros", "Nueva tarjeta"],
      concerns: ["Que hayan usado su tarjeta", "Seguridad del cajero"]
    }),
    evaluationCriteria: JSON.stringify({
      mustProvide: ["Bloqueo inmediato", "Verificación de movimientos", "Reporte de incidente", "Nueva tarjeta"],
      mustAvoid: ["Culpar al cliente", "No verificar el cajero"]
    })
  },

  // RECLAMOS (3 adicionales)
  {
    title: "Cobro Indebido de Comisión",
    description: "Cliente reclama por una comisión que considera injusta o que no le fue informada previamente.",
    category: "complaint",
    complexity: 3,
    estimatedDuration: 10,
    clientProfile: JSON.stringify({
      name: "Marcos Villalba",
      age: 38,
      gender: "male",
      personality: "Molesto pero razonable",
      initialContext: "Le cobraron comisión por mantenimiento que dice no conocer.",
      initialMessage: "Me cobraron 50 mil guaraníes de comisión y nadie me avisó, quiero que me devuelvan.",
      goals: ["Entender el cargo", "Solicitar devolución", "Evitar futuros cargos"],
      concerns: ["Que le sigan cobrando", "Falta de transparencia"]
    }),
    evaluationCriteria: JSON.stringify({
      mustProvide: ["Explicación del cargo", "Verificar si fue informado", "Proceso de reclamo", "Opciones"],
      mustAvoid: ["Ser defensivo", "No revisar el caso"]
    })
  },
  {
    title: "Demora en Acreditación de Depósito",
    description: "Cliente reclama porque un depósito realizado hace 48 horas aún no se refleja en su cuenta.",
    category: "complaint",
    complexity: 3,
    estimatedDuration: 12,
    clientProfile: JSON.stringify({
      name: "Beatriz Cáceres",
      age: 50,
      gender: "female",
      personality: "Preocupada y insistente",
      initialContext: "Depositó dinero para pagar una deuda y aún no aparece.",
      initialMessage: "Deposité hace dos días y todavía no veo la plata en mi cuenta, ¿qué pasó?",
      goals: ["Ubicar el depósito", "Acreditar urgente", "Evitar mora en su pago"],
      concerns: ["Que se pierda el dinero", "Intereses por mora"]
    }),
    evaluationCriteria: JSON.stringify({
      mustProvide: ["Investigar el depósito", "Tiempo estimado de resolución", "Seguimiento", "Comprobante"],
      mustAvoid: ["Culpar al cliente", "No dar seguimiento"]
    })
  },
  {
    title: "Mal Servicio en Sucursal",
    description: "Cliente reclama por mala atención recibida en sucursal, quiere que se tome acción.",
    category: "complaint",
    complexity: 2,
    estimatedDuration: 8,
    clientProfile: JSON.stringify({
      name: "Alberto Duarte",
      age: 62,
      gender: "male",
      personality: "Indignado pero educado",
      initialContext: "Fue mal atendido en sucursal, le hicieron esperar mucho y fueron descorteses.",
      initialMessage: "Quiero hacer un reclamo formal por la mala atención que recibí en la sucursal del centro.",
      goals: ["Registrar queja", "Que se tome acción", "Disculpa"],
      concerns: ["Que no le tomen en serio", "Que siga pasando"]
    }),
    evaluationCriteria: JSON.stringify({
      mustProvide: ["Escuchar activamente", "Registrar queja", "Disculpa sincera", "Seguimiento"],
      mustAvoid: ["Defender al empleado sin escuchar", "Minimizar el problema"]
    })
  },

  // CRÉDITO (3 adicionales)
  {
    title: "Refinanciación de Préstamo Personal",
    description: "Cliente con dificultades de pago solicita refinanciar su préstamo personal para reducir cuota mensual.",
    category: "credit",
    complexity: 4,
    estimatedDuration: 15,
    clientProfile: JSON.stringify({
      name: "Sofía Paredes",
      age: 36,
      gender: "female",
      personality: "Preocupada y honesta",
      initialContext: "Perdió parte de sus ingresos y no puede pagar la cuota actual.",
      initialMessage: "Necesito refinanciar mi préstamo porque no puedo pagar la cuota que tengo ahora.",
      goals: ["Reducir cuota mensual", "Evitar mora", "Mantener buen historial"],
      concerns: ["Que le nieguen", "Que empeore su situación"]
    }),
    evaluationCriteria: JSON.stringify({
      mustProvide: ["Opciones de refinanciación", "Simulación de nuevas cuotas", "Requisitos", "Proceso"],
      mustAvoid: ["Juzgar la situación", "Desanimar sin evaluar"]
    })
  },
  {
    title: "Consulta de Historial Crediticio",
    description: "Cliente quiere conocer su historial crediticio antes de solicitar un préstamo hipotecario.",
    category: "credit",
    complexity: 2,
    estimatedDuration: 10,
    clientProfile: JSON.stringify({
      name: "Daniel Escobar",
      age: 40,
      gender: "male",
      personality: "Organizado y previsor",
      initialContext: "Planea comprar casa y quiere asegurarse de que su historial esté limpio.",
      initialMessage: "Quiero saber cómo está mi historial crediticio antes de pedir un préstamo para casa.",
      goals: ["Conocer su score", "Ver si tiene deudas pendientes", "Mejorar si es necesario"],
      concerns: ["Que tenga problemas que desconoce", "Que le nieguen el préstamo"]
    }),
    evaluationCriteria: JSON.stringify({
      mustProvide: ["Explicar cómo consultar", "Información sobre score", "Cómo mejorar historial"],
      mustAvoid: ["Dar información de otros clientes", "Proceso complicado"]
    })
  },
  {
    title: "Pago Anticipado de Préstamo",
    description: "Cliente quiere pagar su préstamo antes de tiempo y consulta sobre penalidades y proceso.",
    category: "credit",
    complexity: 3,
    estimatedDuration: 12,
    clientProfile: JSON.stringify({
      name: "Ramón Ortiz",
      age: 45,
      gender: "male",
      personality: "Decidido y directo",
      initialContext: "Recibió dinero extra y quiere cancelar su préstamo para ahorrar intereses.",
      initialMessage: "Quiero pagar todo mi préstamo ahora, ¿hay alguna penalidad por pago anticipado?",
      goals: ["Cancelar préstamo", "Saber penalidades", "Calcular monto total"],
      concerns: ["Que le cobren mucho por anticipar", "Proceso complicado"]
    }),
    evaluationCriteria: JSON.stringify({
      mustProvide: ["Política de pago anticipado", "Cálculo de monto", "Proceso de cancelación", "Beneficios"],
      mustAvoid: ["Desalentar el pago anticipado", "Información incorrecta"]
    })
  },

  // CANALES DIGITALES (3 adicionales)
  {
    title: "Problemas con Banca Móvil - No Carga",
    description: "Cliente no puede acceder a la app de banca móvil, se queda en pantalla de carga.",
    category: "digital_channels",
    complexity: 2,
    estimatedDuration: 8,
    clientProfile: JSON.stringify({
      name: "Lucía Martínez",
      age: 32,
      gender: "female",
      personality: "Impaciente y frustrada",
      initialContext: "Necesita hacer una transferencia urgente y la app no funciona.",
      initialMessage: "La app no me deja entrar, se queda cargando y necesito hacer una transferencia ya.",
      goals: ["Resolver problema de app", "Hacer la transferencia", "Alternativas"],
      concerns: ["Perder tiempo", "No poder hacer su operación"]
    }),
    evaluationCriteria: JSON.stringify({
      mustProvide: ["Soluciones técnicas", "Alternativas (web, sucursal)", "Asistencia para transferencia"],
      mustAvoid: ["Culpar al celular del cliente", "No ofrecer alternativas"]
    })
  },
  {
    title: "Registro en Banca por Internet",
    description: "Cliente quiere registrarse en la banca por internet pero no puede completar el proceso.",
    category: "digital_channels",
    complexity: 2,
    estimatedDuration: 10,
    clientProfile: JSON.stringify({
      name: "Héctor Benítez",
      age: 58,
      gender: "male",
      personality: "Paciente pero poco tecnológico",
      initialContext: "Primera vez usando banca digital, necesita ayuda paso a paso.",
      initialMessage: "Quiero registrarme en la página del banco pero no entiendo cómo hacerlo.",
      goals: ["Completar registro", "Configurar usuario y clave", "Aprender a usar"],
      concerns: ["Equivocarse", "Seguridad de sus datos"]
    }),
    evaluationCriteria: JSON.stringify({
      mustProvide: ["Guía paso a paso", "Consejos de seguridad", "Paciencia", "Confirmación de registro"],
      mustAvoid: ["Usar términos técnicos", "Apurar al cliente", "Asumir conocimientos"]
    })
  },
  {
    title: "Token Digital No Funciona",
    description: "Cliente no puede generar token digital para autorizar transacciones, le da error.",
    category: "digital_channels",
    complexity: 3,
    estimatedDuration: 12,
    clientProfile: JSON.stringify({
      name: "Verónica Silva",
      age: 40,
      gender: "female",
      personality: "Ansiosa y detallista",
      initialContext: "Necesita autorizar una transferencia grande y el token no se genera.",
      initialMessage: "El token no me llega y necesito autorizar una transferencia importante, ¿qué hago?",
      goals: ["Generar token", "Completar transacción", "Evitar que vuelva a pasar"],
      concerns: ["Seguridad de la operación", "Que expire el tiempo"]
    }),
    evaluationCriteria: JSON.stringify({
      mustProvide: ["Diagnóstico del problema", "Solución alternativa", "Regeneración de token", "Verificación"],
      mustAvoid: ["Proceso inseguro", "No verificar identidad"]
    })
  }
];

async function seedScenarios() {
  const connection = await mysql.createConnection(process.env.DATABASE_URL);
  
  try {
    console.log('🌱 Agregando escenarios adicionales...\n');
    
    for (const scenario of scenarios) {
      await connection.execute(
        `INSERT INTO scenarios (title, description, category, complexity, estimatedDuration, systemPrompt, clientProfile, evaluationCriteria, isActive, createdAt, updatedAt)
         VALUES (?, ?, ?, ?, ?, '', ?, ?, 1, NOW(), NOW())`,
        [
          scenario.title,
          scenario.description,
          scenario.category,
          scenario.complexity,
          scenario.estimatedDuration,
          scenario.clientProfile,
          scenario.evaluationCriteria
        ]
      );
      console.log(`✅ ${scenario.title} (${scenario.category})`);
    }
    
    console.log(`\n✨ ${scenarios.length} escenarios agregados exitosamente!`);
    
    // Mostrar resumen
    const [summary] = await connection.query(
      'SELECT category, COUNT(*) as count FROM scenarios GROUP BY category ORDER BY category'
    );
    console.log('\n📊 Resumen por categoría:');
    summary.forEach(row => {
      console.log(`  ${row.category}: ${row.count} escenarios`);
    });
    
  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await connection.end();
  }
}

seedScenarios();
