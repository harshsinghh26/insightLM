import { FileText } from "lucide-react";

interface StudioPanelProps {
  sources: any[];
}

export function StudioPanel({ sources }: StudioPanelProps) {
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
          <div className={`p-4 glass glass-hover rounded-lg transition-all ${
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
                  AI-generated text analysis
                </p>
              </div>
            </div>
          </div>
        </div>

        <div className="mt-8 p-4 glass rounded-lg">
          <p className="text-sm text-center text-text-subtle">
            Text output will appear here.
          </p>
          <p className="text-xs text-center text-text-subtle mt-2">
            After adding sources, generate text summaries and insights!
          </p>
        </div>
      </div>
    </div>
  );
}