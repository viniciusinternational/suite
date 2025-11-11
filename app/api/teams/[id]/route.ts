import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { createAuditLog, getUserInfoFromHeaders } from '@/lib/audit-logger'
import { z } from 'zod'

const updateTeamSchema = z.object({
  title: z.string().min(1).optional(),
  purpose: z.string().optional(),
  leaderId: z.string().optional(),
  userIds: z.array(z.string()).optional(),
  taskIds: z.array(z.string()).optional(),
  isActive: z.boolean().optional(),
})

// GET /api/teams/[id]
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const team = await prisma.team.findUnique({
      where: { id },
      include: {
        leader: {
          select: {
            id: true,
            fullName: true,
            email: true,
            role: true,
            avatar: true,
          },
        },
        users: {
          select: {
            id: true,
            fullName: true,
            email: true,
            role: true,
            avatar: true,
            position: true,
          },
        },
        tasks: {
          select: {
            id: true,
            name: true,
            status: true,
            priority: true,
            dueDate: true,
            projectId: true,
          },
        },
      },
    })

    if (!team) {
      return NextResponse.json({ ok: false, error: 'Team not found' }, { status: 404 })
    }

    return NextResponse.json({ ok: true, data: team })
  } catch (error) {
    console.error('Error fetching team:', error)
    return NextResponse.json({ ok: false, error: 'Failed to fetch team' }, { status: 500 })
  }
}

// PUT /api/teams/[id]
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const body = await request.json()
    const data = updateTeamSchema.parse(body)
    const headers = request.headers
    const { userId, userSnapshot } = getUserInfoFromHeaders(headers)

    const existing = await prisma.team.findUnique({ where: { id } })
    if (!existing) {
      return NextResponse.json({ ok: false, error: 'Team not found' }, { status: 404 })
    }

    // Validate leader if provided
    let leaderId = existing.leaderId
    if (data.leaderId !== undefined) {
      if (data.leaderId === null || data.leaderId === 'none') {
        leaderId = null
      } else {
        const leader = await prisma.user.findUnique({
          where: { id: data.leaderId },
          select: { id: true, isActive: true },
        })

        if (!leader) {
          return NextResponse.json(
            {
              ok: false,
              error: 'Selected team leader does not exist',
            },
            { status: 400 }
          )
        }

        if (!leader.isActive) {
          return NextResponse.json(
            {
              ok: false,
              error: 'Selected team leader is not active',
            },
            { status: 400 }
          )
        }

        leaderId = data.leaderId
      }
    }

    // Validate users if provided
    if (data.userIds !== undefined) {
      const users = await prisma.user.findMany({
        where: {
          id: { in: data.userIds },
        },
        select: { id: true, isActive: true },
      })

      if (users.length !== data.userIds.length) {
        return NextResponse.json(
          {
            ok: false,
            error: 'One or more users do not exist',
          },
          { status: 400 }
        )
      }

      const inactiveUsers = users.filter((u) => !u.isActive)
      if (inactiveUsers.length > 0) {
        return NextResponse.json(
          {
            ok: false,
            error: 'One or more users are not active',
          },
          { status: 400 }
        )
      }
    }

    // Validate tasks if provided
    if (data.taskIds !== undefined) {
      const tasks = await prisma.task.findMany({
        where: {
          id: { in: data.taskIds },
        },
        select: { id: true },
      })

      if (tasks.length !== data.taskIds.length) {
        return NextResponse.json(
          {
            ok: false,
            error: 'One or more tasks do not exist',
          },
          { status: 400 }
        )
      }
    }

    const previous = await prisma.team.findUnique({
      where: { id },
      include: {
        users: true,
        tasks: true,
      },
    })

    const updated = await prisma.team.update({
      where: { id },
      data: {
        title: data.title ?? undefined,
        purpose: data.purpose ?? undefined,
        leaderId: leaderId !== existing.leaderId ? leaderId : undefined,
        isActive: data.isActive ?? undefined,
        users: data.userIds !== undefined
          ? { set: data.userIds.map((uid) => ({ id: uid })) }
          : undefined,
        tasks: data.taskIds !== undefined
          ? { set: data.taskIds.map((tid) => ({ id: tid })) }
          : undefined,
      },
      include: {
        leader: {
          select: {
            id: true,
            fullName: true,
            email: true,
            role: true,
            avatar: true,
          },
        },
        users: {
          select: {
            id: true,
            fullName: true,
            email: true,
            role: true,
            avatar: true,
            position: true,
          },
        },
        tasks: {
          select: {
            id: true,
            name: true,
            status: true,
            priority: true,
            dueDate: true,
            projectId: true,
          },
        },
      },
    })

    // Audit log (best-effort)
    try {
      await createAuditLog({
        userId: userId || 'system',
        userSnapshot,
        actionType: 'UPDATE',
        entityType: 'Team',
        entityId: updated.id,
        description: `Updated team "${updated.title}"`,
        previousData: previous as any,
        newData: updated as any,
        ipAddress: request.ip ?? headers.get('x-forwarded-for') ?? undefined,
        userAgent: headers.get('user-agent') ?? undefined,
      })
    } catch (e) {
      console.error('Audit log failed (update team):', e)
    }

    return NextResponse.json({ ok: true, data: updated, message: 'Team updated successfully' })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ ok: false, error: 'Validation error', details: error.errors }, { status: 400 })
    }
    console.error('Error updating team:', error)
    return NextResponse.json({ ok: false, error: 'Failed to update team' }, { status: 500 })
  }
}

// DELETE /api/teams/[id]
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const headers = request.headers
    const { userId, userSnapshot } = getUserInfoFromHeaders(headers)

    const existing = await prisma.team.findUnique({
      where: { id },
      include: {
        users: true,
        tasks: true,
      },
    })

    if (!existing) {
      return NextResponse.json({ ok: false, error: 'Team not found' }, { status: 404 })
    }

    await prisma.team.delete({ where: { id } })

    // Audit log (best-effort)
    try {
      await createAuditLog({
        userId: userId || 'system',
        userSnapshot,
        actionType: 'DELETE',
        entityType: 'Team',
        entityId: id,
        description: `Deleted team "${existing.title}"`,
        previousData: existing as any,
        newData: null,
        ipAddress: request.ip ?? headers.get('x-forwarded-for') ?? undefined,
        userAgent: headers.get('user-agent') ?? undefined,
      })
    } catch (e) {
      console.error('Audit log failed (delete team):', e)
    }

    return NextResponse.json({ ok: true, message: 'Team deleted successfully' })
  } catch (error) {
    console.error('Error deleting team:', error)
    return NextResponse.json({ ok: false, error: 'Failed to delete team' }, { status: 500 })
  }
}

