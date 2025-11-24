'use client';

import { useState } from 'react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import type { Document } from '@/types';
import { Edit, Trash2, Eye, FileText, Inbox, Globe, Lock, ArrowUpDown, ArrowUp, ArrowDown } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { cn } from '@/lib/utils';

interface Props {
  documents: Document[];
  onEdit?: (document: Document) => void;
  onDelete?: (id: string) => void;
  canEdit?: boolean;
  canDelete?: boolean;
  isLoading?: boolean;
}

type SortField = 'title' | 'documentType' | 'correspondent' | 'owner' | 'size' | 'createdAt' | 'modifiedAt' | 'isPublic';
type SortOrder = 'asc' | 'desc';

export function DocumentDetailsView({
  documents,
  onEdit,
  onDelete,
  canEdit = false,
  canDelete = false,
  isLoading = false,
}: Props) {
  const router = useRouter();
  const [sortField, setSortField] = useState<SortField>('createdAt');
  const [sortOrder, setSortOrder] = useState<SortOrder>('desc');

  const formatDate = (iso?: string) => {
    if (!iso) return 'N/A';
    return new Date(iso).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const formatFileSize = (bytes?: number) => {
    if (!bytes) return 'N/A';
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(2)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
  };

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortOrder('asc');
    }
  };

  const sortedDocuments = [...documents].sort((a, b) => {
    let aValue: any;
    let bValue: any;

    switch (sortField) {
      case 'title':
        aValue = a.title.toLowerCase();
        bValue = b.title.toLowerCase();
        break;
      case 'documentType':
        aValue = a.documentType?.name || '';
        bValue = b.documentType?.name || '';
        break;
      case 'correspondent':
        aValue = a.correspondent?.name || '';
        bValue = b.correspondent?.name || '';
        break;
      case 'owner':
        aValue = a.owner?.fullName || '';
        bValue = b.owner?.fullName || '';
        break;
      case 'size':
        aValue = a.size || 0;
        bValue = b.size || 0;
        break;
      case 'createdAt':
        aValue = new Date(a.createdAt).getTime();
        bValue = new Date(b.createdAt).getTime();
        break;
      case 'modifiedAt':
        aValue = new Date(a.modifiedAt).getTime();
        bValue = new Date(b.modifiedAt).getTime();
        break;
      case 'isPublic':
        aValue = a.isPublic ? 1 : 0;
        bValue = b.isPublic ? 1 : 0;
        break;
      default:
        return 0;
    }

    if (aValue < bValue) return sortOrder === 'asc' ? -1 : 1;
    if (aValue > bValue) return sortOrder === 'asc' ? 1 : -1;
    return 0;
  });

  const SortIcon = ({ field }: { field: SortField }) => {
    if (sortField !== field) {
      return <ArrowUpDown className="h-3 w-3 ml-1 opacity-50" />;
    }
    return sortOrder === 'asc' ? (
      <ArrowUp className="h-3 w-3 ml-1" />
    ) : (
      <ArrowDown className="h-3 w-3 ml-1" />
    );
  };

  if (isLoading) {
    return (
      <div className="border rounded-lg overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow className="bg-gray-50">
              <TableHead>Name</TableHead>
              <TableHead>Type</TableHead>
              <TableHead>Correspondent</TableHead>
              <TableHead>Owner</TableHead>
              <TableHead>Size</TableHead>
              <TableHead>Date Modified</TableHead>
              <TableHead>Date Created</TableHead>
              <TableHead>Status</TableHead>
              {(canEdit || canDelete) && <TableHead className="text-right">Actions</TableHead>}
            </TableRow>
          </TableHeader>
          <TableBody>
            {Array.from({ length: 5 }).map((_, i) => (
              <TableRow key={i}>
                <TableCell><Skeleton className="h-4 w-32" /></TableCell>
                <TableCell><Skeleton className="h-4 w-20" /></TableCell>
                <TableCell><Skeleton className="h-4 w-24" /></TableCell>
                <TableCell><Skeleton className="h-4 w-28" /></TableCell>
                <TableCell><Skeleton className="h-4 w-16" /></TableCell>
                <TableCell><Skeleton className="h-4 w-32" /></TableCell>
                <TableCell><Skeleton className="h-4 w-32" /></TableCell>
                <TableCell><Skeleton className="h-4 w-16" /></TableCell>
                {(canEdit || canDelete) && (
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-2">
                      <Skeleton className="h-8 w-8" />
                      <Skeleton className="h-8 w-8" />
                    </div>
                  </TableCell>
                )}
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    );
  }

  return (
    <div className="border rounded-lg overflow-hidden">
      <Table>
        <TableHeader>
          <TableRow className="bg-gray-50">
            <TableHead>
              <button
                onClick={() => handleSort('title')}
                className="flex items-center hover:text-foreground transition-colors"
              >
                Name
                <SortIcon field="title" />
              </button>
            </TableHead>
            <TableHead>
              <button
                onClick={() => handleSort('documentType')}
                className="flex items-center hover:text-foreground transition-colors"
              >
                Type
                <SortIcon field="documentType" />
              </button>
            </TableHead>
            <TableHead>
              <button
                onClick={() => handleSort('correspondent')}
                className="flex items-center hover:text-foreground transition-colors"
              >
                Correspondent
                <SortIcon field="correspondent" />
              </button>
            </TableHead>
            <TableHead>
              <button
                onClick={() => handleSort('owner')}
                className="flex items-center hover:text-foreground transition-colors"
              >
                Owner
                <SortIcon field="owner" />
              </button>
            </TableHead>
            <TableHead>
              <button
                onClick={() => handleSort('size')}
                className="flex items-center hover:text-foreground transition-colors"
              >
                Size
                <SortIcon field="size" />
              </button>
            </TableHead>
            <TableHead>
              <button
                onClick={() => handleSort('modifiedAt')}
                className="flex items-center hover:text-foreground transition-colors"
              >
                Date Modified
                <SortIcon field="modifiedAt" />
              </button>
            </TableHead>
            <TableHead>
              <button
                onClick={() => handleSort('createdAt')}
                className="flex items-center hover:text-foreground transition-colors"
              >
                Date Created
                <SortIcon field="createdAt" />
              </button>
            </TableHead>
            <TableHead>
              <button
                onClick={() => handleSort('isPublic')}
                className="flex items-center hover:text-foreground transition-colors"
              >
                Status
                <SortIcon field="isPublic" />
              </button>
            </TableHead>
            {(canEdit || canDelete) && <TableHead className="text-right">Actions</TableHead>}
          </TableRow>
        </TableHeader>
        <TableBody>
          {sortedDocuments.length === 0 ? (
            <TableRow>
              <TableCell colSpan={canEdit || canDelete ? 10 : 9} className="text-center py-12">
                <div className="flex flex-col items-center justify-center gap-3">
                  <Inbox className="h-12 w-12 text-gray-400" />
                  <div>
                    <p className="text-sm font-medium text-gray-900">No documents found</p>
                    <p className="text-sm text-gray-500 mt-1">
                      {isLoading ? 'Loading documents...' : 'Get started by creating a new document'}
                    </p>
                  </div>
                </div>
              </TableCell>
            </TableRow>
          ) : (
            sortedDocuments.map((document) => (
              <TableRow key={document.id} className="hover:bg-gray-50">
                <TableCell>
                  <div className="flex items-center gap-2">
                    <FileText className="h-4 w-4 text-gray-400 flex-shrink-0" />
                    <div className="flex-1 min-w-0">
                      <button
                        onClick={() => router.push(`/documents/${document.id}`)}
                        className="text-left font-medium text-blue-600 hover:text-blue-800 hover:underline truncate block"
                        title={document.title}
                      >
                        {document.title}
                      </button>
                      {document.tags && document.tags.length > 0 && (
                        <div className="flex flex-wrap gap-1 mt-1">
                          {document.tags.slice(0, 2).map((tag) => (
                            <Badge key={tag.id} variant="outline" className="text-xs h-5 px-1.5">
                              {tag.name}
                            </Badge>
                          ))}
                          {document.tags.length > 2 && (
                            <Badge variant="outline" className="text-xs h-5 px-1.5">
                              +{document.tags.length - 2}
                            </Badge>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                </TableCell>
                <TableCell>
                  {document.documentType ? (
                    <Badge variant="secondary">{document.documentType.name}</Badge>
                  ) : (
                    <span className="text-gray-400">-</span>
                  )}
                </TableCell>
                <TableCell>
                  {document.correspondent ? (
                    <span className="text-sm">{document.correspondent.name}</span>
                  ) : (
                    <span className="text-gray-400">-</span>
                  )}
                </TableCell>
                <TableCell>
                  {document.owner ? (
                    <span className="text-sm">{document.owner.fullName}</span>
                  ) : (
                    <span className="text-gray-400">-</span>
                  )}
                </TableCell>
                <TableCell>
                  <span className="text-sm text-gray-600">{formatFileSize(document.size)}</span>
                </TableCell>
                <TableCell>
                  <span className="text-sm text-gray-600">{formatDate(document.modifiedAt)}</span>
                </TableCell>
                <TableCell>
                  <span className="text-sm text-gray-600">{formatDate(document.createdAt)}</span>
                </TableCell>
                <TableCell>
                  {document.isPublic ? (
                    <Badge variant="default" className="bg-green-100 text-green-700 border-green-200">
                      <Globe className="h-3 w-3 mr-1" />
                      Public
                    </Badge>
                  ) : (
                    <Badge variant="secondary" className="border-gray-200">
                      <Lock className="h-3 w-3 mr-1" />
                      Private
                    </Badge>
                  )}
                </TableCell>
                {(canEdit || canDelete) && (
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => router.push(`/documents/${document.id}`)}
                        title="View"
                      >
                        <Eye className="h-4 w-4" />
                      </Button>
                      {canEdit && onEdit && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => onEdit(document)}
                          title="Edit"
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                      )}
                      {canDelete && onDelete && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => onDelete(document.id)}
                          title="Delete"
                        >
                          <Trash2 className="h-4 w-4 text-red-600" />
                        </Button>
                      )}
                    </div>
                  </TableCell>
                )}
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>
    </div>
  );
}

