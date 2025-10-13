'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
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
  Calendar, 
  Clock, 
  User, 
  CheckCircle, 
  AlertCircle,
  Eye,
  Download,
  DollarSign,
  TrendingUp,
  FileText,
  Plus,
  CalendarDays,
  Users,
  Calculator,
  CreditCard,
  Banknote,
  Receipt,
  Activity,
  BarChart3
} from 'lucide-react';
import type { Employee, LeaveRequest, Payslip } from '@/types';

interface PayslipWithEmployee extends Payslip {
  employeeName?: string;
  employeePosition?: string;
  employeeDepartment?: string;
}

interface LeaveRequestWithEmployee extends LeaveRequest {
  employeeName?: string;
  employeePosition?: string;
  employeeDepartment?: string;
  rejectionReason?: string;
}

interface PayrollSummary {
  totalPayroll: number;
  processedPayroll: number;
  pendingPayroll: number;
  averageSalary: number;
  totalEmployees: number;
  activeEmployees: number;
}

interface LeaveSummary {
  totalRequests: number;
  pendingRequests: number;
  approvedRequests: number;
  rejectedRequests: number;
  averageLeaveDays: number;
}

const PayrollAndLeaveManagement = () => {
  const [payslips, setPayslips] = useState<PayslipWithEmployee[]>([]);
  const [leaveRequests, setLeaveRequests] = useState<LeaveRequestWithEmployee[]>([]);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [periodFilter, setPeriodFilter] = useState<string>('all');
  const [selectedPayslip, setSelectedPayslip] = useState<PayslipWithEmployee | null>(null);
  const [selectedLeaveRequest, setSelectedLeaveRequest] = useState<LeaveRequestWithEmployee | null>(null);
  const [isViewPayslipDialogOpen, setIsViewPayslipDialogOpen] = useState(false);
  const [isViewLeaveDialogOpen, setIsViewLeaveDialogOpen] = useState(false);
  const [isProcessPayrollDialogOpen, setIsProcessPayrollDialogOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<'payroll' | 'leave'>('payroll');

  useEffect(() => {
    // Mock data - in real app, fetch from API
    setPayslips([
      {
        id: 'payslip1',
        employeeId: 'emp1',
        period: 'January 2024',
        basicSalary: 8500,
        allowances: 1200,
        deductions: 800,
        netSalary: 8900,
        generatedAt: '2024-01-31',
        status: 'processed',
        employeeName: 'John Doe',
        employeePosition: 'Senior Engineer',
        employeeDepartment: 'Engineering',
      },
      {
        id: 'payslip2',
        employeeId: 'emp2',
        period: 'January 2024',
        basicSalary: 9500,
        allowances: 1500,
        deductions: 950,
        netSalary: 10050,
        generatedAt: '2024-01-31',
        status: 'paid',
        employeeName: 'Jane Smith',
        employeePosition: 'Project Manager',
        employeeDepartment: 'Project Management',
      },
      {
        id: 'payslip3',
        employeeId: 'emp3',
        period: 'January 2024',
        basicSalary: 6500,
        allowances: 800,
        deductions: 650,
        netSalary: 6650,
        generatedAt: '2024-01-31',
        status: 'draft',
        employeeName: 'Robert Brown',
        employeePosition: 'HR Specialist',
        employeeDepartment: 'Human Resources',
      },
      {
        id: 'payslip4',
        employeeId: 'emp4',
        period: 'January 2024',
        basicSalary: 5500,
        allowances: 600,
        deductions: 550,
        netSalary: 5550,
        generatedAt: '2024-01-31',
        status: 'processed',
        employeeName: 'Emily Davis',
        employeePosition: 'Junior Developer',
        employeeDepartment: 'Engineering',
      },
      {
        id: 'payslip5',
        employeeId: 'emp5',
        period: 'January 2024',
        basicSalary: 7000,
        allowances: 1000,
        deductions: 700,
        netSalary: 7300,
        generatedAt: '2024-01-31',
        status: 'paid',
        employeeName: 'David Wilson',
        employeePosition: 'Accountant',
        employeeDepartment: 'Finance',
      },
    ]);

    setLeaveRequests([
      {
        id: '1',
        employeeId: 'emp1',
        type: 'annual',
        startDate: '2024-01-15',
        endDate: '2024-01-20',
        days: 5,
        reason: 'Family vacation',
        status: 'pending',
        employeeName: 'John Doe',
        employeePosition: 'Senior Engineer',
        employeeDepartment: 'Engineering',
      },
      {
        id: '2',
        employeeId: 'emp2',
        type: 'sick',
        startDate: '2024-01-10',
        endDate: '2024-01-12',
        days: 2,
        reason: 'Medical appointment',
        status: 'approved',
        approvedBy: 'hr1',
        approvedAt: '2024-01-09',
        employeeName: 'Jane Smith',
        employeePosition: 'Project Manager',
        employeeDepartment: 'Project Management',
      },
      {
        id: '3',
        employeeId: 'emp3',
        type: 'maternity',
        startDate: '2024-02-01',
        endDate: '2024-05-01',
        days: 90,
        reason: 'Maternity leave',
        status: 'approved',
        approvedBy: 'hr1',
        approvedAt: '2024-01-15',
        employeeName: 'Robert Brown',
        employeePosition: 'HR Specialist',
        employeeDepartment: 'Human Resources',
      },
      {
        id: '4',
        employeeId: 'emp4',
        type: 'emergency',
        startDate: '2024-01-08',
        endDate: '2024-01-08',
        days: 1,
        reason: 'Family emergency',
        status: 'pending',
        employeeName: 'Emily Davis',
        employeePosition: 'Junior Developer',
        employeeDepartment: 'Engineering',
      },
      {
        id: '5',
        employeeId: 'emp5',
        type: 'annual',
        startDate: '2024-01-25',
        endDate: '2024-01-30',
        days: 5,
        reason: 'Personal time off',
        status: 'rejected',
        approvedBy: 'hr1',
        approvedAt: '2024-01-20',
        rejectionReason: 'Insufficient notice period',
        employeeName: 'David Wilson',
        employeePosition: 'Accountant',
        employeeDepartment: 'Finance',
      },
    ]);

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
      },
      // Add more employees as needed
    ]);
  }, []);

  const filteredPayslips = payslips.filter(payslip => {
    const matchesSearch = 
      payslip.employeeName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      payslip.period.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = statusFilter === 'all' || payslip.status === statusFilter;
    const matchesPeriod = periodFilter === 'all' || payslip.period === periodFilter;
    
    return matchesSearch && matchesStatus && matchesPeriod;
  });

  const filteredLeaveRequests = leaveRequests.filter(request => {
    const matchesSearch = 
      request.employeeName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      request.reason?.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = statusFilter === 'all' || request.status === statusFilter;
    const matchesType = periodFilter === 'all' || request.type === periodFilter;
    
    return matchesSearch && matchesStatus && matchesType;
  });

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'paid': return 'bg-green-100 text-green-800';
      case 'processed': return 'bg-blue-100 text-blue-800';
      case 'draft': return 'bg-gray-100 text-gray-800';
      case 'approved': return 'bg-green-100 text-green-800';
      case 'pending': return 'bg-yellow-100 text-yellow-800';
      case 'rejected': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getLeaveTypeColor = (type: string) => {
    switch (type) {
      case 'annual': return 'bg-blue-100 text-blue-800';
      case 'sick': return 'bg-red-100 text-red-800';
      case 'maternity': return 'bg-purple-100 text-purple-800';
      case 'emergency': return 'bg-orange-100 text-orange-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(amount);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString();
  };

  const handleViewPayslip = (payslip: PayslipWithEmployee) => {
    setSelectedPayslip(payslip);
    setIsViewPayslipDialogOpen(true);
  };

  const handleViewLeaveRequest = (request: LeaveRequestWithEmployee) => {
    setSelectedLeaveRequest(request);
    setIsViewLeaveDialogOpen(true);
  };

  const handleProcessPayroll = () => {
    setIsProcessPayrollDialogOpen(true);
  };

  const getPayrollSummary = (): PayrollSummary => {
    const total = payslips.reduce((sum, p) => sum + p.netSalary, 0);
    const processed = payslips.filter(p => p.status === 'processed' || p.status === 'paid').length;
    const pending = payslips.filter(p => p.status === 'draft').length;
    const avgSalary = payslips.length > 0 ? total / payslips.length : 0;
    
    return {
      totalPayroll: total,
      processedPayroll: processed,
      pendingPayroll: pending,
      averageSalary: avgSalary,
      totalEmployees: payslips.length,
      activeEmployees: payslips.filter(p => p.status !== 'draft').length,
    };
  };

  const getLeaveSummary = (): LeaveSummary => {
    const total = leaveRequests.length;
    const pending = leaveRequests.filter(r => r.status === 'pending').length;
    const approved = leaveRequests.filter(r => r.status === 'approved').length;
    const rejected = leaveRequests.filter(r => r.status === 'rejected').length;
    const avgDays = leaveRequests.length > 0 
      ? leaveRequests.reduce((sum, r) => sum + r.days, 0) / leaveRequests.length 
      : 0;
    
    return {
      totalRequests: total,
      pendingRequests: pending,
      approvedRequests: approved,
      rejectedRequests: rejected,
      averageLeaveDays: avgDays,
    };
  };

  const payrollSummary = getPayrollSummary();
  const leaveSummary = getLeaveSummary();

  return (
    <div className="p-6 space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">Payroll & Leave Management</h1>
        <div className="flex gap-2">
          <Button variant="outline" size="sm">
            <Download className="w-4 h-4 mr-2" />
            Export Report
          </Button>
          <Button onClick={handleProcessPayroll}>
            <Calculator className="w-4 h-4 mr-2" />
            Process Payroll
          </Button>
        </div>
      </div>

      {/* Tab Navigation */}
      <div className="flex space-x-1 bg-gray-100 p-1 rounded-lg">
        <Button
          variant={activeTab === 'payroll' ? 'default' : 'ghost'}
          size="sm"
          onClick={() => setActiveTab('payroll')}
          className="flex items-center gap-2"
        >
          <DollarSign className="h-4 w-4" />
          Payroll
        </Button>
        <Button
          variant={activeTab === 'leave' ? 'default' : 'ghost'}
          size="sm"
          onClick={() => setActiveTab('leave')}
          className="flex items-center gap-2"
        >
          <Calendar className="h-4 w-4" />
          Leave Management
        </Button>
      </div>

      {activeTab === 'payroll' ? (
        <>
          {/* Payroll Statistics */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Payroll</CardTitle>
                <DollarSign className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{formatCurrency(payrollSummary.totalPayroll)}</div>
                <p className="text-xs text-muted-foreground">
                  This month
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Processed</CardTitle>
                <CheckCircle className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{payrollSummary.processedPayroll}</div>
                <p className="text-xs text-muted-foreground">
                  of {payrollSummary.totalEmployees} employees
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Pending</CardTitle>
                <Clock className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{payrollSummary.pendingPayroll}</div>
                <p className="text-xs text-muted-foreground">
                  Awaiting processing
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Average Salary</CardTitle>
                <TrendingUp className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{formatCurrency(payrollSummary.averageSalary)}</div>
                <p className="text-xs text-muted-foreground">
                  Per employee
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Payroll Table */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Receipt className="h-5 w-5" />
                Payroll Records
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {/* Filters */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                    <Input
                      placeholder="Search payslips..."
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
                      <SelectItem value="draft">Draft</SelectItem>
                      <SelectItem value="processed">Processed</SelectItem>
                      <SelectItem value="paid">Paid</SelectItem>
                    </SelectContent>
                  </Select>

                  <Select value={periodFilter} onValueChange={setPeriodFilter}>
                    <SelectTrigger>
                      <SelectValue placeholder="Filter by period" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Periods</SelectItem>
                      <SelectItem value="January 2024">January 2024</SelectItem>
                      <SelectItem value="December 2023">December 2023</SelectItem>
                    </SelectContent>
                  </Select>

                  <Button variant="outline" onClick={() => {
                    setSearchTerm('');
                    setStatusFilter('all');
                    setPeriodFilter('all');
                  }}>
                    Clear Filters
                  </Button>
                </div>

                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Employee</TableHead>
                      <TableHead>Period</TableHead>
                      <TableHead>Basic Salary</TableHead>
                      <TableHead>Allowances</TableHead>
                      <TableHead>Deductions</TableHead>
                      <TableHead>Net Salary</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredPayslips.map((payslip) => (
                      <TableRow key={payslip.id}>
                        <TableCell>
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 bg-gray-200 rounded-full flex items-center justify-center">
                              {payslip.employeeName?.split(' ').map(n => n[0]).join('')}
                            </div>
                            <div>
                              <div className="font-medium">{payslip.employeeName}</div>
                              <div className="text-sm text-muted-foreground">{payslip.employeePosition}</div>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>{payslip.period}</TableCell>
                        <TableCell>{formatCurrency(payslip.basicSalary)}</TableCell>
                        <TableCell>{formatCurrency(payslip.allowances)}</TableCell>
                        <TableCell>{formatCurrency(payslip.deductions)}</TableCell>
                        <TableCell className="font-medium">{formatCurrency(payslip.netSalary)}</TableCell>
                        <TableCell>
                          <Badge className={getStatusColor(payslip.status)}>
                            {payslip.status}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleViewPayslip(payslip)}
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </>
      ) : (
        <>
          {/* Leave Statistics */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Requests</CardTitle>
                <CalendarDays className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{leaveSummary.totalRequests}</div>
                <p className="text-xs text-muted-foreground">
                  All time
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Pending</CardTitle>
                <Clock className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{leaveSummary.pendingRequests}</div>
                <p className="text-xs text-muted-foreground">
                  Awaiting approval
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Approved</CardTitle>
                <CheckCircle className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{leaveSummary.approvedRequests}</div>
                <p className="text-xs text-muted-foreground">
                  This month
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Avg Days</CardTitle>
                <Activity className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{leaveSummary.averageLeaveDays.toFixed(1)}</div>
                <p className="text-xs text-muted-foreground">
                  Per request
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Leave Requests Table */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Calendar className="h-5 w-5" />
                Leave Requests
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {/* Filters */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                    <Input
                      placeholder="Search requests..."
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
                      <SelectItem value="pending">Pending</SelectItem>
                      <SelectItem value="approved">Approved</SelectItem>
                      <SelectItem value="rejected">Rejected</SelectItem>
                    </SelectContent>
                  </Select>

                  <Select value={periodFilter} onValueChange={setPeriodFilter}>
                    <SelectTrigger>
                      <SelectValue placeholder="Filter by type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Types</SelectItem>
                      <SelectItem value="annual">Annual</SelectItem>
                      <SelectItem value="sick">Sick</SelectItem>
                      <SelectItem value="maternity">Maternity</SelectItem>
                      <SelectItem value="emergency">Emergency</SelectItem>
                    </SelectContent>
                  </Select>

                  <Button variant="outline" onClick={() => {
                    setSearchTerm('');
                    setStatusFilter('all');
                    setPeriodFilter('all');
                  }}>
                    Clear Filters
                  </Button>
                </div>

                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Employee</TableHead>
                      <TableHead>Type</TableHead>
                      <TableHead>Duration</TableHead>
                      <TableHead>Start Date</TableHead>
                      <TableHead>End Date</TableHead>
                      <TableHead>Reason</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredLeaveRequests.map((request) => (
                      <TableRow key={request.id}>
                        <TableCell>
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 bg-gray-200 rounded-full flex items-center justify-center">
                              {request.employeeName?.split(' ').map(n => n[0]).join('')}
                            </div>
                            <div>
                              <div className="font-medium">{request.employeeName}</div>
                              <div className="text-sm text-muted-foreground">{request.employeePosition}</div>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge className={getLeaveTypeColor(request.type)}>
                            {request.type}
                          </Badge>
                        </TableCell>
                        <TableCell>{request.days} days</TableCell>
                        <TableCell>{formatDate(request.startDate)}</TableCell>
                        <TableCell>{formatDate(request.endDate)}</TableCell>
                        <TableCell className="max-w-xs truncate">{request.reason}</TableCell>
                        <TableCell>
                          <Badge className={getStatusColor(request.status)}>
                            {request.status}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleViewLeaveRequest(request)}
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </>
      )}

      {/* View Payslip Dialog */}
      <Dialog open={isViewPayslipDialogOpen} onOpenChange={setIsViewPayslipDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Payslip Details</DialogTitle>
          </DialogHeader>
          {selectedPayslip && (
            <div className="space-y-6">
              <div className="flex items-center gap-4">
                <div className="w-16 h-16 bg-gray-200 rounded-full flex items-center justify-center text-xl font-bold">
                  {selectedPayslip.employeeName?.split(' ').map(n => n[0]).join('')}
                </div>
                <div>
                  <h3 className="text-xl font-bold">{selectedPayslip.employeeName}</h3>
                  <p className="text-muted-foreground">{selectedPayslip.employeePosition}</p>
                  <p className="text-sm text-muted-foreground">{selectedPayslip.period}</p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium">Basic Salary</label>
                  <span className="font-medium">{formatCurrency(selectedPayslip.basicSalary)}</span>
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Allowances</label>
                  <span className="font-medium text-green-600">+{formatCurrency(selectedPayslip.allowances)}</span>
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Deductions</label>
                  <span className="font-medium text-red-600">-{formatCurrency(selectedPayslip.deductions)}</span>
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Net Salary</label>
                  <span className="font-bold text-lg">{formatCurrency(selectedPayslip.netSalary)}</span>
                </div>
              </div>

              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={() => setIsViewPayslipDialogOpen(false)}>
                  Close
                </Button>
                <Button>
                  <Download className="w-4 h-4 mr-2" />
                  Download PDF
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* View Leave Request Dialog */}
      <Dialog open={isViewLeaveDialogOpen} onOpenChange={setIsViewLeaveDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Leave Request Details</DialogTitle>
          </DialogHeader>
          {selectedLeaveRequest && (
            <div className="space-y-6">
              <div className="flex items-center gap-4">
                <div className="w-16 h-16 bg-gray-200 rounded-full flex items-center justify-center text-xl font-bold">
                  {selectedLeaveRequest.employeeName?.split(' ').map(n => n[0]).join('')}
                </div>
                <div>
                  <h3 className="text-xl font-bold">{selectedLeaveRequest.employeeName}</h3>
                  <p className="text-muted-foreground">{selectedLeaveRequest.employeePosition}</p>
                  <Badge className={getLeaveTypeColor(selectedLeaveRequest.type)}>
                    {selectedLeaveRequest.type}
                  </Badge>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium">Start Date</label>
                  <span className="font-medium">{formatDate(selectedLeaveRequest.startDate)}</span>
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">End Date</label>
                  <span className="font-medium">{formatDate(selectedLeaveRequest.endDate)}</span>
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Duration</label>
                  <span className="font-medium">{selectedLeaveRequest.days} days</span>
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Status</label>
                  <Badge className={getStatusColor(selectedLeaveRequest.status)}>
                    {selectedLeaveRequest.status}
                  </Badge>
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">Reason</label>
                <p className="text-sm">{selectedLeaveRequest.reason}</p>
              </div>

              {selectedLeaveRequest.rejectionReason && (
                <div className="space-y-2">
                  <label className="text-sm font-medium text-red-600">Rejection Reason</label>
                  <p className="text-sm text-red-600">{selectedLeaveRequest.rejectionReason}</p>
                </div>
              )}

              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={() => setIsViewLeaveDialogOpen(false)}>
                  Close
                </Button>
                {selectedLeaveRequest.status === 'pending' && (
                  <>
                    <Button variant="outline" className="text-red-600">
                      Reject
                    </Button>
                    <Button>
                      Approve
                    </Button>
                  </>
                )}
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Process Payroll Dialog */}
      <Dialog open={isProcessPayrollDialogOpen} onOpenChange={setIsProcessPayrollDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Process Payroll</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <p className="text-muted-foreground">
              This will process payroll for all active employees for the current period.
            </p>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setIsProcessPayrollDialogOpen(false)}>
                Cancel
              </Button>
              <Button onClick={() => setIsProcessPayrollDialogOpen(false)}>
                Process Payroll
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default PayrollAndLeaveManagement; 