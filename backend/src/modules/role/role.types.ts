export const SystemRoles = {
  SUPER_ADMIN: 'SUPER_ADMIN',
  ADMIN: 'ADMIN',
  LOTTERY_OPERATOR: 'LOTTERY_OPERATOR',
  FINANCE_OPERATOR: 'FINANCE_OPERATOR',
  SUPPORT: 'SUPPORT',
  USER: 'USER',
} as const;

export type SystemRole = (typeof SystemRoles)[keyof typeof SystemRoles];

export const SystemPermissions = {
  // User Management
  USER_READ: 'user:read',
  USER_UPDATE: 'user:update',
  USER_SUSPEND: 'user:suspend',

  // Lottery Management
  LOTTERY_CREATE: 'lottery:create',
  LOTTERY_READ: 'lottery:read',
  LOTTERY_UPDATE: 'lottery:update',
  LOTTERY_DELETE: 'lottery:delete',
  LOTTERY_DRAW: 'lottery:draw',

  // Ticket Management
  TICKET_READ: 'ticket:read',
  TICKET_CREATE: 'ticket:create',

  // Draw Management
  DRAW_READ: 'draw:read',
  DRAW_EXECUTE: 'draw:execute',

  // Payment Management
  PAYMENT_READ: 'payment:read',
  PAYMENT_APPROVE: 'payment:approve',

  // Withdrawal Management
  WITHDRAWAL_READ: 'withdrawal:read',
  WITHDRAWAL_APPROVE: 'withdrawal:approve',

  // Reporting and Auditing
  REPORT_READ: 'report:read',
  AUDIT_READ: 'audit:read',
} as const;

export type SystemPermission = (typeof SystemPermissions)[keyof typeof SystemPermissions];

export const DEFAULT_ROLE_PERMISSIONS: Record<SystemRole, SystemPermission[]> = {
  SUPER_ADMIN: Object.values(SystemPermissions),
  ADMIN: [
    SystemPermissions.USER_READ,
    SystemPermissions.USER_UPDATE,
    SystemPermissions.USER_SUSPEND,
    SystemPermissions.LOTTERY_CREATE,
    SystemPermissions.LOTTERY_READ,
    SystemPermissions.LOTTERY_UPDATE,
    SystemPermissions.LOTTERY_DELETE,
    SystemPermissions.LOTTERY_DRAW,
    SystemPermissions.TICKET_READ,
    SystemPermissions.DRAW_READ,
    SystemPermissions.DRAW_EXECUTE,
    SystemPermissions.PAYMENT_READ,
    SystemPermissions.PAYMENT_APPROVE,
    SystemPermissions.WITHDRAWAL_READ,
    SystemPermissions.WITHDRAWAL_APPROVE,
    SystemPermissions.REPORT_READ,
    SystemPermissions.AUDIT_READ,
  ],
  LOTTERY_OPERATOR: [
    SystemPermissions.LOTTERY_CREATE,
    SystemPermissions.LOTTERY_READ,
    SystemPermissions.LOTTERY_UPDATE,
    SystemPermissions.LOTTERY_DRAW,
    SystemPermissions.TICKET_READ,
    SystemPermissions.DRAW_READ,
    SystemPermissions.DRAW_EXECUTE,
    SystemPermissions.REPORT_READ,
  ],
  FINANCE_OPERATOR: [
    SystemPermissions.PAYMENT_READ,
    SystemPermissions.PAYMENT_APPROVE,
    SystemPermissions.WITHDRAWAL_READ,
    SystemPermissions.WITHDRAWAL_APPROVE,
    SystemPermissions.REPORT_READ,
    SystemPermissions.AUDIT_READ,
  ],
  SUPPORT: [
    SystemPermissions.USER_READ,
    SystemPermissions.TICKET_READ,
    SystemPermissions.LOTTERY_READ,
    SystemPermissions.DRAW_READ,
    SystemPermissions.PAYMENT_READ,
    SystemPermissions.WITHDRAWAL_READ,
  ],
  USER: [
    SystemPermissions.LOTTERY_READ,
    SystemPermissions.TICKET_READ,
    SystemPermissions.TICKET_CREATE,
    SystemPermissions.DRAW_READ,
  ],
};
