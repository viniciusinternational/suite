'use client';

import { useState } from 'react'
import { useAuthGuard } from '@/hooks/use-auth-guard'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { EventCalendar } from '@/components/dashboard/event-calendar'
import { InfoCards } from '@/components/dashboard/info-cards'
import { MemoList } from '@/components/memo/memo-list'
import { MemoForm } from '@/components/memo/memo-form'
import { EventForm } from '@/components/event/event-form'
import { useMemos } from '@/hooks/use-memos'
import { useEvents } from '@/hooks/use-events'
import { hasPermission } from '@/lib/permissions'
import { Plus, Bell } from 'lucide-react'
import type { Memo, Event as AppEvent } from '@/types'

export default function DashboardPage() {
  const { user } = useAuthGuard()
  const [memoDialogOpen, setMemoDialogOpen] = useState(false)
  const [eventDialogOpen, setEventDialogOpen] = useState(false)
  const [editingMemo, setEditingMemo] = useState<Memo | null>(null)
  const [editingEvent, setEditingEvent] = useState<AppEvent | null>(null)

  if (!user) return null

  // Check if user can add memos
  const canAddMemo = user && hasPermission(user, 'add_memos')
  
  // Check if user can add events
  const canAddEvent = user && hasPermission(user, 'add_events')
  
  // Check if user can edit memos
  const canEditMemo = user && hasPermission(user, 'edit_memos')

  // Fetch memos for the user
  const { data: memos = [], isLoading: memosLoading } = useMemos({ isActive: true })

  const handleMemoSuccess = () => {
    setMemoDialogOpen(false)
    setEditingMemo(null)
  }

  const handleEventSuccess = () => {
    setEventDialogOpen(false)
    setEditingEvent(null)
  }

  const handleEditMemo = (memo: Memo) => {
    setEditingMemo(memo)
    setMemoDialogOpen(true)
  }

  const handleEditEvent = (event: AppEvent) => {
    setEditingEvent(event)
    setEventDialogOpen(true)
  }

  return (
    <div className="space-y-6 h-[calc(100vh-120px)] flex flex-col">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
          <p className="text-gray-600 mt-1">Welcome back, {user.fullName}</p>
        </div>
      </div>

      {/* Main Content: Calendar + Sidebar Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-[1fr_400px] gap-6 flex-1 min-h-0">
        {/* Left: Calendar */}
        <div className="min-h-0">
          <EventCalendar 
            onAddEvent={() => {
              setEditingEvent(null)
              setEventDialogOpen(true)
            }}
            canAddEvent={canAddEvent}
          />
        </div>

        {/* Right: Sidebar */}
        <div className="space-y-4 overflow-y-auto">
          {/* Welcome Message */}
          <Card className="bg-gradient-to-br from-blue-50 to-indigo-50 border-blue-200">
            <CardHeader className="pb-3">
              <CardTitle className="text-lg">Welcome!</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-gray-600">
                Stay informed with upcoming events, recent memos, and important updates.
              </p>
            </CardContent>
          </Card>

          {/* Info Cards */}
          <InfoCards userId={user.id} />

          {/* Memos Section */}
          <Card>
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <Bell className="h-5 w-5 text-orange-600" />
                  <CardTitle className="text-base">Memos</CardTitle>
                </div>
                {canAddMemo && (
                  <Button 
                    size="sm" 
                    onClick={() => {
                      setEditingMemo(null)
                      setMemoDialogOpen(true)
                    }}
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Add Memo
                  </Button>
                )}
              </div>
            </CardHeader>
            <CardContent>
              {memosLoading ? (
                <div className="text-center py-4 text-gray-500">
                  <p>Loading memos...</p>
                </div>
              ) : (
                <MemoList 
                  memos={memos} 
                  onEdit={handleEditMemo}
                  canEdit={canEditMemo}
                />
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Memo Dialog */}
      {(canAddMemo || canEditMemo) && (
        <Dialog open={memoDialogOpen} onOpenChange={setMemoDialogOpen}>
          <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editingMemo ? 'Edit Memo' : 'Create Memo'}</DialogTitle>
            <DialogDescription>
              {editingMemo ? 'Update the memo details below.' : 'Create a new memo for specific users or departments.'}
            </DialogDescription>
          </DialogHeader>
          <MemoForm 
            memo={editingMemo}
            onSuccess={handleMemoSuccess}
          />
          </DialogContent>
        </Dialog>
      )}

      {/* Event Dialog */}
      <Dialog open={eventDialogOpen} onOpenChange={setEventDialogOpen}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editingEvent ? 'Edit Event' : 'Create Event'}</DialogTitle>
            <DialogDescription>
              {editingEvent ? 'Update the event details below.' : 'Create a new event for your calendar.'}
            </DialogDescription>
          </DialogHeader>
          <EventForm 
            event={editingEvent}
            onSuccess={handleEventSuccess}
          />
        </DialogContent>
      </Dialog>
    </div>
  )
}
