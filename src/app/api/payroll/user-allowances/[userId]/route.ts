import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { createAuditLog, getUserInfoFromHeaders } from '@/lib/audit-logger'
import { z } from 'zod'

// Validation schema
const createAllowanceSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  amount: z.number().nonnegative('Amount must be non-negative'),
  isActive: z.boolean().default(true),
})

// GET /api/payroll/user-allowances/[userId] - Get all allowances for a user
type UserParams = { userId: string };

export async function GET(
  request: NextRequest,
  context: { params: Promise<UserParams> }
) {
  try {
    const { userId } = await context.params;
    const isActive = request.nextUrl.searchParams.get('isActive')
    
    const where: any = { userId }
    if (isActive !== null && isActive !== '') {
      where.isActive = isActive === 'true'
    }

    const allowances = await prisma.userAllowance.findMany({
      where,
      include: {
        user: {
          select: {
            id: true,
            fullName: true,
            email: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    })

    // Format dates
    const formattedAllowances = allowances.map(allowance => ({
      ...allowance,
      createdAt: allowance.createdAt.toISOString(),
      updatedAt: allowance.updatedAt.toISOString(),
    }))

    return NextResponse.json({ ok: true, data: formattedAllowances })
  } catch (error) {
    console.error('Error fetching user allowances:', error)
    return NextResponse.json(
      { ok: false, error: 'Failed to fetch user allowances' },
      { status: 500 }
    )
  }
}

// POST /api/payroll/user-allowances/[userId] - Create new allowance for user
export async function POST(
  request: NextRequest,
  context: { params: Promise<UserParams> }
) {
  try {
    const { userId: targetUserId } = await context.params;
    const body = await request.json()
    const data = createAllowanceSchema.parse(body)

    const headers = request.headers
    const { userId, userSnapshot } = getUserInfoFromHeaders(headers)

    // Verify user exists
    const user = await prisma.user.findUnique({
      where: { id: targetUserId },
    })

    if (!user) {
      return NextResponse.json(
        { ok: false, error: 'User not found' },
        { status: 404 }
      )
    }

    // Create allowance
    const allowance = await prisma.userAllowance.create({
      data: {
        userId: targetUserId,
        name: data.name,
        amount: data.amount,
        isActive: data.isActive,
      },
      include: {
        user: {
          select: {
            id: true,
            fullName: true,
            email: true,
          },
        },
      },
    })

    // Audit log
    try {
      await createAuditLog({
        userId: userId || 'system',
        userSnapshot,
        actionType: 'CREATE',
        entityType: 'UserAllowance',
        entityId: allowance.id,
        description: `Created allowance "${data.name}" for user ${user.fullName}`,
        previousData: null,
        newData: allowance as any,
        ipAddress: request.ip ?? headers.get('x-forwarded-for') ?? undefined,
        userAgent: headers.get('user-agent') ?? undefined,
      })
    } catch (e) {
      console.warn('Audit log failed (create user allowance):', e)
    }

    // Format dates
    const formattedAllowance = {
      ...allowance,
      createdAt: allowance.createdAt.toISOString(),
      updatedAt: allowance.updatedAt.toISOString(),
    }

    return NextResponse.json({
      ok: true,
      data: formattedAllowance,
      message: 'Allowance created successfully',
    })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { ok: false, error: 'Validation error', details: error.errors },
        { status: 400 }
      )
    }
    console.error('Error creating user allowance:', error)
    return NextResponse.json(
      { ok: false, error: 'Failed to create user allowance' },
      { status: 500 }
    )
  }
}

