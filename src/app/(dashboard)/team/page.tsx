'use client';

import { useState } from 'react'
import { useAuthGuard } from '@/hooks/use-auth-guard'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { TeamForm } from '@/components/team/team-form'
import { TeamTable } from '@/components/team/team-table'
import { TeamDetail } from '@/components/team/team-detail'
import { useDeleteTeam, useTeams } from '@/hooks/use-teams'
import { useAddUsersToTeam, useRemoveUserFromTeam } from '@/hooks/use-team-users'
import type { Team } from '@/types'
import { Plus, Search, X } from 'lucide-react'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'

export default function TeamPage() {
  useAuthGuard(['view_team'])

  const [search, setSearch] = useState('')
  const [isFormOpen, setIsFormOpen] = useState(false)
  const [isDetailOpen, setIsDetailOpen] = useState(false)
  const [isAddUsersOpen, setIsAddUsersOpen] = useState(false)
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)
  const [editing, setEditing] = useState<Team | null>(null)
  const [viewing, setViewing] = useState<Team | null>(null)
  const [teamToDelete, setTeamToDelete] = useState<string | null>(null)

  const { data: teams = [] } = useTeams({ q: search || undefined })
  const deleteMutation = useDeleteTeam()
  const addUsersMutation = useAddUsersToTeam(viewing?.id || '')
  const removeUserMutation = useRemoveUserFromTeam(viewing?.id || '')

  const handleView = (team: Team) => {
    setViewing(team)
    setIsDetailOpen(true)
  }

  const handleEdit = (team: Team) => {
    setEditing(team)
    setIsFormOpen(true)
  }

  const handleDelete = (id: string) => {
    setTeamToDelete(id)
    setIsDeleteDialogOpen(true)
  }

  const confirmDelete = () => {
    if (teamToDelete) {
      deleteMutation.mutate(teamToDelete)
      setTeamToDelete(null)
      setIsDeleteDialogOpen(false)
    }
  }

  const handleAddUsers = async (userIds: string[]) => {
    if (viewing?.id && userIds.length > 0) {
      await addUsersMutation.mutateAsync({ userIds })
      // Refresh team data
      setIsDetailOpen(false)
      setTimeout(() => {
        setViewing(teams.find((t) => t.id === viewing.id) || null)
        setIsDetailOpen(true)
      }, 100)
    }
  }

  const handleRemoveUser = async (userId: string) => {
    if (viewing?.id) {
      await removeUserMutation.mutateAsync(userId)
      // Refresh team data
      setIsDetailOpen(false)
      setTimeout(() => {
        setViewing(teams.find((t) => t.id === viewing.id) || null)
        setIsDetailOpen(true)
      }, 100)
    }
  }

  return (
    <div className="space-y-6 p-6 bg-gray-50/50 min-h-screen">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Teams</h1>
          <p className="text-gray-600 mt-1">Manage teams and team members</p>
        </div>
        <div className="flex items-center space-x-2">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input
              className="pl-10"
              placeholder="Search teams..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <Button
            onClick={() => {
              setEditing(null)
              setIsFormOpen(true)
            }}
          >
            <Plus className="h-4 w-4 mr-2" />
            Create Team
          </Button>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>All Teams</CardTitle>
          <CardDescription>Manage your organization's teams</CardDescription>
        </CardHeader>
        <CardContent>
          <TeamTable
            teams={teams}
            onView={handleView}
            onEdit={handleEdit}
            onDelete={handleDelete}
          />
        </CardContent>
      </Card>

      {/* Create/Edit Team Dialog */}
      <Dialog open={isFormOpen} onOpenChange={setIsFormOpen}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editing ? 'Edit Team' : 'Create Team'}</DialogTitle>
            <DialogDescription>
              Fill the form below to {editing ? 'update' : 'create'} a team.
            </DialogDescription>
          </DialogHeader>
          <TeamForm
            team={editing}
            onSuccess={() => {
              setIsFormOpen(false)
              setEditing(null)
            }}
          />
        </DialogContent>
      </Dialog>

      {/* Team Detail Dialog */}
      <Dialog open={isDetailOpen} onOpenChange={setIsDetailOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Team Details</DialogTitle>
            <DialogDescription>View and manage team information</DialogDescription>
          </DialogHeader>
          {viewing && (
            <TeamDetail
              team={viewing}
              onEdit={() => {
                setIsDetailOpen(false)
                setEditing(viewing)
                setIsFormOpen(true)
              }}
              onAddUsers={() => {
                setIsAddUsersOpen(true)
              }}
              onRemoveUser={handleRemoveUser}
            />
          )}
        </DialogContent>
      </Dialog>

      {/* Add Users Dialog */}
      <Dialog open={isAddUsersOpen} onOpenChange={setIsAddUsersOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Add Team Members</DialogTitle>
            <DialogDescription>Select users to add to {viewing?.title}</DialogDescription>
          </DialogHeader>
          {/* User selector component would go here - for now, simplified */}
          <div className="p-4">
            <p className="text-sm text-gray-500">User selection UI to be implemented</p>
          </div>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete the team and remove all
              associated data.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setTeamToDelete(null)}>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={confirmDelete} className="bg-red-600 hover:bg-red-700">
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
