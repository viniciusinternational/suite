'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import {
  Form,
  FormControl,
  FormDescription,
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
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { ZitadelUserSelector } from '@/components/user/zitadel-user-selector';
import { PermissionsEditor } from '@/components/user/permissions-editor';
import { useCreateUser } from '@/hooks/use-users';
import { useQuery } from '@tanstack/react-query';
import axiosClient from '@/lib/axios';
import { useAuthGuard } from '@/hooks/use-auth-guard';
import type { ZitadelUser, Department, UserRole } from '@/types';
import {
  ArrowLeft,
  UserPlus,
  Loader2,
  AlertCircle,
  User,
  Mail,
  Phone,
  Calendar,
  Building2,
  DollarSign,
} from 'lucide-react';

// Validation schema
const createUserSchema = z.object({
  firstName: z.string().min(1, 'First name is required'),
  lastName: z.string().min(1, 'Last name is required'),
  fullName: z.string().min(1, 'Full name is required'),
  email: z.string().email('Invalid email address'),
  phone: z.string().min(1, 'Phone is required'),
  dob: z.string().min(1, 'Date of birth is required'),
  gender: z.string().min(1, 'Gender is required'),
  departmentId: z.string().optional(),
  employeeId: z.string().optional(),
  position: z.string().min(1, 'Position is required'),
  hireDate: z.string().min(1, 'Hire date is required'),
  salary: z.coerce.number().positive('Salary must be positive'),
  role: z.enum(['super_admin', 'managing_director', 'department_head', 'hr_manager', 'administrator', 'accountant', 'employee']),
  permissions: z.record(z.boolean()).optional(),
});

type CreateUserFormData = z.infer<typeof createUserSchema>;

export default function NewUserPage() {
  useAuthGuard(['add_users']);
  const router = useRouter();
  const [selectedZitadelUser, setSelectedZitadelUser] = useState<ZitadelUser | null>(null);
  const [permissions, setPermissions] = useState<Record<string, boolean>>({});

  const createUser = useCreateUser();

  // Fetch departments
  const { data: departmentsResponse, isLoading: isLoadingDepartments } = useQuery({
    queryKey: ['departments'],
    queryFn: async () => {
      const response = await axiosClient.get('/departments');
      return response.data;
    },
  });
  const departments: Department[] = departmentsResponse?.data || [];

  const form = useForm<CreateUserFormData>({
    resolver: zodResolver(createUserSchema),
    defaultValues: {
      firstName: '',
      lastName: '',
      fullName: '',
      email: '',
      phone: '',
      dob: '',
      gender: 'Male',
      departmentId: '',
      employeeId: '',
      position: '',
      hireDate: '',
      salary: 0,
      role: 'employee',
      permissions: {},
    },
  });

  const handleZitadelUserSelect = (zitadelUser: ZitadelUser | null) => {
    setSelectedZitadelUser(zitadelUser);
    if (zitadelUser) {
      form.setValue('firstName', zitadelUser.firstName);
      form.setValue('lastName', zitadelUser.lastName);
      form.setValue('fullName', zitadelUser.displayName);
      form.setValue('email', zitadelUser.email);
    }
  };

  const onSubmit = async (values: CreateUserFormData) => {
    if (!selectedZitadelUser) {
      form.setError('root', {
        message: 'Please select a user from Zitadel first',
      });
      return;
    }

    try {
      await createUser.mutateAsync({
        ...values,
        id: selectedZitadelUser.id, // Zitadel user ID
        departmentId: values.departmentId || undefined,
        employeeId: values.employeeId || undefined,
        permissions: permissions,
      });

      router.push('/users');
    } catch (error: any) {
      form.setError('root', {
        message: error?.response?.data?.error || 'Failed to create user',
      });
    }
  };

  return (
    <div className="space-y-6 p-6 bg-gray-50/50 min-h-screen">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" onClick={() => router.push('/users')}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Users
          </Button>
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Create New User</h1>
            <p className="text-gray-600 mt-1">Select a user from Zitadel and fill in their details</p>
          </div>
        </div>
      </div>

      {/* Two Column Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Basic Info */}
        <div className="lg:col-span-2">
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              {/* Zitadel User Selection - Required */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <User className="h-5 w-5" />
                    Select Zitadel User
                  </CardTitle>
                  <CardDescription>
                    Select a user from Zitadel to create their profile. This is required.
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {!selectedZitadelUser && (
                    <Alert className="mb-4">
                      <AlertCircle className="h-4 w-4" />
                      <AlertDescription>
                        Please select a user from Zitadel to continue
                      </AlertDescription>
                    </Alert>
                  )}
                  <ZitadelUserSelector
                    onSelect={handleZitadelUserSelect}
                    selectedUserId={selectedZitadelUser?.id}
                  />
                  {selectedZitadelUser && (
                    <div className="mt-4 p-4 bg-green-50 border border-green-200 rounded-lg">
                      <p className="text-sm font-medium text-green-800">
                        Selected: {selectedZitadelUser.displayName} ({selectedZitadelUser.email})
                      </p>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Basic Information */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <UserPlus className="h-5 w-5" />
                    User Basic Information
                  </CardTitle>
                  <CardDescription>
                    Enter the essential details for the new user
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  {/* Personal Information Section */}
                  <div className="space-y-4">
                    <h3 className="text-lg font-semibold flex items-center gap-2">
                      <User className="h-5 w-5" />
                      Personal Information
                    </h3>
                    <div className="grid grid-cols-2 gap-4">
                      <FormField
                        control={form.control}
                        name="firstName"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>First Name</FormLabel>
                            <FormControl>
                              <Input placeholder="Enter first name" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="lastName"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Last Name</FormLabel>
                            <FormControl>
                              <Input placeholder="Enter last name" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>

                    <FormField
                      control={form.control}
                      name="fullName"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Full Name</FormLabel>
                          <FormControl>
                            <Input placeholder="Enter full name" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <div className="grid grid-cols-2 gap-4">
                      <FormField
                        control={form.control}
                        name="email"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Email Address</FormLabel>
                            <FormControl>
                              <Input
                                type="email"
                                placeholder="Enter email address"
                                {...field}
                                disabled
                              />
                            </FormControl>
                            <FormDescription>
                              Email is synced from Zitadel
                            </FormDescription>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="phone"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Phone Number</FormLabel>
                            <FormControl>
                              <Input placeholder="Enter phone number" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <FormField
                        control={form.control}
                        name="dob"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Date of Birth</FormLabel>
                            <FormControl>
                              <Input type="date" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="gender"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Gender</FormLabel>
                            <Select onValueChange={field.onChange} defaultValue={field.value}>
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
                  </div>

                  {/* Employment Information Section */}
                  <div className="space-y-4">
                    <h3 className="text-lg font-semibold flex items-center gap-2">
                      <Building2 className="h-5 w-5" />
                      Employment Information
                    </h3>
                    <div className="grid grid-cols-2 gap-4">
                      <FormField
                        control={form.control}
                        name="departmentId"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Department</FormLabel>
                            <Select
                              onValueChange={(value) =>
                                field.onChange(value === 'none' ? '' : value)
                              }
                              defaultValue={field.value || 'none'}
                              disabled={isLoadingDepartments}
                            >
                              <FormControl>
                                <SelectTrigger className="w-full">
                                  {isLoadingDepartments ? (
                                    <span className="text-muted-foreground">Loading departments...</span>
                                  ) : (
                                    <SelectValue placeholder="Select department" />
                                  )}
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                {isLoadingDepartments ? (
                                  <SelectItem value="_loading" disabled>Loading...</SelectItem>
                                ) : (
                                  <>
                                    <SelectItem value="none">No Department</SelectItem>
                                    {departments.map((dept) => (
                                      <SelectItem key={dept.id} value={dept.id}>
                                        {dept.name}
                                      </SelectItem>
                                    ))}
                                  </>
                                )}
                              </SelectContent>
                            </Select>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="role"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Role</FormLabel>
                            <Select
                              onValueChange={(value: UserRole) => field.onChange(value)}
                              defaultValue={field.value}
                            >
                              <FormControl>
                                <SelectTrigger className="w-full">
                                  <SelectValue placeholder="Select role" />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                <SelectItem value="employee">User</SelectItem>
                                <SelectItem value="department_head">Department Head</SelectItem>
                                <SelectItem value="hr_manager">HR Manager</SelectItem>
                                <SelectItem value="accountant">Accountant</SelectItem>
                                <SelectItem value="administrator">Administrator</SelectItem>
                                <SelectItem value="managing_director">Managing Director</SelectItem>
                                <SelectItem value="super_admin">Super Admin</SelectItem>
                              </SelectContent>
                            </Select>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <FormField
                        control={form.control}
                        name="position"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Position</FormLabel>
                            <FormControl>
                              <Input placeholder="Enter position/job title" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="employeeId"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Employee ID (Optional)</FormLabel>
                            <FormControl>
                              <Input placeholder="Enter employee ID" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <FormField
                        control={form.control}
                        name="hireDate"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Hire Date</FormLabel>
                            <FormControl>
                              <Input type="date" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="salary"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Annual Salary</FormLabel>
                            <FormControl>
                              <Input
                                type="number"
                                placeholder="Enter annual salary"
                                {...field}
                                onChange={(e) => field.onChange(Number(e.target.value))}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                  </div>

                  {form.formState.errors.root && (
                    <Alert variant="destructive">
                      <AlertCircle className="h-4 w-4" />
                      <AlertDescription>
                        {form.formState.errors.root.message}
                      </AlertDescription>
                    </Alert>
                  )}

                  {/* Action Buttons */}
                  <div className="flex justify-end gap-3 pt-4 border-t">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => router.push('/users')}
                    >
                      Cancel
                    </Button>
                    <Button
                      type="submit"
                      disabled={createUser.isPending || !selectedZitadelUser}
                    >
                      {createUser.isPending ? (
                        <>
                          <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                          Creating...
                        </>
                      ) : (
                        <>
                          <UserPlus className="h-4 w-4 mr-2" />
                          Create User
                        </>
                      )}
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </form>
          </Form>
        </div>

        {/* Right Column: Permissions */}
        <div className="lg:col-span-1">
          <Card className="sticky top-6">
            <CardHeader>
              <CardTitle>Permissions</CardTitle>
              <CardDescription>
                Configure user permissions and access levels
              </CardDescription>
            </CardHeader>
            <CardContent>
              <PermissionsEditor
                value={permissions}
                onChange={setPermissions}
              />
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

