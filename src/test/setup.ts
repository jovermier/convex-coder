import "@testing-library/jest-dom";

// Mock ResizeObserver which is not available in jsdom
class MockResizeObserver {
  observe() {}
  unobserve() {}
  disconnect() {}
}

global.ResizeObserver = MockResizeObserver;

// Mock matchMedia which is not available in jsdom
Object.defineProperty(window, "matchMedia", {
  writable: true,
  value: (query: string) => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: () => {},
    removeListener: () => {},
    addEventListener: () => {},
    removeEventListener: () => {},
    dispatchEvent: () => {},
  }),
});

// Mock URL.createObjectURL and revokeObjectURL
global.URL.createObjectURL = (() => "mock-url") as any;
global.URL.revokeObjectURL = (() => {}) as any;

// Mock console methods to avoid noise in tests
const originalConsoleError = console.error;
const originalConsoleWarn = console.warn;

console.error = (...args: any[]) => {
  // Only log actual test failures, not React/testing warnings
  if (!args[0]?.toString().includes("Warning:")) {
    originalConsoleError(...args);
  }
};

console.warn = (...args: any[]) => {
  // Only log actual warnings, not React development warnings
  if (!args[0]?.toString().includes("Warning:")) {
    originalConsoleWarn(...args);
  }
};
