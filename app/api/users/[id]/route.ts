import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';
import { logUserChange } from '@/lib/users/audit-utils';
import { updateUserSchema } from './validation';

// GET /api/users/[id] - Get single user
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const user = await prisma.user.findUnique({
      where: { id },
      include: {
        departmentHeadOf: {
          select: {
            id: true,
            name: true,
            code: true,
          },
        },
        unitManagerOf: {
          select: {
            id: true,
            name: true,
            departmentId: true,
          },
        },
      },
    });

    if (!user) {
      return NextResponse.json(
        {
          ok: false,
          error: 'User not found',
        },
        { status: 404 }
      );
    }

    // Convert DateTime fields to ISO strings
    const formattedUser = {
      ...user,
      createdAt: user.createdAt.toISOString(),
      updatedAt: user.updatedAt.toISOString(),
    };

    return NextResponse.json({
      ok: true,
      data: formattedUser,
    });
  } catch (error) {
    console.error('Error fetching user:', error);
    return NextResponse.json(
      {
        ok: false,
        error: 'Failed to fetch user',
      },
      { status: 500 }
    );
  }
}

// PUT /api/users/[id] - Update user
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const validatedData = updateUserSchema.parse(body);

    // Check if user exists
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

    // Check if email is being changed and if it's already in use
    if (validatedData.email && validatedData.email !== existingUser.email) {
      const emailUser = await prisma.user.findUnique({
        where: { email: validatedData.email },
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

    // Validate department if provided
    if (validatedData.departmentId) {
      const department = await prisma.department.findUnique({
        where: { id: validatedData.departmentId },
      });

      if (!department) {
        return NextResponse.json(
          {
            ok: false,
            error: 'Department not found',
          },
          { status: 400 }
        );
      }
    }

    const updatedUser = await prisma.user.update({
      where: { id },
      data: validatedData,
    });

    await logUserChange({
      request,
      existingUser,
      updatedUser,
    });

    // Convert DateTime fields to ISO strings
    const formattedUser = {
      ...updatedUser,
      createdAt: updatedUser.createdAt.toISOString(),
      updatedAt: updatedUser.updatedAt.toISOString(),
    };

    return NextResponse.json({
      ok: true,
      data: formattedUser,
      message: 'User updated successfully',
    });
  } catch (error) {
    console.error('Error updating user:', error);
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

    console.error('Error updating user:', error);
    return NextResponse.json(
      {
        ok: false,
        error: 'Failed to update user',
      },
      { status: 500 }
    );
  }
}

// DELETE /api/users/[id] - Soft delete user
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    // Check if user exists
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

    // Soft delete by setting isActive to false
    const deletedUser = await prisma.user.update({
      where: { id },
      data: { isActive: false },
    });

    await logUserChange({
      request,
      existingUser,
      updatedUser: deletedUser,
      actionType: 'DELETE',
      description: `Deactivated user "${existingUser.fullName}"`,
    });

    // Convert DateTime fields to ISO strings
    const formattedUser = {
      ...deletedUser,
      createdAt: deletedUser.createdAt.toISOString(),
      updatedAt: deletedUser.updatedAt.toISOString(),
    };

    return NextResponse.json({
      ok: true,
      data: formattedUser,
      message: 'User deactivated successfully',
    });
  } catch (error) {
    console.error('Error deleting user:', error);
    return NextResponse.json(
      {
        ok: false,
        error: 'Failed to delete user',
      },
      { status: 500 }
    );
  }
}
