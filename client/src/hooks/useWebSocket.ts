import { useEffect, useRef, useCallback } from 'react';
import { io, Socket } from 'socket.io-client';

/**
 * useWebSocket Hook
 *
 * Gestiona la conexión WebSocket con el servidor NestJS
 * - Conexión automática y reconexión
 * - Emit y listen a eventos
 * - Manejo de desconexión
 */

interface UseWebSocketReturn {
  emit: (event: string, data?: any) => void;
  on: (event: string, callback: (data: any) => void) => void;
  off: (event: string) => void;
  isConnected: boolean;
}

let socketInstance: Socket | null = null;

export const useWebSocket = (): UseWebSocketReturn => {
  const socketRef = useRef<Socket | null>(null);
  const listeners = useRef<Map<string, (data: any) => void>>(
    new Map(),
  );

  useEffect(() => {
    // Crear o reutilizar conexión WebSocket
    if (!socketRef.current) {
      const wsUrl =
        process.env.NEXT_PUBLIC_WS_URL || 'http://localhost:3001';

      socketRef.current = io(wsUrl, {
        reconnection: true,
        reconnectionDelay: 1000,
        reconnectionDelayMax: 5000,
        reconnectionAttempts: 5,
        transports: ['websocket'],
        auth: {
          token: localStorage.getItem('accessToken') || '',
        },
      });

      socketRef.current.on('connect', () => {
        console.log('WebSocket connected');
      });

      socketRef.current.on('disconnect', () => {
        console.log('WebSocket disconnected');
      });

      socketRef.current.on('error', (error) => {
        console.error('WebSocket error:', error);
      });

      socketInstance = socketRef.current;
    }

    return () => {
      // Mantener la conexión abierta entre cambios de componentes
      // Solo desconectar cuando se unmountea la aplicación
    };
  }, []);

  /**
   * Emitir evento al servidor
   */
  const emit = useCallback((event: string, data?: any) => {
    if (socketRef.current?.connected) {
      socketRef.current.emit(event, data);
    } else {
      console.warn(`WebSocket not connected, cannot emit: ${event}`);
    }
  }, []);

  /**
   * Escuchar evento del servidor
   */
  const on = useCallback((event: string, callback: (data: any) => void) => {
    if (socketRef.current) {
      listeners.current.set(event, callback);
      socketRef.current.on(event, callback);
    }
  }, []);

  /**
   * Dejar de escuchar evento
   */
  const off = useCallback((event: string) => {
    if (socketRef.current) {
      const callback = listeners.current.get(event);
      if (callback) {
        socketRef.current.off(event, callback);
        listeners.current.delete(event);
      }
    }
  }, []);

  return {
    emit,
    on,
    off,
    isConnected: socketRef.current?.connected || false,
  };
};

/**
 * Obtener instancia global de WebSocket
 */
export const getWebSocketInstance = (): Socket | null => {
  return socketInstance;
};
