'use client';

import { useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthGuard } from '@/hooks/use-auth-guard';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { DocumentForm, DocumentFormRef } from '@/components/document/document-form';
import { ArrowLeft, FileText, File as FileIcon, Image as ImageIcon, Loader2, Upload, X } from 'lucide-react';

interface UploadState {
  file: File | null;
  url: string | null;
  mimeType: string | null;
  filename: string | null;
  size: number | null;
  uploading: boolean;
  progress: number;
}

export default function NewDocumentPage() {
  useAuthGuard(['add_documents']);
  const router = useRouter();
  const formRef = useRef<DocumentFormRef>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [uploadState, setUploadState] = useState<UploadState>({
    file: null,
    url: null,
    mimeType: null,
    filename: null,
    size: null,
    uploading: false,
    progress: 0,
  });

  const handleSuccess = () => {
    router.push('/documents');
  };

  const handleUploadChange = (state: UploadState) => {
    setUploadState(state);
  };

  const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    if (formRef.current) {
      await formRef.current.handleFileSelect(event);
    }
  };

  const handleRemoveFile = () => {
    if (formRef.current) {
      formRef.current.handleRemoveFile();
    }
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const formatFileSize = (bytes: number | null): string => {
    if (!bytes) return 'N/A';
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(2)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
  };

  const isImage = (mimeType: string | null): boolean => {
    return mimeType?.startsWith('image/') || false;
  };

  return (
    <div className="space-y-6 p-6 bg-gray-50/50 min-h-screen">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" onClick={() => router.push('/documents')}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Documents
          </Button>
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Create New Document</h1>
            <p className="text-gray-600 mt-1">Upload a file and fill in document details</p>
          </div>
        </div>
      </div>

      {/* Two Column Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Main Form */}
        <div className="lg:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5" />
                Document Information
              </CardTitle>
              <CardDescription>
                Enter the essential details for your new document
              </CardDescription>
            </CardHeader>
            <CardContent>
              <DocumentForm ref={formRef} onSuccess={handleSuccess} onUploadChange={handleUploadChange} />
            </CardContent>
          </Card>
        </div>

        {/* Right Column: File Upload Preview/Summary */}
        <div className="lg:col-span-1">
          <Card className="sticky top-6">
            <CardHeader>
              <CardTitle>Document Preview</CardTitle>
              <CardDescription>
                Upload a file to get started
              </CardDescription>
            </CardHeader>
            <CardContent>
              {!uploadState.file && !uploadState.url ? (
                <div className="space-y-4">
                  {/* File Picker/Dropzone */}
                  <div className="border-2 border-dashed rounded-lg p-8 text-center hover:border-blue-400 transition-colors">
                    <input
                      ref={fileInputRef}
                      type="file"
                      id="file"
                      className="hidden"
                      onChange={handleFileSelect}
                      disabled={uploadState.uploading}
                    />
                    <label
                      htmlFor="file"
                      className="cursor-pointer flex flex-col items-center gap-2"
                    >
                      <Upload className="h-10 w-10 text-gray-400" />
                      <div>
                        <p className="text-sm font-medium text-gray-700">
                          Click to upload or drag and drop
                        </p>
                        <p className="text-xs text-muted-foreground mt-1">
                          PDF, DOC, DOCX, images, etc. (Max 50MB)
                        </p>
                        <p className="text-xs text-blue-600 mt-2 font-medium">
                          File will be uploaded when you submit the form
                        </p>
                      </div>
                    </label>
                  </div>
                  {uploadState.uploading && formRef.current?.uploadError && (
                    <p className="text-sm text-red-600">{formRef.current.uploadError}</p>
                  )}
                </div>
              ) : uploadState.file && !uploadState.url && !uploadState.uploading ? (
                // File selected but not uploaded yet
                <div className="space-y-4">
                  {/* File Picker/Dropzone at top when file exists */}
                  <div className="border-2 border-dashed rounded-lg p-4 text-center hover:border-blue-400 transition-colors">
                    <input
                      ref={fileInputRef}
                      type="file"
                      id="file-replace"
                      className="hidden"
                      onChange={handleFileSelect}
                      disabled={uploadState.uploading}
                    />
                    <label
                      htmlFor="file-replace"
                      className="cursor-pointer flex flex-col items-center gap-2"
                    >
                      <Upload className="h-6 w-6 text-gray-400" />
                      <p className="text-xs font-medium text-gray-700">
                        Replace file
                      </p>
                    </label>
                  </div>

                  {/* File Info - Selected but not uploaded */}
                  <div className="border rounded-lg p-4 bg-blue-50 border-blue-200">
                    <div className="flex items-center gap-3">
                      <FileIcon className="h-8 w-8 text-blue-600" />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate">
                          {uploadState.filename || uploadState.file?.name || 'File selected'}
                        </p>
                        {uploadState.size && (
                          <p className="text-xs text-muted-foreground">
                            {formatFileSize(uploadState.size)}
                          </p>
                        )}
                        <p className="text-xs text-blue-600 mt-1 font-medium">
                          ✓ Selected - will upload on submit
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              ) : uploadState.uploading ? (
                <div className="space-y-4">
                  {uploadState.file && isImage(uploadState.mimeType) ? (
                    <div className="aspect-video bg-gray-100 rounded-lg overflow-hidden flex items-center justify-center">
                      {uploadState.file ? (
                        <img
                          src={URL.createObjectURL(uploadState.file)}
                          alt="Preview"
                          className="max-w-full max-h-full object-contain"
                        />
                      ) : (
                        <Loader2 className="h-8 w-8 text-gray-400 animate-spin" />
                      )}
                    </div>
                  ) : (
                    <div className="flex items-center gap-3 p-4 bg-gray-50 rounded-lg">
                      <FileIcon className="h-8 w-8 text-blue-600" />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate">
                          {uploadState.filename || uploadState.file?.name || 'Uploading...'}
                        </p>
                        {uploadState.size && (
                          <p className="text-xs text-muted-foreground">
                            {formatFileSize(uploadState.size)}
                          </p>
                        )}
                      </div>
                    </div>
                  )}
                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-xs text-muted-foreground">
                      <span>Uploading...</span>
                      <span>{uploadState.progress}%</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div
                        className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                        style={{ width: `${uploadState.progress}%` }}
                      />
                    </div>
                  </div>
                </div>
              ) : (
                <div className="space-y-4">
                  {/* File Picker/Dropzone at top when file exists */}
                  <div className="border-2 border-dashed rounded-lg p-4 text-center hover:border-blue-400 transition-colors">
                    <input
                      ref={fileInputRef}
                      type="file"
                      id="file-replace"
                      className="hidden"
                      onChange={handleFileSelect}
                      disabled={uploadState.uploading}
                    />
                    <label
                      htmlFor="file-replace"
                      className="cursor-pointer flex flex-col items-center gap-2"
                    >
                      <Upload className="h-6 w-6 text-gray-400" />
                      <p className="text-xs font-medium text-gray-700">
                        Replace file
                      </p>
                    </label>
                  </div>

                  {/* File Preview */}
                  {uploadState.url && isImage(uploadState.mimeType) ? (
                    <div className="aspect-video bg-gray-100 rounded-lg overflow-hidden">
                      <img
                        src={uploadState.url}
                        alt={uploadState.filename || 'Preview'}
                        className="w-full h-full object-contain"
                      />
                    </div>
                  ) : (
                    <div className="flex items-center gap-3 p-4 bg-gray-50 rounded-lg">
                      <FileIcon className="h-8 w-8 text-blue-600" />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate">
                          {uploadState.filename || uploadState.file?.name || 'File uploaded'}
                        </p>
                        {uploadState.size && (
                          <p className="text-xs text-muted-foreground">
                            {formatFileSize(uploadState.size)}
                          </p>
                        )}
                        {uploadState.mimeType && (
                          <p className="text-xs text-muted-foreground mt-1">
                            {uploadState.mimeType}
                          </p>
                        )}
                      </div>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={handleRemoveFile}
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  )}
                  {uploadState.url && (
                    <Button
                      variant="outline"
                      size="sm"
                      className="w-full"
                      onClick={() => window.open(uploadState.url!, '_blank')}
                    >
                      {isImage(uploadState.mimeType) ? (
                        <>
                          <ImageIcon className="h-4 w-4 mr-2" />
                          View Image
                        </>
                      ) : (
                        <>
                          <FileIcon className="h-4 w-4 mr-2" />
                          Open File
                        </>
                      )}
                    </Button>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

