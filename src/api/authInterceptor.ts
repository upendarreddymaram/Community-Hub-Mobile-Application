type TokenGetter = () => string | null | undefined;
type UnauthorizedHandler = () => void;

let getAuthToken: TokenGetter | null = null;
let onUnauthorized: UnauthorizedHandler | null = null;

export function configureApiAuth(
  tokenGetter: TokenGetter,
  unauthorizedHandler: UnauthorizedHandler,
): void {
  getAuthToken = tokenGetter;
  onUnauthorized = unauthorizedHandler;
}

export function resolveAuthHeaders(
  headers?: Record<string, string> | Headers,
): Record<string, string> {
  const merged: Record<string, string> = {};

  if (headers) {
    if (headers instanceof Headers) {
      headers.forEach((value, key) => {
        merged[key] = value;
      });
    } else if (Array.isArray(headers)) {
      headers.forEach(([key, value]) => {
        merged[key] = value;
      });
    } else {
      Object.assign(merged, headers);
    }
  }

  const token = getAuthToken?.();
  if (token && !merged.Authorization) {
    merged.Authorization = `Bearer ${token}`;
  }

  return merged;
}

export function handleUnauthorizedResponse(status: number): void {
  if (status === 401) {
    onUnauthorized?.();
  }
}

export function isApiError(error: unknown): error is Error & { statusCode: number } {
  return error instanceof Error && error.name === 'ApiError';
}
