import { describe, it, expect, vi, beforeEach } from 'vitest';
import { useMobileAuthStore } from '../src/stores/mobile-auth.store.js';
import { api, mobileStorage } from '../src/api/client.js';
import { ApiError } from '@lottery/shared';

describe('Mobile Auth Store & Storage', () => {
  beforeEach(async () => {
    vi.restoreAllMocks();
    await mobileStorage.clearTokens();
    useMobileAuthStore.setState({
      user: null,
      isAuthenticated: false,
      isLoading: false,
      error: null,
    });
  });

  it('authenticates user and securely stores access and refresh tokens', async () => {
    vi.spyOn(api.auth, 'login').mockResolvedValue({
      user: {
        id: 'usr-mob-1',
        email: 'mobile.player@example.com',
        firstName: 'Mobile',
        lastName: 'Player',
        status: 'ACTIVE' as const,
        roles: ['USER' as const],
        permissions: [],
      },
      tokens: {
        accessToken: 'access-jwt-token-123',
        refreshToken: 'refresh-jwt-token-456',
        expiresIn: '15m',
      },
    });

    const success = await useMobileAuthStore.getState().login({
      email: 'mobile.player@example.com',
      password: 'Password123!',
    });

    expect(success).toBe(true);
    const state = useMobileAuthStore.getState();
    expect(state.isAuthenticated).toBe(true);
    expect(state.user?.email).toBe('mobile.player@example.com');
    expect(state.error).toBeNull();

    // Verify token storage
    const storedAccess = await mobileStorage.getAccessToken();
    const storedRefresh = await mobileStorage.getRefreshToken();
    expect(storedAccess).toBe('access-jwt-token-123');
    expect(storedRefresh).toBe('refresh-jwt-token-456');
  });

  it('handles login failure and preserves error state', async () => {
    vi.spyOn(api.auth, 'login').mockRejectedValue(
      new ApiError({
        status: 401,
        code: 'INVALID_CREDENTIALS',
        message: 'Invalid email or password',
      }),
    );

    const success = await useMobileAuthStore.getState().login({
      email: 'wrong@example.com',
      password: 'bad-password',
    });

    expect(success).toBe(false);
    const state = useMobileAuthStore.getState();
    expect(state.isAuthenticated).toBe(false);
    expect(state.user).toBeNull();
    expect(state.error).toBe('Invalid email or password');
  });

  it('registers new account and sets loading state appropriately', async () => {
    vi.spyOn(api.auth, 'register').mockResolvedValue({
      id: 'usr-new-1',
      email: 'newplayer@example.com',
      status: 'ACTIVE' as const,
      roles: ['USER' as const],
      permissions: [],
    });

    const success = await useMobileAuthStore.getState().register({
      email: 'newplayer@example.com',
      password: 'StrongPassword123!',
      firstName: 'New',
    });

    expect(success).toBe(true);
    expect(useMobileAuthStore.getState().isLoading).toBe(false);
  });

  it('clears session and tokens on logout', async () => {
    await mobileStorage.setTokens('acc-tok', 'ref-tok');
    useMobileAuthStore.setState({
      isAuthenticated: true,
      user: {
        id: 'usr-1',
        email: 'test@lottery.com',
        status: 'ACTIVE',
        roles: ['USER'],
        permissions: [],
        emailVerified: true,
        phoneVerified: false,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
    });

    vi.spyOn(api.auth, 'logout').mockResolvedValue(undefined);

    await useMobileAuthStore.getState().logout();

    expect(useMobileAuthStore.getState().isAuthenticated).toBe(false);
    expect(useMobileAuthStore.getState().user).toBeNull();
    expect(await mobileStorage.getAccessToken()).toBeNull();
    expect(await mobileStorage.getRefreshToken()).toBeNull();
  });

  it('restores user session on init if token exists', async () => {
    await mobileStorage.setTokens('existing-access-token', 'existing-refresh-token');

    vi.spyOn(api.user, 'getMe').mockResolvedValue({
      id: 'usr-restored',
      email: 'restored@lottery.com',
      status: 'ACTIVE',
      roles: ['USER'],
      permissions: [],
      emailVerified: true,
      phoneVerified: false,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    });

    await useMobileAuthStore.getState().init();

    const state = useMobileAuthStore.getState();
    expect(state.isAuthenticated).toBe(true);
    expect(state.user?.email).toBe('restored@lottery.com');
  });
});
