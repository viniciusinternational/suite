import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import axios from '@/lib/axios'
import type { UserAllowance } from '@/types'

// GET /api/payroll/user-allowances/[userId] - Get user allowances
export function useUserAllowances(userId: string | undefined, filters?: { isActive?: boolean }) {
  return useQuery({
    queryKey: ['user-allowances', userId, filters],
    queryFn: async () => {
      if (!userId) return []
      const params = new URLSearchParams()
      if (filters?.isActive !== undefined) {
        params.append('isActive', String(filters.isActive))
      }

      const response = await axios.get(`/payroll/user-allowances/${userId}?${params.toString()}`)
      return response.data.data as UserAllowance[]
    },
    enabled: !!userId,
  })
}

// POST /api/payroll/user-allowances/[userId] - Create user allowance
export function useCreateUserAllowance() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async ({ userId, data }: { userId: string; data: { name: string; amount: number; isActive?: boolean } }) => {
      const response = await axios.post(`/payroll/user-allowances/${userId}`, data)
      return response.data
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['user-allowances', variables.userId] })
    },
  })
}

// PATCH /api/payroll/allowance/[id] - Update user allowance
export function useUpdateUserAllowance() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async ({ id, data }: { id: string; data: { name?: string; amount?: number; isActive?: boolean } }) => {
      const response = await axios.patch(`/payroll/allowance/${id}`, data)
      return response.data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['user-allowances'] })
    },
  })
}

// DELETE /api/payroll/allowance/[id] - Delete user allowance
export function useDeleteUserAllowance() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (id: string) => {
      const response = await axios.delete(`/payroll/allowance/${id}`)
      return response.data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['user-allowances'] })
    },
  })
}

