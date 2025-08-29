import React, {
  ReactNode,
  createContext,
  useContext,
  useEffect,
  useState,
} from "react";

import { useMutation, useQuery } from "convex/react";

import { api } from "../../convex/_generated/api";
import { Id } from "../../convex/_generated/dataModel";

interface User {
  _id: Id<"users">;
  email?: string;
  name: string;
  isOnline?: boolean;
  lastSeen?: number;
  createdAt: number;
}

interface AuthContextType {
  user: User | null;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (email: string, password: string, name: string) => Promise<void>;
  signOut: () => void;
  loading: boolean;
  error: string | null;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [userId, setUserId] = useState<Id<"users"> | null>(() => {
    const stored = localStorage.getItem("userId");
    return stored ? (stored as Id<"users">) : null;
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const signInMutation = useMutation(api.chat.signIn);
  const signUpMutation = useMutation(api.chat.signUp);
  const signOutMutation = useMutation(api.chat.signOut);

  const user = useQuery(api.chat.getCurrentUser, {
    userId: userId || undefined,
  });

  useEffect(() => {
    if (userId) {
      localStorage.setItem("userId", userId);
    } else {
      localStorage.removeItem("userId");
    }
  }, [userId]);

  const signIn = async (email: string, password: string) => {
    setLoading(true);
    setError(null);
    try {
      // Clear any old fake user data from sessionStorage
      sessionStorage.removeItem("chat_user");
      const result = await signInMutation({ email, password });
      setUserId(result.userId);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Sign in failed");
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const signUp = async (email: string, password: string, name: string) => {
    setLoading(true);
    setError(null);
    try {
      // Clear any old fake user data from sessionStorage
      sessionStorage.removeItem("chat_user");
      const result = await signUpMutation({ email, password, name });
      setUserId(result.userId);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Sign up failed");
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const signOut = async () => {
    if (userId) {
      try {
        await signOutMutation({ userId });
      } catch (err) {
        console.error("Sign out error:", err);
      }
    }
    setUserId(null);
  };

  return (
    <AuthContext.Provider
      value={{
        user: user
          ? ({
              ...user,
              name: user.name || "Unknown User",
              createdAt: Date.now(),
            } as User)
          : null,
        signIn,
        signUp,
        signOut,
        loading,
        error,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
