import { useQuery } from "convex/react";
import { FunctionReference } from "convex/server";
import { useEffect, useState } from "react";

/**
 * A wrapper around useQuery that provides graceful error handling
 * and fallback to demo mode when the backend is unavailable.
 */
export function useQueryWithFallback<T>(
  query: FunctionReference<"query", "public", any, T>,
  args?: any,
  fallbackData?: T
): { data: T | undefined; isDemo: boolean; error: Error | null } {
  const [isDemo, setIsDemo] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  try {
    const data = useQuery(query, args);
    
    // Reset demo mode if query succeeds
    useEffect(() => {
      if (data !== undefined && (isDemo || error)) {
        setIsDemo(false);
        setError(null);
        console.log("✅ Backend connection restored!");
      }
    }, [data, isDemo, error]);

    return { data, isDemo, error: null };
  } catch (queryError) {
    const errorObj = queryError as Error;
    
    // Only log the error once when it first occurs
    useEffect(() => {
      if (!isDemo) {
        console.warn("🔄 Backend unavailable, switching to demo mode:", errorObj.message);
        setIsDemo(true);
        setError(errorObj);
      }
    }, [isDemo]);

    return { 
      data: fallbackData, 
      isDemo: true, 
      error: errorObj 
    };
  }
}