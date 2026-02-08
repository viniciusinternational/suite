'use client';

import Image from 'next/image'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import type { Team } from '@/types'
import { Eye, Edit, Trash2, Users } from 'lucide-react'

interface Props {
  teams: Team[]
  onView?: (team: Team) => void
  onEdit?: (team: Team) => void
  onDelete?: (id: string) => void
  isLoading?: boolean
}

export function TeamTable({ teams, onView, onEdit, onDelete, isLoading = false }: Props) {
  return (
    <div className="border rounded-lg">
      <Table>
        <TableHeader>
          <TableRow className="bg-gray-50">
            <TableHead>Title</TableHead>
            <TableHead>Purpose</TableHead>
            <TableHead>Leader</TableHead>
            <TableHead>Members</TableHead>
            <TableHead>Tasks</TableHead>
            <TableHead>Status</TableHead>
            <TableHead className="text-right">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {isLoading ? (
            Array.from({ length: 5 }).map((_, i) => (
              <TableRow key={i}>
                <TableCell><Skeleton className="h-5 w-32" /></TableCell>
                <TableCell><Skeleton className="h-5 w-48" /></TableCell>
                <TableCell><Skeleton className="h-5 w-24" /></TableCell>
                <TableCell><Skeleton className="h-5 w-12" /></TableCell>
                <TableCell><Skeleton className="h-5 w-8" /></TableCell>
                <TableCell><Skeleton className="h-5 w-14" /></TableCell>
                <TableCell className="text-right"><Skeleton className="h-8 w-24 ml-auto" /></TableCell>
              </TableRow>
            ))
          ) : teams.length === 0 ? (
            <TableRow>
              <TableCell colSpan={7} className="text-center py-8 text-gray-600">
                No teams found
              </TableCell>
            </TableRow>
          ) : (
            teams.map((team) => (
              <TableRow key={team.id}>
                <TableCell className="font-medium">{team.title}</TableCell>
                <TableCell className="max-w-xs truncate">{team.purpose || '-'}</TableCell>
                <TableCell>
                  {team.leader ? (
                    <div className="flex items-center gap-2">
                      {team.leader.avatar && (
                        <Image
                          src={team.leader.avatar}
                          alt={team.leader.fullName}
                          width={24}
                          height={24}
                          className="h-6 w-6 rounded-full object-cover"
                        />
                      )}
                      <span className="text-sm">{team.leader.fullName}</span>
                    </div>
                  ) : (
                    <span className="text-gray-400 text-sm">-</span>
                  )}
                </TableCell>
                <TableCell>
                  <div className="flex items-center gap-2">
                    <Users className="w-4 h-4 text-gray-500" />
                    <span className="text-sm">{team.users?.length || 0}</span>
                  </div>
                </TableCell>
                <TableCell>
                  <span className="text-sm">{team.tasks?.length || 0}</span>
                </TableCell>
                <TableCell>
                  <Badge variant={team.isActive ? 'default' : 'secondary'}>
                    {team.isActive ? 'Active' : 'Inactive'}
                  </Badge>
                </TableCell>
                <TableCell className="text-right space-x-2">
                  {onView && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => onView(team)}
                      className="h-8 w-8 p-0"
                    >
                      <Eye className="h-4 w-4" />
                    </Button>
                  )}
                  {onEdit && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => onEdit(team)}
                      className="h-8 w-8 p-0"
                    >
                      <Edit className="h-4 w-4" />
                    </Button>
                  )}
                  {onDelete && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => onDelete(team.id)}
                      className="h-8 w-8 p-0 text-red-600 hover:text-red-700"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  )}
                </TableCell>
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>
    </div>
  )
}

