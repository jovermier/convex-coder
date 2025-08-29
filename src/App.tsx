import { useCallback, useEffect, useRef, useState } from "react";

import { MessageCircle } from "lucide-react";

import { SignInForm } from "@/components/auth/SignInForm";
import { UserMenu } from "@/components/auth/UserMenu";
import { ChatInput } from "@/components/chat/ChatInput";
import { SmartChatContainer } from "@/components/chat/SmartChatContainer";
import { useAuth } from "@/contexts/AuthContext";

import "./styles/accessibility.css";

export default function App() {
  const { user } = useAuth();
  const [sendMessage, setSendMessage] = useState<
    ((content: string, files?: File[]) => Promise<void>) | null
  >(null);
  const [isSending, setIsSending] = useState(false);

  const handleExposeSendMessage = useCallback(
    (
      sendMessageFn: (content: string, files?: File[]) => Promise<void>,
      sending: boolean
    ) => {
      setSendMessage(() => sendMessageFn);
      setIsSending(sending);
    },
    []
  );

  // Function to signal when auto-scrolling is happening
  const handleAutoScroll = useCallback(() => {
    isAutoScrolling.current = true;
    // Clear the flag after a delay to account for scroll adjustments
    // after message operations that change content height
    setTimeout(() => {
      isAutoScrolling.current = false;
    }, 1000);
  }, []);

  // Scroll behavior for sliding header/footer
  const scrollTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const lastScrollY = useRef(0);
  const isAutoScrolling = useRef(false);
  const ticking = useRef(false);
  const headerRef = useRef<HTMLElement | null>(null);
  const footerRef = useRef<HTMLElement | null>(null);

  useEffect(() => {
    if (!user) return; // Only add scroll behavior when user is logged in

    // Cache DOM elements
    const messagesContainer = document.getElementById("messages-container");
    headerRef.current = document.getElementById("page-header");
    footerRef.current = document.getElementById("page-footer");

    if (!messagesContainer || !headerRef.current || !footerRef.current) return;

    const updateHeaderFooter = (scrollY: number) => {
      const header = headerRef.current;
      const footer = footerRef.current;
      if (!header || !footer) return;

      // Skip slide behavior if this is an auto-scroll (from new message, deletion, etc.)
      if (isAutoScrolling.current) {
        lastScrollY.current = scrollY;
        return;
      }

      // Also skip if the scroll change is very small (likely from content reflow)
      const scrollDelta = Math.abs(scrollY - lastScrollY.current);
      if (scrollDelta < 5) {
        lastScrollY.current = scrollY;
        return;
      }

      // Determine scroll direction
      const scrollingDown = scrollY > lastScrollY.current;
      const scrollingUp = scrollY < lastScrollY.current;

      // Use will-change and transform3d for better performance
      if ((scrollingDown || scrollingUp) && scrollY > 100) {
        // Hide header and footer when scrolling in any direction
        header.style.willChange = "transform";
        footer.style.willChange = "transform";
        header.style.transform = "translate3d(0, -100%, 0)";
        footer.style.transform = "translate3d(0, 100%, 0)";
      } else if (scrollY <= 100) {
        // Show header and footer when near top of scroll
        header.style.willChange = "transform";
        footer.style.willChange = "transform";
        header.style.transform = "translate3d(0, 0, 0)";
        footer.style.transform = "translate3d(0, 0, 0)";
      }

      lastScrollY.current = scrollY;

      // Clear existing timeout
      if (scrollTimeoutRef.current) {
        clearTimeout(scrollTimeoutRef.current);
      }

      // Show header/footer after scrolling stops and remove will-change
      scrollTimeoutRef.current = setTimeout(() => {
        if (header && footer) {
          header.style.transform = "translate3d(0, 0, 0)";
          footer.style.transform = "translate3d(0, 0, 0)";
          // Remove will-change to save memory
          header.style.willChange = "auto";
          footer.style.willChange = "auto";
        }
      }, 500); // Show after half second of no scrolling
    };

    const handleScroll = () => {
      if (!ticking.current) {
        requestAnimationFrame(() => {
          const currentScrollY = messagesContainer.scrollTop;
          updateHeaderFooter(currentScrollY);
          ticking.current = false;
        });
        ticking.current = true;
      }
    };

    messagesContainer.addEventListener("scroll", handleScroll, {
      passive: true,
    });

    return () => {
      messagesContainer.removeEventListener("scroll", handleScroll);
      if (scrollTimeoutRef.current) {
        clearTimeout(scrollTimeoutRef.current);
      }
      // Clean up will-change
      if (headerRef.current) headerRef.current.style.willChange = "auto";
      if (footerRef.current) footerRef.current.style.willChange = "auto";
    };
  }, [user]);

  return (
    <>
      {/* Skip navigation link for keyboard users */}
      <a href="#main-content" className="skip-nav">
        Skip to main content
      </a>
      <div id="main-content">
        {user ? (
          <div className="relative h-screen">
            {/* Header - fixed at top */}
            <header
              className="bg-background/95 fixed top-0 right-0 left-0 z-10 border-b backdrop-blur-sm transition-transform duration-300 ease-out"
              role="banner"
              aria-label="Chat header"
              id="page-header"
            >
              <div className="container mx-auto max-w-4xl p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center">
                    <div className="flex items-center space-x-2">
                      <MessageCircle
                        className="text-primary h-6 w-6"
                        aria-hidden="true"
                      />
                      <h1 className="text-xl font-semibold sm:text-2xl">
                        Chat
                      </h1>
                    </div>
                  </div>
                  <div className="flex items-center">
                    <UserMenu />
                  </div>
                </div>
              </div>
            </header>

            {/* Main content - full height with padding for header/footer */}
            <main
              className="bg-muted/30 h-screen overflow-y-auto pt-[72px] pb-[80px]"
              id="messages-container"
            >
              <SmartChatContainer
                showChatInput={false}
                onExposeSendMessage={handleExposeSendMessage}
                onAutoScroll={handleAutoScroll}
              />
            </main>

            {/* Footer - fixed at bottom */}
            <footer
              className="bg-background/95 fixed right-0 bottom-0 left-0 z-10 border-t backdrop-blur-sm transition-transform duration-300 ease-out"
              role="contentinfo"
              aria-label="Chat input"
              id="page-footer"
            >
              <div className="container mx-auto max-w-4xl">
                <ChatInput
                  onSendMessage={sendMessage || (async () => {})}
                  placeholder="Type your message or attach a file..."
                  disabled={isSending || !sendMessage}
                />
              </div>
            </footer>
          </div>
        ) : (
          <div className="bg-background flex min-h-screen items-center justify-center">
            <SignInForm />
          </div>
        )}
      </div>
    </>
  );
}
