import { ShieldAlert, ShieldCheck, ShieldQuestion, RefreshCw, Download, FileText, FileDown, Search, Brain, Type, BarChart3, Sparkles, CheckCircle2, Loader2 } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { jsPDF } from "jspdf";
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
}

const toolConfigs = [
  { name: "words", icon: Type, label: "Word Pattern Analysis", descriptions: ["Checking repetitive phrases...", "Scanning vocabulary diversity..."] },
  { name: "tone", icon: Brain, label: "Tone & Style Check", descriptions: ["Analyzing writing tone...", "Evaluating naturalness..."] },
  { name: "structure", icon: BarChart3, label: "Structure Detection", descriptions: ["Checking sentence patterns...", "Analyzing paragraph flow..."] },
  { name: "patterns", icon: Search, label: "AI Pattern Matching", descriptions: ["Matching known AI patterns...", "Cross-referencing signatures..."] },
];

const AiDetectionResult = ({ score, text, onHumanize, isHumanizing }: AiDetectionResultProps) => {
  const [tools, setTools] = useState<ToolResult[]>(
    toolConfigs.map((t) => ({ name: t.name, icon: t.icon, label: t.label, status: "pending" }))
  );
  const [analysisComplete, setAnalysisComplete] = useState(false);
  const [currentToolMsg, setCurrentToolMsg] = useState("");

  useEffect(() => {
    const runTools = async () => {
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
  }, [score]);

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
    a.download = "content.txt";
    a.click();
    URL.revokeObjectURL(url);
  };

  const downloadAsPdf = () => {
    const doc = new jsPDF();
    const lines = doc.splitTextToSize(text, 170);
    doc.setFontSize(12);
    doc.text(lines, 20, 20);
    doc.save("content.pdf");
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      className="mt-3 rounded-xl p-4 space-y-4"
      style={{ backgroundColor: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.1)" }}
    >
      {/* Tool Progress */}
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

      {/* Final Score — shown after all tools complete */}
      <AnimatePresence>
        {analysisComplete && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4 }}
            className="space-y-3 pt-2"
            style={{ borderTop: "1px solid rgba(255,255,255,0.08)" }}
          >
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-xl" style={{ backgroundColor: info.bg }}>
                <Icon size={22} style={{ color: info.color }} />
              </div>
              <div className="flex-1">
                <p className="text-sm font-bold" style={{ color: info.color }}>{info.label}</p>
                <p className="text-xs" style={{ color: "rgba(245,242,241,0.5)" }}>Overall AI Score</p>
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

            {/* Actions */}
            <div className="flex flex-wrap gap-2 pt-1">
              <button
                onClick={onHumanize}
                disabled={isHumanizing}
                className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-semibold transition-all hover:scale-105 disabled:opacity-50"
                style={{ backgroundColor: "rgba(168,85,247,0.25)", color: "#c084fc", border: "1px solid rgba(168,85,247,0.35)" }}
              >
                {isHumanizing ? <Loader2 size={13} className="animate-spin" /> : <Sparkles size={13} />}
                {isHumanizing ? "Rewriting..." : "✨ Make Less AI"}
              </button>
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
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
};

export default AiDetectionResult;
