import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'

import { prisma } from '@/lib/prisma'
import { createAuditLog } from '@/lib/audit-logger'

const addApproverSchema = z.object({
  type: z.enum(['request', 'project', 'payroll', 'payment']),
  actorId: z.string().min(1, 'Actor ID is required'),
  newApproverId: z.string().min(1, 'New approver ID is required'),
  level: z.string().optional(),
  canAddApprovers: z.boolean().optional(),
})

type AddApproverPayload = z.infer<typeof addApproverSchema>

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const body = await request.json()
    const headers = request.headers
    const actorIdFromHeader = headers.get('x-user-id')

    const payload = addApproverSchema.parse({
      ...body,
      actorId: body.actorId || actorIdFromHeader || '',
    })

    const actor = await prisma.user.findUnique({
      where: { id: payload.actorId },
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
        {
          ok: false,
          error: 'Actor not found or inactive',
        },
        { status: 400 }
      )
    }

    const actorPermissions = (actor.permissions ?? {}) as Record<string, boolean>
    const canManageApprovers =
      actorPermissions.manage_approvers === true || actorPermissions.add_approvers === true

    if (!canManageApprovers) {
      return NextResponse.json(
        {
          ok: false,
          error: 'You do not have permission to add approvers',
        },
        { status: 403 }
      )
    }

    switch (payload.type) {
      case 'request':
        return handleRequestApproverAdd(id, payload, actor, headers)
      case 'project':
        return handleProjectApproverAdd(id, payload, actor, headers)
      case 'payroll':
        return handlePayrollApproverAdd(id, payload, actor, headers)
      case 'payment':
        return handlePaymentApproverAdd(id, payload, actor, headers)
      default:
        return NextResponse.json(
          {
            ok: false,
            error: 'Unsupported approval type',
          },
          { status: 400 }
        )
    }
  } catch (error) {
    console.error('Error adding approver:', error)
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        {
          ok: false,
          error: 'Validation error',
          details: error.errors,
        },
        { status: 400 }
      )
    }

    return NextResponse.json(
      {
        ok: false,
        error: 'Failed to add approver',
      },
      { status: 500 }
    )
  }
}

async function handleRequestApproverAdd(
  approvalId: string,
  payload: AddApproverPayload,
  actor: {
    id: string
    fullName: string | null
    email: string | null
    role: string | null
    departmentId: string | null
  },
  headers: Headers
) {
  const baseApproval = await prisma.requestApproval.findUnique({
    where: { id: approvalId },
    include: {
      requestForm: {
        include: {
          approvals: true,
        },
      },
    },
  })

  if (!baseApproval) {
    return NextResponse.json(
      { ok: false, error: 'Approval not found' },
      { status: 404 }
    )
  }

  const level = payload.level ?? baseApproval.level
  if (!level) {
    return NextResponse.json(
      {
        ok: false,
        error: 'Approval level is required',
      },
      { status: 400 }
    )
  }

  const actorIsApprover =
    baseApproval.userId === payload.actorId ||
    baseApproval.requestForm.approvals.some((approval) => approval.userId === payload.actorId)

  if (!actorIsApprover) {
    return NextResponse.json(
      {
        ok: false,
        error: 'You must be an approver on this request to add approvers',
      },
      { status: 403 }
    )
  }

  const newApprover = await prisma.user.findUnique({
    where: { id: payload.newApproverId },
    select: {
      id: true,
      fullName: true,
      email: true,
      role: true,
      isActive: true,
    },
  })

  if (!newApprover || !newApprover.isActive) {
    return NextResponse.json(
      {
        ok: false,
        error: 'Selected approver not found or inactive',
      },
      { status: 400 }
    )
  }

  const existingAssignment = await prisma.requestApproval.findFirst({
    where: {
      requestFormId: baseApproval.requestFormId,
      userId: newApprover.id,
      level,
    },
  })

  if (existingAssignment) {
    return NextResponse.json(
      {
        ok: false,
        error: 'User is already an approver at this level',
      },
      { status: 409 }
    )
  }

  await prisma.requestApproval.create({
    data: {
      requestFormId: baseApproval.requestFormId,
      userId: newApprover.id,
      level,
      canAddApprovers: payload.canAddApprovers ?? false,
      addedById: actor.id,
    },
  })

  const updatedRequest = await prisma.requestForm.findUnique({
    where: { id: baseApproval.requestFormId },
    include: {
      requestedByUser: {
        select: {
          id: true,
          fullName: true,
          email: true,
          avatar: true,
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
          level: 'asc',
        },
      },
    },
  })

  await logApproverAddition({
    actor,
    headers,
    entityType: 'RequestApproval',
    entityId: baseApproval.requestFormId,
    description: `Added ${newApprover.fullName ?? 'user'} as ${level} approver for request`,
    snapshot: updatedRequest,
  })

  return NextResponse.json({
    ok: true,
    data: updatedRequest,
    message: 'Approver added successfully',
  })
}

async function handleProjectApproverAdd(
  approvalId: string,
  payload: AddApproverPayload,
  actor: {
    id: string
    fullName: string | null
    email: string | null
    role: string | null
    departmentId: string | null
  },
  headers: Headers
) {
  const baseApproval = await prisma.approval.findUnique({
    where: { id: approvalId },
    include: {
      project: {
        include: {
          approvals: true,
        },
      },
    },
  })

  if (!baseApproval) {
    return NextResponse.json(
      { ok: false, error: 'Approval not found' },
      { status: 404 }
    )
  }

  const level = payload.level ?? baseApproval.level
  if (!level) {
    return NextResponse.json(
      {
        ok: false,
        error: 'Approval level is required',
      },
      { status: 400 }
    )
  }

  const actorIsApprover =
    baseApproval.userId === payload.actorId ||
    baseApproval.project.approvals.some((approval) => approval.userId === payload.actorId)

  if (!actorIsApprover) {
    return NextResponse.json(
      {
        ok: false,
        error: 'You must be an approver on this project to add approvers',
      },
      { status: 403 }
    )
  }

  const newApprover = await prisma.user.findUnique({
    where: { id: payload.newApproverId },
    select: {
      id: true,
      fullName: true,
      email: true,
      role: true,
      isActive: true,
    },
  })

  if (!newApprover || !newApprover.isActive) {
    return NextResponse.json(
      {
        ok: false,
        error: 'Selected approver not found or inactive',
      },
      { status: 400 }
    )
  }

  const existingAssignment = await prisma.approval.findFirst({
    where: {
      projectId: baseApproval.projectId,
      userId: newApprover.id,
      level,
    },
  })

  if (existingAssignment) {
    return NextResponse.json(
      {
        ok: false,
        error: 'User is already an approver at this level',
      },
      { status: 409 }
    )
  }

  await prisma.approval.create({
    data: {
      projectId: baseApproval.projectId,
      userId: newApprover.id,
      level,
      canAddApprovers: payload.canAddApprovers ?? false,
      addedById: actor.id,
    },
  })

  const updatedProject = await prisma.project.findUnique({
    where: { id: baseApproval.projectId },
    include: {
      department: {
        select: {
          id: true,
          name: true,
          code: true,
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
          level: 'asc',
        },
      },
    },
  })

  await logApproverAddition({
    actor,
    headers,
    entityType: 'Approval',
    entityId: baseApproval.projectId,
    description: `Added ${newApprover.fullName ?? 'user'} as ${level} approver for project`,
    snapshot: updatedProject,
  })

  return NextResponse.json({
    ok: true,
    data: updatedProject,
    message: 'Approver added successfully',
  })
}

async function handlePayrollApproverAdd(
  approvalId: string,
  payload: AddApproverPayload,
  actor: {
    id: string
    fullName: string | null
    email: string | null
    role: string | null
    departmentId: string | null
  },
  headers: Headers
) {
  const baseApproval = await prisma.payrollApproval.findUnique({
    where: { id: approvalId },
    include: {
      payroll: {
        include: {
          approvals: true,
        },
      },
    },
  })

  if (!baseApproval) {
    return NextResponse.json(
      { ok: false, error: 'Approval not found' },
      { status: 404 }
    )
  }

  const level = payload.level ?? baseApproval.level
  if (!level) {
    return NextResponse.json(
      {
        ok: false,
        error: 'Approval level is required',
      },
      { status: 400 }
    )
  }

  const actorIsApprover =
    baseApproval.userId === payload.actorId ||
    baseApproval.payroll.approvals.some((approval) => approval.userId === payload.actorId)

  if (!actorIsApprover) {
    return NextResponse.json(
      {
        ok: false,
        error: 'You must be an approver on this payroll to add approvers',
      },
      { status: 403 }
    )
  }

  const newApprover = await prisma.user.findUnique({
    where: { id: payload.newApproverId },
    select: {
      id: true,
      fullName: true,
      email: true,
      role: true,
      isActive: true,
    },
  })

  if (!newApprover || !newApprover.isActive) {
    return NextResponse.json(
      {
        ok: false,
        error: 'Selected approver not found or inactive',
      },
      { status: 400 }
    )
  }

  const existingAssignment = await prisma.payrollApproval.findFirst({
    where: {
      payrollId: baseApproval.payrollId,
      userId: newApprover.id,
      level,
    },
  })

  if (existingAssignment) {
    return NextResponse.json(
      {
        ok: false,
        error: 'User is already an approver at this level',
      },
      { status: 409 }
    )
  }

  await prisma.payrollApproval.create({
    data: {
      payrollId: baseApproval.payrollId,
      userId: newApprover.id,
      level,
      canAddApprovers: payload.canAddApprovers ?? false,
      addedById: actor.id,
    },
  })

  const updatedPayroll = await prisma.payroll.findUnique({
    where: { id: baseApproval.payrollId },
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

  await logApproverAddition({
    actor,
    headers,
    entityType: 'PayrollApproval',
    entityId: baseApproval.payrollId,
    description: `Added ${newApprover.fullName ?? 'user'} as ${level} approver for payroll`,
    snapshot: updatedPayroll,
  })

  return NextResponse.json({
    ok: true,
    data: updatedPayroll,
    message: 'Approver added successfully',
  })
}

async function handlePaymentApproverAdd(
  approvalId: string,
  payload: AddApproverPayload,
  actor: {
    id: string
    fullName: string | null
    email: string | null
    role: string | null
    departmentId: string | null
  },
  headers: Headers
) {
  const baseApproval = await prisma.paymentApproval.findUnique({
    where: { id: approvalId },
    include: {
      payment: {
        include: {
          approvals: true,
        },
      },
    },
  })

  if (!baseApproval) {
    return NextResponse.json(
      { ok: false, error: 'Approval not found' },
      { status: 404 }
    )
  }

  const level = payload.level ?? baseApproval.level
  if (!level) {
    return NextResponse.json(
      {
        ok: false,
        error: 'Approval level is required',
      },
      { status: 400 }
    )
  }

  const actorIsApprover =
    baseApproval.userId === payload.actorId ||
    baseApproval.payment.approvals.some((approval) => approval.userId === payload.actorId)

  if (!actorIsApprover) {
    return NextResponse.json(
      {
        ok: false,
        error: 'You must be an approver on this payment to add approvers',
      },
      { status: 403 }
    )
  }

  const newApprover = await prisma.user.findUnique({
    where: { id: payload.newApproverId },
    select: {
      id: true,
      fullName: true,
      email: true,
      role: true,
      isActive: true,
    },
  })

  if (!newApprover || !newApprover.isActive) {
    return NextResponse.json(
      {
        ok: false,
        error: 'Selected approver not found or inactive',
      },
      { status: 400 }
    )
  }

  const existingAssignment = await prisma.paymentApproval.findFirst({
    where: {
      paymentId: baseApproval.paymentId,
      userId: newApprover.id,
      level,
    },
  })

  if (existingAssignment) {
    return NextResponse.json(
      {
        ok: false,
        error: 'User is already an approver at this level',
      },
      { status: 409 }
    )
  }

  await prisma.paymentApproval.create({
    data: {
      paymentId: baseApproval.paymentId,
      userId: newApprover.id,
      level,
      canAddApprovers: payload.canAddApprovers ?? false,
      addedById: actor.id,
    },
  })

  const updatedPayment = await prisma.payment.findUnique({
    where: { id: baseApproval.paymentId },
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

  await logApproverAddition({
    actor,
    headers,
    entityType: 'PaymentApproval',
    entityId: baseApproval.paymentId,
    description: `Added ${newApprover.fullName ?? 'user'} as ${level} approver for payment`,
    snapshot: updatedPayment,
  })

  return NextResponse.json({
    ok: true,
    data: updatedPayment,
    message: 'Approver added successfully',
  })
}

async function logApproverAddition({
  actor,
  headers,
  entityType,
  entityId,
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
  entityType: 'Approval' | 'RequestApproval' | 'PayrollApproval' | 'PaymentApproval'
  entityId: string
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
      actionType: 'UPDATE',
      entityType,
      entityId,
      description,
      previousData: null,
      newData: snapshot as any,
      ipAddress: headers.get('x-forwarded-for') ?? undefined,
      userAgent: headers.get('user-agent') ?? undefined,
    })
  } catch (error) {
    console.warn('Audit log failed (add approver):', error)
  }
}


