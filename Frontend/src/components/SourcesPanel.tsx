import { Button } from "@/components/ui/button";
import { Plus, Search, FileText } from "lucide-react";

interface SourcesPanelProps {
  onAddSource: () => void;
  sources: any[];
}

export function SourcesPanel({ onAddSource, sources }: SourcesPanelProps) {
  return (
    <div className="w-80 glass-panel glass-border border-r flex flex-col h-full">
      <div className="p-6 glass-border border-b">
        <h2 className="text-lg font-semibold text-foreground mb-4">Sources</h2>
        <div className="space-y-2">
          <Button
            onClick={onAddSource}
            className="w-full justify-start gap-3 bg-primary hover:bg-primary/90 text-primary-foreground shadow-soft"
            size="sm"
          >
            <Plus className="h-4 w-4" />
            Add
          </Button>
          <Button
            variant="outline"
            className="w-full justify-start gap-3 border-border hover:bg-surface-hover"
            size="sm"
          >
            <Search className="h-4 w-4" />
            Discover
          </Button>
        </div>
      </div>

      <div className="flex-1 p-6">
        {sources.length === 0 ? (
          <div className="text-center py-12">
            <div className="w-16 h-16 mx-auto mb-4 rounded-lg bg-muted flex items-center justify-center">
              <FileText className="h-8 w-8 text-muted-foreground" />
            </div>
            <p className="text-sm text-muted-foreground mb-2">
              Saved sources will appear here
            </p>
            <p className="text-xs text-text-subtle leading-relaxed">
              Click Add source above to add PDFs, websites link, text.
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {sources.map((source, index) => (
              <div
                key={index}
                className="p-3 border border-border rounded-lg bg-surface hover:bg-surface-hover transition-colors cursor-pointer"
              >
                <div className="flex items-start gap-3">
                  <FileText className="h-4 w-4 text-primary mt-1 flex-shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-foreground truncate">
                      {source.name}
                    </p>
                    <p className="text-xs text-text-subtle">
                      {source.type} • {source.size}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}