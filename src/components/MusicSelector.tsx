import { useState } from "react";
import { motion } from "framer-motion";
import { Check } from "lucide-react";

export type MusicGenre = "pop" | "rock" | "hiphop" | "rnb" | "electronic" | "jazz" | "classical" | "country" | "lofi" | "reggaeton";
export type Instrument = "guitar" | "piano" | "drums" | "bass" | "violin" | "synth" | "flute" | "saxophone" | "trumpet" | "ukulele";

interface GenreInfo { label: string; icon: string }
interface InstrumentInfo { label: string; icon: string }

export const genres: Record<MusicGenre, GenreInfo> = {
  pop: { label: "Pop", icon: "🎤" },
  rock: { label: "Rock", icon: "🎸" },
  hiphop: { label: "Hip Hop", icon: "🎧" },
  rnb: { label: "R&B", icon: "🎶" },
  electronic: { label: "Electronic", icon: "🎛️" },
  jazz: { label: "Jazz", icon: "🎷" },
  classical: { label: "Classical", icon: "🎻" },
  country: { label: "Country", icon: "🤠" },
  lofi: { label: "Lo-Fi", icon: "☕" },
  reggaeton: { label: "Reggaeton", icon: "💃" },
};

export const instruments: Record<Instrument, InstrumentInfo> = {
  guitar: { label: "Guitar", icon: "🎸" },
  piano: { label: "Piano", icon: "🎹" },
  drums: { label: "Drums", icon: "🥁" },
  bass: { label: "Bass", icon: "🎵" },
  violin: { label: "Violin", icon: "🎻" },
  synth: { label: "Synth", icon: "🎛️" },
  flute: { label: "Flute", icon: "🪈" },
  saxophone: { label: "Sax", icon: "🎷" },
  trumpet: { label: "Trumpet", icon: "🎺" },
  ukulele: { label: "Ukulele", icon: "🪕" },
};

interface MusicSelectorProps {
  step: "genre" | "instruments";
  selectedGenre: MusicGenre | null;
  selectedInstruments: Instrument[];
  onGenreSelect: (g: MusicGenre) => void;
  onInstrumentToggle: (i: Instrument) => void;
  onConfirmInstruments: () => void;
}

const MusicSelector = ({ step, selectedGenre, selectedInstruments, onGenreSelect, onInstrumentToggle, onConfirmInstruments }: MusicSelectorProps) => {
  if (step === "genre") {
    return (
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        className="grid grid-cols-5 gap-2 p-3 rounded-xl"
        style={{ backgroundColor: "rgba(236,72,153,0.08)", border: "1px solid rgba(236,72,153,0.15)" }}
      >
        {(Object.keys(genres) as MusicGenre[]).map((key) => {
          const g = genres[key];
          const isSelected = selectedGenre === key;
          return (
            <button
              key={key}
              onClick={() => onGenreSelect(key)}
              className="relative flex flex-col items-center gap-1 px-2 py-3 rounded-lg text-xs font-medium transition-all duration-200 hover:scale-105"
              style={{
                backgroundColor: isSelected ? "rgba(236,72,153,0.25)" : "rgba(255,255,255,0.05)",
                border: `1px solid ${isSelected ? "rgba(236,72,153,0.4)" : "rgba(255,255,255,0.08)"}`,
                color: isSelected ? "#f472b6" : "rgba(245,242,241,0.6)",
              }}
            >
              {isSelected && <div className="absolute top-1 right-1"><Check size={10} style={{ color: "#f472b6" }} /></div>}
              <span className="text-lg">{g.icon}</span>
              <span className="text-[10px]">{g.label}</span>
            </button>
          );
        })}
      </motion.div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-3"
    >
      <div
        className="grid grid-cols-5 gap-2 p-3 rounded-xl"
        style={{ backgroundColor: "rgba(236,72,153,0.08)", border: "1px solid rgba(236,72,153,0.15)" }}
      >
        {(Object.keys(instruments) as Instrument[]).map((key) => {
          const inst = instruments[key];
          const isSelected = selectedInstruments.includes(key);
          return (
            <button
              key={key}
              onClick={() => onInstrumentToggle(key)}
              className="relative flex flex-col items-center gap-1 px-2 py-3 rounded-lg text-xs font-medium transition-all duration-200 hover:scale-105"
              style={{
                backgroundColor: isSelected ? "rgba(236,72,153,0.25)" : "rgba(255,255,255,0.05)",
                border: `1px solid ${isSelected ? "rgba(236,72,153,0.4)" : "rgba(255,255,255,0.08)"}`,
                color: isSelected ? "#f472b6" : "rgba(245,242,241,0.6)",
              }}
            >
              {isSelected && <div className="absolute top-1 right-1"><Check size={10} style={{ color: "#f472b6" }} /></div>}
              <span className="text-lg">{inst.icon}</span>
              <span className="text-[10px]">{inst.label}</span>
            </button>
          );
        })}
      </div>
      {selectedInstruments.length > 0 && (
        <button
          onClick={onConfirmInstruments}
          className="w-full py-2 rounded-lg text-sm font-medium transition-all hover:scale-[1.02]"
          style={{ backgroundColor: "rgba(236,72,153,0.25)", color: "#f472b6", border: "1px solid rgba(236,72,153,0.3)" }}
        >
          Continue with {selectedInstruments.length} instrument{selectedInstruments.length > 1 ? "s" : ""} →
        </button>
      )}
    </motion.div>
  );
};

export default MusicSelector;
