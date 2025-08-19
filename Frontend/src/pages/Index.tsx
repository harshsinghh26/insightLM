import { useState } from "react";
import { SourcesPanel } from "@/components/SourcesPanel";
import { ChatPanel } from "@/components/ChatPanel";
import { StudioPanel } from "@/components/StudioPanel";
import { UploadModal } from "@/components/UploadModal";

const Index = () => {
  const [sources, setSources] = useState<any[]>([]);
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);

  const handleAddSource = () => {
    setIsUploadModalOpen(true);
  };

  const handleUploadSource = (source: any) => {
    setSources(prev => [...prev, source]);
  };

  return (
    <div className="h-screen flex bg-background">
      <SourcesPanel onAddSource={handleAddSource} sources={sources} />
      <ChatPanel onUploadSource={handleAddSource} sources={sources} />
      <StudioPanel sources={sources} />
      
      <UploadModal
        isOpen={isUploadModalOpen}
        onClose={() => setIsUploadModalOpen(false)}
        onUpload={handleUploadSource}
      />
    </div>
  );
};

export default Index;
