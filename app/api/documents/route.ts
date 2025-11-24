import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { createAuditLog, getUserInfoFromHeaders } from '@/lib/audit-logger';
import { publishToQueue } from '@/lib/rabbitmq';
import { z } from 'zod';

// Validation schemas
const createDocumentSchema = z.object({
  title: z.string().min(1, 'Title is required'),
  contentText: z.string().optional(),
  description: z.string().optional(),
  keywords: z.array(z.string()).optional().default([]),
  isPublic: z.boolean().optional().default(false),
  isGlobalView: z.boolean().optional().default(false),
  isGlobalEdit: z.boolean().optional().default(false),
  originalFilename: z.string().optional(),
  mimeType: z.string().optional(),
  pageCount: z.number().int().positive().optional(),
  checksum: z.string().optional(),
  size: z.number().int().positive().optional(),
  originalFileUrl: z.string().optional(),
  thumbnailUrl: z.string().optional(),
  pdfUrl: z.string().optional(),
  correspondentId: z.string().optional(),
  documentTypeId: z.string().optional(),
  tagIds: z.array(z.string()).optional().default([]),
  viewUserIds: z.array(z.string()).optional().default([]),
  editUserIds: z.array(z.string()).optional().default([]),
  deleteUserIds: z.array(z.string()).optional().default([]),
  viewDepartmentIds: z.array(z.string()).optional().default([]),
  editDepartmentIds: z.array(z.string()).optional().default([]),
  deleteDepartmentIds: z.array(z.string()).optional().default([]),
});

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

  // Get user's department
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

// GET /api/documents - List documents with filters
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const headers = request.headers;
    const currentUserId = headers.get('x-user-id');

    // Extract filters
    const search = searchParams.get('search') || undefined;
    const tagIds = searchParams.get('tagIds')?.split(',').filter(Boolean) || undefined;
    const correspondentId = searchParams.get('correspondentId') || undefined;
    const documentTypeId = searchParams.get('documentTypeId') || undefined;
    const ownerId = searchParams.get('ownerId') || undefined;
    const isPublic = searchParams.get('isPublic') === 'true' ? true : searchParams.get('isPublic') === 'false' ? false : undefined;
    const dateFrom = searchParams.get('dateFrom') || undefined;
    const dateTo = searchParams.get('dateTo') || undefined;
    const sortBy = searchParams.get('sortBy') || 'createdAt';
    const sortOrder = searchParams.get('sortOrder') || 'desc';

    // Build where clause
    const conditions: any[] = [];

    // Search filter
    if (search) {
      conditions.push({
        OR: [
          { title: { contains: search, mode: 'insensitive' } },
          { description: { contains: search, mode: 'insensitive' } },
          { contentText: { contains: search, mode: 'insensitive' } },
          { keywords: { hasSome: [search] } },
        ],
      });
    }

    // Tag filter
    if (tagIds && tagIds.length > 0) {
      conditions.push({ tags: { some: { id: { in: tagIds } } } });
    }

    // Correspondent filter
    if (correspondentId) {
      conditions.push({ correspondentId });
    }

    // Document type filter
    if (documentTypeId) {
      conditions.push({ documentTypeId });
    }

    // Owner filter
    if (ownerId) {
      conditions.push({ ownerId });
    }

    // Public filter
    if (isPublic !== undefined) {
      conditions.push({ isPublic });
    }

    // Date range filters
    if (dateFrom) {
      conditions.push({ createdAt: { gte: new Date(dateFrom) } });
    }
    if (dateTo) {
      conditions.push({ createdAt: { lte: new Date(dateTo) } });
    }

    // Permission-based filtering
    if (currentUserId) {
      const user = await prisma.user.findUnique({
        where: { id: currentUserId },
        select: { departmentId: true },
      });

      const permissionConditions: any[] = [
        { ownerId: currentUserId }, // Own documents
        { isPublic: true }, // Public documents
        { isGlobalView: true }, // Global view access
        { viewUserIds: { has: currentUserId } }, // User has view permission
      ];

      if (user?.departmentId) {
        permissionConditions.push({ viewDepartmentIds: { has: user.departmentId } });
      }

      conditions.push({ OR: permissionConditions });
    } else {
      // No user - only public documents
      conditions.push({ isPublic: true });
    }

    const where = conditions.length > 0 ? { AND: conditions } : {};

    // Build orderBy
    const orderBy: any = {};
    orderBy[sortBy] = sortOrder;

    const documents = await prisma.document.findMany({
      where,
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
      orderBy,
    });

    return NextResponse.json({ ok: true, data: documents });
  } catch (error) {
    console.error('Error fetching documents:', error);
    return NextResponse.json({ ok: false, error: 'Failed to fetch documents' }, { status: 500 });
  }
}

// POST /api/documents - Create document
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const data = createDocumentSchema.parse(body);

    const headers = request.headers;
    const actorUserId = headers.get('x-user-id')?.trim() || undefined;

    // Validate user exists
    let validOwnerId: string | undefined = undefined;
    if (actorUserId) {
      const userExists = await prisma.user.findUnique({
        where: { id: actorUserId },
        select: { id: true },
      });

      if (userExists) {
        validOwnerId = actorUserId;
      } else {
        console.warn(`Warning: User ID ${actorUserId} from x-user-id header not found. Creating document without owner.`);
      }
    }

    // Validate correspondent if provided
    if (data.correspondentId) {
      const correspondent = await prisma.correspondent.findUnique({
        where: { id: data.correspondentId },
      });
      if (!correspondent) {
        return NextResponse.json({ ok: false, error: 'Correspondent not found' }, { status: 400 });
      }
    }

    // Validate document type if provided
    if (data.documentTypeId) {
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

    // Create document
    const created = await prisma.document.create({
      data: {
        title: data.title,
        contentText: data.contentText,
        description: data.description,
        keywords: data.keywords || [],
        isPublic: data.isPublic ?? false,
        isGlobalView: data.isGlobalView ?? false,
        isGlobalEdit: data.isGlobalEdit ?? false,
        originalFilename: data.originalFilename,
        mimeType: data.mimeType,
        pageCount: data.pageCount,
        checksum: data.checksum,
        size: data.size,
        originalFileUrl: data.originalFileUrl,
        thumbnailUrl: data.thumbnailUrl,
        pdfUrl: data.pdfUrl,
        ownerId: validOwnerId,
        correspondentId: data.correspondentId,
        documentTypeId: data.documentTypeId,
        viewUserIds: data.viewUserIds || [],
        editUserIds: data.editUserIds || [],
        deleteUserIds: data.deleteUserIds || [],
        viewDepartmentIds: data.viewDepartmentIds || [],
        editDepartmentIds: data.editDepartmentIds || [],
        deleteDepartmentIds: data.deleteDepartmentIds || [],
        tags: data.tagIds && data.tagIds.length > 0 ? { connect: data.tagIds.map((id) => ({ id })) } : undefined,
        viewUsers: data.viewUserIds && data.viewUserIds.length > 0 ? { connect: data.viewUserIds.map((id) => ({ id })) } : undefined,
        editUsers: data.editUserIds && data.editUserIds.length > 0 ? { connect: data.editUserIds.map((id) => ({ id })) } : undefined,
        deleteUsers: data.deleteUserIds && data.deleteUserIds.length > 0 ? { connect: data.deleteUserIds.map((id) => ({ id })) } : undefined,
        viewDepartments: data.viewDepartmentIds && data.viewDepartmentIds.length > 0 ? { connect: data.viewDepartmentIds.map((id) => ({ id })) } : undefined,
        editDepartments: data.editDepartmentIds && data.editDepartmentIds.length > 0 ? { connect: data.editDepartmentIds.map((id) => ({ id })) } : undefined,
        deleteDepartments: data.deleteDepartmentIds && data.deleteDepartmentIds.length > 0 ? { connect: data.deleteDepartmentIds.map((id) => ({ id })) } : undefined,
      },
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

    // Publish to RabbitMQ queue (synchronous - fails document creation if this fails)
    try {
      await publishToQueue(created);
    } catch (queueError) {
      // Rollback: delete the created document since RabbitMQ publish failed
      // This ensures atomicity - document is only created if queue publish succeeds
      let rollbackSuccess = false;
      try {
        await prisma.document.delete({
          where: { id: created.id },
        });
        rollbackSuccess = true;
      } catch (deleteError) {
        const deleteErrorMsg = deleteError instanceof Error ? deleteError.message : String(deleteError);
        console.error(`[Document API] Failed to rollback document creation (ID: ${created.id}) after RabbitMQ error:`, deleteErrorMsg);
        // This is a critical error - document was created but queue publish failed and rollback also failed
        // Log it but still return the queue error as the primary issue
      }

      const queueErrorMsg = queueError instanceof Error ? queueError.message : String(queueError);
      console.error(`[Document API] RabbitMQ publish failed for document ${created.id}:`, queueErrorMsg);
      
      return NextResponse.json(
        { 
          ok: false, 
          error: 'Failed to publish document to queue',
          details: queueErrorMsg,
          rollbackStatus: rollbackSuccess ? 'success' : 'failed'
        },
        { status: 500 }
      );
    }

    // Audit log
    try {
      const { userId, userSnapshot } = getUserInfoFromHeaders(headers);
      await createAuditLog({
        userId: userId || 'system',
        userSnapshot,
        actionType: 'CREATE',
        entityType: 'Document',
        entityId: created.id,
        description: `Created document "${created.title}"`,
        previousData: null,
        newData: created as any,
        ipAddress: request.ip ?? headers.get('x-forwarded-for') ?? undefined,
        userAgent: headers.get('user-agent') ?? undefined,
      });
    } catch (e) {
      console.warn('Audit log failed (create document):', e);
    }

    return NextResponse.json({ ok: true, data: created, message: 'Document created successfully' });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ ok: false, error: 'Validation error', details: error.errors }, { status: 400 });
    }
    console.error('Error creating document:', error);
    return NextResponse.json({ ok: false, error: 'Failed to create document' }, { status: 500 });
  }
}

