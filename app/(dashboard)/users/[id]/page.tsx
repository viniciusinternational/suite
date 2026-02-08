'use client';

import { useState } from 'react';
import { useParams, useRouter, notFound } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Avatar } from '@/components/ui/avatar';
import { Skeleton } from '@/components/ui/skeleton';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useUser, useDeleteUser } from '@/hooks/use-users';
import { useQuery } from '@tanstack/react-query';
import axiosClient from '@/lib/axios';
import { useAuthGuard } from '@/hooks/use-auth-guard';
import type { Department } from '@/types';
import {
  ArrowLeft,
  User,
  Mail,
  Phone,
  Calendar,
  Building2,
  UserCheck,
  Edit,
  UserX,
} from 'lucide-react';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { formatCurrencyNGN } from '@/lib/utils';

export default function UserDetailsPage() {
  useAuthGuard(['view_users']);
  const params = useParams();
  const router = useRouter();
  const userId = params.id as string;

  const { data: user, isLoading, error } = useUser(userId);
  const deleteUserMutation = useDeleteUser();
  const [showDeactivateDialog, setShowDeactivateDialog] = useState(false);

  // Fetch departments
  const { data: departmentsResponse } = useQuery({
    queryKey: ['departments'],
    queryFn: async () => {
      const response = await axiosClient.get('/departments');
      return response.data;
    },
  });
  const departments: Department[] = departmentsResponse?.data || [];

  const getDepartment = (departmentId?: string) => {
    if (!departmentId) return null;
    return departments.find(dept => dept.id === departmentId);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const calculateYearsOfService = (hireDate: string) => {
    const hire = new Date(hireDate);
    const now = new Date();
    const years = now.getFullYear() - hire.getFullYear();
    return years;
  };

  const getStatusBadgeColor = (isActive: boolean) => {
    return isActive
      ? 'bg-green-100 text-green-800 border-green-200'
      : 'bg-red-100 text-red-800 border-red-200';
  };

  const handleDeactivate = async () => {
    if (!user) return;
    await deleteUserMutation.mutateAsync(user.id);
    setShowDeactivateDialog(false);
    router.push('/users');
  };

  if (isLoading) {
    return (
      <div className="space-y-6 p-6 bg-gray-50/50 min-h-screen">
        <div className="flex items-center gap-4">
          <Skeleton className="h-10 w-32" />
          <Skeleton className="h-10 w-64" />
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2">
            <Skeleton className="h-96 w-full" />
          </div>
          <div>
            <Skeleton className="h-96 w-full" />
          </div>
        </div>
      </div>
    );
  }

  if (error || !user) {
    notFound();
  }

  const department = getDepartment(user.departmentId);
  const yearsOfService = calculateYearsOfService(user.hireDate);

  return (
    <div className="space-y-6 p-6 bg-muted/30 min-h-screen">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="flex items-start gap-4">
          <Button variant="ghost" size="icon" className="shrink-0" onClick={() => router.push('/users')} aria-label="Back to users">
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div className="min-w-0">
            <h1 className="text-2xl font-bold tracking-tight text-foreground md:text-3xl">User Details</h1>
            <p className="text-muted-foreground mt-1 text-sm">Complete user information and records</p>
          </div>
        </div>
        <div className="flex gap-2 shrink-0">
          <Button onClick={() => router.push(`/users/${user.id}/edit`)}>
            <Edit className="h-4 w-4 mr-2" />
            Edit User
          </Button>
          {user.isActive && (
            <Button variant="destructive" onClick={() => setShowDeactivateDialog(true)}>
              <UserX className="h-4 w-4 mr-2" />
              Deactivate User
            </Button>
          )}
        </div>
      </div>

      <AlertDialog open={showDeactivateDialog} onOpenChange={setShowDeactivateDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This will deactivate the user. They will no longer be able to access the system.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeactivate}
              className="bg-red-600 hover:bg-red-700"
              disabled={deleteUserMutation.isPending}
            >
              {deleteUserMutation.isPending ? 'Deactivating...' : 'Deactivate'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Two Column Layout */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Left Column: User Info */}
        <div className="lg:col-span-2">
          <Card className="border border-border/50 shadow-sm">
            <CardHeader>
              <div className="flex items-center space-x-4">
                <Avatar className="h-16 w-16 bg-gray-200 flex items-center justify-center">
                  <User className="h-8 w-8 text-gray-600" />
                </Avatar>
                <div>
                  <CardTitle className="text-xl">{user.fullName}</CardTitle>
                  <CardDescription className="mt-1">{user.position}</CardDescription>
                  <Badge variant="outline" className={getStatusBadgeColor(user.isActive)}>
                    {user.isActive ? 'Active' : 'Inactive'}
                  </Badge>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <Tabs defaultValue="personal" className="w-full">
                <TabsList className="grid w-full grid-cols-3">
                  <TabsTrigger value="personal">Personal Info</TabsTrigger>
                  <TabsTrigger value="employment">Employment</TabsTrigger>
                  <TabsTrigger value="permissions">Permissions</TabsTrigger>
                </TabsList>
                
                <TabsContent value="personal" className="space-y-4 mt-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm font-medium text-gray-600">Full Name</p>
                      <p className="text-sm mt-1">{user.fullName}</p>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-600">Email</p>
                      <p className="text-sm flex items-center mt-1">
                        <Mail className="h-3 w-3 mr-1" />
                        {user.email}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-600">Phone</p>
                      <p className="text-sm flex items-center mt-1">
                        <Phone className="h-3 w-3 mr-1" />
                        {user.phone}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-600">Date of Birth</p>
                      <p className="text-sm mt-1">{formatDate(user.dob)}</p>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-600">Gender</p>
                      <p className="text-sm mt-1">{user.gender}</p>
                    </div>
                    {user.employeeId && (
                      <div>
                        <p className="text-sm font-medium text-gray-600">Employee ID</p>
                        <p className="text-sm mt-1">{user.employeeId}</p>
                      </div>
                    )}
                  </div>
                </TabsContent>
                
                <TabsContent value="employment" className="space-y-4 mt-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm font-medium text-gray-600">Department</p>
                      <p className="text-sm flex items-center mt-1">
                        <Building2 className="h-3 w-3 mr-1" />
                        {department?.name || 'No Department'}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-600">Position</p>
                      <p className="text-sm mt-1">{user.position}</p>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-600">Role</p>
                      <p className="text-sm mt-1">
                        <Badge variant="outline">
                          {user.role.replace('_', ' ').toUpperCase()}
                        </Badge>
                      </p>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-600">Hire Date</p>
                      <p className="text-sm flex items-center mt-1">
                        <Calendar className="h-3 w-3 mr-1" />
                        {formatDate(user.hireDate)}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-600">Years of Service</p>
                      <p className="text-sm mt-1">
                        {yearsOfService} year{yearsOfService !== 1 ? 's' : ''}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-600">Salary</p>
                      <p className="text-sm mt-1 tabular-nums">
                        {formatCurrencyNGN(user.salary)}
                      </p>
                    </div>
                  </div>
                </TabsContent>
                
                <TabsContent value="permissions" className="space-y-4 mt-4">
                  <div className="p-4 bg-gray-50 border rounded-lg">
                    <p className="text-sm font-medium text-gray-600 mb-2">User Permissions:</p>
                    {user.permissions && Object.keys(user.permissions).length > 0 ? (
                      <div className="space-y-2">
                        {Object.entries(user.permissions).map(([key, value]) => (
                          <div key={key} className="flex items-center justify-between p-2 bg-white rounded border">
                            <span className="text-sm font-medium">{key}</span>
                            <Badge variant={value ? 'default' : 'secondary'}>
                              {value ? 'Enabled' : 'Disabled'}
                            </Badge>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-sm text-gray-500">No permissions configured</p>
                    )}
                  </div>
                </TabsContent>
              </Tabs>
            </CardContent>
          </Card>
        </div>

        {/* Right Column: Quick Stats */}
        <div className="lg:col-span-1">
          <Card className="sticky top-6 border border-border/50 shadow-sm">
            <CardHeader className="space-y-1">
              <CardTitle>Quick Stats</CardTitle>
              <CardDescription>User overview information</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-center justify-between rounded-lg border border-border/50 bg-muted/30 p-3">
                <div className="flex items-center gap-2">
                  <UserCheck className="h-5 w-5 text-muted-foreground" />
                  <span className="text-sm font-medium">Status</span>
                </div>
                <Badge variant="outline" className={getStatusBadgeColor(user.isActive)}>
                  {user.isActive ? 'Active' : 'Inactive'}
                </Badge>
              </div>
              <div className="flex items-center justify-between rounded-lg border border-border/50 bg-muted/30 p-3">
                <div className="flex items-center gap-2">
                  <Calendar className="h-5 w-5 text-muted-foreground" />
                  <span className="text-sm font-medium">Years of Service</span>
                </div>
                <span className="text-sm font-bold tabular-nums">{yearsOfService}</span>
              </div>
              <div className="flex items-center justify-between rounded-lg border border-border/50 bg-muted/30 p-3">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium">Annual Salary</span>
                </div>
                <span className="text-sm font-bold tabular-nums">{formatCurrencyNGN(user.salary)}</span>
              </div>
              {department && (
                <div className="flex items-center justify-between rounded-lg border border-border/50 bg-muted/30 p-3">
                  <div className="flex items-center gap-2">
                    <Building2 className="h-5 w-5 text-muted-foreground" />
                    <span className="text-sm font-medium">Department</span>
                  </div>
                  <span className="text-sm font-bold">{department.name}</span>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

