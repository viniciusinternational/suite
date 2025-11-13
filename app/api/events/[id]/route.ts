import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { createAuditLog } from '@/lib/audit-logger'
import { z } from 'zod'

const timeRegex = /^([01]\d|2[0-3]):([0-5]\d)$/

const updateEventSchema = z.object({
  title: z.string().min(1).optional(),
  description: z.string().optional(),
  tags: z.array(z.string()).optional(),
  link: z.string().url().optional().or(z.literal('')).optional(),
  startDateTime: z.string().datetime().optional(),
  endDateTime: z.string().datetime().optional(),
  endTime: z.string().regex(timeRegex, 'End time must be in HH:mm format').optional(),
  isAllDay: z.boolean().optional(),
  isGlobal: z.boolean().optional(),
  userIds: z.array(z.string()).optional(),
  departmentIds: z.array(z.string()).optional(),
  unitIds: z.array(z.string()).optional(),
})

const deriveEndDateTime = ({
  start,
  endTime,
  explicitEnd,
  isAllDay,
}: {
  start: Date
  endTime?: string
  explicitEnd?: Date
  isAllDay: boolean
}) => {
  if (isNaN(start.getTime())) {
    throw new Error('Invalid start date')
  }

  if (isAllDay) {
    const end = new Date(start.getTime())
    end.setUTCDate(end.getUTCDate() + 1)
    return end
  }

  if (endTime) {
    const [hours, minutes] = endTime.split(':').map(Number)
    const end = new Date(start.getTime())
    end.setHours(hours, minutes, 0, 0)
    if (end <= start) {
      throw new Error('End time must be after start time')
    }
    if (
      end.getFullYear() !== start.getFullYear() ||
      end.getMonth() !== start.getMonth() ||
      end.getDate() !== start.getDate()
    ) {
      throw new Error('End time must be on the same day as start time')
    }
    if (end.getTime() - start.getTime() > 24 * 60 * 60 * 1000) {
      throw new Error('Event duration cannot exceed 24 hours')
    }
    return end
  }

  if (explicitEnd) {
    if (isNaN(explicitEnd.getTime())) {
      throw new Error('Invalid end date')
    }
    if (explicitEnd <= start) {
      throw new Error('End must be after start')
    }
    if (
      explicitEnd.getFullYear() !== start.getFullYear() ||
      explicitEnd.getMonth() !== start.getMonth() ||
      explicitEnd.getDate() !== start.getDate()
    ) {
      throw new Error('End must be on the same calendar day as start')
    }
    if (explicitEnd.getTime() - start.getTime() > 24 * 60 * 60 * 1000) {
      throw new Error('Event duration cannot exceed 24 hours')
    }
    return explicitEnd
  }

  throw new Error('End time is required unless event is all-day')
}

const formatEndTime = (start: Date, end: Date, isAllDay: boolean) => {
  if (isAllDay) {
    return null
  }

  if (isNaN(start.getTime()) || isNaN(end.getTime())) {
    return null
  }

  if (
    end.getFullYear() !== start.getFullYear() ||
    end.getMonth() !== start.getMonth() ||
    end.getDate() !== start.getDate()
  ) {
    return null
  }

  const hours = end.getHours().toString().padStart(2, '0')
  const minutes = end.getMinutes().toString().padStart(2, '0')
  return `${hours}:${minutes}`
}

const normalizeEvent = (event: any) => {
  const start = new Date(event.startDateTime)
  const end = new Date(event.endDateTime)

  return {
    ...event,
    endTime: event.isAllDay ? null : event.endTime ?? formatEndTime(start, end, event.isAllDay),
  }
}

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

    return NextResponse.json({ ok: true, data: normalizeEvent(event) })
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
    const targetIsAllDay = data.isAllDay ?? existing.isAllDay

    if (isNaN(start.getTime())) {
      return NextResponse.json({ ok: false, error: 'Invalid start date' }, { status: 400 })
    }

    if (!targetIsAllDay && existing.isAllDay && data.endTime === undefined && data.endDateTime === undefined) {
      return NextResponse.json(
        { ok: false, error: 'End time is required when converting from all-day to timed event' },
        { status: 400 }
      )
    }

    let end: Date
    let normalizedEndTime: string | null
    try {
      if (targetIsAllDay) {
        end = deriveEndDateTime({ start, isAllDay: true })
        normalizedEndTime = null
      } else {
        const endTimeSource =
          data.endTime !== undefined
            ? data.endTime
            : existing.endTime !== null && existing.endTime !== undefined
            ? existing.endTime
            : undefined

        const explicitEndSource = data.endDateTime
          ? new Date(data.endDateTime)
          : data.endTime !== undefined
          ? undefined
          : new Date(existing.endDateTime)

        end = deriveEndDateTime({
          start,
          endTime: endTimeSource,
          explicitEnd: explicitEndSource,
          isAllDay: false,
        })

        normalizedEndTime = endTimeSource ?? formatEndTime(start, end, false) ?? undefined
        if (!normalizedEndTime) {
          throw new Error('End time could not be determined')
        }
      }
    } catch (dateError: any) {
      return NextResponse.json(
        { ok: false, error: dateError instanceof Error ? dateError.message : 'Invalid end time' },
        { status: 400 }
      )
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
        endDateTime: targetIsAllDay || data.endTime !== undefined || data.endDateTime !== undefined ? end : undefined,
        endTime: targetIsAllDay
          ? null
          : data.endTime !== undefined
          ? data.endTime
          : data.endDateTime !== undefined
          ? formatEndTime(start, end, false)
          : normalizedEndTime,
        isAllDay: targetIsAllDay,
        isGlobal: data.isGlobal ?? existing.isGlobal,
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
        ipAddress: headers.get('x-forwarded-for') ?? headers.get('x-real-ip') ?? undefined,
        userAgent: headers.get('user-agent') ?? undefined,
      })
    } catch (e) {
      console.warn('Audit log failed (update event):', e)
    }

    return NextResponse.json({ ok: true, data: normalizeEvent(updated), message: 'Event updated successfully' })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { ok: false, error: 'Validation error', details: error.issues },
        { status: 400 }
      )
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
        ipAddress: headers.get('x-forwarded-for') ?? headers.get('x-real-ip') ?? undefined,
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


