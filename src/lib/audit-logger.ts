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
 */
export async function createAuditLog(params: CreateAuditLogParams): Promise<AuditLog> {
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

