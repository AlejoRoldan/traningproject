import TrainingDashboardLayout from "@/components/TrainingDashboardLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { trpc } from "@/lib/trpc";
import { Link } from "wouter";
import { 
  Target,
  Clock,
  TrendingUp,
  Calendar,
  Award,
  Eye,
  CheckCircle2,
  PlayCircle
} from "lucide-react";

export default function Simulations() {
  const simulationsQuery = trpc.simulations.mySimulations.useQuery({});
  const simulations = simulationsQuery.data || [];

  const completedSimulations = simulations.filter(s => s.status === "completed");
  const inProgressSimulations = simulations.filter(s => s.status === "in_progress");

  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    return `${mins} min`;
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

  return (
    <TrainingDashboardLayout>
      <div className="p-8 space-y-8">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold text-foreground">Mis Simulaciones</h1>
          <p className="text-muted-foreground mt-1">
            Historial completo de tus entrenamientos y evaluaciones
          </p>
        </div>

        {/* Stats Summary */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                <Target className="w-4 h-4" />
                Total Completadas
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-foreground">{completedSimulations.length}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                <PlayCircle className="w-4 h-4" />
                En Progreso
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-foreground">{inProgressSimulations.length}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                <TrendingUp className="w-4 h-4" />
                Promedio General
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-foreground">
                {completedSimulations.length > 0
                  ? Math.round(
                      completedSimulations.reduce((sum, s) => sum + (s.overallScore || 0), 0) /
                        completedSimulations.length
                    )
                  : 0}
                %
              </div>
            </CardContent>
          </Card>
        </div>

        {/* In Progress Simulations */}
        {inProgressSimulations.length > 0 && (
          <div className="space-y-4">
            <h2 className="text-2xl font-bold text-foreground">Simulaciones en Progreso</h2>
            <div className="grid grid-cols-1 gap-4">
              {inProgressSimulations.map((simulation) => (
                <Card key={simulation.id} className="border-l-4 border-l-primary">
                  <CardContent className="pt-6">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
                          <PlayCircle className="w-6 h-6 text-primary" />
                        </div>
                        <div>
                          <h3 className="font-semibold text-foreground">Simulación #{simulation.id}</h3>
                          <p className="text-sm text-muted-foreground">
                            Iniciada: {new Date(simulation.startedAt).toLocaleString("es-PY")}
                          </p>
                        </div>
                      </div>
                      <Button asChild>
                        <Link href={`/simulation/start/${simulation.scenarioId}`}>
                          Continuar
                        </Link>
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        )}

        {/* Completed Simulations */}
        <div className="space-y-4">
          <h2 className="text-2xl font-bold text-foreground">Simulaciones Completadas</h2>
          
          {completedSimulations.length > 0 ? (
            <div className="grid grid-cols-1 gap-4">
              {completedSimulations.map((simulation) => (
                <Card 
                  key={simulation.id} 
                  className={`hover:shadow-lg transition-shadow border-2 ${
                    simulation.overallScore !== null ? getScoreBgColor(simulation.overallScore) : ""
                  }`}
                >
                  <CardContent className="pt-6">
                    <div className="flex items-center justify-between gap-4">
                      {/* Score Circle */}
                      {simulation.overallScore !== null && (
                        <div className={`w-20 h-20 rounded-full flex items-center justify-center border-4 ${getScoreBgColor(simulation.overallScore)} flex-shrink-0`}>
                          <span className={`text-2xl font-bold ${getScoreColor(simulation.overallScore)}`}>
                            {simulation.overallScore}%
                          </span>
                        </div>
                      )}

                      {/* Info */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-3 mb-2">
                          <h3 className="font-semibold text-lg text-foreground">Simulación #{simulation.id}</h3>
                          <Badge variant="outline" className="text-xs">
                            <CheckCircle2 className="w-3 h-3 mr-1" />
                            Completada
                          </Badge>
                        </div>
                        
                        <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground">
                          <div className="flex items-center gap-1">
                            <Calendar className="w-4 h-4" />
                            <span>{new Date(simulation.completedAt || simulation.startedAt).toLocaleDateString("es-PY")}</span>
                          </div>
                          <div className="flex items-center gap-1">
                            <Clock className="w-4 h-4" />
                            <span>{formatDuration(simulation.duration || 0)}</span>
                          </div>
                          {simulation.pointsEarned && (
                            <div className="flex items-center gap-1 text-primary font-semibold">
                              <Award className="w-4 h-4" />
                              <span>+{simulation.pointsEarned} pts</span>
                            </div>
                          )}
                        </div>

                        {/* Quick Stats */}
                        {simulation.categoryScores && (
                          <div className="mt-3 flex flex-wrap gap-2">
                            {Object.entries(JSON.parse(simulation.categoryScores)).slice(0, 3).map(([key, score]: [string, any]) => (
                              <Badge key={key} variant="secondary" className="text-xs">
                                {key}: {score}%
                              </Badge>
                            ))}
                          </div>
                        )}
                      </div>

                      {/* Actions */}
                      <Button variant="outline" asChild>
                        <Link href={`/simulations/${simulation.id}`} className="flex items-center gap-2">
                          <Eye className="w-4 h-4" />
                          Ver Detalles
                        </Link>
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <Card>
              <CardContent className="py-16 text-center space-y-4">
                <Target className="w-16 h-16 text-muted-foreground mx-auto" />
                <div>
                  <h3 className="text-lg font-semibold text-foreground">No hay simulaciones completadas</h3>
                  <p className="text-sm text-muted-foreground mt-1">
                    ¡Comienza tu primer entrenamiento para ver tus resultados aquí!
                  </p>
                </div>
                <Button asChild>
                  <Link href="/scenarios">
                    Explorar Escenarios
                  </Link>
                </Button>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </TrainingDashboardLayout>
  );
}
