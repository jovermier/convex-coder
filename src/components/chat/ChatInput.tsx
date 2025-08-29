import { useCallback, useEffect, useRef, useState } from "react";

import { Paperclip, Send, X } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";

interface ChatInputProps {
  onSendMessage: (content: string, files?: File[]) => Promise<void>;
  disabled?: boolean;
  placeholder?: string;
}

export function ChatInput({
  onSendMessage,
  disabled,
  placeholder = "Type a message...",
}: ChatInputProps) {
  const [message, setMessage] = useState("");
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const newFiles = Array.from(e.target.files || []);
      if (newFiles.length === 0) return;

      // Check file size limit (10MB per file)
      const oversizedFiles = newFiles.filter(
        (file) => file.size > 10 * 1024 * 1024
      );
      if (oversizedFiles.length > 0) {
        alert(
          `File size must be less than 10MB. Large files: ${oversizedFiles.map((f) => f.name).join(", ")}`
        );
        e.target.value = "";
        return;
      }

      // Check total file count (max 5 files)
      if (selectedFiles.length + newFiles.length > 5) {
        alert("Maximum 5 files allowed at once");
        e.target.value = "";
        return;
      }

      setSelectedFiles((prev) => [...prev, ...newFiles]);
      e.target.value = ""; // Reset input so same files can be selected again
    },
    [selectedFiles.length]
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

  const handleRemoveFile = useCallback((fileToRemove: File) => {
    // Clean up object URL to prevent memory leaks
    if (isImageFile(fileToRemove)) {
      const previewUrl = getFilePreviewUrl(fileToRemove);
      if (previewUrl) {
        URL.revokeObjectURL(previewUrl);
      }
    }
    setSelectedFiles((prev) => prev.filter((file) => file !== fileToRemove));
  }, []);

  // Clean up object URLs on unmount or file change
  useEffect(() => {
    return () => {
      selectedFiles.forEach((file) => {
        if (isImageFile(file)) {
          const previewUrl = getFilePreviewUrl(file);
          if (previewUrl) {
            URL.revokeObjectURL(previewUrl);
          }
        }
      });
    };
  }, [selectedFiles]);

  const handleSubmit = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault();

      if ((!message.trim() && selectedFiles.length === 0) || isSubmitting) {
        return;
      }

      setIsSubmitting(true);

      try {
        await onSendMessage(
          message.trim(),
          selectedFiles.length > 0 ? selectedFiles : undefined
        );

        // Clean up object URLs after successful send
        selectedFiles.forEach((file) => {
          if (isImageFile(file)) {
            const previewUrl = getFilePreviewUrl(file);
            if (previewUrl) {
              URL.revokeObjectURL(previewUrl);
            }
          }
        });

        setMessage("");
        setSelectedFiles([]);
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
    [message, selectedFiles, isSubmitting, onSendMessage]
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
        {/* File previews */}
        {selectedFiles.length > 0 && (
          <div
            className="space-y-2"
            role="region"
            aria-label="File attachment previews"
          >
            {selectedFiles.map((file, index) => (
              <Card key={`${file.name}-${file.size}-${index}`} className="p-3">
                <div className="flex items-start gap-3">
                  {/* Image preview */}
                  {isImageFile(file) && (
                    <div className="flex-shrink-0">
                      <img
                        src={getFilePreviewUrl(file)!}
                        alt={`Preview of ${file.name}`}
                        className="bg-muted h-16 w-16 rounded-lg border object-cover"
                      />
                    </div>
                  )}

                  {/* File details */}
                  <div className="flex min-w-0 flex-1 items-center justify-between">
                    <div className="flex min-w-0 items-center gap-2">
                      {!isImageFile(file) && (
                        <Paperclip
                          className="text-muted-foreground h-4 w-4 flex-shrink-0"
                          aria-hidden="true"
                        />
                      )}
                      <div className="min-w-0">
                        <p className="truncate text-sm font-medium">
                          {file.name}
                        </p>
                        <p className="text-muted-foreground text-xs">
                          {formatFileSize(file.size)}
                          {isImageFile(file) && " • Image"}
                        </p>
                      </div>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleRemoveFile(file)}
                      className="flex-shrink-0"
                      aria-label={`Remove attachment: ${file.name}`}
                    >
                      <X className="h-4 w-4" aria-hidden="true" />
                      <span className="sr-only">Remove file</span>
                    </Button>
                  </div>
                </div>
              </Card>
            ))}
            <div className="text-muted-foreground text-center text-xs">
              {selectedFiles.length}/5 files selected
            </div>
          </div>
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
            multiple
            id="file-input"
            aria-label="Select files to attach"
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
              (!message.trim() && selectedFiles.length === 0) ||
              disabled ||
              isSubmitting
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
