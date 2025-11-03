import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';
import { createAuditLog, getUserInfoFromHeaders } from '@/lib/audit-logger';

// Validation schema
const createTaskSchema = z.object({
  name: z.string().min(1, 'Task name is required'),
  description: z.string().optional(),
  milestoneId: z.string().optional(),
  assigneeId: z.string().optional(),
  status: z.enum(['todo', 'in_progress', 'review', 'completed']).default('todo'),
  priority: z.enum(['low', 'medium', 'high']).default('medium'),
  startDate: z.string().optional(),
  dueDate: z.string().optional(),
  estimatedHours: z.number().positive().optional(),
  actualHours: z.number().positive().optional(),
});

// GET /api/projects/[id]/tasks - List tasks for a project
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const { searchParams } = new URL(request.url);
    const milestoneId = searchParams.get('milestoneId');

    // Check if project exists
    const project = await prisma.project.findUnique({
      where: { id },
    });

    if (!project) {
      return NextResponse.json(
        {
          ok: false,
          error: 'Project not found',
        },
        { status: 404 }
      );
    }

    const where: any = { projectId: id };
    if (milestoneId && milestoneId !== 'all') {
      where.milestoneId = milestoneId;
    }

    const tasks = await prisma.task.findMany({
      where,
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
      orderBy: {
        createdAt: 'desc',
      },
    });

    return NextResponse.json({
      ok: true,
      data: tasks,
    });
  } catch (error) {
    console.error('Error fetching tasks:', error);
    return NextResponse.json(
      {
        ok: false,
        error: 'Failed to fetch tasks',
      },
      { status: 500 }
    );
  }
}

// POST /api/projects/[id]/tasks - Create task
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const validatedData = createTaskSchema.parse(body);

    // Check if project exists
    const project = await prisma.project.findUnique({
      where: { id },
    });

    if (!project) {
      return NextResponse.json(
        {
          ok: false,
          error: 'Project not found',
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

    // Validate dates if provided
    if (validatedData.startDate && validatedData.dueDate) {
      const startDate = new Date(validatedData.startDate);
      const dueDate = new Date(validatedData.dueDate);

      if (dueDate < startDate) {
        return NextResponse.json(
          {
            ok: false,
            error: 'Due date must be after start date',
          },
          { status: 400 }
        );
      }

      // Check if dates are within project timeline
      const projectStartDate = new Date(project.startDate);
      const projectEndDate = new Date(project.endDate);

      if (startDate < projectStartDate || dueDate > projectEndDate) {
        return NextResponse.json(
          {
            ok: false,
            error: 'Task dates must be within project timeline',
          },
          { status: 400 }
        );
      }
    }

    const task = await prisma.task.create({
      data: {
        projectId: id,
        name: validatedData.name,
        description: validatedData.description,
        milestoneId: validatedData.milestoneId,
        assigneeId: validatedData.assigneeId,
        status: validatedData.status,
        priority: validatedData.priority,
        startDate: validatedData.startDate,
        dueDate: validatedData.dueDate,
        estimatedHours: validatedData.estimatedHours,
        actualHours: validatedData.actualHours,
      },
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

    // Audit log (best-effort)
    try {
      const headers = request.headers;
      const { userId, userSnapshot } = getUserInfoFromHeaders(headers);
      
      // Check if task has assignee
      const actionType = validatedData.assigneeId ? 'TASK_ASSIGNED' : 'CREATE';
      const description = validatedData.assigneeId
        ? `Created and assigned task "${task.name}" to ${task.assignee?.fullName || 'assignee'}`
        : `Created task "${task.name}" for project "${project.name}"`;
      
      await createAuditLog({
        userId: userId || 'system',
        userSnapshot,
        actionType,
        entityType: 'Task',
        entityId: task.id,
        description,
        previousData: null,
        newData: task as any,
        ipAddress: request.ip ?? headers.get('x-forwarded-for') ?? undefined,
        userAgent: headers.get('user-agent') ?? undefined,
      });
    } catch (e) {
      console.error('Audit log failed (create task):', e);
    }

    return NextResponse.json({
      ok: true,
      data: task,
      message: 'Task created successfully',
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

    console.error('Error creating task:', error);
    return NextResponse.json(
      {
        ok: false,
        error: 'Failed to create task',
      },
      { status: 500 }
    );
  }
}

