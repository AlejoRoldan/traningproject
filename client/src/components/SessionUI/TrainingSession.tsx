import React, { useState, useEffect } from 'react';
import { useSession } from '@/hooks/useSession';
import { useAudio } from '@/hooks/useAudio';
import { useAuth } from '@/contexts/AuthContext';

/**
 * Training Session Component
 *
 * Interfaz principal para simulaciones de entrenamiento
 * - Interfaz de audio en tiempo real
 * - Transcript en vivo
 * - Métricas de desempeño
 * - Controles de sesión
 */

interface TrainingSessionProps {
  scenarioId: string;
  onSessionComplete?: (evaluation: any) => void;
}

export const TrainingSession: React.FC<TrainingSessionProps> = ({
  scenarioId,
  onSessionComplete,
}) => {
  const { user } = useAuth();
  const {
    session,
    startSession,
    endSession,
    addTranscriptEntry,
    updateEvaluation,
    isLoading,
  } = useSession();

  const {
    startRecording,
    stopRecording,
    isRecording,
    recordingTime,
    playAudio,
    isPlaying,
    playbackTime,
    audioStats,
    volume,
    setVolume,
    error: audioError,
  } = useAudio();

  const [isSessionStarted, setIsSessionStarted] = useState(false);

  /**
   * Iniciar sesión de entrenamiento
   */
  const handleStartSession = async () => {
    try {
      await startSession(scenarioId);
      setIsSessionStarted(true);
      await startRecording();
    } catch (error) {
      console.error('Error starting session:', error);
    }
  };

  /**
   * Finalizar sesión de entrenamiento
   */
  const handleEndSession = async () => {
    try {
      const audioBlob = await stopRecording();

      if (audioBlob) {
        // Enviar audio al backend para transcripción
        const formData = new FormData();
        formData.append('audio', audioBlob);
        formData.append('sessionId', session.sessionId || '');

        // Aquí iría la llamada a la API para procesar el audio
        console.log('Audio grabbed:', audioBlob);
      }

      await endSession();
      setIsSessionStarted(false);

      if (onSessionComplete && session.evaluation) {
        onSessionComplete(session.evaluation);
      }
    } catch (error) {
      console.error('Error ending session:', error);
    }
  };

  /**
   * Formato de tiempo MM:SS
   */
  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs
      .toString()
      .padStart(2, '0')}`;
  };

  return (
    <div className="flex h-full bg-gray-50">
      {/* Panel Principal */}
      <div className="flex-1 flex flex-col">
        {/* Header */}
        <div className="bg-white border-b border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">
                Sesión de Entrenamiento
              </h1>
              <p className="text-sm text-gray-600 mt-1">
                {user?.name} • Agente
              </p>
            </div>

            <div className="flex items-center space-x-4">
              <div className="text-right">
                <p className="text-sm text-gray-600">
                  Duración
                </p>
                <p className="text-2xl font-mono font-bold text-gray-900">
                  {formatTime(recordingTime)}
                </p>
              </div>

              {isSessionStarted && (
                <button
                  onClick={handleEndSession}
                  className="px-6 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 font-medium"
                >
                  Finalizar Sesión
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Contenido Principal */}
        <div className="flex-1 overflow-auto p-6 space-y-6">
          {/* Audio Status */}
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">
              Estado de Audio
            </h2>

            <div className="grid grid-cols-3 gap-4">
              {/* Grabación */}
              <div className="p-4 bg-gray-50 rounded-lg">
                <p className="text-sm text-gray-600 mb-2">
                  Grabación
                </p>
                <div className="flex items-center space-x-3">
                  <div
                    className={`w-3 h-3 rounded-full ${
                      isRecording
                        ? 'bg-red-500 animate-pulse'
                        : 'bg-gray-400'
                    }`}
                  />
                  <p className="text-lg font-mono font-bold text-gray-900">
                    {formatTime(recordingTime)}
                  </p>
                </div>
              </div>

              {/* Decibeles */}
              <div className="p-4 bg-gray-50 rounded-lg">
                <p className="text-sm text-gray-600 mb-2">
                  Volumen
                </p>
                <p className="text-lg font-mono font-bold text-gray-900">
                  {audioStats.decibels.toFixed(1)} dB
                </p>
                <div className="mt-2 bg-gray-200 rounded-full h-2">
                  <div
                    className="bg-blue-500 h-2 rounded-full"
                    style={{
                      width: `${Math.min(
                        100,
                        audioStats.decibels + 50,
                      )}%`,
                    }}
                  />
                </div>
              </div>

              {/* Frecuencia */}
              <div className="p-4 bg-gray-50 rounded-lg">
                <p className="text-sm text-gray-600 mb-2">
                  Frecuencia
                </p>
                <p className="text-lg font-mono font-bold text-gray-900">
                  {(audioStats.frequency / 1000).toFixed(1)} kHz
                </p>
              </div>
            </div>

            {/* Controles */}
            <div className="mt-6 flex items-center space-x-4">
              {!isSessionStarted ? (
                <button
                  onClick={handleStartSession}
                  disabled={isLoading}
                  className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-400 font-medium"
                >
                  {isLoading
                    ? 'Inicializando...'
                    : 'Iniciar Sesión'}
                </button>
              ) : (
                <button
                  onClick={isRecording ? stopRecording : startRecording}
                  className={`px-6 py-2 rounded-lg font-medium text-white ${
                    isRecording
                      ? 'bg-orange-600 hover:bg-orange-700'
                      : 'bg-green-600 hover:bg-green-700'
                  }`}
                >
                  {isRecording
                    ? 'Detener Grabación'
                    : 'Iniciar Grabación'}
                </button>
              )}

              {/* Control de Volumen */}
              <div className="flex items-center space-x-3 ml-auto">
                <svg className="w-5 h-5 text-gray-600">
                  <path fill="currentColor" d="M8 2a.5.5 0 0 0-.5.5v11a.5.5 0 0 0 .5.5h1a.5.5 0 0 0 .5-.5V2.5A.5.5 0 0 0 9 2H8z" />
                </svg>
                <input
                  type="range"
                  min="0"
                  max="1"
                  step="0.1"
                  value={volume}
                  onChange={(e) => setVolume(parseFloat(e.target.value))}
                  className="w-32"
                />
              </div>
            </div>

            {audioError && (
              <p className="mt-4 text-sm text-red-600">{audioError}</p>
            )}
          </div>

          {/* Transcript en Vivo */}
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">
              Transcript en Vivo
            </h2>

            <div className="space-y-3 max-h-64 overflow-y-auto">
              {session.transcript.length === 0 ? (
                <p className="text-gray-500 text-sm italic">
                  Sin transcripción aún...
                </p>
              ) : (
                session.transcript.map((entry, index) => (
                  <div
                    key={index}
                    className={`p-3 rounded-lg ${
                      entry.role === 'agent'
                        ? 'bg-blue-50 border-l-4 border-blue-500'
                        : 'bg-green-50 border-l-4 border-green-500'
                    }`}
                  >
                    <p className="text-xs font-medium text-gray-600 mb-1">
                      {entry.role === 'agent'
                        ? 'Yo (Agente)'
                        : 'Cliente IA'}
                    </p>
                    <p className="text-gray-900">{entry.content}</p>
                    <p className="text-xs text-gray-500 mt-1">
                      {entry.timestamp.toLocaleTimeString()}
                    </p>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Panel Lateral - Evaluación */}
      <div className="w-80 bg-white border-l border-gray-200 p-6 overflow-y-auto">
        <h2 className="text-lg font-semibold text-gray-900 mb-6">
          Evaluación
        </h2>

        <div className="space-y-4">
          {/* Puntuaciones */}
          {[
            { label: 'Empatía', key: 'empathyScore' },
            { label: 'Claridad', key: 'clarityScore' },
            { label: 'Protocolo', key: 'protocolScore' },
            { label: 'Resolución', key: 'resolutionScore' },
            {
              label: 'Confianza',
              key: 'confidenceScore',
            },
          ].map((dimension) => (
            <div
              key={dimension.key}
              className="flex items-center justify-between"
            >
              <span className="text-sm text-gray-700 font-medium">
                {dimension.label}
              </span>
              <div className="flex items-center space-x-2">
                <div className="w-24 bg-gray-200 rounded-full h-2">
                  <div
                    className="bg-blue-500 h-2 rounded-full transition-all"
                    style={{
                      width: `${(
                        (session.evaluation[
                          dimension.key as keyof typeof session.evaluation
                        ] as number) || 0
                      ) * 10}%`,
                    }}
                  />
                </div>
                <span className="text-sm font-mono font-bold text-gray-900 w-8">
                  {(
                    session.evaluation[
                      dimension.key as keyof typeof session.evaluation
                    ] as number
                  ) || 0}
                  /10
                </span>
              </div>
            </div>
          ))}

          {/* Puntuación General */}
          <div className="mt-6 p-4 bg-blue-50 rounded-lg border border-blue-200">
            <p className="text-sm text-gray-600 mb-2">
              Puntuación General
            </p>
            <p className="text-3xl font-bold text-blue-600">
              {(session.evaluation.overallScore || 0).toFixed(1)}
              <span className="text-lg text-gray-600 ml-1">
                /10
              </span>
            </p>
          </div>
        </div>

        {/* Estado de Sesión */}
        <div className="mt-8 p-4 bg-gray-50 rounded-lg">
          <p className="text-xs text-gray-600 mb-2 uppercase font-medium">
            Estado
          </p>
          <p className="text-sm font-semibold text-gray-900">
            {session.status === 'idle'
              ? 'Listo para comenzar'
              : session.status === 'active'
                ? 'Sesión activa'
                : session.status === 'completed'
                  ? 'Completado'
                  : 'Error'}
          </p>
        </div>
      </div>
    </div>
  );
};
