import { create } from 'zustand';
import { User, SystemPermission, SystemRole, ApiError, LoginRequest } from '@lottery/shared';
import { api, adminStorage } from '../api/client.js';

interface AdminAuthState {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;

  login: (credentials: LoginRequest) => Promise<boolean>;
  logout: () => Promise<void>;
  fetchCurrentUser: () => Promise<void>;
  hasPermission: (permission: SystemPermission) => boolean;
  hasRole: (role: SystemRole) => boolean;
  clearError: () => void;
}

export const useAdminAuthStore = create<AdminAuthState>((set, get) => ({
  user: null,
  isAuthenticated: false,
  isLoading: false,
  error: null,

  login: async (credentials: LoginRequest) => {
    set({ isLoading: true, error: null });

    try {
      const response = await api.auth.login(credentials);
      const { user, tokens } = response;

      // Ensure user has administrative or operator role
      const roles = user.roles || [];
      const hasPrivilegedRole = roles.some((r) =>
        ['ADMIN', 'OPERATOR', 'AUDITOR'].includes(r),
      );

      if (!hasPrivilegedRole) {
        throw new Error('Access denied. Administrator privileges required.');
      }

      await adminStorage.setTokens(tokens.accessToken, tokens.refreshToken);

      set({
        user: {
          ...user,
          phoneVerified: false,
          emailVerified: true,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        } as User,
        isAuthenticated: true,
        isLoading: false,
        error: null,
      });

      return true;
    } catch (err: unknown) {
      const message = err instanceof ApiError ? err.message : (err as Error).message || 'Authentication failed';
      set({
        isAuthenticated: false,
        isLoading: false,
        error: message,
      });
      return false;
    }
  },

  logout: async () => {
    set({ isLoading: true });
    try {
      const refreshToken = await adminStorage.getRefreshToken();
      await api.auth.logout(refreshToken || undefined);
    } catch {
      await adminStorage.clearTokens();
    } finally {
      set({
        user: null,
        isAuthenticated: false,
        isLoading: false,
        error: null,
      });
    }
  },

  fetchCurrentUser: async () => {
    const accessToken = await adminStorage.getAccessToken();
    if (!accessToken) {
      set({ isAuthenticated: false, user: null });
      return;
    }

    set({ isLoading: true });
    try {
      const user = await api.user.getMe();
      const roles = user.roles || [];
      const hasPrivilegedRole = roles.some((r) =>
        ['ADMIN', 'OPERATOR', 'AUDITOR'].includes(r),
      );

      if (!hasPrivilegedRole) {
        await adminStorage.clearTokens();
        set({ isAuthenticated: false, user: null, isLoading: false });
        return;
      }

      set({
        user,
        isAuthenticated: true,
        isLoading: false,
        error: null,
      });
    } catch {
      await adminStorage.clearTokens();
      set({
        user: null,
        isAuthenticated: false,
        isLoading: false,
      });
    }
  },

  hasPermission: (permission: SystemPermission) => {
    const { user } = get();
    if (!user) return false;
    if (user.roles?.includes('ADMIN')) return true; // Admins have all permissions
    return user.permissions?.includes(permission) || false;
  },

  hasRole: (role: SystemRole) => {
    const { user } = get();
    if (!user) return false;
    return user.roles?.includes(role) || false;
  },

  clearError: () => set({ error: null }),
}));
