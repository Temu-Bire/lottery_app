export type UserStatus = 'ACTIVE' | 'SUSPENDED' | 'BLOCKED' | 'PENDING_VERIFICATION';

export type SystemRole = 'ADMIN' | 'OPERATOR' | 'AUDITOR' | 'USER';

export type SystemPermission =
  | 'user:read'
  | 'user:update'
  | 'user:suspend'
  | 'lottery:create'
  | 'lottery:update'
  | 'lottery:delete'
  | 'draw:execute'
  | 'ticket:read'
  | 'payment:read'
  | 'payment:refund'
  | 'withdrawal:read'
  | 'withdrawal:approve'
  | 'audit:read'
  | 'report:read';

export interface User {
  id: string;
  email: string;
  phone?: string | null;
  status: UserStatus;
  emailVerified: boolean;
  phoneVerified: boolean;
  firstName?: string | null;
  lastName?: string | null;
  createdAt: string;
  updatedAt: string;
  roles?: SystemRole[];
  permissions?: SystemPermission[];
}

export interface TokenPair {
  accessToken: string;
  refreshToken: string;
  expiresIn: string;
}

export interface AuthSuccessResponse {
  user: {
    id: string;
    email: string;
    firstName?: string | null;
    lastName?: string | null;
    status: UserStatus;
    roles: SystemRole[];
    permissions: SystemPermission[];
  };
  tokens: TokenPair;
}

export interface RegisterRequest {
  email: string;
  password: string;
  firstName?: string;
  lastName?: string;
  phone?: string;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface TelegramAuthRequest {
  initData: string;
}

export interface RefreshTokenRequest {
  refreshToken: string;
}

export interface ForgotPasswordRequest {
  email: string;
}

export interface ResetPasswordRequest {
  token: string;
  newPassword: string;
}

export interface VerifyEmailRequest {
  token: string;
}

export interface UpdateMeRequest {
  firstName?: string;
  lastName?: string;
  phone?: string;
}
