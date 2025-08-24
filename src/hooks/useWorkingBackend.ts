import { useCallback, useEffect, useState } from "react";

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
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      path: functionPath,
      args,
    }),
  });

  const result = await response.json();

  if (result.status === "error") {
    throw new Error(result.errorMessage || "Query failed");
  }

  return result.value;
}

async function directMutation(functionPath: string, args: any = {}) {
  const response = await fetch(`${CONVEX_URL}/api/mutation`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      path: functionPath,
      args,
    }),
  });

  const result = await response.json();

  if (result.status === "error") {
    throw new Error(result.errorMessage || "Mutation failed");
  }

  return result.value;
}

// Hook to get messages from the working backend
export function useWorkingMessages() {
  const [messages, setMessages] = useState<TransformedMessage[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const fetchMessages = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);

      const deployedMessages: DeployedMessage[] =
        await directQuery("chat:getMessages");

      // Transform to match our expected format
      const transformed: TransformedMessage[] = deployedMessages.map((msg) => ({
        _id: msg._id,
        senderId: `user_${msg.user.toLowerCase().replace(/\s+/g, "_")}`,
        senderName: msg.user,
        content: msg.body,
        type: "text" as const,
        createdAt: msg._creationTime,
      }));

      setMessages(transformed);
      console.log(
        "✅ Successfully loaded",
        transformed.length,
        "messages from backend"
      );
    } catch (err) {
      console.error("❌ Failed to fetch messages:", err);
      setError(err as Error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchMessages();

    // Set up polling to get new messages
    const interval = setInterval(fetchMessages, 3000);

    return () => clearInterval(interval);
  }, [fetchMessages]);

  return { messages, isLoading, error, refetch: fetchMessages };
}

// Hook to send messages to the working backend
export function useWorkingSendMessage() {
  const [isSending, setIsSending] = useState(false);

  const sendMessage = useCallback(async (content: string, user: User) => {
    try {
      setIsSending(true);

      await directMutation("chat:sendMessage", {
        body: content,
        user: user.name,
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

// Hook to create a "user" (since user management isn't in the deployed backend, we just simulate it)
export function useWorkingUser() {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const initializeUser = () => {
      try {
        // Get or create user from sessionStorage
        const storedUserData = sessionStorage.getItem("chat_user");
        let userData: { name: string; email?: string };

        if (storedUserData) {
          userData = JSON.parse(storedUserData);
        } else {
          // Generate a simple random name for demo
          const names = [
            "Alex",
            "Jordan",
            "Taylor",
            "Casey",
            "Morgan",
            "Riley",
          ];
          const randomName = names[Math.floor(Math.random() * names.length)];
          userData = {
            name: randomName,
            email: `${randomName.toLowerCase()}@example.com`,
          };
          sessionStorage.setItem("chat_user", JSON.stringify(userData));
        }

        const user: User = {
          _id: `user_${userData.name.toLowerCase()}_${Date.now()}` as any,
          name: userData.name,
          email: userData.email,
          isOnline: true,
          createdAt: Date.now(),
        };

        setCurrentUser(user);
        console.log("✅ User initialized:", user.name);
      } catch (error) {
        console.error("❌ Failed to initialize user:", error);
      } finally {
        setIsLoading(false);
      }
    };

    initializeUser();
  }, []);

  const logout = useCallback(() => {
    sessionStorage.removeItem("chat_user");
    setCurrentUser(null);
  }, []);

  return {
    currentUser,
    isLoading,
    logout,
  };
}
