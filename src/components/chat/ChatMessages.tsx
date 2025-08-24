import { useEffect, useRef, useMemo } from "react";
import { api } from "../../../convex/_generated/api";
import { useQueryWithFallback } from "@/hooks/useQueryWithFallback";
import { ScrollArea } from "@/components/ui/scroll-area";
import { MessageBubble } from "./MessageBubble";
import { User } from "@/hooks/useUser";

// Mock data for demo
const mockMessages = [
  {
    _id: "demo1" as any, // Type cast for demo compatibility
    _creationTime: Date.now() - 600000,
    senderId: "user2" as any,
    senderName: "Alice",
    content: "Hey everyone! Welcome to the modern chat app! 👋",
    type: "text" as const,
    createdAt: Date.now() - 600000,
  },
  {
    _id: "demo2" as any,
    _creationTime: Date.now() - 540000,
    senderId: "user3" as any,
    senderName: "Bob",
    content: "This looks amazing! The new design is so clean and modern.",
    type: "text" as const,
    createdAt: Date.now() - 540000,
  },
  {
    _id: "demo3" as any,
    _creationTime: Date.now() - 480000,
    senderId: "user2" as any,
    senderName: "Alice",
    content: "Check out this sample image to show the preview functionality:",
    type: "image" as const,
    fileData: "data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMzAwIiBoZWlnaHQ9IjIwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KICA8ZGVmcz4KICAgIDxsaW5lYXJHcmFkaWVudCBpZD0iZyIgeDI9IjAiIHkyPSIxIj4KICAgICAgPHN0b3Agc3RvcC1jb2xvcj0iIzY2N2VlYSIvPgogICAgICA8c3RvcCBzdG9wLWNvbG9yPSIjOGI1Y2Y2IiBvZmZzZXQ9IjEiLz4KICAgIDwvbGluZWFyR3JhZGllbnQ+CiAgPC9kZWZzPgogIDxyZWN0IHdpZHRoPSIxMDAlIiBoZWlnaHQ9IjEwMCUiIGZpbGw9InVybCgjZykiIHJ4PSIxMCIvPgogIDx0ZXh0IHg9IjUwJSIgeT0iNTAlIiBmb250LWZhbWlseT0iQXJpYWwiIGZvbnQtc2l6ZT0iMjAiIGZpbGw9IndoaXRlIiB0ZXh0LWFuY2hvcj0ibWlkZGxlIiBkeT0iMC4zZW0iPk1vZGVybiBDaGF0IEltYWdlPC90ZXh0Pgo8L3N2Zz4=",
    fileName: "modern-chat-preview.svg",
    fileType: "image/svg+xml",
    fileSize: 687,
    createdAt: Date.now() - 480000,
  },
  {
    _id: "demo4" as any,
    _creationTime: Date.now() - 420000,
    senderId: "user4" as any,
    senderName: "Charlie",
    content: "And here's how non-image files are displayed with the new card layout:",
    type: "file" as const,
    fileData: "data:text/plain;base64,SGVsbG8gV29ybGQhCgpUaGlzIGlzIGEgc2FtcGxlIGRvY3VtZW50IGZpbGUgdG8gZGVtb25zdHJhdGUgdGhlCm5ldyBmaWxlIHByZXZpZXcgZnVuY3Rpb25hbGl0eSBpbiB0aGUgbW9kZXJuIGNoYXQgYXBwLgoKRmVhdHVyZXM6Ci0gUmVzcG9uc2l2ZSBkZXNpZ24KLSBNb2Rlcm4gbWVzc2FnZSBidWJibGVzCi0gRmlsZSB1cGxvYWQgd2l0aCBwcmV2aWV3cwotIExpZ2h0Ym94IGZvciBpbWFnZXMKLSBEcmFnICYgZHJvcCBzdXBwb3J0",
    fileName: "modern-chat-features.txt",
    fileType: "text/plain",
    fileSize: 312,
    createdAt: Date.now() - 420000,
  },
  {
    _id: "demo5" as any,
    _creationTime: Date.now() - 360000,
    senderId: "user3" as any,
    senderName: "Bob",
    content: "Love the smooth animations and the responsive design! Works great on mobile too.",
    type: "text" as const,
    createdAt: Date.now() - 360000,
  }
];

interface ChatMessagesProps {
  currentUser: User | null;
}

export function ChatMessages({ currentUser }: ChatMessagesProps) {
  // Try to use real messages from Convex, fallback to mock data
  const { data: convexMessages, isDemo, error } = useQueryWithFallback(
    api.chat.getRecentMessages, 
    {}, 
    mockMessages
  );
  
  // Handle different states of the convex query
  const messages = useMemo(() => {
    // If query is still loading (undefined) and not in demo mode
    if (convexMessages === undefined && !isDemo) {
      return undefined;
    }
    
    // If we're in demo mode or query failed, use mock data
    if (isDemo || error) {
      return mockMessages;
    }
    
    // If query returned data (could be empty array)
    if (Array.isArray(convexMessages)) {
      return convexMessages.length > 0 ? convexMessages : mockMessages;
    }
    
    // Fallback to mock data
    return mockMessages;
  }, [convexMessages, isDemo, error]);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Get file URLs for messages with storageId
  const messagesWithUrls = useMemo(() => {
    if (!messages) return [];
    
    return messages.map(message => ({
      ...message,
      // For now, we'll use fileData (base64) since we don't have storage URLs working yet
      // In a real implementation, you'd use api.chat.getFileUrl for each storageId
    }));
  }, [messages]);

  // Scroll to bottom when new messages arrive
  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages]);

  // Group messages to determine when to show avatars
  const groupedMessages = useMemo(() => {
    if (!messagesWithUrls || messagesWithUrls.length === 0) return [];

    return messagesWithUrls.map((message, index) => {
      const prevMessage = index > 0 ? messagesWithUrls[index - 1] : null;
      const nextMessage = index < messagesWithUrls.length - 1 ? messagesWithUrls[index + 1] : null;

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
  }, [messagesWithUrls, currentUser]);

  if (messages === undefined) {
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

  if (messages.length === 0) {
    return (
      <div className="flex-1 flex items-center justify-center p-8">
        <div className="text-center space-y-3">
          <div className="text-2xl">💬</div>
          <h3 className="text-lg font-medium">No messages yet</h3>
          <p className="text-muted-foreground max-w-sm">
            Start the conversation by sending a message or sharing a file!
          </p>
        </div>
      </div>
    );
  }

  return (
    <ScrollArea className="flex-1">
      <div className="space-y-4 p-4 pb-8">
        {/* Demo mode indicator */}
        {isDemo && (
          <div className="bg-gradient-to-r from-orange-50 to-amber-50 dark:from-orange-950/20 dark:to-amber-950/20 border border-orange-200 dark:border-orange-800/50 rounded-lg p-3 mx-2 mb-4">
            <div className="flex items-center gap-2 text-sm">
              <div className="w-2 h-2 bg-orange-400 rounded-full animate-pulse"></div>
              <span className="font-medium text-orange-900 dark:text-orange-100">
                Demo Mode Active
              </span>
              <span className="text-orange-700 dark:text-orange-300 text-xs">
                - Backend temporarily unavailable
              </span>
            </div>
          </div>
        )}

        {/* Real backend connected indicator */}
        {!isDemo && convexMessages && Array.isArray(convexMessages) && (
          <div className="bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-950/20 dark:to-emerald-950/20 border border-green-200 dark:border-green-800/50 rounded-lg p-3 mx-2 mb-4">
            <div className="flex items-center gap-2 text-sm">
              <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
              <span className="font-medium text-green-900 dark:text-green-100">
                🚀 Live Mode Active
              </span>
              <span className="text-green-700 dark:text-green-300 text-xs">
                - Connected to self-hosted Convex backend
              </span>
            </div>
          </div>
        )}

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