import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

// GET /api/projects/[id]/analytics - Get project analytics
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    // Fetch project with related data
    const project = await prisma.project.findUnique({
      where: { id },
      include: {
        milestones: {
          select: {
            id: true,
            status: true,
            progress: true,
            budget: true,
            spent: true,
            dueDate: true,
          },
        },
        tasks: {
          select: {
            id: true,
            status: true,
          },
        },
      },
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

    // Calculate project progress
    const progress = project.progress;

    // Calculate budget utilization
    const budgetUtilization = {
      budget: project.budget,
      spent: project.spent,
      remaining: project.budget - project.spent,
      percentage: project.budget > 0
        ? Math.round((project.spent / project.budget) * 100)
        : 0,
    };

    // Calculate timeline status
    const now = new Date();
    const startDate = new Date(project.startDate);
    const endDate = new Date(project.endDate);
    const totalDays = Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24));
    const elapsedDays = Math.ceil((now.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24));
    const daysRemaining = Math.ceil((endDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
    const completionPercentage = totalDays > 0
      ? Math.round((elapsedDays / totalDays) * 100)
      : 0;

    let timelineStatus: 'on_track' | 'at_risk' | 'delayed' = 'on_track';
    if (daysRemaining < 0) {
      timelineStatus = 'delayed';
    } else if (progress < completionPercentage - 10) {
      timelineStatus = 'at_risk';
    } else if (progress < completionPercentage - 5) {
      timelineStatus = 'at_risk';
    }

    const timeline = {
      status: timelineStatus,
      daysRemaining: Math.max(0, daysRemaining),
      completionPercentage,
    };

    // Calculate milestone statistics
    const milestones = {
      total: project.milestones.length,
      completed: project.milestones.filter(m => m.status === 'completed').length,
      completionRate: project.milestones.length > 0
        ? Math.round((project.milestones.filter(m => m.status === 'completed').length / project.milestones.length) * 100)
        : 0,
    };

    // Calculate task statistics
    const tasks = {
      total: project.tasks.length,
      completed: project.tasks.filter(t => t.status === 'completed').length,
      completionRate: project.tasks.length > 0
        ? Math.round((project.tasks.filter(t => t.status === 'completed').length / project.tasks.length) * 100)
        : 0,
    };

    return NextResponse.json({
      ok: true,
      data: {
        progress,
        budgetUtilization,
        timeline,
        milestones,
        tasks,
      },
    });
  } catch (error) {
    console.error('Error fetching project analytics:', error);
    return NextResponse.json(
      {
        ok: false,
        error: 'Failed to fetch project analytics',
      },
      { status: 500 }
    );
  }
}


