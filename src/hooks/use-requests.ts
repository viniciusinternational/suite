import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import axios from '@/lib/axios';
import type { RequestForm, RequestComment, RequestApproval } from '@/types';

interface RequestFilters {
  status?: string;
  type?: string;
  department?: string;
  requestedBy?: string;
  search?: string;
}

// GET /api/requests - List all requests
export function useRequests(filters?: RequestFilters) {
  return useQuery({
    queryKey: ['requests', filters],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (filters?.status) params.append('status', filters.status);
      if (filters?.type) params.append('type', filters.type);
      if (filters?.department) params.append('department', filters.department);
      if (filters?.requestedBy) params.append('requestedBy', filters.requestedBy);
      if (filters?.search) params.append('search', filters.search);

      const response = await axios.get(`/requests?${params.toString()}`);
      return response.data.data as RequestForm[];
    },
  });
}

// GET /api/requests/[id] - Get single request
export function useRequest(id: string | undefined) {
  return useQuery({
    queryKey: ['request', id],
    queryFn: async () => {
      if (!id) return null;
      const response = await axios.get(`/requests/${id}`);
      return response.data.data as RequestForm;
    },
    enabled: !!id,
  });
}

// POST /api/requests - Create request
export function useCreateRequest() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: any) => {
      const response = await axios.post('/requests', data);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['requests'] });
    },
  });
}

// PUT /api/requests/[id] - Update request
export function useUpdateRequest(id: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: any) => {
      const response = await axios.put(`/requests/${id}`, data);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['requests'] });
      queryClient.invalidateQueries({ queryKey: ['request', id] });
    },
  });
}

// DELETE /api/requests/[id] - Delete request
export function useDeleteRequest() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const response = await axios.delete(`/requests/${id}`);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['requests'] });
    },
  });
}

// GET /api/requests/[id]/comments - Get comments
export function useRequestComments(requestId: string | undefined) {
  return useQuery({
    queryKey: ['request-comments', requestId],
    queryFn: async () => {
      if (!requestId) return [];
      const response = await axios.get(`/requests/${requestId}/comments`);
      return response.data.data as RequestComment[];
    },
    enabled: !!requestId,
  });
}

// POST /api/requests/[id]/comments - Add comment
export function useAddComment(requestId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: { content: string; userId: string }) => {
      const response = await axios.post(`/requests/${requestId}/comments`, data);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['request-comments', requestId] });
      queryClient.invalidateQueries({ queryKey: ['request', requestId] });
    },
  });
}

// GET /api/requests/[id]/attachments - Get attachments
export function useRequestAttachments(requestId: string | undefined) {
  return useQuery({
    queryKey: ['request-attachments', requestId],
    queryFn: async () => {
      if (!requestId) return [];
      const response = await axios.get(`/requests/${requestId}/attachments`);
      return response.data.data as string[];
    },
    enabled: !!requestId,
  });
}

// POST /api/requests/[id]/attachments - Add attachment
export function useAddAttachment(requestId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: { attachmentUrl: string }) => {
      const response = await axios.post(`/requests/${requestId}/attachments`, data);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['request-attachments', requestId] });
      queryClient.invalidateQueries({ queryKey: ['request', requestId] });
    },
  });
}

// DELETE /api/requests/[id]/attachments - Remove attachment
export function useRemoveAttachment(requestId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (attachmentUrl: string) => {
      const response = await axios.delete(`/requests/${requestId}/attachments?url=${encodeURIComponent(attachmentUrl)}`);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['request-attachments', requestId] });
      queryClient.invalidateQueries({ queryKey: ['request', requestId] });
    },
  });
}

// POST /api/requests/[id]/approve - Approve/reject request
export function useApproveRequest(requestId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: { userId: string; level: 'dept_head' | 'admin_head'; action: 'approve' | 'reject'; comments?: string }) => {
      const response = await axios.post(`/requests/${requestId}/approve`, data);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['request', requestId] });
      queryClient.invalidateQueries({ queryKey: ['requests'] });
      queryClient.invalidateQueries({ queryKey: ['pending-approvals'] });
    },
  });
}

// GET /api/requests/approvals - Get pending approvals for current user
export function usePendingApprovals() {
  return useQuery({
    queryKey: ['pending-approvals'],
    queryFn: async () => {
      const response = await axios.get('/requests/approvals');
      return response.data.data as (RequestApproval & {
        requestForm: RequestForm;
      })[];
    },
  });
}


