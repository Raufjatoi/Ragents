import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Settings2, ChevronDown, Key, Cpu, Trash2, CheckCircle2 } from "lucide-react";
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from "@/components/ui/popover";
import { toast } from "sonner";

export interface ApiSettings {
    openai?: string;
    gemini?: string;
    claude?: string;
    groq?: string;
    selectedProvider: "openai" | "gemini" | "claude" | "groq";
    selectedModel: string;
}

const DEFAULT_MODELS: Record<string, string[]> = {
    groq: ["qwen-qwq-32b", "llama-3.3-70b-versatile", "llama-3.1-8b-instant", "mixtral-8x7b-32768"],
    openai: ["gpt-4o", "gpt-4o-mini", "gpt-3.5-turbo"],
    gemini: ["gemini-1.5-pro", "gemini-1.5-flash"],
    claude: ["claude-3-5-sonnet-latest", "claude-3-opus-latest", "claude-3-haiku-latest"],
};

interface ApiKeyControlProps {
    theme: {
        accent: string;
        accentRgba: string;
        border: string;
        bg: string;
        headerBg: string;
    };
    onSettingsChange: (settings: ApiSettings) => void;
}

const ApiKeyControl = ({ theme, onSettingsChange }: ApiKeyControlProps) => {
    const [isOpen, setIsOpen] = useState(false);
    const [settings, setSettings] = useState<ApiSettings>(() => {
        const saved = localStorage.getItem("ragents_api_settings");
        return saved ? JSON.parse(saved) : {
            selectedProvider: "groq",
            selectedModel: "llama-3.3-70b-versatile",
        };
    });

    useEffect(() => {
        localStorage.setItem("ragents_api_settings", JSON.stringify(settings));
        onSettingsChange(settings);
    }, [settings, onSettingsChange]);

    const updateSetting = (key: keyof ApiSettings, value: any) => {
        setSettings(prev => ({ ...prev, [key]: value }));
    };

    const clearKeys = () => {
        setSettings({
            selectedProvider: "groq",
            selectedModel: "llama-3.3-70b-versatile",
        });
        toast.success("API keys cleared from local storage");
    };

    return (
        <Popover open={isOpen} onOpenChange={setIsOpen}>
            <PopoverTrigger asChild>
                <button
                    className="flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium transition-all duration-300 hover:scale-105"
                    style={{
                        backgroundColor: `${theme.accentRgba}0.1)`,
                        color: theme.accent,
                        border: `1px solid ${theme.accentRgba}0.2)`,
                    }}
                >
                    <Settings2 size={16} />
                    Control
                    <ChevronDown size={14} style={{ transform: isOpen ? "rotate(180deg)" : "rotate(0)", transition: "transform 0.2s" }} />
                </button>
            </PopoverTrigger>
            <PopoverContent
                className="w-80 p-0 border-none rounded-2xl overflow-hidden shadow-2xl z-50"
                style={{
                    backgroundColor: theme.headerBg,
                    border: `1px solid ${theme.accentRgba}0.2)`
                }}

                align="end"
            >
                <div className="p-4 border-b" style={{ borderColor: "rgba(255,255,255,0.05)" }}>
                    <div className="flex items-center justify-between mb-1">
                        <h3 className="text-sm font-semibold flex items-center gap-2" style={{ color: theme.accent }}>
                            <Key size={14} /> API Configuration
                        </h3>
                        <button
                            onClick={clearKeys}
                            className="p-1.5 rounded-lg hover:bg-white/5 text-white/40 hover:text-red-400 transition-colors"
                            title="Clear all keys"
                        >
                            <Trash2 size={14} />
                        </button>
                    </div>
                    <p className="text-[10px] text-white/40">Keys are stored locally in your browser.</p>
                </div>

                <div className="p-4 space-y-4">
                    {/* Provider Selection */}
                    <div className="space-y-2">
                        <label className="text-[10px] uppercase tracking-wider font-bold text-white/30 px-1">Active Provider</label>
                        <div className="grid grid-cols-2 gap-2">
                            {(["openai", "gemini", "claude", "groq"] as const).map(provider => (
                                <button
                                    key={provider}
                                    onClick={() => {
                                        updateSetting("selectedProvider", provider);
                                        updateSetting("selectedModel", DEFAULT_MODELS[provider][0]);
                                    }}
                                    className={`px-3 py-2 rounded-xl text-xs font-medium transition-all border ${settings.selectedProvider === provider
                                        ? "bg-white/10 text-white"
                                        : "bg-transparent border-white/5 text-white/40 hover:border-white/10"
                                        }`}
                                    style={settings.selectedProvider === provider ? { borderColor: `${theme.accentRgba}0.4)`, color: theme.accent, backgroundColor: `${theme.accentRgba}0.15)` } : {}}

                                >
                                    <span className="capitalize">{provider}</span>
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Key Input */}
                    <div className="space-y-2">
                        <label className="text-[10px] uppercase tracking-wider font-bold text-white/30 px-1">
                            {settings.selectedProvider.toUpperCase()} API Key
                        </label>
                        <div className="relative">
                            <input
                                type="password"
                                name="ragents-api-key"
                                autoComplete="new-password"
                                placeholder={`Enter ${settings.selectedProvider} key...`}
                                value={settings[settings.selectedProvider] || ""}
                                onChange={(e) => updateSetting(settings.selectedProvider, e.target.value)}
                                className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-xs text-white outline-none focus:border-white/20 transition-colors"
                                style={{ borderColor: settings[settings.selectedProvider] ? "rgba(34, 197, 94, 0.3)" : "rgba(255,255,255,0.1)" }}
                            />

                            {settings[settings.selectedProvider] && (
                                <CheckCircle2 size={12} className="absolute right-3 top-2.5 text-green-500" />
                            )}
                        </div>
                    </div>

                    {/* Model Selection */}
                    <div className="space-y-2">
                        <label className="text-[10px] uppercase tracking-wider font-bold text-white/30 px-1">Model Selection</label>
                        <div className="space-y-1">
                            {DEFAULT_MODELS[settings.selectedProvider].map(model => (
                                <button
                                    key={model}
                                    onClick={() => updateSetting("selectedModel", model)}
                                    className={`w-full flex items-center gap-2 px-3 py-2 rounded-lg text-[11px] transition-all ${settings.selectedModel === model
                                        ? "bg-white/10 text-white"
                                        : "text-white/40 hover:bg-white/5 hover:text-white/60"
                                        }`}
                                >
                                    <Cpu size={12} className={settings.selectedModel === model ? "" : "opacity-30"} style={settings.selectedModel === model ? { color: theme.accent } : {}} />

                                    {model}
                                </button>
                            ))}
                        </div>
                    </div>
                </div>

                <div className="p-3 bg-white/5 border-t border-white/5 flex justify-center">
                    <p className="text-[9px] text-white/20 italic">No credentials are saved on our servers.</p>
                </div>
            </PopoverContent>
        </Popover>
    );
};

export default ApiKeyControl;
