'use client';

import { useState } from 'react'
import { useAuthGuard } from '@/hooks/use-auth-guard'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { EventCalendar } from '@/components/dashboard/event-calendar'
import { useMemos } from '@/hooks/use-memos'
import { useRequests } from '@/hooks/use-requests'
import { useEvents } from '@/hooks/use-events'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Bell, Calendar, FileText, Clock, ChevronRight, AlertCircle } from 'lucide-react'
import { format, addDays } from 'date-fns'
import { useRouter } from 'next/navigation'
import DOMPurify from 'dompurify'
import type { Memo } from '@/types'

export default function DashboardPage() {
  const { isChecking, user } = useAuthGuard()
  const router = useRouter()
  const [selectedMemo, setSelectedMemo] = useState<Memo | null>(null)
  const shouldLoadData = !!user && !isChecking

  const { data: memos = [], isLoading: memosLoading } = useMemos(
    { isActive: true },
    { enabled: shouldLoadData }
  )
  const { data: requests = [] } = useRequests(
    { status: 'pending_dept_head' },
    { enabled: shouldLoadData }
  )
  const { data: events = [] } = useEvents(
    {
      start: new Date().toISOString(),
      end: addDays(new Date(), 7).toISOString(),
    },
    { enabled: shouldLoadData }
  )

  if (isChecking) {
    return (
      <div className="flex h-full items-center justify-center p-4 text-sm text-gray-500">
        Checking permissions...
      </div>
    )
  }

  if (!user) return null

  const pendingRequestsCount = requests.length
  const upcomingEventsCount = events.length

  return (
    <div className="space-y-4 h-[calc(100vh-120px)] flex flex-col p-4">
      {/* Header */}
      <div className="">
        <h1 className="text-2xl font-semibold text-gray-900">Dashboard</h1>
        <p className="text-sm text-gray-500">Welcome back, {user.fullName}</p>
      </div>

      {/* Top Info Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
        {/* Pending Requests Card */}
        <Card 
          className="hover:shadow-lg transition-all cursor-pointer border-l-4 border-l-blue-500"
          onClick={() => router.push('/dashboard/requests')}
        >
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-blue-50 rounded-lg">
                  <FileText className="h-5 w-5 text-blue-600" />
                </div>
                <div>
                  <p className="text-xs text-gray-500 uppercase tracking-wide">Pending</p>
                  <p className="text-2xl font-bold text-gray-900">{pendingRequestsCount}</p>
                </div>
              </div>
              <ChevronRight className="h-4 w-4 text-gray-400" />
            </div>
          </CardContent>
        </Card>

        {/* Upcoming Events Card */}
        <Card 
          className="hover:shadow-lg transition-all cursor-pointer border-l-4 border-l-green-500"
          onClick={() => router.push('/dashboard/events')}
        >
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-green-50 rounded-lg">
                  <Calendar className="h-5 w-5 text-green-600" />
                </div>
                <div>
                  <p className="text-xs text-gray-500 uppercase tracking-wide">Events</p>
                  <p className="text-2xl font-bold text-gray-900">{upcomingEventsCount}</p>
                </div>
              </div>
              <ChevronRight className="h-4 w-4 text-gray-400" />
            </div>
          </CardContent>
        </Card>

        {/* Active Memos Card */}
        <Card className="border-l-4 border-l-orange-500">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-orange-50 rounded-lg">
                <Bell className="h-5 w-5 text-orange-600" />
              </div>
              <div>
                <p className="text-xs text-gray-500 uppercase tracking-wide">Memos</p>
                <p className="text-2xl font-bold text-gray-900">{memos.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Quick Stats Card */}
        <Card className="border-l-4 border-l-purple-500">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-purple-50 rounded-lg">
                <Clock className="h-5 w-5 text-purple-600" />
              </div>
              <div>
                <p className="text-xs text-gray-500 uppercase tracking-wide">Today</p>
                <p className="text-lg font-bold text-gray-900">{format(new Date(), 'MMM d')}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-[0.7fr_0.3fr] gap-4 flex-1 min-h-0">
        {/* Left: Calendar (90% width) */}
        <Card className="border shadow-sm">
          {/* <CardHeader className="py-3 px-4 border-b bg-gray-50">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Calendar className="h-4 w-4" />
              Calendar View
            </CardTitle>
          </CardHeader> */}
          <CardContent className="p-3 h-[calc(100%-1px)]">
            <EventCalendar />
          </CardContent>
        </Card>

        {/* Right: Memos List */}
        <Card className="border shadow-sm overflow-hidden">
          <CardHeader className="py-3 px-4 border-b bg-gray-50">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <Bell className="h-4 w-4 text-orange-500" />
                Recent Memos
              </CardTitle>
              <span className="text-xs text-gray-500">
                {memos.length} active
              </span>
            </div>
          </CardHeader>
          <CardContent className="p-0 h-[calc(100%-60px)] overflow-y-auto">
            {memosLoading ? (
              <div className="p-4 space-y-2">
                {[1, 2, 3, 4, 5].map(i => (
                  <div key={i} className="h-12 bg-gray-100 animate-pulse rounded" />
                ))}
              </div>
            ) : memos.length === 0 ? (
              <div className="p-8 text-center text-gray-500">
                <Bell className="h-8 w-8 mx-auto mb-2 text-gray-300" />
                <p className="text-sm">No active memos</p>
              </div>
            ) : (
              <div className="divide-y divide-gray-100">
                {memos.map((memo) => {
                  const priorityColors = {
                    urgent: 'bg-red-500',
                    high: 'bg-orange-500',
                    medium: 'bg-yellow-500',
                    low: 'bg-gray-400'
                  }
                  return (
                    <div
                      key={memo.id}
                      onClick={() => setSelectedMemo(memo)}
                      className="px-4 py-3 hover:bg-gray-50 cursor-pointer transition-colors flex items-center gap-3"
                    >
                      <div className={`w-1 h-8 ${priorityColors[memo.priority]} rounded-full`} />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          {memo.priority === 'urgent' && (
                            <AlertCircle className="h-3 w-3 text-red-500 flex-shrink-0" />
                          )}
                          <p className="text-sm font-medium text-gray-900 truncate">
                            {memo.title}
                          </p>
                        </div>
                        <p className="text-xs text-gray-500">
                          {memo.createdBy?.fullName} • {format(new Date(memo.createdAt || ''), 'MMM d, h:mm a')}
                        </p>
                      </div>
                      <ChevronRight className="h-4 w-4 text-gray-400 flex-shrink-0" />
                    </div>
                  )
                })}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Memo Detail Modal */}
      <Dialog open={!!selectedMemo} onOpenChange={() => setSelectedMemo(null)}>
        <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              {selectedMemo?.priority === 'urgent' && (
                <AlertCircle className="h-5 w-5 text-red-500" />
              )}
              {selectedMemo?.title}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="flex items-center gap-4 text-sm text-gray-600">
              <span>From: {selectedMemo?.createdBy?.fullName}</span>
              <span>•</span>
              <span>{selectedMemo?.createdAt && format(new Date(selectedMemo.createdAt), 'PPP')}</span>
              <span>•</span>
              <span className="capitalize font-medium">{selectedMemo?.priority} Priority</span>
            </div>
            
            {selectedMemo?.content && (
              <div 
                className="prose prose-sm max-w-none"
                dangerouslySetInnerHTML={{ 
                  __html: typeof window !== 'undefined' 
                    ? DOMPurify.sanitize(selectedMemo.content)
                    : selectedMemo.content 
                }}
              />
            )}

            {selectedMemo?.expiresAt && (
              <div className="pt-4 border-t">
                <p className="text-sm text-gray-600">
                  Expires: {format(new Date(selectedMemo.expiresAt), 'PPP')}
                </p>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
