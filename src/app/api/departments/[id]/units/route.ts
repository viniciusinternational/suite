import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'

// Validation schema for creating units
const createUnitSchema = z.object({
  name: z.string().min(1, 'Unit name is required'),
  managerId: z.string().optional(),
  isActive: z.boolean().default(true),
})

// POST /api/departments/[id]/units - Add unit to department
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const body = await request.json()
    const validatedData = createUnitSchema.parse(body)

    // Check if department exists
    const department = await prisma.department.findUnique({
      where: { id: params.id },
    })

    if (!department) {
      return NextResponse.json(
        {
          ok: false,
          error: 'Department not found',
        },
        { status: 404 }
      )
    }

    // Validate managerId if provided
    let managerId = null
    if (validatedData.managerId && validatedData.managerId !== 'none') {
      const managerUser = await prisma.user.findUnique({
        where: { id: validatedData.managerId },
        select: { id: true, isActive: true, role: true },
      })

      if (!managerUser) {
        return NextResponse.json(
          {
            ok: false,
            error: 'Selected unit manager does not exist',
          },
          { status: 400 }
        )
      }

      if (!managerUser.isActive) {
        return NextResponse.json(
          {
            ok: false,
            error: 'Selected unit manager is not active',
          },
          { status: 400 }
        )
      }

      managerId = validatedData.managerId
    }

    const unit = await prisma.departmentUnit.create({
      data: {
        ...validatedData,
        departmentId: params.id,
        managerId,
      },
      include: {
        manager: {
          select: {
            id: true,
            fullName: true,
            role: true,
          },
        },
      },
    })

    return NextResponse.json({
      ok: true,
      data: unit,
      message: 'Unit created successfully',
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

    console.error('Error creating unit:', error)
    return NextResponse.json(
      {
        ok: false,
        error: 'Failed to create unit',
      },
      { status: 500 }
    )
  }
}

// GET /api/departments/[id]/units - List units for department
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Check if department exists
    const department = await prisma.department.findUnique({
      where: { id: params.id },
    })

    if (!department) {
      return NextResponse.json(
        {
          ok: false,
          error: 'Department not found',
        },
        { status: 404 }
      )
    }

    const units = await prisma.departmentUnit.findMany({
      where: { departmentId: params.id },
      include: {
        manager: {
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
      data: units,
    })
  } catch (error) {
    console.error('Error fetching units:', error)
    return NextResponse.json(
      {
        ok: false,
        error: 'Failed to fetch units',
      },
      { status: 500 }
    )
  }
}
