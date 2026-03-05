/**
 * API Client Service
 *
 * Cliente HTTP tipado para comunicarse con el backend NestJS
 * - Autenticación con JWT
 * - Manejo de errores
 * - Interceptores para tokens
 * - Soporte para refresh tokens
 */

interface RequestConfig {
  method?: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH';
  headers?: Record<string, string>;
  body?: any;
  params?: Record<string, string | number | boolean>;
}

interface ApiResponse<T = any> {
  data: T;
  statusCode: number;
  message?: string;
}

class ApiClient {
  private baseUrl: string;
  private accessToken: string | null = null;
  private refreshToken: string | null = null;

  constructor() {
    this.baseUrl =
      process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';
    this.loadTokens();
  }

  /**
   * Cargar tokens del localStorage
   */
  private loadTokens() {
    this.accessToken = localStorage.getItem('accessToken');
    this.refreshToken = localStorage.getItem('refreshToken');
  }

  /**
   * Guardar tokens en localStorage
   */
  private saveTokens(accessToken: string, refreshToken?: string) {
    this.accessToken = accessToken;
    localStorage.setItem('accessToken', accessToken);

    if (refreshToken) {
      this.refreshToken = refreshToken;
      localStorage.setItem('refreshToken', refreshToken);
    }
  }

  /**
   * Limpiar tokens
   */
  private clearTokens() {
    this.accessToken = null;
    this.refreshToken = null;
    localStorage.removeItem('accessToken');
    localStorage.removeItem('refreshToken');
  }

  /**
   * Refrescar token de acceso
   */
  private async refreshAccessToken(): Promise<boolean> {
    if (!this.refreshToken) {
      this.clearTokens();
      return false;
    }

    try {
      const response = await this.request('/auth/refresh', {
        method: 'POST',
        body: { refreshToken: this.refreshToken },
      });

      const { accessToken, refreshToken } = response.data.tokens;
      this.saveTokens(accessToken, refreshToken);
      return true;
    } catch (error) {
      this.clearTokens();
      return false;
    }
  }

  /**
   * Construir URL con parámetros
   */
  private buildUrl(
    endpoint: string,
    params?: Record<string, string | number | boolean>,
  ): string {
    const url = new URL(endpoint, this.baseUrl);

    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        url.searchParams.append(key, String(value));
      });
    }

    return url.toString();
  }

  /**
   * Realizar request HTTP
   */
  private async request<T>(
    endpoint: string,
    config: RequestConfig = {},
  ): Promise<ApiResponse<T>> {
    const {
      method = 'GET',
      headers = {},
      body,
      params,
    } = config;

    const url = this.buildUrl(endpoint, params);

    const requestHeaders: HeadersInit = {
      'Content-Type': 'application/json',
      ...headers,
    };

    // Añadir token de autenticación
    if (this.accessToken) {
      requestHeaders['Authorization'] = `Bearer ${this.accessToken}`;
    }

    let retries = 0;
    const maxRetries = 1;

    while (retries <= maxRetries) {
      try {
        const response = await fetch(url, {
          method,
          headers: requestHeaders,
          body: body ? JSON.stringify(body) : undefined,
        });

        // Token expirado - intentar refrescar
        if (response.status === 401 && retries < maxRetries) {
          const refreshed = await this.refreshAccessToken();
          if (refreshed) {
            requestHeaders['Authorization'] = `Bearer ${this.accessToken}`;
            retries++;
            continue;
          }
        }

        const data = await response.json();

        if (!response.ok) {
          throw new ApiError(
            data.message || 'API Error',
            response.status,
            data,
          );
        }

        return {
          data: data.data || data,
          statusCode: response.status,
          message: data.message,
        };
      } catch (error) {
        if (retries < maxRetries) {
          retries++;
          continue;
        }

        if (error instanceof ApiError) {
          throw error;
        }

        throw new ApiError(
          error instanceof Error ? error.message : 'Network error',
          0,
          error,
        );
      }
    }

    throw new ApiError('Max retries exceeded', 0, null);
  }

  /**
   * GET request
   */
  async get<T>(
    endpoint: string,
    params?: Record<string, string | number | boolean>,
  ): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, { method: 'GET', params });
  }

  /**
   * POST request
   */
  async post<T>(
    endpoint: string,
    body?: any,
    params?: Record<string, string | number | boolean>,
  ): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, {
      method: 'POST',
      body,
      params,
    });
  }

  /**
   * PUT request
   */
  async put<T>(
    endpoint: string,
    body?: any,
    params?: Record<string, string | number | boolean>,
  ): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, {
      method: 'PUT',
      body,
      params,
    });
  }

  /**
   * DELETE request
   */
  async delete<T>(
    endpoint: string,
    params?: Record<string, string | number | boolean>,
  ): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, {
      method: 'DELETE',
      params,
    });
  }

  /**
   * PATCH request
   */
  async patch<T>(
    endpoint: string,
    body?: any,
    params?: Record<string, string | number | boolean>,
  ): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, {
      method: 'PATCH',
      body,
      params,
    });
  }

  /**
   * Obtener token de acceso actual
   */
  getAccessToken(): string | null {
    return this.accessToken;
  }

  /**
   * Establecer tokens manualmente
   */
  setTokens(accessToken: string, refreshToken?: string) {
    this.saveTokens(accessToken, refreshToken);
  }

  /**
   * Logout - limpiar tokens
   */
  logout() {
    this.clearTokens();
  }

  /**
   * Verificar si está autenticado
   */
  isAuthenticated(): boolean {
    return this.accessToken !== null;
  }
}

/**
 * Error personalizado de API
 */
export class ApiError extends Error {
  constructor(
    message: string,
    public statusCode: number,
    public response: any,
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

// Exportar instancia singleton
export const api = new ApiClient();

/**
 * API Endpoints tipados
 */
export const endpoints = {
  // Auth
  register: '/auth/register',
  login: '/auth/login',
  logout: '/auth/logout',
  refresh: '/auth/refresh',
  me: '/auth/me',
  changePassword: '/auth/password/change',

  // Sessions
  sessions: '/sessions',
  sessionDetail: (id: string) => `/sessions/${id}`,
  completeSession: (id: string) =>
    `/sessions/${id}/complete`,
  sessionTranscript: (id: string) =>
    `/sessions/${id}/transcript`,

  // Scenarios
  scenarios: '/scenarios',
  scenarioDetail: (id: string) => `/scenarios/${id}`,

  // Users
  users: '/users',
  userProfile: (id: string) => `/users/${id}`,
  myProfile: '/users/me/profile',

  // Feedback
  feedback: '/feedback',
  sessionFeedback: (sessionId: string) =>
    `/feedback/session/${sessionId}`,
  agentFeedback: (agentId: string) =>
    `/feedback/agent/${agentId}`,

  // Analytics
  analytics: {
    dashboard: '/analytics/dashboard',
    metrics: '/analytics/metrics',
    leaderboard: '/analytics/leaderboard',
    scenarios: '/analytics/scenarios/performance',
  },
};
