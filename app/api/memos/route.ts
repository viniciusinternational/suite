import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { createAuditLog, getUserInfoFromHeaders } from '@/lib/audit-logger'
import { z } from 'zod'

// Validation schemas
const memoBodySchema = z.object({
  title: z.string().min(1, 'Title is required'),
  content: z.string().min(1, 'Content is required'),
  priority: z.enum(['low', 'medium', 'high', 'urgent']).default('medium'),
  expiresAt: z.string().optional(),
  isGlobal: z.boolean().optional().default(false),
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

    // Build where clause conditions
    const conditions: any[] = []

    // Filter by target user
    if (targetUserId) {
      conditions.push({ users: { some: { id: targetUserId } } })
    }

    // Filter by target department
    if (targetDepartmentId) {
      conditions.push({ departments: { some: { id: targetDepartmentId } } })
    }

    // Filter by active status
    if (isActive !== null && isActive !== '') {
      conditions.push({ isActive: isActive === 'true' })
    }

    // Filter by priority
    if (priority) {
      conditions.push({ priority })
    }

    // If currentUserId is provided, only show memos targeted to this user or their department
    if (currentUserId) {
      // First, get the user's department
      const currentUser = await prisma.user.findUnique({
        where: { id: currentUserId },
        select: { departmentId: true }
      })
      
      const orConditions: any[] = [
        { users: { some: { id: currentUserId } } },
        // Also include memos created by the current user
        { createdById: currentUserId },
        // Global memos are visible to everyone
        { isGlobal: true },
      ]
      
      // If user belongs to a department, include memos targeted to that department
      if (currentUser?.departmentId) {
        orConditions.push({ departments: { some: { id: currentUser.departmentId } } })
      }
      
      conditions.push({ OR: orConditions })
    }

    // Only filter out expired memos when isActive is explicitly 'true'
    // When isActive is undefined or not 'true', show all memos including expired
    if (isActive === 'true') {
      conditions.push({
        OR: [
          { expiresAt: null },
          { expiresAt: { gt: new Date() } },
        ],
      })
    }

    // Build final where clause
    const where = conditions.length > 0 ? { AND: conditions } : {}

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
    const actorUserId = headers.get('x-user-id')?.trim() || undefined

    // Validate user exists if actorUserId is provided
    // If user doesn't exist, we'll just skip setting createdById (it's optional)
    let validCreatedById: string | undefined = undefined
    if (actorUserId) {
      const userExists = await prisma.user.findUnique({
        where: { id: actorUserId },
        select: { id: true }
      })
      
      if (userExists) {
        validCreatedById = actorUserId
      } else {
        // Log warning but don't fail - createdById is optional
        console.warn(`Warning: User ID ${actorUserId} from x-user-id header not found in database. Creating memo without creator.`)
      }
    }

    // When isGlobal is true, ignore userIds and departmentIds
    const isGlobal = data.isGlobal === true

    // Convert userIds (emails or IDs) to actual user IDs
    let resolvedUserIds: string[] = []
    if (!isGlobal && data.userIds && data.userIds.length > 0) {
      const validUserInputs = data.userIds.filter(input => input && input.trim())
      if (validUserInputs.length > 0) {
        // Check if inputs are emails (contain @) or IDs (CUID format)
        const emails = validUserInputs.filter(input => input.includes('@'))
        const possibleIds = validUserInputs.filter(input => !input.includes('@'))
        
        const userQueries: any[] = []
        
        // Query by emails
        if (emails.length > 0) {
          userQueries.push(
            prisma.user.findMany({
              where: { email: { in: emails } },
              select: { id: true, email: true }
            })
          )
        }
        
        // Query by IDs
        if (possibleIds.length > 0) {
          userQueries.push(
            prisma.user.findMany({
              where: { id: { in: possibleIds } },
              select: { id: true, email: true }
            })
          )
        }
        
        const userResults = await Promise.all(userQueries)
        const foundUsers = userResults.flat()
        resolvedUserIds = foundUsers.map(u => u.id)
        
        // Check if all inputs were resolved
        if (foundUsers.length !== validUserInputs.length) {
          const foundEmails = new Set(foundUsers.map(u => u.email))
          const foundIds = new Set(foundUsers.map(u => u.id))
          const missingInputs = validUserInputs.filter(input => {
            if (input.includes('@')) {
              return !foundEmails.has(input)
            } else {
              return !foundIds.has(input)
            }
          })
          return NextResponse.json(
            { ok: false, error: `Invalid user emails/IDs: ${missingInputs.join(', ')}` },
            { status: 400 }
          )
        }
      }
    }

    // Convert departmentIds (codes, names, or IDs) to actual department IDs
    let resolvedDepartmentIds: string[] = []
    if (!isGlobal && data.departmentIds && data.departmentIds.length > 0) {
      const validDeptInputs = data.departmentIds.filter(input => input && input.trim())
      if (validDeptInputs.length > 0) {
        // Check if inputs are codes, names, or IDs
        // Try to find by code first (most common), then by name, then by ID
        const departmentQueries: any[] = []
        
        // Query by code
        departmentQueries.push(
          prisma.department.findMany({
            where: { code: { in: validDeptInputs } },
            select: { id: true, code: true, name: true }
          })
        )
        
        // Query by name (for inputs not found by code)
        departmentQueries.push(
          prisma.department.findMany({
            where: { name: { in: validDeptInputs } },
            select: { id: true, code: true, name: true }
          })
        )
        
        // Query by ID (CUID format)
        const possibleIds = validDeptInputs.filter(input => input.startsWith('cm'))
        if (possibleIds.length > 0) {
          departmentQueries.push(
            prisma.department.findMany({
              where: { id: { in: possibleIds } },
              select: { id: true, code: true, name: true }
            })
          )
        }
        
        const deptResults = await Promise.all(departmentQueries)
        const foundDepts = deptResults.flat()
        // Remove duplicates
        const uniqueDepts = Array.from(new Map(foundDepts.map(d => [d.id, d])).values())
        resolvedDepartmentIds = uniqueDepts.map(d => d.id)
        
        // Check if all inputs were resolved
        const foundCodes = new Set(uniqueDepts.map(d => d.code))
        const foundNames = new Set(uniqueDepts.map(d => d.name))
        const foundIds = new Set(uniqueDepts.map(d => d.id))
        const missingInputs = validDeptInputs.filter(input => {
          return !foundCodes.has(input) && !foundNames.has(input) && !foundIds.has(input)
        })
        
        if (missingInputs.length > 0) {
          return NextResponse.json(
            { ok: false, error: `Invalid department codes/names/IDs: ${missingInputs.join(', ')}` },
            { status: 400 }
          )
        }
      }
    }

    // Check if user has permission to create memos (could check permissions here)

    const created = await prisma.memo.create({
      data: {
        title: data.title,
        content: data.content,
        priority: data.priority,
        isGlobal,
        expiresAt: (() => {
          if (!data.expiresAt || typeof data.expiresAt !== 'string') return undefined
          const d = new Date(data.expiresAt)
          return isNaN(d.getTime()) ? undefined : d
        })(),
        createdById: validCreatedById,
        users: isGlobal ? undefined : (resolvedUserIds.length > 0 ? { connect: resolvedUserIds.map((id) => ({ id })) } : undefined),
        departments: isGlobal ? undefined : (resolvedDepartmentIds.length > 0 ? { connect: resolvedDepartmentIds.map((id) => ({ id })) } : undefined),
      },
      include: {
        users: { select: { id: true, fullName: true, email: true, role: true } },
        departments: { select: { id: true, name: true, code: true } },
        createdBy: { select: { id: true, fullName: true, email: true } },
      },
    })

    // Audit log (best-effort)
    try {
      const { userId, userSnapshot } = getUserInfoFromHeaders(headers)
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


