import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';
import { createAuditLog, getUserInfoFromHeaders } from '@/lib/audit-logger';

// Validation schema
const createMilestoneSchema = z.object({
  name: z.string().min(1, 'Milestone name is required'),
  description: z.string().optional(),
  dueDate: z.string().min(1, 'Due date is required'),
  budget: z.number().min(0, 'Budget must be 0 or greater').optional().default(0),
});

// GET /api/projects/[id]/milestones - List milestones for a project with pagination, filtering, and analytics
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const { searchParams } = new URL(request.url);
    
    // Extract query parameters
    const status = searchParams.get('status');
    const search = searchParams.get('search');
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '10');
    const offset = (page - 1) * limit;

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

    // Build where clause
    const where: any = { projectId: id };

    if (status && status !== 'all') {
      where.status = status;
    }

    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } },
      ];
    }

    if (startDate || endDate) {
      where.dueDate = {};
      if (startDate) {
        where.dueDate.gte = startDate;
      }
      if (endDate) {
        where.dueDate.lte = endDate;
      }
    }

    // Get all milestones for analytics (before pagination)
    const allMilestones = await prisma.milestone.findMany({
      where: { projectId: id },
      select: {
        status: true,
        progress: true,
        budget: true,
        spent: true,
        dueDate: true,
      },
    });

    // Calculate analytics
    const now = new Date();
    const analytics = {
      total: allMilestones.length,
      completed: allMilestones.filter(m => m.status === 'completed').length,
      overdue: allMilestones.filter(m => {
        if (m.status === 'completed') return false;
        const due = new Date(m.dueDate);
        return due < now;
      }).length,
      inProgress: allMilestones.filter(m => m.status === 'in_progress').length,
      totalBudget: allMilestones.reduce((sum, m) => sum + m.budget, 0),
      totalSpent: allMilestones.reduce((sum, m) => sum + m.spent, 0),
      averageProgress: allMilestones.length > 0
        ? Math.round(allMilestones.reduce((sum, m) => sum + m.progress, 0) / allMilestones.length)
        : 0,
    };

    // Get total count for pagination
    const total = await prisma.milestone.count({ where });

    // Get paginated milestones
    const milestones = await prisma.milestone.findMany({
      where,
      include: {
        _count: {
          select: {
            tasks: true,
          },
        },
      },
      orderBy: {
        dueDate: 'asc',
      },
      take: limit,
      skip: offset,
    });

    const totalPages = Math.ceil(total / limit);

    return NextResponse.json({
      ok: true,
      data: milestones,
      pagination: {
        total,
        page,
        limit,
        totalPages,
      },
      analytics,
    });
  } catch (error) {
    console.error('Error fetching milestones:', error);
    return NextResponse.json(
      {
        ok: false,
        error: 'Failed to fetch milestones',
      },
      { status: 500 }
    );
  }
}

// POST /api/projects/[id]/milestones - Create milestone
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const validatedData = createMilestoneSchema.parse(body);

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

    // Validate date
    const dueDate = new Date(validatedData.dueDate);
    const projectStartDate = new Date(project.startDate);
    const projectEndDate = new Date(project.endDate);

    if (dueDate < projectStartDate || dueDate > projectEndDate) {
      return NextResponse.json(
        {
          ok: false,
          error: 'Milestone due date must be within project timeline',
        },
        { status: 400 }
      );
    }

    const milestone = await prisma.milestone.create({
      data: {
        projectId: id,
        name: validatedData.name,
        description: validatedData.description,
        dueDate: validatedData.dueDate,
        budget: validatedData.budget,
        spent: 0,
        status: 'pending',
        progress: 0,
      },
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
      
      await createAuditLog({
        userId: userId || 'system',
        userSnapshot,
        actionType: 'CREATE',
        entityType: 'Milestone',
        entityId: milestone.id,
        description: `Created milestone "${milestone.name}" for project "${project.name}"`,
        previousData: null,
        newData: milestone as any,
        ipAddress: request.ip ?? headers.get('x-forwarded-for') ?? undefined,
        userAgent: headers.get('user-agent') ?? undefined,
      });
    } catch (e) {
      console.error('Audit log failed (create milestone):', e);
    }

    return NextResponse.json({
      ok: true,
      data: milestone,
      message: 'Milestone created successfully',
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

    console.error('Error creating milestone:', error);
    return NextResponse.json(
      {
        ok: false,
        error: 'Failed to create milestone',
      },
      { status: 500 }
    );
  }
}

