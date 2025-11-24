import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { createAuditLog, getUserInfoFromHeaders } from '@/lib/audit-logger';
import { z } from 'zod';

// Validation schema
const updateTagSchema = z.object({
  name: z.string().min(1).optional(),
  color: z.string().optional(),
  slug: z.string().min(1).optional(),
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

// GET /api/tags/[id] - Get single tag
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const tag = await prisma.tag.findUnique({
      where: { id },
      include: {
        documents: {
          select: { id: true, title: true },
          take: 10,
        },
      },
    });

    if (!tag) {
      return NextResponse.json({ ok: false, error: 'Tag not found' }, { status: 404 });
    }

    return NextResponse.json({ ok: true, data: tag });
  } catch (error) {
    console.error('Error fetching tag:', error);
    return NextResponse.json({ ok: false, error: 'Failed to fetch tag' }, { status: 500 });
  }
}

// PUT /api/tags/[id] - Update tag
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const data = updateTagSchema.parse(body);

    const existing = await prisma.tag.findUnique({ where: { id } });
    if (!existing) {
      return NextResponse.json({ ok: false, error: 'Tag not found' }, { status: 404 });
    }

    // Generate slug if name is being updated and slug is not provided
    let slug = data.slug;
    if (data.name && !data.slug) {
      slug = generateSlug(data.name);
    }

    // Check if new slug conflicts with existing tag
    if (slug && slug !== existing.slug) {
      const conflictingTag = await prisma.tag.findUnique({
        where: { slug },
      });
      if (conflictingTag) {
        return NextResponse.json({ ok: false, error: 'Tag with this slug already exists' }, { status: 400 });
      }
    }

    const previous = await prisma.tag.findUnique({ where: { id } });
    const updated = await prisma.tag.update({
      where: { id },
      data: {
        name: data.name ?? undefined,
        color: data.color ?? undefined,
        slug: slug ?? undefined,
        match: data.match ?? undefined,
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
        entityType: 'Tag',
        entityId: updated.id,
        description: `Updated tag "${updated.name}"`,
        previousData: previous as any,
        newData: updated as any,
        ipAddress: request.ip ?? headers.get('x-forwarded-for') ?? undefined,
        userAgent: headers.get('user-agent') ?? undefined,
      });
    } catch (e) {
      console.warn('Audit log failed (update tag):', e);
    }

    return NextResponse.json({ ok: true, data: updated, message: 'Tag updated successfully' });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ ok: false, error: 'Validation error', details: error.errors }, { status: 400 });
    }
    console.error('Error updating tag:', error);
    return NextResponse.json({ ok: false, error: 'Failed to update tag' }, { status: 500 });
  }
}

// DELETE /api/tags/[id] - Delete tag
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const existing = await prisma.tag.findUnique({ where: { id } });
    if (!existing) {
      return NextResponse.json({ ok: false, error: 'Tag not found' }, { status: 404 });
    }

    await prisma.tag.delete({ where: { id } });

    // Audit log
    try {
      const headers = request.headers;
      const { userId, userSnapshot } = getUserInfoFromHeaders(headers);
      await createAuditLog({
        userId: userId || 'system',
        userSnapshot,
        actionType: 'DELETE',
        entityType: 'Tag',
        entityId: id,
        description: `Deleted tag "${existing.name}"`,
        previousData: existing as any,
        newData: null,
        ipAddress: request.ip ?? headers.get('x-forwarded-for') ?? undefined,
        userAgent: headers.get('user-agent') ?? undefined,
      });
    } catch (e) {
      console.warn('Audit log failed (delete tag):', e);
    }

    return NextResponse.json({ ok: true, message: 'Tag deleted successfully' });
  } catch (error) {
    console.error('Error deleting tag:', error);
    return NextResponse.json({ ok: false, error: 'Failed to delete tag' }, { status: 500 });
  }
}

