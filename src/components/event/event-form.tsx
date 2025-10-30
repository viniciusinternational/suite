'use client';

import { useEffect, useMemo, useState } from 'react'
import { useForm } from 'react-hook-form'
import { z } from 'zod'
import { zodResolver } from '@hookform/resolvers/zod'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { useCreateEvent, useUpdateEvent } from '@/hooks/use-events'
import axios from '@/lib/axios'
import type { Department, DepartmentUnit, Event, User } from '@/types'

const schema = z.object({
  title: z.string().min(1, 'Title is required'),
  description: z.string().optional(),
  tags: z.string().optional(), // comma-separated
  link: z.string().url().optional().or(z.literal('')).optional(),
  startDateTime: z.string().min(1, 'Start is required'),
  endDateTime: z.string().min(1, 'End is required'),
  userIds: z.array(z.string()).optional(),
  departmentIds: z.array(z.string()).optional(),
  unitIds: z.array(z.string()).optional(),
})

type FormValues = z.infer<typeof schema>

interface Props {
  event?: Event | null
  onSuccess?: () => void
}

export function EventForm({ event, onSuccess }: Props) {
  const [users, setUsers] = useState<User[]>([])
  const [departments, setDepartments] = useState<Department[]>([])
  const [units, setUnits] = useState<DepartmentUnit[]>([])

  const createMutation = useCreateEvent()
  const updateMutation = useUpdateEvent(event?.id || '')

  const form = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      title: event?.title || '',
      description: event?.description || '',
      tags: (event?.tags || []).join(', '),
      link: event?.link || '',
      startDateTime: event?.startDateTime ? new Date(event.startDateTime).toISOString().slice(0,16) : '',
      endDateTime: event?.endDateTime ? new Date(event.endDateTime).toISOString().slice(0,16) : '',
      userIds: (event?.users || []).map(u => u.id),
      departmentIds: (event?.departments || []).map(d => d.id),
      unitIds: (event?.units || []).map(u => u.id),
    },
  })

  useEffect(() => {
    // Load users, departments, units
    (async () => {
      const [usersRes, deptRes] = await Promise.all([
        axios.get('/users'),
        axios.get('/departments'),
      ])
      setUsers(usersRes.data.data || [])
      setDepartments(deptRes.data.data || [])
      const allUnits = (deptRes.data.data || []).flatMap((d: any) => d.units || [])
      setUnits(allUnits)
    })()
  }, [])

  const onSubmit = async (values: FormValues) => {
    const payload = {
      title: values.title,
      description: values.description || undefined,
      tags: values.tags ? values.tags.split(',').map(t => t.trim()).filter(Boolean) : [],
      link: values.link || undefined,
      startDateTime: new Date(values.startDateTime).toISOString(),
      endDateTime: new Date(values.endDateTime).toISOString(),
      userIds: values.userIds || [],
      departmentIds: values.departmentIds || [],
      unitIds: values.unitIds || [],
    }

    if (event?.id) {
      await updateMutation.mutateAsync(payload)
    } else {
      await createMutation.mutateAsync(payload)
    }
    onSuccess?.()
  }

  return (
    <form className="space-y-4" onSubmit={form.handleSubmit(onSubmit)}>
      <div>
        <Label>Title</Label>
        <Input {...form.register('title')} placeholder="Event title" />
      </div>
      <div>
        <Label>Description</Label>
        <Textarea {...form.register('description')} placeholder="Details about the event" />
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <Label>Start</Label>
          <Input type="datetime-local" {...form.register('startDateTime')} />
        </div>
        <div>
          <Label>End</Label>
          <Input type="datetime-local" {...form.register('endDateTime')} />
        </div>
      </div>
      <div>
        <Label>Tags (comma separated)</Label>
        <Input {...form.register('tags')} placeholder="workshop, training" />
      </div>
      <div>
        <Label>Link</Label>
        <Input {...form.register('link')} placeholder="https://..." />
      </div>

      {/* Targets */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div>
          <Label>Users</Label>
          <div className="border rounded-md p-2 max-h-40 overflow-y-auto">
            {users.map(u => (
              <label key={u.id} className="flex items-center space-x-2 py-1">
                <input
                  type="checkbox"
                  value={u.id}
                  checked={form.watch('userIds')?.includes(u.id) || false}
                  onChange={(e) => {
                    const curr = new Set(form.getValues('userIds') || [])
                    if (e.target.checked) curr.add(u.id); else curr.delete(u.id)
                    form.setValue('userIds', Array.from(curr))
                  }}
                />
                <span className="text-sm">{u.fullName}</span>
              </label>
            ))}
          </div>
        </div>

        <div>
          <Label>Departments</Label>
          <div className="border rounded-md p-2 max-h-40 overflow-y-auto">
            {departments.map(d => (
              <label key={d.id} className="flex items-center space-x-2 py-1">
                <input
                  type="checkbox"
                  value={d.id}
                  checked={form.watch('departmentIds')?.includes(d.id) || false}
                  onChange={(e) => {
                    const curr = new Set(form.getValues('departmentIds') || [])
                    if (e.target.checked) curr.add(d.id); else curr.delete(d.id)
                    form.setValue('departmentIds', Array.from(curr))
                  }}
                />
                <span className="text-sm">{d.name}</span>
              </label>
            ))}
          </div>
        </div>

        <div>
          <Label>Units</Label>
          <div className="border rounded-md p-2 max-h-40 overflow-y-auto">
            {units.map(u => (
              <label key={u.id} className="flex items-center space-x-2 py-1">
                <input
                  type="checkbox"
                  value={u.id}
                  checked={form.watch('unitIds')?.includes(u.id) || false}
                  onChange={(e) => {
                    const curr = new Set(form.getValues('unitIds') || [])
                    if (e.target.checked) curr.add(u.id); else curr.delete(u.id)
                    form.setValue('unitIds', Array.from(curr))
                  }}
                />
                <span className="text-sm">{u.name}</span>
              </label>
            ))}
          </div>
        </div>
      </div>

      <div className="flex justify-end">
        <Button type="submit" disabled={createMutation.isPending || updateMutation.isPending}>
          {event?.id ? 'Save Changes' : 'Create Event'}
        </Button>
      </div>
    </form>
  )
}


