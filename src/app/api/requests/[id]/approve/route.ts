import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';
import { createAuditLog } from '@/lib/audit-logger';

// Validation schema
const approveRequestSchema = z.object({
  userId: z.string().min(1, 'User ID is required'),
  level: z.enum(['dept_head', 'admin_head']),
  action: z.enum(['approve', 'reject']),
  comments: z.string().optional(),
});

// POST /api/requests/[id]/approve - Approve/reject request
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    
    // Get userId from headers or body
    const headers = request.headers;
    const userIdFromHeader = headers.get('x-user-id');
    const validatedData = approveRequestSchema.parse({
      ...body,
      userId: body.userId || userIdFromHeader || '',
    });

    // Check if request exists
    const requestForm = await prisma.requestForm.findUnique({
      where: { id },
      include: {
        requestedByUser: {
          select: {
            id: true,
            fullName: true,
            email: true,
          },
        },
        department: {
          select: {
            id: true,
            name: true,
            headId: true,
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
    });

    if (!requestForm) {
      return NextResponse.json(
        {
          ok: false,
          error: 'Request not found',
        },
        { status: 404 }
      );
    }

    // Validate user exists
    const approver = await prisma.user.findUnique({
      where: { id: validatedData.userId },
    });

    if (!approver || !approver.isActive) {
      return NextResponse.json(
        {
          ok: false,
          error: 'Approver not found or inactive',
        },
        { status: 400 }
      );
    }

    // Find the approval record for this level and user
    const approval = requestForm.approvals.find(
      (a) => a.level === validatedData.level && a.userId === validatedData.userId && a.status === 'pending'
    );

    if (!approval) {
      return NextResponse.json(
        {
          ok: false,
          error: 'Approval record not found or already processed',
        },
        { status: 400 }
      );
    }

    // Update approval status
    const actionDate = new Date().toISOString();
    const newStatus = validatedData.action === 'approve' ? 'approved' : 'rejected';

    await prisma.requestApproval.update({
      where: { id: approval.id },
      data: {
        status: newStatus,
        actionDate,
        comments: validatedData.comments || null,
      },
    });

    // Update request status based on approval workflow
    let newRequestStatus = requestForm.status;

    if (validatedData.action === 'reject') {
      // If rejected at any level, set request status to rejected
      newRequestStatus = 'rejected';
    } else if (validatedData.action === 'approve') {
      // Check workflow progression
      if (validatedData.level === 'dept_head') {
        // Dept head approved, move to admin head
        newRequestStatus = 'pending_admin_head';
      } else if (validatedData.level === 'admin_head') {
        // Admin head approved, final approval
        newRequestStatus = 'approved';
      }
    }

    // Update request status
    const updatedRequest = await prisma.requestForm.update({
      where: { id },
      data: {
        status: newRequestStatus,
      },
      include: {
        requestedByUser: {
          select: {
            id: true,
            fullName: true,
            email: true,
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
    });

    // Audit log
    try {
      const userSnapshot = {
        id: validatedData.userId,
        fullName: headers.get('x-user-fullname') || approver.fullName,
        email: headers.get('x-user-email') || approver.email,
        role: headers.get('x-user-role') || approver.role,
        departmentId: headers.get('x-user-department-id') || approver.departmentId || undefined,
      };

      const actionType = validatedData.action === 'approve' ? 'REQUEST_APPROVED' : 'REQUEST_REJECTED';

      await createAuditLog({
        userId: validatedData.userId,
        userSnapshot,
        actionType,
        entityType: 'RequestForm',
        entityId: id,
        description: `${validatedData.action === 'approve' ? 'Approved' : 'Rejected'} request "${requestForm.name}" at ${validatedData.level} level`,
        previousData: {
          status: requestForm.status,
          approval: {
            id: approval.id,
            status: approval.status,
          },
        },
        newData: {
          status: newRequestStatus,
          approval: {
            id: approval.id,
            status: newStatus,
            actionDate,
            comments: validatedData.comments,
          },
        },
        ipAddress: request.ip ?? headers.get('x-forwarded-for') ?? undefined,
        userAgent: headers.get('user-agent') ?? undefined,
      });
    } catch (e) {
      console.warn('Audit log failed (approve/reject request):', e);
    }

    return NextResponse.json({
      ok: true,
      data: updatedRequest,
      message: `Request ${validatedData.action === 'approve' ? 'approved' : 'rejected'} successfully`,
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

    console.error('Error approving/rejecting request:', error);
    return NextResponse.json(
      {
        ok: false,
        error: 'Failed to process approval',
      },
      { status: 500 }
    );
  }
}


