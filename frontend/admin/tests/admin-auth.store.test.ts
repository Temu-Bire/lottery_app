import { describe, it, expect, vi, beforeEach } from 'vitest';
import { useAdminAuthStore } from '../src/stores/admin-auth.store.js';
import { api, adminStorage } from '../src/api/client.js';

describe('Admin Auth Store & RBAC', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it('rejects regular USER role without admin privileges', async () => {
    vi.spyOn(api.auth, 'login').mockResolvedValue({
      user: {
        id: 'user-regular',
        email: 'user@lottery.com',
        status: 'ACTIVE' as const,
        roles: ['USER' as const],
        permissions: [],
      },
      tokens: {
        accessToken: 'tok-access',
        refreshToken: 'tok-refresh',
        expiresIn: '15m',
      },
    });

    const success = await useAdminAuthStore.getState().login({
      email: 'user@lottery.com',
      password: 'password',
    });

    expect(success).toBe(false);
    expect(useAdminAuthStore.getState().isAuthenticated).toBe(false);
    expect(useAdminAuthStore.getState().error).toContain('Access denied');
  });

  it('authenticates OPERATOR and assigns roles and permissions', async () => {
    vi.spyOn(api.auth, 'login').mockResolvedValue({
      user: {
        id: 'operator-1',
        email: 'operator@lottery.com',
        status: 'ACTIVE' as const,
        roles: ['OPERATOR' as const],
        permissions: ['draw:execute' as const, 'lottery:create' as const],
      },
      tokens: {
        accessToken: 'op-token',
        refreshToken: 'op-refresh',
        expiresIn: '15m',
      },
    });
    vi.spyOn(adminStorage, 'setTokens').mockReturnValue();

    const success = await useAdminAuthStore.getState().login({
      email: 'operator@lottery.com',
      password: 'Password123!',
    });

    expect(success).toBe(true);
    const state = useAdminAuthStore.getState();
    expect(state.isAuthenticated).toBe(true);
    expect(state.hasPermission('draw:execute')).toBe(true);
    expect(state.hasPermission('user:suspend')).toBe(false);
  });

  it('grants all permissions to ADMIN role', async () => {
    useAdminAuthStore.setState({
      isAuthenticated: true,
      user: {
        id: 'admin-root',
        email: 'superadmin@lottery.com',
        status: 'ACTIVE',
        roles: ['ADMIN'],
        permissions: [],
        emailVerified: true,
        phoneVerified: false,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
    });

    const state = useAdminAuthStore.getState();
    expect(state.hasPermission('user:suspend')).toBe(true);
    expect(state.hasPermission('lottery:delete')).toBe(true);
    expect(state.hasPermission('audit:read')).toBe(true);
  });
});
