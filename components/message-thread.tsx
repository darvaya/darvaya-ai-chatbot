'use client';

import { useState } from 'react';
import type { UIMessage } from 'ai';
import type { Vote } from '@/lib/db/schema';
import { Button } from '@/components/ui/button';
import { Reply, ChevronDown, ChevronUp } from 'lucide-react';
import { PreviewMessage } from './message';
import type { UseChatHelpers } from '@ai-sdk/react';
import { cn } from '@/lib/utils';

interface MessageThreadProps {
  chatId: string;
  parentMessage: UIMessage;
  replies: UIMessage[];
  votes: Vote[] | undefined;
  setMessages: UseChatHelpers['setMessages'];
  reload: UseChatHelpers['reload'];
  isReadonly: boolean;
  onReply: (parentId: string) => void;
}

export function MessageThread({
  chatId,
  parentMessage,
  replies,
  votes,
  setMessages,
  reload,
  isReadonly,
  onReply,
}: MessageThreadProps) {
  const [isExpanded, setIsExpanded] = useState(false);

  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-center gap-2">
        <PreviewMessage
          chatId={chatId}
          message={parentMessage}
          vote={votes?.find((vote) => vote.messageId === parentMessage.id)}
          isLoading={false}
          setMessages={setMessages}
          reload={reload}
          isReadonly={isReadonly}
          requiresScrollPadding={false}
        />
        {!isReadonly && (
          <Button
            variant="ghost"
            size="sm"
            className="ml-auto"
            onClick={() => onReply(parentMessage.id)}
          >
            <Reply className="mr-2 h-4 w-4" />
            Reply
          </Button>
        )}
      </div>

      {replies.length > 0 && (
        <div className="ml-8 border-l pl-4">
          <Button
            variant="ghost"
            size="sm"
            className="mb-2"
            onClick={() => setIsExpanded(!isExpanded)}
          >
            {isExpanded ? (
              <ChevronUp className="mr-2 h-4 w-4" />
            ) : (
              <ChevronDown className="mr-2 h-4 w-4" />
            )}
            {replies.length} {replies.length === 1 ? 'reply' : 'replies'}
          </Button>

          <div
            className={cn('flex flex-col gap-4 transition-all', {
              'h-0 overflow-hidden': !isExpanded,
            })}
          >
            {replies.map((reply) => (
              <PreviewMessage
                key={reply.id}
                chatId={chatId}
                message={reply}
                vote={votes?.find((vote) => vote.messageId === reply.id)}
                isLoading={false}
                setMessages={setMessages}
                reload={reload}
                isReadonly={isReadonly}
                requiresScrollPadding={false}
              />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
