import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { createAuditLog, getUserInfoFromHeaders } from '@/lib/audit-logger'
import { z } from 'zod'

// Validation schema
const updateDeductionSchema = z.object({
  name: z.string().min(1, 'Name is required').optional(),
  amount: z.number().nonnegative('Amount must be non-negative').optional(),
  isActive: z.boolean().optional(),
})

type RouteContext = {
  params: Promise<{
    id: string
  }>
}

// PATCH /api/payroll/deduction/[id] - Update deduction
type UserDeductionParams = { id: string };

export async function PATCH(
  request: NextRequest,
  context: RouteContext
) {
  try {
    const { id } = await context.params

    const body = await request.json()
    const data = updateDeductionSchema.parse(body)

    const headers = request.headers
    const { userId, userSnapshot } = getUserInfoFromHeaders(headers)

    // Get existing deduction for audit log
    const existingDeduction = await prisma.userDeduction.findUnique({
      where: { id },
      include: { user: true },
    })

    if (!existingDeduction) {
      return NextResponse.json(
        { ok: false, error: 'Deduction not found' },
        { status: 404 }
      )
    }

    // Update deduction
    const updatedDeduction = await prisma.userDeduction.update({
      where: { id },
      data,
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
        actionType: 'UPDATE',
        entityType: 'UserDeduction',
        entityId: updatedDeduction.id,
        description: `Updated deduction "${updatedDeduction.name}"`,
        previousData: existingDeduction as any,
        newData: updatedDeduction as any,
        ipAddress: request.ip ?? headers.get('x-forwarded-for') ?? undefined,
        userAgent: headers.get('user-agent') ?? undefined,
      })
    } catch (e) {
      console.warn('Audit log failed (update user deduction):', e)
    }

    // Format dates
    const formattedDeduction = {
      ...updatedDeduction,
      createdAt: updatedDeduction.createdAt.toISOString(),
      updatedAt: updatedDeduction.updatedAt.toISOString(),
    }

    return NextResponse.json({
      ok: true,
      data: formattedDeduction,
      message: 'Deduction updated successfully',
    })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { ok: false, error: 'Validation error', details: error.errors },
        { status: 400 }
      )
    }
    console.error('Error updating user deduction:', error)
    return NextResponse.json(
      { ok: false, error: 'Failed to update user deduction' },
      { status: 500 }
    )
  }
}

// DELETE /api/payroll/deduction/[id] - Delete deduction
export async function DELETE(
  request: NextRequest,
  context: RouteContext
) {
  try {
    const { id } = await context.params

    const headers = request.headers
    const { userId, userSnapshot } = getUserInfoFromHeaders(headers)

    // Get existing deduction for audit log
    const existingDeduction = await prisma.userDeduction.findUnique({
      where: { id },
      include: { user: true },
    })

    if (!existingDeduction) {
      return NextResponse.json(
        { ok: false, error: 'Deduction not found' },
        { status: 404 }
      )
    }

    // Delete deduction
    await prisma.userDeduction.delete({
      where: { id },
    })

    // Audit log
    try {
      await createAuditLog({
        userId: userId || 'system',
        userSnapshot,
        actionType: 'DELETE',
        entityType: 'UserDeduction',
        entityId: id,
        description: `Deleted deduction "${existingDeduction.name}"`,
        previousData: existingDeduction as any,
        newData: null,
        ipAddress: request.ip ?? headers.get('x-forwarded-for') ?? undefined,
        userAgent: headers.get('user-agent') ?? undefined,
      })
    } catch (e) {
      console.warn('Audit log failed (delete user deduction):', e)
    }

    return NextResponse.json({
      ok: true,
      message: 'Deduction deleted successfully',
    })
  } catch (error) {
    console.error('Error deleting user deduction:', error)
    return NextResponse.json(
      { ok: false, error: 'Failed to delete user deduction' },
      { status: 500 }
    )
  }
}

