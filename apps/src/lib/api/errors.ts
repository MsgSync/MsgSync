export class ApiError extends Error {
  status: number;
  code?: string;
  details?: Record<string, any>;

  constructor(message: string, status: number = 500, code?: string, details?: Record<string, any>) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.code = code;
    this.details = details;
  }
}

export function normalizeError(err: any): ApiError {
  if (err instanceof ApiError) return err;

  if (err.response) {
    const data = err.response.data;
    const status = err.response.status;

    if (data?.status === 'error' && data?.message) {
      return new ApiError(data.message, status, data.code, data);
    }

    return new ApiError(
      data?.message || `API Error: ${status}`,
      status,
      data?.code,
      data
    );
  }

  if (err.request) {
    return new ApiError('Network error: No response received from server', 0, 'NETWORK_ERROR');
  }

  return new ApiError(err.message || 'An unexpected error occurred', 500);
}

export function isAuthError(err: any): boolean {
  const normalized = normalizeError(err);
  return normalized.status === 401 || normalized.status === 403;
}

export function isValidationError(err: any): boolean {
  const normalized = normalizeError(err);
  return normalized.status === 400;
}

export function isRateLimitError(err: any): boolean {
  const normalized = normalizeError(err);
  return normalized.status === 429;
}
