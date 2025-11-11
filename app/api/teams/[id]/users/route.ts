import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { createAuditLog, getUserInfoFromHeaders } from '@/lib/audit-logger'
import { z } from 'zod'

const addUsersSchema = z.object({
  userIds: z.array(z.string()).min(1, 'At least one user is required'),
})

// POST /api/teams/[id]/users - Add users to team
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const body = await request.json()
    const data = addUsersSchema.parse(body)
    const headers = request.headers
    const { userId, userSnapshot } = getUserInfoFromHeaders(headers)

    // Check if team exists
    const team = await prisma.team.findUnique({
      where: { id },
      include: { users: { select: { id: true } } },
    })

    if (!team) {
      return NextResponse.json({ ok: false, error: 'Team not found' }, { status: 404 })
    }

    // Validate users exist and are active
    const users = await prisma.user.findMany({
      where: {
        id: { in: data.userIds },
      },
      select: { id: true, fullName: true, isActive: true },
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

    // Filter out users already in the team
    const existingUserIds = new Set(team.users.map((u) => u.id))
    const newUserIds = data.userIds.filter((uid) => !existingUserIds.has(uid))

    if (newUserIds.length === 0) {
      return NextResponse.json(
        {
          ok: false,
          error: 'All selected users are already in the team',
        },
        { status: 400 }
      )
    }

    // Add users to team
    const updated = await prisma.team.update({
      where: { id },
      data: {
        users: {
          connect: newUserIds.map((uid) => ({ id: uid })),
        },
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
      const addedUsers = users.filter((u) => newUserIds.includes(u.id))
      await createAuditLog({
        userId: userId || 'system',
        userSnapshot,
        actionType: 'UPDATE',
        entityType: 'Team',
        entityId: id,
        description: `Added ${newUserIds.length} user(s) to team "${team.title}": ${addedUsers.map((u) => u.fullName).join(', ')}`,
        previousData: team as any,
        newData: updated as any,
        ipAddress: request.ip ?? headers.get('x-forwarded-for') ?? undefined,
        userAgent: headers.get('user-agent') ?? undefined,
      })
    } catch (e) {
      console.error('Audit log failed (add users to team):', e)
    }

    return NextResponse.json({
      ok: true,
      data: updated,
      message: `Added ${newUserIds.length} user(s) to team`,
    })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ ok: false, error: 'Validation error', details: error.errors }, { status: 400 })
    }
    console.error('Error adding users to team:', error)
    return NextResponse.json({ ok: false, error: 'Failed to add users to team' }, { status: 500 })
  }
}

// DELETE /api/teams/[id]/users - Remove users from team
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const { searchParams } = new URL(request.url)
    const userIdParam = searchParams.get('userId')
    const headers = request.headers
    const { userId, userSnapshot } = getUserInfoFromHeaders(headers)

    if (!userIdParam) {
      return NextResponse.json({ ok: false, error: 'userId query parameter is required' }, { status: 400 })
    }

    // Check if team exists
    const team = await prisma.team.findUnique({
      where: { id },
      include: {
        users: {
          select: { id: true, fullName: true },
        },
      },
    })

    if (!team) {
      return NextResponse.json({ ok: false, error: 'Team not found' }, { status: 404 })
    }

    // Check if user is in the team
    const userInTeam = team.users.find((u) => u.id === userIdParam)
    if (!userInTeam) {
      return NextResponse.json(
        {
          ok: false,
          error: 'User is not a member of this team',
        },
        { status: 400 }
      )
    }

    // Remove user from team
    const updated = await prisma.team.update({
      where: { id },
      data: {
        users: {
          disconnect: { id: userIdParam },
        },
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
        entityId: id,
        description: `Removed user "${userInTeam.fullName}" from team "${team.title}"`,
        previousData: team as any,
        newData: updated as any,
        ipAddress: request.ip ?? headers.get('x-forwarded-for') ?? undefined,
        userAgent: headers.get('user-agent') ?? undefined,
      })
    } catch (e) {
      console.error('Audit log failed (remove user from team):', e)
    }

    return NextResponse.json({
      ok: true,
      data: updated,
      message: 'User removed from team',
    })
  } catch (error) {
    console.error('Error removing user from team:', error)
    return NextResponse.json({ ok: false, error: 'Failed to remove user from team' }, { status: 500 })
  }
}

