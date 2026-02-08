'use client';

import { useQuery } from '@tanstack/react-query';
import axios from '@/lib/axios';
import type { AccountTransaction } from '@/types';

export interface AccountTransactionsFilters {
  page?: number;
  limit?: number;
}

export function useAccountTransactions(
  accountId: string | undefined,
  filters?: AccountTransactionsFilters
) {
  return useQuery({
    queryKey: ['account-transactions', accountId, filters],
    queryFn: async () => {
      if (!accountId) return { data: [], pagination: { page: 1, limit: 50, total: 0, totalPages: 0 } };
      const params = new URLSearchParams();
      if (filters?.page) params.append('page', String(filters.page));
      if (filters?.limit) params.append('limit', String(filters.limit));

      const url = params.toString()
        ? `/accounts/${accountId}/transactions?${params.toString()}`
        : `/accounts/${accountId}/transactions`;
      const response = await axios.get(url);
      return {
        data: response.data.data as AccountTransaction[],
        pagination: response.data.pagination,
      };
    },
    enabled: !!accountId,
  });
}
