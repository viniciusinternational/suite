import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';

const updateUserSchema = z.object({
  firstName: z.string().min(1).optional(),
  lastName: z.string().min(1).optional(),
  fullName: z.string().min(1).optional(),
  phone: z.string().min(1).optional(),
  dob: z.string().optional(),
  gender: z.string().optional(),
  email: z.string().email().optional(),
  role: z.enum(['super_admin', 'managing_director', 'department_head', 'hr_manager', 'administrator', 'accountant', 'employee']).optional(),
  departmentId: z.string().optional(),
  employeeId: z.string().optional(),
  position: z.string().min(1).optional(),
  hireDate: z.string().optional(),
  salary: z.number().positive().optional(),
  avatar: z.string().optional(),
  permissions: z.record(z.boolean()).optional(),
  isActive: z.boolean().optional(),
});

// GET /api/users/[id] - Get single user
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const user = await prisma.user.findUnique({
      where: { id: params.id },
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
  { params }: { params: { id: string } }
) {
  try {
    const body = await request.json();
    const validatedData = updateUserSchema.parse(body);

    // Check if user exists
    const existingUser = await prisma.user.findUnique({
      where: { id: params.id },
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

    // Update user
    const updatedUser = await prisma.user.update({
      where: { id: params.id },
      data: validatedData,
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
  { params }: { params: { id: string } }
) {
  try {
    // Check if user exists
    const existingUser = await prisma.user.findUnique({
      where: { id: params.id },
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
      where: { id: params.id },
      data: { isActive: false },
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
