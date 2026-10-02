import { PaginationQuery } from './api.js';

export type NotificationChannel = 'TELEGRAM' | 'EMAIL' | 'PUSH';

export type NotificationEvent =
  | 'TICKET_PURCHASED'
  | 'DRAW_REMINDER'
  | 'DRAW_COMPLETED'
  | 'WINNER'
  | 'PAYMENT_COMPLETED'
  | 'WITHDRAWAL_COMPLETED'
  | 'SECURITY_ALERT';

export interface Notification {
  id: string;
  userId: string;
  channel: NotificationChannel;
  event: NotificationEvent;
  title: string;
  message: string;
  metadata?: Record<string, unknown> | null;
  isRead: boolean;
  sentAt?: string | null;
  createdAt: string;
}

export type NotificationListQuery = PaginationQuery;
