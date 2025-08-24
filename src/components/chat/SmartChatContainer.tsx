import { useCallback, useEffect, useState } from "react";

import { MessageCircle } from "lucide-react";

import { ErrorBoundary } from "@/components/ErrorBoundary";
import { ThemeToggle } from "@/components/theme-toggle";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useConvexMessages, useConvexSendMessage } from "@/hooks/useConvexChat";
import {
  useOptimizedWorkingMessages,
  useOptimizedWorkingSendMessage,
} from "@/hooks/useOptimizedWorkingBackend";
import { useUser } from "@/hooks/useUser";

import { ChatInput } from "./ChatInput";
import { SmartChatMessages } from "./SmartChatMessages";

/**
 * Smart chat container that automatically chooses the best backend approach:
 * 1. First tries Convex WebSocket-based queries (ideal, no flickering)
 * 2. Falls back to optimized polling (fixes flickering issues)
 * 3. Gracefully handles file uploads where supported
 */
export function SmartChatContainer() {
  const { currentUser, isLoading: userLoading } = useUser();
  const [backendMode, setBackendMode] = useState<
    "convex" | "working" | "detecting"
  >("detecting");

  // Try Convex WebSocket approach first
  const convexMessages = useConvexMessages();
  const {
    sendMessage: sendConvexMessage,
    isSending: isConvexSending,
    fileUploadMethod,
  } = useConvexSendMessage();

  // Fallback to optimized polling
  const workingMessages = useOptimizedWorkingMessages();
  const { sendMessage: sendWorkingMessage, isSending: isWorkingSending } =
    useOptimizedWorkingSendMessage();

  // Detect which backend is available and working
  useEffect(() => {
    // Skip detection if we've already decided on a backend
    if (backendMode !== "detecting") {
      return;
    }

    // Timeout for Convex detection (3 seconds for faster fallback)
    const detectionTimeout = setTimeout(() => {
      if (backendMode === "detecting") {
        console.log(
          "⏰ Convex detection timeout - falling back to working backend"
        );
        setBackendMode("working");
      }
    }, 3000);

    const detectBackend = async () => {
      try {
        // If Convex successfully loaded messages (even if empty array), use it
        if (
          convexMessages.messages !== undefined &&
          !convexMessages.isLoading
        ) {
          setBackendMode("convex");
          console.log(
            "🚀 Using Convex WebSocket backend - optimal performance!"
          );
          clearTimeout(detectionTimeout);
          return;
        }

        // If still loading Convex, continue waiting
        if (convexMessages.isLoading) {
          return;
        }

        // If working backend is ready and has messages, use it as fallback
        if (!workingMessages.error && workingMessages.messages !== undefined) {
          setBackendMode("working");
          console.log("🔄 Using optimized polling backend - flickering fixed!");
          clearTimeout(detectionTimeout);
          return;
        }
      } catch (error) {
        console.warn("Backend detection failed:", error);
        setBackendMode("working"); // Default fallback
        clearTimeout(detectionTimeout);
      }
    };

    // Run detection immediately and then on subsequent changes
    detectBackend();

    return () => clearTimeout(detectionTimeout);
  }, [convexMessages, workingMessages, backendMode]);

  // Smart message handler that uses the appropriate backend
  const handleSendMessage = useCallback(
    async (content: string, file?: File) => {
      if (!currentUser) {
        throw new Error("User not authenticated");
      }

      try {
        if (backendMode === "convex") {
          // Use Convex with native file upload support (when available)
          try {
            await sendConvexMessage(content, currentUser, file);
          } catch (convexError) {
            const errorMessage =
              convexError instanceof Error
                ? convexError.message
                : "Unknown error";

            // If it's a file upload issue specifically, provide clear info
            if (
              file &&
              (errorMessage.includes("not available") ||
                errorMessage.includes("not supported") ||
                errorMessage.includes("not deployed"))
            ) {
              throw new Error(
                "File uploads are not available on this Convex deployment. The backend needs to be updated with file storage functions. Contact your administrator."
              );
            }

            // For other errors, try falling back to working backend
            console.warn(
              "Convex send failed, falling back to working backend:",
              convexError
            );
            setBackendMode("working");

            // Only retry without file (working backend doesn't support files)
            if (file) {
              throw new Error(
                "File uploads are not supported on the fallback backend. Please use text messages only."
              );
            }

            await sendWorkingMessage(content, currentUser);
          }
        } else {
          // Use working backend (text messages only)
          if (file) {
            throw new Error(
              "File uploads are not supported on this backend. Please contact your administrator to enable Convex file storage."
            );
          }
          await sendWorkingMessage(content, currentUser);
        }
      } catch (error) {
        console.error("Failed to send message:", error);
        // Re-throw with a more user-friendly message if it's a backend connectivity issue
        const errorMessage =
          error instanceof Error ? error.message : "Unknown error occurred";
        if (
          errorMessage.includes("timeout") ||
          errorMessage.includes("Server Error") ||
          errorMessage.includes("Backend unavailable")
        ) {
          throw new Error(
            "Unable to send message - backend temporarily unavailable. Please try again."
          );
        }
        throw error;
      }
    },
    [currentUser, backendMode, sendConvexMessage, sendWorkingMessage]
  );

  if (userLoading || backendMode === "detecting") {
    return (
      <div className="bg-muted/30 flex min-h-screen items-center justify-center p-4">
        <Card className="w-full max-w-4xl">
          <CardContent className="p-8">
            <div
              className="flex items-center justify-center space-x-2"
              role="status"
              aria-live="polite"
            >
              <div
                className="border-primary h-6 w-6 animate-spin rounded-full border-2 border-t-transparent"
                aria-hidden="true"
              />
              <span className="text-lg">
                {userLoading ? "Loading user..." : "Detecting best backend..."}
              </span>
              <span className="sr-only">Loading, please wait...</span>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!currentUser) {
    return (
      <div className="bg-muted/30 flex min-h-screen items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardContent className="p-8 text-center">
            <div className="space-y-4" role="alert" aria-live="assertive">
              <div className="text-destructive text-lg">
                Authentication Error
              </div>
              <p className="text-muted-foreground">
                Unable to authenticate user. Please refresh the page.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  const isConvexMode = backendMode === "convex";
  const isSending = isConvexMode ? isConvexSending : isWorkingSending;

  return (
    <div className="bg-muted/30 flex h-screen flex-col">
      <div className="container mx-auto flex h-full max-w-4xl flex-col p-2 sm:p-4">
        <Card className="flex h-full flex-col">
          {/* Header */}
          <CardHeader
            className="bg-background/95 flex-shrink-0 border-b"
            role="banner"
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <div className="flex items-center space-x-2">
                  <MessageCircle
                    className="text-primary h-6 w-6"
                    aria-hidden="true"
                  />
                  <CardTitle className="text-xl sm:text-2xl">
                    Convex Chat
                  </CardTitle>
                </div>
                <Badge
                  variant={isConvexMode ? "default" : "secondary"}
                  className="hidden sm:inline-flex"
                  aria-label={`Connection type: ${isConvexMode ? "WebSockets - Real-time connection active" : "Optimized Polling - Fallback connection active"}`}
                >
                  {isConvexMode ? "🚀 WebSockets" : "🔄 Optimized Polling"}
                </Badge>
              </div>
              <div className="flex items-center space-x-3">
                <div
                  className="hidden items-center space-x-2 sm:flex"
                  role="region"
                  aria-label="User information"
                >
                  <Avatar className="h-8 w-8">
                    <AvatarFallback
                      className="bg-primary/10 text-primary text-xs"
                      aria-label={`Avatar for ${currentUser.name}`}
                    >
                      {currentUser.name
                        .split(" ")
                        .map((n) => n[0])
                        .join("")
                        .toUpperCase()
                        .slice(0, 2)}
                    </AvatarFallback>
                  </Avatar>
                  <div className="text-sm">
                    <div className="font-medium" id="current-user-name">
                      {currentUser.name}
                    </div>
                    <div
                      className="text-muted-foreground text-xs"
                      role="status"
                      aria-live="polite"
                    >
                      Online
                    </div>
                  </div>
                </div>
                <ThemeToggle />
              </div>
            </div>

            {/* Mobile user info */}
            <div
              className="mt-3 flex items-center justify-center space-x-2 border-t pt-2 sm:hidden"
              role="region"
              aria-label="User information (mobile)"
            >
              <Avatar className="h-6 w-6">
                <AvatarFallback
                  className="bg-primary/10 text-primary text-xs"
                  aria-label={`Avatar for ${currentUser.name}`}
                >
                  {currentUser.name
                    .split(" ")
                    .map((n) => n[0])
                    .join("")
                    .toUpperCase()
                    .slice(0, 2)}
                </AvatarFallback>
              </Avatar>
              <span className="text-sm font-medium">{currentUser.name}</span>
              <Badge
                variant="outline"
                className="text-xs"
                role="status"
                aria-live="polite"
              >
                Online
              </Badge>
            </div>
          </CardHeader>

          {/* Messages area */}
          <div
            className="flex min-h-0 flex-1 flex-col overflow-hidden"
            role="main"
            aria-label="Chat messages"
          >
            <ErrorBoundary
              onReset={() => {
                // Force backend redetection on error recovery
                setBackendMode("detecting");
              }}
            >
              <SmartChatMessages
                currentUser={currentUser}
                mode={backendMode}
                convexMessages={convexMessages}
                workingMessages={workingMessages}
              />
            </ErrorBoundary>

            {/* Live region for announcing new messages to screen readers */}
            <div
              aria-live="polite"
              aria-label="New messages"
              className="sr-only"
              id="messages-live-region"
            />
          </div>

          {/* Input area - Always visible at bottom */}
          <div
            className="bg-background/95 flex-shrink-0 border-t"
            role="region"
            aria-label="Message input"
          >
            <ChatInput
              onSendMessage={handleSendMessage}
              placeholder="Type your message or attach a file..."
              disabled={isSending}
            />
          </div>
        </Card>
      </div>
    </div>
  );
}
