'use client';

import { useEffect, useState, useRef, forwardRef, useImperativeHandle } from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { useCreateDocument, useUpdateDocument } from '@/hooks/use-documents';
import { useTags } from '@/hooks/use-tags';
import { useCorrespondents } from '@/hooks/use-correspondents';
import { useDocumentTypes } from '@/hooks/use-document-types';
import { useUsers } from '@/hooks/use-users';
import { DocumentPermissions } from './document-permissions';
import { MultiSelect } from '@/components/ui/multi-select';
import axios from '@/lib/axios';
import type { Document, Department } from '@/types';
import { Upload, X, Loader2, File as FileIcon } from 'lucide-react';

const schema = z.object({
  title: z.string().min(1, 'Title is required'),
  description: z.string().optional(),
  keywords: z.array(z.string()).optional(),
  isPublic: z.boolean().default(false),
  isGlobalView: z.boolean().default(false),
  isGlobalEdit: z.boolean().default(false),
  originalFilename: z.string().optional(),
  mimeType: z.string().optional(),
  originalFileUrl: z.string().optional(),
  thumbnailUrl: z.string().optional(),
  pdfUrl: z.string().optional(),
  size: z.number().int().positive().optional(),
  correspondentId: z.string().optional(),
  documentTypeId: z.string().optional(),
  tagIds: z.array(z.string()).optional(),
  viewUserIds: z.array(z.string()).optional(),
  editUserIds: z.array(z.string()).optional(),
  deleteUserIds: z.array(z.string()).optional(),
  viewDepartmentIds: z.array(z.string()).optional(),
  editDepartmentIds: z.array(z.string()).optional(),
  deleteDepartmentIds: z.array(z.string()).optional(),
});

type FormValues = z.infer<typeof schema>;

interface UploadState {
  file: File | null;
  url: string | null;
  mimeType: string | null;
  filename: string | null;
  size: number | null;
  uploading: boolean;
  progress: number;
}

interface Props {
  document?: Document | null;
  onSuccess?: () => void;
  onUploadChange?: (state: UploadState) => void;
}

export interface DocumentFormRef {
  handleFileSelect: (event: React.ChangeEvent<HTMLInputElement>) => Promise<void>;
  handleRemoveFile: () => void;
  uploading: boolean;
  uploadProgress: number;
  uploadError: string | null;
}

export const DocumentForm = forwardRef<DocumentFormRef, Props>(({ document, onSuccess, onUploadChange }, ref) => {
  const [departments, setDepartments] = useState<Department[]>([]);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const { data: tags = [] } = useTags();
  const { data: correspondents = [] } = useCorrespondents();
  const { data: documentTypes = [] } = useDocumentTypes();
  const { data: users = [] } = useUsers();

  const createMutation = useCreateDocument();
  const updateMutation = useUpdateDocument(document?.id || '');

  const form = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      title: document?.title || '',
      description: document?.description || '',
      keywords: document?.keywords || [],
      isPublic: document?.isPublic || false,
      isGlobalView: (document as any)?.isGlobalView || false,
      isGlobalEdit: (document as any)?.isGlobalEdit || false,
      originalFilename: document?.originalFilename || '',
      mimeType: document?.mimeType || '',
      originalFileUrl: document?.originalFileUrl || '',
      thumbnailUrl: document?.thumbnailUrl || '',
      pdfUrl: document?.pdfUrl || '',
      size: document?.size || undefined,
      correspondentId: document?.correspondentId || '',
      documentTypeId: document?.documentTypeId || '',
      tagIds: document?.tags?.map((t) => t.id) || [],
      viewUserIds: document?.viewUserIds || [],
      editUserIds: document?.editUserIds || [],
      deleteUserIds: document?.deleteUserIds || [],
      viewDepartmentIds: document?.viewDepartmentIds || [],
      editDepartmentIds: document?.editDepartmentIds || [],
      deleteDepartmentIds: document?.deleteDepartmentIds || [],
    },
  });

  useEffect(() => {
    axios.get('/departments').then((res) => {
      setDepartments(res.data.data || []);
    });
  }, []);

  const notifyUploadChange = (
    file: File | null,
    url: string | null,
    mimeType: string | null,
    filename: string | null,
    size: number | null,
    uploading: boolean,
    progress: number
  ) => {
    onUploadChange?.({
      file,
      url,
      mimeType,
      filename,
      size,
      uploading,
      progress,
    });
  };

  const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Validate file size (max 50MB)
    const maxSize = 50 * 1024 * 1024; // 50MB
    if (file.size > maxSize) {
      setUploadError('File size exceeds 50MB limit');
      return;
    }

    setUploadedFile(file);
    setUploadError(null);
    setUploadProgress(0);
    setUploading(true);
    
    // Notify parent of upload start
    notifyUploadChange(file, null, file.type, file.name, file.size, true, 0);

    try {
      const formData = new FormData();
      formData.append('file', file);

      const response = await axios.post('/upload', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
        onUploadProgress: (progressEvent) => {
          if (progressEvent.total) {
            const progress = Math.round((progressEvent.loaded * 100) / progressEvent.total);
            setUploadProgress(progress);
            // Notify parent of upload progress
            notifyUploadChange(file, null, file.type, file.name, file.size, true, progress);
          }
        },
      });

      const fileUrl = response.data.url;
      const fileName = response.data.filename || file.name;
      const mimeType = response.data.mimeType || file.type;

      // Set all three URLs to the same S3 URL
      form.setValue('originalFileUrl', fileUrl);
      form.setValue('thumbnailUrl', fileUrl);
      form.setValue('pdfUrl', fileUrl);
      form.setValue('originalFilename', fileName);
      form.setValue('mimeType', mimeType);
      form.setValue('size', file.size);

      setUploadProgress(100);
      
      // Notify parent of upload completion
      notifyUploadChange(file, fileUrl, mimeType, fileName, file.size, false, 100);
    } catch (error: any) {
      console.error('Error uploading file:', error);
      setUploadError(error?.response?.data?.error || error?.message || 'Failed to upload file');
      setUploadedFile(null);
      
      // Notify parent of upload failure
      notifyUploadChange(null, null, null, null, null, false, 0);
    } finally {
      setUploading(false);
    }
  };

  const handleRemoveFile = () => {
    setUploadedFile(null);
    setUploadError(null);
    form.setValue('originalFileUrl', '');
    form.setValue('thumbnailUrl', '');
    form.setValue('pdfUrl', '');
    form.setValue('originalFilename', '');
    form.setValue('mimeType', '');
    form.setValue('size', undefined);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
    
    // Notify parent that file was removed
    notifyUploadChange(null, null, null, null, null, false, 0);
  };

  // Expose handlers via ref
  useImperativeHandle(ref, () => ({
    handleFileSelect,
    handleRemoveFile,
    uploading,
    uploadProgress,
    uploadError,
  }));

  const onSubmit = async (values: FormValues) => {
    try {
      const payload = {
        ...values,
        correspondentId: values.correspondentId || undefined,
        documentTypeId: values.documentTypeId || undefined,
      };

      if (document?.id) {
        await updateMutation.mutateAsync(payload);
      } else {
        await createMutation.mutateAsync(payload);
      }
      onSuccess?.();
    } catch (error: any) {
      console.error('Error saving document:', error);
      const errorMessage = error?.response?.data?.error || error?.message || 'Failed to save document';
      alert(errorMessage);
    }
  };

  return (
    <form className="space-y-6" onSubmit={form.handleSubmit(onSubmit)}>
      {/* Basic Information */}
      <div>
        <h3 className="text-lg font-semibold mb-4">Basic Information</h3>
        <div className="space-y-4">
          <div>
            <Label htmlFor="title">Title *</Label>
            <Input id="title" {...form.register('title')} className="mt-2" />
            {form.formState.errors.title && (
              <p className="text-sm text-red-600 mt-1">{form.formState.errors.title.message}</p>
            )}
          </div>

          <div>
            <Label htmlFor="description">Description</Label>
            <Textarea id="description" {...form.register('description')} className="mt-2" rows={3} />
          </div>

          <div>
            <Label htmlFor="keywords">Keywords (comma-separated)</Label>
            <Input
              id="keywords"
              className="mt-2"
              placeholder="keyword1, keyword2, keyword3"
              value={form.watch('keywords')?.join(', ') || ''}
              onChange={(e) => {
                const keywords = e.target.value
                  .split(',')
                  .map((k) => k.trim())
                  .filter((k) => k.length > 0);
                form.setValue('keywords', keywords);
              }}
            />
            <p className="text-xs text-muted-foreground mt-1">
              Separate keywords with commas for better searchability
            </p>
          </div>
        </div>
      </div>

      {/* Classification */}
      <div className="border-t pt-6">
        <h3 className="text-lg font-semibold mb-4">Classification</h3>
        <div className="space-y-4">
          <div>
            <Label>Tags</Label>
            <div className="mt-2">
              <MultiSelect
                options={tags.map((t) => ({
                  id: t.id,
                  label: t.name,
                  value: t.id,
                }))}
                selected={form.watch('tagIds') || []}
                onChange={(ids) => form.setValue('tagIds', ids)}
                placeholder="Select tags..."
                searchPlaceholder="Search tags..."
                emptyMessage="No tags found"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="correspondentId">Correspondent</Label>
              <Select
                value={form.watch('correspondentId') || undefined}
                onValueChange={(v) => form.setValue('correspondentId', v || undefined)}
              >
                <SelectTrigger className="mt-2">
                  <SelectValue placeholder="Select correspondent" />
                </SelectTrigger>
                <SelectContent>
                  {correspondents.map((c) => (
                    <SelectItem key={c.id} value={c.id}>
                      {c.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="documentTypeId">Document Type</Label>
              <Select
                value={form.watch('documentTypeId') || undefined}
                onValueChange={(v) => form.setValue('documentTypeId', v || undefined)}
              >
                <SelectTrigger className="mt-2">
                  <SelectValue placeholder="Select type" />
                </SelectTrigger>
                <SelectContent>
                  {documentTypes.map((dt) => (
                    <SelectItem key={dt.id} value={dt.id}>
                      {dt.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>
      </div>

      <div className="border-t pt-6">
        <h3 className="text-lg font-semibold mb-4">Visibility & Global Access</h3>
        <div className="space-y-4">
          <div className="flex items-center space-x-2">
            <Checkbox
              id="isPublic"
              checked={form.watch('isPublic')}
              onCheckedChange={(checked) => form.setValue('isPublic', checked === true)}
            />
            <div className="flex-1">
              <Label htmlFor="isPublic" className="cursor-pointer font-medium">
                Make this document public
              </Label>
              <p className="text-xs text-muted-foreground mt-1">
                Public documents are visible to all users. Private documents require explicit permissions.
              </p>
            </div>
          </div>
          
          <div className="space-y-3 pt-2 border-t">
            <h4 className="text-sm font-semibold">Global Access</h4>
            <div className="flex items-center space-x-2">
              <Checkbox
                id="isGlobalView"
                checked={form.watch('isGlobalView')}
                onCheckedChange={(checked) => {
                  form.setValue('isGlobalView', checked === true);
                  if (checked) {
                    // Clear specific permissions when global view is enabled
                    form.setValue('viewUserIds', []);
                    form.setValue('viewDepartmentIds', []);
                  }
                }}
              />
              <div className="flex-1">
                <Label htmlFor="isGlobalView" className="cursor-pointer font-medium">
                  Global View Access
                </Label>
                <p className="text-xs text-muted-foreground mt-1">
                  All users can view this document regardless of specific permissions.
                </p>
              </div>
            </div>
            
            <div className="flex items-center space-x-2">
              <Checkbox
                id="isGlobalEdit"
                checked={form.watch('isGlobalEdit')}
                onCheckedChange={(checked) => {
                  form.setValue('isGlobalEdit', checked === true);
                  if (checked) {
                    // Clear specific permissions when global edit is enabled
                    form.setValue('editUserIds', []);
                    form.setValue('editDepartmentIds', []);
                  }
                }}
              />
              <div className="flex-1">
                <Label htmlFor="isGlobalEdit" className="cursor-pointer font-medium">
                  Global Edit Access
                </Label>
                <p className="text-xs text-muted-foreground mt-1">
                  All users can edit this document regardless of specific permissions.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {(!form.watch('isGlobalView') || !form.watch('isGlobalEdit')) && (
        <div className="border-t pt-6">
          <h3 className="text-lg font-semibold mb-4">Permissions</h3>
          <DocumentPermissions
            users={users}
            departments={departments}
            viewUserIds={form.watch('viewUserIds') || []}
            editUserIds={form.watch('editUserIds') || []}
            deleteUserIds={form.watch('deleteUserIds') || []}
            viewDepartmentIds={form.watch('viewDepartmentIds') || []}
            editDepartmentIds={form.watch('editDepartmentIds') || []}
            deleteDepartmentIds={form.watch('deleteDepartmentIds') || []}
            onViewUsersChange={(ids) => {
              form.setValue('viewUserIds', ids);
              if (ids.length > 0) {
                form.setValue('isGlobalView', false);
              }
            }}
            onEditUsersChange={(ids) => {
              form.setValue('editUserIds', ids);
              if (ids.length > 0) {
                form.setValue('isGlobalEdit', false);
              }
            }}
            onDeleteUsersChange={(ids) => form.setValue('deleteUserIds', ids)}
            onViewDepartmentsChange={(ids) => {
              form.setValue('viewDepartmentIds', ids);
              if (ids.length > 0) {
                form.setValue('isGlobalView', false);
              }
            }}
            onEditDepartmentsChange={(ids) => {
              form.setValue('editDepartmentIds', ids);
              if (ids.length > 0) {
                form.setValue('isGlobalEdit', false);
              }
            }}
            onDeleteDepartmentsChange={(ids) => form.setValue('deleteDepartmentIds', ids)}
          />
          {form.watch('isGlobalView') && (
            <p className="text-xs text-muted-foreground mt-2">
              Note: Global view is enabled. Specific view permissions are ignored.
            </p>
          )}
          {form.watch('isGlobalEdit') && (
            <p className="text-xs text-muted-foreground mt-2">
              Note: Global edit is enabled. Specific edit permissions are ignored.
            </p>
          )}
        </div>
      )}

      <div className="flex gap-2">
        <Button type="submit" disabled={createMutation.isPending || updateMutation.isPending}>
          {document?.id ? 'Update' : 'Create'} Document
        </Button>
        <Button type="button" variant="outline" onClick={onSuccess}>
          Cancel
        </Button>
      </div>
    </form>
  );
});

DocumentForm.displayName = 'DocumentForm';

