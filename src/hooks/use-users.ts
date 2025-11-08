import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import axiosClient from '@/lib/axios';
import type { User, ZitadelUser } from '@/types';

interface UseUsersFilters {
  search?: string;
  department?: string;
  status?: string;
  includeInactive?: boolean;
}

// Fetch users from database
export function useUsers(filters?: UseUsersFilters) {
  return useQuery({
    queryKey: ['users', filters],
    queryFn: async () => {
      const params = new URLSearchParams();
      
      if (filters?.search) params.append('search', filters.search);
      if (filters?.department) params.append('department', filters.department);
      if (filters?.status) params.append('status', filters.status);
      if (filters?.includeInactive) params.append('includeInactive', 'true');

      const response = await axiosClient.get(`/users?${params.toString()}`);
      return response.data.data as User[];
    },
  });
}

// Fetch single user
export function useUser(userId: string) {
  return useQuery({
    queryKey: ['users', userId],
    queryFn: async () => {
      const response = await axiosClient.get(`/users/${userId}`);
      return response.data.data as User;
    },
    enabled: !!userId,
  });
}

// Fetch Zitadel users for selection
export function useZitadelUsers(search?: string) {
  return useQuery({
    queryKey: ['zitadel-users', search],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (search) params.append('search', search);
      params.append('limit', '50');

      const response = await axiosClient.get(`/users/zitadel?${params.toString()}`);
      return response.data.data as ZitadelUser[];
    },
  });
}

// Create user mutation
export function useCreateUser() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (userData: Partial<User>) => {
      const response = await axiosClient.post('/users', userData);
      return response.data.data as User;
    },
    onSuccess: () => {
      // Invalidate users list
      queryClient.invalidateQueries({ queryKey: ['users'] });
    },
  });
}

// Update user mutation
export function useUpdateUser() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, data }: { id: string; data: Partial<User> }) => {
      const response = await axiosClient.put(`/users/${id}`, data);
      return response.data.data as User;
    },
    onSuccess: (data) => {
      // Invalidate users list and specific user
      queryClient.invalidateQueries({ queryKey: ['users'] });
      queryClient.invalidateQueries({ queryKey: ['users', data.id] });
    },
  });
}

// Delete user mutation (soft delete)
export function useDeleteUser() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (userId: string) => {
      const response = await axiosClient.delete(`/users/${userId}`);
      return response.data.data as User;
    },
    onSuccess: () => {
      // Invalidate users list
      queryClient.invalidateQueries({ queryKey: ['users'] });
    },
  });
}
