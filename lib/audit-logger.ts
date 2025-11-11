import { prisma } from './prisma';
import type { AuditActionType, AuditEntityType, AuditLog, User } from '@/types';

interface CreateAuditLogParams {
  userId: string;
  userSnapshot: {
    id: string;
    fullName: string;
    email: string;
    role: string;
    departmentId?: string;
  };
  actionType: AuditActionType;
  entityType: AuditEntityType;
  entityId?: string;
  description: string;
  isSuccessful?: boolean;
  previousData?: Record<string, any> | null;
  newData?: Record<string, any> | null;
  ipAddress?: string;
  userAgent?: string;
}

/**
 * Create an audit log entry
 * This function will not throw errors to avoid breaking the main operation
 */
export async function createAuditLog(params: CreateAuditLogParams): Promise<AuditLog | null> {
  try {
    const auditLog = await prisma.auditLog.create({
      data: {
        userId: params.userId,
        userSnapshot: params.userSnapshot,
        actionType: params.actionType,
        entityType: params.entityType,
        entityId: params.entityId,
        description: params.description,
        isSuccessful: params.isSuccessful ?? true,
        previousData: params.previousData ?? null,
        newData: params.newData ?? null,
        ipAddress: params.ipAddress,
        userAgent: params.userAgent,
      },
    });

    return auditLog as AuditLog;
  } catch (error) {
    // Log error with context but don't throw
    console.error('Failed to create audit log:', {
      actionType: params.actionType,
      entityType: params.entityType,
      entityId: params.entityId,
      userId: params.userId,
      description: params.description,
      error: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined,
    });
    return null;
  }
}

/**
 * Get audit logs with optional filters
 */
export async function getAuditLogs(filters?: {
  userId?: string;
  entityType?: AuditEntityType;
  entityId?: string;
  actionType?: AuditActionType;
  startDate?: Date;
  endDate?: Date;
  limit?: number;
  offset?: number;
}) {
  const where: any = {};

  if (filters?.userId) where.userId = filters.userId;
  if (filters?.entityType) where.entityType = filters.entityType;
  if (filters?.entityId) where.entityId = filters.entityId;
  if (filters?.actionType) where.actionType = filters.actionType;
  
  if (filters?.startDate || filters?.endDate) {
    where.createdAt = {};
    if (filters.startDate) where.createdAt.gte = filters.startDate;
    if (filters.endDate) where.createdAt.lte = filters.endDate;
  }

  const [data, total] = await Promise.all([
    prisma.auditLog.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      take: filters?.limit ?? 100,
      skip: filters?.offset ?? 0,
      include: {
        user: {
          select: {
            id: true,
            fullName: true,
            email: true,
            role: true,
          },
        },
      },
    }),
    prisma.auditLog.count({ where }),
  ]);

  return { data, total };
}

/**
 * Get audit history for a specific user
 */
export async function getUserAuditHistory(userId: string, limit = 50) {
  const data = await prisma.auditLog.findMany({
    where: { userId },
    orderBy: { createdAt: 'desc' },
    take: limit,
  });

  return data as AuditLog[];
}

/**
 * Get audit history for a specific entity
 */
export async function getEntityAuditHistory(
  entityType: AuditEntityType,
  entityId: string,
  limit = 50
) {
  const data = await prisma.auditLog.findMany({
    where: {
      entityType,
      entityId,
    },
    orderBy: { createdAt: 'desc' },
    take: limit,
  });

  return data as AuditLog[];
}

/**
 * Helper function to create user snapshot from User object
 */
export function createUserSnapshot(user: User): {
  id: string;
  fullName: string;
  email: string;
  role: string;
  departmentId?: string;
} {
  return {
    id: user.id,
    fullName: user.fullName,
    email: user.email,
    role: user.role,
    departmentId: user.departmentId,
  };
}

/**
 * Helper function to extract user info from request headers
 */
export function getUserInfoFromHeaders(headers: Headers): {
  userId: string;
  userSnapshot: {
    id: string;
    fullName: string;
    email: string;
    role: string;
    departmentId?: string;
  };
} {
  const userId = headers.get('x-user-id') || 'system';
  const userSnapshot = {
    id: userId,
    fullName: headers.get('x-user-fullname') || 'Unknown',
    email: headers.get('x-user-email') || 'unknown@example.com',
    role: headers.get('x-user-role') || 'unknown',
    departmentId: headers.get('x-user-department-id') || undefined,
  };

  return { userId, userSnapshot };
}

