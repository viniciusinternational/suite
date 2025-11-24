import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { createAuditLog, getUserInfoFromHeaders } from '@/lib/audit-logger';
import { z } from 'zod';

// Validation schema
const createDocumentTypeSchema = z.object({
  name: z.string().min(1, 'Document type name is required'),
  slug: z.string().min(1, 'Document type slug is required'),
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

// GET /api/document-types - List all document types
export async function GET(request: NextRequest) {
  try {
    const documentTypes = await prisma.documentType.findMany({
      orderBy: { name: 'asc' },
    });

    return NextResponse.json({ ok: true, data: documentTypes });
  } catch (error) {
    console.error('Error fetching document types:', error);
    return NextResponse.json({ ok: false, error: 'Failed to fetch document types' }, { status: 500 });
  }
}

// POST /api/document-types - Create document type
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const data = createDocumentTypeSchema.parse(body);

    // Generate slug if not provided
    const slug = data.slug || generateSlug(data.name);

    // Check if slug already exists
    const existingDocumentType = await prisma.documentType.findUnique({
      where: { slug },
    });

    if (existingDocumentType) {
      return NextResponse.json({ ok: false, error: 'Document type with this slug already exists' }, { status: 400 });
    }

    const created = await prisma.documentType.create({
      data: {
        name: data.name,
        slug,
      },
    });

    // Audit log
    try {
      const headers = request.headers;
      const { userId, userSnapshot } = getUserInfoFromHeaders(headers);
      await createAuditLog({
        userId: userId || 'system',
        userSnapshot,
        actionType: 'CREATE',
        entityType: 'DocumentType',
        entityId: created.id,
        description: `Created document type "${created.name}"`,
        previousData: null,
        newData: created as any,
        ipAddress: request.ip ?? headers.get('x-forwarded-for') ?? undefined,
        userAgent: headers.get('user-agent') ?? undefined,
      });
    } catch (e) {
      console.warn('Audit log failed (create document type):', e);
    }

    return NextResponse.json({ ok: true, data: created, message: 'Document type created successfully' });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ ok: false, error: 'Validation error', details: error.errors }, { status: 400 });
    }
    console.error('Error creating document type:', error);
    return NextResponse.json({ ok: false, error: 'Failed to create document type' }, { status: 500 });
  }
}

