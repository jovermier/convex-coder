import { useEffect, useState, useRef } from "react";
import { faker } from "@faker-js/faker";

import { useQuery, useMutation } from "convex/react";
import { api } from "../convex/_generated/api";
import { Id } from "../convex/_generated/dataModel";

// For demo purposes. In a real app, you'd have real user data.
const NAME = getOrSetFakeName();

function FilePreview({
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
      <div className="image-preview">
        <img src={fileData} alt={fileName} />
        <div className="file-name">{fileName}</div>
      </div>
    );
  }

  return (
    <div className="file-attachment">
      <a href={fileData} download={fileName}>
        📎 {fileName}
      </a>
      <div className="file-size">{fileType}</div>
    </div>
  );
}

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

  useEffect(() => {
    // Make sure scrollTo works on button click in Chrome
    setTimeout(() => {
      window.scrollTo({ top: document.body.scrollHeight, behavior: "smooth" });
    }, 0);
  }, [messages]);

  return (
    <main className="chat">
      <header>
        <h1>Convex Chat</h1>
        <p>
          Connected as <strong>{NAME}</strong>
        </p>
        <div
          style={{
            backgroundColor: "#e0f2fe",
            color: "#0277bd",
            padding: "0.5rem",
            borderRadius: "6px",
            fontSize: "0.875rem",
            marginTop: "0.5rem",
          }}
        >
          🚀 <strong>File Sharing Demo</strong> - Upload images and files to
          test the new functionality!
        </div>
      </header>
      {messages?.map((message) => (
        <article
          key={message._id}
          className={message.user === NAME ? "message-mine" : ""}
        >
          <div>{message.user}</div>

          {message.body && <p>{message.body}</p>}

          {message.fileData && message.fileName && message.fileType && (
            <FilePreview
              fileData={message.fileData}
              fileName={message.fileName}
              fileType={message.fileType}
            />
          )}
        </article>
      ))}
      <form
        onSubmit={async (e) => {
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
        }}
      >
        <div className="message-input-container">
          <input
            type="text"
            value={newMessageText}
            onChange={(e) => setNewMessageText(e.target.value)}
            placeholder="Write a message…"
            autoFocus
          />

          <input
            ref={fileInputRef}
            type="file"
            accept="image/*,*/*"
            onChange={(e) => {
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
            }}
            className="file-input"
          />

          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="file-button"
            disabled={uploading}
          >
            📎
          </button>

          <button
            type="submit"
            disabled={(!newMessageText && !selectedFile) || uploading}
          >
            {uploading ? "Sending..." : "Send"}
          </button>
        </div>

        {selectedFile && (
          <div className="selected-file">
            <span>{selectedFile.name}</span>
            <button
              type="button"
              onClick={() => {
                setSelectedFile(null);
                if (fileInputRef.current) {
                  fileInputRef.current.value = "";
                }
              }}
            >
              ×
            </button>
          </div>
        )}
      </form>
    </main>
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
