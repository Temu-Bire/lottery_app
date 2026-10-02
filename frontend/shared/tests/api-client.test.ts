import { describe, it, expect, vi, beforeEach } from 'vitest';
import { ApiClient } from '../src/api/client.js';
import { MemoryTokenStorage } from '../src/api/storage.js';
import { ApiError } from '../src/api/errors.js';

describe('ApiClient & Error Handling', () => {
  let storage: MemoryTokenStorage;
  let client: ApiClient;

  beforeEach(() => {
    storage = new MemoryTokenStorage();
    client = new ApiClient({
      baseUrl: 'http://localhost:3000/api/v1',
      storage,
    });
    vi.restoreAllMocks();
  });

  it('injects Bearer token in authenticated requests', async () => {
    storage.setTokens('mock-access-token', 'mock-refresh-token');

    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      headers: new Headers({ 'content-type': 'application/json' }),
      json: async () => ({ success: true, data: { id: 'user-1' } }),
    });
    global.fetch = fetchMock;

    const data = await client.get<{ id: string }>('/users/me');
    expect(data).toEqual({ id: 'user-1' });
    expect(fetchMock).toHaveBeenCalledTimes(1);

    const callArgs = fetchMock.mock.calls[0];
    expect(callArgs[0]).toBe('http://localhost:3000/api/v1/users/me');
    expect(callArgs[1].headers['Authorization']).toBe('Bearer mock-access-token');
  });

  it('normalizes 422 validation errors with field details', async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: false,
      status: 422,
      headers: new Headers({ 'content-type': 'application/json' }),
      json: async () => ({
        success: false,
        code: 'VALIDATION_ERROR',
        message: 'Request validation failed',
        details: [{ field: 'email', message: 'Invalid email address' }],
      }),
    });
    global.fetch = fetchMock;

    await expect(client.post('/auth/login', { email: 'bad' }, { requiresAuth: false })).rejects.toThrow(ApiError);

    try {
      await client.post('/auth/login', { email: 'bad' }, { requiresAuth: false });
    } catch (err: any) {
      expect(err.status).toBe(422);
      expect(err.code).toBe('VALIDATION_ERROR');
      expect(err.details).toEqual([{ field: 'email', message: 'Invalid email address' }]);
    }
  });

  it('handles 401 token refresh queue and retries original request', async () => {
    storage.setTokens('expired-access-token', 'valid-refresh-token');

    let requestAttempt = 0;
    const fetchMock = vi.fn().mockImplementation((url: string) => {
      if (url.includes('/users/me')) {
        requestAttempt++;
        if (requestAttempt === 1) {
          return Promise.resolve({
            ok: false,
            status: 401,
            headers: new Headers({ 'content-type': 'application/json' }),
            json: async () => ({ success: false, code: 'TOKEN_EXPIRED', message: 'Token expired' }),
          });
        }
        return Promise.resolve({
          ok: true,
          status: 200,
          headers: new Headers({ 'content-type': 'application/json' }),
          json: async () => ({ success: true, data: { id: 'recovered-user' } }),
        });
      }

      if (url.includes('/auth/refresh')) {
        return Promise.resolve({
          ok: true,
          status: 200,
          headers: new Headers({ 'content-type': 'application/json' }),
          json: async () => ({
            success: true,
            data: {
              tokens: {
                accessToken: 'fresh-access-token',
                refreshToken: 'fresh-refresh-token',
                expiresIn: '15m',
              },
            },
          }),
        });
      }

      return Promise.reject(new Error('Unknown URL'));
    });

    global.fetch = fetchMock;

    const result = await client.get<{ id: string }>('/users/me');
    expect(result).toEqual({ id: 'recovered-user' });
    expect(requestAttempt).toBe(2);
    expect(storage.getAccessToken()).toBe('fresh-access-token');
  });
});
