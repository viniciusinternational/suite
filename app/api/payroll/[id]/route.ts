import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { createAuditLog, getUserInfoFromHeaders } from '@/lib/audit-logger'
import { z } from 'zod'

// Validation schema
const updatePayrollSchema = z.object({
  status: z.enum(['draft', 'processed', 'paid']).optional(),
  entries: z.array(
    z.object({
      id: z.string().optional(),
      userId: z.string(),
      baseSalary: z.number().nonnegative(),
      deductions: z.number().nonnegative().default(0),
      allowances: z.number().nonnegative().default(0),
    })
  ).optional(),
})

type RouteContext = {
  params: Promise<{
    id: string
  }>
}

// GET /api/payroll/[id] - Get single payroll
export async function GET(
  request: NextRequest,
  context: RouteContext
) {
  try {
    const { id } = await context.params

    const payroll = await prisma.payroll.findUnique({
      where: { id },
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

    if (!payroll) {
      return NextResponse.json(
        { ok: false, error: 'Payroll not found' },
        { status: 404 }
      )
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
        deductionApplications: entry.deductionApplications.map(app => ({
          ...app,
          appliedAt: app.appliedAt.toISOString(),
        })),
        allowanceApplications: entry.allowanceApplications.map(app => ({
          ...app,
          appliedAt: app.appliedAt.toISOString(),
        })),
      })),
      approvals: payroll.approvals.map(approval => ({
        ...approval,
        createdAt: approval.createdAt.toISOString(),
        updatedAt: approval.updatedAt.toISOString(),
      })),
    }

    return NextResponse.json({ ok: true, data: formattedPayroll })
  } catch (error) {
    console.error('Error fetching payroll:', error)
    return NextResponse.json(
      { ok: false, error: 'Failed to fetch payroll' },
      { status: 500 }
    )
  }
}

// PATCH /api/payroll/[id] - Update payroll
export async function PATCH(
  request: NextRequest,
  context: RouteContext
) {
  try {
    const { id } = await context.params

    const body = await request.json()
    const data = updatePayrollSchema.parse(body)

    const headers = request.headers
    const { userId, userSnapshot } = getUserInfoFromHeaders(headers)

    // Get existing payroll
    const existingPayroll = await prisma.payroll.findUnique({
      where: { id },
      include: { entries: true },
    })

    if (!existingPayroll) {
      return NextResponse.json(
        { ok: false, error: 'Payroll not found' },
        { status: 404 }
      )
    }

    // Prepare update data
    const updateData: any = {}

    if (data.status) {
      updateData.status = data.status
    }

    // Handle entries update if provided
    if (data.entries) {
      // Calculate net salary for each entry
      const entriesData = data.entries.map(entry => ({
        userId: entry.userId,
        baseSalary: entry.baseSalary,
        deductions: entry.deductions,
        allowances: entry.allowances,
        netSalary: entry.baseSalary + entry.allowances - entry.deductions,
      }))

      // Delete existing entries and create new ones
      await prisma.payrollEntry.deleteMany({
        where: { payrollId: id },
      })

      updateData.entries = {
        create: entriesData,
      }
    }

    // Update payroll
    const updatedPayroll = await prisma.payroll.update({
      where: { id },
      data: updateData,
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
        actionType: 'UPDATE',
        entityType: 'Payroll',
        entityId: id,
        description: `Updated payroll ${updatedPayroll.id}`,
        previousData: existingPayroll as any,
        newData: updatedPayroll as any,
        ipAddress: request.ip ?? headers.get('x-forwarded-for') ?? undefined,
        userAgent: headers.get('user-agent') ?? undefined,
      })
    } catch (e) {
      console.warn('Audit log failed (update payroll):', e)
    }

    // Format dates
    const formattedPayroll = {
      ...updatedPayroll,
      createdAt: updatedPayroll.createdAt.toISOString(),
      updatedAt: updatedPayroll.updatedAt.toISOString(),
      entries: updatedPayroll.entries.map(entry => ({
        ...entry,
        createdAt: entry.createdAt.toISOString(),
        updatedAt: entry.updatedAt.toISOString(),
      })),
    }

    return NextResponse.json({
      ok: true,
      data: formattedPayroll,
      message: 'Payroll updated successfully',
    })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { ok: false, error: 'Validation error', details: error.errors },
        { status: 400 }
      )
    }
    console.error('Error updating payroll:', error)
    return NextResponse.json(
      { ok: false, error: 'Failed to update payroll' },
      { status: 500 }
    )
  }
}

// DELETE /api/payroll/[id] - Delete payroll
export async function DELETE(
  request: NextRequest,
  context: RouteContext
) {
  try {
    const { id } = await context.params
    const headers = request.headers
    const { userId, userSnapshot } = getUserInfoFromHeaders(headers)

    // Get existing payroll for audit log
    const existingPayroll = await prisma.payroll.findUnique({
      where: { id },
      include: { entries: true },
    })

    if (!existingPayroll) {
      return NextResponse.json(
        { ok: false, error: 'Payroll not found' },
        { status: 404 }
      )
    }

    // Delete payroll (entries will be deleted via cascade)
    await prisma.payroll.delete({
      where: { id },
    })

    // Audit log
    try {
      await createAuditLog({
        userId: userId || 'system',
        userSnapshot,
        actionType: 'DELETE',
        entityType: 'Payroll',
        entityId: id,
        description: `Deleted payroll ${id}`,
        previousData: existingPayroll as any,
        newData: null,
        ipAddress: request.ip ?? headers.get('x-forwarded-for') ?? undefined,
        userAgent: headers.get('user-agent') ?? undefined,
      })
    } catch (e) {
      console.warn('Audit log failed (delete payroll):', e)
    }

    return NextResponse.json({
      ok: true,
      message: 'Payroll deleted successfully',
    })
  } catch (error) {
    console.error('Error deleting payroll:', error)
    return NextResponse.json(
      { ok: false, error: 'Failed to delete payroll' },
      { status: 500 }
    )
  }
}

