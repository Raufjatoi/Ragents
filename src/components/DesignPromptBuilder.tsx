import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Loader2, CheckCircle2, Palette, Sparkles, Wand2, Copy, Check,
  LayoutTemplate, Droplets, ScanSearch,
} from "lucide-react";

export type AiTool = "midjourney" | "dalle" | "stable" | "leonardo" | "flux" | "imagen";
export type DesignStage =
  | "style_pick" | "size_pick" | "color_pick"
  | "subject_gen" | "detail_gen" | "final_gen"
  | "done";

interface DesignToolInfo {
  label: string;
  icon: string;
  desc: string;
  color: string;
}

export const aiTools: Record<AiTool, DesignToolInfo> = {
  midjourney: { label: "Midjourney",       icon: "🎨", desc: "Artistic & cinematic",          color: "#7c5cfc" },
  dalle:      { label: "DALL·E",           icon: "🤖", desc: "Photorealistic & concepts",      color: "#10a37f" },
  stable:     { label: "Stable Diffusion", icon: "🔥", desc: "Custom & detailed",              color: "#ff6b35" },
  leonardo:   { label: "Leonardo AI",      icon: "🦁", desc: "Game art & textures",            color: "#e8a838" },
  flux:       { label: "Flux",             icon: "⚡", desc: "Fast & creative",                color: "#00d4ff" },
  imagen:     { label: "Google Imagen",    icon: "🌐", desc: "Natural language, photo-quality", color: "#4285f4" },
};

interface DesignToolSelectorProps {
  selected: AiTool | null;
  onSelect: (tool: AiTool) => void;
}

export const DesignToolSelector = ({ selected, onSelect }: DesignToolSelectorProps) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      className="grid grid-cols-2 gap-2 p-3 rounded-xl sm:grid-cols-3"
      style={{ backgroundColor: "rgba(249,115,22,0.08)", border: "1px solid rgba(249,115,22,0.15)" }}
    >
      {(Object.keys(aiTools) as AiTool[]).map((key) => {
        const t = aiTools[key];
        const isSelected = selected === key;
        return (
          <button
            key={key}
            onClick={() => onSelect(key)}
            className="relative flex flex-col items-center gap-1.5 px-3 py-3 rounded-lg text-xs font-medium transition-all duration-200 hover:scale-105"
            style={{
              backgroundColor: isSelected ? "rgba(249,115,22,0.2)" : "rgba(255,255,255,0.05)",
              border: `1px solid ${isSelected ? t.color + "66" : "rgba(255,255,255,0.08)"}`,
              color: isSelected ? t.color : "rgba(245,242,241,0.6)",
            }}
          >
            {isSelected && (
              <div className="absolute top-1 right-1">
                <CheckCircle2 size={10} style={{ color: t.color }} />
              </div>
            )}
            <span className="text-lg">{t.icon}</span>
            <span className="font-semibold">{t.label}</span>
            <span className="text-[10px] opacity-60 text-center">{t.desc}</span>
          </button>
        );
      })}
    </motion.div>
  );
};

// ── Option arrays ────────────────────────────────────────────────────────────

const styleOptions = [
  { key: "photorealistic",      label: "Photorealistic", desc: "Ultra-detailed photo" },
  { key: "cinematic",           label: "Cinematic",      desc: "Movie-quality shot" },
  { key: "digital illustration",label: "Illustration",   desc: "Digital art style" },
  { key: "oil painting",        label: "Oil Painting",   desc: "Classical painted" },
  { key: "anime",               label: "Anime/Manga",    desc: "Japanese animation" },
  { key: "watercolor",          label: "Watercolor",     desc: "Soft painted wash" },
  { key: "3D render",           label: "3D Render",      desc: "CGI / Blender style" },
  { key: "pencil sketch",       label: "Sketch",         desc: "Hand-drawn pencil" },
  { key: "dark fantasy",        label: "Dark Fantasy",   desc: "Epic & atmospheric" },
  { key: "minimalist",          label: "Minimalist",     desc: "Clean & simple" },
];

const sizeOptions = [
  { key: "1:1",  label: "Square",    desc: "Profile / NFT",      w: 38, h: 38 },
  { key: "16:9", label: "Landscape", desc: "Wallpaper / YouTube", w: 54, h: 30 },
  { key: "9:16", label: "Portrait",  desc: "Story / Reels",       w: 26, h: 46 },
  { key: "4:3",  label: "Classic",   desc: "General use",         w: 46, h: 34 },
  { key: "21:9", label: "Cinematic", desc: "Ultra-wide",          w: 60, h: 26 },
];

const colorOptions = [
  { key: "vibrant and bold colors",       label: "Vibrant",     swatch: ["#ff0080", "#ffcc00", "#00e5ff"] },
  { key: "monochrome black and white",    label: "Monochrome",  swatch: ["#111111", "#888888", "#eeeeee"] },
  { key: "warm tones — reds and oranges", label: "Warm",        swatch: ["#ff4500", "#ff8c00", "#ffd700"] },
  { key: "cool blues and teals",          label: "Cool & Blue", swatch: ["#0077ff", "#00bcd4", "#7c4dff"] },
  { key: "neon cyberpunk palette",        label: "Neon",        swatch: ["#ff00ff", "#00ff9f", "#ff3d00"] },
  { key: "earthy natural tones",          label: "Earthy",      swatch: ["#8b5e3c", "#556b2f", "#d2b48c"] },
  { key: "soft pastel palette",           label: "Pastel",      swatch: ["#ffb3c6", "#c9b1ff", "#b5ead7"] },
  { key: "dark and moody tones",          label: "Dark & Moody",swatch: ["#1a1a2e", "#16213e", "#2d3561"] },
];

// ── Tool steps ────────────────────────────────────────────────────────────────

const toolSteps = [
  { key: "style",   stage: "style_pick",  type: "pick", icon: Palette,        label: "Art Style",        genDesc: "" },
  { key: "size",    stage: "size_pick",   type: "pick", icon: LayoutTemplate,  label: "Canvas Size",      genDesc: "" },
  { key: "color",   stage: "color_pick",  type: "pick", icon: Droplets,        label: "Color Theme",      genDesc: "" },
  { key: "subject", stage: "subject_gen", type: "gen",  icon: ScanSearch,      label: "Subject Analyzer", genDesc: "Analyzing main subject..." },
  { key: "detail",  stage: "detail_gen",  type: "gen",  icon: Sparkles,        label: "Detail Generator", genDesc: "Adding technical details..." },
  { key: "final",   stage: "final_gen",   type: "gen",  icon: Wand2,           label: "Prompt Assembler", genDesc: "Crafting final prompt..." },
];

const stageOrder: DesignStage[] = [
  "style_pick", "size_pick", "color_pick",
  "subject_gen", "detail_gen", "final_gen", "done",
];

// ── Component ────────────────────────────────────────────────────────────────

interface DesignPromptBuilderProps {
  tool: AiTool;
  idea: string;
  styleChoice: string;
  sizeChoice: string;
  colorTheme: string;
  subjectText: string;
  detailText: string;
  finalPrompt: string;
  stage: DesignStage;
  onStylePick: (style: string) => void;
  onSizePick: (size: string) => void;
  onColorPick: (color: string) => void;
}

export const DesignPromptBuilder = ({
  tool, idea, styleChoice, sizeChoice, colorTheme,
  subjectText, detailText, finalPrompt, stage,
  onStylePick, onSizePick, onColorPick,
}: DesignPromptBuilderProps) => {
  const [copied, setCopied] = useState(false);
  const toolInfo = aiTools[tool];
  const isDone = stage === "done";

  const getStatus = (step: typeof toolSteps[number]) => {
    const currentIdx = stageOrder.indexOf(stage);
    const stepIdx = stageOrder.indexOf(step.stage as DesignStage);
    if (currentIdx > stepIdx) return "done";
    if (currentIdx === stepIdx) return step.type === "pick" ? "picking" : "running";
    return "pending";
  };

  const previews = [styleChoice, sizeChoice, colorTheme, subjectText, detailText, finalPrompt];

  const handleCopy = () => {
    navigator.clipboard.writeText(finalPrompt);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const btnBase: React.CSSProperties = {
    backgroundColor: "rgba(255,255,255,0.06)",
    color: "rgba(245,242,241,0.7)",
    border: "1px solid rgba(255,255,255,0.1)",
  };
  const onHover = (e: React.MouseEvent<HTMLButtonElement>) => {
    e.currentTarget.style.backgroundColor = `rgba(${toolInfo.color === "#7c5cfc" ? "124,92,252" : "249,115,22"},0.15)`;
    e.currentTarget.style.borderColor = toolInfo.color + "55";
    e.currentTarget.style.color = toolInfo.color;
  };
  const onLeave = (e: React.MouseEvent<HTMLButtonElement>) => {
    e.currentTarget.style.backgroundColor = btnBase.backgroundColor as string;
    e.currentTarget.style.borderColor = "rgba(255,255,255,0.1)";
    e.currentTarget.style.color = "rgba(245,242,241,0.7)";
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      className="mt-3 rounded-xl p-4 space-y-3"
      style={{ backgroundColor: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.1)" }}
    >
      {/* Header */}
      <div className="flex items-center gap-2">
        <span className="text-lg">{toolInfo.icon}</span>
        <span className="text-xs font-semibold uppercase tracking-wider" style={{ color: toolInfo.color }}>{toolInfo.label} Prompt</span>
        <span className="text-xs truncate max-w-[160px]" style={{ color: "rgba(245,242,241,0.4)" }}>· {idea.slice(0, 40)}{idea.length > 40 ? "…" : ""}</span>
      </div>

      {/* Steps */}
      <div className="space-y-2">
        {toolSteps.map((step, i) => {
          const status = getStatus(step);
          const SIcon = step.icon;
          const isPicking = status === "picking";

          return (
            <div key={step.key} className="space-y-1.5">
              <motion.div
                initial={{ opacity: 0, x: -12 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.06 }}
                className="flex items-center gap-3 px-3 py-2.5 rounded-lg"
                style={{
                  backgroundColor:
                    isPicking ? "rgba(249,115,22,0.08)" :
                    status === "running" ? "rgba(249,115,22,0.1)" :
                    "rgba(255,255,255,0.03)",
                }}
              >
                <div className="p-1.5 rounded-md" style={{
                  backgroundColor:
                    status === "done" ? "rgba(34,197,94,0.15)" :
                    status === "running" ? "rgba(249,115,22,0.2)" :
                    isPicking ? "rgba(249,115,22,0.2)" :
                    "rgba(255,255,255,0.06)",
                }}>
                  {status === "running" ? (
                    <Loader2 size={14} className="animate-spin" style={{ color: "#fb923c" }} />
                  ) : status === "done" ? (
                    <CheckCircle2 size={14} style={{ color: "#22c55e" }} />
                  ) : (
                    <SIcon size={14} style={{ color: isPicking ? "#fb923c" : "rgba(245,242,241,0.3)" }} />
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-medium" style={{
                    color: status === "done" ? "rgba(245,242,241,0.85)" :
                      status === "running" ? "#fb923c" :
                      isPicking ? "#fb923c" : "rgba(245,242,241,0.4)",
                  }}>
                    {step.label}
                  </p>
                  {status === "running" && (
                    <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-xs italic" style={{ color: "rgba(249,115,22,0.6)" }}>
                      {step.genDesc}
                    </motion.p>
                  )}
                  {status === "done" && previews[i] && (
                    <p className="text-xs mt-0.5 line-clamp-1" style={{ color: "rgba(245,242,241,0.45)" }}>
                      {previews[i].slice(0, 80)}{previews[i].length > 80 ? "…" : ""}
                    </p>
                  )}
                </div>
              </motion.div>

              {/* Style picker — 5-col grid */}
              {isPicking && step.key === "style" && (
                <motion.div initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }} className="grid grid-cols-5 gap-1.5 pl-10">
                  {styleOptions.map((opt) => (
                    <button
                      key={opt.key}
                      onClick={() => onStylePick(opt.key)}
                      className="flex flex-col items-start px-2 py-2 rounded-lg transition-all hover:scale-105"
                      style={btnBase}
                      onMouseEnter={onHover}
                      onMouseLeave={onLeave}
                    >
                      <p className="text-[11px] font-semibold">{opt.label}</p>
                      <p className="text-[9px] opacity-60 mt-0.5">{opt.desc}</p>
                    </button>
                  ))}
                </motion.div>
              )}

              {/* Size picker — visual proportional boxes */}
              {isPicking && step.key === "size" && (
                <motion.div initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }} className="flex gap-3 pl-10 flex-wrap">
                  {sizeOptions.map((opt) => (
                    <button
                      key={opt.key}
                      onClick={() => onSizePick(opt.key)}
                      className="flex flex-col items-center gap-1.5 px-3 py-2.5 rounded-lg transition-all hover:scale-105"
                      style={btnBase}
                      onMouseEnter={onHover}
                      onMouseLeave={onLeave}
                    >
                      {/* Visual aspect ratio box */}
                      <div
                        style={{
                          width: opt.w,
                          height: opt.h,
                          border: "1.5px solid rgba(249,115,22,0.4)",
                          borderRadius: 3,
                          backgroundColor: "rgba(249,115,22,0.08)",
                        }}
                      />
                      <p className="text-[11px] font-semibold">{opt.label}</p>
                      <p className="text-[9px] opacity-55">{opt.desc}</p>
                    </button>
                  ))}
                </motion.div>
              )}

              {/* Color picker — 4-col grid with swatches */}
              {isPicking && step.key === "color" && (
                <motion.div initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }} className="grid grid-cols-4 gap-1.5 pl-10">
                  {colorOptions.map((opt) => (
                    <button
                      key={opt.key}
                      onClick={() => onColorPick(opt.key)}
                      className="flex flex-col items-start gap-1.5 px-2.5 py-2 rounded-lg transition-all hover:scale-105"
                      style={btnBase}
                      onMouseEnter={onHover}
                      onMouseLeave={onLeave}
                    >
                      <div className="flex gap-0.5">
                        {opt.swatch.map((c, si) => (
                          <div key={si} style={{ width: 10, height: 10, borderRadius: 2, backgroundColor: c }} />
                        ))}
                      </div>
                      <p className="text-[10px] font-semibold">{opt.label}</p>
                    </button>
                  ))}
                </motion.div>
              )}
            </div>
          );
        })}
      </div>

      {/* Done state */}
      <AnimatePresence>
        {isDone && finalPrompt && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-3 pt-3"
            style={{ borderTop: "1px solid rgba(255,255,255,0.08)" }}
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Sparkles size={13} style={{ color: toolInfo.color }} />
                <p className="text-xs font-semibold uppercase tracking-wider" style={{ color: toolInfo.color }}>Final Prompt</p>
              </div>
              <button
                onClick={handleCopy}
                className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-medium transition-all hover:scale-105"
                style={{ backgroundColor: "rgba(249,115,22,0.2)", color: "#fb923c", border: "1px solid rgba(249,115,22,0.3)" }}
              >
                {copied ? <Check size={12} /> : <Copy size={12} />}
                {copied ? "Copied!" : "Copy"}
              </button>
            </div>

            {/* Metadata pills */}
            <div className="flex gap-1.5 flex-wrap">
              {[styleChoice, sizeChoice, colorTheme].filter(Boolean).map((tag, i) => (
                <span
                  key={i}
                  className="text-[10px] px-2 py-0.5 rounded-full capitalize"
                  style={{ backgroundColor: "rgba(255,255,255,0.08)", color: "rgba(245,242,241,0.6)" }}
                >
                  {tag}
                </span>
              ))}
            </div>

            {/* Final prompt */}
            <div
              className="rounded-lg p-4 text-sm leading-relaxed font-medium"
              style={{ backgroundColor: "rgba(255,255,255,0.04)", color: toolInfo.color }}
            >
              {finalPrompt}
            </div>

            {/* Sub-analysis breakdown */}
            {(subjectText || detailText) && (
              <div className="space-y-1 pt-1">
                {subjectText && (
                  <p className="text-[11px]" style={{ color: "rgba(245,242,241,0.35)" }}>
                    <span style={{ color: "rgba(245,242,241,0.5)" }}>Subject: </span>{subjectText}
                  </p>
                )}
                {detailText && (
                  <p className="text-[11px]" style={{ color: "rgba(245,242,241,0.35)" }}>
                    <span style={{ color: "rgba(245,242,241,0.5)" }}>Details: </span>{detailText}
                  </p>
                )}
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
};
