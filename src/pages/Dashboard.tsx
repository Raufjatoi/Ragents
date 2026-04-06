import { useState, useRef, useEffect } from "react";
import ReactMarkdown from "react-markdown";
import { Send, ChevronDown, Bot, MessageSquare, Loader2, Share2, Palette, Music, ChefHat, Plus, ScanSearch } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "sonner";
import AiDetectionResult from "@/components/AiDetectionResult";
import ContentUpload from "@/components/ContentUpload";
import PlatformSelector, { platforms, type Platform } from "@/components/PlatformSelector";
import MusicSelector, { genres, instruments, type MusicGenre, type Instrument } from "@/components/MusicSelector";
import CookingSelector, { countries, countryDishes, ingredients as cookIngredients, type Country, type Ingredient as CookIngredient } from "@/components/CookingSelector";
import RecipeCard, { type RecipeStage } from "@/components/RecipeCard";
import AgentBuilder, { type CustomAgentConfig, getIconByKey, getCustomTheme, getCustomDropdownBg } from "@/components/AgentBuilder";
import SocialPostBuilder from "@/components/SocialPostBuilder";
import { DesignToolSelector, DesignPromptBuilder, aiTools, type AiTool, type DesignStage } from "@/components/DesignPromptBuilder";
import MusicBuilder, { type MusicStage, type MusicMode } from "@/components/MusicBuilder";
import ApiKeyControl, { type ApiSettings } from "@/components/ApiKeyControl";


type BuiltInAgent = "default" | "content" | "social" | "design" | "music" | "cooking";
type Agent = BuiltInAgent | string;

interface AiDetection {
  score: number;
  text: string;
  isHumanized?: boolean;
  toolsInProgress?: { name: string; result: string; score: number }[];
  toolsFinal?: { name: string; result: string; score: number }[];
  humanizingSteps?: { name: string; status: "pending" | "running" | "done" }[];
}

interface Message {
  id: number;
  text: string;
  sender: "user" | "bot";
  aiDetection?: AiDetection;
  showPlatformSelector?: boolean;
  showGenreSelector?: boolean;
  showInstrumentSelector?: boolean;
  showMusicBuilder?: boolean;
  showCountrySelector?: boolean;
  showDishSelector?: boolean;
  showCookIngredientSelector?: boolean;
  showRecipeCard?: boolean;
  showSocialBuilder?: boolean;
  showDesignToolSelector?: boolean;
  showDesignBuilder?: boolean;
  platform?: Platform;
  switchSuggestion?: string;
}

interface DesignPromptState {
  idea: string;
  styleChoice: string;
  sizeChoice: string;
  colorTheme: string;
  subjectText: string;
  detailText: string;
  finalPrompt: string;
  stage: DesignStage;
}

interface MusicBuilderState {
  topic: string;
  mood: string;
  tempo: string;
  mode: string;
  lyricsText: string;
  sunoPrompt: string;
  udioPrompt: string;
  stage: MusicStage;
}

interface RecipeState {
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

interface SocialPostState {
  topic: string;
  style: string;
  hook: string;
  description: string;
  hashtags: string;
  cta: string;
  ctaType: string;
  link: string;
  stage:
    | "style_pick"
    | "hook_pick" | "hook_gen"
    | "desc_pick" | "desc_gen"
    | "tag_pick" | "tag_gen"
    | "cta_ask" | "cta_gen"
    | "done";
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
      if ((settings as any).tools) {
        body.tools = [{ function_declarations: (settings as any).tools }];
      }
      break;
    case "claude":
      url = "https://api.anthropic.com/v1/messages";
      body = {
        model: selectedModel,
        max_tokens: 1024,
        messages: messages.map(m => ({ role: m.role, content: m.content })),
        system: messages.find(m => m.role === "system")?.content || ""
      };
      if ((settings as any).tools) {
        body.tools = (settings as any).tools.map((t: any) => ({
          name: t.name,
          description: t.description,
          input_schema: t.parameters
        }));
      }
      // Anthropic requires specific headers and doesn't want system in messages
      body.messages = body.messages.filter((m: any) => m.role !== "system");
      break;
  }

  if (selectedProvider !== "gemini" && selectedProvider !== "claude" && (settings as any).tools) {
    body.tools = (settings as any).tools.map((t: any) => ({
      type: "function",
      function: t
    }));
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
    const part = data.candidates?.[0]?.content?.parts?.[0];
    if (part?.functionCall) return { toolCalls: [part.functionCall] };
    return part?.text || "No response.";
  }
  if (selectedProvider === "claude") {
    const toolCalls = data.content?.filter((c: any) => c.type === "tool_use").map((c: any) => ({ name: c.name, args: c.input, id: c.id }));
    if (toolCalls?.length) return { toolCalls };
    return data.content?.find((c: any) => c.type === "text")?.text || "No response.";
  }
  const msg = data.choices?.[0]?.message;
  if (msg?.tool_calls) return { toolCalls: msg.tool_calls.map((tc: any) => ({ name: tc.function.name, args: JSON.parse(tc.function.arguments), id: tc.id })) };
  return msg?.content || "No response.";
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

// ── Real AI-detection analysis functions ────────────────────────────────────

function analyzeWordPatterns(text: string): { score: number; finding: string } {
  const words = text.toLowerCase().match(/\b[a-z']+\b/g) ?? [];
  const totalWords = words.length || 1;
  const ttr = new Set(words).size / totalWords;
  const ttrScore = Math.max(0, Math.min(100, Math.round((0.75 - ttr) / 0.35 * 100)));

  const aiTransitions = ["moreover","furthermore","in conclusion","additionally","in summary",
    "it is worth noting","it should be noted","indeed","certainly","notably",
    "it is important to","it is essential to"];
  const lowerText = text.toLowerCase();
  const transitionCount = aiTransitions.reduce((acc, p) => acc + (lowerText.split(p).length - 1), 0);
  const transitionScore = Math.min(90, Math.max(10, transitionCount * 20 + 10));

  const bigrams: string[] = [];
  for (let i = 0; i < words.length - 1; i++) bigrams.push(`${words[i]} ${words[i + 1]}`);
  const bigramCounts: Record<string, number> = {};
  bigrams.forEach(b => { bigramCounts[b] = (bigramCounts[b] ?? 0) + 1; });
  const repeatedBigrams = Object.values(bigramCounts).filter(c => c > 1).length;
  const bigramScore = Math.min(90, Math.round((repeatedBigrams / (bigrams.length || 1)) * 500));

  const score = Math.max(0, Math.min(100, Math.round(ttrScore * 0.4 + transitionScore * 0.35 + bigramScore * 0.25)));
  const finding = score >= 70
    ? `Low vocabulary diversity (TTR: ${ttr.toFixed(2)}), ${transitionCount} AI transition phrase(s) detected.`
    : score >= 40
    ? `Moderate diversity (TTR: ${ttr.toFixed(2)}), some repeated patterns.`
    : `Rich vocabulary (TTR: ${ttr.toFixed(2)}), natural word variety.`;
  return { score, finding };
}

function analyzeToneStyle(text: string): { score: number; finding: string } {
  const sentences = text.split(/[.!?]+/).filter(s => s.trim().length > 3);
  const sentLens = sentences.map(s => s.trim().split(/\s+/).length);
  const avg = sentLens.reduce((a, b) => a + b, 0) / (sentLens.length || 1);
  const variance = sentLens.reduce((a, b) => a + Math.pow(b - avg, 2), 0) / (sentLens.length || 1);
  const burstiness = Math.sqrt(variance);
  const burstiScore = Math.max(10, Math.min(90, Math.round((12 - burstiness) / 9 * 80 + 10)));

  const formalWords = ["utilize","demonstrate","facilitate","endeavor","commence","obtain",
    "implement","leverage","streamline","robust","comprehensive","synergy","paradigm","optimize"];
  const lowerText = text.toLowerCase();
  const words = lowerText.match(/\b[a-z]+\b/g) ?? [];
  const formalCount = formalWords.reduce((acc, w) => acc + words.filter(tw => tw === w).length, 0);
  const formalScore = Math.min(90, Math.round((formalCount / (words.length || 1)) * 4000));

  const hedges = ["it may be","arguably","one might say","could be considered","perhaps",
    "might suggest","tends to","appears to"];
  const hedgeCount = hedges.reduce((acc, h) => acc + (lowerText.split(h).length - 1), 0);
  const hedgeScore = Math.max(0, 50 - hedgeCount * 8);

  const score = Math.max(0, Math.min(100, Math.round(burstiScore * 0.45 + formalScore * 0.35 + hedgeScore * 0.20)));
  const finding = score >= 70
    ? `Uniform formal tone, low burstiness (σ=${burstiness.toFixed(1)}), high formal-word density.`
    : score >= 40
    ? `Mixed tone, moderate burstiness (σ=${burstiness.toFixed(1)}), some formal markers.`
    : `Varied natural tone, healthy burstiness (σ=${burstiness.toFixed(1)}), minimal formal register.`;
  return { score, finding };
}

function analyzeStructure(text: string): { score: number; finding: string } {
  const paragraphs = text.split(/\n\s*\n/).filter(p => p.trim().length > 0);
  const paraLens = paragraphs.map(p => p.trim().split(/\s+/).length);
  const avgPara = paraLens.reduce((a, b) => a + b, 0) / (paraLens.length || 1);
  const paraVariance = paraLens.reduce((a, b) => a + Math.pow(b - avgPara, 2), 0) / (paraLens.length || 1);
  const paraStd = Math.sqrt(paraVariance);
  const uniformScore = Math.max(15, Math.min(85, Math.round((40 - paraStd) / 30 * 70 + 15)));

  const sentences = text.split(/[.!?]+/).filter(s => s.trim().length > 3);
  const firstWords = sentences.map(s => s.trim().split(/\s+/)[0]?.toLowerCase() ?? "");
  const firstWordCounts: Record<string, number> = {};
  firstWords.forEach(w => { if (w) firstWordCounts[w] = (firstWordCounts[w] ?? 0) + 1; });
  const maxRepeat = Math.max(...Object.values(firstWordCounts), 0);
  const startRepeatScore = Math.min(85, Math.round((maxRepeat / (sentences.length || 1)) * 200));

  const uniformParas = paraLens.filter(l => Math.abs(l - avgPara) < avgPara * 0.3).length;
  const listScore = Math.round((uniformParas / (paragraphs.length || 1)) * 70);

  const score = Math.max(0, Math.min(100, Math.round(uniformScore * 0.4 + startRepeatScore * 0.35 + listScore * 0.25)));
  const finding = score >= 70
    ? `Highly uniform paragraph structure (σ=${paraStd.toFixed(0)} words), predictable sentence openings.`
    : score >= 40
    ? `Moderately uniform structure (σ=${paraStd.toFixed(0)} words), some repetition.`
    : `Organic structure with natural variation (σ=${paraStd.toFixed(0)} words).`;
  return { score, finding };
}

function analyzeAiPatterns(text: string): { score: number; finding: string } {
  const aiPhrases = ["delve","it's important to note","in today's world","in the realm of",
    "the landscape of","boundaries of","it goes without saying","a testament to",
    "at the end of the day","when it comes to","the bottom line","more than ever","dive into",
    "crucial","tapestry","foster","pivotal","embark","unleash","game-changer","transformative",
    "best practices","in the context of","as previously mentioned","it is clear that",
    "in other words","to summarize","it is worth noting","needless to say","suffice it to say"];
  const lowerText = text.toLowerCase();
  const words = lowerText.match(/\b[a-z']+\b/g) ?? [];
  let totalMatches = 0;
  const matchedPhrases: string[] = [];
  for (const phrase of aiPhrases) {
    const count = lowerText.split(phrase).length - 1;
    if (count > 0) { totalMatches += count; matchedPhrases.push(phrase); }
  }
  const density = (totalMatches / (words.length || 1)) * 100;
  const densityScore = Math.min(95, Math.round(density * 18));
  const metaPatterns = ["it is worth","it should be noted","it is important","notably,"];
  const metaCount = metaPatterns.reduce((acc, p) => acc + (lowerText.split(p).length - 1), 0);
  const metaScore = Math.min(80, metaCount * 18);

  const score = Math.max(0, Math.min(100, Math.round(densityScore * 0.7 + metaScore * 0.3)));
  const topMatches = matchedPhrases.slice(0, 3).map(p => `"${p}"`).join(", ");
  const finding = score >= 70
    ? `${totalMatches} AI phrase match(es) (${density.toFixed(1)}/100 words). Found: ${topMatches || "various patterns"}.`
    : score >= 40
    ? `${totalMatches} possible AI phrase(s). Some LLM markers present.`
    : `Minimal AI phrase signatures — ${totalMatches} weak match(es).`;
  return { score, finding };
}

function buildRagentSystemPrompt(customAgents: CustomAgentConfig[]): string {
  const agentDocs = [
    `🤖 **Ragent** (key: \`default\`) — General assistant, platform guide, and orchestrator. Handles general knowledge, advice, writing help, explanations. Does NOT specialize in content detection, social posts, image prompts, lyrics, or recipes.`,
    `🔍 **AI Content Detector** (key: \`content\`) — Detects AI-generated text. User pastes 100+ characters, 4 tools run automatically (word pattern analysis, tone/style check, structure detection, AI pattern matching) and return a probability score. Can also humanize the text afterward. TRIGGER: user wants to check if text is AI-written, detect AI content, humanize AI text.`,
    `🚀 **Social Agent** (key: \`social\`) — Creates platform-optimized social media posts for Instagram, YouTube, LinkedIn, Twitter/X, Facebook, TikTok. Multi-step builder: hook → body → hashtags → CTA. Requires platform selection first. TRIGGER: user wants a social media post, caption, tweet, LinkedIn post, TikTok script.`,
    `🎨 **Design Agent** (key: \`design\`) — AI image prompt generator for Midjourney, DALL-E, Stable Diffusion, Leonardo AI, Flux. 5-stage pipeline: style → color → lighting → composition → final prompt. Requires AI tool selection first. TRIGGER: user wants an AI image prompt, wants to generate art, create an image with Midjourney/DALL-E/etc.`,
    `🎵 **Music Agent** (key: \`music\`) — Lyrics & Suno AI music prompt generator. User picks genre + instruments, then gets a Suno-ready prompt + creative lyrics (2 verses + chorus). Requires genre and instrument selection first. TRIGGER: user wants song lyrics, music prompts, Suno AI prompts, wants to write a song.`,
    `🍳 **Cooking Agent** (key: \`cooking\`) — Dish suggestions & step-by-step recipes. User picks cuisine + ingredients, gets 2–3 personalized dish recommendations with steps and pro tips. Requires cuisine and ingredient selection first. TRIGGER: user wants recipe ideas, cooking help, what to cook, food suggestions.`,
    ...customAgents.map(ca =>
      `✨ **${ca.name}** (key: \`${ca.id}\`) — ${ca.description || "Custom agent"}. Purpose: ${ca.systemPrompt?.slice(0, 100) || ""}... Tools: ${ca.tools?.join(", ") || "none"}.`
    ),
  ].join("\n\n");

  return `You are Ragent, the main orchestrator of the Ragents platform — built by Abdul Rauf Jatoi.

## Agents You Can Route To

${agentDocs}

## Your Role
- Answer general questions, help with writing, brainstorming, explanations, and platform guidance directly.
- When the user's request clearly matches a specialized agent, route them: briefly acknowledge the task, then end your message with \`[SWITCH:agentKey]\` on its own line.
- Only include ONE \`[SWITCH:agentKey]\` per response. Never include it for casual chat or general questions you can handle yourself.
- When routing, explain WHY that agent is the right choice in 1 sentence.
- You know every agent in detail — use that to route accurately.
- For agents requiring setup (social, design, music, cooking), warn the user they'll need to complete a quick setup step after switching.

FORMATTING RULES (ALWAYS follow):
- Match response length to the user's message. Greetings get 1 short sentence. Only give detail when asked.
- Use **bold** for emphasis, bullet points for lists. Use ## headers only for long structured responses.
- NEVER use horizontal rules (---), excessive line breaks, or decorative separators.
- Use emojis sparingly and naturally. No filler phrases like "Great question!" — get straight to the point.`;
}

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

const getPlatformContext = (platform: Platform): string => {
  const contexts: Record<Platform, string> = {
    instagram: "- Hook must appear in first 2 lines (before 'more' cutoff)\n- Use line breaks between paragraphs\n- Emotional & visual language works best\n- End with a clear question or invitation",
    youtube:   "- First 150 chars appear in search — make them keyword-rich\n- Sound enthusiastic but not clickbait\n- End with subscribe + bell notification CTA",
    linkedin:  "- Open with a personal insight, surprising stat, or bold claim\n- Use line breaks (avoid walls of text)\n- Professional but human — share what you learned\n- End with a thought-provoking question",
    twitter:   "- 280 characters max — every word must earn its place\n- Use conversational tone, short punchy sentences\n- 1-2 hashtags max\n- Tweets that end in questions get 23% more replies",
    facebook:  "- Conversational and community-focused\n- Ask a question or create curiosity\n- 1-2 broad hashtags max\n- Avoid clickbait — Facebook punishes reach for it",
    tiktok:    "- First 3 words decide if they stay\n- Extremely casual and direct — like texting a friend\n- Keep captions short; put hashtags at end",
  };
  return contexts[platform];
};

const parseMeta = (text: string) => {
  const get = (key: string) => {
    const m = text.match(new RegExp(`${key}:\\s*(.+)`, "i"));
    return m ? m[1].trim() : "";
  };
  const ingSection = text.match(/INGREDIENTS:\s*([\s\S]*?)(?:TIPS:|$)/i);
  const ingredientsList = ingSection
    ? ingSection[1].split("\n").map(l => l.replace(/^[-•*]\s*/, "").trim()).filter(Boolean)
    : [];
  return {
    description: get("DESCRIPTION"),
    cookTime: get("COOK_TIME"),
    prepTime: get("PREP_TIME"),
    difficulty: get("DIFFICULTY") || "Medium",
    servings: get("SERVINGS") || "4",
    ingredientsList,
    tips: get("TIPS"),
  };
};

const parseSteps = (text: string): string[] =>
  text.split("\n")
    .map(l => l.replace(/^\d+[.)]\s*/, "").trim())
    .filter(l => l.length > 10);

const getDesignPlatformContext = (tool: AiTool): string => {
  const contexts: Record<AiTool, string> = {
    midjourney: "End the prompt with: --ar {ratio} --v 6.1 --style raw. Use :: for emphasis weights. No full sentences — comma-separated descriptive phrases.",
    dalle:      "Natural language sentences. Specify size like '1792x1024'. Be descriptive about texture, lighting, and setting. Avoid jargon or special syntax.",
    stable:     "Start with quality tags: 'masterpiece, best quality, 8k, highly detailed, sharp focus'. Comma-separated tokens. Note negative prompt avoidance: blurry, low quality, deformed.",
    leonardo:   "Use quality descriptors: 'cinematic photography, concept art, artstation trending, unreal engine 5'. Comma-separated. Specify lighting and render engine.",
    flux:       "Clean descriptive natural language. No special syntax. Describe the scene as a detailed caption. Be specific about every visual element.",
    imagen:     "Natural language, detailed descriptions. Start with main subject, then setting, lighting, style, and mood. Be precise and verbose.",
  };
  return contexts[tool];
};

const Dashboard = () => {
  const [activeAgent, setActiveAgent] = useState<Agent>("default");
  const [messages, setMessages] = useState<Message[]>([
    { id: 1, text: "## Hey, I'm Ragent 👋\n\nI'm your AI orchestrator on the **Ragents** platform — built by Abdul Rauf Jatoi.\n\n**I can help you with:**\n- General questions, writing, brainstorming, explanations\n- Routing you to the right specialist agent automatically\n\n**My agents:**\n- 🔍 **AI Content Detector** — detect & humanize AI-written text\n- 🚀 **Social Agent** — create platform-optimized social posts\n- 🎨 **Design Agent** — AI image prompts (Midjourney, DALL·E, etc.)\n- 🎵 **Music Agent** — lyrics + Suno AI music prompts\n- 🍳 **Cooking Agent** — dish suggestions & step-by-step recipes\n\nJust tell me what you need — I'll handle it or pass you to the right agent automatically.", sender: "bot" },
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
  const [musicBuilder, setMusicBuilder] = useState<MusicBuilderState | null>(null);
  const [selectedCountry, setSelectedCountry] = useState<Country | null>(null);
  const [selectedDish, setSelectedDish] = useState<string | null>(null);
  const [selectedDishEmoji, setSelectedDishEmoji] = useState<string>("🍽️");
  const [selectedCookIngredients, setSelectedCookIngredients] = useState<CookIngredient[]>([]);
  const [cookingStep, setCookingStep] = useState<"country" | "dish" | "ingredients" | "ready">("country");
  const [recipeState, setRecipeState] = useState<RecipeState | null>(null);
  const [customAgents, setCustomAgents] = useState<CustomAgentConfig[]>(() => {
    try {
      const saved = localStorage.getItem("ragents_custom_agents");
      if (!saved) return [];
      const parsed = JSON.parse(saved);
      return parsed.map((a: CustomAgentConfig) => ({
        memorySize: 10,
        creationMode: "prompt" as const,
        ...a,
      }));
    } catch { return []; }
  });
  const [showBuilder, setShowBuilder] = useState(false);
  const [socialPost, setSocialPost] = useState<SocialPostState | null>(null);
  const [selectedAiTool, setSelectedAiTool] = useState<AiTool | null>(null);
  const [designPrompt, setDesignPrompt] = useState<DesignPromptState | null>(null);
  const endRef = useRef<HTMLDivElement>(null);
  const pendingDelegation = useRef<{ targetKey: string; originalMessage: string } | null>(null);

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

  useEffect(() => {
    const pd = pendingDelegation.current;
    if (pd && activeAgent === pd.targetKey) {
      pendingDelegation.current = null;
      const msgToForward = pd.originalMessage;
      setTimeout(() => {
        handleSendWithText(msgToForward);
      }, 150);
    }
  }, [activeAgent]);

  const contentAnalysisTools = [
    {
      name: "word_pattern_analysis",
      description: "Analyze word patterns, vocabulary diversity, and repetition to detect AI signatures.",
      parameters: {
        type: "object",
        properties: {
          text_snippet: { type: "string", description: "The text snippet to analyze" }
        },
        required: ["text_snippet"]
      }
    },
    {
      name: "tone_style_check",
      description: "Evaluate the writing tone, naturalness, and flow to see if it matches human-like variation.",
      parameters: {
        type: "object",
        properties: {
          text_snippet: { type: "string", description: "The text snippet to analyze" }
        },
        required: ["text_snippet"]
      }
    },
    {
      name: "structure_detection",
      description: "Check sentence patterns and paragraph flow for predictable AI-like structures.",
      parameters: {
        type: "object",
        properties: {
          text_snippet: { type: "string", description: "The text snippet to analyze" }
        },
        required: ["text_snippet"]
      }
    },
    {
      name: "ai_pattern_matching",
      description: "Match known AI signatures and cross-reference with established LLM output patterns.",
      parameters: {
        type: "object",
        properties: {
          text_snippet: { type: "string", description: "The text snippet to analyze" }
        },
        required: ["text_snippet"]
      }
    }
  ];

  const detectAi = async (text: string, onToolUpdate?: (toolName: string, result: string, score: number) => void): Promise<number> => {
    // Run 4 real client-side analysis tools
    const wordResult = analyzeWordPatterns(text);
    onToolUpdate?.("word_pattern_analysis", wordResult.finding, wordResult.score);

    const toneResult = analyzeToneStyle(text);
    onToolUpdate?.("tone_style_check", toneResult.finding, toneResult.score);

    const structResult = analyzeStructure(text);
    onToolUpdate?.("structure_detection", structResult.finding, structResult.score);

    const patternResult = analyzeAiPatterns(text);
    onToolUpdate?.("ai_pattern_matching", patternResult.finding, patternResult.score);

    // Weighted composite score
    const compositeScore = Math.round(
      wordResult.score * 0.30 +
      toneResult.score * 0.25 +
      structResult.score * 0.25 +
      patternResult.score * 0.20
    );

    // One LLM call for expert interpretation + score confirmation
    const analysisContext = [
      `Word Pattern Analysis (score: ${wordResult.score}/100): ${wordResult.finding}`,
      `Tone & Style Check (score: ${toneResult.score}/100): ${toneResult.finding}`,
      `Structure Detection (score: ${structResult.score}/100): ${structResult.finding}`,
      `AI Pattern Matching (score: ${patternResult.score}/100): ${patternResult.finding}`,
      `Composite Score: ${compositeScore}/100`,
    ].join("\n");

    const llmPrompt = `You are an expert AI content forensics analyst. Four algorithms analyzed the text below:

${analysisContext}

Based on these findings and your own judgment:
1. Give a 2-3 sentence expert interpretation of why this text is or isn't AI-generated.
2. Confirm or slightly adjust the composite score (stay within ±15 of ${compositeScore}).

TEXT:
"""${text.slice(0, 2500)}"""

Respond ONLY in this format:
Expert Assessment: [2-3 sentence interpretation]
Final AI Probability Score: [integer 0-100]`;

    let finalScore = compositeScore;
    try {
      const llmRes = await callAI([{ role: "user", content: llmPrompt }], apiSettings);
      const resText = typeof llmRes === "string" ? llmRes : "";
      const match = resText.match(/Final AI Probability Score:\s*(\d+)/i);
      if (match) {
        const parsed = parseInt(match[1], 10);
        if (!isNaN(parsed)) {
          finalScore = Math.max(compositeScore - 15, Math.min(compositeScore + 15, parsed));
          finalScore = Math.max(0, Math.min(100, finalScore));
        }
      }
    } catch { /* LLM failed — composite score stands */ }

    return finalScore;
  };


  const handleContentCheck = async (text: string) => {
    const userMsg: Message = { id: Date.now(), text: `Check this content for AI:\n\n"${text.slice(0, 500)}${text.length > 500 ? "..." : ""}"`, sender: "user" };
    setMessages((prev) => [...prev, userMsg]);
    setIsLoading(true);

    // Create a temporary message for tool updates
    const botMsgId = Date.now() + 1;
    const initialBotMsg: Message = {
      id: botMsgId,
      text: "Starting deep analysis...",
      sender: "bot",
      aiDetection: { score: 0, text, toolsInProgress: [] } as any
    };
    setMessages((prev) => [...prev, initialBotMsg]);

    try {
      const score = await detectAi(text, (name, result, score) => {
        setMessages((prev) => prev.map(m => m.id === botMsgId ? {
          ...m,
          aiDetection: {
            ...m.aiDetection!,
            toolsInProgress: [...(m.aiDetection as any).toolsInProgress || [], { name, result, score }]
          }
        } : m));
      });

      setMessages((prev) => prev.map(m => m.id === botMsgId ? {
        ...m,
        text: "Here's the detailed AI detection analysis:",
        aiDetection: { score, text, toolsFinal: (m.aiDetection as any).toolsInProgress } as any
      } : m));

    } catch (err: any) {
      toast.error("Detection failed: " + (err.message || "Unknown error"));
      setMessages((prev) => prev.filter(m => m.id !== botMsgId));
    } finally {
      setIsLoading(false);
    }
  };

  const handleHumanize = async (msgId: number) => {
    const msg = messages.find((m) => m.id === msgId);
    if (!msg?.aiDetection) return;
    setHumanizingId(msgId);

    const steps = [
      { name: "Vocabulary Diversification", status: "pending" as const },
      { name: "Burstiness Enhancement", status: "pending" as const },
      { name: "AI Signature Removal", status: "pending" as const },
      { name: "Natural Flow Optimization", status: "pending" as const }
    ];

    // Initialize steps in the message
    setMessages((prev) => prev.map(m => m.id === msgId ? {
      ...m,
      aiDetection: { ...m.aiDetection!, humanizingSteps: steps }
    } : m));

    try {
      // Step 1: Diversifying Vocabulary
      setMessages((prev) => prev.map(m => m.id === msgId ? {
        ...m,
        aiDetection: { ...m.aiDetection!, humanizingSteps: steps.map((s, i) => i === 0 ? { ...s, status: "running" } : s) }
      } : m));
      await new Promise(r => setTimeout(r, 1200));

      // Step 2: Enhancing Burstiness
      setMessages((prev) => prev.map(m => m.id === msgId ? {
        ...m,
        aiDetection: { ...m.aiDetection!, humanizingSteps: steps.map((s, i) => i === 0 ? { ...s, status: "done" } : i === 1 ? { ...s, status: "running" } : s) }
      } : m));
      await new Promise(r => setTimeout(r, 1200));

      const systemPrompt = `You are an elite Stealth-AI Humanizer. Your job is to rewrite text to perfectly mimic human writing and bypass even the most advanced AI detectors.

CORE GUIDELINES:
- BURSTINESS: Purposely alternate between very short, choppy sentences and longer, complex ones. Do not be repetitive in structure.
- PERPLEXITY: Use rich, varied vocabulary. Avoid the "safe" words typically chosen by LLMs.
- TONE: Sound like a passionate, slightly imperfect human. Use natural idioms. Avoid being overly "helpful" or "neutral".
- CONNECTORS: NEVER use "Moreover", "Furthermore", "In conclusion", "Additionally", "In summary", or "Indeed". Replace them with human transitions like "Thing is,", "Actually,", "But here's the catch,", or just start the next point directly.
- FLOW: Break the "perfect" flow. Use parenthetical remarks (like this), rhetorical questions, and occasional emphatic words.

Output ONLY the raw humanized text. NO markdown, NO formatting, NO preamble.`;

      const reply = await callAI([
        { role: "system", content: systemPrompt },
        { role: "user", content: msg.aiDetection.text },
      ], apiSettings);

      // Step 3: Removing AI Markers
      setMessages((prev) => prev.map(m => m.id === msgId ? {
        ...m,
        aiDetection: { ...m.aiDetection!, humanizingSteps: steps.map((s, i) => i <= 1 ? { ...s, status: "done" } : i === 2 ? { ...s, status: "running" } : s) }
      } : m));
      await new Promise(r => setTimeout(r, 800));

      const humanized = stripMarkdown(normalizeReply(typeof reply === "string" ? reply : ""));

      // Step 4: Final Polish
      setMessages((prev) => prev.map(m => m.id === msgId ? {
        ...m,
        aiDetection: { ...m.aiDetection!, humanizingSteps: steps.map((s, i) => i <= 2 ? { ...s, status: "done" } : i === 3 ? { ...s, status: "running" } : s) }
      } : m));
      await new Promise(r => setTimeout(r, 800));
      
      const newScore = await detectAi(humanized);

      // Reset steps once done
      setMessages((prev) => prev.map(m => m.id === msgId ? {
        ...m,
        aiDetection: { ...m.aiDetection!, humanizingSteps: steps.map(s => ({ ...s, status: "done" })) }
      } : m));

      setMessages((prev) => [...prev, { 
        id: Date.now(), 
        text: "Here's the humanized version:", 
        sender: "bot", 
        aiDetection: { 
          score: newScore, 
          text: humanized,
          isHumanized: true 
        } 
      }]);
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
      { id: Date.now() + 1, text: `Perfect! 🎵 Now tell me the theme, mood, or topic for your track:`, sender: "bot" },
    ]);
  };

  const handleMusicGenerate = (topic: string) => {
    if (!selectedGenre) return;
    const userMsg: Message = { id: Date.now(), text: topic, sender: "user" };
    setMessages((prev) => [...prev, userMsg]);
    setInput("");
    const state: MusicBuilderState = {
      topic, mood: "", tempo: "", mode: "",
      lyricsText: "", sunoPrompt: "", udioPrompt: "", stage: "mood_pick",
    };
    setMusicBuilder(state);
    setMessages((prev) => [...prev, {
      id: Date.now() + 1,
      text: "Let's create your track! Pick a mood first:",
      sender: "bot",
      showMusicBuilder: true,
    }]);
  };

  const handleMusicMoodPick = (mood: string) => {
    setMusicBuilder((prev) => prev ? { ...prev, mood, stage: "tempo_pick" } : prev);
  };

  const handleMusicTempoPick = (tempo: string) => {
    setMusicBuilder((prev) => prev ? { ...prev, tempo, stage: "mode_pick" } : prev);
  };

  const handleMusicModePick = async (mode: MusicMode) => {
    if (!musicBuilder || !selectedGenre) return;
    const genreLabel = genres[selectedGenre].label;
    const instLabels = selectedInstruments.map((i) => instruments[i].label).join(", ") || "no specific instruments";
    const raw = "Output ONLY the raw text. No labels, no markdown headers, no explanations.";

    setMusicBuilder((prev) => prev ? { ...prev, mode, stage: "lyrics_gen" } : prev);
    setIsLoading(true);

    try {
      let lyricsText = "";

      if (mode === "beat") {
        // Beat/instrumental description instead of lyrics
        const beatReply = await callAI([{
          role: "system",
          content: `You are a professional beatmaker and music producer. Describe a detailed instrumental beat arrangement for a ${genreLabel} track. Mood: ${musicBuilder.mood}. Tempo: ${musicBuilder.tempo}. Instruments: ${instLabels}. ${raw} Write 4-6 sentences describing the beat structure, drops, transitions, and feel. No lyrics.`,
        }, { role: "user", content: musicBuilder.topic }], apiSettings);
        lyricsText = stripMarkdown(normalizeReply(beatReply));
      } else if (mode === "alter") {
        // Alteration/remix rewrite
        const alterReply = await callAI([{
          role: "system",
          content: `You are a professional lyricist. The user wants to rewrite/remix their concept as a ${genreLabel} song. Mood: ${musicBuilder.mood}. Tempo: ${musicBuilder.tempo}. Instruments: ${instLabels}. ${raw} Write an improved, catchy version: 1 verse (4 lines) + chorus (4 lines) + 1 verse (4 lines). Label each section on its own line like: [Verse 1], [Chorus], [Verse 2].`,
        }, { role: "user", content: musicBuilder.topic }], apiSettings);
        lyricsText = stripMarkdown(normalizeReply(alterReply));
      } else {
        // write or full — generate lyrics
        const lyricsReply = await callAI([{
          role: "system",
          content: `You are a professional songwriter. Write ${genreLabel} song lyrics. Mood: ${musicBuilder.mood}. Tempo: ${musicBuilder.tempo}. Instruments: ${instLabels}. ${raw} Structure: [Verse 1] (4 lines), [Pre-Chorus] (2 lines), [Chorus] (4 lines), [Verse 2] (4 lines), [Chorus] (4 lines), [Bridge] (2 lines), [Outro] (2 lines). Each section label on its own line. Make it catchy and rhythmically tight.`,
        }, { role: "user", content: musicBuilder.topic }], apiSettings);
        lyricsText = stripMarkdown(normalizeReply(lyricsReply));
      }

      setMusicBuilder((prev) => prev ? { ...prev, lyricsText, stage: "prompts_gen" } : prev);

      // Suno prompt
      const sunoReply = await callAI([{
        role: "system",
        content: `You are a Suno AI prompt specialist. Write a concise Suno AI music generation prompt (25-40 words). Include: genre, mood, tempo, instruments, vocal style, and energy. ${raw} No sentences — use comma-separated descriptive tags. End with BPM if known.`,
      }, { role: "user", content: `Genre: ${genreLabel}. Mood: ${musicBuilder.mood}. Tempo: ${musicBuilder.tempo}. Instruments: ${instLabels}. Topic: ${musicBuilder.topic}.` }], apiSettings);
      const sunoPrompt = stripMarkdown(normalizeReply(sunoReply));

      // Udio prompt (different style emphasis)
      const udioReply = await callAI([{
        role: "system",
        content: `You are a Udio AI prompt specialist. Write a Udio music prompt (20-30 words). Udio favors full natural language descriptions over tags. Describe the sound, feeling, and atmosphere as if painting a picture. ${raw}`,
      }, { role: "user", content: `Genre: ${genreLabel}. Mood: ${musicBuilder.mood}. Tempo: ${musicBuilder.tempo}. Instruments: ${instLabels}. Topic: ${musicBuilder.topic}.` }], apiSettings);
      const udioPrompt = stripMarkdown(normalizeReply(udioReply));

      setMusicBuilder((prev) => prev ? { ...prev, sunoPrompt, udioPrompt, stage: "done" } : prev);
    } catch (err: any) {
      toast.error("Music generation failed: " + (err.message || "Unknown error"));
    } finally {
      setIsLoading(false);
    }
  };

  const handleCountrySelect = (c: Country) => {
    setSelectedCountry(c);
    setCookingStep("dish");
    setMessages((prev) => [
      ...prev,
      { id: Date.now(), text: `${countries[c].flag} ${countries[c].label}`, sender: "user" },
      { id: Date.now() + 1, text: `Great! Pick a dish from ${countries[c].label} cuisine:`, sender: "bot", showDishSelector: true },
    ]);
  };

  const handleDishSelect = (dish: string, emoji: string) => {
    setSelectedDish(dish);
    setSelectedDishEmoji(emoji);
    setCookingStep("ingredients");
    setMessages((prev) => [
      ...prev,
      { id: Date.now(), text: `${emoji} ${dish}`, sender: "user" },
      { id: Date.now() + 1, text: `Nice choice! Pick ingredients you have (or skip to use defaults):`, sender: "bot", showCookIngredientSelector: true },
    ]);
  };

  const handleCookIngredientToggle = (i: CookIngredient) => {
    setSelectedCookIngredients((prev) =>
      prev.includes(i) ? prev.filter((x) => x !== i) : [...prev, i]
    );
  };

  const startRecipeGeneration = async (ingLabels: string) => {
    if (!selectedCountry || !selectedDish) return;
    const countryLabel = countries[selectedCountry].label;
    const raw = "Output ONLY the raw text. No markdown. No extra explanations.";

    const initial: RecipeState = {
      country: selectedCountry, dish: selectedDish, dishEmoji: selectedDishEmoji,
      description: "", cookTime: "", prepTime: "", difficulty: "", servings: "",
      ingredientsList: [], steps: [], tips: "", stage: "recipe_gen",
    };
    setRecipeState(initial);
    setMessages((prev) => [...prev, {
      id: Date.now(), text: `Generating your ${selectedDish} recipe…`, sender: "bot", showRecipeCard: true,
    }]);
    setIsLoading(true);

    try {
      // Stage 1: recipe metadata
      const metaReply = await callAI([{
        role: "system",
        content: `You are a professional chef. Generate recipe metadata for "${selectedDish}" (${countryLabel} cuisine).${ingLabels ? ` User has: ${ingLabels}.` : ""}
Output EXACTLY in this format (one value per line, no extra text):
DESCRIPTION: [one sentence description]
COOK_TIME: [e.g. 45 mins]
PREP_TIME: [e.g. 20 mins]
DIFFICULTY: [Easy / Medium / Hard]
SERVINGS: [number]
INGREDIENTS:
[list each ingredient with quantity, one per line, no bullets]
TIPS: [one expert chef tip]`,
      }, { role: "user", content: selectedDish }], apiSettings);

      const meta = parseMeta(metaReply);
      setRecipeState((prev) => prev ? { ...prev, ...meta, stage: "steps_gen" } : prev);

      // Stage 2: step-by-step instructions
      const stepsReply = await callAI([{
        role: "system",
        content: `You are a professional chef. Write clear step-by-step cooking instructions for "${selectedDish}" (${countryLabel} cuisine). ${raw}
Write exactly 6-8 numbered steps. Each step on its own line starting with the number and a period. No extra text before or after.`,
      }, { role: "user", content: `Ingredients available: ${meta.ingredientsList.join(", ")}` }], apiSettings);

      const steps = parseSteps(stepsReply);
      setRecipeState((prev) => prev ? { ...prev, steps, stage: "done" } : prev);
    } catch (err: any) {
      toast.error("Recipe generation failed: " + (err.message || "Unknown error"));
    } finally {
      setIsLoading(false);
    }
  };

  const handleConfirmCookIngredients = () => {
    setCookingStep("ready");
    const ingLabels = selectedCookIngredients.map((i) => `${cookIngredients[i].icon} ${cookIngredients[i].label}`).join(", ");
    setMessages((prev) => [
      ...prev,
      { id: Date.now(), text: `Ingredients: ${ingLabels}`, sender: "user" },
    ]);
    startRecipeGeneration(ingLabels);
  };

  const handleSkipIngredients = () => {
    setCookingStep("ready");
    startRecipeGeneration("");
  };

  const handleSocialGenerate = (topic: string) => {
    if (!selectedPlatform) return;
    const userMsg: Message = { id: Date.now(), text: topic, sender: "user" };
    setMessages((prev) => [...prev, userMsg]);
    setInput("");
    const state: SocialPostState = { topic, style: "", hook: "", description: "", hashtags: "", cta: "", ctaType: "", link: "", stage: "style_pick" };
    setSocialPost(state);
    setMessages((prev) => [...prev, { id: Date.now() + 1, text: "Let's build your post! First, pick a style:", sender: "bot", showSocialBuilder: true }]);
  };

  const handleSocialStylePick = (style: string) => {
    setSocialPost((prev) => prev ? { ...prev, style, stage: "hook_pick" } : prev);
  };

  const handleSocialLengthPick = async (step: "hook" | "description", pref: string) => {
    if (!socialPost || !selectedPlatform) return;
    const platLabel = platforms[selectedPlatform].label;
    const lengthGuide = pref === "short" ? "1 sentence max, punchy" : pref === "medium" ? "2-3 sentences, balanced" : "4-5 sentences, detailed";
    setIsLoading(true);

    if (step === "hook") {
      setSocialPost((prev) => prev ? { ...prev, stage: "hook_gen" } : prev);
      try {
        const reply = await callAI([{
          role: "system",
          content: `You are a ${platLabel} content expert. Write a SINGLE hook line for a ${platLabel} post with a ${socialPost.style} tone.\n\nPlatform rules:\n${getPlatformContext(selectedPlatform)}\n\nOutput ONLY the raw hook text. No labels, no explanations. Length: ${lengthGuide}.`,
        }, { role: "user", content: socialPost.topic }], apiSettings);
        const hook = stripMarkdown(normalizeReply(reply));
        setSocialPost((prev) => prev ? { ...prev, hook, stage: "desc_pick" } : prev);
      } catch { toast.error("Hook generation failed"); }
    } else if (step === "description") {
      setSocialPost((prev) => prev ? { ...prev, stage: "desc_gen" } : prev);
      try {
        const reply = await callAI([{
          role: "system",
          content: `You are a ${platLabel} content expert. Write the post body with a ${socialPost.style} tone.\n\nFollows hook: "${socialPost.hook}"\nPlatform rules:\n${getPlatformContext(selectedPlatform)}\n\nOutput ONLY the body text. No hook, no hashtags, no CTA. Length: ${lengthGuide}.`,
        }, { role: "user", content: socialPost.topic }], apiSettings);
        const desc = stripMarkdown(normalizeReply(reply));
        setSocialPost((prev) => prev ? { ...prev, description: desc, stage: "tag_pick" } : prev);
      } catch { toast.error("Description generation failed"); }
    }
    setIsLoading(false);
  };

  const handleSocialTagPick = async (strategy: "minimal" | "moderate" | "maximum") => {
    if (!socialPost || !selectedPlatform) return;
    const platLabel = platforms[selectedPlatform].label;
    const tagCount = strategy === "minimal" ? "2-3 highly focused hashtags" : strategy === "moderate" ? "8-12 targeted hashtags" : "20-25 niche + broad hashtags";
    setSocialPost((prev) => prev ? { ...prev, stage: "tag_gen" } : prev);
    setIsLoading(true);
    try {
      const reply = await callAI([{
        role: "system",
        content: `Generate hashtags for a ${platLabel} post. Output ONLY the hashtags as a single line separated by spaces. Use ${tagCount}. Mix popular + niche tags.`,
      }, { role: "user", content: `Topic: "${socialPost.topic}" Hook: "${socialPost.hook}"` }], apiSettings);
      const hashtags = stripMarkdown(normalizeReply(reply));
      setSocialPost((prev) => prev ? { ...prev, hashtags, stage: "cta_ask" } : prev);
    } catch { toast.error("Hashtag generation failed"); }
    finally { setIsLoading(false); }
  };

  const handleSocialCta = async (addCta: boolean, ctaType?: string) => {
    if (!socialPost || !selectedPlatform) return;
    if (!addCta) {
      setSocialPost((prev) => prev ? { ...prev, stage: "done" } : prev);
      return;
    }
    const ctaTypeLabel = ctaType || "general";
    setSocialPost((prev) => prev ? { ...prev, stage: "cta_gen", ctaType: ctaTypeLabel } : prev);
    setIsLoading(true);
    try {
      const platLabel = platforms[selectedPlatform].label;
      const ctaReply = await callAI([{
        role: "system",
        content: `Write a ${ctaTypeLabel} call-to-action for a ${platLabel} post with ${socialPost.style} tone. Output ONLY the CTA text — no labels, no explanations.`,
      }, { role: "user", content: `Hook: "${socialPost.hook}" Topic: "${socialPost.topic}"` }], apiSettings);
      setSocialPost((prev) => prev ? { ...prev, cta: stripMarkdown(normalizeReply(ctaReply)), stage: "done" } : prev);
    } catch {
      toast.error("CTA generation failed");
      setSocialPost((prev) => prev ? { ...prev, stage: "done" } : prev);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSocialLinkChange = (link: string) => {
    setSocialPost((prev) => prev ? { ...prev, link } : prev);
  };

  const handleAiToolSelect = (tool: AiTool) => {
    setSelectedAiTool(tool);
    setMessages((prev) => [
      ...prev,
      { id: Date.now(), text: `${aiTools[tool].icon} ${aiTools[tool].label}`, sender: "user" },
      { id: Date.now() + 1, text: `Great! I'll generate prompts optimized for **${aiTools[tool].label}**. Describe the image you want to create!`, sender: "bot" },
    ]);
  };

  const handleDesignGenerate = (idea: string) => {
    if (!selectedAiTool) return;
    const userMsg: Message = { id: Date.now(), text: idea, sender: "user" };
    setMessages((prev) => [...prev, userMsg]);
    setInput("");
    const state: DesignPromptState = {
      idea, styleChoice: "", sizeChoice: "", colorTheme: "",
      subjectText: "", detailText: "", finalPrompt: "", stage: "style_pick",
    };
    setDesignPrompt(state);
    setMessages((prev) => [...prev, {
      id: Date.now() + 1,
      text: "Let's craft your prompt! First, pick an art style:",
      sender: "bot",
      showDesignBuilder: true,
    }]);
  };

  const handleDesignStylePick = (styleChoice: string) => {
    setDesignPrompt((prev) => prev ? { ...prev, styleChoice, stage: "size_pick" } : prev);
  };

  const handleDesignSizePick = (sizeChoice: string) => {
    setDesignPrompt((prev) => prev ? { ...prev, sizeChoice, stage: "color_pick" } : prev);
  };

  const handleDesignColorPick = async (colorTheme: string) => {
    if (!designPrompt || !selectedAiTool) return;
    const toolLabel = aiTools[selectedAiTool].label;
    const platformCtx = getDesignPlatformContext(selectedAiTool);
    const raw = "Output ONLY the raw text. No labels, no markdown, no explanations. Just plain text.";

    setDesignPrompt((prev) => prev ? { ...prev, colorTheme, stage: "subject_gen" } : prev);
    setIsLoading(true);
    try {
      // Subject analysis
      const subjectReply = await callAI([{
        role: "system",
        content: `You are a visual subject analyst for ${toolLabel}. Identify and describe the main subject, pose, expression, and key visual elements. Style: ${designPrompt.styleChoice}. Color theme: ${colorTheme}. ${raw} 1-2 sentences.`,
      }, { role: "user", content: designPrompt.idea }], apiSettings);
      const subjectText = stripMarkdown(normalizeReply(subjectReply));
      setDesignPrompt((prev) => prev ? { ...prev, subjectText, stage: "detail_gen" } : prev);

      // Technical details
      const detailReply = await callAI([{
        role: "system",
        content: `You are a technical prompt specialist for ${toolLabel}. Add lighting setup, camera/lens details, quality keywords, and atmosphere. Platform rules: ${platformCtx}. Style: ${designPrompt.styleChoice}. Size/ratio: ${designPrompt.sizeChoice}. ${raw} 1-2 sentences of technical descriptors only.`,
      }, { role: "user", content: `Topic: ${designPrompt.idea}. Subject: ${subjectText}` }], apiSettings);
      const detailText = stripMarkdown(normalizeReply(detailReply));
      setDesignPrompt((prev) => prev ? { ...prev, detailText, stage: "final_gen" } : prev);

      // Final prompt assembly
      const finalReply = await callAI([{
        role: "system",
        content: `You are a ${toolLabel} prompt engineer. Assemble one perfect, ready-to-use ${toolLabel} prompt from:
- Idea: ${designPrompt.idea}
- Style: ${designPrompt.styleChoice}
- Aspect Ratio: ${designPrompt.sizeChoice}
- Color Theme: ${colorTheme}
- Subject: ${subjectText}
- Technical Details: ${detailText}
Platform rules: ${platformCtx}
${raw} One cohesive prompt. Follow platform syntax exactly.`,
      }, { role: "user", content: designPrompt.idea }], apiSettings);
      const finalPrompt = stripMarkdown(normalizeReply(finalReply));
      setDesignPrompt((prev) => prev ? { ...prev, finalPrompt, stage: "done" } : prev);
    } catch (err: any) {
      toast.error("Design generation failed: " + (err.message || "Unknown error"));
    } finally {
      setIsLoading(false);
    }
  };

  const handleSendWithText = (text: string) => handleSend(text);

  const handleSend = async (explicitText?: string) => {
    const textToSend = (explicitText ?? input).trim();
    if (!textToSend || isLoading) return;

    if (activeAgent === "content" && textToSend.length > 100) {
      await handleContentCheck(textToSend);
      if (!explicitText) setInput("");
      return;
    }

    if (activeAgent === "social" && selectedPlatform && textToSend) {
      handleSocialGenerate(textToSend);
      if (!explicitText) setInput("");
      return;
    }

    if (activeAgent === "design" && selectedAiTool && textToSend) {
      handleDesignGenerate(textToSend);
      if (!explicitText) setInput("");
      return;
    }

    if (activeAgent === "music" && musicStep === "ready" && selectedGenre && textToSend) {
      handleMusicGenerate(textToSend);
      if (!explicitText) setInput("");
      return;
    }

    // Direct Switch Logic
    const directSwitchMatch = textToSend.toLowerCase().match(
      /(?:switch|change|go to|take me to|use|open)(?: me to| the)? (?:the )?(\w[\w\s]*?)(?: agent)?$/
    );
    if (directSwitchMatch) {
      const target = directSwitchMatch[1].toLowerCase().trim();
      const found = builtInAgents.find(a => a === target)
        || builtInAgents.find(a => agents[a as BuiltInAgent]?.label.toLowerCase().includes(target))
        || customAgents.find(ca => ca.id === target || ca.name.toLowerCase().includes(target))?.id;

      if (found) {
        switchAgent(found);
        if (!explicitText) setInput("");
        return;
      }
    }

    const originalInput = textToSend;
    const userMsg: Message = { id: Date.now(), text: originalInput, sender: "user" };
    const newMessages = [...messages, userMsg];
    setMessages(newMessages);
    if (!explicitText) setInput("");
    setIsLoading(true);

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

    let systemPrompt = buildRagentSystemPrompt(customAgents);
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
      const instLabels = selectedInstruments.map((i) => instruments[i].label).join(", ") || "any";
      systemPrompt = `You are a Music Agent — a professional songwriter, beatmaker, and AI music tool expert.${sharedSwitchInfo}

User's setup: Genre: ${genreLabel} | Instruments: ${instLabels}

You can help with:
- Writing or improving song lyrics (any genre, structure, style)
- Describing beats and instrumental arrangements
- Generating prompts for Suno AI, Udio, ElevenLabs, Boomy, AIVA
- Explaining music theory, chord progressions, scales, BPM
- Genre guides and production tips

When generating lyrics, use proper song structure: [Verse], [Pre-Chorus], [Chorus], [Bridge], [Outro].
When giving Suno prompts: comma-separated tags with genre, mood, instruments, tempo, vocal style.
When giving Udio prompts: natural descriptive language.
Be creative, musical, and professional.${formatRules}`;
    } else if (activeAgent === "cooking") {
      const countryLabel = selectedCountry ? countries[selectedCountry].label : "any";
      const ingLabels = selectedCookIngredients.map((i) => cookIngredients[i].label).join(", ") || "any";
      systemPrompt = `You are a Cooking Agent — a professional chef and culinary expert.${sharedSwitchInfo}

User's setup: Country: ${countryLabel} | Dish: ${selectedDish || "not selected"} | Ingredients: ${ingLabels}

You help with:
- Generating detailed, visual recipe cards (the system handles this automatically)
- Answering cooking questions, substitutions, techniques
- Suggesting dishes and cuisine variations
- Explaining cooking methods, tips, nutrition

Be warm, enthusiastic, and helpfully specific. Format cleanly.${formatRules}`;
    } else if (isCustomAgent && customAgent) {
      const toolsDesc = customAgent.tools.length > 0
        ? `\n\nYou have these capabilities: ${customAgent.tools.join(", ")}. Leverage them when relevant.`
        : "";
      systemPrompt = customAgent.systemPrompt + toolsDesc + formatRules;
    }

    try {
      const reply = await callAI([
        { role: "system", content: systemPrompt },
        ...newMessages.slice(-(isCustomAgent && customAgent ? customAgent.memorySize ?? 10 : 10)).map((m) => ({ role: m.sender === "user" ? "user" : "assistant", content: m.text })),
      ], apiSettings);


      // Check if agent wants to switch to another agent
      const switchMatch = reply.match(/\[SWITCH:(\w+)\]/);
      const cleanedReply = normalizeReply(reply);

      if (switchMatch) {
        const targetKey = switchMatch[1];
        const needsSetup = ["social", "design", "music", "cooking"].includes(targetKey);
        const agentLabel = agents[targetKey as BuiltInAgent]?.label
          || customAgents.find(ca => ca.id === targetKey)?.name
          || targetKey;
        const cleanReply = normalizeReply(cleanedReply.replace(/\[SWITCH:\w+\]/g, "").trim());

        if (needsSetup) {
          // Switch only — user must complete setup wizard before forwarding the message
          const handoffNote = `\n\n*Switching you to **${agentLabel}** — complete the quick setup to get started!*`;
          setMessages(prev => [...prev, { id: Date.now() + 1, text: cleanReply + handoffNote, sender: "bot" }]);
          switchAgent(targetKey);
        } else {
          // Auto-delegate: switch + forward original message automatically
          setMessages(prev => [...prev, { id: Date.now() + 1, text: cleanReply, sender: "bot" }]);
          pendingDelegation.current = { targetKey, originalMessage: originalInput };
          switchAgent(targetKey);
        }
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
    setMusicBuilder(null);
    setSelectedCountry(null);
    setSelectedDish(null);
    setSelectedDishEmoji("🍽️");
    setSelectedCookIngredients([]);
    setCookingStep("country");
    setRecipeState(null);

    const custom = customAgents.find((a) => a.id === agent);
    if (custom) {
      setMessages([{ id: Date.now(), text: custom.welcomeMessage, sender: "bot" }]);
      return;
    }

    const welcomes: Record<BuiltInAgent, string> = {
      default: "## Hey, I'm Ragent 👋\n\nI'm your AI orchestrator on the **Ragents** platform — built by Abdul Rauf Jatoi.\n\n**I can help you with:**\n- General questions, writing, brainstorming, explanations\n- Routing you to the right specialist agent automatically\n\n**My agents:**\n- 🔍 **AI Content Detector** — detect & humanize AI-written text\n- 🚀 **Social Agent** — create platform-optimized social posts\n- 🎨 **Design Agent** — AI image prompts (Midjourney, DALL·E, etc.)\n- 🎵 **Music Agent** — lyrics + Suno AI music prompts\n- 🍳 **Cooking Agent** — dish suggestions & step-by-step recipes\n\nJust tell me what you need — I'll handle it or pass you to the right agent automatically.",
      content: "🔍 AI Content Detector ready! Paste text (100+ chars) or upload a file — I'll run 4 analysis tools to detect AI-generated content.",
      social: "Social Media Agent ready! 🚀 Pick a platform below to get started:",
      design: "Design Agent ready! 🎨 First, pick the AI image tool you want to generate a prompt for:",
      music: "Music Agent ready! 🎵 I can write lyrics, remix tracks, build beats, and generate Suno/Udio prompts. First, pick a genre:",
      cooking: "Cooking Agent ready! 🍳 Pick a country to explore its cuisine:",
    };
    const msgs: Message[] = [{ id: Date.now(), text: welcomes[agent as BuiltInAgent] || "Hello!", sender: "bot" }];
    if (agent === "social") msgs[0].showPlatformSelector = true;
    if (agent === "design") msgs[0].showDesignToolSelector = true;
    if (agent === "music") msgs[0].showGenreSelector = true;
    if (agent === "cooking") msgs[0].showCountrySelector = true;
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
    if (activeAgent === "music") return musicStep === "ready" ? "Describe your song theme, story, or vibe…" : "Pick genre & instruments above first...";
    if (activeAgent === "cooking") return cookingStep === "ready" ? "Ask me anything about cooking or techniques…" : "Select a country and dish above first...";
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
                        style={socialPost.style}
                        hookText={socialPost.hook}
                        descriptionText={socialPost.description}
                        hashtagsText={socialPost.hashtags}
                        ctaText={socialPost.cta}
                        stage={socialPost.stage as any}
                        link={socialPost.link}
                        onStylePick={handleSocialStylePick}
                        onLengthPick={handleSocialLengthPick}
                        onTagPick={handleSocialTagPick}
                        onAddCta={(ctaType) => handleSocialCta(true, ctaType)}
                        onSkipCta={() => handleSocialCta(false)}
                        onLinkChange={handleSocialLinkChange}
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
                        styleChoice={designPrompt.styleChoice}
                        sizeChoice={designPrompt.sizeChoice}
                        colorTheme={designPrompt.colorTheme}
                        subjectText={designPrompt.subjectText}
                        detailText={designPrompt.detailText}
                        finalPrompt={designPrompt.finalPrompt}
                        stage={designPrompt.stage as any}
                        onStylePick={handleDesignStylePick}
                        onSizePick={handleDesignSizePick}
                        onColorPick={handleDesignColorPick}
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
                  {msg.showMusicBuilder && musicBuilder && selectedGenre && (
                    <div className="mt-3">
                      <MusicBuilder
                        genre={selectedGenre}
                        selectedInstruments={selectedInstruments}
                        topic={musicBuilder.topic}
                        mood={musicBuilder.mood}
                        tempo={musicBuilder.tempo}
                        mode={musicBuilder.mode}
                        lyricsText={musicBuilder.lyricsText}
                        sunoPrompt={musicBuilder.sunoPrompt}
                        udioPrompt={musicBuilder.udioPrompt}
                        stage={musicBuilder.stage as any}
                        onMoodPick={handleMusicMoodPick}
                        onTempoPick={handleMusicTempoPick}
                        onModePick={handleMusicModePick}
                      />
                    </div>
                  )}
                  {msg.showCountrySelector && (
                    <div className="mt-3">
                      <CookingSelector
                        step="country"
                        selectedCountry={selectedCountry}
                        selectedDish={selectedDish}
                        selectedIngredients={selectedCookIngredients}
                        onCountrySelect={handleCountrySelect}
                        onDishSelect={handleDishSelect}
                        onIngredientToggle={handleCookIngredientToggle}
                        onConfirmIngredients={handleConfirmCookIngredients}
                        onSkipIngredients={handleSkipIngredients}
                      />
                    </div>
                  )}
                  {msg.showDishSelector && selectedCountry && (
                    <div className="mt-3">
                      <CookingSelector
                        step="dish"
                        selectedCountry={selectedCountry}
                        selectedDish={selectedDish}
                        selectedIngredients={selectedCookIngredients}
                        onCountrySelect={handleCountrySelect}
                        onDishSelect={handleDishSelect}
                        onIngredientToggle={handleCookIngredientToggle}
                        onConfirmIngredients={handleConfirmCookIngredients}
                        onSkipIngredients={handleSkipIngredients}
                      />
                    </div>
                  )}
                  {msg.showCookIngredientSelector && (
                    <div className="mt-3">
                      <CookingSelector
                        step="ingredients"
                        selectedCountry={selectedCountry}
                        selectedDish={selectedDish}
                        selectedIngredients={selectedCookIngredients}
                        onCountrySelect={handleCountrySelect}
                        onDishSelect={handleDishSelect}
                        onIngredientToggle={handleCookIngredientToggle}
                        onConfirmIngredients={handleConfirmCookIngredients}
                        onSkipIngredients={handleSkipIngredients}
                      />
                    </div>
                  )}
                  {msg.showRecipeCard && recipeState && selectedCountry && (
                    <div className="mt-3">
                      <RecipeCard
                        country={recipeState.country}
                        dish={recipeState.dish}
                        dishEmoji={recipeState.dishEmoji}
                        description={recipeState.description}
                        cookTime={recipeState.cookTime}
                        prepTime={recipeState.prepTime}
                        difficulty={recipeState.difficulty}
                        servings={recipeState.servings}
                        ingredientsList={recipeState.ingredientsList}
                        steps={recipeState.steps}
                        tips={recipeState.tips}
                        stage={recipeState.stage}
                      />
                    </div>
                  )}
                  {msg.aiDetection && (
                    <AiDetectionResult
                      score={msg.aiDetection.score}
                      text={msg.aiDetection.text}
                      onHumanize={() => handleHumanize(msg.id)}
                      isHumanizing={humanizingId === msg.id}
                      isHumanized={msg.aiDetection.isHumanized}
                      toolsInProgress={msg.aiDetection.toolsInProgress}
                      toolsFinal={msg.aiDetection.toolsFinal}
                      humanizingSteps={msg.aiDetection.humanizingSteps}
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
            onClick={() => handleSend()}
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
