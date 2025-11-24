'use client';

import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { MultiSelect } from '@/components/ui/multi-select';
import type { DocumentFilters, Tag, Correspondent, DocumentType } from '@/types';

interface Props {
  filters: DocumentFilters;
  onFiltersChange: (filters: DocumentFilters) => void;
  tags: Tag[];
  correspondents: Correspondent[];
  documentTypes: DocumentType[];
}

export function DocumentFilters({
  filters,
  onFiltersChange,
  tags,
  correspondents,
  documentTypes,
}: Props) {
  const tagOptions = tags.map((t) => ({
    id: t.id,
    label: t.name,
    value: t.id,
  }));

  return (
    <div className="space-y-4">
        <div>
          <Label>Tags</Label>
          <div className="mt-2">
            <MultiSelect
              options={tagOptions}
              selected={filters.tagIds || []}
              onChange={(ids) => onFiltersChange({ ...filters, tagIds: ids })}
              placeholder="Select tags..."
              searchPlaceholder="Search tags..."
              emptyMessage="No tags found"
            />
          </div>
        </div>

        <div>
          <Label>Correspondent</Label>
          <Select
            value={filters.correspondentId || 'all'}
            onValueChange={(v) => onFiltersChange({ ...filters, correspondentId: v === 'all' ? undefined : v })}
          >
            <SelectTrigger className="mt-2">
              <SelectValue placeholder="All correspondents" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All</SelectItem>
              {correspondents.map((c) => (
                <SelectItem key={c.id} value={c.id}>
                  {c.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div>
          <Label>Document Type</Label>
          <Select
            value={filters.documentTypeId || 'all'}
            onValueChange={(v) => onFiltersChange({ ...filters, documentTypeId: v === 'all' ? undefined : v })}
          >
            <SelectTrigger className="mt-2">
              <SelectValue placeholder="All types" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All</SelectItem>
              {documentTypes.map((dt) => (
                <SelectItem key={dt.id} value={dt.id}>
                  {dt.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div>
          <Label>Date From</Label>
          <Input
            type="date"
            value={filters.dateFrom || ''}
            onChange={(e) => onFiltersChange({ ...filters, dateFrom: e.target.value || undefined })}
            className="mt-2"
          />
        </div>

        <div>
          <Label>Date To</Label>
          <Input
            type="date"
            value={filters.dateTo || ''}
            onChange={(e) => onFiltersChange({ ...filters, dateTo: e.target.value || undefined })}
            className="mt-2"
          />
        </div>

        <div className="flex items-center space-x-2">
          <Checkbox
            id="isPublic"
            checked={filters.isPublic === true}
            onCheckedChange={(checked) =>
              onFiltersChange({ ...filters, isPublic: checked === true ? true : undefined })
            }
          />
          <Label htmlFor="isPublic" className="cursor-pointer">
            Public only
          </Label>
        </div>

        <div>
          <Label>Sort By</Label>
          <Select
            value={filters.sortBy || 'createdAt'}
            onValueChange={(v) => onFiltersChange({ ...filters, sortBy: v as any })}
          >
            <SelectTrigger className="mt-2">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="createdAt">Created Date</SelectItem>
              <SelectItem value="modifiedAt">Modified Date</SelectItem>
              <SelectItem value="title">Title</SelectItem>
              <SelectItem value="size">Size</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div>
          <Label>Sort Order</Label>
          <Select
            value={filters.sortOrder || 'desc'}
            onValueChange={(v) => onFiltersChange({ ...filters, sortOrder: v as any })}
          >
            <SelectTrigger className="mt-2">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="asc">Ascending</SelectItem>
              <SelectItem value="desc">Descending</SelectItem>
            </SelectContent>
          </Select>
        </div>
    </div>
  );
}

