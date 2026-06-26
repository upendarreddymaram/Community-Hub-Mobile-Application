import { API_CONFIG } from '../utils/constants';
import { logApiFailure, logApiStart, logApiSuccess } from '../utils/apiLogger';
import {
  handleUnauthorizedResponse,
  resolveAuthHeaders,
} from './authInterceptor';

export class ApiError extends Error {
  constructor(
    message: string,
    public statusCode: number = 500,
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

const DEFAULT_HEADERS = {
  Accept: 'application/json',
  'User-Agent': API_CONFIG.USER_AGENT,
};

export async function apiRequest<T>(url: string, options?: RequestInit): Promise<T> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), API_CONFIG.REQUEST_TIMEOUT_MS);
  const method = options?.method ?? 'GET';
  const startedAt = Date.now();

  logApiStart(url, method);

  try {
    const authHeaders = resolveAuthHeaders(
      options?.headers as Record<string, string> | Headers | undefined,
    );
    const response = await fetch(url, {
      ...options,
      signal: controller.signal,
      headers: {
        ...DEFAULT_HEADERS,
        ...authHeaders,
      },
    });

    if (!response.ok) {
      handleUnauthorizedResponse(response.status);
      throw new ApiError(
        `Request failed with status ${response.status}`,
        response.status,
      );
    }

    const data = (await response.json()) as T;
    logApiSuccess(url, data, Date.now() - startedAt);
    return data;
  } catch (error) {
    logApiFailure(url, error, Date.now() - startedAt);
    if (error instanceof ApiError) {
      throw error;
    }

    if (error instanceof Error && error.name === 'AbortError') {
      throw new ApiError('Request timed out. Please try again.', 408);
    }

    throw new ApiError(
      error instanceof Error ? error.message : 'Network request failed',
      503,
    );
  } finally {
    clearTimeout(timeout);
  }
}

/** Used only by mocked auth — keeps simulated latency for login demos. */
export async function simulateNetwork<T>(
  operation: () => T | Promise<T>,
  options?: { delayMs?: number },
): Promise<T> {
  const delayMs = options?.delayMs ?? API_CONFIG.SIMULATED_DELAY_MS;
  await new Promise<void>((resolve) => {
    setTimeout(() => resolve(), delayMs);
  });
  return operation();
}
