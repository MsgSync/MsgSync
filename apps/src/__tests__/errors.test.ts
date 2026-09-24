import { describe, it, expect, beforeEach, vi } from 'vitest';
import { normalizeError, ApiError as ApiErrorClass } from '../lib/api/errors';

describe('Error handling', () => {
  it('should create ApiError from HTTP response', () => {
    const error = new ApiErrorClass('Not Found', 404, 'NOT_FOUND');
    expect(error.message).toBe('Not Found');
    expect(error.status).toBe(404);
    expect(error.code).toBe('NOT_FOUND');
  });

  it('should normalize network errors', () => {
    const error = new Error('Network error');
    const normalized = normalizeError(error);
    expect(normalized.message).toBe('Network error');
  });

  it('should normalize TypeError as network error', () => {
    const error = new TypeError('Failed to fetch');
    const normalized = normalizeError(error);
    expect(normalized.message).toBe('Failed to fetch');
  });
});
