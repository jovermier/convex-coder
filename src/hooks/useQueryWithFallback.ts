import { useCallback, useEffect, useState } from "react";

import { useQuery } from "convex/react";
import { FunctionReference } from "convex/server";

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
  const [queryResult, setQueryResult] = useState<T | undefined>(undefined);

  // Always call hooks unconditionally
  const data = useQuery(query, args);

  // Check for query loading/error states via data state
  const hasData = data !== undefined;
  const hasQueryError = data === undefined && !isDemo;

  // Handle successful query data
  useEffect(() => {
    if (data !== undefined) {
      setQueryResult(data);
      if (isDemo || error) {
        setIsDemo(false);
        setError(null);
        console.log("✅ Backend connection restored!");
      }
    }
  }, [data, isDemo, error]);

  // Handle query errors - use a timeout to detect prolonged loading as error
  useEffect(() => {
    if (data === undefined && !isDemo) {
      const timer = setTimeout(() => {
        console.warn("🔄 Backend unavailable, switching to demo mode");
        setIsDemo(true);
        setError(new Error("Backend connection timeout"));
        setQueryResult(fallbackData);
      }, 5000); // 5 second timeout

      return () => clearTimeout(timer);
    }
  }, [data, isDemo, fallbackData]);

  return {
    data: isDemo ? fallbackData : queryResult,
    isDemo,
    error,
  };
}
