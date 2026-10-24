import { useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import {
  X,
  Bot,
  Key,
  Check,
  Sparkles,
  Sliders,
  ExternalLink,
  ShieldCheck,
  Eye,
  EyeOff,
  RefreshCw,
  Cpu,
} from "lucide-react";
import { triggerHaptic } from "../utils/haptics";

export interface AiSettings {
  provider: "auto" | "gemini" | "openai";
  geminiKey: string;
  geminiModel: string;
  openaiKey: string;
  openaiModel: string;
  systemInstruction: string;
}

export function getStoredAiSettings(): AiSettings {
  try {
    return {
      provider: (localStorage.getItem("nexus_ai_provider") as any) || "auto",
      geminiKey: localStorage.getItem("nexus_ai_gemini_key") || "",
      geminiModel: localStorage.getItem("nexus_ai_gemini_model") || "gemini-2.5-flash",
      openaiKey: localStorage.getItem("nexus_ai_openai_key") || "",
      openaiModel: localStorage.getItem("nexus_ai_openai_model") || "gpt-4o-mini",
      systemInstruction: localStorage.getItem("nexus_ai_system_instruction") || "",
    };
  } catch {
    return {
      provider: "auto",
      geminiKey: "",
      geminiModel: "gemini-2.5-flash",
      openaiKey: "",
      openaiModel: "gpt-4o-mini",
      systemInstruction: "",
    };
  }
}

export function saveStoredAiSettings(settings: AiSettings) {
  try {
    localStorage.setItem("nexus_ai_provider", settings.provider);
    localStorage.setItem("nexus_ai_gemini_key", settings.geminiKey.trim());
    localStorage.setItem("nexus_ai_gemini_model", settings.geminiModel);
    localStorage.setItem("nexus_ai_openai_key", settings.openaiKey.trim());
    localStorage.setItem("nexus_ai_openai_model", settings.openaiModel);
    localStorage.setItem("nexus_ai_system_instruction", settings.systemInstruction);
    window.dispatchEvent(new CustomEvent("nexus-ai-settings-updated", { detail: settings }));
  } catch (e) {
    console.error("Failed to save AI settings", e);
  }
}

interface AiSettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function AiSettingsModal({ isOpen, onClose }: AiSettingsModalProps) {
  const [settings, setSettings] = useState<AiSettings>(getStoredAiSettings);
  const [showGeminiKey, setShowGeminiKey] = useState(false);
  const [showOpenAiKey, setShowOpenAiKey] = useState(false);
  const [testStatus, setTestStatus] = useState<string | null>(null);
  const [isTesting, setIsTesting] = useState(false);
  const [savedSuccess, setSavedSuccess] = useState(false);

  if (!isOpen) return null;

  const handleSave = () => {
    saveStoredAiSettings(settings);
    triggerHaptic("medium");
    setSavedSuccess(true);
    setTimeout(() => {
      setSavedSuccess(false);
      onClose();
    }, 400);
  };

  const handleTestConnection = async () => {
    setIsTesting(true);
    setTestStatus(null);
    try {
      const res = await fetch("/api/ai/test", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-ai-provider": settings.provider,
          "x-gemini-key": settings.geminiKey,
          "x-openai-key": settings.openaiKey,
          "x-ai-model": settings.provider === "openai" ? settings.openaiModel : settings.geminiModel,
        },
        body: JSON.stringify({
          provider: settings.provider,
          geminiKey: settings.geminiKey,
          openaiKey: settings.openaiKey,
          model: settings.provider === "openai" ? settings.openaiModel : settings.geminiModel,
        }),
      });

      const data = await res.json();
      if (res.ok && data.success) {
        setTestStatus("success");
        triggerHaptic("light");
      } else {
        setTestStatus(data.error || "Ошибка подключения");
        triggerHaptic("heavy");
      }
    } catch (e: any) {
      setTestStatus(e.message || "Ошибка сети");
    } finally {
      setIsTesting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center p-3 bg-black/75 backdrop-blur-sm animate-in fade-in duration-200">
      <motion.div
        initial={{ scale: 0.95, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.95, opacity: 0 }}
        className="w-full max-w-lg bg-[#141b24] border border-[#243245] rounded-3xl overflow-hidden shadow-2xl flex flex-col max-h-[90vh]"
      >
        {/* Header */}
        <div className="px-5 py-4 bg-[#18222f] border-b border-[#243245] flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-2xl bg-gradient-to-tr from-purple-500 to-indigo-600 flex items-center justify-center text-white shadow-md">
              <Bot className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                Настройки ИИ Ассистента
              </h3>
              <p className="text-xs text-gray-400">Выберите провайдера или укажите свои API ключи</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-white/5 hover:bg-white/10 text-gray-400 hover:text-white flex items-center justify-center transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-5 space-y-5 custom-scrollbar text-sm">
          {/* Provider Selection */}
          <div className="space-y-2">
            <label className="text-xs font-semibold uppercase tracking-wider text-gray-400 block">
              Провайдер нейросети
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
              {/* Option 1: Auto (Built-in) */}
              <button
                type="button"
                onClick={() => {
                  setSettings((s) => ({ ...s, provider: "auto" }));
                  triggerHaptic("light");
                }}
                className={`p-3 rounded-2xl border text-left flex flex-col justify-between transition-all cursor-pointer ${
                  settings.provider === "auto"
                    ? "bg-[#2481cc]/15 border-[#2481cc] shadow-md text-white"
                    : "bg-[#18222f]/60 border-white/5 text-gray-400 hover:bg-[#18222f] hover:text-gray-200"
                }`}
              >
                <div className="flex items-center justify-between w-full mb-2">
                  <Sparkles className={`w-4 h-4 ${settings.provider === "auto" ? "text-[#2481cc]" : "text-gray-400"}`} />
                  {settings.provider === "auto" && <Check className="w-4 h-4 text-[#2481cc]" />}
                </div>
                <div>
                  <div className="font-semibold text-xs text-white">Автоматически</div>
                  <div className="text-[11px] text-gray-400 mt-0.5">Nexus AI (встроенный)</div>
                </div>
              </button>

              {/* Option 2: Google Gemini */}
              <button
                type="button"
                onClick={() => {
                  setSettings((s) => ({ ...s, provider: "gemini" }));
                  triggerHaptic("light");
                }}
                className={`p-3 rounded-2xl border text-left flex flex-col justify-between transition-all cursor-pointer ${
                  settings.provider === "gemini"
                    ? "bg-purple-500/15 border-purple-500 shadow-md text-white"
                    : "bg-[#18222f]/60 border-white/5 text-gray-400 hover:bg-[#18222f] hover:text-gray-200"
                }`}
              >
                <div className="flex items-center justify-between w-full mb-2">
                  <Cpu className={`w-4 h-4 ${settings.provider === "gemini" ? "text-purple-400" : "text-gray-400"}`} />
                  {settings.provider === "gemini" && <Check className="w-4 h-4 text-purple-400" />}
                </div>
                <div>
                  <div className="font-semibold text-xs text-white">Google Gemini</div>
                  <div className="text-[11px] text-gray-400 mt-0.5">Свой ключ Gemini</div>
                </div>
              </button>

              {/* Option 3: OpenAI ChatGPT */}
              <button
                type="button"
                onClick={() => {
                  setSettings((s) => ({ ...s, provider: "openai" }));
                  triggerHaptic("light");
                }}
                className={`p-3 rounded-2xl border text-left flex flex-col justify-between transition-all cursor-pointer ${
                  settings.provider === "openai"
                    ? "bg-emerald-500/15 border-emerald-500 shadow-md text-white"
                    : "bg-[#18222f]/60 border-white/5 text-gray-400 hover:bg-[#18222f] hover:text-gray-200"
                }`}
              >
                <div className="flex items-center justify-between w-full mb-2">
                  <Bot className={`w-4 h-4 ${settings.provider === "openai" ? "text-emerald-400" : "text-gray-400"}`} />
                  {settings.provider === "openai" && <Check className="w-4 h-4 text-emerald-400" />}
                </div>
                <div>
                  <div className="font-semibold text-xs text-white">ChatGPT (OpenAI)</div>
                  <div className="text-[11px] text-gray-400 mt-0.5">Свой ключ OpenAI</div>
                </div>
              </button>
            </div>
          </div>

          {/* Provider Specific Settings */}
          {settings.provider === "auto" && (
            <div className="p-4 bg-blue-500/10 border border-blue-500/20 rounded-2xl text-xs text-blue-200 space-y-1.5">
              <div className="flex items-center gap-2 font-semibold text-blue-300">
                <ShieldCheck className="w-4 h-4 text-blue-400" />
                Встроенный интеллектуальный режим
              </div>
              <p className="text-gray-300 leading-relaxed">
                Использует серверный Gemini AI по умолчанию. Не требует ввода ключей, работает стабильно и быстро прямо из коробки для генерации ответов, переписывания текста и форматирования сообщений.
              </p>
            </div>
          )}

          {settings.provider === "gemini" && (
            <div className="space-y-4 p-4 bg-[#18222f] border border-purple-500/20 rounded-2xl animate-in fade-in duration-150">
              <div className="flex items-center justify-between">
                <label className="text-xs font-semibold text-purple-300 flex items-center gap-1.5">
                  <Key className="w-3.5 h-3.5" /> API Ключ Google Gemini
                </label>
                <a
                  href="https://aistudio.google.com/app/apikey"
                  target="_blank"
                  rel="noreferrer"
                  className="text-[11px] text-purple-400 hover:text-purple-300 flex items-center gap-1 hover:underline"
                >
                  Получить ключ <ExternalLink className="w-3 h-3" />
                </a>
              </div>

              <div className="relative">
                <input
                  type={showGeminiKey ? "text" : "password"}
                  value={settings.geminiKey}
                  onChange={(e) => setSettings((s) => ({ ...s, geminiKey: e.target.value }))}
                  placeholder="Вставьте ваш Gemini API ключ (AIza...)"
                  className="w-full bg-[#121820] border border-[#2c3b4e] focus:border-purple-500 text-white rounded-xl px-3.5 py-2.5 text-xs focus:outline-none pr-10 font-mono"
                />
                <button
                  type="button"
                  onClick={() => setShowGeminiKey(!showGeminiKey)}
                  className="absolute right-3 top-2.5 text-gray-400 hover:text-gray-200 cursor-pointer"
                >
                  {showGeminiKey ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>

              <div>
                <label className="text-xs font-semibold text-gray-300 block mb-1.5">
                  Модель Gemini
                </label>
                <select
                  value={settings.geminiModel}
                  onChange={(e) => setSettings((s) => ({ ...s, geminiModel: e.target.value }))}
                  className="w-full bg-[#121820] border border-[#2c3b4e] focus:border-purple-500 text-white rounded-xl px-3.5 py-2.5 text-xs focus:outline-none cursor-pointer"
                >
                  <option value="gemini-2.5-flash">Gemini 2.5 Flash (Быстрая, рекомендуемая)</option>
                  <option value="gemini-3.8-flash">Gemini 3.8 Flash (Новейшая)</option>
                  <option value="gemini-3.1-pro-preview">Gemini 3.1 Pro (Максимальный интеллект)</option>
                </select>
              </div>
            </div>
          )}

          {settings.provider === "openai" && (
            <div className="space-y-4 p-4 bg-[#18222f] border border-emerald-500/20 rounded-2xl animate-in fade-in duration-150">
              <div className="flex items-center justify-between">
                <label className="text-xs font-semibold text-emerald-300 flex items-center gap-1.5">
                  <Key className="w-3.5 h-3.5" /> API Ключ OpenAI (ChatGPT)
                </label>
                <a
                  href="https://platform.openai.com/api-keys"
                  target="_blank"
                  rel="noreferrer"
                  className="text-[11px] text-emerald-400 hover:text-emerald-300 flex items-center gap-1 hover:underline"
                >
                  Получить ключ <ExternalLink className="w-3 h-3" />
                </a>
              </div>

              <div className="relative">
                <input
                  type={showOpenAiKey ? "text" : "password"}
                  value={settings.openaiKey}
                  onChange={(e) => setSettings((s) => ({ ...s, openaiKey: e.target.value }))}
                  placeholder="Вставьте ваш OpenAI API ключ (sk-...)"
                  className="w-full bg-[#121820] border border-[#2c3b4e] focus:border-emerald-500 text-white rounded-xl px-3.5 py-2.5 text-xs focus:outline-none pr-10 font-mono"
                />
                <button
                  type="button"
                  onClick={() => setShowOpenAiKey(!showOpenAiKey)}
                  className="absolute right-3 top-2.5 text-gray-400 hover:text-gray-200 cursor-pointer"
                >
                  {showOpenAiKey ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>

              <div>
                <label className="text-xs font-semibold text-gray-300 block mb-1.5">
                  Модель ChatGPT
                </label>
                <select
                  value={settings.openaiModel}
                  onChange={(e) => setSettings((s) => ({ ...s, openaiModel: e.target.value }))}
                  className="w-full bg-[#121820] border border-[#2c3b4e] focus:border-emerald-500 text-white rounded-xl px-3.5 py-2.5 text-xs focus:outline-none cursor-pointer"
                >
                  <option value="gpt-4o-mini">GPT-4o Mini (Быстрая и экономичная)</option>
                  <option value="gpt-4o">GPT-4o (Флагманская модель)</option>
                  <option value="gpt-4-turbo">GPT-4 Turbo</option>
                  <option value="gpt-3.5-turbo">GPT-3.5 Turbo</option>
                </select>
              </div>
            </div>
          )}

          {/* Optional System Instruction */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-gray-400 block flex items-center gap-1.5">
              <Sliders className="w-3.5 h-3.5" /> Дополнительная инструкция (поведение ассистента)
            </label>
            <textarea
              value={settings.systemInstruction}
              onChange={(e) => setSettings((s) => ({ ...s, systemInstruction: e.target.value }))}
              placeholder="Например: Отвечай кратко, всегда форматируй списки, избегай лишних предисловий..."
              className="w-full bg-[#18222f] border border-[#2c3b4e] focus:border-[#2481cc] text-white rounded-xl p-3 text-xs focus:outline-none min-h-[60px] resize-none"
            />
          </div>

          {/* Test Status Banner */}
          {testStatus && (
            <div
              className={`p-3 rounded-xl text-xs flex items-center gap-2 ${
                testStatus === "success"
                  ? "bg-emerald-500/20 text-emerald-300 border border-emerald-500/30"
                  : "bg-rose-500/20 text-rose-300 border border-rose-500/30"
              }`}
            >
              {testStatus === "success" ? (
                <>
                  <Check className="w-4 h-4 text-emerald-400 shrink-0" />
                  <span>Соединение с нейросетью успешно проверено! Ключ валиден.</span>
                </>
              ) : (
                <>
                  <X className="w-4 h-4 text-rose-400 shrink-0" />
                  <span>{testStatus}</span>
                </>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-5 py-3.5 bg-[#18222f] border-t border-[#243245] flex items-center justify-between gap-3">
          <button
            type="button"
            onClick={handleTestConnection}
            disabled={isTesting}
            className="px-3.5 py-2 rounded-xl bg-white/5 hover:bg-white/10 text-gray-300 hover:text-white text-xs font-medium flex items-center gap-2 transition-all cursor-pointer disabled:opacity-50"
          >
            {isTesting ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <RefreshCw className="w-3.5 h-3.5" />}
            <span>Проверить связь</span>
          </button>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl bg-white/5 hover:bg-white/10 text-gray-400 hover:text-white text-xs font-medium transition-all cursor-pointer"
            >
              Отмена
            </button>
            <button
              type="button"
              onClick={handleSave}
              className="px-5 py-2 rounded-xl bg-[#2481cc] hover:bg-[#288ddf] text-white text-xs font-semibold transition-all shadow-md active:scale-95 cursor-pointer flex items-center gap-1.5"
            >
              {savedSuccess ? <Check className="w-4 h-4" /> : null}
              <span>{savedSuccess ? "Сохранено" : "Сохранить"}</span>
            </button>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
