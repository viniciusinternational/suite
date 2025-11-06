import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import axios from '@/lib/axios'
import type { Allowance } from '@/types'

interface AllowanceFilters {
  global?: boolean
  active?: boolean
}

// GET /api/payroll/allowances - List all allowances
export function useAllowances(filters?: AllowanceFilters) {
  return useQuery({
    queryKey: ['allowances', filters],
    queryFn: async () => {
      const params = new URLSearchParams()
      if (filters?.global !== undefined) params.append('global', String(filters.global))
      if (filters?.active !== undefined) params.append('active', String(filters.active))

      const response = await axios.get(`/payroll/allowances?${params.toString()}`)
      return response.data.data as Allowance[]
    },
  })
}

// GET /api/payroll/allowances/[id] - Get single allowance
export function useAllowance(id: string | undefined) {
  return useQuery({
    queryKey: ['allowance', id],
    queryFn: async () => {
      if (!id) return null
      const response = await axios.get(`/payroll/allowances/${id}`)
      return response.data.data as Allowance
    },
    enabled: !!id,
  })
}

// POST /api/payroll/allowances - Create allowance
export function useCreateAllowance() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (data: {
      title: string
      description?: string
      startDate?: string
      endDate?: string
      always: boolean
      amount?: number | null
      percent?: number | null
      global: boolean
      userIds?: string[]
      departmentIds?: string[]
    }) => {
      const response = await axios.post('/payroll/allowances', data)
      return response.data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['allowances'] })
    },
  })
}

// PATCH /api/payroll/allowances/[id] - Update allowance
export function useUpdateAllowance(id: string) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (data: {
      title?: string
      description?: string
      startDate?: string
      endDate?: string
      always?: boolean
      amount?: number | null
      percent?: number | null
      global?: boolean
      userIds?: string[]
      departmentIds?: string[]
    }) => {
      const response = await axios.patch(`/payroll/allowances/${id}`, data)
      return response.data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['allowances'] })
      queryClient.invalidateQueries({ queryKey: ['allowance', id] })
    },
  })
}

// DELETE /api/payroll/allowances/[id] - Delete allowance
export function useDeleteAllowance() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (id: string) => {
      const response = await axios.delete(`/payroll/allowances/${id}`)
      return response.data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['allowances'] })
    },
  })
}

