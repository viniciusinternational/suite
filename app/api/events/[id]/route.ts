import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { createAuditLog } from '@/lib/audit-logger'
import { z } from 'zod'

const updateEventSchema = z.object({
  title: z.string().min(1).optional(),
  description: z.string().optional(),
  tags: z.array(z.string()).optional(),
  link: z.string().url().optional().or(z.literal('')).optional(),
  startDateTime: z.string().datetime().optional(),
  endDateTime: z.string().datetime().optional(),
  userIds: z.array(z.string()).optional(),
  departmentIds: z.array(z.string()).optional(),
  unitIds: z.array(z.string()).optional(),
})

// GET /api/events/[id]
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const event = await prisma.event.findUnique({
      where: { id },
      include: {
        users: { select: { id: true, fullName: true, email: true, role: true } },
        departments: { select: { id: true, name: true, code: true } },
        units: { select: { id: true, name: true, departmentId: true } },
        createdBy: { select: { id: true, fullName: true, email: true } },
      },
    })

    if (!event) {
      return NextResponse.json({ ok: false, error: 'Event not found' }, { status: 404 })
    }

    return NextResponse.json({ ok: true, data: event })
  } catch (error) {
    console.error('Error fetching event:', error)
    return NextResponse.json({ ok: false, error: 'Failed to fetch event' }, { status: 500 })
  }
}

// PATCH /api/events/[id]
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const body = await request.json()
    const data = updateEventSchema.parse(body)

    const existing = await prisma.event.findUnique({ where: { id } })
    if (!existing) {
      return NextResponse.json({ ok: false, error: 'Event not found' }, { status: 404 })
    }

    const start = data.startDateTime ? new Date(data.startDateTime) : new Date(existing.startDateTime)
    const end = data.endDateTime ? new Date(data.endDateTime) : new Date(existing.endDateTime)
    if (end <= start) {
      return NextResponse.json({ ok: false, error: 'End must be after start' }, { status: 400 })
    }

    const previous = await prisma.event.findUnique({ where: { id } })
    const updated = await prisma.event.update({
      where: { id },
      data: {
        title: data.title ?? undefined,
        description: data.description ?? undefined,
        tags: data.tags ?? undefined,
        link: data.link || undefined,
        startDateTime: data.startDateTime ? start : undefined,
        endDateTime: data.endDateTime ? end : undefined,
        users: data.userIds ? { set: data.userIds.map((uid) => ({ id: uid })) } : undefined,
        departments: data.departmentIds ? { set: data.departmentIds.map((did) => ({ id: did })) } : undefined,
        units: data.unitIds ? { set: data.unitIds.map((uid) => ({ id: uid })) } : undefined,
      },
      include: {
        users: { select: { id: true, fullName: true, email: true, role: true } },
        departments: { select: { id: true, name: true, code: true } },
        units: { select: { id: true, name: true, departmentId: true } },
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
        entityType: 'Event',
        entityId: updated.id,
        description: `Updated event "${updated.title}"`,
        previousData: previous as any,
        newData: updated as any,
        ipAddress: request.ip ?? headers.get('x-forwarded-for') ?? undefined,
        userAgent: headers.get('user-agent') ?? undefined,
      })
    } catch (e) {
      console.warn('Audit log failed (update event):', e)
    }

    return NextResponse.json({ ok: true, data: updated, message: 'Event updated successfully' })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ ok: false, error: 'Validation error', details: error.errors }, { status: 400 })
    }
    console.error('Error updating event:', error)
    return NextResponse.json({ ok: false, error: 'Failed to update event' }, { status: 500 })
  }
}

// DELETE /api/events/[id]
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const existing = await prisma.event.findUnique({ where: { id } })
    if (!existing) {
      return NextResponse.json({ ok: false, error: 'Event not found' }, { status: 404 })
    }

    await prisma.event.delete({ where: { id } })

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
        entityType: 'Event',
        entityId: id,
        description: `Deleted event "${existing.title}"`,
        previousData: existing as any,
        newData: null,
        ipAddress: request.ip ?? headers.get('x-forwarded-for') ?? undefined,
        userAgent: headers.get('user-agent') ?? undefined,
      })
    } catch (e) {
      console.warn('Audit log failed (delete event):', e)
    }

    return NextResponse.json({ ok: true, message: 'Event deleted successfully' })
  } catch (error) {
    console.error('Error deleting event:', error)
    return NextResponse.json({ ok: false, error: 'Failed to delete event' }, { status: 500 })
  }
}


