import { useCallback, useMemo, useState } from "react";

import { useMutation, useQuery } from "convex/react";

import { api } from "../../convex/_generated/api";
import { Id } from "../../convex/_generated/dataModel";
import { User } from "./useUser";

// Type for the message data returned by Convex backend
// This extends the basic API response with optional file fields
interface ConvexMessage {
  _id: string;
  _creationTime: number;
  body: string;
  user: string;
  // File attachment fields (may not exist on all messages)
  type?: "text" | "image" | "file";
  storageId?: Id<"_storage">;
  fileName?: string;
  fileType?: string;
  fileSize?: number;
  fileData?: string;
}

// Type-safe utility to check if an object has a property
function hasProperty<T, K extends string>(
  obj: T,
  prop: K
): obj is T & Record<K, unknown> {
  return typeof obj === "object" && obj !== null && prop in obj;
}

// Type-safe message transformation function
function transformConvexMessage(msg: ConvexMessage) {
  return {
    _id: msg._id,
    _creationTime: msg._creationTime,
    senderId: msg.user,
    senderName: msg.user,
    content: msg.body,
    type: msg.type ?? ("text" as const), // Use nullish coalescing for cleaner fallback
    storageId: msg.storageId,
    fileName: msg.fileName,
    fileType: msg.fileType,
    fileSize: msg.fileSize,
    fileData: msg.fileData,
    createdAt: msg._creationTime,
  };
}

/**
 * Hook for real-time chat using Convex's native WebSocket-based queries
 * This replaces the polling-based approach to eliminate flickering
 */
export function useConvexMessages() {
  // Use Convex's real-time query with the working function name
  // IMPORTANT: Never call setState during render - let ErrorBoundary handle errors
  const messages = useQuery(api.chat.getMessages) as
    | ConvexMessage[]
    | undefined;

  // Transform to match expected format using type-safe function
  const transformedMessages = useMemo(() => {
    if (!messages) return [];

    try {
      return messages.map(transformConvexMessage);
    } catch (transformError) {
      console.error("Error transforming messages:", transformError);
      return []; // Just return empty array, don't setState during render
    }
  }, [messages]);

  return {
    messages: transformedMessages,
    isLoading: messages === undefined,
    error: null, // Let ErrorBoundary at higher level handle Convex errors
  };
}

/**
 * Hook for sending messages via Convex mutations
 * Uses multiple file upload strategies for maximum compatibility
 */
export function useConvexSendMessage() {
  const sendMessageMutation = useMutation(api.chat.sendMessage);

  // Traditional file upload approach (may not be deployed)
  const generateUploadUrlMutation = useMutation(api.chat.generateUploadUrl);
  const saveFileRecordMutation = useMutation(api.chat.saveFileRecord);

  const [isSending, setIsSending] = useState(false);
  const [fileUploadMethod, setFileUploadMethod] = useState<
    "traditional" | "none" | null
  >(null);

  const sendMessage = useCallback(
    async (content: string, user: User, file?: File) => {
      try {
        setIsSending(true);

        let messageData: any = {
          senderId: user._id,
          content,
          type: "text" as const,
        };

        // Handle file upload if provided - for now, just reject with clear message
        if (file) {
          // Check if we know file uploads don't work
          if (fileUploadMethod === "none") {
            throw new Error(
              "File uploads are not supported on this deployment"
            );
          }

          // Test if generateUploadUrl is available (single test)
          if (fileUploadMethod === null) {
            try {
              console.log(
                "🔍 Testing if file upload functions are deployed..."
              );
              await generateUploadUrlMutation();
              setFileUploadMethod("traditional");
              console.log("✅ File upload functions detected!");
            } catch (testErr) {
              console.log("❌ File upload functions not available:", testErr);
              setFileUploadMethod("none");
              throw new Error(
                "File uploads are not available on this deployment. The backend needs to be updated with file storage functions."
              );
            }
          }

          // If we reach here, traditional method should work
          try {
            console.log("📎 Uploading file via Convex storage:", file.name);

            const uploadUrl = await generateUploadUrlMutation();

            const uploadResult = await fetch(uploadUrl, {
              method: "POST",
              headers: { "Content-Type": file.type },
              body: file,
            });

            if (!uploadResult.ok) {
              throw new Error(
                `File upload failed with status ${uploadResult.status}`
              );
            }

            const { storageId } = await uploadResult.json();

            await saveFileRecordMutation({
              storageId,
              name: file.name,
              type: file.type,
              size: file.size,
              uploaderId: user._id,
              isPublic: true,
            });

            // Update message data with file information
            messageData = {
              ...messageData,
              type: file.type.startsWith("image/") ? "image" : "file",
              storageId,
              fileName: file.name,
              fileType: file.type,
              fileSize: file.size,
              content:
                content ||
                `Shared ${file.type.startsWith("image/") ? "image" : "file"}: ${file.name}`,
            };

            console.log("✅ File upload successful!");
          } catch (uploadErr) {
            console.error("File upload failed:", uploadErr);
            setFileUploadMethod("none");
            throw new Error(
              "File upload failed. The backend file storage functions may not be properly deployed."
            );
          }
        }

        // Send message
        await sendMessageMutation(messageData);

        console.log(
          "✅ Message sent successfully" + (file ? " with file attachment" : "")
        );
        return true;
      } catch (err) {
        console.error("❌ Failed to send message:", err);
        throw err;
      } finally {
        setIsSending(false);
      }
    },
    [
      sendMessageMutation,
      generateUploadUrlMutation,
      saveFileRecordMutation,
      fileUploadMethod,
    ]
  );

  return { sendMessage, isSending, fileUploadMethod };
}

/**
 * Hook to get file URL from storage
 */
export function useConvexFileUrl(storageId: Id<"_storage"> | undefined) {
  return useQuery(api.chat.getFileUrl, storageId ? { storageId } : "skip");
}
