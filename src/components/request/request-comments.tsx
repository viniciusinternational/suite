'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { MessageSquare, Send } from 'lucide-react';
import { useRequestComments, useAddComment } from '@/hooks/use-requests';
import { useAuthStore } from '@/store/auth-store';
import { useState } from 'react';
import type { RequestComment } from '@/types';

interface RequestCommentsProps {
  requestId: string;
}

export function RequestComments({ requestId }: RequestCommentsProps) {
  const { user } = useAuthStore();
  const { data: comments = [], isLoading } = useRequestComments(requestId);
  const addComment = useAddComment(requestId);
  const [newComment, setNewComment] = useState('');

  const handleAddComment = async () => {
    if (!newComment.trim() || !user) return;

    try {
      await addComment.mutateAsync({
        content: newComment.trim(),
        userId: user.id,
      });
      setNewComment('');
    } catch (error) {
      console.error('Error adding comment:', error);
    }
  };

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map((n) => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString();
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <MessageSquare className="h-5 w-5" />
          Comments ({comments.length})
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Add Comment Form */}
        <div className="space-y-2">
          <Textarea
            placeholder="Add a comment..."
            value={newComment}
            onChange={(e) => setNewComment(e.target.value)}
            rows={3}
            className="resize-none"
          />
          <div className="flex justify-end">
            <Button
              onClick={handleAddComment}
              disabled={!newComment.trim() || addComment.isPending || !user}
              size="sm"
            >
              <Send className="h-4 w-4 mr-2" />
              {addComment.isPending ? 'Adding...' : 'Add Comment'}
            </Button>
          </div>
        </div>

        {/* Comments List */}
        <div className="space-y-4">
          {isLoading ? (
            <p className="text-sm text-gray-500 text-center py-4">Loading comments...</p>
          ) : comments.length === 0 ? (
            <p className="text-sm text-gray-500 text-center py-4">No comments yet</p>
          ) : (
            comments.map((comment: RequestComment) => (
              <div key={comment.id} className="flex gap-3">
                <Avatar className="h-8 w-8">
                  <AvatarImage src={comment.user?.avatar} />
                  <AvatarFallback>
                    {getInitials(comment.user?.fullName || 'U')}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1 space-y-1">
                  <div className="flex items-center gap-2">
                    <p className="font-medium text-sm">
                      {comment.user?.fullName || 'Unknown User'}
                    </p>
                    <p className="text-xs text-gray-500">
                      {formatDate(comment.createdAt || '')}
                    </p>
                  </div>
                  <p className="text-sm text-gray-700 whitespace-pre-wrap">
                    {comment.content}
                  </p>
                </div>
              </div>
            ))
          )}
        </div>
      </CardContent>
    </Card>
  );
}


