import { useState, useRef, useEffect } from "react";
import { useLocation, useParams } from "wouter";
import { trpc } from "@/lib/trpc";
import {
  Send, StopCircle, ArrowLeft, Clock, User, Bot,
  CheckCircle2, XCircle, AlertTriangle, Loader2, Dumbbell, Zap
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import {
  DifficultyBadge, CategoryBadge, ScoreCircle, ScoreBar,
  BadgeIcon, XPBadge, TypingIndicator
} from "@/components/KaitelComponents";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { Link } from "wouter";

type Phase = "preview" | "simulation" | "results";

export default function SimulationSession() {
  const params = useParams<{ id: string }>();
  const [, navigate] = useLocation();
  const scenarioId = parseInt(params.id ?? "0");
  const isPracticeMode = new URLSearchParams(window.location.search).get("practice") === "true";

  const [phase, setPhase] = useState<Phase>("preview");
  const [sessionId, setSessionId] = useState<number | null>(null);
  const [message, setMessage] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const [messages, setMessages] = useState<{ role: "agent" | "client"; content: string }[]>([]);
  const [evaluation, setEvaluation] = useState<any>(null);
  const [newBadges, setNewBadges] = useState<any[]>([]);
  const [xpEarned, setXpEarned] = useState(0);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const { data: scenario, isLoading: scenarioLoading } = trpc.scenarios.byId.useQuery(
    { id: scenarioId },
    { enabled: scenarioId > 0 }
  );

  const startMutation = trpc.simulations.start.useMutation({
    onSuccess: (data) => {
      setSessionId(data.session.id);
      setMessages([{ role: "client", content: scenario?.initialMessage ?? "" }]);
      setPhase("simulation");
      timerRef.current = setInterval(() => setElapsedSeconds(s => s + 1), 1000);
    },
    onError: (err) => toast.error(err.message),
  });

  const sendMutation = trpc.simulations.sendMessage.useMutation({
    onMutate: () => setIsTyping(true),
    onSuccess: (data) => {
      setMessages(prev => [
        ...prev,
        { role: "agent", content: data.agentMessage },
        { role: "client", content: data.clientMessage },
      ]);
      setIsTyping(false);
    },
    onError: (err) => {
      setIsTyping(false);
      toast.error(err.message);
    },
  });

  const completeMutation = trpc.simulations.complete.useMutation({
    onSuccess: (data) => {
      if (timerRef.current) clearInterval(timerRef.current);
      setEvaluation(data.evaluation);
      setNewBadges(data.newBadges ?? []);
      setXpEarned(data.xpEarned ?? 0);
      setPhase("results");
    },
    onError: (err) => toast.error(err.message),
  });

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isTyping]);

  useEffect(() => {
    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  }, []);

  const formatTime = (s: number) => {
    const m = Math.floor(s / 60);
    const sec = s % 60;
    return `${m}:${sec.toString().padStart(2, "0")}`;
  };

  const handleSend = () => {
    if (!message.trim() || !sessionId || sendMutation.isPending) return;
    const content = message.trim();
    setMessage("");
    sendMutation.mutate({ sessionId, content });
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleComplete = () => {
    if (!sessionId) return;
    if (messages.filter(m => m.role === "agent").length === 0) {
      toast.error("Debes enviar al menos un mensaje antes de finalizar");
      return;
    }
    completeMutation.mutate({ sessionId });
  };

  if (scenarioLoading) {
    return (
      <div className="flex items-center justify-center h-full">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!scenario) {
    return (
      <div className="flex flex-col items-center justify-center h-full gap-4">
        <XCircle className="h-12 w-12 text-destructive" />
        <p className="text-muted-foreground">Simulación no encontrada</p>
        <Link href="/simulaciones">
          <Button variant="outline">Volver al catálogo</Button>
        </Link>
      </div>
    );
  }

  // ─── Preview Phase ──────────────────────────────────────────────────────────
  if (phase === "preview") {
    return (
      <div className="p-6 max-w-3xl space-y-6">
        <Link href="/simulaciones">
          <Button variant="ghost" size="sm" className="gap-2 text-muted-foreground hover:text-foreground">
            <ArrowLeft className="h-4 w-4" />
            Volver al catálogo
          </Button>
        </Link>

        <Card className="bg-card border-border">
          <CardContent className="p-6 space-y-5">
            <div className="flex items-start justify-between gap-4">
              <div className="space-y-2">
                <div className="flex items-center gap-2 flex-wrap">
                  <CategoryBadge category={scenario.category} />
                  <DifficultyBadge difficulty={scenario.difficulty} />
                  {isPracticeMode && (
                    <span className="text-xs bg-blue-900/30 text-blue-400 border border-blue-800/40 px-2 py-0.5 rounded-full font-medium flex items-center gap-1">
                      <Dumbbell className="h-3 w-3" />
                      Modo Práctica
                    </span>
                  )}
                </div>
                <h1 className="text-xl font-bold text-foreground">{scenario.title}</h1>
                <p className="text-muted-foreground text-sm">{scenario.description}</p>
              </div>
              {!isPracticeMode && (
                <div className="flex-shrink-0 text-center">
                  <XPBadge xp={scenario.xpReward ?? 0} />
                </div>
              )}
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="bg-secondary/50 rounded-xl p-4 space-y-1">
                <div className="text-xs text-muted-foreground font-medium">Duración estimada</div>
                <div className="text-sm font-semibold text-foreground flex items-center gap-1">
                  <Clock className="h-4 w-4 text-primary" />
                  {scenario.durationMin}-{scenario.durationMax} minutos
                </div>
              </div>
              <div className="bg-secondary/50 rounded-xl p-4 space-y-1">
                <div className="text-xs text-muted-foreground font-medium">Cliente virtual</div>
                <div className="text-sm font-semibold text-foreground flex items-center gap-1">
                  <User className="h-4 w-4 text-primary" />
                  {scenario.clientName}
                </div>
              </div>
            </div>

            <div className="bg-secondary/50 rounded-xl p-4 space-y-2">
              <div className="text-xs text-muted-foreground font-medium uppercase tracking-wide">Perfil del cliente</div>
              <p className="text-sm text-foreground">{scenario.clientPersona}</p>
            </div>

            {!isPracticeMode && (
              <div className="bg-secondary/50 rounded-xl p-4 space-y-2">
                <div className="text-xs text-muted-foreground font-medium uppercase tracking-wide">Dimensiones evaluadas</div>
                <div className="grid grid-cols-5 gap-2">
                  {[
                    { label: "Empatía", weight: scenario.empathyWeight },
                    { label: "Claridad", weight: scenario.clarityWeight },
                    { label: "Protocolo", weight: scenario.protocolWeight },
                    { label: "Resolución", weight: scenario.resolutionWeight },
                    { label: "Profesionalismo", weight: scenario.professionalismWeight },
                  ].map(dim => (
                    <div key={dim.label} className="text-center">
                      <div className="text-xs font-semibold text-foreground">{Math.round(Number(dim.weight) * 100)}%</div>
                      <div className="text-[10px] text-muted-foreground">{dim.label}</div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {isPracticeMode && (
              <div className="bg-blue-900/20 border border-blue-800/40 rounded-xl p-4 flex gap-3">
                <Dumbbell className="h-5 w-5 text-blue-400 flex-shrink-0 mt-0.5" />
                <div>
                  <div className="text-sm font-semibold text-blue-300">Modo Práctica Activo</div>
                  <div className="text-xs text-blue-400/80 mt-1">
                    En este modo puedes practicar libremente sin que la sesión sea evaluada ni cuente para tu XP. Ideal para familiarizarte con el escenario.
                  </div>
                </div>
              </div>
            )}

            <Button
              onClick={() => startMutation.mutate({ scenarioId, isPracticeMode })}
              disabled={startMutation.isPending}
              className="w-full bg-primary text-primary-foreground hover:bg-primary/90 gap-2 h-11"
            >
              {startMutation.isPending ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <>
                  <Zap className="h-4 w-4" />
                  {isPracticeMode ? "Iniciar Práctica" : "Iniciar Simulación"}
                </>
              )}
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  // ─── Simulation Phase ───────────────────────────────────────────────────────
  if (phase === "simulation") {
    return (
      <div className="flex flex-col h-full">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-3 border-b border-border bg-card/50 backdrop-blur-sm flex-shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
            <div>
              <div className="text-sm font-semibold text-foreground line-clamp-1">{scenario.title}</div>
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <CategoryBadge category={scenario.category} />
                <DifficultyBadge difficulty={scenario.difficulty} />
                {isPracticeMode && (
                  <span className="text-blue-400 flex items-center gap-1">
                    <Dumbbell className="h-3 w-3" />
                    Práctica
                  </span>
                )}
              </div>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1.5 text-sm text-muted-foreground bg-secondary px-3 py-1.5 rounded-lg">
              <Clock className="h-3.5 w-3.5" />
              {formatTime(elapsedSeconds)}
            </div>
            <Button
              onClick={handleComplete}
              disabled={completeMutation.isPending}
              variant="outline"
              size="sm"
              className="gap-2 border-destructive/50 text-destructive hover:bg-destructive/10"
            >
              {completeMutation.isPending ? (
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
              ) : (
                <StopCircle className="h-3.5 w-3.5" />
              )}
              Finalizar
            </Button>
          </div>
        </div>

        {/* Client Info Bar */}
        <div className="px-6 py-2 bg-secondary/30 border-b border-border flex items-center gap-3 flex-shrink-0">
          <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center">
            <User className="h-4 w-4 text-primary" />
          </div>
          <div>
            <span className="text-sm font-medium text-foreground">{scenario.clientName}</span>
            <span className="text-xs text-muted-foreground ml-2">— {scenario.clientPersona?.split(".")[0]}</span>
          </div>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto px-6 py-4 space-y-4">
          {messages.map((msg, i) => (
            <div key={i} className={cn("flex gap-3", msg.role === "agent" ? "flex-row-reverse" : "flex-row")}>
              <div className={cn(
                "w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0",
                msg.role === "agent" ? "bg-primary/20" : "bg-secondary"
              )}>
                {msg.role === "agent"
                  ? <User className="h-4 w-4 text-primary" />
                  : <Bot className="h-4 w-4 text-muted-foreground" />
                }
              </div>
              <div className={cn(
                "max-w-[75%] text-sm leading-relaxed",
                msg.role === "agent" ? "chat-bubble-agent" : "chat-bubble-client"
              )}>
                {msg.content}
              </div>
            </div>
          ))}

          {isTyping && (
            <div className="flex gap-3">
              <div className="w-8 h-8 rounded-full bg-secondary flex items-center justify-center flex-shrink-0">
                <Bot className="h-4 w-4 text-muted-foreground" />
              </div>
              <div className="chat-bubble-client">
                <TypingIndicator />
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* Input */}
        <div className="px-6 py-4 border-t border-border flex-shrink-0">
          <div className="flex gap-3 items-end">
            <Textarea
              value={message}
              onChange={e => setMessage(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Escribe tu respuesta como agente... (Enter para enviar)"
              className="flex-1 resize-none bg-secondary border-border min-h-[60px] max-h-[120px] text-sm"
              rows={2}
              disabled={sendMutation.isPending || completeMutation.isPending}
            />
            <Button
              onClick={handleSend}
              disabled={!message.trim() || sendMutation.isPending || completeMutation.isPending}
              className="bg-primary text-primary-foreground hover:bg-primary/90 h-[60px] w-[60px] p-0 flex-shrink-0"
            >
              {sendMutation.isPending
                ? <Loader2 className="h-4 w-4 animate-spin" />
                : <Send className="h-4 w-4" />
              }
            </Button>
          </div>
          <div className="text-xs text-muted-foreground mt-2">
            {messages.filter(m => m.role === "agent").length} mensajes enviados · Enter para enviar, Shift+Enter para nueva línea
          </div>
        </div>
      </div>
    );
  }

  // ─── Results Phase ──────────────────────────────────────────────────────────
  if (phase === "results" && evaluation) {
    const dimensionData = [
      { label: "Empatía", icon: "❤️", description: "Conexión emocional", value: evaluation.empathyScore },
      { label: "Claridad", icon: "💡", description: "Comunicación clara", value: evaluation.clarityScore },
      { label: "Protocolo", icon: "📋", description: "Procedimientos", value: evaluation.protocolScore },
      { label: "Resolución", icon: "✅", description: "Efectividad", value: evaluation.resolutionScore },
      { label: "Profesionalismo", icon: "🎯", description: "Tono profesional", value: evaluation.professionalismScore },
    ];

    return (
      <div className="p-6 max-w-4xl space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-foreground">
              {isPracticeMode ? "Práctica Completada" : "Resultados de la Simulación"}
            </h1>
            <p className="text-muted-foreground text-sm mt-1">{scenario.title}</p>
          </div>
          <div className="flex gap-2">
            <Link href="/simulaciones">
              <Button variant="outline" size="sm" className="gap-2">
                <ArrowLeft className="h-4 w-4" />
                Catálogo
              </Button>
            </Link>
            <Link href="/">
              <Button size="sm" className="bg-primary text-primary-foreground gap-2">
                Dashboard
              </Button>
            </Link>
          </div>
        </div>

        {isPracticeMode ? (
          <Card className="bg-card border-border">
            <CardContent className="p-6 text-center space-y-4">
              <Dumbbell className="h-12 w-12 text-blue-400 mx-auto" />
              <div>
                <h3 className="text-lg font-semibold text-foreground">Sesión de práctica completada</h3>
                <p className="text-muted-foreground text-sm mt-2">
                  Esta sesión no fue evaluada. Cuando estés listo, inicia la simulación en modo evaluado para obtener feedback detallado y ganar XP.
                </p>
              </div>
              <div className="flex gap-3 justify-center">
                <Link href={`/simulaciones/${scenarioId}`}>
                  <Button className="bg-primary text-primary-foreground gap-2">
                    <Zap className="h-4 w-4" />
                    Iniciar Evaluada
                  </Button>
                </Link>
              </div>
            </CardContent>
          </Card>
        ) : (
          <>
            {/* Score Overview */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <Card className="bg-card border-border md:col-span-1 flex flex-col items-center justify-center p-6">
                <div className="text-xs text-muted-foreground font-medium mb-3">Score Final</div>
                <ScoreCircle score={evaluation.overallScore} size="lg" />
                {xpEarned > 0 && (
                  <div className="mt-3 flex items-center gap-2">
                    <XPBadge xp={xpEarned} />
                    <span className="text-xs text-muted-foreground">ganados</span>
                  </div>
                )}
              </Card>

              <Card className="bg-card border-border md:col-span-2">
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-semibold text-foreground">Resumen del Evaluador IA</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-foreground leading-relaxed">{evaluation.aiFeedbackSummary}</p>
                </CardContent>
              </Card>
            </div>

            {/* Dimension Scores */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {dimensionData.map(dim => (
                <ScoreBar
                  key={dim.label}
                  label={dim.label}
                  score={dim.value}
                  icon={dim.icon}
                  description={dim.description}
                />
              ))}
            </div>

            {/* Strengths & Weaknesses */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Card className="bg-card border-border">
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-semibold text-green-400 flex items-center gap-2">
                    <CheckCircle2 className="h-4 w-4" />
                    Fortalezas
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  {evaluation.strengths?.map((s: string, i: number) => (
                    <div key={i} className="flex gap-2 text-sm text-foreground">
                      <span className="text-green-400 flex-shrink-0">✓</span>
                      {s}
                    </div>
                  ))}
                </CardContent>
              </Card>

              <Card className="bg-card border-border">
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-semibold text-yellow-400 flex items-center gap-2">
                    <AlertTriangle className="h-4 w-4" />
                    Áreas de Mejora
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  {evaluation.weaknesses?.map((w: string, i: number) => (
                    <div key={i} className="flex gap-2 text-sm text-foreground">
                      <span className="text-yellow-400 flex-shrink-0">!</span>
                      {w}
                    </div>
                  ))}
                </CardContent>
              </Card>
            </div>

            {/* Recommendations */}
            <Card className="bg-card border-border">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-semibold text-primary flex items-center gap-2">
                  <Zap className="h-4 w-4" />
                  Recomendaciones para Mejorar
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                {evaluation.recommendations?.map((r: string, i: number) => (
                  <div key={i} className="flex gap-3 text-sm text-foreground bg-secondary/50 rounded-lg p-3">
                    <span className="text-primary font-bold flex-shrink-0">{i + 1}.</span>
                    {r}
                  </div>
                ))}
              </CardContent>
            </Card>

            {/* New Badges */}
            {newBadges.length > 0 && (
              <Card className="bg-primary/10 border-primary/30">
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-semibold text-primary flex items-center gap-2">
                    🏆 ¡Nuevas Medallas Desbloqueadas!
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex gap-4 flex-wrap">
                    {newBadges.map((badge: any) => (
                      <div key={badge.id} className="flex items-center gap-3 bg-card rounded-xl p-3 border border-primary/20">
                        <BadgeIcon iconName={badge.icon} earned={true} />
                        <div>
                          <div className="text-sm font-semibold text-foreground">{badge.name}</div>
                          <div className="text-xs text-muted-foreground">{badge.description}</div>
                          <div className="text-xs text-primary font-semibold mt-0.5">+{badge.xpBonus} XP</div>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}
          </>
        )}
      </div>
    );
  }

  return null;
}
