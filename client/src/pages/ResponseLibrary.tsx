import { useState } from "react";
import TrainingDashboardLayout from "@/components/TrainingDashboardLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { trpc } from "@/lib/trpc";
import { BookOpen, Search, Filter, Copy, Check } from "lucide-react";
import { toast } from "sonner";

export default function ResponseLibrary() {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [selectedType, setSelectedType] = useState<string>("all");
  const [copiedId, setCopiedId] = useState<number | null>(null);

  const { data: templates, isLoading } = trpc.responseTemplates.list.useQuery({
    category: selectedCategory !== "all" ? selectedCategory as any : undefined,
    type: selectedType !== "all" ? selectedType as any : undefined,
  });

  const categoryLabels: Record<string, string> = {
    informative: "Informativa",
    transactional: "Transaccional",
    fraud: "Fraude",
    money_laundering: "Lavado de Activos",
    theft: "Robo",
    complaint: "Reclamo",
    credit: "Crédito",
    digital_channels: "Canales Digitales",
  };

  const typeLabels: Record<string, string> = {
    opening: "Apertura",
    development: "Desarrollo",
    objection_handling: "Manejo de Objeciones",
    closing: "Cierre",
    empathy: "Empatía",
    protocol: "Protocolo",
  };

  const typeColors: Record<string, string> = {
    opening: "bg-blue-500/10 text-blue-700 dark:text-blue-400 border-blue-500/20",
    development: "bg-green-500/10 text-green-700 dark:text-green-400 border-green-500/20",
    objection_handling: "bg-orange-500/10 text-orange-700 dark:text-orange-400 border-orange-500/20",
    closing: "bg-purple-500/10 text-purple-700 dark:text-purple-400 border-purple-500/20",
    empathy: "bg-pink-500/10 text-pink-700 dark:text-pink-400 border-pink-500/20",
    protocol: "bg-gray-500/10 text-gray-700 dark:text-gray-400 border-gray-500/20",
  };

  const filteredTemplates = templates?.filter(template =>
    template.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    template.content.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleCopy = (content: string, id: number) => {
    navigator.clipboard.writeText(content);
    setCopiedId(id);
    toast.success("Respuesta copiada al portapapeles");
    setTimeout(() => setCopiedId(null), 2000);
  };

  return (
    <TrainingDashboardLayout>
      <div className="container py-8 space-y-8">
        {/* Header */}
        <div className="space-y-4">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-primary/10 rounded-lg">
              <BookOpen className="w-6 h-6 text-primary" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-foreground">Biblioteca de Respuestas</h1>
              <p className="text-muted-foreground">
                Consulta ejemplos de respuestas modelo para mejorar tus conversaciones
              </p>
            </div>
          </div>
        </div>

        {/* Filters */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Filter className="w-5 h-5" />
              Filtros de Búsqueda
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {/* Search */}
              <div className="space-y-2">
                <label className="text-sm font-medium">Buscar</label>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input
                    placeholder="Buscar respuestas..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>

              {/* Category */}
              <div className="space-y-2">
                <label className="text-sm font-medium">Categoría</label>
                <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                  <SelectTrigger>
                    <SelectValue placeholder="Todas las categorías" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todas las categorías</SelectItem>
                    {Object.entries(categoryLabels).map(([value, label]) => (
                      <SelectItem key={value} value={value}>{label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Type */}
              <div className="space-y-2">
                <label className="text-sm font-medium">Tipo de Respuesta</label>
                <Select value={selectedType} onValueChange={setSelectedType}>
                  <SelectTrigger>
                    <SelectValue placeholder="Todos los tipos" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todos los tipos</SelectItem>
                    {Object.entries(typeLabels).map(([value, label]) => (
                      <SelectItem key={value} value={value}>{label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            {(selectedCategory !== "all" || selectedType !== "all" || searchTerm) && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  setSelectedCategory("all");
                  setSelectedType("all");
                  setSearchTerm("");
                }}
              >
                Limpiar filtros
              </Button>
            )}
          </CardContent>
        </Card>

        {/* Results */}
        <div className="space-y-4">
          <div className="text-sm text-muted-foreground">
            Mostrando {filteredTemplates?.length || 0} respuestas modelo
          </div>

          {isLoading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {[1, 2, 3, 4].map((i) => (
                <Card key={i} className="animate-pulse">
                  <CardHeader>
                    <div className="h-6 bg-muted rounded w-3/4"></div>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      <div className="h-4 bg-muted rounded"></div>
                      <div className="h-4 bg-muted rounded w-5/6"></div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : filteredTemplates && filteredTemplates.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {filteredTemplates.map((template) => (
                <Card key={template.id} className="hover:shadow-lg transition-shadow">
                  <CardHeader>
                    <div className="flex items-start justify-between gap-2">
                      <CardTitle className="text-lg">{template.title}</CardTitle>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleCopy(template.content, template.id)}
                        className="shrink-0"
                      >
                        {copiedId === template.id ? (
                          <Check className="w-4 h-4 text-green-600" />
                        ) : (
                          <Copy className="w-4 h-4" />
                        )}
                      </Button>
                    </div>
                    <div className="flex flex-wrap gap-2 mt-2">
                      <Badge variant="outline" className={typeColors[template.type]}>
                        {typeLabels[template.type]}
                      </Badge>
                      <Badge variant="outline">
                        {categoryLabels[template.category]}
                      </Badge>
                      <Badge variant="outline">
                        Nivel {template.complexity}
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="space-y-2">
                      <div className="text-sm font-medium text-foreground">Respuesta:</div>
                      <div className="text-sm text-muted-foreground bg-muted/50 p-3 rounded-lg border border-border">
                        {template.content}
                      </div>
                    </div>

                    {template.context && (
                      <div className="space-y-2">
                        <div className="text-sm font-medium text-foreground">Cuándo usar:</div>
                        <div className="text-sm text-muted-foreground italic">
                          {template.context}
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <Card>
              <CardContent className="py-12 text-center">
                <BookOpen className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                <p className="text-muted-foreground">
                  No se encontraron respuestas modelo con los filtros seleccionados
                </p>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </TrainingDashboardLayout>
  );
}
