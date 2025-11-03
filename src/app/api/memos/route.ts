import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { createAuditLog } from '@/lib/audit-logger'
import { z } from 'zod'

// Validation schemas
const memoBodySchema = z.object({
  title: z.string().min(1, 'Title is required'),
  content: z.string().min(1, 'Content is required'),
  priority: z.enum(['low', 'medium', 'high', 'urgent']).default('medium'),
  expiresAt: z.string().datetime().optional().or(z.literal('').optional()),
  userIds: z.array(z.string()).optional(),
  departmentIds: z.array(z.string()).optional(),
})

// GET /api/memos - list memos with filters
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const targetUserId = searchParams.get('targetUserId') || undefined
    const targetDepartmentId = searchParams.get('targetDepartmentId') || undefined
    const isActive = searchParams.get('isActive')
    const priority = searchParams.get('priority') || undefined

    // Get current user ID from headers
    const headers = request.headers
    const currentUserId = headers.get('x-user-id')

    const where: any = {}

    // Filter by target user
    if (targetUserId) {
      where.users = { some: { id: targetUserId } }
    }

    // Filter by target department
    if (targetDepartmentId) {
      where.departments = { some: { id: targetDepartmentId } }
    }

    // Filter by active status
    if (isActive !== null) {
      where.isActive = isActive === 'true'
    }

    // Filter by priority
    if (priority) {
      where.priority = priority
    }

    // If currentUserId is provided, only show memos targeted to this user or their department
    if (currentUserId) {
      where.OR = [
        { users: { some: { id: currentUserId } } },
        { departments: { some: { users: { some: { id: currentUserId } } } } },
        // Also include memos created by the current user
        { createdById: currentUserId },
      ]
    }

    // Filter out expired memos
    where.AND = [
      {
        OR: [
          { expiresAt: null },
          { expiresAt: { gt: new Date() } },
        ],
      },
    ]

    const memos = await prisma.memo.findMany({
      where,
      include: {
        users: { select: { id: true, fullName: true, email: true, role: true } },
        departments: { select: { id: true, name: true, code: true } },
        createdBy: { select: { id: true, fullName: true, email: true } },
      },
      orderBy: [
        { priority: 'desc' }, // urgent, high, medium, low
        { createdAt: 'desc' },
      ],
    })

    return NextResponse.json({ ok: true, data: memos })
  } catch (error) {
    console.error('Error fetching memos:', error)
    return NextResponse.json({ ok: false, error: 'Failed to fetch memos' }, { status: 500 })
  }
}

// POST /api/memos - create memo
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const data = memoBodySchema.parse(body)

    const headers = request.headers
    const actorUserId = headers.get('x-user-id') || undefined

    // Check if user has permission to create memos (could check permissions here)

    const created = await prisma.memo.create({
      data: {
        title: data.title,
        content: data.content,
        priority: data.priority,
        expiresAt: data.expiresAt ? new Date(data.expiresAt) : undefined,
        createdById: actorUserId,
        users: data.userIds && data.userIds.length ? { connect: data.userIds.map((id) => ({ id })) } : undefined,
        departments: data.departmentIds && data.departmentIds.length ? { connect: data.departmentIds.map((id) => ({ id })) } : undefined,
      },
      include: {
        users: { select: { id: true, fullName: true, email: true, role: true } },
        departments: { select: { id: true, name: true, code: true } },
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
        entityType: 'Memo',
        entityId: created.id,
        description: `Created memo "${created.title}" with priority ${created.priority}`,
        previousData: null,
        newData: created as any,
        ipAddress: request.ip ?? headers.get('x-forwarded-for') ?? undefined,
        userAgent: headers.get('user-agent') ?? undefined,
      })
    } catch (e) {
      console.warn('Audit log failed (create memo):', e)
    }

    return NextResponse.json({ ok: true, data: created, message: 'Memo created successfully' })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ ok: false, error: 'Validation error', details: error.errors }, { status: 400 })
    }
    console.error('Error creating memo:', error)
    return NextResponse.json({ ok: false, error: 'Failed to create memo' }, { status: 500 })
  }
}


