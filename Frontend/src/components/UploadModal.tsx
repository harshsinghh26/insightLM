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

  const handleFileUpload = (files: FileList | null) => {
    if (files) {
      Array.from(files).forEach(file => {
        onUpload({
          name: file.name,
          type: file.type || 'file',
          size: `${Math.round(file.size / 1024)} KB`,
          file
        });
      });
      onClose();
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

  const handleTextPaste = () => {
    // Handle text paste functionality
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl glass shadow-large">
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
                  onClick={option.label === "Paste text" ? handleTextPaste : undefined}
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
  );
}
