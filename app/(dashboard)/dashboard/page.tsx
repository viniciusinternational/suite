'use client';

import { useState, useMemo } from 'react'
import { useAuthGuard } from '@/hooks/use-auth-guard'
import { EventCalendar } from '@/components/dashboard/event-calendar'
import { useMemos } from '@/hooks/use-memos'
import { useRequests } from '@/hooks/use-requests'
import { useEvents } from '@/hooks/use-events'
import { Dialog, DialogContent } from '@/components/ui/dialog'
import { Bell, ChevronRight, AlertCircle } from 'lucide-react'
import { format, addDays, startOfDay, endOfDay } from 'date-fns'
import Link from 'next/link'
import DOMPurify from 'dompurify'
import { ORGANIZATION_NAME, ORGANIZATION_NAME_UPPERCASE } from '@/constants'
import type { Memo } from '@/types'

export default function DashboardPage() {
  const { isChecking, user } = useAuthGuard()
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

  const eventsRange = useMemo(() => {
    const start = startOfDay(new Date())
    return {
      start: start.toISOString(),
      end: endOfDay(addDays(start, 7)).toISOString(),
    }
  }, [])
  const { data: events = [] } = useEvents(eventsRange, {
    enabled: shouldLoadData,
  })

  if (isChecking) {
    return (
      <div className="flex h-full items-center justify-center p-4 text-sm text-muted-foreground">
        Checking permissions...
      </div>
    )
  }

  if (!user) return null

  const pendingRequestsCount = requests.length
  const upcomingEventsCount = events.length

  return (
    <div className="flex flex-col h-full min-h-0">
      {/* Minimal header: title + greeting + optional quick links */}
      <div className="flex flex-wrap items-baseline justify-between gap-3 px-4 pt-2 pb-3 shrink-0">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">
            Dashboard
          </h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            Welcome back, {user.fullName}
          </p>
        </div>
        <div className="flex items-center gap-4 text-sm">
          <Link
            href="/dashboard/requests"
            className="text-muted-foreground hover:text-foreground transition-colors"
          >
            {pendingRequestsCount} pending
          </Link>
          <Link
            href="/dashboard/events"
            className="text-muted-foreground hover:text-foreground transition-colors"
          >
            {upcomingEventsCount} events
          </Link>
        </div>
      </div>

      {/* Full-height grid: calendar + memos */}
      <div className="grid grid-cols-1 lg:grid-cols-[minmax(0,1fr)_340px] gap-0 flex-1 min-h-0 lg:gap-6 px-4 pb-4">
        {/* Left: immersive calendar (no card) */}
        <div className="flex flex-col min-h-0 flex-1">
          <EventCalendar />
        </div>

        {/* Right: memos panel (minimal, full height) */}
        <div className="flex flex-col h-full min-h-0 lg:border-l border-border bg-card/50 lg:rounded-lg overflow-hidden shrink-0 lg:max-h-[calc(100vh-8rem)]">
          <div className="shrink-0 py-3 px-4 border-b border-border">
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-semibold text-foreground flex items-center gap-2">
                <Bell className="h-4 w-4 text-primary" />
                Recent Memos
              </h2>
              <span className="text-xs text-muted-foreground">
                {memos.length} active
              </span>
            </div>
          </div>
          <div className="flex-1 min-h-0 overflow-y-auto">
            {memosLoading ? (
              <div className="p-4 space-y-2">
                {[1, 2, 3, 4, 5].map((i) => (
                  <div
                    key={i}
                    className="h-14 bg-muted/60 animate-pulse rounded-md"
                  />
                ))}
              </div>
            ) : memos.length === 0 ? (
              <div className="p-8 text-center text-muted-foreground">
                <Bell className="h-8 w-8 mx-auto mb-2 opacity-40" />
                <p className="text-sm">No active memos</p>
              </div>
            ) : (
              <div className="divide-y divide-border">
                {memos.map((memo) => {
                  const priorityColors = {
                    urgent: 'bg-destructive',
                    high: 'bg-orange-500',
                    medium: 'bg-chart-1',
                    low: 'bg-muted-foreground/50',
                  }
                  return (
                    <button
                      key={memo.id}
                      type="button"
                      onClick={() => setSelectedMemo(memo)}
                      className="w-full px-4 py-3 hover:bg-muted/50 cursor-pointer transition-colors flex items-center gap-3 text-left"
                    >
                      <div
                        className={`w-1 h-8 rounded-full shrink-0 ${priorityColors[memo.priority]}`}
                      />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          {memo.priority === 'urgent' && (
                            <AlertCircle className="h-3 w-3 text-destructive shrink-0" />
                          )}
                          <p className="text-sm font-medium text-foreground truncate">
                            {memo.title}
                          </p>
                        </div>
                        <p className="text-xs text-muted-foreground">
                          {memo.createdBy?.fullName} •{' '}
                          {format(
                            new Date(memo.createdAt || ''),
                            'MMM d, h:mm a'
                          )}
                        </p>
                      </div>
                      <ChevronRight className="h-4 w-4 text-muted-foreground shrink-0" />
                    </button>
                  )
                })}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Memo Detail Modal - A4 Professional View (unchanged) */}
      <Dialog open={!!selectedMemo} onOpenChange={() => setSelectedMemo(null)}>
        <DialogContent
          className="!max-w-[210mm] !w-[210mm] !p-0 overflow-y-auto max-h-[90vh] bg-white print:shadow-none print:max-h-none relative"
          showCloseButton={true}
        >
          <div className="absolute inset-0 pointer-events-none opacity-[0.03] print:opacity-[0.08] z-0 overflow-hidden">
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 rotate-[-45deg]">
              <div className="text-[120px] font-black text-gray-400 select-none whitespace-nowrap tracking-wider">
                {ORGANIZATION_NAME_UPPERCASE}
              </div>
            </div>
          </div>

          <div className="relative bg-white min-h-[297mm] p-[25mm] print:p-[20mm] flex flex-col z-10">
            <div className="border-b-2 border-gray-800 pb-4 mb-6">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h1 className="text-3xl font-bold text-gray-900 tracking-tight">
                    {ORGANIZATION_NAME_UPPERCASE}
                  </h1>
                  <p className="text-sm text-gray-600 mt-1 font-medium">
                    Official Memorandum
                  </p>
                </div>
                <div className="text-right">
                  <div
                    className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-md ${
                      selectedMemo?.priority === 'urgent'
                        ? 'bg-red-50 border border-red-200'
                        : selectedMemo?.priority === 'high'
                          ? 'bg-orange-50 border border-orange-200'
                          : selectedMemo?.priority === 'medium'
                            ? 'bg-yellow-50 border border-yellow-200'
                            : 'bg-gray-50 border border-gray-200'
                    }`}
                  >
                    {selectedMemo?.priority === 'urgent' && (
                      <AlertCircle className="h-4 w-4 text-red-600" />
                    )}
                    <span
                      className={`text-xs font-semibold uppercase tracking-wide ${
                        selectedMemo?.priority === 'urgent'
                          ? 'text-red-700'
                          : selectedMemo?.priority === 'high'
                            ? 'text-orange-700'
                            : selectedMemo?.priority === 'medium'
                              ? 'text-yellow-700'
                              : 'text-gray-700'
                      }`}
                    >
                      {selectedMemo?.priority || 'Standard'} Priority
                    </span>
                  </div>
                </div>
              </div>
            </div>

            <div className="mb-6 space-y-3 text-sm bg-gray-50 p-4 rounded-lg border border-gray-200">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <span className="font-semibold text-gray-700">From:</span>
                  <span className="ml-2 text-gray-900">
                    {selectedMemo?.createdBy?.fullName || 'N/A'}
                  </span>
                </div>
                <div>
                  <span className="font-semibold text-gray-700">Date:</span>
                  <span className="ml-2 text-gray-900">
                    {selectedMemo?.createdAt &&
                      format(
                        new Date(selectedMemo.createdAt),
                        'MMMM dd, yyyy'
                      )}
                  </span>
                </div>
              </div>
              {selectedMemo?.expiresAt && (
                <div>
                  <span className="font-semibold text-gray-700">Expires:</span>
                  <span className="ml-2 text-gray-900">
                    {format(
                      new Date(selectedMemo.expiresAt),
                      'MMMM dd, yyyy'
                    )}
                  </span>
                </div>
              )}
            </div>

            <div className="mb-6">
              <h2 className="text-2xl font-bold text-gray-900 leading-tight border-l-4 border-gray-800 pl-4">
                {selectedMemo?.title}
              </h2>
            </div>

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
                  __html:
                    typeof window !== 'undefined'
                      ? DOMPurify.sanitize(selectedMemo.content)
                      : selectedMemo.content,
                }}
              />
            )}

            <div className="mt-12 pt-6 border-t-2 border-gray-300">
              <div className="flex justify-between items-end text-xs text-gray-600">
                <div>
                  <p className="font-semibold text-gray-700 text-sm">
                    {ORGANIZATION_NAME}
                  </p>
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
