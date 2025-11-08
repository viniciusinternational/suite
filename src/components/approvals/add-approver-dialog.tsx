'use client'

import { useEffect, useMemo, useState } from 'react'
import type { ReactNode } from 'react'
import { Search, UserPlus, UserCheck, Loader2, ShieldCheck, Shield } from 'lucide-react'

import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'

import { useAvailableApprovers, useAddApprover } from '@/hooks/use-approvals'
import { useAuthStore } from '@/store/auth-store'
import { hasPermission } from '@/lib/permissions'
import type { PermissionKey } from '@/types'

interface AddApproverDialogProps {
  approvalId: string
  entityType: 'request' | 'project' | 'payroll' | 'payment'
  currentLevel?: string
  trigger?: ReactNode
  onSuccess?: (data: any) => void
  defaultCanAddApprovers?: boolean
  requiredPermission?: PermissionKey
  title?: string
  description?: string
}

export function AddApproverDialog({
  approvalId,
  entityType,
  currentLevel,
  trigger,
  onSuccess,
  defaultCanAddApprovers = false,
  requiredPermission,
  title = 'Add Approver',
  description = 'Select a colleague to join the approval workflow.',
}: AddApproverDialogProps) {
  const [open, setOpen] = useState(false)
  const [search, setSearch] = useState('')
  const [debouncedSearch, setDebouncedSearch] = useState('')
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null)
  const [level, setLevel] = useState(currentLevel || '')
  const [allowDelegation, setAllowDelegation] = useState(defaultCanAddApprovers)
  const [formError, setFormError] = useState<string | null>(null)

  const { user } = useAuthStore()
  const userId = user?.id

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(search)
    }, 300)

    return () => clearTimeout(timer)
  }, [search])

  useEffect(() => {
    if (open) {
      setSearch('')
      setDebouncedSearch('')
      setSelectedUserId(null)
      setLevel(currentLevel || '')
      setAllowDelegation(defaultCanAddApprovers)
      setFormError(null)
    }
  }, [open, currentLevel, defaultCanAddApprovers])

  const canManageApprovers = useMemo(
    () => hasPermission(user ?? null, 'manage_approvers'),
    [user]
  )
  const canDelegateApprovers = useMemo(
    () =>
      hasPermission(user ?? null, 'add_approvers') ||
      hasPermission(user ?? null, 'manage_approvers'),
    [user]
  )

  const { data: approvers = [], isLoading } = useAvailableApprovers({
    search: debouncedSearch,
    permission: requiredPermission,
    enabled: open,
  })

  const addApprover = useAddApprover(approvalId)

  const selectedUser = approvers.find((item) => item.id === selectedUserId)

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setFormError(null)

    if (!userId) {
      setFormError('You must be signed in to add approvers')
      return
    }

    if (!selectedUserId) {
      setFormError('Please select an approver')
      return
    }

    if (!level.trim()) {
      setFormError('Approval level is required')
      return
    }

    try {
      const response = await addApprover.mutateAsync({
        type: entityType,
        actorId: userId,
        newApproverId: selectedUserId,
        level: level.trim(),
        canAddApprovers: allowDelegation && canManageApprovers,
      })

      if (onSuccess) {
        onSuccess(response?.data)
      }

      setOpen(false)
    } catch (error: any) {
      const apiError = error?.response?.data?.error || 'Failed to add approver'
      setFormError(apiError)
    }
  }

  const dialogTrigger = trigger ?? (
    <Button
      variant="outline"
      size="sm"
      className="gap-2"
      disabled={!canDelegateApprovers}
      type="button"
    >
      <UserPlus className="h-4 w-4" />
      Add Approver
    </Button>
  )

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{dialogTrigger}</DialogTrigger>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <UserPlus className="h-5 w-5 text-primary" />
            {title}
          </DialogTitle>
          <DialogDescription>{description}</DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-2">
            <Label htmlFor="approver-search">Search approvers</Label>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 h-4 w-4" />
              <Input
                id="approver-search"
                placeholder="Search by name or email"
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                className="pl-9"
                autoComplete="off"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label>Select approver</Label>
            <div className="rounded-lg border bg-muted/30">
              {isLoading ? (
                <div className="space-y-3 p-4">
                  <Skeleton className="h-10 w-full" />
                  <Skeleton className="h-10 w-full" />
                  <Skeleton className="h-10 w-full" />
                </div>
              ) : approvers.length === 0 ? (
                <div className="p-6 text-center text-sm text-gray-500">
                  {debouncedSearch
                    ? 'No users found for your search.'
                    : 'No eligible approvers available.'}
                </div>
              ) : (
                <ScrollArea className="max-h-64">
                  <div className="p-2 space-y-1">
                    {approvers.map((candidate) => {
                      const isSelected = candidate.id === selectedUserId
                      const permissions = candidate.permissions ?? {}

                      return (
                        <button
                          type="button"
                          key={candidate.id}
                          onClick={() => setSelectedUserId(candidate.id)}
                          className={`flex w-full items-center justify-between rounded-md border px-3 py-2 text-left transition hover:border-primary/60 hover:bg-primary/5 ${
                            isSelected
                              ? 'border-primary bg-primary/10 shadow-sm'
                              : 'border-transparent'
                          }`}
                        >
                          <div>
                            <p className="text-sm font-medium text-gray-900">
                              {candidate.fullName || 'Unnamed user'}
                            </p>
                            <p className="text-xs text-gray-500">{candidate.email}</p>
                          </div>
                          <div className="flex items-center gap-2">
                            {permissions.manage_approvers && (
                              <Badge variant="outline" className="gap-1 text-xs">
                                <ShieldCheck className="h-3 w-3" /> Manage
                              </Badge>
                            )}
                            {permissions.add_approvers && !permissions.manage_approvers && (
                              <Badge variant="outline" className="gap-1 text-xs">
                                <Shield className="h-3 w-3" /> Delegate
                              </Badge>
                            )}
                            {isSelected && <UserCheck className="h-4 w-4 text-primary" />}
                          </div>
                        </button>
                      )
                    })}
                  </div>
                </ScrollArea>
              )}
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="approval-level">Approval level</Label>
            <Input
              id="approval-level"
              placeholder="e.g. dept_head, accountant, compliance"
              value={level}
              onChange={(event) => setLevel(event.target.value)}
            />
            <p className="text-xs text-gray-500">
              {currentLevel
                ? `Current level: ${currentLevel}. You can keep the same level or specify a new one.`
                : 'Specify the level or stage this approver should handle.'}
            </p>
          </div>

          <div className="flex items-center justify-between rounded-lg border p-4">
            <div className="space-y-1">
              <Label className="text-sm">Allow delegation</Label>
              <p className="text-xs text-gray-500">
                Allow the new approver to add additional approvers.
              </p>
            </div>
            <Switch checked={allowDelegation} onCheckedChange={setAllowDelegation} disabled={!canManageApprovers} />
          </div>

          {formError && (
            <div className="rounded-md border border-red-200 bg-red-50 p-3 text-sm text-red-700">
              {formError}
            </div>
          )}

          <div className="flex justify-end gap-2">
            <Button type="button" variant="ghost" onClick={() => setOpen(false)} disabled={addApprover.isPending}>
              Cancel
            </Button>
            <Button type="submit" disabled={addApprover.isPending || !selectedUserId || !canDelegateApprovers}>
              {addApprover.isPending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Saving...
                </>
              ) : (
                'Add Approver'
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}


