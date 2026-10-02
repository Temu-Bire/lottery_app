import { PaginationQuery } from './api.js';
import { UserStatus } from './auth.js';

export type AuditAction =
  | 'REGISTER'
  | 'LOGIN'
  | 'LOGOUT'
  | 'LOGIN_FAILED'
  | 'PASSWORD_RESET'
  | 'EMAIL_VERIFIED'
  | 'ROLE_CHANGED'
  | 'USER_SUSPENDED'
  | 'LOTTERY_CREATED'
  | 'LOTTERY_UPDATED'
  | 'LOTTERY_OPENED'
  | 'LOTTERY_CLOSED'
  | 'DRAW_STARTED'
  | 'DRAW_COMPLETED'
  | 'TICKET_PURCHASED'
  | 'PAYMENT_CREATED'
  | 'PAYMENT_COMPLETED'
  | 'PAYMENT_FAILED'
  | 'WITHDRAWAL_CREATED'
  | 'WITHDRAWAL_APPROVED'
  | 'WITHDRAWAL_REJECTED'
  | 'SECURITY_EVENT';

export interface AuditLog {
  id: string;
  userId?: string | null;
  actor: string;
  action: AuditAction;
  resource: string;
  resourceId?: string | null;
  ipAddress?: string | null;
  userAgent?: string | null;
  metadata?: Record<string, unknown> | null;
  createdAt: string;
  user?: {
    id: string;
    email: string;
    firstName?: string | null;
    lastName?: string | null;
  } | null;
}

export interface SystemReport {
  users: {
    total: number;
    active: number;
    suspended: number;
  };
  lotteries: {
    total: number;
    byStatus: Record<string, number>;
  };
  tickets: {
    totalSold: number;
    grossSalesVolume: number | string;
  };
  prizes: {
    totalWinners: number;
    totalPrizesAwarded: number | string;
  };
  finances: {
    grossDeposits: number | string;
    grossWithdrawals: number | string;
    netRevenue: number | string;
  };
}

export interface UserAdminListQuery extends PaginationQuery {
  status?: UserStatus;
  role?: string;
  search?: string;
}

export interface UpdateUserStatusRequest {
  status: UserStatus;
  reason?: string;
}

export interface AuditLogQuery extends PaginationQuery {
  userId?: string;
  action?: AuditAction;
  resource?: string;
}
