'use client';

import { useState, useEffect } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Avatar } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { useZitadelUsers } from '@/hooks/use-users';
import type { ZitadelUser } from '@/types';
import { Users, Search, RefreshCw, AlertCircle } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';

interface ZitadelUserSelectorProps {
  onSelect: (user: ZitadelUser | null) => void;
  selectedUserId?: string;
}

export function ZitadelUserSelector({ onSelect, selectedUserId }: ZitadelUserSelectorProps) {
  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  
  // Debounce search input
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(search);
    }, 300);

    return () => clearTimeout(timer);
  }, [search]);

  const { data: users, isLoading, error, refetch } = useZitadelUsers(debouncedSearch || '');

  const handleUserSelect = (user: ZitadelUser) => {
    onSelect(user);
  };

  return (
    <div className="space-y-4">
      {/* Search Input */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
        <Input
          placeholder="Search users by name or email..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="pl-10"
        />
      </div>

      {/* Error State */}
      {error && (
        <div className="flex flex-wrap items-center justify-center gap-2 rounded-lg border border-destructive/50 bg-destructive/10 p-4">
          <AlertCircle className="h-4 w-4 shrink-0 text-destructive" />
          <span className="text-sm text-destructive">Failed to fetch users from Zitadel</span>
          <Button
            variant="outline"
            size="sm"
            onClick={() => refetch()}
            className="shrink-0"
            aria-label="Retry"
          >
            <RefreshCw className="h-4 w-4 mr-1" />
            Retry
          </Button>
        </div>
      )}

      {/* Loading State */}
      {isLoading && (
        <div className="space-y-2">
          {[1, 2, 3].map((i) => (
            <div key={i} className="flex items-center space-x-3 rounded-lg border border-border/50 p-3">
              <Skeleton className="h-10 w-10 rounded-full" />
              <div className="space-y-2 flex-1">
                <Skeleton className="h-4 w-32" />
                <Skeleton className="h-3 w-48" />
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Users List */}
      {!isLoading && !error && users && (
        <div className="max-h-96 overflow-y-auto rounded-lg border border-border/50">
          {users.length === 0 ? (
            <div className="flex flex-col items-center justify-center p-8 text-center">
              <Users className="mb-4 h-12 w-12 text-muted-foreground" aria-hidden />
              <p className="text-sm font-medium text-foreground">
                {search ? 'No users found matching your search' : 'No users found'}
              </p>
            </div>
          ) : (
            <div className="divide-y divide-border/50">
              {users.map((user) => (
                <button
                  key={user.id}
                  type="button"
                  onClick={() => handleUserSelect(user)}
                  className={`w-full rounded-none p-4 text-left transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring ${
                    selectedUserId === user.id
                      ? 'border-l-4 border-l-primary bg-primary/5'
                      : 'hover:bg-muted/30'
                  }`}
                >
                  <div className="flex items-center space-x-3">
                    <Avatar className="h-10 w-10 bg-gray-200 flex items-center justify-center">
                      <Users className="h-5 w-5 text-gray-600" />
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-900 truncate">
                        {user.displayName || `${user.firstName} ${user.lastName}`}
                      </p>
                      <p className="text-sm text-gray-600 truncate">{user.email}</p>
                    </div>
                    {user.state && (
                      <Badge
                        variant={
                          user.state === 'USER_STATE_ACTIVE' ? 'default' : 'secondary'
                        }
                        className="ml-2"
                      >
                        {user.state === 'USER_STATE_ACTIVE' ? 'Active' : 'Inactive'}
                      </Badge>
                    )}
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
