import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { fireEvent, render, screen, waitFor } from "@/test/test-utils";

import { ChatInput } from "../ChatInput";

const mockOnSendMessage = vi.fn();

describe("ChatInput", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("renders with default placeholder", () => {
    render(<ChatInput onSendMessage={mockOnSendMessage} />);

    expect(screen.getByRole("textbox")).toHaveAttribute(
      "placeholder",
      "Type a message..."
    );
  });

  it("renders with custom placeholder", () => {
    render(
      <ChatInput
        onSendMessage={mockOnSendMessage}
        placeholder="Custom placeholder"
      />
    );

    expect(screen.getByRole("textbox")).toHaveAttribute(
      "placeholder",
      "Custom placeholder"
    );
  });

  it("sends message on form submit", async () => {
    const user = userEvent.setup();
    render(<ChatInput onSendMessage={mockOnSendMessage} />);

    const input = screen.getByRole("textbox");
    const sendButton = screen.getByRole("button", { name: /send/i });

    await user.type(input, "Test message");
    await user.click(sendButton);

    expect(mockOnSendMessage).toHaveBeenCalledWith("Test message", undefined);
  });

  it("sends message on Enter key press", async () => {
    const user = userEvent.setup();
    render(<ChatInput onSendMessage={mockOnSendMessage} />);

    const input = screen.getByRole("textbox");

    await user.type(input, "Test message");
    await user.keyboard("{Enter}");

    expect(mockOnSendMessage).toHaveBeenCalledWith("Test message", undefined);
  });

  it("does not send on Shift+Enter", async () => {
    const user = userEvent.setup();
    render(<ChatInput onSendMessage={mockOnSendMessage} />);

    const input = screen.getByRole("textbox");

    await user.type(input, "Test message");
    await user.keyboard("{Shift>}{Enter}{/Shift}");

    expect(mockOnSendMessage).not.toHaveBeenCalled();
  });

  it("disables send button when input is empty", () => {
    render(<ChatInput onSendMessage={mockOnSendMessage} />);

    const sendButton = screen.getByRole("button", { name: /send/i });
    expect(sendButton).toBeDisabled();
  });

  it("enables send button when input has text", async () => {
    const user = userEvent.setup();
    render(<ChatInput onSendMessage={mockOnSendMessage} />);

    const input = screen.getByRole("textbox");
    const sendButton = screen.getByRole("button", { name: /send/i });

    await user.type(input, "Test");
    expect(sendButton).not.toBeDisabled();
  });

  it("handles file selection", async () => {
    const user = userEvent.setup();
    render(<ChatInput onSendMessage={mockOnSendMessage} />);

    const file = new File(["test content"], "test.txt", { type: "text/plain" });

    // Mock file input
    const hiddenInput = document.querySelector(
      'input[type="file"]'
    ) as HTMLInputElement;

    fireEvent.change(hiddenInput, {
      target: { files: [file] },
    });

    await waitFor(() => {
      expect(screen.getByText("test.txt")).toBeInTheDocument();
    });
  });

  it("prevents files larger than 10MB", async () => {
    const alertSpy = vi.spyOn(window, "alert").mockImplementation(() => {});
    render(<ChatInput onSendMessage={mockOnSendMessage} />);

    const largeFile = new File(["x".repeat(11 * 1024 * 1024)], "large.txt", {
      type: "text/plain",
    });

    const hiddenInput = document.querySelector(
      'input[type="file"]'
    ) as HTMLInputElement;

    fireEvent.change(hiddenInput, {
      target: { files: [largeFile] },
    });

    expect(alertSpy).toHaveBeenCalledWith(
      "File size must be less than 10MB. Large files: large.txt"
    );
    alertSpy.mockRestore();
  });

  it("shows image preview for image files", async () => {
    render(<ChatInput onSendMessage={mockOnSendMessage} />);

    const imageFile = new File(["fake image"], "test.jpg", {
      type: "image/jpeg",
    });
    const hiddenInput = document.querySelector(
      'input[type="file"]'
    ) as HTMLInputElement;

    fireEvent.change(hiddenInput, {
      target: { files: [imageFile] },
    });

    await waitFor(() => {
      const preview = screen.getByAltText("Preview of test.jpg");
      expect(preview).toBeInTheDocument();
      expect(preview).toHaveAttribute("src", "mock-url");
    });
  });

  it("removes selected file when X button is clicked", async () => {
    const user = userEvent.setup();
    render(<ChatInput onSendMessage={mockOnSendMessage} />);

    const file = new File(["test"], "test.txt", { type: "text/plain" });
    const hiddenInput = document.querySelector(
      'input[type="file"]'
    ) as HTMLInputElement;

    fireEvent.change(hiddenInput, {
      target: { files: [file] },
    });

    await waitFor(() => {
      expect(screen.getByText("test.txt")).toBeInTheDocument();
    });

    const removeButton = screen.getByRole("button", { name: /x/i });
    await user.click(removeButton);

    expect(screen.queryByText("test.txt")).not.toBeInTheDocument();
  });

  it("disables input when disabled prop is true", () => {
    render(<ChatInput onSendMessage={mockOnSendMessage} disabled />);

    const input = screen.getByRole("textbox");
    const sendButton = screen.getByRole("button", { name: /send/i });
    const attachButton = screen.getByRole("button", { name: /attach file/i });

    expect(input).toBeDisabled();
    expect(sendButton).toBeDisabled();
    expect(attachButton).toBeDisabled();
  });

  it("clears input after successful send", async () => {
    const user = userEvent.setup();
    mockOnSendMessage.mockResolvedValue(undefined);

    render(<ChatInput onSendMessage={mockOnSendMessage} />);

    const input = screen.getByRole("textbox");

    await user.type(input, "Test message");
    await user.keyboard("{Enter}");

    await waitFor(() => {
      expect(input).toHaveValue("");
    });
  });

  it("shows loading state while sending", async () => {
    const user = userEvent.setup();
    let resolvePromise!: () => void;
    const sendPromise = new Promise<void>((resolve) => {
      resolvePromise = resolve;
    });
    mockOnSendMessage.mockReturnValue(sendPromise);

    render(<ChatInput onSendMessage={mockOnSendMessage} />);

    const input = screen.getByRole("textbox");
    await user.type(input, "Test message");
    await user.keyboard("{Enter}");

    // Should show loading spinner and disabled state
    await waitFor(() => {
      const sendButton = screen.getByRole("button", { name: /sending/i });
      expect(sendButton).toBeDisabled();
      expect(sendButton).toHaveTextContent("Sending message...");
    });

    resolvePromise();
    await waitFor(() => {
      // After sending, input is cleared so button is disabled for different reason
      const sendButton = screen.getByRole("button", { name: /send/i });
      expect(sendButton).toBeDisabled(); // Disabled because input is empty
      expect(input).toHaveValue(""); // Input should be cleared
    });
  });
});
