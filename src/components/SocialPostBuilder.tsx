import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Loader2, CheckCircle2, Zap, AlignLeft, Megaphone, Copy, Check,
  Minus, Equal, AlignJustify, Palette, Hash, Link2, MessageCircle,
  Share2, UserPlus, ExternalLink, Mail,
} from "lucide-react";
import { platforms, platformGuides, type Platform } from "./PlatformSelector";

export type HashtagStrategy = "minimal" | "moderate" | "maximum";
export type CtaType = "follow" | "comment" | "share" | "link" | "dm";
export type SocialStage =
  | "style_pick"
  | "hook_pick" | "hook_gen"
  | "desc_pick" | "desc_gen"
  | "tag_pick" | "tag_gen"
  | "cta_ask" | "cta_gen"
  | "done";

interface SocialPostBuilderProps {
  platform: Platform;
  topic: string;
  style: string;
  hookText: string;
  descriptionText: string;
  hashtagsText: string;
  ctaText: string;
  stage: SocialStage;
  link: string;
  onStylePick: (style: string) => void;
  onLengthPick: (step: "hook" | "description", pref: string) => void;
  onTagPick: (strategy: HashtagStrategy) => void;
  onAddCta: (ctaType: CtaType) => void;
  onSkipCta: () => void;
  onLinkChange: (link: string) => void;
}

const styleOptions = [
  { key: "casual", label: "Casual", desc: "Friendly & relaxed" },
  { key: "professional", label: "Professional", desc: "Polished & credible" },
  { key: "witty", label: "Witty", desc: "Clever & fun" },
  { key: "inspirational", label: "Inspirational", desc: "Motivating & uplifting" },
  { key: "educational", label: "Educational", desc: "Informative & clear" },
  { key: "storytelling", label: "Storytelling", desc: "Narrative & engaging" },
];

const lengthOptions = [
  { key: "short", icon: Minus, label: "Short", desc: "Punchy & quick" },
  { key: "medium", icon: Equal, label: "Medium", desc: "Balanced" },
  { key: "long", icon: AlignJustify, label: "Long", desc: "Detailed" },
];

const hashtagOptions = [
  { key: "minimal" as HashtagStrategy, label: "Minimal", desc: "2–3 focused tags" },
  { key: "moderate" as HashtagStrategy, label: "Moderate", desc: "8–12 targeted tags" },
  { key: "maximum" as HashtagStrategy, label: "Maximum", desc: "20–25 mixed tags" },
];

const ctaOptions: { key: CtaType; icon: React.ElementType; label: string; desc: string }[] = [
  { key: "follow", icon: UserPlus, label: "Follow", desc: "Grow your audience" },
  { key: "comment", icon: MessageCircle, label: "Comment", desc: "Drive engagement" },
  { key: "share", icon: Share2, label: "Share", desc: "Boost reach" },
  { key: "link", icon: ExternalLink, label: "Link", desc: "Drive traffic" },
  { key: "dm", icon: Mail, label: "DM", desc: "Start conversation" },
];

const toolSteps = [
  { key: "style", pickStage: "style_pick", genStage: "style_pick", icon: Palette, label: "Style & Tone", genDesc: "" },
  { key: "hook", pickStage: "hook_pick", genStage: "hook_gen", icon: Zap, label: "Hook Generator", genDesc: "Crafting opener..." },
  { key: "description", pickStage: "desc_pick", genStage: "desc_gen", icon: AlignLeft, label: "Description Writer", genDesc: "Writing body..." },
  { key: "hashtags", pickStage: "tag_pick", genStage: "tag_gen", icon: Hash, label: "Hashtag Strategy", genDesc: "Finding best tags..." },
  { key: "cta", pickStage: "cta_ask", genStage: "cta_gen", icon: Megaphone, label: "CTA Engine", genDesc: "Generating CTA..." },
];

const stageOrder: SocialStage[] = [
  "style_pick",
  "hook_pick", "hook_gen",
  "desc_pick", "desc_gen",
  "tag_pick", "tag_gen",
  "cta_ask", "cta_gen",
  "done",
];

const SocialPostBuilder = ({
  platform, topic, style, hookText, descriptionText, hashtagsText, ctaText,
  stage, link, onStylePick, onLengthPick, onTagPick, onAddCta, onSkipCta, onLinkChange,
}: SocialPostBuilderProps) => {
  const [copied, setCopied] = useState(false);
  const platInfo = platforms[platform];
  const guide = platformGuides[platform];
  const isDone = stage === "done";

  const getStatus = (step: typeof toolSteps[number]) => {
    const currentIdx = stageOrder.indexOf(stage);
    const pickIdx = stageOrder.indexOf(step.pickStage as SocialStage);
    const genIdx = stageOrder.indexOf(step.genStage as SocialStage);
    if (currentIdx > genIdx) return "done";
    if (currentIdx === genIdx && currentIdx === pickIdx) return "picking"; // style step special case
    if (currentIdx === genIdx) return "running";
    if (currentIdx === pickIdx) return "picking";
    return "pending";
  };

  const getPreviewText = (idx: number) => {
    const texts = [style, hookText, descriptionText, hashtagsText, ctaText];
    const t = texts[idx];
    return t ? t.slice(0, 90) + (t.length > 90 ? "…" : "") : "";
  };

  const handleCopy = () => {
    const parts = [hookText, descriptionText, hashtagsText, ctaText, link].filter(Boolean);
    navigator.clipboard.writeText(parts.join("\n\n"));
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const btnBase = {
    backgroundColor: "rgba(255,255,255,0.06)",
    color: "rgba(245,242,241,0.7)",
    border: "1px solid rgba(255,255,255,0.1)",
  };
  const btnHoverGreen = (e: React.MouseEvent<HTMLButtonElement>) => {
    e.currentTarget.style.backgroundColor = "rgba(34,197,94,0.15)";
    e.currentTarget.style.color = "#4ade80";
    e.currentTarget.style.borderColor = "rgba(34,197,94,0.3)";
  };
  const btnLeave = (e: React.MouseEvent<HTMLButtonElement>) => {
    e.currentTarget.style.backgroundColor = btnBase.backgroundColor;
    e.currentTarget.style.color = btnBase.color;
    e.currentTarget.style.borderColor = btnBase.border.split(" ")[2];
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

      {/* Platform guide strip */}
      <div className="grid grid-cols-2 gap-1.5 px-3 py-2.5 rounded-lg text-[11px]" style={{ backgroundColor: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.07)" }}>
        <div className="flex items-center gap-1.5">
          <span style={{ color: "rgba(245,242,241,0.35)" }}>Limit:</span>
          <span style={{ color: "rgba(245,242,241,0.7)" }}>{guide.charLimit}</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span style={{ color: "rgba(245,242,241,0.35)" }}>Tags:</span>
          <span style={{ color: "rgba(245,242,241,0.7)" }}>{guide.hashtagTip}</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span style={{ color: "rgba(245,242,241,0.35)" }}>Tone:</span>
          <span style={{ color: "rgba(245,242,241,0.7)" }}>{guide.audienceTone}</span>
        </div>
        <div className="flex items-center gap-1.5 col-span-2">
          <span style={{ color: platInfo.color }}>💡</span>
          <span style={{ color: "rgba(245,242,241,0.6)" }}>{guide.tip}</span>
        </div>
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
                  {status === "done" && getPreviewText(i) && (
                    <p className="text-xs mt-0.5 line-clamp-2" style={{ color: "rgba(245,242,241,0.45)" }}>{getPreviewText(i)}</p>
                  )}
                </div>
              </motion.div>

              {/* Style picker */}
              {isPicking && step.key === "style" && (
                <motion.div initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }} className="grid grid-cols-3 gap-1.5 pl-10">
                  {styleOptions.map((opt) => (
                    <button
                      key={opt.key}
                      onClick={() => onStylePick(opt.key)}
                      className="flex flex-col items-start px-3 py-2 rounded-lg text-xs font-medium transition-all hover:scale-105"
                      style={btnBase}
                      onMouseEnter={btnHoverGreen}
                      onMouseLeave={btnLeave}
                    >
                      <span className="font-semibold">{opt.label}</span>
                      <span className="text-[10px] opacity-60">{opt.desc}</span>
                    </button>
                  ))}
                </motion.div>
              )}

              {/* Length picker for hook / description */}
              {isPicking && (step.key === "hook" || step.key === "description") && (
                <motion.div initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }} className="flex gap-2 pl-10">
                  {lengthOptions.map((opt) => {
                    const OIcon = opt.icon;
                    return (
                      <button
                        key={opt.key}
                        onClick={() => onLengthPick(step.key as "hook" | "description", opt.key)}
                        className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-medium transition-all hover:scale-105"
                        style={btnBase}
                        onMouseEnter={btnHoverGreen}
                        onMouseLeave={btnLeave}
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

              {/* Hashtag strategy picker */}
              {isPicking && step.key === "hashtags" && (
                <motion.div initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }} className="flex gap-2 pl-10">
                  {hashtagOptions.map((opt) => (
                    <button
                      key={opt.key}
                      onClick={() => onTagPick(opt.key)}
                      className="flex flex-col items-start px-3 py-2 rounded-lg text-xs font-medium transition-all hover:scale-105"
                      style={btnBase}
                      onMouseEnter={btnHoverGreen}
                      onMouseLeave={btnLeave}
                    >
                      <span className="font-semibold">{opt.label}</span>
                      <span className="text-[10px] opacity-60">{opt.desc}</span>
                    </button>
                  ))}
                </motion.div>
              )}

              {/* CTA picker */}
              {isPicking && step.key === "cta" && (
                <motion.div initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }} className="space-y-1.5 pl-10">
                  <div className="flex flex-wrap gap-1.5">
                    {ctaOptions.map((opt) => {
                      const CIcon = opt.icon;
                      return (
                        <button
                          key={opt.key}
                          onClick={() => onAddCta(opt.key)}
                          className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-medium transition-all hover:scale-105"
                          style={btnBase}
                          onMouseEnter={btnHoverGreen}
                          onMouseLeave={btnLeave}
                        >
                          <CIcon size={12} />
                          <div className="text-left">
                            <p className="font-semibold">{opt.label}</p>
                            <p className="text-[10px] opacity-60">{opt.desc}</p>
                          </div>
                        </button>
                      );
                    })}
                  </div>
                  <button
                    onClick={onSkipCta}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all hover:scale-105"
                    style={{ backgroundColor: "rgba(255,255,255,0.04)", color: "rgba(245,242,241,0.4)", border: "1px solid rgba(255,255,255,0.07)" }}
                  >
                    Skip CTA
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

            {/* Link input */}
            <div className="flex items-center gap-2 px-3 py-2 rounded-lg" style={{ backgroundColor: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)" }}>
              <Link2 size={13} style={{ color: "rgba(245,242,241,0.35)", flexShrink: 0 }} />
              <input
                type="url"
                placeholder="Add a link (optional)…"
                value={link}
                onChange={(e) => onLinkChange(e.target.value)}
                className="flex-1 bg-transparent text-xs outline-none placeholder:opacity-40"
                style={{ color: "#60a5fa" }}
              />
            </div>

            {/* Clean assembled post */}
            <div className="rounded-lg p-4 text-sm leading-relaxed space-y-3" style={{ backgroundColor: "rgba(255,255,255,0.04)", color: "rgba(245,242,241,0.85)" }}>
              {hookText && <p className="font-semibold">{hookText}</p>}
              {descriptionText && <p>{descriptionText}</p>}
              {hashtagsText && <p style={{ color: "rgba(34,197,94,0.7)" }}>{hashtagsText}</p>}
              {ctaText && <p className="font-medium" style={{ color: platInfo.color }}>{ctaText}</p>}
              {link && <p style={{ color: "#60a5fa" }}>{link}</p>}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
};

export default SocialPostBuilder;
