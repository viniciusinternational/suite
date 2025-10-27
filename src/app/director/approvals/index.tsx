'use client';

import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import {
  Search,
  Calendar,
  Clock,
  CheckCircle2,
  XCircle,
  AlertCircle,
  FileText,
  DollarSign,
  Calendar as CalendarIcon
} from 'lucide-react';

const ApprovalsPage = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedRequest, setSelectedRequest] = useState<any>(null);
  const [showApprovalDialog, setShowApprovalDialog] = useState(false);
  const [approvalComments, setApprovalComments] = useState('');
  const [approvalAction, setApprovalAction] = useState<'approve' | 'reject' | null>(null);

  // Mock data - In production, this would come from your API
  const approvalStats = {
    totalPending: 15,
    requestForms: 8,
    leaveRequests: 5,
    procurementRequests: 2
  };

  const pendingRequests = [
    {
      id: 'REQ001',
      type: 'Leave Request',
      employee: 'John Doe',
      department: 'Engineering',
      submitDate: '2024-02-15',
      status: 'pending',
      details: {
        type: 'Annual Leave',
        startDate: '2024-03-01',
        endDate: '2024-03-05',
        reason: 'Family vacation'
      }
    },
    {
      id: 'REQ002',
      type: 'Procurement',
      project: 'Office Complex Development',
      department: 'Engineering',
      submitDate: '2024-02-14',
      status: 'pending',
      details: {
        items: [
          { name: 'Construction Materials', quantity: 100, cost: 5000 },
          { name: 'Safety Equipment', quantity: 20, cost: 2000 }
        ],
        totalCost: 7000,
        urgency: 'High'
      }
    },
    {
      id: 'REQ003',
      type: 'Request Form',
      employee: 'Jane Smith',
      department: 'Engineering',
      submitDate: '2024-02-13',
      status: 'pending',
      details: {
        category: 'Equipment Request',
        description: 'New laptop for development work',
        justification: 'Current laptop is outdated and slow',
        estimatedCost: 1500
      }
    }
  ];

  const handleApproval = () => {
    if (!selectedRequest || !approvalAction) return;

    // In production, this would make an API call to update the request status
    console.log('Approval action:', {
      requestId: selectedRequest.id,
      action: approvalAction,
      comments: approvalComments
    });

    // Reset state
    setSelectedRequest(null);
    setShowApprovalDialog(false);
    setApprovalComments('');
    setApprovalAction(null);
  };

  const openApprovalDialog = (request: any, action: 'approve' | 'reject') => {
    setSelectedRequest(request);
    setApprovalAction(action);
    setShowApprovalDialog(true);
  };

  const getStatusBadge = (status: string) => {
    const colors = {
      pending: 'bg-yellow-100 text-yellow-800 border-yellow-200',
      approved: 'bg-green-100 text-green-800 border-green-200',
      rejected: 'bg-red-100 text-red-800 border-red-200'
    };
    return colors[status as keyof typeof colors] || 'bg-gray-100 text-gray-800 border-gray-200';
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Approvals</h1>
          <p className="text-muted-foreground">Manage department requests and approvals</p>
        </div>
        <Button variant="outline">
          <FileText className="h-4 w-4 mr-2" />
          Export Report
        </Button>
      </div>

      {/* Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Total Pending</p>
                <p className="text-2xl font-bold">{approvalStats.totalPending}</p>
              </div>
              <AlertCircle className="h-8 w-8 text-yellow-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Request Forms</p>
                <p className="text-2xl font-bold">{approvalStats.requestForms}</p>
              </div>
              <FileText className="h-8 w-8 text-blue-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Leave Requests</p>
                <p className="text-2xl font-bold">{approvalStats.leaveRequests}</p>
              </div>
              <CalendarIcon className="h-8 w-8 text-green-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Procurement</p>
                <p className="text-2xl font-bold">{approvalStats.procurementRequests}</p>
              </div>
              <DollarSign className="h-8 w-8 text-purple-500" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Content */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Pending Approvals</CardTitle>
            <div className="relative w-64">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
              <Input
                placeholder="Search requests..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Request ID</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Requestor</TableHead>
                <TableHead>Submit Date</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {pendingRequests
                .filter(request => 
                  request.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
                  request.type.toLowerCase().includes(searchTerm.toLowerCase()) ||
                  (request.employee || '').toLowerCase().includes(searchTerm.toLowerCase())
                )
                .map((request) => (
                  <TableRow key={request.id}>
                    <TableCell className="font-medium">{request.id}</TableCell>
                    <TableCell>{request.type}</TableCell>
                    <TableCell>{request.employee || request.project}</TableCell>
                    <TableCell>
                      <div className="flex items-center">
                        <Calendar className="h-4 w-4 mr-2 text-muted-foreground" />
                        {formatDate(request.submitDate)}
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline" className={getStatusBadge(request.status)}>
                        {request.status.charAt(0).toUpperCase() + request.status.slice(1)}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          variant="outline"
                          className="text-green-600 hover:text-green-700"
                          onClick={() => openApprovalDialog(request, 'approve')}
                        >
                          <CheckCircle2 className="h-4 w-4" />
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          className="text-red-600 hover:text-red-700"
                          onClick={() => openApprovalDialog(request, 'reject')}
                        >
                          <XCircle className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Approval Dialog */}
      <Dialog open={showApprovalDialog} onOpenChange={setShowApprovalDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {approvalAction === 'approve' ? 'Approve Request' : 'Reject Request'}
            </DialogTitle>
            <DialogDescription>
              {approvalAction === 'approve'
                ? 'Please confirm that you want to approve this request.'
                : 'Please provide a reason for rejecting this request.'}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            {selectedRequest && (
              <div className="space-y-4">
                <div>
                  <p className="text-sm font-medium">Request Details</p>
                  <p className="text-sm text-muted-foreground">ID: {selectedRequest.id}</p>
                  <p className="text-sm text-muted-foreground">Type: {selectedRequest.type}</p>
                  <p className="text-sm text-muted-foreground">
                    Requestor: {selectedRequest.employee || selectedRequest.project}
                  </p>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium">Comments</label>
                  <Textarea
                    placeholder="Add your comments here..."
                    value={approvalComments}
                    onChange={(e) => setApprovalComments(e.target.value)}
                  />
                </div>
              </div>
            )}
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowApprovalDialog(false)}>
              Cancel
            </Button>
            <Button
              variant={approvalAction === 'approve' ? 'default' : 'destructive'}
              onClick={handleApproval}
            >
              {approvalAction === 'approve' ? 'Approve' : 'Reject'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default ApprovalsPage; 