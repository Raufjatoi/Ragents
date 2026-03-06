import { motion } from "framer-motion";
import { Check } from "lucide-react";

export type Cuisine = "chinese" | "thai" | "indian" | "italian" | "mexican" | "japanese" | "korean" | "american" | "french" | "mediterranean";
export type Ingredient = "chicken" | "beef" | "fish" | "shrimp" | "tofu" | "rice" | "noodles" | "vegetables" | "egg" | "cheese";

interface CuisineInfo { label: string; icon: string }
interface IngredientInfo { label: string; icon: string }

export const cuisines: Record<Cuisine, CuisineInfo> = {
  chinese: { label: "Chinese", icon: "🥡" },
  thai: { label: "Thai", icon: "🍜" },
  indian: { label: "Desi", icon: "🍛" },
  italian: { label: "Italian", icon: "🍝" },
  mexican: { label: "Mexican", icon: "🌮" },
  japanese: { label: "Japanese", icon: "🍣" },
  korean: { label: "Korean", icon: "🥘" },
  american: { label: "American", icon: "🍔" },
  french: { label: "French", icon: "🥐" },
  mediterranean: { label: "Mediter.", icon: "🫒" },
};

export const ingredients: Record<Ingredient, IngredientInfo> = {
  chicken: { label: "Chicken", icon: "🍗" },
  beef: { label: "Beef", icon: "🥩" },
  fish: { label: "Fish", icon: "🐟" },
  shrimp: { label: "Shrimp", icon: "🦐" },
  tofu: { label: "Tofu", icon: "🧈" },
  rice: { label: "Rice", icon: "🍚" },
  noodles: { label: "Noodles", icon: "🍜" },
  vegetables: { label: "Veggies", icon: "🥦" },
  egg: { label: "Egg", icon: "🥚" },
  cheese: { label: "Cheese", icon: "🧀" },
};

interface CookingSelectorProps {
  step: "cuisine" | "ingredients";
  selectedCuisine: Cuisine | null;
  selectedIngredients: Ingredient[];
  onCuisineSelect: (c: Cuisine) => void;
  onIngredientToggle: (i: Ingredient) => void;
  onConfirmIngredients: () => void;
}

const CookingSelector = ({ step, selectedCuisine, selectedIngredients, onCuisineSelect, onIngredientToggle, onConfirmIngredients }: CookingSelectorProps) => {
  if (step === "cuisine") {
    return (
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        className="grid grid-cols-5 gap-2 p-3 rounded-xl"
        style={{ backgroundColor: "rgba(234,179,8,0.08)", border: "1px solid rgba(234,179,8,0.15)" }}
      >
        {(Object.keys(cuisines) as Cuisine[]).map((key) => {
          const c = cuisines[key];
          const isSelected = selectedCuisine === key;
          return (
            <button
              key={key}
              onClick={() => onCuisineSelect(key)}
              className="relative flex flex-col items-center gap-1 px-2 py-3 rounded-lg text-xs font-medium transition-all duration-200 hover:scale-105"
              style={{
                backgroundColor: isSelected ? "rgba(234,179,8,0.25)" : "rgba(255,255,255,0.05)",
                border: `1px solid ${isSelected ? "rgba(234,179,8,0.4)" : "rgba(255,255,255,0.08)"}`,
                color: isSelected ? "#facc15" : "rgba(245,242,241,0.6)",
              }}
            >
              {isSelected && <div className="absolute top-1 right-1"><Check size={10} style={{ color: "#facc15" }} /></div>}
              <span className="text-lg">{c.icon}</span>
              <span className="text-[10px]">{c.label}</span>
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
        style={{ backgroundColor: "rgba(234,179,8,0.08)", border: "1px solid rgba(234,179,8,0.15)" }}
      >
        {(Object.keys(ingredients) as Ingredient[]).map((key) => {
          const ing = ingredients[key];
          const isSelected = selectedIngredients.includes(key);
          return (
            <button
              key={key}
              onClick={() => onIngredientToggle(key)}
              className="relative flex flex-col items-center gap-1 px-2 py-3 rounded-lg text-xs font-medium transition-all duration-200 hover:scale-105"
              style={{
                backgroundColor: isSelected ? "rgba(234,179,8,0.25)" : "rgba(255,255,255,0.05)",
                border: `1px solid ${isSelected ? "rgba(234,179,8,0.4)" : "rgba(255,255,255,0.08)"}`,
                color: isSelected ? "#facc15" : "rgba(245,242,241,0.6)",
              }}
            >
              {isSelected && <div className="absolute top-1 right-1"><Check size={10} style={{ color: "#facc15" }} /></div>}
              <span className="text-lg">{ing.icon}</span>
              <span className="text-[10px]">{ing.label}</span>
            </button>
          );
        })}
      </div>
      {selectedIngredients.length > 0 && (
        <button
          onClick={onConfirmIngredients}
          className="w-full py-2 rounded-lg text-sm font-medium transition-all hover:scale-[1.02]"
          style={{ backgroundColor: "rgba(234,179,8,0.25)", color: "#facc15", border: "1px solid rgba(234,179,8,0.3)" }}
        >
          Find dishes with {selectedIngredients.length} ingredient{selectedIngredients.length > 1 ? "s" : ""} →
        </button>
      )}
    </motion.div>
  );
};

export default CookingSelector;
