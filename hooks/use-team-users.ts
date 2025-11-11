import { useMutation, useQueryClient } from '@tanstack/react-query'
import axios from '@/lib/axios'

export function useAddUsersToTeam(teamId: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (data: { userIds: string[] }) => {
      const res = await axios.post(`/teams/${teamId}/users`, data)
      return res.data
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['teams'] })
      qc.invalidateQueries({ queryKey: ['team', teamId] })
    },
  })
}

export function useRemoveUserFromTeam(teamId: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (userId: string) => {
      const res = await axios.delete(`/teams/${teamId}/users?userId=${userId}`)
      return res.data
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['teams'] })
      qc.invalidateQueries({ queryKey: ['team', teamId] })
    },
  })
}

