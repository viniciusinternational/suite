import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import axios from '@/lib/axios'
import type { Event } from '@/types'

interface EventFilters {
  q?: string
  tag?: string
  start?: string
  end?: string
}

interface UseEventsOptions {
  enabled?: boolean
}

export function useEvents(filters?: EventFilters, options?: UseEventsOptions) {
  return useQuery({
    queryKey: ['events', filters],
    queryFn: async () => {
      const params = new URLSearchParams()
      if (filters?.q) params.append('q', filters.q)
      if (filters?.tag) params.append('tag', filters.tag)
      if (filters?.start) params.append('start', filters.start)
      if (filters?.end) params.append('end', filters.end)
      const res = await axios.get(`/events?${params.toString()}`)
      return res.data.data as Event[]
    },
    enabled: options?.enabled ?? true,
  })
}

export function useEvent(id: string | undefined) {
  return useQuery({
    queryKey: ['event', id],
    queryFn: async () => {
      if (!id) return null
      const res = await axios.get(`/events/${id}`)
      return res.data.data as Event
    },
    enabled: !!id,
  })
}

export function useCreateEvent() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (data: any) => {
      const res = await axios.post('/events', data)
      return res.data
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['events'] })
    },
  })
}

export function useUpdateEvent(id: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (data: any) => {
      const res = await axios.patch(`/events/${id}`, data)
      return res.data
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['events'] })
      qc.invalidateQueries({ queryKey: ['event', id] })
    },
  })
}

export function useDeleteEvent() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (id: string) => {
      const res = await axios.delete(`/events/${id}`)
      return res.data
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['events'] })
    },
  })
}


