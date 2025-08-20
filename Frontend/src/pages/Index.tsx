import { useState } from "react";
import { SourcesPanel } from "@/components/SourcesPanel";
import { ChatPanel } from "@/components/ChatPanel";
import { StudioPanel } from "@/components/StudioPanel";
import { UploadModal } from "@/components/UploadModal";
import { indexFile, indexText, indexUrl } from "@/lib/api";

const Index = () => {
  const [sources, setSources] = useState<any[]>([]);
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
  const [assistantText, setAssistantText] = useState("");

  const handleAddSource = () => {
    setIsUploadModalOpen(true);
  };

  const handleUploadSource = async (source: any) => {
    try {
      if (source.file instanceof File) {
        await indexFile(source.file);
      } else if (source.type === "text" && source.content) {
        await indexText(source.content, source.name);
      } else if (source.type === "url" && source.url) {
        await indexUrl(source.url);
      }
      setSources(prev => [...prev, source]);
    } catch (err) {
      console.error("Failed to upload/index source", err);
    }
  };

  return (
    <div className="h-screen flex bg-background">
      <SourcesPanel onAddSource={handleAddSource} sources={sources} />
      <ChatPanel onUploadSource={handleAddSource} sources={sources} onAssistantUpdate={(t) => setAssistantText(t)} />
      <StudioPanel sources={sources} assistantText={assistantText} />
      
      <UploadModal
        isOpen={isUploadModalOpen}
        onClose={() => setIsUploadModalOpen(false)}
        onUpload={handleUploadSource}
      />
    </div>
  );
};

export default Index;
