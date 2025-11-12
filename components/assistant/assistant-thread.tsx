'use client';

import { type ComponentProps } from 'react';
import { Send, Square } from 'lucide-react';
import {
  ComposerPrimitive,
  MessagePrimitive,
  ThreadPrimitive,
} from '@assistant-ui/react';
import { MarkdownText } from '@assistant-ui/react-markdown';
import remarkGfm from 'remark-gfm';
import { Button } from '@/components/ui/button';

const AssistantMarkdownText = (
  props: ComponentProps<typeof MarkdownText>
) => (
  <MarkdownText
    {...props}
    className="aui-md"
    remarkPlugins={[remarkGfm]}
  />
);

const AssistantMessage = () => (
  <MessagePrimitive.Root
    className="aui-assistant-message-root"
    data-role="assistant"
  >
    <div className="aui-assistant-message-content">
      <MessagePrimitive.Parts
        components={{
          Text: AssistantMarkdownText,
        }}
      />
    </div>
  </MessagePrimitive.Root>
);

const UserMessage = () => (
  <MessagePrimitive.Root className="aui-user-message-root" data-role="user">
    <div className="aui-user-message-content-wrapper">
      <div className="aui-user-message-content">
        <MessagePrimitive.Parts />
      </div>
    </div>
  </MessagePrimitive.Root>
);

export function AssistantThread() {
  return (
    <ThreadPrimitive.Root className="aui-root aui-thread-root">
      <ThreadPrimitive.Viewport className="aui-thread-viewport">
        <ThreadPrimitive.If empty>
          <div className="aui-thread-welcome-root">
            <div className="aui-thread-welcome-center">
              <div className="aui-thread-welcome-message">
                <div className="aui-thread-welcome-message-motion-1">
                  Welcome!
                </div>
                <div className="aui-thread-welcome-message-motion-2">
                  Ask me about your workspace.
                </div>
              </div>
            </div>
          </div>
        </ThreadPrimitive.If>

        <ThreadPrimitive.Messages
          components={{
            AssistantMessage,
            UserMessage,
          }}
        />

        <div className="aui-thread-viewport-spacer" />

        <ComposerPrimitive.Root className="aui-composer-root">
          <ComposerPrimitive.Input
            placeholder="How can I help you today?"
            className="aui-composer-input"
            rows={1}
            aria-label="Message input"
          />
          <div className="aui-composer-action-wrapper">
            <ThreadPrimitive.If running={false}>
              <ComposerPrimitive.Send asChild>
                <Button
                  type="submit"
                  size="icon"
                  className="aui-composer-send"
                  aria-label="Send message"
                >
                  <Send className="aui-composer-send-icon" />
                </Button>
              </ComposerPrimitive.Send>
            </ThreadPrimitive.If>
            <ThreadPrimitive.If running>
              <ComposerPrimitive.Cancel asChild>
                <Button
                  type="button"
                  size="icon"
                  variant="ghost"
                  className="aui-composer-cancel"
                  aria-label="Stop generating"
                >
                  <Square className="aui-composer-cancel-icon" />
                </Button>
              </ComposerPrimitive.Cancel>
            </ThreadPrimitive.If>
          </div>
        </ComposerPrimitive.Root>
      </ThreadPrimitive.Viewport>
    </ThreadPrimitive.Root>
  );
}


