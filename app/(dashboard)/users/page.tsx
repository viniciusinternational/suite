'use client';

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Avatar } from '@/components/ui/avatar';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from '@/components/ui/table';
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from '@/components/ui/select';
import {
  Users,
  Search,
  Filter,
  Mail,
  Calendar,
  Building2,
  UserCheck,
  Shield,
  Download,
  FileText,
  UserPlus,
  Loader2,
  AlertCircle,
} from 'lucide-react';
import type { User, Department } from '@/types';
import { useUsers } from '@/hooks/use-users';
import { useQuery } from '@tanstack/react-query';
import axiosClient from '@/lib/axios';
import { useRouter } from 'next/navigation';

import { useAuthGuard } from '@/hooks/use-auth-guard';

export default function UsersPage() {
  useAuthGuard(['view_users']);
  const router = useRouter();
  const [searchTerm, setSearchTerm] = useState('');
  const [departmentFilter, setDepartmentFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [roleFilter, setRoleFilter] = useState<string>('all');

  // Fetch users from API
  const { data: users = [], isLoading, error, refetch } = useUsers({
    search: searchTerm,
    department: departmentFilter !== 'all' ? departmentFilter : undefined,
    status: statusFilter !== 'all' ? statusFilter : undefined,
  });

  // Fetch departments
  const { data: departmentsResponse } = useQuery({
    queryKey: ['departments'],
    queryFn: async () => {
      const response = await axiosClient.get('/departments');
      return response.data;
    },
  });
  const departments: Department[] = departmentsResponse?.data || [];

  const filteredUsers = users.filter(user => {
    const matchesRole = roleFilter === 'all' || user.role === roleFilter;
    return matchesRole;
  });

  const getStatusBadgeColor = (isActive: boolean) => {
    return isActive
      ? 'bg-green-100 text-green-800 border-green-200'
      : 'bg-red-100 text-red-800 border-red-200';
  };

  const getDepartment = (departmentId?: string) => {
    if (!departmentId) return null;
    return departments.find(dept => dept.id === departmentId);
  };

  const uniqueRoles = [...new Set(users.map(user => user.role))];

  return (
    <div className="min-h-screen space-y-6 p-6 bg-muted/30">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:justify-between sm:items-center">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground md:text-3xl">All Users</h1>
          <p className="text-muted-foreground mt-1 text-sm">Complete user directory and management</p>
        </div>
        
        <div className="flex flex-wrap gap-2">
          <Button variant="outline">
            <Download className="h-4 w-4 mr-2" />
            Export
          </Button>
          <Button variant="outline">
            <FileText className="h-4 w-4 mr-2" />
            Reports
          </Button>
          <Button onClick={() => router.push('/users/new')}>
            <UserPlus className="h-4 w-4 mr-2" />
            Add User
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
        <Card className="border border-border/50 shadow-sm">
          <CardContent className="p-5 md:p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Total Users</p>
                <p className="text-2xl font-bold text-gray-900">{users.length}</p>
              </div>
              <Users className="h-8 w-8 text-blue-600" />
            </div>
          </CardContent>
        </Card>
        
        <Card className="border border-border/50 shadow-sm">
          <CardContent className="p-5 md:p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Active Users</p>
                <p className="text-2xl font-bold text-green-700">
                  {users.filter(user => user.isActive).length}
                </p>
              </div>
              <UserCheck className="h-8 w-8 text-green-600" />
            </div>
          </CardContent>
        </Card>
        
        <Card className="border border-border/50 shadow-sm">
          <CardContent className="p-5 md:p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Departments</p>
                <p className="text-2xl font-bold text-purple-700">{departments.length}</p>
              </div>
              <Building2 className="h-8 w-8 text-purple-600" />
            </div>
          </CardContent>
        </Card>
        
        <Card className="border border-border/50 shadow-sm">
          <CardContent className="p-5 md:p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Roles in Use</p>
                <p className="text-2xl font-bold text-orange-700">
                  {uniqueRoles.length}
                </p>
              </div>
              <Shield className="h-8 w-8 text-orange-600" />
            </div>
          </CardContent>
        </Card>
      </div>
      
      {/* User Directory */}
      <Card className="border border-border/50 shadow-sm">
        <CardHeader className="space-y-1">
          <CardTitle>User Directory</CardTitle>
          <CardDescription>Search and manage all user records</CardDescription>
        </CardHeader>
        <CardContent>
          {/* Filters */}
          <div className="flex flex-col md:flex-row gap-4 mb-6">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                <Input
                  placeholder="Search users by name, email..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            
            <Select value={departmentFilter} onValueChange={setDepartmentFilter}>
              <SelectTrigger className="w-48">
                <Filter className="h-4 w-4 mr-2" />
                <SelectValue placeholder="Filter by department" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Departments</SelectItem>
                {departments.map((dept) => (
                  <SelectItem key={dept.id} value={dept.id}>
                    {dept.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-48">
                <SelectValue placeholder="Filter by status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="active">Active</SelectItem>
                <SelectItem value="inactive">Inactive</SelectItem>
              </SelectContent>
            </Select>
            
            <Select value={roleFilter} onValueChange={setRoleFilter}>
              <SelectTrigger className="w-48">
                <SelectValue placeholder="Filter by role" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Roles</SelectItem>
                {uniqueRoles.map((role) => (
                  <SelectItem key={role} value={role}>
                    {role.replace('_', ' ').toUpperCase()}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Loading State */}
          {isLoading && (
            <div className="flex items-center justify-center p-8">
              <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
              <span className="ml-2 text-gray-600">Loading users...</span>
            </div>
          )}

          {/* Error State */}
          {error && (
            <Alert variant="destructive" className="mb-4">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                Failed to load users. Please try again.
                <Button variant="outline" size="sm" onClick={() => refetch()} className="ml-2">
                  Retry
                </Button>
              </AlertDescription>
            </Alert>
          )}

          {/* Users Table */}
          {!isLoading && !error && (
            <div className="rounded-lg border border-border/50 overflow-hidden">
              <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="bg-gray-50">
                    <TableHead>User</TableHead>
                    <TableHead>Position</TableHead>
                    <TableHead>Role</TableHead>
                    <TableHead>Department</TableHead>
                    <TableHead>Hire Date</TableHead>
                    <TableHead>Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredUsers.map((user) => {
                    const department = getDepartment(user.departmentId);
                    
                    return (
                      <TableRow
                        key={user.id}
                        className="cursor-pointer transition-colors hover:bg-muted/50"
                        onClick={() => router.push(`/users/${user.id}`)}
                      >
                        <TableCell>
                          <div className="flex items-center space-x-3">
                            <Avatar className="h-8 w-8 bg-gray-200 flex items-center justify-center">
                              <Users className="h-4 w-4 text-gray-600" />
                            </Avatar>
                            <div>
                              <p className="font-medium text-gray-900">
                                {user.fullName}
                              </p>
                              <p className="text-sm text-gray-600 flex items-center">
                                <Mail className="h-3 w-3 mr-1" />
                                {user.email}
                              </p>
                            </div>
                          </div>
                        </TableCell>
                        
                        <TableCell>
                          <span className="text-sm font-medium">{user.position}</span>
                        </TableCell>
                        
                        <TableCell>
                          <Badge variant="outline">
                            {user.role.replace('_', ' ').toUpperCase()}
                          </Badge>
                        </TableCell>
                        
                        <TableCell>
                          <span className="text-sm text-gray-900">
                            {department ? department.name : 'No Department'}
                          </span>
                        </TableCell>
                        
                        <TableCell>
                          <div className="flex items-center text-sm text-gray-600">
                            <Calendar className="h-3 w-3 mr-1" />
                            {new Date(user.hireDate).toLocaleDateString()}
                          </div>
                        </TableCell>
                        
                        <TableCell>
                          <Badge variant="outline" className={getStatusBadgeColor(user.isActive)}>
                            {user.isActive ? 'Active' : 'Inactive'}
                          </Badge>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
              </div>
            </div>
          )}
          
          {!isLoading && !error && filteredUsers.length === 0 && (
            <div className="flex flex-col items-center justify-center rounded-lg border border-dashed border-border/60 bg-muted/20 py-12 px-4">
              <Users className="h-12 w-12 text-muted-foreground mb-4" aria-hidden />
              <p className="text-sm font-medium text-foreground">No users found</p>
              <p className="text-sm text-muted-foreground mt-1">Try adjusting your filters or search term</p>
            </div>
          )}
        </CardContent>
      </Card>

    </div>
  );
};

