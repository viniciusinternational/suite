import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import axios from '@/lib/axios';
import type { DocumentType } from '@/types';

export function useDocumentTypes() {
  return useQuery({
    queryKey: ['documentTypes'],
    queryFn: async () => {
      const res = await axios.get('/document-types');
      return res.data.data as DocumentType[];
    },
  });
}

export function useDocumentType(id: string | undefined) {
  return useQuery({
    queryKey: ['documentType', id],
    queryFn: async () => {
      if (!id) return null;
      const res = await axios.get(`/document-types/${id}`);
      return res.data.data as DocumentType;
    },
    enabled: !!id,
  });
}

export function useCreateDocumentType() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (data: any) => {
      const res = await axios.post('/document-types', data);
      return res.data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['documentTypes'] });
    },
  });
}

export function useUpdateDocumentType(id: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (data: any) => {
      const res = await axios.put(`/document-types/${id}`, data);
      return res.data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['documentTypes'] });
      qc.invalidateQueries({ queryKey: ['documentType', id] });
    },
  });
}

export function useDeleteDocumentType() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const res = await axios.delete(`/document-types/${id}`);
      return res.data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['documentTypes'] });
    },
  });
}

