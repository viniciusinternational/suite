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
import { useCreateMemo, useUpdateMemo } from '@/hooks/use-memos'
import { LexicalWrapper } from './lexical-wrapper'
import axios from '@/lib/axios'
import type { Department, Memo, User } from '@/types'

const schema = z.object({
  title: z.string().min(1, 'Title is required'),
  content: z.string().min(1, 'Content is required'),
  priority: z.enum(['low', 'medium', 'high', 'urgent']).default('medium'),
  expiresAt: z.string().optional(),
  userIds: z.array(z.string()).optional(),
  departmentIds: z.array(z.string()).optional(),
})

type FormValues = z.infer<typeof schema>

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
      expiresAt: memo?.expiresAt ? new Date(memo.expiresAt).toISOString().slice(0, 16) : '',
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
    const payload = {
      title: values.title,
      content: values.content,
      priority: values.priority,
      expiresAt: values.expiresAt ? new Date(values.expiresAt).toISOString() : undefined,
      userIds: values.userIds || [],
      departmentIds: values.departmentIds || [],
    }

    if (memo?.id) {
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
    value: u.email,
    avatar: u.avatar,
    description: u.position,
  }))

  const departmentOptions = departments.map((d) => ({
    id: d.id,
    label: d.name,
    value: d.code,
    description: d.sector,
  }))

  return (
    <form className="flex flex-col h-full" onSubmit={form.handleSubmit(onSubmit)}>
      {/* Title */}
      <div className="p-6 border-b">
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

      {/* Split Layout: Editor Left, Controls Right */}
      <div className="flex flex-1 min-h-0">
        {/* Left: Rich Text Editor */}
        <div className="flex-1 p-6 border-r overflow-y-auto">
          <Label>Content</Label>
          <div className="mt-2">
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

        {/* Right: Controls */}
        <div className="w-80 p-6 overflow-y-auto space-y-6 bg-gray-50">
          {/* Priority */}
          <div>
            <Label>Priority</Label>
            <Select 
              value={form.watch('priority')} 
              onValueChange={(v) => form.setValue('priority', v as any)}
            >
              <SelectTrigger className="mt-2">
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

          {/* Target Users */}
          <div>
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
          <div>
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
      <div className="p-6 border-t flex justify-end">
        <Button 
          type="submit" 
          disabled={createMutation.isPending || updateMutation.isPending}
          size="lg"
        >
          {memo?.id ? 'Save Changes' : 'Create Memo'}
        </Button>
      </div>
    </form>
  )
}


