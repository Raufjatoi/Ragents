import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Loader2, CheckCircle2, Palette, Layers, Sun, Camera, Sparkles, Wand2, Copy, Check, Image } from "lucide-react";

export type AiTool = "midjourney" | "dalle" | "stable" | "leonardo" | "flux";
export type DesignStage = "tool_pick" | "style_gen" | "color_gen" | "lighting_gen" | "compose_gen" | "final_gen" | "done";

interface DesignToolInfo {
  label: string;
  icon: string;
  desc: string;
  color: string;
}

export const aiTools: Record<AiTool, DesignToolInfo> = {
  midjourney: { label: "Midjourney", icon: "🎨", desc: "Best for artistic & cinematic", color: "#7c5cfc" },
  dalle: { label: "DALL·E", icon: "🤖", desc: "Best for photorealistic & concepts", color: "#10a37f" },
  stable: { label: "Stable Diffusion", icon: "🔥", desc: "Best for custom & detailed", color: "#ff6b35" },
  leonardo: { label: "Leonardo AI", icon: "🦁", desc: "Best for game art & textures", color: "#e8a838" },
  flux: { label: "Flux", icon: "⚡", desc: "Best for fast & creative", color: "#00d4ff" },
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

interface DesignPromptBuilderProps {
  tool: AiTool;
  idea: string;
  styleText: string;
  colorText: string;
  lightingText: string;
  composeText: string;
  finalPrompt: string;
  stage: DesignStage;
}

const toolSteps = [
  { key: "style", stage: "style_gen", icon: Palette, label: "Style Analyzer", desc: "Determining art style & medium..." },
  { key: "color", stage: "color_gen", icon: Layers, label: "Color Palette Engine", desc: "Building color palette & gradients..." },
  { key: "lighting", stage: "lighting_gen", icon: Sun, label: "Lighting Designer", desc: "Setting mood lighting & atmosphere..." },
  { key: "compose", stage: "compose_gen", icon: Camera, label: "Composition Planner", desc: "Planning camera angle & layout..." },
  { key: "final", stage: "final_gen", icon: Wand2, label: "Prompt Assembler", desc: "Crafting final optimized prompt..." },
];

export const DesignPromptBuilder = ({
  tool, idea, styleText, colorText, lightingText, composeText, finalPrompt, stage,
}: DesignPromptBuilderProps) => {
  const [copied, setCopied] = useState(false);
  const toolInfo = aiTools[tool];
  const isDone = stage === "done";

  const stageOrder: DesignStage[] = ["tool_pick", "style_gen", "color_gen", "lighting_gen", "compose_gen", "final_gen", "done"];
  const currentIdx = stageOrder.indexOf(stage);

  const getStatus = (stepStage: string) => {
    const stepIdx = stageOrder.indexOf(stepStage as DesignStage);
    if (currentIdx > stepIdx) return "done";
    if (currentIdx === stepIdx) return "running";
    return "pending";
  };

  const previews = [styleText, colorText, lightingText, composeText, finalPrompt];

  const handleCopy = () => {
    navigator.clipboard.writeText(finalPrompt);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      className="mt-3 rounded-xl p-4 space-y-3"
      style={{ backgroundColor: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.1)" }}
    >
      <div className="flex items-center gap-2">
        <span className="text-lg">{toolInfo.icon}</span>
        <span className="text-xs font-semibold uppercase tracking-wider" style={{ color: toolInfo.color }}>{toolInfo.label} Prompt</span>
        <span className="text-xs" style={{ color: "rgba(245,242,241,0.4)" }}>· {idea.slice(0, 40)}{idea.length > 40 ? "..." : ""}</span>
      </div>

      <div className="space-y-2">
        {toolSteps.map((step, i) => {
          const status = getStatus(step.stage);
          const SIcon = step.icon;
          return (
            <motion.div
              key={step.key}
              initial={{ opacity: 0, x: -12 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: i * 0.08 }}
              className="flex items-center gap-3 px-3 py-2.5 rounded-lg"
              style={{ backgroundColor: status === "running" ? "rgba(249,115,22,0.1)" : "rgba(255,255,255,0.03)" }}
            >
              <div className="p-1.5 rounded-md" style={{
                backgroundColor: status === "done" ? "rgba(34,197,94,0.15)" : status === "running" ? "rgba(249,115,22,0.2)" : "rgba(255,255,255,0.06)",
              }}>
                {status === "running" ? (
                  <Loader2 size={14} className="animate-spin" style={{ color: "#fb923c" }} />
                ) : status === "done" ? (
                  <CheckCircle2 size={14} style={{ color: "#22c55e" }} />
                ) : (
                  <SIcon size={14} style={{ color: "rgba(245,242,241,0.3)" }} />
                )}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-xs font-medium" style={{
                  color: status === "done" ? "rgba(245,242,241,0.85)" : status === "running" ? "#fb923c" : "rgba(245,242,241,0.4)",
                }}>
                  {step.label}
                </p>
                {status === "running" && (
                  <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-xs italic" style={{ color: "rgba(249,115,22,0.6)" }}>
                    {step.desc}
                  </motion.p>
                )}
                {status === "done" && previews[i] && (
                  <p className="text-xs mt-0.5 line-clamp-1" style={{ color: "rgba(245,242,241,0.45)" }}>{previews[i].slice(0, 80)}...</p>
                )}
              </div>
            </motion.div>
          );
        })}
      </div>

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
                <Sparkles size={14} style={{ color: toolInfo.color }} />
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
            <div className="rounded-lg p-4 text-sm leading-relaxed" style={{ backgroundColor: "rgba(255,255,255,0.04)", color: "rgba(245,242,241,0.85)" }}>
              <div className="pb-3 mb-3" style={{ borderBottom: "1px solid rgba(255,255,255,0.06)" }}>
                <p className="text-[10px] font-semibold uppercase tracking-widest mb-1" style={{ color: "rgba(245,242,241,0.3)" }}>Art Style</p>
                <p>{styleText}</p>
              </div>
              <div className="pb-3 mb-3" style={{ borderBottom: "1px solid rgba(255,255,255,0.06)" }}>
                <p className="text-[10px] font-semibold uppercase tracking-widest mb-1" style={{ color: "rgba(245,242,241,0.3)" }}>Color Palette</p>
                <p>{colorText}</p>
              </div>
              <div className="pb-3 mb-3" style={{ borderBottom: "1px solid rgba(255,255,255,0.06)" }}>
                <p className="text-[10px] font-semibold uppercase tracking-widest mb-1" style={{ color: "rgba(245,242,241,0.3)" }}>Lighting & Mood</p>
                <p>{lightingText}</p>
              </div>
              <div className="pb-3 mb-3" style={{ borderBottom: "1px solid rgba(255,255,255,0.06)" }}>
                <p className="text-[10px] font-semibold uppercase tracking-widest mb-1" style={{ color: "rgba(245,242,241,0.3)" }}>Composition</p>
                <p>{composeText}</p>
              </div>
              <div>
                <p className="text-[10px] font-semibold uppercase tracking-widest mb-1" style={{ color: toolInfo.color }}>✨ Ready-to-Use Prompt</p>
                <p className="font-medium" style={{ color: toolInfo.color }}>{finalPrompt}</p>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
};
