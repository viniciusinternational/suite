import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import axios from '@/lib/axios';
import type { PermissionKey } from '@/types';

// Unified approval type
export interface UnifiedApproval {
  id: string;
  type: 'request' | 'project' | 'leave' | 'payroll' | 'payment';
  approvalId: string;
  entityId: string;
  entityType: 'RequestForm' | 'Project' | 'LeaveRequest' | 'Payroll' | 'Payment';
  level: string;
  status: 'pending' | 'approved' | 'rejected';
  actionDate?: string;
  comments?: string;
  createdAt: string;
  updatedAt: string;
  approver: {
    id: string;
    fullName: string;
    email: string;
    role?: string;
  };
  entity: any; // RequestForm or Project entity
}

// GET /api/approvals - Get all pending approvals for current user
export function usePendingApprovals() {
  return useQuery({
    queryKey: ['pending-approvals'],
    queryFn: async () => {
      const response = await axios.get('/approvals');
      return response.data.data as UnifiedApproval[];
    },
  });
}

// POST /api/approvals/[id] - Approve/reject unified approval
export function useApproveAction(approvalId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: {
      type: 'request' | 'project' | 'leave';
      userId: string;
      level?: string;
      action: 'approve' | 'reject';
      comments?: string;
    }) => {
      const response = await axios.post(`/approvals/${approvalId}`, data);
      return response.data;
    },
    onSuccess: (data, variables) => {
      // Invalidate all relevant queries
      queryClient.invalidateQueries({ queryKey: ['pending-approvals'] });
      
      if (variables.type === 'request') {
        queryClient.invalidateQueries({ queryKey: ['requests'] });
        if (data?.data?.id) {
          queryClient.invalidateQueries({ queryKey: ['request', data.data.id] });
        }
      } else if (variables.type === 'project') {
        queryClient.invalidateQueries({ queryKey: ['projects'] });
        if (data?.data?.id) {
          queryClient.invalidateQueries({ queryKey: ['project', data.data.id] });
        }
      }
    },
  });
}

interface AvailableApproverFilters {
  search?: string;
  permission?: PermissionKey;
  enabled?: boolean;
}

export function useAvailableApprovers(filters?: AvailableApproverFilters) {
  const params = new URLSearchParams();

  if (filters?.search) params.append('search', filters.search);
  if (filters?.permission) params.append('permission', filters.permission);

  const queryKey: (string | AvailableApproverFilters | undefined)[] = [
    'available-approvers',
    filters?.search,
    filters?.permission,
  ];

  return useQuery({
    queryKey,
    queryFn: async () => {
      const response = await axios.get(
        `/approvals/available-approvers${params.toString() ? `?${params.toString()}` : ''}`
      );
      return response.data.data as {
        id: string;
        fullName: string;
        email: string;
        role: string;
        permissions?: Record<string, boolean>;
      }[];
    },
    enabled: filters?.enabled !== false,
  });
}

export function useAddApprover(approvalId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: {
      type: 'request' | 'project' | 'payroll' | 'payment';
      actorId: string;
      newApproverId: string;
      level?: string;
      canAddApprovers?: boolean;
    }) => {
      const response = await axios.post(`/approvals/${approvalId}/add-approver`, data);
      return response.data;
    },
    onSuccess: (response, variables) => {
      const entityId = response?.data?.id as string | undefined;

      queryClient.invalidateQueries({ queryKey: ['pending-approvals'] });

      switch (variables.type) {
        case 'request':
          queryClient.invalidateQueries({ queryKey: ['requests'] });
          if (entityId) {
            queryClient.invalidateQueries({ queryKey: ['request', entityId] });
          }
          break;
        case 'project':
          queryClient.invalidateQueries({ queryKey: ['projects'] });
          if (entityId) {
            queryClient.invalidateQueries({ queryKey: ['project', entityId] });
          }
          break;
        case 'payroll':
          queryClient.invalidateQueries({ queryKey: ['payrolls'] });
          if (entityId) {
            queryClient.invalidateQueries({ queryKey: ['payroll', entityId] });
          }
          break;
        case 'payment':
          queryClient.invalidateQueries({ queryKey: ['payments'] });
          if (entityId) {
            queryClient.invalidateQueries({ queryKey: ['payment', entityId] });
          }
          break;
        default:
          break;
      }
    },
  });
}

