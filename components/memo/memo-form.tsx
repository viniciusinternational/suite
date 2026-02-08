'use client';

import { useEffect, useState } from 'react'
import { useForm } from 'react-hook-form'
import { z } from 'zod'
import { zodResolver } from '@hookform/resolvers/zod'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { MultiSelect } from '@/components/ui/multi-select'
import { Checkbox } from '@/components/ui/checkbox'
import { useCreateMemo, useUpdateMemo } from '@/hooks/use-memos'
import { LexicalWrapper } from './lexical-wrapper'
import axios from '@/lib/axios'
import type { Department, Memo, User } from '@/types'
import { X, Plus } from 'lucide-react'

const schema = z.object({
  title: z.string().min(1, 'Title is required'),
  content: z.string().min(1, 'Content is required'),
  priority: z.enum(['low', 'medium', 'high', 'urgent']).default('medium'),
  expiresAt: z.string().optional(),
  isGlobal: z.boolean().default(false),
  userIds: z.array(z.string()).optional(),
  departmentIds: z.array(z.string()).optional(),
})

type FormValues = z.infer<typeof schema>

function toDatetimeLocalValue(value: string | undefined): string {
  if (!value) return ''
  const d = new Date(value)
  return isNaN(d.getTime()) ? '' : d.toISOString().slice(0, 16)
}

function toISOExpiresAt(value: string | undefined): string | undefined {
  if (!value || !value.trim()) return undefined
  const d = new Date(value)
  return isNaN(d.getTime()) ? undefined : d.toISOString()
}

interface Props {
  memo?: Memo | null
  onSuccess?: () => void
}

export function MemoForm({ memo, onSuccess }: Props) {
  const [users, setUsers] = useState<User[]>([])
  const [departments, setDepartments] = useState<Department[]>([])

  const createMutation = useCreateMemo()
  const updateMutation = useUpdateMemo(memo?.id || '')

  const form = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      title: memo?.title || '',
      content: memo?.content || '',
      priority: memo?.priority || 'medium',
      expiresAt: toDatetimeLocalValue(memo?.expiresAt),
      isGlobal: memo?.isGlobal ?? false,
      userIds: (memo?.users || []).map(u => u.id),
      departmentIds: (memo?.departments || []).map(d => d.id),
    },
  })

  useEffect(() => {
    // Load users, departments
    (async () => {
      const [usersRes, deptRes] = await Promise.all([
        axios.get('/users'),
        axios.get('/departments'),
      ])
      setUsers(usersRes.data.data || [])
      setDepartments(deptRes.data.data || [])
    })()
  }, [])

  const onSubmit = async (values: FormValues) => {
    try {
      const isGlobal = values.isGlobal === true
      const payload = {
        title: values.title,
        content: values.content,
        priority: values.priority,
        expiresAt: toISOExpiresAt(values.expiresAt),
        isGlobal,
        userIds: isGlobal ? [] : (values.userIds || []),
        departmentIds: isGlobal ? [] : (values.departmentIds || []),
      }

      if (memo?.id) {
        await updateMutation.mutateAsync(payload)
      } else {
        await createMutation.mutateAsync(payload)
      }
      onSuccess?.()
    } catch (error: any) {
      console.error('Error saving memo:', error)
      const errorMessage = error?.response?.data?.error || error?.message || 'Failed to save memo'
      alert(errorMessage)
    }
  }

  // Prepare options for MultiSelect
  const userOptions = users.map((u) => ({
    id: u.id,
    label: u.fullName,
    value: u.id,
    avatar: u.avatar,
    description: u.position,
  }))

  const departmentOptions = departments.map((d) => ({
    id: d.id,
    label: d.name,
    value: d.id,
    description: d.sector,
  }))

  const isGlobal = form.watch('isGlobal')

  return (
    <form className="flex flex-col h-full min-h-0" onSubmit={form.handleSubmit(onSubmit)}>
      {/* Split Layout: Editor Left, Controls Right */}
      <div className="flex flex-1 min-h-0">
        {/* Left: Rich Text Editor */}
        <div className="flex-1 p-6 border-r overflow-y-auto flex flex-col min-h-0">
          <Label>Content</Label>
          <div className="mt-2 flex-1 min-h-0 flex flex-col">
            <LexicalWrapper
              value={form.watch('content')}
              onChange={(data) => form.setValue('content', data)}
              placeholder="Enter memo content..."
            />
          </div>
          {form.formState.errors.content && (
            <p className="text-sm text-red-600 mt-1">{form.formState.errors.content.message}</p>
          )}
        </div>

        {/* Right: Controls (Title, Priority, Expires, Global visibility, Target Users/Depts) */}
        <div className="w-80 p-6 overflow-y-auto space-y-6 bg-muted/30 border-l shrink-0">
          {/* Title */}
          <div>
            <Label htmlFor="title">Title</Label>
            <Input 
              id="title"
              {...form.register('title')} 
              placeholder="Memo title" 
              className="mt-2"
            />
            {form.formState.errors.title && (
              <p className="text-sm text-red-600 mt-1">{form.formState.errors.title.message}</p>
            )}
          </div>

          {/* Priority */}
          <div>
            <Label>Priority</Label>
            <Select 
              value={form.watch('priority')} 
              onValueChange={(v) => form.setValue('priority', v as any)}
            >
              <SelectTrigger className="w-full mt-2">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="low">Low</SelectItem>
                <SelectItem value="medium">Medium</SelectItem>
                <SelectItem value="high">High</SelectItem>
                <SelectItem value="urgent">Urgent</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Expires At */}
          <div>
            <Label>Expires At (optional)</Label>
            <Input 
              type="datetime-local" 
              {...form.register('expiresAt')} 
              className="mt-2"
            />
          </div>

          {/* Global visibility */}
          <div className="flex items-start gap-2 space-y-0">
            <Checkbox
              id="isGlobal"
              checked={isGlobal}
              onCheckedChange={(checked) => {
                form.setValue('isGlobal', checked === true)
                if (checked === true) {
                  form.setValue('userIds', [])
                  form.setValue('departmentIds', [])
                }
              }}
            />
            <div className="grid gap-1.5 leading-none">
              <Label htmlFor="isGlobal" className="text-sm font-normal cursor-pointer">
                Visible to everyone
              </Label>
              <p className="text-xs text-muted-foreground">
                Overrides targeted users and departments; memo is visible to all.
              </p>
            </div>
          </div>

          {/* Target Users */}
          <div className={isGlobal ? 'opacity-50 pointer-events-none' : ''}>
            <Label>Target Users</Label>
            <div className="mt-2">
              <MultiSelect
                options={userOptions}
                selected={form.watch('userIds') || []}
                onChange={(selected) => form.setValue('userIds', selected)}
                placeholder="Select users..."
                searchPlaceholder="Search users..."
                emptyMessage="No users found"
              />
            </div>
          </div>

          {/* Target Departments */}
          <div className={isGlobal ? 'opacity-50 pointer-events-none' : ''}>
            <Label>Target Departments</Label>
            <div className="mt-2">
              <MultiSelect
                options={departmentOptions}
                selected={form.watch('departmentIds') || []}
                onChange={(selected) => form.setValue('departmentIds', selected)}
                placeholder="Select departments..."
                searchPlaceholder="Search departments..."
                emptyMessage="No departments found"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Footer Actions */}
      <div className="shrink-0 p-4 border-t flex justify-end gap-3 bg-background">
        <Button 
          type="button"
          variant="outline"
          onClick={() => onSuccess?.()}
          size="lg"
          className="gap-2"
        >
          <X className="h-4 w-4" />
          Cancel
        </Button>
        <Button 
          type="submit" 
          disabled={createMutation.isPending || updateMutation.isPending}
          size="lg"
          className="gap-2"
        >
          <Plus className="h-4 w-4" />
          Save
        </Button>
      </div>
    </form>
  )
}


