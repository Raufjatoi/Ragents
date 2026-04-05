import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Loader2, CheckCircle2, Mic2, Music2, Wand2, Copy, Check,
  Zap, Layers, Radio,
} from "lucide-react";
import { genres, instruments, type MusicGenre, type Instrument } from "./MusicSelector";

export type MusicStage =
  | "mood_pick" | "tempo_pick" | "mode_pick"
  | "lyrics_gen" | "prompts_gen"
  | "done";

export type MusicMode = "write" | "alter" | "beat" | "full";

interface MusicBuilderProps {
  genre: MusicGenre;
  selectedInstruments: Instrument[];
  topic: string;
  mood: string;
  tempo: string;
  mode: string;
  lyricsText: string;
  sunoPrompt: string;
  udioPrompt: string;
  stage: MusicStage;
  onMoodPick: (mood: string) => void;
  onTempoPick: (tempo: string) => void;
  onModePick: (mode: MusicMode) => void;
}

// ── Option arrays ─────────────────────────────────────────────────────────────

const moodOptions = [
  { key: "energetic",   label: "Energetic",    emoji: "⚡" },
  { key: "melancholic", label: "Melancholic",   emoji: "🌧️" },
  { key: "romantic",    label: "Romantic",      emoji: "💕" },
  { key: "dark",        label: "Dark",          emoji: "🌑" },
  { key: "uplifting",   label: "Uplifting",     emoji: "☀️" },
  { key: "nostalgic",   label: "Nostalgic",     emoji: "📼" },
  { key: "aggressive",  label: "Aggressive",    emoji: "🔥" },
  { key: "chill",       label: "Chill",         emoji: "🌊" },
];

const tempoOptions = [
  { key: "slow",   label: "Slow",    bpm: "60–80 BPM",  bars: 2 },
  { key: "mid",    label: "Mid",     bpm: "90–110 BPM", bars: 3 },
  { key: "upbeat", label: "Upbeat",  bpm: "120–140 BPM",bars: 4 },
  { key: "fast",   label: "Fast",    bpm: "150+ BPM",   bars: 5 },
];

const modeOptions: { key: MusicMode; label: string; desc: string; emoji: string }[] = [
  { key: "write", label: "Write Lyrics",     desc: "Generate from scratch",        emoji: "✍️" },
  { key: "alter", label: "Alter & Remix",    desc: "Rewrite / improve existing",   emoji: "🔄" },
  { key: "beat",  label: "Instrumental",     desc: "Beat-only, no lyrics",         emoji: "🥁" },
  { key: "full",  label: "Full Package",     desc: "Lyrics + all tool prompts",    emoji: "📦" },
];

const toolCards = [
  { icon: "🎵", name: "Suno AI",      link: "suno.com",        tip: "Paste the Suno prompt above" },
  { icon: "🎶", name: "Udio",         link: "udio.com",        tip: "Alternative generations" },
  { icon: "🎤", name: "ElevenLabs",   link: "elevenlabs.io",   tip: "AI vocals for your lyrics" },
  { icon: "🥁", name: "Boomy",        link: "boomy.com",       tip: "Quick beat creation" },
  { icon: "🎼", name: "AIVA",         link: "aiva.ai",         tip: "Cinematic & orchestral AI" },
];

// ── Steps ─────────────────────────────────────────────────────────────────────

const toolSteps = [
  { key: "mood",    stage: "mood_pick",   type: "pick", icon: Zap,     label: "Mood & Vibe",       genDesc: "" },
  { key: "tempo",   stage: "tempo_pick",  type: "pick", icon: Layers,  label: "Tempo & BPM",       genDesc: "" },
  { key: "mode",    stage: "mode_pick",   type: "pick", icon: Radio,   label: "Creation Mode",     genDesc: "" },
  { key: "lyrics",  stage: "lyrics_gen",  type: "gen",  icon: Mic2,    label: "Lyrics Writer",     genDesc: "Composing lyrics…" },
  { key: "prompts", stage: "prompts_gen", type: "gen",  icon: Music2,  label: "Prompt Optimizer",  genDesc: "Optimizing for Suno & Udio…" },
];

const stageOrder: MusicStage[] = [
  "mood_pick", "tempo_pick", "mode_pick",
  "lyrics_gen", "prompts_gen", "done",
];

// ── Component ─────────────────────────────────────────────────────────────────

const PINK = "#f472b6";
const PINK_DIM = "rgba(236,72,153,";

const MusicBuilder = ({
  genre, selectedInstruments: selInst, topic,
  mood, tempo, mode, lyricsText, sunoPrompt, udioPrompt,
  stage, onMoodPick, onTempoPick, onModePick,
}: MusicBuilderProps) => {
  const [copiedLyrics, setCopiedLyrics] = useState(false);
  const [copiedSuno, setCopiedSuno] = useState(false);
  const [copiedUdio, setCopiedUdio] = useState(false);

  const genreInfo = genres[genre];
  const instLabels = selInst.map(i => instruments[i].label).join(", ") || "open";
  const isDone = stage === "done";

  const getStatus = (step: typeof toolSteps[number]) => {
    const currentIdx = stageOrder.indexOf(stage);
    const stepIdx = stageOrder.indexOf(step.stage as MusicStage);
    if (currentIdx > stepIdx) return "done";
    if (currentIdx === stepIdx) return step.type === "pick" ? "picking" : "running";
    return "pending";
  };

  const previews = [mood, tempo, mode, lyricsText.slice(0, 80), sunoPrompt.slice(0, 80)];

  const copy = (text: string, setter: (v: boolean) => void) => {
    navigator.clipboard.writeText(text);
    setter(true);
    setTimeout(() => setter(false), 2000);
  };

  const btnBase: React.CSSProperties = {
    backgroundColor: "rgba(255,255,255,0.06)",
    color: "rgba(245,242,241,0.7)",
    border: "1px solid rgba(255,255,255,0.1)",
  };
  const hover = (e: React.MouseEvent<HTMLButtonElement>) => {
    e.currentTarget.style.backgroundColor = `${PINK_DIM}0.15)`;
    e.currentTarget.style.borderColor = `${PINK_DIM}0.4)`;
    e.currentTarget.style.color = PINK;
  };
  const leave = (e: React.MouseEvent<HTMLButtonElement>) => {
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
      <div className="flex items-center gap-2 flex-wrap">
        <span className="text-lg">{genreInfo.icon}</span>
        <span className="text-xs font-semibold uppercase tracking-wider" style={{ color: PINK }}>
          {genreInfo.label} Track
        </span>
        <span className="text-xs truncate max-w-[180px]" style={{ color: "rgba(245,242,241,0.4)" }}>
          · {topic.slice(0, 45)}{topic.length > 45 ? "…" : ""}
        </span>
        {selInst.length > 0 && (
          <div className="flex gap-1 flex-wrap">
            {selInst.map(i => (
              <span key={i} className="text-[10px] px-1.5 py-0.5 rounded-full"
                style={{ backgroundColor: `${PINK_DIM}0.12)`, color: PINK }}>
                {instruments[i].icon}
              </span>
            ))}
          </div>
        )}
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
                    isPicking ? `${PINK_DIM}0.08)` :
                    status === "running" ? `${PINK_DIM}0.1)` :
                    "rgba(255,255,255,0.03)",
                }}
              >
                <div className="p-1.5 rounded-md" style={{
                  backgroundColor:
                    status === "done" ? "rgba(34,197,94,0.15)" :
                    status === "running" ? `${PINK_DIM}0.2)` :
                    isPicking ? `${PINK_DIM}0.2)` :
                    "rgba(255,255,255,0.06)",
                }}>
                  {status === "running" ? (
                    <Loader2 size={14} className="animate-spin" style={{ color: PINK }} />
                  ) : status === "done" ? (
                    <CheckCircle2 size={14} style={{ color: "#22c55e" }} />
                  ) : (
                    <SIcon size={14} style={{ color: isPicking ? PINK : "rgba(245,242,241,0.3)" }} />
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-medium" style={{
                    color: status === "done" ? "rgba(245,242,241,0.85)" :
                      (status === "running" || isPicking) ? PINK : "rgba(245,242,241,0.4)",
                  }}>
                    {step.label}
                  </p>
                  {status === "running" && (
                    <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-xs italic"
                      style={{ color: `${PINK_DIM}0.6)` }}>
                      {step.genDesc}
                    </motion.p>
                  )}
                  {status === "done" && previews[i] && (
                    <p className="text-xs mt-0.5 line-clamp-1" style={{ color: "rgba(245,242,241,0.45)" }}>
                      {previews[i]}{previews[i].length >= 80 ? "…" : ""}
                    </p>
                  )}
                </div>
              </motion.div>

              {/* Mood picker — 4×2 grid */}
              {isPicking && step.key === "mood" && (
                <motion.div initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }}
                  className="grid grid-cols-4 gap-1.5 pl-10">
                  {moodOptions.map(opt => (
                    <button key={opt.key} onClick={() => onMoodPick(opt.key)}
                      className="flex flex-col items-center gap-1 px-2 py-2.5 rounded-lg transition-all hover:scale-105"
                      style={btnBase} onMouseEnter={hover} onMouseLeave={leave}>
                      <span className="text-base">{opt.emoji}</span>
                      <p className="text-[10px] font-semibold">{opt.label}</p>
                    </button>
                  ))}
                </motion.div>
              )}

              {/* Tempo picker — visual BPM bars */}
              {isPicking && step.key === "tempo" && (
                <motion.div initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }}
                  className="flex gap-2 pl-10">
                  {tempoOptions.map(opt => (
                    <button key={opt.key} onClick={() => onTempoPick(opt.key)}
                      className="flex flex-col items-center gap-2 px-3 py-2.5 rounded-lg transition-all hover:scale-105"
                      style={btnBase} onMouseEnter={hover} onMouseLeave={leave}>
                      {/* Visual BPM bar chart */}
                      <div className="flex items-end gap-0.5" style={{ height: 20 }}>
                        {Array.from({ length: opt.bars }).map((_, bi) => (
                          <div key={bi} style={{
                            width: 4,
                            height: 4 + bi * 3.5,
                            borderRadius: 2,
                            backgroundColor: `${PINK_DIM}0.5)`,
                          }} />
                        ))}
                      </div>
                      <p className="text-[11px] font-semibold">{opt.label}</p>
                      <p className="text-[9px] opacity-55">{opt.bpm}</p>
                    </button>
                  ))}
                </motion.div>
              )}

              {/* Mode picker */}
              {isPicking && step.key === "mode" && (
                <motion.div initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }}
                  className="grid grid-cols-2 gap-1.5 pl-10">
                  {modeOptions.map(opt => (
                    <button key={opt.key} onClick={() => onModePick(opt.key)}
                      className="flex items-center gap-2 px-3 py-2.5 rounded-lg text-left transition-all hover:scale-105"
                      style={btnBase} onMouseEnter={hover} onMouseLeave={leave}>
                      <span className="text-base flex-shrink-0">{opt.emoji}</span>
                      <div>
                        <p className="text-xs font-semibold">{opt.label}</p>
                        <p className="text-[10px] opacity-55">{opt.desc}</p>
                      </div>
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
        {isDone && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-4 pt-3"
            style={{ borderTop: "1px solid rgba(255,255,255,0.08)" }}
          >
            {/* Metadata pills */}
            <div className="flex gap-1.5 flex-wrap">
              {[genreInfo.label, mood, tempo, mode !== "beat" ? mode + " lyrics" : "instrumental"].filter(Boolean).map((tag, i) => (
                <span key={i} className="text-[10px] px-2 py-0.5 rounded-full capitalize"
                  style={{ backgroundColor: `${PINK_DIM}0.12)`, color: PINK }}>
                  {tag}
                </span>
              ))}
              {instLabels !== "open" && (
                <span className="text-[10px] px-2 py-0.5 rounded-full"
                  style={{ backgroundColor: "rgba(255,255,255,0.07)", color: "rgba(245,242,241,0.55)" }}>
                  {instLabels}
                </span>
              )}
            </div>

            {/* Lyrics / Beat description */}
            {lyricsText && (
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <p className="text-xs font-semibold uppercase tracking-wider" style={{ color: PINK }}>
                    {mode === "beat" ? "🥁 Beat Description" : "🎤 Lyrics"}
                  </p>
                  <button onClick={() => copy(lyricsText, setCopiedLyrics)}
                    className="flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-medium transition-all hover:scale-105"
                    style={{ backgroundColor: `${PINK_DIM}0.18)`, color: PINK, border: `1px solid ${PINK_DIM}0.3)` }}>
                    {copiedLyrics ? <Check size={11} /> : <Copy size={11} />}
                    {copiedLyrics ? "Copied!" : "Copy"}
                  </button>
                </div>
                <div className="rounded-lg p-3 text-sm leading-relaxed whitespace-pre-wrap"
                  style={{ backgroundColor: "rgba(255,255,255,0.04)", color: "rgba(245,242,241,0.85)", fontFamily: "monospace", fontSize: "12px" }}>
                  {lyricsText}
                </div>
              </div>
            )}

            {/* Suno prompt */}
            {sunoPrompt && (
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <p className="text-xs font-semibold uppercase tracking-wider" style={{ color: PINK }}>🎵 Suno AI Prompt</p>
                  <button onClick={() => copy(sunoPrompt, setCopiedSuno)}
                    className="flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-medium transition-all hover:scale-105"
                    style={{ backgroundColor: `${PINK_DIM}0.18)`, color: PINK, border: `1px solid ${PINK_DIM}0.3)` }}>
                    {copiedSuno ? <Check size={11} /> : <Copy size={11} />}
                    {copiedSuno ? "Copied!" : "Copy"}
                  </button>
                </div>
                <div className="rounded-lg p-3 text-sm font-medium"
                  style={{ backgroundColor: "rgba(255,255,255,0.04)", color: PINK }}>
                  {sunoPrompt}
                </div>
              </div>
            )}

            {/* Udio prompt */}
            {udioPrompt && (
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <p className="text-xs font-semibold uppercase tracking-wider" style={{ color: "rgba(245,242,241,0.6)" }}>🎶 Udio Prompt</p>
                  <button onClick={() => copy(udioPrompt, setCopiedUdio)}
                    className="flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-medium transition-all hover:scale-105"
                    style={{ backgroundColor: "rgba(255,255,255,0.08)", color: "rgba(245,242,241,0.6)", border: "1px solid rgba(255,255,255,0.12)" }}>
                    {copiedUdio ? <Check size={11} /> : <Copy size={11} />}
                    {copiedUdio ? "Copied!" : "Copy"}
                  </button>
                </div>
                <div className="rounded-lg p-3 text-sm"
                  style={{ backgroundColor: "rgba(255,255,255,0.04)", color: "rgba(245,242,241,0.75)" }}>
                  {udioPrompt}
                </div>
              </div>
            )}

            {/* Tool suggestion cards */}
            <div className="space-y-2">
              <p className="text-xs font-semibold uppercase tracking-wider" style={{ color: "rgba(245,242,241,0.4)" }}>🛠 Suggested Tools</p>
              <div className="grid grid-cols-5 gap-1.5">
                {toolCards.map(t => (
                  <div key={t.name} className="flex flex-col items-center gap-1 px-2 py-2.5 rounded-lg text-center"
                    style={{ backgroundColor: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.07)" }}>
                    <span className="text-base">{t.icon}</span>
                    <p className="text-[10px] font-semibold" style={{ color: "rgba(245,242,241,0.75)" }}>{t.name}</p>
                    <p className="text-[9px] opacity-50 leading-tight">{t.tip}</p>
                    <p className="text-[9px]" style={{ color: `${PINK_DIM}0.6)` }}>{t.link}</p>
                  </div>
                ))}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
};

export default MusicBuilder;
