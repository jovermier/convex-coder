import React, { ReactElement } from "react";

import { RenderOptions, render } from "@testing-library/react";

import { ThemeProvider } from "@/components/theme-provider";

// Mock Convex provider since we can't easily test with real Convex
const MockConvexProvider = ({ children }: { children: React.ReactNode }) => {
  return <div data-testid="mock-convex-provider">{children}</div>;
};

// Mock AuthProvider for tests
const MockAuthProvider = ({ children }: { children: React.ReactNode }) => {
  return <div data-testid="mock-auth-provider">{children}</div>;
};

const AllTheProviders = ({ children }: { children: React.ReactNode }) => {
  return (
    <MockConvexProvider>
      <MockAuthProvider>
        <ThemeProvider defaultTheme="light" storageKey="vite-ui-theme">
          {children}
        </ThemeProvider>
      </MockAuthProvider>
    </MockConvexProvider>
  );
};

const customRender = (
  ui: ReactElement,
  options?: Omit<RenderOptions, "wrapper">
) => render(ui, { wrapper: AllTheProviders, ...options });

// Mock common hooks
export const mockUserHook = {
  currentUser: { id: "1", name: "Test User", email: "test@example.com" },
  isLoading: false,
};

export const mockConvexMessages = {
  messages: [],
  isLoading: false,
  error: null,
};

export const mockWorkingMessages = {
  messages: [],
  isLoading: false,
  error: null,
};

// Re-export everything
export * from "@testing-library/react";
export { customRender as render };
