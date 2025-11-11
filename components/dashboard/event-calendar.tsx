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
import { Plus, CalendarIcon } from 'lucide-react'

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

  const { data: events = [] } = useEvents({
    start: dateRange.start,
    end: dateRange.end,
  })

  // Convert app events to calendar events
  const calendarEvents: Event[] = useMemo(() => {
    return events.map((evt) => ({
      id: evt.id,
      title: evt.title,
      start: new Date(evt.startDateTime),
      end: new Date(evt.endDateTime),
      resource: evt, // Store full event data
    }))
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
    <div className="h-full flex flex-col">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-semibold flex items-center gap-2">
          <CalendarIcon className="h-5 w-5" />
          Calendar
        </h2>
        {canAddEvent && (
          <Button onClick={onAddEvent} size="sm">
            <Plus className="h-4 w-4 mr-2" />
            Add Event
          </Button>
        )}
      </div>
      
      <div className="flex-1 bg-white rounded-lg border shadow-sm overflow-hidden">
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
              <DialogTitle>{selectedEvent.title}</DialogTitle>
              {selectedEvent.description && (
                <DialogDescription>{selectedEvent.description}</DialogDescription>
              )}
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <p className="text-sm text-gray-600">
                  <strong>Start:</strong> {format(new Date(selectedEvent.startDateTime), 'PPPp')}
                </p>
                <p className="text-sm text-gray-600">
                  <strong>End:</strong> {format(new Date(selectedEvent.endDateTime), 'PPPp')}
                </p>
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


