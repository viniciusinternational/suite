import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { createAuditLog, getUserInfoFromHeaders } from '@/lib/audit-logger'
import { z } from 'zod'

const updateMemoSchema = z.object({
  title: z.string().min(1).optional(),
  content: z.string().min(1).optional(),
  priority: z.enum(['low', 'medium', 'high', 'urgent']).optional(),
  isActive: z.boolean().optional(),
  isGlobal: z.boolean().optional(),
  expiresAt: z.string().optional(),
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

    const isGlobal = data.isGlobal === true

    // Convert userIds (emails or IDs) to actual user IDs (skip when isGlobal)
    let resolvedUserIds: string[] | undefined = undefined
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

    // Convert departmentIds (codes, names, or IDs) to actual department IDs (skip when isGlobal)
    let resolvedDepartmentIds: string[] | undefined = undefined
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

    const previous = await prisma.memo.findUnique({ where: { id } })
    const updated = await prisma.memo.update({
      where: { id },
      data: {
        title: data.title ?? undefined,
        content: data.content ?? undefined,
        priority: data.priority ?? undefined,
        isActive: data.isActive ?? undefined,
        isGlobal: data.isGlobal !== undefined ? data.isGlobal : undefined,
        expiresAt: (() => {
          if (data.expiresAt === undefined) return undefined
          if (data.expiresAt === '' || data.expiresAt === null) return null
          const d = new Date(data.expiresAt as string)
          return isNaN(d.getTime()) ? undefined : d
        })(),
        users: isGlobal ? { set: [] } : (resolvedUserIds !== undefined ? { set: resolvedUserIds.map((id) => ({ id })) } : undefined),
        departments: isGlobal ? { set: [] } : (resolvedDepartmentIds !== undefined ? { set: resolvedDepartmentIds.map((id) => ({ id })) } : undefined),
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
      const { userId, userSnapshot } = getUserInfoFromHeaders(headers)
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
      const { userId, userSnapshot } = getUserInfoFromHeaders(headers)
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


