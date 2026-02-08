'use client';

import { useEffect, useMemo, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { useQuery } from '@tanstack/react-query';
import {
  ArrowLeft,
  Building2,
  Calendar,
  CheckCircle2,
  Edit3,
  Loader2,
  Mail,
  Phone,
  Shield,
  User,
  Users,
} from 'lucide-react';
import { formatCurrencyNGN } from '@/lib/utils';

import { useAuthGuard } from '@/hooks/use-auth-guard';
import {
  useUpdateUserDetails,
  useUpdateUserEmployment,
  useUpdateUserPermissions,
  useUser,
} from '@/hooks/use-users';
import axiosClient from '@/lib/axios';
import type { Department, UserRole } from '@/types';
import {
  Alert,
  AlertDescription,
  AlertTitle,
} from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Skeleton } from '@/components/ui/skeleton';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Avatar } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { PermissionsEditor } from '@/components/user/permissions-editor';

const detailsSchema = z.object({
  firstName: z.string().min(1, 'First name is required'),
  lastName: z.string().min(1, 'Last name is required'),
  fullName: z.string().min(1, 'Full name is required'),
  email: z.string().email('Invalid email address'),
  phone: z.string().min(1, 'Phone is required'),
  dob: z.string().min(1, 'Date of birth is required'),
  gender: z.string().min(1, 'Gender is required'),
});

const employmentSchema = z.object({
  departmentId: z.string().optional(),
  employeeId: z.string().optional(),
  position: z.string().min(1, 'Position is required'),
  hireDate: z.string().min(1, 'Hire date is required'),
  salary: z
    .preprocess((value) => {
      if (value === '' || value === null || value === undefined) {
        return undefined;
      }
      const numeric = Number(value);
      return Number.isNaN(numeric) ? undefined : numeric;
    }, z.number().positive('Salary must be positive').optional()),
  role: z.string().min(1, 'Role is required'),
});

type DetailsFormValues = z.infer<typeof detailsSchema>;
type EmploymentFormValues = z.infer<typeof employmentSchema>;

const normalizePermissions = (input: Record<string, unknown> | null | undefined): Record<string, boolean> => {
  if (!input) {
    return {};
  }

  return Object.fromEntries(
    Object.entries(input).map(([key, value]) => {
      if (typeof value === 'boolean') {
        return [key, value];
      }

      if (typeof value === 'string') {
        const normalized = value.trim().toLowerCase();
        if (['true', '1', 'yes', 'y'].includes(normalized)) {
          return [key, true];
        }
        if (['false', '0', 'no', 'n', ''].includes(normalized)) {
          return [key, false];
        }
        return [key, Boolean(value)];
      }

      if (typeof value === 'number') {
        if (value === 1) return [key, true];
        if (value === 0) return [key, false];
        return [key, value > 0];
      }

      return [key, Boolean(value)];
    })
  );
};

interface AuditLogEntry {
  id: string;
  description: string;
  actionType: string;
  createdAt: string;
  userSnapshot?: {
    fullName?: string;
    email?: string;
  } | null;
}

export default function EditUserPage() {
  useAuthGuard(['edit_users']);

  const router = useRouter();
  const params = useParams();
  const userId = params.id as string;

  const { data: user, isLoading, error } = useUser(userId);
  const updateUserDetails = useUpdateUserDetails();
  const updateUserEmployment = useUpdateUserEmployment();
  const updateUserPermissions = useUpdateUserPermissions();

  const { data: departmentsResponse } = useQuery({
    queryKey: ['departments'],
    queryFn: async () => {
      const response = await axiosClient.get('/departments');
      return response.data;
    },
  });
  const departments: Department[] = departmentsResponse?.data || [];

  const {
    data: auditLogResponse,
    isLoading: isLoadingAudit,
    error: auditError,
  } = useQuery({
    queryKey: ['audit-logs', userId],
    queryFn: async () => {
      const response = await axiosClient.get(
        `/audit-logs?entityType=User&entityId=${userId}&limit=5`
      );
      return response.data;
    },
    enabled: !!userId,
  });

  const auditLogs: AuditLogEntry[] = useMemo(() => {
    if (!auditLogResponse?.data) {
      return [];
    }
    return auditLogResponse.data as AuditLogEntry[];
  }, [auditLogResponse]);

  const [permissions, setPermissions] = useState<Record<string, boolean>>({});
  const [detailsFeedback, setDetailsFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);
  const [employmentFeedback, setEmploymentFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(
    null
  );
  const [permissionsFeedback, setPermissionsFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(
    null
  );

  const formatDisplayDate = (value?: string) => {
    if (!value) return 'Not set';
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return 'Not set';
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  const detailsForm = useForm<DetailsFormValues>({
    resolver: zodResolver(detailsSchema),
    defaultValues: {
      firstName: '',
      lastName: '',
      fullName: '',
      email: '',
      phone: '',
      dob: '',
      gender: 'Male',
    },
  });

  const employmentForm = useForm<EmploymentFormValues>({
    resolver: zodResolver(employmentSchema),
    defaultValues: {
      departmentId: '',
      employeeId: '',
      position: '',
      hireDate: '',
      salary: undefined,
      role: 'employee',
    },
  });

  useEffect(() => {
    if (user) {
      detailsForm.reset({
        firstName: user.firstName || '',
        lastName: user.lastName || '',
        fullName: user.fullName || '',
        email: user.email || '',
        phone: user.phone || '',
        dob: user.dob ? user.dob.slice(0, 10) : '',
        gender: user.gender || 'Male',
      });

      employmentForm.reset({
        departmentId: user.departmentId || '',
        employeeId: user.employeeId || '',
        position: user.position || '',
        hireDate: user.hireDate ? user.hireDate.slice(0, 10) : '',
        salary: typeof user.salary === 'number' ? user.salary : undefined,
        role: (user.role as unknown as string) || 'employee',
      });

      setPermissions(normalizePermissions(user.permissions));
    }
  }, [user, detailsForm, employmentForm]);

  const handleDetailsSubmit = async (values: DetailsFormValues) => {
    if (!user) return;
    setDetailsFeedback(null);

    try {
      await updateUserDetails.mutateAsync({
        id: user.id,
        data: values,
      });

      setDetailsFeedback({
        type: 'success',
        message: 'User details updated successfully.',
      });
    } catch (err: any) {
      const message =
        err?.response?.data?.error ||
        err?.message ||
        'Failed to update user details. Please try again.';
      setDetailsFeedback({
        type: 'error',
        message,
      });
    }
  };

  const handleEmploymentSubmit = async (values: EmploymentFormValues) => {
    if (!user) return;
    setEmploymentFeedback(null);

    const payload = {
      ...values,
      departmentId: values.departmentId ? values.departmentId : undefined,
      employeeId: values.employeeId ? values.employeeId : undefined,
      salary: typeof values.salary === 'number' ? values.salary : undefined,
    };

    try {
      await updateUserEmployment.mutateAsync({
        id: user.id,
        data: payload,
      });

      setEmploymentFeedback({
        type: 'success',
        message: 'User employment information updated successfully.',
      });
    } catch (err: any) {
      const message =
        err?.response?.data?.error ||
        err?.message ||
        'Failed to update employment information. Please try again.';
      setEmploymentFeedback({
        type: 'error',
        message,
      });
    }
  };

  const handlePermissionsSave = async () => {
    if (!user) return;
    setPermissionsFeedback(null);

    try {
      const normalized = normalizePermissions(permissions);
      await updateUserPermissions.mutateAsync({
        id: user.id,
        data: {
          permissions: normalized,
        },
      });

      setPermissions(normalized);
      setPermissionsFeedback({
        type: 'success',
        message: 'User permissions updated successfully.',
      });
    } catch (err: any) {
      const message =
        err?.response?.data?.error ||
        err?.message ||
        'Failed to update permissions. Please try again.';
      setPermissionsFeedback({
        type: 'error',
        message,
      });
    }
  };

  const leadershipAssignments = useMemo(() => {
    if (!user) return [];
    const deptHeads = (user as any)?.departmentHeadOf || [];
    const unitManagers = (user as any)?.unitManagerOf || [];

    const items = [
      ...deptHeads.map((dept: any) => ({
        id: `department-${dept.id}`,
        label: 'Department Head',
        name: dept.name,
        description: `Code: ${dept.code}`,
      })),
      ...unitManagers.map((unit: any) => ({
        id: `unit-${unit.id}`,
        label: 'Unit Manager',
        name: unit.name,
        description: `Department ID: ${unit.departmentId}`,
      })),
    ];

    return items;
  }, [user]);

  if (isLoading) {
    return (
      <div className="min-h-screen space-y-6 p-6 bg-muted/30">
        <div className="flex items-center gap-4">
          <Skeleton className="h-10 w-32" />
          <Skeleton className="h-10 w-64" />
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <Skeleton className="h-96 w-full lg:col-span-2" />
          <Skeleton className="h-96 w-full" />
        </div>
      </div>
    );
  }

  if (error || !user) {
    return (
      <div className="min-h-screen space-y-6 p-6 bg-muted/30">
        <div className="flex items-center gap-4">
          <Button variant="ghost" onClick={() => router.push('/users')}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Users
          </Button>
        </div>
        <Card>
          <CardHeader>
            <CardTitle>User Not Found</CardTitle>
            <CardDescription>
              The user you are trying to edit could not be found.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button onClick={() => router.push('/users')}>Go back to Users</Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen space-y-6 p-6 bg-muted/30">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="flex items-start gap-4">
          <Button variant="ghost" size="icon" className="shrink-0" onClick={() => router.push('/users')} aria-label="Back to users">
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div className="min-w-0">
            <h1 className="text-2xl font-bold tracking-tight text-foreground md:text-3xl">Edit User</h1>
            <p className="mt-1 text-sm text-muted-foreground">
              Update user profile, employment information, and permissions.
            </p>
          </div>
        </div>
        <Button
          variant="outline"
          className="shrink-0"
          onClick={() => router.push(`/users/${user.id}`)}
        >
          <Users className="h-4 w-4 mr-2" />
          View Profile
        </Button>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="space-y-6 lg:col-span-2">
          <Card className="border border-border/50 shadow-sm">
            <CardHeader>
              <div className="flex items-center gap-4">
                <Avatar className="h-16 w-16 bg-gray-200 flex items-center justify-center">
                  <User className="h-8 w-8 text-gray-600" />
                </Avatar>
                <div>
                  <CardTitle className="text-xl">{user.fullName}</CardTitle>
                  <CardDescription>{user.position}</CardDescription>
                  <Badge
                    variant="outline"
                    className={
                      user.isActive
                        ? 'bg-green-100 text-green-800 border-green-200'
                        : 'bg-red-100 text-red-800 border-red-200'
                    }
                  >
                    {user.isActive ? 'Active' : 'Inactive'}
                  </Badge>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <Tabs defaultValue="details" className="w-full">
                <TabsList className="grid w-full grid-cols-3">
                  <TabsTrigger value="details">Details</TabsTrigger>
                  <TabsTrigger value="employment">Employment</TabsTrigger>
                  <TabsTrigger value="permissions">Permissions</TabsTrigger>
                </TabsList>

                <TabsContent value="details" className="mt-4">
                  <Form {...detailsForm}>
                    <form
                      onSubmit={detailsForm.handleSubmit(handleDetailsSubmit)}
                      className="space-y-6"
                    >
                      <div className="grid grid-cols-2 gap-4">
                        <FormField
                          control={detailsForm.control}
                          name="firstName"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>First Name</FormLabel>
                              <FormControl>
                                <Input
                                  placeholder="Enter first name"
                                  {...field}
                                  value={field.value ?? ''}
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        <FormField
                          control={detailsForm.control}
                          name="lastName"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Last Name</FormLabel>
                              <FormControl>
                                <Input
                                  placeholder="Enter last name"
                                  {...field}
                                  value={field.value ?? ''}
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>

                      <FormField
                        control={detailsForm.control}
                        name="fullName"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Full Name</FormLabel>
                            <FormControl>
                              <Input
                                placeholder="Enter full name"
                                {...field}
                                value={field.value ?? ''}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <div className="grid grid-cols-2 gap-4">
                        <FormField
                          control={detailsForm.control}
                          name="email"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Email Address</FormLabel>
                              <FormControl>
                                <Input
                                  type="email"
                                  disabled
                                  {...field}
                                  value={field.value ?? ''}
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        <FormField
                          control={detailsForm.control}
                          name="phone"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Phone Number</FormLabel>
                              <FormControl>
                                <Input
                                  placeholder="Enter phone number"
                                  {...field}
                                  value={field.value ?? ''}
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>

                      <div className="grid grid-cols-2 gap-4">
                        <FormField
                          control={detailsForm.control}
                          name="dob"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Date of Birth</FormLabel>
                              <FormControl>
                                <Input
                                  type="date"
                                  {...field}
                                  value={field.value ?? ''}
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        <FormField
                          control={detailsForm.control}
                          name="gender"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Gender</FormLabel>
                              <Select
                                onValueChange={field.onChange}
                                value={field.value ?? ''}
                              >
                                <FormControl>
                                  <SelectTrigger className="w-full">
                                    <SelectValue placeholder="Select gender" />
                                  </SelectTrigger>
                                </FormControl>
                                <SelectContent>
                                  <SelectItem value="Male">Male</SelectItem>
                                  <SelectItem value="Female">Female</SelectItem>
                                  <SelectItem value="Other">Other</SelectItem>
                                </SelectContent>
                              </Select>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>

                      {detailsFeedback && (
                        <Alert variant={detailsFeedback.type === 'error' ? 'destructive' : undefined}>
                          <AlertTitle>
                            {detailsFeedback.type === 'error' ? 'Update failed' : 'Success'}
                          </AlertTitle>
                          <AlertDescription>{detailsFeedback.message}</AlertDescription>
                        </Alert>
                      )}

                      <div className="flex flex-col gap-3 border-t pt-4 sm:flex-row sm:justify-end">
                        <Button
                          type="button"
                          variant="outline"
                          onClick={() => router.push(`/users/${user.id}`)}
                        >
                          Cancel
                        </Button>
                        <Button type="submit" disabled={updateUserDetails.isPending}>
                          {updateUserDetails.isPending ? (
                            <>
                              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                              Saving...
                            </>
                          ) : (
                            <>
                              <Edit3 className="h-4 w-4 mr-2" />
                              Save Details
                            </>
                          )}
                        </Button>
                      </div>
                    </form>
                  </Form>
                </TabsContent>

                <TabsContent value="employment" className="mt-4 space-y-6">
                  <Form {...employmentForm}>
                    <form
                      onSubmit={employmentForm.handleSubmit(handleEmploymentSubmit)}
                      className="space-y-6"
                    >
                      <div className="grid grid-cols-2 gap-4">
                        <FormField
                          control={employmentForm.control}
                          name="departmentId"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Department</FormLabel>
                              <Select
                                value={field.value ? field.value : 'none'}
                                onValueChange={(value) =>
                                  field.onChange(value === 'none' ? '' : value)
                                }
                              >
                                <FormControl>
                                  <SelectTrigger className="w-full">
                                    <SelectValue placeholder="Select department" />
                                  </SelectTrigger>
                                </FormControl>
                                <SelectContent>
                                  <SelectItem value="none">
                                    No Department
                                  </SelectItem>
                                  {departments.map((dept) => (
                                    <SelectItem key={dept.id} value={dept.id}>
                                      {dept.name}
                                    </SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        <FormField
                          control={employmentForm.control}
                          name="role"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Role</FormLabel>
                              <Select
                                value={field.value ?? ''}
                                onValueChange={(value) =>
                                  field.onChange(value as UserRole)
                                }
                              >
                                <FormControl>
                                  <SelectTrigger className="w-full">
                                    <SelectValue placeholder="Select role" />
                                  </SelectTrigger>
                                </FormControl>
                                <SelectContent>
                                  <SelectItem value="employee">User</SelectItem>
                                  <SelectItem value="department_head">
                                    Department Head
                                  </SelectItem>
                                  <SelectItem value="hr_manager">
                                    HR Manager
                                  </SelectItem>
                                  <SelectItem value="accountant">
                                    Accountant
                                  </SelectItem>
                                  <SelectItem value="administrator">
                                    Administrator
                                  </SelectItem>
                                  <SelectItem value="managing_director">
                                    Managing Director
                                  </SelectItem>
                                  <SelectItem value="super_admin">
                                    Super Admin
                                  </SelectItem>
                                </SelectContent>
                              </Select>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>

                      <div className="grid grid-cols-2 gap-4">
                        <FormField
                          control={employmentForm.control}
                          name="position"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Position</FormLabel>
                              <FormControl>
                                <Input
                                  placeholder="Enter position/job title"
                                  {...field}
                                  value={field.value ?? ''}
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        <FormField
                          control={employmentForm.control}
                          name="employeeId"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Employee ID (Optional)</FormLabel>
                              <FormControl>
                                <Input
                                  placeholder="Enter employee ID"
                                  {...field}
                                  value={field.value ?? ''}
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>

                      <div className="grid grid-cols-2 gap-4">
                        <FormField
                          control={employmentForm.control}
                          name="hireDate"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Hire Date</FormLabel>
                              <FormControl>
                                <Input
                                  type="date"
                                  {...field}
                                  value={field.value ?? ''}
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        <FormField
                          control={employmentForm.control}
                          name="salary"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Annual Salary (₦)</FormLabel>
                              <FormControl>
                                <Input
                                  type="number"
                                  value={field.value ?? ''}
                                  onChange={(event) => {
                                    const value = event.target.value;
                                    field.onChange(value === '' ? '' : Number(value));
                                  }}
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>

                      {employmentFeedback && (
                        <Alert variant={employmentFeedback.type === 'error' ? 'destructive' : undefined}>
                          <AlertTitle>
                            {employmentFeedback.type === 'error' ? 'Update failed' : 'Success'}
                          </AlertTitle>
                          <AlertDescription>{employmentFeedback.message}</AlertDescription>
                        </Alert>
                      )}

                      <div className="flex flex-col gap-3 border-t pt-4 sm:flex-row sm:justify-end">
                        <Button
                          type="button"
                          variant="outline"
                          onClick={() => {
                            if (user) {
                              employmentForm.reset({
                                departmentId: user.departmentId || '',
                                employeeId: user.employeeId || '',
                                position: user.position || '',
                                hireDate: user.hireDate ? user.hireDate.slice(0, 10) : '',
                                salary: typeof user.salary === 'number' ? user.salary : undefined,
                                role: (user.role as unknown as string) || 'employee',
                              });
                            }
                          }}
                        >
                          Reset
                        </Button>
                        <Button type="submit" disabled={updateUserEmployment.isPending}>
                          {updateUserEmployment.isPending ? (
                            <>
                              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                              Saving...
                            </>
                          ) : (
                            <>
                              <Edit3 className="h-4 w-4 mr-2" />
                              Save Employment
                            </>
                          )}
                        </Button>
                      </div>
                    </form>
                  </Form>

                  <Card>
                    <CardHeader>
                      <CardTitle>Employment Snapshot</CardTitle>
                      <CardDescription>
                        Quick overview of the user&apos;s employment profile.
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                        <Calendar className="h-5 w-5 text-gray-600" />
                        <div>
                          <p className="text-sm font-medium text-gray-600">
                            Hire Date
                          </p>
                          <p className="text-sm">
                            {formatDisplayDate(user.hireDate)}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                        <div>
                          <p className="text-sm font-medium text-gray-600">
                            Annual Salary
                          </p>
                          <p className="text-sm tabular-nums">{formatCurrencyNGN(user.salary)}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                        <Building2 className="h-5 w-5 text-gray-600" />
                        <div>
                          <p className="text-sm font-medium text-gray-600">
                            Department
                          </p>
                          <p className="text-sm">
                            {(() => {
                              const department = departments.find(
                                (dept) => dept.id === user.departmentId
                              );
                              return department?.name || 'No Department';
                            })()}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                        <Shield className="h-5 w-5 text-gray-600" />
                        <div>
                          <p className="text-sm font-medium text-gray-600">
                            Role
                          </p>
                          <p className="text-sm">
                            {user.role.replace('_', ' ').toUpperCase()}
                          </p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader>
                      <CardTitle>Leadership Assignments</CardTitle>
                      <CardDescription>
                        Departments or units where this user leads or manages.
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      {leadershipAssignments.length === 0 ? (
                        <p className="text-sm text-gray-500">
                          This user is not currently assigned to lead any departments or units.
                        </p>
                      ) : (
                        <div className="space-y-3">
                          {leadershipAssignments.map((assignment) => (
                            <div
                              key={assignment.id}
                              className="flex items-center justify-between p-3 border rounded-lg"
                            >
                              <div>
                                <p className="text-sm font-semibold text-gray-800">
                                  {assignment.name}
                                </p>
                                <p className="text-xs text-gray-500">
                                  {assignment.description}
                                </p>
                              </div>
                              <Badge variant="secondary">{assignment.label}</Badge>
                            </div>
                          ))}
                        </div>
                      )}
                    </CardContent>
                  </Card>
                </TabsContent>

                <TabsContent value="permissions" className="mt-4 space-y-4">
                  <PermissionsEditor
                    value={permissions}
                    onChange={(next) => setPermissions(normalizePermissions(next))}
                  />

                  {permissionsFeedback && (
                    <Alert variant={permissionsFeedback.type === 'error' ? 'destructive' : undefined}>
                      <AlertTitle>
                        {permissionsFeedback.type === 'error' ? 'Update failed' : 'Success'}
                      </AlertTitle>
                      <AlertDescription>{permissionsFeedback.message}</AlertDescription>
                    </Alert>
                  )}

                  <div className="flex flex-col gap-3 border-t pt-4 sm:flex-row sm:justify-end">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => setPermissions(normalizePermissions(user?.permissions))}
                    >
                      Reset
                    </Button>
                    <Button
                      type="button"
                      onClick={handlePermissionsSave}
                      disabled={updateUserPermissions.isPending}
                    >
                      {updateUserPermissions.isPending ? (
                        <>
                          <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                          Saving...
                        </>
                      ) : (
                        <>
                          <Edit3 className="h-4 w-4 mr-2" />
                          Save Permissions
                        </>
                      )}
                    </Button>
                  </div>
                </TabsContent>
              </Tabs>
            </CardContent>
          </Card>
        </div>

        <div className="space-y-6 lg:col-span-1">
          <Card className="sticky top-6 border border-border/50 shadow-sm">
            <CardHeader className="space-y-1">
              <CardTitle>Contact Information</CardTitle>
              <CardDescription>
                Primary contact details for this user.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                <Mail className="h-5 w-5 text-gray-600" />
                <div>
                  <p className="text-xs text-gray-500">Email</p>
                  <p className="text-sm font-medium break-all">{user.email}</p>
                </div>
              </div>
              <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                <Phone className="h-5 w-5 text-gray-600" />
                <div>
                  <p className="text-xs text-gray-500">Phone</p>
                  <p className="text-sm font-medium">{user.phone}</p>
                </div>
              </div>
              <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                <Calendar className="h-5 w-5 text-gray-600" />
                <div>
                  <p className="text-xs text-gray-500">Date of Birth</p>
                  <p className="text-sm font-medium">
                    {formatDisplayDate(user.dob)}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="sticky top-[26rem]">
            <CardHeader>
              <CardTitle>Recent Activity</CardTitle>
              <CardDescription>
                Latest audit log entries for this user.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {isLoadingAudit ? (
                <div className="flex items-center justify-center py-6">
                  <Loader2 className="h-6 w-6 animate-spin text-gray-400" />
                </div>
              ) : auditError ? (
                <Alert variant="destructive">
                  <AlertTitle>Unable to load activity</AlertTitle>
                  <AlertDescription>
                    Failed to fetch recent audit logs. Please try again later.
                  </AlertDescription>
                </Alert>
              ) : auditLogs.length === 0 ? (
                <p className="text-sm text-gray-500">
                  No recent audit events recorded for this user.
                </p>
              ) : (
                <div className="space-y-3">
                  {auditLogs.map((log) => (
                    <div
                      key={log.id}
                      className="p-3 border rounded-lg space-y-2 bg-gray-50"
                    >
                      <div className="flex items-center gap-2 text-xs text-gray-500">
                        <CheckCircle2 className="h-4 w-4 text-gray-400" />
                        <span>{new Date(log.createdAt).toLocaleString()}</span>
                      </div>
                      <p className="text-sm font-medium text-gray-800">
                        {log.description || log.actionType}
                      </p>
                      {log.userSnapshot?.fullName && (
                        <p className="text-xs text-gray-500">
                          By {log.userSnapshot.fullName}
                          {log.userSnapshot.email
                            ? ` (${log.userSnapshot.email})`
                            : ''}
                        </p>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}


