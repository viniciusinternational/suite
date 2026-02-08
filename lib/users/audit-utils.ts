import type { NextRequest } from 'next/server';
import { createAuditLog, getUserInfoFromHeaders } from '@/lib/audit-logger';

interface AuditLogOptions {
  request: NextRequest;
  existingUser: any;
  updatedUser: any;
  actionType?: 'UPDATE' | 'PERMISSION_CHANGED' | 'DELETE';
  description?: string;
}

export async function logUserChange({
  request,
  existingUser,
  updatedUser,
  actionType,
  description,
}: AuditLogOptions) {
  try {
    const headers = request.headers;
    const { userId, userSnapshot } = getUserInfoFromHeaders(headers);

    let finalActionType = actionType;
    if (!finalActionType) {
      const permissionsChanged =
        existingUser?.permissions !== undefined &&
        JSON.stringify(existingUser.permissions) !== JSON.stringify(updatedUser?.permissions);
      finalActionType = permissionsChanged ? 'PERMISSION_CHANGED' : 'UPDATE';
    }

    const finalDescription =
      description ??
      (finalActionType === 'PERMISSION_CHANGED'
        ? `Changed permissions for user "${updatedUser?.fullName ?? ''}"`
        : `Updated user "${updatedUser?.fullName ?? ''}"`);

    await createAuditLog({
      userId: userId || 'system',
      userSnapshot,
      actionType: finalActionType,
      entityType: 'User',
      entityId: existingUser?.id ?? updatedUser?.id ?? 'unknown',
      description: finalDescription,
      previousData: existingUser as any,
      newData: updatedUser as any,
      ipAddress: request.ip ?? headers.get('x-forwarded-for') ?? undefined,
      userAgent: headers.get('user-agent') ?? undefined,
    });
  } catch (error) {
    console.error('Audit log failed (update user):', error);
  }
}
