import { prisma } from '../config/database.js';
import { logger } from './logger.js';
import { type AuditAction } from '@prisma/client';

export interface AuditLogParams {
  userId?: string | null;
  actor: string;
  action: AuditAction;
  resource: string;
  resourceId?: string | null;
  ipAddress?: string | null;
  userAgent?: string | null;
  metadata?: Record<string, unknown> | null;
}

export const recordAuditLog = async (params: AuditLogParams): Promise<void> => {
  try {
    // Sanitize metadata to never persist sensitive credentials
    const safeMetadata = params.metadata ? { ...params.metadata } : {};
    delete safeMetadata.password;
    delete safeMetadata.passwordHash;
    delete safeMetadata.token;
    delete safeMetadata.refreshToken;
    delete safeMetadata.secret;

    await prisma.auditLog.create({
      data: {
        userId: params.userId || undefined,
        actor: params.actor,
        action: params.action,
        resource: params.resource,
        resourceId: params.resourceId || undefined,
        ipAddress: params.ipAddress || undefined,
        userAgent: params.userAgent || undefined,
        metadata: Object.keys(safeMetadata).length > 0 ? (safeMetadata as object) : undefined,
      },
    });
  } catch (error) {
    logger.error({ error, params }, 'Failed to record audit log');
  }
};
