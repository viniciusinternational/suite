'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Paperclip, Download, Trash2, Upload } from 'lucide-react';
import { useRequestAttachments, useAddAttachment, useRemoveAttachment } from '@/hooks/use-requests';
import { useState } from 'react';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';

interface RequestAttachmentsProps {
  requestId: string;
}

export function RequestAttachments({ requestId }: RequestAttachmentsProps) {
  const { data: attachments = [], isLoading } = useRequestAttachments(requestId);
  const addAttachment = useAddAttachment(requestId);
  const removeAttachment = useRemoveAttachment(requestId);
  const [attachmentUrl, setAttachmentUrl] = useState('');
  const [fileToDelete, setFileToDelete] = useState<string | null>(null);

  const handleAddAttachment = async () => {
    if (!attachmentUrl.trim()) return;

    try {
      await addAttachment.mutateAsync({ attachmentUrl: attachmentUrl.trim() });
      setAttachmentUrl('');
    } catch (error) {
      console.error('Error adding attachment:', error);
    }
  };

  const handleRemoveAttachment = async (url: string) => {
    try {
      await removeAttachment.mutateAsync(url);
      setFileToDelete(null);
    } catch (error) {
      console.error('Error removing attachment:', error);
    }
  };

  const getFileName = (url: string) => {
    try {
      const urlObj = new URL(url);
      const pathname = urlObj.pathname;
      return pathname.split('/').pop() || url;
    } catch {
      return url.split('/').pop() || url;
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Paperclip className="h-5 w-5" />
          Attachments ({attachments.length})
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Add Attachment Form */}
        <div className="space-y-2">
          <div className="flex gap-2">
            <Input
              placeholder="Enter file URL or path..."
              value={attachmentUrl}
              onChange={(e) => setAttachmentUrl(e.target.value)}
              className="flex-1"
            />
            <Button
              onClick={handleAddAttachment}
              disabled={!attachmentUrl.trim() || addAttachment.isPending}
              size="sm"
            >
              <Upload className="h-4 w-4 mr-2" />
              {addAttachment.isPending ? 'Adding...' : 'Add'}
            </Button>
          </div>
          <p className="text-xs text-gray-500">
            Paste a file URL or file path to attach
          </p>
        </div>

        {/* Attachments List */}
        <div className="space-y-2">
          {isLoading ? (
            <p className="text-sm text-gray-500 text-center py-4">Loading attachments...</p>
          ) : attachments.length === 0 ? (
            <p className="text-sm text-gray-500 text-center py-4">No attachments yet</p>
          ) : (
            attachments.map((url: string, index: number) => (
              <div
                key={index}
                className="flex items-center justify-between p-3 border rounded-lg hover:bg-gray-50"
              >
                <div className="flex items-center gap-3 flex-1 min-w-0">
                  <Paperclip className="h-5 w-5 text-gray-400 flex-shrink-0" />
                  <span className="text-sm text-gray-700 truncate" title={url}>
                    {getFileName(url)}
                  </span>
                </div>
                <div className="flex items-center gap-2 flex-shrink-0">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => window.open(url, '_blank')}
                    title="Download"
                  >
                    <Download className="h-4 w-4" />
                  </Button>
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setFileToDelete(url)}
                        className="text-red-600"
                        title="Remove"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>Remove Attachment</AlertDialogTitle>
                        <AlertDialogDescription>
                          Are you sure you want to remove this attachment? This action cannot be undone.
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel onClick={() => setFileToDelete(null)}>
                          Cancel
                        </AlertDialogCancel>
                        <AlertDialogAction
                          onClick={() => fileToDelete && handleRemoveAttachment(fileToDelete)}
                          className="bg-red-600 hover:bg-red-700"
                        >
                          {removeAttachment.isPending ? 'Removing...' : 'Remove'}
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                </div>
              </div>
            ))
          )}
        </div>
      </CardContent>
    </Card>
  );
}



