import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';

// Validation schema
const createMilestoneSchema = z.object({
  name: z.string().min(1, 'Milestone name is required'),
  description: z.string().optional(),
  dueDate: z.string().min(1, 'Due date is required'),
  budget: z.number().min(0, 'Budget must be 0 or greater').optional().default(0),
});

// GET /api/projects/[id]/milestones - List milestones for a project
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
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

    const milestones = await prisma.milestone.findMany({
      where: { projectId: id },
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
    });

    return NextResponse.json({
      ok: true,
      data: milestones,
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

