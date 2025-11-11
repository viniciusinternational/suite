import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'
import { createAuditLog, getUserInfoFromHeaders } from '@/lib/audit-logger'

// Validation schemas
const createDepartmentSchema = z.object({
  name: z.string().min(1, 'Department name is required'),
  code: z.string().min(1, 'Department code is required'),
  headId: z.string().optional(),
  sector: z.string().min(1, 'Sector is required'),
  description: z.string().optional(),
  isActive: z.boolean().default(true),
})

// GET /api/departments - List all departments
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const includeInactive = searchParams.get('includeInactive') === 'true'

    const departments = await prisma.department.findMany({
      where: includeInactive ? {} : { isActive: true },
      include: {
        units: {
          include: {
            manager: {
              select: {
                id: true,
                fullName: true,
                role: true,
              },
            },
          },
        },
        head: {
          select: {
            id: true,
            fullName: true,
            role: true,
          },
        },
      },
      orderBy: {
        name: 'asc',
      },
    })

    return NextResponse.json({
      ok: true,
      data: departments,
    })
  } catch (error) {
    console.error('Error fetching departments:', error)
    return NextResponse.json(
      {
        ok: false,
        error: 'Failed to fetch departments',
      },
      { status: 500 }
    )
  }
}

// POST /api/departments - Create new department
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const validatedData = createDepartmentSchema.parse(body)

    // Check if department code already exists
    const existingDepartment = await prisma.department.findUnique({
      where: { code: validatedData.code },
    })

    if (existingDepartment) {
      return NextResponse.json(
        {
          ok: false,
          error: 'Department code already exists',
        },
        { status: 400 }
      )
    }

    // Validate headId if provided
    let headId = null
    if (validatedData.headId && validatedData.headId !== 'none') {
      const headUser = await prisma.user.findUnique({
        where: { id: validatedData.headId },
        select: { id: true, isActive: true, role: true },
      })

      if (!headUser) {
        return NextResponse.json(
          {
            ok: false,
            error: 'Selected department head does not exist',
          },
          { status: 400 }
        )
      }

      if (!headUser.isActive) {
        return NextResponse.json(
          {
            ok: false,
            error: 'Selected department head is not active',
          },
          { status: 400 }
        )
      }

      headId = validatedData.headId
    }

    const department = await prisma.department.create({
      data: {
        ...validatedData,
        headId,
      },
      include: {
        units: true,
        head: {
          select: {
            id: true,
            fullName: true,
            role: true,
          },
        },
      },
    })

    // Audit log (best-effort)
    try {
      const headers = request.headers
      const { userId, userSnapshot } = getUserInfoFromHeaders(headers)
      
      await createAuditLog({
        userId: userId || 'system',
        userSnapshot,
        actionType: 'CREATE',
        entityType: 'Department',
        entityId: department.id,
        description: `Created department "${department.name}" with code ${department.code}`,
        previousData: null,
        newData: department as any,
        ipAddress: request.ip ?? headers.get('x-forwarded-for') ?? undefined,
        userAgent: headers.get('user-agent') ?? undefined,
      })
    } catch (e) {
      console.error('Audit log failed (create department):', e)
    }

    return NextResponse.json({
      ok: true,
      data: department,
      message: 'Department created successfully',
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

    console.error('Error creating department:', error)
    return NextResponse.json(
      {
        ok: false,
        error: 'Failed to create department',
      },
      { status: 500 }
    )
  }
}
