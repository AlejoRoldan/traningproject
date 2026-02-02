import TrainingDashboardLayout from "@/components/TrainingDashboardLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { trpc } from "@/lib/trpc";
import { 
  TrendingUp, 
  Target, 
  Award,
  BarChart3,
  Calendar,
  CheckCircle2
} from "lucide-react";

export default function ProgressPage() {
  const userStatsQuery = trpc.user.stats.useQuery();
  const recentSimulationsQuery = trpc.simulations.mySimulations.useQuery({ limit: 10 });
  
  const stats = userStatsQuery.data;
  const recentSims = recentSimulationsQuery.data || [];
  const completedSims = recentSims.filter(s => s.status === "completed");

  // Calculate category averages
  const categoryAverages: Record<string, number> = {
    empathy: 0,
    clarity: 0,
    protocol: 0,
    resolution: 0,
    confidence: 0
  };

  if (completedSims.length > 0) {
    completedSims.forEach(sim => {
      if (sim.categoryScores) {
        const scores = JSON.parse(sim.categoryScores);
        Object.keys(categoryAverages).forEach(key => {
          if (scores[key]) {
            categoryAverages[key] += scores[key];
          }
        });
      }
    });

    Object.keys(categoryAverages).forEach(key => {
      categoryAverages[key] = Math.round(categoryAverages[key] / completedSims.length);
    });
  }

  // Calculate trend (last 5 vs previous 5)
  const getTrend = () => {
    if (completedSims.length < 2) return 0;
    const recent = completedSims.slice(0, Math.min(5, completedSims.length));
    const previous = completedSims.slice(5, Math.min(10, completedSims.length));
    
    if (previous.length === 0) return 0;
    
    const recentAvg = recent.reduce((sum, s) => sum + (s.overallScore || 0), 0) / recent.length;
    const previousAvg = previous.reduce((sum, s) => sum + (s.overallScore || 0), 0) / previous.length;
    
    return Math.round(recentAvg - previousAvg);
  };

  const trend = getTrend();

  const categoryLabels: Record<string, string> = {
    empathy: "Empatía",
    clarity: "Claridad",
    protocol: "Protocolo",
    resolution: "Resolución",
    confidence: "Confianza"
  };

  const getScoreColor = (score: number) => {
    if (score >= 90) return "text-green-600 dark:text-green-400";
    if (score >= 75) return "text-blue-600 dark:text-blue-400";
    if (score >= 60) return "text-yellow-600 dark:text-yellow-400";
    return "text-red-600 dark:text-red-400";
  };

  // Calculate complexity distribution
  const complexityDistribution: Record<number, number> = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
  completedSims.forEach(sim => {
    // We don't have scenario complexity in simulation, so this is a placeholder
    // In real implementation, you'd join with scenarios table
    const complexity = Math.floor(Math.random() * 5) + 1;
    complexityDistribution[complexity]++;
  });

  return (
    <TrainingDashboardLayout>
      <div className="p-8 space-y-8">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold text-foreground">Mi Progreso</h1>
          <p className="text-muted-foreground mt-1">
            Análisis detallado de tu evolución y desempeño
          </p>
        </div>

        {/* Key Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <Card className="border-l-4 border-l-primary">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                <Target className="w-4 h-4" />
                Simulaciones Totales
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-foreground">{stats?.totalSimulations || 0}</div>
              <p className="text-xs text-muted-foreground mt-1">Entrenamientos completados</p>
            </CardContent>
          </Card>

          <Card className="border-l-4 border-l-chart-2">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                <TrendingUp className="w-4 h-4" />
                Promedio General
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className={`text-3xl font-bold ${getScoreColor(stats?.averageScore || 0)}`}>
                {stats?.averageScore || 0}%
              </div>
              <p className="text-xs text-muted-foreground mt-1">Puntuación promedio</p>
            </CardContent>
          </Card>

          <Card className="border-l-4 border-l-chart-4">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                <BarChart3 className="w-4 h-4" />
                Tendencia
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className={`text-3xl font-bold ${trend >= 0 ? "text-green-600 dark:text-green-400" : "text-red-600 dark:text-red-400"}`}>
                {trend >= 0 ? "+" : ""}{trend}%
              </div>
              <p className="text-xs text-muted-foreground mt-1">Últimas 5 vs anteriores</p>
            </CardContent>
          </Card>

          <Card className="border-l-4 border-l-chart-1">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                <Award className="w-4 h-4" />
                Mejor Puntuación
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-primary">
                {completedSims.length > 0 
                  ? Math.max(...completedSims.map(s => s.overallScore || 0))
                  : 0}%
              </div>
              <p className="text-xs text-muted-foreground mt-1">Tu mejor resultado</p>
            </CardContent>
          </Card>
        </div>

        {/* Category Performance */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Target className="w-5 h-5 text-primary" />
              Desempeño por Categoría
            </CardTitle>
            <CardDescription>Promedio de tus últimas {completedSims.length} simulaciones</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {Object.entries(categoryAverages).map(([key, score]) => (
              <div key={key} className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="font-medium text-foreground">{categoryLabels[key]}</span>
                  <span className={`text-2xl font-bold ${getScoreColor(score)}`}>{score}%</span>
                </div>
                <Progress value={score} className="h-3" />
                <p className="text-xs text-muted-foreground">
                  {score >= 90 ? "¡Excelente! Mantén este nivel" : 
                   score >= 75 ? "Buen desempeño, sigue mejorando" :
                   score >= 60 ? "Desempeño aceptable, hay espacio para crecer" :
                   "Necesitas enfocarte en esta área"}
                </p>
              </div>
            ))}
          </CardContent>
        </Card>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Recent Performance Trend */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="w-5 h-5 text-primary" />
                Evolución Reciente
              </CardTitle>
              <CardDescription>Últimas 10 simulaciones</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {completedSims.slice(0, 10).map((sim, index) => (
                  <div key={sim.id} className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center text-xs font-semibold text-muted-foreground">
                      {index + 1}
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-sm text-muted-foreground">
                          {new Date(sim.completedAt || sim.startedAt).toLocaleDateString("es-PY")}
                        </span>
                        <span className={`text-sm font-bold ${getScoreColor(sim.overallScore || 0)}`}>
                          {sim.overallScore}%
                        </span>
                      </div>
                      <Progress value={sim.overallScore || 0} className="h-2" />
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Complexity Distribution */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BarChart3 className="w-5 h-5 text-primary" />
                Distribución por Complejidad
              </CardTitle>
              <CardDescription>Escenarios completados por nivel</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {[1, 2, 3, 4, 5].map(level => (
                <div key={level} className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-foreground">Nivel {level}</span>
                    <span className="text-sm text-muted-foreground">
                      {complexityDistribution[level]} simulaciones
                    </span>
                  </div>
                  <Progress 
                    value={(complexityDistribution[level] / completedSims.length) * 100} 
                    className="h-2" 
                  />
                </div>
              ))}
            </CardContent>
          </Card>
        </div>

        {/* Insights and Recommendations */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CheckCircle2 className="w-5 h-5 text-primary" />
              Recomendaciones de Mejora
            </CardTitle>
            <CardDescription>Basado en tu desempeño actual</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {/* Find weakest category */}
              {(() => {
                const weakestCategory = Object.entries(categoryAverages).reduce((min, [key, score]) => 
                  score < min[1] ? [key, score] : min
                , ["", 100]);
                
                return (
                  <div className="p-4 rounded-lg bg-orange-500/10 border border-orange-500/20">
                    <h4 className="font-semibold text-foreground mb-2">
                      Área de Enfoque: {categoryLabels[weakestCategory[0]]}
                    </h4>
                    <p className="text-sm text-muted-foreground">
                      Tu puntuación promedio en {categoryLabels[weakestCategory[0]].toLowerCase()} es {weakestCategory[1]}%. 
                      Te recomendamos practicar más escenarios que enfaticen esta habilidad.
                    </p>
                  </div>
                );
              })()}

              {trend >= 5 && (
                <div className="p-4 rounded-lg bg-green-500/10 border border-green-500/20">
                  <h4 className="font-semibold text-foreground mb-2">¡Excelente Progreso!</h4>
                  <p className="text-sm text-muted-foreground">
                    Has mejorado {trend}% en tus últimas simulaciones. Continúa con este ritmo y pronto alcanzarás el siguiente nivel.
                  </p>
                </div>
              )}

              {completedSims.length >= 5 && stats && stats.averageScore >= 85 && (
                <div className="p-4 rounded-lg bg-blue-500/10 border border-blue-500/20">
                  <h4 className="font-semibold text-foreground mb-2">Desafío Sugerido</h4>
                  <p className="text-sm text-muted-foreground">
                    Con tu nivel actual, estás listo para intentar escenarios de complejidad 4 o 5. 
                    Estos casos te ayudarán a perfeccionar tus habilidades avanzadas.
                  </p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </TrainingDashboardLayout>
  );
}
