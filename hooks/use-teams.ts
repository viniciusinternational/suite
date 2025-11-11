import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import axios from '@/lib/axios'
import type { Team } from '@/types'

interface TeamFilters {
  q?: string
  includeInactive?: boolean
}

export function useTeams(filters?: TeamFilters) {
  return useQuery({
    queryKey: ['teams', filters],
    queryFn: async () => {
      const params = new URLSearchParams()
      if (filters?.q) params.append('q', filters.q)
      if (filters?.includeInactive) params.append('includeInactive', 'true')
      const res = await axios.get(`/teams?${params.toString()}`)
      return res.data.data as Team[]
    },
  })
}

export function useTeam(id: string | undefined) {
  return useQuery({
    queryKey: ['team', id],
    queryFn: async () => {
      if (!id) return null
      const res = await axios.get(`/teams/${id}`)
      return res.data.data as Team
    },
    enabled: !!id,
  })
}

export function useCreateTeam() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (data: any) => {
      const res = await axios.post('/teams', data)
      return res.data
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['teams'] })
    },
  })
}

export function useUpdateTeam(id: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (data: any) => {
      const res = await axios.put(`/teams/${id}`, data)
      return res.data
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['teams'] })
      qc.invalidateQueries({ queryKey: ['team', id] })
    },
  })
}

export function useDeleteTeam() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (id: string) => {
      const res = await axios.delete(`/teams/${id}`)
      return res.data
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['teams'] })
    },
  })
}

