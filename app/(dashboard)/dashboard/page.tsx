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

      {/* Memo Detail Modal - A4 Professional View */}
      <Dialog open={!!selectedMemo} onOpenChange={() => setSelectedMemo(null)}>
        <DialogContent 
          className="!max-w-[210mm] !w-[210mm] !p-0 overflow-y-auto max-h-[90vh] bg-white print:shadow-none print:max-h-none relative"
          showCloseButton={true}
        >
          {/* Watermark Background */}
          <div className="absolute inset-0 pointer-events-none opacity-[0.03] print:opacity-[0.08] z-0 overflow-hidden">
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 rotate-[-45deg]">
              <div className="text-[120px] font-black text-gray-400 select-none whitespace-nowrap tracking-wider">
                VINICIUS INTERNATIONAL
              </div>
            </div>
          </div>

          {/* A4 Document Container */}
          <div className="relative bg-white min-h-[297mm] p-[25mm] print:p-[20mm] flex flex-col z-10">
            {/* Professional Header */}
            <div className="border-b-2 border-gray-800 pb-4 mb-6">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h1 className="text-3xl font-bold text-gray-900 tracking-tight">VINICIUS INTERNATIONAL</h1>
                  <p className="text-sm text-gray-600 mt-1 font-medium">Official Memorandum</p>
                </div>
                <div className="text-right">
                  <div className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-md ${
                    selectedMemo?.priority === 'urgent' ? 'bg-red-50 border border-red-200' :
                    selectedMemo?.priority === 'high' ? 'bg-orange-50 border border-orange-200' :
                    selectedMemo?.priority === 'medium' ? 'bg-yellow-50 border border-yellow-200' :
                    'bg-gray-50 border border-gray-200'
                  }`}>
                    {selectedMemo?.priority === 'urgent' && (
                      <AlertCircle className="h-4 w-4 text-red-600" />
                    )}
                    <span className={`text-xs font-semibold uppercase tracking-wide ${
                      selectedMemo?.priority === 'urgent' ? 'text-red-700' :
                      selectedMemo?.priority === 'high' ? 'text-orange-700' :
                      selectedMemo?.priority === 'medium' ? 'text-yellow-700' :
                      'text-gray-700'
                    }`}>
                      {selectedMemo?.priority || 'Standard'} Priority
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Memo Metadata */}
            <div className="mb-6 space-y-3 text-sm bg-gray-50 p-4 rounded-lg border border-gray-200">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <span className="font-semibold text-gray-700">From:</span>
                  <span className="ml-2 text-gray-900">{selectedMemo?.createdBy?.fullName || 'N/A'}</span>
                </div>
                <div>
                  <span className="font-semibold text-gray-700">Date:</span>
                  <span className="ml-2 text-gray-900">
                    {selectedMemo?.createdAt && format(new Date(selectedMemo.createdAt), 'MMMM dd, yyyy')}
                  </span>
                </div>
              </div>
              {selectedMemo?.expiresAt && (
                <div>
                  <span className="font-semibold text-gray-700">Expires:</span>
                  <span className="ml-2 text-gray-900">
                    {format(new Date(selectedMemo.expiresAt), 'MMMM dd, yyyy')}
                  </span>
                </div>
              )}
            </div>

            {/* Memo Title */}
            <div className="mb-6">
              <h2 className="text-2xl font-bold text-gray-900 leading-tight border-l-4 border-gray-800 pl-4">
                {selectedMemo?.title}
              </h2>
            </div>

            {/* Memo Content */}
            {selectedMemo?.content && (
              <div 
                className="flex-1 prose prose-lg max-w-none text-gray-800 leading-relaxed
                  prose-headings:font-bold prose-headings:text-gray-900 prose-headings:mt-6 prose-headings:mb-4
                  prose-h1:text-2xl prose-h2:text-xl prose-h3:text-lg
                  prose-p:mb-4 prose-p:text-justify prose-p:text-[15px]
                  prose-strong:text-gray-900 prose-strong:font-semibold
                  prose-ul:list-disc prose-ul:ml-6 prose-ul:mb-4 prose-ul:space-y-2
                  prose-ol:list-decimal prose-ol:ml-6 prose-ol:mb-4 prose-ol:space-y-2
                  prose-li:mb-2 prose-li:text-[15px]
                  prose-a:text-blue-700 prose-a:underline hover:prose-a:text-blue-800
                  prose-hr:border-gray-300 prose-hr:my-6
                  prose-blockquote:border-l-4 prose-blockquote:border-gray-300 prose-blockquote:pl-4 prose-blockquote:italic
                  prose-code:bg-gray-100 prose-code:px-1.5 prose-code:py-0.5 prose-code:rounded prose-code:text-sm
                  prose-pre:bg-gray-900 prose-pre:text-gray-100"
                dangerouslySetInnerHTML={{ 
                  __html: typeof window !== 'undefined' 
                    ? DOMPurify.sanitize(selectedMemo.content)
                    : selectedMemo.content 
                }}
              />
            )}

            {/* Professional Footer */}
            <div className="mt-12 pt-6 border-t-2 border-gray-300">
              <div className="flex justify-between items-end text-xs text-gray-600">
                <div>
                  <p className="font-semibold text-gray-700 text-sm">Vinicius International</p>
                  <p className="mt-1">Confidential Document</p>
                </div>
                <div className="text-right">
                  <p className="font-medium">Page 1 of 1</p>
                  <p className="mt-1">
                    Generated: {format(new Date(), 'MMM dd, yyyy HH:mm')}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
