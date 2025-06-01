-- Add message threading support
ALTER TABLE "Message_v2" ADD COLUMN "parentId" uuid REFERENCES "Message_v2"("id");
ALTER TABLE "Message_v2" ADD COLUMN "threadId" uuid;
ALTER TABLE "Message_v2" ADD COLUMN "replyCount" integer DEFAULT 0;

-- Add message reactions
CREATE TABLE IF NOT EXISTS "MessageReaction" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  "messageId" uuid NOT NULL REFERENCES "Message_v2"("id"),
  "userId" text NOT NULL REFERENCES "User"("id"),
  "emoji" text NOT NULL,
  "createdAt" timestamp DEFAULT now(),
  UNIQUE("messageId", "userId", "emoji")
);

-- Add code block enhancements
ALTER TABLE "Message_v2" ADD COLUMN "codeBlocks" jsonb DEFAULT '[]'::jsonb;

-- Add message search index
CREATE INDEX IF NOT EXISTS "message_content_search_idx" ON "Message_v2" USING gin(to_tsvector('english', parts::text));

-- Add indexes for performance
CREATE INDEX IF NOT EXISTS "message_thread_idx" ON "Message_v2"("threadId");
CREATE INDEX IF NOT EXISTS "message_parent_idx" ON "Message_v2"("parentId");
CREATE INDEX IF NOT EXISTS "message_reaction_message_idx" ON "MessageReaction"("messageId");
CREATE INDEX IF NOT EXISTS "message_reaction_user_idx" ON "MessageReaction"("userId");

-- Add real-time collaboration support
CREATE TABLE IF NOT EXISTS "ChatParticipant" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  "chatId" uuid NOT NULL REFERENCES "Chat"("id"),
  "userId" text NOT NULL REFERENCES "User"("id"),
  "isTyping" boolean DEFAULT false,
  "lastSeenMessageId" uuid REFERENCES "Message_v2"("id"),
  "joinedAt" timestamp DEFAULT now(),
  "leftAt" timestamp,
  UNIQUE("chatId", "userId")
);

CREATE INDEX IF NOT EXISTS "chat_participant_chat_idx" ON "ChatParticipant"("chatId");
CREATE INDEX IF NOT EXISTS "chat_participant_user_idx" ON "ChatParticipant"("userId"); 