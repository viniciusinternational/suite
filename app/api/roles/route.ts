import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';
import { createAuditLog, getUserInfoFromHeaders } from '@/lib/audit-logger';
import { hasPermission } from '@/lib/permissions';
import type { User } from '@/types';

const createRoleSchema = z.object({
  name: z.string().min(1, 'Role name is required'),
  code: z.string().optional(),
  description: z.string().optional(),
  permissions: z.record(z.string(), z.boolean()),
});

async function getCurrentUserForAuth(request: NextRequest): Promise<User | null> {
  const userId = request.headers.get('x-user-id');
  if (!userId || userId === 'system') return null;
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      id: true,
      firstName: true,
      lastName: true,
      fullName: true,
      email: true,
      role: true,
      departmentId: true,
      permissions: true,
      isActive: true,
      createdAt: true,
      updatedAt: true,
      phone: true,
      dob: true,
      gender: true,
      position: true,
      hireDate: true,
      salary: true,
      employeeId: true,
      avatar: true,
    },
  });
  if (!user || !user.isActive) return null;
  return user as User;
}

// GET /api/roles - List all roles
export async function GET(request: NextRequest) {
  try {
    const currentUser = await getCurrentUserForAuth(request);
    if (!currentUser || !hasPermission(currentUser, 'view_roles')) {
      return NextResponse.json(
        { ok: false, error: 'Forbidden: view_roles required' },
        { status: 403 }
      );
    }

    const roles = await prisma.role.findMany({
      orderBy: { name: 'asc' },
    });

    return NextResponse.json({
      ok: true,
      data: roles,
    });
  } catch (error) {
    console.error('Error fetching roles:', error);
    return NextResponse.json(
      { ok: false, error: 'Failed to fetch roles' },
      { status: 500 }
    );
  }
}

// POST /api/roles - Create new role
export async function POST(request: NextRequest) {
  try {
    const currentUser = await getCurrentUserForAuth(request);
    if (!currentUser || !hasPermission(currentUser, 'add_roles')) {
      return NextResponse.json(
        { ok: false, error: 'Forbidden: add_roles required' },
        { status: 403 }
      );
    }

    const body = await request.json();
    const validatedData = createRoleSchema.parse(body);

    if (validatedData.code) {
      const existing = await prisma.role.findUnique({
        where: { code: validatedData.code },
      });
      if (existing) {
        return NextResponse.json(
          { ok: false, error: 'Role code already exists' },
          { status: 400 }
        );
      }
    }

    const role = await prisma.role.create({
      data: {
        name: validatedData.name,
        code: validatedData.code || null,
        description: validatedData.description || null,
        permissions: validatedData.permissions as object,
      },
    });

    try {
      const headers = request.headers;
      const { userId, userSnapshot } = getUserInfoFromHeaders(headers);
      await createAuditLog({
        userId: userId || 'system',
        userSnapshot,
        actionType: 'CREATE',
        entityType: 'Role',
        entityId: role.id,
        description: `Created role "${role.name}"`,
        previousData: null,
        newData: role as any,
        ipAddress: request.ip ?? headers.get('x-forwarded-for') ?? undefined,
        userAgent: headers.get('user-agent') ?? undefined,
      });
    } catch (e) {
      console.error('Audit log failed (create role):', e);
    }

    return NextResponse.json({
      ok: true,
      data: role,
      message: 'Role created successfully',
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { ok: false, error: 'Validation error', details: error.errors },
        { status: 400 }
      );
    }
    console.error('Error creating role:', error);
    return NextResponse.json(
      { ok: false, error: 'Failed to create role' },
      { status: 500 }
    );
  }
}
