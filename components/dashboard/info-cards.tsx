'use client';

import { useRequests } from '@/hooks/use-requests'
import { useEvents } from '@/hooks/use-events'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { FileText, Calendar, Clock } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { addDays } from 'date-fns'
import Link from 'next/link'

export function InfoCards() {
  const router = useRouter()
  
  // Get pending requests
  const { data: requests = [] } = useRequests({ status: 'pending_dept_head' })
  const pendingRequestsCount = requests.length

  // Get upcoming events (next 7 days)
  const startDate = new Date().toISOString()
  const endDate = addDays(new Date(), 7).toISOString()
  const { data: events = [] } = useEvents({ start: startDate, end: endDate })
  const upcomingEventsCount = events.length

  return (
    <div className="space-y-3">
      {/* Pending Requests */}
      <Card 
        className="hover:shadow-md transition-shadow cursor-pointer"
        onClick={() => router.push('/dashboard/requests')}
      >
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <FileText className="h-5 w-5 text-blue-600" />
              <CardTitle className="text-base">Pending Requests</CardTitle>
            </div>
            <span className="text-2xl font-bold text-blue-600">
              {pendingRequestsCount}
            </span>
          </div>
        </CardHeader>
        <CardContent>
          <CardDescription className="text-xs">
            {pendingRequestsCount === 0 
              ? 'No pending requests' 
              : `${pendingRequestsCount} request${pendingRequestsCount === 1 ? '' : 's'} awaiting approval`}
          </CardDescription>
        </CardContent>
      </Card>

      {/* Upcoming Events */}
      <Card 
        className="hover:shadow-md transition-shadow cursor-pointer"
        onClick={() => router.push('/dashboard/events')}
      >
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <Calendar className="h-5 w-5 text-green-600" />
              <CardTitle className="text-base">Upcoming Events</CardTitle>
            </div>
            <span className="text-2xl font-bold text-green-600">
              {upcomingEventsCount}
            </span>
          </div>
        </CardHeader>
        <CardContent>
          <CardDescription className="text-xs">
            {upcomingEventsCount === 0 
              ? 'No events this week' 
              : `${upcomingEventsCount} event${upcomingEventsCount === 1 ? '' : 's'} in the next 7 days`}
          </CardDescription>
        </CardContent>
      </Card>

      {/* Quick Access */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center space-x-2">
            <Clock className="h-5 w-5 text-orange-600" />
            <CardTitle className="text-base">Quick Access</CardTitle>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            <Link 
              href="/dashboard/requests" 
              className="block text-sm text-blue-600 hover:underline"
            >
              View All Requests →
            </Link>
            <Link 
              href="/dashboard/events" 
              className="block text-sm text-green-600 hover:underline"
            >
              View All Events →
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}


