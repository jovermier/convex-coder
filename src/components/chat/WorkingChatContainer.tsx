import { useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { ThemeToggle } from "@/components/theme-toggle";
import { ChatInput } from "./ChatInput";
import { ErrorBoundary } from "@/components/ErrorBoundary";
import { WorkingChatMessages } from "./WorkingChatMessages";
import { useWorkingUser, useWorkingSendMessage } from "@/hooks/useWorkingBackend";
import { MessageCircle } from "lucide-react";

export function WorkingChatContainer() {
  const { currentUser, isLoading: userLoading } = useWorkingUser();
  const { sendMessage, isSending } = useWorkingSendMessage();

  const handleSendMessage = useCallback(async (content: string, file?: File) => {
    if (!currentUser) {
      throw new Error("User not authenticated");
    }

    if (file) {
      // For now, don't support file uploads since the deployed backend doesn't have it
      console.warn("File uploads not supported with current backend deployment");
      return;
    }

    try {
      await sendMessage(content, currentUser);
    } catch (error) {
      console.error("Failed to send message:", error);
      throw error;
    }
  }, [currentUser, sendMessage]);

  if (userLoading) {
    return (
      <div className="min-h-screen bg-muted/30 flex items-center justify-center p-4">
        <Card className="w-full max-w-4xl">
          <CardContent className="p-8">
            <div className="flex items-center justify-center space-x-2">
              <div className="animate-spin rounded-full h-6 w-6 border-2 border-primary border-t-transparent" />
              <span className="text-lg">Loading chat...</span>
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
                <Badge variant="secondary" className="hidden sm:inline-flex">
                  ✅ Backend Connected
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
            <ErrorBoundary>
              <WorkingChatMessages currentUser={currentUser} />
            </ErrorBoundary>
          </div>

          {/* Input area */}
          <ChatInput
            onSendMessage={handleSendMessage}
            placeholder="Type your message..."
            disabled={isSending}
          />
        </Card>
      </div>
    </div>
  );
}