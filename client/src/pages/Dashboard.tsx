import { useAuth } from "@/_core/hooks/useAuth";
import TrainingDashboardLayout from "@/components/TrainingDashboardLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { trpc } from "@/lib/trpc";
import { 
  Target, 
  TrendingUp, 
  Award, 
  Clock, 
  ArrowRight,
  Trophy,
  Zap,
  CheckCircle2,
  BookOpen
} from "lucide-react";
import { Link } from "wouter";

export default function Dashboard() {
  const { user } = useAuth();
  const userStatsQuery = trpc.user.stats.useQuery();
  const recentSimulationsQuery = trpc.simulations.mySimulations.useQuery({ limit: 5 });
  const activePlanQuery = trpc.improvementPlans.activePlan.useQuery();
  const userBadgesQuery = trpc.user.badges.useQuery();

  const stats = userStatsQuery.data;
  const recentSims = recentSimulationsQuery.data || [];
  const activePlan = activePlanQuery.data;
  const badges = userBadgesQuery.data || [];

  // Calculate level progress (mock calculation)
  const getLevelProgress = () => {
    const points = user?.points || 0;
    const currentLevelThreshold = {
      junior: 0,
      intermediate: 500,
      senior: 1500,
      expert: 3000
    };
    
    const level = user?.level || "junior";
    const levels = ["junior", "intermediate", "senior", "expert"];
    const currentIndex = levels.indexOf(level);
    
    if (currentIndex === levels.length - 1) return 100; // Expert is max
    
    const currentThreshold = currentLevelThreshold[level as keyof typeof currentLevelThreshold];
    const nextLevel = levels[currentIndex + 1] as keyof typeof currentLevelThreshold;
    const nextThreshold = currentLevelThreshold[nextLevel];
    
    const progress = ((points - currentThreshold) / (nextThreshold - currentThreshold)) * 100;
    return Math.min(Math.max(progress, 0), 100);
  };

  const getNextLevelName = () => {
    const levels = ["junior", "intermediate", "senior", "expert"];
    const currentIndex = levels.indexOf(user?.level || "junior");
    if (currentIndex === levels.length - 1) return "Máximo alcanzado";
    return levels[currentIndex + 1];
  };

  return (
    <TrainingDashboardLayout>
      <div className="p-8 space-y-8">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold text-foreground">
            ¡Bienvenido, {user?.name?.split(" ")[0] || "Agente"}!
          </h1>
          <p className="text-muted-foreground mt-1">
            Aquí está tu resumen de progreso y actividades recientes
          </p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <Card className="border-l-4 border-l-primary">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                <Target className="w-4 h-4" />
                Simulaciones Completadas
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-foreground">
                {stats?.totalSimulations || 0}
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                Total de entrenamientos realizados
              </p>
            </CardContent>
          </Card>

          <Card className="border-l-4 border-l-chart-2">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                <TrendingUp className="w-4 h-4" />
                Promedio de Desempeño
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-foreground">
                {stats?.averageScore || 0}%
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                Puntuación promedio general
              </p>
            </CardContent>
          </Card>

          <Card className="border-l-4 border-l-chart-4">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                <Trophy className="w-4 h-4" />
                Badges Obtenidos
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-foreground">
                {badges.length}
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                Logros desbloqueados
              </p>
            </CardContent>
          </Card>

          <Card className="border-l-4 border-l-chart-1">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                <Zap className="w-4 h-4" />
                Puntos Totales
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-foreground">
                {user?.points || 0}
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                Puntos de experiencia acumulados
              </p>
            </CardContent>
          </Card>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Level Progress */}
          <Card className="lg:col-span-2">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Award className="w-5 h-5 text-primary" />
                Progreso de Nivel
              </CardTitle>
              <CardDescription>
                Nivel actual: <span className="font-semibold capitalize text-foreground">{user?.level || "junior"}</span>
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Progreso hacia {getNextLevelName()}</span>
                  <span className="font-semibold text-foreground">{Math.round(getLevelProgress())}%</span>
                </div>
                <Progress value={getLevelProgress()} className="h-3" />
              </div>
              
              <div className="grid grid-cols-2 gap-4 pt-4 border-t">
                <div>
                  <p className="text-xs text-muted-foreground">Puntos actuales</p>
                  <p className="text-2xl font-bold text-primary">{user?.points || 0}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Próximo nivel</p>
                  <p className="text-2xl font-bold text-foreground capitalize">{getNextLevelName()}</p>
                </div>
              </div>

              <Button className="w-full" asChild>
                <Link href="/gamification" className="flex items-center justify-center gap-2">
                  Ver Gamificación Completa
                  <ArrowRight className="w-4 h-4" />
                </Link>
              </Button>
            </CardContent>
          </Card>

          {/* Active Improvement Plan */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Plan de Mejora Activo</CardTitle>
            </CardHeader>
            <CardContent>
              {activePlan ? (
                <div className="space-y-4">
                  <div>
                    <h3 className="font-semibold text-foreground">{activePlan.title}</h3>
                    <p className="text-sm text-muted-foreground mt-1">{activePlan.description}</p>
                  </div>
                  
                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground">Progreso</span>
                      <span className="font-semibold text-foreground">{activePlan.progress}%</span>
                    </div>
                    <Progress value={activePlan.progress} className="h-2" />
                  </div>

                  <Button variant="outline" className="w-full" asChild>
                    <Link href="/progress">
                      Ver Detalles
                    </Link>
                  </Button>
                </div>
              ) : (
                <div className="text-center py-8 space-y-3">
                  <CheckCircle2 className="w-12 h-12 text-muted-foreground mx-auto" />
                  <p className="text-sm text-muted-foreground">
                    No tienes planes de mejora activos en este momento
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Recent Simulations */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Clock className="w-5 h-5 text-primary" />
              Simulaciones Recientes
            </CardTitle>
            <CardDescription>Tus últimas 5 sesiones de entrenamiento</CardDescription>
          </CardHeader>
          <CardContent>
            {recentSims.length > 0 ? (
              <div className="space-y-3">
                {recentSims.map((sim) => (
                  <div 
                    key={sim.id} 
                    className="flex items-center justify-between p-4 rounded-lg border border-border hover:bg-accent/50 transition-colors"
                  >
                    <div className="flex-1">
                      <p className="font-medium text-foreground">Simulación #{sim.id}</p>
                      <p className="text-sm text-muted-foreground">
                        {new Date(sim.startedAt).toLocaleDateString("es-PY", { 
                          day: "numeric", 
                          month: "long", 
                          year: "numeric" 
                        })}
                      </p>
                    </div>
                    
                    {sim.overallScore !== null && (
                      <div className="text-right mr-4">
                        <p className="text-2xl font-bold text-primary">{sim.overallScore}%</p>
                        <p className="text-xs text-muted-foreground">Puntuación</p>
                      </div>
                    )}
                    
                    <Button variant="ghost" size="sm" asChild>
                      <Link href={`/simulations/${sim.id}`}>
                        Ver Detalles
                      </Link>
                    </Button>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-12 space-y-4">
                <Target className="w-16 h-16 text-muted-foreground mx-auto" />
                <div>
                  <p className="text-lg font-semibold text-foreground">¡Comienza tu primer entrenamiento!</p>
                  <p className="text-sm text-muted-foreground mt-1">
                    Explora los escenarios disponibles y mejora tus habilidades
                  </p>
                </div>
                <Button asChild>
                  <Link href="/scenarios" className="flex items-center gap-2">
                    Ver Escenarios
                    <ArrowRight className="w-4 h-4" />
                  </Link>
                </Button>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Quick Actions */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Button size="lg" className="h-auto py-6" asChild>
            <Link href="/scenarios" className="flex flex-col items-center gap-2">
              <BookOpen className="w-6 h-6" />
              <span className="font-semibold">Explorar Escenarios</span>
              <span className="text-xs opacity-90">Encuentra tu próximo desafío</span>
            </Link>
          </Button>

          <Button size="lg" variant="outline" className="h-auto py-6" asChild>
            <Link href="/simulations" className="flex flex-col items-center gap-2">
              <Target className="w-6 h-6" />
              <span className="font-semibold">Mis Simulaciones</span>
              <span className="text-xs opacity-90">Revisa tu historial</span>
            </Link>
          </Button>

          <Button size="lg" variant="outline" className="h-auto py-6" asChild>
            <Link href="/progress" className="flex flex-col items-center gap-2">
              <TrendingUp className="w-6 h-6" />
              <span className="font-semibold">Ver Progreso</span>
              <span className="text-xs opacity-90">Analiza tu evolución</span>
            </Link>
          </Button>
        </div>
      </div>
    </TrainingDashboardLayout>
  );
}
