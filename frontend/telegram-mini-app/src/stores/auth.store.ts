import { create } from 'zustand';
import { User, ApiError } from '@lottery/shared';
import { api } from '../api/client.js';
import { TelegramWebUser } from '../types/telegram.js';

interface AuthState {
  user: User | null;
  telegramUser: TelegramWebUser | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;

  setTelegramUser: (tgUser: TelegramWebUser | null) => void;
  authenticateWithTelegram: (initData: string) => Promise<boolean>;
  fetchCurrentUser: () => Promise<void>;
  logout: () => Promise<void>;
  clearError: () => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  telegramUser: null,
  isAuthenticated: false,
  isLoading: false,
  error: null,

  setTelegramUser: (telegramUser) => set({ telegramUser }),

  authenticateWithTelegram: async (initData: string) => {
    if (!initData) {
      set({ error: 'No Telegram authentication payload provided', isLoading: false });
      return false;
    }

    set({ isLoading: true, error: null });

    try {
      const response = await api.auth.loginWithTelegram({ initData });
      const { user, tokens } = response;

      await api.client.getStorage().setTokens(tokens.accessToken, tokens.refreshToken);

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
      const message = err instanceof ApiError ? err.message : 'Telegram authentication failed';
      set({
        isAuthenticated: false,
        isLoading: false,
        error: message,
      });
      return false;
    }
  },

  fetchCurrentUser: async () => {
    const accessToken = await api.client.getStorage().getAccessToken();
    if (!accessToken) {
      set({ isAuthenticated: false, user: null });
      return;
    }

    set({ isLoading: true });
    try {
      const user = await api.user.getMe();
      set({
        user,
        isAuthenticated: true,
        isLoading: false,
        error: null,
      });
    } catch {
      await api.client.getStorage().clearTokens();
      set({
        user: null,
        isAuthenticated: false,
        isLoading: false,
      });
    }
  },

  logout: async () => {
    set({ isLoading: true });
    try {
      const refreshToken = await api.client.getStorage().getRefreshToken();
      await api.auth.logout(refreshToken || undefined);
    } catch {
      await api.client.getStorage().clearTokens();
    } finally {
      set({
        user: null,
        isAuthenticated: false,
        isLoading: false,
        error: null,
      });
    }
  },

  clearError: () => set({ error: null }),
}));
