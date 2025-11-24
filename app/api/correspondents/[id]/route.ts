import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { createAuditLog, getUserInfoFromHeaders } from '@/lib/audit-logger';
import { z } from 'zod';

// Validation schema
const updateCorrespondentSchema = z.object({
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

// GET /api/correspondents/[id] - Get single correspondent
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const correspondent = await prisma.correspondent.findUnique({
      where: { id },
      include: {
        documents: {
          select: { id: true, title: true },
          take: 10,
        },
      },
    });

    if (!correspondent) {
      return NextResponse.json({ ok: false, error: 'Correspondent not found' }, { status: 404 });
    }

    return NextResponse.json({ ok: true, data: correspondent });
  } catch (error) {
    console.error('Error fetching correspondent:', error);
    return NextResponse.json({ ok: false, error: 'Failed to fetch correspondent' }, { status: 500 });
  }
}

// PUT /api/correspondents/[id] - Update correspondent
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const data = updateCorrespondentSchema.parse(body);

    const existing = await prisma.correspondent.findUnique({ where: { id } });
    if (!existing) {
      return NextResponse.json({ ok: false, error: 'Correspondent not found' }, { status: 404 });
    }

    // Generate slug if name is being updated and slug is not provided
    let slug = data.slug;
    if (data.name && !data.slug) {
      slug = generateSlug(data.name);
    }

    // Check if new slug conflicts with existing correspondent
    if (slug && slug !== existing.slug) {
      const conflictingCorrespondent = await prisma.correspondent.findUnique({
        where: { slug },
      });
      if (conflictingCorrespondent) {
        return NextResponse.json({ ok: false, error: 'Correspondent with this slug already exists' }, { status: 400 });
      }
    }

    const previous = await prisma.correspondent.findUnique({ where: { id } });
    const updated = await prisma.correspondent.update({
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
        entityType: 'Correspondent',
        entityId: updated.id,
        description: `Updated correspondent "${updated.name}"`,
        previousData: previous as any,
        newData: updated as any,
        ipAddress: request.ip ?? headers.get('x-forwarded-for') ?? undefined,
        userAgent: headers.get('user-agent') ?? undefined,
      });
    } catch (e) {
      console.warn('Audit log failed (update correspondent):', e);
    }

    return NextResponse.json({ ok: true, data: updated, message: 'Correspondent updated successfully' });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ ok: false, error: 'Validation error', details: error.errors }, { status: 400 });
    }
    console.error('Error updating correspondent:', error);
    return NextResponse.json({ ok: false, error: 'Failed to update correspondent' }, { status: 500 });
  }
}

// DELETE /api/correspondents/[id] - Delete correspondent
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const existing = await prisma.correspondent.findUnique({ where: { id } });
    if (!existing) {
      return NextResponse.json({ ok: false, error: 'Correspondent not found' }, { status: 404 });
    }

    await prisma.correspondent.delete({ where: { id } });

    // Audit log
    try {
      const headers = request.headers;
      const { userId, userSnapshot } = getUserInfoFromHeaders(headers);
      await createAuditLog({
        userId: userId || 'system',
        userSnapshot,
        actionType: 'DELETE',
        entityType: 'Correspondent',
        entityId: id,
        description: `Deleted correspondent "${existing.name}"`,
        previousData: existing as any,
        newData: null,
        ipAddress: request.ip ?? headers.get('x-forwarded-for') ?? undefined,
        userAgent: headers.get('user-agent') ?? undefined,
      });
    } catch (e) {
      console.warn('Audit log failed (delete correspondent):', e);
    }

    return NextResponse.json({ ok: true, message: 'Correspondent deleted successfully' });
  } catch (error) {
    console.error('Error deleting correspondent:', error);
    return NextResponse.json({ ok: false, error: 'Failed to delete correspondent' }, { status: 500 });
  }
}

