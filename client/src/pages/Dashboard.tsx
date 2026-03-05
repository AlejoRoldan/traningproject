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
  const supabaseStatsQuery = trpc.supabase.getUserStats.useQuery();
  const supabaseSimulationsQuery = trpc.supabase.getUserSimulations.useQuery();

  const stats = userStatsQuery.data;
  const recentSims = recentSimulationsQuery.data || [];
  const activePlan = activePlanQuery.data;
  const badges = userBadgesQuery.data || [];
  const supabaseStats = supabaseStatsQuery.data;
  const supabaseSimulations = supabaseSimulationsQuery.data || [];

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
      <div className="min-h-screen bg-background">
        <div className="p-8 md:p-10 lg:p-12 space-y-10">
          {/* Header */}
          <div className="space-y-3">
            <h1 className="text-4xl md:text-5xl font-bold text-foreground tracking-tight">
              ¡Bienvenido, {user?.name?.split(" ")[0] || "Agente"}!
            </h1>
            <p className="text-lg text-muted-foreground max-w-2xl">
              Aquí está tu resumen de progreso y actividades recientes
            </p>
          </div>

          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
          <Card className="relative overflow-hidden group hover:shadow-lg transition-all duration-300 border border-border/50">
            <div className="absolute top-0 left-0 w-1 h-full bg-gradient-to-b from-primary to-primary/50"></div>
            <CardHeader className="pb-2">
              <CardTitle className="text-xs font-semibold text-muted-foreground uppercase tracking-wide flex items-center gap-2">
                <Target className="w-4 h-4 text-primary" />
                Simulaciones
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="text-4xl font-bold text-foreground">
                {stats?.totalSimulations || 0}
              </div>
              <p className="text-sm text-muted-foreground">
                Total de entrenamientos realizados
              </p>
            </CardContent>
          </Card>

          <Card className="relative overflow-hidden group hover:shadow-lg transition-all duration-300 border border-border/50">
            <div className="absolute top-0 left-0 w-1 h-full bg-gradient-to-b from-chart-2 to-chart-2/50"></div>
            <CardHeader className="pb-2">
              <CardTitle className="text-xs font-semibold text-muted-foreground uppercase tracking-wide flex items-center gap-2">
                <TrendingUp className="w-4 h-4 text-chart-2" />
                Desempeño
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="text-4xl font-bold text-foreground">
                {stats?.averageScore || 0}%
              </div>
              <p className="text-sm text-muted-foreground">
                Puntuación promedio general
              </p>
            </CardContent>
          </Card>

          <Card className="relative overflow-hidden group hover:shadow-lg transition-all duration-300 border border-border/50">
            <div className="absolute top-0 left-0 w-1 h-full bg-gradient-to-b from-chart-4 to-chart-4/50"></div>
            <CardHeader className="pb-2">
              <CardTitle className="text-xs font-semibold text-muted-foreground uppercase tracking-wide flex items-center gap-2">
                <Trophy className="w-4 h-4 text-chart-4" />
                Logros
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="text-4xl font-bold text-foreground">
                {badges.length}
              </div>
              <p className="text-sm text-muted-foreground">
                Badges desbloqueados
              </p>
            </CardContent>
          </Card>

          <Card className="relative overflow-hidden group hover:shadow-lg transition-all duration-300 border border-border/50">
            <div className="absolute top-0 left-0 w-1 h-full bg-gradient-to-b from-chart-1 to-chart-1/50"></div>
            <CardHeader className="pb-2">
              <CardTitle className="text-xs font-semibold text-muted-foreground uppercase tracking-wide flex items-center gap-2">
                <Zap className="w-4 h-4 text-chart-1" />
                Puntos
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="text-4xl font-bold text-foreground">
                {user?.points || 0}
              </div>
              <p className="text-sm text-muted-foreground">
                Puntos de experiencia acumulados
              </p>
            </CardContent>
          </Card>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Level Progress */}
          <Card className="lg:col-span-2 hover:shadow-lg transition-all duration-300">
            <CardHeader className="space-y-1">
              <CardTitle className="flex items-center gap-2 text-2xl">
                <Award className="w-6 h-6 text-primary" />
                Progreso de Nivel
              </CardTitle>
              <CardDescription className="text-base">
                Nivel actual: <span className="font-semibold capitalize text-foreground">{user?.level || "junior"}</span>
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-foreground">Progreso hacia {getNextLevelName()}</span>
                  <span className="text-sm font-bold text-primary">{Math.round(getLevelProgress())}%</span>
                </div>
                <div className="h-3 bg-secondary rounded-full overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-primary to-primary/80 rounded-full transition-all duration-500"
                    style={{ width: `${getLevelProgress()}%` }}
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4 pt-4 border-t border-border/50">
                <div className="space-y-1">
                  <p className="text-xs font-semibold uppercase text-muted-foreground tracking-wide">Puntos</p>
                  <p className="text-3xl font-bold text-primary">{user?.points || 0}</p>
                </div>
                <div className="space-y-1">
                  <p className="text-xs font-semibold uppercase text-muted-foreground tracking-wide">Próximo</p>
                  <p className="text-3xl font-bold text-foreground capitalize">{getNextLevelName()}</p>
                </div>
              </div>

              <Button className="w-full gap-2" asChild>
                <Link href="/gamification">
                  Ver Gamificación Completa
                  <ArrowRight className="w-4 h-4" />
                </Link>
              </Button>
            </CardContent>
          </Card>

          {/* Active Improvement Plan */}
          <Card className="hover:shadow-lg transition-all duration-300">
            <CardHeader className="space-y-1">
              <CardTitle className="text-xl">Plan de Mejora</CardTitle>
            </CardHeader>
            <CardContent>
              {activePlan ? (
                <div className="space-y-5">
                  <div className="space-y-1">
                    <h3 className="font-semibold text-foreground text-lg">{activePlan.title}</h3>
                    <p className="text-sm text-muted-foreground">{activePlan.description}</p>
                  </div>

                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-sm">
                      <span className="font-medium text-foreground">Progreso</span>
                      <span className="font-bold text-primary">{activePlan.progress}%</span>
                    </div>
                    <div className="h-2 bg-secondary rounded-full overflow-hidden">
                      <div
                        className="h-full bg-gradient-to-r from-primary to-primary/80 rounded-full transition-all duration-500"
                        style={{ width: `${activePlan.progress}%` }}
                      />
                    </div>
                  </div>

                  <Button variant="outline" className="w-full" asChild>
                    <Link href="/progress">
                      Ver Detalles
                    </Link>
                  </Button>
                </div>
              ) : (
                <div className="text-center py-8 space-y-3">
                  <CheckCircle2 className="w-16 h-16 text-accent mx-auto" />
                  <p className="text-sm text-muted-foreground font-medium">
                    No tienes planes activos
                  </p>
                  <p className="text-xs text-muted-foreground">
                    Completa entrenamientos para desbloquear planes
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Recent Simulations */}
        <Card className="hover:shadow-lg transition-all duration-300">
          <CardHeader className="space-y-2">
            <CardTitle className="flex items-center gap-2 text-2xl">
              <Clock className="w-6 h-6 text-primary" />
              Simulaciones Recientes
            </CardTitle>
            <CardDescription className="text-base">Tus últimas 5 sesiones de entrenamiento</CardDescription>
          </CardHeader>
          <CardContent>
            {recentSims.length > 0 ? (
              <div className="space-y-3">
                {recentSims.map((sim) => (
                  <div
                    key={sim.id}
                    className="flex items-center justify-between p-4 rounded-lg border border-border/50 hover:bg-accent/50 hover:border-border transition-all duration-200 group"
                  >
                    <div className="flex-1">
                      <p className="font-semibold text-foreground">Simulación #{sim.id}</p>
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

                    <Button variant="ghost" size="sm" asChild className="group-hover:bg-accent">
                      <Link href={`/simulations/${sim.id}`}>
                        Ver Detalles
                      </Link>
                    </Button>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-16 space-y-6">
                <Target className="w-20 h-20 text-muted-foreground mx-auto opacity-50" />
                <div>
                  <p className="text-xl font-semibold text-foreground">¡Comienza tu primer entrenamiento!</p>
                  <p className="text-muted-foreground mt-2">
                    Explora los escenarios disponibles y mejora tus habilidades
                  </p>
                </div>
                <Button size="lg" asChild>
                  <Link href="/scenarios" className="gap-2">
                    Ver Escenarios
                    <ArrowRight className="w-4 h-4" />
                  </Link>
                </Button>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Quick Actions */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-6">
          <Button size="lg" className="h-auto py-6 md:py-8 flex-col rounded-xl hover:shadow-lg transition-all duration-300" asChild>
            <Link href="/scenarios" className="gap-3">
              <BookOpen className="w-7 h-7" />
              <div className="flex flex-col items-center gap-1">
                <span className="font-bold text-base">Explorar Escenarios</span>
                <span className="text-xs opacity-80">Encuentra tu próximo desafío</span>
              </div>
            </Link>
          </Button>

          <Button size="lg" variant="outline" className="h-auto py-6 md:py-8 flex-col rounded-xl hover:shadow-lg transition-all duration-300" asChild>
            <Link href="/simulations" className="gap-3">
              <Target className="w-7 h-7" />
              <div className="flex flex-col items-center gap-1">
                <span className="font-bold text-base">Mis Simulaciones</span>
                <span className="text-xs opacity-80">Revisa tu historial</span>
              </div>
            </Link>
          </Button>

          <Button size="lg" variant="outline" className="h-auto py-6 md:py-8 flex-col rounded-xl hover:shadow-lg transition-all duration-300" asChild>
            <Link href="/progress" className="gap-3">
              <TrendingUp className="w-7 h-7" />
              <div className="flex flex-col items-center gap-1">
                <span className="font-bold text-base">Ver Progreso</span>
                <span className="text-xs opacity-80">Analiza tu evolución</span>
              </div>
            </Link>
          </Button>
        </div>
      </div>
      </div>
    </TrainingDashboardLayout>
  );
}
