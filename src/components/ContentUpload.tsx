import { Upload } from "lucide-react";
import { useRef, useEffect } from "react";
import * as pdfjsLib from "pdfjs-dist";
import pdfWorkerUrl from "pdfjs-dist/build/pdf.worker.mjs?url";
import mammoth from "mammoth";
import { toast } from "sonner";

// Debug: Unique ID to verify code update
const UPDATE_ID = "v_2026_03_09_1810_UNPKG";
console.log(`[ContentUpload] Loading version: ${UPDATE_ID}`);

interface ContentUploadProps {
  onTextSubmit: (text: string) => void;
  isLoading: boolean;
}

const ContentUpload = ({ onTextSubmit, isLoading }: ContentUploadProps) => {
  const fileRef = useRef<HTMLInputElement>(null);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Debug: Unique ID to verify code update
    const VERIFY_ID = "v_2026_03_09_1815_WORKER";
    console.log(`[ContentUpload] Handling file with version: ${VERIFY_ID}`);

    // Vite-recommended way to load workers
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
          onTextSubmit(fullText.trim());
          toast.success(`Extracted ${pdf.numPages} pages from PDF`);
        } else {
          toast.error("No text found in PDF");
        }
      } else if (file.type === "application/vnd.openxmlformats-officedocument.wordprocessingml.document") {
        const arrayBuffer = await file.arrayBuffer();
        const result = await mammoth.extractRawText({ arrayBuffer });
        if (result.value.trim()) {
          onTextSubmit(result.value.trim());
          toast.success("Text extracted from Word document");
        } else {
          toast.error("No text found in Word document");
        }
      } else {
        const text = await file.text();
        if (text.trim()) {
          onTextSubmit(text.trim());
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
    <div className="flex gap-2">
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
    </div>
  );
};

export default ContentUpload;
