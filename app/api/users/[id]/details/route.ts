import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { prisma } from '@/lib/prisma';
import { logUserChange } from '@/lib/users/audit-utils';
import { updateUserDetailsSchema } from '../validation';

function sanitizeData<T extends Record<string, unknown>>(data: T) {
  return Object.fromEntries(Object.entries(data).filter(([, value]) => value !== undefined)) as Partial<T>;
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const parsedData = updateUserDetailsSchema.parse(body);
    const data = sanitizeData(parsedData);

    if (Object.keys(data).length === 0) {
      return NextResponse.json(
        {
          ok: false,
          error: 'No valid fields provided for update',
        },
        { status: 400 }
      );
    }

    const existingUser = await prisma.user.findUnique({
      where: { id },
    });

    if (!existingUser) {
      return NextResponse.json(
        {
          ok: false,
          error: 'User not found',
        },
        { status: 404 }
      );
    }

    if (data.email && data.email !== existingUser.email) {
      const emailUser = await prisma.user.findUnique({
        where: { email: data.email },
      });

      if (emailUser) {
        return NextResponse.json(
          {
            ok: false,
            error: 'Email already in use',
          },
          { status: 400 }
        );
      }
    }

    const updatedUser = await prisma.user.update({
      where: { id },
      data,
    });

    await logUserChange({
      request,
      existingUser,
      updatedUser,
      description: `Updated personal details for user "${updatedUser.fullName}"`,
    });

    const formattedUser = {
      ...updatedUser,
      createdAt: updatedUser.createdAt.toISOString(),
      updatedAt: updatedUser.updatedAt.toISOString(),
    };

    return NextResponse.json({
      ok: true,
      data: formattedUser,
      message: 'User details updated successfully',
    });
  } catch (error) {
    console.error('Error updating user details:', error);
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

    return NextResponse.json(
      {
        ok: false,
        error: 'Failed to update user details',
      },
      { status: 500 }
    );
  }
}

