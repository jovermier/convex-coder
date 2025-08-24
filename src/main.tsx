import { StrictMode } from "react";
import ReactDOM from "react-dom/client";
import "./index.css";
import App from "./App";
import { ConvexProvider, ConvexReactClient } from "convex/react";
import { ThemeProvider } from "@/components/theme-provider";
import { ErrorBoundary } from "@/components/ErrorBoundary";

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
      <ThemeProvider defaultTheme="light" storageKey="convex-ui-theme">
        <ConvexProvider client={convex}>
          <ErrorBoundary onReset={() => window.location.reload()}>
            <App />
          </ErrorBoundary>
        </ConvexProvider>
      </ThemeProvider>
    </ErrorBoundary>
  </StrictMode>,
);
