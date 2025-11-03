'use client';

import { useState } from 'react'
import { MemoCard } from './memo-card'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import type { Memo } from '@/types'
import { Search } from 'lucide-react'

interface Props {
  memos: Memo[]
  onEdit?: (memo: Memo) => void
  canEdit?: boolean
}

export function MemoList({ memos, onEdit, canEdit = false }: Props) {
  const [search, setSearch] = useState('')
  const [priorityFilter, setPriorityFilter] = useState<string>('all')

  const filteredMemos = memos
    .filter(memo => {
      if (search && !memo.title.toLowerCase().includes(search.toLowerCase()) && 
          !memo.content.toLowerCase().includes(search.toLowerCase())) {
        return false
      }
      if (priorityFilter !== 'all' && memo.priority !== priorityFilter) {
        return false
      }
      return true
    })
    .sort((a, b) => {
      // Sort by priority first (urgent > high > medium > low), then by date
      const priorityOrder = { urgent: 4, high: 3, medium: 2, low: 1 }
      const priorityDiff = (priorityOrder[b.priority] || 0) - (priorityOrder[a.priority] || 0)
      if (priorityDiff !== 0) return priorityDiff
      return new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime()
    })

  if (memos.length === 0) {
    return (
      <div className="text-center py-8 text-gray-500">
        <p>No memos available</p>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row gap-2">
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
          <SelectTrigger className="w-full sm:w-[140px]">
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

      <div className="space-y-3">
        {filteredMemos.map((memo) => (
          <MemoCard
            key={memo.id}
            memo={memo}
            onEdit={onEdit}
            canEdit={canEdit}
          />
        ))}
      </div>

      {filteredMemos.length === 0 && (
        <div className="text-center py-8 text-gray-500">
          <p>No memos match your filters</p>
        </div>
      )}
    </div>
  )
}


