import { useState, useEffect, useRef } from "react";
import { useParams, useLocation } from "wouter";
import TrainingDashboardLayout from "@/components/TrainingDashboardLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { trpc } from "@/lib/trpc";
import { 
  Send, 
  User, 
  Bot, 
  Clock, 
  AlertCircle,
  CheckCircle2,
  XCircle,
  Loader2
} from "lucide-react";
import { toast } from "sonner";

interface Message {
  role: "agent" | "client" | "system";
  content: string;
  timestamp: Date;
}

export default function SimulationSession() {
  const params = useParams();
  const [, navigate] = useLocation();
  const scenarioId = params.scenarioId ? parseInt(params.scenarioId) : null;
  
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputMessage, setInputMessage] = useState("");
  const [simulationId, setSimulationId] = useState<number | null>(null);
  const [isCompleted, setIsCompleted] = useState(false);
  const [elapsedTime, setElapsedTime] = useState(0);
  const [isEvaluating, setIsEvaluating] = useState(false);
  
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  const scenarioQuery = trpc.scenarios.getById.useQuery(
    { id: scenarioId! },
    { enabled: !!scenarioId }
  );
  const startSimulationMutation = trpc.simulations.start.useMutation();
  const sendMessageMutation = trpc.simulations.sendMessage.useMutation();
  const completeSimulationMutation = trpc.simulations.complete.useMutation();

  const scenario = scenarioQuery.data;

  // Start simulation on mount
  useEffect(() => {
    if (scenarioId && !simulationId) {
      startSimulationMutation.mutate(
        { scenarioId },
        {
          onSuccess: (data) => {
            setSimulationId(data.simulationId);
            // Add initial system message
            const clientProfile = scenario ? JSON.parse(scenario.clientProfile) : {};
            setMessages([
              {
                role: "system",
                content: `Simulación iniciada. ${clientProfile.initialContext || "El cliente está esperando tu ayuda."}`,
                timestamp: new Date()
              },
              {
                role: "client",
                content: clientProfile.initialMessage || "Hola, necesito ayuda con mi cuenta.",
                timestamp: new Date()
              }
            ]);
            // Start timer
            timerRef.current = setInterval(() => {
              setElapsedTime(prev => prev + 1);
            }, 1000);
          },
          onError: () => {
            toast.error("Error al iniciar la simulación");
            navigate("/scenarios");
          }
        }
      );
    }
  }, [scenarioId]);

  // Cleanup timer
  useEffect(() => {
    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    };
  }, []);

  // Auto-scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSendMessage = async () => {
    if (!inputMessage.trim() || !simulationId || isCompleted) return;

    const userMessage: Message = {
      role: "agent",
      content: inputMessage,
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    setInputMessage("");

    // Send to backend and get GPT response
    sendMessageMutation.mutate(
      { simulationId, content: inputMessage },
      {
        onSuccess: (data) => {
          // Add client response from GPT
          if (data.clientResponse) {
            const clientResponse: Message = {
              role: "client",
              content: data.clientResponse,
              timestamp: new Date()
            };
            setMessages(prev => [...prev, clientResponse]);
          }
        },
        onError: () => {
          toast.error("Error al enviar mensaje");
        }
      }
    );
  };

  const handleCompleteSimulation = async () => {
    if (!simulationId) return;
    
    setIsEvaluating(true);
    
    // Stop timer
    if (timerRef.current) {
      clearInterval(timerRef.current);
    }

    // Call GPT evaluation
    completeSimulationMutation.mutate(
      { simulationId },
      {
        onSuccess: (data) => {
          setIsCompleted(true);
          setIsEvaluating(false);
          toast.success(`¡Simulación completada! Puntuación: ${data.evaluation.overallScore}%`);
          if (data.evaluation.pointsEarned > 0) {
            toast.success(`+${data.evaluation.pointsEarned} puntos ganados`);
          }
          setTimeout(() => {
            navigate(`/simulations/${simulationId}`);
          }, 2000);
        },
        onError: () => {
          setIsEvaluating(false);
          toast.error("Error al completar la simulación");
        }
      }
    );
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  if (scenarioQuery.isLoading) {
    return (
      <TrainingDashboardLayout>
        <div className="flex items-center justify-center h-screen">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      </TrainingDashboardLayout>
    );
  }

  if (!scenario) {
    return (
      <TrainingDashboardLayout>
        <div className="flex items-center justify-center h-screen">
          <div className="text-center space-y-4">
            <AlertCircle className="w-16 h-16 text-destructive mx-auto" />
            <h2 className="text-2xl font-bold">Escenario no encontrado</h2>
            <Button onClick={() => navigate("/scenarios")}>Volver a Escenarios</Button>
          </div>
        </div>
      </TrainingDashboardLayout>
    );
  }

  return (
    <TrainingDashboardLayout>
      <div className="h-screen flex flex-col">
        {/* Header */}
        <div className="border-b border-border bg-card p-4">
          <div className="container flex items-center justify-between">
            <div>
              <h1 className="text-xl font-bold text-foreground">{scenario.title}</h1>
              <p className="text-sm text-muted-foreground">Simulación en curso</p>
            </div>
            
            <div className="flex items-center gap-6">
              <div className="flex items-center gap-2">
                <Clock className="w-5 h-5 text-muted-foreground" />
                <span className="text-lg font-mono font-semibold text-foreground">
                  {formatTime(elapsedTime)}
                </span>
              </div>
              
              <Badge variant="outline" className="text-sm">
                Nivel {scenario.complexity}
              </Badge>

              {!isCompleted && (
                <Button 
                  variant="destructive" 
                  onClick={handleCompleteSimulation}
                  disabled={isEvaluating || messages.length < 4}
                >
                  {isEvaluating ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Evaluando...
                    </>
                  ) : (
                    "Finalizar Simulación"
                  )}
                </Button>
              )}
            </div>
          </div>
        </div>

        {/* Chat Area */}
        <div className="flex-1 overflow-y-auto bg-background p-6">
          <div className="container max-w-4xl space-y-4">
            {messages.map((message, index) => (
              <div
                key={index}
                className={`flex gap-3 ${
                  message.role === "agent" ? "justify-end" : "justify-start"
                }`}
              >
                {message.role !== "agent" && (
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                    message.role === "client" ? "bg-primary/10" : "bg-muted"
                  }`}>
                    {message.role === "client" ? (
                      <User className="w-5 h-5 text-primary" />
                    ) : (
                      <AlertCircle className="w-5 h-5 text-muted-foreground" />
                    )}
                  </div>
                )}
                
                <div className={`max-w-[70%] ${
                  message.role === "agent" ? "order-first" : ""
                }`}>
                  <div className={`rounded-2xl p-4 ${
                    message.role === "agent"
                      ? "bg-primary text-primary-foreground"
                      : message.role === "client"
                      ? "bg-card border border-border"
                      : "bg-muted"
                  }`}>
                    <p className="text-sm whitespace-pre-wrap">{message.content}</p>
                  </div>
                  <p className="text-xs text-muted-foreground mt-1 px-2">
                    {message.timestamp.toLocaleTimeString("es-PY", { 
                      hour: "2-digit", 
                      minute: "2-digit" 
                    })}
                  </p>
                </div>

                {message.role === "agent" && (
                  <div className="w-10 h-10 rounded-full bg-primary flex items-center justify-center">
                    <Bot className="w-5 h-5 text-primary-foreground" />
                  </div>
                )}
              </div>
            ))}
            
            {isEvaluating && (
              <div className="text-center py-8">
                <Loader2 className="w-12 h-12 animate-spin text-primary mx-auto mb-4" />
                <p className="text-lg font-semibold text-foreground">Evaluando tu desempeño...</p>
                <p className="text-sm text-muted-foreground mt-1">
                  Analizando respuestas y generando feedback personalizado
                </p>
              </div>
            )}
            
            <div ref={messagesEndRef} />
          </div>
        </div>

        {/* Input Area */}
        {!isCompleted && !isEvaluating && (
          <div className="border-t border-border bg-card p-4">
            <div className="container max-w-4xl">
              <div className="flex gap-3">
                <Textarea
                  placeholder="Escribe tu respuesta al cliente..."
                  value={inputMessage}
                  onChange={(e) => setInputMessage(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && !e.shiftKey) {
                      e.preventDefault();
                      handleSendMessage();
                    }
                  }}
                  className="min-h-[60px] resize-none"
                  disabled={isCompleted}
                />
                <Button 
                  size="lg" 
                  onClick={handleSendMessage}
                  disabled={!inputMessage.trim() || isCompleted}
                  className="px-6"
                >
                  <Send className="w-5 h-5" />
                </Button>
              </div>
              <p className="text-xs text-muted-foreground mt-2">
                Presiona Enter para enviar, Shift+Enter para nueva línea
              </p>
            </div>
          </div>
        )}
      </div>
    </TrainingDashboardLayout>
  );
}
