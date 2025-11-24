'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthGuard } from '@/hooks/use-auth-guard';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ExplorerToolbar } from '@/components/document/explorer-toolbar';
import { ExplorerSidebar } from '@/components/document/explorer-sidebar';
import { DocumentFilters } from '@/components/document/document-filters';
import { DocumentListView } from '@/components/document/document-list-view';
import { DocumentGridView } from '@/components/document/document-grid-view';
import { DocumentDetailsView } from '@/components/document/document-details-view';
import { TagsManager } from '@/components/document/tags-manager';
import { CorrespondentsManager } from '@/components/document/correspondents-manager';
import { DocumentTypesManager } from '@/components/document/document-types-manager';
import { useDocuments, useDeleteDocument } from '@/hooks/use-documents';
import { useTags } from '@/hooks/use-tags';
import { useCorrespondents } from '@/hooks/use-correspondents';
import { useDocumentTypes } from '@/hooks/use-document-types';
import { hasPermission } from '@/lib/permissions';
import type { DocumentFilters as DocumentFiltersType } from '@/types';
import type { LayoutView } from '@/components/document/layout-toggle';
import { FileText, Tag, User, FolderOpen } from 'lucide-react';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';

export default function DocumentsPage() {
  const { user } = useAuthGuard(['view_documents']);
  const router = useRouter();
  const [search, setSearch] = useState('');
  const [filters, setFilters] = useState<DocumentFiltersType>({});
  const [deleteDocumentId, setDeleteDocumentId] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState('documents');
  const [layoutView, setLayoutView] = useState<LayoutView>('list');

  // Load layout preference from localStorage
  useEffect(() => {
    const savedView = localStorage.getItem('documents-layout-view') as LayoutView;
    if (savedView && ['list', 'grid', 'details'].includes(savedView)) {
      setLayoutView(savedView);
    }
  }, []);

  // Save layout preference to localStorage
  const handleLayoutViewChange = (view: LayoutView) => {
    setLayoutView(view);
    localStorage.setItem('documents-layout-view', view);
  };

  const { data: tags = [] } = useTags();
  const { data: correspondents = [] } = useCorrespondents();
  const { data: documentTypes = [] } = useDocumentTypes();

  const { data: documents = [], isLoading, isFetching } = useDocuments({
    ...filters,
    search: search || undefined,
  });
  const deleteMutation = useDeleteDocument();

  const canAdd = hasPermission(user, 'add_documents');
  const canEdit = hasPermission(user, 'edit_documents');
  const canDelete = hasPermission(user, 'delete_documents');

  const handleDelete = async () => {
    if (!deleteDocumentId) return;
    try {
      await deleteMutation.mutateAsync(deleteDocumentId);
      setDeleteDocumentId(null);
    } catch (error) {
      console.error('Error deleting document:', error);
    }
  };

  const handleEdit = (document: any) => {
    router.push(`/documents/${document.id}/edit`);
  };

  const isMutating = deleteMutation.isPending;

  // Render document view based on layout
  const renderDocumentView = () => {
    const commonProps = {
      documents,
      onEdit: canEdit ? handleEdit : undefined,
      onDelete: canDelete ? (id: string) => setDeleteDocumentId(id) : undefined,
      canEdit,
      canDelete,
      isLoading,
    };

    switch (layoutView) {
      case 'grid':
        return <DocumentGridView {...commonProps} />;
      case 'details':
        return <DocumentDetailsView {...commonProps} />;
      case 'list':
      default:
        return <DocumentListView {...commonProps} />;
    }
  };

  return (
    <div className="flex flex-col h-full">
      {/* Toolbar */}
      <div className="px-6 pt-6 pb-4">
        <ExplorerToolbar
          title="Documents"
          search={search}
          onSearchChange={setSearch}
          onNewClick={canAdd && activeTab === 'documents' ? () => router.push('/documents/new') : undefined}
          layoutView={activeTab === 'documents' ? layoutView : undefined}
          onLayoutViewChange={activeTab === 'documents' ? handleLayoutViewChange : undefined}
          showLayoutToggle={activeTab === 'documents'}
          isSearching={isFetching && !isLoading}
          newButtonLabel="New Document"
        />
      </div>

      {/* Main Content */}
      <div className="flex flex-1 overflow-hidden">
        {/* Sidebar - Only show filters for documents tab */}
        {activeTab === 'documents' && (
          <ExplorerSidebar title="Filters">
            <DocumentFilters
              filters={filters}
              onFiltersChange={setFilters}
              tags={tags}
              correspondents={correspondents}
              documentTypes={documentTypes}
            />
          </ExplorerSidebar>
        )}

        {/* Tab Content */}
        <div className="flex-1 overflow-y-auto px-6 pb-6">
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="mb-4">
              <TabsTrigger value="documents">
                <FileText className="h-4 w-4 mr-2" />
                Documents
              </TabsTrigger>
              <TabsTrigger value="tags">
                <Tag className="h-4 w-4 mr-2" />
                Tags
              </TabsTrigger>
              <TabsTrigger value="correspondents">
                <User className="h-4 w-4 mr-2" />
                Correspondents
              </TabsTrigger>
              <TabsTrigger value="document-types">
                <FolderOpen className="h-4 w-4 mr-2" />
                Document Types
              </TabsTrigger>
            </TabsList>

            <TabsContent value="documents" className="mt-0">
              {isMutating && (
                <div className="flex items-center justify-center py-4 gap-2 text-muted-foreground mb-4">
                  <span className="text-sm">Processing...</span>
                </div>
              )}
              {renderDocumentView()}
            </TabsContent>

            <TabsContent value="tags" className="mt-0">
              <TagsManager />
            </TabsContent>

            <TabsContent value="correspondents" className="mt-0">
              <CorrespondentsManager />
            </TabsContent>

            <TabsContent value="document-types" className="mt-0">
              <DocumentTypesManager />
            </TabsContent>
          </Tabs>
        </div>
      </div>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={!!deleteDocumentId} onOpenChange={(open) => !open && setDeleteDocumentId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Document</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this document? This action cannot be undone and will permanently remove the document from the system.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              className="bg-red-600 hover:bg-red-700"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
