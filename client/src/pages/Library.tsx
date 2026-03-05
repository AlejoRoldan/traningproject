import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { Search, Star, Eye, Clock, BookOpen, ChevronRight, X, Loader2 } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ResourceTypeBadge, CategoryBadge } from "@/components/KaitelComponents";
import { cn } from "@/lib/utils";
import { Streamdown } from "streamdown";

const categories = [
  { value: "todas", label: "Todas" },
  { value: "empatia", label: "Empatía" },
  { value: "protocolo", label: "Protocolo" },
  { value: "resolucion", label: "Resolución" },
  { value: "productos", label: "Productos" },
  { value: "ventas", label: "Ventas" },
  { value: "manejo_objeciones", label: "Objeciones" },
];

export default function Library() {
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("todas");
  const [selectedId, setSelectedId] = useState<number | null>(null);

  const { data: resources, isLoading } = trpc.library.list.useQuery({ category, search });
  const { data: selectedResource } = trpc.library.byId.useQuery(
    { id: selectedId! },
    { enabled: selectedId !== null }
  );

  return (
    <div className="flex h-full">
      {/* Resource List */}
      <div className={cn("flex flex-col", selectedId ? "w-96 flex-shrink-0 border-r border-border" : "flex-1")}>
        {/* Header */}
        <div className="p-6 border-b border-border space-y-4">
          <div>
            <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
              <BookOpen className="h-6 w-6 text-primary" />
              Biblioteca
            </h1>
            <p className="text-muted-foreground text-sm mt-1">Recursos, guías y procedimientos de atención</p>
          </div>

          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Buscar recursos..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="pl-9 bg-secondary border-border"
            />
          </div>

          {/* Category Filter */}
          <div className="flex gap-2 flex-wrap">
            {categories.map(cat => (
              <button
                key={cat.value}
                onClick={() => setCategory(cat.value)}
                className={cn(
                  "text-xs px-3 py-1.5 rounded-full font-medium transition-all border",
                  category === cat.value
                    ? "bg-primary text-primary-foreground border-primary"
                    : "bg-secondary text-muted-foreground border-border hover:border-primary/40 hover:text-foreground"
                )}
              >
                {cat.label}
              </button>
            ))}
          </div>
        </div>

        {/* Resource Grid */}
        <div className="flex-1 overflow-y-auto p-4">
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-6 w-6 animate-spin text-primary" />
            </div>
          ) : (resources?.length ?? 0) === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <BookOpen className="h-10 w-10 mx-auto mb-3 opacity-30" />
              <p>No se encontraron recursos</p>
            </div>
          ) : (
            <div className={cn("gap-3", selectedId ? "flex flex-col" : "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3")}>
              {resources?.map(resource => (
                <button
                  key={resource.id}
                  onClick={() => setSelectedId(resource.id === selectedId ? null : resource.id)}
                  className={cn(
                    "text-left bg-card border rounded-xl p-4 hover:border-primary/40 transition-all group space-y-3",
                    selectedId === resource.id ? "border-primary bg-primary/5" : "border-border"
                  )}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex gap-2 flex-wrap">
                      <ResourceTypeBadge type={resource.type} />
                    </div>
                    <ChevronRight className={cn(
                      "h-4 w-4 text-muted-foreground flex-shrink-0 transition-transform",
                      selectedId === resource.id ? "rotate-90 text-primary" : "group-hover:text-primary"
                    )} />
                  </div>

                  <div>
                    <h3 className="font-semibold text-foreground text-sm leading-snug line-clamp-2">
                      {resource.title}
                    </h3>
                    {!selectedId && (
                      <p className="text-xs text-muted-foreground mt-1 line-clamp-2">
                        {resource.description}
                      </p>
                    )}
                  </div>

                  <div className="flex items-center gap-3 text-xs text-muted-foreground">
                    <span className="flex items-center gap-1">
                      <Star className="h-3 w-3 text-yellow-400" />
                      {resource.rating}
                    </span>
                    <span className="flex items-center gap-1">
                      <Eye className="h-3 w-3" />
                      {resource.views?.toLocaleString()}
                    </span>
                    <span className="flex items-center gap-1">
                      <Clock className="h-3 w-3" />
                      {resource.readingMinutes} min
                    </span>
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Resource Detail Panel */}
      {selectedId && (
        <div className="flex-1 flex flex-col overflow-hidden">
          <div className="flex items-center justify-between p-4 border-b border-border">
            <div className="flex items-center gap-2">
              {selectedResource && <ResourceTypeBadge type={selectedResource.type} />}
              <span className="text-xs text-muted-foreground">
                {selectedResource?.readingMinutes} min de lectura
              </span>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setSelectedId(null)}
              className="text-muted-foreground hover:text-foreground"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>

          <div className="flex-1 overflow-y-auto p-6">
            {!selectedResource ? (
              <div className="flex items-center justify-center h-full">
                <Loader2 className="h-6 w-6 animate-spin text-primary" />
              </div>
            ) : (
              <div className="max-w-2xl space-y-4">
                <div>
                  <h2 className="text-xl font-bold text-foreground">{selectedResource.title}</h2>
                  <p className="text-muted-foreground text-sm mt-2">{selectedResource.description}</p>
                </div>

                <div className="flex items-center gap-4 text-sm text-muted-foreground pb-4 border-b border-border">
                  <span className="flex items-center gap-1">
                    <Star className="h-4 w-4 text-yellow-400" />
                    {selectedResource.rating} / 5.0
                  </span>
                  <span className="flex items-center gap-1">
                    <Eye className="h-4 w-4" />
                    {selectedResource.views?.toLocaleString()} vistas
                  </span>
                  <span className="flex items-center gap-1">
                    <Clock className="h-4 w-4" />
                    {selectedResource.readingMinutes} min
                  </span>
                </div>

                <div className="prose prose-invert max-w-none text-sm">
                  <Streamdown>{selectedResource.content ?? ""}</Streamdown>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
