import { useEffect, useMemo, useRef } from "react";

// Removed ScrollArea import to use native scrollbars
import { User } from "@/hooks/useUser";

import { MessageBubble } from "./MessageBubble";

interface SmartChatMessagesProps {
  currentUser: User | null;
  mode: "convex" | "working";
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
  workingMessages,
}: SmartChatMessagesProps) {
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Select the appropriate data source based on mode with safety checks
  const { messages, isLoading, error } = useMemo(() => {
    try {
      const source = mode === "convex" ? convexMessages : workingMessages;
      return {
        messages: Array.isArray(source.messages) ? source.messages : [],
        isLoading: Boolean(source.isLoading),
        error: source.error,
      };
    } catch (err) {
      console.error("Error selecting message source:", err);
      return {
        messages: [],
        isLoading: false,
        error:
          err instanceof Error ? err : new Error("Failed to load messages"),
      };
    }
  }, [mode, convexMessages, workingMessages]);

  // Scroll to bottom only AFTER loading is complete and messages are rendered
  useEffect(() => {
    // Only scroll when we have messages AND loading is complete
    if (messages.length > 0 && !isLoading) {
      // Use timeout to ensure all content is fully rendered
      const scrollTimer = setTimeout(() => {
        requestAnimationFrame(() => {
          // Method 1: Try scrollIntoView first
          if (messagesEndRef.current) {
            messagesEndRef.current.scrollIntoView({
              behavior: "auto",
              block: "end",
            });
          }

          // Method 2: Also directly scroll the container to its maximum height
          requestAnimationFrame(() => {
            const scrollContainer = messagesEndRef.current?.closest(
              ".chat-messages-scroll"
            ) as HTMLElement;
            if (scrollContainer) {
              scrollContainer.scrollTop = scrollContainer.scrollHeight;
            }
          });
        });
      }, 100); // Small delay to ensure rendering is complete

      return () => clearTimeout(scrollTimer);
    }
  }, [messages, isLoading]); // Re-run when messages OR loading state changes

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
        message.createdAt - prevMessage.createdAt > 5 * 60 * 1000;

      const isOwnMessage =
        currentUser &&
        (message.senderId === currentUser._id ||
          message.senderId.includes(currentUser.name.toLowerCase()));

      return {
        ...message,
        showAvatar,
        isOwnMessage: !!isOwnMessage,
      };
    });
  }, [messages, currentUser]);

  if (isLoading) {
    return (
      <div className="flex flex-1 items-center justify-center">
        <div className="mx-auto w-full max-w-md animate-pulse space-y-4 p-4">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="flex gap-3">
              <div className="bg-muted h-8 w-8 rounded-full" />
              <div className="flex-1 space-y-2">
                <div className="bg-muted h-4 w-3/4 rounded" />
                <div className="bg-muted h-4 w-1/2 rounded" />
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-1 items-center justify-center p-8">
        <div className="space-y-3 text-center">
          <div className="text-2xl">⚠️</div>
          <h3 className="text-lg font-medium">Connection Error</h3>
          <p className="text-muted-foreground max-w-sm">
            Unable to connect to the chat backend. Please check your connection.
          </p>
          <p className="text-muted-foreground text-xs">
            Error: {error.message}
          </p>
        </div>
      </div>
    );
  }

  if (messages.length === 0) {
    return (
      <div className="flex flex-1 items-center justify-center p-8">
        <div className="space-y-3 text-center">
          <div className="text-2xl">💬</div>
          <h3 className="text-lg font-medium">No messages yet</h3>
          <p className="text-muted-foreground max-w-sm">
            Start the conversation by sending a message
            {mode === "convex" ? " or uploading a file" : ""}!
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="chat-messages-scroll h-full flex-1 overflow-y-auto">
      <div className="space-y-4 p-4">
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
              <div
                key={message._id}
                className="text-muted-foreground bg-destructive/10 rounded p-2 text-xs"
              >
                ⚠️ Error rendering message
              </div>
            );
          }
        })}
        {/* Bottom spacer and scroll target - ensure it's at the absolute bottom */}
        <div className="pb-4">
          <div ref={messagesEndRef} className="h-px" />
        </div>
      </div>
    </div>
  );
}
