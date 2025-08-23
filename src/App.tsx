import { useEffect, useState, useRef, useCallback, memo } from "react";
import { faker } from "@faker-js/faker";

import { useQuery, useMutation } from "convex/react";
import { api } from "../convex/_generated/api";
import { Id } from "../convex/_generated/dataModel";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { ThemeToggle } from "@/components/theme-toggle";
import { Paperclip, Send, X, User } from "lucide-react";

// For demo purposes. In a real app, you'd have real user data.
const NAME = getOrSetFakeName();

const FilePreview = memo(function FilePreview({
  fileData,
  fileName,
  fileType,
}: {
  fileData: string;
  fileName: string;
  fileType: string;
}) {
  const isImage = fileType.startsWith("image/");

  if (isImage) {
    return (
      <div className="mt-2 rounded-lg overflow-hidden bg-muted">
        <img
          src={fileData}
          alt={fileName}
          className="w-full max-w-md h-auto rounded-t-lg"
          loading="lazy"
        />
        <div className="px-3 py-2 text-sm text-muted-foreground bg-background border-t">
          {fileName}
        </div>
      </div>
    );
  }

  return (
    <div className="mt-2 p-3 bg-muted rounded-lg border">
      <a
        href={fileData}
        download={fileName}
        className="flex items-center gap-2 text-primary hover:text-primary/80 font-medium text-sm"
      >
        <Paperclip className="h-4 w-4" />
        {fileName}
      </a>
      <div className="text-xs text-muted-foreground mt-1">{fileType}</div>
    </div>
  );
});

interface Message {
  _id: string;
  _creationTime: number;
  user: string;
  body: string;
  fileData?: string;
  fileName?: string;
  fileType?: string;
  fileSize?: number;
}

export default function App() {
  // Use local state for demo since backend deployment has issues
  const [localMessages, setLocalMessages] = useState<Message[]>([
    {
      _id: "demo1",
      _creationTime: Date.now() - 300000,
      user: "Alice",
      body: "Hey everyone! 👋",
    },
    {
      _id: "demo2",
      _creationTime: Date.now() - 240000,
      user: "Bob",
      body: "Check out this cool feature - file sharing!",
    },
    {
      _id: "demo3",
      _creationTime: Date.now() - 180000,
      user: "Charlie",
      body: "Here's a sample image to show the preview functionality:",
      fileData:
        "data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAwIiBoZWlnaHQ9IjEwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KICA8cmVjdCB3aWR0aD0iMTAwJSIgaGVpZ2h0PSIxMDAlIiBmaWxsPSIjNjY3ZWVhIi8+CiAgPHRleHQgeD0iNTAlIiB5PSI1MCUiIGZvbnQtZmFtaWx5PSJBcmlhbCIgZm9udC1zaXplPSIxNiIgZmlsbD0id2hpdGUiIHRleHQtYW5jaG9yPSJtaWRkbGUiIGR5PSIwLjNlbSI+U2FtcGxlIEltYWdlPC90ZXh0Pgo8L3N2Zz4=",
      fileName: "sample-image.svg",
      fileType: "image/svg+xml",
      fileSize: 234,
    },
    {
      _id: "demo4",
      _creationTime: Date.now() - 120000,
      user: "Diana",
      body: "And here's how non-image files are displayed:",
      fileData:
        "data:text/plain;base64,SGVsbG8gV29ybGQhClRoaXMgaXMgYSBzYW1wbGUgdGV4dCBmaWxlIGRlbW9uc3RyYXRpbmcgZmlsZSBzaGFyaW5nIGZ1bmN0aW9uYWxpdHku",
      fileName: "sample-document.txt",
      fileType: "text/plain",
      fileSize: 89,
    },
  ]);

  const messages = localMessages; // Use local messages for demo
  const sendMessage = null; // Will implement custom logic

  const [newMessageText, setNewMessageText] = useState("");
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // Check file size (2MB limit for base64 storage)
      if (file.size > 2 * 1024 * 1024) {
        alert("File size must be less than 2MB for this demo");
        e.target.value = "";
        return;
      }
      setSelectedFile(file);
    }
  }, []);

  const handleRemoveFile = useCallback(() => {
    setSelectedFile(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  }, []);

  useEffect(() => {
    // Make sure scrollTo works on button click in Chrome
    setTimeout(() => {
      window.scrollTo({ top: document.body.scrollHeight, behavior: "smooth" });
    }, 0);
  }, [messages]);

  const handleSubmit = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();

    setUploading(true);
    try {
      let fileData: string | undefined;
      let fileName: string | undefined;
      let fileType: string | undefined;
      let fileSize: number | undefined;

      if (selectedFile) {
        // Convert file to base64
        const reader = new FileReader();
        fileData = await new Promise<string>((resolve, reject) => {
          reader.onload = () => resolve(reader.result as string);
          reader.onerror = reject;
          reader.readAsDataURL(selectedFile);
        });

        fileName = selectedFile.name;
        fileType = selectedFile.type;
        fileSize = selectedFile.size;
      }

      // Send message with file data (local demo)
      const newMessage: Message = {
        _id: `msg_${Date.now()}`,
        _creationTime: Date.now(),
        user: NAME,
        body: newMessageText || (selectedFile ? "" : ""),
        fileData,
        fileName,
        fileType,
        fileSize,
      };

      setLocalMessages((prev) => [...prev, newMessage]);

      setNewMessageText("");
      setSelectedFile(null);
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    } catch (error) {
      console.error("Error sending message:", error);
      alert("Error sending message. Please try again.");
    } finally {
      setUploading(false);
    }
  }, [newMessageText, selectedFile]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-600 via-purple-600 to-purple-800 p-2 sm:p-4">
      <div className="container mx-auto max-w-4xl">
        <main role="main" aria-label="Chat application">
          <Card className="min-h-[calc(100vh-1rem)] sm:min-h-[calc(100vh-2rem)] shadow-2xl">
          <CardHeader className="border-b">
            <div className="flex items-start justify-between">
              <div className="min-w-0 flex-1">
                <CardTitle className="text-2xl sm:text-3xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                  Convex Chat
                </CardTitle>
                <div className="flex items-center gap-2 text-muted-foreground mt-2">
                  <User className="h-3 w-3 sm:h-4 sm:w-4" />
                  <span className="text-sm sm:text-base truncate">Connected as <strong>{NAME}</strong></span>
                </div>
              </div>
              <div className="flex-shrink-0 ml-2">
                <ThemeToggle />
              </div>
            </div>
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 mt-4">
              <div className="text-blue-800 text-sm font-medium">
                🚀 <strong>File Sharing Demo</strong> - Upload images and files to
                test the new functionality!
              </div>
            </div>
          </CardHeader>

          <CardContent className="flex-1 p-0">
            <div 
              className="h-[50vh] sm:h-[60vh] overflow-y-auto p-3 sm:p-6 space-y-3 sm:space-y-4"
              role="log"
              aria-live="polite"
              aria-label="Chat messages"
            >
              {messages?.map((message) => (
                <article
                  key={message._id}
                  className={`flex gap-2 sm:gap-3 ${
                    message.user === NAME ? "justify-end" : "justify-start"
                  }`}
                  aria-label={`Message from ${message.user}`}
                >
                  {message.user !== NAME && (
                    <Avatar className="shrink-0 w-8 h-8 sm:w-10 sm:h-10">
                      <AvatarFallback 
                        className="text-xs"
                        aria-label={`Avatar for ${message.user}`}
                      >
                        {message.user.slice(0, 2).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                  )}
                  
                  <div className={`space-y-1 ${message.user === NAME ? "items-end" : "items-start"}`}>
                    <div className={`max-w-[85%] sm:max-w-[70%] p-2 sm:p-3 rounded-lg ${
                      message.user === NAME 
                        ? "bg-primary text-primary-foreground ml-auto" 
                        : "bg-muted"
                    }`}>
                      <div className="font-semibold text-sm mb-1">
                        {message.user}
                      </div>
                      
                      {message.body && (
                        <p className="text-sm whitespace-pre-wrap">{message.body}</p>
                      )}

                      {message.fileData && message.fileName && message.fileType && (
                        <FilePreview
                          fileData={message.fileData}
                          fileName={message.fileName}
                          fileType={message.fileType}
                        />
                      )}
                    </div>
                    
                    <div className="text-xs text-muted-foreground">
                      {new Date(message._creationTime).toLocaleTimeString()}
                    </div>
                  </div>

                  {message.user === NAME && (
                    <Avatar className="shrink-0 w-8 h-8 sm:w-10 sm:h-10">
                      <AvatarFallback className="text-xs">
                        {message.user.slice(0, 2).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                  )}
                </article>
              ))}
            </div>

            <div className="border-t p-3 sm:p-6">
              <form 
                onSubmit={handleSubmit} 
                className="space-y-3 sm:space-y-4"
                role="form"
                aria-label="Send message form"
              >
                <div className="flex gap-2">
                  <Input
                    type="text"
                    value={newMessageText}
                    onChange={(e) => setNewMessageText(e.target.value)}
                    placeholder="Write a message…"
                    className="flex-1"
                    autoFocus
                    aria-label="Message text"
                    aria-describedby={selectedFile ? "selected-file-info" : undefined}
                  />

                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*,*/*"
                    onChange={handleFileChange}
                    className="hidden"
                    aria-label="Select file to upload"
                  />

                  <Button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    variant="outline"
                    size="icon"
                    disabled={uploading}
                    aria-label="Attach file"
                  >
                    <Paperclip className="h-4 w-4" />
                  </Button>

                  <Button
                    type="submit"
                    disabled={(!newMessageText && !selectedFile) || uploading}
                    className="px-3 sm:px-6"
                    aria-label={uploading ? "Sending message" : "Send message"}
                  >
                    {uploading ? (
                      <span className="hidden sm:inline" aria-live="polite">Sending...</span>
                    ) : (
                      <>
                        <Send className="h-4 w-4 sm:mr-2" aria-hidden="true" />
                        <span className="hidden sm:inline">Send</span>
                      </>
                    )}
                  </Button>
                </div>

                {selectedFile && (
                  <div 
                    className="flex items-center justify-between p-3 bg-muted rounded-lg"
                    id="selected-file-info"
                    role="status"
                    aria-live="polite"
                  >
                    <span className="text-sm text-muted-foreground">
                      Selected file: {selectedFile.name}
                    </span>
                    <Button
                      type="button"
                      onClick={handleRemoveFile}
                      variant="ghost"
                      size="sm"
                      aria-label="Remove selected file"
                    >
                      <X className="h-4 w-4" aria-hidden="true" />
                    </Button>
                  </div>
                )}
              </form>
            </div>
          </CardContent>
          </Card>
        </main>
      </div>
    </div>
  );
}

function getOrSetFakeName() {
  const NAME_KEY = "tutorial_name";
  const name = sessionStorage.getItem(NAME_KEY);
  if (!name) {
    const newName = faker.person.firstName();
    sessionStorage.setItem(NAME_KEY, newName);
    return newName;
  }
  return name;
}