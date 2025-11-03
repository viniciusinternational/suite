'use client';

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useAuthGuard } from '@/hooks/use-auth-guard'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { MemoTable } from '@/components/memo/memo-table'
import { useDeleteMemo, useMemos } from '@/hooks/use-memos'
import { hasPermission } from '@/lib/permissions'
import type { Memo } from '@/types'
import { Plus, Search } from 'lucide-react'

export default function MemosPage() {
  const { user } = useAuthGuard(['view_memos'])
  const router = useRouter()

  const [search, setSearch] = useState('')
  const [priorityFilter, setPriorityFilter] = useState<string>('all')

  const { data: memos = [], isLoading } = useMemos({ isActive: undefined })
  const deleteMutation = useDeleteMemo()

  // Filter memos
  const filteredMemos = memos.filter((memo) => {
    if (search && !memo.title.toLowerCase().includes(search.toLowerCase()) && 
        !memo.content.toLowerCase().includes(search.toLowerCase())) {
      return false
    }
    if (priorityFilter !== 'all' && memo.priority !== priorityFilter) {
      return false
    }
    return true
  })

  // Check permissions
  const canAddMemo = user && hasPermission(user, 'add_memos')
  const canEditMemo = user && hasPermission(user, 'edit_memos')
  const canDeleteMemo = user && hasPermission(user, 'delete_memos')

  const handleEdit = (memo: Memo) => {
    router.push(`/memos/${memo.id}/edit`)
  }

  const handleDelete = (id: string) => {
    if (confirm('Are you sure you want to delete this memo?')) {
      deleteMutation.mutate(id)
    }
  }

  if (!user) return null

  return (
    <div className="space-y-6 p-6 bg-gray-50/50 min-h-screen">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Memos</h1>
          <p className="text-gray-600 mt-1">Manage and distribute organizational memos</p>
        </div>
        {canAddMemo && (
          <Button onClick={() => router.push('/memos/create')}>
            <Plus className="h-4 w-4 mr-2" />
            Create Memo
          </Button>
        )}
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle>Filters</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input 
                className="pl-10" 
                placeholder="Search memos..." 
                value={search} 
                onChange={(e) => setSearch(e.target.value)} 
              />
            </div>
            <Select value={priorityFilter} onValueChange={setPriorityFilter}>
              <SelectTrigger className="w-full sm:w-[180px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Priorities</SelectItem>
                <SelectItem value="urgent">Urgent</SelectItem>
                <SelectItem value="high">High</SelectItem>
                <SelectItem value="medium">Medium</SelectItem>
                <SelectItem value="low">Low</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Memos Table */}
      <Card>
        <CardHeader>
          <CardTitle>All Memos</CardTitle>
          <CardDescription>View and manage all memos in the system</CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="text-center py-8 text-gray-600">Loading memos...</div>
          ) : (
            <MemoTable 
              memos={filteredMemos}
              onEdit={handleEdit}
              onDelete={handleDelete}
              canEdit={canEditMemo}
              canDelete={canDeleteMemo}
            />
          )}
        </CardContent>
      </Card>
    </div>
  )
}

