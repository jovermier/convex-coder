import { useState, useEffect, useCallback, useRef } from "react";
import { User } from "./useUser";

const CONVEX_URL = import.meta.env.VITE_CONVEX_URL || "http://localhost:3210";

interface DeployedMessage {
  _id: string;
  _creationTime: number;
  body: string;
  user: string;
}

interface TransformedMessage {
  _id: string;
  senderId: string;
  senderName: string;
  content: string;
  type: "text";
  createdAt: number;
}

// Direct API functions
async function directQuery(functionPath: string, args: any = {}) {
  const response = await fetch(`${CONVEX_URL}/api/query`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      path: functionPath,
      args
    })
  });
  
  const result = await response.json();
  
  if (result.status === "error") {
    throw new Error(result.errorMessage || "Query failed");
  }
  
  return result.value;
}

async function directMutation(functionPath: string, args: any = {}) {
  const response = await fetch(`${CONVEX_URL}/api/mutation`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      path: functionPath,
      args
    })
  });
  
  const result = await response.json();
  
  if (result.status === "error") {
    throw new Error(result.errorMessage || "Mutation failed");
  }
  
  return result.value;
}

/**
 * OPTIMIZED Hook to get messages from the working backend
 * Fixes flickering issues while maintaining polling approach
 */
export function useOptimizedWorkingMessages() {
  const [messages, setMessages] = useState<TransformedMessage[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  
  // Use refs to prevent unnecessary re-renders
  const messagesRef = useRef<TransformedMessage[]>([]);
  const lastFetchTime = useRef<number>(0);
  const isPollingActive = useRef<boolean>(true);

  const fetchMessages = useCallback(async () => {
    try {
      setError(null);
      
      const deployedMessages: DeployedMessage[] = await directQuery("chat:getMessages");
      
      // Transform to match expected format (text messages only)
      const transformed: TransformedMessage[] = deployedMessages.map(msg => ({
        _id: msg._id,
        senderId: `user_${msg.user.toLowerCase().replace(/\s+/g, '_')}`,
        senderName: msg.user,
        content: msg.body,
        type: "text" as const, // Working backend only supports text messages
        createdAt: msg._creationTime,
      }));
      
      // ANTI-FLICKER: Only update state if messages actually changed
      const messagesChanged = !deepEqual(transformed, messagesRef.current);
      
      if (messagesChanged) {
        messagesRef.current = transformed;
        setMessages(transformed);
        console.log("✅ Messages updated:", transformed.length, "messages");
      }
      
      lastFetchTime.current = Date.now();
      
    } catch (err) {
      console.error("❌ Failed to fetch messages:", err);
      setError(err as Error);
    } finally {
      // Only set loading false on first successful fetch
      if (isLoading) {
        setIsLoading(false);
      }
    }
  }, [isLoading]);

  // Deep comparison utility to prevent unnecessary updates
  const deepEqual = (a: any[], b: any[]) => {
    if (a.length !== b.length) return false;
    return a.every((item, index) => {
      const bItem = b[index];
      return item._id === bItem._id &&
             item.content === bItem.content &&
             item.senderName === bItem.senderName &&
             item.createdAt === bItem.createdAt;
    });
  };

  useEffect(() => {
    isPollingActive.current = true;
    
    // Initial fetch
    fetchMessages();
    
    // OPTIMIZED POLLING: 
    // - Longer interval (5s instead of 3s) to reduce server load
    // - Smart polling that only updates UI when data actually changes
    const interval = setInterval(() => {
      if (isPollingActive.current) {
        fetchMessages();
      }
    }, 5000);
    
    // Cleanup
    return () => {
      isPollingActive.current = false;
      clearInterval(interval);
    };
  }, [fetchMessages]);

  // Pause polling when tab is not visible to save resources
  useEffect(() => {
    const handleVisibilityChange = () => {
      isPollingActive.current = !document.hidden;
      if (isPollingActive.current && Date.now() - lastFetchTime.current > 10000) {
        // If we've been away for more than 10 seconds, fetch immediately
        fetchMessages();
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
  }, [fetchMessages]);

  return { messages, isLoading, error, refetch: fetchMessages };
}

/**
 * Hook to send messages to the working backend (unchanged)
 */
export function useOptimizedWorkingSendMessage() {
  const [isSending, setIsSending] = useState(false);

  const sendMessage = useCallback(async (content: string, user: User, file?: File) => {
    try {
      setIsSending(true);
      
      // Working backend only supports text messages
      if (file) {
        throw new Error("File uploads are not supported by the working backend. Please use the Convex backend with file storage functions.");
      }
      
      await directMutation("chat:sendMessage", {
        body: content,
        user: user.name
      });
      
      console.log("✅ Message sent successfully");
      return true;
      
    } catch (err) {
      console.error("❌ Failed to send message:", err);
      throw err;
    } finally {
      setIsSending(false);
    }
  }, []);

  return { sendMessage, isSending };
}