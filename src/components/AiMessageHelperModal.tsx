import React, { useState, useEffect } from "react";
import { motion } from "motion/react";
import {
  X,
  Sparkles,
  Bot,
  Send,
  ArrowDownToLine,
  RefreshCw,
  Settings,
  Check,
  Cpu,
  Wand2,
  Copy,
  Edit2,
  ArrowRight,
} from "lucide-react";
import { triggerHaptic } from "../utils/haptics";
import { getStoredAiSettings, AiSettings } from "./AiSettingsModal";

interface AiMessageHelperModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialText: string;
  chatName: string;
  onSendMessage: (text: string) => Promise<void> | void;
  onApplyToInput: (text: string) => void;
  onOpenSettings: () => void;
}

interface StylePreset {
  id: string;
  name: string;
  desc: string;
  icon: string;
}

const STYLE_PRESETS: StylePreset[] = [
  {
    id: "fix_improve",
    name: "Исправить и улучшить",
    desc: "Исправит опечатки, пунктуацию и сделает текст красивым и связным",
    icon: "✍️",
  },
  {
    id: "business",
    name: "Деловой и вежливый",
    desc: "Профессиональный тон для деловой переписки и коллег",
    icon: "💼",
  },
  {
    id: "friendly",
    name: "Дружелюбный с эмодзи",
    desc: "Теплый, приятный тон с подходящими эмодзи",
    icon: "🤝",
  },
  {
    id: "answer_query",
    name: "Ответить на запрос (ИИ)",
    desc: "Использовать текст как вопрос или задачу и дать развернутый ответ",
    icon: "🤖",
  },
  {
    id: "summarize",
    name: "Кратко (Выжимка сути)",
    desc: "Сжать текст до самого главного без лишних слов",
    icon: "⚡️",
  },
  {
    id: "expand",
    name: "Развернуть подробно",
    desc: "Превратить краткую мысль в полноценное детальное сообщение",
    icon: "📝",
  },
  {
    id: "translate_en",
    name: "Перевести на английский",
    desc: "Качественный перевод с сохранением смысла и интонации",
    icon: "🇬🇧",
  },
  {
    id: "humor",
    name: "Остроумно / Юмор",
    desc: "Легкий юмор и харизма в ответе",
    icon: "🎭",
  },
];

export function AiMessageHelperModal({
  isOpen,
  onClose,
  initialText,
  chatName,
  onSendMessage,
  onApplyToInput,
  onOpenSettings,
}: AiMessageHelperModalProps) {
  const [promptText, setPromptText] = useState(initialText);
  const [selectedStyle, setSelectedStyle] = useState<string>("fix_improve");
  const [customInstruction, setCustomInstruction] = useState("");
  const [resultText, setResultText] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const [copied, setCopied] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const [aiSettings, setAiSettings] = useState<AiSettings>(getStoredAiSettings);

  useEffect(() => {
    if (isOpen) {
      setPromptText(initialText);
      setResultText("");
      setErrorMsg("");
      setAiSettings(getStoredAiSettings());
      // Auto-trigger generation with the first preset
      generateAiResponse(initialText, "fix_improve", "");
    }
  }, [isOpen, initialText]);

  if (!isOpen) return null;

  const generateAiResponse = async (textToProcess: string, styleId: string, customInst: string) => {
    if (!textToProcess.trim()) return;
    setIsGenerating(true);
    setErrorMsg("");
    triggerHaptic("medium");

    const settings = getStoredAiSettings();

    try {
      const res = await fetch("/api/ai/assist", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-ai-provider": settings.provider,
          "x-gemini-key": settings.geminiKey,
          "x-openai-key": settings.openaiKey,
          "x-ai-model": settings.provider === "openai" ? settings.openaiModel : settings.geminiModel,
        },
        body: JSON.stringify({
          prompt: textToProcess,
          style: styleId,
          customInstruction: customInst,
          chatName,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Не удалось сгенерировать ответ");
      }

      setResultText(data.result || "");
      triggerHaptic("light");
    } catch (err: any) {
      console.error("AI Assist error:", err);
      setErrorMsg(err.message || "Ошибка генерации. Проверьте настройки ИИ.");
      triggerHaptic("heavy");
    } finally {
      setIsGenerating(false);
    }
  };

  const handleSelectStyle = (styleId: string) => {
    setSelectedStyle(styleId);
    generateAiResponse(promptText, styleId, customInstruction);
  };

  const handleSend = async () => {
    if (!resultText.trim() || isSending) return;
    setIsSending(true);
    triggerHaptic("medium");
    try {
      await onSendMessage(resultText.trim());
      onClose();
    } catch (e) {
      console.error("Failed to send message", e);
    } finally {
      setIsSending(false);
    }
  };

  const handleApply = () => {
    triggerHaptic("light");
    onApplyToInput(resultText);
    onClose();
  };

  const handleCopy = () => {
    if (!resultText) return;
    navigator.clipboard.writeText(resultText);
    setCopied(true);
    triggerHaptic("light");
    setTimeout(() => setCopied(false), 1500);
  };

  const getProviderLabel = () => {
    if (aiSettings.provider === "openai") return `ChatGPT (${aiSettings.openaiModel})`;
    if (aiSettings.provider === "gemini") return `Gemini (${aiSettings.geminiModel})`;
    return "Nexus AI (Встроенный)";
  };

  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center p-3 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
      <motion.div
        initial={{ scale: 0.95, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.95, opacity: 0 }}
        className="w-full max-w-xl bg-[#141b24] border border-[#26374a] rounded-3xl overflow-hidden shadow-2xl flex flex-col max-h-[92vh]"
      >
        {/* Header */}
        <div className="px-5 py-3.5 bg-[#182332] border-b border-[#26374a] flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-purple-600 to-indigo-600 flex items-center justify-center text-white shadow-md">
              <Sparkles className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                Нейросеть Ассистент
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-purple-500/20 text-purple-300 border border-purple-500/30 font-medium">
                  {getProviderLabel()}
                </span>
              </h3>
              <p className="text-[11px] text-gray-400">Помощь в составлении и редактировании текста</p>
            </div>
          </div>

          <div className="flex items-center gap-1.5">
            <button
              onClick={() => {
                triggerHaptic("light");
                onOpenSettings();
              }}
              className="p-2 rounded-xl bg-white/5 hover:bg-white/10 text-gray-300 hover:text-white transition-colors cursor-pointer flex items-center gap-1 text-xs"
              title="Настройки провайдера и API ключей"
            >
              <Settings className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Настройки</span>
            </button>

            <button
              onClick={onClose}
              className="w-8 h-8 rounded-xl bg-white/5 hover:bg-white/10 text-gray-400 hover:text-white flex items-center justify-center transition-colors cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Scrollable Content */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4 custom-scrollbar text-xs">
          {/* User's Original Prompt / Draft */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between text-gray-400">
              <span className="font-semibold uppercase tracking-wider text-[10px]">Исходный текст / Запрос:</span>
              <span className="text-[11px] text-gray-500">{promptText.length} символов</span>
            </div>
            <textarea
              value={promptText}
              onChange={(e) => setPromptText(e.target.value)}
              placeholder="Введите текст или запрос для нейросети..."
              className="w-full bg-[#101720] border border-[#223142] focus:border-purple-500 text-gray-200 rounded-xl p-3 focus:outline-none min-h-[64px] resize-none leading-relaxed font-sans"
              rows={2}
            />
          </div>

          {/* Style & Intent Presets Grid */}
          <div className="space-y-1.5">
            <span className="font-semibold uppercase tracking-wider text-[10px] text-gray-400 block">
              Выберите стиль обработки:
            </span>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {STYLE_PRESETS.map((preset) => {
                const isActive = selectedStyle === preset.id;
                return (
                  <button
                    key={preset.id}
                    type="button"
                    onClick={() => handleSelectStyle(preset.id)}
                    className={`p-2.5 rounded-xl border text-left flex flex-col justify-between transition-all cursor-pointer ${
                      isActive
                        ? "bg-gradient-to-br from-purple-600/20 to-indigo-600/20 border-purple-500 text-purple-200 shadow-sm"
                        : "bg-[#101720] border-white/5 text-gray-400 hover:bg-[#151f2c] hover:text-gray-200"
                    }`}
                  >
                    <div className="text-base mb-1">{preset.icon}</div>
                    <div className="font-semibold text-xs leading-tight text-white">{preset.name}</div>
                    <div className="text-[10px] text-gray-400 line-clamp-2 mt-1 leading-snug">{preset.desc}</div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Custom Instruction (Optional) */}
          <div className="flex items-center gap-2">
            <input
              type="text"
              value={customInstruction}
              onChange={(e) => setCustomInstruction(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  generateAiResponse(promptText, selectedStyle, customInstruction);
                }
              }}
              placeholder="Свое пожелание (например: ответь тезисно, добавь смайл)..."
              className="flex-1 bg-[#101720] border border-[#223142] focus:border-purple-500 text-gray-200 rounded-xl px-3 py-2 text-xs focus:outline-none"
            />
            <button
              type="button"
              onClick={() => generateAiResponse(promptText, selectedStyle, customInstruction)}
              disabled={isGenerating || !promptText.trim()}
              className="px-3 py-2 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-medium text-xs flex items-center gap-1.5 transition-all cursor-pointer disabled:opacity-50"
            >
              {isGenerating ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Wand2 className="w-3.5 h-3.5" />}
              <span>Сгенерировать</span>
            </button>
          </div>

          {/* AI Output Result Box */}
          <div className="space-y-1.5 pt-1">
            <div className="flex items-center justify-between text-gray-400">
              <span className="font-semibold uppercase tracking-wider text-[10px] flex items-center gap-1.5 text-purple-300">
                <Sparkles className="w-3.5 h-3.5" /> Результат нейросети (можно отредактировать):
              </span>
              {resultText && (
                <button
                  type="button"
                  onClick={handleCopy}
                  className="text-[11px] text-gray-400 hover:text-white flex items-center gap-1 cursor-pointer"
                >
                  {copied ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                  <span>{copied ? "Скопировано" : "Копировать"}</span>
                </button>
              )}
            </div>

            {isGenerating ? (
              <div className="p-8 rounded-2xl bg-[#101720] border border-purple-500/30 flex flex-col items-center justify-center gap-3 text-gray-400">
                <RefreshCw className="w-6 h-6 animate-spin text-purple-400" />
                <span className="text-xs text-purple-300 font-medium animate-pulse">
                  Нейросеть генерирует идеальный ответ...
                </span>
              </div>
            ) : errorMsg ? (
              <div className="p-4 rounded-2xl bg-rose-500/10 border border-rose-500/30 text-rose-300 space-y-2">
                <p className="text-xs font-medium">{errorMsg}</p>
                <button
                  onClick={onOpenSettings}
                  className="px-3 py-1 bg-rose-500/20 hover:bg-rose-500/30 text-white rounded-lg text-[11px] font-medium transition-all"
                >
                  Открыть настройки ИИ и проверить ключ
                </button>
              </div>
            ) : (
              <textarea
                value={resultText}
                onChange={(e) => setResultText(e.target.value)}
                placeholder="Здесь появится готовый текст от нейросети..."
                className="w-full bg-[#101720] border border-purple-500/30 focus:border-purple-400 text-gray-100 rounded-2xl p-3.5 text-xs focus:outline-none min-h-[140px] resize-none leading-relaxed font-sans shadow-inner"
                rows={6}
              />
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="px-5 py-3 bg-[#182332] border-t border-[#26374a] flex items-center justify-between gap-3">
          <button
            type="button"
            onClick={() => generateAiResponse(promptText, selectedStyle, customInstruction)}
            disabled={isGenerating || !promptText.trim()}
            className="px-3 py-2 rounded-xl bg-white/5 hover:bg-white/10 text-gray-300 hover:text-white text-xs font-medium flex items-center gap-1.5 transition-all cursor-pointer disabled:opacity-50"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isGenerating ? "animate-spin" : ""}`} />
            <span>Другой вариант</span>
          </button>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleApply}
              disabled={!resultText.trim() || isGenerating}
              className="px-4 py-2 rounded-xl bg-white/5 hover:bg-white/10 text-gray-300 hover:text-white text-xs font-medium flex items-center gap-1.5 transition-all cursor-pointer disabled:opacity-50"
              title="Вставить сгенерированный текст в поле чата"
            >
              <ArrowDownToLine className="w-3.5 h-3.5 text-purple-400" />
              <span>Вставить в поле</span>
            </button>

            <button
              type="button"
              onClick={handleSend}
              disabled={!resultText.trim() || isGenerating || isSending}
              className="px-5 py-2 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white text-xs font-semibold transition-all shadow-md active:scale-95 cursor-pointer disabled:opacity-50 flex items-center gap-1.5"
            >
              <Send className="w-3.5 h-3.5" />
              <span>{isSending ? "Отправка..." : "Отправить"}</span>
            </button>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
