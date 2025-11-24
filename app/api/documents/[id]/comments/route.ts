import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';
import { createAuditLog } from '@/lib/audit-logger';

// Helper function to check if user can view document
async function canViewDocument(document: any, userId: string | null): Promise<boolean> {
  if (!userId) {
    return document.isPublic;
  }

  if (document.ownerId === userId) {
    return true;
  }

  if (document.isPublic) {
    return true;
  }

  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { departmentId: true },
  });

  if (document.viewUserIds?.includes(userId)) {
    return true;
  }

  if (user?.departmentId && document.viewDepartmentIds?.includes(user.departmentId)) {
    return true;
  }

  return false;
}

// Validation schema
const createCommentSchema = z.object({
  note: z.string().min(1, 'Comment note is required'),
  userId: z.string().min(1, 'User ID is required'),
});

// GET /api/documents/[id]/comments - Get all comments for a document
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const headers = request.headers;
    const currentUserId = headers.get('x-user-id');

    // Check if document exists and user can view it
    const document = await prisma.document.findUnique({
      where: { id },
    });

    if (!document) {
      return NextResponse.json({ ok: false, error: 'Document not found' }, { status: 404 });
    }

    const canView = await canViewDocument(document, currentUserId);
    if (!canView) {
      return NextResponse.json({ ok: false, error: 'Access denied' }, { status: 403 });
    }

    const comments = await prisma.comment.findMany({
      where: { documentId: id },
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
        created: 'desc',
      },
    });

    return NextResponse.json({ ok: true, data: comments });
  } catch (error) {
    console.error('Error fetching comments:', error);
    return NextResponse.json({ ok: false, error: 'Failed to fetch comments' }, { status: 500 });
  }
}

// POST /api/documents/[id]/comments - Add comment to document
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();

    const headers = request.headers;
    const userIdFromHeader = headers.get('x-user-id');
    const validatedData = createCommentSchema.parse({
      ...body,
      userId: body.userId || userIdFromHeader || '',
    });

    // Check if document exists and user can view it
    const document = await prisma.document.findUnique({
      where: { id },
    });

    if (!document) {
      return NextResponse.json({ ok: false, error: 'Document not found' }, { status: 404 });
    }

    const canView = await canViewDocument(document, validatedData.userId);
    if (!canView) {
      return NextResponse.json({ ok: false, error: 'Access denied' }, { status: 403 });
    }

    // Validate user exists
    const user = await prisma.user.findUnique({
      where: { id: validatedData.userId },
    });

    if (!user || !user.isActive) {
      return NextResponse.json({ ok: false, error: 'User not found or inactive' }, { status: 400 });
    }

    // Create comment
    const comment = await prisma.comment.create({
      data: {
        documentId: id,
        userId: validatedData.userId,
        note: validatedData.note,
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
        actionType: 'CREATE',
        entityType: 'Comment',
        entityId: comment.id,
        description: `Added comment to document "${document.title}"`,
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
      return NextResponse.json({ ok: false, error: 'Validation error', details: error.errors }, { status: 400 });
    }

    console.error('Error adding comment:', error);
    return NextResponse.json({ ok: false, error: 'Failed to add comment' }, { status: 500 });
  }
}

