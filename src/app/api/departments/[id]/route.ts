import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'

// Validation schema for updates
const updateDepartmentSchema = z.object({
  name: z.string().min(1).optional(),
  code: z.string().min(1).optional(),
  headId: z.string().optional(),
  sector: z.string().min(1).optional(),
  description: z.string().optional(),
  isActive: z.boolean().optional(),
})

// GET /api/departments/[id] - Get single department
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const department = await prisma.department.findUnique({
      where: { id },
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

    return NextResponse.json({
      ok: true,
      data: department,
    })
  } catch (error) {
    console.error('Error fetching department:', error)
    return NextResponse.json(
      {
        ok: false,
        error: 'Failed to fetch department',
      },
      { status: 500 }
    )
  }
}

// PUT /api/departments/[id] - Update department
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json()
    const validatedData = updateDepartmentSchema.parse(body)

    // Check if department exists
    const existingDepartment = await prisma.department.findUnique({
      where: { id },
    })

    if (!existingDepartment) {
      return NextResponse.json(
        {
          ok: false,
          error: 'Department not found',
        },
        { status: 404 }
      )
    }

    // Check if code is being updated and if it already exists
    if (validatedData.code && validatedData.code !== existingDepartment.code) {
      const codeExists = await prisma.department.findUnique({
        where: { code: validatedData.code },
      })

      if (codeExists) {
        return NextResponse.json(
          {
            ok: false,
            error: 'Department code already exists',
          },
          { status: 400 }
        )
      }
    }

    // Validate headId if provided
    let headId = validatedData.headId
    if (validatedData.headId !== undefined) {
      if (validatedData.headId === 'none' || validatedData.headId === null) {
        headId = null
      } else {
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
      }
    }

    const department = await prisma.department.update({
      where: { id },
      data: {
        ...validatedData,
        headId,
      },
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
    })

    return NextResponse.json({
      ok: true,
      data: department,
      message: 'Department updated successfully',
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

    console.error('Error updating department:', error)
    return NextResponse.json(
      {
        ok: false,
        error: 'Failed to update department',
      },
      { status: 500 }
    )
  }
}

// DELETE /api/departments/[id] - Delete department
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    // Check if department exists
    const existingDepartment = await prisma.department.findUnique({
      where: { id },
      include: {
        units: true,
      },
    })

    if (!existingDepartment) {
      return NextResponse.json(
        {
          ok: false,
          error: 'Department not found',
        },
        { status: 404 }
      )
    }

    // Check if department has units
    if (existingDepartment.units.length > 0) {
      return NextResponse.json(
        {
          ok: false,
          error: 'Cannot delete department with existing units. Please delete units first.',
        },
        { status: 400 }
      )
    }

    await prisma.department.delete({
      where: { id },
    })

    return NextResponse.json({
      ok: true,
      message: 'Department deleted successfully',
    })
  } catch (error) {
    console.error('Error deleting department:', error)
    return NextResponse.json(
      {
        ok: false,
        error: 'Failed to delete department',
      },
      { status: 500 }
    )
  }
}
