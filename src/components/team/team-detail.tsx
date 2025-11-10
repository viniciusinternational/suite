'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Button } from '@/components/ui/button'
import { Separator } from '@/components/ui/separator'
import type { Team } from '@/types'
import { Users, UserCheck, Calendar } from 'lucide-react'
import { format } from 'date-fns'

interface TeamDetailProps {
  team: Team
  onEdit?: () => void
  onAddUsers?: () => void
  onRemoveUser?: (userId: string) => void
}

export function TeamDetail({ team, onEdit, onAddUsers, onRemoveUser }: TeamDetailProps) {
  const getStatusBadge = (status: string) => {
    const statusMap: Record<string, { label: string; variant: 'default' | 'secondary' | 'destructive' }> = {
      todo: { label: 'Todo', variant: 'secondary' },
      in_progress: { label: 'In Progress', variant: 'default' },
      review: { label: 'Review', variant: 'default' },
      completed: { label: 'Completed', variant: 'default' },
    }
    const config = statusMap[status] || { label: status, variant: 'secondary' }
    return <Badge variant={config.variant}>{config.label}</Badge>
  }

  const getPriorityBadge = (priority: string) => {
    const priorityMap: Record<string, { label: string; variant: 'default' | 'secondary' | 'destructive' }> = {
      low: { label: 'Low', variant: 'secondary' },
      medium: { label: 'Medium', variant: 'default' },
      high: { label: 'High', variant: 'destructive' },
    }
    const config = priorityMap[priority] || { label: priority, variant: 'secondary' }
    return <Badge variant={config.variant}>{config.label}</Badge>
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">{team.title}</h2>
          {team.purpose && <p className="text-gray-600 mt-1">{team.purpose}</p>}
        </div>
        <div className="flex items-center gap-2">
          <Badge variant={team.isActive ? 'default' : 'secondary'}>
            {team.isActive ? 'Active' : 'Inactive'}
          </Badge>
          {onEdit && (
            <Button variant="outline" onClick={onEdit}>
              Edit Team
            </Button>
          )}
        </div>
      </div>

      {/* Leader */}
      {team.leader && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <UserCheck className="h-5 w-5" />
              Team Leader
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-3">
              {team.leader.avatar ? (
                <Avatar>
                  <AvatarImage src={team.leader.avatar} alt={team.leader.fullName} />
                  <AvatarFallback>
                    {team.leader.fullName
                      .split(' ')
                      .map((n) => n[0])
                      .join('')
                      .toUpperCase()}
                  </AvatarFallback>
                </Avatar>
              ) : (
                <div className="w-10 h-10 rounded-full bg-gray-200 flex items-center justify-center">
                  {team.leader.fullName
                    .split(' ')
                    .map((n) => n[0])
                    .join('')
                    .toUpperCase()}
                </div>
              )}
              <div>
                <p className="font-medium">{team.leader.fullName}</p>
                <p className="text-sm text-gray-500">{team.leader.email}</p>
                <p className="text-xs text-gray-400">{team.leader.role}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Team Members */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5" />
              Team Members ({team.users?.length || 0})
            </CardTitle>
            {onAddUsers && (
              <Button variant="outline" size="sm" onClick={onAddUsers}>
                Add Members
              </Button>
            )}
          </div>
        </CardHeader>
        <CardContent>
          {!team.users || team.users.length === 0 ? (
            <p className="text-gray-500 text-center py-4">No members added yet</p>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {team.users.map((user) => (
                <div
                  key={user.id}
                  className="flex items-center gap-3 p-3 border rounded-lg hover:bg-gray-50"
                >
                  {user.avatar ? (
                    <Avatar>
                      <AvatarImage src={user.avatar} alt={user.fullName} />
                      <AvatarFallback>
                        {user.fullName
                          .split(' ')
                          .map((n) => n[0])
                          .join('')
                          .toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                  ) : (
                    <div className="w-10 h-10 rounded-full bg-gray-200 flex items-center justify-center">
                      {user.fullName
                        .split(' ')
                        .map((n) => n[0])
                        .join('')
                        .toUpperCase()}
                    </div>
                  )}
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-sm truncate">{user.fullName}</p>
                    <p className="text-xs text-gray-500 truncate">{user.position}</p>
                    <p className="text-xs text-gray-400 truncate">{user.email}</p>
                  </div>
                  {onRemoveUser && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => onRemoveUser(user.id)}
                      className="text-red-600 hover:text-red-700"
                    >
                      Remove
                    </Button>
                  )}
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Tasks */}
      <Card>
        <CardHeader>
          <CardTitle>Assigned Tasks ({team.tasks?.length || 0})</CardTitle>
        </CardHeader>
        <CardContent>
          {!team.tasks || team.tasks.length === 0 ? (
            <p className="text-gray-500 text-center py-4">No tasks assigned</p>
          ) : (
            <div className="space-y-3">
              {team.tasks.map((task) => (
                <div
                  key={task.id}
                  className="flex items-center justify-between p-3 border rounded-lg hover:bg-gray-50"
                >
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <p className="font-medium">{task.name}</p>
                      {getStatusBadge(task.status)}
                      {getPriorityBadge(task.priority)}
                    </div>
                    {task.dueDate && (
                      <div className="flex items-center gap-1 text-xs text-gray-500">
                        <Calendar className="h-3 w-3" />
                        <span>Due: {format(new Date(task.dueDate), 'MMM dd, yyyy')}</span>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Metadata */}
      <Card>
        <CardHeader>
          <CardTitle>Team Information</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          <div className="flex items-center justify-between text-sm">
            <span className="text-gray-500">Created</span>
            <span className="font-medium">
              {team.createdAt ? format(new Date(team.createdAt), 'MMM dd, yyyy') : '-'}
            </span>
          </div>
          <Separator />
          <div className="flex items-center justify-between text-sm">
            <span className="text-gray-500">Last Updated</span>
            <span className="font-medium">
              {team.updatedAt ? format(new Date(team.updatedAt), 'MMM dd, yyyy') : '-'}
            </span>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

