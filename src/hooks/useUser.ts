import { useEffect, useState } from "react";

import { faker } from "@faker-js/faker";
import { useMutation, useQuery } from "convex/react";

import { api } from "../../convex/_generated/api";
import { Id } from "../../convex/_generated/dataModel";

export interface User {
  _id: Id<"users">;
  name: string;
  email?: string;
  avatar?: string;
  isOnline?: boolean;
  lastSeen?: number;
  createdAt: number;
}

export function useUser() {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const createUser = useMutation(api.chat.createUser);
  const updateUserStatus = useMutation(api.chat.updateUserStatus);

  useEffect(() => {
    const initializeUser = async () => {
      try {
        // Get or create user from sessionStorage
        const storedUserData = sessionStorage.getItem("chat_user");
        let userData: { name: string; email?: string };

        if (storedUserData) {
          userData = JSON.parse(storedUserData);
        } else {
          // Generate new user
          userData = {
            name: faker.person.firstName(),
            email: `${faker.internet.username()}@example.com`,
          };
          sessionStorage.setItem("chat_user", JSON.stringify(userData));
        }

        // Set a timeout to ensure we don't hang indefinitely
        const timeoutPromise = new Promise((_, reject) => {
          setTimeout(
            () => reject(new Error("Backend connection timeout")),
            5000
          );
        });

        try {
          // Race between backend call and timeout
          const userId = (await Promise.race([
            createUser({
              name: userData.name,
              email: userData.email,
            }),
            timeoutPromise,
          ])) as Id<"users">;

          const user: User = {
            _id: userId,
            name: userData.name,
            email: userData.email,
            isOnline: true,
            createdAt: Date.now(),
          };

          setCurrentUser(user);

          // Try to update user status to online - gracefully handle if function doesn't exist
          try {
            await Promise.race([
              updateUserStatus({
                userId,
                isOnline: true,
              }),
              new Promise((_, reject) =>
                setTimeout(
                  () => reject(new Error("Status update timeout")),
                  2000
                )
              ),
            ]);
          } catch (statusError) {
            console.warn(
              "updateUserStatus not available or timed out, skipping status update"
            );
          }
        } catch (convexError) {
          console.warn(
            "Convex backend not available or timed out, using demo mode",
            convexError
          );

          // Create demo user with fake ID
          const user: User = {
            _id: "demo-user-123" as any,
            name: userData.name,
            email: userData.email,
            isOnline: true,
            createdAt: Date.now(),
          };

          setCurrentUser(user);
        }
      } catch (error) {
        console.error("Failed to initialize user:", error);

        // Fallback to demo mode even if something else fails
        const user: User = {
          _id: "demo-user-fallback" as any,
          name: "Demo User",
          email: "demo@example.com",
          isOnline: true,
          createdAt: Date.now(),
        };
        setCurrentUser(user);
      } finally {
        setIsLoading(false);
      }
    };

    initializeUser();
  }, [createUser, updateUserStatus]);

  // Update user status when page visibility changes
  useEffect(() => {
    if (!currentUser) return;

    const handleVisibilityChange = async () => {
      if (document.visibilityState === "visible") {
        try {
          await updateUserStatus({
            userId: currentUser._id,
            isOnline: true,
          });
        } catch (error) {
          console.warn("Failed to update user status on visibility change");
        }
      }
    };

    const handleBeforeUnload = async () => {
      try {
        await updateUserStatus({
          userId: currentUser._id,
          isOnline: false,
        });
      } catch (error) {
        console.warn("Failed to update user status on page unload");
      }
    };

    document.addEventListener("visibilitychange", handleVisibilityChange);
    window.addEventListener("beforeunload", handleBeforeUnload);

    return () => {
      document.removeEventListener("visibilitychange", handleVisibilityChange);
      window.removeEventListener("beforeunload", handleBeforeUnload);
    };
  }, [currentUser, updateUserStatus]);

  const logout = async () => {
    if (currentUser) {
      try {
        await updateUserStatus({
          userId: currentUser._id,
          isOnline: false,
        });
      } catch (error) {
        console.warn("Failed to update user status on logout");
      }
    }
    sessionStorage.removeItem("chat_user");
    setCurrentUser(null);
  };

  return {
    currentUser,
    isLoading,
    logout,
  };
}
