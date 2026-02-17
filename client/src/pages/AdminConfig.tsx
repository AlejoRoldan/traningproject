import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { CheckCircle, AlertCircle, Save } from 'lucide-react';

export default function AdminConfig() {
  const [activeTab, setActiveTab] = useState('company');
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'success' | 'error'>('idle');

  // Estados para configuración
  const [companyInfo, setCompanyInfo] = useState({
    name: 'Kaitel',
    mission: 'Empoderar a los agentes de contact center con herramientas de entrenamiento inteligentes',
    vision: 'Ser la plataforma líder de capacitación en IA para contact centers en Latinoamérica',
    values: 'Eficiencia, Simplicidad, Innovación, Pasión, Confianza, Integridad',
  });

  const [trainingSettings, setTrainingSettings] = useState({
    min_simulations_for_coaching: 3,
    alert_threshold_low_performance: 60,
    alert_threshold_consecutive_failures: 3,
    buddy_system_enabled: true,
    microlearning_enabled: true,
    voice_recording_enabled: true,
  });

  const [scoringWeights, setScoringWeights] = useState({
    empathy: 20,
    clarity: 20,
    protocol: 20,
    resolution: 20,
    confidence: 20,
  });

  const [performanceTargets, setPerformanceTargets] = useState({
    target_score: 85,
    target_completion_rate: 90,
    target_improvement_rate: 15,
  });

  const handleSaveConfig = async () => {
    setSaveStatus('saving');
    try {
      // Simular guardado - en producción llamaría a tRPC
      await new Promise(resolve => setTimeout(resolve, 1000));
      setSaveStatus('success');
      setTimeout(() => setSaveStatus('idle'), 3000);
    } catch (error) {
      setSaveStatus('error');
      setTimeout(() => setSaveStatus('idle'), 3000);
    }
  };

  const getTotalWeight = () => {
    return Object.values(scoringWeights).reduce((a, b) => a + b, 0);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 p-6">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-slate-900 mb-2">Configuración de Kaitel</h1>
          <p className="text-slate-600">Gestiona los parámetros y configuraciones de la plataforma</p>
        </div>

        {/* Status Alert */}
        {saveStatus === 'success' && (
          <Alert className="mb-6 border-green-200 bg-green-50">
            <CheckCircle className="h-4 w-4 text-green-600" />
            <AlertDescription className="text-green-800">
              Configuración guardada exitosamente
            </AlertDescription>
          </Alert>
        )}

        {saveStatus === 'error' && (
          <Alert className="mb-6 border-red-200 bg-red-50">
            <AlertCircle className="h-4 w-4 text-red-600" />
            <AlertDescription className="text-red-800">
              Error al guardar la configuración. Por favor, intenta de nuevo.
            </AlertDescription>
          </Alert>
        )}

        {/* Main Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-4 mb-6">
            <TabsTrigger value="company">Empresa</TabsTrigger>
            <TabsTrigger value="training">Entrenamiento</TabsTrigger>
            <TabsTrigger value="scoring">Puntuación</TabsTrigger>
            <TabsTrigger value="targets">Objetivos</TabsTrigger>
          </TabsList>

          {/* TAB 1: Company Info */}
          <TabsContent value="company" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Información de la Empresa</CardTitle>
                <CardDescription>
                  Datos corporativos de Kaitel que se muestran en la plataforma
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    Nombre de la Empresa
                  </label>
                  <Input
                    value={companyInfo.name}
                    onChange={(e) => setCompanyInfo({ ...companyInfo, name: e.target.value })}
                    placeholder="Kaitel"
                    className="w-full"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    Misión
                  </label>
                  <Textarea
                    value={companyInfo.mission}
                    onChange={(e) => setCompanyInfo({ ...companyInfo, mission: e.target.value })}
                    placeholder="Describe la misión de Kaitel"
                    className="w-full min-h-24"
                  />
                  <p className="text-xs text-slate-500 mt-1">
                    Se mostrará en el onboarding y página de inicio
                  </p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    Visión
                  </label>
                  <Textarea
                    value={companyInfo.vision}
                    onChange={(e) => setCompanyInfo({ ...companyInfo, vision: e.target.value })}
                    placeholder="Describe la visión de Kaitel"
                    className="w-full min-h-24"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    Valores Corporativos (separados por coma)
                  </label>
                  <Input
                    value={companyInfo.values}
                    onChange={(e) => setCompanyInfo({ ...companyInfo, values: e.target.value })}
                    placeholder="Eficiencia, Simplicidad, Innovación, Pasión, Confianza, Integridad"
                    className="w-full"
                  />
                  <div className="flex flex-wrap gap-2 mt-3">
                    {companyInfo.values.split(',').map((value, idx) => (
                      <Badge key={idx} variant="secondary" className="bg-gradient-to-r from-pink-500 to-purple-600 text-white">
                        {value.trim()}
                      </Badge>
                    ))}
                  </div>
                </div>

                <Button onClick={handleSaveConfig} className="w-full" disabled={saveStatus === 'saving'}>
                  <Save className="mr-2 h-4 w-4" />
                  {saveStatus === 'saving' ? 'Guardando...' : 'Guardar Cambios'}
                </Button>
              </CardContent>
            </Card>
          </TabsContent>

          {/* TAB 2: Training Settings */}
          <TabsContent value="training" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Configuración de Entrenamiento</CardTitle>
                <CardDescription>
                  Parámetros que controlan el comportamiento del sistema de coaching
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">
                      Simulaciones mínimas para Coaching IA
                    </label>
                    <Input
                      type="number"
                      value={trainingSettings.min_simulations_for_coaching}
                      onChange={(e) => setTrainingSettings({
                        ...trainingSettings,
                        min_simulations_for_coaching: parseInt(e.target.value)
                      })}
                      min="1"
                      max="10"
                      className="w-full"
                    />
                    <p className="text-xs text-slate-500 mt-1">
                      Número de simulaciones requeridas para generar un plan de coaching
                    </p>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">
                      Umbral de Bajo Rendimiento (%)
                    </label>
                    <Input
                      type="number"
                      value={trainingSettings.alert_threshold_low_performance}
                      onChange={(e) => setTrainingSettings({
                        ...trainingSettings,
                        alert_threshold_low_performance: parseInt(e.target.value)
                      })}
                      min="0"
                      max="100"
                      className="w-full"
                    />
                    <p className="text-xs text-slate-500 mt-1">
                      Score por debajo del cual se genera alerta de bajo rendimiento
                    </p>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">
                      Fallos Consecutivos para Alerta
                    </label>
                    <Input
                      type="number"
                      value={trainingSettings.alert_threshold_consecutive_failures}
                      onChange={(e) => setTrainingSettings({
                        ...trainingSettings,
                        alert_threshold_consecutive_failures: parseInt(e.target.value)
                      })}
                      min="1"
                      max="10"
                      className="w-full"
                    />
                    <p className="text-xs text-slate-500 mt-1">
                      Número de simulaciones consecutivas bajas que activan alerta
                    </p>
                  </div>
                </div>

                <div className="space-y-4 pt-4 border-t">
                  <h3 className="font-semibold text-slate-900">Características Habilitadas</h3>
                  
                  <div className="flex items-center justify-between p-3 border rounded-lg bg-slate-50">
                    <div>
                      <p className="font-medium text-slate-900">Buddy System</p>
                      <p className="text-sm text-slate-600">Emparejar agentes con fortalezas complementarias</p>
                    </div>
                    <Badge variant={trainingSettings.buddy_system_enabled ? 'default' : 'secondary'}>
                      {trainingSettings.buddy_system_enabled ? 'Activo' : 'Inactivo'}
                    </Badge>
                  </div>

                  <div className="flex items-center justify-between p-3 border rounded-lg bg-slate-50">
                    <div>
                      <p className="font-medium text-slate-900">Microlearning</p>
                      <p className="text-sm text-slate-600">Videos cortos de 2-3 minutos sobre habilidades</p>
                    </div>
                    <Badge variant={trainingSettings.microlearning_enabled ? 'default' : 'secondary'}>
                      {trainingSettings.microlearning_enabled ? 'Activo' : 'Inactivo'}
                    </Badge>
                  </div>

                  <div className="flex items-center justify-between p-3 border rounded-lg bg-slate-50">
                    <div>
                      <p className="font-medium text-slate-900">Grabación de Voz</p>
                      <p className="text-sm text-slate-600">Permitir grabación y análisis de llamadas</p>
                    </div>
                    <Badge variant={trainingSettings.voice_recording_enabled ? 'default' : 'secondary'}>
                      {trainingSettings.voice_recording_enabled ? 'Activo' : 'Inactivo'}
                    </Badge>
                  </div>
                </div>

                <Button onClick={handleSaveConfig} className="w-full" disabled={saveStatus === 'saving'}>
                  <Save className="mr-2 h-4 w-4" />
                  {saveStatus === 'saving' ? 'Guardando...' : 'Guardar Cambios'}
                </Button>
              </CardContent>
            </Card>
          </TabsContent>

          {/* TAB 3: Scoring Weights */}
          <TabsContent value="scoring" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Pesos de Puntuación</CardTitle>
                <CardDescription>
                  Ajusta cómo se calcula el score final de cada simulación
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <Alert>
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>
                    La suma de todos los pesos debe ser 100%. Actualmente: <strong>{getTotalWeight()}%</strong>
                  </AlertDescription>
                </Alert>

                <div className="space-y-4">
                  {Object.entries(scoringWeights).map(([key, value]) => (
                    <div key={key}>
                      <div className="flex items-center justify-between mb-2">
                        <label className="text-sm font-medium text-slate-700 capitalize">
                          {key === 'empathy' && 'Empatía'}
                          {key === 'clarity' && 'Claridad'}
                          {key === 'protocol' && 'Protocolo'}
                          {key === 'resolution' && 'Resolución'}
                          {key === 'confidence' && 'Confianza'}
                        </label>
                        <span className="text-sm font-bold text-slate-900">{value}%</span>
                      </div>
                      <input
                        type="range"
                        min="0"
                        max="100"
                        value={value}
                        onChange={(e) => setScoringWeights({
                          ...scoringWeights,
                          [key]: parseInt(e.target.value)
                        })}
                        className="w-full"
                      />
                    </div>
                  ))}
                </div>

                <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
                  <p className="text-sm text-blue-900">
                    <strong>Nota:</strong> Los pesos se aplican a todas las simulaciones nuevas. 
                    Las simulaciones completadas mantienen sus pesos originales.
                  </p>
                </div>

                <Button onClick={handleSaveConfig} className="w-full" disabled={saveStatus === 'saving'}>
                  <Save className="mr-2 h-4 w-4" />
                  {saveStatus === 'saving' ? 'Guardando...' : 'Guardar Cambios'}
                </Button>
              </CardContent>
            </Card>
          </TabsContent>

          {/* TAB 4: Performance Targets */}
          <TabsContent value="targets" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Objetivos de Desempeño</CardTitle>
                <CardDescription>
                  Define los KPIs y metas para el sistema de coaching
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">
                      Score Objetivo (%)
                    </label>
                    <Input
                      type="number"
                      value={performanceTargets.target_score}
                      onChange={(e) => setPerformanceTargets({
                        ...performanceTargets,
                        target_score: parseInt(e.target.value)
                      })}
                      min="0"
                      max="100"
                      className="w-full"
                    />
                    <p className="text-xs text-slate-500 mt-1">
                      Score mínimo esperado para agentes
                    </p>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">
                      Tasa de Completación (%)
                    </label>
                    <Input
                      type="number"
                      value={performanceTargets.target_completion_rate}
                      onChange={(e) => setPerformanceTargets({
                        ...performanceTargets,
                        target_completion_rate: parseInt(e.target.value)
                      })}
                      min="0"
                      max="100"
                      className="w-full"
                    />
                    <p className="text-xs text-slate-500 mt-1">
                      Porcentaje de simulaciones que deben completarse
                    </p>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">
                      Tasa de Mejora (%)
                    </label>
                    <Input
                      type="number"
                      value={performanceTargets.target_improvement_rate}
                      onChange={(e) => setPerformanceTargets({
                        ...performanceTargets,
                        target_improvement_rate: parseInt(e.target.value)
                      })}
                      min="0"
                      max="100"
                      className="w-full"
                    />
                    <p className="text-xs text-slate-500 mt-1">
                      Mejora esperada entre simulaciones
                    </p>
                  </div>
                </div>

                <div className="p-4 bg-purple-50 border border-purple-200 rounded-lg">
                  <p className="text-sm text-purple-900">
                    <strong>Estos objetivos se usan para:</strong>
                  </p>
                  <ul className="text-sm text-purple-900 mt-2 space-y-1 ml-4">
                    <li>• Generar alertas cuando agentes no alcanzan objetivos</li>
                    <li>• Crear planes de coaching personalizados</li>
                    <li>• Calcular métricas de desempeño del departamento</li>
                    <li>• Determinar bonificaciones y reconocimientos</li>
                  </ul>
                </div>

                <Button onClick={handleSaveConfig} className="w-full" disabled={saveStatus === 'saving'}>
                  <Save className="mr-2 h-4 w-4" />
                  {saveStatus === 'saving' ? 'Guardando...' : 'Guardar Cambios'}
                </Button>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
