import { API_CONFIG } from '../utils/constants';
import { logApiFailure, logApiStart, logApiSuccess } from '../utils/apiLogger';
import { handleUnauthorizedResponse, resolveAuthHeaders } from './authInterceptor';

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

const RETRYABLE_STATUS_CODES = new Set([408, 429, 500, 502, 503, 504]);

function isRetryableError(error: unknown): boolean {
  if (error instanceof ApiError) {
    return RETRYABLE_STATUS_CODES.has(error.statusCode);
  }

  if (error instanceof Error && error.name === 'AbortError') {
    return true;
  }

  return error instanceof TypeError;
}

function retryDelayMs(attempt: number): number {
  const exponential = API_CONFIG.RETRY_BASE_DELAY_MS * 2 ** attempt;
  return Math.min(exponential, 8000);
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => {
    setTimeout(resolve, ms);
  });
}

async function executeRequest<T>(url: string, options?: RequestInit): Promise<T> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), API_CONFIG.REQUEST_TIMEOUT_MS);

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

    return (await response.json()) as T;
  } catch (error) {
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

export async function apiRequest<T>(url: string, options?: RequestInit): Promise<T> {
  const method = options?.method ?? 'GET';
  const startedAt = Date.now();

  logApiStart(url, method);

  let lastError: unknown;

  for (let attempt = 0; attempt <= API_CONFIG.MAX_RETRIES; attempt += 1) {
    try {
      const data = await executeRequest<T>(url, options);
      logApiSuccess(url, data, Date.now() - startedAt);
      return data;
    } catch (error) {
      lastError = error;
      const canRetry = attempt < API_CONFIG.MAX_RETRIES && isRetryableError(error);

      if (!canRetry) {
        logApiFailure(url, error, Date.now() - startedAt);
        throw error;
      }

      await sleep(retryDelayMs(attempt));
    }
  }

  logApiFailure(url, lastError, Date.now() - startedAt);
  throw lastError;
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
