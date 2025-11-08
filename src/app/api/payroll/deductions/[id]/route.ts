import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { createAuditLog, getUserInfoFromHeaders } from '@/lib/audit-logger'
import { z } from 'zod'

// Validation schema
const updateDeductionSchema = z.object({
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

// GET /api/payroll/deductions/[id] - Get single deduction
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const deduction = await prisma.deduction.findUnique({
      where: { id: params.id },
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

    if (!deduction) {
      return NextResponse.json(
        { ok: false, error: 'Deduction not found' },
        { status: 404 }
      )
    }

    // Format dates
    const formattedDeduction = {
      ...deduction,
      startDate: deduction.startDate?.toISOString() || null,
      endDate: deduction.endDate?.toISOString() || null,
      createdAt: deduction.createdAt.toISOString(),
      updatedAt: deduction.updatedAt.toISOString(),
    }

    return NextResponse.json({ ok: true, data: formattedDeduction })
  } catch (error) {
    console.error('Error fetching deduction:', error)
    return NextResponse.json(
      { ok: false, error: 'Failed to fetch deduction' },
      { status: 500 }
    )
  }
}

// PATCH /api/payroll/deductions/[id] - Update deduction
export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const body = await request.json()
    const data = updateDeductionSchema.parse(body)

    const headers = request.headers
    const { userId, userSnapshot } = getUserInfoFromHeaders(headers)

    // Get existing deduction for audit log
    const existingDeduction = await prisma.deduction.findUnique({
      where: { id: params.id },
      include: { users: true },
    })

    if (!existingDeduction) {
      return NextResponse.json(
        { ok: false, error: 'Deduction not found' },
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

    // Update deduction
    const updatedDeduction = await prisma.deduction.update({
      where: { id: params.id },
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
        entityType: 'Deduction',
        entityId: updatedDeduction.id,
        description: `Updated deduction "${updatedDeduction.title}"`,
        previousData: existingDeduction as any,
        newData: updatedDeduction as any,
        ipAddress: request.ip ?? headers.get('x-forwarded-for') ?? undefined,
        userAgent: headers.get('user-agent') ?? undefined,
      })
    } catch (e) {
      console.warn('Audit log failed (update deduction):', e)
    }

    // Format dates
    const formattedDeduction = {
      ...updatedDeduction,
      startDate: updatedDeduction.startDate?.toISOString() || null,
      endDate: updatedDeduction.endDate?.toISOString() || null,
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
    console.error('Error updating deduction:', error)
    return NextResponse.json(
      { ok: false, error: 'Failed to update deduction' },
      { status: 500 }
    )
  }
}

// DELETE /api/payroll/deductions/[id] - Delete deduction
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const headers = request.headers
    const { userId, userSnapshot } = getUserInfoFromHeaders(headers)

    // Get existing deduction for audit log
    const existingDeduction = await prisma.deduction.findUnique({
      where: { id: params.id },
    })

    if (!existingDeduction) {
      return NextResponse.json(
        { ok: false, error: 'Deduction not found' },
        { status: 404 }
      )
    }

    // Delete deduction
    await prisma.deduction.delete({
      where: { id: params.id },
    })

    // Audit log
    try {
      await createAuditLog({
        userId: userId || 'system',
        userSnapshot,
        actionType: 'DELETE',
        entityType: 'Deduction',
        entityId: params.id,
        description: `Deleted deduction "${existingDeduction.title}"`,
        previousData: existingDeduction as any,
        newData: null,
        ipAddress: request.ip ?? headers.get('x-forwarded-for') ?? undefined,
        userAgent: headers.get('user-agent') ?? undefined,
      })
    } catch (e) {
      console.warn('Audit log failed (delete deduction):', e)
    }

    return NextResponse.json({
      ok: true,
      message: 'Deduction deleted successfully',
    })
  } catch (error) {
    console.error('Error deleting deduction:', error)
    return NextResponse.json(
      { ok: false, error: 'Failed to delete deduction' },
      { status: 500 }
    )
  }
}

