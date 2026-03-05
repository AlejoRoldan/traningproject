import { useAuth } from "@/_core/hooks/useAuth";
import { trpc } from "@/lib/trpc";
import { BarChart3, Lightbulb, Trophy, Loader2, TrendingUp, Calendar } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ScoreBar, BadgeIcon, MetricCard } from "@/components/KaitelComponents";
import {
  RadarChart, PolarGrid, PolarAngleAxis, Radar, ResponsiveContainer,
  BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid
} from "recharts";
import { cn } from "@/lib/utils";

export default function Performance() {
  const { user } = useAuth();
  const { data: stats, isLoading } = trpc.performance.stats.useQuery();
  const { data: tips, isLoading: tipsLoading } = trpc.performance.tips.useQuery();
  const { data: badges } = trpc.gamification.badges.useQuery();
  const { data: profile } = trpc.gamification.profile.useQuery();

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-full">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  const radarData = [
    { dimension: "Empatía", score: stats?.empathy ?? 0, fullMark: 100 },
    { dimension: "Claridad", score: stats?.clarity ?? 0, fullMark: 100 },
    { dimension: "Protocolo", score: stats?.protocol ?? 0, fullMark: 100 },
    { dimension: "Resolución", score: stats?.resolution ?? 0, fullMark: 100 },
    { dimension: "Profesionalismo", score: stats?.professionalism ?? 0, fullMark: 100 },
  ];

  const activityData = stats?.recentActivity?.map((a: any) => ({
    date: new Date(a.date).toLocaleDateString("es", { weekday: "short" }),
    simulaciones: a.simulationsCount,
    score: a.avgScore,
  })) ?? [];

  const dimensionDetails = [
    { key: "empathy", label: "Empatía", icon: "❤️", description: "Conexión emocional con el cliente", value: stats?.empathy ?? 0 },
    { key: "clarity", label: "Claridad", icon: "💡", description: "Comunicación clara y comprensible", value: stats?.clarity ?? 0 },
    { key: "protocol", label: "Protocolo", icon: "📋", description: "Cumplimiento de procedimientos", value: stats?.protocol ?? 0 },
    { key: "resolution", label: "Resolución", icon: "✅", description: "Efectividad en resolver problemas", value: stats?.resolution ?? 0 },
    { key: "professionalism", label: "Profesionalismo", icon: "🎯", description: "Tono y manejo profesional", value: stats?.professionalism ?? 0 },
  ];

  const hasData = (stats?.totalSessions ?? 0) > 0;

  return (
    <div className="p-6 space-y-6 max-w-6xl">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
          <BarChart3 className="h-6 w-6 text-primary" />
          Mi Desempeño
        </h1>
        <p className="text-muted-foreground text-sm mt-1">
          Análisis de tus habilidades y progreso en el entrenamiento
        </p>
      </div>

      {!hasData ? (
        <Card className="bg-card border-border">
          <CardContent className="flex flex-col items-center justify-center py-16 text-center">
            <BarChart3 className="h-12 w-12 text-muted-foreground/30 mb-4" />
            <h3 className="text-lg font-semibold text-foreground">Sin datos de desempeño aún</h3>
            <p className="text-muted-foreground text-sm mt-2 max-w-sm">
              Completa al menos una simulación evaluada para ver tu análisis de desempeño detallado.
            </p>
          </CardContent>
        </Card>
      ) : (
        <>
          {/* Summary Metrics */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <MetricCard
              title="Score General"
              value={`${stats?.overallScore ?? 0}/100`}
              subtitle="promedio ponderado"
              icon={TrendingUp}
              color="green"
            />
            <MetricCard
              title="Simulaciones"
              value={stats?.totalSessions ?? 0}
              subtitle="evaluadas"
              icon={BarChart3}
              color="blue"
            />
            <MetricCard
              title="Mejor Dimensión"
              value={dimensionDetails.reduce((a, b) => a.value > b.value ? a : b).label}
              subtitle={`${dimensionDetails.reduce((a, b) => a.value > b.value ? a : b).value}/100`}
              icon={Trophy}
              color="yellow"
            />
            <MetricCard
              title="A Mejorar"
              value={dimensionDetails.reduce((a, b) => a.value < b.value ? a : b).label}
              subtitle={`${dimensionDetails.reduce((a, b) => a.value < b.value ? a : b).value}/100`}
              icon={Lightbulb}
              color="purple"
            />
          </div>

          {/* Radar Chart + Dimension Bars */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Radar */}
            <Card className="bg-card border-border">
              <CardHeader className="pb-3">
                <CardTitle className="text-base font-semibold text-foreground">
                  Perfil de Habilidades
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={280}>
                  <RadarChart data={radarData}>
                    <PolarGrid stroke="oklch(0.25 0.01 240)" />
                    <PolarAngleAxis
                      dataKey="dimension"
                      tick={{ fill: "oklch(0.55 0.02 240)", fontSize: 11 }}
                    />
                    <Radar
                      name="Score"
                      dataKey="score"
                      stroke="oklch(0.75 0.18 160)"
                      fill="oklch(0.75 0.18 160)"
                      fillOpacity={0.2}
                      strokeWidth={2}
                    />
                  </RadarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            {/* Dimension Bars */}
            <div className="space-y-3">
              {dimensionDetails.map(dim => (
                <ScoreBar
                  key={dim.key}
                  label={dim.label}
                  score={dim.value}
                  icon={dim.icon}
                  description={dim.description}
                />
              ))}
            </div>
          </div>

          {/* Activity Chart */}
          {activityData.length > 0 && (
            <Card className="bg-card border-border">
              <CardHeader className="pb-3">
                <CardTitle className="text-base font-semibold text-foreground flex items-center gap-2">
                  <Calendar className="h-4 w-4 text-muted-foreground" />
                  Actividad Últimos 7 Días
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={180}>
                  <BarChart data={activityData} margin={{ top: 5, right: 10, left: -20, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="oklch(0.22 0.01 240)" />
                    <XAxis dataKey="date" tick={{ fill: "oklch(0.55 0.02 240)", fontSize: 11 }} />
                    <YAxis tick={{ fill: "oklch(0.55 0.02 240)", fontSize: 11 }} />
                    <Tooltip
                      contentStyle={{
                        background: "oklch(0.17 0.01 240)",
                        border: "1px solid oklch(0.25 0.01 240)",
                        borderRadius: "8px",
                        color: "oklch(0.95 0.01 240)",
                        fontSize: "12px",
                      }}
                    />
                    <Bar dataKey="simulaciones" fill="oklch(0.75 0.18 160)" radius={[4, 4, 0, 0]} name="Simulaciones" />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          )}

          {/* AI Tips */}
          <Card className="bg-card border-border">
            <CardHeader className="pb-3">
              <CardTitle className="text-base font-semibold text-foreground flex items-center gap-2">
                <Lightbulb className="h-4 w-4 text-yellow-400" />
                Consejos Personalizados de IA
              </CardTitle>
            </CardHeader>
            <CardContent>
              {tipsLoading ? (
                <div className="flex items-center gap-2 text-muted-foreground text-sm">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Generando consejos personalizados...
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {tips?.map((tip: any, i: number) => (
                    <div key={i} className="bg-secondary/50 border border-border rounded-xl p-4 space-y-2">
                      <div className="text-xs font-semibold text-primary uppercase tracking-wide">
                        {tip.dimension}
                      </div>
                      <p className="text-sm text-foreground leading-relaxed">{tip.tip}</p>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </>
      )}

      {/* Badges */}
      <Card className="bg-card border-border">
        <CardHeader className="pb-3">
          <CardTitle className="text-base font-semibold text-foreground flex items-center gap-2">
            <Trophy className="h-4 w-4 text-yellow-400" />
            Mis Medallas
          </CardTitle>
        </CardHeader>
        <CardContent>
          {(badges?.length ?? 0) === 0 ? (
            <div className="text-center py-6 text-muted-foreground">
              <Trophy className="h-8 w-8 mx-auto mb-2 opacity-30" />
              <p className="text-sm">Completa simulaciones para ganar medallas</p>
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              {badges?.map((badge: any) => (
                <div key={badge.id} className="flex flex-col items-center gap-2 p-3 bg-secondary/30 rounded-xl border border-border text-center">
                  <BadgeIcon iconName={badge.icon} earned={true} />
                  <div>
                    <div className="text-xs font-semibold text-foreground">{badge.name}</div>
                    <div className="text-[10px] text-muted-foreground mt-0.5">{badge.description}</div>
                    <div className="text-[10px] text-primary font-semibold mt-1">+{badge.xpBonus} XP</div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
