import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';
import { createAuditLog, getUserInfoFromHeaders } from '@/lib/audit-logger';

// Validation schema for user creation
const createUserSchema = z.object({
  id: z.string().optional(), // Zitadel user ID (optional, will be generated if not provided)
  firstName: z.string().min(1, 'First name is required'),
  lastName: z.string().min(1, 'Last name is required'),
  fullName: z.string().min(1, 'Full name is required'),
  phone: z.string().min(1, 'Phone is required'),
  dob: z.string().min(1, 'Date of birth is required'),
  gender: z.string().min(1, 'Gender is required'),
  email: z.string().email('Invalid email address'),
  role: z.enum(['super_admin', 'managing_director', 'department_head', 'hr_manager', 'administrator', 'accountant', 'employee']),
  departmentId: z.string().optional(),
  employeeId: z.string().optional(),
  position: z.string().min(1, 'Position is required'),
  hireDate: z.string().min(1, 'Hire date is required'),
  salary: z.number().positive('Salary must be positive'),
  avatar: z.string().optional(),
  permissions: z.preprocess(
    (value) => {
      if (!value || typeof value !== 'object') return value;
      const result: Record<string, boolean> = {};
      for (const [key, val] of Object.entries(value)) {
        if (typeof val === 'string') {
          const normalized = val.trim().toLowerCase();
          if (normalized === 'true' || normalized === '1') {
            result[key] = true;
          } else if (normalized === 'false' || normalized === '0' || normalized === '') {
            result[key] = false;
          } else {
            result[key] = Boolean(val);
          }
        } else if (typeof val === 'number') {
          result[key] = val === 1;
        } else if (typeof val === 'boolean') {
          result[key] = val;
        } else {
          result[key] = Boolean(val);
        }
      }
      return result;
    },
    z.record(z.string(), z.boolean()).optional()
  ),
  isActive: z.boolean().default(true),
});

// GET /api/users - List all users with filters
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const search = searchParams.get('search');
    const departmentId = searchParams.get('department');
    const status = searchParams.get('status');
    const includeInactive = searchParams.get('includeInactive') === 'true';

    // Build where clause
    const where: any = {};

    if (!includeInactive) {
      where.isActive = true;
    }

    if (status && status !== 'all') {
      where.isActive = status === 'active';
    }

    if (departmentId && departmentId !== 'all') {
      where.departmentId = departmentId;
    }

    // Search functionality
    if (search) {
      where.OR = [
        { firstName: { contains: search, mode: 'insensitive' } },
        { lastName: { contains: search, mode: 'insensitive' } },
        { email: { contains: search, mode: 'insensitive' } },
        { fullName: { contains: search, mode: 'insensitive' } },
        { employeeId: { contains: search, mode: 'insensitive' } },
      ];
    }

    // Check if we're getting a user by email
    const email = searchParams.get('email');
    console.log('email', email);
    if (email) {
      const user = await prisma.user.findUnique({
        where: { email },
        include: {
          departmentHeadOf: {
            select: {
              id: true,
              name: true,
              code: true,
            },
          },
        },
      });

      console.log('user', user);

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
    }

    const users = await prisma.user.findMany({
      where,
      include: {
        departmentHeadOf: {
          select: {
            id: true,
            name: true,
            code: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    // Convert DateTime fields to ISO strings
    const formattedUsers = users.map(user => ({
      ...user,
      createdAt: user.createdAt.toISOString(),
      updatedAt: user.updatedAt.toISOString(),
    }));

    return NextResponse.json({
      ok: true,
      data: formattedUsers,
    });
  } catch (error) {
    console.error('Error fetching users:', error);
    return NextResponse.json(
      {
        ok: false,
        error: 'Failed to fetch users',
      },
      { status: 500 }
    );
  }
}

// POST /api/users - Create new user
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const validatedData = createUserSchema.parse(body);

    // Check if user with email already exists
    const existingUser = await prisma.user.findUnique({
      where: { email: validatedData.email },
    });

    if (existingUser) {
      return NextResponse.json(
        {
          ok: false,
          error: 'User with this email already exists',
        },
        { status: 400 }
      );
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

    // Create user without specifying id (will use CUID)
    const userData = {
      firstName: validatedData.firstName,
      lastName: validatedData.lastName,
      fullName: validatedData.fullName,
      phone: validatedData.phone,
      dob: validatedData.dob,
      gender: validatedData.gender,
      email: validatedData.email,
      role: validatedData.role,
      departmentId: validatedData.departmentId || null,
      employeeId: validatedData.employeeId || null,
      position: validatedData.position,
      hireDate: validatedData.hireDate,
      salary: validatedData.salary,
      avatar: validatedData.avatar || null,
      permissions: validatedData.permissions || {},
      isActive: validatedData.isActive,
    };

    const user = await prisma.user.create({
      data: userData,
    });

    // Audit log (best-effort)
    try {
      const headers = request.headers;
      const { userId, userSnapshot } = getUserInfoFromHeaders(headers);
      
      await createAuditLog({
        userId: userId || 'system',
        userSnapshot,
        actionType: 'CREATE',
        entityType: 'User',
        entityId: user.id,
        description: `Created user "${user.fullName}" with role ${user.role}`,
        previousData: null,
        newData: user as any,
        ipAddress: request.ip ?? headers.get('x-forwarded-for') ?? undefined,
        userAgent: headers.get('user-agent') ?? undefined,
      });
    } catch (e) {
      console.error('Audit log failed (create user):', e);
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
      message: 'User created successfully',
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

    console.error('Error creating user:', error);
    return NextResponse.json(
      {
        ok: false,
        error: 'Failed to create user',
      },
      { status: 500 }
    );
  }
}
