import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';

// Validation schema
const createProjectSchema = z.object({
  name: z.string().min(1, 'Project name is required'),
  code: z.string().min(1, 'Project code is required'),
  description: z.string().optional(),
  clientName: z.string().optional(),
  departmentId: z.string().min(1, 'Department is required'),
  managerId: z.string().min(1, 'Project manager is required'),
  budget: z.number().positive('Budget must be positive'),
  startDate: z.string().min(1, 'Start date is required'),
  endDate: z.string().min(1, 'End date is required'),
  priority: z.enum(['low', 'medium', 'high', 'critical']),
  status: z.enum(['planning', 'active', 'on_hold', 'completed', 'cancelled']).default('planning'),
});

// GET /api/projects - List all projects
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status');
    const priority = searchParams.get('priority');
    const departmentId = searchParams.get('department');
    const search = searchParams.get('search');

    // Build where clause
    const where: any = {};

    if (status && status !== 'all') {
      where.status = status;
    }

    if (priority && priority !== 'all') {
      where.priority = priority;
    }

    if (departmentId && departmentId !== 'all') {
      where.departmentId = departmentId;
    }

    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { code: { contains: search, mode: 'insensitive' } },
        { clientName: { contains: search, mode: 'insensitive' } },
      ];
    }

    const projects = await prisma.project.findMany({
      where,
      include: {
        department: {
          select: {
            id: true,
            name: true,
            code: true,
          },
        },
        manager: {
          select: {
            id: true,
            fullName: true,
            email: true,
            role: true,
          },
        },
        approvals: {
          include: {
            user: {
              select: {
                id: true,
                fullName: true,
                role: true,
              },
            },
          },
        },
        _count: {
          select: {
            milestones: true,
            tasks: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    return NextResponse.json({
      ok: true,
      data: projects,
    });
  } catch (error) {
    console.error('Error fetching projects:', error);
    return NextResponse.json(
      {
        ok: false,
        error: 'Failed to fetch projects',
      },
      { status: 500 }
    );
  }
}

// POST /api/projects - Create new project
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const validatedData = createProjectSchema.parse(body);

    // Check if project code already exists
    const existingProject = await prisma.project.findUnique({
      where: { code: validatedData.code },
    });

    if (existingProject) {
      return NextResponse.json(
        {
          ok: false,
          error: 'Project code already exists',
        },
        { status: 400 }
      );
    }

    // Validate dates
    const startDate = new Date(validatedData.startDate);
    const endDate = new Date(validatedData.endDate);

    if (endDate < startDate) {
      return NextResponse.json(
        {
          ok: false,
          error: 'End date must be after start date',
        },
        { status: 400 }
      );
    }

    // Validate department exists
    const department = await prisma.department.findUnique({
      where: { id: validatedData.departmentId },
    });

    if (!department) {
      return NextResponse.json(
        {
          ok: false,
          error: 'Department not found',
        },
        { status: 400 }
      );
    }

    // Validate manager exists
    const manager = await prisma.user.findUnique({
      where: { id: validatedData.managerId },
    });

    if (!manager || !manager.isActive) {
      return NextResponse.json(
        {
          ok: false,
          error: 'Project manager not found or inactive',
        },
        { status: 400 }
      );
    }

    // Create project with automatic approvals
    const project = await prisma.project.create({
      data: {
        name: validatedData.name,
        code: validatedData.code,
        description: validatedData.description,
        clientName: validatedData.clientName,
        departmentId: validatedData.departmentId,
        managerId: validatedData.managerId,
        budget: validatedData.budget,
        spent: 0,
        startDate: validatedData.startDate,
        endDate: validatedData.endDate,
        status: validatedData.status,
        priority: validatedData.priority,
        progress: 0,
      },
      include: {
        department: {
          select: {
            id: true,
            name: true,
            code: true,
          },
        },
        manager: {
          select: {
            id: true,
            fullName: true,
            email: true,
            role: true,
          },
        },
        _count: {
          select: {
            milestones: true,
            tasks: true,
          },
        },
      },
    });

    // Create default approvals: Director first, then CEO
    // Find users with director role (managing_director)
    const directorUser = await prisma.user.findFirst({
      where: { role: { in: ['managing_director', 'department_head'] } },
    });

    const ceoUser = await prisma.user.findFirst({
      where: { role: 'super_admin' },
    });

    // Create approvals
    const approvals = [];
    
    if (directorUser) {
      const directorApproval = await prisma.approval.create({
        data: {
          projectId: project.id,
          userId: directorUser.id,
          level: 'director',
          status: 'pending',
        },
      });
      approvals.push(directorApproval);
    }

    if (ceoUser) {
      const ceoApproval = await prisma.approval.create({
        data: {
          projectId: project.id,
          userId: ceoUser.id,
          level: 'ceo',
          status: 'pending',
        },
      });
      approvals.push(ceoApproval);
    }

    return NextResponse.json({
      ok: true,
      data: {
        ...project,
        approvals,
      },
      message: 'Project created successfully',
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

    console.error('Error creating project:', error);
    return NextResponse.json(
      {
        ok: false,
        error: 'Failed to create project',
      },
      { status: 500 }
    );
  }
}

