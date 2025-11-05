'use client';

import { useEffect, useState } from 'react'
import { useForm } from 'react-hook-form'
import { z } from 'zod'
import { zodResolver } from '@hookform/resolvers/zod'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Switch } from '@/components/ui/switch'
import { useCreateTeam, useUpdateTeam } from '@/hooks/use-teams'
import axios from '@/lib/axios'
import type { Team, User, Task } from '@/types'
import { useQuery } from '@tanstack/react-query'
import { X, Plus } from 'lucide-react'

const schema = z.object({
  title: z.string().min(1, 'Team title is required'),
  purpose: z.string().optional(),
  leaderId: z.string().optional(),
  userIds: z.array(z.string()).optional(),
  taskIds: z.array(z.string()).optional(),
  isActive: z.boolean().default(true),
})

type FormValues = z.infer<typeof schema>

interface Props {
  team?: Team | null
  onSuccess?: () => void
}

export function TeamForm({ team, onSuccess }: Props) {
  const [users, setUsers] = useState<User[]>([])
  const [tasks, setTasks] = useState<Task[]>([])

  const createMutation = useCreateTeam()
  const updateMutation = useUpdateTeam(team?.id || '')

  // Fetch all tasks from all projects
  const { data: projects = [] } = useQuery({
    queryKey: ['projects'],
    queryFn: async () => {
      const res = await axios.get('/projects')
      return res.data.data || []
    },
  })

  useEffect(() => {
    // Load users
    (async () => {
      const usersRes = await axios.get('/users')
      setUsers(usersRes.data.data || [])
    })()

    // Load tasks from all projects
    ;(async () => {
      const allTasks: Task[] = []
      for (const project of projects) {
        try {
          const tasksRes = await axios.get(`/projects/${project.id}/tasks`)
          const projectTasks = tasksRes.data.data || []
          allTasks.push(...projectTasks)
        } catch (error) {
          console.error(`Error fetching tasks for project ${project.id}:`, error)
        }
      }
      setTasks(allTasks)
    })()
  }, [projects])

  const form = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      title: team?.title || '',
      purpose: team?.purpose || '',
      leaderId: team?.leaderId || 'none',
      userIds: (team?.users || []).map((u) => u.id),
      taskIds: (team?.tasks || []).map((t) => t.id),
      isActive: team?.isActive !== undefined ? team.isActive : true,
    },
  })

  const onSubmit = async (values: FormValues) => {
    const payload = {
      title: values.title,
      purpose: values.purpose || undefined,
      leaderId: values.leaderId === 'none' ? undefined : values.leaderId,
      userIds: values.userIds || [],
      taskIds: values.taskIds || [],
      isActive: values.isActive,
    }

    if (team?.id) {
      await updateMutation.mutateAsync(payload)
    } else {
      await createMutation.mutateAsync(payload)
    }
    onSuccess?.()
  }

  return (
    <div className="space-y-6">
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4" id="team-form">
        {/* Row 1: Title */}
        <div className="space-y-2">
          <Label>Team Title *</Label>
          <Input {...form.register('title')} placeholder="Enter team title" />
          {form.formState.errors.title && (
            <p className="text-sm text-red-600 mt-1">{form.formState.errors.title.message}</p>
          )}
        </div>

        {/* Row 2: Purpose (full width) */}
        <div className="space-y-2">
          <Label>Purpose</Label>
          <Textarea
            {...form.register('purpose')}
            placeholder="Describe the team's purpose"
            rows={3}
          />
        </div>

        {/* Row 3: Team Leader (full width) */}
        <div className="space-y-2">
          <Label>Team Leader</Label>
          <Select
            value={form.watch('leaderId') || 'none'}
            onValueChange={(value) => form.setValue('leaderId', value)}
          >
            <SelectTrigger className="w-full">
              <SelectValue placeholder="Select team leader" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="none">No leader</SelectItem>
              {users
                .filter((u) => u.isActive)
                .map((u) => (
                  <SelectItem key={u.id} value={u.id}>
                    {u.fullName} ({u.role})
                  </SelectItem>
                ))}
            </SelectContent>
          </Select>
        </div>

        {/* Row 4: Team Members (full width) */}
        <div className="space-y-2">
          <Label>Team Members</Label>
          <div className="border rounded-md p-3 max-h-48 overflow-y-auto">
            {users
              .filter((u) => u.isActive)
              .map((u) => (
                <label key={u.id} className="flex items-center space-x-2 py-2 cursor-pointer hover:bg-gray-50 rounded px-2">
                  <input
                    type="checkbox"
                    checked={form.watch('userIds')?.includes(u.id) || false}
                    onChange={(e) => {
                      const curr = new Set(form.getValues('userIds') || [])
                      if (e.target.checked) {
                        curr.add(u.id)
                      } else {
                        curr.delete(u.id)
                      }
                      form.setValue('userIds', Array.from(curr))
                    }}
                  />
                  <div className="flex items-center gap-2 flex-1">
                    {u.avatar && (
                      <img src={u.avatar} alt={u.fullName} className="w-6 h-6 rounded-full" />
                    )}
                    <span className="text-sm">{u.fullName}</span>
                    <span className="text-xs text-gray-500">({u.position})</span>
                  </div>
                </label>
              ))}
          </div>
        </div>

        {/* Row 5: Tasks (full width) */}
        <div className="space-y-2">
          <Label>Tasks (Optional)</Label>
          <div className="border rounded-md p-3 max-h-48 overflow-y-auto">
            {tasks.length === 0 ? (
              <p className="text-sm text-gray-500 py-2">No tasks available</p>
            ) : (
              tasks.map((task) => (
                <label key={task.id} className="flex items-center space-x-2 py-2 cursor-pointer hover:bg-gray-50 rounded px-2">
                  <input
                    type="checkbox"
                    checked={form.watch('taskIds')?.includes(task.id) || false}
                    onChange={(e) => {
                      const curr = new Set(form.getValues('taskIds') || [])
                      if (e.target.checked) {
                        curr.add(task.id)
                      } else {
                        curr.delete(task.id)
                      }
                      form.setValue('taskIds', Array.from(curr))
                    }}
                  />
                  <span className="text-sm">{task.name}</span>
                  <span className="text-xs text-gray-500">({task.status})</span>
                </label>
              ))
            )}
          </div>
        </div>

        {/* Row 6: Status (full width) */}
        <div className="flex items-center justify-between">
          <div className="space-y-1">
            <Label htmlFor="isActive" className="text-sm font-medium">
              Team Status
            </Label>
            <p className="text-xs text-muted-foreground">
              Active teams are visible and operational
            </p>
          </div>
          <Switch
            id="isActive"
            checked={form.watch('isActive')}
            onCheckedChange={(checked) => form.setValue('isActive', checked)}
          />
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
          form="team-form"
          disabled={createMutation.isPending || updateMutation.isPending}
          className="gap-2"
        >
          <Plus className="h-4 w-4" />
          {team?.id ? 'Save Changes' : 'Add'}
        </Button>
      </div>
    </div>
  )
}
