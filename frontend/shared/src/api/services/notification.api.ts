import { ApiClient } from '../client.js';
import { Notification, NotificationListQuery } from '../../types/notification.js';
import { PaginatedResult } from '../../types/api.js';

export const createNotificationApi = (client: ApiClient) => ({
  list: (query?: NotificationListQuery): Promise<PaginatedResult<Notification>> =>
    client.getPaginated<Notification>('/notifications', query as Record<string, unknown>),

  markAsRead: (id: string): Promise<Notification> =>
    client.patch<Notification>(`/notifications/${id}/read`),

  markAllAsRead: (): Promise<{ success: boolean; count: number }> =>
    client.post<{ success: boolean; count: number }>('/notifications/read-all'),
});

export type NotificationApi = ReturnType<typeof createNotificationApi>;
