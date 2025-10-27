import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import axios from '@/lib/axios';
import type { Task } from '@/types';

interface TaskFilters {
  milestoneId?: string;
}

// GET /api/projects/[id]/tasks - List tasks
export function useTasks(projectId: string | undefined, filters?: TaskFilters) {
  return useQuery({
    queryKey: ['tasks', projectId, filters],
    queryFn: async () => {
      if (!projectId) return [];
      
      const params = new URLSearchParams();
      if (filters?.milestoneId && filters.milestoneId !== 'all') {
        params.append('milestoneId', filters.milestoneId);
      }

      const response = await axios.get(`/api/projects/${projectId}/tasks?${params.toString()}`);
      return response.data.data as Task[];
    },
    enabled: !!projectId,
  });
}

// POST /api/projects/[id]/tasks - Create task
export function useCreateTask(projectId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: any) => {
      const response = await axios.post(`/api/projects/${projectId}/tasks`, data);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tasks', projectId] });
      queryClient.invalidateQueries({ queryKey: ['project', projectId] });
    },
  });
}

// PUT /api/projects/[id]/tasks/[taskId] - Update task
export function useUpdateTask(projectId: string, taskId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: any) => {
      const response = await axios.put(`/api/projects/${projectId}/tasks/${taskId}`, data);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tasks', projectId] });
      queryClient.invalidateQueries({ queryKey: ['project', projectId] });
    },
  });
}

// DELETE /api/projects/[id]/tasks/[taskId] - Delete task
export function useDeleteTask(projectId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (taskId: string) => {
      const response = await axios.delete(`/api/projects/${projectId}/tasks/${taskId}`);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tasks', projectId] });
      queryClient.invalidateQueries({ queryKey: ['project', projectId] });
    },
  });
}

