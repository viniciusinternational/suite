import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import axios from '@/lib/axios'
import type { Memo } from '@/types'

interface MemoFilters {
  targetUserId?: string
  targetDepartmentId?: string
  isActive?: boolean
  priority?: string
}

export function useMemos(filters?: MemoFilters) {
  return useQuery({
    queryKey: ['memos', filters],
    queryFn: async () => {
      const params = new URLSearchParams()
      if (filters?.targetUserId) params.append('targetUserId', filters.targetUserId)
      if (filters?.targetDepartmentId) params.append('targetDepartmentId', filters.targetDepartmentId)
      if (filters?.isActive !== undefined) params.append('isActive', String(filters.isActive))
      if (filters?.priority) params.append('priority', filters.priority)
      const res = await axios.get(`/memos?${params.toString()}`)
      return res.data.data as Memo[]
    },
  })
}

export function useMemo(id: string | undefined) {
  return useQuery({
    queryKey: ['memo', id],
    queryFn: async () => {
      if (!id) return null
      const res = await axios.get(`/memos/${id}`)
      return res.data.data as Memo
    },
    enabled: !!id,
  })
}

export function useCreateMemo() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (data: any) => {
      const res = await axios.post('/memos', data)
      return res.data
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['memos'] })
    },
  })
}

export function useUpdateMemo(id: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (data: any) => {
      const res = await axios.patch(`/memos/${id}`, data)
      return res.data
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['memos'] })
      qc.invalidateQueries({ queryKey: ['memo', id] })
    },
  })
}

export function useDeleteMemo() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (id: string) => {
      const res = await axios.delete(`/memos/${id}`)
      return res.data
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['memos'] })
    },
  })
}


