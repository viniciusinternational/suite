import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { createAuditLog, getUserInfoFromHeaders } from '@/lib/audit-logger'
import { z } from 'zod'

// Validation schema
const updateAllowanceSchema = z.object({
  title: z.string().min(1).optional(),
  description: z.string().optional(),
  startDate: z.string().datetime().optional().or(z.literal('').optional()),
  endDate: z.string().datetime().optional().or(z.literal('').optional()),
  always: z.boolean().optional(),
  amount: z.number().nonnegative().optional().nullable(),
  percent: z.number().min(0).max(100).optional().nullable(),
  global: z.boolean().optional(),
  userIds: z.array(z.string()).optional(),
  departmentIds: z.array(z.string()).optional(),
})

type RouteContext = {
  params: Promise<{
    id: string
  }>
}

// GET /api/payroll/allowances/[id] - Get single allowance
export async function GET(
  request: NextRequest,
  context: RouteContext
) {
  try {
    const { id } = await context.params

    const allowance = await prisma.allowance.findUnique({
      where: { id },
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

    if (!allowance) {
      return NextResponse.json(
        { ok: false, error: 'Allowance not found' },
        { status: 404 }
      )
    }

    // Format dates
    const formattedAllowance = {
      ...allowance,
      startDate: allowance.startDate?.toISOString() || null,
      endDate: allowance.endDate?.toISOString() || null,
      createdAt: allowance.createdAt.toISOString(),
      updatedAt: allowance.updatedAt.toISOString(),
    }

    return NextResponse.json({ ok: true, data: formattedAllowance })
  } catch (error) {
    console.error('Error fetching allowance:', error)
    return NextResponse.json(
      { ok: false, error: 'Failed to fetch allowance' },
      { status: 500 }
    )
  }
}

// PATCH /api/payroll/allowances/[id] - Update allowance
export async function PATCH(
  request: NextRequest,
  context: RouteContext
) {
  try {
    const { id } = await context.params

    const body = await request.json()
    const data = updateAllowanceSchema.parse(body)

    const headers = request.headers
    const { userId, userSnapshot } = getUserInfoFromHeaders(headers)

    // Get existing allowance for audit log
    const existingAllowance = await prisma.allowance.findUnique({
      where: { id },
      include: { users: true },
    })

    if (!existingAllowance) {
      return NextResponse.json(
        { ok: false, error: 'Allowance not found' },
        { status: 404 }
      )
    }

    // Prepare update data
    const updateData: any = {}

    if (data.title !== undefined) updateData.title = data.title
    if (data.description !== undefined) updateData.description = data.description
    if (data.startDate !== undefined) {
      updateData.startDate = data.startDate ? new Date(data.startDate) : null
    }
    if (data.endDate !== undefined) {
      updateData.endDate = data.endDate ? new Date(data.endDate) : null
    }
    if (data.always !== undefined) updateData.always = data.always
    if (data.amount !== undefined) updateData.amount = data.amount
    if (data.percent !== undefined) updateData.percent = data.percent
    if (data.global !== undefined) updateData.global = data.global

    // Handle user associations
    if (data.userIds !== undefined) {
      updateData.users = {
        set: data.userIds.map((id) => ({ id })),
      }
    }

    // Handle department associations
    if (data.departmentIds !== undefined) {
      updateData.departments = {
        set: data.departmentIds.map((id) => ({ id })),
      }
    }

    // Update allowance
    const updatedAllowance = await prisma.allowance.update({
      where: { id },
      data: updateData,
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
        actionType: 'UPDATE',
        entityType: 'Allowance',
        entityId: updatedAllowance.id,
        description: `Updated allowance "${updatedAllowance.title}"`,
        previousData: existingAllowance as any,
        newData: updatedAllowance as any,
        ipAddress: request.ip ?? headers.get('x-forwarded-for') ?? undefined,
        userAgent: headers.get('user-agent') ?? undefined,
      })
    } catch (e) {
      console.warn('Audit log failed (update allowance):', e)
    }

    // Format dates
    const formattedAllowance = {
      ...updatedAllowance,
      startDate: updatedAllowance.startDate?.toISOString() || null,
      endDate: updatedAllowance.endDate?.toISOString() || null,
      createdAt: updatedAllowance.createdAt.toISOString(),
      updatedAt: updatedAllowance.updatedAt.toISOString(),
    }

    return NextResponse.json({
      ok: true,
      data: formattedAllowance,
      message: 'Allowance updated successfully',
    })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { ok: false, error: 'Validation error', details: error.errors },
        { status: 400 }
      )
    }
    console.error('Error updating allowance:', error)
    return NextResponse.json(
      { ok: false, error: 'Failed to update allowance' },
      { status: 500 }
    )
  }
}

// DELETE /api/payroll/allowances/[id] - Delete allowance
export async function DELETE(
  request: NextRequest,
  context: RouteContext
) {
  try {
    const { id } = await context.params
    const headers = request.headers
    const { userId, userSnapshot } = getUserInfoFromHeaders(headers)

    // Get existing allowance for audit log
    const existingAllowance = await prisma.allowance.findUnique({
      where: { id },
    })

    if (!existingAllowance) {
      return NextResponse.json(
        { ok: false, error: 'Allowance not found' },
        { status: 404 }
      )
    }

    // Delete allowance
    await prisma.allowance.delete({
      where: { id },
    })

    // Audit log
    try {
      await createAuditLog({
        userId: userId || 'system',
        userSnapshot,
        actionType: 'DELETE',
        entityType: 'Allowance',
        entityId: id,
        description: `Deleted allowance "${existingAllowance.title}"`,
        previousData: existingAllowance as any,
        newData: null,
        ipAddress: request.ip ?? headers.get('x-forwarded-for') ?? undefined,
        userAgent: headers.get('user-agent') ?? undefined,
      })
    } catch (e) {
      console.warn('Audit log failed (delete allowance):', e)
    }

    return NextResponse.json({
      ok: true,
      message: 'Allowance deleted successfully',
    })
  } catch (error) {
    console.error('Error deleting allowance:', error)
    return NextResponse.json(
      { ok: false, error: 'Failed to delete allowance' },
      { status: 500 }
    )
  }
}

