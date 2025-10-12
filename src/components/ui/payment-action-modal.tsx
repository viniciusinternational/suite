import React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import type { Payment } from '@/types';

interface PaymentActionModalProps {
  payment: Payment | null;
  isOpen: boolean;
  onClose: () => void;
  onAction: (action: 'approve' | 'reject', comments: string) => void;
}

export const PaymentActionModal: React.FC<PaymentActionModalProps> = ({
  payment,
  isOpen,
  onClose,
  onAction,
}) => {
  const [comments, setComments] = React.useState('');

  const handleAction = (action: 'approve' | 'reject') => {
    onAction(action, comments);
    setComments('');
    onClose();
  };

  if (!payment) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Payment Action - {payment.id}</DialogTitle>
        </DialogHeader>
        <div className="py-4">
          <div className="space-y-4">
            <div>
              <h4 className="font-medium mb-2">Payment Details</h4>
              <p className="text-sm text-muted-foreground">Amount: ${payment.total.toLocaleString()}</p>
              <p className="text-sm text-muted-foreground">Date: {payment.date}</p>
              <p className="text-sm text-muted-foreground">Status: {payment.status}</p>
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">Comments</label>
              <Textarea
                value={comments}
                onChange={(e) => setComments(e.target.value)}
                placeholder="Add your comments here..."
                className="min-h-[100px]"
              />
            </div>
          </div>
        </div>
        <DialogFooter className="flex gap-2">
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button 
            variant="destructive" 
            onClick={() => handleAction('reject')}
          >
            Reject
          </Button>
          <Button 
            variant="default"
            onClick={() => handleAction('approve')}
          >
            Approve
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}; 