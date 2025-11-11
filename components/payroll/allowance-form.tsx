'use client'

import { useEffect, useState } from 'react'
import { useForm } from 'react-hook-form'
import { z } from 'zod'
import { zodResolver } from '@hookform/resolvers/zod'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { MultiSelect } from '@/components/ui/multi-select'
import { useCreateAllowance, useUpdateAllowance } from '@/hooks/use-allowances'
import axios from '@/lib/axios'
import type { Allowance, User, Department } from '@/types'
import { Loader2 } from 'lucide-react'

const schema = z
  .object({
    title: z.string().min(1, 'Title is required'),
    description: z.string().optional(),
    always: z.boolean().default(false),
    amount: z.number().nonnegative().optional().nullable(),
    percent: z.number().min(0).max(100).optional().nullable(),
    global: z.boolean().default(false),
    userIds: z.array(z.string()).optional(),
    departmentIds: z.array(z.string()).optional(),
    startDate: z.string().optional(),
    endDate: z.string().optional(),
  })
  .refine((data) => data.amount || data.percent, {
    message: 'Either amount or percent must be provided',
    path: ['amount'],
  })
  .refine((data) => !data.global || ((!data.userIds || data.userIds.length === 0) && (!data.departmentIds || data.departmentIds.length === 0)), {
    message: 'Cannot assign users or departments when global is enabled',
    path: ['userIds'],
  })

type FormValues = z.infer<typeof schema>

interface Props {
  allowance?: Allowance | null
  onSuccess?: () => void
}

export function AllowanceForm({ allowance, onSuccess }: Props) {
  const [users, setUsers] = useState<User[]>([])
  const [departments, setDepartments] = useState<Department[]>([])
  const [isLoadingUsers, setIsLoadingUsers] = useState(true)
  const [isLoadingDepartments, setIsLoadingDepartments] = useState(true)

  const createMutation = useCreateAllowance()
  const updateMutation = useUpdateAllowance(allowance?.id || '')

  const form = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      title: allowance?.title || '',
      description: allowance?.description || '',
      always: allowance?.always || false,
      amount: allowance?.amount || null,
      percent: allowance?.percent || null,
      global: allowance?.global || false,
      userIds: allowance?.users?.map((u) => u.id) || [],
      departmentIds: allowance?.departments?.map((d) => d.id) || [],
      startDate: allowance?.startDate ? allowance.startDate.split('T')[0] : '',
      endDate: allowance?.endDate ? allowance.endDate.split('T')[0] : '',
    },
  })

  useEffect(() => {
    // Load users and departments
    ;(async () => {
      try {
        const [usersRes, departmentsRes] = await Promise.all([
          axios.get('/users'),
          axios.get('/departments'),
        ])
        setUsers(usersRes.data.data || [])
        setDepartments(departmentsRes.data.data || [])
      } catch (error) {
        console.error('Error loading data:', error)
      } finally {
        setIsLoadingUsers(false)
        setIsLoadingDepartments(false)
      }
    })()
  }, [])

  const userOptions = users
    .filter((u) => u.isActive)
    .map((u) => ({
      value: u.id,
      label: `${u.fullName} (${u.email})`,
    }))

  const departmentOptions = departments
    .filter((d) => d.isActive)
    .map((d) => ({
      value: d.id,
      label: `${d.name} (${d.code})`,
    }))

  const handleSubmit = async (data: FormValues) => {
    try {
      const payload = {
        ...data,
        startDate: data.always || !data.startDate ? undefined : new Date(data.startDate).toISOString(),
        endDate: data.always || !data.endDate ? undefined : new Date(data.endDate).toISOString(),
        userIds: data.global ? [] : data.userIds,
        departmentIds: data.global ? [] : data.departmentIds,
      }

      if (allowance) {
        await updateMutation.mutateAsync(payload)
      } else {
        await createMutation.mutateAsync(payload)
      }
      onSuccess?.()
    } catch (error: any) {
      console.error('Error saving allowance:', error)
      alert(error?.response?.data?.error || 'Failed to save allowance')
    }
  }

  const isSubmitting = createMutation.isPending || updateMutation.isPending
  const isGlobal = form.watch('global')
  const always = form.watch('always')

  return (
    <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="title">Title *</Label>
          <Input id="title" {...form.register('title')} placeholder="e.g., Transport Allowance" />
          {form.formState.errors.title && (
            <p className="text-sm text-red-600">{form.formState.errors.title.message}</p>
          )}
        </div>

        <div className="space-y-2">
          <Label htmlFor="description">Description</Label>
          <Textarea id="description" {...form.register('description')} placeholder="Optional description" />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="amount">Fixed Amount (₦)</Label>
          <Input
            id="amount"
            type="number"
            step="0.01"
            {...form.register('amount', { valueAsNumber: true })}
            placeholder="0.00"
            disabled={!!form.watch('percent')}
          />
          {form.formState.errors.amount && (
            <p className="text-sm text-red-600">{form.formState.errors.amount.message}</p>
          )}
        </div>

        <div className="space-y-2">
          <Label htmlFor="percent">Percentage (%)</Label>
          <Input
            id="percent"
            type="number"
            step="0.01"
            min="0"
            max="100"
            {...form.register('percent', { valueAsNumber: true })}
            placeholder="0.00"
            disabled={!!form.watch('amount')}
          />
          {form.formState.errors.percent && (
            <p className="text-sm text-red-600">{form.formState.errors.percent.message}</p>
          )}
        </div>
      </div>

      <div className="space-y-4">
        <div className="flex items-center space-x-2">
          <input
            type="checkbox"
            id="global"
            {...form.register('global')}
            className="rounded border-gray-300"
          />
          <Label htmlFor="global" className="cursor-pointer">
            Apply to all users (Global)
          </Label>
        </div>

        <div className="flex items-center space-x-2">
          <input
            type="checkbox"
            id="always"
            {...form.register('always')}
            className="rounded border-gray-300"
          />
          <Label htmlFor="always" className="cursor-pointer">
            Always active (no expiration)
          </Label>
        </div>
      </div>

      {!always && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="startDate">Start Date</Label>
            <Input id="startDate" type="date" {...form.register('startDate')} />
          </div>

          <div className="space-y-2">
            <Label htmlFor="endDate">End Date</Label>
            <Input id="endDate" type="date" {...form.register('endDate')} />
          </div>
        </div>
      )}

      {!isGlobal && (
        <>
          <div className="space-y-2">
            <Label>Assigned Users</Label>
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
            {form.formState.errors.userIds && (
              <p className="text-sm text-red-600">{form.formState.errors.userIds.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label>Assigned Departments</Label>
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
            {form.formState.errors.departmentIds && (
              <p className="text-sm text-red-600">{form.formState.errors.departmentIds.message}</p>
            )}
          </div>
        </>
      )}

      <div className="flex justify-end gap-4">
        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting ? (
            <>
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              Saving...
            </>
          ) : allowance ? (
            'Update Allowance'
          ) : (
            'Create Allowance'
          )}
        </Button>
      </div>
    </form>
  )
}

