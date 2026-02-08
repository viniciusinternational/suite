'use client';

import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import type { Document } from '@/types';
import { FileText, Inbox, Globe, Lock, Image as ImageIcon } from 'lucide-react';
import { useRouter } from 'next/navigation';

interface Props {
  documents: Document[];
  isLoading?: boolean;
}

export function DocumentGridView({
  documents,
  isLoading = false,
}: Props) {
  const router = useRouter();

  const formatDate = (iso?: string) => {
    if (!iso) return 'N/A';
    return new Date(iso).toLocaleDateString();
  };

  const formatFileSize = (bytes?: number) => {
    if (!bytes) return 'N/A';
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(2)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
  };

  const getFileIcon = (mimeType?: string) => {
    if (!mimeType) return FileText;
    if (mimeType.startsWith('image/')) return ImageIcon;
    return FileText;
  };

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {Array.from({ length: 8 }).map((_, i) => (
          <Card key={i}>
            <CardContent className="p-4">
              <Skeleton className="h-32 w-full mb-3" />
              <Skeleton className="h-4 w-full mb-2" />
              <Skeleton className="h-3 w-2/3" />
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  if (documents.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12">
        <Inbox className="h-16 w-16 text-gray-400 mb-4" />
        <p className="text-sm font-medium text-gray-900">No documents found</p>
        <p className="text-sm text-gray-500 mt-1">
          {isLoading ? 'Loading documents...' : 'Get started by creating a new document'}
        </p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
      {documents.map((document) => {
        const FileIcon = getFileIcon(document.mimeType);
        return (
          <Card
            key={document.id}
            className="group hover:shadow-md transition-shadow cursor-pointer"
            onClick={() => router.push(`/documents/${document.id}`)}
          >
            <CardContent className="p-4">
              {/* Thumbnail/Icon */}
              <div className="relative mb-3 aspect-video bg-gray-100 rounded-md flex items-center justify-center overflow-hidden">
                {document.thumbnailUrl ? (
                  <img
                    src={document.thumbnailUrl}
                    alt={document.title}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <FileIcon className="h-12 w-12 text-gray-400" />
                )}
              </div>

              {/* Title */}
              <h3
                className="font-medium text-sm mb-2 line-clamp-2 hover:text-blue-600 transition-colors"
                title={document.title}
              >
                {document.title}
              </h3>

              {/* Metadata */}
              <div className="space-y-1 text-xs text-gray-600">
                <div className="flex items-center justify-between">
                  <span>{formatFileSize(document.size)}</span>
                  {document.isPublic ? (
                    <Badge variant="default" className="bg-green-100 text-green-700 border-green-200 text-xs h-5">
                      <Globe className="h-3 w-3 mr-1" />
                      Public
                    </Badge>
                  ) : (
                    <Badge variant="secondary" className="border-gray-200 text-xs h-5">
                      <Lock className="h-3 w-3 mr-1" />
                      Private
                    </Badge>
                  )}
                </div>
                <div>{formatDate(document.createdAt)}</div>
                {document.documentType && (
                  <div>
                    <Badge variant="outline" className="text-xs">
                      {document.documentType.name}
                    </Badge>
                  </div>
                )}
              </div>

              {/* Tags */}
              {document.tags && document.tags.length > 0 && (
                <div className="flex flex-wrap gap-1 mt-2">
                  {document.tags.slice(0, 3).map((tag) => (
                    <Badge
                      key={tag.id}
                      variant="outline"
                      className="text-xs h-5 px-1.5"
                      style={tag.color ? { borderColor: tag.color, color: tag.color } : undefined}
                    >
                      {tag.name}
                    </Badge>
                  ))}
                  {document.tags.length > 3 && (
                    <Badge variant="outline" className="text-xs h-5 px-1.5">
                      +{document.tags.length - 3}
                    </Badge>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}

