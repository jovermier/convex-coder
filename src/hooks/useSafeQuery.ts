import { useQuery } from "convex/react";
import { FunctionReference } from "convex/server";
import { useEffect, useState } from "react";

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
  
  let data: T | undefined;
  
  try {
    // Clear error when query is retried
    if (error) {
      setError(null);
    }
    
    data = useQuery(query, args);
    
    // Update loading state
    useEffect(() => {
      if (data !== undefined) {
        setIsLoading(false);
      }
    }, [data]);
    
  } catch (queryError) {
    console.warn("Query failed:", queryError);
    setError(queryError as Error);
    setIsLoading(false);
    data = fallbackValue;
  }
  
  return { data, error, isLoading };
}