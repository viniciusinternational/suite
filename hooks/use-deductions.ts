import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import axios from '@/lib/axios'
import type { Deduction } from '@/types'

interface DeductionFilters {
  global?: boolean
  active?: boolean
}

// GET /api/payroll/deductions - List all deductions
export function useDeductions(filters?: DeductionFilters) {
  return useQuery({
    queryKey: ['deductions', filters],
    queryFn: async () => {
      const params = new URLSearchParams()
      if (filters?.global !== undefined) params.append('global', String(filters.global))
      if (filters?.active !== undefined) params.append('active', String(filters.active))

      const response = await axios.get(`/payroll/deductions?${params.toString()}`)
      return response.data.data as Deduction[]
    },
  })
}

// GET /api/payroll/deductions/[id] - Get single deduction
export function useDeduction(id: string | undefined) {
  return useQuery({
    queryKey: ['deduction', id],
    queryFn: async () => {
      if (!id) return null
      const response = await axios.get(`/payroll/deductions/${id}`)
      return response.data.data as Deduction
    },
    enabled: !!id,
  })
}

// POST /api/payroll/deductions - Create deduction
export function useCreateDeduction() {
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
      const response = await axios.post('/payroll/deductions', data)
      return response.data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['deductions'] })
    },
  })
}

// PATCH /api/payroll/deductions/[id] - Update deduction
export function useUpdateDeduction(id: string) {
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
      const response = await axios.patch(`/payroll/deductions/${id}`, data)
      return response.data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['deductions'] })
      queryClient.invalidateQueries({ queryKey: ['deduction', id] })
    },
  })
}

// DELETE /api/payroll/deductions/[id] - Delete deduction
export function useDeleteDeduction() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (id: string) => {
      const response = await axios.delete(`/payroll/deductions/${id}`)
      return response.data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['deductions'] })
    },
  })
}

