import { Button } from "@/components/ui/button";
import { Upload, Send } from "lucide-react";
import { useState } from "react";

interface ChatPanelProps {
  onUploadSource: () => void;
  sources: any[];
}

export function ChatPanel({ onUploadSource, sources }: ChatPanelProps) {
  const [message, setMessage] = useState("");

  const handleSendMessage = () => {
    if (message.trim()) {
      // Handle message sending
      setMessage("");
    }
  };

  return (
    <div className="flex-1 flex flex-col glass-panel">
      <div className="glass-border border-b px-6 py-4">
        <h1 className="text-xl font-semibold text-foreground">Chat</h1>
      </div>

      <div className="flex-1 flex flex-col">
        {sources.length === 0 ? (
          <div className="flex-1 flex items-center justify-center p-6">
            <div className="text-center max-w-sm">
              <div className="w-12 h-12 mx-auto mb-6">
                <div className="w-full h-full rounded-full bg-primary/10 flex items-center justify-center">
                  <Upload className="h-6 w-6 text-primary" />
                </div>
              </div>
              <h3 className="text-lg font-medium text-foreground mb-2">
                Add a source to get started
              </h3>
              <p className="text-sm text-muted-foreground mb-6">
                Upload documents, add links, or connect your files to begin chatting about your content.
              </p>
              <Button
                onClick={onUploadSource}
                className="bg-primary hover:bg-primary/90 text-primary-foreground shadow-soft"
              >
                Upload a source
              </Button>
            </div>
          </div>
        ) : (
          <div className="flex-1 p-6">
            <div className="space-y-4">
              {/* Chat messages would go here */}
              <div className="text-center py-8">
                <p className="text-sm text-muted-foreground">
                  Start a conversation about your sources
                </p>
              </div>
            </div>
          </div>
        )}

        <div className="glass-border border-t p-6">
          <div className="flex gap-3">
            <div className="flex-1 relative">
              <input
                type="text"
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder={sources.length === 0 ? "Upload a source to get started" : "Ask about your sources..."}
                disabled={sources.length === 0}
                className="w-full px-4 py-3 pr-12 glass border glass-border rounded-lg focus:outline-none focus:ring-2 focus:ring-ring disabled:opacity-50 disabled:cursor-not-allowed text-sm"
                onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
              />
              <div className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-text-subtle">
                {sources.length} source{sources.length !== 1 ? 's' : ''}
              </div>
            </div>
            <Button
              onClick={handleSendMessage}
              disabled={!message.trim() || sources.length === 0}
              size="icon"
              className="bg-primary hover:bg-primary/90 text-primary-foreground shadow-soft disabled:opacity-50"
            >
              <Send className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}