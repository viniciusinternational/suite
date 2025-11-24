'use client';

import { useState, useRef, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Skeleton } from '@/components/ui/skeleton';
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
import { useDocumentComments, useCreateDocumentComment, useUpdateDocumentComment, useDeleteDocumentComment } from '@/hooks/use-document-comments';
import { useAuthStore } from '@/store';
import { MessageSquare, Edit, Trash2, Send } from 'lucide-react';

interface Props {
  documentId: string;
}

export function DocumentComments({ documentId }: Props) {
  const { user } = useAuthStore();
  const { data: comments = [], isLoading } = useDocumentComments(documentId);
  const createMutation = useCreateDocumentComment(documentId);
  const updateMutation = useUpdateDocumentComment(documentId);
  const deleteMutation = useDeleteDocumentComment(documentId);
  const [newComment, setNewComment] = useState('');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editText, setEditText] = useState('');
  const [deleteCommentId, setDeleteCommentId] = useState<string | null>(null);

  const handleSubmit = async () => {
    if (!newComment.trim() || !user) return;
    try {
      await createMutation.mutateAsync({
        note: newComment,
        userId: user.id,
      });
      setNewComment('');
    } catch (error) {
      console.error('Error creating comment:', error);
    }
  };

  const handleUpdate = async (commentId: string) => {
    if (!editText.trim()) return;
    try {
      await updateMutation.mutateAsync({ commentId, note: editText });
      setEditingId(null);
      setEditText('');
    } catch (error) {
      console.error('Error updating comment:', error);
    }
  };

  const handleDelete = async () => {
    if (!deleteCommentId) return;
    try {
      await deleteMutation.mutateAsync(deleteCommentId);
      setDeleteCommentId(null);
    } catch (error) {
      console.error('Error deleting comment:', error);
    }
  };

  const startEdit = (comment: any) => {
    setEditingId(comment.id);
    setEditText(comment.note);
  };

  const getUserInitials = (name: string) => {
    return name
      .split(' ')
      .map((part) => part.charAt(0))
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTo({
        top: scrollRef.current.scrollHeight,
        behavior: 'smooth'
      });
    }
  }, [comments]);

  return (
    <Card className="flex flex-col h-full">
      <CardHeader className="flex-shrink-0 border-b">
        <CardTitle className="flex items-center gap-2">
          <MessageSquare className="h-5 w-5" />
          Comments ({comments.length})
        </CardTitle>
      </CardHeader>
      <CardContent className="flex flex-col flex-1 p-0 overflow-hidden">
        {/* Scrollable Chat Area */}
        <div 
          ref={scrollRef}
          className="flex-1 overflow-y-auto p-4 space-y-2 scroll-smooth"
        >
          {isLoading ? (
            <div className="space-y-4">
              {[1, 2].map((i) => (
                <div key={i} className="flex gap-3">
                  <Skeleton className="h-10 w-10 rounded-full flex-shrink-0" />
                  <div className="flex-1 space-y-2">
                    <Skeleton className="h-4 w-24" />
                    <Skeleton className="h-16 w-full" />
                  </div>
                </div>
              ))}
            </div>
          ) : comments.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-center py-8">
              <MessageSquare className="h-12 w-12 text-gray-400 mb-2" />
              <p className="text-sm font-medium text-gray-900">No comments yet</p>
              <p className="text-sm text-gray-500 mt-1">Be the first to add a comment</p>
            </div>
          ) : (
            <div className="space-y-2">
              {comments.map((comment) => {
                const isOwnMessage = user?.id === comment.userId;
                return (
                  <div
                    key={comment.id}
                    className={`group flex ${
                      isOwnMessage ? 'justify-end' : 'justify-start'
                    }`}
                  >
                    <div
                      className={`relative max-w-[75%] ${
                        isOwnMessage ? 'flex flex-col items-end' : 'flex flex-col items-start'
                      }`}
                    >
                      <div
                        className={`relative rounded-2xl px-3 py-2 shadow-sm ${
                          isOwnMessage
                            ? 'bg-primary text-primary-foreground rounded-br-sm'
                            : 'bg-muted text-muted-foreground rounded-bl-sm'
                        }`}
                      >
                        {editingId === comment.id ? (
                          <div className="space-y-2 min-w-[200px]">
                            <Textarea
                              value={editText}
                              onChange={(e) => setEditText(e.target.value)}
                              rows={2}
                              className="bg-background text-foreground text-sm"
                            />
                            <div className="flex gap-2">
                              <Button
                                size="sm"
                                onClick={() => handleUpdate(comment.id)}
                                className="h-7 text-xs"
                              >
                                Save
                              </Button>
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => {
                                  setEditingId(null);
                                  setEditText('');
                                }}
                                className="h-7 text-xs"
                              >
                                Cancel
                              </Button>
                            </div>
                          </div>
                        ) : (
                          <>
                            <p className="text-sm whitespace-pre-wrap break-words pr-8">
                              {comment.note}
                            </p>
                            <div
                              className={`absolute bottom-1 ${
                                isOwnMessage ? 'right-2' : 'left-2'
                              } flex items-center gap-1`}
                            >
                              <span className={`text-[10px] ${
                                isOwnMessage 
                                  ? 'text-primary-foreground/80' 
                                  : 'text-muted-foreground/80'
                              }`}>
                                {new Date(comment.created).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                              </span>
                            </div>
                            {isOwnMessage && (
                              <div className="absolute -top-7 right-0 opacity-0 group-hover:opacity-100 transition-opacity duration-200 flex gap-0.5 z-10">
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    startEdit(comment);
                                  }}
                                  className="h-6 w-6 p-0 bg-background hover:bg-background shadow-md border border-border text-foreground/70 hover:text-foreground transition-all"
                                  title="Edit"
                                  aria-label="Edit comment"
                                >
                                  <Edit className="h-3 w-3" />
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    setDeleteCommentId(comment.id);
                                  }}
                                  className="h-6 w-6 p-0 bg-background hover:bg-background shadow-md border border-border text-destructive hover:text-destructive transition-all"
                                  title="Delete"
                                  aria-label="Delete comment"
                                >
                                  <Trash2 className="h-3 w-3" />
                                </Button>
                              </div>
                            )}
                          </>
                        )}
                      </div>
                      <div
                        className={`mt-0.5 px-1 text-[10px] text-muted-foreground ${
                          isOwnMessage ? 'text-right' : 'text-left'
                        }`}
                      >
                        {!isOwnMessage && (
                          <span className="font-medium">{comment.user?.fullName || 'Unknown'}</span>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Fixed Input Area at Bottom */}
        {user && (
          <div className="flex-shrink-0 border-t p-4 bg-background">
            <div className="space-y-2">
              <Textarea
                placeholder="Add a comment..."
                value={newComment}
                onChange={(e) => setNewComment(e.target.value)}
                rows={2}
                className="resize-none"
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) {
                    e.preventDefault();
                    handleSubmit();
                  }
                }}
              />
              <div className="flex justify-end">
                <Button
                  onClick={handleSubmit}
                  disabled={createMutation.isPending || !newComment.trim()}
                  size="sm"
                >
                  <Send className="h-4 w-4 mr-2" />
                  {createMutation.isPending ? 'Posting...' : 'Send'}
                </Button>
              </div>
            </div>
          </div>
        )}
      </CardContent>

      <AlertDialog open={!!deleteCommentId} onOpenChange={(open) => !open && setDeleteCommentId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Comment</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this comment? This action cannot be undone.
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
    </Card>
  );
}

