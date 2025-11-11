import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import type { Event } from '@/types'
import { Edit, Trash2 } from 'lucide-react'

interface Props {
  events: Event[]
  onEdit: (ev: Event) => void
  onDelete: (id: string) => void
  isLoading?: boolean
}

export function EventTable({ events, onEdit, onDelete, isLoading = false }: Props) {
  const formatDateTime = (iso: string) => {
    return new Date(iso).toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
    })
  }

  if (isLoading) {
    return (
      <div className="border rounded-lg overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow className="bg-gray-50">
              <TableHead>Title</TableHead>
              <TableHead>Start</TableHead>
              <TableHead>End</TableHead>
              <TableHead>Tags</TableHead>
              <TableHead>Targets</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {Array.from({ length: 5 }).map((_, i) => (
              <TableRow key={i}>
                <TableCell><Skeleton className="h-4 w-32" /></TableCell>
                <TableCell><Skeleton className="h-4 w-24" /></TableCell>
                <TableCell><Skeleton className="h-4 w-24" /></TableCell>
                <TableCell><Skeleton className="h-4 w-20" /></TableCell>
                <TableCell><Skeleton className="h-4 w-28" /></TableCell>
                <TableCell className="text-right">
                  <div className="flex justify-end gap-2">
                    <Skeleton className="h-8 w-8" />
                    <Skeleton className="h-8 w-8" />
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    )
  }

  return (
    <div className="border rounded-lg overflow-hidden">
      <Table>
        <TableHeader>
          <TableRow className="bg-gray-50">
            <TableHead>Title</TableHead>
            <TableHead>Start</TableHead>
            <TableHead>End</TableHead>
            <TableHead>Tags</TableHead>
            <TableHead>Targets</TableHead>
            <TableHead className="text-right">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {events.length === 0 ? (
            <TableRow>
              <TableCell colSpan={6} className="text-center py-8 text-gray-600">
                No events found
              </TableCell>
            </TableRow>
          ) : (
            events.map((ev) => (
              <TableRow key={ev.id}>
                <TableCell className="font-medium">{ev.title}</TableCell>
                <TableCell>{formatDateTime(ev.startDateTime)}</TableCell>
                <TableCell>{formatDateTime(ev.endDateTime)}</TableCell>
                <TableCell>
                  {ev.tags && ev.tags.length > 0 ? (
                    <div className="flex flex-wrap gap-1">
                      {ev.tags.slice(0, 2).map((tag, idx) => (
                        <Badge key={idx} variant="outline" className="text-xs">
                          {tag}
                        </Badge>
                      ))}
                      {ev.tags.length > 2 && (
                        <span className="text-xs text-gray-500">+{ev.tags.length - 2}</span>
                      )}
                    </div>
                  ) : (
                    <span className="text-gray-400 text-sm">-</span>
                  )}
                </TableCell>
                <TableCell>
                  <div className="flex flex-col gap-1">
                    {ev.users && ev.users.length > 0 && (
                      <span className="text-xs text-gray-600">{ev.users.length} user{ev.users.length !== 1 ? 's' : ''}</span>
                    )}
                    {ev.departments && ev.departments.length > 0 && (
                      <span className="text-xs text-gray-600">{ev.departments.length} dept{ev.departments.length !== 1 ? 's' : ''}</span>
                    )}
                    {ev.units && ev.units.length > 0 && (
                      <span className="text-xs text-gray-600">{ev.units.length} unit{ev.units.length !== 1 ? 's' : ''}</span>
                    )}
                    {(!ev.users || ev.users.length === 0) && 
                     (!ev.departments || ev.departments.length === 0) && 
                     (!ev.units || ev.units.length === 0) && (
                      <span className="text-gray-400 text-sm">-</span>
                    )}
                  </div>
                </TableCell>
                <TableCell className="text-right">
                  <div className="flex justify-end gap-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => onEdit(ev)}
                      className="h-8 w-8 p-0"
                    >
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => onDelete(ev.id)}
                      className="h-8 w-8 p-0 text-red-600 hover:text-red-700"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>
    </div>
  )
}
