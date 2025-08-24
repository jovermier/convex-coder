import { memo } from "react";

import { Download, Paperclip } from "lucide-react";

import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Dialog, DialogContent, DialogTrigger } from "@/components/ui/dialog";
import { useConvexFileUrl } from "@/hooks/useConvexChat";
import { cn } from "@/lib/utils";

import { Id } from "../../../convex/_generated/dataModel";

interface Message {
  _id: string;
  _creationTime?: number; // Optional for backward compatibility
  senderId: string;
  senderName: string;
  content: string;
  type: "text" | "image" | "file";

  // File attachment fields
  storageId?: Id<"_storage">;
  fileName?: string;
  fileType?: string;
  fileSize?: number;

  // Legacy base64 support
  fileData?: string;

  createdAt: number;
}

interface MessageBubbleProps {
  message: Message;
  isOwnMessage: boolean;
  showAvatar: boolean;
}

export const MessageBubble = memo(function MessageBubble({
  message,
  isOwnMessage,
  showAvatar,
}: MessageBubbleProps) {
  // Get file URL from Convex storage if storageId exists
  const fileUrl = useConvexFileUrl(message.storageId);
  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return "0 Bytes";
    const k = 1024;
    const sizes = ["Bytes", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
  };

  const formatTime = (timestamp: number) => {
    return new Date(timestamp).toLocaleTimeString([], {
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((word) => word[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  const renderFileContent = () => {
    const displayUrl = fileUrl || message.fileData;

    if (!displayUrl || !message.fileName) return null;

    if (message.type === "image" || message.fileType?.startsWith("image/")) {
      return (
        <Dialog>
          <DialogTrigger asChild>
            <div className="group mt-2 cursor-pointer">
              <img
                src={displayUrl}
                alt={message.fileName}
                className="bg-muted max-w-xs rounded-lg border transition-opacity group-hover:opacity-90"
                loading="lazy"
              />
              <div className="text-muted-foreground mt-1 text-xs">
                {message.fileName}
                {message.fileSize && ` • ${formatFileSize(message.fileSize)}`}
              </div>
            </div>
          </DialogTrigger>
          <DialogContent className="max-h-[90vh] max-w-4xl p-0">
            <img
              src={displayUrl}
              alt={message.fileName}
              className="h-full w-full rounded-lg object-contain"
            />
          </DialogContent>
        </Dialog>
      );
    }

    // Non-image file
    return (
      <Card className="mt-2 max-w-sm">
        <CardContent className="p-3">
          <div className="flex items-center gap-3">
            <div className="flex-shrink-0">
              <div className="bg-muted flex h-10 w-10 items-center justify-center rounded-lg">
                <Paperclip className="text-muted-foreground h-5 w-5" />
              </div>
            </div>
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-medium">{message.fileName}</p>
              <div className="text-muted-foreground flex items-center gap-2 text-xs">
                {message.fileType && (
                  <span>{message.fileType.split("/")[1]?.toUpperCase()}</span>
                )}
                {message.fileSize && (
                  <span>{formatFileSize(message.fileSize)}</span>
                )}
              </div>
            </div>
            <Button variant="ghost" size="sm" asChild className="flex-shrink-0">
              <a href={displayUrl} download={message.fileName}>
                <Download className="h-4 w-4" />
              </a>
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  };

  return (
    <div
      className={cn(
        "group animate-in slide-in-from-bottom-2 fade-in-50 flex gap-3",
        isOwnMessage ? "flex-row-reverse" : "flex-row"
      )}
    >
      {/* Avatar */}
      {showAvatar && (
        <Avatar className="h-8 w-8 flex-shrink-0">
          <AvatarFallback className="bg-primary/10 text-primary text-xs">
            {getInitials(message.senderName)}
          </AvatarFallback>
        </Avatar>
      )}

      {/* Spacer when no avatar */}
      {!showAvatar && !isOwnMessage && <div className="w-8" />}

      {/* Message Content */}
      <div
        className={cn(
          "flex max-w-xs flex-col gap-1 sm:max-w-md lg:max-w-lg",
          isOwnMessage ? "items-end" : "items-start"
        )}
      >
        {/* Sender name (only show for other users' messages) */}
        {!isOwnMessage && showAvatar && (
          <span className="text-muted-foreground px-1 text-xs">
            {message.senderName}
          </span>
        )}

        {/* Message bubble */}
        <div
          className={cn(
            "rounded-2xl px-4 py-2 break-words",
            isOwnMessage
              ? "bg-primary/90 text-primary-foreground rounded-br-sm"
              : "bg-secondary text-secondary-foreground rounded-bl-sm"
          )}
        >
          {/* Text content */}
          {message.content && (
            <p className="text-sm whitespace-pre-wrap">{message.content}</p>
          )}

          {/* File content */}
          {renderFileContent()}
        </div>

        {/* Timestamp */}
        <span
          className={cn(
            "text-muted-foreground px-1 text-xs opacity-0 transition-opacity group-hover:opacity-100",
            isOwnMessage ? "text-right" : "text-left"
          )}
        >
          {formatTime(message._creationTime || message.createdAt)}
        </span>
      </div>
    </div>
  );
});
