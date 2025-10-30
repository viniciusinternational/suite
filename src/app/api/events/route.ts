import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { createAuditLog } from '@/lib/audit-logger'
import { z } from 'zod'

// Validation schemas
const eventBodySchema = z.object({
  title: z.string().min(1, 'Title is required'),
  description: z.string().optional(),
  tags: z.array(z.string()).default([]),
  link: z.string().url().optional().or(z.literal('')).optional(),
  startDateTime: z.string().datetime(),
  endDateTime: z.string().datetime(),
  userIds: z.array(z.string()).optional(),
  departmentIds: z.array(z.string()).optional(),
  unitIds: z.array(z.string()).optional(),
})

// GET /api/events - list events with filters
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const q = searchParams.get('q') || undefined
    const tag = searchParams.get('tag') || undefined
    const start = searchParams.get('start')
    const end = searchParams.get('end')

    const where: any = {}

    if (q) {
      where.OR = [
        { title: { contains: q, mode: 'insensitive' } },
        { description: { contains: q, mode: 'insensitive' } },
      ]
    }

    if (tag) {
      where.tags = { has: tag }
    }

    if (start || end) {
      where.AND = [
        start ? { endDateTime: { gte: new Date(start) } } : {},
        end ? { startDateTime: { lte: new Date(end) } } : {},
      ]
    }

    const events = await prisma.event.findMany({
      where,
      include: {
        users: { select: { id: true, fullName: true, email: true, role: true } },
        departments: { select: { id: true, name: true, code: true } },
        units: { select: { id: true, name: true, departmentId: true } },
        createdBy: { select: { id: true, fullName: true, email: true } },
      },
      orderBy: { startDateTime: 'asc' },
    })

    return NextResponse.json({ ok: true, data: events })
  } catch (error) {
    console.error('Error fetching events:', error)
    return NextResponse.json({ ok: false, error: 'Failed to fetch events' }, { status: 500 })
  }
}

// POST /api/events - create event
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const data = eventBodySchema.parse(body)

    const start = new Date(data.startDateTime)
    const end = new Date(data.endDateTime)
    if (!(start instanceof Date) || !(end instanceof Date) || isNaN(start.getTime()) || isNaN(end.getTime())) {
      return NextResponse.json({ ok: false, error: 'Invalid date format' }, { status: 400 })
    }
    if (end <= start) {
      return NextResponse.json({ ok: false, error: 'End must be after start' }, { status: 400 })
    }

    const headers = request.headers
    const actorUserId = headers.get('x-user-id') || undefined

    const created = await prisma.event.create({
      data: {
        title: data.title,
        description: data.description,
        tags: data.tags ?? [],
        link: data.link || undefined,
        startDateTime: start,
        endDateTime: end,
        createdById: actorUserId,
        users: data.userIds && data.userIds.length ? { connect: data.userIds.map((id) => ({ id })) } : undefined,
        departments: data.departmentIds && data.departmentIds.length ? { connect: data.departmentIds.map((id) => ({ id })) } : undefined,
        units: data.unitIds && data.unitIds.length ? { connect: data.unitIds.map((id) => ({ id })) } : undefined,
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
        actionType: 'CREATE',
        entityType: 'Event',
        entityId: created.id,
        description: `Created event "${created.title}" with ${created.users.length} users, ${created.departments.length} departments, ${created.units.length} units`,
        previousData: null,
        newData: created as any,
        ipAddress: request.ip ?? headers.get('x-forwarded-for') ?? undefined,
        userAgent: headers.get('user-agent') ?? undefined,
      })
    } catch (e) {
      console.warn('Audit log failed (create event):', e)
    }

    return NextResponse.json({ ok: true, data: created, message: 'Event created successfully' })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ ok: false, error: 'Validation error', details: error.errors }, { status: 400 })
    }
    console.error('Error creating event:', error)
    return NextResponse.json({ ok: false, error: 'Failed to create event' }, { status: 500 })
  }
}


