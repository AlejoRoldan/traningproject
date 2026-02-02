import TrainingDashboardLayout from "@/components/TrainingDashboardLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Progress } from "@/components/ui/progress";
import { trpc } from "@/lib/trpc";
import { 
  Users, 
  TrendingUp, 
  TrendingDown,
  Award,
  Target,
  AlertTriangle,
  CheckCircle2,
  BarChart3
} from "lucide-react";

export default function Team() {
  const teamMembersQuery = trpc.supervisor.teamMembers.useQuery();
  const teamStatsQuery = trpc.supervisor.teamStats.useQuery({ period: "weekly" });
  
  const teamMembers = teamMembersQuery.data || [];
  const teamStats = teamStatsQuery.data;

  const getInitials = (name: string | null) => {
    if (!name) return "U";
    return name.split(" ").map(n => n[0]).join("").toUpperCase().slice(0, 2);
  };

  const getLevelColor = (level: string | null) => {
    switch (level) {
      case "expert": return "text-primary";
      case "senior": return "text-purple-600 dark:text-purple-400";
      case "intermediate": return "text-blue-600 dark:text-blue-400";
      default: return "text-gray-600 dark:text-gray-400";
    }
  };

  const getPerformanceStatus = (avgScore: number) => {
    if (avgScore >= 85) return { label: "Excelente", color: "bg-green-500/10 text-green-700 dark:text-green-400 border-green-500/20", icon: CheckCircle2 };
    if (avgScore >= 70) return { label: "Bueno", color: "bg-blue-500/10 text-blue-700 dark:text-blue-400 border-blue-500/20", icon: TrendingUp };
    if (avgScore >= 60) return { label: "Regular", color: "bg-yellow-500/10 text-yellow-700 dark:text-yellow-400 border-yellow-500/20", icon: Target };
    return { label: "Necesita Apoyo", color: "bg-red-500/10 text-red-700 dark:text-red-400 border-red-500/20", icon: AlertTriangle };
  };

  // Calculate team averages (mock data for now)
  const teamAverage = teamMembers.length > 0 
    ? Math.round(teamMembers.reduce((sum: number, member: any) => sum + (member.points || 0), 0) / teamMembers.length)
    : 0;

  return (
    <TrainingDashboardLayout>
      <div className="p-8 space-y-8">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold text-foreground">Mi Equipo</h1>
          <p className="text-muted-foreground mt-1">
            Monitorea el progreso y desempeño de tu equipo
          </p>
        </div>

        {/* Team Overview Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <Card className="border-l-4 border-l-primary">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                <Users className="w-4 h-4" />
                Total de Agentes
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-foreground">{teamMembers.length}</div>
              <p className="text-xs text-muted-foreground mt-1">Miembros activos</p>
            </CardContent>
          </Card>

          <Card className="border-l-4 border-l-chart-2">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                <TrendingUp className="w-4 h-4" />
                Promedio del Equipo
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-foreground">{teamAverage}%</div>
              <p className="text-xs text-muted-foreground mt-1">Puntuación general</p>
            </CardContent>
          </Card>

          <Card className="border-l-4 border-l-chart-4">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                <Target className="w-4 h-4" />
                Simulaciones Totales
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-foreground">
                {teamStats && teamStats.length > 0 ? teamStats[0].totalSimulations : 0}
              </div>
              <p className="text-xs text-muted-foreground mt-1">Esta semana</p>
            </CardContent>
          </Card>

          <Card className="border-l-4 border-l-chart-1">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                <AlertTriangle className="w-4 h-4" />
                Requieren Atención
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-orange-600 dark:text-orange-400">
                {teamMembers.filter((m: any) => (m.points || 0) < 300).length}
              </div>
              <p className="text-xs text-muted-foreground mt-1">Agentes con bajo desempeño</p>
            </CardContent>
          </Card>
        </div>

        {/* Team Members List */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="w-5 h-5 text-primary" />
              Miembros del Equipo
            </CardTitle>
            <CardDescription>Vista detallada de cada agente</CardDescription>
          </CardHeader>
          <CardContent>
            {teamMembers.length > 0 ? (
              <div className="space-y-4">
                {teamMembers.map((member: any) => {
                  // Mock average score calculation
                  const avgScore = Math.floor(Math.random() * 40) + 60;
                  const status = getPerformanceStatus(avgScore);
                  const StatusIcon = status.icon;

                  return (
                    <div 
                      key={member.id}
                      className="flex items-center gap-4 p-4 rounded-lg border-2 border-border hover:border-primary/50 transition-colors"
                    >
                      {/* Avatar */}
                      <Avatar className="h-14 w-14 border-2 border-primary">
                        <AvatarFallback className="bg-primary/10 text-primary font-semibold">
                          {getInitials(member.name)}
                        </AvatarFallback>
                      </Avatar>

                      {/* Info */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-3 mb-1">
                          <h3 className="font-semibold text-lg text-foreground truncate">
                            {member.name || "Usuario"}
                          </h3>
                          <Badge variant="outline" className={getLevelColor(member.level)}>
                            {member.level || "junior"}
                          </Badge>
                          <Badge variant="outline" className={status.color}>
                            <StatusIcon className="w-3 h-3 mr-1" />
                            {status.label}
                          </Badge>
                        </div>
                        
                        <div className="flex items-center gap-6 text-sm text-muted-foreground">
                          <span>{member.email}</span>
                          <span className="flex items-center gap-1">
                            <Award className="w-4 h-4" />
                            {member.points || 0} puntos
                          </span>
                        </div>

                        {/* Progress Bar */}
                        <div className="mt-3 space-y-1">
                          <div className="flex items-center justify-between text-xs">
                            <span className="text-muted-foreground">Desempeño promedio</span>
                            <span className="font-semibold text-foreground">{avgScore}%</span>
                          </div>
                          <Progress value={avgScore} className="h-2" />
                        </div>
                      </div>

                      {/* Actions */}
                      <div className="flex flex-col gap-2">
                        <Button variant="outline" size="sm">
                          Ver Detalles
                        </Button>
                        <Button variant="ghost" size="sm">
                          Asignar Plan
                        </Button>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="text-center py-12 space-y-4">
                <Users className="w-16 h-16 text-muted-foreground mx-auto" />
                <div>
                  <h3 className="text-lg font-semibold text-foreground">No hay miembros en el equipo</h3>
                  <p className="text-sm text-muted-foreground mt-1">
                    Los agentes asignados aparecerán aquí
                  </p>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Performance Distribution */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BarChart3 className="w-5 h-5 text-primary" />
                Distribución de Desempeño
              </CardTitle>
              <CardDescription>Clasificación del equipo por nivel</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {[
                { label: "Excelente (85%+)", count: teamMembers.filter((m: any) => (m.points || 0) > 1000).length, color: "bg-green-500" },
                { label: "Bueno (70-84%)", count: teamMembers.filter((m: any) => (m.points || 0) > 500 && (m.points || 0) <= 1000).length, color: "bg-blue-500" },
                { label: "Regular (60-69%)", count: teamMembers.filter((m: any) => (m.points || 0) > 300 && (m.points || 0) <= 500).length, color: "bg-yellow-500" },
                { label: "Necesita Apoyo (<60%)", count: teamMembers.filter((m: any) => (m.points || 0) <= 300).length, color: "bg-red-500" }
              ].map((category, index) => (
                <div key={index} className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-foreground">{category.label}</span>
                    <span className="text-sm text-muted-foreground">{category.count} agentes</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Progress 
                      value={teamMembers.length > 0 ? (category.count / teamMembers.length) * 100 : 0} 
                      className="h-2 flex-1" 
                    />
                    <span className="text-xs font-semibold text-foreground w-12 text-right">
                      {teamMembers.length > 0 ? Math.round((category.count / teamMembers.length) * 100) : 0}%
                    </span>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Target className="w-5 h-5 text-primary" />
                Niveles del Equipo
              </CardTitle>
              <CardDescription>Distribución por nivel de experiencia</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {["expert", "senior", "intermediate", "junior"].map(level => {
                const count = teamMembers.filter((m: any) => (m.level || "junior") === level).length;
                return (
                  <div key={level} className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium text-foreground capitalize">{level}</span>
                      <span className="text-sm text-muted-foreground">{count} agentes</span>
                    </div>
                    <Progress 
                      value={teamMembers.length > 0 ? (count / teamMembers.length) * 100 : 0} 
                      className="h-2" 
                    />
                  </div>
                );
              })}
            </CardContent>
          </Card>
        </div>
      </div>
    </TrainingDashboardLayout>
  );
}
