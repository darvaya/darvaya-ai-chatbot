'use client';

import { useState } from 'react';
import type { MessageReaction } from '@/lib/db/schema';
import { Button } from '@/components/ui/button';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { SmilePlus } from 'lucide-react';
import { toast } from '@/components/toast';

const COMMON_EMOJIS = ['👍', '❤️', '😄', '🎉', '🤔', '👀', '🚀', '💯'];

interface MessageReactionsProps {
  messageId: string;
  reactions: MessageReaction[];
  userId: string;
}

export function MessageReactions({
  messageId,
  reactions,
  userId,
}: MessageReactionsProps) {
  const [isLoading, setIsLoading] = useState(false);

  const handleReaction = async (emoji: string) => {
    try {
      setIsLoading(true);

      const response = await fetch('/api/message/reaction', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messageId,
          emoji,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to add reaction');
      }

      toast({
        type: 'success',
        description: 'Reaction added successfully',
      });
    } catch (error) {
      console.error('Error adding reaction:', error);
      toast({
        type: 'error',
        description: 'Failed to add reaction',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleRemoveReaction = async (emoji: string) => {
    try {
      setIsLoading(true);

      const response = await fetch('/api/message/reaction', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messageId,
          emoji,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to remove reaction');
      }

      toast({
        type: 'success',
        description: 'Reaction removed successfully',
      });
    } catch (error) {
      console.error('Error removing reaction:', error);
      toast({
        type: 'error',
        description: 'Failed to remove reaction',
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Group reactions by emoji
  const groupedReactions = reactions.reduce<Record<string, MessageReaction[]>>(
    (acc, reaction) => {
      if (!acc[reaction.emoji]) {
        acc[reaction.emoji] = [];
      }
      acc[reaction.emoji].push(reaction);
      return acc;
    },
    {},
  );

  return (
    <div className="flex items-center gap-1 mt-1">
      {Object.entries(groupedReactions).map(([emoji, reactions]) => {
        const hasReacted = reactions.some(
          (reaction) => reaction.userId === userId,
        );
        return (
          <Button
            key={emoji}
            variant="ghost"
            size="sm"
            className={`px-2 py-0 h-6 ${hasReacted ? 'bg-accent' : ''}`}
            onClick={() =>
              hasReacted ? handleRemoveReaction(emoji) : handleReaction(emoji)
            }
            disabled={isLoading}
          >
            {emoji} {reactions.length}
          </Button>
        );
      })}

      <Popover>
        <PopoverTrigger asChild>
          <Button
            variant="ghost"
            size="sm"
            className="px-2 py-0 h-6"
            disabled={isLoading}
          >
            <SmilePlus className="h-4 w-4" />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-full p-2" align="start">
          <div className="grid grid-cols-4 gap-1">
            {COMMON_EMOJIS.map((emoji) => (
              <Button
                key={emoji}
                variant="ghost"
                size="sm"
                className="px-2 py-1"
                onClick={() => handleReaction(emoji)}
                disabled={isLoading}
              >
                {emoji}
              </Button>
            ))}
          </div>
        </PopoverContent>
      </Popover>
    </div>
  );
}
