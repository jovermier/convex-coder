import { act } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { useAuth } from "@/contexts/AuthContext";
import { useConvexMessages, useConvexSendMessage } from "@/hooks/useConvexChat";
import {
  useOptimizedWorkingMessages,
  useOptimizedWorkingSendMessage,
} from "@/hooks/useOptimizedWorkingBackend";
import { render, screen, waitFor } from "@/test/test-utils";

import { SmartChatContainer } from "../SmartChatContainer";

// Mock AuthContext (override global mock)
vi.mock("@/contexts/AuthContext", () => ({
  useAuth: vi.fn(),
}));

vi.mock("@/hooks/useConvexChat", () => ({
  useConvexMessages: vi.fn(),
  useConvexSendMessage: vi.fn(),
}));

vi.mock("@/hooks/useOptimizedWorkingBackend", () => ({
  useOptimizedWorkingMessages: vi.fn(),
  useOptimizedWorkingSendMessage: vi.fn(),
}));

// Mock other components to simplify testing
vi.mock("../SmartChatMessages", () => ({
  SmartChatMessages: ({ mode }: { mode: string }) => (
    <div data-testid="smart-chat-messages" data-mode={mode}>
      Mock Messages
    </div>
  ),
}));

vi.mock("../ChatInput", () => ({
  ChatInput: ({ disabled }: { disabled: boolean }) => (
    <div data-testid="chat-input" data-disabled={disabled}>
      Mock Chat Input
    </div>
  ),
}));

vi.mock("@/components/theme-toggle", () => ({
  ThemeToggle: () => <div data-testid="theme-toggle">Theme Toggle</div>,
}));

const mockUseAuth = useAuth as ReturnType<typeof vi.fn>;
const mockUseConvexMessages = useConvexMessages as ReturnType<typeof vi.fn>;
const mockUseConvexSendMessage = useConvexSendMessage as ReturnType<
  typeof vi.fn
>;
const mockUseOptimizedWorkingMessages =
  useOptimizedWorkingMessages as ReturnType<typeof vi.fn>;
const mockUseOptimizedWorkingSendMessage =
  useOptimizedWorkingSendMessage as ReturnType<typeof vi.fn>;

describe("SmartChatContainer", () => {
  beforeEach(() => {
    vi.clearAllMocks();

    // Default mock implementations
    mockUseAuth.mockReturnValue({
      user: { _id: "1", name: "Test User", email: "test@test.com" },
      loading: false,
    });

    mockUseConvexMessages.mockReturnValue({
      messages: [],
      isLoading: false,
      error: null,
    });

    mockUseConvexSendMessage.mockReturnValue({
      sendMessage: vi.fn(),
      isSending: false,
      fileUploadMethod: "direct",
    });

    mockUseOptimizedWorkingMessages.mockReturnValue({
      messages: [],
      isLoading: false,
      error: null,
    });

    mockUseOptimizedWorkingSendMessage.mockReturnValue({
      sendMessage: vi.fn(),
      isSending: false,
    });
  });

  it("shows loading state when user is loading", () => {
    mockUseAuth.mockReturnValue({
      user: null,
      loading: true,
    });

    render(<SmartChatContainer />);

    expect(screen.getByText("Loading user...")).toBeInTheDocument();
  });

  it("shows backend detection state initially", () => {
    mockUseConvexMessages.mockReturnValue({
      messages: undefined,
      isLoading: true,
      error: null,
    });

    render(<SmartChatContainer />);

    expect(screen.getByText("Detecting best backend...")).toBeInTheDocument();
  });

  it("shows authentication error when user is null", () => {
    mockUseAuth.mockReturnValue({
      user: null,
      loading: false,
    });

    render(<SmartChatContainer />);

    expect(screen.getByText("Authentication Error")).toBeInTheDocument();
    expect(
      screen.getByText("Unable to authenticate user. Please refresh the page.")
    ).toBeInTheDocument();
  });

  it("renders main content areas", async () => {
    render(<SmartChatContainer />);

    await waitFor(() => {
      expect(screen.getByRole("main")).toBeInTheDocument();
      expect(screen.getByRole("contentinfo")).toBeInTheDocument();
    });
  });

  it("displays chat interface when loaded", async () => {
    render(<SmartChatContainer />);

    await waitFor(() => {
      expect(screen.getByTestId("smart-chat-messages")).toBeInTheDocument();
      expect(screen.getByTestId("chat-input")).toBeInTheDocument();
      // Convex Chat title and theme toggle are in App.tsx, not SmartChatContainer
    });
  });

  it("uses Convex backend when convex messages are ready", async () => {
    // Mock convex backend being ready
    mockUseConvexMessages.mockReturnValue({
      messages: [],
      isLoading: false,
      error: null,
    });

    render(<SmartChatContainer />);

    await waitFor(() => {
      const messagesComponent = screen.getByTestId("smart-chat-messages");
      expect(messagesComponent).toHaveAttribute("data-mode", "convex");
    });
  });

  it("falls back to working backend when convex fails", async () => {
    // Mock convex failing, working backend ready
    mockUseConvexMessages.mockReturnValue({
      messages: undefined,
      isLoading: false,
      error: "Connection failed",
    });

    mockUseOptimizedWorkingMessages.mockReturnValue({
      messages: [],
      isLoading: false,
      error: null,
    });

    render(<SmartChatContainer />);

    await waitFor(
      () => {
        const messagesComponent = screen.getByTestId("smart-chat-messages");
        expect(messagesComponent).toHaveAttribute("data-mode", "working");
      },
      { timeout: 4000 }
    ); // Account for detection timeout
  });

  it("passes correct mode to SmartChatMessages", async () => {
    render(<SmartChatContainer />);

    await waitFor(() => {
      const messagesComponent = screen.getByTestId("smart-chat-messages");
      expect(messagesComponent).toHaveAttribute("data-mode", "convex");
    });
  });

  it("disables chat input when sending", () => {
    mockUseConvexSendMessage.mockReturnValue({
      sendMessage: vi.fn(),
      isSending: true,
      fileUploadMethod: "direct",
    });

    render(<SmartChatContainer />);

    const chatInput = screen.getByTestId("chat-input");
    expect(chatInput).toHaveAttribute("data-disabled", "true");
  });

  it("provides proper accessibility structure", () => {
    render(<SmartChatContainer />);

    // Check for live region for screen reader announcements
    const liveRegion = screen.getByLabelText("New messages");
    expect(liveRegion).toBeInTheDocument();
    expect(liveRegion).toHaveAttribute("aria-live", "polite");
  });

  it("handles chat input visibility", () => {
    render(<SmartChatContainer />);

    // Should show chat input by default
    expect(screen.getByTestId("chat-input")).toBeInTheDocument();
  });

  it("includes proper ARIA roles and labels", () => {
    render(<SmartChatContainer />);

    // Should have main content structure (banner is in App.tsx, not SmartChatContainer)
    expect(screen.getByRole("main")).toBeInTheDocument();
    expect(screen.getByRole("contentinfo")).toBeInTheDocument();
  });

  it("falls back to working backend after timeout", async () => {
    // Mock convex taking too long
    mockUseConvexMessages.mockReturnValue({
      messages: undefined,
      isLoading: true,
      error: null,
    });

    render(<SmartChatContainer />);

    // Wait for the timeout to happen naturally (3000ms + buffer)
    await waitFor(
      () => {
        const messagesComponent = screen.getByTestId("smart-chat-messages");
        expect(messagesComponent).toHaveAttribute("data-mode", "working");
      },
      { timeout: 4000 }
    );
  });
});
