import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';
import { createAuditLog } from '@/lib/audit-logger';

// Validation schema
const addAttachmentSchema = z.object({
  attachmentUrl: z.string().min(1, 'Attachment URL is required'),
});

// GET /api/requests/[id]/attachments - Get all attachments for a request
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    // Check if request exists
    const requestForm = await prisma.requestForm.findUnique({
      where: { id },
      select: {
        id: true,
        attachments: true,
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

    const attachments = (requestForm.attachments as string[]) || [];

    return NextResponse.json({
      ok: true,
      data: attachments,
    });
  } catch (error) {
    console.error('Error fetching attachments:', error);
    return NextResponse.json(
      {
        ok: false,
        error: 'Failed to fetch attachments',
      },
      { status: 500 }
    );
  }
}

// POST /api/requests/[id]/attachments - Add attachment to request
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const validatedData = addAttachmentSchema.parse(body);

    // Check if request exists
    const existingRequest = await prisma.requestForm.findUnique({
      where: { id },
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

    // Get current attachments
    const currentAttachments = (existingRequest.attachments as string[]) || [];

    // Check if attachment already exists
    if (currentAttachments.includes(validatedData.attachmentUrl)) {
      return NextResponse.json(
        {
          ok: false,
          error: 'Attachment already exists',
        },
        { status: 400 }
      );
    }

    // Add attachment
    const updatedAttachments = [...currentAttachments, validatedData.attachmentUrl];

    const updatedRequest = await prisma.requestForm.update({
      where: { id },
      data: {
        attachments: updatedAttachments,
      },
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

    // Audit log
    try {
      const headers = request.headers;
      const userId = headers.get('x-user-id') || existingRequest.requestedBy;
      const userSnapshot = {
        id: userId,
        fullName: headers.get('x-user-fullname') || updatedRequest.requestedByUser?.fullName || 'Unknown',
        email: headers.get('x-user-email') || updatedRequest.requestedByUser?.email || 'unknown@example.com',
        role: headers.get('x-user-role') || 'unknown',
        departmentId: headers.get('x-user-department-id') || undefined,
      };

      await createAuditLog({
        userId: userId || 'system',
        userSnapshot,
        actionType: 'REQUEST_ATTACHMENT_ADDED',
        entityType: 'RequestForm',
        entityId: id,
        description: `Added attachment to request "${existingRequest.name}"`,
        previousData: { attachments: currentAttachments },
        newData: { attachments: updatedAttachments },
        ipAddress: request.ip ?? headers.get('x-forwarded-for') ?? undefined,
        userAgent: headers.get('user-agent') ?? undefined,
      });
    } catch (e) {
      console.warn('Audit log failed (add attachment):', e);
    }

    return NextResponse.json({
      ok: true,
      data: updatedAttachments,
      message: 'Attachment added successfully',
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

    console.error('Error adding attachment:', error);
    return NextResponse.json(
      {
        ok: false,
        error: 'Failed to add attachment',
      },
      { status: 500 }
    );
  }
}

// DELETE /api/requests/[id]/attachments - Remove attachment from request
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const { searchParams } = new URL(request.url);
    const attachmentUrl = searchParams.get('url');

    if (!attachmentUrl) {
      return NextResponse.json(
        {
          ok: false,
          error: 'Attachment URL is required',
        },
        { status: 400 }
      );
    }

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

    // Get current attachments
    const currentAttachments = (existingRequest.attachments as string[]) || [];

    // Check if attachment exists
    if (!currentAttachments.includes(attachmentUrl)) {
      return NextResponse.json(
        {
          ok: false,
          error: 'Attachment not found',
        },
        { status: 404 }
      );
    }

    // Remove attachment
    const updatedAttachments = currentAttachments.filter((url) => url !== attachmentUrl);

    await prisma.requestForm.update({
      where: { id },
      data: {
        attachments: updatedAttachments,
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
        description: `Removed attachment from request "${existingRequest.name}"`,
        previousData: { attachments: currentAttachments },
        newData: { attachments: updatedAttachments },
        ipAddress: request.ip ?? headers.get('x-forwarded-for') ?? undefined,
        userAgent: headers.get('user-agent') ?? undefined,
      });
    } catch (e) {
      console.warn('Audit log failed (remove attachment):', e);
    }

    return NextResponse.json({
      ok: true,
      data: updatedAttachments,
      message: 'Attachment removed successfully',
    });
  } catch (error) {
    console.error('Error removing attachment:', error);
    return NextResponse.json(
      {
        ok: false,
        error: 'Failed to remove attachment',
      },
      { status: 500 }
    );
  }
}


