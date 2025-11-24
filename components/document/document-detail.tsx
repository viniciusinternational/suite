'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import type { Document } from '@/types';
import { FileText, Download, Edit, Calendar, User, Tag as TagIcon, Eye, File, Image, Globe, Lock, ExternalLink } from 'lucide-react';
import { DocumentTags } from './document-tags';

interface Props {
  document: Document;
  onEdit?: () => void;
  canEdit?: boolean;
}

export function DocumentDetail({ document, onEdit, canEdit = false }: Props) {
  const formatDate = (iso?: string) => {
    if (!iso) return 'N/A';
    return new Date(iso).toLocaleString();
  };

  const formatFileSize = (bytes?: number) => {
    if (!bytes) return 'N/A';
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(2)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
  };

  const getFileIcon = () => {
    if (!document.mimeType) return <File className="h-5 w-5" />;
    if (document.mimeType.startsWith('image/')) return <Image className="h-5 w-5" />;
    return <FileText className="h-5 w-5" />;
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex flex-col gap-4">
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <CardTitle className="flex items-center gap-2 text-2xl">
                  {getFileIcon()}
                  {document.title}
                </CardTitle>
                <CardDescription className="mt-2 text-base">
                  {document.description || 'No description provided'}
                </CardDescription>
              </div>
              <div className="flex gap-2">
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
                {canEdit && onEdit && (
                  <Button variant="outline" size="sm" onClick={onEdit}>
                    <Edit className="h-4 w-4 mr-2" />
                    Edit
                  </Button>
                )}
              </div>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* File Actions */}
          {document.originalFileUrl && (
            <div className="flex flex-col gap-3">
              <div className="flex gap-2 flex-wrap">
                <Button
                  variant="default"
                  onClick={() => window.open(document.originalFileUrl, '_blank')}
                >
                  <Download className="h-4 w-4 mr-2" />
                  Download Original
                </Button>
                {document.pdfUrl && (
                  <Button
                    variant="outline"
                    onClick={() => window.open(document.pdfUrl, '_blank')}
                  >
                    <FileText className="h-4 w-4 mr-2" />
                    View PDF
                  </Button>
                )}
                {document.thumbnailUrl && (
                  <Button
                    variant="outline"
                    onClick={() => window.open(document.thumbnailUrl, '_blank')}
                  >
                    <Image className="h-4 w-4 mr-2" />
                    View Thumbnail
                  </Button>
                )}
              </div>
            </div>
          )}

          <Separator />

          {/* Metadata Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <div className="flex flex-col">
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2">
                Document Type
              </p>
              <p className="text-sm font-medium">
                {document.documentType ? (
                  <Badge variant="secondary">{document.documentType.name}</Badge>
                ) : (
                  <span className="text-muted-foreground">Not specified</span>
                )}
              </p>
            </div>
            <div className="flex flex-col">
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2">
                Correspondent
              </p>
              <p className="text-sm font-medium">
                {document.correspondent?.name || <span className="text-muted-foreground">Not specified</span>}
              </p>
            </div>
            <div className="flex flex-col">
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2">
                Owner
              </p>
              <div className="flex items-center gap-2">
                <User className="h-4 w-4 text-muted-foreground" />
                <p className="text-sm font-medium">
                  {document.owner?.fullName || <span className="text-muted-foreground">Unknown</span>}
                </p>
              </div>
            </div>
            <div className="flex flex-col">
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2">
                File Size
              </p>
              <p className="text-sm font-medium">{formatFileSize(document.size)}</p>
            </div>
            <div className="flex flex-col">
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2">
                Created
              </p>
              <div className="flex items-center gap-2">
                <Calendar className="h-4 w-4 text-muted-foreground" />
                <p className="text-sm font-medium">{formatDate(document.createdAt)}</p>
              </div>
            </div>
            <div className="flex flex-col">
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2">
                Modified
              </p>
              <div className="flex items-center gap-2">
                <Calendar className="h-4 w-4 text-muted-foreground" />
                <p className="text-sm font-medium">{formatDate(document.modifiedAt)}</p>
              </div>
            </div>
          </div>

          {/* Keywords */}
          {document.keywords && document.keywords.length > 0 && (
            <>
              <Separator />
              <div>
                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2">
                  Keywords
                </p>
                <div className="flex flex-wrap gap-2">
                  {document.keywords.map((keyword, idx) => (
                    <Badge key={idx} variant="outline" className="text-xs">
                      {keyword}
                    </Badge>
                  ))}
                </div>
              </div>
            </>
          )}

          {/* Tags */}
          {document.tags && document.tags.length > 0 && (
            <>
              <Separator />
              <div>
                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2 flex items-center gap-2">
                  <TagIcon className="h-4 w-4" />
                  Tags
                </p>
                <DocumentTags tags={document.tags} />
              </div>
            </>
          )}

          {/* Permissions Summary */}
          {(document.viewUsers?.length || document.viewDepartments?.length) && (
            <>
              <Separator />
              <div>
                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2">
                  Access Summary
                </p>
                <div className="flex flex-wrap gap-2 text-sm">
                  {document.viewUsers && document.viewUsers.length > 0 && (
                    <Badge variant="outline">
                      <Eye className="h-3 w-3 mr-1" />
                      {document.viewUsers.length} user{document.viewUsers.length !== 1 ? 's' : ''} can view
                    </Badge>
                  )}
                  {document.viewDepartments && document.viewDepartments.length > 0 && (
                    <Badge variant="outline">
                      <Eye className="h-3 w-3 mr-1" />
                      {document.viewDepartments.length} department{document.viewDepartments.length !== 1 ? 's' : ''} can view
                    </Badge>
                  )}
                </div>
              </div>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

