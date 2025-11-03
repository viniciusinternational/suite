import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { createAuditLog, getUserInfoFromHeaders } from '@/lib/audit-logger'
import { z } from 'zod'

// Validation schemas
const createTeamSchema = z.object({
  title: z.string().min(1, 'Team title is required'),
  purpose: z.string().optional(),
  leaderId: z.string().optional(),
  userIds: z.array(z.string()).optional(),
  taskIds: z.array(z.string()).optional(),
  isActive: z.boolean().default(true),
})

// GET /api/teams - List all teams
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const q = searchParams.get('q') || undefined
    const includeInactive = searchParams.get('includeInactive') === 'true'

    const where: any = {}

    if (q) {
      where.OR = [
        { title: { contains: q, mode: 'insensitive' } },
        { purpose: { contains: q, mode: 'insensitive' } },
      ]
    }

    if (!includeInactive) {
      where.isActive = true
    }

    const teams = await prisma.team.findMany({
      where,
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
      orderBy: {
        createdAt: 'desc',
      },
    })

    return NextResponse.json({
      ok: true,
      data: teams,
    })
  } catch (error) {
    console.error('Error fetching teams:', error)
    return NextResponse.json(
      {
        ok: false,
        error: 'Failed to fetch teams',
      },
      { status: 500 }
    )
  }
}

// POST /api/teams - Create new team
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const validatedData = createTeamSchema.parse(body)
    const headers = request.headers
    const { userId, userSnapshot } = getUserInfoFromHeaders(headers)

    // Validate leader if provided
    let leaderId = null
    if (validatedData.leaderId && validatedData.leaderId !== 'none') {
      const leader = await prisma.user.findUnique({
        where: { id: validatedData.leaderId },
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

      leaderId = validatedData.leaderId
    }

    // Validate users if provided
    if (validatedData.userIds && validatedData.userIds.length > 0) {
      const users = await prisma.user.findMany({
        where: {
          id: { in: validatedData.userIds },
        },
        select: { id: true, isActive: true },
      })

      if (users.length !== validatedData.userIds.length) {
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
    if (validatedData.taskIds && validatedData.taskIds.length > 0) {
      const tasks = await prisma.task.findMany({
        where: {
          id: { in: validatedData.taskIds },
        },
        select: { id: true },
      })

      if (tasks.length !== validatedData.taskIds.length) {
        return NextResponse.json(
          {
            ok: false,
            error: 'One or more tasks do not exist',
          },
          { status: 400 }
        )
      }
    }

    const team = await prisma.team.create({
      data: {
        title: validatedData.title,
        purpose: validatedData.purpose || null,
        leaderId,
        isActive: validatedData.isActive,
        users: validatedData.userIds && validatedData.userIds.length > 0
          ? { connect: validatedData.userIds.map((id) => ({ id })) }
          : undefined,
        tasks: validatedData.taskIds && validatedData.taskIds.length > 0
          ? { connect: validatedData.taskIds.map((id) => ({ id })) }
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
        actionType: 'CREATE',
        entityType: 'Team',
        entityId: team.id,
        description: `Created team "${team.title}" with ${team.users.length} users and ${team.tasks.length} tasks`,
        previousData: null,
        newData: team as any,
        ipAddress: request.ip ?? headers.get('x-forwarded-for') ?? undefined,
        userAgent: headers.get('user-agent') ?? undefined,
      })
    } catch (e) {
      console.error('Audit log failed (create team):', e)
    }

    return NextResponse.json({
      ok: true,
      data: team,
      message: 'Team created successfully',
    })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        {
          ok: false,
          error: 'Validation error',
          details: error.errors,
        },
        { status: 400 }
      )
    }

    console.error('Error creating team:', error)
    return NextResponse.json(
      {
        ok: false,
        error: 'Failed to create team',
      },
      { status: 500 }
    )
  }
}

