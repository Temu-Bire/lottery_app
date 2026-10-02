import { describe, it, expect, vi, beforeEach } from 'vitest';
import { useAuthStore } from '../src/stores/auth.store.js';
import { api } from '../src/api/client.js';

describe('Telegram Mini App Auth Store', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it('authenticates with Telegram initData successfully', async () => {
    const mockAuthResponse = {
      user: {
        id: 'usr-123',
        email: 'telegram_998877@lottery.internal',
        firstName: 'John',
        lastName: 'Doe',
        status: 'ACTIVE' as const,
        roles: ['USER' as const],
        permissions: [],
      },
      tokens: {
        accessToken: 'access-123',
        refreshToken: 'refresh-123',
        expiresIn: '15m',
      },
    };

    vi.spyOn(api.auth, 'loginWithTelegram').mockResolvedValue(mockAuthResponse);
    vi.spyOn(api.client.getStorage(), 'setTokens').mockReturnValue();

    const success = await useAuthStore.getState().authenticateWithTelegram('mock_init_data_hash');

    expect(success).toBe(true);
    const state = useAuthStore.getState();
    expect(state.isAuthenticated).toBe(true);
    expect(state.user?.id).toBe('usr-123');
    expect(state.error).toBeNull();
  });

  it('handles Telegram authentication failure properly', async () => {
    vi.spyOn(api.auth, 'loginWithTelegram').mockRejectedValue(new Error('Invalid signature'));

    const success = await useAuthStore.getState().authenticateWithTelegram('bad_data');
    expect(success).toBe(false);
    const state = useAuthStore.getState();
    expect(state.isAuthenticated).toBe(false);
  });
});
