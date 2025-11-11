import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

// GET /api/requests/approvals - Get pending approvals for current user
export async function GET(request: NextRequest) {
  try {
    const headers = request.headers;
    const userId = headers.get('x-user-id');

    if (!userId) {
      return NextResponse.json(
        {
          ok: false,
          error: 'User ID is required',
        },
        { status: 401 }
      );
    }

    // Fetch pending approvals for the current user
    const pendingApprovals = await prisma.requestApproval.findMany({
      where: {
        userId: userId,
        status: 'pending',
      },
      include: {
        requestForm: {
          include: {
            requestedByUser: {
              select: {
                id: true,
                fullName: true,
                email: true,
                avatar: true,
              },
            },
            department: {
              select: {
                id: true,
                name: true,
                code: true,
              },
            },
            approvals: {
              include: {
                user: {
                  select: {
                    id: true,
                    fullName: true,
                    email: true,
                    role: true,
                  },
                },
              },
              orderBy: {
                level: 'asc',
              },
            },
          },
        },
        user: {
          select: {
            id: true,
            fullName: true,
            email: true,
            role: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    return NextResponse.json({
      ok: true,
      data: pendingApprovals,
    });
  } catch (error) {
    console.error('Error fetching pending approvals:', error);
    return NextResponse.json(
      {
        ok: false,
        error: 'Failed to fetch pending approvals',
      },
      { status: 500 }
    );
  }
}

