import { useCallback, useEffect, useRef, useState } from "react";

interface PerformanceMetrics {
  renderTime: number;
  memoryUsage?: number;
  bundleLoadTime: number;
  interactionLatency: number;
  frameRate: number;
}

interface PerformanceEntry {
  timestamp: number;
  metrics: PerformanceMetrics;
  component?: string;
  action?: string;
}

/**
 * Hook for monitoring performance metrics in VTT components
 */
export function usePerformanceMonitoring(componentName?: string) {
  const [metrics, setMetrics] = useState<PerformanceEntry[]>([]);
  const renderStartTime = useRef<number>(Date.now());
  const frameCount = useRef<number>(0);
  const lastFrameTime = useRef<number>(performance.now());

  // Measure component render time
  const measureRenderTime = useCallback(() => {
    const renderTime = Date.now() - renderStartTime.current;
    renderStartTime.current = Date.now();
    return renderTime;
  }, []);

  // Measure memory usage (if available)
  const measureMemoryUsage = useCallback(() => {
    if ("memory" in performance && (performance as any).memory) {
      return (performance as any).memory.usedJSHeapSize;
    }
    return undefined;
  }, []);

  // Measure frame rate
  const measureFrameRate = useCallback(() => {
    const now = performance.now();
    const deltaTime = now - lastFrameTime.current;
    lastFrameTime.current = now;
    frameCount.current++;

    // Calculate FPS over the last second
    if (frameCount.current % 60 === 0) {
      return 1000 / deltaTime;
    }
    return 60; // Default assumption
  }, []);

  // Record performance entry
  const recordMetric = useCallback(
    (action?: string) => {
      const entry: PerformanceEntry = {
        timestamp: Date.now(),
        component: componentName,
        action,
        metrics: {
          renderTime: measureRenderTime(),
          memoryUsage: measureMemoryUsage(),
          bundleLoadTime: performance.now(), // Time since page load
          interactionLatency: 0, // Will be measured separately
          frameRate: measureFrameRate(),
        },
      };

      setMetrics((prev) => [...prev.slice(-50), entry]); // Keep last 50 entries

      // Log performance warnings
      if (entry.metrics.renderTime > 16) {
        console.warn(
          `Slow render detected in ${componentName}: ${entry.metrics.renderTime}ms`
        );
      }

      return entry;
    },
    [componentName, measureRenderTime, measureMemoryUsage, measureFrameRate]
  );

  // Measure interaction latency
  const measureInteractionLatency = useCallback((startTime: number) => {
    const latency = performance.now() - startTime;
    setMetrics((prev) => {
      const latest = prev[prev.length - 1];
      if (latest) {
        latest.metrics.interactionLatency = latency;
      }
      return [...prev];
    });

    if (latency > 100) {
      console.warn(`High interaction latency: ${latency}ms`);
    }

    return latency;
  }, []);

  // Get performance summary
  const getPerformanceSummary = useCallback(() => {
    if (metrics.length === 0) return null;

    const recent = metrics.slice(-10);
    const avgRenderTime =
      recent.reduce((sum, m) => sum + m.metrics.renderTime, 0) / recent.length;
    const avgFrameRate =
      recent.reduce((sum, m) => sum + m.metrics.frameRate, 0) / recent.length;
    const maxMemory = Math.max(
      ...recent.map((m) => m.metrics.memoryUsage || 0)
    );

    return {
      averageRenderTime: avgRenderTime,
      averageFrameRate: avgFrameRate,
      maxMemoryUsage: maxMemory,
      totalEntries: metrics.length,
      performanceGrade: getPerformanceGrade(avgRenderTime, avgFrameRate),
    };
  }, [metrics]);

  // Performance grade calculation
  const getPerformanceGrade = (
    renderTime: number,
    frameRate: number
  ): "A" | "B" | "C" | "D" | "F" => {
    if (renderTime < 8 && frameRate > 55) return "A";
    if (renderTime < 16 && frameRate > 45) return "B";
    if (renderTime < 32 && frameRate > 30) return "C";
    if (renderTime < 64 && frameRate > 15) return "D";
    return "F";
  };

  // Auto-record on mount and significant re-renders
  useEffect(() => {
    recordMetric("mount");
  }, [recordMetric]);

  // Monitor for performance issues
  useEffect(() => {
    const interval = setInterval(() => {
      recordMetric("periodic");
    }, 5000);

    return () => clearInterval(interval);
  }, [recordMetric]);

  return {
    metrics,
    recordMetric,
    measureInteractionLatency,
    getPerformanceSummary,
    currentPerformance: metrics[metrics.length - 1],
  };
}

/**
 * Performance monitoring utilities for components
 */
export function createPerformanceMonitor(componentName: string) {
  return {
    measureInteraction: (callback: () => void) => {
      const startTime = performance.now();
      const result = callback();
      const endTime = performance.now();

      if (endTime - startTime > 100) {
        console.warn(
          `Slow interaction in ${componentName}: ${endTime - startTime}ms`
        );
      }

      return result;
    },
    recordMetric: (metricName: string, value: number) => {
      console.log(`${componentName} - ${metricName}: ${value}ms`);
    },
  };
}

/**
 * Hook for optimizing expensive operations
 */
export function usePerformanceOptimizedCallback<
  T extends (...args: any[]) => any,
>(
  callback: T,
  deps: React.DependencyList,
  maxExecutionTime = 16 // One frame budget
): T {
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);
  const pendingArgs = useRef<Parameters<T> | null>(null);

  // eslint-disable-next-line react-compiler/react-compiler
  return useCallback((...args: Parameters<T>) => {
    pendingArgs.current = args;

    // Clear any pending execution
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }

    // Debounce expensive operations
    timeoutRef.current = setTimeout(() => {
      const startTime = performance.now();
      const result = callback(...(pendingArgs.current as Parameters<T>));
      const executionTime = performance.now() - startTime;

      if (executionTime > maxExecutionTime) {
        console.warn(`Expensive operation detected: ${executionTime}ms`);
      }

      return result;
    }, 0);
  }, deps) as T;
}

/**
 * Memory usage monitoring
 */
export function useMemoryMonitoring() {
  const [memoryInfo, setMemoryInfo] = useState<{
    used: number;
    total: number;
    limit: number;
  } | null>(null);

  useEffect(() => {
    const updateMemoryInfo = () => {
      if ("memory" in performance && (performance as any).memory) {
        const memory = (performance as any).memory;
        setMemoryInfo({
          used: memory.usedJSHeapSize,
          total: memory.totalJSHeapSize,
          limit: memory.jsHeapSizeLimit,
        });
      }
    };

    updateMemoryInfo();
    const interval = setInterval(updateMemoryInfo, 5000);

    return () => clearInterval(interval);
  }, []);

  const memoryUsagePercentage = memoryInfo
    ? (memoryInfo.used / memoryInfo.limit) * 100
    : 0;

  const isMemoryWarning = memoryUsagePercentage > 70;
  const isMemoryCritical = memoryUsagePercentage > 90;

  return {
    memoryInfo,
    memoryUsagePercentage,
    isMemoryWarning,
    isMemoryCritical,
  };
}
