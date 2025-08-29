import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { SmartChatContainer } from "@/components/chat/SmartChatContainer";
import { useAuth } from "@/contexts/AuthContext";
import { useConvexMessages, useConvexSendMessage } from "@/hooks/useConvexChat";
import {
  useOptimizedWorkingMessages,
  useOptimizedWorkingSendMessage,
} from "@/hooks/useOptimizedWorkingBackend";
import { fireEvent, render, screen, waitFor } from "@/test/test-utils";

// Mock the hooks with more realistic behavior
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

// Mock SmartChatMessages to provide testid for mode checking
vi.mock("@/components/chat/SmartChatMessages", () => ({
  SmartChatMessages: ({ mode }: { mode: string }) => (
    <div data-testid="smart-chat-messages" data-mode={mode}>
      Mock Messages
    </div>
  ),
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

describe("Chat Workflow Integration Tests", () => {
  const mockUser = {
    _id: "test-user-id",
    name: "Test User",
    email: "test@example.com",
  };
  const mockMessages = [
    {
      id: "1",
      content: "Hello world",
      user: mockUser,
      createdAt: Date.now() - 1000,
    },
    { id: "2", content: "How are you?", user: mockUser, createdAt: Date.now() },
  ];

  beforeEach(() => {
    vi.clearAllMocks();

    mockUseAuth.mockReturnValue({
      user: mockUser,
      loading: false,
    });
  });

  it("completes full chat workflow with Convex backend", async () => {
    const mockSendMessage = vi.fn().mockResolvedValue(undefined);

    // Start with empty messages, then simulate new message being added
    const messagesState = { messages: [], isLoading: false, error: null };
    mockUseConvexMessages.mockReturnValue(messagesState);

    mockUseConvexSendMessage.mockReturnValue({
      sendMessage: mockSendMessage,
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

    const user = userEvent.setup();
    render(<SmartChatContainer />);

    // Wait for component to load
    await waitFor(() => {
      expect(screen.getByRole("main")).toBeInTheDocument();
    });

    // Verify Convex backend is detected by checking SmartChatMessages mode
    const messagesComponent = screen.getByTestId("smart-chat-messages");
    expect(messagesComponent).toHaveAttribute("data-mode", "convex");

    // Type a message
    const textarea = screen.getByRole("textbox");
    await user.type(textarea, "Hello, this is a test message!");

    // Send the message
    const sendButton = screen.getByRole("button", { name: /send/i });
    expect(sendButton).not.toBeDisabled();
    await user.click(sendButton);

    // Verify message was sent with correct parameters
    expect(mockSendMessage).toHaveBeenCalledWith(
      "Hello, this is a test message!",
      mockUser,
      undefined
    );

    // Verify input was cleared
    await waitFor(() => {
      expect(textarea).toHaveValue("");
    });
  });

  it("handles backend fallback workflow", async () => {
    const mockWorkingSendMessage = vi.fn().mockResolvedValue(undefined);

    // Convex fails, working backend succeeds
    mockUseConvexMessages.mockReturnValue({
      messages: undefined,
      isLoading: false,
      error: "Connection failed",
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
      sendMessage: mockWorkingSendMessage,
      isSending: false,
    });

    const user = userEvent.setup();
    render(<SmartChatContainer />);

    // Wait for fallback detection (with timeout)
    await waitFor(
      () => {
        const messagesComponent = screen.getByTestId("smart-chat-messages");
        expect(messagesComponent).toHaveAttribute("data-mode", "working");
      },
      { timeout: 4000 }
    );

    // Send a message using working backend
    const textarea = screen.getByRole("textbox");
    await user.type(textarea, "Fallback message");

    const sendButton = screen.getByRole("button", { name: /send/i });
    await user.click(sendButton);

    expect(mockWorkingSendMessage).toHaveBeenCalledWith(
      "Fallback message",
      mockUser
    );
  });

  it("handles file upload workflow", async () => {
    const mockSendMessage = vi.fn().mockResolvedValue(undefined);

    mockUseConvexMessages.mockReturnValue({
      messages: [],
      isLoading: false,
      error: null,
    });

    mockUseConvexSendMessage.mockReturnValue({
      sendMessage: mockSendMessage,
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

    const user = userEvent.setup();
    render(<SmartChatContainer />);

    await waitFor(() => {
      expect(screen.getByRole("main")).toBeInTheDocument();
    });

    // Create and upload a file
    const file = new File(["test content"], "test.txt", { type: "text/plain" });

    // Find the file input by its ID - it's hidden so we need to query by ID
    const fileInput = document.getElementById("file-input") as HTMLInputElement;
    expect(fileInput).toBeTruthy();

    // Use fireEvent instead of user.upload for hidden inputs
    fireEvent.change(fileInput, {
      target: { files: [file] },
    });

    // Verify file preview appears
    await waitFor(
      () => {
        expect(screen.getByText("test.txt")).toBeInTheDocument();
      },
      { timeout: 2000 }
    );

    // Add a message and send
    const textarea = screen.getByRole("textbox");
    await user.type(textarea, "Here is my file");

    const sendButton = screen.getByRole("button", { name: /send/i });
    await user.click(sendButton);

    // Verify message was sent with file
    expect(mockSendMessage).toHaveBeenCalledWith(
      "Here is my file",
      mockUser,
      file
    );
  });

  it("shows loading states during send operation", async () => {
    let resolveSend!: () => void;
    const sendPromise = new Promise<void>((resolve) => {
      resolveSend = resolve;
    });

    const mockSendMessage = vi.fn().mockReturnValue(sendPromise);

    mockUseConvexMessages.mockReturnValue({
      messages: [],
      isLoading: false,
      error: null,
    });

    // Mock the sending state
    const sendMessageMock = {
      sendMessage: mockSendMessage,
      isSending: false,
      fileUploadMethod: "direct" as const,
    };

    mockUseConvexSendMessage.mockReturnValue(sendMessageMock);

    mockUseOptimizedWorkingMessages.mockReturnValue({
      messages: [],
      isLoading: false,
      error: null,
    });

    mockUseOptimizedWorkingSendMessage.mockReturnValue({
      sendMessage: vi.fn(),
      isSending: false,
    });

    const user = userEvent.setup();
    render(<SmartChatContainer />);

    await waitFor(() => {
      expect(screen.getByRole("main")).toBeInTheDocument();
    });

    const textarea = screen.getByRole("textbox");
    await user.type(textarea, "Test message");

    // Update the mock to show sending state
    sendMessageMock.isSending = true;
    mockUseConvexSendMessage.mockReturnValue(sendMessageMock);

    const sendButton = screen.getByRole("button", { name: /send/i });
    await user.click(sendButton);

    // Should show loading state (disabled button)
    expect(sendButton).toBeDisabled();

    // Resolve the send operation
    resolveSend();
    await waitFor(() => {
      expect(mockSendMessage).toHaveBeenCalled();
    });
  });

  it("handles error states gracefully", async () => {
    const mockSendMessage = vi.fn().mockRejectedValue(new Error("Send failed"));
    const mockWorkingSendMessage = vi.fn().mockResolvedValue(undefined);

    mockUseConvexMessages.mockReturnValue({
      messages: [],
      isLoading: false,
      error: null,
    });

    mockUseConvexSendMessage.mockReturnValue({
      sendMessage: mockSendMessage,
      isSending: false,
      fileUploadMethod: "direct",
    });

    // Mock working backend as fallback
    mockUseOptimizedWorkingMessages.mockReturnValue({
      messages: [],
      isLoading: false,
      error: null,
    });

    mockUseOptimizedWorkingSendMessage.mockReturnValue({
      sendMessage: mockWorkingSendMessage,
      isSending: false,
    });

    const user = userEvent.setup();
    render(<SmartChatContainer />);

    await waitFor(() => {
      expect(screen.getByRole("main")).toBeInTheDocument();
    });

    // Suppress console.error for this test since we expect an error
    const originalError = console.error;
    console.error = vi.fn();

    const textarea = screen.getByRole("textbox");
    await user.type(textarea, "This will fail");

    const sendButton = screen.getByRole("button", { name: /send/i });
    await user.click(sendButton);

    expect(mockSendMessage).toHaveBeenCalled();

    // Restore console.error
    console.error = originalError;

    // Message should stay in input on error (this is current behavior)
    // In a real app, you might want to show an error message
  });
});
