'use client';

import { useState, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import { useAuthGuard } from '@/hooks/use-auth-guard'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Skeleton } from '@/components/ui/skeleton'
import { MemoTable } from '@/components/memo/memo-table'
import { useMemos } from '@/hooks/use-memos'
import { hasPermission } from '@/lib/permissions'
import { Plus, Search, FileText, CheckCircle, XCircle, AlertTriangle, Loader2 } from 'lucide-react'

export default function MemosPage() {
  const { user } = useAuthGuard(['view_memos'])
  const router = useRouter()

  const [search, setSearch] = useState('')
  const [priorityFilter, setPriorityFilter] = useState<string>('all')

  const { data: memos = [], isLoading, isFetching } = useMemos({ isActive: undefined })

  // Calculate analytics
  const analytics = useMemo(() => {
    const now = new Date()
    const active = memos.filter((m) => m.isActive)
    const expired = memos.filter((m) => m.expiresAt && new Date(m.expiresAt) < now)
    const urgentHigh = memos.filter((m) => m.priority === 'urgent' || m.priority === 'high')

    return {
      total: memos.length,
      active: active.length,
      expired: expired.length,
      urgentHigh: urgentHigh.length,
    }
  }, [memos])

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

      {/* Analytics Cards */}
      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          {[1, 2, 3, 4].map((i) => (
            <Card key={i}>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div className="space-y-2">
                    <Skeleton className="h-4 w-24" />
                    <Skeleton className="h-8 w-16" />
                  </div>
                  <Skeleton className="h-8 w-8 rounded-full" />
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">
                    Total Memos
                  </p>
                  <p className="text-2xl font-bold text-foreground">
                    {analytics.total}
                  </p>
                </div>
                <FileText className="h-8 w-8 text-blue-600" />
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">
                    Active Memos
                  </p>
                  <p className="text-2xl font-bold text-green-600">
                    {analytics.active}
                  </p>
                </div>
                <CheckCircle className="h-8 w-8 text-green-600" />
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">
                    Expired Memos
                  </p>
                  <p className="text-2xl font-bold text-orange-600">
                    {analytics.expired}
                  </p>
                </div>
                <XCircle className="h-8 w-8 text-orange-600" />
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">
                    Urgent/High Priority
                  </p>
                  <p className="text-2xl font-bold text-red-600">
                    {analytics.urgentHigh}
                  </p>
                </div>
                <AlertTriangle className="h-8 w-8 text-red-600" />
              </div>
            </CardContent>
          </Card>
        </div>
      )}

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
                disabled={false}
              />
              {isFetching && !isLoading && (
                <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400 animate-spin" />
              )}
            </div>
            {isLoading ? (
              <Skeleton className="h-10 w-[180px]" />
            ) : (
              <Select value={priorityFilter} onValueChange={setPriorityFilter}>
                <SelectTrigger className="w-[180px]">
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
            )}
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
          <MemoTable
            memos={filteredMemos}
            isLoading={isLoading}
          />
        </CardContent>
      </Card>
    </div>
  )
}

