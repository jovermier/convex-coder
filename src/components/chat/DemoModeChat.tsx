import { useCallback, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { ThemeToggle } from "@/components/theme-toggle";
import { ChatMessages } from "./ChatMessages";
import { ChatInput } from "./ChatInput";
import { MessageCircle, Wifi, WifiOff } from "lucide-react";

// Demo user for offline mode
const demoUser = {
  _id: "demo-user" as any,
  name: "Demo User",
  email: "demo@example.com",
  avatar: undefined,
  isOnline: true,
  lastSeen: Date.now(),
  createdAt: Date.now(),
};

export function DemoModeChat() {
  const [isRetrying, setIsRetrying] = useState(false);

  const handleSendMessage = useCallback(async (content: string, file?: File) => {
    // In demo mode, just show a success message
    console.log("Demo mode: Message sent locally", { content, file });
    
    // Simulate a brief delay for demo purposes
    await new Promise(resolve => setTimeout(resolve, 500));
    
    // The message will appear through the demo data system
  }, []);

  const handleRetryConnection = useCallback(async () => {
    setIsRetrying(true);
    // Attempt to reconnect (this will just reload the page)
    setTimeout(() => {
      window.location.reload();
    }, 1000);
  }, []);

  return (
    <div className="min-h-screen bg-muted/30">
      <div className="container mx-auto max-w-4xl p-2 sm:p-4">
        <Card className="min-h-[calc(100vh-1rem)] sm:min-h-[calc(100vh-2rem)] flex flex-col">
          {/* Header with demo mode indicator */}
          <CardHeader className="border-b bg-background/95 backdrop-blur">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className="flex items-center space-x-2">
                  <MessageCircle className="h-6 w-6 text-primary" />
                  <CardTitle className="text-xl sm:text-2xl">Modern Chat</CardTitle>
                </div>
                <Badge variant="secondary" className="hidden sm:inline-flex">
                  <WifiOff className="h-3 w-3 mr-1" />
                  Demo Mode
                </Badge>
              </div>
              <div className="flex items-center space-x-3">
                <div className="hidden sm:flex items-center space-x-2">
                  <Avatar className="h-8 w-8">
                    <AvatarFallback className="text-xs bg-primary/10 text-primary">
                      DU
                    </AvatarFallback>
                  </Avatar>
                  <div className="text-sm">
                    <div className="font-medium">{demoUser.name}</div>
                    <div className="text-muted-foreground text-xs">Demo Mode</div>
                  </div>
                </div>
                <ThemeToggle />
              </div>
            </div>
            
            {/* Mobile user info */}
            <div className="flex sm:hidden items-center justify-center space-x-2 pt-2 border-t mt-3">
              <Avatar className="h-6 w-6">
                <AvatarFallback className="text-xs bg-primary/10 text-primary">
                  DU
                </AvatarFallback>
              </Avatar>
              <span className="text-sm font-medium">{demoUser.name}</span>
              <Badge variant="outline" className="text-xs">
                <WifiOff className="h-3 w-3 mr-1" />
                Demo
              </Badge>
            </div>

            {/* Connection retry banner */}
            <div className="bg-orange-50 dark:bg-orange-950/20 border border-orange-200 dark:border-orange-800 rounded-lg p-3 mt-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <WifiOff className="h-4 w-4 text-orange-500" />
                  <div className="text-sm">
                    <div className="font-medium text-orange-900 dark:text-orange-100">
                      Backend Temporarily Unavailable
                    </div>
                    <div className="text-xs text-orange-700 dark:text-orange-300">
                      Explore all features with demo data while we reconnect
                    </div>
                  </div>
                </div>
                <Button
                  onClick={handleRetryConnection}
                  disabled={isRetrying}
                  size="sm"
                  variant="outline"
                  className="border-orange-200 text-orange-700 hover:bg-orange-50 dark:border-orange-800 dark:text-orange-300 dark:hover:bg-orange-950/40"
                >
                  {isRetrying ? (
                    <div className="animate-spin rounded-full h-3 w-3 border border-current border-t-transparent" />
                  ) : (
                    <>
                      <Wifi className="h-3 w-3 mr-1" />
                      Retry
                    </>
                  )}
                </Button>
              </div>
            </div>
          </CardHeader>

          {/* Messages area - uses the same ChatMessages component which has demo data */}
          <div className="flex-1 flex flex-col min-h-0">
            <ChatMessages currentUser={demoUser} />
          </div>

          {/* Input area */}
          <ChatInput
            onSendMessage={handleSendMessage}
            disabled={false}
            placeholder="Try the demo! Type a message..."
          />
        </Card>
      </div>
    </div>
  );
}