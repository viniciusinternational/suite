import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { createAuditLog, getUserInfoFromHeaders } from '@/lib/audit-logger';
import { z } from 'zod';

// Validation schema
const createTagSchema = z.object({
  name: z.string().min(1, 'Tag name is required'),
  color: z.string().optional(),
  slug: z.string().min(1, 'Tag slug is required'),
  match: z.string().optional(),
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

// GET /api/tags - List all tags
export async function GET(request: NextRequest) {
  try {
    const tags = await prisma.tag.findMany({
      orderBy: { name: 'asc' },
    });

    return NextResponse.json({ ok: true, data: tags });
  } catch (error) {
    console.error('Error fetching tags:', error);
    return NextResponse.json({ ok: false, error: 'Failed to fetch tags' }, { status: 500 });
  }
}

// POST /api/tags - Create tag
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const data = createTagSchema.parse(body);

    // Generate slug if not provided
    const slug = data.slug || generateSlug(data.name);

    // Check if slug already exists
    const existingTag = await prisma.tag.findUnique({
      where: { slug },
    });

    if (existingTag) {
      return NextResponse.json({ ok: false, error: 'Tag with this slug already exists' }, { status: 400 });
    }

    const created = await prisma.tag.create({
      data: {
        name: data.name,
        color: data.color,
        slug,
        match: data.match,
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
        entityType: 'Tag',
        entityId: created.id,
        description: `Created tag "${created.name}"`,
        previousData: null,
        newData: created as any,
        ipAddress: request.ip ?? headers.get('x-forwarded-for') ?? undefined,
        userAgent: headers.get('user-agent') ?? undefined,
      });
    } catch (e) {
      console.warn('Audit log failed (create tag):', e);
    }

    return NextResponse.json({ ok: true, data: created, message: 'Tag created successfully' });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ ok: false, error: 'Validation error', details: error.errors }, { status: 400 });
    }
    console.error('Error creating tag:', error);
    return NextResponse.json({ ok: false, error: 'Failed to create tag' }, { status: 500 });
  }
}

