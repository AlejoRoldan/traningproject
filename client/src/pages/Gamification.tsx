import { useAuth } from "@/_core/hooks/useAuth";
import TrainingDashboardLayout from "@/components/TrainingDashboardLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { trpc } from "@/lib/trpc";
import { 
  Trophy, 
  Award, 
  Star,
  Zap,
  Shield,
  Target,
  Crown,
  Flame,
  Lock
} from "lucide-react";

const badgeDefinitions: Record<string, { name: string; description: string; icon: React.ElementType; color: string }> = {
  empathy_pro: {
    name: "Maestro de Empatía",
    description: "Logra 90% o más en empatía",
    icon: Award,
    color: "text-pink-600 dark:text-pink-400"
  },
  protocol_master: {
    name: "Guardián del Protocolo",
    description: "Logra 95% o más en protocolo",
    icon: Shield,
    color: "text-blue-600 dark:text-blue-400"
  },
  problem_solver: {
    name: "Solucionador Experto",
    description: "Logra 90% o más en resolución",
    icon: Target,
    color: "text-green-600 dark:text-green-400"
  },
  crisis_handler: {
    name: "Manejador de Crisis",
    description: "Completa escenario nivel 4+ con 85%+",
    icon: Flame,
    color: "text-orange-600 dark:text-orange-400"
  },
  excellence_award: {
    name: "Premio a la Excelencia",
    description: "Logra 95% o más en cualquier simulación",
    icon: Crown,
    color: "text-yellow-600 dark:text-yellow-400"
  },
  first_steps: {
    name: "Primeros Pasos",
    description: "Completa tu primera simulación",
    icon: Star,
    color: "text-gray-600 dark:text-gray-400"
  },
  dedicated_learner: {
    name: "Aprendiz Dedicado",
    description: "Completa 10 simulaciones",
    icon: Zap,
    color: "text-purple-600 dark:text-purple-400"
  },
  master_trainer: {
    name: "Maestro del Entrenamiento",
    description: "Completa 50 simulaciones",
    icon: Trophy,
    color: "text-primary"
  }
};

const levelThresholds = {
  junior: { min: 0, max: 499, next: "intermediate", color: "text-gray-600 dark:text-gray-400" },
  intermediate: { min: 500, max: 1499, next: "senior", color: "text-blue-600 dark:text-blue-400" },
  senior: { min: 1500, max: 2999, next: "expert", color: "text-purple-600 dark:text-purple-400" },
  expert: { min: 3000, max: Infinity, next: null, color: "text-primary" }
};

export default function Gamification() {
  const { user } = useAuth();
  const userBadgesQuery = trpc.user.badges.useQuery();
  const userStatsQuery = trpc.user.stats.useQuery();
  
  const earnedBadges = userBadgesQuery.data || [];
  const stats = userStatsQuery.data;
  
  const points = user?.points || 0;
  const level = (user?.level || "junior") as keyof typeof levelThresholds;
  const levelInfo = levelThresholds[level];
  
  const progressToNextLevel = levelInfo.next 
    ? ((points - levelInfo.min) / (levelThresholds[levelInfo.next as keyof typeof levelThresholds].min - levelInfo.min)) * 100
    : 100;

  const earnedBadgeIds = new Set(earnedBadges.map(b => b.badge.name.toLowerCase().replace(/ /g, "_")));

  return (
    <TrainingDashboardLayout>
      <div className="p-8 space-y-8">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold text-foreground">Gamificación</h1>
          <p className="text-muted-foreground mt-1">
            Desbloquea logros y avanza de nivel mientras mejoras tus habilidades
          </p>
        </div>

        {/* Level Progress Card */}
        <Card className="border-2 border-primary/50 bg-gradient-to-br from-primary/5 to-transparent">
          <CardContent className="pt-6">
            <div className="flex items-center gap-6">
              {/* Level Badge */}
              <div className="relative">
                <div className="w-32 h-32 rounded-full bg-primary/10 border-4 border-primary flex items-center justify-center">
                  <div className="text-center">
                    <Trophy className="w-12 h-12 text-primary mx-auto mb-2" />
                    <span className={`text-xl font-bold uppercase ${levelInfo.color}`}>
                      {level}
                    </span>
                  </div>
                </div>
                {levelInfo.next && (
                  <div className="absolute -bottom-2 left-1/2 -translate-x-1/2 bg-background border border-border rounded-full px-3 py-1">
                    <span className="text-xs font-semibold text-muted-foreground">
                      Próximo: {levelInfo.next}
                    </span>
                  </div>
                )}
              </div>

              {/* Progress Info */}
              <div className="flex-1 space-y-4">
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="text-2xl font-bold text-foreground">Nivel: {level.charAt(0).toUpperCase() + level.slice(1)}</h3>
                    <span className="text-3xl font-bold text-primary">{points} pts</span>
                  </div>
                  {levelInfo.next && (
                    <>
                      <Progress value={progressToNextLevel} className="h-4 mb-2" />
                      <div className="flex items-center justify-between text-sm text-muted-foreground">
                        <span>{points} / {levelThresholds[levelInfo.next as keyof typeof levelThresholds].min} puntos</span>
                        <span>{Math.round(progressToNextLevel)}% completado</span>
                      </div>
                    </>
                  )}
                  {!levelInfo.next && (
                    <p className="text-lg text-primary font-semibold">¡Has alcanzado el nivel máximo!</p>
                  )}
                </div>

                {/* Quick Stats */}
                <div className="grid grid-cols-3 gap-4 pt-4 border-t border-border">
                  <div>
                    <p className="text-xs text-muted-foreground">Simulaciones</p>
                    <p className="text-2xl font-bold text-foreground">{stats?.totalSimulations || 0}</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Promedio</p>
                    <p className="text-2xl font-bold text-foreground">{stats?.averageScore || 0}%</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Badges</p>
                    <p className="text-2xl font-bold text-foreground">{earnedBadges.length}</p>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Level Milestones */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Crown className="w-5 h-5 text-primary" />
              Niveles y Recompensas
            </CardTitle>
            <CardDescription>Progresa a través de los niveles ganando puntos</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {Object.entries(levelThresholds).map(([levelKey, info]) => {
                const isCurrentLevel = levelKey === level;
                const isPastLevel = points > info.max;
                const isFutureLevel = points < info.min;

                return (
                  <div 
                    key={levelKey}
                    className={`flex items-center gap-4 p-4 rounded-lg border-2 ${
                      isCurrentLevel 
                        ? "border-primary bg-primary/5" 
                        : isPastLevel
                        ? "border-green-500/20 bg-green-500/5"
                        : "border-border bg-muted/30"
                    }`}
                  >
                    <div className={`w-12 h-12 rounded-full flex items-center justify-center ${
                      isPastLevel ? "bg-green-500/20" : isCurrentLevel ? "bg-primary/20" : "bg-muted"
                    }`}>
                      {isPastLevel ? (
                        <Trophy className="w-6 h-6 text-green-600 dark:text-green-400" />
                      ) : isFutureLevel ? (
                        <Lock className="w-6 h-6 text-muted-foreground" />
                      ) : (
                        <Zap className="w-6 h-6 text-primary" />
                      )}
                    </div>
                    
                    <div className="flex-1">
                      <h4 className={`font-bold text-lg capitalize ${info.color}`}>
                        {levelKey}
                      </h4>
                      <p className="text-sm text-muted-foreground">
                        {info.min} - {info.max === Infinity ? "∞" : info.max} puntos
                      </p>
                    </div>

                    {isCurrentLevel && (
                      <Badge variant="default">Nivel Actual</Badge>
                    )}
                    {isPastLevel && (
                      <Badge variant="outline" className="bg-green-500/10 text-green-700 dark:text-green-400 border-green-500/20">
                        Completado
                      </Badge>
                    )}
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>

        {/* Badges Section */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Award className="w-5 h-5 text-primary" />
              Colección de Badges
            </CardTitle>
            <CardDescription>
              {earnedBadges.length} de {Object.keys(badgeDefinitions).length} badges desbloqueados
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {Object.entries(badgeDefinitions).map(([badgeId, badge]) => {
                const isEarned = earnedBadgeIds.has(badgeId);
                const BadgeIcon = badge.icon;

                return (
                  <div
                    key={badgeId}
                    className={`p-6 rounded-lg border-2 transition-all ${
                      isEarned
                        ? "border-primary/50 bg-primary/5 hover:shadow-lg"
                        : "border-border bg-muted/30 opacity-60"
                    }`}
                  >
                    <div className="flex flex-col items-center text-center space-y-3">
                      <div className={`w-16 h-16 rounded-full flex items-center justify-center ${
                        isEarned ? "bg-primary/20" : "bg-muted"
                      }`}>
                        {isEarned ? (
                          <BadgeIcon className={`w-8 h-8 ${badge.color}`} />
                        ) : (
                          <Lock className="w-8 h-8 text-muted-foreground" />
                        )}
                      </div>
                      
                      <div>
                        <h4 className={`font-bold ${isEarned ? "text-foreground" : "text-muted-foreground"}`}>
                          {badge.name}
                        </h4>
                        <p className="text-xs text-muted-foreground mt-1">
                          {badge.description}
                        </p>
                      </div>

                      {isEarned && (
                        <Badge variant="outline" className="text-xs">
                          <Award className="w-3 h-3 mr-1" />
                          Desbloqueado
                        </Badge>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>

        {/* Achievements Summary */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Star className="w-5 h-5 text-primary" />
              Resumen de Logros
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="text-center p-6 rounded-lg bg-accent/50">
                <Trophy className="w-12 h-12 text-primary mx-auto mb-3" />
                <p className="text-3xl font-bold text-foreground">{earnedBadges.length}</p>
                <p className="text-sm text-muted-foreground mt-1">Badges Ganados</p>
              </div>
              
              <div className="text-center p-6 rounded-lg bg-accent/50">
                <Zap className="w-12 h-12 text-primary mx-auto mb-3" />
                <p className="text-3xl font-bold text-foreground">{points}</p>
                <p className="text-sm text-muted-foreground mt-1">Puntos Totales</p>
              </div>
              
              <div className="text-center p-6 rounded-lg bg-accent/50">
                <Target className="w-12 h-12 text-primary mx-auto mb-3" />
                <p className="text-3xl font-bold text-foreground capitalize">{level}</p>
                <p className="text-sm text-muted-foreground mt-1">Nivel Actual</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </TrainingDashboardLayout>
  );
}
