import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';
import { createAuditLog } from '@/lib/audit-logger';

// Validation schema
const createCommentSchema = z.object({
  content: z.string().min(1, 'Comment content is required'),
  userId: z.string().min(1, 'User ID is required'),
});

// GET /api/requests/[id]/comments - Get all comments for a request
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    // Check if request exists
    const requestForm = await prisma.requestForm.findUnique({
      where: { id },
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

    const comments = await prisma.requestComment.findMany({
      where: { requestFormId: id },
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
    });

    return NextResponse.json({
      ok: true,
      data: comments,
    });
  } catch (error) {
    console.error('Error fetching comments:', error);
    return NextResponse.json(
      {
        ok: false,
        error: 'Failed to fetch comments',
      },
      { status: 500 }
    );
  }
}

// POST /api/requests/[id]/comments - Add comment to request
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
    const validatedData = createCommentSchema.parse({
      ...body,
      userId: body.userId || userIdFromHeader || '',
    });

    // Check if request exists
    const requestForm = await prisma.requestForm.findUnique({
      where: { id },
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
    const user = await prisma.user.findUnique({
      where: { id: validatedData.userId },
    });

    if (!user || !user.isActive) {
      return NextResponse.json(
        {
          ok: false,
          error: 'User not found or inactive',
        },
        { status: 400 }
      );
    }

    // Create comment
    const comment = await prisma.requestComment.create({
      data: {
        requestFormId: id,
        userId: validatedData.userId,
        content: validatedData.content,
      },
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
    });

    // Audit log
    try {
      const userSnapshot = {
        id: validatedData.userId,
        fullName: headers.get('x-user-fullname') || user.fullName,
        email: headers.get('x-user-email') || user.email,
        role: headers.get('x-user-role') || user.role,
        departmentId: headers.get('x-user-department-id') || user.departmentId || undefined,
      };

      await createAuditLog({
        userId: validatedData.userId,
        userSnapshot,
        actionType: 'REQUEST_COMMENT_ADDED',
        entityType: 'RequestComment',
        entityId: comment.id,
        description: `Added comment to request "${requestForm.name}"`,
        previousData: null,
        newData: comment as any,
        ipAddress: request.ip ?? headers.get('x-forwarded-for') ?? undefined,
        userAgent: headers.get('user-agent') ?? undefined,
      });
    } catch (e) {
      console.warn('Audit log failed (add comment):', e);
    }

    return NextResponse.json({
      ok: true,
      data: comment,
      message: 'Comment added successfully',
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

    console.error('Error adding comment:', error);
    return NextResponse.json(
      {
        ok: false,
        error: 'Failed to add comment',
      },
      { status: 500 }
    );
  }
}


