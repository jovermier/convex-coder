import { useCallback, useEffect, useRef, useState } from "react";

import { Paperclip, Send, X } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";

interface ChatInputProps {
  onSendMessage: (content: string, file?: File) => Promise<void>;
  disabled?: boolean;
  placeholder?: string;
}

export function ChatInput({
  onSendMessage,
  disabled,
  placeholder = "Type a message...",
}: ChatInputProps) {
  const [message, setMessage] = useState("");
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (file) {
        // Check file size (10MB limit)
        if (file.size > 10 * 1024 * 1024) {
          alert("File size must be less than 10MB");
          e.target.value = "";
          return;
        }
        setSelectedFile(file);
      }
    },
    []
  );

  // Check if the selected file is an image
  const isImageFile = (file: File) => {
    return file.type.startsWith("image/");
  };

  // Create preview URL for images
  const getFilePreviewUrl = (file: File) => {
    if (isImageFile(file)) {
      return URL.createObjectURL(file);
    }
    return null;
  };

  const handleRemoveFile = useCallback(() => {
    // Clean up object URL to prevent memory leaks
    if (selectedFile && isImageFile(selectedFile)) {
      const previewUrl = getFilePreviewUrl(selectedFile);
      if (previewUrl) {
        URL.revokeObjectURL(previewUrl);
      }
    }
    setSelectedFile(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  }, [selectedFile]);

  // Clean up object URLs on unmount or file change
  useEffect(() => {
    return () => {
      if (selectedFile && isImageFile(selectedFile)) {
        const previewUrl = getFilePreviewUrl(selectedFile);
        if (previewUrl) {
          URL.revokeObjectURL(previewUrl);
        }
      }
    };
  }, [selectedFile]);

  const handleSubmit = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault();

      if ((!message.trim() && !selectedFile) || isSubmitting) {
        return;
      }

      setIsSubmitting(true);

      try {
        await onSendMessage(message.trim(), selectedFile || undefined);

        // Clean up object URL after successful send
        if (selectedFile && isImageFile(selectedFile)) {
          const previewUrl = getFilePreviewUrl(selectedFile);
          if (previewUrl) {
            URL.revokeObjectURL(previewUrl);
          }
        }

        setMessage("");
        setSelectedFile(null);
        if (fileInputRef.current) {
          fileInputRef.current.value = "";
        }
        // Focus back to textarea
        textareaRef.current?.focus();
      } catch (error) {
        console.error("Failed to send message:", error);
      } finally {
        setIsSubmitting(false);
      }
    },
    [message, selectedFile, isSubmitting, onSendMessage]
  );

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === "Enter" && !e.shiftKey) {
        e.preventDefault();
        handleSubmit(e as any);
      }
    },
    [handleSubmit]
  );

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return "0 Bytes";
    const k = 1024;
    const sizes = ["Bytes", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
  };

  return (
    <div className="bg-background/95 border-t">
      <div className="space-y-3 p-2">
        {/* File preview */}
        {selectedFile && (
          <Card
            className="p-3"
            role="region"
            aria-label="File attachment preview"
          >
            <div className="flex items-start gap-3">
              {/* Image preview */}
              {isImageFile(selectedFile) && (
                <div className="flex-shrink-0">
                  <img
                    src={getFilePreviewUrl(selectedFile)!}
                    alt={`Preview of ${selectedFile.name}`}
                    className="bg-muted h-16 w-16 rounded-lg border object-cover"
                  />
                </div>
              )}

              {/* File details */}
              <div className="flex min-w-0 flex-1 items-center justify-between">
                <div className="flex min-w-0 items-center gap-2">
                  {!isImageFile(selectedFile) && (
                    <Paperclip
                      className="text-muted-foreground h-4 w-4 flex-shrink-0"
                      aria-hidden="true"
                    />
                  )}
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium" id="file-name">
                      {selectedFile.name}
                    </p>
                    <p
                      className="text-muted-foreground text-xs"
                      id="file-details"
                    >
                      {formatFileSize(selectedFile.size)}
                      {isImageFile(selectedFile) && " • Image"}
                    </p>
                  </div>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleRemoveFile}
                  className="flex-shrink-0"
                  aria-label={`Remove attachment: ${selectedFile.name}`}
                  aria-describedby="file-name"
                >
                  <X className="h-4 w-4" aria-hidden="true" />
                  <span className="sr-only">Remove file</span>
                </Button>
              </div>
            </div>
          </Card>
        )}

        {/* Input form */}
        <form onSubmit={handleSubmit} className="flex items-end gap-2">
          {/* File input */}
          <input
            ref={fileInputRef}
            type="file"
            onChange={handleFileSelect}
            className="sr-only"
            accept="*/*"
            id="file-input"
            aria-label="Select file to attach"
            tabIndex={-1}
          />

          {/* Attachment button */}
          <Button
            type="button"
            variant="ghost"
            size="icon"
            onClick={() => fileInputRef.current?.click()}
            disabled={disabled || isSubmitting}
            className="flex-shrink-0"
            aria-label="Attach file"
            title="Attach file"
          >
            <Paperclip className="h-4 w-4" aria-hidden="true" />
            <span className="sr-only">Attach file</span>
          </Button>

          {/* Message textarea */}
          <div className="relative flex-1">
            <Textarea
              ref={textareaRef}
              id="message-input"
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder={placeholder}
              disabled={disabled || isSubmitting}
              className={cn(
                "h-auto max-h-32 min-h-[2.5rem] resize-none rounded-xl pr-12",
                "focus-visible:ring-ring focus-visible:ring-1"
              )}
              rows={1}
              onInput={(e) => {
                const target = e.target as HTMLTextAreaElement;
                target.style.height = "auto";
                target.style.height = `${Math.min(target.scrollHeight, 128)}px`;
              }}
              aria-label="Type your message"
              aria-describedby="send-message-hint"
            />
            <div id="send-message-hint" className="sr-only">
              Press Enter to send, Shift+Enter for new line
            </div>
          </div>

          {/* Send button */}
          <Button
            type="submit"
            disabled={
              (!message.trim() && !selectedFile) || disabled || isSubmitting
            }
            size="icon"
            className="flex-shrink-0 rounded-full"
            aria-label={isSubmitting ? "Sending message..." : "Send message"}
            aria-describedby="message-input"
          >
            {isSubmitting ? (
              <>
                <div
                  className="border-background h-4 w-4 animate-spin rounded-full border-2 border-t-transparent"
                  aria-hidden="true"
                />
                <span className="sr-only">Sending message...</span>
              </>
            ) : (
              <>
                <Send className="h-4 w-4" aria-hidden="true" />
                <span className="sr-only">Send message</span>
              </>
            )}
          </Button>
        </form>
      </div>
    </div>
  );
}
