import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { createAuditLog, getUserInfoFromHeaders } from '@/lib/audit-logger';
import { z } from 'zod';

// Validation schema
const createCorrespondentSchema = z.object({
  name: z.string().min(1, 'Correspondent name is required'),
  slug: z.string().min(1, 'Correspondent slug is required'),
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

// GET /api/correspondents - List all correspondents
export async function GET(request: NextRequest) {
  try {
    const correspondents = await prisma.correspondent.findMany({
      orderBy: { name: 'asc' },
    });

    return NextResponse.json({ ok: true, data: correspondents });
  } catch (error) {
    console.error('Error fetching correspondents:', error);
    return NextResponse.json({ ok: false, error: 'Failed to fetch correspondents' }, { status: 500 });
  }
}

// POST /api/correspondents - Create correspondent
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const data = createCorrespondentSchema.parse(body);

    // Generate slug if not provided
    const slug = data.slug || generateSlug(data.name);

    // Check if slug already exists
    const existingCorrespondent = await prisma.correspondent.findUnique({
      where: { slug },
    });

    if (existingCorrespondent) {
      return NextResponse.json({ ok: false, error: 'Correspondent with this slug already exists' }, { status: 400 });
    }

    const created = await prisma.correspondent.create({
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
        entityType: 'Correspondent',
        entityId: created.id,
        description: `Created correspondent "${created.name}"`,
        previousData: null,
        newData: created as any,
        ipAddress: request.ip ?? headers.get('x-forwarded-for') ?? undefined,
        userAgent: headers.get('user-agent') ?? undefined,
      });
    } catch (e) {
      console.warn('Audit log failed (create correspondent):', e);
    }

    return NextResponse.json({ ok: true, data: created, message: 'Correspondent created successfully' });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ ok: false, error: 'Validation error', details: error.errors }, { status: 400 });
    }
    console.error('Error creating correspondent:', error);
    return NextResponse.json({ ok: false, error: 'Failed to create correspondent' }, { status: 500 });
  }
}

