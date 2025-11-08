import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

// GET /api/approvals - Get all pending approvals for current user
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

    // Fetch pending RequestApprovals for the current user
    const pendingRequestApprovals = await prisma.requestApproval.findMany({
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

    // Fetch pending Approvals (Project approvals) for the current user
    const pendingProjectApprovals = await prisma.approval.findMany({
      where: {
        userId: userId,
        status: 'pending',
      },
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
                avatar: true,
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

    // Fetch pending Payroll approvals for the current user
    const pendingPayrollApprovals = await prisma.payrollApproval.findMany({
      where: {
        userId: userId,
        status: 'pending',
      },
      include: {
        payroll: true,
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

    // Fetch pending Payment approvals for the current user
    const pendingPaymentApprovals = await prisma.paymentApproval.findMany({
      where: {
        userId: userId,
        status: 'pending',
      },
      include: {
        payment: {
          select: {
            id: true,
            currency: true,
            totalAmount: true,
            status: true,
            method: true,
            reference: true,
            paymentDate: true,
            projectId: true,
            requestFormId: true,
            payrollId: true,
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

    // Transform RequestApprovals to unified format
    const requestApprovals = pendingRequestApprovals.map((approval) => ({
      id: approval.id,
      type: 'request' as const,
      approvalId: approval.id,
      entityId: approval.requestFormId,
      entityType: 'RequestForm',
      level: approval.level,
      status: approval.status,
      actionDate: approval.actionDate,
      comments: approval.comments,
      createdAt: approval.createdAt,
      updatedAt: approval.updatedAt,
      approver: approval.user,
      entity: {
        id: approval.requestForm.id,
        name: approval.requestForm.name,
        description: approval.requestForm.description,
        type: approval.requestForm.type,
        status: approval.requestForm.status,
        amount: approval.requestForm.amount,
        currency: approval.requestForm.currency,
        priority: approval.requestForm.priority,
        requestDate: approval.requestForm.requestDate,
        requestedBy: approval.requestForm.requestedByUser,
        department: approval.requestForm.department,
      },
    }));

    // Transform Project Approvals to unified format
    const projectApprovals = pendingProjectApprovals.map((approval) => ({
      id: approval.id,
      type: 'project' as const,
      approvalId: approval.id,
      entityId: approval.projectId,
      entityType: 'Project',
      level: approval.level,
      status: approval.status,
      actionDate: approval.actionDate,
      comments: approval.comments,
      createdAt: approval.createdAt,
      updatedAt: approval.updatedAt,
      approver: approval.user,
      entity: {
        id: approval.project.id,
        name: approval.project.name,
        code: approval.project.code,
        description: approval.project.description,
        budget: approval.project.budget,
        spent: approval.project.spent,
        status: approval.project.status,
        priority: approval.project.priority,
        startDate: approval.project.startDate,
        endDate: approval.project.endDate,
        department: approval.project.department,
        manager: approval.project.manager,
      },
    }));

    const payrollApprovals = pendingPayrollApprovals.map((approval) => ({
      id: approval.id,
      type: 'payroll' as const,
      approvalId: approval.id,
      entityId: approval.payrollId,
      entityType: 'Payroll',
      level: approval.level,
      status: approval.status,
      actionDate: approval.actionDate,
      comments: approval.comments,
      createdAt: approval.createdAt,
      updatedAt: approval.updatedAt,
      approver: approval.user,
      entity: {
        id: approval.payroll.id,
        periodMonth: approval.payroll.periodMonth,
        periodYear: approval.payroll.periodYear,
        status: approval.payroll.status,
        createdAt: approval.payroll.createdAt,
      },
    }));

    const paymentApprovals = pendingPaymentApprovals.map((approval) => ({
      id: approval.id,
      type: 'payment' as const,
      approvalId: approval.id,
      entityId: approval.paymentId,
      entityType: 'Payment',
      level: approval.level,
      status: approval.status,
      actionDate: approval.actionDate,
      comments: approval.comments,
      createdAt: approval.createdAt,
      updatedAt: approval.updatedAt,
      approver: approval.user,
      entity: {
        id: approval.payment.id,
        totalAmount: approval.payment.totalAmount,
        currency: approval.payment.currency,
        status: approval.payment.status,
        method: approval.payment.method,
        reference: approval.payment.reference,
        paymentDate: approval.payment.paymentDate,
      },
    }));

    // Combine all approvals
    const allApprovals = [
      ...requestApprovals,
      ...projectApprovals,
      ...payrollApprovals,
      ...paymentApprovals,
    ].sort(
      (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );

    return NextResponse.json({
      ok: true,
      data: allApprovals,
      counts: {
        total: allApprovals.length,
        requests: requestApprovals.length,
        projects: projectApprovals.length,
        payroll: payrollApprovals.length,
        payments: paymentApprovals.length,
      },
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

