import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';
import { createAuditLog, getUserInfoFromHeaders } from '@/lib/audit-logger';

const updateAccountSchema = z.object({
  name: z.string().min(1).optional(),
  code: z.string().min(1).optional(),
  currency: z.string().min(1).optional(),
  description: z.string().optional().nullable(),
  allowNegativeBalance: z.boolean().optional(),
  isActive: z.boolean().optional(),
});

type RouteContext = { params: Promise<{ id: string }> };

export async function GET(_request: NextRequest, context: RouteContext) {
  try {
    const { id } = await context.params;

    const account = await prisma.account.findUnique({
      where: { id },
    });

    if (!account) {
      return NextResponse.json(
        { ok: false, error: 'Account not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({ ok: true, data: account });
  } catch (error) {
    console.error('Error fetching account:', error);
    return NextResponse.json(
      { ok: false, error: 'Failed to fetch account' },
      { status: 500 }
    );
  }
}

export async function PATCH(request: NextRequest, context: RouteContext) {
  try {
    const { id } = await context.params;
    const body = await request.json();
    const validatedData = updateAccountSchema.parse(body);

    const existing = await prisma.account.findUnique({ where: { id } });

    if (!existing) {
      return NextResponse.json(
        { ok: false, error: 'Account not found' },
        { status: 404 }
      );
    }

    if (validatedData.code && validatedData.code !== existing.code) {
      const codeExists = await prisma.account.findUnique({
        where: { code: validatedData.code },
      });
      if (codeExists) {
        return NextResponse.json(
          { ok: false, error: 'Account code already exists' },
          { status: 400 }
        );
      }
    }

    const account = await prisma.account.update({
      where: { id },
      data: {
        ...validatedData,
        description: validatedData.description ?? existing.description,
      },
    });

    try {
      const { userId, userSnapshot } = getUserInfoFromHeaders(request.headers);
      await createAuditLog({
        userId: userId || 'system',
        userSnapshot,
        actionType: 'UPDATE',
        entityType: 'Account',
        entityId: id,
        description: `Updated account "${account.name}"`,
        previousData: existing as Record<string, unknown>,
        newData: account as Record<string, unknown>,
        ipAddress: request.headers.get('x-forwarded-for') ?? undefined,
        userAgent: request.headers.get('user-agent') ?? undefined,
      });
    } catch (e) {
      console.error('Audit log failed (update account):', e);
    }

    return NextResponse.json({
      ok: true,
      data: account,
      message: 'Account updated successfully',
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { ok: false, error: 'Validation error', details: error.errors },
        { status: 400 }
      );
    }
    console.error('Error updating account:', error);
    return NextResponse.json(
      { ok: false, error: 'Failed to update account' },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest, context: RouteContext) {
  try {
    const { id } = await context.params;

    const existing = await prisma.account.findUnique({
      where: { id },
      include: { transactions: true, paymentsFrom: true },
    });

    if (!existing) {
      return NextResponse.json(
        { ok: false, error: 'Account not found' },
        { status: 404 }
      );
    }

    await prisma.account.update({
      where: { id },
      data: { isActive: false },
    });

    try {
      const { userId, userSnapshot } = getUserInfoFromHeaders(request.headers);
      await createAuditLog({
        userId: userId || 'system',
        userSnapshot,
        actionType: 'DELETE',
        entityType: 'Account',
        entityId: id,
        description: `Deactivated account "${existing.name}"`,
        previousData: existing as Record<string, unknown>,
        newData: null,
        ipAddress: request.headers.get('x-forwarded-for') ?? undefined,
        userAgent: request.headers.get('user-agent') ?? undefined,
      });
    } catch (e) {
      console.error('Audit log failed (delete account):', e);
    }

    return NextResponse.json({
      ok: true,
      message: 'Account deactivated successfully',
    });
  } catch (error) {
    console.error('Error deactivating account:', error);
    return NextResponse.json(
      { ok: false, error: 'Failed to deactivate account' },
      { status: 500 }
    );
  }
}
