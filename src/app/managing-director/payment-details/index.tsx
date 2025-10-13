'use client';

import React, { useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { mockPaymentMonitoring } from '../mockdata';
import { mockEmployees, mockDepartments } from '../../super-admin/mockdata';
import type { RequestForm, Item } from '@/types';
import { PaymentActionModal } from '@/components/ui/payment-action-modal';

const PaymentDetails = () => {
  const { paymentId } = useParams();
  const router = useRouter();
  const [isModalOpen, setIsModalOpen] = useState(false);
  
  // Find the payment from all payment statuses
  const payment = Object.values(mockPaymentMonitoring)
    .flatMap(status => status.payments)
    .find(p => p.id === paymentId);
  
  if (!payment) {
    return (
      <div className="p-6">
        <h1 className="text-2xl font-bold mb-4">Payment Not Found</h1>
        <Button onClick={() => router.back()}>Go Back</Button>
      </div>
    );
  }

  // Find related data
  const approver = payment.approvedBy ? mockEmployees.find(e => e.id === payment.approvedBy) : null;
  const paidBy = payment.paidBy ? mockEmployees.find(e => e.id === payment.paidBy) : null;

  // Helper function to get employee name
  const getEmployeeName = (id: string) => {
    const employee = mockEmployees.find(e => e.id === id);
    return employee ? `${employee.firstName} ${employee.lastName}` : 'Unknown';
  };

  // Helper function to get department name
  const getDepartmentName = (id: string) => {
    const department = mockDepartments.find(d => d.id === id);
    return department ? department.name : 'Unknown Department';
  };

  const handlePaymentAction = (action: 'approve' | 'reject', comments: string) => {
    // Here you would typically make an API call to update the payment status
    console.log('Payment action:', {
      paymentId: payment.id,
      action,
      comments
    });

    // For now, just log the action
    alert(`Payment ${payment.id} ${action}ed with comments: ${comments}`);
  };

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Payment Details</h1>
          <p className="text-muted-foreground">Payment ID: {payment.id}</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => router.back()}>
            Back
          </Button>
          {payment.status === 'pending' && (
            <Button
              variant="default"
              onClick={() => setIsModalOpen(true)}
            >
              Take Action
            </Button>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6">
        {/* Payment Overview */}
        <Card>
          <CardHeader>
            <CardTitle>Payment Overview</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div>
                <h4 className="font-medium mb-2">Status</h4>
                <Badge className="text-lg py-1">{payment.status}</Badge>
              </div>
              <div>
                <h4 className="font-medium mb-2">Total Amount</h4>
                <p className="text-2xl font-bold">${payment.total.toLocaleString()}</p>
              </div>
              <div>
                <h4 className="font-medium mb-2">Date</h4>
                <p className="text-lg">{payment.date}</p>
              </div>
            </div>

            <Separator />

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <h4 className="font-medium mb-2">Payment Details</h4>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Method:</span>
                    <span className="font-medium capitalize">
                      {payment.paymentMethod?.replace('_', ' ') || 'Not specified'}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Reference Number:</span>
                    <span className="font-medium">{payment.referenceNumber || 'Not specified'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Vendor ID:</span>
                    <span className="font-medium">{payment.vendorId || 'Not specified'}</span>
                  </div>
                </div>
              </div>

              <div>
                <h4 className="font-medium mb-2">Processing Information</h4>
                <div className="space-y-2">
                  {approver && (
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Approved By:</span>
                      <span className="font-medium">
                        {getEmployeeName(approver.id)}
                        <br />
                        <span className="text-sm text-muted-foreground">
                          on {new Date(payment.approvedAt || '').toLocaleString()}
                        </span>
                      </span>
                    </div>
                  )}
                  {paidBy && (
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Processed By:</span>
                      <span className="font-medium">
                        {getEmployeeName(paidBy.id)}
                        <br />
                        <span className="text-sm text-muted-foreground">
                          on {new Date(payment.paidAt || '').toLocaleString()}
                        </span>
                      </span>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {payment.notes && (
              <>
                <Separator />
                <div>
                  <h4 className="font-medium mb-2">Payment Notes</h4>
                  <p className="text-sm bg-muted p-3 rounded-md">{payment.notes}</p>
                </div>
              </>
            )}
          </CardContent>
        </Card>

        {/* Request Forms */}
        {payment.requestForms?.map((form: RequestForm) => (
          <Card key={form.id}>
            <CardHeader>
              <CardTitle>Request Form - {form.id}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Form Overview */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <h4 className="font-medium mb-2">Request Details</h4>
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Name:</span>
                      <span className="font-medium">{form.name}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Type:</span>
                      <span className="font-medium capitalize">{form.type.replace('_', ' ')}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Priority:</span>
                      <Badge variant={form.priority === 'high' ? 'destructive' : 'default'}>
                        {form.priority || 'Normal'}
                      </Badge>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Status:</span>
                      <Badge>{form.currentStatus}</Badge>
                    </div>
                  </div>
                </div>

                <div>
                  <h4 className="font-medium mb-2">Request Information</h4>
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Requested By:</span>
                      <span className="font-medium">{getEmployeeName(form.requestedBy)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Department:</span>
                      <span className="font-medium">{getDepartmentName(form.departmentId)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Request Date:</span>
                      <span className="font-medium">{form.requestDate}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Total Amount:</span>
                      <span className="font-medium">${form.totalAmount?.toLocaleString()}</span>
                    </div>
                  </div>
                </div>
              </div>

              <Separator />

              {/* Description */}
              <div>
                <h4 className="font-medium mb-2">Description</h4>
                <p className="text-sm bg-muted p-3 rounded-md">{form.description}</p>
              </div>

              {/* Approval Timeline */}
              <div>
                <h4 className="font-medium mb-4">Approval Timeline</h4>
                <div className="space-y-4">
                  <div className="flex items-center gap-4">
                    <Badge variant={form.approvedByDeptHeadId ? "default" : "secondary"}>
                      {form.approvedByDeptHeadId ? "✓" : "○"}
                    </Badge>
                    <div>
                      <p className="font-medium">Department Head Approval</p>
                      {form.approvedByDeptHeadId && (
                        <p className="text-sm text-muted-foreground">
                          Approved by {getEmployeeName(form.approvedByDeptHeadId)}
                        </p>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    <Badge variant={form.approvedByAdminId ? "default" : "secondary"}>
                      {form.approvedByAdminId ? "✓" : "○"}
                    </Badge>
                    <div>
                      <p className="font-medium">Administrator Approval</p>
                      {form.approvedByAdminId && (
                        <p className="text-sm text-muted-foreground">
                          Approved by {getEmployeeName(form.approvedByAdminId)}
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              {/* Form Items */}
              {form.items && form.items.length > 0 && (
                <>
                  <Separator />
                  <div>
                    <h4 className="font-medium mb-4">Request Items</h4>
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Name</TableHead>
                          <TableHead>Description</TableHead>
                          <TableHead>Quantity</TableHead>
                          <TableHead>Unit Price</TableHead>
                          <TableHead>Total</TableHead>
                          <TableHead>Vendor</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {form.items.map((item: Item) => (
                          <TableRow key={item.id}>
                            <TableCell className="font-medium">{item.name}</TableCell>
                            <TableCell>{item.description || 'N/A'}</TableCell>
                            <TableCell>{item.quantity}</TableCell>
                            <TableCell>${item.unitPrice.toLocaleString()}</TableCell>
                            <TableCell>${item.totalPrice.toLocaleString()}</TableCell>
                            <TableCell>{item.vendorId || 'N/A'}</TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                </>
              )}

              {/* Comments */}
              {form.comments && form.comments.length > 0 && (
                <>
                  <Separator />
                  <div>
                    <h4 className="font-medium mb-2">Comments History</h4>
                    <div className="space-y-2">
                      {form.comments.map((comment: string, index: number) => (
                        <div key={index} className="text-sm bg-muted p-3 rounded-md">
                          {comment}
                        </div>
                      ))}
                    </div>
                  </div>
                </>
              )}

              {/* Attachments */}
              {form.attachments && form.attachments.length > 0 && (
                <>
                  <Separator />
                  <div>
                    <h4 className="font-medium mb-2">Attachments</h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                      {form.attachments.map((attachment: string, index: number) => (
                        <a
                          key={index}
                          href={attachment}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center gap-2 bg-muted p-2 rounded-md text-sm hover:bg-muted/80"
                        >
                          <svg
                            className="h-4 w-4"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                            xmlns="http://www.w3.org/2000/svg"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13"
                            />
                          </svg>
                          {attachment.split('/').pop()}
                        </a>
                      ))}
                    </div>
                  </div>
                </>
              )}
            </CardContent>
          </Card>
        ))}

        {/* Payment Items */}
        <Card>
          <CardHeader>
            <CardTitle>Payment Items</CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Description</TableHead>
                  <TableHead>Quantity</TableHead>
                  <TableHead>Unit Price</TableHead>
                  <TableHead>Total</TableHead>
                  <TableHead>Vendor</TableHead>
                  <TableHead>Specifications</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {payment.items.map((item: Item) => (
                  <TableRow key={item.id}>
                    <TableCell className="font-medium">{item.name}</TableCell>
                    <TableCell>{item.description || 'N/A'}</TableCell>
                    <TableCell>{item.quantity}</TableCell>
                    <TableCell>${item.unitPrice.toLocaleString()}</TableCell>
                    <TableCell>${item.totalPrice.toLocaleString()}</TableCell>
                    <TableCell>{item.vendorId || 'N/A'}</TableCell>
                    <TableCell>{item.specifications || 'N/A'}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        {/* Payment Comments */}
        {payment.comments && payment.comments.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle>Payment Comments History</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {payment.comments.map((comment: string, index: number) => (
                  <div key={index} className="bg-muted p-4 rounded-lg">
                    <p className="text-sm">{comment}</p>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}
      </div>

      <PaymentActionModal
        payment={payment}
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onAction={handlePaymentAction}
      />
    </div>
  );
};

export default PaymentDetails; 