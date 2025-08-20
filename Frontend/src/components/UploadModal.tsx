import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Upload, Link, FileText } from "lucide-react";
import { useState } from "react";

interface UploadModalProps {
  isOpen: boolean;
  onClose: () => void;
  onUpload: (source: any) => void;
}

export function UploadModal({ isOpen, onClose, onUpload }: UploadModalProps) {
  const [dragOver, setDragOver] = useState(false);
  const [textDialogOpen, setTextDialogOpen] = useState(false);
  const [urlDialogOpen, setUrlDialogOpen] = useState(false);
  const [pastedText, setPastedText] = useState("");
  const [websiteUrl, setWebsiteUrl] = useState("");
  const [isIndexing, setIsIndexing] = useState(false);

  const handleFileUpload = (files: FileList | null) => {
    if (files) {
      setIsIndexing(true);
      Promise.all(Array.from(files).map(file => onUpload({
        name: file.name,
        type: file.type || 'file',
        size: `${Math.round(file.size / 1024)} KB`,
        file
      }))).finally(() => {
        setIsIndexing(false);
        onClose();
      });
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    handleFileUpload(e.dataTransfer.files);
  };

  const sourceOptions = [
    { icon: Link, label: "Website URL", description: "Add a website or URL" },
    { icon: FileText, label: "Paste text", description: "Add text directly" }
  ];

  const handleSubmitText = () => {
    if (!pastedText.trim()) return;
    setIsIndexing(true);
    Promise.resolve(onUpload({
      name: "Pasted text",
      type: "text",
      size: `${pastedText.length} chars`,
      content: pastedText,
    })).finally(() => {
      setPastedText("");
      setTextDialogOpen(false);
      setIsIndexing(false);
      onClose();
    });
  };

  const handleSubmitUrl = () => {
    const url = websiteUrl.trim();
    if (!url) return;
    setIsIndexing(true);
    Promise.resolve(onUpload({
      name: url,
      type: "url",
      size: "URL",
      url,
    })).finally(() => {
      setWebsiteUrl("");
      setUrlDialogOpen(false);
      setIsIndexing(false);
      onClose();
    });
  };

  return (
    <>
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl glass shadow-large">
        {isIndexing && (
          <div className="absolute inset-0 z-10 flex items-center justify-center bg-background/60">
            <div className="flex items-center gap-3 px-4 py-2 rounded-md glass-border bg-surface/80">
              <div className="w-4 h-4 rounded-full bg-primary animate-bounce [animation-delay:-0.3s]"></div>
              <div className="w-4 h-4 rounded-full bg-primary animate-bounce [animation-delay:-0.15s]"></div>
              <div className="w-4 h-4 rounded-full bg-primary animate-bounce"></div>
              <span className="text-sm text-foreground ml-2">Indexing...</span>
            </div>
          </div>
        )}
        <DialogHeader className="pb-6">
          <DialogTitle className="text-xl font-semibold text-foreground">Add sources</DialogTitle>
          <p className="text-sm text-muted-foreground mt-2">
            Sources let NotebookLM base its responses on the information that matters most to you.
          </p>
          <p className="text-xs text-text-subtle">
            (Examples: marketing plans, course reading, research notes, meeting transcripts, sales documents, etc.)
          </p>
        </DialogHeader>

        <div className="space-y-6">
          {/* File Upload Area */}
          <div
            onDrop={handleDrop}
            onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
            onDragLeave={() => setDragOver(false)}
            className={`border-2 border-dashed rounded-xl p-8 text-center transition-all ${
              dragOver 
                ? 'border-primary glass-hover' 
                : 'glass-border glass-hover'
            }`}
          >
            <div className="space-y-4">
              <div className="w-12 h-12 mx-auto rounded-full glass flex items-center justify-center">
                <Upload className="h-6 w-6 text-primary" />
              </div>
              <div>
                <h3 className="font-medium text-foreground mb-2">Upload sources</h3>
                <p className="text-sm text-muted-foreground">
                  Drag and drop or{" "}
                  <label className="text-primary hover:text-primary/80 cursor-pointer font-medium">
                    choose file
                    <input
                      type="file"
                      multiple
                      className="hidden"
                      accept=".pdf,.txt,.md,.mp3,.wav,.m4a"
                      onChange={(e) => handleFileUpload(e.target.files)}
                    />
                  </label>
                  {" "}to upload
                </p>
              </div>
              <p className="text-xs text-text-subtle">
                Supported file types: PDF, .txt, Markdown, Audio (e.g. mp3)
              </p>
            </div>
          </div>

          {/* Source Options */}
          <div className="grid grid-cols-2 gap-3">
            {sourceOptions.map((option, index) => {
              const IconComponent = option.icon;
              return (
                <Button
                  key={index}
                  variant="outline"
                  className="h-20 flex-col gap-2 glass glass-hover text-left p-4"
                  onClick={() => {
                    if (option.label === "Paste text") setTextDialogOpen(true);
                    if (option.label === "Website URL") setUrlDialogOpen(true);
                  }}
                >
                  <div className="flex items-center gap-2 w-full">
                    <IconComponent className="h-4 w-4 text-primary flex-shrink-0" />
                    <span className="text-sm font-medium">{option.label}</span>
                  </div>
                  <p className="text-xs text-text-subtle w-full">{option.description}</p>
                </Button>
              );
            })}
          </div>

        </div>
      </DialogContent>
    </Dialog>

    {/* Secondary dialogs for paste text and URL */}
    <Dialog open={textDialogOpen} onOpenChange={setTextDialogOpen}>
      <DialogContent className="max-w-lg glass">
        <DialogHeader>
          <DialogTitle>Paste text</DialogTitle>
        </DialogHeader>
        <div className="space-y-3">
          <textarea
            className="w-full h-40 glass border glass-border rounded-md p-2 text-sm outline-none"
            placeholder="Paste or type your text here..."
            value={pastedText}
            onChange={(e) => setPastedText(e.target.value)}
          />
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => { setTextDialogOpen(false); setPastedText(""); }}>
              Cancel
            </Button>
            <Button onClick={handleSubmitText}>Add</Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>

    <Dialog open={urlDialogOpen} onOpenChange={setUrlDialogOpen}>
      <DialogContent className="max-w-md glass">
        <DialogHeader>
          <DialogTitle>Add website URL</DialogTitle>
        </DialogHeader>
        <div className="space-y-3">
          <input
            className="w-full glass border glass-border rounded-md p-2 text-sm outline-none"
            placeholder="https://example.com/page"
            value={websiteUrl}
            onChange={(e) => setWebsiteUrl(e.target.value)}
          />
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => { setUrlDialogOpen(false); setWebsiteUrl(""); }}>
              Cancel
            </Button>
            <Button onClick={handleSubmitUrl}>Add</Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
    </>
  );
}
