import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Loader2, CheckCircle2, Clock, Timer, Flame, Users, Copy, Check, ChefHat, Lightbulb, UtensilsCrossed } from "lucide-react";
import { countries, type Country } from "./CookingSelector";

export type RecipeStage = "recipe_gen" | "steps_gen" | "done";

interface RecipeCardProps {
  country: Country;
  dish: string;
  dishEmoji: string;
  description: string;
  cookTime: string;
  prepTime: string;
  difficulty: string;
  servings: string;
  ingredientsList: string[];
  steps: string[];
  tips: string;
  stage: RecipeStage;
}

const YELLOW = "#facc15";
const YELLOW_BG = "rgba(234,179,8,";

const difficultyColor = (d: string) => {
  const dl = d.toLowerCase();
  if (dl === "easy") return { bg: "rgba(34,197,94,0.15)", color: "#4ade80" };
  if (dl === "hard") return { bg: "rgba(239,68,68,0.15)", color: "#f87171" };
  return { bg: `${YELLOW_BG}0.15)`, color: YELLOW };
};

const toolSteps = [
  { stage: "recipe_gen", icon: ChefHat,        label: "Recipe Research",    desc: "Gathering recipe details…" },
  { stage: "steps_gen",  icon: UtensilsCrossed, label: "Cooking Instructions", desc: "Writing step-by-step guide…" },
];

const stageOrder: RecipeStage[] = ["recipe_gen", "steps_gen", "done"];

const RecipeCard = ({
  country, dish, dishEmoji, description,
  cookTime, prepTime, difficulty, servings,
  ingredientsList, steps, tips, stage,
}: RecipeCardProps) => {
  const [copied, setCopied] = useState(false);
  const isDone = stage === "done";
  const countryInfo = countries[country];
  const diffStyle = difficultyColor(difficulty);

  const currentIdx = stageOrder.indexOf(stage);
  const getStatus = (s: RecipeStage) => {
    const si = stageOrder.indexOf(s);
    if (currentIdx > si) return "done";
    if (currentIdx === si) return "running";
    return "pending";
  };

  const handleCopy = () => {
    const text = [
      `${dishEmoji} ${dish} — ${countryInfo.label} Recipe`,
      `Prep: ${prepTime} | Cook: ${cookTime} | Difficulty: ${difficulty} | Serves: ${servings}`,
      "",
      "INGREDIENTS:",
      ...ingredientsList.map(i => `• ${i}`),
      "",
      "STEPS:",
      ...steps.map((s, i) => `${i + 1}. ${s}`),
      "",
      tips ? `TIP: ${tips}` : "",
    ].filter(l => l !== undefined).join("\n");
    navigator.clipboard.writeText(text);
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
      {/* Header */}
      <div className="flex items-center gap-2">
        <span className="text-xl leading-none">{countryInfo.flag}</span>
        <span className="text-xs font-semibold uppercase tracking-wider" style={{ color: YELLOW }}>
          {countryInfo.label} Recipe
        </span>
        {dish && (
          <span className="text-xs truncate max-w-[160px]" style={{ color: "rgba(245,242,241,0.4)" }}>
            · {dish}
          </span>
        )}
      </div>

      {/* Generation progress */}
      {!isDone && (
        <div className="space-y-2">
          {toolSteps.map((step) => {
            const status = getStatus(step.stage as RecipeStage);
            const SIcon = step.icon;
            return (
              <motion.div
                key={step.stage}
                initial={{ opacity: 0, x: -8 }}
                animate={{ opacity: 1, x: 0 }}
                className="flex items-center gap-3 px-3 py-2.5 rounded-lg"
                style={{ backgroundColor: status === "running" ? `${YELLOW_BG}0.1)` : "rgba(255,255,255,0.03)" }}
              >
                <div className="p-1.5 rounded-md" style={{
                  backgroundColor: status === "done" ? "rgba(34,197,94,0.15)" :
                    status === "running" ? `${YELLOW_BG}0.2)` : "rgba(255,255,255,0.06)",
                }}>
                  {status === "running" ? (
                    <Loader2 size={14} className="animate-spin" style={{ color: YELLOW }} />
                  ) : status === "done" ? (
                    <CheckCircle2 size={14} style={{ color: "#22c55e" }} />
                  ) : (
                    <SIcon size={14} style={{ color: "rgba(245,242,241,0.3)" }} />
                  )}
                </div>
                <div>
                  <p className="text-xs font-medium" style={{
                    color: status === "done" ? "rgba(245,242,241,0.85)" :
                      status === "running" ? YELLOW : "rgba(245,242,241,0.4)",
                  }}>
                    {step.label}
                  </p>
                  {status === "running" && (
                    <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                      className="text-xs italic" style={{ color: `${YELLOW_BG}0.6)` }}>
                      {step.desc}
                    </motion.p>
                  )}
                </div>
              </motion.div>
            );
          })}
        </div>
      )}

      {/* Full recipe card */}
      <AnimatePresence>
        {isDone && (
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-4">
            {/* Dish title */}
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-center gap-3">
                <span className="text-3xl leading-none">{dishEmoji}</span>
                <div>
                  <h3 className="text-base font-bold" style={{ color: "rgba(245,242,241,0.92)" }}>{dish}</h3>
                  {description && (
                    <p className="text-xs mt-0.5 leading-relaxed" style={{ color: "rgba(245,242,241,0.5)" }}>{description}</p>
                  )}
                </div>
              </div>
              <button
                onClick={handleCopy}
                className="flex-shrink-0 flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-medium transition-all hover:scale-105"
                style={{ backgroundColor: `${YELLOW_BG}0.2)`, color: YELLOW, border: `1px solid ${YELLOW_BG}0.3)` }}
              >
                {copied ? <Check size={11} /> : <Copy size={11} />}
                {copied ? "Copied!" : "Copy"}
              </button>
            </div>

            {/* Info chips */}
            <div className="flex flex-wrap gap-2">
              {prepTime && (
                <div className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg"
                  style={{ backgroundColor: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.09)" }}>
                  <Timer size={11} style={{ color: `${YELLOW_BG}0.8)` }} />
                  <span className="text-[11px]" style={{ color: "rgba(245,242,241,0.6)" }}>Prep</span>
                  <span className="text-[11px] font-semibold" style={{ color: "rgba(245,242,241,0.85)" }}>{prepTime}</span>
                </div>
              )}
              {cookTime && (
                <div className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg"
                  style={{ backgroundColor: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.09)" }}>
                  <Clock size={11} style={{ color: `${YELLOW_BG}0.8)` }} />
                  <span className="text-[11px]" style={{ color: "rgba(245,242,241,0.6)" }}>Cook</span>
                  <span className="text-[11px] font-semibold" style={{ color: "rgba(245,242,241,0.85)" }}>{cookTime}</span>
                </div>
              )}
              {difficulty && (
                <div className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg"
                  style={{ backgroundColor: diffStyle.bg, border: `1px solid ${diffStyle.color}33` }}>
                  <Flame size={11} style={{ color: diffStyle.color }} />
                  <span className="text-[11px] font-semibold" style={{ color: diffStyle.color }}>{difficulty}</span>
                </div>
              )}
              {servings && (
                <div className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg"
                  style={{ backgroundColor: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.09)" }}>
                  <Users size={11} style={{ color: `${YELLOW_BG}0.8)` }} />
                  <span className="text-[11px] font-semibold" style={{ color: "rgba(245,242,241,0.85)" }}>Serves {servings}</span>
                </div>
              )}
            </div>

            {/* Two-column: Ingredients + Steps */}
            <div className="grid grid-cols-5 gap-3">
              {/* Ingredients — 2 cols */}
              {ingredientsList.length > 0 && (
                <div className="col-span-2 space-y-2">
                  <p className="text-[10px] font-semibold uppercase tracking-wider" style={{ color: `${YELLOW_BG}0.7)` }}>
                    Ingredients
                  </p>
                  <div className="space-y-1">
                    {ingredientsList.map((ing, i) => (
                      <div key={i} className="flex items-start gap-2 py-1 px-2 rounded-md"
                        style={{ backgroundColor: "rgba(255,255,255,0.03)" }}>
                        <span className="mt-0.5 flex-shrink-0 w-1.5 h-1.5 rounded-full" style={{ backgroundColor: YELLOW, marginTop: 5 }} />
                        <span className="text-[11px] leading-snug" style={{ color: "rgba(245,242,241,0.75)" }}>{ing}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Steps — 3 cols */}
              {steps.length > 0 && (
                <div className={`${ingredientsList.length > 0 ? "col-span-3" : "col-span-5"} space-y-2`}>
                  <p className="text-[10px] font-semibold uppercase tracking-wider" style={{ color: `${YELLOW_BG}0.7)` }}>
                    Instructions
                  </p>
                  <div className="space-y-2">
                    {steps.map((step, i) => (
                      <div key={i} className="flex gap-2.5">
                        <span className="flex-shrink-0 w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold mt-0.5"
                          style={{ backgroundColor: `${YELLOW_BG}0.2)`, color: YELLOW }}>
                          {i + 1}
                        </span>
                        <p className="text-[11px] leading-relaxed" style={{ color: "rgba(245,242,241,0.75)" }}>{step}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Pro tip */}
            {tips && (
              <div className="flex items-start gap-2.5 px-3 py-2.5 rounded-lg"
                style={{ backgroundColor: `${YELLOW_BG}0.07)`, border: `1px solid ${YELLOW_BG}0.15)` }}>
                <Lightbulb size={13} style={{ color: YELLOW, flexShrink: 0, marginTop: 1 }} />
                <p className="text-[11px] leading-relaxed" style={{ color: "rgba(245,242,241,0.7)" }}>
                  <span className="font-semibold" style={{ color: YELLOW }}>Chef's tip: </span>
                  {tips}
                </p>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
};

export default RecipeCard;
