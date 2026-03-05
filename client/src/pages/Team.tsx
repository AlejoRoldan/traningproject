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
      case "senior": return "text-chart-2";
      case "intermediate": return "text-chart-4";
      default: return "text-muted-foreground";
    }
  };

  const getPerformanceStatus = (avgScore: number) => {
    if (avgScore >= 85) return { label: "Excelente", color: "bg-primary/10 text-primary border-primary/20", icon: CheckCircle2 };
    if (avgScore >= 70) return { label: "Bueno", color: "bg-chart-4/10 text-chart-4 border-chart-4/20", icon: TrendingUp };
    if (avgScore >= 60) return { label: "Regular", color: "bg-chart-2/10 text-chart-2 border-chart-2/20", icon: Target };
    return { label: "Necesita Apoyo", color: "bg-destructive/10 text-destructive border-destructive/20", icon: AlertTriangle };
  };

  // Calculate team averages (mock data for now)
  const teamAverage = teamMembers.length > 0 
    ? Math.round(teamMembers.reduce((sum: number, member: any) => sum + (member.points || 0), 0) / teamMembers.length)
    : 0;

  return (
    <TrainingDashboardLayout>
      <div className="min-h-screen bg-background">
        <div className="p-8 md:p-10 lg:p-12 space-y-10">
          {/* Header */}
          <div className="space-y-3">
            <h1 className="text-4xl md:text-5xl font-bold text-foreground tracking-tight">Mi Equipo</h1>
            <p className="text-lg text-muted-foreground max-w-2xl">
              Monitorea el progreso y desempeño de tu equipo
            </p>
          </div>

          {/* Team Overview Stats */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 md:gap-6">
          <Card className="relative overflow-hidden group hover:shadow-lg transition-all duration-300 border border-border/50">
            <div className="absolute top-0 left-0 w-1 h-full bg-gradient-to-b from-primary to-primary/50"></div>
            <CardHeader className="pb-2">
              <CardTitle className="text-xs font-semibold text-muted-foreground uppercase tracking-wide flex items-center gap-2">
                <Users className="w-4 h-4 text-primary" />
                Total
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="text-4xl font-bold text-foreground">{teamMembers.length}</div>
              <p className="text-sm text-muted-foreground">Miembros activos</p>
            </CardContent>
          </Card>

          <Card className="relative overflow-hidden group hover:shadow-lg transition-all duration-300 border border-border/50">
            <div className="absolute top-0 left-0 w-1 h-full bg-gradient-to-b from-chart-2 to-chart-2/50"></div>
            <CardHeader className="pb-2">
              <CardTitle className="text-xs font-semibold text-muted-foreground uppercase tracking-wide flex items-center gap-2">
                <TrendingUp className="w-4 h-4 text-chart-2" />
                Promedio
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="text-4xl font-bold text-foreground">{teamAverage}%</div>
              <p className="text-sm text-muted-foreground">Puntuación general</p>
            </CardContent>
          </Card>

          <Card className="relative overflow-hidden group hover:shadow-lg transition-all duration-300 border border-border/50">
            <div className="absolute top-0 left-0 w-1 h-full bg-gradient-to-b from-chart-4 to-chart-4/50"></div>
            <CardHeader className="pb-2">
              <CardTitle className="text-xs font-semibold text-muted-foreground uppercase tracking-wide flex items-center gap-2">
                <Target className="w-4 h-4 text-chart-4" />
                Simulaciones
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="text-4xl font-bold text-foreground">
                {teamStats && teamStats.length > 0 ? teamStats[0].totalSimulations : 0}
              </div>
              <p className="text-sm text-muted-foreground">Esta semana</p>
            </CardContent>
          </Card>

          <Card className="relative overflow-hidden group hover:shadow-lg transition-all duration-300 border border-border/50">
            <div className="absolute top-0 left-0 w-1 h-full bg-gradient-to-b from-destructive to-destructive/50"></div>
            <CardHeader className="pb-2">
              <CardTitle className="text-xs font-semibold text-muted-foreground uppercase tracking-wide flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-destructive" />
                Atención
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="text-4xl font-bold text-destructive">
                {teamMembers.filter((m: any) => (m.points || 0) < 300).length}
              </div>
              <p className="text-sm text-muted-foreground">Bajo desempeño</p>
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
