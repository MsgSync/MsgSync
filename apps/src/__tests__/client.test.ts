import { describe, it, expect, beforeEach, vi } from 'vitest';
import { ApiClient } from '../lib/api/client';
import { ApiError } from '../lib/api/errors';

describe('ApiClient', () => {
  let client: ApiClient;

  beforeEach(() => {
    try { localStorage.clear(); } catch {}
    client = new ApiClient('http://localhost:3001/api');
    vi.clearAllMocks();
  });

  describe('getHeaders', () => {
    it('should include Content-Type header', () => {
      const headers = (client as any).getHeaders();
      expect(headers['Content-Type']).toBe('application/json');
    });

    it('should include Authorization header when token is set', () => {
      client.setToken('test-token');
      const headers = (client as any).getHeaders();
      expect(headers['Authorization']).toBe('Bearer test-token');
    });

    it('should not include Authorization header when no token', () => {
      const headers = (client as any).getHeaders();
      expect(headers['Authorization']).toBeUndefined();
    });
  });

  describe('setToken / getToken', () => {
    it('should store and retrieve token', () => {
      client.setToken('my-token');
      expect(client.getToken()).toBe('my-token');
    });

    it('should clear token on null', () => {
      client.setToken('my-token');
      client.setToken(null);
      expect(client.getToken()).toBeNull();
    });
  });

  describe('get', () => {
    it('should construct correct URL', async () => {
      const mockFetch = vi.fn().mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({ data: [] }),
      });
      global.fetch = mockFetch;

      await client.get('/api/messages', { limit: 10 });
      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining('/api/messages'),
        expect.any(Object)
      );
    });
  });

  describe('post', () => {
    it('should send JSON body', async () => {
      const mockFetch = vi.fn().mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({ status: 'success' }),
      });
      global.fetch = mockFetch;

      await client.post('/api/messages', { recipient: '+123456' });
      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining('/api/messages'),
        expect.objectContaining({
          method: 'POST',
        })
      );
    });
  });

  describe('getDashboardStats', () => {
    it('should call correct endpoint', async () => {
      const mockFetch = vi.fn().mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({ data: {} }),
      });
      global.fetch = mockFetch;

      await client.getDashboardStats();
      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining('/api/analytics/stats'),
        expect.any(Object)
      );
    });
  });

  describe('getCurrentUser', () => {
    it('should call /api/auth/me', async () => {
      const mockFetch = vi.fn().mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({ data: { id: '1', email: 'test@test.com' } }),
      });
      global.fetch = mockFetch;

      await client.getCurrentUser();
      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining('/api/auth/me'),
        expect.any(Object)
      );
    });
  });
});
