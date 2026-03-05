import React, { useState, useEffect } from 'react';
import { api, endpoints } from '@/services/api';
import { useAuth } from '@/contexts/AuthContext';

/**
 * Dashboard Overview Component
 *
 * Panel principal con resumen de:
 * - Sesiones recientes
 * - Estadísticas de desempeño
 * - Progreso del agente
 * - Próximos entrenamientos
 */

interface DashboardStats {
  totalSessions: number;
  completedSessions: number;
  averageScore: number;
  bestScore: number;
  completionRate: number;
}

interface RecentSession {
  id: string;
  scenarioTitle: string;
  status: string;
  score: number;
  completedAt: string;
}

export const DashboardOverview: React.FC = () => {
  const { user } = useAuth();
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [recentSessions, setRecentSessions] = useState<RecentSession[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      setIsLoading(true);
      setError(null);

      // Fetch stats
      const statsResponse = await api.get<DashboardStats>(
        '/sessions/stats/agent',
      );
      setStats(statsResponse.data);

      // Fetch recent sessions
      const sessionsResponse = await api.get<any>(
        '/sessions',
        {
          limit: 5,
          page: 1,
        },
      );
      setRecentSessions(
        sessionsResponse.data.data.map((s: any) => ({
          id: s.id,
          scenarioTitle: s.scenarioTitle || 'Escenario',
          status: s.status,
          score: s.overallScore || 0,
          completedAt: s.completedAt,
        })),
      );
    } catch (err) {
      const message =
        err instanceof Error
          ? err.message
          : 'Error loading dashboard';
      setError(message);
    } finally {
      setIsLoading(false);
    }
  };

  const StatCard = ({
    label,
    value,
    unit,
    trend,
    icon,
  }: {
    label: string;
    value: number;
    unit?: string;
    trend?: 'up' | 'down';
    icon: React.ReactNode;
  }) => (
    <div className="bg-white rounded-lg shadow p-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-sm font-medium text-gray-600">
          {label}
        </h3>
        <div className="text-gray-400">{icon}</div>
      </div>

      <p className="text-3xl font-bold text-gray-900">
        {value.toFixed(1)}
        {unit && <span className="text-lg text-gray-600 ml-1">{unit}</span>}
      </p>

      {trend && (
        <p
          className={`text-sm mt-2 ${
            trend === 'up'
              ? 'text-green-600'
              : 'text-red-600'
          }`}
        >
          {trend === 'up' ? '↑' : '↓'} Vs. semana anterior
        </p>
      )}
    </div>
  );

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-gray-600">Cargando dashboard...</div>
      </div>
    );
  }

  return (
    <div className="bg-gray-50 min-h-full">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 px-6 py-4">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">
              Dashboard
            </h1>
            <p className="text-gray-600 text-sm mt-1">
              Bienvenido, {user?.name}
            </p>
          </div>

          <button className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium">
            Nueva Sesión
          </button>
        </div>
      </div>

      {error && (
        <div className="m-6 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700">
          {error}
        </div>
      )}

      {/* Contenido */}
      <div className="p-6 space-y-6">
        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {stats ? (
            <>
              <StatCard
                label="Sesiones Totales"
                value={stats.totalSessions}
                icon={<span>📊</span>}
              />
              <StatCard
                label="Completadas"
                value={stats.completedSessions}
                icon={<span>✅</span>}
              />
              <StatCard
                label="Puntuación Promedio"
                value={stats.averageScore}
                unit="/10"
                trend="up"
                icon={<span>📈</span>}
              />
              <StatCard
                label="Mejor Puntuación"
                value={stats.bestScore}
                unit="/10"
                icon={<span>🏆</span>}
              />
            </>
          ) : null}
        </div>

        {/* Progreso */}
        {stats && (
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">
              Tasa de Finalización
            </h2>

            <div className="flex items-center space-x-4">
              <div className="flex-1">
                <div className="bg-gray-200 rounded-full h-4">
                  <div
                    className="bg-green-500 h-4 rounded-full transition-all"
                    style={{
                      width: `${stats.completionRate}%`,
                    }}
                  />
                </div>
              </div>
              <p className="text-2xl font-bold text-gray-900 w-16">
                {stats.completionRate.toFixed(0)}%
              </p>
            </div>
          </div>
        )}

        {/* Sesiones Recientes */}
        <div className="bg-white rounded-lg shadow">
          <div className="border-b border-gray-200 px-6 py-4">
            <h2 className="text-lg font-semibold text-gray-900">
              Sesiones Recientes
            </h2>
          </div>

          <div className="divide-y divide-gray-200">
            {recentSessions.length === 0 ? (
              <p className="p-6 text-gray-500 text-sm italic">
                Sin sesiones recientes
              </p>
            ) : (
              recentSessions.map((session) => (
                <div
                  key={session.id}
                  className="px-6 py-4 hover:bg-gray-50 transition-colors cursor-pointer"
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="font-medium text-gray-900">
                        {session.scenarioTitle}
                      </h3>
                      <p className="text-sm text-gray-600 mt-1">
                        {new Date(
                          session.completedAt,
                        ).toLocaleDateString()}
                      </p>
                    </div>

                    <div className="flex items-center space-x-6">
                      <div className="text-right">
                        <p className="text-2xl font-bold text-gray-900">
                          {session.score.toFixed(1)}
                        </p>
                        <p className="text-xs text-gray-600">/10</p>
                      </div>

                      <span
                        className={`px-3 py-1 rounded-full text-xs font-medium ${
                          session.status === 'COMPLETED'
                            ? 'bg-green-100 text-green-800'
                            : 'bg-gray-100 text-gray-800'
                        }`}
                      >
                        {session.status === 'COMPLETED'
                          ? 'Completada'
                          : session.status}
                      </span>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Próximos Entrenamientos */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Recomendaciones */}
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">
              Entrenamientos Recomendados
            </h2>

            <div className="space-y-3">
              {[
                'Manejo de clientes enfadados',
                'Resolución de disputas de facturación',
                'Cierre de cuentas',
              ].map((scenario, index) => (
                <button
                  key={index}
                  className="w-full text-left p-3 hover:bg-blue-50 rounded-lg border border-gray-200 transition-colors"
                >
                  <p className="font-medium text-gray-900">
                    {scenario}
                  </p>
                  <p className="text-xs text-gray-600 mt-1">
                    Haz clic para comenzar
                  </p>
                </button>
              ))}
            </div>
          </div>

          {/* Nivel y XP */}
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">
              Progreso de Nivel
            </h2>

            <div className="space-y-4">
              <div>
                <p className="text-3xl font-bold text-gray-900">
                  Nivel {user?.level || 1}
                </p>
                <p className="text-sm text-gray-600 mt-1">
                  {user?.experiencePoints || 0} XP obtenidos
                </p>
              </div>

              <div>
                <p className="text-sm text-gray-600 mb-2">
                  Progreso al siguiente nivel
                </p>
                <div className="bg-gray-200 rounded-full h-4">
                  <div
                    className="bg-blue-500 h-4 rounded-full"
                    style={{ width: '65%' }}
                  />
                </div>
                <p className="text-xs text-gray-600 mt-2">
                  650 / 1000 XP
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
