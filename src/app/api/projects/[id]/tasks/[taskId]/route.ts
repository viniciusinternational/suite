import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';

// Validation schema for updates
const updateTaskSchema = z.object({
  name: z.string().min(1).optional(),
  description: z.string().optional(),
  milestoneId: z.string().optional(),
  assigneeId: z.string().optional(),
  status: z.enum(['todo', 'in_progress', 'review', 'completed']).optional(),
  priority: z.enum(['low', 'medium', 'high']).optional(),
  startDate: z.string().optional(),
  dueDate: z.string().optional(),
  estimatedHours: z.number().positive().optional(),
  actualHours: z.number().positive().optional(),
});

// PUT /api/projects/[id]/tasks/[taskId] - Update task
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; taskId: string }> }
) {
  try {
    const { id, taskId } = await params;
    const body = await request.json();
    const validatedData = updateTaskSchema.parse(body);

    // Check if task exists and belongs to the project
    const existingTask = await prisma.task.findUnique({
      where: { id: taskId },
    });

      if (!existingTask || existingTask.projectId !== id) {
      return NextResponse.json(
        {
          ok: false,
          error: 'Task not found',
        },
        { status: 404 }
      );
    }

    // Validate milestone if provided
    if (validatedData.milestoneId) {
      const milestone = await prisma.milestone.findUnique({
        where: { id: validatedData.milestoneId },
      });

      if (!milestone || milestone.projectId !== id) {
        return NextResponse.json(
          {
            ok: false,
            error: 'Milestone not found',
          },
          { status: 400 }
        );
      }
    }

    // Validate assignee if provided
    if (validatedData.assigneeId) {
      const assignee = await prisma.user.findUnique({
        where: { id: validatedData.assigneeId },
      });

      if (!assignee || !assignee.isActive) {
        return NextResponse.json(
          {
            ok: false,
            error: 'Assignee not found or inactive',
          },
          { status: 400 }
        );
      }
    }

    // Update task
    const updatedTask = await prisma.task.update({
      where: { id: taskId },
      data: validatedData,
      include: {
        assignee: {
          select: {
            id: true,
            fullName: true,
            email: true,
            avatar: true,
            role: true,
          },
        },
        milestone: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    });

    return NextResponse.json({
      ok: true,
      data: updatedTask,
      message: 'Task updated successfully',
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

    console.error('Error updating task:', error);
    return NextResponse.json(
      {
        ok: false,
        error: 'Failed to update task',
      },
      { status: 500 }
    );
  }
}

// DELETE /api/projects/[id]/tasks/[taskId] - Delete task
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; taskId: string }> }
) {
  try {
    const { id, taskId } = await params;
    // Check if task exists and belongs to the project
    const existingTask = await prisma.task.findUnique({
      where: { id: taskId },
    });

    if (!existingTask || existingTask.projectId !== id) {
      return NextResponse.json(
        {
          ok: false,
          error: 'Task not found',
        },
        { status: 404 }
      );
    }

    // Delete task
    await prisma.task.delete({
      where: { id: taskId },
    });

    return NextResponse.json({
      ok: true,
      message: 'Task deleted successfully',
    });
  } catch (error) {
    console.error('Error deleting task:', error);
    return NextResponse.json(
      {
        ok: false,
        error: 'Failed to delete task',
      },
      { status: 500 }
    );
  }
}

