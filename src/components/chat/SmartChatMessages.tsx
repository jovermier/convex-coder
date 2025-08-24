import { useEffect, useRef, useMemo } from "react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { MessageBubble } from "./MessageBubble";
import { User } from "@/hooks/useUser";

interface SmartChatMessagesProps {
  currentUser: User | null;
  mode: 'convex' | 'working';
  convexMessages: {
    messages: any[];
    isLoading: boolean;
    error: any;
  };
  workingMessages: {
    messages: any[];
    isLoading: boolean;
    error: any;
    refetch: () => void;
  };
}

export function SmartChatMessages({ 
  currentUser, 
  mode, 
  convexMessages, 
  workingMessages 
}: SmartChatMessagesProps) {
  const messagesEndRef = useRef<HTMLDivElement>(null);
  
  // Select the appropriate data source based on mode with safety checks
  const { messages, isLoading, error } = useMemo(() => {
    try {
      const source = mode === 'convex' ? convexMessages : workingMessages;
      return {
        messages: Array.isArray(source.messages) ? source.messages : [],
        isLoading: Boolean(source.isLoading),
        error: source.error
      };
    } catch (err) {
      console.error("Error selecting message source:", err);
      return {
        messages: [],
        isLoading: false,
        error: err instanceof Error ? err : new Error("Failed to load messages")
      };
    }
  }, [mode, convexMessages, workingMessages]);

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

      const isOwnMessage = currentUser && (
        message.senderId === currentUser._id ||
        message.senderId.includes(currentUser.name.toLowerCase())
      );

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
            Unable to connect to the chat backend. Please check your connection.
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
            Start the conversation by sending a message{mode === 'convex' ? ' or uploading a file' : ''}!
          </p>
        </div>
      </div>
    );
  }

  const getStatusBadge = () => {
    if (mode === 'convex') {
      return {
        gradient: "from-blue-50 to-indigo-50 dark:from-blue-950/20 dark:to-indigo-950/20",
        border: "border-blue-200 dark:border-blue-800/50",
        dot: "bg-blue-400",
        titleColor: "text-blue-900 dark:text-blue-100",
        subtitleColor: "text-blue-700 dark:text-blue-300",
        title: "🚀 Real-time WebSockets Active",
        subtitle: "- Instant updates, no polling, no flicker!"
      };
    } else {
      return {
        gradient: "from-green-50 to-emerald-50 dark:from-green-950/20 dark:to-emerald-950/20",
        border: "border-green-200 dark:border-green-800/50",
        dot: "bg-green-400",
        titleColor: "text-green-900 dark:text-green-100",
        subtitleColor: "text-green-700 dark:text-green-300",
        title: "✅ Optimized Polling Active",
        subtitle: "- Smart updates, flickering fixed!"
      };
    }
  };

  const status = getStatusBadge();

  return (
    <ScrollArea className="flex-1">
      <div className="space-y-4 p-4 pb-8">
        {/* Backend status indicator */}
        <div className={`bg-gradient-to-r ${status.gradient} border ${status.border} rounded-lg p-3 mx-2 mb-4`}>
          <div className="flex items-center gap-2 text-sm">
            <div className={`w-2 h-2 ${status.dot} rounded-full animate-pulse`}></div>
            <span className={`font-medium ${status.titleColor}`}>
              {status.title}
            </span>
            <span className={`${status.subtitleColor} text-xs`}>
              {status.subtitle} ({messages.length} messages)
            </span>
          </div>
        </div>

        {groupedMessages.map((message) => {
          try {
            return (
              <MessageBubble
                key={message._id}
                message={message}
                isOwnMessage={message.isOwnMessage}
                showAvatar={message.showAvatar}
              />
            );
          } catch (err) {
            console.error("Error rendering message:", message._id, err);
            return (
              <div key={message._id} className="text-xs text-muted-foreground p-2 bg-destructive/10 rounded">
                ⚠️ Error rendering message
              </div>
            );
          }
        })}
        <div ref={messagesEndRef} />
      </div>
    </ScrollArea>
  );
}