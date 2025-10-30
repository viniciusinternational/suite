'use client';

import { useState } from 'react'
import { useAuthGuard } from '@/hooks/use-auth-guard'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { EventForm } from '@/components/event/event-form'
import { EventTable } from '@/components/event/event-table'
import { useDeleteEvent, useEvents } from '@/hooks/use-events'
import type { Event } from '@/types'
import { Plus, Search } from 'lucide-react'

export default function EventsPage() {
  useAuthGuard(['view_events'])

  const [search, setSearch] = useState('')
  const [isOpen, setIsOpen] = useState(false)
  const [editing, setEditing] = useState<Event | null>(null)

  const { data: events = [] } = useEvents({ q: search || undefined })
  const deleteMutation = useDeleteEvent()

  return (
    <div className="space-y-6 p-6 bg-gray-50/50 min-h-screen">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Events</h1>
          <p className="text-gray-600 mt-1">Manage organization-wide events</p>
        </div>
        <div className="flex items-center space-x-2">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input className="pl-10" placeholder="Search events..." value={search} onChange={(e) => setSearch(e.target.value)} />
          </div>
          <Button onClick={() => { setEditing(null); setIsOpen(true) }}>
            <Plus className="h-4 w-4 mr-2" />
            Create Event
          </Button>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>All Events</CardTitle>
          <CardDescription>Upcoming and past events</CardDescription>
        </CardHeader>
        <CardContent>
          <EventTable 
            events={events}
            onEdit={(ev) => { setEditing(ev); setIsOpen(true) }}
            onDelete={(id) => deleteMutation.mutate(id)}
          />
        </CardContent>
      </Card>

      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle>{editing ? 'Edit Event' : 'Create Event'}</DialogTitle>
            <DialogDescription>Fill the form below to {editing ? 'update' : 'create'} an event.</DialogDescription>
          </DialogHeader>
          <EventForm 
            event={editing}
            onSuccess={() => {
              setIsOpen(false)
              setEditing(null)
            }}
          />
        </DialogContent>
      </Dialog>
    </div>
  )
}


