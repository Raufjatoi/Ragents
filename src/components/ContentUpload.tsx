import { Upload, CheckCircle2 } from "lucide-react";
import { useRef, useState } from "react";
import * as pdfjsLib from "pdfjs-dist";
import mammoth from "mammoth";
import { toast } from "sonner";

interface ContentUploadProps {
  onTextSubmit: (text: string) => void;
  isLoading: boolean;
}

const ContentUpload = ({ onTextSubmit, isLoading }: ContentUploadProps) => {
  const fileRef = useRef<HTMLInputElement>(null);
  const [uploadInfo, setUploadInfo] = useState<{ name: string; chars: number } | null>(null);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    pdfjsLib.GlobalWorkerOptions.workerSrc = new URL(
      "pdfjs-dist/build/pdf.worker.mjs",
      import.meta.url
    ).toString();

    try {
      if (file.type === "application/pdf") {
        const arrayBuffer = await file.arrayBuffer();
        const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
        let fullText = "";
        for (let i = 1; i <= pdf.numPages; i++) {
          const page = await pdf.getPage(i);
          const textContent = await page.getTextContent();
          const pageText = textContent.items.map((item: any) => item.str).join(" ");
          fullText += pageText + "\n";
        }
        if (fullText.trim()) {
          const extracted = fullText.trim();
          onTextSubmit(extracted);
          setUploadInfo({ name: file.name, chars: extracted.length });
          toast.success(`Extracted ${pdf.numPages} page(s) from PDF`);
        } else {
          toast.error("No text found in PDF");
        }
      } else if (file.type === "application/vnd.openxmlformats-officedocument.wordprocessingml.document") {
        const arrayBuffer = await file.arrayBuffer();
        const result = await mammoth.extractRawText({ arrayBuffer });
        if (result.value.trim()) {
          const extracted = result.value.trim();
          onTextSubmit(extracted);
          setUploadInfo({ name: file.name, chars: extracted.length });
          toast.success("Text extracted from Word document");
        } else {
          toast.error("No text found in Word document");
        }
      } else {
        const text = await file.text();
        if (text.trim()) {
          const extracted = text.trim();
          onTextSubmit(extracted);
          setUploadInfo({ name: file.name, chars: extracted.length });
        } else {
          toast.error("File is empty");
        }
      }
    } catch (error: any) {
      console.error("File extraction failed:", error);
      toast.error(`Failed to extract text: ${error.message || "Unknown error"}`);
    }

    if (fileRef.current) fileRef.current.value = "";
  };

  return (
    <div className="flex flex-col gap-1">
      <input ref={fileRef} type="file" accept=".txt,.md,.doc,.docx,.pdf" onChange={handleFileUpload} className="hidden" />
      <button
        onClick={() => fileRef.current?.click()}
        disabled={isLoading}
        className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all hover:scale-105 disabled:opacity-50"
        style={{ backgroundColor: "rgba(168,85,247,0.15)", color: "#c084fc", border: "1px solid rgba(168,85,247,0.25)" }}
      >
        <Upload size={12} />
        Upload File
      </button>
      {uploadInfo && (
        <div className="flex items-center gap-1.5 text-xs" style={{ color: "rgba(34, 197, 94, 0.8)" }}>
          <CheckCircle2 size={11} />
          <span className="truncate max-w-[130px]" title={uploadInfo.name}>{uploadInfo.name}</span>
          <span style={{ color: "rgba(245,242,241,0.3)" }}>•</span>
          <span>{uploadInfo.chars.toLocaleString()} chars</span>
        </div>
      )}
    </div>
  );
};

export default ContentUpload;
