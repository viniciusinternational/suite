'use client';

import { useEffect, useMemo, useState } from 'react'
import { Controller, useForm } from 'react-hook-form'
import { z } from 'zod'
import { zodResolver } from '@hookform/resolvers/zod'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { MultiSelect } from '@/components/ui/multi-select'
import { useCreateEvent, useUpdateEvent } from '@/hooks/use-events'
import axios from '@/lib/axios'
import { MEETING_URL } from '@/constants'
import type { Department, DepartmentUnit, Event, User } from '@/types'
import { X, Plus, Loader2 } from 'lucide-react'
import { Checkbox } from '@/components/ui/checkbox'
import { cn } from '@/lib/utils'

const timeRegex = /^([01]\d|2[0-3]):([0-5]\d)$/

const schema = z.object({
  title: z.string().min(1, 'Title is required'),
  description: z.string().optional(),
  tags: z.array(z.string()).optional(),
  link: z.string().url().optional().or(z.literal('')).optional(),
  startDateTime: z.string().min(1, 'Start is required'),
  endDateTime: z.string().optional(),
  endTime: z.string().optional(),
  isAllDay: z.boolean().optional(),
  isGlobal: z.boolean().optional(),
  createVirtualMeeting: z.boolean().optional(),
  userIds: z.array(z.string()).optional(),
  departmentIds: z.array(z.string()).optional(),
  unitIds: z.array(z.string()).optional(),
}).superRefine((data, ctx) => {
  if (!data.isAllDay) {
    if (!data.endTime || !timeRegex.test(data.endTime)) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'End time must be in HH:mm format',
        path: ['endTime'],
      })
    }
  }
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
  const [availableTags, setAvailableTags] = useState<string[]>([])
  const [isLoadingUsers, setIsLoadingUsers] = useState(true)
  const [isLoadingDepartments, setIsLoadingDepartments] = useState(true)
  const [isLoadingTags, setIsLoadingTags] = useState(true)
  const [isCreatingMeeting, setIsCreatingMeeting] = useState(false)
  const [meetingError, setMeetingError] = useState<string | null>(null)

  const createMutation = useCreateEvent()
  const updateMutation = useUpdateEvent(event?.id || '')

  const initialEndTime = useMemo(() => {
    if (!event || event.isAllDay) return ''
    if (event.endTime) return event.endTime
    if (event.endDateTime) {
      const date = new Date(event.endDateTime)
      const hours = date.getHours().toString().padStart(2, '0')
      const minutes = date.getMinutes().toString().padStart(2, '0')
      return `${hours}:${minutes}`
    }
    return ''
  }, [event])

  const form = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      title: event?.title || '',
      description: event?.description || '',
      tags: event?.tags || [],
      link: event?.link || '',
      startDateTime: event?.startDateTime ? new Date(event.startDateTime).toISOString().slice(0,16) : '',
      endDateTime: event?.endDateTime ? new Date(event.endDateTime).toISOString() : undefined,
      endTime: initialEndTime,
      isAllDay: event?.isAllDay ?? false,
      isGlobal: event?.isGlobal ?? false,
      createVirtualMeeting: false,
      userIds: (event?.users || []).map(u => u.id),
      departmentIds: (event?.departments || []).map(d => d.id),
      unitIds: (event?.units || []).map(u => u.id),
    },
  })

  useEffect(() => {
    // Load users, departments, units, and tags
    (async () => {
      try {
        setIsLoadingUsers(true)
        setIsLoadingDepartments(true)
        setIsLoadingTags(true)
        const [usersRes, deptRes, eventsRes] = await Promise.all([
          axios.get('/users'),
          axios.get('/departments'),
          axios.get('/events').catch(() => ({ data: { data: [] } })),
        ])
        setUsers(usersRes.data.data || [])
        setDepartments(deptRes.data.data || [])
        const allUnits = (deptRes.data.data || []).flatMap((d: any) => d.units || [])
        setUnits(allUnits)
        
        // Extract unique tags from all events
        const allTags = (eventsRes.data.data || []).flatMap((e: Event) => e.tags || []) as string[]
        const uniqueTags = Array.from(new Set(allTags)).filter((tag): tag is string => Boolean(tag)).sort()
        
        // Add default tags if no tags exist yet
        const defaultTags = ['workshop', 'training', 'meeting', 'conference', 'important', 'urgent', 'seminar', 'webinar']
        const allAvailableTags = uniqueTags.length > 0 
          ? uniqueTags 
          : defaultTags
        setAvailableTags(allAvailableTags)
      } catch (error) {
        console.error('Error loading data:', error)
        // Set default tags on error
        setAvailableTags(['workshop', 'training', 'meeting', 'conference', 'important', 'urgent', 'seminar', 'webinar'])
      } finally {
        setIsLoadingUsers(false)
        setIsLoadingDepartments(false)
        setIsLoadingTags(false)
      }
    })()
  }, [])

  // Watch form values - react-hook-form optimizes these internally
  const isAllDay = form.watch('isAllDay')
  const isGlobal = form.watch('isGlobal')
  const createVirtualMeetingEnabled = form.watch('createVirtualMeeting')
  const linkValue = form.watch('link')

  useEffect(() => {
    if (isAllDay) {
      form.setValue('endTime', '')
    }
  }, [isAllDay, form])

  // Function to create virtual meeting
  const createVirtualMeeting = async (): Promise<string | null> => {
    try {
      setIsCreatingMeeting(true)
      setMeetingError(null)
      
            const baseUrl = MEETING_URL.replace(/\/$/, '');
      const response = await fetch(`${baseUrl}/api/meetings`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ is_public: true }),
      })

      if (!response.ok) {
        throw new Error(`Failed to create meeting: ${response.statusText}`)
      }

      const data = await response.json()
      
      // Handle different possible response structures
      const roomname = data.roomname || data.data?.roomname || data.room?.name || data.name
      
      if (!roomname) {
        throw new Error('Room name not found in API response')
      }

      return roomname
    } catch (error) {
      console.log('Error creating virtual meeting:', error)
      const errorMessage = error instanceof Error ? error.message : 'Failed to create virtual meeting'
      setMeetingError(errorMessage)
      console.error('Error creating virtual meeting:', error)
      return null
    } finally {
      setIsCreatingMeeting(false)
    }
  }

  const onSubmit = async (values: FormValues) => {
    const start = new Date(values.startDateTime)
    if (isNaN(start.getTime())) {
      form.setError('startDateTime', { message: 'Invalid start date' })
      return
    }

    let endDate = new Date(start)
    if (values.isAllDay) {
      endDate.setDate(endDate.getDate() + 1)
    } else if (values.endTime) {
      const [hours, minutes] = values.endTime.split(':').map(Number)
      endDate.setHours(hours, minutes, 0, 0)
      if (endDate <= start) {
        form.setError('endTime', { message: 'End time must be after start time' })
        return
      }
      if (
        endDate.getFullYear() !== start.getFullYear() ||
        endDate.getMonth() !== start.getMonth() ||
        endDate.getDate() !== start.getDate()
      ) {
        form.setError('endTime', { message: 'End time must be on the same day as start time' })
        return
      }
      if (endDate.getTime() - start.getTime() > 24 * 60 * 60 * 1000) {
        form.setError('endTime', { message: 'Event cannot exceed 24 hours' })
        return
      }
    } else {
      form.setError('endTime', { message: 'End time is required for timed events' })
      return
    }

    // Create virtual meeting if enabled - atomic operation
    let meetingLink = values.link
    if (values.createVirtualMeeting) {
      const roomname = await createVirtualMeeting()
      if (!roomname) {
        // Meeting creation failed - abort entire event creation
        form.setError('createVirtualMeeting', { 
          message: 'Failed to create virtual meeting. Please try again or disable this option.' 
        })
        return // Abort submission
      }
      // Meeting creation succeeded - proceed with event creation
      const baseUrl = MEETING_URL.replace(/\/$/, '');
      meetingLink = `${baseUrl}/join/${roomname}`;
      form.setValue('link', meetingLink)
      setMeetingError(null) // Clear error on success
    }

    const payload = {
      title: values.title,
      description: values.description || undefined,
      tags: values.tags || [],
      link: meetingLink || undefined,
      startDateTime: start.toISOString(),
      endDateTime: endDate.toISOString(),
      endTime: values.isAllDay ? undefined : values.endTime,
      isAllDay: values.isAllDay ?? false,
      isGlobal: values.isGlobal ?? false,
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

  const tagOptions = availableTags.map((tag) => ({
    id: tag,
    label: tag,
    value: tag,
  }))

  return (
    <div className="space-y-6">
      <form onSubmit={form.handleSubmit(onSubmit)} id="event-form" className="space-y-6">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Left column – Basic info */}
          <div className="space-y-4">
            <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">Basic info</p>
            <div className="space-y-2">
              <Label>Title *</Label>
              <Input {...form.register('title')} placeholder="Event title" />
              {form.formState.errors.title && (
                <p className="text-sm text-destructive">{form.formState.errors.title.message}</p>
              )}
            </div>
            <div className="space-y-2">
              <Label>Description</Label>
              <Textarea {...form.register('description')} placeholder="Details about the event" rows={2} className="resize-none" />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Start *</Label>
                <Input type="datetime-local" {...form.register('startDateTime')} />
                {form.formState.errors.startDateTime && (
                  <p className="text-sm text-destructive">{form.formState.errors.startDateTime.message}</p>
                )}
              </div>
              <div className="space-y-2">
                <Label>End Time {isAllDay ? '(all-day)' : '*'}</Label>
                <Input
                  type="time"
                  step={60}
                  disabled={isAllDay}
                  {...form.register('endTime')}
                />
                {form.formState.errors.endTime && (
                  <p className="text-sm text-destructive">{form.formState.errors.endTime.message}</p>
                )}
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <Controller
                name="isAllDay"
                control={form.control}
                render={({ field }) => (
                  <label className="flex items-center gap-2 cursor-pointer rounded-md border p-3 hover:bg-muted/30 transition-colors">
                    <Checkbox
                      checked={field.value ?? false}
                      onCheckedChange={field.onChange}
                    />
                    <span className="text-sm font-medium">All day event</span>
                  </label>
                )}
              />
              <Controller
                name="isGlobal"
                control={form.control}
                render={({ field }) => (
                  <label className="flex items-center gap-2 cursor-pointer rounded-md border p-3 hover:bg-muted/30 transition-colors">
                    <Checkbox
                      checked={field.value ?? false}
                      onCheckedChange={field.onChange}
                    />
                    <span className="text-sm font-medium">Global event</span>
                  </label>
                )}
              />
              <Controller
                name="createVirtualMeeting"
                control={form.control}
                render={({ field }) => (
                  <label className={cn(
                    "flex items-start gap-2 cursor-pointer rounded-md border p-3 hover:bg-muted/30 transition-colors col-span-2",
                    isCreatingMeeting && "opacity-70 pointer-events-none"
                  )}>
                    <Checkbox
                      checked={field.value ?? false}
                      onCheckedChange={(checked) => {
                        field.onChange(checked)
                        if (!checked) setMeetingError(null)
                      }}
                      disabled={isCreatingMeeting}
                      className="mt-0.5"
                    />
                    <div className="space-y-1 flex-1 min-w-0">
                      <span className="text-sm font-medium">Create virtual meeting</span>
                      {isCreatingMeeting && (
                        <div className="flex items-center gap-2 text-xs text-muted-foreground">
                          <Loader2 className="h-3 w-3 animate-spin" />
                          <span>Creating meeting room...</span>
                        </div>
                      )}
                      {meetingError && (
                        <p className="text-xs text-destructive">{meetingError}</p>
                      )}
                    </div>
                  </label>
                )}
              />
            </div>
            <div className="space-y-2">
              <Label>Tags</Label>
              {isLoadingTags ? (
                <div className="flex items-center gap-2 text-muted-foreground py-2">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  <span className="text-sm">Loading tags...</span>
                </div>
              ) : (
                <MultiSelect
                  options={tagOptions}
                  selected={form.watch('tags') || []}
                  onChange={(selected) => form.setValue('tags', selected)}
                  placeholder="Select tags..."
                  searchPlaceholder="Search tags..."
                  emptyMessage="No tags found"
                  className="w-full"
                />
              )}
            </div>
            {createVirtualMeetingEnabled ? (
              <div className="space-y-2 rounded-md border p-3 bg-muted/40">
                <Label>Meeting Link</Label>
                {linkValue ? (
                  <a
                    href={linkValue}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-sm text-primary underline break-all"
                  >
                    {linkValue}
                  </a>
                ) : (
                  <p className="text-xs text-muted-foreground">
                    A secure meeting link will be generated automatically once the event is saved.
                  </p>
                )}
                {form.formState.errors.createVirtualMeeting && (
                  <p className="text-sm text-destructive">{form.formState.errors.createVirtualMeeting.message}</p>
                )}
              </div>
            ) : (
              <div className="space-y-2">
                <Label>Link</Label>
                <Input {...form.register('link')} placeholder="https://..." />
              </div>
            )}
          </div>

          {/* Right column – Permissions / audience */}
          <div className="space-y-4">
            <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">Visibility</p>
            {isGlobal ? (
              <div className="rounded-md border bg-muted/30 p-4 text-sm text-muted-foreground">
                Visible to everyone. This event will be shared with the entire organization.
              </div>
            ) : (
              <>
                <p className="text-xs text-muted-foreground">Who can see this event. Leave all empty to restrict to yourself.</p>
                <div className="grid grid-cols-1 gap-4">
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
                </div>
              </>
            )}
          </div>
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
          disabled={createMutation.isPending || updateMutation.isPending || isCreatingMeeting}
          className="gap-2"
        >
          {isCreatingMeeting ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              Creating Meeting...
            </>
          ) : (
            <>
              <Plus className="h-4 w-4" />
              Save
            </>
          )}
        </Button>
      </div>
    </div>
  )
}
