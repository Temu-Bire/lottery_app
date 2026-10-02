import { ApiClient } from '../client.js';
import {
  AuthSuccessResponse,
  LoginRequest,
  RegisterRequest,
  TelegramAuthRequest,
  ForgotPasswordRequest,
  ResetPasswordRequest,
  VerifyEmailRequest,
} from '../../types/auth.js';

export const createAuthApi = (client: ApiClient) => ({
  register: (data: RegisterRequest) =>
    client.post<{ user: { id: string; email: string }; verificationToken?: string }>(
      '/auth/register',
      data,
      { requiresAuth: false },
    ),

  login: (data: LoginRequest) =>
    client.post<AuthSuccessResponse>('/auth/login', data, { requiresAuth: false }),

  loginWithTelegram: (data: TelegramAuthRequest) =>
    client.post<AuthSuccessResponse>('/auth/telegram', data, { requiresAuth: false }),

  refreshToken: (refreshToken: string) =>
    client.post<AuthSuccessResponse>('/auth/refresh', { refreshToken }, { requiresAuth: false }),

  logout: async (refreshToken?: string) => {
    try {
      await client.post('/auth/logout', { refreshToken }, { requiresAuth: true });
    } finally {
      await client.getStorage().clearTokens();
    }
  },

  verifyEmail: (data: VerifyEmailRequest) =>
    client.post<{ success: boolean; message: string }>('/auth/verify-email', data, { requiresAuth: false }),

  resendVerification: (email: string) =>
    client.post<{ success: boolean; message: string }>(
      '/auth/resend-verification',
      { email },
      { requiresAuth: false },
    ),

  forgotPassword: (data: ForgotPasswordRequest) =>
    client.post<{ success: boolean; message: string }>('/auth/forgot-password', data, { requiresAuth: false }),

  resetPassword: (data: ResetPasswordRequest) =>
    client.post<{ success: boolean; message: string }>('/auth/reset-password', data, { requiresAuth: false }),
});

export type AuthApi = ReturnType<typeof createAuthApi>;
