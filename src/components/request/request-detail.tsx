'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { RequestApproval } from '@/components/request/request-approval';
import { RequestComments } from '@/components/request/request-comments';
import { RequestAttachments } from '@/components/request/request-attachments';
import type { RequestForm } from '@/types';
import { FileText, Building2, User, Calendar, DollarSign, Package, Edit } from 'lucide-react';
import { useAuthStore } from '@/store/auth-store';

interface RequestDetailProps {
  request: RequestForm;
  onEdit?: (request: RequestForm) => void;
  onApprovalChange?: () => void;
}

export function RequestDetail({ request, onEdit, onApprovalChange }: RequestDetailProps) {
  const { user } = useAuthStore();

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'approved':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'rejected':
        return 'bg-red-100 text-red-800 border-red-200';
      case 'pending_admin_head':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'pending_dept_head':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'pending_dept_head':
        return 'Pending Dept Head';
      case 'pending_admin_head':
        return 'Pending Admin Head';
      case 'approved':
        return 'Approved';
      case 'rejected':
        return 'Rejected';
      default:
        return status;
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  const formatCurrency = (amount?: number, currency = 'NGN') => {
    if (!amount) return 'N/A';
    return new Intl.NumberFormat('en-NG', {
      style: 'currency',
      currency: currency,
    }).format(amount);
  };

  const items = (request.items as any[]) || [];

  const canEdit = user?.id === request.requestedBy || 
    (user?.permissions?.edit_requests && ['pending_dept_head', 'pending_admin_head'].includes(request.status));

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">{request.name}</h2>
          <div className="flex items-center gap-2 mt-2">
            <Badge variant="outline" className={getStatusColor(request.status)}>
              {getStatusLabel(request.status)}
            </Badge>
            <span className="text-sm text-gray-500">
              Created {formatDate(request.createdAt || request.requestDate)}
            </span>
          </div>
        </div>
        {canEdit && onEdit && (
          <Button variant="outline" onClick={() => onEdit(request)}>
            <Edit className="h-4 w-4 mr-2" />
            Edit
          </Button>
        )}
      </div>

      {/* Main Content Tabs */}
      <Tabs defaultValue="details" className="space-y-4">
        <TabsList>
          <TabsTrigger value="details">Details</TabsTrigger>
          <TabsTrigger value="items">Items</TabsTrigger>
          <TabsTrigger value="approval">Approval</TabsTrigger>
          <TabsTrigger value="comments">Comments</TabsTrigger>
          <TabsTrigger value="attachments">Attachments</TabsTrigger>
        </TabsList>

        {/* Details Tab */}
        <TabsContent value="details" className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <FileText className="h-5 w-5" />
                  Basic Information
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div>
                  <p className="text-sm font-medium text-gray-500">Type</p>
                  <p className="text-sm capitalize">{request.type?.replace('_', ' ')}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-500">Priority</p>
                  <p className="text-sm capitalize">{request.priority || 'Medium'}</p>
                </div>
                {request.category && (
                  <div>
                    <p className="text-sm font-medium text-gray-500">Category</p>
                    <p className="text-sm">{request.category}</p>
                  </div>
                )}
                <div>
                  <p className="text-sm font-medium text-gray-500">Request Date</p>
                  <p className="text-sm">{formatDate(request.requestDate)}</p>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <User className="h-5 w-5" />
                  Requester Information
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div>
                  <p className="text-sm font-medium text-gray-500">Requester</p>
                  <p className="text-sm">{request.requestedByUser?.fullName || 'N/A'}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-500">Email</p>
                  <p className="text-sm">{request.requestedByUser?.email || 'N/A'}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-500">Department</p>
                  <p className="text-sm">{request.department?.name || 'N/A'}</p>
                </div>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <FileText className="h-5 w-5" />
                Description
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-gray-700 whitespace-pre-wrap">
                {request.description}
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <DollarSign className="h-5 w-5" />
                Budget
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div>
                <p className="text-sm font-medium text-gray-500">Total Amount</p>
                <p className="text-lg font-semibold">
                  {formatCurrency(request.amount, request.currency)}
                </p>
              </div>
              <div>
                <p className="text-sm font-medium text-gray-500">Currency</p>
                <p className="text-sm">{request.currency || 'NGN'}</p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Items Tab */}
        <TabsContent value="items">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <Package className="h-5 w-5" />
                Request Items ({items.length})
              </CardTitle>
            </CardHeader>
            <CardContent>
              {items.length === 0 ? (
                <p className="text-sm text-gray-500">No items specified</p>
              ) : (
                <div className="space-y-4">
                  {items.map((item: any, index: number) => (
                    <div key={index} className="border rounded-lg p-4">
                      <div className="flex justify-between items-start mb-2">
                        <h4 className="font-medium">{item.name}</h4>
                        <p className="text-sm font-semibold">
                          {formatCurrency(item.totalPrice || item.quantity * item.unitPrice, request.currency)}
                        </p>
                      </div>
                      {item.description && (
                        <p className="text-sm text-gray-600 mb-2">{item.description}</p>
                      )}
                      <div className="grid grid-cols-3 gap-4 text-sm">
                        <div>
                          <p className="text-gray-500">Quantity</p>
                          <p className="font-medium">{item.quantity}</p>
                        </div>
                        <div>
                          <p className="text-gray-500">Unit Price</p>
                          <p className="font-medium">
                            {formatCurrency(item.unitPrice, request.currency)}
                          </p>
                        </div>
                        {item.specifications && (
                          <div>
                            <p className="text-gray-500">Specifications</p>
                            <p className="font-medium">{item.specifications}</p>
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Approval Tab */}
        <TabsContent value="approval">
          <RequestApproval request={request} onApprovalChange={onApprovalChange} />
        </TabsContent>

        {/* Comments Tab */}
        <TabsContent value="comments">
          <RequestComments requestId={request.id} />
        </TabsContent>

        {/* Attachments Tab */}
        <TabsContent value="attachments">
          <RequestAttachments requestId={request.id} />
        </TabsContent>
      </Tabs>
    </div>
  );
}


