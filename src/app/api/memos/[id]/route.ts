import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { createAuditLog } from '@/lib/audit-logger'
import { z } from 'zod'

const updateMemoSchema = z.object({
  title: z.string().min(1).optional(),
  content: z.string().min(1).optional(),
  priority: z.enum(['low', 'medium', 'high', 'urgent']).optional(),
  isActive: z.boolean().optional(),
  expiresAt: z.string().datetime().optional().or(z.literal('').optional()),
  userIds: z.array(z.string()).optional(),
  departmentIds: z.array(z.string()).optional(),
})

// GET /api/memos/[id]
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const memo = await prisma.memo.findUnique({
      where: { id },
      include: {
        users: { select: { id: true, fullName: true, email: true, role: true } },
        departments: { select: { id: true, name: true, code: true } },
        createdBy: { select: { id: true, fullName: true, email: true } },
      },
    })

    if (!memo) {
      return NextResponse.json({ ok: false, error: 'Memo not found' }, { status: 404 })
    }

    return NextResponse.json({ ok: true, data: memo })
  } catch (error) {
    console.error('Error fetching memo:', error)
    return NextResponse.json({ ok: false, error: 'Failed to fetch memo' }, { status: 500 })
  }
}

// PATCH /api/memos/[id]
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const body = await request.json()
    const data = updateMemoSchema.parse(body)

    const existing = await prisma.memo.findUnique({ where: { id } })
    if (!existing) {
      return NextResponse.json({ ok: false, error: 'Memo not found' }, { status: 404 })
    }

    const previous = await prisma.memo.findUnique({ where: { id } })
    const updated = await prisma.memo.update({
      where: { id },
      data: {
        title: data.title ?? undefined,
        content: data.content ?? undefined,
        priority: data.priority ?? undefined,
        isActive: data.isActive ?? undefined,
        expiresAt: data.expiresAt ? new Date(data.expiresAt) : data.expiresAt === '' ? null : undefined,
        users: data.userIds ? { set: data.userIds.map((uid) => ({ id: uid })) } : undefined,
        departments: data.departmentIds ? { set: data.departmentIds.map((did) => ({ id: did })) } : undefined,
      },
      include: {
        users: { select: { id: true, fullName: true, email: true, role: true } },
        departments: { select: { id: true, name: true, code: true } },
        createdBy: { select: { id: true, fullName: true, email: true } },
      },
    })

    // Audit log (best-effort)
    try {
      const headers = request.headers
      const userId = headers.get('x-user-id') || ''
      const userSnapshot = {
        id: userId,
        fullName: headers.get('x-user-fullname') || 'Unknown',
        email: headers.get('x-user-email') || 'unknown@example.com',
        role: headers.get('x-user-role') || 'unknown',
        departmentId: headers.get('x-user-department-id') || undefined,
      }
      await createAuditLog({
        userId: userId || 'system',
        userSnapshot,
        actionType: 'UPDATE',
        entityType: 'Memo',
        entityId: updated.id,
        description: `Updated memo "${updated.title}"`,
        previousData: previous as any,
        newData: updated as any,
        ipAddress: request.ip ?? headers.get('x-forwarded-for') ?? undefined,
        userAgent: headers.get('user-agent') ?? undefined,
      })
    } catch (e) {
      console.warn('Audit log failed (update memo):', e)
    }

    return NextResponse.json({ ok: true, data: updated, message: 'Memo updated successfully' })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ ok: false, error: 'Validation error', details: error.errors }, { status: 400 })
    }
    console.error('Error updating memo:', error)
    return NextResponse.json({ ok: false, error: 'Failed to update memo' }, { status: 500 })
  }
}

// DELETE /api/memos/[id]
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const existing = await prisma.memo.findUnique({ where: { id } })
    if (!existing) {
      return NextResponse.json({ ok: false, error: 'Memo not found' }, { status: 404 })
    }

    await prisma.memo.delete({ where: { id } })

    // Audit log (best-effort)
    try {
      const headers = request.headers
      const userId = headers.get('x-user-id') || ''
      const userSnapshot = {
        id: userId,
        fullName: headers.get('x-user-fullname') || 'Unknown',
        email: headers.get('x-user-email') || 'unknown@example.com',
        role: headers.get('x-user-role') || 'unknown',
        departmentId: headers.get('x-user-department-id') || undefined,
      }
      await createAuditLog({
        userId: userId || 'system',
        userSnapshot,
        actionType: 'DELETE',
        entityType: 'Memo',
        entityId: id,
        description: `Deleted memo "${existing.title}"`,
        previousData: existing as any,
        newData: null,
        ipAddress: request.ip ?? headers.get('x-forwarded-for') ?? undefined,
        userAgent: headers.get('user-agent') ?? undefined,
      })
    } catch (e) {
      console.warn('Audit log failed (delete memo):', e)
    }

    return NextResponse.json({ ok: true, message: 'Memo deleted successfully' })
  } catch (error) {
    console.error('Error deleting memo:', error)
    return NextResponse.json({ ok: false, error: 'Failed to delete memo' }, { status: 500 })
  }
}


