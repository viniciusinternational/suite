'use client';

import { useParams, useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Avatar } from '@/components/ui/avatar';
import { Skeleton } from '@/components/ui/skeleton';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useUser } from '@/hooks/use-users';
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
  DollarSign,
  UserCheck,
  Edit,
  Loader2,
} from 'lucide-react';

export default function UserDetailsPage() {
  useAuthGuard(['view_users']);
  const params = useParams();
  const router = useRouter();
  const userId = params.id as string;

  const { data: user, isLoading, error } = useUser(userId);

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

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0
    }).format(amount);
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
    return (
      <div className="space-y-6 p-6 bg-gray-50/50 min-h-screen">
        <div className="flex items-center gap-4">
          <Button variant="ghost" onClick={() => router.push('/users')}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Users
          </Button>
        </div>
        <div className="text-center py-12">
          <h1 className="text-2xl font-bold mb-4">User Not Found</h1>
          <p className="text-gray-600 mb-4">The user you're looking for doesn't exist.</p>
          <Button onClick={() => router.push('/users')}>Go Back to Users</Button>
        </div>
      </div>
    );
  }

  const department = getDepartment(user.departmentId);
  const yearsOfService = calculateYearsOfService(user.hireDate);

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
            <h1 className="text-3xl font-bold text-gray-900">User Details</h1>
            <p className="text-gray-600 mt-1">Complete user information and records</p>
          </div>
        </div>
        <Button onClick={() => {
          // Open edit dialog in users page
          const editUrl = new URL('/users', window.location.origin);
          editUrl.searchParams.set('edit', user.id);
          router.push(editUrl.pathname + editUrl.search);
        }}>
          <Edit className="h-4 w-4 mr-2" />
          Edit User
        </Button>
      </div>

      {/* Two Column Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: User Info */}
        <div className="lg:col-span-2">
          <Card>
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
                      <p className="text-sm flex items-center mt-1">
                        <DollarSign className="h-3 w-3 mr-1" />
                        {formatCurrency(user.salary)}
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
          <Card className="sticky top-6">
            <CardHeader>
              <CardTitle>Quick Stats</CardTitle>
              <CardDescription>User overview information</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div className="flex items-center gap-2">
                  <UserCheck className="h-5 w-5 text-gray-600" />
                  <span className="text-sm font-medium">Status</span>
                </div>
                <Badge variant="outline" className={getStatusBadgeColor(user.isActive)}>
                  {user.isActive ? 'Active' : 'Inactive'}
                </Badge>
              </div>
              <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div className="flex items-center gap-2">
                  <Calendar className="h-5 w-5 text-gray-600" />
                  <span className="text-sm font-medium">Years of Service</span>
                </div>
                <span className="text-sm font-bold">{yearsOfService}</span>
              </div>
              <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div className="flex items-center gap-2">
                  <DollarSign className="h-5 w-5 text-gray-600" />
                  <span className="text-sm font-medium">Annual Salary</span>
                </div>
                <span className="text-sm font-bold">{formatCurrency(user.salary)}</span>
              </div>
              {department && (
                <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div className="flex items-center gap-2">
                    <Building2 className="h-5 w-5 text-gray-600" />
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

