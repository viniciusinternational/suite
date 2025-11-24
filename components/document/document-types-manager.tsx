'use client';

import { useState } from 'react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
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
import { useDocumentTypes, useCreateDocumentType, useUpdateDocumentType, useDeleteDocumentType } from '@/hooks/use-document-types';
import { Plus, Edit, Trash2, Search, Inbox, Loader2 } from 'lucide-react';

export function DocumentTypesManager() {
  const [search, setSearch] = useState('');
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingDocumentType, setEditingDocumentType] = useState<any>(null);
  const [deleteDocumentTypeId, setDeleteDocumentTypeId] = useState<string | null>(null);

  const { data: documentTypes = [], isLoading } = useDocumentTypes();
  const createMutation = useCreateDocumentType();
  const updateMutation = useUpdateDocumentType(editingDocumentType?.id || '');
  const deleteMutation = useDeleteDocumentType();

  const filteredDocumentTypes = documentTypes.filter((docType) =>
    docType.name.toLowerCase().includes(search.toLowerCase()) ||
    docType.slug.toLowerCase().includes(search.toLowerCase())
  );

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const data = {
      name: formData.get('name') as string,
      slug: formData.get('slug') as string,
    };

    try {
      if (editingDocumentType) {
        await updateMutation.mutateAsync(data);
      } else {
        await createMutation.mutateAsync(data);
      }
      setIsDialogOpen(false);
      setEditingDocumentType(null);
      (e.target as HTMLFormElement).reset();
    } catch (error) {
      console.error('Error saving document type:', error);
    }
  };

  const handleDelete = async () => {
    if (!deleteDocumentTypeId) return;
    try {
      await deleteMutation.mutateAsync(deleteDocumentTypeId);
      setDeleteDocumentTypeId(null);
    } catch (error) {
      console.error('Error deleting document type:', error);
    }
  };

  const handleEdit = (docType: any) => {
    setEditingDocumentType(docType);
    setIsDialogOpen(true);
  };

  const handleNew = () => {
    setEditingDocumentType(null);
    setIsDialogOpen(true);
  };

  const isMutating = createMutation.isPending || updateMutation.isPending || deleteMutation.isPending;

  return (
    <div className="space-y-4">
      {/* Toolbar */}
      <div className="flex items-center justify-between gap-4">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
          <Input
            placeholder="Search document types..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-10"
          />
        </div>
        <Button onClick={handleNew} disabled={isMutating}>
          <Plus className="h-4 w-4 mr-2" />
          New Document Type
        </Button>
      </div>

      {/* Table */}
      {isLoading ? (
        <div className="border rounded-lg overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Slug</TableHead>
                <TableHead>Documents</TableHead>
                <TableHead>Created</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {Array.from({ length: 5 }).map((_, i) => (
                <TableRow key={i}>
                  <TableCell><Skeleton className="h-4 w-32" /></TableCell>
                  <TableCell><Skeleton className="h-4 w-24" /></TableCell>
                  <TableCell><Skeleton className="h-4 w-16" /></TableCell>
                  <TableCell><Skeleton className="h-4 w-24" /></TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-2">
                      <Skeleton className="h-8 w-8" />
                      <Skeleton className="h-8 w-8" />
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      ) : filteredDocumentTypes.length === 0 ? (
        <div className="border rounded-lg p-12 text-center">
          <Inbox className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <p className="text-sm font-medium text-gray-900">
            {search ? 'No document types found matching your search' : 'No document types found'}
          </p>
          <p className="text-sm text-gray-500 mt-1">
            {search ? 'Try a different search term' : 'Get started by creating a new document type'}
          </p>
        </div>
      ) : (
        <div className="border rounded-lg overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Slug</TableHead>
                <TableHead>Documents</TableHead>
                <TableHead>Created</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredDocumentTypes.map((docType) => (
                <TableRow key={docType.id} className="hover:bg-gray-50">
                  <TableCell>
                    <span className="font-medium">{docType.name}</span>
                  </TableCell>
                  <TableCell>
                    <span className="text-sm text-gray-600 font-mono">{docType.slug}</span>
                  </TableCell>
                  <TableCell>
                    <span className="text-sm text-gray-600">
                      {(docType as any).documents?.length || 0} document{((docType as any).documents?.length || 0) !== 1 ? 's' : ''}
                    </span>
                  </TableCell>
                  <TableCell>
                    <span className="text-sm text-gray-600">
                      {new Date(docType.createdAt).toLocaleDateString()}
                    </span>
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleEdit(docType)}
                        disabled={isMutating}
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setDeleteDocumentTypeId(docType.id)}
                        disabled={isMutating}
                      >
                        <Trash2 className="h-4 w-4 text-red-600" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}

      {/* Create/Edit Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={(open) => {
        setIsDialogOpen(open);
        if (!open) {
          setEditingDocumentType(null);
        }
      }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editingDocumentType ? 'Edit Document Type' : 'Create Document Type'}</DialogTitle>
            <DialogDescription>
              {editingDocumentType ? 'Update document type details below.' : 'Create a new document type for categorizing documents.'}
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSubmit}>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="name">Name *</Label>
                <Input
                  id="name"
                  name="name"
                  defaultValue={editingDocumentType?.name || ''}
                  required
                  placeholder="Document type name"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="slug">Slug *</Label>
                <Input
                  id="slug"
                  name="slug"
                  defaultValue={editingDocumentType?.slug || ''}
                  required
                  placeholder="document-type-slug"
                />
              </div>
            </div>
            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  setIsDialogOpen(false);
                  setEditingDocumentType(null);
                }}
                disabled={isMutating}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={isMutating}>
                {isMutating && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                {editingDocumentType ? 'Update' : 'Create'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <AlertDialog open={!!deleteDocumentTypeId} onOpenChange={(open) => !open && setDeleteDocumentTypeId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Document Type</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this document type? This action cannot be undone.
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

