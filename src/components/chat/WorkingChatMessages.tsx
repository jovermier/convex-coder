import { useEffect, useRef, useMemo } from "react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { MessageBubble } from "./MessageBubble";
import { User } from "@/hooks/useUser";
import { useWorkingMessages } from "@/hooks/useWorkingBackend";

interface WorkingChatMessagesProps {
  currentUser: User | null;
}

export function WorkingChatMessages({ currentUser }: WorkingChatMessagesProps) {
  const { messages, isLoading, error } = useWorkingMessages();
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Scroll to bottom when new messages arrive
  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages]);

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

      const isOwnMessage = currentUser && message.senderId.includes(currentUser.name.toLowerCase());

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

  if (error) {
    return (
      <div className="flex-1 flex items-center justify-center p-8">
        <div className="text-center space-y-3">
          <div className="text-2xl">⚠️</div>
          <h3 className="text-lg font-medium">Connection Error</h3>
          <p className="text-muted-foreground max-w-sm">
            Unable to load messages from the backend. Please check your connection.
          </p>
          <p className="text-xs text-muted-foreground">
            Error: {error.message}
          </p>
        </div>
      </div>
    );
  }

  if (messages.length === 0) {
    return (
      <div className="flex-1 flex items-center justify-center p-8">
        <div className="text-center space-y-3">
          <div className="text-2xl">💬</div>
          <h3 className="text-lg font-medium">No messages yet</h3>
          <p className="text-muted-foreground max-w-sm">
            Start the conversation by sending a message!
          </p>
        </div>
      </div>
    );
  }

  return (
    <ScrollArea className="flex-1">
      <div className="space-y-4 p-4 pb-8">
        {/* Backend connected indicator */}
        <div className="bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-950/20 dark:to-emerald-950/20 border border-green-200 dark:border-green-800/50 rounded-lg p-3 mx-2 mb-4">
          <div className="flex items-center gap-2 text-sm">
            <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
            <span className="font-medium text-green-900 dark:text-green-100">
              ✅ Backend Connected
            </span>
            <span className="text-green-700 dark:text-green-300 text-xs">
              - Real-time chat active ({messages.length} messages)
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