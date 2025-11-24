import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { createAuditLog, getUserInfoFromHeaders } from '@/lib/audit-logger';
import { z } from 'zod';

// Validation schema
const updateDocumentTypeSchema = z.object({
  name: z.string().min(1).optional(),
  slug: z.string().min(1).optional(),
});

// Helper to generate slug from name
function generateSlug(name: string): string {
  return name
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, '')
    .replace(/[\s_-]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

// GET /api/document-types/[id] - Get single document type
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const documentType = await prisma.documentType.findUnique({
      where: { id },
      include: {
        documents: {
          select: { id: true, title: true },
          take: 10,
        },
      },
    });

    if (!documentType) {
      return NextResponse.json({ ok: false, error: 'Document type not found' }, { status: 404 });
    }

    return NextResponse.json({ ok: true, data: documentType });
  } catch (error) {
    console.error('Error fetching document type:', error);
    return NextResponse.json({ ok: false, error: 'Failed to fetch document type' }, { status: 500 });
  }
}

// PUT /api/document-types/[id] - Update document type
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const data = updateDocumentTypeSchema.parse(body);

    const existing = await prisma.documentType.findUnique({ where: { id } });
    if (!existing) {
      return NextResponse.json({ ok: false, error: 'Document type not found' }, { status: 404 });
    }

    // Generate slug if name is being updated and slug is not provided
    let slug = data.slug;
    if (data.name && !data.slug) {
      slug = generateSlug(data.name);
    }

    // Check if new slug conflicts with existing document type
    if (slug && slug !== existing.slug) {
      const conflictingDocumentType = await prisma.documentType.findUnique({
        where: { slug },
      });
      if (conflictingDocumentType) {
        return NextResponse.json({ ok: false, error: 'Document type with this slug already exists' }, { status: 400 });
      }
    }

    const previous = await prisma.documentType.findUnique({ where: { id } });
    const updated = await prisma.documentType.update({
      where: { id },
      data: {
        name: data.name ?? undefined,
        slug: slug ?? undefined,
      },
    });

    // Audit log
    try {
      const headers = request.headers;
      const { userId, userSnapshot } = getUserInfoFromHeaders(headers);
      await createAuditLog({
        userId: userId || 'system',
        userSnapshot,
        actionType: 'UPDATE',
        entityType: 'DocumentType',
        entityId: updated.id,
        description: `Updated document type "${updated.name}"`,
        previousData: previous as any,
        newData: updated as any,
        ipAddress: request.ip ?? headers.get('x-forwarded-for') ?? undefined,
        userAgent: headers.get('user-agent') ?? undefined,
      });
    } catch (e) {
      console.warn('Audit log failed (update document type):', e);
    }

    return NextResponse.json({ ok: true, data: updated, message: 'Document type updated successfully' });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ ok: false, error: 'Validation error', details: error.errors }, { status: 400 });
    }
    console.error('Error updating document type:', error);
    return NextResponse.json({ ok: false, error: 'Failed to update document type' }, { status: 500 });
  }
}

// DELETE /api/document-types/[id] - Delete document type
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const existing = await prisma.documentType.findUnique({ where: { id } });
    if (!existing) {
      return NextResponse.json({ ok: false, error: 'Document type not found' }, { status: 404 });
    }

    await prisma.documentType.delete({ where: { id } });

    // Audit log
    try {
      const headers = request.headers;
      const { userId, userSnapshot } = getUserInfoFromHeaders(headers);
      await createAuditLog({
        userId: userId || 'system',
        userSnapshot,
        actionType: 'DELETE',
        entityType: 'DocumentType',
        entityId: id,
        description: `Deleted document type "${existing.name}"`,
        previousData: existing as any,
        newData: null,
        ipAddress: request.ip ?? headers.get('x-forwarded-for') ?? undefined,
        userAgent: headers.get('user-agent') ?? undefined,
      });
    } catch (e) {
      console.warn('Audit log failed (delete document type):', e);
    }

    return NextResponse.json({ ok: true, message: 'Document type deleted successfully' });
  } catch (error) {
    console.error('Error deleting document type:', error);
    return NextResponse.json({ ok: false, error: 'Failed to delete document type' }, { status: 500 });
  }
}

