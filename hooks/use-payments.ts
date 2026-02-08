'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import axios from '@/lib/axios';
import type { Payment, PaymentStatus, PaymentSourceType } from '@/types';

export interface PaymentFilters {
  sourceType?: PaymentSourceType;
  status?: PaymentStatus;
  projectId?: string;
  requestFormId?: string;
  payrollId?: string;
  payeeId?: string;
}

export function usePayments(filters?: PaymentFilters) {
  return useQuery({
    queryKey: ['payments', filters],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (filters?.sourceType) params.append('sourceType', filters.sourceType);
      if (filters?.status) params.append('status', filters.status);
      if (filters?.projectId) params.append('projectId', filters.projectId);
      if (filters?.requestFormId) params.append('requestFormId', filters.requestFormId);
      if (filters?.payrollId) params.append('payrollId', filters.payrollId);
      if (filters?.payeeId) params.append('payeeId', filters.payeeId);

      const queryString = params.toString();
      const url = queryString ? `/payments?${queryString}` : '/payments';
      const response = await axios.get(url);
      return response.data.data as Payment[];
    },
  });
}

export function usePayment(id: string | undefined) {
  return useQuery({
    queryKey: ['payment', id],
    queryFn: async () => {
      if (!id) return null;
      const response = await axios.get(`/payments/${id}`);
      return response.data.data as Payment;
    },
    enabled: !!id,
    retry: false,
  });
}

type CreatePaymentInput = {
  source: {
    type: PaymentSourceType;
    projectId?: string;
    requestFormId?: string;
    payrollId?: string;
  };
  currency: string;
  exchangeRate?: number;
  method: Payment['method'];
  status: PaymentStatus;
  paymentDate?: string;
  dueDate?: string;
  scheduledFor?: string;
  notes?: string;
  reference?: string;
  tags?: string[];
  requiresApproval?: boolean;
  payeeId?: string;
  payeeFullName?: string;
  payeePhone?: string;
  payerAccountId: string;
  submittedById?: string;
  approverIds?: string[];
  items?: Array<{
    description: string;
    quantity: number;
    unitPrice: number;
    currency?: string;
    taxRate?: number;
    taxAmount?: number;
    total?: number;
    requestFormItemId?: string;
    metadata?: Record<string, unknown>;
  }>;
  installments?: Array<{
    dueDate: string;
    amount: number;
    status?: 'pending' | 'paid' | 'overdue' | 'voided';
    paidAt?: string;
    reference?: string;
    notes?: string;
  }>;
  attachments?: string[];
  isRecurring?: boolean;
  recurrenceTemplateId?: string;
  balanceOutstanding?: number;
  amount?: number;
  taxAmount?: number;
  totalAmount?: number;
  fxAppliedAmount?: number;
  ledgerEntryIds?: string[];
  derivedFromRequestFormItems?: boolean;
};

export function useCreatePayment() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (payload: CreatePaymentInput) => {
      const response = await axios.post('/payments', payload);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['payments'] });
    },
  });
}

export function useApprovePayment(paymentId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (payload: {
      approvalId: string;
      userId: string;
      level?: string;
      action: 'approve' | 'reject';
      comments?: string;
    }) => {
      const response = await axios.post(`/payments/${paymentId}/approve`, {
        approvalId: payload.approvalId,
        userId: payload.userId,
        level: payload.level,
        action: payload.action,
        comments: payload.comments,
      });
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['payments'] });
      queryClient.invalidateQueries({ queryKey: ['payment', paymentId] });
      queryClient.invalidateQueries({ queryKey: ['pending-approvals'] });
    },
  });
}

export function useProcessPayment(paymentId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async () => {
      const response = await axios.post(`/payments/${paymentId}/process`);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['payments'] });
      queryClient.invalidateQueries({ queryKey: ['payment', paymentId] });
      queryClient.invalidateQueries({ queryKey: ['accounts'] });
    },
  });
}


