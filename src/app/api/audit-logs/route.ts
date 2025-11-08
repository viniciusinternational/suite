import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import type { AuditActionType, AuditEntityType } from '@/types';

export async function GET(request: NextRequest) {
  try {
    // Optional permission check - client-side guard already handles this
    // This provides defense-in-depth
    const headers = request.headers;
    const userIdFromHeader = headers.get('x-user-id');
    
    if (userIdFromHeader) {
      const user = await prisma.user.findUnique({
        where: { id: userIdFromHeader },
        select: { permissions: true, isActive: true },
      });

      // Check if user exists and is active
      if (!user || !user.isActive) {
        return NextResponse.json(
          {
            ok: false,
            error: 'Unauthorized',
          },
          { status: 401 }
        );
      }

      // Check if user has view_audit_logs permission
      const permissions = user.permissions as Record<string, boolean> | null;
      if (permissions && !permissions.view_audit_logs) {
        return NextResponse.json(
          {
            ok: false,
            error: 'Forbidden: Missing view_audit_logs permission',
          },
          { status: 403 }
        );
      }
    }

    const { searchParams } = new URL(request.url);
    
    // Extract query parameters
    const userId = searchParams.get('userId');
    const entityType = searchParams.get('entityType') as AuditEntityType | null;
    const actionType = searchParams.get('actionType') as AuditActionType | null;
    const entityId = searchParams.get('entityId');
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');
    const search = searchParams.get('search');
    const isSuccessful = searchParams.get('isSuccessful');
    const limit = parseInt(searchParams.get('limit') || '50');
    const offset = parseInt(searchParams.get('offset') || '0');

    // Build where clause
    const where: any = {};

    if (userId) where.userId = userId;
    if (entityType) where.entityType = entityType;
    if (actionType) where.actionType = actionType;
    if (entityId) where.entityId = entityId;

    if (isSuccessful !== null && isSuccessful !== undefined) {
      where.isSuccessful = isSuccessful === 'true';
    }

    if (startDate || endDate) {
      where.createdAt = {};
      if (startDate) {
        where.createdAt.gte = new Date(startDate);
      }
      if (endDate) {
        where.createdAt.lte = new Date(endDate);
      }
    }

    // Search functionality - search in description, user details from snapshot
    if (search) {
      where.OR = [
        { description: { contains: search, mode: 'insensitive' } },
        { userSnapshot: { path: ['fullName'], string_contains: search, mode: 'insensitive' } },
        { userSnapshot: { path: ['email'], string_contains: search, mode: 'insensitive' } },
      ];
    }

    // Fetch audit logs with pagination
    const [logs, total] = await Promise.all([
      prisma.auditLog.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        take: limit,
        skip: offset,
        include: {
          user: {
            select: {
              id: true,
              fullName: true,
              email: true,
              role: true,
              avatar: true,
            },
          },
        },
      }),
      prisma.auditLog.count({ where }),
    ]);

    // Format the response
    const formattedLogs = logs.map(log => ({
      ...log,
      timestamp: log.createdAt.toISOString(),
      createdAt: log.createdAt.toISOString(),
      userSnapshot: typeof log.userSnapshot === 'string' 
        ? JSON.parse(log.userSnapshot) 
        : log.userSnapshot,
      previousData: log.previousData 
        ? (typeof log.previousData === 'string' ? JSON.parse(log.previousData) : log.previousData)
        : null,
      newData: log.newData
        ? (typeof log.newData === 'string' ? JSON.parse(log.newData) : log.newData)
        : null,
    }));

    return NextResponse.json({
      ok: true,
      data: formattedLogs,
      total,
      limit,
      offset,
    });
  } catch (error) {
    console.error('Error fetching audit logs:', error);
    return NextResponse.json(
      {
        ok: false,
        error: 'Failed to fetch audit logs',
      },
      { status: 500 }
    );
  }
}

