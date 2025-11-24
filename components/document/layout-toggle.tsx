'use client';

import { Button } from '@/components/ui/button';
import { List, Grid3x3, Table2 } from 'lucide-react';
import { cn } from '@/lib/utils';

export type LayoutView = 'list' | 'grid' | 'details';

interface LayoutToggleProps {
  view: LayoutView;
  onViewChange: (view: LayoutView) => void;
  className?: string;
}

export function LayoutToggle({ view, onViewChange, className }: LayoutToggleProps) {
  return (
    <div className={cn('flex items-center gap-1 border rounded-md p-1 bg-background', className)}>
      <Button
        variant={view === 'list' ? 'default' : 'ghost'}
        size="sm"
        onClick={() => onViewChange('list')}
        className={cn(
          'h-8 px-3',
          view === 'list' && 'bg-primary text-primary-foreground'
        )}
        title="List View"
      >
        <List className="h-4 w-4" />
      </Button>
      <Button
        variant={view === 'grid' ? 'default' : 'ghost'}
        size="sm"
        onClick={() => onViewChange('grid')}
        className={cn(
          'h-8 px-3',
          view === 'grid' && 'bg-primary text-primary-foreground'
        )}
        title="Grid View"
      >
        <Grid3x3 className="h-4 w-4" />
      </Button>
      <Button
        variant={view === 'details' ? 'default' : 'ghost'}
        size="sm"
        onClick={() => onViewChange('details')}
        className={cn(
          'h-8 px-3',
          view === 'details' && 'bg-primary text-primary-foreground'
        )}
        title="Details View"
      >
        <Table2 className="h-4 w-4" />
      </Button>
    </div>
  );
}

