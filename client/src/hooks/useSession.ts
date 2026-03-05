import { useState, useCallback, useRef, useEffect } from 'react';
import { useWebSocket } from './useWebSocket';
import { api } from '@/services/api';

/**
 * useSession Hook
 *
 * Gestiona el ciclo de vida completo de una sesión de entrenamiento:
 * - Inicialización de sesiones
 * - Grabación de audio
 * - Procesamiento en tiempo real
 * - Manejo de errores
 */

export interface SessionState {
  sessionId: string | null;
  status: 'idle' | 'initializing' | 'active' | 'processing' | 'completed' | 'error';
  agentId: string | null;
  scenarioId: string | null;
  startTime: Date | null;
  endTime: Date | null;
  transcript: Array<{
    role: 'agent' | 'client';
    content: string;
    timestamp: Date;
  }>;
  evaluation: {
    empathyScore?: number;
    clarityScore?: number;
    protocolScore?: number;
    resolutionScore?: number;
    confidenceScore?: number;
    overallScore?: number;
  };
  error: string | null;
}

interface UseSessionReturn {
  session: SessionState;
  startSession: (scenarioId: string) => Promise<void>;
  endSession: () => Promise<void>;
  addTranscriptEntry: (role: 'agent' | 'client', content: string) => void;
  updateEvaluation: (evaluation: any) => void;
  resetSession: () => void;
  isLoading: boolean;
}

export const useSession = (): UseSessionReturn => {
  const [session, setSession] = useState<SessionState>({
    sessionId: null,
    status: 'idle',
    agentId: null,
    scenarioId: null,
    startTime: null,
    endTime: null,
    transcript: [],
    evaluation: {},
    error: null,
  });

  const [isLoading, setIsLoading] = useState(false);
  const { emit, on, off } = useWebSocket();
  const transcriptRef = useRef<SessionState['transcript']>([]);

  /**
   * Inicia una nueva sesión de entrenamiento
   */
  const startSession = useCallback(
    async (scenarioId: string) => {
      try {
        setIsLoading(true);
        setSession((prev) => ({
          ...prev,
          status: 'initializing',
          error: null,
        }));

        // Llamada a la API backend
        const response = await api.post('/sessions', {
          scenarioId,
        });

        const newSession = response.data.data;

        setSession((prev) => ({
          ...prev,
          sessionId: newSession.id,
          status: 'active',
          agentId: newSession.agentId,
          scenarioId: newSession.scenarioId,
          startTime: new Date(),
          transcript: [],
        }));

        // Conectar a WebSocket para actualizaciones en tiempo real
        emit('session:start', {
          sessionId: newSession.id,
          scenarioId,
        });

        // Escuchar eventos del servidor
        on('session:transcriptUpdate', (data) => {
          addTranscriptEntry(data.role, data.content);
        });

        on('session:evaluation', (data) => {
          updateEvaluation(data);
        });

        on('session:end', () => {
          endSession();
        });
      } catch (error) {
        const message =
          error instanceof Error ? error.message : 'Error starting session';
        setSession((prev) => ({
          ...prev,
          status: 'error',
          error: message,
        }));
        throw error;
      } finally {
        setIsLoading(false);
      }
    },
    [emit, on],
  );

  /**
   * Finaliza la sesión de entrenamiento
   */
  const endSession = useCallback(async () => {
    if (!session.sessionId) return;

    try {
      setSession((prev) => ({
        ...prev,
        status: 'processing',
      }));

      // Completar sesión en el backend
      await api.put(`/sessions/${session.sessionId}/complete`, {
        status: 'COMPLETED',
      });

      setSession((prev) => ({
        ...prev,
        status: 'completed',
        endTime: new Date(),
      }));

      // Limpiar listeners
      off('session:transcriptUpdate');
      off('session:evaluation');
      off('session:end');
    } catch (error) {
      const message =
        error instanceof Error ? error.message : 'Error ending session';
      setSession((prev) => ({
        ...prev,
        status: 'error',
        error: message,
      }));
    }
  }, [session.sessionId, off]);

  /**
   * Añade una entrada al transcript
   */
  const addTranscriptEntry = useCallback(
    (role: 'agent' | 'client', content: string) => {
      const entry = {
        role,
        content,
        timestamp: new Date(),
      };

      transcriptRef.current.push(entry);

      setSession((prev) => ({
        ...prev,
        transcript: [...prev.transcript, entry],
      }));
    },
    [],
  );

  /**
   * Actualiza la evaluación de la sesión
   */
  const updateEvaluation = useCallback((evaluation: any) => {
    setSession((prev) => ({
      ...prev,
      evaluation: {
        ...prev.evaluation,
        ...evaluation,
      },
    }));
  }, []);

  /**
   * Resetea el estado de la sesión
   */
  const resetSession = useCallback(() => {
    setSession({
      sessionId: null,
      status: 'idle',
      agentId: null,
      scenarioId: null,
      startTime: null,
      endTime: null,
      transcript: [],
      evaluation: {},
      error: null,
    });
    transcriptRef.current = [];
  }, []);

  return {
    session,
    startSession,
    endSession,
    addTranscriptEntry,
    updateEvaluation,
    resetSession,
    isLoading,
  };
};
