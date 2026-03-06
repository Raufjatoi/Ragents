import { useState } from "react";
import { motion } from "framer-motion";
import { Check } from "lucide-react";

export type Platform = "instagram" | "youtube" | "linkedin" | "twitter" | "facebook" | "tiktok";

interface PlatformInfo {
  label: string;
  icon: string;
  color: string;
}

export const platforms: Record<Platform, PlatformInfo> = {
  instagram: { label: "Instagram", icon: "📸", color: "#E1306C" },
  youtube: { label: "YouTube", icon: "▶️", color: "#FF0000" },
  linkedin: { label: "LinkedIn", icon: "💼", color: "#0A66C2" },
  twitter: { label: "X / Twitter", icon: "𝕏", color: "#ffffff" },
  facebook: { label: "Facebook", icon: "📘", color: "#1877F2" },
  tiktok: { label: "TikTok", icon: "🎵", color: "#00f2ea" },
};

interface PlatformSelectorProps {
  selected: Platform | null;
  onSelect: (p: Platform) => void;
}

const PlatformSelector = ({ selected, onSelect }: PlatformSelectorProps) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      className="grid grid-cols-3 gap-2 p-3 rounded-xl"
      style={{ backgroundColor: "rgba(34,197,94,0.08)", border: "1px solid rgba(34,197,94,0.15)" }}
    >
      {(Object.keys(platforms) as Platform[]).map((key) => {
        const p = platforms[key];
        const isSelected = selected === key;
        return (
          <button
            key={key}
            onClick={() => onSelect(key)}
            className="relative flex flex-col items-center gap-1 px-3 py-3 rounded-lg text-xs font-medium transition-all duration-200 hover:scale-105"
            style={{
              backgroundColor: isSelected ? "rgba(34,197,94,0.2)" : "rgba(255,255,255,0.05)",
              border: `1px solid ${isSelected ? "rgba(34,197,94,0.4)" : "rgba(255,255,255,0.08)"}`,
              color: isSelected ? "#4ade80" : "rgba(245,242,241,0.6)",
            }}
          >
            {isSelected && (
              <div className="absolute top-1 right-1">
                <Check size={10} style={{ color: "#4ade80" }} />
              </div>
            )}
            <span className="text-lg">{p.icon}</span>
            <span>{p.label}</span>
          </button>
        );
      })}
    </motion.div>
  );
};

export default PlatformSelector;
