import { useState, useRef, useEffect } from "react";
import ReactMarkdown from "react-markdown";
import { Send, ChevronDown, Bot, MessageSquare, Loader2, Share2, Palette, Music, ChefHat, Plus, ScanSearch } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "sonner";
import AiDetectionResult from "@/components/AiDetectionResult";
import ContentUpload from "@/components/ContentUpload";
import PlatformSelector, { platforms, type Platform } from "@/components/PlatformSelector";
import MusicSelector, { genres, instruments, type MusicGenre, type Instrument } from "@/components/MusicSelector";
import CookingSelector, { cuisines, ingredients as cookIngredients, type Cuisine, type Ingredient as CookIngredient } from "@/components/CookingSelector";
import AgentBuilder, { type CustomAgentConfig, getIconByKey, getCustomTheme, getCustomDropdownBg } from "@/components/AgentBuilder";
import SocialPostBuilder from "@/components/SocialPostBuilder";
import { DesignToolSelector, DesignPromptBuilder, aiTools, type AiTool, type DesignStage } from "@/components/DesignPromptBuilder";
import ApiKeyControl, { type ApiSettings } from "@/components/ApiKeyControl";


type BuiltInAgent = "default" | "content" | "social" | "design" | "music" | "cooking";
type Agent = BuiltInAgent | string;

interface AiDetection {
  score: number;
  text: string;
}

interface Message {
  id: number;
  text: string;
  sender: "user" | "bot";
  aiDetection?: AiDetection;
  showPlatformSelector?: boolean;
  showGenreSelector?: boolean;
  showInstrumentSelector?: boolean;
  showCuisineSelector?: boolean;
  showCookIngredientSelector?: boolean;
  showSocialBuilder?: boolean;
  showDesignToolSelector?: boolean;
  showDesignBuilder?: boolean;
  platform?: Platform;
  switchSuggestion?: string;
}

interface DesignPromptState {
  idea: string;
  style: string;
  color: string;
  lighting: string;
  compose: string;
  finalPrompt: string;
  stage: DesignStage;
}

interface SocialPostState {
  topic: string;
  hook: string;
  description: string;
  final: string;
  cta: string;
  stage: "hook_pick" | "hook_gen" | "desc_pick" | "desc_gen" | "final_pick" | "final_gen" | "cta_ask" | "cta_gen" | "done";
}

const GROQ_KEY = import.meta.env.VITE_GROQ_API_KEY || "";
const OPENAI_KEY = import.meta.env.VITE_OPENAI_API_KEY || "";
const GEMINI_KEY = import.meta.env.VITE_GEMINI_API_KEY || "";
const CLAUDE_KEY = import.meta.env.VITE_CLAUDE_API_KEY || "";

const agents = {
  default: { label: "Ragent", icon: MessageSquare },
  content: { label: "AI Content Detector", icon: ScanSearch },
  social: { label: "Social Agent", icon: Share2 },
  design: { label: "Design Agent", icon: Palette },
  music: { label: "Music Agent", icon: Music },
  cooking: { label: "Cooking Agent", icon: ChefHat },
};

const agentThemes = {
  default: { bg: "#3a0204", headerBg: "rgba(58,2,4,0.8)", border: "rgba(255,255,255,0.1)", accent: "#f5f2f1", accentRgba: "rgba(255,255,255," },
  content: { bg: "#1a0a2e", headerBg: "rgba(26,10,46,0.8)", border: "rgba(168,85,247,0.2)", accent: "#c084fc", accentRgba: "rgba(168,85,247," },
  social: { bg: "#0a1f0a", headerBg: "rgba(10,31,10,0.8)", border: "rgba(34,197,94,0.2)", accent: "#4ade80", accentRgba: "rgba(34,197,94," },
  design: { bg: "#1f0f00", headerBg: "rgba(31,15,0,0.8)", border: "rgba(249,115,22,0.2)", accent: "#fb923c", accentRgba: "rgba(249,115,22," },
  music: { bg: "#1f0a1a", headerBg: "rgba(31,10,26,0.8)", border: "rgba(236,72,153,0.2)", accent: "#f472b6", accentRgba: "rgba(236,72,153," },
  cooking: { bg: "#1a1500", headerBg: "rgba(26,21,0,0.8)", border: "rgba(234,179,8,0.2)", accent: "#facc15", accentRgba: "rgba(234,179,8," },
};

const dropdownBgs: Record<BuiltInAgent, string> = {
  default: "#5a0a0d",
  content: "#2d1b4e",
  social: "#0f2b0f",
  design: "#2b1a00",
  music: "#2b0f24",
  cooking: "#2b2400",
};

const agentDescs: Record<BuiltInAgent, string> = {
  default: "General assistant",
  content: "Detect AI-generated content",
  social: "Generate social media posts",
  design: "AI image prompt generator",
  music: "Lyrics & music prompt generator",
  cooking: "Dish suggestions & recipes",
};

const callAI = async (messages: { role: string; content: string }[], settings: ApiSettings) => {
  const { selectedProvider, selectedModel, ...keys } = settings;
  let key = (keys as any)[selectedProvider];

  if (!key) {
    if (selectedProvider === "groq") key = GROQ_KEY;
    else if (selectedProvider === "openai") key = OPENAI_KEY;
    else if (selectedProvider === "gemini") key = GEMINI_KEY;
    else if (selectedProvider === "claude") key = CLAUDE_KEY;
  }

  if (!key) {
    throw new Error(`API key for ${selectedProvider} is missing in Control panel.`);
  }

  let url = "";
  let body: any = { model: selectedModel, messages };

  switch (selectedProvider) {
    case "groq":
      url = "https://api.groq.com/openai/v1/chat/completions";
      break;
    case "openai":
      url = "https://api.openai.com/v1/chat/completions";
      break;
    case "gemini":
      url = `https://generativelanguage.googleapis.com/v1beta/models/${selectedModel}:generateContent?key=${key}`;
      body = {
        contents: messages.map(m => ({
          role: m.role === "assistant" ? "model" : "user",
          parts: [{ text: m.content }]
        }))
      };
      break;
    case "claude":
      url = "https://api.anthropic.com/v1/messages";
      body = {
        model: selectedModel,
        max_tokens: 1024,
        messages: messages.map(m => ({ role: m.role, content: m.content })),
        system: messages.find(m => m.role === "system")?.content || ""
      };
      // Anthropic requires specific headers and doesn't want system in messages
      body.messages = body.messages.filter((m: any) => m.role !== "system");
      break;
  }

  const headers: Record<string, string> = { "Content-Type": "application/json" };
  if (selectedProvider !== "gemini") {
    headers["Authorization"] = `Bearer ${key}`;
  }
  if (selectedProvider === "claude") {
    headers["x-api-key"] = key;
    headers["anthropic-version"] = "2023-06-01";
    headers["anthropic-dangerous-direct-browser-access"] = "true";
    delete headers["Authorization"];
  }

  const res = await fetch(url, {
    method: "POST",
    headers,
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    const errData = await res.json().catch(() => ({}));
    throw new Error(errData.error?.message || `API error: ${res.status}`);
  }

  const data = await res.json();

  if (selectedProvider === "gemini") {
    return data.candidates?.[0]?.content?.parts?.[0]?.text || "No response.";
  }
  if (selectedProvider === "claude") {
    return data.content?.[0]?.text || "No response.";
  }
  return data.choices?.[0]?.message?.content || "No response.";
};


const stripMarkdown = (text: string) => {
  return text
    .replace(/^#{1,6}\s+/gm, "")        // ## headings
    .replace(/\*\*(.+?)\*\*/g, "$1")     // **bold**
    .replace(/\*(.+?)\*/g, "$1")         // *italic*
    .replace(/__(.+?)__/g, "$1")         // __bold__
    .replace(/_(.+?)_/g, "$1")           // _italic_
    .replace(/~~(.+?)~~/g, "$1")         // ~~strike~~
    .replace(/`(.+?)`/g, "$1")           // `code`
    .replace(/^>\s+/gm, "")             // > blockquotes
    .replace(/^[-*+]\s+/gm, "• ")       // bullet lists → clean bullet
    .replace(/^\d+\.\s+/gm, "")         // numbered lists
    .replace(/\[([^\]]+)\]\([^)]+\)/g, "$1") // [link](url) → link
    .replace(/^---+$/gm, "")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
};

const builtInAgents: BuiltInAgent[] = ["default", "content", "social", "design", "music", "cooking"];

const normalizeReply = (text: string) => {
  return text
    .split("\n")
    .filter((line) => {
      const trimmed = line.trim();
      if (!trimmed) return true;

      // Remove decorative divider lines like -----, |-----|, |||||, etc.
      if (/^[\-|:]{4,}$/.test(trimmed)) return false;
      if (/^[\s\-|:|]{4,}$/.test(trimmed)) return false;

      // Remove markdown table separator rows like | --- | --- |
      if (/^\|?\s*:?-{3,}:?\s*(\|\s*:?-{3,}:?\s*)+\|?$/.test(trimmed)) return false;

      return true;
    })
    .join("\n")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
};

const Dashboard = () => {
  const [activeAgent, setActiveAgent] = useState<Agent>("default");
  const [messages, setMessages] = useState<Message[]>([
    { id: 1, text: "Hey! 👋 I'm Ragent, your guide to the Ragents platform by Abdul Rauf Jatoi. I know all the agents here — tell me what you need and I'll point you to the right one, or just chat with me!", sender: "bot" },
  ]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [apiSettings, setApiSettings] = useState<ApiSettings>(() => {
    const saved = localStorage.getItem("ragents_api_settings");
    return saved ? JSON.parse(saved) : {
      selectedProvider: "groq",
      selectedModel: "llama-3.3-70b-versatile",
    };
  });

  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [humanizingId, setHumanizingId] = useState<number | null>(null);
  const [selectedPlatform, setSelectedPlatform] = useState<Platform | null>(null);
  const [selectedGenre, setSelectedGenre] = useState<MusicGenre | null>(null);
  const [selectedInstruments, setSelectedInstruments] = useState<Instrument[]>([]);
  const [musicStep, setMusicStep] = useState<"genre" | "instruments" | "ready">("genre");
  const [selectedCuisine, setSelectedCuisine] = useState<Cuisine | null>(null);
  const [selectedCookIngredients, setSelectedCookIngredients] = useState<CookIngredient[]>([]);
  const [cookingStep, setCookingStep] = useState<"cuisine" | "ingredients" | "ready">("cuisine");
  const [customAgents, setCustomAgents] = useState<CustomAgentConfig[]>(() => {
    const saved = localStorage.getItem("ragents_custom_agents");
    return saved ? JSON.parse(saved) : [];
  });
  const [showBuilder, setShowBuilder] = useState(false);
  const [socialPost, setSocialPost] = useState<SocialPostState | null>(null);
  const [selectedAiTool, setSelectedAiTool] = useState<AiTool | null>(null);
  const [designPrompt, setDesignPrompt] = useState<DesignPromptState | null>(null);
  const endRef = useRef<HTMLDivElement>(null);

  const isCustomAgent = !builtInAgents.includes(activeAgent as BuiltInAgent);
  const customAgent = customAgents.find((a) => a.id === activeAgent);

  const theme = isCustomAgent && customAgent
    ? getCustomTheme(customAgent.colorHue)
    : agentThemes[activeAgent as BuiltInAgent] || agentThemes.default;

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  useEffect(() => {
    localStorage.setItem("ragents_custom_agents", JSON.stringify(customAgents));
  }, [customAgents]);

  const detectAi = async (text: string): Promise<number> => {
    const prompt = `Analyze the following text and estimate the probability (0-100) that it was written by AI. Only respond with a single integer number, nothing else.\n\nText:\n"""${text.slice(0, 3000)}"""`;
    const result = await callAI([{ role: "user", content: prompt }], apiSettings);
    const num = parseInt(result.trim(), 10);
    return isNaN(num) ? 50 : Math.min(100, Math.max(0, num));
  };


  const handleContentCheck = async (text: string) => {
    const userMsg: Message = { id: Date.now(), text: `Check this content for AI:\n\n"${text.slice(0, 500)}${text.length > 500 ? "..." : ""}"`, sender: "user" };
    setMessages((prev) => [...prev, userMsg]);
    setIsLoading(true);
    try {
      const score = await detectAi(text);
      setMessages((prev) => [...prev, { id: Date.now() + 1, text: "Here's the AI detection analysis:", sender: "bot", aiDetection: { score, text } }]);
    } catch (err: any) {
      toast.error("Detection failed: " + (err.message || "Unknown error"));
    } finally {
      setIsLoading(false);
    }
  };

  const handleHumanize = async (msgId: number) => {
    const msg = messages.find((m) => m.id === msgId);
    if (!msg?.aiDetection) return;
    setHumanizingId(msgId);
    try {
      const humanized = await callAI([
        { role: "system", content: "Rewrite the following text to sound more natural and human-written. Maintain the same meaning and length. Do not add any preamble, just output the rewritten text." },
        { role: "user", content: msg.aiDetection.text },
      ], apiSettings);
      const newScore = await detectAi(humanized);

      setMessages((prev) => [...prev, { id: Date.now(), text: "Here's the humanized version:", sender: "bot", aiDetection: { score: newScore, text: humanized } }]);
    } catch (err: any) {
      toast.error("Humanization failed: " + (err.message || "Unknown error"));
    } finally {
      setHumanizingId(null);
    }
  };

  const handlePlatformSelect = (p: Platform) => {
    setSelectedPlatform(p);
    setMessages((prev) => [
      ...prev,
      { id: Date.now(), text: `Selected: ${platforms[p].icon} ${platforms[p].label}`, sender: "user", platform: p },
      { id: Date.now() + 1, text: `Great! I'll create content for ${platforms[p].label}. Tell me what you'd like to post about!`, sender: "bot" },
    ]);
  };

  const handleGenreSelect = (g: MusicGenre) => {
    setSelectedGenre(g);
    setMusicStep("instruments");
    setMessages((prev) => [
      ...prev,
      { id: Date.now(), text: `${genres[g].icon} ${genres[g].label}`, sender: "user" },
      { id: Date.now() + 1, text: `Great choice! Now pick the instruments you want in your ${genres[g].label} track:`, sender: "bot", showInstrumentSelector: true },
    ]);
  };

  const handleInstrumentToggle = (i: Instrument) => {
    setSelectedInstruments((prev) =>
      prev.includes(i) ? prev.filter((x) => x !== i) : [...prev, i]
    );
  };

  const handleConfirmInstruments = () => {
    setMusicStep("ready");
    const instLabels = selectedInstruments.map((i) => `${instruments[i].icon} ${instruments[i].label}`).join(", ");
    setMessages((prev) => [
      ...prev,
      { id: Date.now(), text: `Instruments: ${instLabels}`, sender: "user" },
      { id: Date.now() + 1, text: `Perfect! 🎵 Now tell me the theme, mood, or topic for your song and I'll generate lyrics + a Suno-ready prompt!`, sender: "bot" },
    ]);
  };

  const handleCuisineSelect = (c: Cuisine) => {
    setSelectedCuisine(c);
    setCookingStep("ingredients");
    setMessages((prev) => [
      ...prev,
      { id: Date.now(), text: `${cuisines[c].icon} ${cuisines[c].label}`, sender: "user" },
      { id: Date.now() + 1, text: `Great choice! Now pick the ingredients you'd like to cook with:`, sender: "bot", showCookIngredientSelector: true },
    ]);
  };

  const handleCookIngredientToggle = (i: CookIngredient) => {
    setSelectedCookIngredients((prev) =>
      prev.includes(i) ? prev.filter((x) => x !== i) : [...prev, i]
    );
  };

  const handleConfirmCookIngredients = () => {
    setCookingStep("ready");
    const ingLabels = selectedCookIngredients.map((i) => `${cookIngredients[i].icon} ${cookIngredients[i].label}`).join(", ");
    setMessages((prev) => [
      ...prev,
      { id: Date.now(), text: `Ingredients: ${ingLabels}`, sender: "user" },
      { id: Date.now() + 1, text: `Perfect! 🍳 Now tell me what kind of dish you're in the mood for and I'll suggest recipes!`, sender: "bot" },
    ]);
  };

  const handleSocialGenerate = (topic: string) => {
    if (!selectedPlatform) return;
    const userMsg: Message = { id: Date.now(), text: topic, sender: "user" };
    setMessages((prev) => [...prev, userMsg]);
    setInput("");
    const state: SocialPostState = { topic, hook: "", description: "", final: "", cta: "", stage: "hook_pick" };
    setSocialPost(state);
    setMessages((prev) => [...prev, { id: Date.now() + 1, text: "Let's build your post step by step! Pick a length for the hook:", sender: "bot", showSocialBuilder: true }]);
  };

  const handleSocialLengthPick = async (step: "hook" | "description" | "finalize", pref: string) => {
    if (!socialPost || !selectedPlatform) return;
    const platLabel = platforms[selectedPlatform].label;
    const lengthGuide = pref === "short" ? "1 sentence max, punchy" : pref === "medium" ? "2-3 sentences, balanced" : "4-5 sentences, detailed";
    setIsLoading(true);

    if (step === "hook") {
      setSocialPost({ ...socialPost, stage: "hook_gen" });
      try {
        const reply = await callAI([
          { role: "system", content: `Write a ${platLabel} hook for the topic below. Output ONLY the hook text itself — no labels, no explanations, no tips, no "Here's your hook:", no guidance. Just the raw hook text ready to post. Length: ${lengthGuide}.` },
          { role: "user", content: socialPost.topic },
        ], apiSettings);
        const hook = stripMarkdown(normalizeReply(reply));

        setSocialPost((prev) => prev ? { ...prev, hook, stage: "desc_pick" } : prev);
      } catch { toast.error("Hook generation failed"); }
    } else if (step === "description") {
      setSocialPost({ ...socialPost, stage: "desc_gen" });
      try {
        const reply = await callAI([
          { role: "system", content: `Write a ${platLabel} post body/description that follows this hook: "${socialPost.hook}". Output ONLY the description text — no labels, no explanations, no tips, no "Here's your description:". Just the raw description text ready to post. Casual yet engaging. Length: ${lengthGuide}.` },
          { role: "user", content: socialPost.topic },
        ], apiSettings);
        const desc = stripMarkdown(normalizeReply(reply));
        setSocialPost((prev) => prev ? { ...prev, description: desc, stage: "final_pick" } : prev);
      } catch { toast.error("Description generation failed"); }
    } else if (step === "finalize") {
      setSocialPost({ ...socialPost, stage: "final_gen" });
      try {
        const reply = await callAI([
          { role: "system", content: `Write a closing line with relevant hashtags for a ${platLabel} post. Hook: "${socialPost.hook}" Body: "${socialPost.description}". Output ONLY the closing text + hashtags — no labels, no explanations, no tips, no "Here's your closing:". Just the raw text ready to post. Length: ${lengthGuide}.` },
          { role: "user", content: socialPost.topic },
        ], apiSettings);
        const final = stripMarkdown(normalizeReply(reply));

        setSocialPost((prev) => prev ? { ...prev, final, stage: "cta_ask" } : prev);
      } catch { toast.error("Finalize failed"); }
    }
    setIsLoading(false);
  };

  const handleSocialCta = async (addCta: boolean) => {
    if (!socialPost || !selectedPlatform) return;
    if (!addCta) {
      setSocialPost((prev) => prev ? { ...prev, stage: "done" } : prev);
      return;
    }
    setSocialPost((prev) => prev ? { ...prev, stage: "cta_gen" } : prev);
    setIsLoading(true);
    try {
      const platLabel = platforms[selectedPlatform].label;
      const ctaReply = await callAI([
        { role: "system", content: `Write a call-to-action line for a ${platLabel} post. Output ONLY the CTA text — no labels, no explanations, no "Here's your CTA:". Just the raw CTA sentence ready to post.` },
        { role: "user", content: `Hook: "${socialPost.hook}" Body: "${socialPost.description}" Topic: "${socialPost.topic}"` },
      ], apiSettings);
      setSocialPost((prev) => prev ? { ...prev, cta: stripMarkdown(normalizeReply(ctaReply)), stage: "done" } : prev);

    } catch {
      toast.error("CTA generation failed");
      setSocialPost((prev) => prev ? { ...prev, stage: "done" } : prev);
    } finally {
      setIsLoading(false);
    }
  };

  const handleAiToolSelect = (tool: AiTool) => {
    setSelectedAiTool(tool);
    setMessages((prev) => [
      ...prev,
      { id: Date.now(), text: `${aiTools[tool].icon} ${aiTools[tool].label}`, sender: "user" },
      { id: Date.now() + 1, text: `Great! I'll generate prompts optimized for **${aiTools[tool].label}**. Describe the image you want to create!`, sender: "bot" },
    ]);
  };

  const handleDesignGenerate = async (idea: string) => {
    if (!selectedAiTool) return;
    const toolLabel = aiTools[selectedAiTool].label;
    const userMsg: Message = { id: Date.now(), text: idea, sender: "user" };
    setMessages((prev) => [...prev, userMsg]);
    setInput("");
    setIsLoading(true);

    const state: DesignPromptState = { idea, style: "", color: "", lighting: "", compose: "", finalPrompt: "", stage: "style_gen" };
    setDesignPrompt(state);
    setMessages((prev) => [...prev, { id: Date.now() + 1, text: "Analyzing your idea...", sender: "bot", showDesignBuilder: true }]);

    const rawPrompt = (s: string) => `Output ONLY the raw text. No labels, no markdown, no explanations, no "Here's...". Just plain text.`;

    try {
      // Style
      const styleReply = await callAI([
        { role: "system", content: `You are an art style analyst for ${toolLabel}. Given an image idea, determine the best art style, medium, and aesthetic. ${rawPrompt("")} 1-2 sentences.` },
        { role: "user", content: idea },
      ], apiSettings);
      state.style = stripMarkdown(normalizeReply(styleReply));
      state.stage = "color_gen";
      setDesignPrompt({ ...state });

      // Color
      const colorReply = await callAI([
        { role: "system", content: `You are a color palette designer for ${toolLabel}. Given idea: "${idea}" and style: "${state.style}", suggest the perfect color palette with gradients & tones. ${rawPrompt("")} 1-2 sentences.` },
        { role: "user", content: idea },
      ], apiSettings);
      state.color = stripMarkdown(normalizeReply(colorReply));
      state.stage = "lighting_gen";
      setDesignPrompt({ ...state });

      // Lighting
      const lightReply = await callAI([
        { role: "system", content: `You are a lighting & mood designer for ${toolLabel}. Given idea: "${idea}", style: "${state.style}", colors: "${state.color}", describe the ideal lighting, atmosphere, and mood. ${rawPrompt("")} 1-2 sentences.` },
        { role: "user", content: idea },
      ], apiSettings);
      state.lighting = stripMarkdown(normalizeReply(lightReply));
      state.stage = "compose_gen";
      setDesignPrompt({ ...state });

      // Composition
      const compReply = await callAI([
        { role: "system", content: `You are a composition planner for ${toolLabel}. Given idea: "${idea}", style: "${state.style}", suggest camera angle, perspective, layout, and framing. ${rawPrompt("")} 1-2 sentences.` },
        { role: "user", content: idea },
      ], apiSettings);
      state.compose = stripMarkdown(normalizeReply(compReply));
      state.stage = "final_gen";
      setDesignPrompt({ ...state });

      // Final prompt
      const finalReply = await callAI([
        { role: "system", content: `You are a ${toolLabel} prompt engineer. Combine all these elements into one optimized, ready-to-use ${toolLabel} prompt. Style: "${state.style}". Colors: "${state.color}". Lighting: "${state.lighting}". Composition: "${state.compose}". ${rawPrompt("")} Output a single cohesive prompt paragraph, no line breaks.` },
        { role: "user", content: idea },
      ], apiSettings);
      state.finalPrompt = stripMarkdown(normalizeReply(finalReply));

      state.stage = "done";
      setDesignPrompt({ ...state });
    } catch (err: any) {
      toast.error("Design generation failed: " + (err.message || "Unknown error"));
    } finally {
      setIsLoading(false);
    }
  };

  const handleSend = async () => {
    if (!input.trim() || isLoading) return;

    if (activeAgent === "content" && input.trim().length > 100) {
      await handleContentCheck(input.trim());
      setInput("");
      return;
    }

    if (activeAgent === "social" && selectedPlatform && input.trim()) {
      handleSocialGenerate(input.trim());
      return;
    }

    if (activeAgent === "design" && selectedAiTool && input.trim()) {
      await handleDesignGenerate(input.trim());
      return;
    }

    // Direct Switch Logic
    const directSwitchMatch = input.toLowerCase().match(/(?:switch|change|go to)(?: me to)? (?:the )?(\w+)(?: agent)?/);
    if (directSwitchMatch) {
      const target = directSwitchMatch[1].toLowerCase();
      const found = builtInAgents.find(a => a === target || agents[a as BuiltInAgent]?.label.toLowerCase().includes(target))
        || customAgents.find(ca => ca.id.toLowerCase() === target || ca.name.toLowerCase().includes(target))?.id;

      if (found) {
        switchAgent(found);
        setInput("");
        return;
      }
    }

    const userMsg: Message = { id: Date.now(), text: input, sender: "user" };
    const newMessages = [...messages, userMsg];
    setMessages(newMessages);
    setInput("");
    setIsLoading(true);

    const allAgentInfo = [
      "🤖 **Ragent** (default) — The main assistant. Knows about all agents, the platform, and can help you pick the right agent for your task.",
      "🔍 **AI Content Detector** — Detect AI-generated text. Paste content (100+ chars) and it runs 4 analysis tools (word patterns, tone check, structure detection, AI pattern matching) to give you an AI probability score. You can then humanize the text.",
      "🚀 **Social Agent** — Generate platform-optimized social media posts for Twitter, Instagram, LinkedIn, TikTok, Reddit, YouTube, and Facebook.",
      "🎨 **Design Agent** — AI image prompt generator. Describe your idea and get detailed prompts optimized for Midjourney, DALL-E, or Stable Diffusion.",
      "🎵 **Music Agent** — Lyrics & music prompt generator. Pick a genre + instruments, then get Suno-ready prompts and creative lyrics.",
      "🍳 **Cooking Agent** — Dish suggestions & recipes. Pick a cuisine + ingredients, then get personalized dish recommendations with steps.",
      ...customAgents.map(ca => `✨ **${ca.name}** (custom) — ${ca.description || "Custom agent"}`),
    ].join("\n");

    const formatRules = `\n\nFORMATTING RULES (ALWAYS follow):
- Match your response length to the user's message. If they say "hi" or "hello", reply with 1 short friendly sentence. Do NOT over-explain simple greetings.
- Use clean markdown: **bold** for emphasis, bullet points for lists. Use ## headers only for long structured responses.
- NEVER use horizontal rules (---), excessive line breaks, or decorative separators.
- Keep responses concise. Short questions get short answers. Only give detailed responses when the user asks for detail.
- Use emojis sparingly and naturally.
- No filler phrases like "Great question!" or "Absolutely!" — get straight to the point.`;

    const sharedSwitchInfo = `\n\n**Switching Agents:**
If the user asks for something outside your specialty (e.g., recipes while in Content Detector), recommend the right agent using [SWITCH:agentkey]. 
Available keys: default (Ragent), content (AI Detector), social (Social Agent), design (Design Agent), music (Music Agent), cooking (Cooking Agent).
Example: "I can't do recipes, but you can switch to our Cooking Agent! [SWITCH:cooking]"`;

    let systemPrompt = `You are Ragent, the main assistant of the Ragents platform — built by Abdul Rauf Jatoi.

Ragents is an AI agent platform where each agent specializes in a different task. Users can also create custom agents.

**Available Agents:**
${allAgentInfo}

**Your Role:**
- Help users with general questions concisely
- If a user needs a specific task, recommend the right agent and include [SWITCH:agentkey] in your response (agentkey: content, social, design, music, cooking, or custom agent ID)
- Only suggest switching when the user clearly wants a task another agent handles. For casual chat, just respond normally.
- You can answer general questions yourself without switching${formatRules}${sharedSwitchInfo}`;
    if (activeAgent === "content") {
      systemPrompt = `You are the AI Content Detector agent. You help users detect whether text is AI-generated. When a user pastes text (100+ chars), the system automatically runs 4 analysis tools and shows results. You can also answer questions about AI detection, content quality, and writing tips. If the user pastes short text, tell them to paste at least 100 characters for accurate detection.${formatRules}${sharedSwitchInfo}`;
    } else if (activeAgent === "social") {
      const platLabel = selectedPlatform ? platforms[selectedPlatform].label : "social media";
      systemPrompt = `You are a Social Media Agent. Create engaging posts optimized for ${platLabel} with appropriate hashtags, tone, and formatting. If no platform selected, ask them to pick one.${formatRules}${sharedSwitchInfo}`;
    } else if (activeAgent === "design") {
      const toolLabel = selectedAiTool ? aiTools[selectedAiTool].label : "AI image generators";
      systemPrompt = `You are a Design Agent optimized for ${toolLabel}. When the user describes an image, the system automatically runs 5 analysis tools (style, color, lighting, composition, final prompt). You can also answer questions about prompt engineering and ${toolLabel} tips. If no AI tool is selected, ask them to pick one first.${formatRules}${sharedSwitchInfo}`;
    } else if (activeAgent === "music") {
      const genreLabel = selectedGenre ? genres[selectedGenre].label : "any genre";
      const instLabels = selectedInstruments.map((i) => instruments[i].label).join(", ") || "any instruments";
      systemPrompt = `You are a Music Agent specialized in generating song lyrics and music generation prompts for tools like Suno AI, Udio, etc.${sharedSwitchInfo}

The user selected:
- Genre: ${genreLabel}
- Instruments: ${instLabels}

Generate the following:
1. **Suno Prompt** (20-30 words): A concise music style/genre description optimized for Suno AI. Include genre, mood, instruments, tempo, and vocal style.
2. **Lyrics**: Write creative, catchy song lyrics (1-2 verses + chorus) that fit the genre and mood.
3. **Genre Guide**: Brief tips on what makes this genre work well.

Format it cleanly with headers. Be creative and musical.${formatRules}`;
    } else if (activeAgent === "cooking") {
      const cuisineLabel = selectedCuisine ? cuisines[selectedCuisine].label : "any cuisine";
      const ingLabels = selectedCookIngredients.map((i) => cookIngredients[i].label).join(", ") || "any ingredients";
      systemPrompt = `You are a Cooking Agent specialized in suggesting dishes and recipes.${sharedSwitchInfo}

The user selected:
- Cuisine: ${cuisineLabel}
- Instruments: ${ingLabels}

Based on the user's request, suggest 2-3 dishes that match their cuisine and ingredients. For each dish provide:
1. **Dish Name** with an emoji
2. **Brief Description** (1-2 sentences)
3. **Key Steps** (3-5 quick steps)
4. **Pro Tip** for making it amazing

Be warm, enthusiastic, and helpful. Format cleanly with headers.${formatRules}`;
    } else if (isCustomAgent && customAgent) {
      const toolsDesc = customAgent.tools.length > 0
        ? `\n\nYou have these capabilities: ${customAgent.tools.join(", ")}. Leverage them when relevant.`
        : "";
      systemPrompt = customAgent.systemPrompt + toolsDesc + formatRules;
    }

    try {
      const reply = await callAI([
        { role: "system", content: systemPrompt },
        ...newMessages.slice(-10).map((m) => ({ role: m.sender === "user" ? "user" : "assistant", content: m.text })),
      ], apiSettings);


      // Check if agent wants to switch to another agent
      const switchMatch = reply.match(/\[SWITCH:(\w+)\]/);
      const cleanedReply = normalizeReply(reply);

      if (switchMatch) {
        const targetKey = switchMatch[1];
        const cleanReply = normalizeReply(cleanedReply.replace(/\[SWITCH:\w+\]/g, "").trim());
        setMessages((prev) => [...prev, { id: Date.now() + 1, text: cleanReply || "Would you like me to switch you to that agent?", sender: "bot", switchSuggestion: targetKey }]);
      } else {
        setMessages((prev) => [...prev, { id: Date.now() + 1, text: cleanedReply, sender: "bot" }]);
      }
    } catch (err: any) {
      toast.error("Failed to get response: " + (err.message || "Unknown error"));
    } finally {
      setIsLoading(false);
    }
  };

  const switchAgent = (agent: Agent) => {
    setActiveAgent(agent);
    setDropdownOpen(false);
    setSelectedPlatform(null);
    setSocialPost(null);
    setSelectedAiTool(null);
    setDesignPrompt(null);
    setSelectedGenre(null);
    setSelectedInstruments([]);
    setMusicStep("genre");
    setSelectedCuisine(null);
    setSelectedCookIngredients([]);
    setCookingStep("cuisine");

    const custom = customAgents.find((a) => a.id === agent);
    if (custom) {
      setMessages([{ id: Date.now(), text: custom.welcomeMessage, sender: "bot" }]);
      return;
    }

    const welcomes: Record<BuiltInAgent, string> = {
      default: "Hey! 👋 I'm Ragent, your guide to the Ragents platform by Abdul Rauf Jatoi. I know all the agents here — tell me what you need and I'll point you to the right one, or just chat with me!",
      content: "🔍 AI Content Detector ready! Paste text (100+ chars) or upload a file — I'll run 4 analysis tools to detect AI-generated content.",
      social: "Social Media Agent ready! 🚀 Pick a platform below to get started:",
      design: "Design Agent ready! 🎨 First, pick the AI image tool you want to generate a prompt for:",
      music: "Music Agent ready! 🎵 First, pick a genre for your track:",
      cooking: "Cooking Agent ready! 🍳 First, pick a cuisine style:",
    };
    const msgs: Message[] = [{ id: Date.now(), text: welcomes[agent as BuiltInAgent] || "Hello!", sender: "bot" }];
    if (agent === "social") msgs[0].showPlatformSelector = true;
    if (agent === "design") msgs[0].showDesignToolSelector = true;
    if (agent === "music") msgs[0].showGenreSelector = true;
    if (agent === "cooking") msgs[0].showCuisineSelector = true;
    setMessages(msgs);
  };

  const handleSaveCustomAgent = (config: CustomAgentConfig) => {
    setCustomAgents((prev) => [...prev, config]);
    setShowBuilder(false);
    toast.success(`${config.name} created! 🎉`);
    switchAgent(config.id);
  };

  const getPlaceholder = () => {
    if (isCustomAgent && customAgent) return `Message ${customAgent.name}...`;
    if (activeAgent === "content") return "Paste text to check for AI, or ask anything...";
    if (activeAgent === "social") return selectedPlatform ? `What do you want to post on ${platforms[selectedPlatform].label}?` : "Pick a platform above first...";
    if (activeAgent === "design") return selectedAiTool ? "Describe the image you want to create..." : "Pick an AI tool above first...";
    if (activeAgent === "music") return musicStep === "ready" ? "Describe your song theme or mood..." : "Pick genre & instruments above first...";
    if (activeAgent === "cooking") return cookingStep === "ready" ? "What dish are you in the mood for?" : "Pick cuisine & ingredients above first...";
    return "Type a message...";
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="flex flex-col h-screen transition-colors duration-500"
      style={{ backgroundColor: theme.bg }}
    >
      {/* Header */}
      <header
        className="flex items-center justify-between px-6 py-4 border-b transition-colors duration-500"
        style={{ borderColor: theme.border, backgroundColor: theme.headerBg }}
      >
        <h1 className="text-xl font-semibold tracking-tight" style={{ color: "#f5f2f1" }}>Ragents</h1>

        <div className="flex items-center gap-3">
          <ApiKeyControl
            theme={theme}
            onSettingsChange={(newSettings) => setApiSettings(newSettings)}
          />


          <div className="relative">

            <button
              onClick={() => setDropdownOpen(!dropdownOpen)}
              className="flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium transition-all duration-300"
              style={{
                backgroundColor: `${theme.accentRgba}0.2)`,
                color: theme.accent,
                border: `1px solid ${theme.accentRgba}0.3)`,
              }}
            >
              {(() => {
                if (isCustomAgent && customAgent) {
                  const Icon = getIconByKey(customAgent.iconKey);
                  return <Icon size={16} />;
                }
                const Icon = agents[activeAgent as BuiltInAgent]?.icon || MessageSquare;
                return <Icon size={16} />;
              })()}
              {isCustomAgent && customAgent ? customAgent.name : (agents[activeAgent as BuiltInAgent]?.label || "Agent")}
              <ChevronDown size={14} style={{ transform: dropdownOpen ? "rotate(180deg)" : "rotate(0)", transition: "transform 0.2s" }} />
            </button>

            <AnimatePresence>
              {dropdownOpen && (
                <motion.div
                  initial={{ opacity: 0, y: -8, scale: 0.95 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: -8, scale: 0.95 }}
                  transition={{ duration: 0.15 }}
                  className="absolute right-0 mt-2 w-56 rounded-xl overflow-hidden shadow-2xl z-50 max-h-96 overflow-y-auto"
                  style={{ backgroundColor: isCustomAgent && customAgent ? getCustomDropdownBg(customAgent.colorHue) : (dropdownBgs[activeAgent as BuiltInAgent] || dropdownBgs.default), border: `1px solid ${theme.accentRgba}0.2)` }}
                >
                  {(Object.keys(agents) as BuiltInAgent[]).map((key) => {
                    const agent = agents[key];
                    const Icon = agent.icon;
                    const isActive = activeAgent === key;
                    const t = agentThemes[key];
                    return (
                      <button
                        key={key}
                        onClick={() => switchAgent(key)}
                        className="flex items-center gap-3 w-full px-4 py-3 text-sm text-left transition-colors duration-200"
                        style={{
                          color: isActive ? t.accent : "rgba(245,242,241,0.6)",
                          backgroundColor: isActive ? `${t.accentRgba}0.15)` : "transparent",
                        }}
                        onMouseEnter={(e) => { if (!isActive) e.currentTarget.style.backgroundColor = `${t.accentRgba}0.1)`; }}
                        onMouseLeave={(e) => { if (!isActive) e.currentTarget.style.backgroundColor = "transparent"; }}
                      >
                        <Icon size={16} />
                        <div>
                          <p className="font-medium">{agent.label}</p>
                          <p className="text-xs opacity-50">{agentDescs[key]}</p>
                        </div>
                      </button>
                    );
                  })}

                  {/* Custom agents */}
                  {customAgents.length > 0 && (
                    <div className="border-t" style={{ borderColor: "rgba(255,255,255,0.08)" }}>
                      {customAgents.map((ca) => {
                        const Icon = getIconByKey(ca.iconKey);
                        const isActive = activeAgent === ca.id;
                        const ct = getCustomTheme(ca.colorHue);
                        return (
                          <button
                            key={ca.id}
                            onClick={() => switchAgent(ca.id)}
                            className="flex items-center gap-3 w-full px-4 py-3 text-sm text-left transition-colors duration-200"
                            style={{
                              color: isActive ? ct.accent : "rgba(245,242,241,0.6)",
                              backgroundColor: isActive ? `${ct.accentRgba}0.15)` : "transparent",
                            }}
                            onMouseEnter={(e) => { if (!isActive) e.currentTarget.style.backgroundColor = `${ct.accentRgba}0.1)`; }}
                            onMouseLeave={(e) => { if (!isActive) e.currentTarget.style.backgroundColor = "transparent"; }}
                          >
                            <Icon size={16} />
                            <div>
                              <p className="font-medium">{ca.name}</p>
                              <p className="text-xs opacity-50">{ca.description}</p>
                            </div>
                          </button>
                        );
                      })}
                    </div>
                  )}

                  {/* Create new agent button */}
                  <div className="border-t" style={{ borderColor: "rgba(255,255,255,0.08)" }}>
                    <button
                      onClick={() => { setDropdownOpen(false); setShowBuilder(true); }}
                      className="flex items-center gap-3 w-full px-4 py-3 text-sm text-left transition-colors duration-200 hover:bg-white/10"
                      style={{ color: "rgba(245,242,241,0.5)" }}
                    >
                      <Plus size={16} />
                      <div>
                        <p className="font-medium">Create Agent</p>
                        <p className="text-xs opacity-50">Build your own custom agent</p>
                      </div>
                    </button>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </header>


      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-6 py-8">
        <div className="max-w-2xl mx-auto space-y-4">
          <AnimatePresence>
            {messages.map((msg) => (
              <motion.div
                key={msg.id}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.25 }}
                className={`flex ${msg.sender === "user" ? "justify-end" : "justify-start"}`}
              >
                <div className="max-w-[80%]">
                  {msg.platform && (
                    <div className="flex items-center gap-1.5 mb-1 text-xs" style={{ color: platforms[msg.platform].color }}>
                      <span>{platforms[msg.platform].icon}</span>
                      <span>{platforms[msg.platform].label}</span>
                    </div>
                  )}
                  <div
                    className="px-4 py-3 rounded-2xl text-sm leading-relaxed"
                    style={
                      msg.sender === "user"
                        ? { backgroundColor: `${theme.accentRgba}0.25)`, color: "#f5f2f1" }
                        : { backgroundColor: `${theme.accentRgba}0.1)`, color: "rgba(245,242,241,0.85)" }
                    }
                  >
                    {msg.sender === "bot" ? (
                      <ReactMarkdown
                        components={{
                          h1: ({ children }) => <h1 className="text-xl font-bold mb-2 mt-1" style={{ color: theme.accent }}>{children}</h1>,
                          h2: ({ children }) => <h2 className="text-lg font-semibold mb-2 mt-3" style={{ color: theme.accent }}>{children}</h2>,
                          h3: ({ children }) => <h3 className="text-base font-semibold mb-1 mt-2" style={{ color: theme.accent }}>{children}</h3>,
                          strong: ({ children }) => <strong className="font-semibold" style={{ color: "#f5f2f1" }}>{children}</strong>,
                          em: ({ children }) => <em className="italic opacity-80">{children}</em>,
                          ul: ({ children }) => <ul className="list-disc list-inside space-y-1 my-2">{children}</ul>,
                          ol: ({ children }) => <ol className="list-decimal list-inside space-y-1 my-2">{children}</ol>,
                          li: ({ children }) => <li className="ml-1">{children}</li>,
                          p: ({ children }) => <p className="mb-2 last:mb-0">{children}</p>,
                          code: ({ children, className }) => {
                            const isBlock = className?.includes("language-");
                            return isBlock ? (
                              <pre className="rounded-lg p-3 my-2 overflow-x-auto text-xs" style={{ backgroundColor: "rgba(0,0,0,0.4)" }}>
                                <code>{children}</code>
                              </pre>
                            ) : (
                              <code className="px-1.5 py-0.5 rounded text-xs font-mono" style={{ backgroundColor: "rgba(255,255,255,0.1)" }}>{children}</code>
                            );
                          },
                          hr: () => <hr className="my-3 border-t" style={{ borderColor: "rgba(255,255,255,0.1)" }} />,
                          blockquote: ({ children }) => (
                            <blockquote className="border-l-2 pl-3 my-2 italic opacity-80" style={{ borderColor: theme.accent }}>{children}</blockquote>
                          ),
                        }}
                      >
                        {msg.text}
                      </ReactMarkdown>
                    ) : (
                      <span className="whitespace-pre-wrap">{msg.text}</span>
                    )}
                  </div>
                  {msg.showPlatformSelector && (
                    <div className="mt-3">
                      <PlatformSelector selected={selectedPlatform} onSelect={handlePlatformSelect} />
                    </div>
                  )}
                  {msg.showSocialBuilder && socialPost && selectedPlatform && (
                    <div className="mt-3">
                      <SocialPostBuilder
                        platform={selectedPlatform}
                        topic={socialPost.topic}
                        hookText={socialPost.hook}
                        descriptionText={socialPost.description}
                        finalText={socialPost.final}
                        ctaText={socialPost.cta}
                        stage={socialPost.stage}
                        onLengthPick={handleSocialLengthPick}
                        onAddCta={() => handleSocialCta(true)}
                        onSkipCta={() => handleSocialCta(false)}
                      />
                    </div>
                  )}
                  {msg.showDesignToolSelector && (
                    <div className="mt-3">
                      <DesignToolSelector selected={selectedAiTool} onSelect={handleAiToolSelect} />
                    </div>
                  )}
                  {msg.showDesignBuilder && designPrompt && selectedAiTool && (
                    <div className="mt-3">
                      <DesignPromptBuilder
                        tool={selectedAiTool}
                        idea={designPrompt.idea}
                        styleText={designPrompt.style}
                        colorText={designPrompt.color}
                        lightingText={designPrompt.lighting}
                        composeText={designPrompt.compose}
                        finalPrompt={designPrompt.finalPrompt}
                        stage={designPrompt.stage}
                      />
                    </div>
                  )}
                  {msg.showGenreSelector && (
                    <div className="mt-3">
                      <MusicSelector
                        step="genre"
                        selectedGenre={selectedGenre}
                        selectedInstruments={selectedInstruments}
                        onGenreSelect={handleGenreSelect}
                        onInstrumentToggle={handleInstrumentToggle}
                        onConfirmInstruments={handleConfirmInstruments}
                      />
                    </div>
                  )}
                  {msg.showInstrumentSelector && (
                    <div className="mt-3">
                      <MusicSelector
                        step="instruments"
                        selectedGenre={selectedGenre}
                        selectedInstruments={selectedInstruments}
                        onGenreSelect={handleGenreSelect}
                        onInstrumentToggle={handleInstrumentToggle}
                        onConfirmInstruments={handleConfirmInstruments}
                      />
                    </div>
                  )}
                  {msg.showCuisineSelector && (
                    <div className="mt-3">
                      <CookingSelector
                        step="cuisine"
                        selectedCuisine={selectedCuisine}
                        selectedIngredients={selectedCookIngredients}
                        onCuisineSelect={handleCuisineSelect}
                        onIngredientToggle={handleCookIngredientToggle}
                        onConfirmIngredients={handleConfirmCookIngredients}
                      />
                    </div>
                  )}
                  {msg.showCookIngredientSelector && (
                    <div className="mt-3">
                      <CookingSelector
                        step="ingredients"
                        selectedCuisine={selectedCuisine}
                        selectedIngredients={selectedCookIngredients}
                        onCuisineSelect={handleCuisineSelect}
                        onIngredientToggle={handleCookIngredientToggle}
                        onConfirmIngredients={handleConfirmCookIngredients}
                      />
                    </div>
                  )}
                  {msg.aiDetection && (
                    <AiDetectionResult
                      score={msg.aiDetection.score}
                      text={msg.aiDetection.text}
                      onHumanize={() => handleHumanize(msg.id)}
                      isHumanizing={humanizingId === msg.id}
                    />
                  )}
                  {msg.switchSuggestion && (
                    <motion.div
                      initial={{ opacity: 0, y: 8 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="flex items-center gap-2 mt-3"
                    >
                      <button
                        onClick={() => {
                          setMessages((prev) => prev.map((m) => m.id === msg.id ? { ...m, switchSuggestion: undefined } : m));
                          switchAgent(msg.switchSuggestion!);
                        }}
                        className="px-4 py-2 rounded-full text-sm font-medium transition-all duration-300 hover:scale-105"
                        style={{ backgroundColor: `${theme.accentRgba}0.3)`, color: theme.accent, border: `1px solid ${theme.accentRgba}0.4)` }}
                      >
                        ✨ Yes, switch me!
                      </button>
                      <button
                        onClick={() => setMessages((prev) => prev.map((m) => m.id === msg.id ? { ...m, switchSuggestion: undefined } : m))}
                        className="px-4 py-2 rounded-full text-sm font-medium transition-all duration-300 hover:scale-105"
                        style={{ backgroundColor: "rgba(255,255,255,0.08)", color: "rgba(245,242,241,0.6)", border: "1px solid rgba(255,255,255,0.1)" }}
                      >
                        No, stay here
                      </button>
                    </motion.div>
                  )}
                </div>
              </motion.div>
            ))}

            {/* Typing indicator */}
            {isLoading && (
              <motion.div
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                className="flex justify-start"
              >
                <div
                  className="px-5 py-4 rounded-2xl flex items-center gap-1.5"
                  style={{ backgroundColor: `${theme.accentRgba}0.1)` }}
                >
                  {[0, 1, 2].map((i) => (
                    <motion.span
                      key={i}
                      className="block w-2 h-2 rounded-full"
                      style={{ backgroundColor: theme.accent }}
                      animate={{ opacity: [0.3, 1, 0.3], scale: [0.85, 1.15, 0.85] }}
                      transition={{ duration: 1.2, repeat: Infinity, delay: i * 0.2 }}
                    />
                  ))}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
          <div ref={endRef} />
        </div>
      </div>

      {/* Input */}
      <div className="px-6 pb-6 pt-2">
        {activeAgent === "content" && (
          <div className="max-w-2xl mx-auto mb-2">
            <ContentUpload onTextSubmit={handleContentCheck} isLoading={isLoading} />
          </div>
        )}
        <div
          className="max-w-2xl mx-auto flex items-center gap-3 px-5 py-3 rounded-full transition-colors duration-500"
          style={{
            backgroundColor: `${theme.accentRgba}0.12)`,
            border: `1px solid ${theme.accentRgba}0.2)`,
          }}
        >
          <input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && !isLoading && handleSend()}
            disabled={isLoading}
            placeholder={getPlaceholder()}
            className="flex-1 bg-transparent outline-none text-sm placeholder:opacity-40"
            style={{ color: "#f5f2f1" }}
          />
          <button
            onClick={handleSend}
            disabled={isLoading}
            className="p-2 rounded-full transition-all duration-300 hover:scale-105 disabled:opacity-50"
            style={{ backgroundColor: `${theme.accentRgba}0.3)`, color: theme.accent }}
          >
            {isLoading ? <Loader2 size={16} className="animate-spin" /> : <Send size={16} />}
          </button>
        </div>
      </div>

      <AgentBuilder
        isOpen={showBuilder}
        onClose={() => setShowBuilder(false)}
        onSave={handleSaveCustomAgent}
      />
    </motion.div>
  );
};

export default Dashboard;
