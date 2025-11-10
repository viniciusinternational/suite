import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { createAuditLog, getUserInfoFromHeaders } from '@/lib/audit-logger'
import { z } from 'zod'

// Validation schema
const updateAllowanceSchema = z.object({
  name: z.string().min(1, 'Name is required').optional(),
  amount: z.number().nonnegative('Amount must be non-negative').optional(),
  isActive: z.boolean().optional(),
})

// PATCH /api/payroll/allowance/[id] - Update allowance
type UserAllowanceParams = { id: string };

export async function PATCH(
  request: NextRequest,
  context: { params: Promise<UserAllowanceParams> }
) {
  try {
    const { id } = await context.params;
    const body = await request.json()
    const data = updateAllowanceSchema.parse(body)

    const headers = request.headers
    const { userId, userSnapshot } = getUserInfoFromHeaders(headers)

    // Get existing allowance for audit log
    const existingAllowance = await prisma.userAllowance.findUnique({
      where: { id },
      include: { user: true },
    })

    if (!existingAllowance) {
      return NextResponse.json(
        { ok: false, error: 'Allowance not found' },
        { status: 404 }
      )
    }

    // Update allowance
    const updatedAllowance = await prisma.userAllowance.update({
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
        entityType: 'UserAllowance',
        entityId: updatedAllowance.id,
        description: `Updated allowance "${updatedAllowance.name}"`,
        previousData: existingAllowance as any,
        newData: updatedAllowance as any,
        ipAddress: request.ip ?? headers.get('x-forwarded-for') ?? undefined,
        userAgent: headers.get('user-agent') ?? undefined,
      })
    } catch (e) {
      console.warn('Audit log failed (update user allowance):', e)
    }

    // Format dates
    const formattedAllowance = {
      ...updatedAllowance,
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
    console.error('Error updating user allowance:', error)
    return NextResponse.json(
      { ok: false, error: 'Failed to update user allowance' },
      { status: 500 }
    )
  }
}

// DELETE /api/payroll/allowance/[id] - Delete allowance
export async function DELETE(
  request: NextRequest,
  context: { params: Promise<UserAllowanceParams> }
) {
  try {
    const { id } = await context.params;
    const headers = request.headers
    const { userId, userSnapshot } = getUserInfoFromHeaders(headers)

    // Get existing allowance for audit log
    const existingAllowance = await prisma.userAllowance.findUnique({
      where: { id },
      include: { user: true },
    })

    if (!existingAllowance) {
      return NextResponse.json(
        { ok: false, error: 'Allowance not found' },
        { status: 404 }
      )
    }

    // Delete allowance
    await prisma.userAllowance.delete({
      where: { id },
    })

    // Audit log
    try {
      await createAuditLog({
        userId: userId || 'system',
        userSnapshot,
        actionType: 'DELETE',
        entityType: 'UserAllowance',
        entityId: id,
        description: `Deleted allowance "${existingAllowance.name}"`,
        previousData: existingAllowance as any,
        newData: null,
        ipAddress: request.ip ?? headers.get('x-forwarded-for') ?? undefined,
        userAgent: headers.get('user-agent') ?? undefined,
      })
    } catch (e) {
      console.warn('Audit log failed (delete user allowance):', e)
    }

    return NextResponse.json({
      ok: true,
      message: 'Allowance deleted successfully',
    })
  } catch (error) {
    console.error('Error deleting user allowance:', error)
    return NextResponse.json(
      { ok: false, error: 'Failed to delete user allowance' },
      { status: 500 }
    )
  }
}

