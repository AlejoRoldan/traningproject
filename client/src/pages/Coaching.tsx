import { useState } from 'react';
import { trpc } from '@/lib/trpc';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { 
  Target, 
  TrendingUp, 
  Users, 
  AlertCircle, 
  CheckCircle2, 
  Sparkles,
  UserPlus,
  MessageSquare,
  Trophy,
  ArrowRight
} from 'lucide-react';
import { Link } from 'wouter';

export default function Coaching() {
  const [selectedBuddy, setSelectedBuddy] = useState<number | null>(null);
  const [sharedGoal, setSharedGoal] = useState('');
  const [showBuddyDialog, setShowBuddyDialog] = useState(false);
  
  const utils = trpc.useUtils();
  
  // Check eligibility first
  const { data: eligibility, isLoading: eligibilityLoading } = trpc.coaching.checkEligibility.useQuery();
  const isEligible = eligibility?.eligible ?? false;
  
  // Fetch active coaching plan (only if eligible)
  const { data: activePlan, isLoading: planLoading } = trpc.coaching.getActivePlan.useQuery(undefined, {
    enabled: isEligible,
    retry: false
  });
  
  // Fetch buddy pair (only if eligible)
  const { data: buddyPair, isLoading: buddyLoading } = trpc.coaching.getBuddyPair.useQuery(undefined, {
    enabled: isEligible
  });
  
  // Fetch buddy candidates (only if eligible)
  const { data: buddyCandidates, isLoading: candidatesLoading } = trpc.coaching.findBuddyCandidates.useQuery(undefined, {
    enabled: isEligible,
    retry: false
  });
  
  // Fetch alerts (only if eligible)
  const { data: alerts, isLoading: alertsLoading } = trpc.coaching.getAlerts.useQuery(undefined, {
    enabled: isEligible,
    retry: false
  });
  
  // Mutations
  const generatePlan = trpc.coaching.generatePlan.useMutation({
    onSuccess: () => {
      utils.coaching.getActivePlan.invalidate();
    }
  });
  
  const createBuddyPair = trpc.coaching.createBuddyPair.useMutation({
    onSuccess: () => {
      utils.coaching.getBuddyPair.invalidate();
      utils.coaching.findBuddyCandidates.invalidate();
      setShowBuddyDialog(false);
    }
  });
  
  const updateBuddyGoal = trpc.coaching.updateBuddyGoal.useMutation({
    onSuccess: () => {
      utils.coaching.getBuddyPair.invalidate();
    }
  });
  
  const acknowledgeAlert = trpc.coaching.acknowledgeAlert.useMutation({
    onSuccess: () => {
      utils.coaching.getAlerts.invalidate();
    }
  });

  const handleGeneratePlan = () => {
    generatePlan.mutate();
  };

  const handleCreateBuddyPair = () => {
    if (selectedBuddy) {
      createBuddyPair.mutate({ buddyId: selectedBuddy });
    }
  };

  const handleUpdateGoal = () => {
    if (buddyPair && sharedGoal) {
      updateBuddyGoal.mutate({ 
        pairId: buddyPair.id, 
        sharedGoal 
      });
      setSharedGoal('');
    }
  };

  const handleAcknowledgeAlert = (alertId: number) => {
    acknowledgeAlert.mutate({ alertId });
  };

  // Get priority color
  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high': return 'destructive';
      case 'medium': return 'default';
      case 'low': return 'secondary';
      default: return 'default';
    }
  };

  // Get alert type color
  const getAlertTypeColor = (type: string) => {
    switch (type) {
      case 'low_performance': return 'destructive';
      case 'stagnation': return 'default';
      case 'improvement': return 'default';
      case 'milestone': return 'default';
      default: return 'default';
    }
  };

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Mi Plan de Coaching</h1>
          <p className="text-muted-foreground">Mejora continua personalizada con IA</p>
        </div>
        {isEligible && !activePlan && (
          <Button 
            onClick={handleGeneratePlan}
            disabled={generatePlan.isPending}
            size="lg"
          >
            <Sparkles className="mr-2 h-5 w-5" />
            {generatePlan.isPending ? 'Generando...' : 'Generar Plan de Mejora'}
          </Button>
        )}
      </div>

      {eligibilityLoading || planLoading ? (
        <div className="text-center py-12">
          <p className="text-muted-foreground">Cargando plan de coaching...</p>
        </div>
      ) : !isEligible ? (
        <Card className="border-dashed">
          <CardHeader className="text-center">
            <Target className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
            <CardTitle>Completa más simulaciones para desbloquear Coaching IA</CardTitle>
            <CardDescription>
              Has completado {eligibility?.simulationsCompleted || 0} de {eligibility?.simulationsRequired || 3} simulaciones necesarias
            </CardDescription>
          </CardHeader>
          <CardContent className="text-center space-y-4">
            <div className="max-w-md mx-auto">
              <div className="flex justify-between text-sm mb-2">
                <span className="text-muted-foreground">Progreso</span>
                <span className="font-medium">{eligibility?.simulationsCompleted || 0}/{eligibility?.simulationsRequired || 3}</span>
              </div>
              <Progress value={((eligibility?.simulationsCompleted || 0) / (eligibility?.simulationsRequired || 3)) * 100} className="h-2" />
            </div>
            <Link href="/scenarios">
              <Button variant="outline">
                Ir a Escenarios
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </Link>
          </CardContent>
        </Card>
      ) : !activePlan ? (
        <Card className="border-dashed">
          <CardHeader className="text-center">
            <Target className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
            <CardTitle>No tienes un plan de coaching activo</CardTitle>
            <CardDescription>
              Haz clic en "Generar Plan de Mejora" para crear tu plan personalizado
            </CardDescription>
          </CardHeader>
        </Card>
      ) : (
        <Tabs defaultValue="plan" className="space-y-6">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="plan">
              <Target className="mr-2 h-4 w-4" />
              Plan de Mejora
            </TabsTrigger>
            <TabsTrigger value="buddy">
              <Users className="mr-2 h-4 w-4" />
              Buddy System
            </TabsTrigger>
            <TabsTrigger value="alerts">
              <AlertCircle className="mr-2 h-4 w-4" />
              Alertas
              {alerts && alerts.filter(a => a.status === 'pending').length > 0 && (
                <Badge variant="destructive" className="ml-2">
                  {alerts.filter(a => a.status === 'pending').length}
                </Badge>
              )}
            </TabsTrigger>
          </TabsList>

          {/* Plan de Mejora Tab */}
          <TabsContent value="plan" className="space-y-6">
            {/* Progress Overview */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <TrendingUp className="h-5 w-5 text-primary" />
                  Progreso General
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <div className="flex justify-between mb-2">
                    <span className="text-sm font-medium">Completado</span>
                    <span className="text-sm font-medium">{activePlan.progress}%</span>
                  </div>
                  <Progress value={activePlan.progress} className="h-2" />
                </div>
                <div className="grid grid-cols-2 gap-4 pt-4">
                  <div>
                    <p className="text-sm text-muted-foreground">Escenarios Completados</p>
                    <p className="text-2xl font-bold">
                      {activePlan.completedScenarios.length} / {activePlan.recommendedScenarios.length}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Tiempo Estimado</p>
                    <p className="text-2xl font-bold">{activePlan.estimatedWeeks} semanas</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Weekly Goal */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Trophy className="h-5 w-5 text-yellow-500" />
                  Objetivo Semanal
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-lg">{activePlan.weeklyGoal}</p>
              </CardContent>
            </Card>

            {/* Weaknesses Analysis */}
            <Card>
              <CardHeader>
                <CardTitle>Áreas de Mejora</CardTitle>
                <CardDescription>Categorías donde puedes mejorar tu desempeño</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {activePlan.weaknessAnalysis.map((weakness: any, index: number) => (
                  <div key={index} className="border rounded-lg p-4 space-y-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <h4 className="font-semibold capitalize">{weakness.category}</h4>
                        <Badge variant={getPriorityColor(weakness.priority)}>
                          {weakness.priority === 'high' ? 'Alta Prioridad' : 
                           weakness.priority === 'medium' ? 'Prioridad Media' : 'Baja Prioridad'}
                        </Badge>
                      </div>
                      <Badge variant="outline">
                        {weakness.trend === 'improving' ? '📈 Mejorando' : 
                         weakness.trend === 'declining' ? '📉 Declinando' : '➡️ Estable'}
                      </Badge>
                    </div>
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <span className="text-muted-foreground">Puntuación Actual:</span>
                        <span className="ml-2 font-semibold">{weakness.currentScore}/100</span>
                      </div>
                      <div>
                        <span className="text-muted-foreground">Brecha:</span>
                        <span className="ml-2 font-semibold">{weakness.gap} puntos</span>
                      </div>
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>

            {/* Strengths */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <CheckCircle2 className="h-5 w-5 text-green-500" />
                  Fortalezas
                </CardTitle>
                <CardDescription>Áreas donde destacas</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 gap-4">
                  {activePlan.strengthsAnalysis.map((strength: any, index: number) => (
                    <div key={index} className="border rounded-lg p-4">
                      <h4 className="font-semibold capitalize mb-2">{strength.category}</h4>
                      <div className="text-sm space-y-1">
                        <div>
                          <span className="text-muted-foreground">Puntuación:</span>
                          <span className="ml-2 font-semibold text-green-600">{strength.currentScore}/100</span>
                        </div>
                        <div>
                          <span className="text-muted-foreground">Consistencia:</span>
                          <span className="ml-2 font-semibold">{strength.consistency}%</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Recommended Scenarios */}
            <Card>
              <CardHeader>
                <CardTitle>Escenarios Recomendados</CardTitle>
                <CardDescription>Practica estos escenarios para mejorar tus áreas débiles</CardDescription>
              </CardHeader>
              <CardContent>
                <Link href="/scenarios">
                  <Button className="w-full">
                    Ver Escenarios Recomendados
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Button>
                </Link>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Buddy System Tab */}
          <TabsContent value="buddy" className="space-y-6">
            {buddyLoading ? (
              <div className="text-center py-12">
                <p className="text-muted-foreground">Cargando información de buddy...</p>
              </div>
            ) : buddyPair ? (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Users className="h-5 w-5 text-primary" />
                    Tu Buddy de Aprendizaje
                  </CardTitle>
                  <CardDescription>
                    Trabaja junto con tu compañero para mejorar mutuamente
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center gap-4 p-4 border rounded-lg">
                    <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center">
                      <Users className="h-6 w-6 text-primary" />
                    </div>
                    <div className="flex-1">
                      <h4 className="font-semibold">Agente {buddyPair.buddyUserId}</h4>
                      <p className="text-sm text-muted-foreground">
                        Emparejados desde {new Date(buddyPair.createdAt).toLocaleDateString()}
                      </p>
                    </div>
                    <Badge variant="outline" className="bg-green-50">Activo</Badge>
                  </div>

                  {buddyPair.sharedGoal && (
                    <div className="p-4 bg-muted rounded-lg">
                      <h4 className="font-semibold mb-2">Objetivo Compartido</h4>
                      <p>{buddyPair.sharedGoal}</p>
                    </div>
                  )}

                  <div className="space-y-2">
                    <Label htmlFor="goal">Actualizar Objetivo Compartido</Label>
                    <Textarea
                      id="goal"
                      placeholder="Ej: Practicar juntos escenarios de fraude esta semana..."
                      value={sharedGoal}
                      onChange={(e) => setSharedGoal(e.target.value)}
                    />
                    <Button 
                      onClick={handleUpdateGoal}
                      disabled={!sharedGoal || updateBuddyGoal.isPending}
                    >
                      <MessageSquare className="mr-2 h-4 w-4" />
                      Actualizar Objetivo
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ) : (
              <Card className="border-dashed">
                <CardHeader className="text-center">
                  <UserPlus className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                  <CardTitle>No tienes un buddy asignado</CardTitle>
                  <CardDescription>
                    Encuentra un compañero con habilidades complementarias para aprender juntos
                  </CardDescription>
                </CardHeader>
                <CardContent className="text-center">
                  <Dialog open={showBuddyDialog} onOpenChange={setShowBuddyDialog}>
                    <DialogTrigger asChild>
                      <Button size="lg">
                        <UserPlus className="mr-2 h-5 w-5" />
                        Encontrar Buddy
                      </Button>
                    </DialogTrigger>
                    <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
                      <DialogHeader>
                        <DialogTitle>Candidatos para Buddy</DialogTitle>
                        <DialogDescription>
                          Selecciona un compañero con habilidades complementarias
                        </DialogDescription>
                      </DialogHeader>
                      <div className="space-y-4">
                        {candidatesLoading ? (
                          <p className="text-center text-muted-foreground">Buscando candidatos...</p>
                        ) : buddyCandidates && buddyCandidates.length > 0 ? (
                          buddyCandidates.map((candidate: any) => (
                            <div
                              key={candidate.userId}
                              className={`border rounded-lg p-4 cursor-pointer transition-colors ${
                                selectedBuddy === candidate.userId
                                  ? 'border-primary bg-primary/5'
                                  : 'hover:border-primary/50'
                              }`}
                              onClick={() => setSelectedBuddy(candidate.userId)}
                            >
                              <div className="flex items-start justify-between mb-3">
                                <div>
                                  <h4 className="font-semibold">{candidate.name}</h4>
                                  <p className="text-sm text-muted-foreground">{candidate.role} - {candidate.area}</p>
                                </div>
                                <Badge variant="outline">
                                  {candidate.compatibilityScore}% compatible
                                </Badge>
                              </div>
                              <div className="space-y-2">
                                <p className="text-sm font-medium">Por qué es un buen match:</p>
                                <ul className="text-sm space-y-1">
                                  {candidate.matchReasons.map((reason: string, idx: number) => (
                                    <li key={idx} className="flex items-center gap-2">
                                      <CheckCircle2 className="h-4 w-4 text-green-500" />
                                      {reason}
                                    </li>
                                  ))}
                                </ul>
                              </div>
                            </div>
                          ))
                        ) : (
                          <p className="text-center text-muted-foreground">
                            No hay candidatos disponibles en este momento
                          </p>
                        )}
                      </div>
                      {buddyCandidates && buddyCandidates.length > 0 && (
                        <Button
                          onClick={handleCreateBuddyPair}
                          disabled={!selectedBuddy || createBuddyPair.isPending}
                          className="w-full"
                        >
                          {createBuddyPair.isPending ? 'Creando...' : 'Crear Buddy Pair'}
                        </Button>
                      )}
                    </DialogContent>
                  </Dialog>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          {/* Alerts Tab */}
          <TabsContent value="alerts" className="space-y-4">
            {alertsLoading ? (
              <div className="text-center py-12">
                <p className="text-muted-foreground">Cargando alertas...</p>
              </div>
            ) : alerts && alerts.length > 0 ? (
              alerts.map((alert: any) => (
                <Card key={alert.id}>
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div className="flex items-start gap-3">
                        <AlertCircle className={`h-5 w-5 mt-1 ${
                          alert.type === 'low_performance' ? 'text-red-500' :
                          alert.type === 'improvement' ? 'text-green-500' :
                          'text-yellow-500'
                        }`} />
                        <div>
                          <CardTitle className="text-lg">{alert.title}</CardTitle>
                          <CardDescription className="mt-1">
                            {new Date(alert.createdAt).toLocaleDateString('es-PY', {
                              year: 'numeric',
                              month: 'long',
                              day: 'numeric'
                            })}
                          </CardDescription>
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <Badge variant={getAlertTypeColor(alert.type)}>
                          {alert.type === 'low_performance' ? 'Bajo Rendimiento' :
                           alert.type === 'stagnation' ? 'Estancamiento' :
                           alert.type === 'improvement' ? 'Mejora' : 'Hito'}
                        </Badge>
                        {alert.status === 'pending' && (
                          <Badge variant="outline">Pendiente</Badge>
                        )}
                        {alert.status === 'acknowledged' && (
                          <Badge variant="secondary">Reconocida</Badge>
                        )}
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <p>{alert.message}</p>
                    {alert.status === 'pending' && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleAcknowledgeAlert(alert.id)}
                        disabled={acknowledgeAlert.isPending}
                      >
                        <CheckCircle2 className="mr-2 h-4 w-4" />
                        Marcar como Leída
                      </Button>
                    )}
                  </CardContent>
                </Card>
              ))
            ) : (
              <Card className="border-dashed">
                <CardContent className="text-center py-12">
                  <CheckCircle2 className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                  <p className="text-lg font-semibold">No tienes alertas</p>
                  <p className="text-muted-foreground">¡Excelente! Sigue así</p>
                </CardContent>
              </Card>
            )}
          </TabsContent>
        </Tabs>
      )}
    </div>
  );
}
