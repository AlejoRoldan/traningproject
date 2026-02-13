import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { trpc } from "@/lib/trpc";
import { BarChart3, TrendingUp, Users, Target, Award, Clock } from "lucide-react";
import { useState } from "react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

export default function Analytics() {
  const [selectedAgentId, setSelectedAgentId] = useState<number | undefined>(undefined);
  
  const { data: agentsList } = trpc.analytics.getAgentsList.useQuery();
  const { data: stats, isLoading: statsLoading } = trpc.analytics.getOverallStats.useQuery({ userId: selectedAgentId });
  const { data: categoryPerformance, isLoading: categoryLoading } = trpc.analytics.getCategoryPerformance.useQuery({ userId: selectedAgentId });
  const { data: timeSeriesData, isLoading: timeSeriesLoading } = trpc.analytics.getTimeSeriesData.useQuery({ userId: selectedAgentId });
  const { data: leaderboard, isLoading: leaderboardLoading } = trpc.analytics.getLeaderboard.useQuery({ limit: 10, userId: selectedAgentId });

  if (statsLoading || categoryLoading || timeSeriesLoading || leaderboardLoading) {
    return (
      <div className="container mx-auto py-8">
        <div className="text-center py-12">
          <p className="text-muted-foreground">Cargando analíticas...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-8 space-y-8">
      <div className="flex justify-between items-start">
        <div>
          <h1 className="text-3xl font-bold mb-2">Analíticas</h1>
          <p className="text-muted-foreground">
            Métricas y estadísticas de rendimiento de la plataforma
          </p>
        </div>
        
        <div className="w-48">
          <label className="text-sm font-medium mb-2 block">Filtrar por Agente</label>
          <Select value={selectedAgentId?.toString() || "all"} onValueChange={(value) => setSelectedAgentId(value === "all" ? undefined : parseInt(value))}>
            <SelectTrigger>
              <SelectValue placeholder="Todos los agentes" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos los agentes</SelectItem>
              {agentsList?.map((agentId) => (
                <SelectItem key={agentId} value={agentId.toString()}>
                  Agente {agentId}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Overall Stats Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Simulaciones</CardTitle>
            <BarChart3 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.totalSimulations || 0}</div>
            <p className="text-xs text-muted-foreground">
              {stats?.completedSimulations || 0} completadas
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Promedio General</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.averageScore || 0}%</div>
            <p className="text-xs text-muted-foreground">
              Puntuación promedio de todos los agentes
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Agentes Activos</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.activeUsers || 0}</div>
            <p className="text-xs text-muted-foreground">
              Usuarios con simulaciones completadas
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Tiempo Promedio</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.averageDuration || 0}m</div>
            <p className="text-xs text-muted-foreground">
              Duración promedio por simulación
            </p>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="performance" className="space-y-4">
        <TabsList>
          <TabsTrigger value="performance">Rendimiento por Categoría</TabsTrigger>
          <TabsTrigger value="leaderboard">Tabla de Líderes</TabsTrigger>
          <TabsTrigger value="trends">Tendencias</TabsTrigger>
        </TabsList>

        <TabsContent value="performance" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Rendimiento por Categoría</CardTitle>
              <CardDescription>
                Promedio de puntuación por categoría de habilidad
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {categoryPerformance && categoryPerformance.length > 0 ? (
                  categoryPerformance.map((cat: any) => (
                    <div key={cat.category} className="space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-medium">{cat.category}</span>
                        <span className="text-sm text-muted-foreground">
                          {cat.averageScore}% ({cat.totalAttempts} intentos)
                        </span>
                      </div>
                      <div className="h-2 bg-muted rounded-full overflow-hidden">
                        <div
                          className={`h-full transition-all ${
                            cat.averageScore >= 80
                              ? 'bg-green-500'
                              : cat.averageScore >= 60
                              ? 'bg-yellow-500'
                              : 'bg-red-500'
                          }`}
                          style={{ width: `${cat.averageScore}%` }}
                        />
                      </div>
                    </div>
                  ))
                ) : (
                  <p className="text-center text-muted-foreground py-8">
                    No hay datos de rendimiento disponibles
                  </p>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="leaderboard" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Award className="h-5 w-5 text-yellow-500" />
                Tabla de Líderes
              </CardTitle>
              <CardDescription>
                Top 10 agentes con mejor rendimiento
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {leaderboard && leaderboard.length > 0 ? (
                  leaderboard.map((user: any, index: number) => (
                    <div
                      key={user.userId}
                      className="flex items-center justify-between p-4 border rounded-lg"
                    >
                      <div className="flex items-center gap-4">
                        <div
                          className={`h-10 w-10 rounded-full flex items-center justify-center font-bold ${
                            index === 0
                              ? 'bg-yellow-100 text-yellow-700'
                              : index === 1
                              ? 'bg-gray-100 text-gray-700'
                              : index === 2
                              ? 'bg-orange-100 text-orange-700'
                              : 'bg-muted text-muted-foreground'
                          }`}
                        >
                          {index + 1}
                        </div>
                        <div>
                          <h4 className="font-semibold">{user.userName || `Agente ${user.userId}`}</h4>
                          <p className="text-sm text-muted-foreground">
                            {user.completedSimulations} simulaciones completadas
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-2xl font-bold">{user.averageScore}%</div>
                        <Badge variant="secondary">{user.totalPoints} pts</Badge>
                      </div>
                    </div>
                  ))
                ) : (
                  <p className="text-center text-muted-foreground py-8">
                    No hay datos de leaderboard disponibles
                  </p>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="trends" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Tendencias de Rendimiento</CardTitle>
              <CardDescription>
                Evolución del rendimiento en los últimos 30 días
              </CardDescription>
            </CardHeader>
            <CardContent>
              {timeSeriesData && timeSeriesData.length > 0 ? (
                <div className="space-y-4">
                  <div className="h-64 flex items-end justify-between gap-2">
                    {timeSeriesData.slice(-14).map((point: any, index: number) => (
                      <div key={index} className="flex-1 flex flex-col items-center gap-2">
                        <div className="w-full bg-muted rounded-t-lg relative" style={{ height: '200px' }}>
                          <div
                            className="absolute bottom-0 w-full bg-primary rounded-t-lg transition-all"
                            style={{ height: `${(point.averageScore / 100) * 200}px` }}
                          />
                        </div>
                        <span className="text-xs text-muted-foreground">
                          {new Date(point.date).getDate()}/{new Date(point.date).getMonth() + 1}
                        </span>
                      </div>
                    ))}
                  </div>
                  <div className="grid grid-cols-3 gap-4 pt-4 border-t">
                    <div className="text-center">
                      <p className="text-sm text-muted-foreground">Simulaciones</p>
                      <p className="text-2xl font-bold">
                        {timeSeriesData.reduce((sum: number, p: any) => sum + p.simulationsCount, 0)}
                      </p>
                    </div>
                    <div className="text-center">
                      <p className="text-sm text-muted-foreground">Promedio</p>
                      <p className="text-2xl font-bold">
                        {Math.round(
                          timeSeriesData.reduce((sum: number, p: any) => sum + p.averageScore, 0) /
                            timeSeriesData.length
                        )}%
                      </p>
                    </div>
                    <div className="text-center">
                      <p className="text-sm text-muted-foreground">Tasa de Éxito</p>
                      <p className="text-2xl font-bold">
                        {Math.round(
                          (timeSeriesData.reduce((sum: number, p: any) => sum + (p.averageScore >= 70 ? 1 : 0), 0) /
                            timeSeriesData.length) *
                            100
                        )}%
                      </p>
                    </div>
                  </div>
                </div>
              ) : (
                <p className="text-center text-muted-foreground py-8">
                  No hay datos de tendencias disponibles
                </p>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
