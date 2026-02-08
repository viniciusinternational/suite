'use client';

import { useState, useMemo } from 'react'
import { useAuthGuard } from '@/hooks/use-auth-guard'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Skeleton } from '@/components/ui/skeleton'
import { EventForm } from '@/components/event/event-form'
import { EventTable } from '@/components/event/event-table'
import { useDeleteEvent, useEvents } from '@/hooks/use-events'
import type { Event } from '@/types'
import { Plus, Search, Calendar, Clock, CheckCircle2, Loader2 } from 'lucide-react'

export default function EventsPage() {
  useAuthGuard(['view_events'])

  const [search, setSearch] = useState('')
  const [isOpen, setIsOpen] = useState(false)
  const [editing, setEditing] = useState<Event | null>(null)

  const { data: events = [], isLoading, isFetching } = useEvents({ q: search || undefined })
  const deleteMutation = useDeleteEvent()

  // Calculate analytics
  const analytics = useMemo(() => {
    const now = new Date()
    const startOfWeek = new Date(now)
    startOfWeek.setDate(now.getDate() - now.getDay())
    startOfWeek.setHours(0, 0, 0, 0)
    const endOfWeek = new Date(startOfWeek)
    endOfWeek.setDate(startOfWeek.getDate() + 7)

    const upcoming = events.filter((ev) => new Date(ev.startDateTime) > now)
    const past = events.filter((ev) => new Date(ev.endDateTime) < now)
    const thisWeek = events.filter((ev) => {
      const evDate = new Date(ev.startDateTime)
      return evDate >= startOfWeek && evDate < endOfWeek
    })

    return {
      total: events.length,
      upcoming: upcoming.length,
      past: past.length,
      thisWeek: thisWeek.length,
    }
  }, [events])

  const isMutating = deleteMutation.isPending

  return (
    <div className="space-y-6 p-6 min-h-screen bg-muted/30">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between border-b border-border pb-6">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Events</h1>
          <p className="text-muted-foreground mt-1">Manage organization-wide events</p>
        </div>
        <div className="flex items-center gap-2">
          <div className="relative flex-1 sm:flex-initial">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              className="pl-10 w-full sm:w-64"
              placeholder="Search events..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              disabled={isMutating}
            />
            {isFetching && !isLoading && (
              <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground animate-spin" />
            )}
          </div>
          <Button
            onClick={() => { setEditing(null); setIsOpen(true) }}
            disabled={isMutating}
          >
            <Plus className="h-4 w-4 mr-2" />
            Create Event
          </Button>
        </div>
      </div>

      {/* Stats Cards – landscape strip */}
      {isLoading ? (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <Card key={i} className="border-border overflow-hidden">
              <CardContent className="px-6 py-4 flex flex-row items-center justify-between gap-4">
                <div className="space-y-1 min-w-0">
                  <Skeleton className="h-4 w-24" />
                  <Skeleton className="h-7 w-12" />
                </div>
                <Skeleton className="h-10 w-10 rounded-lg shrink-0" />
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Card className="border-border transition-shadow hover:shadow-md overflow-hidden">
            <CardContent className="px-6 py-4 flex flex-row items-center justify-between gap-4">
              <div className="min-w-0">
                <p className="text-sm font-medium text-muted-foreground">Total Events</p>
                <p className="text-2xl font-bold text-foreground tabular-nums">{analytics.total}</p>
              </div>
              <Calendar className="h-10 w-10 text-primary shrink-0 opacity-90" />
            </CardContent>
          </Card>
          <Card className="border-border transition-shadow hover:shadow-md overflow-hidden">
            <CardContent className="px-6 py-4 flex flex-row items-center justify-between gap-4">
              <div className="min-w-0">
                <p className="text-sm font-medium text-muted-foreground">Upcoming Events</p>
                <p className="text-2xl font-bold text-foreground tabular-nums">{analytics.upcoming}</p>
              </div>
              <Clock className="h-10 w-10 text-chart-2 shrink-0 opacity-90" />
            </CardContent>
          </Card>
          <Card className="border-border transition-shadow hover:shadow-md overflow-hidden">
            <CardContent className="px-6 py-4 flex flex-row items-center justify-between gap-4">
              <div className="min-w-0">
                <p className="text-sm font-medium text-muted-foreground">Past Events</p>
                <p className="text-2xl font-bold text-foreground tabular-nums">{analytics.past}</p>
              </div>
              <CheckCircle2 className="h-10 w-10 text-chart-4 shrink-0 opacity-90" />
            </CardContent>
          </Card>
          <Card className="border-border transition-shadow hover:shadow-md overflow-hidden">
            <CardContent className="px-6 py-4 flex flex-row items-center justify-between gap-4">
              <div className="min-w-0">
                <p className="text-sm font-medium text-muted-foreground">Events This Week</p>
                <p className="text-2xl font-bold text-foreground tabular-nums">{analytics.thisWeek}</p>
              </div>
              <Calendar className="h-10 w-10 text-chart-1 shrink-0 opacity-90" />
            </CardContent>
          </Card>
        </div>
      )}

      {/* Events Table */}
      <Card>
        <CardHeader>
          <CardTitle>All Events</CardTitle>
          <CardDescription>Upcoming and past events</CardDescription>
        </CardHeader>
        <CardContent>
          {/* Loading state for mutations */}
          {isMutating && (
            <div className="flex items-center justify-center py-4 gap-2 text-muted-foreground mb-4">
              <Loader2 className="h-4 w-4 animate-spin" />
              <span className="text-sm">Processing...</span>
            </div>
          )}

          <EventTable 
            events={events}
            onEdit={(ev) => { setEditing(ev); setIsOpen(true) }}
            onDelete={(id) => deleteMutation.mutate(id)}
            isLoading={isLoading}
          />
        </CardContent>
      </Card>

      {/* Create/Edit Event Dialog */}
      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogContent size="wide" className="max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editing ? 'Edit Event' : 'Add Event'}</DialogTitle>
            <DialogDescription>
              Fill the form below to {editing ? 'update' : 'create'} an event.
            </DialogDescription>
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
