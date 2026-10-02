import { create } from 'zustand';
import {
  User,
  LoginRequest,
  RegisterRequest,
  ForgotPasswordRequest,
  ResetPasswordRequest,
  VerifyEmailRequest,
  ApiError,
} from '@lottery/shared';
import { api, mobileStorage } from '../api/client.js';

interface MobileAuthState {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;

  login: (credentials: LoginRequest) => Promise<boolean>;
  register: (data: RegisterRequest) => Promise<boolean>;
  forgotPassword: (data: ForgotPasswordRequest) => Promise<boolean>;
  resetPassword: (data: ResetPasswordRequest) => Promise<boolean>;
  verifyEmail: (data: VerifyEmailRequest) => Promise<boolean>;
  fetchCurrentUser: () => Promise<void>;
  init: () => Promise<void>;
  logout: () => Promise<void>;
  clearError: () => void;
}

export const useMobileAuthStore = create<MobileAuthState>((set) => ({
  user: null,
  isAuthenticated: false,
  isLoading: false,
  error: null,

  login: async (credentials: LoginRequest) => {
    set({ isLoading: true, error: null });
    try {
      const response = await api.auth.login(credentials);
      const { user, tokens } = response;

      await mobileStorage.setTokens(tokens.accessToken, tokens.refreshToken);

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
      const message = err instanceof ApiError ? err.message : 'Invalid email or password';
      set({
        isAuthenticated: false,
        isLoading: false,
        error: message,
      });
      return false;
    }
  },

  register: async (data: RegisterRequest) => {
    set({ isLoading: true, error: null });
    try {
      await api.auth.register(data);
      set({ isLoading: false, error: null });
      return true;
    } catch (err: unknown) {
      const message = err instanceof ApiError ? err.message : 'Registration failed';
      set({ isLoading: false, error: message });
      return false;
    }
  },

  forgotPassword: async (data: ForgotPasswordRequest) => {
    set({ isLoading: true, error: null });
    try {
      await api.auth.forgotPassword(data);
      set({ isLoading: false, error: null });
      return true;
    } catch (err: unknown) {
      const message = err instanceof ApiError ? err.message : 'Failed to send reset link';
      set({ isLoading: false, error: message });
      return false;
    }
  },

  resetPassword: async (data: ResetPasswordRequest) => {
    set({ isLoading: true, error: null });
    try {
      await api.auth.resetPassword(data);
      set({ isLoading: false, error: null });
      return true;
    } catch (err: unknown) {
      const message = err instanceof ApiError ? err.message : 'Failed to reset password';
      set({ isLoading: false, error: message });
      return false;
    }
  },

  verifyEmail: async (data: VerifyEmailRequest) => {
    set({ isLoading: true, error: null });
    try {
      await api.auth.verifyEmail(data);
      set({ isLoading: false, error: null });
      return true;
    } catch (err: unknown) {
      const message = err instanceof ApiError ? err.message : 'Verification failed';
      set({ isLoading: false, error: message });
      return false;
    }
  },

  fetchCurrentUser: async () => {
    const accessToken = await mobileStorage.getAccessToken();
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
      await mobileStorage.clearTokens();
      set({
        user: null,
        isAuthenticated: false,
        isLoading: false,
      });
    }
  },

  init: async () => {
    const accessToken = await mobileStorage.getAccessToken();
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
      await mobileStorage.clearTokens();
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
      const refreshToken = await mobileStorage.getRefreshToken();
      if (refreshToken) {
        await api.auth.logout(refreshToken);
      }
    } catch {
      // Ignore backend logout network errors
    } finally {
      await mobileStorage.clearTokens();
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
