'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { 
  Users, 
  Calendar, 
  TrendingDown, 
  FileText, 
  Plus,
  Clock,
  CheckCircle,
  AlertCircle,
  UserPlus,
  DollarSign
} from 'lucide-react';
import type { Employee, LeaveRequest, Payslip, User } from '@/types';

interface HRDashboardStats {
  totalEmployees: number;
  activeEmployees: number;
  newHiresThisMonth: number;
  pendingLeaveRequests: number;
  approvedLeaveRequests: number;
  turnoverRate: number;
  reviewsDue: number;
  completedReviews: number;
  totalPayroll: number;
  averageSalary: number;
}

const HRDashboard = () => {
  const [stats, setStats] = useState<HRDashboardStats>({
    totalEmployees: 0,
    activeEmployees: 0,
    newHiresThisMonth: 0,
    pendingLeaveRequests: 0,
    approvedLeaveRequests: 0,
    turnoverRate: 0,
    reviewsDue: 0,
    completedReviews: 0,
    totalPayroll: 0,
    averageSalary: 0,
  });

  const [recentLeaveRequests, setRecentLeaveRequests] = useState<LeaveRequest[]>([]);
  const [recentEmployees, setRecentEmployees] = useState<Employee[]>([]);

  useEffect(() => {
    // Mock data - in real app, fetch from API
    setStats({
      totalEmployees: 156,
      activeEmployees: 148,
      newHiresThisMonth: 8,
      pendingLeaveRequests: 12,
      approvedLeaveRequests: 45,
      turnoverRate: 2.3,
      reviewsDue: 15,
      completedReviews: 23,
      totalPayroll: 1250000,
      averageSalary: 8500,
    });

    // Mock recent data
    setRecentLeaveRequests([
      {
        id: '1',
        employeeId: 'emp1',
        type: 'annual',
        startDate: '2024-01-15',
        endDate: '2024-01-20',
        days: 5,
        reason: 'Family vacation',
        status: 'pending',
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
      },
    ]);

    setRecentEmployees([
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
      },
    ]);
  }, []);

  const getLeaveTypeColor = (type: string) => {
    switch (type) {
      case 'annual': return 'bg-blue-100 text-blue-800';
      case 'sick': return 'bg-red-100 text-red-800';
      case 'maternity': return 'bg-purple-100 text-purple-800';
      case 'emergency': return 'bg-orange-100 text-orange-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'approved': return 'bg-green-100 text-green-800';
      case 'pending': return 'bg-yellow-100 text-yellow-800';
      case 'rejected': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">HR Dashboard</h1>
        <div className="flex gap-2">
          <Button variant="outline" size="sm">
            <UserPlus className="w-4 h-4 mr-2" />
            Add Employee
          </Button>
          <Button variant="outline" size="sm">
            <FileText className="w-4 h-4 mr-2" />
            Generate Report
          </Button>
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Employees</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalEmployees}</div>
            <p className="text-xs text-muted-foreground">
              {stats.activeEmployees} active
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Leave Requests</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.pendingLeaveRequests}</div>
            <p className="text-xs text-muted-foreground">
              {stats.approvedLeaveRequests} approved this month
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Turnover Rate</CardTitle>
            <TrendingDown className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.turnoverRate}%</div>
            <p className="text-xs text-muted-foreground">
              This month
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Reviews Due</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.reviewsDue}</div>
            <p className="text-xs text-muted-foreground">
              {stats.completedReviews} completed
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Payroll Summary */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <DollarSign className="h-5 w-5" />
              Payroll Overview
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex justify-between items-center">
              <span className="text-sm font-medium">Total Payroll</span>
              <span className="text-lg font-bold">
                ${(stats.totalPayroll / 1000).toFixed(0)}k
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm font-medium">Average Salary</span>
              <span className="text-lg font-bold">
                ${stats.averageSalary.toLocaleString()}
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm font-medium">New Hires</span>
              <span className="text-lg font-bold text-green-600">
                +{stats.newHiresThisMonth}
              </span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Clock className="h-5 w-5" />
              Quick Actions
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <Button variant="outline" className="w-full justify-start">
              <UserPlus className="w-4 h-4 mr-2" />
              Onboard New Employee
            </Button>
            <Button variant="outline" className="w-full justify-start">
              <Calendar className="w-4 h-4 mr-2" />
              Process Leave Requests
            </Button>
            <Button variant="outline" className="w-full justify-start">
              <FileText className="w-4 h-4 mr-2" />
              Schedule Reviews
            </Button>
            <Button variant="outline" className="w-full justify-start">
              <DollarSign className="w-4 h-4 mr-2" />
              Process Payroll
            </Button>
          </CardContent>
        </Card>
      </div>

      {/* Recent Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Recent Leave Requests</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {recentLeaveRequests.map((request) => (
                <div key={request.id} className="flex items-center justify-between p-3 border rounded-lg">
                  <div className="flex items-center gap-3">
                    <div className="flex flex-col">
                      <span className="font-medium">
                        Employee #{request.employeeId}
                      </span>
                      <span className="text-sm text-muted-foreground">
                        {request.days} days • {request.startDate} to {request.endDate}
                      </span>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge className={getLeaveTypeColor(request.type)}>
                      {request.type}
                    </Badge>
                    <Badge className={getStatusColor(request.status)}>
                      {request.status}
                    </Badge>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Recent Employees</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {recentEmployees.map((employee) => (
                <div key={employee.id} className="flex items-center justify-between p-3 border rounded-lg">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 bg-gray-200 rounded-full flex items-center justify-center">
                      {employee.firstName[0]}{employee.lastName[0]}
                    </div>
                    <div className="flex flex-col">
                      <span className="font-medium">
                        {employee.firstName} {employee.lastName}
                      </span>
                      <span className="text-sm text-muted-foreground">
                        {employee.position}
                      </span>
                    </div>
                  </div>
                  <Badge className="bg-green-100 text-green-800">
                    {employee.status}
                  </Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Performance Metrics */}
      <Card>
        <CardHeader>
          <CardTitle>HR Performance Metrics</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>Employee Satisfaction</span>
                <span>85%</span>
              </div>
              <Progress value={85} className="h-2" />
            </div>
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>Time to Hire</span>
                <span>12 days</span>
              </div>
              <Progress value={75} className="h-2" />
            </div>
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>Retention Rate</span>
                <span>92%</span>
              </div>
              <Progress value={92} className="h-2" />
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default HRDashboard; 