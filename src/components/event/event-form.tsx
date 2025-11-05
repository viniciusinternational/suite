'use client';

import { useEffect, useState } from 'react'
import { useForm } from 'react-hook-form'
import { z } from 'zod'
import { zodResolver } from '@hookform/resolvers/zod'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { MultiSelect } from '@/components/ui/multi-select'
import { useCreateEvent, useUpdateEvent } from '@/hooks/use-events'
import axios from '@/lib/axios'
import type { Department, DepartmentUnit, Event, User } from '@/types'
import { X, Plus, Loader2 } from 'lucide-react'

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
  const [isLoadingUsers, setIsLoadingUsers] = useState(true)
  const [isLoadingDepartments, setIsLoadingDepartments] = useState(true)

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
      try {
        setIsLoadingUsers(true)
        setIsLoadingDepartments(true)
        const [usersRes, deptRes] = await Promise.all([
          axios.get('/users'),
          axios.get('/departments'),
        ])
        setUsers(usersRes.data.data || [])
        setDepartments(deptRes.data.data || [])
        const allUnits = (deptRes.data.data || []).flatMap((d: any) => d.units || [])
        setUnits(allUnits)
      } catch (error) {
        console.error('Error loading data:', error)
      } finally {
        setIsLoadingUsers(false)
        setIsLoadingDepartments(false)
      }
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

  // Prepare options for MultiSelect
  const userOptions = users.map((u) => ({
    id: u.id,
    label: u.fullName,
    value: u.email || u.id,
    avatar: u.avatar,
    description: u.position || u.role,
  }))

  const departmentOptions = departments.map((d) => ({
    id: d.id,
    label: d.name,
    value: d.code,
    description: d.sector,
  }))

  const unitOptions = units.map((u) => ({
    id: u.id,
    label: u.name,
    value: u.id,
    description: departments.find(d => d.units?.some(unit => unit.id === u.id))?.name || '',
  }))

  return (
    <div className="space-y-6">
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4" id="event-form">
        {/* Row 1: Title */}
        <div className="space-y-2">
          <Label>Title *</Label>
          <Input {...form.register('title')} placeholder="Event title" />
          {form.formState.errors.title && (
            <p className="text-sm text-red-600 mt-1">{form.formState.errors.title.message}</p>
          )}
        </div>

        {/* Row 2: Description (full width) */}
        <div className="space-y-2">
          <Label>Description</Label>
          <Textarea {...form.register('description')} placeholder="Details about the event" rows={3} />
        </div>

        {/* Row 3: Start and End Date */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label>Start *</Label>
            <Input type="datetime-local" {...form.register('startDateTime')} />
            {form.formState.errors.startDateTime && (
              <p className="text-sm text-red-600 mt-1">{form.formState.errors.startDateTime.message}</p>
            )}
          </div>
          <div className="space-y-2">
            <Label>End *</Label>
            <Input type="datetime-local" {...form.register('endDateTime')} />
            {form.formState.errors.endDateTime && (
              <p className="text-sm text-red-600 mt-1">{form.formState.errors.endDateTime.message}</p>
            )}
          </div>
        </div>

        {/* Row 4: Tags and Link */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label>Tags (comma separated)</Label>
            <Input {...form.register('tags')} placeholder="workshop, training" />
          </div>
          <div className="space-y-2">
            <Label>Link</Label>
            <Input {...form.register('link')} placeholder="https://..." />
          </div>
        </div>

        {/* Row 5: Users (full width) */}
        <div className="space-y-2">
          <Label>Users</Label>
          {isLoadingUsers ? (
            <div className="flex items-center gap-2 text-muted-foreground py-2">
              <Loader2 className="h-4 w-4 animate-spin" />
              <span className="text-sm">Loading users...</span>
            </div>
          ) : (
            <MultiSelect
              options={userOptions}
              selected={form.watch('userIds') || []}
              onChange={(selected) => form.setValue('userIds', selected)}
              placeholder="Select users..."
              searchPlaceholder="Search users..."
              emptyMessage="No users found"
              className="w-full"
            />
          )}
        </div>

        {/* Row 6: Departments (full width) */}
        <div className="space-y-2">
          <Label>Departments</Label>
          {isLoadingDepartments ? (
            <div className="flex items-center gap-2 text-muted-foreground py-2">
              <Loader2 className="h-4 w-4 animate-spin" />
              <span className="text-sm">Loading departments...</span>
            </div>
          ) : (
            <MultiSelect
              options={departmentOptions}
              selected={form.watch('departmentIds') || []}
              onChange={(selected) => form.setValue('departmentIds', selected)}
              placeholder="Select departments..."
              searchPlaceholder="Search departments..."
              emptyMessage="No departments found"
              className="w-full"
            />
          )}
        </div>

        {/* Row 7: Units (full width) */}
        <div className="space-y-2">
          <Label>Units</Label>
          {isLoadingDepartments ? (
            <div className="flex items-center gap-2 text-muted-foreground py-2">
              <Loader2 className="h-4 w-4 animate-spin" />
              <span className="text-sm">Loading units...</span>
            </div>
          ) : (
            <MultiSelect
              options={unitOptions}
              selected={form.watch('unitIds') || []}
              onChange={(selected) => form.setValue('unitIds', selected)}
              placeholder="Select units..."
              searchPlaceholder="Search units..."
              emptyMessage="No units found"
              className="w-full"
            />
          )}
        </div>
      </form>

      {/* Action Buttons */}
      <div className="flex justify-end gap-3 pt-4 border-t">
        <Button
          type="button"
          variant="outline"
          onClick={() => onSuccess?.()}
          className="gap-2"
        >
          <X className="h-4 w-4" />
          Cancel
        </Button>
        <Button 
          type="submit" 
          form="event-form"
          disabled={createMutation.isPending || updateMutation.isPending}
          className="gap-2"
        >
          <Plus className="h-4 w-4" />
          {event?.id ? 'Save Changes' : 'Add'}
        </Button>
      </div>
    </div>
  )
}
