import React, {
  createContext,
  useContext,
  useState,
  useCallback,
  useEffect,
} from 'react';
import { api, endpoints } from '@/services/api';

/**
 * Auth Context
 *
 * Gestiona autenticación global de la aplicación
 * - Login/Logout
 * - Registro de usuarios
 * - Gestión de tokens
 * - Datos del usuario actual
 */

export interface User {
  id: string;
  email: string;
  name: string;
  role: 'AGENT' | 'SUPERVISOR' | 'ADMIN' | 'SYSTEM';
  status: 'ACTIVE' | 'SUSPENDED' | 'INACTIVE';
  level: number;
  experiencePoints: number;
  department?: string;
}

export interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;

  register: (
    email: string,
    name: string,
    password: string,
  ) => Promise<void>;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  checkAuth: () => Promise<void>;
  clearError: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

/**
 * Auth Context Provider Component
 */
export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  /**
   * Verificar autenticación al cargar la aplicación
   */
  const checkAuth = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);

      if (!api.isAuthenticated()) {
        setUser(null);
        return;
      }

      const response = await api.get<User>(endpoints.me);
      setUser(response.data);
    } catch (err) {
      const message =
        err instanceof Error ? err.message : 'Error checking auth';
      setError(message);
      setUser(null);
      api.logout();
    } finally {
      setIsLoading(false);
    }
  }, []);

  /**
   * Registrar nuevo usuario
   */
  const register = useCallback(
    async (
      email: string,
      name: string,
      password: string,
    ) => {
      try {
        setIsLoading(true);
        setError(null);

        const response = await api.post<{
          user: User;
          tokens: { accessToken: string; refreshToken: string };
        }>(endpoints.register, {
          email,
          name,
          password,
          role: 'AGENT',
        });

        const { user: newUser, tokens } = response.data;

        api.setTokens(tokens.accessToken, tokens.refreshToken);
        setUser(newUser);
      } catch (err) {
        const message =
          err instanceof Error
            ? err.message
            : 'Registration failed';
        setError(message);
        throw err;
      } finally {
        setIsLoading(false);
      }
    },
    [],
  );

  /**
   * Login con email y contraseña
   */
  const login = useCallback(
    async (email: string, password: string) => {
      try {
        setIsLoading(true);
        setError(null);

        const response = await api.post<{
          user: User;
          tokens: { accessToken: string; refreshToken: string };
        }>(endpoints.login, {
          email,
          password,
        });

        const { user: loggedInUser, tokens } = response.data;

        api.setTokens(tokens.accessToken, tokens.refreshToken);
        setUser(loggedInUser);
      } catch (err) {
        const message =
          err instanceof Error ? err.message : 'Login failed';
        setError(message);
        throw err;
      } finally {
        setIsLoading(false);
      }
    },
    [],
  );

  /**
   * Logout
   */
  const logout = useCallback(async () => {
    try {
      setIsLoading(true);

      try {
        await api.post(endpoints.logout);
      } catch {
        // Ignorar errores al hacer logout
      }

      api.logout();
      setUser(null);
      setError(null);
    } finally {
      setIsLoading(false);
    }
  }, []);

  /**
   * Limpiar error
   */
  const clearError = useCallback(() => {
    setError(null);
  }, []);

  // Verificar autenticación al montar
  useEffect(() => {
    checkAuth();
  }, [checkAuth]);

  const value: AuthContextType = {
    user,
    isAuthenticated: user !== null,
    isLoading,
    error,

    register,
    login,
    logout,
    checkAuth,
    clearError,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

/**
 * Hook para usar Auth Context
 */
export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error(
      'useAuth debe ser usado dentro de AuthProvider',
    );
  }
  return context;
};
