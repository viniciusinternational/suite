'use client';

import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import type { Memo } from '@/types'
import { Edit, Trash2 } from 'lucide-react'

interface Props {
  memos: Memo[]
  onEdit: (memo: Memo) => void
  onDelete: (id: string) => void
  canEdit?: boolean
  canDelete?: boolean
}

const priorityConfig = {
  low: { color: 'bg-gray-100 text-gray-700', label: 'Low' },
  medium: { color: 'bg-blue-100 text-blue-700', label: 'Medium' },
  high: { color: 'bg-orange-100 text-orange-700', label: 'High' },
  urgent: { color: 'bg-red-100 text-red-700', label: 'Urgent' },
}

export function MemoTable({ memos, onEdit, onDelete, canEdit = false, canDelete = false }: Props) {
  const formatDate = (iso?: string) => {
    if (!iso) return 'N/A'
    return new Date(iso).toLocaleDateString()
  }

  const formatDateTime = (iso?: string) => {
    if (!iso) return 'N/A'
    return new Date(iso).toLocaleString()
  }

  return (
    <div className="border rounded-lg">
      <Table>
        <TableHeader>
          <TableRow className="bg-gray-50">
            <TableHead>Title</TableHead>
            <TableHead>Priority</TableHead>
            <TableHead>Created By</TableHead>
            <TableHead>Recipients</TableHead>
            <TableHead>Created</TableHead>
            <TableHead>Expires</TableHead>
            <TableHead>Status</TableHead>
            {(canEdit || canDelete) && <TableHead className="text-right">Actions</TableHead>}
          </TableRow>
        </TableHeader>
        <TableBody>
          {memos.length === 0 ? (
            <TableRow>
              <TableCell colSpan={canEdit || canDelete ? 8 : 7} className="text-center py-8 text-gray-600">
                No memos found
              </TableCell>
            </TableRow>
          ) : (
            memos.map((memo) => {
              const priority = priorityConfig[memo.priority]
              const isExpired = memo.expiresAt && new Date(memo.expiresAt) < new Date()
              
              return (
                <TableRow key={memo.id}>
                  <TableCell className="font-medium">{memo.title}</TableCell>
                  <TableCell>
                    <Badge className={priority.color}>{priority.label}</Badge>
                  </TableCell>
                  <TableCell>{memo.createdBy?.fullName || 'Unknown'}</TableCell>
                  <TableCell>
                    <span className="text-sm text-gray-700">
                      {`${memo.users?.length || 0} users, ${memo.departments?.length || 0} depts`}
                    </span>
                  </TableCell>
                  <TableCell>{formatDateTime(memo.createdAt)}</TableCell>
                  <TableCell>
                    {memo.expiresAt ? (
                      <span className={isExpired ? 'text-red-600' : ''}>
                        {formatDate(memo.expiresAt)}
                      </span>
                    ) : (
                      'Never'
                    )}
                  </TableCell>
                  <TableCell>
                    <Badge variant={memo.isActive ? 'default' : 'secondary'}>
                      {memo.isActive ? 'Active' : 'Inactive'}
                    </Badge>
                  </TableCell>
                  {(canEdit || canDelete) && (
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        {canEdit && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => onEdit(memo)}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                        )}
                        {canDelete && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => onDelete(memo.id)}
                          >
                            <Trash2 className="h-4 w-4 text-red-600" />
                          </Button>
                        )}
                      </div>
                    </TableCell>
                  )}
                </TableRow>
              )
            })
          )}
        </TableBody>
      </Table>
    </div>
  )
}

