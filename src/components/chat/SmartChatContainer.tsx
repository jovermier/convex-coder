import { useCallback, useEffect, useRef, useState } from "react";

import { ErrorBoundary } from "@/components/ErrorBoundary";
import { useAuth } from "@/contexts/AuthContext";
import { useConvexMessages, useConvexSendMessage } from "@/hooks/useConvexChat";
import { useMessageDelete } from "@/hooks/useMessageDelete";
import {
  useOptimizedWorkingMessages,
  useOptimizedWorkingSendMessage,
} from "@/hooks/useOptimizedWorkingBackend";

import { ChatInput } from "./ChatInput";
import { SmartChatMessages } from "./SmartChatMessages";

/**
 * Smart chat container that automatically chooses the best backend approach:
 * 1. First tries Convex WebSocket-based queries (ideal, no flickering)
 * 2. Falls back to optimized polling (fixes flickering issues)
 * 3. Gracefully handles file uploads where supported
 */
interface SmartChatContainerProps {
  showChatInput?: boolean;
  onExposeSendMessage?: (
    sendMessage: (content: string, files?: File[]) => Promise<void>,
    isSending: boolean
  ) => void;
  onAutoScroll?: () => void;
}

export function SmartChatContainer({
  showChatInput = true,
  onExposeSendMessage,
  onAutoScroll,
}: SmartChatContainerProps) {
  const { user: currentUser, loading: userLoading } = useAuth();
  const { deleteMessage } = useMessageDelete(onAutoScroll);
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
    async (content: string, files?: File[]) => {
      if (!currentUser) {
        throw new Error("User not authenticated");
      }

      try {
        if (backendMode === "convex") {
          // Use Convex with native file upload support (when available)
          try {
            // For now, send one file at a time until backend supports multiple files
            if (files && files.length > 0) {
              for (const file of files) {
                await sendConvexMessage(content, currentUser, file);
                // Only send content with first file, subsequent files are just attachments
                content = "";
              }
            } else {
              await sendConvexMessage(content, currentUser, undefined);
            }
          } catch (convexError) {
            const errorMessage =
              convexError instanceof Error
                ? convexError.message
                : "Unknown error";

            // If it's a file upload issue specifically, provide clear info
            if (
              files &&
              files.length > 0 &&
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

            // Only retry without files (working backend doesn't support files)
            if (files && files.length > 0) {
              throw new Error(
                "File uploads are not supported on the fallback backend. Please use text messages only."
              );
            }

            await sendWorkingMessage(content, currentUser);
          }
        } else {
          // Use working backend (text messages only)
          if (files && files.length > 0) {
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

  // Expose send message function to parent component
  useEffect(() => {
    if (
      onExposeSendMessage &&
      !userLoading &&
      currentUser &&
      handleSendMessage
    ) {
      const isSending =
        backendMode === "convex" ? isConvexSending : isWorkingSending;
      onExposeSendMessage(handleSendMessage, isSending);
    }
  }, [
    onExposeSendMessage,
    handleSendMessage,
    userLoading,
    currentUser,
    backendMode,
    isConvexSending,
    isWorkingSending,
  ]);

  if (userLoading || backendMode === "detecting") {
    return (
      <div className="bg-muted/30 flex min-h-screen items-center justify-center p-4">
        <div className="bg-background w-full max-w-4xl rounded-lg border shadow-sm">
          <div className="p-8">
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
          </div>
        </div>
      </div>
    );
  }

  if (!currentUser) {
    return (
      <div className="bg-muted/30 flex min-h-screen items-center justify-center p-4">
        <div className="bg-background w-full max-w-md rounded-lg border shadow-sm">
          <div className="p-8 text-center">
            <div className="space-y-4" role="alert" aria-live="assertive">
              <div className="text-destructive text-lg">
                Authentication Error
              </div>
              <p className="text-muted-foreground">
                Unable to authenticate user. Please refresh the page.
              </p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  const isConvexMode = backendMode === "convex";
  const isSending = isConvexMode ? isConvexSending : isWorkingSending;

  return (
    <div className="relative flex flex-col">
      {/* Messages area - content flows with parent scroll */}
      <div className="min-h-screen" role="main" aria-label="Chat messages">
        <div className="container mx-auto max-w-4xl">
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
              onDeleteMessage={deleteMessage}
              onAutoScroll={onAutoScroll}
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
      </div>

      {/* Render ChatInput inline if showChatInput is true */}
      {showChatInput && (
        <div
          className="bg-background/95 sticky bottom-0 z-10 flex-shrink-0 border-t backdrop-blur-sm transition-transform duration-300 ease-out"
          role="contentinfo"
          aria-label="Chat input"
          id="page-footer"
        >
          <div className="container mx-auto max-w-4xl">
            <ChatInput
              onSendMessage={handleSendMessage}
              placeholder="Type your message or attach a file..."
              disabled={isSending}
            />
          </div>
        </div>
      )}
    </div>
  );
}
