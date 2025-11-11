import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { createAuditLog, getUserInfoFromHeaders } from '@/lib/audit-logger'
import { z } from 'zod'

// Validation schema
const createDeductionSchema = z.object({
  title: z.string().min(1, 'Title is required'),
  description: z.string().optional(),
  startDate: z.string().datetime().optional().or(z.literal('').optional()),
  endDate: z.string().datetime().optional().or(z.literal('').optional()),
  always: z.boolean().default(false),
  amount: z.number().nonnegative().optional().nullable(),
  percent: z.number().min(0).max(100).optional().nullable(),
  global: z.boolean().default(false),
  userIds: z.array(z.string()).optional(),
  departmentIds: z.array(z.string()).optional(),
})

// GET /api/payroll/deductions - List all deductions
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const global = searchParams.get('global')
    const active = searchParams.get('active') // Active based on dates

    const where: any = {}

    if (global !== null && global !== '') {
      where.global = global === 'true'
    }

    // Filter by active status (check dates if not always)
    if (active === 'true') {
      const now = new Date()
      where.OR = [
        { always: true },
        {
          AND: [
            { OR: [{ startDate: null }, { startDate: { lte: now } }] },
            { OR: [{ endDate: null }, { endDate: { gte: now } }] },
          ],
        },
      ]
    }

    const deductions = await prisma.deduction.findMany({
      where,
      include: {
        users: {
          select: {
            id: true,
            fullName: true,
            email: true,
          },
        },
        departments: {
          select: {
            id: true,
            name: true,
            code: true,
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
      startDate: deduction.startDate?.toISOString() || null,
      endDate: deduction.endDate?.toISOString() || null,
      createdAt: deduction.createdAt.toISOString(),
      updatedAt: deduction.updatedAt.toISOString(),
    }))

    return NextResponse.json({ ok: true, data: formattedDeductions })
  } catch (error) {
    console.error('Error fetching deductions:', error)
    return NextResponse.json(
      { ok: false, error: 'Failed to fetch deductions' },
      { status: 500 }
    )
  }
}

// POST /api/payroll/deductions - Create new deduction
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const data = createDeductionSchema.parse(body)

    const headers = request.headers
    const { userId, userSnapshot } = getUserInfoFromHeaders(headers)

    // Validate that either amount or percent is provided (but not required to have both)
    if (!data.amount && !data.percent) {
      return NextResponse.json(
        { ok: false, error: 'Either amount or percent must be provided' },
        { status: 400 }
      )
    }

    // Create deduction
    const deduction = await prisma.deduction.create({
      data: {
        title: data.title,
        description: data.description,
        startDate: data.startDate ? new Date(data.startDate) : null,
        endDate: data.endDate ? new Date(data.endDate) : null,
        always: data.always,
        amount: data.amount,
        percent: data.percent,
        global: data.global,
        users: data.userIds && data.userIds.length > 0
          ? { connect: data.userIds.map((id) => ({ id })) }
          : undefined,
        departments: data.departmentIds && data.departmentIds.length > 0
          ? { connect: data.departmentIds.map((id) => ({ id })) }
          : undefined,
      },
      include: {
        users: {
          select: {
            id: true,
            fullName: true,
            email: true,
          },
        },
        departments: {
          select: {
            id: true,
            name: true,
            code: true,
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
        entityType: 'Deduction',
        entityId: deduction.id,
        description: `Created deduction "${data.title}"`,
        previousData: null,
        newData: deduction as any,
        ipAddress: request.ip ?? headers.get('x-forwarded-for') ?? undefined,
        userAgent: headers.get('user-agent') ?? undefined,
      })
    } catch (e) {
      console.warn('Audit log failed (create deduction):', e)
    }

    // Format dates
    const formattedDeduction = {
      ...deduction,
      startDate: deduction.startDate?.toISOString() || null,
      endDate: deduction.endDate?.toISOString() || null,
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
    console.error('Error creating deduction:', error)
    return NextResponse.json(
      { ok: false, error: 'Failed to create deduction' },
      { status: 500 }
    )
  }
}

