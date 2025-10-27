import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';

// Validation schema for updates
const updateMilestoneSchema = z.object({
  name: z.string().min(1).optional(),
  description: z.string().optional(),
  dueDate: z.string().optional(),
  status: z.enum(['pending', 'in_progress', 'completed', 'overdue']).optional(),
  progress: z.number().min(0).max(100).optional(),
  budget: z.number().min(0).optional(),
  spent: z.number().min(0).optional(),
});

// PUT /api/projects/[id]/milestones/[milestoneId] - Update milestone
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string; milestoneId: string } }
) {
  try {
    const body = await request.json();
    const validatedData = updateMilestoneSchema.parse(body);

    // Check if milestone exists and belongs to the project
    const existingMilestone = await prisma.milestone.findUnique({
      where: { id: params.milestoneId },
    });

    if (!existingMilestone || existingMilestone.projectId !== params.id) {
      return NextResponse.json(
        {
          ok: false,
          error: 'Milestone not found',
        },
        { status: 404 }
      );
    }

    // Update milestone
    const updatedMilestone = await prisma.milestone.update({
      where: { id: params.milestoneId },
      data: validatedData,
      include: {
        _count: {
          select: {
            tasks: true,
          },
        },
      },
    });

    return NextResponse.json({
      ok: true,
      data: updatedMilestone,
      message: 'Milestone updated successfully',
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        {
          ok: false,
          error: 'Validation error',
          details: error.errors,
        },
        { status: 400 }
      );
    }

    console.error('Error updating milestone:', error);
    return NextResponse.json(
      {
        ok: false,
        error: 'Failed to update milestone',
      },
      { status: 500 }
    );
  }
}

// DELETE /api/projects/[id]/milestones/[milestoneId] - Delete milestone
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string; milestoneId: string } }
) {
  try {
    // Check if milestone exists and belongs to the project
    const existingMilestone = await prisma.milestone.findUnique({
      where: { id: params.milestoneId },
      include: {
        _count: {
          select: {
            tasks: true,
          },
        },
      },
    });

    if (!existingMilestone || existingMilestone.projectId !== params.id) {
      return NextResponse.json(
        {
          ok: false,
          error: 'Milestone not found',
        },
        { status: 404 }
      );
    }

    // Check if milestone has tasks
    if (existingMilestone._count.tasks > 0) {
      return NextResponse.json(
        {
          ok: false,
          error: 'Cannot delete milestone with existing tasks',
        },
        { status: 400 }
      );
    }

    // Delete milestone
    await prisma.milestone.delete({
      where: { id: params.milestoneId },
    });

    return NextResponse.json({
      ok: true,
      message: 'Milestone deleted successfully',
    });
  } catch (error) {
    console.error('Error deleting milestone:', error);
    return NextResponse.json(
      {
        ok: false,
        error: 'Failed to delete milestone',
      },
      { status: 500 }
    );
  }
}

