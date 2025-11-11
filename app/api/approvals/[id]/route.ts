import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';
import { createAuditLog } from '@/lib/audit-logger';

// Validation schema
const approveActionSchema = z.object({
  type: z.enum(['request', 'project']),
  userId: z.string().min(1, 'User ID is required'),
  level: z.string().optional(), // For request: 'dept_head' | 'admin_head', For project: 'director' | 'ceo'
  action: z.enum(['approve', 'reject']),
  comments: z.string().optional(),
});

// POST /api/approvals/[id] - Approve/reject action for unified approvals
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
    const validatedData = approveActionSchema.parse({
      ...body,
      userId: body.userId || userIdFromHeader || '',
    });

    if (validatedData.type === 'request') {
      // Handle RequestApproval
      return await handleRequestApproval(id, validatedData, headers);
    } else if (validatedData.type === 'project') {
      // Handle Project Approval
      return await handleProjectApproval(id, validatedData, headers);
    } else {
      return NextResponse.json(
        {
          ok: false,
          error: 'Invalid approval type',
        },
        { status: 400 }
      );
    }
  } catch (error) {
    console.error('Error processing approval:', error);
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
    return NextResponse.json(
      {
        ok: false,
        error: 'Failed to process approval',
      },
      { status: 500 }
    );
  }
}

// Handle RequestApproval
async function handleRequestApproval(
  approvalId: string,
  data: z.infer<typeof approveActionSchema>,
  headers: Headers
) {
  // Find the approval record
  const approval = await prisma.requestApproval.findUnique({
    where: { id: approvalId },
    include: {
      requestForm: {
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
      },
    },
  });

  if (!approval) {
    return NextResponse.json(
      {
        ok: false,
        error: 'Approval not found',
      },
      { status: 404 }
    );
  }

  // Validate user is the approver
  if (approval.userId !== data.userId) {
    return NextResponse.json(
      {
        ok: false,
        error: 'User is not authorized to approve this request',
      },
      { status: 403 }
    );
  }

  // Validate level matches
  if (data.level && approval.level !== data.level) {
    return NextResponse.json(
      {
        ok: false,
        error: 'Approval level mismatch',
      },
      { status: 400 }
    );
  }

  // Validate status is pending
  if (approval.status !== 'pending') {
    return NextResponse.json(
      {
        ok: false,
        error: 'Approval already processed',
      },
      { status: 400 }
    );
  }

  // Update approval status
  const actionDate = new Date().toISOString();
  const newStatus = data.action === 'approve' ? 'approved' : 'rejected';

  await prisma.requestApproval.update({
    where: { id: approvalId },
    data: {
      status: newStatus,
      actionDate,
      comments: data.comments || null,
    },
  });

  // Update request status based on approval workflow
  let newRequestStatus = approval.requestForm.status;

  if (data.action === 'reject') {
    newRequestStatus = 'rejected';
  } else if (data.action === 'approve') {
    if (approval.level === 'dept_head') {
      newRequestStatus = 'pending_admin_head';
    } else if (approval.level === 'admin_head') {
      newRequestStatus = 'approved';
    }
  }

  // Update request status
  const updatedRequest = await prisma.requestForm.update({
    where: { id: approval.requestFormId },
    data: {
      status: newRequestStatus,
    },
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
  });

  // Audit log
  try {
    const userId = data.userId;
    const userSnapshot = {
      id: userId,
      fullName: headers.get('x-user-fullname') || 'Unknown',
      email: headers.get('x-user-email') || 'unknown@example.com',
      role: headers.get('x-user-role') || 'unknown',
      departmentId: headers.get('x-user-department-id') || undefined,
    };

    await createAuditLog({
      userId: userId || 'system',
      userSnapshot,
      actionType: data.action === 'approve' ? 'REQUEST_APPROVED' : 'REQUEST_REJECTED',
      entityType: 'RequestApproval',
      entityId: approvalId,
      description: `${data.action === 'approve' ? 'Approved' : 'Rejected'} request "${updatedRequest.name}" at ${approval.level} level`,
      previousData: approval as any,
      newData: { ...approval, status: newStatus, actionDate, comments: data.comments } as any,
      ipAddress: headers.get('x-forwarded-for') ?? undefined,
      userAgent: headers.get('user-agent') ?? undefined,
    });
  } catch (e) {
    console.warn('Audit log failed (approve request):', e);
  }

  return NextResponse.json({
    ok: true,
    data: updatedRequest,
    message: `Request ${data.action === 'approve' ? 'approved' : 'rejected'} successfully`,
  });
}

// Handle Project Approval
async function handleProjectApproval(
  approvalId: string,
  data: z.infer<typeof approveActionSchema>,
  headers: Headers
) {
  // Find the approval record
  const approval = await prisma.approval.findUnique({
    where: { id: approvalId },
    include: {
      project: {
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
    },
  });

  if (!approval) {
    return NextResponse.json(
      {
        ok: false,
        error: 'Approval not found',
      },
      { status: 404 }
    );
  }

  // Validate user is the approver
  if (approval.userId !== data.userId) {
    return NextResponse.json(
      {
        ok: false,
        error: 'User is not authorized to approve this project',
      },
      { status: 403 }
    );
  }

  // Validate level matches
  if (data.level && approval.level !== data.level) {
    return NextResponse.json(
      {
        ok: false,
        error: 'Approval level mismatch',
      },
      { status: 400 }
    );
  }

  // Validate status is pending
  if (approval.status !== 'pending') {
    return NextResponse.json(
      {
        ok: false,
        error: 'Approval already processed',
      },
      { status: 400 }
    );
  }

  // Update approval status
  const actionDate = new Date().toISOString();
  const newStatus = data.action === 'approve' ? 'approved' : 'rejected';

  await prisma.approval.update({
    where: { id: approvalId },
    data: {
      status: newStatus,
      actionDate,
      comments: data.comments || null,
    },
  });

  // Update project status if needed (based on approval workflow)
  // For now, we'll keep the project status as is, but you can add logic here
  // to update project status based on all approvals

  // Audit log
  try {
    const userId = data.userId;
    const userSnapshot = {
      id: userId,
      fullName: headers.get('x-user-fullname') || 'Unknown',
      email: headers.get('x-user-email') || 'unknown@example.com',
      role: headers.get('x-user-role') || 'unknown',
      departmentId: headers.get('x-user-department-id') || undefined,
    };

    await createAuditLog({
      userId: userId || 'system',
      userSnapshot,
      actionType: data.action === 'approve' ? 'PROJECT_APPROVED' : 'PROJECT_REJECTED',
      entityType: 'Approval',
      entityId: approvalId,
      description: `${data.action === 'approve' ? 'Approved' : 'Rejected'} project "${approval.project.name}" at ${approval.level} level`,
      previousData: approval as any,
      newData: { ...approval, status: newStatus, actionDate, comments: data.comments } as any,
      ipAddress: headers.get('x-forwarded-for') ?? undefined,
      userAgent: headers.get('user-agent') ?? undefined,
    });
  } catch (e) {
    console.warn('Audit log failed (approve project):', e);
  }

  // Fetch updated project with all approvals
  const updatedProject = await prisma.project.findUnique({
    where: { id: approval.projectId },
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

  return NextResponse.json({
    ok: true,
    data: updatedProject,
    message: `Project ${data.action === 'approve' ? 'approved' : 'rejected'} successfully`,
  });
}

