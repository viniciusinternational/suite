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
  DollarSign, 
  Download, 
  Eye, 
  CheckCircle, 
  Clock,
  AlertCircle,
  TrendingUp,
  Users,
  Calendar,
  FileText,
  Calculator
} from 'lucide-react';
import type { Payslip, Employee } from '@/types';

interface PayslipWithEmployee extends Payslip {
  employeeName?: string;
  employeePosition?: string;
  employeeDepartment?: string;
}

const PayrollManagement = () => {
  const [payslips, setPayslips] = useState<PayslipWithEmployee[]>([]);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [periodFilter, setPeriodFilter] = useState<string>('all');
  const [selectedPayslip, setSelectedPayslip] = useState<PayslipWithEmployee | null>(null);
  const [isViewDialogOpen, setIsViewDialogOpen] = useState(false);
  const [isProcessDialogOpen, setIsProcessDialogOpen] = useState(false);

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

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'paid': return 'bg-green-100 text-green-800';
      case 'processed': return 'bg-blue-100 text-blue-800';
      case 'draft': return 'bg-gray-100 text-gray-800';
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
    setIsViewDialogOpen(true);
  };

  const handleProcessPayroll = () => {
    setIsProcessDialogOpen(true);
  };

  const getPayrollStats = () => {
    const total = payslips.length;
    const draft = payslips.filter(p => p.status === 'draft').length;
    const processed = payslips.filter(p => p.status === 'processed').length;
    const paid = payslips.filter(p => p.status === 'paid').length;
    const totalPayroll = payslips.reduce((sum, p) => sum + p.netSalary, 0);
    
    return { total, draft, processed, paid, totalPayroll };
  };

  const stats = getPayrollStats();

  return (
    <div className="p-6 space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">Payroll Management</h1>
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

      {/* Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Payslips</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.total}</div>
            <p className="text-xs text-muted-foreground">
              This period
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Draft</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-gray-600">{stats.draft}</div>
            <p className="text-xs text-muted-foreground">
              Pending review
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Processed</CardTitle>
            <CheckCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">{stats.processed}</div>
            <p className="text-xs text-muted-foreground">
              Ready for payment
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Payroll</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {formatCurrency(stats.totalPayroll)}
            </div>
            <p className="text-xs text-muted-foreground">
              This period
            </p>
          </CardContent>
        </Card>
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
                <SelectItem value="November 2023">November 2023</SelectItem>
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
        </CardContent>
      </Card>

      {/* Payslips Table */}
      <Card>
        <CardHeader>
          <CardTitle>
            Payslips ({filteredPayslips.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
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
                        <div className="font-medium">
                          {payslip.employeeName}
                        </div>
                        <div className="text-sm text-muted-foreground">
                          {payslip.employeePosition}
                        </div>
                        <div className="text-sm text-muted-foreground">
                          {payslip.employeeDepartment}
                        </div>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <Calendar className="h-4 w-4 text-muted-foreground" />
                      <span>{payslip.period}</span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="font-medium">
                      {formatCurrency(payslip.basicSalary)}
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="text-green-600">
                      +{formatCurrency(payslip.allowances)}
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="text-red-600">
                      -{formatCurrency(payslip.deductions)}
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="font-bold">
                      {formatCurrency(payslip.netSalary)}
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge className={getStatusColor(payslip.status)}>
                      {payslip.status}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <div className="flex gap-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleViewPayslip(payslip)}
                      >
                        <Eye className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                      >
                        <Download className="h-4 w-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* View Payslip Dialog */}
      <Dialog open={isViewDialogOpen} onOpenChange={setIsViewDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Payslip Details</DialogTitle>
          </DialogHeader>
          {selectedPayslip && (
            <div className="space-y-6">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-gray-200 rounded-full flex items-center justify-center">
                  {selectedPayslip.employeeName?.split(' ').map(n => n[0]).join('')}
                </div>
                <div>
                  <h3 className="text-lg font-bold">
                    {selectedPayslip.employeeName}
                  </h3>
                  <p className="text-muted-foreground">{selectedPayslip.employeePosition}</p>
                  <p className="text-sm text-muted-foreground">{selectedPayslip.employeeDepartment}</p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium">Period</label>
                  <div className="flex items-center gap-2">
                    <Calendar className="h-4 w-4 text-muted-foreground" />
                    <span>{selectedPayslip.period}</span>
                  </div>
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Status</label>
                  <Badge className={getStatusColor(selectedPayslip.status)}>
                    {selectedPayslip.status}
                  </Badge>
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Generated Date</label>
                  <div className="flex items-center gap-2">
                    <Calendar className="h-4 w-4 text-muted-foreground" />
                    <span>{formatDate(selectedPayslip.generatedAt)}</span>
                  </div>
                </div>
              </div>

              <div className="space-y-4">
                <h4 className="font-medium">Salary Breakdown</h4>
                <div className="space-y-3">
                  <div className="flex justify-between items-center p-3 bg-gray-50 rounded-md">
                    <span className="font-medium">Basic Salary</span>
                    <span className="font-bold">{formatCurrency(selectedPayslip.basicSalary)}</span>
                  </div>
                  <div className="flex justify-between items-center p-3 bg-green-50 rounded-md">
                    <span className="font-medium">Allowances</span>
                    <span className="font-bold text-green-600">+{formatCurrency(selectedPayslip.allowances)}</span>
                  </div>
                  <div className="flex justify-between items-center p-3 bg-red-50 rounded-md">
                    <span className="font-medium">Deductions</span>
                    <span className="font-bold text-red-600">-{formatCurrency(selectedPayslip.deductions)}</span>
                  </div>
                  <div className="flex justify-between items-center p-3 bg-blue-50 rounded-md border-2 border-blue-200">
                    <span className="font-bold">Net Salary</span>
                    <span className="font-bold text-blue-600">{formatCurrency(selectedPayslip.netSalary)}</span>
                  </div>
                </div>
              </div>

              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={() => setIsViewDialogOpen(false)}>
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

      {/* Process Payroll Dialog */}
      <Dialog open={isProcessDialogOpen} onOpenChange={setIsProcessDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Process Payroll</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <p className="text-muted-foreground">
              This will process payroll for all employees for the current period.
            </p>
            <div className="space-y-2">
              <label className="text-sm font-medium">Pay Period</label>
              <Select>
                <SelectTrigger>
                  <SelectValue placeholder="Select pay period" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="january-2024">January 2024</SelectItem>
                  <SelectItem value="february-2024">February 2024</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setIsProcessDialogOpen(false)}>
                Cancel
              </Button>
              <Button onClick={() => setIsProcessDialogOpen(false)}>
                Process Payroll
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default PayrollManagement; 