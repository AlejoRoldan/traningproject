import { useParams, useLocation } from "wouter";
import TrainingDashboardLayout from "@/components/TrainingDashboardLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Separator } from "@/components/ui/separator";
import { trpc } from "@/lib/trpc";
import { 
  ArrowLeft,
  CheckCircle2,
  XCircle,
  TrendingUp,
  Clock,
  Award,
  MessageSquare,
  Lightbulb,
  Target,
  AlertTriangle,
  Play,
  Pause,
  Volume2,
  Mic,
  Activity,
  Smile,
  Zap
} from "lucide-react";
import SyncedAudioPlayer from "@/components/SyncedAudioPlayer";

export default function SimulationDetail() {
  const params = useParams();
  const [, navigate] = useLocation();
  const simulationId = params.id ? parseInt(params.id) : null;

  const simulationQuery = trpc.simulations.getById.useQuery(
    { id: simulationId! },
    { enabled: !!simulationId }
  );
  const messagesQuery = trpc.simulations.getMessages.useQuery(
    { simulationId: simulationId! },
    { enabled: !!simulationId }
  );

  const simulation = simulationQuery.data;
  const messages = messagesQuery.data || [];

  if (simulationQuery.isLoading) {
    return (
      <TrainingDashboardLayout>
        <div className="flex items-center justify-center h-screen">
          <div className="text-center">
            <div className="animate-spin w-12 h-12 border-4 border-primary border-t-transparent rounded-full mx-auto mb-4"></div>
            <p className="text-muted-foreground">Cargando simulación...</p>
          </div>
        </div>
      </TrainingDashboardLayout>
    );
  }

  if (!simulation) {
    return (
      <TrainingDashboardLayout>
        <div className="flex items-center justify-center h-screen">
          <div className="text-center space-y-4">
            <AlertTriangle className="w-16 h-16 text-destructive mx-auto" />
            <h2 className="text-2xl font-bold">Simulación no encontrada</h2>
            <Button onClick={() => navigate("/simulations")}>Volver a Simulaciones</Button>
          </div>
        </div>
      </TrainingDashboardLayout>
    );
  }

  const categoryScores = simulation.categoryScores ? JSON.parse(simulation.categoryScores) : null;
  const strengths = simulation.strengths ? JSON.parse(simulation.strengths) : [];
  const weaknesses = simulation.weaknesses ? JSON.parse(simulation.weaknesses) : [];
  const recommendations = simulation.recommendations ? JSON.parse(simulation.recommendations) : [];
  const badgesEarned = simulation.badgesEarned ? JSON.parse(simulation.badgesEarned) : [];

  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}m ${secs}s`;
  };

  const getScoreColor = (score: number) => {
    if (score >= 90) return "text-green-600 dark:text-green-400";
    if (score >= 75) return "text-blue-600 dark:text-blue-400";
    if (score >= 60) return "text-yellow-600 dark:text-yellow-400";
    return "text-red-600 dark:text-red-400";
  };

  const getScoreBgColor = (score: number) => {
    if (score >= 90) return "bg-green-500/10 border-green-500/20";
    if (score >= 75) return "bg-blue-500/10 border-blue-500/20";
    if (score >= 60) return "bg-yellow-500/10 border-yellow-500/20";
    return "bg-red-500/10 border-red-500/20";
  };

  const categoryLabels: Record<string, string> = {
    empathy: "Empatía",
    clarity: "Claridad",
    protocol: "Protocolo",
    resolution: "Resolución",
    confidence: "Confianza"
  };

  return (
    <TrainingDashboardLayout>
      <div className="p-8 space-y-8">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="icon" onClick={() => navigate("/simulations")}>
              <ArrowLeft className="w-5 h-5" />
            </Button>
            <div>
              <h1 className="text-3xl font-bold text-foreground">Detalle de Simulación</h1>
              <p className="text-muted-foreground mt-1">
                ID: #{simulation.id} | {new Date(simulation.startedAt).toLocaleDateString("es-PY")}
              </p>
            </div>
          </div>
          
          <Badge variant={simulation.status === "completed" ? "default" : "secondary"} className="text-sm">
            {simulation.status === "completed" ? "Completada" : "En progreso"}
          </Badge>
        </div>

        {/* Synced Audio Player with Transcript */}
        {simulation.audioRecordingUrl && simulation.transcriptSegments && (() => {
          const segments = JSON.parse(simulation.transcriptSegments);
          const keywords = simulation.transcriptKeywords ? JSON.parse(simulation.transcriptKeywords) : [];
          return (
            <SyncedAudioPlayer
              audioUrl={simulation.audioRecordingUrl}
              segments={segments}
              keywords={keywords}
              simulationId={simulation.id}
            />
          );
        })()}

        {/* Fallback: Simple Audio Player (if no transcript) */}
        {simulation.audioRecordingUrl && !simulation.transcriptSegments && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Volume2 className="w-5 h-5" />
                Grabación de Audio
              </CardTitle>
              <CardDescription>
                Escucha la grabación completa de tu simulación
              </CardDescription>
            </CardHeader>
            <CardContent>
              <audio controls className="w-full">
                <source src={simulation.audioRecordingUrl} type="audio/webm" />
                Tu navegador no soporta la reproducción de audio.
              </audio>
            </CardContent>
          </Card>
        )}

        {/* Voice Metrics */}
        {simulation.voiceMetrics && (() => {
          const voiceMetrics = JSON.parse(simulation.voiceMetrics);
          return (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Mic className="w-5 h-5 text-primary" />
                  Análisis de Voz
                </CardTitle>
                <CardDescription>
                  Métricas de tu tono, ritmo y sentimiento vocal
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Overall Voice Score */}
                <div className="flex items-center justify-between p-4 bg-primary/5 rounded-lg border border-primary/20">
                  <div>
                    <p className="text-sm text-muted-foreground">Puntuación de Voz</p>
                    <p className="text-3xl font-bold text-primary">{voiceMetrics.overallVoiceScore}%</p>
                  </div>
                  <Activity className="w-12 h-12 text-primary opacity-20" />
                </div>

                {/* Speech Metrics */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="p-4 bg-card border rounded-lg">
                    <div className="flex items-center gap-2 mb-2">
                      <Zap className="w-4 h-4 text-blue-500" />
                      <p className="text-sm font-medium text-muted-foreground">Velocidad</p>
                    </div>
                    <p className="text-2xl font-bold text-foreground">{voiceMetrics.speechRate}</p>
                    <p className="text-xs text-muted-foreground">palabras/minuto</p>
                  </div>

                  <div className="p-4 bg-card border rounded-lg">
                    <div className="flex items-center gap-2 mb-2">
                      <Clock className="w-4 h-4 text-green-500" />
                      <p className="text-sm font-medium text-muted-foreground">Pausas</p>
                    </div>
                    <p className="text-2xl font-bold text-foreground">{voiceMetrics.averagePauseDuration}s</p>
                    <p className="text-xs text-muted-foreground">promedio</p>
                  </div>

                  <div className="p-4 bg-card border rounded-lg">
                    <div className="flex items-center gap-2 mb-2">
                      <Volume2 className="w-4 h-4 text-purple-500" />
                      <p className="text-sm font-medium text-muted-foreground">Tiempo Total</p>
                    </div>
                    <p className="text-2xl font-bold text-foreground">{voiceMetrics.totalSpeakingTime}s</p>
                    <p className="text-xs text-muted-foreground">hablando</p>
                  </div>
                </div>

                {/* Sentiment Scores */}
                <div>
                  <h4 className="font-semibold text-foreground mb-4 flex items-center gap-2">
                    <Smile className="w-5 h-5 text-primary" />
                    Sentimiento Vocal
                  </h4>
                  <div className="space-y-3">
                    {[
                      { key: 'confidence', label: 'Confianza', color: 'bg-blue-500' },
                      { key: 'empathy', label: 'Empatía', color: 'bg-green-500' },
                      { key: 'professionalism', label: 'Profesionalismo', color: 'bg-purple-500' },
                      { key: 'clarity', label: 'Claridad', color: 'bg-yellow-500' },
                      { key: 'enthusiasm', label: 'Entusiasmo', color: 'bg-orange-500' },
                    ].map(({ key, label, color }) => (
                      <div key={key}>
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-sm font-medium text-foreground">{label}</span>
                          <span className="text-sm font-bold text-foreground">
                            {voiceMetrics.sentimentScores[key]}%
                          </span>
                        </div>
                        <Progress value={voiceMetrics.sentimentScores[key]} className="h-2" />
                      </div>
                    ))}
                  </div>
                </div>

                {/* Insights */}
                {voiceMetrics.insights && voiceMetrics.insights.length > 0 && (
                  <div>
                    <h4 className="font-semibold text-foreground mb-3 flex items-center gap-2">
                      <Lightbulb className="w-5 h-5 text-primary" />
                      Recomendaciones Vocales
                    </h4>
                    <ul className="space-y-2">
                      {voiceMetrics.insights.map((insight: string, index: number) => (
                        <li key={index} className="flex items-start gap-2 text-sm text-muted-foreground">
                          <span className="text-primary mt-1">•</span>
                          <span>{insight}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </CardContent>
            </Card>
          );
        })()}

        {/* Overall Score Card */}
        {simulation.overallScore !== null && (
          <Card className={`border-2 ${getScoreBgColor(simulation.overallScore)}`}>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className={`w-24 h-24 rounded-full flex items-center justify-center border-4 ${getScoreBgColor(simulation.overallScore)}`}>
                    <span className={`text-3xl font-bold ${getScoreColor(simulation.overallScore)}`}>
                      {simulation.overallScore}%
                    </span>
                  </div>
                  <div>
                    <h3 className="text-2xl font-bold text-foreground">Puntuación General</h3>
                    <p className="text-muted-foreground mt-1">
                      {simulation.overallScore >= 90 ? "¡Excelente desempeño!" : 
                       simulation.overallScore >= 75 ? "Buen trabajo" :
                       simulation.overallScore >= 60 ? "Desempeño aceptable" :
                       "Necesitas mejorar"}
                    </p>
                  </div>
                </div>

                <div className="text-right space-y-2">
                  <div className="flex items-center gap-2 justify-end">
                    <Clock className="w-5 h-5 text-muted-foreground" />
                    <span className="text-lg font-semibold text-foreground">
                      {formatDuration(simulation.duration || 0)}
                    </span>
                  </div>
                  {simulation.pointsEarned && (
                    <div className="flex items-center gap-2 justify-end">
                      <Award className="w-5 h-5 text-primary" />
                      <span className="text-lg font-semibold text-primary">
                        +{simulation.pointsEarned} puntos
                      </span>
                    </div>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Category Scores */}
        {categoryScores && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Target className="w-5 h-5 text-primary" />
                Puntuaciones por Categoría
              </CardTitle>
              <CardDescription>Análisis detallado de tu desempeño</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
                  {Object.entries(categoryScores).map(([key, score]: [string, any]) => (
                <div key={key} className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="font-medium text-foreground">{categoryLabels[key] || key}</span>
                    <span className={`font-bold ${getScoreColor(score as number)}`}>{score}%</span>
                  </div>
                  <Progress value={score as number} className="h-2" />
                </div>
              ))}
            </CardContent>
          </Card>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Strengths */}
          {strengths.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-green-600 dark:text-green-400">
                  <CheckCircle2 className="w-5 h-5" />
                  Fortalezas
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2">
                  {strengths.map((strength: string, index: number) => (
                    <li key={index} className="flex items-start gap-2">
                      <CheckCircle2 className="w-5 h-5 text-green-600 dark:text-green-400 mt-0.5 flex-shrink-0" />
                      <span className="text-foreground">{strength}</span>
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          )}

          {/* Weaknesses */}
          {weaknesses.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-orange-600 dark:text-orange-400">
                  <XCircle className="w-5 h-5" />
                  Áreas de Mejora
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2">
                  {weaknesses.map((weakness: string, index: number) => (
                    <li key={index} className="flex items-start gap-2">
                      <XCircle className="w-5 h-5 text-orange-600 dark:text-orange-400 mt-0.5 flex-shrink-0" />
                      <span className="text-foreground">{weakness}</span>
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Recommendations */}
        {recommendations.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Lightbulb className="w-5 h-5 text-primary" />
                Recomendaciones Personalizadas
              </CardTitle>
              <CardDescription>Pasos sugeridos para mejorar tu desempeño</CardDescription>
            </CardHeader>
            <CardContent>
              <ul className="space-y-3">
                {recommendations.map((recommendation: string, index: number) => (
                  <li key={index} className="flex items-start gap-3 p-3 rounded-lg bg-accent/50">
                    <div className="w-6 h-6 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-sm font-semibold flex-shrink-0">
                      {index + 1}
                    </div>
                    <span className="text-foreground">{recommendation}</span>
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>
        )}

        {/* Feedback */}
        {simulation.feedback && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <MessageSquare className="w-5 h-5 text-primary" />
                Feedback del Evaluador
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-foreground leading-relaxed whitespace-pre-wrap">{simulation.feedback}</p>
            </CardContent>
          </Card>
        )}

        {/* Badges Earned */}
        {badgesEarned.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Award className="w-5 h-5 text-primary" />
                Badges Desbloqueados
              </CardTitle>
              <CardDescription>Logros obtenidos en esta simulación</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-3">
                {badgesEarned.map((badge: string, index: number) => (
                  <Badge key={index} variant="outline" className="text-sm py-2 px-4">
                    <Award className="w-4 h-4 mr-2" />
                    {badge.replace(/_/g, " ").replace(/\b\w/g, l => l.toUpperCase())}
                  </Badge>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Conversation Transcript */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <MessageSquare className="w-5 h-5 text-primary" />
              Transcripción de la Conversación
            </CardTitle>
            <CardDescription>Registro completo de la simulación</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4 max-h-[600px] overflow-y-auto pr-4">
              {messages.map((message, index) => (
                <div key={index} className={`flex gap-3 ${message.role === "agent" ? "justify-end" : "justify-start"}`}>
                  <div className={`max-w-[80%] ${message.role === "agent" ? "order-first" : ""}`}>
                    <div className={`rounded-2xl p-4 ${
                      message.role === "agent"
                        ? "bg-primary text-primary-foreground"
                        : message.role === "client"
                        ? "bg-card border border-border"
                        : "bg-muted"
                    }`}>
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-xs font-semibold uppercase opacity-70">
                          {message.role === "agent" ? "Tú" : message.role === "client" ? "Cliente" : "Sistema"}
                        </span>
                      </div>
                      <p className="text-sm whitespace-pre-wrap">{message.content}</p>
                      <p className="text-xs opacity-70 mt-2">
                        {new Date(message.createdAt).toLocaleTimeString("es-PY", { 
                          hour: "2-digit", 
                          minute: "2-digit" 
                        })}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Actions */}
        <div className="flex gap-4">
          <Button size="lg" onClick={() => navigate("/scenarios")}>
            <TrendingUp className="w-5 h-5 mr-2" />
            Practicar Más Escenarios
          </Button>
          <Button size="lg" variant="outline" onClick={() => navigate("/progress")}>
            Ver Mi Progreso Completo
          </Button>
        </div>
      </div>
    </TrainingDashboardLayout>
  );
}
