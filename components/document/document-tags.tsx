'use client';

import { Badge } from '@/components/ui/badge';
import type { Tag } from '@/types';

interface Props {
  tags: Tag[];
}

export function DocumentTags({ tags }: Props) {
  return (
    <div className="flex flex-wrap gap-2">
      {tags.map((tag) => (
        <Badge
          key={tag.id}
          variant="secondary"
          style={tag.color ? { backgroundColor: tag.color, color: '#fff' } : undefined}
        >
          {tag.name}
        </Badge>
      ))}
    </div>
  );
}

