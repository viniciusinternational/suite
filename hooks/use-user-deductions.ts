import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import axios from '@/lib/axios'
import type { UserDeduction } from '@/types'

// GET /api/payroll/user-deductions/[userId] - Get user deductions
export function useUserDeductions(userId: string | undefined, filters?: { isActive?: boolean }) {
  return useQuery({
    queryKey: ['user-deductions', userId, filters],
    queryFn: async () => {
      if (!userId) return []
      const params = new URLSearchParams()
      if (filters?.isActive !== undefined) {
        params.append('isActive', String(filters.isActive))
      }

      const response = await axios.get(`/payroll/user-deductions/${userId}?${params.toString()}`)
      return response.data.data as UserDeduction[]
    },
    enabled: !!userId,
  })
}

// POST /api/payroll/user-deductions/[userId] - Create user deduction
export function useCreateUserDeduction() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async ({ userId, data }: { userId: string; data: { name: string; amount: number; isActive?: boolean } }) => {
      const response = await axios.post(`/payroll/user-deductions/${userId}`, data)
      return response.data
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['user-deductions', variables.userId] })
    },
  })
}

// PATCH /api/payroll/deduction/[id] - Update user deduction
export function useUpdateUserDeduction() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async ({ id, data }: { id: string; data: { name?: string; amount?: number; isActive?: boolean } }) => {
      const response = await axios.patch(`/payroll/deduction/${id}`, data)
      return response.data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['user-deductions'] })
    },
  })
}

// DELETE /api/payroll/deduction/[id] - Delete user deduction
export function useDeleteUserDeduction() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (id: string) => {
      const response = await axios.delete(`/payroll/deduction/${id}`)
      return response.data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['user-deductions'] })
    },
  })
}

