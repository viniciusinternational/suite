import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { createAuditLog, getUserInfoFromHeaders } from '@/lib/audit-logger';
import { z } from 'zod';

// Helper function to check if user can access document
async function canAccessDocument(
  document: any,
  userId: string | null,
  accessType: 'view' | 'edit' | 'delete'
): Promise<boolean> {
  if (!userId) {
    // For non-authenticated users, check public and global view
    return accessType === 'view' && (document.isPublic || document.isGlobalView);
  }

  // Owner always has full access
  if (document.ownerId === userId) {
    return true;
  }

  // Check global access
  if (accessType === 'view' && document.isGlobalView) {
    return true;
  }
  if (accessType === 'edit' && document.isGlobalEdit) {
    return true;
  }

  // Check public access for view
  if (accessType === 'view' && document.isPublic) {
    return true;
  }

  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { departmentId: true },
  });

  // Check user-level permissions
  const userPermissionField = `${accessType}UserIds` as const;
  if (document[userPermissionField]?.includes(userId)) {
    return true;
  }

  // Check department-level permissions
  if (user?.departmentId) {
    const deptPermissionField = `${accessType}DepartmentIds` as const;
    if (document[deptPermissionField]?.includes(user.departmentId)) {
      return true;
    }
  }

  return false;
}

const updateDocumentSchema = z.object({
  title: z.string().min(1).optional(),
  contentText: z.string().optional(),
  description: z.string().optional(),
  keywords: z.array(z.string()).optional(),
  isPublic: z.boolean().optional(),
  isGlobalView: z.boolean().optional(),
  isGlobalEdit: z.boolean().optional(),
  originalFilename: z.string().optional(),
  mimeType: z.string().optional(),
  pageCount: z.number().int().positive().optional(),
  checksum: z.string().optional(),
  size: z.number().int().positive().optional(),
  originalFileUrl: z.string().optional(),
  thumbnailUrl: z.string().optional(),
  pdfUrl: z.string().optional(),
  correspondentId: z.string().optional().nullable(),
  documentTypeId: z.string().optional().nullable(),
  tagIds: z.array(z.string()).optional(),
  viewUserIds: z.array(z.string()).optional(),
  editUserIds: z.array(z.string()).optional(),
  deleteUserIds: z.array(z.string()).optional(),
  viewDepartmentIds: z.array(z.string()).optional(),
  editDepartmentIds: z.array(z.string()).optional(),
  deleteDepartmentIds: z.array(z.string()).optional(),
});

// GET /api/documents/[id]
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const headers = request.headers;
    const currentUserId = headers.get('x-user-id');

    const document = await prisma.document.findUnique({
      where: { id },
      include: {
        owner: { select: { id: true, fullName: true, email: true } },
        correspondent: true,
        documentType: true,
        tags: true,
        comments: {
          include: {
            user: { select: { id: true, fullName: true, email: true, avatar: true } },
          },
          orderBy: { created: 'desc' },
        },
        viewUsers: { select: { id: true, fullName: true, email: true, role: true } },
        editUsers: { select: { id: true, fullName: true, email: true, role: true } },
        deleteUsers: { select: { id: true, fullName: true, email: true, role: true } },
        viewDepartments: { select: { id: true, name: true, code: true } },
        editDepartments: { select: { id: true, name: true, code: true } },
        deleteDepartments: { select: { id: true, name: true, code: true } },
      },
    });

    if (!document) {
      return NextResponse.json({ ok: false, error: 'Document not found' }, { status: 404 });
    }

    // Check view permission
    const canView = await canAccessDocument(document, currentUserId, 'view');
    if (!canView) {
      return NextResponse.json({ ok: false, error: 'Access denied' }, { status: 403 });
    }

    // Audit log for view
    try {
      const { userId, userSnapshot } = getUserInfoFromHeaders(headers);
      await createAuditLog({
        userId: userId || 'system',
        userSnapshot,
        actionType: 'READ',
        entityType: 'Document',
        entityId: id,
        description: `Viewed document "${document.title}"`,
        previousData: null,
        newData: null,
        ipAddress: request.ip ?? headers.get('x-forwarded-for') ?? undefined,
        userAgent: headers.get('user-agent') ?? undefined,
      });
    } catch (e) {
      console.warn('Audit log failed (view document):', e);
    }

    return NextResponse.json({ ok: true, data: document });
  } catch (error) {
    console.error('Error fetching document:', error);
    return NextResponse.json({ ok: false, error: 'Failed to fetch document' }, { status: 500 });
  }
}

// PUT /api/documents/[id]
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const data = updateDocumentSchema.parse(body);

    const headers = request.headers;
    const currentUserId = headers.get('x-user-id');

    const existing = await prisma.document.findUnique({
      where: { id },
      include: {
        tags: true,
      },
    });

    if (!existing) {
      return NextResponse.json({ ok: false, error: 'Document not found' }, { status: 404 });
    }

    // Check edit permission
    const canEdit = await canAccessDocument(existing, currentUserId, 'edit');
    if (!canEdit) {
      return NextResponse.json({ ok: false, error: 'Access denied' }, { status: 403 });
    }

    // Validate correspondent if provided
    if (data.correspondentId !== undefined && data.correspondentId !== null) {
      const correspondent = await prisma.correspondent.findUnique({
        where: { id: data.correspondentId },
      });
      if (!correspondent) {
        return NextResponse.json({ ok: false, error: 'Correspondent not found' }, { status: 400 });
      }
    }

    // Validate document type if provided
    if (data.documentTypeId !== undefined && data.documentTypeId !== null) {
      const documentType = await prisma.documentType.findUnique({
        where: { id: data.documentTypeId },
      });
      if (!documentType) {
        return NextResponse.json({ ok: false, error: 'Document type not found' }, { status: 400 });
      }
    }

    // Validate tags if provided
    if (data.tagIds && data.tagIds.length > 0) {
      const tags = await prisma.tag.findMany({
        where: { id: { in: data.tagIds } },
      });
      if (tags.length !== data.tagIds.length) {
        return NextResponse.json({ ok: false, error: 'One or more tags not found' }, { status: 400 });
      }
    }

    // Build update data
    const updateData: any = {};
    if (data.title !== undefined) updateData.title = data.title;
    if (data.contentText !== undefined) updateData.contentText = data.contentText;
    if (data.description !== undefined) updateData.description = data.description;
    if (data.keywords !== undefined) updateData.keywords = data.keywords;
    if (data.isPublic !== undefined) updateData.isPublic = data.isPublic;
    if (data.isGlobalView !== undefined) updateData.isGlobalView = data.isGlobalView;
    if (data.isGlobalEdit !== undefined) updateData.isGlobalEdit = data.isGlobalEdit;
    if (data.originalFilename !== undefined) updateData.originalFilename = data.originalFilename;
    if (data.mimeType !== undefined) updateData.mimeType = data.mimeType;
    if (data.pageCount !== undefined) updateData.pageCount = data.pageCount;
    if (data.checksum !== undefined) updateData.checksum = data.checksum;
    if (data.size !== undefined) updateData.size = data.size;
    if (data.originalFileUrl !== undefined) updateData.originalFileUrl = data.originalFileUrl;
    if (data.thumbnailUrl !== undefined) updateData.thumbnailUrl = data.thumbnailUrl;
    if (data.pdfUrl !== undefined) updateData.pdfUrl = data.pdfUrl;
    if (data.correspondentId !== undefined) updateData.correspondentId = data.correspondentId;
    if (data.documentTypeId !== undefined) updateData.documentTypeId = data.documentTypeId;
    if (data.viewUserIds !== undefined) updateData.viewUserIds = data.viewUserIds;
    if (data.editUserIds !== undefined) updateData.editUserIds = data.editUserIds;
    if (data.deleteUserIds !== undefined) updateData.deleteUserIds = data.deleteUserIds;
    if (data.viewDepartmentIds !== undefined) updateData.viewDepartmentIds = data.viewDepartmentIds;
    if (data.editDepartmentIds !== undefined) updateData.editDepartmentIds = data.editDepartmentIds;
    if (data.deleteDepartmentIds !== undefined) updateData.deleteDepartmentIds = data.deleteDepartmentIds;

    // Handle tags relation
    if (data.tagIds !== undefined) {
      updateData.tags = { set: data.tagIds.map((tagId) => ({ id: tagId })) };
    }

    // Handle user relations
    if (data.viewUserIds !== undefined) {
      updateData.viewUsers = { set: data.viewUserIds.map((userId) => ({ id: userId })) };
    }
    if (data.editUserIds !== undefined) {
      updateData.editUsers = { set: data.editUserIds.map((userId) => ({ id: userId })) };
    }
    if (data.deleteUserIds !== undefined) {
      updateData.deleteUsers = { set: data.deleteUserIds.map((userId) => ({ id: userId })) };
    }

    // Handle department relations
    if (data.viewDepartmentIds !== undefined) {
      updateData.viewDepartments = { set: data.viewDepartmentIds.map((deptId) => ({ id: deptId })) };
    }
    if (data.editDepartmentIds !== undefined) {
      updateData.editDepartments = { set: data.editDepartmentIds.map((deptId) => ({ id: deptId })) };
    }
    if (data.deleteDepartmentIds !== undefined) {
      updateData.deleteDepartments = { set: data.deleteDepartmentIds.map((deptId) => ({ id: deptId })) };
    }

    const previous = await prisma.document.findUnique({ where: { id } });
    const updated = await prisma.document.update({
      where: { id },
      data: updateData,
      include: {
        owner: { select: { id: true, fullName: true, email: true } },
        correspondent: true,
        documentType: true,
        tags: true,
        viewUsers: { select: { id: true, fullName: true, email: true, role: true } },
        editUsers: { select: { id: true, fullName: true, email: true, role: true } },
        deleteUsers: { select: { id: true, fullName: true, email: true, role: true } },
        viewDepartments: { select: { id: true, name: true, code: true } },
        editDepartments: { select: { id: true, name: true, code: true } },
        deleteDepartments: { select: { id: true, name: true, code: true } },
      },
    });

    // Audit log
    try {
      const { userId, userSnapshot } = getUserInfoFromHeaders(headers);
      await createAuditLog({
        userId: userId || 'system',
        userSnapshot,
        actionType: 'UPDATE',
        entityType: 'Document',
        entityId: updated.id,
        description: `Updated document "${updated.title}"`,
        previousData: previous as any,
        newData: updated as any,
        ipAddress: request.ip ?? headers.get('x-forwarded-for') ?? undefined,
        userAgent: headers.get('user-agent') ?? undefined,
      });
    } catch (e) {
      console.warn('Audit log failed (update document):', e);
    }

    return NextResponse.json({ ok: true, data: updated, message: 'Document updated successfully' });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ ok: false, error: 'Validation error', details: error.errors }, { status: 400 });
    }
    console.error('Error updating document:', error);
    return NextResponse.json({ ok: false, error: 'Failed to update document' }, { status: 500 });
  }
}

// DELETE /api/documents/[id]
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const headers = request.headers;
    const currentUserId = headers.get('x-user-id');

    const existing = await prisma.document.findUnique({ where: { id } });
    if (!existing) {
      return NextResponse.json({ ok: false, error: 'Document not found' }, { status: 404 });
    }

    // Check delete permission
    const canDelete = await canAccessDocument(existing, currentUserId, 'delete');
    if (!canDelete) {
      return NextResponse.json({ ok: false, error: 'Access denied' }, { status: 403 });
    }

    await prisma.document.delete({ where: { id } });

    // Audit log
    try {
      const { userId, userSnapshot } = getUserInfoFromHeaders(headers);
      await createAuditLog({
        userId: userId || 'system',
        userSnapshot,
        actionType: 'DELETE',
        entityType: 'Document',
        entityId: id,
        description: `Deleted document "${existing.title}"`,
        previousData: existing as any,
        newData: null,
        ipAddress: request.ip ?? headers.get('x-forwarded-for') ?? undefined,
        userAgent: headers.get('user-agent') ?? undefined,
      });
    } catch (e) {
      console.warn('Audit log failed (delete document):', e);
    }

    return NextResponse.json({ ok: true, message: 'Document deleted successfully' });
  } catch (error) {
    console.error('Error deleting document:', error);
    return NextResponse.json({ ok: false, error: 'Failed to delete document' }, { status: 500 });
  }
}

