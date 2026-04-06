import { motion } from "framer-motion";
import { Check } from "lucide-react";

export type Country =
  | "pakistani" | "indian" | "korean" | "japanese" | "chinese"
  | "thai" | "american" | "british" | "italian" | "mexican"
  | "french" | "turkish" | "greek" | "vietnamese";

export type Ingredient =
  | "chicken" | "beef" | "fish" | "shrimp" | "tofu"
  | "rice" | "noodles" | "vegetables" | "egg" | "cheese";

interface CountryInfo { label: string; flag: string }
interface IngredientInfo { label: string; icon: string }

const flagColors: Record<Country, { bg: string; text: string; border: string; hover: string }> = {
  pakistani:  { bg: "#0d6b2e", text: "#ffffff", border: "#0d8a3a", hover: "#0a5524" },
  indian:     { bg: "#FF9933", text: "#ffffff", border: "#138808", hover: "#e8851a" },
  korean:     { bg: "#CD2E3A", text: "#ffffff", border: "#003478", hover: "#b02432" },
  japanese:   { bg: "#BC002D", text: "#ffffff", border: "#d4003a", hover: "#9e0027" },
  chinese:    { bg: "#DE2910", text: "#FFDE00", border: "#c52208", hover: "#c02008" },
  thai:       { bg: "#A51931", text: "#F4F5F8", border: "#2D2A4A", hover: "#8e1429" },
  american:   { bg: "#B22234", text: "#ffffff", border: "#3C3B6E", hover: "#9a1c2c" },
  british:    { bg: "#012169", text: "#ffffff", border: "#C8102E", hover: "#011850" },
  italian:    { bg: "#009246", text: "#ffffff", border: "#CE2B37", hover: "#007a3a" },
  mexican:    { bg: "#006847", text: "#ffffff", border: "#CE1126", hover: "#00573b" },
  french:     { bg: "#0055A4", text: "#ffffff", border: "#EF4135", hover: "#00448a" },
  turkish:    { bg: "#E30A17", text: "#ffffff", border: "#ff2233", hover: "#c80812" },
  greek:      { bg: "#0D5EAF", text: "#ffffff", border: "#ffffff", hover: "#0a4e93" },
  vietnamese: { bg: "#DA251D", text: "#FFCD00", border: "#c01e17", hover: "#be1f18" },
};

export const countries: Record<Country, CountryInfo> = {
  pakistani:  { label: "Pakistani",  flag: "🇵🇰" },
  indian:     { label: "Indian",     flag: "🇮🇳" },
  korean:     { label: "Korean",     flag: "🇰🇷" },
  japanese:   { label: "Japanese",   flag: "🇯🇵" },
  chinese:    { label: "Chinese",    flag: "🇨🇳" },
  thai:       { label: "Thai",       flag: "🇹🇭" },
  american:   { label: "American",   flag: "🇺🇸" },
  british:    { label: "British",    flag: "🇬🇧" },
  italian:    { label: "Italian",    flag: "🇮🇹" },
  mexican:    { label: "Mexican",    flag: "🇲🇽" },
  french:     { label: "French",     flag: "🇫🇷" },
  turkish:    { label: "Turkish",    flag: "🇹🇷" },
  greek:      { label: "Greek",      flag: "🇬🇷" },
  vietnamese: { label: "Vietnamese", flag: "🇻🇳" },
};

export const countryDishes: Record<Country, { name: string; emoji: string }[]> = {
  pakistani:  [
    { name: "Biryani",        emoji: "🍛" }, { name: "Nihari",          emoji: "🍖" },
    { name: "Karahi",         emoji: "🍲" }, { name: "Haleem",          emoji: "🫕" },
    { name: "Chapli Kabab",   emoji: "🥙" }, { name: "Saag",            emoji: "🥬" },
    { name: "Dal Makhani",    emoji: "🫘" }, { name: "Paya",            emoji: "🍵" },
  ],
  indian:     [
    { name: "Butter Chicken", emoji: "🍗" }, { name: "Palak Paneer",    emoji: "🥬" },
    { name: "Biryani",        emoji: "🍛" }, { name: "Chole Bhature",   emoji: "🍞" },
    { name: "Dal Tadka",      emoji: "🍲" }, { name: "Rogan Josh",      emoji: "🍖" },
    { name: "Aloo Gobi",      emoji: "🥔" }, { name: "Samosa",          emoji: "🥟" },
  ],
  korean:     [
    { name: "Bibimbap",       emoji: "🍲" }, { name: "Tteokbokki",      emoji: "🍜" },
    { name: "Kimchi Jjigae",  emoji: "🫕" }, { name: "Bulgogi",         emoji: "🥩" },
    { name: "Japchae",        emoji: "🍜" }, { name: "Samgyeopsal",     emoji: "🥓" },
    { name: "Sundubu-jjigae", emoji: "🍳" }, { name: "Dakgalbi",        emoji: "🍗" },
  ],
  japanese:   [
    { name: "Ramen",          emoji: "🍜" }, { name: "Sushi",           emoji: "🍣" },
    { name: "Tempura",        emoji: "🍤" }, { name: "Tonkatsu",        emoji: "🍖" },
    { name: "Miso Soup",      emoji: "🍵" }, { name: "Takoyaki",        emoji: "🐙" },
    { name: "Udon",           emoji: "🍜" }, { name: "Yakitori",        emoji: "🍢" },
  ],
  chinese:    [
    { name: "Kung Pao Chicken",emoji: "🍗" },{ name: "Dim Sum",         emoji: "🥟" },
    { name: "Mapo Tofu",      emoji: "🌶️" }, { name: "Peking Duck",     emoji: "🦆" },
    { name: "Fried Rice",     emoji: "🍚" }, { name: "Hot Pot",         emoji: "🫕" },
    { name: "Char Siu",       emoji: "🥩" }, { name: "Spring Rolls",    emoji: "🥚" },
  ],
  thai:       [
    { name: "Pad Thai",       emoji: "🍜" }, { name: "Green Curry",     emoji: "🍛" },
    { name: "Tom Yum Soup",   emoji: "🍵" }, { name: "Som Tum",         emoji: "🥗" },
    { name: "Massaman Curry", emoji: "🍛" }, { name: "Pad See Ew",      emoji: "🍜" },
    { name: "Khao Man Gai",   emoji: "🍗" }, { name: "Mango Sticky Rice",emoji: "🥭" },
  ],
  american:   [
    { name: "Burger",         emoji: "🍔" }, { name: "BBQ Ribs",        emoji: "🥩" },
    { name: "Mac & Cheese",   emoji: "🧀" }, { name: "Pancakes",        emoji: "🥞" },
    { name: "Clam Chowder",   emoji: "🍲" }, { name: "Buffalo Wings",   emoji: "🍗" },
    { name: "Pulled Pork",    emoji: "🥙" }, { name: "Cheesecake",      emoji: "🍰" },
  ],
  british:    [
    { name: "Fish & Chips",   emoji: "🐟" }, { name: "Shepherd's Pie",  emoji: "🥧" },
    { name: "Full English",   emoji: "🍳" }, { name: "Beef Wellington",  emoji: "🥩" },
    { name: "Tikka Masala",   emoji: "🍛" }, { name: "Bangers & Mash",  emoji: "🌭" },
    { name: "Scones",         emoji: "🧁" }, { name: "Sticky Toffee Pudding",emoji:"🍮"},
  ],
  italian:    [
    { name: "Pasta Carbonara",emoji: "🍝" }, { name: "Pizza Margherita", emoji: "🍕" },
    { name: "Risotto",        emoji: "🍚" }, { name: "Osso Buco",       emoji: "🥩" },
    { name: "Tiramisu",       emoji: "🍰" }, { name: "Lasagna",         emoji: "🍝" },
    { name: "Gnocchi",        emoji: "🥟" }, { name: "Bruschetta",      emoji: "🍞" },
  ],
  mexican:    [
    { name: "Tacos al Pastor",emoji: "🌮" }, { name: "Enchiladas",      emoji: "🫔" },
    { name: "Guacamole",      emoji: "🥑" }, { name: "Pozole",          emoji: "🍲" },
    { name: "Tamales",        emoji: "🫔" }, { name: "Churros",         emoji: "🍩" },
    { name: "Mole",           emoji: "🍗" }, { name: "Quesadilla",      emoji: "🫓" },
  ],
  french:     [
    { name: "Beef Bourguignon",emoji:"🥩" }, { name: "Coq au Vin",      emoji: "🍗" },
    { name: "Ratatouille",    emoji: "🫕" }, { name: "Croissant",       emoji: "🥐" },
    { name: "Crêpes",         emoji: "🥞" }, { name: "Bouillabaisse",   emoji: "🍲" },
    { name: "Soufflé",        emoji: "🍮" }, { name: "Crème Brûlée",    emoji: "🍮" },
  ],
  turkish:    [
    { name: "Kebab",          emoji: "🥙" }, { name: "Baklava",         emoji: "🍯" },
    { name: "Pide",           emoji: "🫓" }, { name: "Manti",           emoji: "🥟" },
    { name: "Lahmacun",       emoji: "🫔" }, { name: "Menemen",         emoji: "🍳" },
    { name: "Dolma",          emoji: "🫑" }, { name: "Iskender",        emoji: "🥩" },
  ],
  greek:      [
    { name: "Moussaka",       emoji: "🍲" }, { name: "Spanakopita",     emoji: "🥧" },
    { name: "Souvlaki",       emoji: "🥙" }, { name: "Tzatziki",        emoji: "🥒" },
    { name: "Pastitsio",      emoji: "🍝" }, { name: "Greek Salad",     emoji: "🥗" },
    { name: "Baklava",        emoji: "🍯" }, { name: "Loukoumades",     emoji: "🍩" },
  ],
  vietnamese: [
    { name: "Pho",            emoji: "🍜" }, { name: "Bánh Mì",         emoji: "🥖" },
    { name: "Gỏi Cuốn",      emoji: "🌿" }, { name: "Bún Bò Huế",      emoji: "🍜" },
    { name: "Cơm Tấm",       emoji: "🍚" }, { name: "Bánh Xèo",        emoji: "🫓" },
    { name: "Chả Giò",       emoji: "🥢" }, { name: "Cao Lầu",         emoji: "🍜" },
  ],
};

export const ingredients: Record<Ingredient, IngredientInfo> = {
  chicken:    { label: "Chicken",  icon: "🍗" },
  beef:       { label: "Beef",     icon: "🥩" },
  fish:       { label: "Fish",     icon: "🐟" },
  shrimp:     { label: "Shrimp",   icon: "🦐" },
  tofu:       { label: "Tofu",     icon: "🧈" },
  rice:       { label: "Rice",     icon: "🍚" },
  noodles:    { label: "Noodles",  icon: "🍜" },
  vegetables: { label: "Veggies",  icon: "🥦" },
  egg:        { label: "Egg",      icon: "🥚" },
  cheese:     { label: "Cheese",   icon: "🧀" },
};

interface CookingSelectorProps {
  step: "country" | "dish" | "ingredients";
  selectedCountry: Country | null;
  selectedDish: string | null;
  selectedIngredients: Ingredient[];
  onCountrySelect: (c: Country) => void;
  onDishSelect: (dish: string, emoji: string) => void;
  onIngredientToggle: (i: Ingredient) => void;
  onConfirmIngredients: () => void;
  onSkipIngredients: () => void;
}

const YELLOW = "#facc15";
const YELLOW_BG = "rgba(234,179,8,";

const CookingSelector = ({
  step, selectedCountry, selectedDish, selectedIngredients,
  onCountrySelect, onDishSelect, onIngredientToggle, onConfirmIngredients, onSkipIngredients,
}: CookingSelectorProps) => {

  if (step === "country") {
    return (
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        className="grid grid-cols-7 gap-2 p-3 rounded-xl"
        style={{ backgroundColor: `${YELLOW_BG}0.08)`, border: `1px solid ${YELLOW_BG}0.15)` }}
      >
        {(Object.keys(countries) as Country[]).map((key) => {
          const c = countries[key];
          const fc = flagColors[key];
          const isSelected = selectedCountry === key;
          return (
            <button
              key={key}
              onClick={() => onCountrySelect(key)}
              className="relative flex flex-col items-center gap-1 px-1 py-2.5 rounded-lg text-xs font-medium transition-all duration-200 hover:scale-105"
              style={{
                backgroundColor: isSelected ? fc.bg : "rgba(255,255,255,0.05)",
                border: `1px solid ${isSelected ? fc.border : "rgba(255,255,255,0.08)"}`,
                color: isSelected ? fc.text : "rgba(245,242,241,0.65)",
                boxShadow: isSelected ? `0 0 8px ${fc.bg}55` : "none",
              }}
              onMouseEnter={(e) => {
                if (!isSelected) {
                  e.currentTarget.style.backgroundColor = `${fc.bg}22`;
                  e.currentTarget.style.borderColor = `${fc.border}66`;
                  e.currentTarget.style.color = fc.text === "#ffffff" ? "rgba(245,242,241,0.9)" : fc.text;
                }
              }}
              onMouseLeave={(e) => {
                if (!isSelected) {
                  e.currentTarget.style.backgroundColor = "rgba(255,255,255,0.05)";
                  e.currentTarget.style.borderColor = "rgba(255,255,255,0.08)";
                  e.currentTarget.style.color = "rgba(245,242,241,0.65)";
                }
              }}
            >
              {isSelected && (
                <div className="absolute top-0.5 right-0.5">
                  <Check size={9} style={{ color: fc.text }} />
                </div>
              )}
              <span className="text-xl leading-none">{c.flag}</span>
              <span className="text-[9px] mt-0.5 text-center leading-tight">{c.label}</span>
            </button>
          );
        })}
      </motion.div>
    );
  }

  if (step === "dish" && selectedCountry) {
    const dishes = countryDishes[selectedCountry];
    const countryInfo = countries[selectedCountry];
    return (
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        className="space-y-2"
      >
        <div className="flex items-center gap-2 px-1">
          <span className="text-base">{countryInfo.flag}</span>
          <span className="text-xs font-semibold" style={{ color: YELLOW }}>Popular {countryInfo.label} Dishes</span>
        </div>
        <div
          className="grid grid-cols-4 gap-2 p-3 rounded-xl"
          style={{ backgroundColor: `${YELLOW_BG}0.08)`, border: `1px solid ${YELLOW_BG}0.15)` }}
        >
          {dishes.map((dish) => {
            const isSelected = selectedDish === dish.name;
            return (
              <button
                key={dish.name}
                onClick={() => onDishSelect(dish.name, dish.emoji)}
                className="relative flex flex-col items-center gap-1 px-2 py-3 rounded-lg text-xs font-medium transition-all duration-200 hover:scale-105"
                style={{
                  backgroundColor: isSelected ? `${YELLOW_BG}0.25)` : "rgba(255,255,255,0.05)",
                  border: `1px solid ${isSelected ? `${YELLOW_BG}0.4)` : "rgba(255,255,255,0.08)"}`,
                  color: isSelected ? YELLOW : "rgba(245,242,241,0.65)",
                }}
              >
                {isSelected && (
                  <div className="absolute top-1 right-1">
                    <Check size={10} style={{ color: YELLOW }} />
                  </div>
                )}
                <span className="text-xl">{dish.emoji}</span>
                <span className="text-[10px] text-center leading-tight mt-0.5">{dish.name}</span>
              </button>
            );
          })}
        </div>
      </motion.div>
    );
  }

  if (step === "ingredients") {
    return (
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        className="space-y-3"
      >
        <div
          className="grid grid-cols-5 gap-2 p-3 rounded-xl"
          style={{ backgroundColor: `${YELLOW_BG}0.08)`, border: `1px solid ${YELLOW_BG}0.15)` }}
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
                  backgroundColor: isSelected ? `${YELLOW_BG}0.25)` : "rgba(255,255,255,0.05)",
                  border: `1px solid ${isSelected ? `${YELLOW_BG}0.4)` : "rgba(255,255,255,0.08)"}`,
                  color: isSelected ? YELLOW : "rgba(245,242,241,0.65)",
                }}
              >
                {isSelected && (
                  <div className="absolute top-1 right-1">
                    <Check size={10} style={{ color: YELLOW }} />
                  </div>
                )}
                <span className="text-xl">{ing.icon}</span>
                <span className="text-[10px]">{ing.label}</span>
              </button>
            );
          })}
        </div>
        <div className="flex gap-2">
          {selectedIngredients.length > 0 && (
            <button
              onClick={onConfirmIngredients}
              className="flex-1 py-2 rounded-lg text-sm font-medium transition-all hover:scale-[1.02]"
              style={{ backgroundColor: `${YELLOW_BG}0.25)`, color: YELLOW, border: `1px solid ${YELLOW_BG}0.3)` }}
            >
              Use {selectedIngredients.length} ingredient{selectedIngredients.length > 1 ? "s" : ""} →
            </button>
          )}
          <button
            onClick={onSkipIngredients}
            className="px-4 py-2 rounded-lg text-sm font-medium transition-all hover:scale-[1.02]"
            style={{ backgroundColor: "rgba(255,255,255,0.05)", color: "rgba(245,242,241,0.5)", border: "1px solid rgba(255,255,255,0.08)" }}
          >
            Skip →
          </button>
        </div>
      </motion.div>
    );
  }

  return null;
};

export default CookingSelector;
