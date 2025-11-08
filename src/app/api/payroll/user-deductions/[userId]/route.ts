import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { createAuditLog, getUserInfoFromHeaders } from '@/lib/audit-logger'
import { z } from 'zod'

// Validation schema
const createDeductionSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  amount: z.number().nonnegative('Amount must be non-negative'),
  isActive: z.boolean().default(true),
})

// GET /api/payroll/user-deductions/[userId] - Get all deductions for a user
export async function GET(
  request: NextRequest,
  { params }: { params: { userId: string } }
) {
  try {
    const isActive = request.nextUrl.searchParams.get('isActive')
    
    const where: any = { userId: params.userId }
    if (isActive !== null && isActive !== '') {
      where.isActive = isActive === 'true'
    }

    const deductions = await prisma.userDeduction.findMany({
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
    const formattedDeductions = deductions.map(deduction => ({
      ...deduction,
      createdAt: deduction.createdAt.toISOString(),
      updatedAt: deduction.updatedAt.toISOString(),
    }))

    return NextResponse.json({ ok: true, data: formattedDeductions })
  } catch (error) {
    console.error('Error fetching user deductions:', error)
    return NextResponse.json(
      { ok: false, error: 'Failed to fetch user deductions' },
      { status: 500 }
    )
  }
}

// POST /api/payroll/user-deductions/[userId] - Create new deduction for user
export async function POST(
  request: NextRequest,
  { params }: { params: { userId: string } }
) {
  try {
    const body = await request.json()
    const data = createDeductionSchema.parse(body)

    const headers = request.headers
    const { userId, userSnapshot } = getUserInfoFromHeaders(headers)

    // Verify user exists
    const user = await prisma.user.findUnique({
      where: { id: params.userId },
    })

    if (!user) {
      return NextResponse.json(
        { ok: false, error: 'User not found' },
        { status: 404 }
      )
    }

    // Create deduction
    const deduction = await prisma.userDeduction.create({
      data: {
        userId: params.userId,
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
        entityType: 'UserDeduction',
        entityId: deduction.id,
        description: `Created deduction "${data.name}" for user ${user.fullName}`,
        previousData: null,
        newData: deduction as any,
        ipAddress: request.ip ?? headers.get('x-forwarded-for') ?? undefined,
        userAgent: headers.get('user-agent') ?? undefined,
      })
    } catch (e) {
      console.warn('Audit log failed (create user deduction):', e)
    }

    // Format dates
    const formattedDeduction = {
      ...deduction,
      createdAt: deduction.createdAt.toISOString(),
      updatedAt: deduction.updatedAt.toISOString(),
    }

    return NextResponse.json({
      ok: true,
      data: formattedDeduction,
      message: 'Deduction created successfully',
    })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { ok: false, error: 'Validation error', details: error.errors },
        { status: 400 }
      )
    }
    console.error('Error creating user deduction:', error)
    return NextResponse.json(
      { ok: false, error: 'Failed to create user deduction' },
      { status: 500 }
    )
  }
}

