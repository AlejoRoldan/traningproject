import TrainingDashboardLayout from "@/components/TrainingDashboardLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { trpc } from "@/lib/trpc";
import { useState } from "react";
import { 
  Search, 
  Clock, 
  TrendingUp, 
  Play,
  Filter,
  AlertTriangle,
  DollarSign,
  CreditCard,
  Phone,
  FileText,
  ShieldAlert
} from "lucide-react";
import { Link } from "wouter";

const categoryIcons: Record<string, React.ElementType> = {
  informative: Phone,
  transactional: CreditCard,
  fraud: ShieldAlert,
  money_laundering: DollarSign,
  theft: AlertTriangle,
  complaint: FileText,
  credit: DollarSign,
  digital_channels: Phone,
};

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

const complexityColors: Record<number, string> = {
  1: "bg-green-500/10 text-green-700 dark:text-green-400 border-green-500/20",
  2: "bg-blue-500/10 text-blue-700 dark:text-blue-400 border-blue-500/20",
  3: "bg-yellow-500/10 text-yellow-700 dark:text-yellow-400 border-yellow-500/20",
  4: "bg-orange-500/10 text-orange-700 dark:text-orange-400 border-orange-500/20",
  5: "bg-red-500/10 text-red-700 dark:text-red-400 border-red-500/20",
};

const complexityLabels: Record<number, string> = {
  1: "Básico",
  2: "Intermedio",
  3: "Avanzado",
  4: "Experto",
  5: "Maestro",
};

export default function Scenarios() {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [selectedComplexity, setSelectedComplexity] = useState<string>("all");

  const scenariosQuery = trpc.scenarios.list.useQuery();
  const scenarios = scenariosQuery.data || [];

  // Filter scenarios
  const filteredScenarios = scenarios.filter(scenario => {
    const matchesSearch = scenario.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         scenario.description.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = selectedCategory === "all" || scenario.category === selectedCategory;
    const matchesComplexity = selectedComplexity === "all" || scenario.complexity === parseInt(selectedComplexity);
    
    return matchesSearch && matchesCategory && matchesComplexity;
  });

  return (
    <TrainingDashboardLayout>
      <div className="p-8 space-y-8">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold text-foreground">Biblioteca de Escenarios</h1>
          <p className="text-muted-foreground mt-1">
            Explora y practica con diferentes situaciones bancarias
          </p>
        </div>

        {/* Filters */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Filter className="w-5 h-5" />
              Filtros de Búsqueda
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-medium text-foreground">Buscar</label>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input
                    placeholder="Buscar escenarios..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-foreground">Categoría</label>
                <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                  <SelectTrigger>
                    <SelectValue placeholder="Todas las categorías" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todas las categorías</SelectItem>
                    {Object.entries(categoryLabels).map(([key, label]) => (
                      <SelectItem key={key} value={key}>{label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-foreground">Complejidad</label>
                <Select value={selectedComplexity} onValueChange={setSelectedComplexity}>
                  <SelectTrigger>
                    <SelectValue placeholder="Todas las complejidades" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todas las complejidades</SelectItem>
                    {[1, 2, 3, 4, 5].map(level => (
                      <SelectItem key={level} value={level.toString()}>
                        Nivel {level} - {complexityLabels[level]}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Results Count */}
        <div className="flex items-center justify-between">
          <p className="text-sm text-muted-foreground">
            Mostrando <span className="font-semibold text-foreground">{filteredScenarios.length}</span> escenarios
          </p>
          {(searchQuery || selectedCategory !== "all" || selectedComplexity !== "all") && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                setSearchQuery("");
                setSelectedCategory("all");
                setSelectedComplexity("all");
              }}
            >
              Limpiar filtros
            </Button>
          )}
        </div>

        {/* Scenarios Grid */}
        {filteredScenarios.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredScenarios.map((scenario) => {
              const CategoryIcon = categoryIcons[scenario.category] || Phone;
              
              return (
                <Card key={scenario.id} className="hover:shadow-lg transition-shadow border-2 hover:border-primary/50">
                  <CardHeader>
                    <div className="flex items-start justify-between gap-2 mb-2">
                      <div className="p-2 rounded-lg bg-primary/10">
                        <CategoryIcon className="w-5 h-5 text-primary" />
                      </div>
                      <Badge 
                        variant="outline" 
                        className={complexityColors[scenario.complexity]}
                      >
                        Nivel {scenario.complexity}
                      </Badge>
                    </div>
                    <CardTitle className="text-lg line-clamp-2">{scenario.title}</CardTitle>
                    <CardDescription className="line-clamp-3">
                      {scenario.description}
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="flex items-center gap-4 text-sm text-muted-foreground">
                      <div className="flex items-center gap-1">
                        <Clock className="w-4 h-4" />
                        <span>{scenario.estimatedDuration} min</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <TrendingUp className="w-4 h-4" />
                        <span className="capitalize">{categoryLabels[scenario.category]}</span>
                      </div>
                    </div>

                    <div className="flex gap-2">
                      <Button className="flex-1" asChild>
                        <Link href={`/simulation/start/${scenario.id}`}>
                          <a className="flex items-center justify-center gap-2">
                            <Play className="w-4 h-4" />
                            Iniciar
                          </a>
                        </Link>
                      </Button>
                      <Button variant="outline" asChild>
                        <Link href={`/scenarios/${scenario.id}`}>
                          <a>Ver Detalles</a>
                        </Link>
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        ) : (
          <Card>
            <CardContent className="py-16 text-center space-y-4">
              <Search className="w-16 h-16 text-muted-foreground mx-auto" />
              <div>
                <h3 className="text-lg font-semibold text-foreground">No se encontraron escenarios</h3>
                <p className="text-sm text-muted-foreground mt-1">
                  Intenta ajustar los filtros de búsqueda
                </p>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </TrainingDashboardLayout>
  );
}
