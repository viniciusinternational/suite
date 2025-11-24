'use client';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { LayoutToggle, type LayoutView } from './layout-toggle';
import { Plus, Search, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';

interface ExplorerToolbarProps {
  title: string;
  search: string;
  onSearchChange: (value: string) => void;
  onNewClick?: () => void;
  layoutView?: LayoutView;
  onLayoutViewChange?: (view: LayoutView) => void;
  showLayoutToggle?: boolean;
  isSearching?: boolean;
  newButtonLabel?: string;
  className?: string;
}

export function ExplorerToolbar({
  title,
  search,
  onSearchChange,
  onNewClick,
  layoutView,
  onLayoutViewChange,
  showLayoutToggle = false,
  isSearching = false,
  newButtonLabel = 'New',
  className,
}: ExplorerToolbarProps) {
  return (
    <div className={cn('flex items-center justify-between gap-4 pb-4 border-b', className)}>
      <h1 className="text-2xl font-bold">{title}</h1>
      
      <div className="flex items-center gap-3 flex-1 max-w-2xl">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
          <Input
            placeholder="Search..."
            value={search}
            onChange={(e) => onSearchChange(e.target.value)}
            className="pl-10"
          />
          {isSearching && (
            <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400 animate-spin" />
          )}
        </div>
        
        {showLayoutToggle && layoutView && onLayoutViewChange && (
          <LayoutToggle view={layoutView} onViewChange={onLayoutViewChange} />
        )}
        
        {onNewClick && (
          <Button onClick={onNewClick}>
            <Plus className="h-4 w-4 mr-2" />
            {newButtonLabel}
          </Button>
        )}
      </div>
    </div>
  );
}

