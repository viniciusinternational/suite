import { useQuery } from '@tanstack/react-query';
import axios from 'axios';
import type { AuditLog, AuditActionType, AuditEntityType } from '@/types';

interface UseAuditLogsParams {
  userId?: string;
  entityType?: AuditEntityType;
  actionType?: AuditActionType;
  entityId?: string;
  startDate?: Date;
  endDate?: Date;
  search?: string;
  isSuccessful?: boolean;
  limit?: number;
  offset?: number;
}

interface AuditLogsResponse {
  ok: boolean;
  data: AuditLog[];
  total: number;
  limit: number;
  offset: number;
}

export function useAuditLogs(params: UseAuditLogsParams = {}) {
  return useQuery({
    queryKey: ['audit-logs', params],
    queryFn: async () => {
      const searchParams = new URLSearchParams();
      
      if (params.userId) searchParams.append('userId', params.userId);
      if (params.entityType) searchParams.append('entityType', params.entityType);
      if (params.actionType) searchParams.append('actionType', params.actionType);
      if (params.entityId) searchParams.append('entityId', params.entityId);
      if (params.startDate) searchParams.append('startDate', params.startDate.toISOString());
      if (params.endDate) searchParams.append('endDate', params.endDate.toISOString());
      if (params.search) searchParams.append('search', params.search);
      if (params.isSuccessful !== undefined) searchParams.append('isSuccessful', String(params.isSuccessful));
      if (params.limit) searchParams.append('limit', String(params.limit));
      if (params.offset) searchParams.append('offset', String(params.offset));

      const response = await axios.get<AuditLogsResponse>(
        `/api/audit-logs?${searchParams.toString()}`
      );
      return response.data;
    },
  });
}

export function useUserAuditHistory(userId: string, limit = 50) {
  return useQuery({
    queryKey: ['audit-logs', 'user', userId, limit],
    queryFn: async () => {
      const response = await axios.get<AuditLogsResponse>(
        `/api/audit-logs?userId=${userId}&limit=${limit}`
      );
      return response.data;
    },
    enabled: !!userId,
  });
}

export function useEntityAuditHistory(entityType: AuditEntityType, entityId: string, limit = 50) {
  return useQuery({
    queryKey: ['audit-logs', 'entity', entityType, entityId, limit],
    queryFn: async () => {
      const response = await axios.get<AuditLogsResponse>(
        `/api/audit-logs?entityType=${entityType}&entityId=${entityId}&limit=${limit}`
      );
      return response.data;
    },
    enabled: !!entityType && !!entityId,
  });
}

