import { useAuth } from "@/_core/hooks/useAuth";
import { trpc } from "@/lib/trpc";
import { Link } from "wouter";
import {
  Target, Flame, Star, Trophy, ArrowRight, Play,
  TrendingUp, BookOpen, Clock, CheckCircle2, Loader2
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  MetricCard, DifficultyBadge, CategoryBadge, WeeklyProgress, ScoreCircle, LevelBadge
} from "@/components/KaitelComponents";
import { cn } from "@/lib/utils";
import { formatDistanceToNow } from "date-fns";
import { es } from "date-fns/locale";

export default function Dashboard() {
  const { user } = useAuth();
  const { data: stats, isLoading } = trpc.dashboard.stats.useQuery();
  const { data: profile } = trpc.gamification.profile.useQuery();

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-full">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  const greeting = () => {
    const h = new Date().getHours();
    if (h < 12) return "Buenos días";
    if (h < 18) return "Buenas tardes";
    return "Buenas noches";
  };

  const firstName = user?.name?.split(" ")[0] ?? "Agente";

  return (
    <div className="p-6 space-y-6 max-w-7xl">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">
            {greeting()}, {firstName} 👋
          </h1>
          <p className="text-muted-foreground text-sm mt-1">
            Aquí está tu resumen de entrenamiento de hoy
          </p>
        </div>
        <div className="flex items-center gap-2">
          <LevelBadge level={profile?.level ?? "junior"} />
          {(stats?.currentStreak ?? 0) > 0 && (
            <div className="flex items-center gap-1.5 bg-orange-900/30 text-orange-400 px-3 py-1.5 rounded-full text-sm font-semibold border border-orange-800/40">
              <Flame className="h-4 w-4" />
              {stats?.currentStreak} días
            </div>
          )}
        </div>
      </div>

      {/* Metric Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <MetricCard
          title="Simulaciones"
          value={stats?.totalCompleted ?? 0}
          subtitle="completadas"
          icon={Target}
          color="green"
        />
        <MetricCard
          title="Score Promedio"
          value={`${stats?.avgScore ?? 0}/100`}
          subtitle="en evaluadas"
          icon={Star}
          color="yellow"
        />
        <MetricCard
          title="Racha Actual"
          value={`${stats?.currentStreak ?? 0} días`}
          subtitle={stats?.currentStreak ? "¡Sigue así!" : "Comienza hoy"}
          icon={Flame}
          color="default"
        />
        <MetricCard
          title="XP Total"
          value={stats?.xpTotal ?? 0}
          subtitle="puntos de experiencia"
          icon={Trophy}
          color="purple"
        />
      </div>

      {/* Main Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Weekly Progress */}
        <Card className="bg-card border-border lg:col-span-2">
          <CardHeader className="pb-3">
            <CardTitle className="text-base font-semibold text-foreground flex items-center gap-2">
              <TrendingUp className="h-4 w-4 text-primary" />
              Progreso Semanal
            </CardTitle>
          </CardHeader>
          <CardContent>
            {stats?.weeklyGoal ? (
              <WeeklyProgress
                completedDays={(stats.weeklyGoal.completedDays as string[]) ?? []}
                completedSimulations={stats.weeklyGoal.completedSimulations ?? 0}
                requiredSimulations={stats.weeklyGoal.requiredSimulations ?? 5}
              />
            ) : (
              <div className="text-center py-6 text-muted-foreground">
                <p className="text-sm">Completa tu primera simulación para ver el progreso semanal</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* XP Progress */}
        <Card className="bg-card border-border">
          <CardHeader className="pb-3">
            <CardTitle className="text-base font-semibold text-foreground flex items-center gap-2">
              <Trophy className="h-4 w-4 text-yellow-400" />
              Progreso de Nivel
            </CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col items-center gap-4">
            <ScoreCircle score={profile?.progressPercent ?? 0} size="lg" />
            <div className="text-center">
              <div className="text-sm font-semibold text-foreground">
                {profile?.level === "experto" ? "Nivel Máximo" : `Hacia ${profile?.nextLevel ?? "Intermedio"}`}
              </div>
              <div className="text-xs text-muted-foreground mt-1">
                {profile?.xpNeeded
                  ? `${profile.xpNeeded - (profile.xpInLevel ?? 0)} XP para subir de nivel`
                  : "¡Eres Experto!"}
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Recommended Scenario */}
      {stats?.recommendedScenario && (
        <Card className="bg-card border-border border-primary/20">
          <CardHeader className="pb-3">
            <CardTitle className="text-base font-semibold text-foreground flex items-center gap-2">
              <Star className="h-4 w-4 text-primary" />
              Simulación Recomendada para Ti
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between gap-4">
              <div className="flex-1 space-y-2">
                <div className="flex items-center gap-2 flex-wrap">
                  <CategoryBadge category={stats.recommendedScenario.category} />
                  <DifficultyBadge difficulty={stats.recommendedScenario.difficulty} />
                  <span className="text-xs text-muted-foreground flex items-center gap-1">
                    <Clock className="h-3 w-3" />
                    {stats.recommendedScenario.durationMin}-{stats.recommendedScenario.durationMax} min
                  </span>
                </div>
                <h3 className="font-semibold text-foreground">{stats.recommendedScenario.title}</h3>
                <p className="text-sm text-muted-foreground line-clamp-2">{stats.recommendedScenario.description}</p>
                <div className="text-xs text-primary font-semibold">
                  +{stats.recommendedScenario.xpReward} XP al completar
                </div>
              </div>
              <Link href={`/simulaciones/${stats.recommendedScenario.id}`}>
                <Button className="bg-primary text-primary-foreground hover:bg-primary/90 gap-2 flex-shrink-0">
                  <Play className="h-4 w-4" />
                  Iniciar
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Recent Activity */}
      {(stats?.recentSessions?.length ?? 0) > 0 && (
        <Card className="bg-card border-border">
          <CardHeader className="pb-3 flex flex-row items-center justify-between">
            <CardTitle className="text-base font-semibold text-foreground flex items-center gap-2">
              <Clock className="h-4 w-4 text-muted-foreground" />
              Actividad Reciente
            </CardTitle>
            <Link href="/simulaciones">
              <Button variant="ghost" size="sm" className="text-primary text-xs gap-1">
                Ver todas <ArrowRight className="h-3 w-3" />
              </Button>
            </Link>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {stats?.recentSessions?.map((session: any) => (
                <div key={session.id} className="flex items-center gap-3 p-3 rounded-lg bg-secondary/50 hover:bg-secondary transition-colors">
                  <CheckCircle2 className="h-4 w-4 text-primary flex-shrink-0" />
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-medium text-foreground truncate">
                      Sesión #{session.id}
                    </div>
                    <div className="text-xs text-muted-foreground">
                      {session.completedAt
                        ? formatDistanceToNow(new Date(session.completedAt), { addSuffix: true, locale: es })
                        : "Reciente"}
                    </div>
                  </div>
                  <div className={cn(
                    "text-sm font-bold",
                    (session.overallScore ?? 0) >= 85 ? "text-green-400"
                      : (session.overallScore ?? 0) >= 70 ? "text-yellow-400"
                        : "text-red-400"
                  )}>
                    {session.overallScore ?? 0}/100
                  </div>
                  <div className="text-xs text-primary font-semibold">
                    +{session.xpEarned ?? 0} XP
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Quick Actions */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Link href="/simulaciones">
          <div className="bg-card border border-border hover:border-primary/40 rounded-xl p-4 flex items-center gap-3 cursor-pointer transition-all hover:bg-primary/5 group">
            <div className="w-10 h-10 rounded-lg bg-primary/15 flex items-center justify-center group-hover:bg-primary/25 transition-colors">
              <Play className="h-5 w-5 text-primary" />
            </div>
            <div>
              <div className="text-sm font-semibold text-foreground">Nueva Simulación</div>
              <div className="text-xs text-muted-foreground">Elige un escenario</div>
            </div>
            <ArrowRight className="h-4 w-4 text-muted-foreground ml-auto group-hover:text-primary transition-colors" />
          </div>
        </Link>
        <Link href="/desempeno">
          <div className="bg-card border border-border hover:border-primary/40 rounded-xl p-4 flex items-center gap-3 cursor-pointer transition-all hover:bg-primary/5 group">
            <div className="w-10 h-10 rounded-lg bg-blue-900/30 flex items-center justify-center group-hover:bg-blue-900/50 transition-colors">
              <TrendingUp className="h-5 w-5 text-blue-400" />
            </div>
            <div>
              <div className="text-sm font-semibold text-foreground">Mi Desempeño</div>
              <div className="text-xs text-muted-foreground">Ver análisis detallado</div>
            </div>
            <ArrowRight className="h-4 w-4 text-muted-foreground ml-auto group-hover:text-primary transition-colors" />
          </div>
        </Link>
        <Link href="/biblioteca">
          <div className="bg-card border border-border hover:border-primary/40 rounded-xl p-4 flex items-center gap-3 cursor-pointer transition-all hover:bg-primary/5 group">
            <div className="w-10 h-10 rounded-lg bg-purple-900/30 flex items-center justify-center group-hover:bg-purple-900/50 transition-colors">
              <BookOpen className="h-5 w-5 text-purple-400" />
            </div>
            <div>
              <div className="text-sm font-semibold text-foreground">Biblioteca</div>
              <div className="text-xs text-muted-foreground">Recursos y guías</div>
            </div>
            <ArrowRight className="h-4 w-4 text-muted-foreground ml-auto group-hover:text-primary transition-colors" />
          </div>
        </Link>
      </div>
    </div>
  );
}
