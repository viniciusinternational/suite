'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
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
  DialogHeader, 
  DialogTitle, 
  DialogTrigger 
} from '@/components/ui/dialog';
import { 
  Search, 
  Filter, 
  Plus, 
  Edit, 
  Trash2, 
  Eye, 
  Download,
  Mail,
  Phone,
  Calendar,
  User,
  Building,
  Save,
  X
} from 'lucide-react';
import type { Employee, Department } from '@/types';

interface EmployeeWithDepartment extends Employee {
  departmentName?: string;
  managerName?: string;
}

interface AddEmployeeForm {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  departmentId: string;
  unitId: string;
  position: string;
  hireDate: string;
  salary: number;
  managerId: string;
  status: 'active' | 'inactive' | 'terminated';
}

const EmployeeDirectory = () => {
  const [employees, setEmployees] = useState<EmployeeWithDepartment[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [departmentFilter, setDepartmentFilter] = useState<string>('all');
  const [selectedEmployee, setSelectedEmployee] = useState<EmployeeWithDepartment | null>(null);
  const [isViewDialogOpen, setIsViewDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [addEmployeeForm, setAddEmployeeForm] = useState<AddEmployeeForm>({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    departmentId: '',
    unitId: '',
    position: '',
    hireDate: '',
    salary: 0,
    managerId: '',
    status: 'active',
  });

  useEffect(() => {
    // Mock data - in real app, fetch from API
    setEmployees([
      {
        id: 'emp1',
        userId: 'user1',
        employeeNumber: 'EMP001',
        firstName: 'John',
        lastName: 'Doe',
        email: 'john.doe@company.com',
        phone: '+1234567890',
        departmentId: 'dept1',
        unitId: 'unit1',
        position: 'Senior Engineer',
        hireDate: '2023-01-15',
        salary: 8500,
        status: 'active',
        managerId: 'mgr1',
        departmentName: 'Engineering',
        managerName: 'Sarah Johnson',
      },
      {
        id: 'emp2',
        userId: 'user2',
        employeeNumber: 'EMP002',
        firstName: 'Jane',
        lastName: 'Smith',
        email: 'jane.smith@company.com',
        phone: '+1234567891',
        departmentId: 'dept2',
        unitId: 'unit2',
        position: 'Project Manager',
        hireDate: '2023-03-20',
        salary: 9500,
        status: 'active',
        managerId: 'mgr2',
        departmentName: 'Project Management',
        managerName: 'Mike Wilson',
      },
      {
        id: 'emp3',
        userId: 'user3',
        employeeNumber: 'EMP003',
        firstName: 'Robert',
        lastName: 'Brown',
        email: 'robert.brown@company.com',
        phone: '+1234567892',
        departmentId: 'dept3',
        unitId: 'unit3',
        position: 'HR Specialist',
        hireDate: '2022-11-10',
        salary: 6500,
        status: 'active',
        managerId: 'mgr3',
        departmentName: 'Human Resources',
        managerName: 'Lisa Chen',
      },
      {
        id: 'emp4',
        userId: 'user4',
        employeeNumber: 'EMP004',
        firstName: 'Emily',
        lastName: 'Davis',
        email: 'emily.davis@company.com',
        phone: '+1234567893',
        departmentId: 'dept1',
        unitId: 'unit1',
        position: 'Junior Developer',
        hireDate: '2023-06-01',
        salary: 5500,
        status: 'active',
        managerId: 'mgr1',
        departmentName: 'Engineering',
        managerName: 'Sarah Johnson',
      },
      {
        id: 'emp5',
        userId: 'user5',
        employeeNumber: 'EMP005',
        firstName: 'David',
        lastName: 'Wilson',
        email: 'david.wilson@company.com',
        phone: '+1234567894',
        departmentId: 'dept4',
        unitId: 'unit4',
        position: 'Accountant',
        hireDate: '2022-08-15',
        salary: 7000,
        status: 'inactive',
        managerId: 'mgr4',
        departmentName: 'Finance',
        managerName: 'Tom Anderson',
      },
    ]);

    setDepartments([
      { id: 'dept1', name: 'Engineering', code: 'ENG', sector: 'engineering', units: [], isActive: true },
      { id: 'dept2', name: 'Project Management', code: 'PM', sector: 'construction', units: [], isActive: true },
      { id: 'dept3', name: 'Human Resources', code: 'HR', sector: 'administration', units: [], isActive: true },
      { id: 'dept4', name: 'Finance', code: 'FIN', sector: 'administration', units: [], isActive: true },
    ]);
  }, []);

  const filteredEmployees = employees.filter(employee => {
    const matchesSearch = 
      employee.firstName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      employee.lastName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      employee.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      employee.employeeNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
      employee.position.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = statusFilter === 'all' || employee.status === statusFilter;
    const matchesDepartment = departmentFilter === 'all' || employee.departmentId === departmentFilter;
    
    return matchesSearch && matchesStatus && matchesDepartment;
  });

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'bg-green-100 text-green-800';
      case 'inactive': return 'bg-gray-100 text-gray-800';
      case 'terminated': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString();
  };

  const formatSalary = (salary: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(salary);
  };

  const handleViewEmployee = (employee: EmployeeWithDepartment) => {
    setSelectedEmployee(employee);
    setIsViewDialogOpen(true);
  };

  const handleEditEmployee = (employee: EmployeeWithDepartment) => {
    setSelectedEmployee(employee);
    setIsEditDialogOpen(true);
  };

  const handleAddEmployee = () => {
    setIsAddDialogOpen(true);
  };

  const handleAddEmployeeSubmit = () => {
    // Generate new employee ID and number
    const newId = `emp${employees.length + 1}`;
    const newEmployeeNumber = `EMP${String(employees.length + 1).padStart(3, '0')}`;
    
    const newEmployee: EmployeeWithDepartment = {
      id: newId,
      userId: `user${employees.length + 1}`,
      employeeNumber: newEmployeeNumber,
      firstName: addEmployeeForm.firstName,
      lastName: addEmployeeForm.lastName,
      email: addEmployeeForm.email,
      phone: addEmployeeForm.phone,
      departmentId: addEmployeeForm.departmentId,
      unitId: addEmployeeForm.unitId,
      position: addEmployeeForm.position,
      hireDate: addEmployeeForm.hireDate,
      salary: addEmployeeForm.salary,
      status: addEmployeeForm.status,
      managerId: addEmployeeForm.managerId,
      departmentName: departments.find(d => d.id === addEmployeeForm.departmentId)?.name,
      managerName: 'To be assigned', // In real app, fetch manager name
    };

    setEmployees([...employees, newEmployee]);
    
    // Reset form
    setAddEmployeeForm({
      firstName: '',
      lastName: '',
      email: '',
      phone: '',
      departmentId: '',
      unitId: '',
      position: '',
      hireDate: '',
      salary: 0,
      managerId: '',
      status: 'active',
    });
    
    setIsAddDialogOpen(false);
  };

  const resetAddEmployeeForm = () => {
    setAddEmployeeForm({
      firstName: '',
      lastName: '',
      email: '',
      phone: '',
      departmentId: '',
      unitId: '',
      position: '',
      hireDate: '',
      salary: 0,
      managerId: '',
      status: 'active',
    });
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">Employee Directory</h1>
        <div className="flex gap-2">
          <Button variant="outline" size="sm">
            <Download className="w-4 h-4 mr-2" />
            Export
          </Button>
          <Button onClick={handleAddEmployee}>
            <Plus className="w-4 h-4 mr-2" />
            Add Employee
          </Button>
        </div>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Filter className="h-5 w-5" />
            Filters
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
              <Input
                placeholder="Search employees..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger>
                <SelectValue placeholder="Filter by status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="active">Active</SelectItem>
                <SelectItem value="inactive">Inactive</SelectItem>
                <SelectItem value="terminated">Terminated</SelectItem>
              </SelectContent>
            </Select>

            <Select value={departmentFilter} onValueChange={setDepartmentFilter}>
              <SelectTrigger>
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

            <Button variant="outline" onClick={() => {
              setSearchTerm('');
              setStatusFilter('all');
              setDepartmentFilter('all');
            }}>
              Clear Filters
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Employee Table */}
      <Card>
        <CardHeader>
          <CardTitle>
            Employees ({filteredEmployees.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Employee</TableHead>
                <TableHead>Position</TableHead>
                <TableHead>Department</TableHead>
                <TableHead>Manager</TableHead>
                <TableHead>Hire Date</TableHead>
                <TableHead>Salary</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredEmployees.map((employee) => (
                <TableRow key={employee.id}>
                  <TableCell>
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 bg-gray-200 rounded-full flex items-center justify-center">
                        {employee.firstName[0]}{employee.lastName[0]}
                      </div>
                      <div>
                        <div className="font-medium">
                          {employee.firstName} {employee.lastName}
                        </div>
                        <div className="text-sm text-muted-foreground">
                          {employee.employeeNumber}
                        </div>
                        <div className="text-sm text-muted-foreground">
                          {employee.email}
                        </div>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="font-medium">{employee.position}</div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <Building className="h-4 w-4 text-muted-foreground" />
                      {employee.departmentName}
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="text-sm">{employee.managerName}</div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <Calendar className="h-4 w-4 text-muted-foreground" />
                      {formatDate(employee.hireDate)}
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="font-medium">
                      {formatSalary(employee.salary)}
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge className={getStatusColor(employee.status)}>
                      {employee.status}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <div className="flex gap-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleViewEmployee(employee)}
                      >
                        <Eye className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleEditEmployee(employee)}
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="text-red-600 hover:text-red-700"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* View Employee Dialog */}
      <Dialog open={isViewDialogOpen} onOpenChange={setIsViewDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Employee Details</DialogTitle>
          </DialogHeader>
          {selectedEmployee && (
            <div className="space-y-6">
              <div className="flex items-center gap-4">
                <div className="w-16 h-16 bg-gray-200 rounded-full flex items-center justify-center text-xl font-bold">
                  {selectedEmployee.firstName[0]}{selectedEmployee.lastName[0]}
                </div>
                <div>
                  <h3 className="text-xl font-bold">
                    {selectedEmployee.firstName} {selectedEmployee.lastName}
                  </h3>
                  <p className="text-muted-foreground">{selectedEmployee.position}</p>
                  <p className="text-sm text-muted-foreground">{selectedEmployee.employeeNumber}</p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium">Email</label>
                  <div className="flex items-center gap-2">
                    <Mail className="h-4 w-4 text-muted-foreground" />
                    <span>{selectedEmployee.email}</span>
                  </div>
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Phone</label>
                  <div className="flex items-center gap-2">
                    <Phone className="h-4 w-4 text-muted-foreground" />
                    <span>{selectedEmployee.phone}</span>
                  </div>
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Department</label>
                  <div className="flex items-center gap-2">
                    <Building className="h-4 w-4 text-muted-foreground" />
                    <span>{selectedEmployee.departmentName}</span>
                  </div>
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Manager</label>
                  <div className="flex items-center gap-2">
                    <User className="h-4 w-4 text-muted-foreground" />
                    <span>{selectedEmployee.managerName}</span>
                  </div>
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Hire Date</label>
                  <div className="flex items-center gap-2">
                    <Calendar className="h-4 w-4 text-muted-foreground" />
                    <span>{formatDate(selectedEmployee.hireDate)}</span>
                  </div>
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Salary</label>
                  <span className="font-medium">{formatSalary(selectedEmployee.salary)}</span>
                </div>
              </div>

              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={() => setIsViewDialogOpen(false)}>
                  Close
                </Button>
                <Button onClick={() => {
                  setIsViewDialogOpen(false);
                  handleEditEmployee(selectedEmployee);
                }}>
                  Edit Employee
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Edit Employee Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Edit Employee</DialogTitle>
          </DialogHeader>
          {selectedEmployee && (
            <div className="space-y-4">
              <p className="text-muted-foreground">
                Edit form for {selectedEmployee.firstName} {selectedEmployee.lastName}
              </p>
              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={() => setIsEditDialogOpen(false)}>
                  Cancel
                </Button>
                <Button onClick={() => setIsEditDialogOpen(false)}>
                  Save Changes
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Add Employee Dialog */}
      <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <User className="h-5 w-5" />
              Add New Employee
            </DialogTitle>
          </DialogHeader>
          
          <div className="space-y-6">
            {/* Personal Information */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold">Personal Information</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="firstName">First Name *</Label>
                  <Input
                    id="firstName"
                    value={addEmployeeForm.firstName}
                    onChange={(e) => setAddEmployeeForm({...addEmployeeForm, firstName: e.target.value})}
                    placeholder="Enter first name"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="lastName">Last Name *</Label>
                  <Input
                    id="lastName"
                    value={addEmployeeForm.lastName}
                    onChange={(e) => setAddEmployeeForm({...addEmployeeForm, lastName: e.target.value})}
                    placeholder="Enter last name"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="email">Email Address *</Label>
                  <Input
                    id="email"
                    type="email"
                    value={addEmployeeForm.email}
                    onChange={(e) => setAddEmployeeForm({...addEmployeeForm, email: e.target.value})}
                    placeholder="Enter email address"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="phone">Phone Number</Label>
                  <Input
                    id="phone"
                    value={addEmployeeForm.phone}
                    onChange={(e) => setAddEmployeeForm({...addEmployeeForm, phone: e.target.value})}
                    placeholder="Enter phone number"
                  />
                </div>
              </div>
            </div>

            {/* Employment Information */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold">Employment Information</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="department">Department *</Label>
                  <Select 
                    value={addEmployeeForm.departmentId} 
                    onValueChange={(value) => setAddEmployeeForm({...addEmployeeForm, departmentId: value})}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select department" />
                    </SelectTrigger>
                    <SelectContent>
                      {departments.map((dept) => (
                        <SelectItem key={dept.id} value={dept.id}>
                          {dept.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="position">Position *</Label>
                  <Input
                    id="position"
                    value={addEmployeeForm.position}
                    onChange={(e) => setAddEmployeeForm({...addEmployeeForm, position: e.target.value})}
                    placeholder="Enter position title"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="hireDate">Hire Date *</Label>
                  <Input
                    id="hireDate"
                    type="date"
                    value={addEmployeeForm.hireDate}
                    onChange={(e) => setAddEmployeeForm({...addEmployeeForm, hireDate: e.target.value})}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="salary">Annual Salary *</Label>
                  <Input
                    id="salary"
                    type="number"
                    value={addEmployeeForm.salary}
                    onChange={(e) => setAddEmployeeForm({...addEmployeeForm, salary: parseFloat(e.target.value) || 0})}
                    placeholder="Enter annual salary"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="status">Employment Status *</Label>
                  <Select 
                    value={addEmployeeForm.status} 
                    onValueChange={(value: 'active' | 'inactive' | 'terminated') => setAddEmployeeForm({...addEmployeeForm, status: value})}
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
                <div className="space-y-2">
                  <Label htmlFor="manager">Manager</Label>
                  <Input
                    id="manager"
                    value={addEmployeeForm.managerId}
                    onChange={(e) => setAddEmployeeForm({...addEmployeeForm, managerId: e.target.value})}
                    placeholder="Enter manager ID"
                  />
                </div>
              </div>
            </div>

            {/* Additional Information */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold">Additional Information</h3>
              <div className="space-y-2">
                <Label htmlFor="unit">Unit/Team</Label>
                <Input
                  id="unit"
                  value={addEmployeeForm.unitId}
                  onChange={(e) => setAddEmployeeForm({...addEmployeeForm, unitId: e.target.value})}
                  placeholder="Enter unit or team"
                />
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-4 border-t">
              <Button 
                variant="outline" 
                onClick={() => {
                  resetAddEmployeeForm();
                  setIsAddDialogOpen(false);
                }}
              >
                <X className="w-4 h-4 mr-2" />
                Cancel
              </Button>
              <Button onClick={handleAddEmployeeSubmit}>
                <Save className="w-4 h-4 mr-2" />
                Add Employee
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default EmployeeDirectory; 