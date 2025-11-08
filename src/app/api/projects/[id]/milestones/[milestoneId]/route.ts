import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';
import { createAuditLog, getUserInfoFromHeaders } from '@/lib/audit-logger';

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
  { params }: { params: Promise<{ id: string; milestoneId: string }> }
) {
  try {
    const { id, milestoneId } = await params;
    const body = await request.json();
    const validatedData = updateMilestoneSchema.parse(body);

    // Check if milestone exists and belongs to the project
    const existingMilestone = await prisma.milestone.findUnique({
      where: { id: milestoneId },
    });

      if (!existingMilestone || existingMilestone.projectId !== id) {
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
      where: { id: milestoneId },
      data: validatedData,
      include: {
        _count: {
          select: {
            tasks: true,
          },
        },
      },
    });

    // Audit log (best-effort)
    try {
      const headers = request.headers;
      const { userId, userSnapshot } = getUserInfoFromHeaders(headers);
      
      // Check if milestone was completed
      const completed = validatedData.status === 'completed' && existingMilestone.status !== 'completed';
      const actionType = completed ? 'MILESTONE_COMPLETED' : 'UPDATE';
      const description = completed
        ? `Completed milestone "${updatedMilestone.name}"`
        : `Updated milestone "${updatedMilestone.name}"`;
      
      await createAuditLog({
        userId: userId || 'system',
        userSnapshot,
        actionType,
        entityType: 'Milestone',
        entityId: milestoneId,
        description,
        previousData: existingMilestone as any,
        newData: updatedMilestone as any,
        ipAddress: request.ip ?? headers.get('x-forwarded-for') ?? undefined,
        userAgent: headers.get('user-agent') ?? undefined,
      });
    } catch (e) {
      console.error('Audit log failed (update milestone):', e);
    }

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
  { params }: { params: Promise<{ id: string; milestoneId: string }> }
) {
  try {
    const { id, milestoneId } = await params;
    // Check if milestone exists and belongs to the project
    const existingMilestone = await prisma.milestone.findUnique({
      where: { id: milestoneId },
      include: {
        _count: {
          select: {
            tasks: true,
          },
        },
      },
    });

      if (!existingMilestone || existingMilestone.projectId !== id) {
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
      where: { id: milestoneId },
    });

    // Audit log (best-effort)
    try {
      const headers = request.headers;
      const { userId, userSnapshot } = getUserInfoFromHeaders(headers);
      
      const project = await prisma.project.findUnique({ where: { id } });
      
      await createAuditLog({
        userId: userId || 'system',
        userSnapshot,
        actionType: 'DELETE',
        entityType: 'Milestone',
        entityId: milestoneId,
        description: `Deleted milestone "${existingMilestone.name}" from project "${project?.name || id}"`,
        previousData: existingMilestone as any,
        newData: null,
        ipAddress: request.ip ?? headers.get('x-forwarded-for') ?? undefined,
        userAgent: headers.get('user-agent') ?? undefined,
      });
    } catch (e) {
      console.error('Audit log failed (delete milestone):', e);
    }

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

