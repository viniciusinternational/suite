import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { prisma } from '@/lib/prisma';
import { logUserChange } from '../audit-utils';
import { updateUserPermissionsSchema } from '../validation';

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const parsedData = updateUserPermissionsSchema.parse(body);

    if (!Object.prototype.hasOwnProperty.call(parsedData, 'permissions')) {
      return NextResponse.json(
        {
          ok: false,
          error: 'Permissions field is required',
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

    const updatedUser = await prisma.user.update({
      where: { id },
      data: {
        permissions: parsedData.permissions ?? null,
      },
    });

    await logUserChange({
      request,
      existingUser,
      updatedUser,
      actionType: 'PERMISSION_CHANGED',
      description: `Changed permissions for user "${updatedUser.fullName}"`,
    });

    const formattedUser = {
      ...updatedUser,
      createdAt: updatedUser.createdAt.toISOString(),
      updatedAt: updatedUser.updatedAt.toISOString(),
    };

    return NextResponse.json({
      ok: true,
      data: formattedUser,
      message: 'User permissions updated successfully',
    });
  } catch (error) {
    console.error('Error updating user permissions:', error);
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
        error: 'Failed to update user permissions',
      },
      { status: 500 }
    );
  }
}

