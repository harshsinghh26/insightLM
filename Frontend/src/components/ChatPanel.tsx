import { Button } from "@/components/ui/button";
import { Upload, Send } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { chatStream } from "@/lib/api";
import ReactMarkdown from "react-markdown";
import rehypeHighlight from "rehype-highlight";
import { useCallback } from "react";

interface ChatPanelProps {
  onUploadSource: () => void;
  sources: any[];
  onAssistantUpdate?: (text: string) => void;
}

export function ChatPanel({ onUploadSource, sources, onAssistantUpdate }: ChatPanelProps) {
  const [message, setMessage] = useState("");
  const [messages, setMessages] = useState<{ role: "user" | "assistant"; content: string }[]>([]);
  const [sending, setSending] = useState(false);
  const listRef = useRef<HTMLDivElement | null>(null);
  const [waitingForFirstToken, setWaitingForFirstToken] = useState(false);
  const handleCopy = useCallback((fallbackText: string, target?: HTMLButtonElement) => {
    const finish = () => {
      if (target) {
        const original = target.textContent;
        target.textContent = "Copied";
        setTimeout(() => {
          target.textContent = original || "Copy";
        }, 1200);
      }
    };
    const doFallback = () => {
      try {
        const textarea = document.createElement('textarea');
        textarea.value = fallbackText;
        textarea.style.position = 'fixed';
        textarea.style.opacity = '0';
        document.body.appendChild(textarea);
        textarea.select();
        document.execCommand('copy');
        document.body.removeChild(textarea);
        finish();
      } catch {
        // noop
      }
    };
    if (navigator.clipboard?.writeText) {
      navigator.clipboard.writeText(fallbackText).then(finish).catch(doFallback);
    } else {
      doFallback();
    }
  }, []);

  const handleSendMessage = async () => {
    const trimmed = message.trim();
    if (!trimmed || sources.length === 0 || sending) return;
    const nextMessages = [...messages, { role: "user", content: trimmed }];
    setMessages(nextMessages);
    setMessage("");
    setSending(true);
    try {
      let assistant = "";
      setWaitingForFirstToken(true);
      setMessages(m => [...m, { role: "assistant", content: "" }]);
      const idx = nextMessages.length; // assistant index
      await chatStream(trimmed, (t) => {
        assistant += t;
        if (waitingForFirstToken) setWaitingForFirstToken(false);
        setMessages(m => {
          const copy = [...m];
          copy[idx] = { role: "assistant", content: assistant };
          return copy;
        });
        onAssistantUpdate?.(assistant);
      });
    } catch (e) {
      setMessages(m => [...m, { role: "assistant", content: "Sorry, something went wrong." }]);
    } finally {
      setSending(false);
      setWaitingForFirstToken(false);
    }
  };

  useEffect(() => {
    const el = listRef.current;
    if (!el) return;
    el.scrollTop = el.scrollHeight;
  }, [messages, sending]);

  return (
    <div className="flex-1 flex flex-col glass-panel overflow-hidden">
      <div className="glass-border border-b px-6 py-4">
        <h1 className="text-xl font-semibold text-foreground">Chat</h1>
      </div>

      <div className="flex-1 flex flex-col min-h-0">
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
          <div ref={listRef} className="flex-1 p-6 overflow-auto">
            <div className="space-y-5">
              {messages.length === 0 ? (
                <div className="text-center py-8">
                  <p className="text-sm text-muted-foreground">
                    Start a conversation about your sources
                  </p>
                </div>
              ) : (
                messages.map((m, idx) => (
                  <div key={idx} className={`flex ${m.role === "user" ? "justify-end" : "justify-start"}`}>
                    <div className={`inline-block w-fit max-w-[80%] px-4 py-3 rounded-xl border border-border shadow-sm ${m.role === "user" ? "bg-primary text-primary-foreground" : "glass"}`}>
                      <div className="prose prose-invert max-w-none relative leading-relaxed">
                        {m.role === "assistant" ? (
                          <ReactMarkdown
                            rehypePlugins={[rehypeHighlight]}
                            components={{
                              pre({ node, ...props }) {
                                return (
                                  <div className="relative">
                                    <pre {...props} />
                                    <button
                                      type="button"
                                      className="copy-button"
                                      onClick={(e) => {
                                        const wrapper = e.currentTarget.parentElement;
                                        const codeText = wrapper?.querySelector('pre')?.textContent || '';
                                        handleCopy(codeText, e.currentTarget);
                                      }}
                                      aria-label="Copy code"
                                    >
                                      Copy
                                    </button>
                                  </div>
                                );
                              },
                            }}
                          >
                            {m.content}
                          </ReactMarkdown>
                        ) : (
                          <p className="whitespace-pre-wrap break-words max-w-full">{m.content}</p>
                        )}
                        {m.role === "assistant" && sending && idx === messages.length - 1 && m.content.length === 0 ? (
                          <span className="inline-flex items-center gap-1 ml-1 align-middle">
                            <span className="w-1.5 h-1.5 rounded-full bg-primary/60 animate-bounce [animation-delay:-0.3s]" />
                            <span className="w-1.5 h-1.5 rounded-full bg-primary/60 animate-bounce [animation-delay:-0.15s]" />
                            <span className="w-1.5 h-1.5 rounded-full bg-primary/60 animate-bounce" />
                          </span>
                        ) : null}
                        {m.role === "assistant" && sending && idx === messages.length - 1 && m.content.length > 0 ? (
                          <span className="inline-block w-2 h-4 align-middle animate-pulse bg-primary/60 rounded-sm ml-1" />
                        ) : null}
                      </div>
                    </div>
                  </div>
                ))
              )}
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
                disabled={sources.length === 0 || sending}
                className="w-full px-4 py-3 pr-12 glass border glass-border rounded-lg focus:outline-none focus:ring-2 focus:ring-ring disabled:opacity-50 disabled:cursor-not-allowed text-sm"
                onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); handleSendMessage(); } }}
              />
              <div className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-text-subtle">
                {sources.length} source{sources.length !== 1 ? 's' : ''}
              </div>
            </div>
            <Button
              onClick={handleSendMessage}
              disabled={!message.trim() || sources.length === 0 || sending}
              size="icon"
              className="bg-primary hover:bg-primary/90 text-primary-foreground shadow-soft disabled:opacity-50"
            >
              {sending ? (
                <svg className="h-4 w-4 animate-spin" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z"></path>
                </svg>
              ) : (
                <Send className="h-4 w-4" />
              )}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}