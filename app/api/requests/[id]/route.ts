import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';
import { createAuditLog } from '@/lib/audit-logger';

// Validation schema for updates
const updateRequestSchema = z.object({
  name: z.string().min(1).optional(),
  description: z.string().min(1).optional(),
  type: z.enum(['office_supplies', 'equipment', 'travel', 'training', 'other']).optional(),
  requestDate: z.string().optional(),
  items: z.array(z.object({
    name: z.string().min(1),
    description: z.string().optional(),
    quantity: z.number().min(1),
    unitPrice: z.number().min(0),
    totalPrice: z.number().min(0),
    specifications: z.string().optional(),
  })).optional(),
  amount: z.number().min(0).optional(),
  currency: z.string().optional(),
  priority: z.enum(['low', 'medium', 'high', 'urgent']).optional(),
  category: z.string().optional(),
  attachments: z.array(z.string()).optional(),
  status: z.enum(['pending_dept_head', 'pending_admin_head', 'approved', 'rejected']).optional(),
});

// GET /api/requests/[id] - Get single request
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const requestForm = await prisma.requestForm.findUnique({
      where: { id },
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
            sector: true,
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
                avatar: true,
              },
            },
          },
          orderBy: {
            level: 'asc',
          },
        },
        comments: {
          include: {
            user: {
              select: {
                id: true,
                fullName: true,
                email: true,
                avatar: true,
              },
            },
          },
          orderBy: {
            createdAt: 'desc',
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

    return NextResponse.json({
      ok: true,
      data: requestForm,
    });
  } catch (error) {
    console.error('Error fetching request:', error);
    return NextResponse.json(
      {
        ok: false,
        error: 'Failed to fetch request',
      },
      { status: 500 }
    );
  }
}

// PUT /api/requests/[id] - Update request
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const validatedData = updateRequestSchema.parse(body);

    // Check if request exists
    const existingRequest = await prisma.requestForm.findUnique({
      where: { id },
      include: {
        requestedByUser: {
          select: {
            id: true,
            fullName: true,
            email: true,
          },
        },
      },
    });

    if (!existingRequest) {
      return NextResponse.json(
        {
          ok: false,
          error: 'Request not found',
        },
        { status: 404 }
      );
    }

    // Calculate total amount from items if items are being updated
    let totalAmount = validatedData.amount;
    if (validatedData.items && validatedData.items.length > 0) {
      totalAmount = validatedData.items.reduce(
        (sum, item) => sum + (item.totalPrice || item.quantity * item.unitPrice),
        0
      );
    } else if (validatedData.amount === undefined) {
      totalAmount = existingRequest.amount;
    }

    // Prepare update data
    const updateData: any = {};
    if (validatedData.name) updateData.name = validatedData.name;
    if (validatedData.description) updateData.description = validatedData.description;
    if (validatedData.type) updateData.type = validatedData.type;
    if (validatedData.requestDate) updateData.requestDate = validatedData.requestDate;
    if (validatedData.items !== undefined) updateData.items = validatedData.items;
    if (totalAmount !== undefined) updateData.amount = totalAmount;
    if (validatedData.currency) updateData.currency = validatedData.currency;
    if (validatedData.priority) updateData.priority = validatedData.priority;
    if (validatedData.category !== undefined) updateData.category = validatedData.category;
    if (validatedData.attachments !== undefined) updateData.attachments = validatedData.attachments;
    if (validatedData.status) updateData.status = validatedData.status;

    // Update request
    const updatedRequest = await prisma.requestForm.update({
      where: { id },
      data: updateData,
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
        },
      },
    });

    // Audit log
    try {
      const headers = request.headers;
      const userId = headers.get('x-user-id') || existingRequest.requestedBy;
      const userSnapshot = {
        id: userId,
        fullName: headers.get('x-user-fullname') || existingRequest.requestedByUser?.fullName || 'Unknown',
        email: headers.get('x-user-email') || existingRequest.requestedByUser?.email || 'unknown@example.com',
        role: headers.get('x-user-role') || 'unknown',
        departmentId: headers.get('x-user-department-id') || undefined,
      };

      await createAuditLog({
        userId: userId || 'system',
        userSnapshot,
        actionType: 'UPDATE',
        entityType: 'RequestForm',
        entityId: id,
        description: `Updated request "${updatedRequest.name}"`,
        previousData: existingRequest as any,
        newData: updatedRequest as any,
        ipAddress: request.ip ?? headers.get('x-forwarded-for') ?? undefined,
        userAgent: headers.get('user-agent') ?? undefined,
      });
    } catch (e) {
      console.warn('Audit log failed (update request):', e);
    }

    return NextResponse.json({
      ok: true,
      data: updatedRequest,
      message: 'Request updated successfully',
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

    console.error('Error updating request:', error);
    return NextResponse.json(
      {
        ok: false,
        error: 'Failed to update request',
      },
      { status: 500 }
    );
  }
}

// DELETE /api/requests/[id] - Delete request
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    // Check if request exists
    const existingRequest = await prisma.requestForm.findUnique({
      where: { id },
      include: {
        requestedByUser: {
          select: {
            id: true,
            fullName: true,
            email: true,
          },
        },
      },
    });

    if (!existingRequest) {
      return NextResponse.json(
        {
          ok: false,
          error: 'Request not found',
        },
        { status: 404 }
      );
    }

    // Delete request (cascade will delete related approvals and comments)
    await prisma.requestForm.delete({
      where: { id },
    });

    // Audit log
    try {
      const headers = request.headers;
      const userId = headers.get('x-user-id') || existingRequest.requestedBy;
      const userSnapshot = {
        id: userId,
        fullName: headers.get('x-user-fullname') || existingRequest.requestedByUser?.fullName || 'Unknown',
        email: headers.get('x-user-email') || existingRequest.requestedByUser?.email || 'unknown@example.com',
        role: headers.get('x-user-role') || 'unknown',
        departmentId: headers.get('x-user-department-id') || undefined,
      };

      await createAuditLog({
        userId: userId || 'system',
        userSnapshot,
        actionType: 'DELETE',
        entityType: 'RequestForm',
        entityId: id,
        description: `Deleted request "${existingRequest.name}"`,
        previousData: existingRequest as any,
        newData: null,
        ipAddress: request.ip ?? headers.get('x-forwarded-for') ?? undefined,
        userAgent: headers.get('user-agent') ?? undefined,
      });
    } catch (e) {
      console.warn('Audit log failed (delete request):', e);
    }

    return NextResponse.json({
      ok: true,
      message: 'Request deleted successfully',
    });
  } catch (error) {
    console.error('Error deleting request:', error);
    return NextResponse.json(
      {
        ok: false,
        error: 'Failed to delete request',
      },
      { status: 500 }
    );
  }
}


