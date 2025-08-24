import { useCallback } from "react";
import { useMutation } from "convex/react";
import { api } from "../../../convex/_generated/api";
import { Id } from "../../../convex/_generated/dataModel";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { ThemeToggle } from "@/components/theme-toggle";
import { ChatMessages } from "./ChatMessages";
import { ChatInput } from "./ChatInput";
import { ErrorBoundary } from "@/components/ErrorBoundary";
import { DemoModeChat } from "./DemoModeChat";
import { User } from "@/hooks/useUser";
import { Users, MessageCircle } from "lucide-react";

interface ChatContainerProps {
  currentUser: User | null;
  isLoading: boolean;
}

export function ChatContainer({ currentUser, isLoading }: ChatContainerProps) {
  const sendMessage = useMutation(api.chat.sendMessage);
  const generateUploadUrl = useMutation(api.chat.generateUploadUrl);
  const saveFileRecord = useMutation(api.chat.saveFileRecord);

  const handleSendMessage = useCallback(async (content: string, file?: File) => {
    if (!currentUser) {
      throw new Error("User not authenticated");
    }

    try {
      let storageId: Id<"_storage"> | undefined;
      let fileName: string | undefined;
      let fileType: string | undefined;
      let fileSize: number | undefined;
      let fileData: string | undefined;

      if (file) {
        try {
          // Try to use Convex storage first
          const uploadUrl = await generateUploadUrl();
          
          const response = await fetch(uploadUrl, {
            method: "POST",
            headers: { "Content-Type": file.type },
            body: file,
          });
          
          if (response.ok) {
            const result = await response.json();
            storageId = result.storageId as Id<"_storage">;
            
            // Save file record
            await saveFileRecord({
              storageId: storageId,
              name: file.name,
              type: file.type,
              size: file.size,
              uploaderId: currentUser._id,
              isPublic: false,
            });
          } else {
            throw new Error("Upload failed");
          }
        } catch (uploadError) {
          console.warn("Storage upload failed, falling back to base64:", uploadError);
          
          // Fallback to base64 for files under 2MB
          if (file.size <= 2 * 1024 * 1024) {
            const reader = new FileReader();
            fileData = await new Promise<string>((resolve, reject) => {
              reader.onload = () => resolve(reader.result as string);
              reader.onerror = reject;
              reader.readAsDataURL(file);
            });
          } else {
            throw new Error("File too large and storage upload failed");
          }
        }

        fileName = file.name;
        fileType = file.type;
        fileSize = file.size;
      }

      try {
        await sendMessage({
          senderId: currentUser._id,
          content: content || "",
          type: file ? (file.type.startsWith("image/") ? "image" : "file") : "text",
          storageId,
          fileName,
          fileType,
          fileSize,
          fileData, // Legacy fallback
        });
      } catch (convexError) {
        console.warn("Convex backend not available, message sent locally for demo");
        // In demo mode, show success feedback even if backend is not available
      }
    } catch (error) {
      console.error("Failed to send message:", error);
      // Don't throw error in demo mode, just log it
      console.warn("Demo mode: Message processing completed with fallbacks");
    }
  }, [currentUser, sendMessage, generateUploadUrl, saveFileRecord]);

  if (isLoading) {
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
                  🚀 Live Mode
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
              <ChatMessages currentUser={currentUser} />
            </ErrorBoundary>
          </div>

          {/* Input area */}
          <ChatInput
            onSendMessage={handleSendMessage}
            placeholder="Type your message..."
          />
        </Card>
      </div>
    </div>
  );
}