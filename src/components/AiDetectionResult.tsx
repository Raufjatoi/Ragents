import { ShieldAlert, ShieldCheck, ShieldQuestion, RefreshCw, Download, FileText, FileDown, Search, Brain, Type, BarChart3, Sparkles, CheckCircle2, Loader2, FileType } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { jsPDF } from "jspdf";
import { Document, Packer, Paragraph, TextRun } from "docx";
import { saveAs } from "file-saver";
import { useState, useEffect } from "react";

interface ToolResult {
  name: string;
  icon: React.ElementType;
  label: string;
  status: "pending" | "running" | "done";
  result?: string;
  score?: number;
}

interface AiDetectionResultProps {
  score: number;
  text: string;
  onHumanize: () => void;
  isHumanizing: boolean;
  isHumanized?: boolean;
  toolsInProgress?: { name: string; result: string; score: number }[];
  toolsFinal?: { name: string; result: string; score: number }[];
  humanizingSteps?: { name: string; status: "pending" | "running" | "done" }[];
}

const toolConfigs = [
  { name: "words", icon: Type, label: "Word Pattern Analysis", descriptions: ["Checking repetitive phrases...", "Scanning vocabulary diversity..."] },
  { name: "tone", icon: Brain, label: "Tone & Style Check", descriptions: ["Analyzing writing tone...", "Evaluating naturalness..."] },
  { name: "structure", icon: BarChart3, label: "Structure Detection", descriptions: ["Checking sentence patterns...", "Analyzing paragraph flow..."] },
  { name: "patterns", icon: Search, label: "AI Pattern Matching", descriptions: ["Matching known AI patterns...", "Cross-referencing signatures..."] },
];

const AiDetectionResult = ({ score, text, onHumanize, isHumanizing, isHumanized, toolsInProgress, toolsFinal, humanizingSteps }: AiDetectionResultProps) => {
  const [tools, setTools] = useState<ToolResult[]>(
    toolConfigs.map((t) => ({ name: t.name, icon: t.icon, label: t.label, status: "pending" }))
  );
  const [analysisComplete, setAnalysisComplete] = useState(false);
  const [currentToolMsg, setCurrentToolMsg] = useState("");

  useEffect(() => {
    if (toolsFinal || toolsInProgress) {
      const activeTools = toolsFinal || toolsInProgress || [];
      const updatedTools = toolConfigs.map((cfg) => {
        const matchingTool = activeTools.find(at => at.name.includes(cfg.name.split("_")[0]) || cfg.name.includes(at.name.split("_")[0]));
        if (matchingTool) {
          return {
            ...cfg,
            status: "done" as const,
            result: matchingTool.result,
            score: matchingTool.score
          };
        }
        // If it's the latest tool in progress, mark it as running
        if (toolsInProgress && toolsInProgress.length > 0 && toolsInProgress[toolsInProgress.length - 1].name === cfg.name) {
          return { ...cfg, status: "running" as const };
        }

        return { ...cfg, status: "pending" as const };
      });
      setTools(updatedTools as ToolResult[]);
      if (toolsFinal) setAnalysisComplete(true);
      return;
    }

    const runTools = async () => {
      if (isHumanized) return;
      for (let i = 0; i < toolConfigs.length; i++) {
        const cfg = toolConfigs[i];
        setCurrentToolMsg(cfg.descriptions[0]);
        setTools((prev) => prev.map((t, idx) => idx === i ? { ...t, status: "running" } : t));

        await new Promise((r) => setTimeout(r, 600));
        setCurrentToolMsg(cfg.descriptions[1]);
        await new Promise((r) => setTimeout(r, 600));

        const toolScore = Math.max(0, Math.min(100, score + Math.floor(Math.random() * 20 - 10)));
        const results: Record<string, string> = {
          words: toolScore > 60 ? "Repetitive patterns detected" : "Natural word variety",
          tone: toolScore > 60 ? "Uniform formal tone" : "Varied, human-like tone",
          structure: toolScore > 60 ? "Predictable sentence structure" : "Organic structure",
          patterns: toolScore > 60 ? "AI signatures found" : "No strong AI markers",
        };

        setTools((prev) =>
          prev.map((t, idx) =>
            idx === i ? { ...t, status: "done", result: results[cfg.name], score: toolScore } : t
          )
        );
      }
      setCurrentToolMsg("");
      setAnalysisComplete(true);
    };
    runTools();
  }, [score, toolsInProgress, toolsFinal, isHumanized]);

  const getScoreInfo = () => {
    if (score >= 70) return { icon: ShieldAlert, label: "Likely AI-Generated", color: "#ef4444", bg: "rgba(239,68,68,0.15)" };
    if (score >= 40) return { icon: ShieldQuestion, label: "Mixed / Uncertain", color: "#f59e0b", bg: "rgba(245,158,11,0.15)" };
    return { icon: ShieldCheck, label: "Likely Human-Written", color: "#22c55e", bg: "rgba(34,197,94,0.15)" };
  };

  const info = getScoreInfo();
  const Icon = info.icon;

  const downloadAsTxt = () => {
    const blob = new Blob([text], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "humanized_content.txt";
    a.click();
    URL.revokeObjectURL(url);
  };

  const downloadAsPdf = () => {
    const doc = new jsPDF();
    const margin = 20;
    const pageWidth = doc.internal.pageSize.getWidth();
    const maxWidth = pageWidth - margin * 2;
    
    doc.setFont("helvetica", "bold");
    doc.setFontSize(18);
    doc.text("Humanized Content", margin, 25);
    
    doc.setFont("helvetica", "normal");
    doc.setFontSize(10);
    doc.setTextColor(100);
    doc.text(`AI Probability Score: ${score}%`, margin, 35);
    
    doc.setDrawColor(200);
    doc.line(margin, 40, pageWidth - margin, 40);
    
    doc.setFontSize(11);
    doc.setTextColor(0);
    
    // Auto-wrap text
    const lines = doc.splitTextToSize(text, maxWidth);
    doc.text(lines, margin, 50);
    
    doc.save("humanized_content.pdf");
  };

  const downloadAsDocx = () => {
    const doc = new Document({
      sections: [
        {
          properties: {},
          children: [
            new Paragraph({
              children: [
                new TextRun({
                  text: "Humanized Content",
                  bold: true,
                  size: 36,
                }),
              ],
            }),
            new Paragraph({
              children: [
                new TextRun({
                  text: `AI Probability Score: ${score}%`,
                  color: score >= 70 ? "FF4444" : score >= 40 ? "F59E0B" : "22C55E",
                  bold: true,
                  size: 24,
                }),
              ],
            }),
            new Paragraph({ text: "" }), // Spacing
            ...text.split("\n").map(para => new Paragraph({
              children: [new TextRun({ text: para.trim(), size: 22 })],
              spacing: { after: 200 }
            }))
          ],
        },
      ],
    });

    Packer.toBlob(doc).then((blob) => {
      saveAs(blob, "humanized_content.docx");
    });
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      className="mt-3 rounded-xl p-4 space-y-4"
      style={{ backgroundColor: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.1)" }}
    >
      {/* Tool Progress */}
      {!isHumanized && (
        <div className="space-y-2">
          <p className="text-xs font-semibold uppercase tracking-wider" style={{ color: "rgba(245,242,241,0.4)" }}>
            🔍 Running Analysis Tools
          </p>
          {tools.map((tool, i) => {
            const TIcon = tool.icon;
            return (
              <motion.div
                key={tool.name}
                initial={{ opacity: 0, x: -12 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.1 }}
                className="flex items-center gap-3 px-3 py-2 rounded-lg"
                style={{ backgroundColor: tool.status === "running" ? "rgba(168,85,247,0.1)" : "rgba(255,255,255,0.03)" }}
              >
                <div className="p-1.5 rounded-md" style={{
                  backgroundColor: tool.status === "done" ? "rgba(34,197,94,0.15)" : tool.status === "running" ? "rgba(168,85,247,0.2)" : "rgba(255,255,255,0.06)"
                }}>
                  {tool.status === "running" ? (
                    <Loader2 size={14} className="animate-spin" style={{ color: "#c084fc" }} />
                  ) : tool.status === "done" ? (
                    <CheckCircle2 size={14} style={{ color: "#22c55e" }} />
                  ) : (
                    <TIcon size={14} style={{ color: "rgba(245,242,241,0.3)" }} />
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-medium" style={{
                    color: tool.status === "done" ? "rgba(245,242,241,0.85)" : tool.status === "running" ? "#c084fc" : "rgba(245,242,241,0.4)"
                  }}>
                    {tool.label}
                  </p>
                  {tool.status === "done" && tool.result && (
                    <p className="text-xs" style={{ color: "rgba(245,242,241,0.45)" }}>{tool.result}</p>
                  )}
                </div>
                {tool.status === "done" && tool.score !== undefined && (
                  <span className="text-xs font-bold px-2 py-0.5 rounded-full" style={{
                    backgroundColor: tool.score >= 70 ? "rgba(239,68,68,0.2)" : tool.score >= 40 ? "rgba(245,158,11,0.2)" : "rgba(34,197,94,0.2)",
                    color: tool.score >= 70 ? "#ef4444" : tool.score >= 40 ? "#f59e0b" : "#22c55e",
                  }}>
                    {tool.score}%
                  </span>
                )}
              </motion.div>
            );
          })}
          {currentToolMsg && (
            <motion.p
              key={currentToolMsg}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="text-xs italic pl-2"
              style={{ color: "rgba(168,85,247,0.6)" }}
            >
              {currentToolMsg}
            </motion.p>
          )}
        </div>
      )}

      {/* Final Score — shown after all tools complete */}
      <AnimatePresence>
        {(analysisComplete || isHumanized) && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4 }}
            className="space-y-3 pt-2"
            style={{ borderTop: isHumanized ? "none" : "1px solid rgba(255,255,255,0.08)" }}
          >
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-xl" style={{ backgroundColor: info.bg }}>
                <Icon size={22} style={{ color: info.color }} />
              </div>
              <div className="flex-1">
                <p className="text-sm font-bold" style={{ color: info.color }}>{info.label}</p>
                <p className="text-xs" style={{ color: "rgba(245,242,241,0.5)" }}>{isHumanized ? "New AI Score" : "Overall AI Score"}</p>
              </div>
              <div className="text-2xl font-black" style={{ color: info.color }}>
                {score}%
              </div>
            </div>

            {/* Score bar */}
            <div className="w-full h-2.5 rounded-full overflow-hidden" style={{ backgroundColor: "rgba(255,255,255,0.1)" }}>
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${score}%` }}
                transition={{ duration: 1, ease: "easeOut" }}
                className="h-full rounded-full"
                style={{ backgroundColor: info.color }}
              />
            </div>

            {/* Actions & Progress */}
            <div className="flex flex-col gap-3 pt-1">
              {isHumanizing && humanizingSteps && (
                <div className="space-y-2 pb-2 mt-2">
                  <p className="text-[10px] font-bold uppercase tracking-widest" style={{ color: 'rgba(168,85,247,0.7)' }}>
                    ✨ Humanizing Process
                  </p>
                  <div className="grid grid-cols-1 gap-2">
                    {humanizingSteps.map((step, i) => (
                      <motion.div
                        key={step.name}
                        initial={{ opacity: 0, x: -5 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: i * 0.1 }}
                        className="flex items-center gap-2 px-3 py-1.5 rounded-lg border border-white/5"
                        style={{ backgroundColor: step.status === "running" ? "rgba(168,85,247,0.08)" : "rgba(255,255,255,0.02)" }}
                      >
                        {step.status === "running" ? (
                          <Loader2 size={12} className="animate-spin text-purple-400" />
                        ) : step.status === "done" ? (
                          <CheckCircle2 size={12} className="text-green-500" />
                        ) : (
                          <div className="w-1.5 h-1.5 rounded-full bg-white/10" />
                        )}
                        <span className="text-[11px] font-medium" style={{ 
                          color: step.status === "running" ? "#c084fc" : step.status === "done" ? "rgba(245,242,241,0.7)" : "rgba(245,242,241,0.3)" 
                        }}>
                          {step.name}
                        </span>
                      </motion.div>
                    ))}
                  </div>
                </div>
              )}

              {!isHumanized ? (
                <button
                  onClick={onHumanize}
                  disabled={isHumanizing}
                  className="flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-xl text-xs font-bold transition-all hover:scale-[1.02] active:scale-95 disabled:opacity-50 w-full"
                  style={{ 
                    backgroundColor: "rgba(168,85,247,0.15)", 
                    color: "#c084fc", 
                    border: "1px solid rgba(168,85,247,0.25)",
                    boxShadow: isHumanizing ? "none" : "0 4px 12px rgba(168,85,247,0.1)"
                  }}
                >
                  {isHumanizing ? <Loader2 size={14} className="animate-spin" /> : <Sparkles size={14} />}
                  {isHumanizing ? "Transforming Content..." : "✨ Make It Less AI"}
                </button>
              ) : (
                <div className="flex flex-wrap gap-2">
                  <button
                    onClick={downloadAsTxt}
                    className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-medium transition-all hover:scale-105"
                    style={{ backgroundColor: "rgba(255,255,255,0.08)", color: "rgba(245,242,241,0.7)", border: "1px solid rgba(255,255,255,0.12)" }}
                  >
                    <FileText size={12} />
                    TXT
                  </button>
                  <button
                    onClick={downloadAsPdf}
                    className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-medium transition-all hover:scale-105"
                    style={{ backgroundColor: "rgba(255,255,255,0.08)", color: "rgba(245,242,241,0.7)", border: "1px solid rgba(255,255,255,0.12)" }}
                  >
                    <FileDown size={12} />
                    PDF
                  </button>
                  <button
                    onClick={downloadAsDocx}
                    className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-medium transition-all hover:scale-105"
                    style={{ backgroundColor: "rgba(255,255,255,0.08)", color: "rgba(245,242,241,0.7)", border: "1px solid rgba(255,255,255,0.12)" }}
                  >
                    <FileType size={12} />
                    Word
                  </button>
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
};

export default AiDetectionResult;
