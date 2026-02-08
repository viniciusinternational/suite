'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import axios from '@/lib/axios';
import type { Account } from '@/types';

export interface AccountFilters {
  isActive?: boolean | string;
  search?: string;
}

export function useAccounts(filters?: AccountFilters) {
  return useQuery({
    queryKey: ['accounts', filters],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (filters?.isActive !== undefined && filters?.isActive !== '')
        params.append('isActive', String(filters.isActive));
      if (filters?.search) params.append('search', filters.search);

      const url = params.toString() ? `/accounts?${params.toString()}` : '/accounts';
      const response = await axios.get(url);
      return response.data.data as Account[];
    },
  });
}

export function useAccount(id: string | undefined) {
  return useQuery({
    queryKey: ['account', id],
    queryFn: async () => {
      if (!id) return null;
      const response = await axios.get(`/accounts/${id}`);
      return response.data.data as Account;
    },
    enabled: !!id,
  });
}

export function useCreateAccount() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: {
      name: string;
      code: string;
      currency: string;
      description?: string;
      allowNegativeBalance?: boolean;
      isActive?: boolean;
    }) => {
      const response = await axios.post('/accounts', data);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['accounts'] });
    },
  });
}

export function useUpdateAccount(id: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: Partial<{
      name: string;
      code: string;
      currency: string;
      description: string | null;
      allowNegativeBalance: boolean;
      isActive: boolean;
    }>) => {
      const response = await axios.patch(`/accounts/${id}`, data);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['accounts'] });
      queryClient.invalidateQueries({ queryKey: ['account', id] });
    },
  });
}

export function useDeactivateAccount(id: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async () => {
      const response = await axios.delete(`/accounts/${id}`);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['accounts'] });
      queryClient.invalidateQueries({ queryKey: ['account', id] });
    },
  });
}

export function useAddFunds(accountId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: { amount: number; description?: string; reference?: string }) => {
      const response = await axios.post(`/accounts/${accountId}/add-funds`, data);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['accounts'] });
      queryClient.invalidateQueries({ queryKey: ['account', accountId] });
      queryClient.invalidateQueries({ queryKey: ['account-transactions', accountId] });
    },
  });
}

export function useTransfer(accountId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: {
      toAccountId: string;
      amount: number;
      description?: string;
      reference?: string;
    }) => {
      const response = await axios.post(`/accounts/${accountId}/transfer`, data);
      return response.data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['accounts'] });
      queryClient.invalidateQueries({ queryKey: ['account', accountId] });
      queryClient.invalidateQueries({ queryKey: ['account', variables.toAccountId] });
      queryClient.invalidateQueries({ queryKey: ['account-transactions', accountId] });
      queryClient.invalidateQueries({ queryKey: ['account-transactions', variables.toAccountId] });
    },
  });
}
