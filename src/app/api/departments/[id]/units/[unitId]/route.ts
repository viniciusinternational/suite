import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

// DELETE /api/departments/[id]/units/[unitId] - Delete unit
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; unitId: string }> }
) {
  try {
    const { id, unitId } = await params;
    // Check if department exists
    const department = await prisma.department.findUnique({
      where: { id },
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

    // Check if unit exists
    const unit = await prisma.departmentUnit.findUnique({
      where: { id: unitId },
    })

    if (!unit) {
      return NextResponse.json(
        {
          ok: false,
          error: 'Unit not found',
        },
        { status: 404 }
      )
    }

    // Verify unit belongs to the department
      if (unit.departmentId !== id) {
      return NextResponse.json(
        {
          ok: false,
          error: 'Unit does not belong to this department',
        },
        { status: 400 }
      )
    }

    await prisma.departmentUnit.delete({
      where: { id: unitId },
    })

    return NextResponse.json({
      ok: true,
      message: 'Unit deleted successfully',
    })
  } catch (error) {
    console.error('Error deleting unit:', error)
    return NextResponse.json(
      {
        ok: false,
        error: 'Failed to delete unit',
      },
      { status: 500 }
    )
  }
}
