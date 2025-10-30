import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import type { Event } from '@/types'

interface Props {
  events: Event[]
  onEdit: (ev: Event) => void
  onDelete: (id: string) => void
}

export function EventTable({ events, onEdit, onDelete }: Props) {
  const formatDateTime = (iso: string) => new Date(iso).toLocaleString()
  return (
    <div className="border rounded-lg">
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
              <TableCell colSpan={6} className="text-center py-8 text-gray-600">No events found</TableCell>
            </TableRow>
          ) : (
            events.map((ev) => (
              <TableRow key={ev.id}>
                <TableCell className="font-medium">{ev.title}</TableCell>
                <TableCell>{formatDateTime(ev.startDateTime)}</TableCell>
                <TableCell>{formatDateTime(ev.endDateTime)}</TableCell>
                <TableCell>{(ev.tags || []).join(', ')}</TableCell>
                <TableCell>
                  <span className="text-sm text-gray-700">
                    {`${ev.users?.length || 0} users, ${ev.departments?.length || 0} depts, ${ev.units?.length || 0} units`}
                  </span>
                </TableCell>
                <TableCell className="text-right space-x-2">
                  <button className="text-blue-600 hover:underline" onClick={() => onEdit(ev)}>Edit</button>
                  <button className="text-red-600 hover:underline" onClick={() => onDelete(ev.id)}>Delete</button>
                </TableCell>
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>
    </div>
  )
}


