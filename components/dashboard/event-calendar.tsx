'use client';

import { useState, useMemo } from 'react'
import { Calendar, momentLocalizer, View, Event } from 'react-big-calendar'
import moment from 'moment'
import { format, startOfWeek, endOfWeek, startOfMonth, endOfMonth } from 'date-fns'
import 'react-big-calendar/lib/css/react-big-calendar.css'
import { useEvents } from '@/hooks/use-events'
import type { Event as AppEvent } from '@/types'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Plus } from 'lucide-react'
import { Badge } from '@/components/ui/badge'

const localizer = momentLocalizer(moment)

interface Props {
  onAddEvent?: () => void
  canAddEvent?: boolean
}

export function EventCalendar({ onAddEvent, canAddEvent = false }: Props) {
  const [selectedEvent, setSelectedEvent] = useState<AppEvent | null>(null)
  const [view, setView] = useState<View>('month')
  const [date, setDate] = useState(new Date())

  // Calculate date range for current view
  const dateRange = useMemo(() => {
    let start: Date, end: Date
    switch (view) {
      case 'month':
        start = startOfMonth(date)
        end = endOfMonth(date)
        break
      case 'week':
        start = startOfWeek(date)
        end = endOfWeek(date)
        break
      default:
        start = date
        end = date
    }
    return { start: start.toISOString(), end: end.toISOString() }
  }, [view, date])

  const { data: events = [], isLoading } = useEvents({
    start: dateRange.start,
    end: dateRange.end,
  })

  // Convert app events to calendar events
  const calendarEvents: Event[] = useMemo(() => {
    return events.map((evt) => {
      const start = new Date(evt.startDateTime)
      const end = evt.isAllDay
        ? new Date(start.getTime() + 24 * 60 * 60 * 1000)
        : new Date(evt.endDateTime)

      return {
        id: evt.id,
        title: evt.title,
        start,
        end,
        allDay: evt.isAllDay,
        resource: evt, // Store full event data
      }
    })
  }, [events])

  const eventStyleGetter = (event: any) => {
    const evt = event.resource as AppEvent
    const tags = evt.tags || []
    const hasHighPriority = tags.includes('important') || tags.includes('urgent')
    
    return {
      className: hasHighPriority 
        ? 'bg-red-500 border-red-600' 
        : 'bg-blue-500 border-blue-600',
      style: {
        borderColor: hasHighPriority ? '#dc2626' : '#2563eb',
        borderRadius: '4px',
      },
    }
  }

  return (
    <div className="h-full flex flex-col min-h-0">
      {canAddEvent && (
        <div className="flex justify-end shrink-0 mb-2">
          <Button onClick={onAddEvent} size="sm" variant="outline">
            <Plus className="h-4 w-4 mr-2" />
            Add Event
          </Button>
        </div>
      )}
      <div className="flex-1 min-h-0 overflow-hidden rounded-lg bg-background relative">
        {isLoading ? (
          <div className="absolute inset-0 flex items-center justify-center bg-muted/30 rounded-lg">
            <div className="flex flex-col items-center gap-2 text-muted-foreground">
              <svg className="h-8 w-8 animate-spin" fill="none" viewBox="0 0 24 24" aria-hidden="true">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
              </svg>
              <span className="text-sm">Loading calendar...</span>
            </div>
          </div>
        ) : null}
        <Calendar
          localizer={localizer}
          events={calendarEvents}
          startAccessor="start"
          endAccessor="end"
          style={{ height: '100%' }}
          view={view}
          onView={setView}
          date={date}
          onNavigate={setDate}
          eventPropGetter={eventStyleGetter}
          onSelectEvent={(event) => setSelectedEvent(event.resource)}
          formats={{
            dayFormat: 'EEE d',
            weekdayFormat: 'EEE',
            monthHeaderFormat: 'MMMM yyyy',
            dayHeaderFormat: 'EEEE MMMM d',
          }}
        />
      </div>

      {/* Event Detail Dialog */}
      {selectedEvent && (
        <Dialog open={!!selectedEvent} onOpenChange={() => setSelectedEvent(null)}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-3">
                {selectedEvent.title}
                <div className="flex items-center gap-2">
                  {selectedEvent.isGlobal && (
                    <Badge variant="secondary" className="text-xs">
                      Global
                    </Badge>
                  )}
                  {selectedEvent.isAllDay && (
                    <Badge variant="outline" className="text-xs">
                      All Day
                    </Badge>
                  )}
                </div>
              </DialogTitle>
              {selectedEvent.description && (
                <DialogDescription>{selectedEvent.description}</DialogDescription>
              )}
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <p className="text-sm text-gray-600">
                  <strong>Start:</strong>{' '}
                  {format(
                    new Date(selectedEvent.startDateTime),
                    selectedEvent.isAllDay ? 'PPP' : 'PPPp'
                  )}
                </p>
                {!selectedEvent.isAllDay ? (
                  <p className="text-sm text-gray-600">
                    <strong>End:</strong> {format(new Date(selectedEvent.endDateTime), 'PPPp')}
                  </p>
                ) : (
                  <p className="text-sm text-gray-600">
                    <strong>Duration:</strong> All day
                  </p>
                )}
              </div>
              {selectedEvent.tags && selectedEvent.tags.length > 0 && (
                <div>
                  <strong className="text-sm">Tags:</strong>
                  <div className="flex flex-wrap gap-2 mt-2">
                    {selectedEvent.tags.map((tag, idx) => (
                      <span 
                        key={idx}
                        className="px-2 py-1 bg-blue-100 text-blue-700 rounded text-xs"
                      >
                        {tag}
                      </span>
                    ))}
                  </div>
                </div>
              )}
              {selectedEvent.link && (
                <div>
                  <a 
                    href={selectedEvent.link} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="text-blue-600 hover:underline"
                  >
                    {selectedEvent.link}
                  </a>
                </div>
              )}
              {selectedEvent.users && selectedEvent.users.length > 0 && (
                <div>
                  <strong className="text-sm">Target Users:</strong>
                  <p className="text-sm text-gray-600">
                    {selectedEvent.users.map(u => u.fullName).join(', ')}
                  </p>
                </div>
              )}
              {selectedEvent.departments && selectedEvent.departments.length > 0 && (
                <div>
                  <strong className="text-sm">Target Departments:</strong>
                  <p className="text-sm text-gray-600">
                    {selectedEvent.departments.map(d => d.name).join(', ')}
                  </p>
                </div>
              )}
            </div>
          </DialogContent>
        </Dialog>
      )}
    </div>
  )
}


