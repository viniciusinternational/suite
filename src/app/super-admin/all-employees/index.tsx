'use client';

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Avatar } from '@/components/ui/avatar';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
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
  DialogTrigger,
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
  UserX,
  Download,
  FileText,
  Plus,
  Edit,
  Trash2,
  UserPlus,
  Save
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
import type { Employee, Department } from '@/types';
import { mockEmployees, mockDepartments } from '../mockdata';

const AllEmployees = () => {
  const employees = mockEmployees;
  const departments = mockDepartments;
  const [searchTerm, setSearchTerm] = useState('');
  const [departmentFilter, setDepartmentFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [positionFilter, setPositionFilter] = useState<string>('all');
  const [selectedEmployee, setSelectedEmployee] = useState<Employee | null>(null);
  const [isDetailOpen, setIsDetailOpen] = useState(false);
  const [isAddEmployeeOpen, setIsAddEmployeeOpen] = useState(false);
  const [isEditEmployeeOpen, setIsEditEmployeeOpen] = useState(false);

  // Form state for new/edit employee
  const [employeeFormData, setEmployeeFormData] = useState({
    employeeNumber: '',
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    departmentId: 'none',
    unitId: 'none',
    position: '',
    hireDate: '',
    salary: '',
    status: 'active' as 'active' | 'inactive' | 'terminated',
    managerId: 'none'
  });

  const filteredEmployees = employees.filter(employee => {
    const user = undefined;
    const matchesSearch = employee.firstName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         employee.lastName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         employee.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         employee.employeeNumber.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesDepartment = departmentFilter === 'all' || employee.departmentId === departmentFilter;
    const matchesStatus = statusFilter === 'all' || employee.status === statusFilter;
    const matchesPosition = positionFilter === 'all' || employee.position.toLowerCase().includes(positionFilter.toLowerCase());
    
    return matchesSearch && matchesDepartment && matchesStatus && matchesPosition;
  });

  const getStatusBadgeColor = (status: string) => {
    const colors = {
      active: 'bg-green-100 text-green-800 border-green-200',
      inactive: 'bg-yellow-100 text-yellow-800 border-yellow-200',
      terminated: 'bg-red-100 text-red-800 border-red-200'
    };
    return colors[status as keyof typeof colors] || 'bg-gray-100 text-gray-800 border-gray-200';
  };

  const getDepartment = (departmentId: string) => {
    return departments.find(dept => dept.id === departmentId);
  };

  const getUser = (_userId: string) => undefined;

  const getManager = (managerId?: string) => {
    if (!managerId) return null;
    return mockEmployees.find(emp => emp.id === managerId);
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

  const openEmployeeDetail = (employee: Employee) => {
    setSelectedEmployee(employee);
    setIsDetailOpen(true);
  };

  const handleAddEmployee = () => {
    const newEmployee: Employee = {
      id: `emp_${Date.now()}`,
      userId: `user_${Date.now()}`, // In real app, this would create a corresponding user
      employeeNumber: employeeFormData.employeeNumber,
      firstName: employeeFormData.firstName,
      lastName: employeeFormData.lastName,
      email: employeeFormData.email,
      phone: employeeFormData.phone || undefined,
      departmentId: employeeFormData.departmentId === 'none' ? '' : employeeFormData.departmentId,
      unitId: employeeFormData.unitId === 'none' ? undefined : employeeFormData.unitId,
      position: employeeFormData.position,
      hireDate: employeeFormData.hireDate,
      salary: parseFloat(employeeFormData.salary),
      status: employeeFormData.status,
      managerId: employeeFormData.managerId === 'none' ? undefined : employeeFormData.managerId,
      avatar: '/avatars/default.jpg'
    };
    
    setEmployees([...employees, newEmployee]);
    resetEmployeeForm();
    setIsAddEmployeeOpen(false);
  };

  const handleEditEmployee = () => {
    if (!selectedEmployee) return;
    
    const updatedEmployees = employees.map(emp => 
      emp.id === selectedEmployee.id 
        ? { 
            ...emp,
            employeeNumber: employeeFormData.employeeNumber,
            firstName: employeeFormData.firstName,
            lastName: employeeFormData.lastName,
            email: employeeFormData.email,
            phone: employeeFormData.phone || undefined,
            departmentId: employeeFormData.departmentId === 'none' ? '' : employeeFormData.departmentId,
            unitId: employeeFormData.unitId === 'none' ? undefined : employeeFormData.unitId,
            position: employeeFormData.position,
            hireDate: employeeFormData.hireDate,
            salary: parseFloat(employeeFormData.salary),
            status: employeeFormData.status,
            managerId: employeeFormData.managerId === 'none' ? undefined : employeeFormData.managerId
          }
        : emp
    );
    
    setEmployees(updatedEmployees);
    setIsEditEmployeeOpen(false);
    setSelectedEmployee(null);
    resetEmployeeForm();
  };

  const handleDeleteEmployee = (employeeId: string) => {
    setEmployees(employees.filter(emp => emp.id !== employeeId));
  };

  const openEditEmployeeDialog = (employee: Employee) => {
    setSelectedEmployee(employee);
    setEmployeeFormData({
      employeeNumber: employee.employeeNumber,
      firstName: employee.firstName,
      lastName: employee.lastName,
      email: employee.email,
      phone: employee.phone || '',
      departmentId: employee.departmentId || 'none',
      unitId: employee.unitId || 'none',
      position: employee.position,
      hireDate: employee.hireDate,
      salary: employee.salary.toString(),
      status: employee.status,
      managerId: employee.managerId || 'none'
    });
    setIsEditEmployeeOpen(true);
  };

  const resetEmployeeForm = () => {
    setEmployeeFormData({
      employeeNumber: '',
      firstName: '',
      lastName: '',
      email: '',
      phone: '',
      departmentId: 'none',
      unitId: 'none',
      position: '',
      hireDate: '',
      salary: '',
      status: 'active',
      managerId: 'none'
    });
  };

  const getAvailableUnits = (departmentId: string) => {
    const department = mockDepartments.find(dept => dept.id === departmentId);
    return department ? department.units : [];
  };

  const getAvailableManagers = () => {
    return employees.filter(emp => 
      emp.position.toLowerCase().includes('manager') || 
      emp.position.toLowerCase().includes('head') ||
      emp.position.toLowerCase().includes('supervisor')
    );
  };

  const uniquePositions = [...new Set(employees.map(emp => emp.position))];

  const EmployeeDetail = ({ employee }: { employee: Employee }) => {
    const user = getUser(employee.userId);
    const department = getDepartment(employee.departmentId);
    const manager = getManager(employee.managerId);
    const yearsOfService = calculateYearsOfService(employee.hireDate);

    return (
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center space-x-4">
          <Avatar className="h-16 w-16 bg-gray-200 flex items-center justify-center">
            <Users className="h-8 w-8 text-gray-600" />
          </Avatar>
          <div>
            <h3 className="text-xl font-bold">{employee.firstName} {employee.lastName}</h3>
            <p className="text-gray-600">{employee.position}</p>
            <Badge variant="outline" className={getStatusBadgeColor(employee.status)}>
              {employee.status.charAt(0).toUpperCase() + employee.status.slice(1)}
            </Badge>
          </div>
        </div>

        <Tabs defaultValue="personal" className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="personal">Personal Info</TabsTrigger>
            <TabsTrigger value="employment">Employment</TabsTrigger>
            <TabsTrigger value="contact">Contact & Manager</TabsTrigger>
          </TabsList>
          
          <TabsContent value="personal" className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <LabelDiv className="text-sm font-medium text-gray-600">Employee Number</LabelDiv>
                <p className="text-sm">{employee.employeeNumber}</p>
              </div>
              <div>
                <LabelDiv className="text-sm font-medium text-gray-600">Full Name</LabelDiv>
                <p className="text-sm">{employee.firstName} {employee.lastName}</p>
              </div>
              <div>
                <LabelDiv className="text-sm font-medium text-gray-600">Email</LabelDiv>
                <p className="text-sm flex items-center">
                  <Mail className="h-3 w-3 mr-1" />
                  {employee.email}
                </p>
              </div>
              <div>
                <LabelDiv className="text-sm font-medium text-gray-600">Phone</LabelDiv>
                <p className="text-sm flex items-center">
                  <Phone className="h-3 w-3 mr-1" />
                  {employee.phone || 'Not provided'}
                </p>
              </div>
            </div>
          </TabsContent>
          
          <TabsContent value="employment" className="space-y-4">
                         <div className="grid grid-cols-2 gap-4">
               <div>
                 <LabelDiv className="text-sm font-medium text-gray-600">Department</LabelDiv>
                 <p className="text-sm flex items-center">
                   <Building2 className="h-3 w-3 mr-1" />
                   {department?.name || 'No Department'}
                 </p>
               </div>
               <div>
                 <LabelDiv className="text-sm font-medium text-gray-600">Position</LabelDiv>
                 <p className="text-sm">{employee.position}</p>
               </div>
               <div>
                 <LabelDiv className="text-sm font-medium text-gray-600">Hire Date</LabelDiv>
                 <p className="text-sm flex items-center">
                   <Calendar className="h-3 w-3 mr-1" />
                   {formatDate(employee.hireDate)}
                 </p>
               </div>
               <div>
                 <LabelDiv className="text-sm font-medium text-gray-600">Years of Service</LabelDiv>
                 <p className="text-sm">{yearsOfService} year{yearsOfService !== 1 ? 's' : ''}</p>
               </div>
               <div>
                 <LabelDiv className="text-sm font-medium text-gray-600">Salary</LabelDiv>
                 <p className="text-sm flex items-center">
                   <DollarSign className="h-3 w-3 mr-1" />
                   {formatCurrency(employee.salary)}
                 </p>
               </div>
               <div>
                 <LabelDiv className="text-sm font-medium text-gray-600">Status</LabelDiv>
                 <Badge variant="outline" className={getStatusBadgeColor(employee.status)}>
                   {employee.status.charAt(0).toUpperCase() + employee.status.slice(1)}
                 </Badge>
               </div>
             </div>
          </TabsContent>
          
          <TabsContent value="contact" className="space-y-4">
                         <div className="grid grid-cols-1 gap-4">
               <div>
                 <LabelDiv className="text-sm font-medium text-gray-600">Direct Manager</LabelDiv>
                 {manager ? (
                   <p className="text-sm">{manager.firstName} {manager.lastName} - {manager.position}</p>
                 ) : (
                   <p className="text-sm text-gray-500">No direct manager assigned</p>
                 )}
               </div>
               <div>
                 <LabelDiv className="text-sm font-medium text-gray-600">User Account Role</LabelDiv>
                 <p className="text-sm">{user?.role.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase()) || 'No user account'}</p>
               </div>
               <div>
                 <LabelDiv className="text-sm font-medium text-gray-600">Account Status</LabelDiv>
                 <Badge variant={user?.isActive ? "default" : "secondary"}>
                   {user?.isActive ? 'Active' : 'Inactive'}
                 </Badge>
               </div>
             </div>
          </TabsContent>
        </Tabs>
      </div>
    );
  };

  const LabelDiv = ({ className, children }: { className?: string; children: React.ReactNode }) => (
    <div className={className}>{children}</div>
  );

  const EmployeeForm = ({ isEdit = false }: { isEdit?: boolean }) => (
    <div className="space-y-4 max-h-[70vh] overflow-y-auto">
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="employeeNumber">Employee Number</Label>
          <Input
            id="employeeNumber"
            value={employeeFormData.employeeNumber}
            onChange={(e) => setEmployeeFormData({ ...employeeFormData, employeeNumber: e.target.value })}
            placeholder="Enter employee number"
          />
        </div>
        
        <div className="space-y-2">
          <Label htmlFor="status">Status</Label>
          <Select 
            value={employeeFormData.status} 
            onValueChange={(value: 'active' | 'inactive' | 'terminated') => 
              setEmployeeFormData({ ...employeeFormData, status: value })
            }
          >
            <SelectTrigger>
              <SelectValue placeholder="Select status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="active">Active</SelectItem>
              <SelectItem value="inactive">Inactive</SelectItem>
              <SelectItem value="terminated">Terminated</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="firstName">First Name</Label>
          <Input
            id="firstName"
            value={employeeFormData.firstName}
            onChange={(e) => setEmployeeFormData({ ...employeeFormData, firstName: e.target.value })}
            placeholder="Enter first name"
          />
        </div>
        
        <div className="space-y-2">
          <Label htmlFor="lastName">Last Name</Label>
          <Input
            id="lastName"
            value={employeeFormData.lastName}
            onChange={(e) => setEmployeeFormData({ ...employeeFormData, lastName: e.target.value })}
            placeholder="Enter last name"
          />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="email">Email Address</Label>
          <Input
            id="email"
            type="email"
            value={employeeFormData.email}
            onChange={(e) => setEmployeeFormData({ ...employeeFormData, email: e.target.value })}
            placeholder="Enter email address"
          />
        </div>
        
        <div className="space-y-2">
          <Label htmlFor="phone">Phone Number</Label>
          <Input
            id="phone"
            value={employeeFormData.phone}
            onChange={(e) => setEmployeeFormData({ ...employeeFormData, phone: e.target.value })}
            placeholder="Enter phone number"
          />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="department">Department</Label>
          <Select 
            value={employeeFormData.departmentId} 
            onValueChange={(value) => {
              setEmployeeFormData({ 
                ...employeeFormData, 
                departmentId: value,
                unitId: 'none' // Reset unit when department changes
              });
            }}
          >
            <SelectTrigger>
              <SelectValue placeholder="Select department" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="none">No Department</SelectItem>
              {mockDepartments.map((dept) => (
                <SelectItem key={dept.id} value={dept.id}>
                  {dept.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        
        <div className="space-y-2">
          <Label htmlFor="unit">Unit</Label>
          <Select 
            value={employeeFormData.unitId} 
            onValueChange={(value) => setEmployeeFormData({ ...employeeFormData, unitId: value })}
            disabled={employeeFormData.departmentId === 'none'}
          >
            <SelectTrigger>
              <SelectValue placeholder="Select unit" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="none">No Unit</SelectItem>
              {getAvailableUnits(employeeFormData.departmentId).map((unit) => (
                <SelectItem key={unit.id} value={unit.id}>
                  {unit.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="position">Position</Label>
          <Input
            id="position"
            value={employeeFormData.position}
            onChange={(e) => setEmployeeFormData({ ...employeeFormData, position: e.target.value })}
            placeholder="Enter position/job title"
          />
        </div>
        
        <div className="space-y-2">
          <Label htmlFor="manager">Manager</Label>
          <Select 
            value={employeeFormData.managerId} 
            onValueChange={(value) => setEmployeeFormData({ ...employeeFormData, managerId: value })}
          >
            <SelectTrigger>
              <SelectValue placeholder="Select manager" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="none">No Manager</SelectItem>
              {getAvailableManagers().map((manager) => (
                <SelectItem key={manager.id} value={manager.id}>
                  {manager.firstName} {manager.lastName} - {manager.position}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="hireDate">Hire Date</Label>
          <Input
            id="hireDate"
            type="date"
            value={employeeFormData.hireDate}
            onChange={(e) => setEmployeeFormData({ ...employeeFormData, hireDate: e.target.value })}
          />
        </div>
        
        <div className="space-y-2">
          <Label htmlFor="salary">Annual Salary</Label>
          <Input
            id="salary"
            type="number"
            value={employeeFormData.salary}
            onChange={(e) => setEmployeeFormData({ ...employeeFormData, salary: e.target.value })}
            placeholder="Enter annual salary"
          />
        </div>
      </div>
      
      <div className="flex justify-end space-x-2 pt-4 border-t">
        <Button
          variant="outline"
          onClick={() => {
            if (isEdit) {
              setIsEditEmployeeOpen(false);
              setSelectedEmployee(null);
            } else {
              setIsAddEmployeeOpen(false);
            }
            resetEmployeeForm();
          }}
        >
          Cancel
        </Button>
        <Button onClick={isEdit ? handleEditEmployee : handleAddEmployee}>
          <Save className="h-4 w-4 mr-2" />
          {isEdit ? 'Update Employee' : 'Add Employee'}
        </Button>
      </div>
    </div>
  );

  return (
    <div className="space-y-6 p-6 bg-gray-50/50 min-h-screen">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">All Employees</h1>
          <p className="text-gray-600 mt-1">Complete employee directory and management</p>
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
            resetEmployeeForm();
            setIsAddEmployeeOpen(true);
          }}>
            <UserPlus className="h-4 w-4 mr-2" />
            Add Employee
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                 <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Employees</p>
                <p className="text-2xl font-bold text-gray-900">{employees.length}</p>
              </div>
              <Users className="h-8 w-8 text-blue-600" />
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Active Employees</p>
                <p className="text-2xl font-bold text-green-700">
                  {employees.filter(emp => emp.status === 'active').length}
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
                <p className="text-2xl font-bold text-purple-700">{mockDepartments.length}</p>
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
                  {formatCurrency(employees.reduce((sum, emp) => sum + emp.salary, 0) / employees.length)}
                </p>
              </div>
              <DollarSign className="h-8 w-8 text-orange-600" />
            </div>
          </CardContent>
        </Card>
      </div>
      
      {/* Employee Directory */}
      <Card>
        <CardHeader>
          <CardTitle>Employee Directory</CardTitle>
          <CardDescription>Search and manage all employee records</CardDescription>
        </CardHeader>
        <CardContent>
          {/* Filters */}
          <div className="flex flex-col md:flex-row gap-4 mb-6">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                <Input
                  placeholder="Search employees by name, email, or employee number..."
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
                {mockDepartments.map((dept) => (
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
                <SelectItem value="terminated">Terminated</SelectItem>
              </SelectContent>
            </Select>
            
            <Select value={positionFilter} onValueChange={setPositionFilter}>
              <SelectTrigger className="w-48">
                <SelectValue placeholder="Filter by position" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Positions</SelectItem>
                {uniquePositions.map((position) => (
                  <SelectItem key={position} value={position}>
                    {position}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Employees Table */}
          <div className="border rounded-lg">
            <Table>
              <TableHeader>
                <TableRow className="bg-gray-50">
                  <TableHead>Employee</TableHead>
                  <TableHead>Position</TableHead>
                  <TableHead>Department</TableHead>
                  <TableHead>Hire Date</TableHead>
                  <TableHead>Salary</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredEmployees.map((employee) => {
                  const department = getDepartment(employee.departmentId);
                  const user = getUser(employee.userId);
                  
                  return (
                    <TableRow key={employee.id} className="hover:bg-gray-50">
                      <TableCell>
                        <div className="flex items-center space-x-3">
                          <Avatar className="h-8 w-8 bg-gray-200 flex items-center justify-center">
                            <Users className="h-4 w-4 text-gray-600" />
                          </Avatar>
                          <div>
                            <p className="font-medium text-gray-900">
                              {employee.firstName} {employee.lastName}
                            </p>
                            <p className="text-sm text-gray-600 flex items-center">
                              <Mail className="h-3 w-3 mr-1" />
                              {employee.email}
                            </p>
                            <p className="text-xs text-gray-500">
                              #{employee.employeeNumber}
                            </p>
                          </div>
                        </div>
                      </TableCell>
                      
                      <TableCell>
                        <span className="text-sm font-medium">{employee.position}</span>
                      </TableCell>
                      
                      <TableCell>
                        <span className="text-sm text-gray-900">
                          {department ? department.name : 'No Department'}
                        </span>
                      </TableCell>
                      
                      <TableCell>
                        <div className="flex items-center text-sm text-gray-600">
                          <Calendar className="h-3 w-3 mr-1" />
                          {new Date(employee.hireDate).toLocaleDateString()}
                        </div>
                      </TableCell>
                      
                      <TableCell>
                        <div className="flex items-center text-sm font-medium">
                          <DollarSign className="h-3 w-3 mr-1" />
                          {formatCurrency(employee.salary)}
                        </div>
                      </TableCell>
                      
                      <TableCell>
                        <Badge variant="outline" className={getStatusBadgeColor(employee.status)}>
                          {employee.status.charAt(0).toUpperCase() + employee.status.slice(1)}
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
                            <DropdownMenuItem onClick={() => openEmployeeDetail(employee)}>
                              <Eye className="h-4 w-4 mr-2" />
                              View Details
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => openEditEmployeeDialog(employee)}>
                              <Edit className="h-4 w-4 mr-2" />
                              Edit Employee
                            </DropdownMenuItem>
                            <DropdownMenuItem>
                              <Mail className="h-4 w-4 mr-2" />
                              Send Email
                            </DropdownMenuItem>
                            <DropdownMenuItem>
                              <FileText className="h-4 w-4 mr-2" />
                              Generate Report
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem 
                              onClick={() => handleDeleteEmployee(employee.id)}
                              className="text-red-600"
                            >
                              <Trash2 className="h-4 w-4 mr-2" />
                              Delete Employee
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
          
          {filteredEmployees.length === 0 && (
            <div className="text-center py-8">
              <Users className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-600">No employees found matching your criteria</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Employee Detail Dialog */}
      <Dialog open={isDetailOpen} onOpenChange={setIsDetailOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Employee Details</DialogTitle>
            <DialogDescription>
              Complete employee information and records
            </DialogDescription>
          </DialogHeader>
          {selectedEmployee && <EmployeeDetail employee={selectedEmployee} />}
        </DialogContent>
      </Dialog>

      {/* Add Employee Dialog */}
      <Dialog open={isAddEmployeeOpen} onOpenChange={setIsAddEmployeeOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Add New Employee</DialogTitle>
            <DialogDescription>
              Create a new employee record with complete information.
            </DialogDescription>
          </DialogHeader>
          <EmployeeForm />
        </DialogContent>
      </Dialog>

      {/* Edit Employee Dialog */}
      <Dialog open={isEditEmployeeOpen} onOpenChange={setIsEditEmployeeOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Edit Employee</DialogTitle>
            <DialogDescription>
              Update employee information and details.
            </DialogDescription>
          </DialogHeader>
          <EmployeeForm isEdit={true} />
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AllEmployees; 