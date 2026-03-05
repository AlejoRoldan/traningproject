import { useAuth } from "@/_core/hooks/useAuth";
import { trpc } from "@/lib/trpc";
import { Trophy, Flame, Crown, Medal, Loader2 } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { LevelBadge } from "@/components/KaitelComponents";
import { cn } from "@/lib/utils";

export default function Ranking() {
  const { user } = useAuth();
  const { data: leaderboard, isLoading } = trpc.ranking.leaderboard.useQuery({ limit: 20 });

  const getRankIcon = (position: number) => {
    if (position === 0) return <Crown className="h-5 w-5 text-yellow-400" />;
    if (position === 1) return <Medal className="h-5 w-5 text-gray-300" />;
    if (position === 2) return <Medal className="h-5 w-5 text-amber-600" />;
    return <span className="text-sm font-bold text-muted-foreground w-5 text-center">#{position + 1}</span>;
  };

  const getRankBg = (position: number) => {
    if (position === 0) return "bg-yellow-900/20 border-yellow-700/40";
    if (position === 1) return "bg-gray-800/50 border-gray-600/40";
    if (position === 2) return "bg-amber-900/20 border-amber-700/40";
    return "bg-card border-border";
  };

  const myRank = leaderboard?.findIndex((u: any) => u.id === user?.id);

  return (
    <div className="p-6 space-y-6 max-w-3xl">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
          <Trophy className="h-6 w-6 text-yellow-400" />
          Ranking de Agentes
        </h1>
        <p className="text-muted-foreground text-sm mt-1">
          Top performers por XP acumulado
        </p>
      </div>

      {/* My Position */}
      {myRank !== undefined && myRank >= 0 && (
        <Card className="bg-primary/10 border-primary/30">
          <CardContent className="p-4 flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center">
              <span className="text-sm font-bold text-primary">#{myRank + 1}</span>
            </div>
            <div className="flex-1">
              <div className="text-sm font-semibold text-foreground">Tu posición actual</div>
              <div className="text-xs text-muted-foreground">
                {leaderboard?.[myRank]?.xpTotal?.toLocaleString() ?? 0} XP acumulados
              </div>
            </div>
            {myRank > 0 && leaderboard?.[myRank - 1] && (
              <div className="text-xs text-muted-foreground text-right">
                <div>A {((leaderboard[myRank - 1].xpTotal ?? 0) - (leaderboard[myRank].xpTotal ?? 0)).toLocaleString()} XP</div>
                <div>del puesto #{myRank}</div>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Leaderboard */}
      <Card className="bg-card border-border">
        <CardHeader className="pb-3">
          <CardTitle className="text-base font-semibold text-foreground">
            Tabla de Posiciones
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-6 w-6 animate-spin text-primary" />
            </div>
          ) : (leaderboard?.length ?? 0) === 0 ? (
            <div className="text-center py-12 text-muted-foreground p-6">
              <Trophy className="h-10 w-10 mx-auto mb-3 opacity-30" />
              <p>Aún no hay agentes en el ranking</p>
              <p className="text-sm mt-1">Completa simulaciones para aparecer aquí</p>
            </div>
          ) : (
            <div className="divide-y divide-border">
              {leaderboard?.map((entry: any, index: number) => {
                const isMe = entry.id === user?.id;
                const initials = entry.name
                  ? entry.name.split(" ").map((n: string) => n[0]).join("").toUpperCase().slice(0, 2)
                  : "?";

                return (
                  <div
                    key={entry.id}
                    className={cn(
                      "flex items-center gap-4 px-6 py-4 transition-colors",
                      isMe ? "bg-primary/5" : "hover:bg-secondary/30",
                      index < 3 ? "border-l-2" : "",
                      index === 0 ? "border-l-yellow-400" : index === 1 ? "border-l-gray-400" : index === 2 ? "border-l-amber-600" : ""
                    )}
                  >
                    {/* Rank */}
                    <div className="w-8 flex items-center justify-center flex-shrink-0">
                      {getRankIcon(index)}
                    </div>

                    {/* Avatar */}
                    <Avatar className={cn(
                      "h-9 w-9 border",
                      isMe ? "border-primary" : "border-border"
                    )}>
                      <AvatarFallback className={cn(
                        "text-xs font-bold",
                        isMe ? "bg-primary/20 text-primary" : "bg-secondary text-muted-foreground"
                      )}>
                        {initials}
                      </AvatarFallback>
                    </Avatar>

                    {/* Name & Level */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className={cn(
                          "text-sm font-semibold truncate",
                          isMe ? "text-primary" : "text-foreground"
                        )}>
                          {entry.name ?? "Agente"}
                          {isMe && <span className="text-xs text-muted-foreground ml-1">(tú)</span>}
                        </span>
                      </div>
                      <div className="flex items-center gap-2 mt-0.5">
                        <LevelBadge level={entry.level ?? "junior"} />
                        {(entry.currentStreak ?? 0) > 0 && (
                          <span className="flex items-center gap-0.5 text-xs text-orange-400">
                            <Flame className="h-3 w-3" />
                            {entry.currentStreak}
                          </span>
                        )}
                      </div>
                    </div>

                    {/* XP */}
                    <div className="text-right flex-shrink-0">
                      <div className={cn(
                        "text-sm font-bold",
                        index === 0 ? "text-yellow-400" : index === 1 ? "text-gray-300" : index === 2 ? "text-amber-500" : "text-foreground"
                      )}>
                        {(entry.xpTotal ?? 0).toLocaleString()}
                      </div>
                      <div className="text-xs text-muted-foreground">XP</div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
