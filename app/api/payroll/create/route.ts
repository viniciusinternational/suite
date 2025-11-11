import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { createAuditLog, getUserInfoFromHeaders } from '@/lib/audit-logger'
import { z } from 'zod'

// Validation schema
const createPayrollSchema = z.object({
  periodMonth: z.number().int().min(1).max(12),
  periodYear: z.number().int().min(2000).max(2100),
  entries: z.array(
    z.object({
      userId: z.string(),
      baseSalary: z.number().nonnegative(),
      deductions: z.number().nonnegative().default(0),
      allowances: z.number().nonnegative().default(0),
      deductionApplications: z.array(
        z.object({
          deductionId: z.string(),
          sourceAmount: z.number().nonnegative(),
          calculatedAmount: z.number().nonnegative(),
        })
      ).optional(),
      allowanceApplications: z.array(
        z.object({
          allowanceId: z.string(),
          sourceAmount: z.number().nonnegative(),
          calculatedAmount: z.number().nonnegative(),
        })
      ).optional(),
    })
  ).min(1),
})

// POST /api/payroll/create - Create payroll with auto-calculation
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

    // Get all unique departments from entries
    const userIds = data.entries.map((e) => e.userId)
    const users = await prisma.user.findMany({
      where: { id: { in: userIds } },
      select: { id: true, departmentId: true },
    })

    const departmentIds = [...new Set(users.map((u) => u.departmentId).filter(Boolean))]

    // Create payroll with entries and tracking
    const payroll = await prisma.payroll.create({
      data: {
        periodMonth: data.periodMonth,
        periodYear: data.periodYear,
        status: 'pending_dept_head',
        createdById: userId || null,
        entries: {
          create: data.entries.map((entry) => ({
            userId: entry.userId,
            baseSalary: entry.baseSalary,
            deductions: entry.deductions,
            allowances: entry.allowances,
            netSalary: entry.baseSalary + entry.allowances - entry.deductions,
            deductionApplications: entry.deductionApplications
              ? {
                  create: entry.deductionApplications.map((app) => ({
                    deductionId: app.deductionId,
                    sourceAmount: app.sourceAmount,
                    calculatedAmount: app.calculatedAmount,
                  })),
                }
              : undefined,
            allowanceApplications: entry.allowanceApplications
              ? {
                  create: entry.allowanceApplications.map((app) => ({
                    allowanceId: app.allowanceId,
                    sourceAmount: app.sourceAmount,
                    calculatedAmount: app.calculatedAmount,
                  })),
                }
              : undefined,
          })),
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
      },
    })

    // Create automatic approvals
    const approvals = []

    // Create approvals for department heads
    for (const deptId of departmentIds) {
      const department = await prisma.department.findUnique({
        where: { id: deptId! },
        select: { headId: true },
      })

      if (department?.headId) {
        const deptHeadApproval = await prisma.payrollApproval.create({
          data: {
            payrollId: payroll.id,
            userId: department.headId,
            level: 'dept_head',
            status: 'pending',
          },
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
        })
        approvals.push(deptHeadApproval)
      }
    }

    // Find admin head (typically hr_manager or administrator role)
    const adminHead = await prisma.user.findFirst({
      where: {
        role: { in: ['hr_manager', 'administrator', 'admin', 'managing_director'] },
        isActive: true,
      },
    })

    if (adminHead) {
      const adminHeadApproval = await prisma.payrollApproval.create({
        data: {
          payrollId: payroll.id,
          userId: adminHead.id,
          level: 'admin_head',
          status: 'pending',
        },
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
      })
      approvals.push(adminHeadApproval)
    }

    // Find accountant
    const accountant = await prisma.user.findFirst({
      where: {
        role: { in: ['accountant', 'administrator'] },
        isActive: true,
      },
    })

    if (accountant) {
      const accountantApproval = await prisma.payrollApproval.create({
        data: {
          payrollId: payroll.id,
          userId: accountant.id,
          level: 'accountant',
          status: 'pending',
        },
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
      })
      approvals.push(accountantApproval)
    }

    // Fetch payroll with approvals
    const payrollWithApprovals = await prisma.payroll.findUnique({
      where: { id: payroll.id },
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
      ...payrollWithApprovals,
      createdAt: payrollWithApprovals!.createdAt.toISOString(),
      updatedAt: payrollWithApprovals!.updatedAt.toISOString(),
      entries: payrollWithApprovals!.entries.map((entry) => ({
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
      approvals: payrollWithApprovals!.approvals.map((approval) => ({
        ...approval,
        createdAt: approval.createdAt.toISOString(),
        updatedAt: approval.updatedAt.toISOString(),
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

