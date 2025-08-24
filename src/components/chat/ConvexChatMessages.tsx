import { useEffect, useRef, useMemo } from "react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { MessageBubble } from "./MessageBubble";
import { User } from "@/hooks/useUser";
import { useConvexMessages } from "@/hooks/useConvexChat";

interface ConvexChatMessagesProps {
  currentUser: User | null;
}

export function ConvexChatMessages({ currentUser }: ConvexChatMessagesProps) {
  const { messages, isLoading, error } = useConvexMessages();
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Scroll to bottom when new messages arrive - smooth, no flicker
  useEffect(() => {
    if (messagesEndRef.current && messages.length > 0) {
      messagesEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages.length]); // Only re-run when message count changes

  // Group messages to determine when to show avatars
  const groupedMessages = useMemo(() => {
    if (!messages || messages.length === 0) return [];

    return messages.map((message, index) => {
      const prevMessage = index > 0 ? messages[index - 1] : null;

      // Show avatar if:
      // - It's the first message
      // - The previous message is from a different sender
      // - There's a time gap of more than 5 minutes
      const showAvatar = 
        !prevMessage ||
        prevMessage.senderId !== message.senderId ||
        (message.createdAt - prevMessage.createdAt) > 5 * 60 * 1000;

      const isOwnMessage = currentUser && message.senderId === currentUser._id;

      return {
        ...message,
        showAvatar,
        isOwnMessage: !!isOwnMessage,
      };
    });
  }, [messages, currentUser]);

  if (isLoading) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <div className="animate-pulse space-y-4 w-full max-w-md mx-auto p-4">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="flex gap-3">
              <div className="w-8 h-8 bg-muted rounded-full" />
              <div className="flex-1 space-y-2">
                <div className="h-4 bg-muted rounded w-3/4" />
                <div className="h-4 bg-muted rounded w-1/2" />
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  // Note: Error handling is now done by ErrorBoundary at higher level
  // This component focuses on rendering messages

  if (messages.length === 0) {
    return (
      <div className="flex-1 flex items-center justify-center p-8">
        <div className="text-center space-y-3">
          <div className="text-2xl">💬</div>
          <h3 className="text-lg font-medium">No messages yet</h3>
          <p className="text-muted-foreground max-w-sm">
            Start the conversation by sending a message or uploading a file!
          </p>
        </div>
      </div>
    );
  }

  return (
    <ScrollArea className="flex-1">
      <div className="space-y-4 p-4 pb-8">
        {/* WebSocket connection indicator */}
        <div className="bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-950/20 dark:to-indigo-950/20 border border-blue-200 dark:border-blue-800/50 rounded-lg p-3 mx-2 mb-4">
          <div className="flex items-center gap-2 text-sm">
            <div className="w-2 h-2 bg-blue-400 rounded-full animate-pulse"></div>
            <span className="font-medium text-blue-900 dark:text-blue-100">
              🚀 Real-time WebSockets Active
            </span>
            <span className="text-blue-700 dark:text-blue-300 text-xs">
              - No more polling, no more flicker! ({messages.length} messages)
            </span>
          </div>
        </div>

        {groupedMessages.map((message) => (
          <MessageBubble
            key={message._id}
            message={message}
            isOwnMessage={message.isOwnMessage}
            showAvatar={message.showAvatar}
          />
        ))}
        <div ref={messagesEndRef} />
      </div>
    </ScrollArea>
  );
}