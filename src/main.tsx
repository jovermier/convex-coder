import { StrictMode } from "react";

import { ConvexProvider, ConvexReactClient } from "convex/react";
import ReactDOM from "react-dom/client";

import { ErrorBoundary } from "@/components/ErrorBoundary";
import { ThemeProvider } from "@/components/theme-provider";
import { AuthProvider } from "@/contexts/AuthContext";

import App from "./App";
import "./index.css";
import "./styles/accessibility.css";
import "./styles/scrollbar.css";

// Initialize Convex client with error handling
let convex: ConvexReactClient;
try {
  convex = new ConvexReactClient(import.meta.env.VITE_CONVEX_URL);
} catch (error) {
  console.error("Failed to initialize Convex client:", error);
  // Create a dummy client that will fail gracefully
  convex = new ConvexReactClient("https://dummy-url-for-fallback.invalid");
}

ReactDOM.createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <ErrorBoundary onReset={() => window.location.reload()}>
      <ThemeProvider defaultTheme="dark" storageKey="convex-ui-theme">
        <ConvexProvider client={convex}>
          <AuthProvider>
            <ErrorBoundary onReset={() => window.location.reload()}>
              <App />
            </ErrorBoundary>
          </AuthProvider>
        </ConvexProvider>
      </ThemeProvider>
    </ErrorBoundary>
  </StrictMode>
);
