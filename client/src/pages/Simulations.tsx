import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { Link } from "wouter";
import {
  Search, Play, Clock, Users, Star, Filter, Loader2, BookOpen, Dumbbell
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { DifficultyBadge, CategoryBadge, XPBadge, CompetencyTag } from "@/components/KaitelComponents";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

const categories = [
  { value: "todas", label: "Todas" },
  { value: "reclamos", label: "Reclamos" },
  { value: "productos", label: "Productos" },
  { value: "ventas", label: "Ventas" },
  { value: "cobranzas", label: "Cobranzas" },
  { value: "onboarding", label: "Onboarding" },
  { value: "fraude", label: "Fraude" },
];

const difficulties = [
  { value: "todas", label: "Todas" },
  { value: "facil", label: "Fácil" },
  { value: "medio", label: "Medio" },
  { value: "dificil", label: "Difícil" },
  { value: "experto", label: "Experto" },
];

export default function Simulations() {
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("todas");
  const [difficulty, setDifficulty] = useState("todas");

  const { data: scenarios, isLoading } = trpc.scenarios.list.useQuery({ category, difficulty, search });

  return (
    <div className="p-6 space-y-6 max-w-7xl">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
          <Play className="h-6 w-6 text-primary" />
          Catálogo de Simulaciones
        </h1>
        <p className="text-muted-foreground text-sm mt-1">
          Practica con escenarios reales de atención bancaria
        </p>
      </div>

      {/* Filters */}
      <div className="space-y-3">
        <div className="relative max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Buscar simulaciones..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="pl-9 bg-secondary border-border"
          />
        </div>

        <div className="flex gap-4 flex-wrap">
          <div className="flex gap-2 flex-wrap items-center">
            <span className="text-xs text-muted-foreground font-medium">Categoría:</span>
            {categories.map(cat => (
              <button
                key={cat.value}
                onClick={() => setCategory(cat.value)}
                className={cn(
                  "text-xs px-3 py-1.5 rounded-full font-medium transition-all border",
                  category === cat.value
                    ? "bg-primary text-primary-foreground border-primary"
                    : "bg-secondary text-muted-foreground border-border hover:border-primary/40"
                )}
              >
                {cat.label}
              </button>
            ))}
          </div>

          <div className="flex gap-2 flex-wrap items-center">
            <span className="text-xs text-muted-foreground font-medium">Dificultad:</span>
            {difficulties.map(diff => (
              <button
                key={diff.value}
                onClick={() => setDifficulty(diff.value)}
                className={cn(
                  "text-xs px-3 py-1.5 rounded-full font-medium transition-all border",
                  difficulty === diff.value
                    ? "bg-primary text-primary-foreground border-primary"
                    : "bg-secondary text-muted-foreground border-border hover:border-primary/40"
                )}
              >
                {diff.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Results count */}
      {!isLoading && (
        <div className="text-sm text-muted-foreground">
          {scenarios?.length ?? 0} simulaciones encontradas
        </div>
      )}

      {/* Scenario Grid */}
      {isLoading ? (
        <div className="flex items-center justify-center py-16">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      ) : (scenarios?.length ?? 0) === 0 ? (
        <div className="text-center py-16 text-muted-foreground">
          <Play className="h-12 w-12 mx-auto mb-4 opacity-30" />
          <p className="text-lg font-medium">No se encontraron simulaciones</p>
          <p className="text-sm mt-1">Prueba con otros filtros</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {scenarios?.map(scenario => {
            const competencies = (() => {
              try { return JSON.parse((scenario.competencies as unknown as string) ?? "[]") as string[]; }
              catch { return []; }
            })();

            return (
              <Card key={scenario.id} className="bg-card border-border hover:border-primary/30 transition-all group flex flex-col">
                <CardContent className="p-5 flex flex-col flex-1 space-y-4">
                  {/* Badges */}
                  <div className="flex items-center gap-2 flex-wrap">
                    <CategoryBadge category={scenario.category} />
                    <DifficultyBadge difficulty={scenario.difficulty} />
                  </div>

                  {/* Title & Description */}
                  <div className="flex-1 space-y-2">
                    <h3 className="font-semibold text-foreground leading-snug line-clamp-2 group-hover:text-primary transition-colors">
                      {scenario.title}
                    </h3>
                    <p className="text-xs text-muted-foreground line-clamp-2 leading-relaxed">
                      {scenario.description}
                    </p>
                  </div>

                  {/* Client Info */}
                  <div className="flex items-center gap-2 text-xs text-muted-foreground bg-secondary/50 rounded-lg px-3 py-2">
                    <Users className="h-3 w-3 flex-shrink-0" />
                    <span className="truncate">Cliente: {scenario.clientName}</span>
                    <span className="ml-auto flex-shrink-0 capitalize">{scenario.clientTone}</span>
                  </div>

                  {/* Competencies */}
                  {competencies.length > 0 && (
                    <div className="flex gap-1 flex-wrap">
                      {competencies.slice(0, 3).map((c: string) => (
                        <CompetencyTag key={c} name={c} />
                      ))}
                    </div>
                  )}

                  {/* Stats Row */}
                  <div className="flex items-center gap-3 text-xs text-muted-foreground">
                    <span className="flex items-center gap-1">
                      <Clock className="h-3 w-3" />
                      {scenario.durationMin}-{scenario.durationMax} min
                    </span>
                    <span className="flex items-center gap-1">
                      <Star className="h-3 w-3 text-yellow-400" />
                      {Number(scenario.avgScore ?? 0).toFixed(0)} avg
                    </span>
                    <span className="flex items-center gap-1">
                      <Users className="h-3 w-3" />
                      {scenario.totalCompleted?.toLocaleString()}
                    </span>
                  </div>

                  {/* Actions */}
                  <div className="flex gap-2 pt-1">
                    <Link href={`/simulaciones/${scenario.id}`} className="flex-1">
                      <Button className="w-full bg-primary text-primary-foreground hover:bg-primary/90 gap-2 text-sm">
                        <Play className="h-3.5 w-3.5" />
                        Iniciar
                        <XPBadge xp={scenario.xpReward ?? 0} />
                      </Button>
                    </Link>
                    <Link href={`/simulaciones/${scenario.id}?practice=true`}>
                      <Button
                        variant="outline"
                        size="sm"
                        className="border-border text-muted-foreground hover:text-foreground gap-1 text-xs"
                        title="Modo práctica (sin evaluación)"
                      >
                        <Dumbbell className="h-3.5 w-3.5" />
                        Práctica
                      </Button>
                    </Link>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
