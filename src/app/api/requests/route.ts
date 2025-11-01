import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';
import { createAuditLog } from '@/lib/audit-logger';

// Validation schema
const createRequestSchema = z.object({
  name: z.string().min(1, 'Request name is required'),
  description: z.string().min(1, 'Description is required'),
  requestedBy: z.string().min(1, 'Requester is required'),
  departmentId: z.string().min(1, 'Department is required'),
  type: z.enum(['office_supplies', 'equipment', 'travel', 'training', 'other']),
  requestDate: z.string().min(1, 'Request date is required'),
  items: z.array(z.object({
    name: z.string().min(1),
    description: z.string().optional(),
    quantity: z.number().min(1),
    unitPrice: z.number().min(0),
    totalPrice: z.number().min(0),
    specifications: z.string().optional(),
  })).optional(),
  amount: z.number().min(0).optional(),
  currency: z.string().optional().default('NGN'),
  priority: z.enum(['low', 'medium', 'high', 'urgent']).optional().default('medium'),
  category: z.string().optional(),
  attachments: z.array(z.string()).optional(),
});

// GET /api/requests - List all requests
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status');
    const type = searchParams.get('type');
    const departmentId = searchParams.get('department');
    const requestedBy = searchParams.get('requestedBy');
    const search = searchParams.get('search');

    // Build where clause
    const where: any = {};

    if (status && status !== 'all') {
      where.status = status;
    }

    if (type && type !== 'all') {
      where.type = type;
    }

    if (departmentId && departmentId !== 'all') {
      where.departmentId = departmentId;
    }

    if (requestedBy && requestedBy !== 'all') {
      where.requestedBy = requestedBy;
    }

    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } },
      ];
    }

    const requests = await prisma.requestForm.findMany({
      where,
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
        _count: {
          select: {
            comments: true,
            approvals: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    return NextResponse.json({
      ok: true,
      data: requests,
    });
  } catch (error) {
    console.error('Error fetching requests:', error);
    return NextResponse.json(
      {
        ok: false,
        error: 'Failed to fetch requests',
      },
      { status: 500 }
    );
  }
}

// POST /api/requests - Create new request
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const validatedData = createRequestSchema.parse(body);

    // Validate requester exists
    const requester = await prisma.user.findUnique({
      where: { id: validatedData.requestedBy },
    });

    if (!requester || !requester.isActive) {
      return NextResponse.json(
        {
          ok: false,
          error: 'Requester not found or inactive',
        },
        { status: 400 }
      );
    }

    // Validate department exists
    const department = await prisma.department.findUnique({
      where: { id: validatedData.departmentId },
      include: {
        head: {
          select: {
            id: true,
            fullName: true,
            email: true,
          },
        },
      },
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

    // Calculate total amount from items if not provided
    let totalAmount = validatedData.amount;
    if (validatedData.items && validatedData.items.length > 0) {
      totalAmount = validatedData.items.reduce(
        (sum, item) => sum + (item.totalPrice || item.quantity * item.unitPrice),
        0
      );
    }

    // Create request
    const requestForm = await prisma.requestForm.create({
      data: {
        name: validatedData.name,
        description: validatedData.description,
        requestedBy: validatedData.requestedBy,
        departmentId: validatedData.departmentId,
        type: validatedData.type,
        status: 'pending_dept_head',
        requestDate: validatedData.requestDate,
        items: validatedData.items ? validatedData.items : null,
        amount: totalAmount || null,
        currency: validatedData.currency || 'NGN',
        priority: validatedData.priority || 'medium',
        category: validatedData.category || null,
        attachments: validatedData.attachments ? validatedData.attachments : null,
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
      },
    });

    // Create automatic approvals
    const approvals = [];

    // Find dept head from department
    if (department.headId) {
      const deptHeadApproval = await prisma.requestApproval.create({
        data: {
          requestFormId: requestForm.id,
          userId: department.headId,
          level: 'dept_head',
          status: 'pending',
        },
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
      });
      approvals.push(deptHeadApproval);
    }

    // Find admin head (typically hr_manager or administrator role)
    const adminHead = await prisma.user.findFirst({
      where: {
        role: { in: ['hr_manager', 'administrator', 'admin'] },
        isActive: true,
      },
    });

    if (adminHead) {
      const adminHeadApproval = await prisma.requestApproval.create({
        data: {
          requestFormId: requestForm.id,
          userId: adminHead.id,
          level: 'admin_head',
          status: 'pending',
        },
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
      });
      approvals.push(adminHeadApproval);
    }

    // Audit log (best-effort)
    try {
      const headers = request.headers;
      const userId = headers.get('x-user-id') || validatedData.requestedBy;
      const userSnapshot = {
        id: userId,
        fullName: headers.get('x-user-fullname') || requester.fullName,
        email: headers.get('x-user-email') || requester.email,
        role: headers.get('x-user-role') || requester.role,
        departmentId: headers.get('x-user-department-id') || requester.departmentId || undefined,
      };

      await createAuditLog({
        userId: userId || 'system',
        userSnapshot,
        actionType: 'REQUEST_CREATED',
        entityType: 'RequestForm',
        entityId: requestForm.id,
        description: `Created request "${requestForm.name}" with ${approvals.length} approvals`,
        previousData: null,
        newData: requestForm as any,
        ipAddress: request.ip ?? headers.get('x-forwarded-for') ?? undefined,
        userAgent: headers.get('user-agent') ?? undefined,
      });
    } catch (e) {
      console.warn('Audit log failed (create request):', e);
    }

    return NextResponse.json({
      ok: true,
      data: {
        ...requestForm,
        approvals,
      },
      message: 'Request created successfully',
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

    console.error('Error creating request:', error);
    return NextResponse.json(
      {
        ok: false,
        error: 'Failed to create request',
      },
      { status: 500 }
    );
  }
}


