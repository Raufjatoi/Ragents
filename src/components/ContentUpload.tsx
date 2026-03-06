import { Upload, FileText } from "lucide-react";
import { useRef } from "react";

interface ContentUploadProps {
  onTextSubmit: (text: string) => void;
  isLoading: boolean;
}

const ContentUpload = ({ onTextSubmit, isLoading }: ContentUploadProps) => {
  const fileRef = useRef<HTMLInputElement>(null);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const text = await file.text();
    if (text.trim()) onTextSubmit(text.trim());
    if (fileRef.current) fileRef.current.value = "";
  };

  return (
    <div className="flex gap-2">
      <input ref={fileRef} type="file" accept=".txt,.md,.doc,.docx" onChange={handleFileUpload} className="hidden" />
      <button
        onClick={() => fileRef.current?.click()}
        disabled={isLoading}
        className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all hover:scale-105 disabled:opacity-50"
        style={{ backgroundColor: "rgba(168,85,247,0.15)", color: "#c084fc", border: "1px solid rgba(168,85,247,0.25)" }}
      >
        <Upload size={12} />
        Upload File
      </button>
    </div>
  );
};

export default ContentUpload;
