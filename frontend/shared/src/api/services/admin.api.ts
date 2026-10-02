import { ApiClient } from '../client.js';
import { SystemReport, AuditLog, AuditLogQuery } from '../../types/admin.js';
import { PaginatedResult } from '../../types/api.js';

export const createAdminApi = (client: ApiClient) => ({
  getReports: (): Promise<SystemReport> =>
    client.get<SystemReport>('/admin/reports'),

  getAuditLogs: (query?: AuditLogQuery): Promise<PaginatedResult<AuditLog>> =>
    client.getPaginated<AuditLog>('/admin/audit-logs', query as Record<string, unknown>),
});

export type AdminApi = ReturnType<typeof createAdminApi>;
