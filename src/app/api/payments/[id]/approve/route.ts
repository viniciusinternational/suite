import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'

import { prisma } from '@/lib/prisma'
import { createAuditLog } from '@/lib/audit-logger'

const approvePaymentSchema = z.object({
  approvalId: z.string().min(1, 'Approval ID is required'),
  userId: z.string().min(1, 'User ID is required'),
  level: z.string().optional(),
  action: z.enum(['approve', 'reject']),
  comments: z.string().optional(),
})

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: paymentId } = await params
    const body = await request.json()
    const headers = request.headers
    const userIdFromHeader = headers.get('x-user-id')

    const payload = approvePaymentSchema.parse({
      ...body,
      userId: body.userId || userIdFromHeader || '',
    })

    const actor = await prisma.user.findUnique({
      where: { id: payload.userId },
      select: {
        id: true,
        fullName: true,
        email: true,
        role: true,
        isActive: true,
        permissions: true,
        departmentId: true,
      },
    })

    if (!actor || !actor.isActive) {
      return NextResponse.json(
        { ok: false, error: 'Approver not found or inactive' },
        { status: 400 }
      )
    }

    const actorPermissions = (actor.permissions ?? {}) as Record<string, boolean>
    if (actorPermissions.approve_payments !== true && actorPermissions.approve_approvals !== true) {
      return NextResponse.json(
        { ok: false, error: 'You do not have permission to approve payments' },
        { status: 403 }
      )
    }

    const payment = await prisma.payment.findUnique({
      where: { id: paymentId },
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
            addedBy: {
              select: {
                id: true,
                fullName: true,
                email: true,
                role: true,
              },
            },
          },
          orderBy: {
            createdAt: 'asc',
          },
        },
      },
    })

    if (!payment) {
      return NextResponse.json({ ok: false, error: 'Payment not found' }, { status: 404 })
    }

    const approval = payment.approvals.find((item) => item.id === payload.approvalId)

    if (!approval) {
      return NextResponse.json(
        { ok: false, error: 'Approval record not found for this payment' },
        { status: 404 }
      )
    }

    if (approval.userId !== payload.userId) {
      return NextResponse.json(
        { ok: false, error: 'You are not assigned to this approval' },
        { status: 403 }
      )
    }

    if (approval.status !== 'pending') {
      return NextResponse.json(
        { ok: false, error: 'Approval already processed' },
        { status: 400 }
      )
    }

    if (payload.level && approval.level !== payload.level) {
      return NextResponse.json(
        { ok: false, error: 'Approval level mismatch' },
        { status: 400 }
      )
    }

    const actionDate = new Date().toISOString()
    const newStatus = payload.action === 'approve' ? 'approved' : 'rejected'

    await prisma.paymentApproval.update({
      where: { id: approval.id },
      data: {
        status: newStatus,
        actionDate,
        comments: payload.comments || null,
      },
    })

    let nextPaymentStatus = payment.status
    let requiresApproval = payment.requiresApproval ?? false

    if (payload.action === 'reject') {
      nextPaymentStatus = 'voided'
      requiresApproval = false
    } else {
      const updatedApprovals = payment.approvals.map((item) =>
        item.id === approval.id
          ? { ...item, status: newStatus, actionDate, comments: payload.comments ?? null }
          : item
      )

      const anyPending = updatedApprovals.some((item) => item.status === 'pending')

      if (!anyPending) {
        nextPaymentStatus = payment.status === 'draft' ? 'scheduled' : payment.status
        requiresApproval = false
      } else {
        requiresApproval = true
      }
    }

    const updatedPayment = await prisma.payment.update({
      where: { id: paymentId },
      data: {
        status: nextPaymentStatus,
        requiresApproval,
      },
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
            addedBy: {
              select: {
                id: true,
                fullName: true,
                email: true,
                role: true,
              },
            },
          },
          orderBy: {
            createdAt: 'asc',
          },
        },
      },
    })

    await logPaymentApprovalAction({
      actor,
      headers,
      approvalId: approval.id,
      action: payload.action,
      description: `${payload.action === 'approve' ? 'Approved' : 'Rejected'} payment approval at ${approval.level} level`,
      snapshot: updatedPayment,
    })

    return NextResponse.json({
      ok: true,
      data: updatedPayment,
      message: `Payment ${payload.action === 'approve' ? 'approved' : 'rejected'} successfully`,
    })
  } catch (error) {
    console.error('Error processing payment approval:', error)
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { ok: false, error: 'Validation error', details: error.errors },
        { status: 400 }
      )
    }

    return NextResponse.json(
      { ok: false, error: 'Failed to process payment approval' },
      { status: 500 }
    )
  }
}

async function logPaymentApprovalAction({
  actor,
  headers,
  approvalId,
  action,
  description,
  snapshot,
}: {
  actor: {
    id: string
    fullName: string | null
    email: string | null
    role: string | null
    departmentId: string | null
  }
  headers: Headers
  approvalId: string
  action: 'approve' | 'reject'
  description: string
  snapshot: unknown
}) {
  try {
    await createAuditLog({
      userId: actor.id,
      userSnapshot: {
        id: actor.id,
        fullName: actor.fullName ?? headers.get('x-user-fullname') ?? 'Unknown',
        email: actor.email ?? headers.get('x-user-email') ?? 'unknown@example.com',
        role: actor.role ?? headers.get('x-user-role') ?? 'unknown',
        departmentId: actor.departmentId ?? headers.get('x-user-department-id') ?? undefined,
      },
      actionType: action === 'approve' ? 'PAYMENT_APPROVED' : 'PAYMENT_REJECTED',
      entityType: 'PaymentApproval',
      entityId: approvalId,
      description,
      previousData: null,
      newData: snapshot as any,
      ipAddress: headers.get('x-forwarded-for') ?? undefined,
      userAgent: headers.get('user-agent') ?? undefined,
    })
  } catch (error) {
    console.warn('Audit log failed (payment approval):', error)
  }
}


