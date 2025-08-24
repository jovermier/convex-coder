import { useState, useEffect, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { ThemeToggle } from "@/components/theme-toggle";
import { ChatInput } from "./ChatInput";
import { ErrorBoundary } from "@/components/ErrorBoundary";
import { ConvexChatMessages } from "./ConvexChatMessages";
import { SmartChatMessages } from "./SmartChatMessages";
import { useUser } from "@/hooks/useUser";
import { useConvexMessages, useConvexSendMessage } from "@/hooks/useConvexChat";
import { useOptimizedWorkingMessages, useOptimizedWorkingSendMessage } from "@/hooks/useOptimizedWorkingBackend";
import { MessageCircle } from "lucide-react";

/**
 * Smart chat container that automatically chooses the best backend approach:
 * 1. First tries Convex WebSocket-based queries (ideal, no flickering)
 * 2. Falls back to optimized polling (fixes flickering issues)
 * 3. Gracefully handles file uploads where supported
 */
export function SmartChatContainer() {
  const { currentUser, isLoading: userLoading } = useUser();
  const [backendMode, setBackendMode] = useState<'convex' | 'working' | 'detecting'>('detecting');
  
  // Try Convex WebSocket approach first
  const convexMessages = useConvexMessages();
  const { sendMessage: sendConvexMessage, isSending: isConvexSending, fileUploadMethod } = useConvexSendMessage();
  
  // Fallback to optimized polling
  const workingMessages = useOptimizedWorkingMessages();
  const { sendMessage: sendWorkingMessage, isSending: isWorkingSending } = useOptimizedWorkingSendMessage();
  
  // Detect which backend is available and working
  useEffect(() => {
    // Skip detection if we've already decided on a backend
    if (backendMode !== 'detecting') {
      return;
    }

    // Timeout for Convex detection (3 seconds for faster fallback)
    const detectionTimeout = setTimeout(() => {
      if (backendMode === 'detecting') {
        console.log("⏰ Convex detection timeout - falling back to working backend");
        setBackendMode('working');
      }
    }, 3000);

    const detectBackend = async () => {
      try {
        // If Convex successfully loaded messages (even if empty array), use it
        if (convexMessages.messages !== undefined && !convexMessages.isLoading) {
          setBackendMode('convex');
          console.log("🚀 Using Convex WebSocket backend - optimal performance!");
          clearTimeout(detectionTimeout);
          return;
        }
        
        // If still loading Convex, continue waiting
        if (convexMessages.isLoading) {
          return;
        }
        
        // If working backend is ready and has messages, use it as fallback
        if (!workingMessages.error && workingMessages.messages !== undefined) {
          setBackendMode('working');
          console.log("🔄 Using optimized polling backend - flickering fixed!");
          clearTimeout(detectionTimeout);
          return;
        }
        
      } catch (error) {
        console.warn("Backend detection failed:", error);
        setBackendMode('working'); // Default fallback
        clearTimeout(detectionTimeout);
      }
    };

    // Run detection immediately and then on subsequent changes
    detectBackend();
    
    return () => clearTimeout(detectionTimeout);
  }, [convexMessages, workingMessages, backendMode]);

  // Smart message handler that uses the appropriate backend
  const handleSendMessage = useCallback(async (content: string, file?: File) => {
    if (!currentUser) {
      throw new Error("User not authenticated");
    }

    try {
      if (backendMode === 'convex') {
        // Use Convex with native file upload support (when available)
        try {
          await sendConvexMessage(content, currentUser, file);
        } catch (convexError) {
          const errorMessage = convexError instanceof Error ? convexError.message : "Unknown error";
          
          // If it's a file upload issue specifically, provide clear info
          if (file && (errorMessage.includes("not available") || errorMessage.includes("not supported") || errorMessage.includes("not deployed"))) {
            throw new Error("File uploads are not available on this Convex deployment. The backend needs to be updated with file storage functions. Contact your administrator.");
          }
          
          // For other errors, try falling back to working backend  
          console.warn("Convex send failed, falling back to working backend:", convexError);
          setBackendMode('working');
          
          // Only retry without file (working backend doesn't support files)
          if (file) {
            throw new Error("File uploads are not supported on the fallback backend. Please use text messages only.");
          }
          
          await sendWorkingMessage(content, currentUser);
        }
      } else {
        // Use working backend (text messages only)
        if (file) {
          throw new Error("File uploads are not supported on this backend. Please contact your administrator to enable Convex file storage.");
        }
        await sendWorkingMessage(content, currentUser);
      }
    } catch (error) {
      console.error("Failed to send message:", error);
      // Re-throw with a more user-friendly message if it's a backend connectivity issue
      const errorMessage = error instanceof Error ? error.message : "Unknown error occurred";
      if (errorMessage.includes("timeout") || errorMessage.includes("Server Error") || errorMessage.includes("Backend unavailable")) {
        throw new Error("Unable to send message - backend temporarily unavailable. Please try again.");
      }
      throw error;
    }
  }, [currentUser, backendMode, sendConvexMessage, sendWorkingMessage]);

  if (userLoading || backendMode === 'detecting') {
    return (
      <div className="min-h-screen bg-muted/30 flex items-center justify-center p-4">
        <Card className="w-full max-w-4xl">
          <CardContent className="p-8">
            <div className="flex items-center justify-center space-x-2">
              <div className="animate-spin rounded-full h-6 w-6 border-2 border-primary border-t-transparent" />
              <span className="text-lg">
                {userLoading ? "Loading user..." : "Detecting best backend..."}
              </span>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!currentUser) {
    return (
      <div className="min-h-screen bg-muted/30 flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardContent className="p-8 text-center">
            <div className="space-y-4">
              <div className="text-destructive text-lg">Authentication Error</div>
              <p className="text-muted-foreground">
                Unable to authenticate user. Please refresh the page.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  const isConvexMode = backendMode === 'convex';
  const isSending = isConvexMode ? isConvexSending : isWorkingSending;

  return (
    <div className="min-h-screen bg-muted/30">
      <div className="container mx-auto max-w-4xl p-2 sm:p-4">
        <Card className="min-h-[calc(100vh-1rem)] sm:min-h-[calc(100vh-2rem)] flex flex-col">
          {/* Header */}
          <CardHeader className="border-b bg-background/95 backdrop-blur">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className="flex items-center space-x-2">
                  <MessageCircle className="h-6 w-6 text-primary" />
                  <CardTitle className="text-xl sm:text-2xl">Modern Chat</CardTitle>
                </div>
                <Badge 
                  variant={isConvexMode ? "default" : "secondary"} 
                  className="hidden sm:inline-flex"
                >
                  {isConvexMode ? "🚀 WebSockets" : "🔄 Optimized Polling"}
                </Badge>
              </div>
              <div className="flex items-center space-x-3">
                <div className="hidden sm:flex items-center space-x-2">
                  <Avatar className="h-8 w-8">
                    <AvatarFallback className="text-xs bg-primary/10 text-primary">
                      {currentUser.name
                        .split(" ")
                        .map((n) => n[0])
                        .join("")
                        .toUpperCase()
                        .slice(0, 2)}
                    </AvatarFallback>
                  </Avatar>
                  <div className="text-sm">
                    <div className="font-medium">{currentUser.name}</div>
                    <div className="text-muted-foreground text-xs">Online</div>
                  </div>
                </div>
                <ThemeToggle />
              </div>
            </div>
            
            {/* Mobile user info */}
            <div className="flex sm:hidden items-center justify-center space-x-2 pt-2 border-t mt-3">
              <Avatar className="h-6 w-6">
                <AvatarFallback className="text-xs bg-primary/10 text-primary">
                  {currentUser.name
                    .split(" ")
                    .map((n) => n[0])
                    .join("")
                    .toUpperCase()
                    .slice(0, 2)}
                </AvatarFallback>
              </Avatar>
              <span className="text-sm font-medium">{currentUser.name}</span>
              <Badge variant="outline" className="text-xs">
                Online
              </Badge>
            </div>
          </CardHeader>

          {/* Messages area */}
          <div className="flex-1 flex flex-col min-h-0">
            <ErrorBoundary onReset={() => {
              // Force backend redetection on error recovery
              setBackendMode('detecting');
            }}>
              <SmartChatMessages 
                currentUser={currentUser} 
                mode={backendMode}
                convexMessages={convexMessages}
                workingMessages={workingMessages}
              />
            </ErrorBoundary>
          </div>

          {/* Input area */}
          <ChatInput
            onSendMessage={handleSendMessage}
            placeholder="Type your message or attach a file..."
            disabled={isSending}
          />
        </Card>
      </div>
    </div>
  );
}