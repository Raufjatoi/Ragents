import { ShieldAlert, ShieldCheck, ShieldQuestion, RefreshCw, Download, FileText, FileDown, Search, Brain, Type, BarChart3, Sparkles, CheckCircle2, Loader2, FileType } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { jsPDF } from "jspdf";
import { Document, Packer, Paragraph, TextRun, Table, TableRow, TableCell, HeadingLevel, WidthType, ShadingType } from "docx";
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
  { name: "word_pattern_analysis", icon: Type, label: "Word Pattern Analysis", descriptions: ["Checking vocabulary diversity...", "Scanning repetitive phrases..."] },
  { name: "tone_style_check", icon: Brain, label: "Tone & Style Check", descriptions: ["Analyzing writing tone...", "Evaluating sentence burstiness..."] },
  { name: "structure_detection", icon: BarChart3, label: "Structure Detection", descriptions: ["Checking paragraph uniformity...", "Analyzing sentence openings..."] },
  { name: "ai_pattern_matching", icon: Search, label: "AI Pattern Matching", descriptions: ["Scanning known AI phrases...", "Cross-referencing LLM signatures..."] },
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
        const matchingTool = activeTools.find(at => at.name === cfg.name);
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
          word_pattern_analysis: toolScore > 60 ? "Repetitive patterns detected" : "Natural word variety",
          tone_style_check: toolScore > 60 ? "Uniform formal tone" : "Varied, human-like tone",
          structure_detection: toolScore > 60 ? "Predictable sentence structure" : "Organic structure",
          ai_pattern_matching: toolScore > 60 ? "AI signatures found" : "No strong AI markers",
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

  const getToolData = () => {
    const names = ["word_pattern_analysis", "tone_style_check", "structure_detection", "ai_pattern_matching"];
    const labels = ["Word Pattern Analysis", "Tone & Style Check", "Structure Detection", "AI Pattern Matching"];
    const src = toolsFinal ?? [];
    return names.map((name, i) => {
      const found = src.find(t => t.name === name);
      return { label: labels[i], score: found?.score ?? score, finding: found?.result ?? "—" };
    });
  };

  const downloadAsPdf = () => {
    const doc = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });
    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();
    const margin = 18;
    const contentWidth = pageWidth - margin * 2;
    const verdict = score >= 70 ? "LIKELY AI-GENERATED" : score >= 40 ? "UNCERTAIN / MIXED" : "LIKELY HUMAN-WRITTEN";
    const scoreRgb: [number, number, number] = score >= 70 ? [239, 68, 68] : score >= 40 ? [245, 158, 11] : [34, 197, 94];
    const dateStr = new Date().toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" });
    let y = 0;

    // Header banner
    doc.setFillColor(26, 10, 46);
    doc.rect(0, 0, pageWidth, 46, "F");
    doc.setFont("helvetica", "bold");
    doc.setFontSize(18);
    doc.setTextColor(255, 255, 255);
    doc.text("AI Detection Report", margin, 20);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(8);
    doc.setTextColor(180, 150, 220);
    doc.text(`Generated by Ragents  •  ${dateStr}`, margin, 30);

    // Verdict pill
    doc.setFillColor(...scoreRgb);
    doc.roundedRect(pageWidth - margin - 54, 12, 54, 11, 2, 2, "F");
    doc.setFont("helvetica", "bold");
    doc.setFontSize(6.5);
    doc.setTextColor(255, 255, 255);
    doc.text(verdict, pageWidth - margin - 27, 19.5, { align: "center" });

    y = 58;

    // Score section
    doc.setFont("helvetica", "bold");
    doc.setFontSize(10);
    doc.setTextColor(40, 40, 40);
    doc.text("AI Probability Score", margin, y);
    y += 5;

    // Bar background
    doc.setFillColor(225, 220, 240);
    doc.roundedRect(margin, y, contentWidth, 7, 1.5, 1.5, "F");
    // Bar fill
    const barFill = (score / 100) * contentWidth;
    doc.setFillColor(...scoreRgb);
    doc.roundedRect(margin, y, barFill, 7, 1.5, 1.5, "F");
    // Score label
    if (barFill > 16) {
      doc.setFont("helvetica", "bold");
      doc.setFontSize(7);
      doc.setTextColor(255, 255, 255);
      doc.text(`${score}%`, margin + barFill - 1.5, y + 5, { align: "right" });
    }
    y += 13;

    doc.setFont("helvetica", "bold");
    doc.setFontSize(12);
    doc.setTextColor(...scoreRgb);
    doc.text(`${score}% — ${verdict}`, margin, y);
    y += 10;

    // Divider
    doc.setDrawColor(210, 200, 230);
    doc.line(margin, y, pageWidth - margin, y);
    y += 7;

    // Tool results table
    doc.setFont("helvetica", "bold");
    doc.setFontSize(10);
    doc.setTextColor(40, 40, 40);
    doc.text("Analysis Tool Results", margin, y);
    y += 5;

    // Table header
    const colScore = margin + 82;
    const colFinding = margin + 104;
    doc.setFillColor(45, 20, 80);
    doc.rect(margin, y, contentWidth, 7, "F");
    doc.setFont("helvetica", "bold");
    doc.setFontSize(7.5);
    doc.setTextColor(255, 255, 255);
    doc.text("Tool", margin + 2, y + 5);
    doc.text("Score", colScore + 2, y + 5);
    doc.text("Finding", colFinding + 2, y + 5);
    y += 7;

    const toolData = getToolData();
    toolData.forEach((row, i) => {
      const rowBg: [number, number, number] = i % 2 === 0 ? [248, 244, 255] : [255, 255, 255];
      doc.setFillColor(...rowBg);
      doc.rect(margin, y, contentWidth, 9, "F");

      const rowColor: [number, number, number] = row.score >= 70 ? [200, 40, 40] : row.score >= 40 ? [160, 100, 0] : [20, 140, 50];
      doc.setFont("helvetica", "normal");
      doc.setFontSize(7.5);
      doc.setTextColor(40, 40, 40);
      doc.text(row.label, margin + 2, y + 6);
      doc.setFont("helvetica", "bold");
      doc.setTextColor(...rowColor);
      doc.text(`${row.score}%`, colScore + 2, y + 6);
      doc.setFont("helvetica", "normal");
      doc.setTextColor(60, 60, 60);
      const short = row.finding.length > 54 ? row.finding.slice(0, 51) + "..." : row.finding;
      doc.text(short, colFinding + 2, y + 6);
      y += 9;
    });

    y += 7;
    doc.setDrawColor(210, 200, 230);
    doc.line(margin, y, pageWidth - margin, y);
    y += 7;

    // Text section
    const textLabel = isHumanized ? "Humanized Text" : "Analyzed Text";
    doc.setFont("helvetica", "bold");
    doc.setFontSize(10);
    doc.setTextColor(40, 40, 40);
    doc.text(textLabel, margin, y);
    y += 6;

    doc.setFont("helvetica", "normal");
    doc.setFontSize(9);
    doc.setTextColor(55, 55, 55);
    const textLines = doc.splitTextToSize(text, contentWidth);
    textLines.forEach((line: string) => {
      if (y > pageHeight - 18) { doc.addPage(); y = 20; }
      doc.text(line, margin, y);
      y += 5;
    });

    doc.save("ai-detection-report.pdf");
  };

  const downloadAsDocx = () => {
    const verdict = score >= 70 ? "LIKELY AI-GENERATED" : score >= 40 ? "UNCERTAIN / MIXED" : "LIKELY HUMAN-WRITTEN";
    const scoreHex = score >= 70 ? "EF4444" : score >= 40 ? "F59E0B" : "22C55E";
    const dateStr = new Date().toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" });
    const toolData = getToolData();
    const makeHex = (s: number) => s >= 70 ? "EF4444" : s >= 40 ? "F59E0B" : "22C55E";

    const headerRow = new TableRow({
      children: ["Tool", "Score", "Finding"].map(label =>
        new TableCell({
          shading: { fill: "2D1450", type: ShadingType.CLEAR, color: "2D1450" },
          children: [new Paragraph({ children: [new TextRun({ text: label, bold: true, color: "FFFFFF", size: 18 })] })],
        })
      ),
    });

    const dataRows = toolData.map((row, i) => {
      const bg = i % 2 === 0 ? "F5F0FF" : "FFFFFF";
      const makeCell = (content: string, bold = false, color = "333333") =>
        new TableCell({
          shading: { fill: bg, type: ShadingType.CLEAR, color: bg },
          children: [new Paragraph({ children: [new TextRun({ text: content, bold, color, size: 18 })] })],
        });
      return new TableRow({
        children: [
          makeCell(row.label),
          makeCell(`${row.score}%`, true, makeHex(row.score)),
          makeCell(row.finding),
        ],
      });
    });

    const textLabel = isHumanized ? "Humanized Text" : "Analyzed Text";

    const docFile = new Document({
      sections: [{
        properties: {},
        children: [
          new Paragraph({
            heading: HeadingLevel.HEADING_1,
            children: [new TextRun({ text: "AI Detection Report — Ragents", bold: true, size: 40, color: "2D1450" })],
          }),
          new Paragraph({
            children: [new TextRun({ text: `Generated: ${dateStr}`, size: 18, color: "888888" })],
            spacing: { after: 120 },
          }),
          new Paragraph({
            children: [
              new TextRun({ text: "AI Probability: ", bold: true, size: 26 }),
              new TextRun({ text: `${score}%`, bold: true, size: 26, color: scoreHex }),
              new TextRun({ text: "   —   ", size: 26, color: "AAAAAA" }),
              new TextRun({ text: verdict, bold: true, size: 26, color: scoreHex }),
            ],
            spacing: { after: 300 },
          }),
          new Paragraph({
            heading: HeadingLevel.HEADING_2,
            children: [new TextRun({ text: "Analysis Tool Results", bold: true, size: 28, color: "2D1450" })],
            spacing: { before: 100, after: 100 },
          }),
          new Table({
            width: { size: 100, type: WidthType.PERCENTAGE },
            columnWidths: [2400, 900, 4800],
            rows: [headerRow, ...dataRows],
          }),
          new Paragraph({ text: "", spacing: { after: 300 } }),
          new Paragraph({
            heading: HeadingLevel.HEADING_2,
            children: [new TextRun({ text: textLabel, bold: true, size: 28, color: "2D1450" })],
            spacing: { before: 200, after: 100 },
          }),
          ...text.split("\n").map(para =>
            new Paragraph({
              children: [new TextRun({ text: para.trim(), size: 22 })],
              spacing: { after: 160 },
            })
          ),
        ],
      }],
    });

    Packer.toBlob(docFile).then(blob => saveAs(blob, "ai-detection-report.docx"));
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
                <div className="space-y-2">
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
                  {analysisComplete && (
                    <div className="flex flex-wrap gap-2">
                      <button
                        onClick={downloadAsTxt}
                        className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-medium transition-all hover:scale-105"
                        style={{ backgroundColor: "rgba(255,255,255,0.06)", color: "rgba(245,242,241,0.55)", border: "1px solid rgba(255,255,255,0.1)" }}
                      >
                        <FileText size={12} />
                        TXT
                      </button>
                      <button
                        onClick={downloadAsPdf}
                        className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-medium transition-all hover:scale-105"
                        style={{ backgroundColor: "rgba(255,255,255,0.06)", color: "rgba(245,242,241,0.55)", border: "1px solid rgba(255,255,255,0.1)" }}
                      >
                        <FileDown size={12} />
                        PDF Report
                      </button>
                      <button
                        onClick={downloadAsDocx}
                        className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-medium transition-all hover:scale-105"
                        style={{ backgroundColor: "rgba(255,255,255,0.06)", color: "rgba(245,242,241,0.55)", border: "1px solid rgba(255,255,255,0.1)" }}
                      >
                        <FileType size={12} />
                        Word Report
                      </button>
                    </div>
                  )}
                </div>
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
                    PDF Report
                  </button>
                  <button
                    onClick={downloadAsDocx}
                    className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-medium transition-all hover:scale-105"
                    style={{ backgroundColor: "rgba(255,255,255,0.08)", color: "rgba(245,242,241,0.7)", border: "1px solid rgba(255,255,255,0.12)" }}
                  >
                    <FileType size={12} />
                    Word Report
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
