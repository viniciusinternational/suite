'use client';

import { useState, useEffect } from 'react'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'
import axios from '@/lib/axios'
import type { User } from '@/types'
import { Search, X } from 'lucide-react'

interface UserSelectorProps {
  selectedUserIds: string[]
  onSelectionChange: (userIds: string[]) => void
  excludeUserIds?: string[]
}

export function UserSelector({
  selectedUserIds,
  onSelectionChange,
  excludeUserIds = [],
}: UserSelectorProps) {
  const [users, setUsers] = useState<User[]>([])
  const [searchQuery, setSearchQuery] = useState('')

  useEffect(() => {
    // Load users
    ;(async () => {
      const res = await axios.get('/users')
      setUsers(res.data.data || [])
    })()
  }, [])

  const filteredUsers = users.filter((u) => {
    if (!u.isActive) return false
    if (excludeUserIds.includes(u.id)) return false
    if (searchQuery) {
      const query = searchQuery.toLowerCase()
      return (
        u.fullName.toLowerCase().includes(query) ||
        u.email.toLowerCase().includes(query) ||
        u.position.toLowerCase().includes(query)
      )
    }
    return true
  })

  const toggleUser = (userId: string) => {
    const newSelection = selectedUserIds.includes(userId)
      ? selectedUserIds.filter((id) => id !== userId)
      : [...selectedUserIds, userId]
    onSelectionChange(newSelection)
  }

  return (
    <div className="space-y-2">
      <div className="relative">
        <Search className="absolute left-2 top-2.5 h-4 w-4 text-gray-400" />
        <Input
          placeholder="Search users..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="pl-8"
        />
      </div>

      <div className="border rounded-md p-2 max-h-64 overflow-y-auto">
        {filteredUsers.length === 0 ? (
          <p className="text-sm text-gray-500 py-4 text-center">No users found</p>
        ) : (
          filteredUsers.map((user) => (
            <label
              key={user.id}
              className="flex items-center space-x-2 py-2 cursor-pointer hover:bg-gray-50 rounded px-2"
            >
              <input
                type="checkbox"
                checked={selectedUserIds.includes(user.id)}
                onChange={() => toggleUser(user.id)}
                className="rounded"
              />
              <div className="flex items-center gap-2 flex-1">
                {user.avatar && (
                  <img src={user.avatar} alt={user.fullName} className="w-6 h-6 rounded-full" />
                )}
                <div className="flex-1">
                  <span className="text-sm font-medium">{user.fullName}</span>
                  <span className="text-xs text-gray-500 ml-2">({user.position})</span>
                </div>
              </div>
            </label>
          ))
        )}
      </div>

      {selectedUserIds.length > 0 && (
        <div className="flex flex-wrap gap-2 pt-2">
          {selectedUserIds.map((userId) => {
            const user = users.find((u) => u.id === userId)
            if (!user) return null
            return (
              <div
                key={userId}
                className="flex items-center gap-1 bg-blue-50 text-blue-700 px-2 py-1 rounded text-sm"
              >
                <span>{user.fullName}</span>
                <button
                  type="button"
                  onClick={() => toggleUser(userId)}
                  className="hover:bg-blue-100 rounded p-0.5"
                >
                  <X className="h-3 w-3" />
                </button>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}

