import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import axios from '@/lib/axios';
import type { Milestone } from '@/types';

interface MilestoneFilters {
  status?: string;
  search?: string;
  startDate?: string;
  endDate?: string;
  page?: number;
  limit?: number;
}

interface MilestonePaginationResponse {
  data: Milestone[];
  pagination: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
  analytics: {
    total: number;
    completed: number;
    overdue: number;
    inProgress: number;
    totalBudget: number;
    totalSpent: number;
    averageProgress: number;
  };
}

// GET /api/projects/[id]/milestones - List milestones (legacy, for backward compatibility)
export function useMilestones(projectId: string | undefined) {
  return useQuery({
    queryKey: ['milestones', projectId],
    queryFn: async () => {
      if (!projectId) return [];
      const response = await axios.get(`/projects/${projectId}/milestones`);
      return response.data.data as Milestone[];
    },
    enabled: !!projectId,
  });
}

// GET /api/projects/[id]/milestones - List milestones with pagination and filters
export function useMilestonesWithPagination(
  projectId: string | undefined,
  filters?: MilestoneFilters
) {
  return useQuery({
    queryKey: ['milestones', projectId, filters],
    queryFn: async () => {
      if (!projectId) {
        return {
          data: [],
          pagination: { total: 0, page: 1, limit: 10, totalPages: 0 },
          analytics: {
            total: 0,
            completed: 0,
            overdue: 0,
            inProgress: 0,
            totalBudget: 0,
            totalSpent: 0,
            averageProgress: 0,
          },
        };
      }

      const params = new URLSearchParams();
      if (filters?.status) params.append('status', filters.status);
      if (filters?.search) params.append('search', filters.search);
      if (filters?.startDate) params.append('startDate', filters.startDate);
      if (filters?.endDate) params.append('endDate', filters.endDate);
      if (filters?.page) params.append('page', filters.page.toString());
      if (filters?.limit) params.append('limit', filters.limit.toString());

      const response = await axios.get(
        `/projects/${projectId}/milestones?${params.toString()}`
      );
      return response.data as MilestonePaginationResponse;
    },
    enabled: !!projectId,
  });
}

// POST /api/projects/[id]/milestones - Create milestone
export function useCreateMilestone(projectId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: any) => {
      const response = await axios.post(`/projects/${projectId}/milestones`, data);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['milestones', projectId] });
      queryClient.invalidateQueries({ queryKey: ['project', projectId] });
      queryClient.invalidateQueries({ queryKey: ['project', projectId, 'analytics'] });
    },
  });
}

// PUT /api/projects/[id]/milestones/[milestoneId] - Update milestone
export function useUpdateMilestone(projectId: string, milestoneId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: any) => {
      const response = await axios.put(`/projects/${projectId}/milestones/${milestoneId}`, data);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['milestones', projectId] });
      queryClient.invalidateQueries({ queryKey: ['project', projectId] });
      queryClient.invalidateQueries({ queryKey: ['project', projectId, 'analytics'] });
    },
  });
}

// DELETE /api/projects/[id]/milestones/[milestoneId] - Delete milestone
export function useDeleteMilestone(projectId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (milestoneId: string) => {
      const response = await axios.delete(`/projects/${projectId}/milestones/${milestoneId}`);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['milestones', projectId] });
      queryClient.invalidateQueries({ queryKey: ['project', projectId] });
      queryClient.invalidateQueries({ queryKey: ['project', projectId, 'analytics'] });
    },
  });
}

// Export types for use in components
export type { MilestoneFilters, MilestonePaginationResponse };

