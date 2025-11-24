import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import axios from '@/lib/axios';
import type { Comment } from '@/types';

export function useDocumentComments(documentId: string | undefined) {
  return useQuery({
    queryKey: ['documentComments', documentId],
    queryFn: async () => {
      if (!documentId) return [];
      const res = await axios.get(`/documents/${documentId}/comments`);
      return res.data.data as Comment[];
    },
    enabled: !!documentId,
  });
}

export function useCreateDocumentComment(documentId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (data: { note: string; userId: string }) => {
      const res = await axios.post(`/documents/${documentId}/comments`, data);
      return res.data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['documentComments', documentId] });
      qc.invalidateQueries({ queryKey: ['document', documentId] });
    },
  });
}

export function useUpdateDocumentComment(documentId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ commentId, note }: { commentId: string; note: string }) => {
      const res = await axios.put(`/documents/${documentId}/comments/${commentId}`, { note });
      return res.data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['documentComments', documentId] });
      qc.invalidateQueries({ queryKey: ['document', documentId] });
    },
  });
}

export function useDeleteDocumentComment(documentId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (commentId: string) => {
      const res = await axios.delete(`/documents/${documentId}/comments/${commentId}`);
      return res.data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['documentComments', documentId] });
      qc.invalidateQueries({ queryKey: ['document', documentId] });
    },
  });
}

