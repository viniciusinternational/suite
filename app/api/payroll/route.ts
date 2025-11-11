import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { createAuditLog, getUserInfoFromHeaders } from '@/lib/audit-logger'
import { z } from 'zod'

// Validation schemas
const createPayrollSchema = z.object({
  periodMonth: z.number().int().min(1).max(12),
  periodYear: z.number().int().min(2000).max(2100),
  entries: z.array(
    z.object({
      userId: z.string(),
      baseSalary: z.number().nonnegative(),
      deductions: z.number().nonnegative().default(0),
      allowances: z.number().nonnegative().default(0),
    })
  ).min(1),
})

// GET /api/payroll - List all payrolls with filters
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const periodMonth = searchParams.get('periodMonth') ? parseInt(searchParams.get('periodMonth')!) : undefined
    const periodYear = searchParams.get('periodYear') ? parseInt(searchParams.get('periodYear')!) : undefined
    const status = searchParams.get('status') || undefined

    // Build where clause
    const where: any = {}

    if (periodMonth) {
      where.periodMonth = periodMonth
    }

    if (periodYear) {
      where.periodYear = periodYear
    }

    if (status) {
      where.status = status
    }

    const payrolls = await prisma.payroll.findMany({
      where,
      include: {
        entries: {
          include: {
            user: {
              select: {
                id: true,
                fullName: true,
                email: true,
                employeeId: true,
                position: true,
              },
            },
            deductionApplications: {
              include: {
                deduction: {
                  select: {
                    id: true,
                    title: true,
                    amount: true,
                    percent: true,
                  },
                },
              },
            },
            allowanceApplications: {
              include: {
                allowance: {
                  select: {
                    id: true,
                    title: true,
                    amount: true,
                    percent: true,
                  },
                },
              },
            },
          },
        },
        approvals: {
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
          orderBy: {
            level: 'asc',
          },
        },
        createdBy: {
          select: {
            id: true,
            fullName: true,
            email: true,
          },
        },
      },
      orderBy: [
        { periodYear: 'desc' },
        { periodMonth: 'desc' },
      ],
    })

    // Format dates
    const formattedPayrolls = payrolls.map((payroll) => ({
      ...payroll,
      createdAt: payroll.createdAt.toISOString(),
      updatedAt: payroll.updatedAt.toISOString(),
      entries: payroll.entries.map((entry) => ({
        ...entry,
        createdAt: entry.createdAt.toISOString(),
        updatedAt: entry.updatedAt.toISOString(),
        deductionApplications: entry.deductionApplications.map((app) => ({
          ...app,
          appliedAt: app.appliedAt.toISOString(),
        })),
        allowanceApplications: entry.allowanceApplications.map((app) => ({
          ...app,
          appliedAt: app.appliedAt.toISOString(),
        })),
      })),
      approvals: payroll.approvals.map((approval) => ({
        ...approval,
        createdAt: approval.createdAt.toISOString(),
        updatedAt: approval.updatedAt.toISOString(),
      })),
    }))

    return NextResponse.json({ ok: true, data: formattedPayrolls })
  } catch (error) {
    console.error('Error fetching payrolls:', error)
    return NextResponse.json({ ok: false, error: 'Failed to fetch payrolls' }, { status: 500 })
  }
}

// POST /api/payroll - Create new payroll
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const data = createPayrollSchema.parse(body)

    const headers = request.headers
    const { userId, userSnapshot } = getUserInfoFromHeaders(headers)

    // Check if payroll for this period already exists
    const existingPayroll = await prisma.payroll.findUnique({
      where: {
        periodMonth_periodYear: {
          periodMonth: data.periodMonth,
          periodYear: data.periodYear,
        },
      },
    })

    if (existingPayroll) {
      return NextResponse.json(
        { ok: false, error: 'Payroll for this period already exists' },
        { status: 400 }
      )
    }

    // Calculate net salary for each entry
    const entriesData = data.entries.map(entry => ({
      userId: entry.userId,
      baseSalary: entry.baseSalary,
      deductions: entry.deductions,
      allowances: entry.allowances,
      netSalary: entry.baseSalary + entry.allowances - entry.deductions,
    }))

    // Create payroll with entries
    const payroll = await prisma.payroll.create({
      data: {
        periodMonth: data.periodMonth,
        periodYear: data.periodYear,
        status: 'draft',
        entries: {
          create: entriesData,
        },
      },
      include: {
        entries: {
          include: {
            user: {
              select: {
                id: true,
                fullName: true,
                email: true,
                employeeId: true,
                position: true,
              },
            },
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
        entityType: 'Payroll',
        entityId: payroll.id,
        description: `Created payroll for ${data.periodMonth}/${data.periodYear} with ${data.entries.length} entries`,
        previousData: null,
        newData: payroll as any,
        ipAddress: request.ip ?? headers.get('x-forwarded-for') ?? undefined,
        userAgent: headers.get('user-agent') ?? undefined,
      })
    } catch (e) {
      console.warn('Audit log failed (create payroll):', e)
    }

    // Format dates
    const formattedPayroll = {
      ...payroll,
      createdAt: payroll.createdAt.toISOString(),
      updatedAt: payroll.updatedAt.toISOString(),
      entries: payroll.entries.map(entry => ({
        ...entry,
        createdAt: entry.createdAt.toISOString(),
        updatedAt: entry.updatedAt.toISOString(),
      })),
    }

    return NextResponse.json({
      ok: true,
      data: formattedPayroll,
      message: 'Payroll created successfully',
    })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { ok: false, error: 'Validation error', details: error.errors },
        { status: 400 }
      )
    }
    console.error('Error creating payroll:', error)
    return NextResponse.json(
      { ok: false, error: 'Failed to create payroll' },
      { status: 500 }
    )
  }
}

