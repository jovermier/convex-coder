import { useState, useRef, useCallback, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Card } from "@/components/ui/card";
import { Paperclip, Send, X } from "lucide-react";
import { cn } from "@/lib/utils";

interface ChatInputProps {
  onSendMessage: (content: string, file?: File) => Promise<void>;
  disabled?: boolean;
  placeholder?: string;
}

export function ChatInput({ onSendMessage, disabled, placeholder = "Type a message..." }: ChatInputProps) {
  const [message, setMessage] = useState("");
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
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
  }, []);

  // Check if the selected file is an image
  const isImageFile = (file: File) => {
    return file.type.startsWith('image/');
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

  const handleSubmit = useCallback(async (e: React.FormEvent) => {
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
  }, [message, selectedFile, isSubmitting, onSendMessage]);

  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e as any);
    }
  }, [handleSubmit]);

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return "0 Bytes";
    const k = 1024;
    const sizes = ["Bytes", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
  };

  return (
    <div className="border-t bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="p-4 space-y-3">
        {/* File preview */}
        {selectedFile && (
          <Card className="p-3">
            <div className="flex items-start gap-3">
              {/* Image preview */}
              {isImageFile(selectedFile) && (
                <div className="flex-shrink-0">
                  <img
                    src={getFilePreviewUrl(selectedFile)!}
                    alt={selectedFile.name}
                    className="w-16 h-16 rounded-lg object-cover border bg-muted"
                  />
                </div>
              )}
              
              {/* File details */}
              <div className="flex items-center justify-between flex-1 min-w-0">
                <div className="flex items-center gap-2 min-w-0">
                  {!isImageFile(selectedFile) && (
                    <Paperclip className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                  )}
                  <div className="min-w-0">
                    <p className="text-sm font-medium truncate">{selectedFile.name}</p>
                    <p className="text-xs text-muted-foreground">
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
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </Card>
        )}

        {/* Input form */}
        <form onSubmit={handleSubmit} className="flex gap-2 items-end">
          {/* File input */}
          <input
            ref={fileInputRef}
            type="file"
            onChange={handleFileSelect}
            className="hidden"
            accept="*/*"
          />

          {/* Attachment button */}
          <Button
            type="button"
            variant="ghost"
            size="icon"
            onClick={() => fileInputRef.current?.click()}
            disabled={disabled || isSubmitting}
            className="flex-shrink-0"
          >
            <Paperclip className="h-4 w-4" />
          </Button>

          {/* Message textarea */}
          <div className="flex-1 relative">
            <Textarea
              ref={textareaRef}
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder={placeholder}
              disabled={disabled || isSubmitting}
              className={cn(
                "min-h-[2.5rem] max-h-32 resize-none rounded-xl pr-12",
                "focus-visible:ring-1 focus-visible:ring-ring"
              )}
              rows={1}
              style={{
                height: "auto",
                minHeight: "2.5rem",
              }}
              onInput={(e) => {
                const target = e.target as HTMLTextAreaElement;
                target.style.height = "auto";
                target.style.height = `${Math.min(target.scrollHeight, 128)}px`;
              }}
            />
          </div>

          {/* Send button */}
          <Button
            type="submit"
            disabled={(!message.trim() && !selectedFile) || disabled || isSubmitting}
            size="icon"
            className="flex-shrink-0 rounded-full"
          >
            {isSubmitting ? (
              <div className="animate-spin rounded-full h-4 w-4 border-2 border-background border-t-transparent" />
            ) : (
              <Send className="h-4 w-4" />
            )}
          </Button>
        </form>

        {/* Helper text */}
        <p className="text-xs text-muted-foreground">
          Press Enter to send, Shift+Enter for new line
        </p>
      </div>
    </div>
  );
}