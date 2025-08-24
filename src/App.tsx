import { SmartChatContainer } from "@/components/chat/SmartChatContainer";

import "./styles/accessibility.css";

export default function App() {
  return (
    <>
      {/* Skip navigation link for keyboard users */}
      <a href="#main-content" className="skip-nav">
        Skip to main content
      </a>
      <div id="main-content">
        <SmartChatContainer />
      </div>
    </>
  );
}
