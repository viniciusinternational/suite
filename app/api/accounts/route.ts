import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';
import { createAuditLog, getUserInfoFromHeaders } from '@/lib/audit-logger';

const createAccountSchema = z.object({
  name: z.string().min(1, 'Account name is required'),
  code: z.string().min(1, 'Account code is required'),
  currency: z.string().min(1, 'Currency is required'),
  description: z.string().optional(),
  allowNegativeBalance: z.boolean().default(false),
  isActive: z.boolean().default(true),
});

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const isActive = searchParams.get('isActive');
    const search = searchParams.get('search');

    const where: Record<string, unknown> = {};
    if (isActive !== null && isActive !== undefined && isActive !== '') {
      if (isActive === 'true') where.isActive = true;
      else if (isActive === 'false') where.isActive = false;
    }
    if (search && search.trim()) {
      where.OR = [
        { name: { contains: search.trim(), mode: 'insensitive' as const } },
        { code: { contains: search.trim(), mode: 'insensitive' as const } },
      ];
    }

    const accounts = await prisma.account.findMany({
      where,
      orderBy: { name: 'asc' },
    });

    return NextResponse.json({ ok: true, data: accounts });
  } catch (error) {
    console.error('Error fetching accounts:', error);
    return NextResponse.json(
      { ok: false, error: 'Failed to fetch accounts' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const validatedData = createAccountSchema.parse(body);

    const existing = await prisma.account.findUnique({
      where: { code: validatedData.code },
    });

    if (existing) {
      return NextResponse.json(
        { ok: false, error: 'Account code already exists' },
        { status: 400 }
      );
    }

    const account = await prisma.account.create({
      data: {
        name: validatedData.name,
        code: validatedData.code,
        currency: validatedData.currency,
        description: validatedData.description ?? null,
        allowNegativeBalance: validatedData.allowNegativeBalance,
        isActive: validatedData.isActive,
      },
    });

    try {
      const { userId, userSnapshot } = getUserInfoFromHeaders(request.headers);
      await createAuditLog({
        userId: userId || 'system',
        userSnapshot,
        actionType: 'CREATE',
        entityType: 'Account',
        entityId: account.id,
        description: `Created account "${account.name}" (${account.code})`,
        newData: account as Record<string, unknown>,
        ipAddress: request.headers.get('x-forwarded-for') ?? undefined,
        userAgent: request.headers.get('user-agent') ?? undefined,
      });
    } catch (e) {
      console.error('Audit log failed (create account):', e);
    }

    return NextResponse.json(
      { ok: true, data: account, message: 'Account created successfully' },
      { status: 201 }
    );
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { ok: false, error: 'Validation error', details: error.errors },
        { status: 400 }
      );
    }
    console.error('Error creating account:', error);
    return NextResponse.json(
      { ok: false, error: 'Failed to create account' },
      { status: 500 }
    );
  }
}
