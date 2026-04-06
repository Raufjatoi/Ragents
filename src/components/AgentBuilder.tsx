import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  X, Plus, Sparkles, MessageSquare, Bot, Zap, Brain, Code, Globe,
  Heart, Star, Shield, Lightbulb, Rocket, Target, Wrench, BookOpen,
  LayoutTemplate, Database,
  type LucideIcon,
} from "lucide-react";

export interface CustomAgentConfig {
  id: string;
  name: string;
  description: string;
  systemPrompt: string;
  welcomeMessage: string;
  iconKey: string;
  colorHue: number;
  tools: string[];
  memorySize: number;
  creationMode: "visual" | "prompt";
}

interface IconOption {
  key: string;
  icon: LucideIcon;
  label: string;
}

const iconOptions: IconOption[] = [
  { key: "bot", icon: Bot, label: "Bot" },
  { key: "sparkles", icon: Sparkles, label: "Sparkles" },
  { key: "zap", icon: Zap, label: "Zap" },
  { key: "brain", icon: Brain, label: "Brain" },
  { key: "code", icon: Code, label: "Code" },
  { key: "globe", icon: Globe, label: "Globe" },
  { key: "heart", icon: Heart, label: "Heart" },
  { key: "star", icon: Star, label: "Star" },
  { key: "shield", icon: Shield, label: "Shield" },
  { key: "lightbulb", icon: Lightbulb, label: "Idea" },
  { key: "rocket", icon: Rocket, label: "Rocket" },
  { key: "target", icon: Target, label: "Target" },
  { key: "wrench", icon: Wrench, label: "Wrench" },
  { key: "book", icon: BookOpen, label: "Book" },
  { key: "message", icon: MessageSquare, label: "Chat" },
];

const toolOptions = [
  { id: "web_search",   label: "🔍 Web Search",        desc: "Search the internet for real-time info" },
  { id: "code_gen",     label: "💻 Code Generation",    desc: "Write, explain & debug code" },
  { id: "summarize",    label: "📝 Summarizer",         desc: "Condense long texts into key points" },
  { id: "translate",    label: "🌐 Translator",         desc: "Translate between 100+ languages" },
  { id: "creative",     label: "✨ Creative Writing",   desc: "Stories, poems, scripts" },
  { id: "analyze",      label: "📊 Data Analysis",      desc: "Analyze & interpret data/numbers" },
  { id: "brainstorm",   label: "💡 Brainstormer",       desc: "Generate and expand ideas" },
  { id: "qa",           label: "❓ Q&A Expert",         desc: "Answer questions with precision" },
  { id: "email",        label: "📧 Email Writer",       desc: "Draft professional emails" },
  { id: "seo",          label: "🔎 SEO Optimizer",      desc: "Keywords, meta, content strategy" },
  { id: "image_desc",   label: "🖼️ Image Describer",   desc: "Describe and analyze images" },
  { id: "math",         label: "🧮 Math Solver",        desc: "Solve equations step by step" },
  { id: "research",     label: "🔬 Deep Researcher",    desc: "Multi-step research & synthesis" },
  { id: "legal",        label: "⚖️ Legal Helper",       desc: "Contracts, terms, legal language" },
];

const colorPresets = [
  { hue: 0, label: "Red" },
  { hue: 30, label: "Orange" },
  { hue: 50, label: "Yellow" },
  { hue: 120, label: "Green" },
  { hue: 170, label: "Teal" },
  { hue: 210, label: "Blue" },
  { hue: 260, label: "Purple" },
  { hue: 300, label: "Pink" },
  { hue: 330, label: "Rose" },
];

const memorySizeOptions = [5, 10, 20, 50] as const;

export const getIconByKey = (key: string): LucideIcon => {
  return iconOptions.find((o) => o.key === key)?.icon || Bot;
};

export const getCustomTheme = (hue: number) => {
  const sat = 70;
  const bg = `hsl(${hue}, ${sat}%, 5%)`;
  const headerBg = `hsla(${hue}, ${sat}%, 5%, 0.8)`;
  const border = `hsla(${hue}, ${sat}%, 50%, 0.2)`;
  const accent = `hsl(${hue}, ${sat}%, 65%)`;
  const accentRgba = `hsla(${hue}, ${sat}%, 50%,`;
  return { bg, headerBg, border, accent, accentRgba };
};

export const getCustomDropdownBg = (hue: number) => `hsl(${hue}, 50%, 10%)`;

interface AgentBuilderProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (config: CustomAgentConfig) => void;
}

const AgentBuilder = ({ isOpen, onClose, onSave }: AgentBuilderProps) => {
  const [creationMode, setCreationMode] = useState<"visual" | "prompt">("prompt");
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [systemPrompt, setSystemPrompt] = useState("");
  const [welcomeMessage, setWelcomeMessage] = useState("");
  const [selectedIcon, setSelectedIcon] = useState("bot");
  const [colorHue, setColorHue] = useState(210);
  const [selectedTools, setSelectedTools] = useState<string[]>([]);
  const [memorySize, setMemorySize] = useState<number>(10);
  const [customToolInput, setCustomToolInput] = useState("");
  const [customTools, setCustomTools] = useState<{ id: string; label: string }[]>([]);
  const [promptFormat, setPromptFormat] = useState<"text" | "markdown" | "code">("text");
  const [step, setStep] = useState<1 | 2 | 3>(1);

  const accent = `hsl(${colorHue}, 70%, 65%)`;
  const accentBg = `hsla(${colorHue}, 70%, 50%, 0.15)`;
  const accentBorder = `hsla(${colorHue}, 70%, 50%, 0.3)`;
  const panelBg = `hsl(${colorHue}, 50%, 6%)`;

  const toggleTool = (id: string) => {
    setSelectedTools((prev) =>
      prev.includes(id) ? prev.filter((t) => t !== id) : [...prev, id]
    );
  };

  const addCustomTool = () => {
    const label = customToolInput.trim();
    if (!label) return;
    setCustomTools((prev) => [...prev, { id: `custom_${Date.now()}`, label: `🔧 ${label}` }]);
    setCustomToolInput("");
  };

  const removeCustomTool = (id: string) => {
    setCustomTools((prev) => prev.filter((ct) => ct.id !== id));
  };

  const handleSave = () => {
    if (!name.trim() || !systemPrompt.trim()) return;
    const allTools = [
      ...selectedTools,
      ...customTools.map((ct) => ct.label),
    ];
    const config: CustomAgentConfig = {
      id: `custom_${Date.now()}`,
      name: name.trim(),
      description: description.trim() || "Custom agent",
      systemPrompt: systemPrompt.trim(),
      welcomeMessage: welcomeMessage.trim() || `${name.trim()} ready! How can I help you?`,
      iconKey: selectedIcon,
      colorHue,
      tools: allTools,
      memorySize,
      creationMode,
    };
    onSave(config);
    // Reset
    setName("");
    setDescription("");
    setSystemPrompt("");
    setWelcomeMessage("");
    setSelectedIcon("bot");
    setColorHue(210);
    setSelectedTools([]);
    setMemorySize(10);
    setCreationMode("prompt");
    setCustomToolInput("");
    setCustomTools([]);
    setPromptFormat("text");
    setStep(1);
  };

  const canProceed1 = name.trim().length > 0;
  const canProceed2 = systemPrompt.trim().length > 0;
  const canCreate = canProceed1 && canProceed2;

  // Shared sections used in both modes
  const IdentitySection = () => (
    <div className="space-y-4">
      {/* Name */}
      <div>
        <label className="text-xs font-medium mb-1.5 block" style={{ color: accent }}>
          Agent Name *
        </label>
        <input
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="e.g. Code Buddy, Marketing Pro..."
          className="w-full px-4 py-2.5 rounded-xl text-sm bg-transparent outline-none"
          style={{ border: `1px solid ${accentBorder}`, color: "#f5f2f1", backgroundColor: "rgba(255,255,255,0.03)" }}
        />
      </div>
      {/* Description */}
      <div>
        <label className="text-xs font-medium mb-1.5 block" style={{ color: accent }}>
          Short Description
        </label>
        <input
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="What does this agent do?"
          className="w-full px-4 py-2.5 rounded-xl text-sm bg-transparent outline-none"
          style={{ border: `1px solid ${accentBorder}`, color: "#f5f2f1", backgroundColor: "rgba(255,255,255,0.03)" }}
        />
      </div>
      {/* Icon */}
      <div>
        <label className="text-xs font-medium mb-1.5 block" style={{ color: accent }}>Icon</label>
        <div className="grid grid-cols-5 gap-2">
          {iconOptions.map((opt) => {
            const Icon = opt.icon;
            const isSelected = selectedIcon === opt.key;
            return (
              <button
                key={opt.key}
                onClick={() => setSelectedIcon(opt.key)}
                className="relative flex flex-col items-center gap-1 px-2 py-2.5 rounded-lg text-xs transition-all duration-200 hover:scale-105"
                style={{
                  backgroundColor: isSelected ? accentBg : "rgba(255,255,255,0.03)",
                  border: `1px solid ${isSelected ? accentBorder : "rgba(255,255,255,0.06)"}`,
                  color: isSelected ? accent : "rgba(245,242,241,0.5)",
                }}
              >
                <Icon size={16} />
                <span className="text-[9px]">{opt.label}</span>
              </button>
            );
          })}
        </div>
      </div>
      {/* Color */}
      <div>
        <label className="text-xs font-medium mb-1.5 block" style={{ color: accent }}>Theme Color</label>
        <div className="flex gap-2 flex-wrap mb-3">
          {colorPresets.map((c) => (
            <button
              key={c.hue}
              onClick={() => setColorHue(c.hue)}
              className="w-7 h-7 rounded-full transition-all duration-200 hover:scale-110"
              style={{
                backgroundColor: `hsl(${c.hue}, 70%, 45%)`,
                border: colorHue === c.hue ? "2px solid #f5f2f1" : "2px solid transparent",
                boxShadow: colorHue === c.hue ? `0 0 12px hsla(${c.hue}, 70%, 50%, 0.5)` : "none",
              }}
              title={c.label}
            />
          ))}
        </div>
        {/* Hue slider */}
        <div className="flex items-center gap-3">
          <input
            type="range"
            min={0}
            max={359}
            value={colorHue}
            onChange={(e) => setColorHue(Number(e.target.value))}
            className="flex-1 h-2 rounded-full appearance-none cursor-pointer"
            style={{
              background: `linear-gradient(to right, hsl(0,70%,50%), hsl(60,70%,50%), hsl(120,70%,50%), hsl(180,70%,50%), hsl(240,70%,50%), hsl(300,70%,50%), hsl(360,70%,50%))`,
              accentColor: accent,
            }}
          />
          <div
            className="w-6 h-6 rounded-full flex-shrink-0"
            style={{ backgroundColor: `hsl(${colorHue}, 70%, 50%)`, border: "2px solid rgba(255,255,255,0.2)" }}
          />
          <span className="text-[10px] w-10 flex-shrink-0" style={{ color: "rgba(245,242,241,0.4)" }}>{colorHue}°</span>
        </div>
      </div>
    </div>
  );

  const SystemConfigSection = () => (
    <div className="space-y-4">
      {/* Format tabs */}
      <div>
        <div className="flex items-center justify-between mb-1.5">
          <label className="text-xs font-medium" style={{ color: accent }}>
            System Prompt * <span style={{ color: "rgba(245,242,241,0.3)" }}>— Defines agent behavior</span>
          </label>
          <div className="flex gap-1 p-0.5 rounded-md" style={{ backgroundColor: "rgba(255,255,255,0.05)" }}>
            {(["text", "markdown", "code"] as const).map((fmt) => (
              <button
                key={fmt}
                onClick={() => setPromptFormat(fmt)}
                className="px-2 py-0.5 rounded text-[10px] font-medium capitalize transition-all"
                style={{
                  backgroundColor: promptFormat === fmt ? accentBg : "transparent",
                  color: promptFormat === fmt ? accent : "rgba(245,242,241,0.4)",
                }}
              >
                {fmt}
              </button>
            ))}
          </div>
        </div>
        <textarea
          value={systemPrompt}
          onChange={(e) => setSystemPrompt(e.target.value)}
          placeholder="You are a helpful assistant specialized in... Your role is to..."
          rows={6}
          className="w-full px-4 py-3 rounded-xl text-sm bg-transparent outline-none resize-none"
          style={{
            border: `1px solid ${accentBorder}`,
            color: "#f5f2f1",
            backgroundColor: "rgba(255,255,255,0.03)",
            fontFamily: promptFormat === "code" ? "monospace" : "inherit",
            fontSize: promptFormat === "code" ? "12px" : undefined,
          }}
        />
      </div>
      {/* Welcome message */}
      <div>
        <label className="text-xs font-medium mb-1.5 block" style={{ color: accent }}>
          Welcome Message <span style={{ color: "rgba(245,242,241,0.3)" }}>— First message shown</span>
        </label>
        <input
          value={welcomeMessage}
          onChange={(e) => setWelcomeMessage(e.target.value)}
          placeholder={`${name || "Agent"} ready! How can I help you?`}
          className="w-full px-4 py-2.5 rounded-xl text-sm bg-transparent outline-none"
          style={{ border: `1px solid ${accentBorder}`, color: "#f5f2f1", backgroundColor: "rgba(255,255,255,0.03)" }}
        />
      </div>
    </div>
  );

  const ToolsSection = () => (
    <div className="space-y-3">
      <label className="text-xs font-medium block" style={{ color: accent }}>Tools & Capabilities</label>
      <div className="grid grid-cols-2 gap-2">
        {toolOptions.map((tool) => {
          const isSelected = selectedTools.includes(tool.id);
          return (
            <button
              key={tool.id}
              onClick={() => toggleTool(tool.id)}
              className="flex items-start gap-2 px-3 py-2.5 rounded-xl text-left transition-all duration-200 hover:scale-[1.02]"
              style={{
                backgroundColor: isSelected ? accentBg : "rgba(255,255,255,0.03)",
                border: `1px solid ${isSelected ? accentBorder : "rgba(255,255,255,0.06)"}`,
              }}
            >
              <span className="text-sm mt-0.5">{tool.label.split(" ")[0]}</span>
              <div>
                <p className="text-xs font-medium" style={{ color: isSelected ? accent : "rgba(245,242,241,0.7)" }}>
                  {tool.label.split(" ").slice(1).join(" ")}
                </p>
                <p className="text-[10px]" style={{ color: "rgba(245,242,241,0.35)" }}>{tool.desc}</p>
              </div>
            </button>
          );
        })}
      </div>
      {/* Custom tool input */}
      <div className="flex gap-2">
        <input
          value={customToolInput}
          onChange={(e) => setCustomToolInput(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && addCustomTool()}
          placeholder="Add custom tool (e.g. PDF Reader)"
          className="flex-1 px-3 py-2 rounded-lg text-xs bg-transparent outline-none"
          style={{ border: `1px solid rgba(255,255,255,0.1)`, color: "#f5f2f1", backgroundColor: "rgba(255,255,255,0.03)" }}
        />
        <button
          onClick={addCustomTool}
          className="px-3 py-2 rounded-lg text-xs font-medium transition-all hover:scale-105"
          style={{ backgroundColor: accentBg, color: accent, border: `1px solid ${accentBorder}` }}
        >
          + Add
        </button>
      </div>
      {customTools.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {customTools.map((ct) => (
            <span
              key={ct.id}
              className="flex items-center gap-1 px-2 py-1 rounded-full text-[10px]"
              style={{ backgroundColor: accentBg, color: accent, border: `1px solid ${accentBorder}` }}
            >
              {ct.label}
              <button onClick={() => removeCustomTool(ct.id)} className="hover:opacity-70">
                <X size={8} />
              </button>
            </span>
          ))}
        </div>
      )}
    </div>
  );

  const MemorySection = () => (
    <div className="space-y-2">
      <label className="text-xs font-medium block" style={{ color: accent }}>
        Memory — Context Window{" "}
        <span style={{ color: "rgba(245,242,241,0.35)" }}>— past messages sent to AI</span>
      </label>
      <div className="flex gap-2">
        {memorySizeOptions.map((n) => (
          <button
            key={n}
            onClick={() => setMemorySize(n)}
            className="flex-1 py-2 rounded-lg text-xs font-medium transition-all"
            style={{
              backgroundColor: memorySize === n ? accentBg : "rgba(255,255,255,0.03)",
              border: `1px solid ${memorySize === n ? accentBorder : "rgba(255,255,255,0.06)"}`,
              color: memorySize === n ? accent : "rgba(245,242,241,0.5)",
            }}
          >
            {n === 50 ? "All" : `Last ${n}`}
          </button>
        ))}
      </div>
      <p className="text-[10px]" style={{ color: "rgba(245,242,241,0.3)" }}>
        {memorySize === 50
          ? "Full conversation sent — better continuity, higher cost"
          : `Only last ${memorySize} messages sent — faster & cheaper`}
      </p>
    </div>
  );

  const PreviewSection = () => (
    <div
      className="p-4 rounded-xl space-y-2"
      style={{ backgroundColor: "rgba(255,255,255,0.03)", border: `1px solid ${accentBorder}` }}
    >
      <p className="text-[10px] uppercase tracking-wider font-semibold" style={{ color: accent }}>Preview</p>
      <div className="flex items-center gap-2">
        {(() => { const Icon = getIconByKey(selectedIcon); return <Icon size={18} style={{ color: accent }} />; })()}
        <div>
          <p className="text-sm font-medium" style={{ color: "#f5f2f1" }}>{name || "Unnamed Agent"}</p>
          <p className="text-[10px]" style={{ color: "rgba(245,242,241,0.4)" }}>{description || "Custom agent"}</p>
        </div>
      </div>
      <p className="text-xs mt-2 px-3 py-2 rounded-lg" style={{ backgroundColor: `hsla(${colorHue}, 70%, 50%, 0.1)`, color: "rgba(245,242,241,0.7)" }}>
        {welcomeMessage || `${name || "Agent"} ready! How can I help you?`}
      </p>
    </div>
  );

  // Dotted connector for visual mode
  const Connector = () => (
    <div className="flex justify-start pl-[11px] my-1">
      <div className="w-px h-5 border-l-2 border-dashed" style={{ borderColor: accentBorder }} />
    </div>
  );

  // Node card wrapper for visual mode
  const NodeCard = ({ icon: Icon, title, stepNum, children }: { icon: LucideIcon; title: string; stepNum: number; children: React.ReactNode }) => (
    <div className="rounded-xl p-4" style={{ backgroundColor: "rgba(255,255,255,0.03)", border: `1px solid ${accentBorder}` }}>
      <div className="flex items-center gap-2 mb-3">
        <div
          className="w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold flex-shrink-0"
          style={{ backgroundColor: accentBg, color: accent, border: `1px solid ${accentBorder}` }}
        >
          {stepNum}
        </div>
        <Icon size={13} style={{ color: accent }} />
        <span className="text-xs font-semibold" style={{ color: accent }}>{title}</span>
      </div>
      <div>{children}</div>
    </div>
  );

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[100] flex items-center justify-center p-4"
          style={{ backgroundColor: "rgba(0,0,0,0.7)", backdropFilter: "blur(8px)" }}
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            transition={{ duration: 0.25 }}
            className="w-full max-w-lg max-h-[90vh] rounded-2xl overflow-hidden flex flex-col"
            style={{
              backgroundColor: panelBg,
              border: `1px solid ${accentBorder}`,
              boxShadow: `0 25px 60px -10px hsla(${colorHue}, 70%, 20%, 0.5)`,
            }}
          >
            {/* Header */}
            <div
              className="flex items-center justify-between px-6 py-4 border-b"
              style={{ borderColor: accentBorder }}
            >
              <div className="flex items-center gap-3">
                <div
                  className="w-8 h-8 rounded-lg flex items-center justify-center"
                  style={{ backgroundColor: accentBg }}
                >
                  <Plus size={16} style={{ color: accent }} />
                </div>
                <div>
                  <h2 className="text-sm font-semibold" style={{ color: "#f5f2f1" }}>
                    Create Custom Agent
                  </h2>
                  <p className="text-xs" style={{ color: "rgba(245,242,241,0.4)" }}>
                    {creationMode === "visual" ? "Visual Flow Builder" : `Step ${step} of 3`}
                  </p>
                </div>
              </div>
              <button
                onClick={onClose}
                className="p-1.5 rounded-lg transition-colors hover:bg-white/10"
              >
                <X size={16} style={{ color: "rgba(245,242,241,0.5)" }} />
              </button>
            </div>

            {/* Progress bar — only shown in prompt mode */}
            {creationMode === "prompt" && (
              <div className="h-1 w-full" style={{ backgroundColor: "rgba(255,255,255,0.05)" }}>
                <motion.div
                  className="h-full"
                  style={{ backgroundColor: accent }}
                  animate={{ width: `${(step / 3) * 100}%` }}
                  transition={{ duration: 0.3 }}
                />
              </div>
            )}

            {/* Mode toggle */}
            <div className="px-6 pt-4 pb-0">
              <div
                className="flex gap-1 p-1 rounded-lg"
                style={{ backgroundColor: "rgba(255,255,255,0.04)" }}
              >
                <button
                  onClick={() => { setCreationMode("prompt"); setStep(1); }}
                  className="flex-1 flex items-center justify-center gap-1.5 py-1.5 rounded-md text-xs font-medium transition-all"
                  style={{
                    backgroundColor: creationMode === "prompt" ? accentBg : "transparent",
                    color: creationMode === "prompt" ? accent : "rgba(245,242,241,0.45)",
                    border: creationMode === "prompt" ? `1px solid ${accentBorder}` : "1px solid transparent",
                  }}
                >
                  <MessageSquare size={11} /> Prompt
                </button>
                <button
                  onClick={() => setCreationMode("visual")}
                  className="flex-1 flex items-center justify-center gap-1.5 py-1.5 rounded-md text-xs font-medium transition-all"
                  style={{
                    backgroundColor: creationMode === "visual" ? accentBg : "transparent",
                    color: creationMode === "visual" ? accent : "rgba(245,242,241,0.45)",
                    border: creationMode === "visual" ? `1px solid ${accentBorder}` : "1px solid transparent",
                  }}
                >
                  <LayoutTemplate size={11} /> Visual Flow
                </button>
              </div>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto px-6 py-5 space-y-5">
              <AnimatePresence mode="wait">

                {/* ── VISUAL FLOW MODE ── */}
                {creationMode === "visual" && (
                  <motion.div
                    key="visual"
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -8 }}
                    className="space-y-0"
                  >
                    <NodeCard icon={Bot} title="Identity" stepNum={1}>
                      <IdentitySection />
                    </NodeCard>
                    <Connector />
                    <NodeCard icon={Brain} title="System Config" stepNum={2}>
                      <SystemConfigSection />
                    </NodeCard>
                    <Connector />
                    <NodeCard icon={Wrench} title="Tools" stepNum={3}>
                      <ToolsSection />
                    </NodeCard>
                    <Connector />
                    <NodeCard icon={Database} title="Memory" stepNum={4}>
                      <MemorySection />
                    </NodeCard>
                    <div className="mt-4">
                      <PreviewSection />
                    </div>
                  </motion.div>
                )}

                {/* ── PROMPT MODE ── */}
                {creationMode === "prompt" && step === 1 && (
                  <motion.div
                    key="step1"
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -20 }}
                  >
                    <IdentitySection />
                  </motion.div>
                )}

                {creationMode === "prompt" && step === 2 && (
                  <motion.div
                    key="step2"
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -20 }}
                  >
                    <SystemConfigSection />
                  </motion.div>
                )}

                {creationMode === "prompt" && step === 3 && (
                  <motion.div
                    key="step3"
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -20 }}
                    className="space-y-5"
                  >
                    <ToolsSection />
                    <MemorySection />
                    <PreviewSection />
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* Footer */}
            <div
              className="flex items-center justify-between px-6 py-4 border-t"
              style={{ borderColor: accentBorder }}
            >
              {creationMode === "visual" ? (
                <>
                  <button
                    onClick={onClose}
                    className="px-4 py-2 rounded-lg text-sm transition-colors hover:bg-white/10"
                    style={{ color: "rgba(245,242,241,0.6)" }}
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleSave}
                    disabled={!canCreate}
                    className="px-5 py-2 rounded-lg text-sm font-medium transition-all hover:scale-105 disabled:opacity-40 disabled:hover:scale-100"
                    style={{ backgroundColor: accent, color: `hsl(${colorHue}, 50%, 6%)` }}
                  >
                    ✨ Create Agent
                  </button>
                </>
              ) : (
                <>
                  <button
                    onClick={() => step > 1 ? setStep((s) => (s - 1) as 1 | 2 | 3) : onClose()}
                    className="px-4 py-2 rounded-lg text-sm transition-colors hover:bg-white/10"
                    style={{ color: "rgba(245,242,241,0.6)" }}
                  >
                    {step > 1 ? "← Back" : "Cancel"}
                  </button>
                  {step < 3 ? (
                    <button
                      onClick={() => setStep((s) => (s + 1) as 1 | 2 | 3)}
                      disabled={step === 1 ? !canProceed1 : !canProceed2}
                      className="px-5 py-2 rounded-lg text-sm font-medium transition-all hover:scale-105 disabled:opacity-40 disabled:hover:scale-100"
                      style={{ backgroundColor: accentBg, color: accent, border: `1px solid ${accentBorder}` }}
                    >
                      Next →
                    </button>
                  ) : (
                    <button
                      onClick={handleSave}
                      disabled={!canCreate}
                      className="px-5 py-2 rounded-lg text-sm font-medium transition-all hover:scale-105 disabled:opacity-40 disabled:hover:scale-100"
                      style={{ backgroundColor: accent, color: `hsl(${colorHue}, 50%, 6%)` }}
                    >
                      ✨ Create Agent
                    </button>
                  )}
                </>
              )}
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default AgentBuilder;
