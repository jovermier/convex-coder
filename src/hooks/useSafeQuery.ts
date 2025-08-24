import { useEffect, useState } from "react";

import { useQuery } from "convex/react";
import { FunctionReference } from "convex/server";

/**
 * A safer version of useQuery that handles errors gracefully
 * and provides fallback behavior when the backend is unavailable.
 */
export function useSafeQuery<T>(
  query: FunctionReference<"query", "public", any, T>,
  args?: any,
  fallbackValue?: T
): { data: T | undefined; error: Error | null; isLoading: boolean } {
  const [error, setError] = useState<Error | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [queryResult, setQueryResult] = useState<T | undefined>(undefined);

  // Always call hooks unconditionally
  const data = useQuery(query, args);

  // Handle successful query data
  useEffect(() => {
    if (data !== undefined) {
      setQueryResult(data);
      setIsLoading(false);
      if (error) {
        setError(null);
      }
    }
  }, [data, error]);

  // Handle potential timeouts/errors via loading state
  useEffect(() => {
    if (data === undefined && isLoading) {
      const timer = setTimeout(() => {
        console.warn("Query timeout - using fallback");
        setError(new Error("Query timeout"));
        setIsLoading(false);
        setQueryResult(fallbackValue);
      }, 10000); // 10 second timeout

      return () => clearTimeout(timer);
    }
  }, [data, isLoading, fallbackValue]);

  return { data: queryResult, error, isLoading };
}
