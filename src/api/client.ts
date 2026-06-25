import { API_CONFIG } from '../utils/constants';

export class ApiError extends Error {
  constructor(
    message: string,
    public statusCode: number = 500,
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

export async function simulateNetwork<T>(
  operation: () => T | Promise<T>,
  options?: { delayMs?: number; shouldFail?: boolean },
): Promise<T> {
  const delayMs = options?.delayMs ?? API_CONFIG.SIMULATED_DELAY_MS;
  await new Promise<void>((resolve) => {
    setTimeout(() => resolve(), delayMs);
  });

  const shouldFail =
    options?.shouldFail ?? Math.random() < API_CONFIG.SIMULATED_ERROR_RATE;

  if (shouldFail) {
    throw new ApiError('Network request failed. Please try again.', 503);
  }

  return operation();
}
