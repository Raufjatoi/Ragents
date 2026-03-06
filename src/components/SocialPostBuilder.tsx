import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Loader2, CheckCircle2, Zap, AlignLeft, FileCheck, Megaphone, Copy, Check, Minus, Equal, AlignJustify } from "lucide-react";
import { platforms, type Platform } from "./PlatformSelector";

export type LengthPref = "short" | "medium" | "long";
export type SocialStage = "hook_pick" | "hook_gen" | "desc_pick" | "desc_gen" | "final_pick" | "final_gen" | "cta_ask" | "cta_gen" | "done";

interface SocialPostBuilderProps {
  platform: Platform;
  topic: string;
  hookText: string;
  descriptionText: string;
  finalText: string;
  ctaText: string;
  stage: SocialStage;
  onLengthPick: (step: "hook" | "description" | "finalize", pref: LengthPref) => void;
  onAddCta: () => void;
  onSkipCta: () => void;
}

const lengthOptions: { key: LengthPref; icon: React.ElementType; label: string; desc: string }[] = [
  { key: "short", icon: Minus, label: "Short", desc: "Punchy & quick" },
  { key: "medium", icon: Equal, label: "Medium", desc: "Balanced" },
  { key: "long", icon: AlignJustify, label: "Long", desc: "Detailed" },
];

const toolSteps = [
  { key: "hook", pickStage: "hook_pick", genStage: "hook_gen", icon: Zap, label: "Hook Generator", genDesc: "Crafting opener..." },
  { key: "description", pickStage: "desc_pick", genStage: "desc_gen", icon: AlignLeft, label: "Description Writer", genDesc: "Writing body..." },
  { key: "finalize", pickStage: "final_pick", genStage: "final_gen", icon: FileCheck, label: "Post Finalizer", genDesc: "Polishing post..." },
  { key: "cta", pickStage: "cta_ask", genStage: "cta_gen", icon: Megaphone, label: "CTA Engine", genDesc: "Generating CTA..." },
];

const SocialPostBuilder = ({
  platform, topic, hookText, descriptionText, finalText, ctaText,
  stage, onLengthPick, onAddCta, onSkipCta,
}: SocialPostBuilderProps) => {
  const [copied, setCopied] = useState(false);
  const platInfo = platforms[platform];
  const isDone = stage === "done";

  const getStatus = (step: typeof toolSteps[number]) => {
    const stageOrder: SocialStage[] = ["hook_pick", "hook_gen", "desc_pick", "desc_gen", "final_pick", "final_gen", "cta_ask", "cta_gen", "done"];
    const currentIdx = stageOrder.indexOf(stage);
    const pickIdx = stageOrder.indexOf(step.pickStage as SocialStage);
    const genIdx = stageOrder.indexOf(step.genStage as SocialStage);
    if (currentIdx > genIdx) return "done";
    if (currentIdx === genIdx) return "running";
    if (currentIdx === pickIdx) return "picking";
    if (currentIdx > pickIdx) return "done";
    return "pending";
  };

  const handleCopy = () => {
    const full = [hookText, descriptionText, finalText, ctaText].filter(Boolean).join("\n\n");
    navigator.clipboard.writeText(full);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const getPreview = (idx: number) => {
    const texts = [hookText, descriptionText, finalText, ctaText];
    return texts[idx] ? texts[idx].slice(0, 100) + (texts[idx].length > 100 ? "..." : "") : "";
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
        <span className="text-lg">{platInfo.icon}</span>
        <span className="text-xs font-semibold uppercase tracking-wider" style={{ color: platInfo.color }}>{platInfo.label} Post</span>
        <span className="text-xs" style={{ color: "rgba(245,242,241,0.4)" }}>· {topic}</span>
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
                    status === "running" ? "rgba(34,197,94,0.1)" :
                    "rgba(255,255,255,0.03)",
                }}
              >
                <div className="p-1.5 rounded-md" style={{
                  backgroundColor:
                    status === "done" ? "rgba(34,197,94,0.15)" :
                    status === "running" ? "rgba(34,197,94,0.2)" :
                    isPicking ? "rgba(249,115,22,0.2)" :
                    "rgba(255,255,255,0.06)",
                }}>
                  {status === "running" ? (
                    <Loader2 size={14} className="animate-spin" style={{ color: "#4ade80" }} />
                  ) : status === "done" ? (
                    <CheckCircle2 size={14} style={{ color: "#22c55e" }} />
                  ) : (
                    <SIcon size={14} style={{ color: isPicking ? "#fb923c" : "rgba(245,242,241,0.3)" }} />
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-medium" style={{
                    color: status === "done" ? "rgba(245,242,241,0.85)" :
                      status === "running" ? "#4ade80" :
                      isPicking ? "#fb923c" : "rgba(245,242,241,0.4)",
                  }}>
                    {step.label}
                  </p>
                  {status === "running" && (
                    <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-xs italic" style={{ color: "rgba(34,197,94,0.6)" }}>
                      {step.genDesc}
                    </motion.p>
                  )}
                  {status === "done" && getPreview(i) && (
                    <p className="text-xs mt-0.5 line-clamp-2" style={{ color: "rgba(245,242,241,0.45)" }}>{getPreview(i)}</p>
                  )}
                </div>
              </motion.div>

              {/* Length picker for hook/desc/finalize */}
              {isPicking && step.key !== "cta" && (
                <motion.div
                  initial={{ opacity: 0, y: -4 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="flex gap-2 pl-10"
                >
                  {lengthOptions.map((opt) => {
                    const OIcon = opt.icon;
                    return (
                      <button
                        key={opt.key}
                        onClick={() => onLengthPick(step.key as "hook" | "description" | "finalize", opt.key)}
                        className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-medium transition-all hover:scale-105"
                        style={{
                          backgroundColor: "rgba(255,255,255,0.06)",
                          color: "rgba(245,242,241,0.7)",
                          border: "1px solid rgba(255,255,255,0.1)",
                        }}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.backgroundColor = "rgba(34,197,94,0.15)";
                          e.currentTarget.style.color = "#4ade80";
                          e.currentTarget.style.borderColor = "rgba(34,197,94,0.3)";
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.backgroundColor = "rgba(255,255,255,0.06)";
                          e.currentTarget.style.color = "rgba(245,242,241,0.7)";
                          e.currentTarget.style.borderColor = "rgba(255,255,255,0.1)";
                        }}
                      >
                        <OIcon size={12} />
                        <div className="text-left">
                          <p className="font-semibold">{opt.label}</p>
                          <p className="text-[10px] opacity-60">{opt.desc}</p>
                        </div>
                      </button>
                    );
                  })}
                </motion.div>
              )}

              {/* CTA ask */}
              {isPicking && step.key === "cta" && (
                <motion.div initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }} className="flex gap-2 pl-10">
                  <button
                    onClick={onAddCta}
                    className="flex items-center gap-1.5 px-4 py-2 rounded-lg text-xs font-semibold transition-all hover:scale-105"
                    style={{ backgroundColor: "rgba(34,197,94,0.25)", color: "#4ade80", border: "1px solid rgba(34,197,94,0.35)" }}
                  >
                    <Megaphone size={13} />
                    Yes, add CTA!
                  </button>
                  <button
                    onClick={onSkipCta}
                    className="flex items-center gap-1.5 px-4 py-2 rounded-lg text-xs font-medium transition-all hover:scale-105"
                    style={{ backgroundColor: "rgba(255,255,255,0.08)", color: "rgba(245,242,241,0.6)", border: "1px solid rgba(255,255,255,0.1)" }}
                  >
                    Skip
                  </button>
                </motion.div>
              )}
            </div>
          );
        })}
      </div>

      {/* Final Result */}
      <AnimatePresence>
        {isDone && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-3 pt-3"
            style={{ borderTop: "1px solid rgba(255,255,255,0.08)" }}
          >
            <div className="flex items-center justify-between">
              <p className="text-xs font-semibold uppercase tracking-wider" style={{ color: platInfo.color }}>✨ Final Post</p>
              <button
                onClick={handleCopy}
                className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-medium transition-all hover:scale-105"
                style={{ backgroundColor: "rgba(34,197,94,0.2)", color: "#4ade80", border: "1px solid rgba(34,197,94,0.3)" }}
              >
                {copied ? <Check size={12} /> : <Copy size={12} />}
                {copied ? "Copied!" : "Copy"}
              </button>
            </div>
            <div className="rounded-lg p-4 text-sm leading-relaxed" style={{ backgroundColor: "rgba(255,255,255,0.04)", color: "rgba(245,242,241,0.85)" }}>
              {hookText && (
                <div className="pb-3 mb-3" style={{ borderBottom: "1px solid rgba(255,255,255,0.06)" }}>
                  <p className="text-[10px] font-semibold uppercase tracking-widest mb-1" style={{ color: "rgba(245,242,241,0.3)" }}>Hook</p>
                  <p className="font-semibold">{hookText}</p>
                </div>
              )}
              {descriptionText && (
                <div className="pb-3 mb-3" style={{ borderBottom: "1px solid rgba(255,255,255,0.06)" }}>
                  <p className="text-[10px] font-semibold uppercase tracking-widest mb-1" style={{ color: "rgba(245,242,241,0.3)" }}>Description</p>
                  <p>{descriptionText}</p>
                </div>
              )}
              {finalText && (
                <div className={ctaText ? "pb-3 mb-3" : ""} style={ctaText ? { borderBottom: "1px solid rgba(255,255,255,0.06)" } : {}}>
                  <p className="text-[10px] font-semibold uppercase tracking-widest mb-1" style={{ color: "rgba(245,242,241,0.3)" }}>Closing & Hashtags</p>
                  <p>{finalText}</p>
                </div>
              )}
              {ctaText && (
                <div>
                  <p className="text-[10px] font-semibold uppercase tracking-widest mb-1" style={{ color: "rgba(245,242,241,0.3)" }}>Call to Action</p>
                  <p className="font-medium" style={{ color: platInfo.color }}>{ctaText}</p>
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
};

export default SocialPostBuilder;
