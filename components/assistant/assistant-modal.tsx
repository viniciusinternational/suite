'use client';

import { MessageCircle } from 'lucide-react';
import { AssistantModalPrimitive } from '@assistant-ui/react';
import { Button } from '@/components/ui/button';
import { AssistantThread } from './assistant-thread';

export function AssistantModal() {
  return (
    <AssistantModalPrimitive.Root open={true} modal>
      <AssistantModalPrimitive.Trigger asChild>
        <Button
          size="icon"
          className="fixed bottom-6 right-6 z-50 h-14 w-14 rounded-full shadow-lg"
        >
          <MessageCircle className="h-6 w-6" />
          <span className="sr-only">Open AI assistant</span>
        </Button>
      </AssistantModalPrimitive.Trigger>
      <AssistantModalPrimitive.Content
        side="top"
        align="end"
        className="p-0 border-none shadow-2xl"
      >
        <div className="w-[380px] h-[540px] flex flex-col bg-background border rounded-xl overflow-hidden">
          <div className="px-4 py-3 border-b">
            <p className="text-sm font-semibold">AI Assistant</p>
            <p className="text-xs text-muted-foreground">
              Ask questions about your VinSuite workspace.
            </p>
          </div>
          <div className="flex-1">
            <AssistantThread />
          </div>
        </div>
      </AssistantModalPrimitive.Content>
    </AssistantModalPrimitive.Root>
  );
}


