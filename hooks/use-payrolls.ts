import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import axios from '@/lib/axios'
import type { Payroll } from '@/types'

interface PayrollFilters {
  periodMonth?: number
  periodYear?: number
  status?: 'draft' | 'processed' | 'paid'
}

// GET /api/payroll - List all payrolls
export function usePayrolls(filters?: PayrollFilters) {
  return useQuery({
    queryKey: ['payrolls', filters],
    queryFn: async () => {
      const params = new URLSearchParams()
      if (filters?.periodMonth) params.append('periodMonth', String(filters.periodMonth))
      if (filters?.periodYear) params.append('periodYear', String(filters.periodYear))
      if (filters?.status) params.append('status', filters.status)

      const response = await axios.get(`/payroll?${params.toString()}`)
      return response.data.data as Payroll[]
    },
  })
}

// GET /api/payroll/[id] - Get single payroll
export function usePayroll(id: string | undefined) {
  return useQuery({
    queryKey: ['payroll', id],
    queryFn: async () => {
      if (!id) return null
      const response = await axios.get(`/payroll/${id}`)
      return response.data.data as Payroll
    },
    enabled: !!id,
  })
}

// POST /api/payroll - Create payroll
export function useCreatePayroll() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (data: {
      periodMonth: number
      periodYear: number
      entries: Array<{
        userId: string
        baseSalary: number
        deductions: number
        allowances: number
      }>
    }) => {
      const response = await axios.post('/payroll', data)
      return response.data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['payrolls'] })
    },
  })
}

// POST /api/payroll/create - Create payroll with auto-calculation and tracking
export function useCreatePayrollWithTracking() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (data: {
      periodMonth: number
      periodYear: number
      entries: Array<{
        userId: string
        baseSalary: number
        deductions: number
        allowances: number
        deductionApplications?: Array<{
          deductionId: string
          sourceAmount: number
          calculatedAmount: number
        }>
        allowanceApplications?: Array<{
          allowanceId: string
          sourceAmount: number
          calculatedAmount: number
        }>
      }>
    }) => {
      const response = await axios.post('/payroll/create', data)
      return response.data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['payrolls'] })
    },
  })
}

// PATCH /api/payroll/[id] - Update payroll
export function useUpdatePayroll(id: string) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (data: {
      status?: 'draft' | 'processed' | 'paid'
      entries?: Array<{
        userId: string
        baseSalary: number
        deductions: number
        allowances: number
      }>
    }) => {
      const response = await axios.patch(`/payroll/${id}`, data)
      return response.data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['payrolls'] })
      queryClient.invalidateQueries({ queryKey: ['payroll', id] })
    },
  })
}

// DELETE /api/payroll/[id] - Delete payroll
export function useDeletePayroll() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (id: string) => {
      const response = await axios.delete(`/payroll/${id}`)
      return response.data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['payrolls'] })
    },
  })
}

// POST /api/payroll/[id]/approve - Approve/reject payroll
export function useApprovePayroll() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (data: {
      payrollId: string
      approvalId: string
      level: 'dept_head' | 'admin_head' | 'accountant'
      action: 'approve' | 'reject'
      comments?: string
      userId: string
    }) => {
      const response = await axios.post(`/payroll/${data.payrollId}/approve`, {
        userId: data.userId,
        level: data.level,
        action: data.action,
        comments: data.comments,
      })
      return response.data
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['payrolls'] })
      queryClient.invalidateQueries({ queryKey: ['payroll', variables.payrollId] })
    },
  })
}

