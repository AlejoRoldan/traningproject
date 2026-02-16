import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { CheckCircle2, MessageSquare, TrendingUp, Award } from "lucide-react";

export default function CasosModelo() {
  const [selectedCase, setSelectedCase] = useState("caso-10127833");

  const casosModelo = [
    {
      id: "caso-10127833",
      numero: "10127833",
      agente: "Tamara Fernanda B",
      canal: "Chatbot - Messaging Channel",
      categoria: "Gestión de Servicios Financieros",
      tema: "Cancelación de Tarjeta de Crédito",
      estado: "Resuelto Exitosamente",
      puntuacion: 95,
      duracion: "28 minutos",
      valores: ["Empatía", "Investigación", "Claridad", "Seguimiento"],
      descripcion: "Excelente gestión de conflicto financiero con investigación detallada y explicación clara de cargos.",
      pasos: [
        {
          titulo: "Saludo Personalizado",
          descripcion: "¡Buen día, Karina! 👋 Un gusto saludarte.",
          valor: "Empatía",
          aprendizaje: "Personalizar el saludo con el nombre del cliente genera confianza inmediata"
        },
        {
          titulo: "Escucha Activa",
          descripcion: "Identificó la solicitud específica: cancelación de tarjeta de crédito",
          valor: "Investigación",
          aprendizaje: "Escuchar sin interrumpir y confirmar la necesidad del cliente es fundamental"
        },
        {
          titulo: "Investigación Detallada",
          descripcion: "Verificó movimientos específicos (pagos del 24-25 de noviembre, cargo por mantenimiento)",
          valor: "Investigación",
          aprendizaje: "Revisar el historial detallado permite explicar cargos con precisión"
        },
        {
          titulo: "Explicación Clara",
          descripcion: "Detalló los motivos del cargo por mantenimiento mensual y su política",
          valor: "Claridad",
          aprendizaje: "Explicar políticas de forma clara reduce frustración del cliente"
        },
        {
          titulo: "Confirmación de Datos",
          descripcion: "Solicitó verificación de correo para proceder con la solicitud",
          valor: "Claridad",
          aprendizaje: "Confirmar datos antes de proceder evita errores y genera confianza"
        },
        {
          titulo: "Derivación Efectiva",
          descripcion: "Derivó el caso al área correspondiente con promesa de seguimiento",
          valor: "Seguimiento",
          aprendizaje: "Informar al cliente sobre el siguiente paso mantiene la transparencia"
        },
        {
          titulo: "Cierre Empático",
          descripcion: "Apreciamos mucho tu paciencia y comprensión en este proceso",
          valor: "Empatía",
          aprendizaje: "Cerrar con gratitud refuerza la relación con el cliente"
        }
      ]
    }
  ];

  const caso = casosModelo.find(c => c.id === selectedCase);

  if (!caso) return null;

  return (
    <div className="min-h-screen bg-background p-4 md:p-8">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-foreground mb-2">Casos Modelo</h1>
          <p className="text-lg text-muted-foreground">
            Ejemplos reales de excelencia en gestión de casos de Kaitel
          </p>
        </div>

        {/* Selector de Casos */}
        <div className="mb-8 grid grid-cols-1 md:grid-cols-3 gap-4">
          {casosModelo.map((c) => (
            <Card
              key={c.id}
              className={`cursor-pointer transition-all ${
                selectedCase === c.id
                  ? "border-primary bg-primary/5"
                  : "hover:border-primary/50"
              }`}
              onClick={() => setSelectedCase(c.id)}
            >
              <CardHeader>
                <CardTitle className="text-lg">Caso {c.numero}</CardTitle>
                <CardDescription>{c.tema}</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">Puntuación:</span>
                    <Badge variant="default">{c.puntuacion}%</Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">Agente:</span>
                    <span className="text-sm font-medium">{c.agente}</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Detalles del Caso */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Información General */}
          <div className="lg:col-span-1">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Información General</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <p className="text-sm text-muted-foreground mb-1">Número de Caso</p>
                  <p className="font-semibold">{caso.numero}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground mb-1">Agente</p>
                  <p className="font-semibold">{caso.agente}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground mb-1">Canal</p>
                  <p className="font-semibold text-sm">{caso.canal}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground mb-1">Categoría</p>
                  <p className="font-semibold text-sm">{caso.categoria}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground mb-1">Duración</p>
                  <p className="font-semibold">{caso.duracion}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground mb-2">Puntuación</p>
                  <div className="flex items-center gap-2">
                    <div className="flex-1 bg-muted rounded-full h-2">
                      <div
                        className="bg-primary h-2 rounded-full"
                        style={{ width: `${caso.puntuacion}%` }}
                      />
                    </div>
                    <span className="font-bold text-primary">{caso.puntuacion}%</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Valores Demostrados */}
            <Card className="mt-4">
              <CardHeader>
                <CardTitle className="text-lg">Valores Demostrados</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex flex-wrap gap-2">
                  {caso.valores.map((valor) => (
                    <Badge key={valor} variant="secondary">
                      {valor}
                    </Badge>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Desglose de Pasos */}
          <div className="lg:col-span-2">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Desglose de Buenas Prácticas</CardTitle>
                <CardDescription>
                  Análisis detallado de cada paso y su alineación con valores corporativos
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Tabs defaultValue="paso-0" className="w-full">
                  <TabsList className="grid w-full grid-cols-4 lg:grid-cols-7 mb-4">
                    {caso.pasos.map((_, idx) => (
                      <TabsTrigger
                        key={`paso-${idx}`}
                        value={`paso-${idx}`}
                        className="text-xs"
                      >
                        {idx + 1}
                      </TabsTrigger>
                    ))}
                  </TabsList>

                  {caso.pasos.map((paso, idx) => (
                    <TabsContent key={`paso-${idx}`} value={`paso-${idx}`}>
                      <div className="space-y-4">
                        <div>
                          <div className="flex items-center gap-2 mb-2">
                            <CheckCircle2 className="w-5 h-5 text-primary" />
                            <h3 className="font-semibold text-lg">{paso.titulo}</h3>
                          </div>
                          <Badge className="mb-3">{paso.valor}</Badge>
                        </div>

                        <div className="bg-muted p-4 rounded-lg">
                          <p className="text-sm italic text-foreground">
                            "{paso.descripcion}"
                          </p>
                        </div>

                        <div className="bg-primary/5 p-4 rounded-lg border border-primary/20">
                          <div className="flex gap-2 mb-2">
                            <Award className="w-5 h-5 text-primary flex-shrink-0 mt-0.5" />
                            <div>
                              <p className="font-semibold text-sm text-primary mb-1">
                                Aprendizaje Clave
                              </p>
                              <p className="text-sm text-foreground">
                                {paso.aprendizaje}
                              </p>
                            </div>
                          </div>
                        </div>
                      </div>
                    </TabsContent>
                  ))}
                </Tabs>
              </CardContent>
            </Card>

            {/* Resumen */}
            <Card className="mt-4">
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <TrendingUp className="w-5 h-5" />
                  Resumen de Excelencia
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-foreground mb-4">{caso.descripcion}</p>
                <div className="space-y-3">
                  <div className="flex items-start gap-3">
                    <MessageSquare className="w-5 h-5 text-primary flex-shrink-0 mt-0.5" />
                    <div>
                      <p className="font-semibold text-sm">Comunicación Empática</p>
                      <p className="text-sm text-muted-foreground">
                        Uso de saludos personalizados y cierre empático que generan conexión
                      </p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <CheckCircle2 className="w-5 h-5 text-primary flex-shrink-0 mt-0.5" />
                    <div>
                      <p className="font-semibold text-sm">Resolución Efectiva</p>
                      <p className="text-sm text-muted-foreground">
                        Investigación detallada que permite explicar políticas con claridad
                      </p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <Award className="w-5 h-5 text-primary flex-shrink-0 mt-0.5" />
                    <div>
                      <p className="font-semibold text-sm">Seguimiento Profesional</p>
                      <p className="text-sm text-muted-foreground">
                        Derivación clara con promesa de retorno mantiene la confianza
                      </p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Llamada a Acción */}
        <Card className="mt-8 bg-primary/5 border-primary/20">
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="flex-1">
                <h3 className="font-semibold text-lg mb-2">Aprende de los Mejores</h3>
                <p className="text-sm text-muted-foreground">
                  Estudia estos casos modelo y aplica sus técnicas en tus simulaciones.
                  Los agentes que demuestran estas prácticas reciben puntuaciones más altas
                  y planes de coaching personalizados.
                </p>
              </div>
              <TrendingUp className="w-12 h-12 text-primary flex-shrink-0" />
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
