import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { createAuditLog, getUserInfoFromHeaders } from '@/lib/audit-logger'
import { z } from 'zod'

// Validation schema
const approvePayrollSchema = z.object({
  userId: z.string().min(1, 'User ID is required'),
  level: z.enum(['dept_head', 'admin_head', 'accountant']),
  action: z.enum(['approve', 'reject']),
  comments: z.string().optional(),
})

// POST /api/payroll/[id]/approve - Approve/reject payroll
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const body = await request.json()
    const headers = request.headers
    const userIdFromHeader = headers.get('x-user-id')
    
    const validatedData = approvePayrollSchema.parse({
      ...body,
      userId: body.userId || userIdFromHeader || '',
    })

    // Check if payroll exists
    const payroll = await prisma.payroll.findUnique({
      where: { id },
      include: {
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

    // Validate user exists
    const approver = await prisma.user.findUnique({
      where: { id: validatedData.userId },
    })

    if (!approver || !approver.isActive) {
      return NextResponse.json(
        { ok: false, error: 'Approver not found or inactive' },
        { status: 400 }
      )
    }

    // Find the approval record for this level and user
    const approval = payroll.approvals.find(
      (a) =>
        a.level === validatedData.level &&
        a.userId === validatedData.userId &&
        a.status === 'pending'
    )

    if (!approval) {
      return NextResponse.json(
        { ok: false, error: 'Approval record not found or already processed' },
        { status: 400 }
      )
    }

    // Update approval status
    const actionDate = new Date().toISOString()
    const newStatus = validatedData.action === 'approve' ? 'approved' : 'rejected'

    await prisma.payrollApproval.update({
      where: { id: approval.id },
      data: {
        status: newStatus,
        actionDate,
        comments: validatedData.comments || null,
      },
    })

    // Update payroll status based on approval workflow
    let newPayrollStatus = payroll.status

    if (validatedData.action === 'reject') {
      // If rejected at any level, set payroll status to rejected
      newPayrollStatus = 'rejected'
    } else if (validatedData.action === 'approve') {
      // Check workflow progression
      const allDeptHeadApprovals = payroll.approvals.filter((a) => a.level === 'dept_head')
      const allDeptHeadsApproved = allDeptHeadApprovals.every(
        (a) => a.id === approval.id || a.status === 'approved'
      )

      if (validatedData.level === 'dept_head') {
        // Check if all dept heads have approved
        if (allDeptHeadsApproved) {
          newPayrollStatus = 'pending_admin_head'
        }
      } else if (validatedData.level === 'admin_head') {
        newPayrollStatus = 'pending_accountant'
      } else if (validatedData.level === 'accountant') {
        newPayrollStatus = 'approved'
      }
    }

    // Update payroll status
    const updatedPayroll = await prisma.payroll.update({
      where: { id },
      data: {
        status: newPayrollStatus,
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
      const { userSnapshot } = getUserInfoFromHeaders(headers)
      await createAuditLog({
        userId: validatedData.userId,
        userSnapshot,
        actionType: validatedData.action === 'approve' ? 'PAYROLL_APPROVED' : 'PAYROLL_REJECTED',
        entityType: 'Payroll',
        entityId: id,
        description: `${validatedData.action === 'approve' ? 'Approved' : 'Rejected'} payroll for ${payroll.periodMonth}/${payroll.periodYear} at ${validatedData.level} level`,
        previousData: {
          status: payroll.status,
          approval: {
            id: approval.id,
            status: approval.status,
          },
        },
        newData: {
          status: newPayrollStatus,
          approval: {
            id: approval.id,
            status: newStatus,
            actionDate,
            comments: validatedData.comments,
          },
        },
        ipAddress: request.ip ?? headers.get('x-forwarded-for') ?? undefined,
        userAgent: headers.get('user-agent') ?? undefined,
      })
    } catch (e) {
      console.warn('Audit log failed (approve/reject payroll):', e)
    }

    // Format dates
    const formattedPayroll = {
      ...updatedPayroll,
      createdAt: updatedPayroll.createdAt.toISOString(),
      updatedAt: updatedPayroll.updatedAt.toISOString(),
      entries: updatedPayroll.entries.map((entry) => ({
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
      approvals: updatedPayroll.approvals.map((approval) => ({
        ...approval,
        createdAt: approval.createdAt.toISOString(),
        updatedAt: approval.updatedAt.toISOString(),
      })),
    }

    return NextResponse.json({
      ok: true,
      data: formattedPayroll,
      message: `Payroll ${validatedData.action === 'approve' ? 'approved' : 'rejected'} successfully`,
    })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { ok: false, error: 'Validation error', details: error.errors },
        { status: 400 }
      )
    }
    console.error('Error approving/rejecting payroll:', error)
    return NextResponse.json(
      { ok: false, error: 'Failed to process approval' },
      { status: 500 }
    )
  }
}

