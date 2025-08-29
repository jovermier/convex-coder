import { useCallback, useState } from "react";

import { useMutation } from "convex/react";

import { useAuth } from "@/contexts/AuthContext";

import { api } from "../../convex/_generated/api";
import { Id } from "../../convex/_generated/dataModel";

export function useMessageDelete(onAutoScroll?: () => void) {
  const { user } = useAuth();
  const deleteMessageMutation = useMutation(api.chat.deleteMessage);
  const [isDeleting, setIsDeleting] = useState(false);

  const deleteMessage = useCallback(
    async (messageId: string) => {
      if (!user) {
        throw new Error("User not authenticated");
      }

      try {
        setIsDeleting(true);

        // Signal that we're about to delete a message (this will cause scroll adjustments)
        onAutoScroll?.();

        await deleteMessageMutation({
          messageId: messageId as Id<"messages">,
          userId: user._id,
        });
      } catch (error) {
        console.error("Failed to delete message:", error);
        throw error;
      } finally {
        setIsDeleting(false);
      }
    },
    [user, deleteMessageMutation, onAutoScroll]
  );

  return { deleteMessage, isDeleting };
}
