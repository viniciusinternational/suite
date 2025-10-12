// src/hooks/useApi.ts
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/utils";

// Generic reusable hook
export function useApi<T extends { id?: string }>(resource: string) {
  const queryClient = useQueryClient();

  const useGetAll = (params?: any) =>
    useQuery<T[]>({
      queryKey: [resource, params],
      queryFn: () => api.get<T[]>(`/${resource}`, params),
    });

  const useGetById = (id: string) =>
    useQuery<T>({
      queryKey: [resource, id],
      queryFn: () => api.get<T>(`/${resource}/${id}`),
      enabled: !!id,
    });

  const useCreate = () =>
    useMutation({
      mutationFn: (data: Partial<T>) => api.post<T>(`/${resource}`, data),
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: [resource] });
      },
    });

  const useUpdate = () =>
    useMutation({
      mutationFn: (data: T) => api.put<T>(`/${resource}/${data.id}`, data),
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: [resource] });
      },
    });

  const useDelete = () =>
    useMutation({
      mutationFn: (id: string) => api.delete<T>(`/${resource}/${id}`),
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: [resource] });
      },
    });

  return { useGetAll, useGetById, useCreate, useUpdate, useDelete };
}
