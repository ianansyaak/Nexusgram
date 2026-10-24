import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import {
  X,
  BookOpen,
  Volume2,
  VolumeX,
  Copy,
  Check,
  Share2,
  Sparkles,
  ArrowRight,
  Sun,
  Moon,
  AlignLeft,
  ChevronDown,
  Quote,
  Send,
  CornerDownRight,
  CheckCircle2
} from "lucide-react";
import { triggerHaptic } from "../utils/haptics";

interface MessageReaderModalProps {
  isOpen: boolean;
  onClose: () => void;
  rawText: string;
  senderName?: string;
  timestamp?: string;
}

export const MessageReaderModal: React.FC<MessageReaderModalProps> = ({
  isOpen,
  onClose,
  rawText,
  senderName,
  timestamp,
}) => {
  const [fontSize, setFontSize] = useState<number>(() => {
    return parseInt(localStorage.getItem("nexus_reader_font_size") || "16", 10);
  });
  const [readerTheme, setReaderTheme] = useState<"dark" | "sepia" | "oled" | "slate">(() => {
    return (localStorage.getItem("nexus_reader_theme") as any) || "dark";
  });
  const [copiedAll, setCopiedAll] = useState(false);
  const [copiedVariantId, setCopiedVariantId] = useState<string | null>(null);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [speechUtterance, setSpeechUtterance] = useState<SpeechSynthesisUtterance | null>(null);

  useEffect(() => {
    return () => {
      if (typeof window !== "undefined" && window.speechSynthesis) {
        window.speechSynthesis.cancel();
      }
    };
  }, []);

  if (!isOpen) return null;

  const handleFontSizeChange = (delta: number) => {
    triggerHaptic("light");
    const next = Math.min(24, Math.max(13, fontSize + delta));
    setFontSize(next);
    localStorage.setItem("nexus_reader_font_size", next.toString());
  };

  const handleThemeChange = (th: "dark" | "sepia" | "oled" | "slate") => {
    triggerHaptic("light");
    setReaderTheme(th);
    localStorage.setItem("nexus_reader_theme", th);
  };

  const handleCopyAll = async () => {
    triggerHaptic("success");
    try {
      await navigator.clipboard.writeText(rawText);
      setCopiedAll(true);
      setTimeout(() => setCopiedAll(false), 2000);
    } catch (_) {}
  };

  const handleCopySegment = async (segmentText: string, id: string) => {
    triggerHaptic("success");
    try {
      await navigator.clipboard.writeText(segmentText);
      setCopiedVariantId(id);
      setTimeout(() => setCopiedVariantId(null), 2000);
    } catch (_) {}
  };

  const handleInsertToChat = (text: string) => {
    triggerHaptic("medium");
    window.dispatchEvent(
      new CustomEvent("insert-text-to-chat-input", {
        detail: { text },
      })
    );
    onClose();
  };

  const toggleSpeech = () => {
    if (typeof window === "undefined" || !window.speechSynthesis) return;

    if (isSpeaking) {
      window.speechSynthesis.cancel();
      setIsSpeaking(false);
      triggerHaptic("light");
    } else {
      triggerHaptic("medium");
      const utterance = new SpeechSynthesisUtterance(rawText);
      utterance.lang = "ru-RU";
      utterance.rate = 1.0;
      utterance.onend = () => setIsSpeaking(false);
      utterance.onerror = () => setIsSpeaking(false);
      setSpeechUtterance(utterance);
      window.speechSynthesis.speak(utterance);
      setIsSpeaking(true);
    }
  };

  // Color schemes for distraction-free reading
  const themeStyles = {
    dark: "bg-[#13131c]/95 text-gray-200 border-[#222232]",
    oled: "bg-black text-gray-100 border-[#1a1a1a]",
    sepia: "bg-[#fbf0d9] text-[#433422] border-[#e8d7be]",
    slate: "bg-[#1e293b]/95 text-slate-100 border-slate-700/60",
  };

  const cardStyles = {
    dark: "bg-[#1c1c28]/70 border-[#2c2c3e] text-gray-200",
    oled: "bg-[#0d0d0d] border-[#222222] text-gray-100",
    sepia: "bg-[#f4e6cb] border-[#e0cbab] text-[#3c2f1f]",
    slate: "bg-slate-800/80 border-slate-700 text-slate-100",
  };

  const quoteBoxStyles = {
    dark: "bg-indigo-950/20 border-indigo-500/30 text-indigo-100",
    oled: "bg-[#141414] border-gray-700 text-gray-200",
    sepia: "bg-[#ebd9b8] border-[#cbb18a] text-[#2c2010]",
    slate: "bg-blue-950/30 border-blue-500/40 text-blue-100",
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[120] flex items-center justify-center p-3 sm:p-6 bg-black/75 backdrop-blur-md animate-fade-in">
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 15 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 15 }}
          transition={{ duration: 0.2 }}
          className={`w-full max-w-2xl max-h-[90vh] flex flex-col rounded-3xl border shadow-2xl overflow-hidden backdrop-blur-xl ${themeStyles[readerTheme]}`}
        >
          {/* Top Bar */}
          <div className="flex items-center justify-between px-5 py-3.5 border-b border-inherit/40 shrink-0">
            <div className="flex items-center gap-2.5">
              <div className="p-2 rounded-xl bg-indigo-500/15 text-indigo-400">
                <BookOpen className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-sm font-semibold tracking-wide flex items-center gap-1.5">
                  Модный режим чтения
                  <span className="text-[10px] uppercase font-mono px-1.5 py-0.5 rounded-full bg-indigo-500/20 text-indigo-400 border border-indigo-500/30">
                    Focus
                  </span>
                </h3>
                {senderName && (
                  <p className="text-[11px] opacity-60">
                    От {senderName} {timestamp ? `• ${timestamp}` : ""}
                  </p>
                )}
              </div>
            </div>

            <div className="flex items-center gap-1 sm:gap-2">
              {/* Text to Speech */}
              <button
                onClick={toggleSpeech}
                className={`p-2 rounded-full transition-all cursor-pointer ${
                  isSpeaking
                    ? "bg-indigo-600 text-white animate-pulse"
                    : "opacity-75 hover:opacity-100 hover:bg-black/10 dark:hover:bg-white/10"
                }`}
                title={isSpeaking ? "Остановить чтение вслух" : "Озвучить сообщение"}
              >
                {isSpeaking ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
              </button>

              {/* Copy all */}
              <button
                onClick={handleCopyAll}
                className="p-2 rounded-full opacity-75 hover:opacity-100 hover:bg-black/10 dark:hover:bg-white/10 transition-all cursor-pointer relative"
                title="Скопировать всё сообщение"
              >
                {copiedAll ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
              </button>

              {/* Close */}
              <button
                onClick={() => {
                  triggerHaptic("light");
                  onClose();
                }}
                className="p-2 rounded-full opacity-75 hover:opacity-100 hover:bg-black/10 dark:hover:bg-white/10 transition-all cursor-pointer ml-1"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Reader Controls Toolbar */}
          <div className="flex items-center justify-between px-5 py-2 border-b border-inherit/30 bg-black/5 dark:bg-black/20 text-xs shrink-0 flex-wrap gap-2">
            {/* Font size adjustments */}
            <div className="flex items-center gap-1.5">
              <span className="opacity-60 text-[11px] font-mono mr-1">Шрифт:</span>
              <button
                onClick={() => handleFontSizeChange(-1)}
                className="w-7 h-7 rounded-lg bg-black/10 dark:bg-white/10 flex items-center justify-center font-bold hover:bg-black/20 dark:hover:bg-white/20 transition-all cursor-pointer"
                title="Уменьшить шрифт"
              >
                A-
              </button>
              <span className="font-mono text-[11px] w-6 text-center">{fontSize}</span>
              <button
                onClick={() => handleFontSizeChange(1)}
                className="w-7 h-7 rounded-lg bg-black/10 dark:bg-white/10 flex items-center justify-center font-bold hover:bg-black/20 dark:hover:bg-white/20 transition-all cursor-pointer"
                title="Увеличить шрифт"
              >
                A+
              </button>
            </div>

            {/* Themes */}
            <div className="flex items-center gap-1">
              <button
                onClick={() => handleThemeChange("dark")}
                className={`px-2.5 py-1 rounded-lg text-[11px] font-medium transition-all cursor-pointer ${
                  readerTheme === "dark"
                    ? "bg-indigo-600 text-white shadow-sm"
                    : "opacity-60 hover:opacity-100"
                }`}
              >
                Темная
              </button>
              <button
                onClick={() => handleThemeChange("sepia")}
                className={`px-2.5 py-1 rounded-lg text-[11px] font-medium transition-all cursor-pointer ${
                  readerTheme === "sepia"
                    ? "bg-[#6c4e2c] text-white shadow-sm"
                    : "opacity-60 hover:opacity-100"
                }`}
              >
                Сепия
              </button>
              <button
                onClick={() => handleThemeChange("oled")}
                className={`px-2.5 py-1 rounded-lg text-[11px] font-medium transition-all cursor-pointer ${
                  readerTheme === "oled"
                    ? "bg-gray-800 text-white shadow-sm"
                    : "opacity-60 hover:opacity-100"
                }`}
              >
                OLED
              </button>
            </div>
          </div>

          {/* Reader Body Content */}
          <div
            className="flex-1 overflow-y-auto px-5 py-6 space-y-4 select-text"
            style={{ fontSize: `${fontSize}px`, lineHeight: 1.7 }}
          >
            {renderFormattedContent(
              rawText,
              cardStyles[readerTheme],
              quoteBoxStyles[readerTheme],
              handleCopySegment,
              handleInsertToChat,
              copiedVariantId
            )}
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};

// Parser and renderer for smart formatted message
function renderFormattedContent(
  text: string,
  cardClass: string,
  quoteClass: string,
  onCopy: (text: string, id: string) => void,
  onInsert: (text: string) => void,
  copiedId: string | null
) {
  // Split into paragraphs / sections
  const paragraphs = text.split(/\n{2,}/);

  return (
    <div className="space-y-4">
      {paragraphs.map((p, idx) => {
        const trimmed = p.trim();
        if (!trimmed) return null;

        // Check if paragraph is a "Variant" section (e.g. "Вариант 1:", "Вариант 2:")
        const variantMatch = trimmed.match(/^(Вариант\s*\d+[^:\n]*):?\s*(.*)$/is);
        if (variantMatch) {
          const title = variantMatch[1].trim();
          const rest = variantMatch[2].trim();

          // Extract template text in quotes if present «...»
          const quoteMatch = rest.match(/«([^»]+)»/s) || rest.match(/"([^"]+)"/s);
          const templateContent = quoteMatch ? quoteMatch[1].trim() : "";
          const beforeQuote = quoteMatch
            ? rest.substring(0, quoteMatch.index).trim()
            : rest;
          const afterQuote = quoteMatch
            ? rest.substring((quoteMatch.index || 0) + quoteMatch[0].length).trim()
            : "";

          return (
            <div
              key={idx}
              className={`p-4 rounded-2xl border transition-all ${cardClass} shadow-md`}
            >
              {/* Header with Variant Badge & Actions */}
              <div className="flex items-center justify-between mb-3 border-b border-inherit/30 pb-2.5">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="px-2.5 py-0.5 rounded-full bg-gradient-to-r from-blue-600 to-indigo-600 text-white text-xs font-semibold uppercase tracking-wider shadow-sm">
                    {title}
                  </span>
                  {title.includes("Рекомендую") && (
                    <span className="px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 text-[10px] font-bold">
                      ⭐ Рекомендуем
                    </span>
                  )}
                </div>

                <div className="flex items-center gap-1.5">
                  <button
                    onClick={() => onCopy(trimmed, `var-${idx}`)}
                    className="flex items-center gap-1 px-2.5 py-1 rounded-xl text-xs bg-black/10 dark:bg-white/10 hover:bg-black/20 dark:hover:bg-white/20 transition-all cursor-pointer font-medium"
                    title="Скопировать весь вариант"
                  >
                    {copiedId === `var-${idx}` ? (
                      <>
                        <Check className="w-3.5 h-3.5 text-emerald-400" />
                        <span className="text-emerald-400">Скопировано</span>
                      </>
                    ) : (
                      <>
                        <Copy className="w-3.5 h-3.5 opacity-70" />
                        <span>Скопировать</span>
                      </>
                    )}
                  </button>
                </div>
              </div>

              {/* Explanatory Context */}
              {beforeQuote && (
                <div className="opacity-85 mb-3 leading-relaxed">
                  {renderSubText(beforeQuote)}
                </div>
              )}

              {/* Styled Ready-Made Template Quote Box */}
              {templateContent && (
                <div className={`p-4 rounded-xl border relative my-3 ${quoteClass}`}>
                  <div className="flex items-center justify-between text-xs font-semibold mb-2 opacity-80 pb-1.5 border-b border-inherit/30">
                    <span className="flex items-center gap-1.5">
                      <Quote className="w-3.5 h-3.5 text-indigo-400" />
                      Готовый текст для отправки
                    </span>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => onCopy(templateContent, `quote-${idx}`)}
                        className="flex items-center gap-1 px-2 py-0.5 rounded-lg bg-indigo-500/20 hover:bg-indigo-500/30 text-indigo-300 font-medium text-[11px] transition-colors cursor-pointer"
                      >
                        {copiedId === `quote-${idx}` ? (
                          <>
                            <Check className="w-3 h-3 text-emerald-400" />
                            <span>Скопировано!</span>
                          </>
                        ) : (
                          <>
                            <Copy className="w-3 h-3" />
                            <span>Копировать шаблон</span>
                          </>
                        )}
                      </button>
                      <button
                        onClick={() => onInsert(templateContent)}
                        className="flex items-center gap-1 px-2 py-0.5 rounded-lg bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 font-medium text-[11px] transition-colors cursor-pointer"
                        title="Вставить в поле ввода сообщения"
                      >
                        <Send className="w-3 h-3" />
                        <span>Вставить в чат</span>
                      </button>
                    </div>
                  </div>

                  <div className="font-serif italic leading-relaxed text-[1.05em] select-text">
                    «{templateContent}»
                  </div>
                </div>
              )}

              {/* Trailing context if any */}
              {afterQuote && (
                <div className="opacity-80 mt-2 text-sm leading-relaxed">
                  {renderSubText(afterQuote)}
                </div>
              )}
            </div>
          );
        }

        // Check if paragraph is Tips / Recommendations Callout (💡 Советы, 📌 Примечания)
        const isTips = trimmed.startsWith("💡") || trimmed.startsWith("📌") || trimmed.startsWith("⚠️") || trimmed.toLowerCase().includes("советы перед отправкой");
        if (isTips) {
          const lines = trimmed.split("\n");
          const heading = lines[0];
          const restLines = lines.slice(1);

          return (
            <div
              key={idx}
              className="p-4 rounded-2xl border border-amber-500/30 bg-amber-500/10 dark:bg-amber-950/20 shadow-md space-y-2.5"
            >
              <div className="flex items-center justify-between border-b border-amber-500/20 pb-2">
                <h4 className="font-bold text-amber-400 flex items-center gap-2 text-base">
                  <Sparkles className="w-4 h-4 text-amber-400 shrink-0" />
                  {heading}
                </h4>
                <button
                  onClick={() => onCopy(trimmed, `tips-${idx}`)}
                  className="px-2 py-0.5 rounded-lg bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 text-xs flex items-center gap-1 font-medium transition-colors cursor-pointer"
                >
                  {copiedId === `tips-${idx}` ? (
                    <>
                      <Check className="w-3 h-3 text-emerald-400" />
                      <span>Скопировано</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-3 h-3" />
                      <span>Скопировать советы</span>
                    </>
                  )}
                </button>
              </div>

              <div className="space-y-2 pt-1 text-sm leading-relaxed">
                {restLines.map((line, lIdx) => {
                  const lineTrimmed = line.trim();
                  if (!lineTrimmed) return null;

                  // Parse key-value like "Укажи количество: Это самый важный..."
                  const colonIndex = lineTrimmed.indexOf(":");
                  if (colonIndex > 0 && colonIndex < 35) {
                    const label = lineTrimmed.substring(0, colonIndex);
                    const value = lineTrimmed.substring(colonIndex + 1);
                    return (
                      <div key={lIdx} className="flex items-start gap-2">
                        <span className="w-1.5 h-1.5 rounded-full bg-amber-400 mt-2 shrink-0" />
                        <div>
                          <strong className="text-amber-300 font-semibold">{label}:</strong>
                          <span className="opacity-90 ml-1">{value}</span>
                        </div>
                      </div>
                    );
                  }

                  return (
                    <div key={lIdx} className="flex items-start gap-2">
                      <span className="w-1.5 h-1.5 rounded-full bg-amber-400 mt-2 shrink-0" />
                      <span className="opacity-90">{lineTrimmed}</span>
                    </div>
                  );
                })}
              </div>
            </div>
          );
        }

        // Regular paragraph with potential bullets or quotes
        return (
          <div key={idx} className="leading-relaxed opacity-90">
            {renderSubText(trimmed)}
          </div>
        );
      })}
    </div>
  );
}

// Helper to format inline bullets and bold tags
function renderSubText(text: string) {
  const lines = text.split("\n");
  return (
    <div className="space-y-1.5">
      {lines.map((line, lIdx) => {
        const lineTrimmed = line.trim();
        if (!lineTrimmed) return null;

        // Check for bullet like "— Дизайн: ..." or "• ..."
        if (lineTrimmed.startsWith("—") || lineTrimmed.startsWith("-") || lineTrimmed.startsWith("•")) {
          return (
            <div key={lIdx} className="flex items-start gap-2 pl-3">
              <span className="text-indigo-400 font-bold shrink-0">—</span>
              <span>{lineTrimmed.replace(/^[—\-•]\s*/, "")}</span>
            </div>
          );
        }

        // Check for inline highlighted keywords like "Вводные данные:", "Важные условия:"
        const colonIdx = lineTrimmed.indexOf(":");
        if (colonIdx > 0 && colonIdx < 30 && !lineTrimmed.startsWith("http")) {
          const tag = lineTrimmed.substring(0, colonIdx);
          const rest = lineTrimmed.substring(colonIdx + 1);
          return (
            <div key={lIdx} className="mt-1">
              <span className="font-semibold text-indigo-300">{tag}:</span>
              <span className="ml-1">{rest}</span>
            </div>
          );
        }

        return <div key={lIdx}>{lineTrimmed}</div>;
      })}
    </div>
  );
}
