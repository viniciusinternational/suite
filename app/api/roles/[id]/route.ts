import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';
import { createAuditLog, getUserInfoFromHeaders } from '@/lib/audit-logger';
import { hasPermission } from '@/lib/permissions';
import type { User } from '@/types';

const updateRoleSchema = z.object({
  name: z.string().min(1).optional(),
  code: z.string().optional().nullable(),
  description: z.string().optional().nullable(),
  permissions: z.record(z.string(), z.boolean()).optional(),
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

// GET /api/roles/[id] - Get single role
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const currentUser = await getCurrentUserForAuth(request);
    if (!currentUser || !hasPermission(currentUser, 'view_roles')) {
      return NextResponse.json(
        { ok: false, error: 'Forbidden: view_roles required' },
        { status: 403 }
      );
    }

    const { id } = await params;
    const role = await prisma.role.findUnique({
      where: { id },
    });

    if (!role) {
      return NextResponse.json(
        { ok: false, error: 'Role not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      ok: true,
      data: role,
    });
  } catch (error) {
    console.error('Error fetching role:', error);
    return NextResponse.json(
      { ok: false, error: 'Failed to fetch role' },
      { status: 500 }
    );
  }
}

// PUT /api/roles/[id] - Update role
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const currentUser = await getCurrentUserForAuth(request);
    if (!currentUser || !hasPermission(currentUser, 'edit_roles')) {
      return NextResponse.json(
        { ok: false, error: 'Forbidden: edit_roles required' },
        { status: 403 }
      );
    }

    const { id } = await params;
    const existing = await prisma.role.findUnique({
      where: { id },
    });

    if (!existing) {
      return NextResponse.json(
        { ok: false, error: 'Role not found' },
        { status: 404 }
      );
    }

    const body = await request.json();
    const validatedData = updateRoleSchema.parse(body);

    if (validatedData.code !== undefined && validatedData.code !== null && validatedData.code !== existing.code) {
      const codeExists = await prisma.role.findUnique({
        where: { code: validatedData.code },
      });
      if (codeExists) {
        return NextResponse.json(
          { ok: false, error: 'Role code already exists' },
          { status: 400 }
        );
      }
    }

    const role = await prisma.role.update({
      where: { id },
      data: {
        ...(validatedData.name !== undefined && { name: validatedData.name }),
        ...(validatedData.code !== undefined && { code: validatedData.code }),
        ...(validatedData.description !== undefined && { description: validatedData.description }),
        ...(validatedData.permissions !== undefined && { permissions: validatedData.permissions as object }),
      },
    });

    try {
      const headers = request.headers;
      const { userId, userSnapshot } = getUserInfoFromHeaders(headers);
      await createAuditLog({
        userId: userId || 'system',
        userSnapshot,
        actionType: 'UPDATE',
        entityType: 'Role',
        entityId: id,
        description: `Updated role "${role.name}"`,
        previousData: existing as any,
        newData: role as any,
        ipAddress: request.ip ?? headers.get('x-forwarded-for') ?? undefined,
        userAgent: headers.get('user-agent') ?? undefined,
      });
    } catch (e) {
      console.error('Audit log failed (update role):', e);
    }

    return NextResponse.json({
      ok: true,
      data: role,
      message: 'Role updated successfully',
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { ok: false, error: 'Validation error', details: error.errors },
        { status: 400 }
      );
    }
    console.error('Error updating role:', error);
    return NextResponse.json(
      { ok: false, error: 'Failed to update role' },
      { status: 500 }
    );
  }
}

// DELETE /api/roles/[id] - Delete role
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const currentUser = await getCurrentUserForAuth(request);
    if (!currentUser || !hasPermission(currentUser, 'delete_roles')) {
      return NextResponse.json(
        { ok: false, error: 'Forbidden: delete_roles required' },
        { status: 403 }
      );
    }

    const { id } = await params;
    const existing = await prisma.role.findUnique({
      where: { id },
    });

    if (!existing) {
      return NextResponse.json(
        { ok: false, error: 'Role not found' },
        { status: 404 }
      );
    }

    await prisma.role.delete({
      where: { id },
    });

    try {
      const headers = request.headers;
      const { userId, userSnapshot } = getUserInfoFromHeaders(headers);
      await createAuditLog({
        userId: userId || 'system',
        userSnapshot,
        actionType: 'DELETE',
        entityType: 'Role',
        entityId: id,
        description: `Deleted role "${existing.name}"`,
        previousData: existing as any,
        newData: null,
        ipAddress: request.ip ?? headers.get('x-forwarded-for') ?? undefined,
        userAgent: headers.get('user-agent') ?? undefined,
      });
    } catch (e) {
      console.error('Audit log failed (delete role):', e);
    }

    return NextResponse.json({
      ok: true,
      message: 'Role deleted successfully',
    });
  } catch (error) {
    console.error('Error deleting role:', error);
    return NextResponse.json(
      { ok: false, error: 'Failed to delete role' },
      { status: 500 }
    );
  }
}
