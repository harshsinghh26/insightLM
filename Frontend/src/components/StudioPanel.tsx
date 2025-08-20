import { FileText } from "lucide-react";
import { useState } from "react";
import ReactMarkdown from "react-markdown";
import rehypeHighlight from "rehype-highlight";
import { summarizeStream } from "@/lib/api";

interface StudioPanelProps {
  sources: any[];
  assistantText?: string;
}

export function StudioPanel({ sources, assistantText }: StudioPanelProps) {
  const [summary, setSummary] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSummarize = async () => {
    if (loading) return;
    setSummary("");
    setLoading(true);
    try {
      const input = (assistantText && assistantText.trim().length > 0)
        ? `Summarize the following content in 5-8 bullet points with a short heading. Do not repeat the original text; only provide a concise summary.\n\n${assistantText}`
        : "No assistant response yet. Provide a placeholder summary of the last result in 2-3 bullets.";
      await summarizeStream(input, (t) => {
        setSummary((s) => s + t);
      });
    } finally {
      setLoading(false);
    }
  };
  return (
    <div className="w-80 glass-panel glass-border border-l flex flex-col h-full">
      <div className="p-6 glass-border border-b">
        <h2 className="text-lg font-semibold text-foreground mb-2">Output</h2>
        <p className="text-sm text-muted-foreground">
          Generated text analysis and insights
        </p>
      </div>

      <div className="flex-1 p-6">
        <div className="space-y-4">
          <button onClick={handleSummarize} className={`w-full text-left p-4 glass glass-hover rounded-lg transition-all ${
            sources.length === 0
              ? 'opacity-50 cursor-not-allowed'
              : 'cursor-pointer'
          }`}>
            <div className="flex items-start gap-3">
              <div className={`p-2 rounded-lg ${
                sources.length === 0
                  ? 'bg-muted/60' 
                  : 'glass'
              }`}>
                <FileText className={`h-5 w-5 ${
                  sources.length === 0
                    ? 'text-muted-foreground' 
                    : 'text-primary'
                }`} />
              </div>
              <div className="flex-1">
                <h3 className="font-medium text-foreground text-sm mb-1">
                  Text Summary
                </h3>
                <p className="text-xs text-text-subtle">
                  Click to generate a streaming summary
                </p>
              </div>
            </div>
          </button>
        </div>

        <div className="mt-8 p-4 glass rounded-lg min-h-[120px] max-h-[40vh] overflow-auto">
          {summary ? (
            <div className="prose prose-invert prose-sm max-w-none">
              <ReactMarkdown rehypePlugins={[rehypeHighlight]}>{summary}</ReactMarkdown>
            </div>
          ) : (
            <p className="text-sm text-center text-text-subtle">
              {loading ? "Summarizing..." : "Text output will appear here."}
            </p>
          )}
        </div>
      </div>
    </div>
  );
}