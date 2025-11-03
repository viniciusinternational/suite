import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import axios from '@/lib/axios';

// Unified approval type
export interface UnifiedApproval {
  id: string;
  type: 'request' | 'project' | 'leave';
  approvalId: string;
  entityId: string;
  entityType: 'RequestForm' | 'Project' | 'LeaveRequest';
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

