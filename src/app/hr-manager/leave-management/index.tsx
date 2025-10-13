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
  XCircle,
  Eye,
  Download,
  AlertCircle,
  TrendingUp,
  CalendarDays
} from 'lucide-react';
import type { LeaveRequest, Employee } from '@/types';

interface LeaveRequestWithEmployee extends LeaveRequest {
  employeeName?: string;
  employeePosition?: string;
  employeeDepartment?: string;
  rejectionReason?: string;
}

const LeaveManagement = () => {
  const [leaveRequests, setLeaveRequests] = useState<LeaveRequestWithEmployee[]>([]);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [typeFilter, setTypeFilter] = useState<string>('all');
  const [selectedRequest, setSelectedRequest] = useState<LeaveRequestWithEmployee | null>(null);
  const [isViewDialogOpen, setIsViewDialogOpen] = useState(false);
  const [isApprovalDialogOpen, setIsApprovalDialogOpen] = useState(false);

  useEffect(() => {
    // Mock data - in real app, fetch from API
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
        employeeName: 'Sarah Johnson',
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
        employeeName: 'Mike Wilson',
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
        employeeName: 'David Brown',
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

  const filteredRequests = leaveRequests.filter(request => {
    const matchesSearch = 
      request.employeeName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      request.reason?.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = statusFilter === 'all' || request.status === statusFilter;
    const matchesType = typeFilter === 'all' || request.type === typeFilter;
    
    return matchesSearch && matchesStatus && matchesType;
  });

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

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString();
  };

  const handleViewRequest = (request: LeaveRequestWithEmployee) => {
    setSelectedRequest(request);
    setIsViewDialogOpen(true);
  };

  const handleApproveRequest = (request: LeaveRequestWithEmployee) => {
    setSelectedRequest(request);
    setIsApprovalDialogOpen(true);
  };

  const getLeaveStats = () => {
    const total = leaveRequests.length;
    const pending = leaveRequests.filter(r => r.status === 'pending').length;
    const approved = leaveRequests.filter(r => r.status === 'approved').length;
    const rejected = leaveRequests.filter(r => r.status === 'rejected').length;
    
    return { total, pending, approved, rejected };
  };

  const stats = getLeaveStats();

  return (
    <div className="p-6 space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">Leave Management</h1>
        <div className="flex gap-2">
          <Button variant="outline" size="sm">
            <Download className="w-4 h-4 mr-2" />
            Export Report
          </Button>
          <Button variant="outline" size="sm">
            <Calendar className="w-4 h-4 mr-2" />
            Leave Calendar
          </Button>
        </div>
      </div>

      {/* Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Requests</CardTitle>
            <CalendarDays className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.total}</div>
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
            <div className="text-2xl font-bold text-yellow-600">{stats.pending}</div>
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
            <div className="text-2xl font-bold text-green-600">{stats.approved}</div>
            <p className="text-xs text-muted-foreground">
              Approved requests
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Rejected</CardTitle>
            <XCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">{stats.rejected}</div>
            <p className="text-xs text-muted-foreground">
              Rejected requests
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

            <Select value={typeFilter} onValueChange={setTypeFilter}>
              <SelectTrigger>
                <SelectValue placeholder="Filter by type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Types</SelectItem>
                <SelectItem value="annual">Annual Leave</SelectItem>
                <SelectItem value="sick">Sick Leave</SelectItem>
                <SelectItem value="maternity">Maternity Leave</SelectItem>
                <SelectItem value="emergency">Emergency Leave</SelectItem>
              </SelectContent>
            </Select>

            <Button variant="outline" onClick={() => {
              setSearchTerm('');
              setStatusFilter('all');
              setTypeFilter('all');
            }}>
              Clear Filters
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Leave Requests Table */}
      <Card>
        <CardHeader>
          <CardTitle>
            Leave Requests ({filteredRequests.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Employee</TableHead>
                <TableHead>Leave Type</TableHead>
                <TableHead>Duration</TableHead>
                <TableHead>Reason</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredRequests.map((request) => (
                <TableRow key={request.id}>
                  <TableCell>
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 bg-gray-200 rounded-full flex items-center justify-center">
                        {request.employeeName?.split(' ').map(n => n[0]).join('')}
                      </div>
                      <div>
                        <div className="font-medium">
                          {request.employeeName}
                        </div>
                        <div className="text-sm text-muted-foreground">
                          {request.employeePosition}
                        </div>
                        <div className="text-sm text-muted-foreground">
                          {request.employeeDepartment}
                        </div>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge className={getLeaveTypeColor(request.type)}>
                      {request.type}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <Calendar className="h-4 w-4 text-muted-foreground" />
                      <div>
                        <div className="text-sm">
                          {formatDate(request.startDate)} - {formatDate(request.endDate)}
                        </div>
                        <div className="text-xs text-muted-foreground">
                          {request.days} days
                        </div>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="max-w-xs truncate">
                      {request.reason}
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge className={getStatusColor(request.status)}>
                      {request.status}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <div className="flex gap-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleViewRequest(request)}
                      >
                        <Eye className="h-4 w-4" />
                      </Button>
                      {request.status === 'pending' && (
                        <>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="text-green-600 hover:text-green-700"
                            onClick={() => handleApproveRequest(request)}
                          >
                            <CheckCircle className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="text-red-600 hover:text-red-700"
                          >
                            <XCircle className="h-4 w-4" />
                          </Button>
                        </>
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* View Request Dialog */}
      <Dialog open={isViewDialogOpen} onOpenChange={setIsViewDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Leave Request Details</DialogTitle>
          </DialogHeader>
          {selectedRequest && (
            <div className="space-y-6">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-gray-200 rounded-full flex items-center justify-center">
                  {selectedRequest.employeeName?.split(' ').map(n => n[0]).join('')}
                </div>
                <div>
                  <h3 className="text-lg font-bold">
                    {selectedRequest.employeeName}
                  </h3>
                  <p className="text-muted-foreground">{selectedRequest.employeePosition}</p>
                  <p className="text-sm text-muted-foreground">{selectedRequest.employeeDepartment}</p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium">Leave Type</label>
                  <Badge className={getLeaveTypeColor(selectedRequest.type)}>
                    {selectedRequest.type}
                  </Badge>
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Status</label>
                  <Badge className={getStatusColor(selectedRequest.status)}>
                    {selectedRequest.status}
                  </Badge>
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Start Date</label>
                  <div className="flex items-center gap-2">
                    <Calendar className="h-4 w-4 text-muted-foreground" />
                    <span>{formatDate(selectedRequest.startDate)}</span>
                  </div>
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">End Date</label>
                  <div className="flex items-center gap-2">
                    <Calendar className="h-4 w-4 text-muted-foreground" />
                    <span>{formatDate(selectedRequest.endDate)}</span>
                  </div>
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Duration</label>
                  <span>{selectedRequest.days} days</span>
                </div>
                {selectedRequest.approvedBy && (
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Approved By</label>
                    <span>{selectedRequest.approvedBy}</span>
                  </div>
                )}
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">Reason</label>
                <p className="text-sm bg-gray-50 p-3 rounded-md">
                  {selectedRequest.reason}
                </p>
              </div>

              {selectedRequest.rejectionReason && (
                <div className="space-y-2">
                  <label className="text-sm font-medium text-red-600">Rejection Reason</label>
                  <p className="text-sm bg-red-50 p-3 rounded-md text-red-700">
                    {selectedRequest.rejectionReason}
                  </p>
                </div>
              )}

              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={() => setIsViewDialogOpen(false)}>
                  Close
                </Button>
                {selectedRequest.status === 'pending' && (
                  <>
                    <Button 
                      variant="outline" 
                      className="text-red-600 hover:text-red-700"
                      onClick={() => setIsViewDialogOpen(false)}
                    >
                      Reject
                    </Button>
                    <Button onClick={() => {
                      setIsViewDialogOpen(false);
                      handleApproveRequest(selectedRequest);
                    }}>
                      Approve
                    </Button>
                  </>
                )}
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Approval Dialog */}
      <Dialog open={isApprovalDialogOpen} onOpenChange={setIsApprovalDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Approve Leave Request</DialogTitle>
          </DialogHeader>
          {selectedRequest && (
            <div className="space-y-4">
              <p className="text-muted-foreground">
                Are you sure you want to approve this leave request for {selectedRequest.employeeName}?
              </p>
              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={() => setIsApprovalDialogOpen(false)}>
                  Cancel
                </Button>
                <Button onClick={() => setIsApprovalDialogOpen(false)}>
                  Approve Request
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default LeaveManagement; 