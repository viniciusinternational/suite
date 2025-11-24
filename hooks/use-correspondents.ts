import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import axios from '@/lib/axios';
import type { Correspondent } from '@/types';

export function useCorrespondents() {
  return useQuery({
    queryKey: ['correspondents'],
    queryFn: async () => {
      const res = await axios.get('/correspondents');
      return res.data.data as Correspondent[];
    },
  });
}

export function useCorrespondent(id: string | undefined) {
  return useQuery({
    queryKey: ['correspondent', id],
    queryFn: async () => {
      if (!id) return null;
      const res = await axios.get(`/correspondents/${id}`);
      return res.data.data as Correspondent;
    },
    enabled: !!id,
  });
}

export function useCreateCorrespondent() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (data: any) => {
      const res = await axios.post('/correspondents', data);
      return res.data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['correspondents'] });
    },
  });
}

export function useUpdateCorrespondent(id: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (data: any) => {
      const res = await axios.put(`/correspondents/${id}`, data);
      return res.data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['correspondents'] });
      qc.invalidateQueries({ queryKey: ['correspondent', id] });
    },
  });
}

export function useDeleteCorrespondent() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const res = await axios.delete(`/correspondents/${id}`);
      return res.data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['correspondents'] });
    },
  });
}

