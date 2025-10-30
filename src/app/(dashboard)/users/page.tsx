'use client';

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Avatar } from '@/components/ui/avatar';
import { Label } from '@/components/ui/label';
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
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { 
  Users, 
  Search, 
  Filter, 
  MoreHorizontal, 
  Eye,
  Mail,
  Phone,
  Calendar,
  DollarSign,
  Building2,
  UserCheck,
  Download,
  FileText,
  Edit,
  Trash2,
  UserPlus,
  Save,
  ArrowLeft,
  ArrowRight,
  Loader2,
  AlertCircle,
  CheckCircle2
} from 'lucide-react';
import { 
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import type { User, ZitadelUser, Department, UserRole } from '@/types';
import { useUsers, useCreateUser, useUpdateUser, useDeleteUser } from '@/hooks/use-users';
import { ZitadelUserSelector } from '@/components/user/zitadel-user-selector';
import { PermissionsEditor } from '@/components/user/permissions-editor';
import { useQuery } from '@tanstack/react-query';
import axiosClient from '@/lib/axios';

import { useAuthGuard } from '@/hooks/use-auth-guard';

export default function UsersPage() {
  useAuthGuard(['view_users']);
  const [searchTerm, setSearchTerm] = useState('');
  const [departmentFilter, setDepartmentFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [roleFilter, setRoleFilter] = useState<string>('all');
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [isDetailOpen, setIsDetailOpen] = useState(false);
  const [isAddUserOpen, setIsAddUserOpen] = useState(false);
  const [isEditUserOpen, setIsEditUserOpen] = useState(false);
  const [createStep, setCreateStep] = useState<1 | 2 | 3>(1);
  const [selectedZitadelUser, setSelectedZitadelUser] = useState<ZitadelUser | null>(null);

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

  // Mutations
  const createUserMutation = useCreateUser();
  const updateUserMutation = useUpdateUser();
  const deleteUserMutation = useDeleteUser();

  // Form state for new/edit user
  const [userFormData, setUserFormData] = useState({
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
    salary: '',
    role: 'employee' as UserRole, // 'employee' is the role value, but displayed as "User" in UI
    permissions: {} as Record<string, boolean>,
  });

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

  const openUserDetail = (user: User) => {
    setSelectedUser(user);
    setIsDetailOpen(true);
  };

  const handleAddUser = async () => {
    try {
      await createUserMutation.mutateAsync({
        ...userFormData,
        salary: parseFloat(userFormData.salary),
        departmentId: userFormData.departmentId || undefined,
        employeeId: userFormData.employeeId || undefined,
      });
      
      resetUserForm();
      setIsAddUserOpen(false);
      setCreateStep(1);
      setSelectedZitadelUser(null);
    } catch (error) {
      console.error('Failed to create user:', error);
    }
  };

  const handleEditUser = async () => {
    if (!selectedUser) return;
    
    try {
      await updateUserMutation.mutateAsync({
        id: selectedUser.id,
        data: {
          ...userFormData,
          salary: parseFloat(userFormData.salary),
          departmentId: userFormData.departmentId || undefined,
          employeeId: userFormData.employeeId || undefined,
        },
      });
      
      setIsEditUserOpen(false);
      setSelectedUser(null);
      resetUserForm();
    } catch (error) {
      console.error('Failed to update user:', error);
    }
  };

  const handleDeleteUser = async (userId: string) => {
    if (confirm('Are you sure you want to deactivate this user?')) {
      try {
        await deleteUserMutation.mutateAsync(userId);
      } catch (error) {
        console.error('Failed to delete user:', error);
      }
    }
  };

  const openEditUserDialog = (user: User) => {
    setSelectedUser(user);
    setUserFormData({
      firstName: user.firstName,
      lastName: user.lastName,
      fullName: user.fullName,
      email: user.email,
      phone: user.phone,
      dob: user.dob,
      gender: user.gender,
      departmentId: user.departmentId || '',
      employeeId: user.employeeId || '',
      position: user.position,
      hireDate: user.hireDate,
      salary: user.salary.toString(),
      role: user.role,
      permissions: user.permissions || {},
    });
    setIsEditUserOpen(true);
  };

  const resetUserForm = () => {
    setUserFormData({
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
      salary: '',
      role: 'employee',
      permissions: {},
    });
  };

  const handleZitadelUserSelect = (zitadelUser: ZitadelUser | null) => {
    setSelectedZitadelUser(zitadelUser);
    if (zitadelUser) {
      setUserFormData(prev => ({
        ...prev,
        firstName: zitadelUser.firstName,
        lastName: zitadelUser.lastName,
        fullName: zitadelUser.displayName,
        email: zitadelUser.email,
      }));
    }
  };

  const handleNextStep = () => {
    if (createStep === 1 && !selectedZitadelUser) {
      alert('Please select a user from Zitadel');
      return;
    }
    if (createStep < 3) {
      setCreateStep((createStep + 1) as 1 | 2 | 3);
    }
  };

  const handlePrevStep = () => {
    if (createStep > 1) {
      setCreateStep((createStep - 1) as 1 | 2 | 3);
    }
  };

  const uniqueRoles = [...new Set(users.map(user => user.role))];

  const UserDetail = ({ user }: { user: User }) => {
    const department = getDepartment(user.departmentId);
    const yearsOfService = calculateYearsOfService(user.hireDate);

    return (
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center space-x-4">
          <Avatar className="h-16 w-16 bg-gray-200 flex items-center justify-center">
            <Users className="h-8 w-8 text-gray-600" />
          </Avatar>
          <div>
            <h3 className="text-xl font-bold">{user.fullName}</h3>
            <p className="text-gray-600">{user.position}</p>
            <Badge variant="outline" className={getStatusBadgeColor(user.isActive)}>
              {user.isActive ? 'Active' : 'Inactive'}
            </Badge>
          </div>
        </div>

        <Tabs defaultValue="personal" className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="personal">Personal Info</TabsTrigger>
            <TabsTrigger value="employment">Employment</TabsTrigger>
            <TabsTrigger value="permissions">Permissions</TabsTrigger>
          </TabsList>
          
          <TabsContent value="personal" className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm font-medium text-gray-600">Full Name</p>
                <p className="text-sm">{user.fullName}</p>
              </div>
              <div>
                <p className="text-sm font-medium text-gray-600">Email</p>
                <p className="text-sm flex items-center">
                  <Mail className="h-3 w-3 mr-1" />
                  {user.email}
                </p>
              </div>
              <div>
                <p className="text-sm font-medium text-gray-600">Phone</p>
                <p className="text-sm flex items-center">
                  <Phone className="h-3 w-3 mr-1" />
                  {user.phone}
                </p>
              </div>
              <div>
                <p className="text-sm font-medium text-gray-600">Date of Birth</p>
                <p className="text-sm">{formatDate(user.dob)}</p>
              </div>
              <div>
                <p className="text-sm font-medium text-gray-600">Gender</p>
                <p className="text-sm">{user.gender}</p>
              </div>
            </div>
          </TabsContent>
          
          <TabsContent value="employment" className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm font-medium text-gray-600">Department</p>
                <p className="text-sm flex items-center">
                  <Building2 className="h-3 w-3 mr-1" />
                  {department?.name || 'No Department'}
                </p>
              </div>
              <div>
                <p className="text-sm font-medium text-gray-600">Position</p>
                <p className="text-sm">{user.position}</p>
              </div>
              <div>
                <p className="text-sm font-medium text-gray-600">Role</p>
                <p className="text-sm">{user.role.replace('_', ' ').toUpperCase()}</p>
              </div>
              <div>
                <p className="text-sm font-medium text-gray-600">Hire Date</p>
                <p className="text-sm flex items-center">
                  <Calendar className="h-3 w-3 mr-1" />
                  {formatDate(user.hireDate)}
                </p>
              </div>
              <div>
                <p className="text-sm font-medium text-gray-600">Years of Service</p>
                <p className="text-sm">{yearsOfService} year{yearsOfService !== 1 ? 's' : ''}</p>
              </div>
              <div>
                <p className="text-sm font-medium text-gray-600">Salary</p>
                <p className="text-sm flex items-center">
                  <DollarSign className="h-3 w-3 mr-1" />
                  {formatCurrency(user.salary)}
                </p>
              </div>
            </div>
          </TabsContent>
          
          <TabsContent value="permissions" className="space-y-4">
            <div className="p-4 bg-gray-50 border rounded-lg">
              <p className="text-sm font-medium text-gray-600 mb-2">User Permissions:</p>
              {user.permissions && Object.keys(user.permissions).length > 0 ? (
                <pre className="text-xs font-mono overflow-auto">
                  {JSON.stringify(user.permissions, null, 2)}
                </pre>
              ) : (
                <p className="text-sm text-gray-500">No permissions configured</p>
              )}
            </div>
          </TabsContent>
        </Tabs>
      </div>
    );
  };

  const UserFormStep2 = () => (
    <div className="space-y-4 max-h-[60vh] overflow-y-auto">
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="firstName">First Name</Label>
          <Input
            id="firstName"
            value={userFormData.firstName}
            onChange={(e) => setUserFormData({ ...userFormData, firstName: e.target.value })}
            placeholder="Enter first name"
          />
        </div>
        
        <div className="space-y-2">
          <Label htmlFor="lastName">Last Name</Label>
          <Input
            id="lastName"
            value={userFormData.lastName}
            onChange={(e) => setUserFormData({ ...userFormData, lastName: e.target.value })}
            placeholder="Enter last name"
          />
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="fullName">Full Name</Label>
        <Input
          id="fullName"
          value={userFormData.fullName}
          onChange={(e) => setUserFormData({ ...userFormData, fullName: e.target.value })}
          placeholder="Enter full name"
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="email">Email Address</Label>
          <Input
            id="email"
            type="email"
            value={userFormData.email}
            onChange={(e) => setUserFormData({ ...userFormData, email: e.target.value })}
            placeholder="Enter email address"
            disabled
          />
        </div>
        
        <div className="space-y-2">
          <Label htmlFor="phone">Phone Number</Label>
          <Input
            id="phone"
            value={userFormData.phone}
            onChange={(e) => setUserFormData({ ...userFormData, phone: e.target.value })}
            placeholder="Enter phone number"
          />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="dob">Date of Birth</Label>
          <Input
            id="dob"
            type="date"
            value={userFormData.dob}
            onChange={(e) => setUserFormData({ ...userFormData, dob: e.target.value })}
          />
        </div>
        
        <div className="space-y-2">
          <Label htmlFor="gender">Gender</Label>
          <Select 
            value={userFormData.gender} 
            onValueChange={(value) => setUserFormData({ ...userFormData, gender: value })}
          >
            <SelectTrigger>
              <SelectValue placeholder="Select gender" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="Male">Male</SelectItem>
              <SelectItem value="Female">Female</SelectItem>
              <SelectItem value="Other">Other</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="department">Department</Label>
          <Select 
            value={userFormData.departmentId || 'none'} 
            onValueChange={(value) => setUserFormData({ ...userFormData, departmentId: value === 'none' ? '' : value })}
          >
            <SelectTrigger>
              <SelectValue placeholder="Select department" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="none">No Department</SelectItem>
              {departments.map((dept) => (
                <SelectItem key={dept.id} value={dept.id}>
                  {dept.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        
        <div className="space-y-2">
          <Label htmlFor="role">Role</Label>
          <Select 
                    value={userFormData.role} 
                    onValueChange={(value: UserRole) => setUserFormData({ ...userFormData, role: value })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select role" />
                    </SelectTrigger>
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
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="position">Position</Label>
          <Input
            id="position"
            value={userFormData.position}
            onChange={(e) => setUserFormData({ ...userFormData, position: e.target.value })}
            placeholder="Enter position/job title"
          />
        </div>
        
        <div className="space-y-2">
          <Label htmlFor="employeeId">User ID (Optional)</Label>
          <Input
            id="employeeId"
            value={userFormData.employeeId}
            onChange={(e) => setUserFormData({ ...userFormData, employeeId: e.target.value })}
            placeholder="Enter user ID"
          />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="hireDate">Hire Date</Label>
          <Input
            id="hireDate"
            type="date"
            value={userFormData.hireDate}
            onChange={(e) => setUserFormData({ ...userFormData, hireDate: e.target.value })}
          />
        </div>
        
        <div className="space-y-2">
          <Label htmlFor="salary">Annual Salary</Label>
          <Input
            id="salary"
            type="number"
            value={userFormData.salary}
            onChange={(e) => setUserFormData({ ...userFormData, salary: e.target.value })}
            placeholder="Enter annual salary"
          />
        </div>
      </div>
    </div>
  );

  return (
    <div className="space-y-6 p-6 bg-gray-50/50 min-h-screen">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">All Users</h1>
          <p className="text-gray-600 mt-1">Complete user directory and management</p>
        </div>
        
        <div className="flex space-x-2">
          <Button variant="outline">
            <Download className="h-4 w-4 mr-2" />
            Export
          </Button>
          <Button variant="outline">
            <FileText className="h-4 w-4 mr-2" />
            Reports
          </Button>
          <Button onClick={() => {
            resetUserForm();
            setCreateStep(1);
            setSelectedZitadelUser(null);
            setIsAddUserOpen(true);
          }}>
            <UserPlus className="h-4 w-4 mr-2" />
            Add User
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Users</p>
                <p className="text-2xl font-bold text-gray-900">{users.length}</p>
              </div>
              <Users className="h-8 w-8 text-blue-600" />
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Active Users</p>
                <p className="text-2xl font-bold text-green-700">
                  {users.filter(user => user.isActive).length}
                </p>
              </div>
              <UserCheck className="h-8 w-8 text-green-600" />
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Departments</p>
                <p className="text-2xl font-bold text-purple-700">{departments.length}</p>
              </div>
              <Building2 className="h-8 w-8 text-purple-600" />
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Avg. Salary</p>
                <p className="text-2xl font-bold text-orange-700">
                  {users.length > 0 ? formatCurrency(users.reduce((sum, user) => sum + user.salary, 0) / users.length) : '$0'}
                </p>
              </div>
              <DollarSign className="h-8 w-8 text-orange-600" />
            </div>
          </CardContent>
        </Card>
      </div>
      
      {/* User Directory */}
      <Card>
        <CardHeader>
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
            <div className="border rounded-lg">
              <Table>
                <TableHeader>
                  <TableRow className="bg-gray-50">
                    <TableHead>User</TableHead>
                    <TableHead>Position</TableHead>
                    <TableHead>Role</TableHead>
                    <TableHead>Department</TableHead>
                    <TableHead>Hire Date</TableHead>
                    <TableHead>Salary</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredUsers.map((user) => {
                    const department = getDepartment(user.departmentId);
                    
                    return (
                      <TableRow key={user.id} className="hover:bg-gray-50">
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
                          <div className="flex items-center text-sm font-medium">
                            <DollarSign className="h-3 w-3 mr-1" />
                            {formatCurrency(user.salary)}
                          </div>
                        </TableCell>
                        
                        <TableCell>
                          <Badge variant="outline" className={getStatusBadgeColor(user.isActive)}>
                            {user.isActive ? 'Active' : 'Inactive'}
                          </Badge>
                        </TableCell>
                        
                        <TableCell className="text-right">
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="sm">
                                <MoreHorizontal className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuLabel>Actions</DropdownMenuLabel>
                              <DropdownMenuSeparator />
                              <DropdownMenuItem onClick={() => openUserDetail(user)}>
                                <Eye className="h-4 w-4 mr-2" />
                                View Details
                              </DropdownMenuItem>
                              <DropdownMenuItem onClick={() => openEditUserDialog(user)}>
                                <Edit className="h-4 w-4 mr-2" />
                                Edit User
                              </DropdownMenuItem>
                              <DropdownMenuSeparator />
                              <DropdownMenuItem 
                                onClick={() => handleDeleteUser(user.id)}
                                className="text-red-600"
                              >
                                <Trash2 className="h-4 w-4 mr-2" />
                                Deactivate User
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          )}
          
          {!isLoading && !error && filteredUsers.length === 0 && (
            <div className="text-center py-8">
              <Users className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-600">No users found matching your criteria</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* User Detail Dialog */}
      <Dialog open={isDetailOpen} onOpenChange={setIsDetailOpen}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>User Details</DialogTitle>
            <DialogDescription>
              Complete user information and records
            </DialogDescription>
          </DialogHeader>
          {selectedUser && <UserDetail user={selectedUser} />}
        </DialogContent>
      </Dialog>

      {/* Add User Dialog - Multi-Step */}
      <Dialog open={isAddUserOpen} onOpenChange={(open) => {
        setIsAddUserOpen(open);
        if (!open) {
          setCreateStep(1);
          setSelectedZitadelUser(null);
          resetUserForm();
        }
      }}>
        <DialogContent className="max-w-5xl max-h-[90vh] flex flex-col">
          <DialogHeader>
            <DialogTitle>Add New User - Step {createStep} of 3</DialogTitle>
            <DialogDescription>
              {createStep === 1 && 'Select a user from Zitadel'}
              {createStep === 2 && 'Enter user details and information'}
              {createStep === 3 && 'Configure user permissions'}
            </DialogDescription>
          </DialogHeader>

          {/* Step Indicators */}
          <div className="flex items-center justify-center space-x-2 mb-4">
            {[1, 2, 3].map((step) => (
              <div key={step} className="flex items-center">
                <div
                  className={`w-8 h-8 rounded-full flex items-center justify-center ${
                    step === createStep
                      ? 'bg-blue-600 text-white'
                      : step < createStep
                      ? 'bg-green-600 text-white'
                      : 'bg-gray-200 text-gray-600'
                  }`}
                >
                  {step < createStep ? <CheckCircle2 className="h-5 w-5" /> : step}
                </div>
                {step < 3 && <div className="w-12 h-0.5 bg-gray-300 mx-2" />}
              </div>
            ))}
          </div>

          {/* Step Content */}
          <div className="flex-1 overflow-y-auto min-h-[400px]">
            {createStep === 1 && (
              <ZitadelUserSelector
                onSelect={handleZitadelUserSelect}
                selectedUserId={selectedZitadelUser?.id}
              />
            )}

            {createStep === 2 && (
              <div className="max-h-[60vh] overflow-y-auto">
                <UserFormStep2 />
              </div>
            )}

            {createStep === 3 && (
              <div className="space-y-4">
                <PermissionsEditor
                  value={userFormData.permissions}
                  onChange={(permissions) =>
                    setUserFormData({ ...userFormData, permissions })
                  }
                />
              </div>
            )}
          </div>

          {/* Navigation Buttons */}
          <div className="flex justify-between pt-4 border-t">
            <Button
              variant="outline"
              onClick={handlePrevStep}
              disabled={createStep === 1}
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Previous
            </Button>

            <div className="flex space-x-2">
              <Button
                variant="outline"
                onClick={() => {
                  setIsAddUserOpen(false);
                  setCreateStep(1);
                  setSelectedZitadelUser(null);
                  resetUserForm();
                }}
              >
                Cancel
              </Button>

              {createStep < 3 ? (
                <Button onClick={handleNextStep}>
                  Next
                  <ArrowRight className="h-4 w-4 ml-2" />
                </Button>
              ) : (
                <Button
                  onClick={handleAddUser}
                  disabled={createUserMutation.isPending}
                >
                  {createUserMutation.isPending ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Creating...
                    </>
                  ) : (
                    <>
                      <Save className="h-4 w-4 mr-2" />
                      Create User
                    </>
                  )}
                </Button>
              )}
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Edit User Dialog */}
      <Dialog open={isEditUserOpen} onOpenChange={setIsEditUserOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Edit User</DialogTitle>
            <DialogDescription>
              Update user information and details.
            </DialogDescription>
          </DialogHeader>
          
          <Tabs defaultValue="details" className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="details">User Details</TabsTrigger>
              <TabsTrigger value="permissions">Permissions</TabsTrigger>
            </TabsList>

            <TabsContent value="details" className="max-h-[50vh] overflow-y-auto">
              <UserFormStep2 />
            </TabsContent>

            <TabsContent value="permissions">
              <PermissionsEditor
                value={userFormData.permissions}
                onChange={(permissions) =>
                  setUserFormData({ ...userFormData, permissions })
                }
              />
            </TabsContent>
          </Tabs>

          <div className="flex justify-end space-x-2 pt-4 border-t">
            <Button
              variant="outline"
              onClick={() => {
                setIsEditUserOpen(false);
                setSelectedUser(null);
                resetUserForm();
              }}
            >
              Cancel
            </Button>
            <Button
              onClick={handleEditUser}
              disabled={updateUserMutation.isPending}
            >
              {updateUserMutation.isPending ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Updating...
                </>
              ) : (
                <>
                  <Save className="h-4 w-4 mr-2" />
                  Update User
                </>
              )}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

