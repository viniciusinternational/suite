import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';
import { createAuditLog, getUserInfoFromHeaders } from '@/lib/audit-logger';

// Validation schema
const updateCommentSchema = z.object({
  note: z.string().min(1, 'Comment note is required'),
});

// PUT /api/documents/[id]/comments/[commentId] - Update comment
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; commentId: string }> }
) {
  try {
    const { id, commentId } = await params;
    const body = await request.json();
    const data = updateCommentSchema.parse(body);

    const headers = request.headers;
    const currentUserId = headers.get('x-user-id');

    // Check if comment exists
    const existingComment = await prisma.comment.findUnique({
      where: { id: commentId },
      include: {
        document: true,
      },
    });

    if (!existingComment) {
      return NextResponse.json({ ok: false, error: 'Comment not found' }, { status: 404 });
    }

    // Verify comment belongs to document
    if (existingComment.documentId !== id) {
      return NextResponse.json({ ok: false, error: 'Comment does not belong to this document' }, { status: 400 });
    }

    // Only the comment owner can update their comment
    if (existingComment.userId !== currentUserId) {
      return NextResponse.json({ ok: false, error: 'Access denied' }, { status: 403 });
    }

    const previous = await prisma.comment.findUnique({ where: { id: commentId } });
    const updated = await prisma.comment.update({
      where: { id: commentId },
      data: {
        note: data.note,
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
      const { userId, userSnapshot } = getUserInfoFromHeaders(headers);
      await createAuditLog({
        userId: userId || 'system',
        userSnapshot,
        actionType: 'UPDATE',
        entityType: 'Comment',
        entityId: commentId,
        description: `Updated comment on document "${existingComment.document.title}"`,
        previousData: previous as any,
        newData: updated as any,
        ipAddress: request.ip ?? headers.get('x-forwarded-for') ?? undefined,
        userAgent: headers.get('user-agent') ?? undefined,
      });
    } catch (e) {
      console.warn('Audit log failed (update comment):', e);
    }

    return NextResponse.json({ ok: true, data: updated, message: 'Comment updated successfully' });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ ok: false, error: 'Validation error', details: error.errors }, { status: 400 });
    }

    console.error('Error updating comment:', error);
    return NextResponse.json({ ok: false, error: 'Failed to update comment' }, { status: 500 });
  }
}

// DELETE /api/documents/[id]/comments/[commentId] - Delete comment
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; commentId: string }> }
) {
  try {
    const { id, commentId } = await params;
    const headers = request.headers;
    const currentUserId = headers.get('x-user-id');

    // Check if comment exists
    const existingComment = await prisma.comment.findUnique({
      where: { id: commentId },
      include: {
        document: true,
      },
    });

    if (!existingComment) {
      return NextResponse.json({ ok: false, error: 'Comment not found' }, { status: 404 });
    }

    // Verify comment belongs to document
    if (existingComment.documentId !== id) {
      return NextResponse.json({ ok: false, error: 'Comment does not belong to this document' }, { status: 400 });
    }

    // Only the comment owner can delete their comment
    if (existingComment.userId !== currentUserId) {
      return NextResponse.json({ ok: false, error: 'Access denied' }, { status: 403 });
    }

    await prisma.comment.delete({ where: { id: commentId } });

    // Audit log
    try {
      const { userId, userSnapshot } = getUserInfoFromHeaders(headers);
      await createAuditLog({
        userId: userId || 'system',
        userSnapshot,
        actionType: 'DELETE',
        entityType: 'Comment',
        entityId: commentId,
        description: `Deleted comment on document "${existingComment.document.title}"`,
        previousData: existingComment as any,
        newData: null,
        ipAddress: request.ip ?? headers.get('x-forwarded-for') ?? undefined,
        userAgent: headers.get('user-agent') ?? undefined,
      });
    } catch (e) {
      console.warn('Audit log failed (delete comment):', e);
    }

    return NextResponse.json({ ok: true, message: 'Comment deleted successfully' });
  } catch (error) {
    console.error('Error deleting comment:', error);
    return NextResponse.json({ ok: false, error: 'Failed to delete comment' }, { status: 500 });
  }
}

