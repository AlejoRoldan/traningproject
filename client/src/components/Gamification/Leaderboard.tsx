import React, { useState, useEffect } from 'react';
import { api } from '@/services/api';

/**
 * Leaderboard Component
 *
 * Mostrar ranking de agentes
 * - Top agentes por XP
 * - Top agentes por nivel
 * - Top agentes por tasa de finalización
 */

interface LeaderboardEntry {
  id: string;
  name: string;
  level: number;
  experiencePoints: number;
  currentLevelXP: number;
  department?: string;
  rank: number;
}

interface LeaderboardProps {
  sortBy?: 'xp' | 'level' | 'completionRate';
  limit?: number;
}

export const Leaderboard: React.FC<LeaderboardProps> = ({
  sortBy = 'xp',
  limit = 10,
}) => {
  const [entries, setEntries] = useState<LeaderboardEntry[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentSortBy, setCurrentSortBy] = useState(sortBy);

  useEffect(() => {
    fetchLeaderboard();
  }, [currentSortBy, limit]);

  const fetchLeaderboard = async () => {
    try {
      setIsLoading(true);
      setError(null);

      const response = await api.get<LeaderboardEntry[]>(
        '/analytics/leaderboard',
        {
          sortBy: currentSortBy,
          limit,
        },
      );

      setEntries(response.data);
    } catch (err) {
      const message =
        err instanceof Error
          ? err.message
          : 'Error loading leaderboard';
      setError(message);
    } finally {
      setIsLoading(false);
    }
  };

  const getMedalEmoji = (rank: number): string => {
    switch (rank) {
      case 1:
        return '🥇';
      case 2:
        return '🥈';
      case 3:
        return '🥉';
      default:
        return '';
    }
  };

  const getLevelColor = (level: number): string => {
    if (level >= 50) return 'bg-purple-100 text-purple-800';
    if (level >= 30) return 'bg-blue-100 text-blue-800';
    if (level >= 15) return 'bg-green-100 text-green-800';
    return 'bg-yellow-100 text-yellow-800';
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-96">
        <p className="text-gray-600">Cargando tabla de clasificación...</p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow">
      {/* Header */}
      <div className="border-b border-gray-200 px-6 py-4">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-semibold text-gray-900">
            🏆 Tabla de Clasificación
          </h2>

          <div className="flex space-x-2">
            {[
              { key: 'xp', label: 'XP' },
              { key: 'level', label: 'Nivel' },
              {
                key: 'completionRate',
                label: 'Finalización',
              },
            ].map((option) => (
              <button
                key={option.key}
                onClick={() =>
                  setCurrentSortBy(
                    option.key as 'xp' | 'level' | 'completionRate',
                  )
                }
                className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                  currentSortBy === option.key
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                {option.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {error && (
        <div className="p-4 bg-red-50 border-t border-red-200 text-red-700 text-sm">
          {error}
        </div>
      )}

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="bg-gray-50 border-b border-gray-200">
            <tr>
              <th className="px-6 py-3 text-left">
                <span className="text-xs font-semibold text-gray-700 uppercase">
                  Posición
                </span>
              </th>
              <th className="px-6 py-3 text-left">
                <span className="text-xs font-semibold text-gray-700 uppercase">
                  Agente
                </span>
              </th>
              <th className="px-6 py-3 text-left">
                <span className="text-xs font-semibold text-gray-700 uppercase">
                  Departamento
                </span>
              </th>
              <th className="px-6 py-3 text-right">
                <span className="text-xs font-semibold text-gray-700 uppercase">
                  Nivel
                </span>
              </th>
              <th className="px-6 py-3 text-right">
                <span className="text-xs font-semibold text-gray-700 uppercase">
                  XP Total
                </span>
              </th>
              <th className="px-6 py-3 text-right">
                <span className="text-xs font-semibold text-gray-700 uppercase">
                  Progreso
                </span>
              </th>
            </tr>
          </thead>

          <tbody className="divide-y divide-gray-200">
            {entries.length === 0 ? (
              <tr>
                <td
                  colSpan={6}
                  className="px-6 py-8 text-center text-gray-500"
                >
                  Sin datos de tabla de clasificación
                </td>
              </tr>
            ) : (
              entries.map((entry, index) => (
                <tr
                  key={entry.id}
                  className={`hover:bg-gray-50 transition-colors ${
                    entry.rank <= 3
                      ? 'bg-yellow-50'
                      : ''
                  }`}
                >
                  {/* Posición */}
                  <td className="px-6 py-4">
                    <div className="flex items-center space-x-2">
                      <span className="text-xl">
                        {getMedalEmoji(entry.rank)}
                      </span>
                      <span className="font-bold text-lg text-gray-900">
                        #{entry.rank}
                      </span>
                    </div>
                  </td>

                  {/* Nombre */}
                  <td className="px-6 py-4">
                    <p className="font-medium text-gray-900">
                      {entry.name}
                    </p>
                  </td>

                  {/* Departamento */}
                  <td className="px-6 py-4">
                    <p className="text-sm text-gray-600">
                      {entry.department || '-'}
                    </p>
                  </td>

                  {/* Nivel */}
                  <td className="px-6 py-4 text-right">
                    <span
                      className={`px-3 py-1 rounded-full text-sm font-bold ${getLevelColor(
                        entry.level,
                      )}`}
                    >
                      Nivel {entry.level}
                    </span>
                  </td>

                  {/* XP Total */}
                  <td className="px-6 py-4 text-right">
                    <p className="font-mono font-bold text-gray-900">
                      {entry.experiencePoints.toLocaleString()}
                    </p>
                  </td>

                  {/* Progreso */}
                  <td className="px-6 py-4 text-right">
                    <div className="flex items-center space-x-2 justify-end">
                      <div className="w-24 bg-gray-200 rounded-full h-2">
                        <div
                          className="bg-blue-500 h-2 rounded-full"
                          style={{
                            width: `${(
                              (entry.currentLevelXP / 1000) *
                              100
                            ).toFixed(0)}%`,
                          }}
                        />
                      </div>
                      <span className="text-xs text-gray-600 w-12">
                        {(
                          (entry.currentLevelXP / 1000) *
                          100
                        ).toFixed(0)}%
                      </span>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

/**
 * Achievement Badge Component
 */
interface AchievementBadgeProps {
  icon: string;
  name: string;
  description: string;
  unlockedAt?: string;
  locked?: boolean;
}

export const AchievementBadge: React.FC<AchievementBadgeProps> = ({
  icon,
  name,
  description,
  unlockedAt,
  locked,
}) => (
  <div
    className={`p-4 rounded-lg border-2 text-center transition-all ${
      locked
        ? 'bg-gray-50 border-gray-200 opacity-50'
        : 'bg-blue-50 border-blue-200'
    }`}
  >
    <p className="text-4xl mb-2">{icon}</p>
    <h3 className="font-semibold text-gray-900 text-sm">
      {name}
    </h3>
    <p className="text-xs text-gray-600 mt-1">
      {description}
    </p>
    {unlockedAt && !locked && (
      <p className="text-xs text-green-600 font-medium mt-2">
        ✓ Desbloqueado
      </p>
    )}
  </div>
);

/**
 * Achievements Grid Component
 */
export const AchievementsGrid: React.FC = () => {
  const achievements = [
    {
      icon: '🚀',
      name: 'Primer Paso',
      description: 'Completa tu primer entrenamiento',
      unlockedAt: '2024-01-15',
      locked: false,
    },
    {
      icon: '⚡',
      name: 'Rayo',
      description: 'Completa 10 entrenamientos',
      locked: false,
    },
    {
      icon: '💯',
      name: 'Perfeccionista',
      description: 'Obtén una puntuación perfecta',
      locked: true,
    },
    {
      icon: '🏆',
      name: 'Campeón',
      description: 'Sé #1 en la tabla de clasificación',
      locked: true,
    },
    {
      icon: '🔥',
      name: 'En Racha',
      description: 'Completa 5 entrenamientos seguidos',
      locked: true,
    },
    {
      icon: '👑',
      name: 'Maestro',
      description: 'Alcanza nivel 50',
      locked: true,
    },
  ];

  return (
    <div className="bg-white rounded-lg shadow p-6">
      <h2 className="text-xl font-semibold text-gray-900 mb-6">
        🎖️ Logros Desbloqueados
      </h2>

      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        {achievements.map((achievement, index) => (
          <AchievementBadge
            key={index}
            {...achievement}
          />
        ))}
      </div>
    </div>
  );
};
