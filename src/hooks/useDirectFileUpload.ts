import { useCallback, useState } from "react";

import { User } from "./useUser";

const CONVEX_URL = import.meta.env.VITE_CONVEX_URL || "http://localhost:3210";

/**
 * Hook for direct file uploads using HTTP Actions
 * This bypasses the generateUploadUrl flow and uploads directly to the backend
 */
export function useDirectFileUpload() {
  const [isUploading, setIsUploading] = useState(false);

  const uploadFile = useCallback(async (file: File, user: User) => {
    try {
      setIsUploading(true);
      console.log("📎 Starting direct file upload:", file.name);

      // Create form data for HTTP action
      const formData = new FormData();
      formData.append("file", file);
      formData.append("uploaderId", user._id);

      // Upload directly to HTTP action endpoint
      const response = await fetch(`${CONVEX_URL}/uploadFile`, {
        method: "POST",
        body: formData,
      });

      const result = await response.json();

      if (!response.ok || !result.success) {
        throw new Error(result.error || "File upload failed");
      }

      console.log("✅ Direct file upload successful:", result);

      return {
        storageId: result.storageId,
        fileId: result.fileId || null, // May not be returned if files table isn't available
        fileName: file.name,
        fileType: file.type,
        fileSize: file.size,
      };
    } catch (error) {
      console.error("❌ Direct file upload failed:", error);
      throw error;
    } finally {
      setIsUploading(false);
    }
  }, []);

  return { uploadFile, isUploading };
}
