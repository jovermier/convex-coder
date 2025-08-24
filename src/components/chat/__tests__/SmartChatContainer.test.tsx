import { act } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { useConvexMessages, useConvexSendMessage } from "@/hooks/useConvexChat";
import {
  useOptimizedWorkingMessages,
  useOptimizedWorkingSendMessage,
} from "@/hooks/useOptimizedWorkingBackend";
import { useUser } from "@/hooks/useUser";
import { render, screen, waitFor } from "@/test/test-utils";

import { SmartChatContainer } from "../SmartChatContainer";

// Mock all the hooks
vi.mock("@/hooks/useUser", () => ({
  useUser: vi.fn(),
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

const mockUseUser = useUser as ReturnType<typeof vi.fn>;
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
    mockUseUser.mockReturnValue({
      currentUser: { id: "1", name: "Test User", email: "test@test.com" },
      isLoading: false,
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
    mockUseUser.mockReturnValue({
      currentUser: null,
      isLoading: true,
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
    mockUseUser.mockReturnValue({
      currentUser: null,
      isLoading: false,
    });

    render(<SmartChatContainer />);

    expect(screen.getByText("Authentication Error")).toBeInTheDocument();
    expect(
      screen.getByText("Unable to authenticate user. Please refresh the page.")
    ).toBeInTheDocument();
  });

  it("displays user information in header", async () => {
    render(<SmartChatContainer />);

    await waitFor(() => {
      expect(screen.getAllByText("Test User")).toHaveLength(2); // Desktop and mobile views
      expect(screen.getAllByText("Online")).toHaveLength(2); // Desktop and mobile status
    });
  });

  it("displays chat interface when loaded", async () => {
    render(<SmartChatContainer />);

    await waitFor(() => {
      expect(screen.getByText("Convex Chat")).toBeInTheDocument();
      expect(screen.getByTestId("smart-chat-messages")).toBeInTheDocument();
      expect(screen.getByTestId("chat-input")).toBeInTheDocument();
      expect(screen.getByTestId("theme-toggle")).toBeInTheDocument();
    });
  });

  it("shows Convex WebSocket badge when using convex backend", async () => {
    // Mock convex backend being ready
    mockUseConvexMessages.mockReturnValue({
      messages: [],
      isLoading: false,
      error: null,
    });

    render(<SmartChatContainer />);

    await waitFor(() => {
      expect(screen.getByText("🚀 WebSockets")).toBeInTheDocument();
    });
  });

  it("shows Optimized Polling badge when using working backend", async () => {
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
        expect(screen.getByText("🔄 Optimized Polling")).toBeInTheDocument();
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

  it("shows user avatar with initials", () => {
    render(<SmartChatContainer />);

    const avatars = screen.getAllByText("TU"); // Test User initials
    expect(avatars).toHaveLength(2); // Desktop and mobile views
    avatars.forEach((avatar) => {
      expect(avatar).toHaveAttribute("aria-label", "Avatar for Test User");
    });
  });

  it("handles mobile layout user info", () => {
    render(<SmartChatContainer />);

    // Should show user name in mobile section too
    expect(screen.getAllByText("Test User")).toHaveLength(2);
  });

  it("includes proper ARIA roles and labels", () => {
    render(<SmartChatContainer />);

    // Should have main content structure
    expect(screen.getByRole("banner")).toBeInTheDocument(); // CardHeader acts as banner
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
