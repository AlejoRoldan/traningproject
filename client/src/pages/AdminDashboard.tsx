import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  BarChart, Bar, LineChart, Line, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer
} from 'recharts';
import { AlertTriangle, TrendingUp, Users, Target, Zap, Activity } from 'lucide-react';

export default function AdminDashboard() {
  const [selectedDepartment, setSelectedDepartment] = useState<string | null>(null);

  // Datos de ejemplo - en producción vendrían de tRPC
  const dashboardSummary = {
    total_agents: 156,
    total_simulations: 2847,
    avg_score: 78.5,
    active_coaching_plans: 42,
    active_alerts: 8,
    active_buddy_pairs: 31,
    agents_at_risk: 12,
  };

  const departmentData = [
    { department: 'Sales', agents: 45, simulations: 890, avg_score: 82.3, risk: 2 },
    { department: 'Support', agents: 38, simulations: 756, avg_score: 76.8, risk: 4 },
    { department: 'Collections', agents: 42, simulations: 834, avg_score: 75.2, risk: 5 },
    { department: 'Fraud', agents: 31, simulations: 367, avg_score: 81.5, risk: 1 },
  ];

  const categoryData = [
    { name: 'Fraude', simulations: 512, mastery: 78, avg_score: 79.2 },
    { name: 'Empatía', simulations: 487, mastery: 72, avg_score: 75.8 },
    { name: 'Resolución', simulations: 521, mastery: 81, avg_score: 80.5 },
    { name: 'Eficiencia', simulations: 445, mastery: 68, avg_score: 73.2 },
    { name: 'Integridad', simulations: 498, mastery: 85, avg_score: 84.1 },
    { name: 'Pasión', simulations: 384, mastery: 76, avg_score: 77.9 },
  ];

  const agentsAtRisk = [
    { id: 1, name: 'Carlos Mendez', department: 'Collections', avg_score: 52, risk: 'LOW_PERFORMANCE', days_inactive: 0 },
    { id: 2, name: 'María García', department: 'Support', avg_score: 58, risk: 'LOW_PERFORMANCE', days_inactive: 0 },
    { id: 3, name: 'Juan López', department: 'Support', avg_score: 0, risk: 'NO_ACTIVITY', days_inactive: 14 },
    { id: 4, name: 'Ana Rodríguez', department: 'Collections', avg_score: 61, risk: 'LOW_PERFORMANCE', days_inactive: 0 },
  ];

  const dailyActivity = [
    { date: 'Lun', simulations: 145, agents: 78, avg_score: 77.2 },
    { date: 'Mar', simulations: 168, agents: 92, avg_score: 78.5 },
    { date: 'Mié', simulations: 152, agents: 81, avg_score: 76.8 },
    { date: 'Jue', simulations: 189, agents: 98, avg_score: 79.1 },
    { date: 'Vie', simulations: 201, agents: 105, avg_score: 80.2 },
    { date: 'Sab', simulations: 87, agents: 45, avg_score: 75.3 },
    { date: 'Dom', simulations: 65, agents: 32, avg_score: 74.1 },
  ];

  const coachingProgress = [
    { agent: 'Roberto Silva', plan: 'Mejorar Empatía', progress: 65, target: 85, status: 'IN_PROGRESS' },
    { agent: 'Laura Martínez', plan: 'Dominar Fraude', progress: 88, target: 85, status: 'NEAR_TARGET' },
    { agent: 'Diego Fernández', plan: 'Resolución Avanzada', progress: 92, target: 85, status: 'ACHIEVED' },
    { agent: 'Sofía Gómez', plan: 'Integridad y Confianza', progress: 72, target: 85, status: 'IN_PROGRESS' },
  ];

  const getRiskColor = (risk: string) => {
    switch (risk) {
      case 'LOW_PERFORMANCE': return 'bg-red-100 text-red-800';
      case 'INACTIVE': return 'bg-orange-100 text-orange-800';
      case 'NO_ACTIVITY': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getRiskLabel = (risk: string) => {
    switch (risk) {
      case 'LOW_PERFORMANCE': return 'Bajo Rendimiento';
      case 'INACTIVE': return 'Inactivo';
      case 'NO_ACTIVITY': return 'Sin Actividad';
      default: return 'Normal';
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-slate-900 mb-2">Panel de Administración</h1>
          <p className="text-slate-600">Monitoreo y control de la plataforma Kaitel Training</p>
        </div>

        {/* KPI Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <Card className="border-l-4 border-l-blue-500">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-slate-600">Agentes Totales</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-slate-900">{dashboardSummary.total_agents}</div>
              <p className="text-xs text-slate-500 mt-1">Activos en el sistema</p>
            </CardContent>
          </Card>

          <Card className="border-l-4 border-l-green-500">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-slate-600">Simulaciones</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-slate-900">{dashboardSummary.total_simulations}</div>
              <p className="text-xs text-slate-500 mt-1">Completadas en total</p>
            </CardContent>
          </Card>

          <Card className="border-l-4 border-l-purple-500">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-slate-600">Promedio General</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-slate-900">{dashboardSummary.avg_score}%</div>
              <p className="text-xs text-slate-500 mt-1">Score promedio</p>
            </CardContent>
          </Card>

          <Card className="border-l-4 border-l-red-500">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-slate-600">Agentes en Riesgo</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-red-600">{dashboardSummary.agents_at_risk}</div>
              <p className="text-xs text-slate-500 mt-1">Requieren atención</p>
            </CardContent>
          </Card>
        </div>

        {/* Alerts */}
        {dashboardSummary.active_alerts > 0 && (
          <Alert className="mb-8 border-red-200 bg-red-50">
            <AlertTriangle className="h-4 w-4 text-red-600" />
            <AlertDescription className="text-red-800">
              Hay <strong>{dashboardSummary.active_alerts} alertas activas</strong> que requieren atención inmediata.
            </AlertDescription>
          </Alert>
        )}

        {/* Main Tabs */}
        <Tabs defaultValue="overview" className="w-full">
          <TabsList className="grid w-full grid-cols-4 mb-6">
            <TabsTrigger value="overview">Resumen General</TabsTrigger>
            <TabsTrigger value="departments">Departamentos</TabsTrigger>
            <TabsTrigger value="risk">Agentes en Riesgo</TabsTrigger>
            <TabsTrigger value="coaching">Coaching</TabsTrigger>
          </TabsList>

          {/* TAB 1: Overview */}
          <TabsContent value="overview" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Actividad Diaria */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Activity className="h-5 w-5 text-blue-600" />
                    Actividad Diaria (Última Semana)
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={300}>
                    <LineChart data={dailyActivity}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="date" />
                      <YAxis />
                      <Tooltip />
                      <Legend />
                      <Line type="monotone" dataKey="simulations" stroke="#3b82f6" name="Simulaciones" />
                      <Line type="monotone" dataKey="avg_score" stroke="#10b981" name="Score Promedio" />
                    </LineChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>

              {/* Desempeño por Categoría */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Target className="h-5 w-5 text-purple-600" />
                    Dominio por Categoría
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={300}>
                    <BarChart data={categoryData}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="name" angle={-45} textAnchor="end" height={80} />
                      <YAxis />
                      <Tooltip />
                      <Bar dataKey="mastery" fill="#8b5cf6" name="% Dominio" />
                    </BarChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
            </div>

            {/* Distribución de Simulaciones */}
            <Card>
              <CardHeader>
                <CardTitle>Distribución de Simulaciones por Categoría</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={categoryData}
                      dataKey="simulations"
                      nameKey="name"
                      cx="50%"
                      cy="50%"
                      outerRadius={100}
                      label
                    >
                      {categoryData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={['#e91e8c', '#ff6b9d', '#00d4ff', '#ffd700', '#8b4789', '#ff4444'][index]} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </TabsContent>

          {/* TAB 2: Departamentos */}
          <TabsContent value="departments" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Resumen por Departamento</CardTitle>
                <CardDescription>Métricas consolidadas de cada departamento</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {departmentData.map((dept) => (
                    <div key={dept.department} className="p-4 border rounded-lg hover:bg-slate-50 transition">
                      <div className="flex items-center justify-between mb-3">
                        <h3 className="font-semibold text-slate-900">{dept.department}</h3>
                        {dept.risk > 0 && (
                          <Badge variant="destructive">{dept.risk} en riesgo</Badge>
                        )}
                      </div>
                      <div className="grid grid-cols-4 gap-4 text-sm">
                        <div>
                          <p className="text-slate-600">Agentes</p>
                          <p className="text-lg font-bold text-slate-900">{dept.agents}</p>
                        </div>
                        <div>
                          <p className="text-slate-600">Simulaciones</p>
                          <p className="text-lg font-bold text-slate-900">{dept.simulations}</p>
                        </div>
                        <div>
                          <p className="text-slate-600">Score Promedio</p>
                          <p className="text-lg font-bold text-slate-900">{dept.avg_score}%</p>
                        </div>
                        <div>
                          <p className="text-slate-600">Tasa Dominio</p>
                          <p className="text-lg font-bold text-slate-900">
                            {Math.round((dept.avg_score / 100) * 100)}%
                          </p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Comparativa de Departamentos */}
            <Card>
              <CardHeader>
                <CardTitle>Comparativa de Desempeño</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={departmentData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="department" />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    <Bar dataKey="avg_score" fill="#3b82f6" name="Score Promedio" />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </TabsContent>

          {/* TAB 3: Agentes en Riesgo */}
          <TabsContent value="risk" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <AlertTriangle className="h-5 w-5 text-red-600" />
                  Agentes que Requieren Atención
                </CardTitle>
                <CardDescription>
                  {agentsAtRisk.length} agentes identificados con bajo rendimiento o inactividad
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {agentsAtRisk.map((agent) => (
                    <div key={agent.id} className="flex items-center justify-between p-4 border rounded-lg bg-slate-50">
                      <div className="flex-1">
                        <h4 className="font-semibold text-slate-900">{agent.name}</h4>
                        <p className="text-sm text-slate-600">{agent.department}</p>
                      </div>
                      <div className="flex items-center gap-4">
                        {agent.risk === 'NO_ACTIVITY' ? (
                          <div className="text-right">
                            <p className="text-sm text-slate-600">Inactivo por</p>
                            <p className="text-lg font-bold text-red-600">{agent.days_inactive} días</p>
                          </div>
                        ) : (
                          <div className="text-right">
                            <p className="text-sm text-slate-600">Score Promedio</p>
                            <p className="text-lg font-bold text-red-600">{agent.avg_score}%</p>
                          </div>
                        )}
                        <Badge className={getRiskColor(agent.risk)}>
                          {getRiskLabel(agent.risk)}
                        </Badge>
                        <Button size="sm" variant="outline">
                          Revisar
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* TAB 4: Coaching */}
          <TabsContent value="coaching" className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-medium text-slate-600">Planes Activos</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold text-slate-900">{dashboardSummary.active_coaching_plans}</div>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-medium text-slate-600">Buddy Pairs Activos</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold text-slate-900">{dashboardSummary.active_buddy_pairs}</div>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-medium text-slate-600">Alertas Coaching</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold text-red-600">{dashboardSummary.active_alerts}</div>
                </CardContent>
              </Card>
            </div>

            <Card>
              <CardHeader>
                <CardTitle>Progreso de Planes de Coaching</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {coachingProgress.map((plan, idx) => (
                    <div key={idx} className="p-4 border rounded-lg">
                      <div className="flex items-center justify-between mb-2">
                        <div>
                          <h4 className="font-semibold text-slate-900">{plan.agent}</h4>
                          <p className="text-sm text-slate-600">{plan.plan}</p>
                        </div>
                        <Badge variant={plan.status === 'ACHIEVED' ? 'default' : 'secondary'}>
                          {plan.status === 'ACHIEVED' ? 'Logrado' : plan.status === 'NEAR_TARGET' ? 'Próximo' : 'En Progreso'}
                        </Badge>
                      </div>
                      <div className="w-full bg-slate-200 rounded-full h-2">
                        <div
                          className="bg-gradient-to-r from-blue-500 to-purple-600 h-2 rounded-full transition-all"
                          style={{ width: `${(plan.progress / plan.target) * 100}%` }}
                        />
                      </div>
                      <div className="flex justify-between text-xs text-slate-600 mt-1">
                        <span>{plan.progress}%</span>
                        <span>Meta: {plan.target}%</span>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
