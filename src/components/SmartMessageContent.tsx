import React, { useState, useMemo } from "react";
import Markdown from "react-markdown";
import remarkGfm from "remark-gfm";
import remarkBreaks from "remark-breaks";
import { Prism as SyntaxHighlighter } from "react-syntax-highlighter";
import { vscDarkPlus } from "react-syntax-highlighter/dist/esm/styles/prism";
import {
  BookOpen,
  Volume2,
  VolumeX,
  Copy,
  Check,
  ChevronDown,
  ChevronUp,
  Sparkles,
  Quote,
  Send,
  Sliders,
  AlignLeft,
  FileText
} from "lucide-react";
import { triggerHaptic } from "../utils/haptics";
import { MessageReaderModal } from "./MessageReaderModal";

interface SmartMessageContentProps {
  text: string;
  isUser: boolean;
  senderName?: string;
  timestamp?: string;
  searchQuery?: string;
  highlightText?: (text: string) => React.ReactNode;
}

interface ParsedSection {
  type: "intro" | "variant" | "tips" | "quote" | "standard";
  title?: string;
  badge?: string;
  isRecommended?: boolean;
  content: string;
  templateQuote?: string;
  beforeQuote?: string;
  afterQuote?: string;
  bulletItems?: { label: string; text: string }[];
}

export const SmartMessageContent: React.FC<SmartMessageContentProps> = ({
  text,
  isUser,
  senderName,
  timestamp,
  searchQuery,
  highlightText,
}) => {
  const [isReaderOpen, setIsReaderOpen] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [copiedAll, setCopiedAll] = useState(false);
  const [forceStandardView, setForceStandardView] = useState(false);

  // Check if message qualifies as a structured message (options/variants/tips)
  const structuredData = useMemo(() => {
    if (!text || text.length < 50) return null;

    const hasVariants = /(?:^|\n)(Вариант\s*\d+|Option\s*\d+|Опция\s*\d+)[:\.\s]/i.test(text);
    const hasTips = /(?:^|\n)([💡📌⚠️ℹ️✨]\s*(?:Советы|Совет|Примечание|Важно|Внимание|Рекомендации)[^\n]*)/i.test(text);
    const hasQuotedTemplates = /«[^»]{15,}»/s.test(text);

    if (!hasVariants && !hasTips) {
      return null;
    }

    // Parse text into logical sections
    const rawBlocks = text.split(/\n{2,}/);
    const sections: ParsedSection[] = [];

    for (let i = 0; i < rawBlocks.length; i++) {
      const block = rawBlocks[i].trim();
      if (!block) continue;

      // Variant check
      const variantMatch = block.match(/^(Вариант\s*\d+[^:\n]*):?\s*(.*)$/is);
      if (variantMatch) {
        const title = variantMatch[1].trim();
        const rest = variantMatch[2].trim();
        const isRec = title.toLowerCase().includes("рекомендую") || title.toLowerCase().includes("лучший");

        const quoteMatch = rest.match(/«([^»]+)»/s) || rest.match(/"([^"]{15,})"/s);
        const templateQuote = quoteMatch ? quoteMatch[1].trim() : undefined;
        const beforeQuote = quoteMatch ? rest.substring(0, quoteMatch.index).trim() : rest;
        const afterQuote = quoteMatch ? rest.substring((quoteMatch.index || 0) + quoteMatch[0].length).trim() : undefined;

        sections.push({
          type: "variant",
          title,
          isRecommended: isRec,
          content: rest,
          templateQuote,
          beforeQuote,
          afterQuote,
        });
        continue;
      }

      // Tips / Callouts check
      const isTipsBlock = block.startsWith("💡") || block.startsWith("📌") || block.startsWith("⚠️") || block.toLowerCase().includes("советы перед отправкой");
      if (isTipsBlock) {
        const lines = block.split("\n");
        const heading = lines[0].trim();
        const restLines = lines.slice(1);
        const bullets: { label: string; text: string }[] = [];

        restLines.forEach((l) => {
          const lt = l.trim();
          if (!lt) return;
          const colonIdx = lt.indexOf(":");
          if (colonIdx > 0 && colonIdx < 35) {
            bullets.push({
              label: lt.substring(0, colonIdx).trim(),
              text: lt.substring(colonIdx + 1).trim(),
            });
          } else {
            bullets.push({
              label: "",
              text: lt.replace(/^[—\-•]\s*/, ""),
            });
          }
        });

        sections.push({
          type: "tips",
          title: heading,
          content: block,
          bulletItems: bullets,
        });
        continue;
      }

      // Intro or standard block
      if (sections.length === 0) {
        sections.push({
          type: "intro",
          content: block,
        });
      } else {
        sections.push({
          type: "standard",
          content: block,
        });
      }
    }

    return sections;
  }, [text]);

  const handleCopy = async (str: string, id: string) => {
    triggerHaptic("success");
    try {
      await navigator.clipboard.writeText(str);
      setCopiedId(id);
      setTimeout(() => setCopiedId(null), 2000);
    } catch (_) {}
  };

  const handleCopyAll = async () => {
    triggerHaptic("success");
    try {
      await navigator.clipboard.writeText(text);
      setCopiedAll(true);
      setTimeout(() => setCopiedAll(false), 2000);
    } catch (_) {}
  };

  const handleInsertToChat = (textToInsert: string) => {
    triggerHaptic("medium");
    window.dispatchEvent(
      new CustomEvent("insert-text-to-chat-input", {
        detail: { text: textToInsert },
      })
    );
  };

  const toggleSpeech = () => {
    if (typeof window === "undefined" || !window.speechSynthesis) return;

    if (isSpeaking) {
      window.speechSynthesis.cancel();
      setIsSpeaking(false);
      triggerHaptic("light");
    } else {
      triggerHaptic("medium");
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = "ru-RU";
      utterance.rate = 1.0;
      utterance.onend = () => setIsSpeaking(false);
      utterance.onerror = () => setIsSpeaking(false);
      window.speechSynthesis.speak(utterance);
      setIsSpeaking(true);
    }
  };

  const isLongMessage = text.length > 550;
  const shouldTruncate = isLongMessage && !isExpanded;

  // If text is structured and smart view is active:
  if (structuredData && !forceStandardView) {
    return (
      <div className="w-full space-y-3 font-sans select-text">
        {/* Smart Top Action Toolbar */}
        <div className="flex items-center justify-between pb-2 border-b border-white/10 text-xs">
          <div className="flex items-center gap-2">
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-gradient-to-r from-blue-500/20 to-indigo-500/20 text-blue-300 border border-blue-500/30 text-[11px] font-semibold">
              <Sparkles className="w-3 h-3 text-indigo-400" />
              Модный ридер
            </span>
            <span className="text-[10px] text-gray-400 opacity-80 hidden sm:inline">
              {structuredData.filter((s) => s.type === "variant").length} вариантов текста
            </span>
          </div>

          <div className="flex items-center gap-1">
            {/* Open Full Reader Mode */}
            <button
              onClick={() => {
                triggerHaptic("light");
                setIsReaderOpen(true);
              }}
              className="px-2 py-1 rounded-lg bg-indigo-500/15 hover:bg-indigo-500/30 text-indigo-300 transition-colors flex items-center gap-1 cursor-pointer font-medium text-[11px]"
              title="Открыть в полноэкранном режиме комфортного чтения"
            >
              <BookOpen className="w-3.5 h-3.5" />
              <span>Режим чтения</span>
            </button>

            {/* Read aloud */}
            <button
              onClick={toggleSpeech}
              className={`p-1.5 rounded-lg transition-colors cursor-pointer ${
                isSpeaking
                  ? "bg-indigo-600 text-white animate-pulse"
                  : "bg-black/20 hover:bg-black/40 text-gray-300"
              }`}
              title={isSpeaking ? "Остановить озвучку" : "Озвучить текст голосом"}
            >
              {isSpeaking ? <VolumeX className="w-3.5 h-3.5" /> : <Volume2 className="w-3.5 h-3.5" />}
            </button>

            {/* Copy full */}
            <button
              onClick={handleCopyAll}
              className="p-1.5 rounded-lg bg-black/20 hover:bg-black/40 text-gray-300 transition-colors cursor-pointer"
              title="Скопировать всё"
            >
              {copiedAll ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
            </button>
          </div>
        </div>

        {/* Content Container (Collapsible if long) */}
        <div className={`relative ${shouldTruncate ? "max-h-[380px] overflow-hidden" : ""}`}>
          <div className="space-y-3.5">
            {structuredData.map((sec, idx) => {
              if (sec.type === "intro") {
                return (
                  <div key={idx} className="text-[14.5px] leading-relaxed text-gray-200 opacity-95">
                    {sec.content}
                  </div>
                );
              }

              if (sec.type === "variant") {
                return (
                  <div
                    key={idx}
                    className="p-3.5 rounded-2xl bg-[#181824]/80 border border-[#2b2b3d] shadow-lg relative group transition-all hover:border-indigo-500/40"
                  >
                    {/* Header */}
                    <div className="flex items-center justify-between gap-2 mb-2 pb-2 border-b border-white/5 flex-wrap">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <span className="px-2.5 py-0.5 rounded-full bg-gradient-to-r from-blue-600 to-indigo-600 text-white text-xs font-semibold tracking-wide shadow-sm">
                          {sec.title}
                        </span>
                        {sec.isRecommended && (
                          <span className="px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 text-[10px] font-bold">
                            ⭐ Рекомендуем
                          </span>
                        )}
                      </div>

                      <button
                        onClick={() => handleCopy(sec.content, `var-${idx}`)}
                        className="px-2 py-0.5 rounded-lg text-xs bg-white/5 hover:bg-white/10 text-gray-300 transition-colors flex items-center gap-1 font-medium cursor-pointer"
                        title="Скопировать этот вариант"
                      >
                        {copiedId === `var-${idx}` ? (
                          <>
                            <Check className="w-3 h-3 text-emerald-400" />
                            <span className="text-emerald-400">Скопировано</span>
                          </>
                        ) : (
                          <>
                            <Copy className="w-3 h-3 text-gray-400" />
                            <span>Скопировать</span>
                          </>
                        )}
                      </button>
                    </div>

                    {/* Explanatory intro */}
                    {sec.beforeQuote && (
                      <div className="text-[13.5px] text-gray-300 leading-relaxed mb-2.5">
                        {renderSubLines(sec.beforeQuote)}
                      </div>
                    )}

                    {/* Styled Ready-Made Quote / Template Box */}
                    {sec.templateQuote && (
                      <div className="p-3 rounded-xl bg-indigo-950/25 border border-indigo-500/30 text-indigo-100 my-2 relative">
                        <div className="flex items-center justify-between text-[11px] font-medium text-indigo-300 mb-1.5 pb-1 border-b border-indigo-500/20">
                          <span className="flex items-center gap-1">
                            <Quote className="w-3 h-3 text-indigo-400" />
                            Готовый текст сообщения:
                          </span>

                          <div className="flex items-center gap-1.5">
                            <button
                              onClick={() => handleCopy(sec.templateQuote!, `quote-${idx}`)}
                              className="px-2 py-0.5 rounded bg-indigo-500/20 hover:bg-indigo-500/40 text-indigo-200 transition-colors cursor-pointer flex items-center gap-1 font-semibold text-[10px]"
                            >
                              {copiedId === `quote-${idx}` ? (
                                <>
                                  <Check className="w-2.5 h-2.5 text-emerald-400" />
                                  <span>Скопировано!</span>
                                </>
                              ) : (
                                <>
                                  <Copy className="w-2.5 h-2.5" />
                                  <span>Копировать шаблон</span>
                                </>
                              )}
                            </button>
                            <button
                              onClick={() => handleInsertToChat(sec.templateQuote!)}
                              className="px-2 py-0.5 rounded bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 transition-colors cursor-pointer flex items-center gap-1 font-semibold text-[10px]"
                              title="Вставить этот текст в поле ввода"
                            >
                              <Send className="w-2.5 h-2.5" />
                              <span>Вставить в чат</span>
                            </button>
                          </div>
                        </div>

                        <div className="font-serif italic text-[14px] leading-relaxed select-text text-gray-200">
                          «{sec.templateQuote}»
                        </div>
                      </div>
                    )}

                    {sec.afterQuote && (
                      <div className="text-[13px] text-gray-400 leading-relaxed mt-1.5">
                        {renderSubLines(sec.afterQuote)}
                      </div>
                    )}
                  </div>
                );
              }

              if (sec.type === "tips") {
                return (
                  <div
                    key={idx}
                    className="p-3.5 rounded-2xl bg-amber-500/10 border border-amber-500/30 text-amber-200 shadow-md space-y-2"
                  >
                    <div className="flex items-center justify-between border-b border-amber-500/20 pb-1.5">
                      <h4 className="font-bold text-amber-400 flex items-center gap-1.5 text-sm">
                        <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                        {sec.title}
                      </h4>
                      <button
                        onClick={() => handleCopy(sec.content, `tips-${idx}`)}
                        className="px-2 py-0.5 rounded text-[11px] bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 flex items-center gap-1 font-medium transition-colors cursor-pointer"
                      >
                        {copiedId === `tips-${idx}` ? (
                          <>
                            <Check className="w-3 h-3 text-emerald-400" />
                            <span>Скопировано</span>
                          </>
                        ) : (
                          <>
                            <Copy className="w-3 h-3" />
                            <span>Копировать</span>
                          </>
                        )}
                      </button>
                    </div>

                    <div className="space-y-1.5 text-[13px] leading-relaxed text-amber-100/90 pt-1">
                      {sec.bulletItems?.map((b, bIdx) => (
                        <div key={bIdx} className="flex items-start gap-1.5">
                          <span className="w-1.5 h-1.5 rounded-full bg-amber-400 mt-1.5 shrink-0" />
                          <div>
                            {b.label && <strong className="text-amber-300 font-semibold mr-1">{b.label}:</strong>}
                            <span>{b.text}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                );
              }

              return (
                <div key={idx} className="text-[14px] leading-relaxed text-gray-200">
                  {renderSubLines(sec.content)}
                </div>
              );
            })}
          </div>

          {/* Fade gradient overlay when collapsed */}
          {shouldTruncate && (
            <div className="absolute bottom-0 left-0 right-0 h-24 bg-gradient-to-t from-[#1b1b26] to-transparent pointer-events-none" />
          )}
        </div>

        {/* Expand / Collapse & Reader Mode bar for long messages */}
        {isLongMessage && (
          <div className="flex items-center justify-between pt-1 text-xs">
            <button
              onClick={() => {
                triggerHaptic("light");
                setIsExpanded(!isExpanded);
              }}
              className="flex items-center gap-1 text-indigo-400 hover:text-indigo-300 font-medium py-1 cursor-pointer transition-colors"
            >
              {isExpanded ? (
                <>
                  <ChevronUp className="w-4 h-4" />
                  <span>Свернуть</span>
                </>
              ) : (
                <>
                  <ChevronDown className="w-4 h-4" />
                  <span>Показать полностью</span>
                </>
              )}
            </button>

            <button
              onClick={() => {
                triggerHaptic("light");
                setIsReaderOpen(true);
              }}
              className="flex items-center gap-1 text-gray-400 hover:text-gray-200 py-1 cursor-pointer transition-colors text-[11px]"
            >
              <BookOpen className="w-3.5 h-3.5" />
              <span>Открыть в ридере</span>
            </button>
          </div>
        )}

        {/* Reader Modal */}
        <MessageReaderModal
          isOpen={isReaderOpen}
          onClose={() => setIsReaderOpen(false)}
          rawText={text}
          senderName={senderName}
          timestamp={timestamp}
        />
      </div>
    );
  }

  // Standard Markdown rendering with line-break support (remarkBreaks) and Reader option
  return (
    <div className="space-y-2 select-text">
      {/* If long message, provide top Reader mode pill */}
      {isLongMessage && (
        <div className="flex items-center justify-between pb-1 text-xs border-b border-white/5 opacity-80 hover:opacity-100 transition-opacity">
          <span className="text-[10px] text-gray-400 font-mono">Длинное сообщение</span>
          <div className="flex items-center gap-1.5">
            <button
              onClick={() => {
                triggerHaptic("light");
                setIsReaderOpen(true);
              }}
              className="px-2 py-0.5 rounded-lg bg-indigo-500/15 hover:bg-indigo-500/25 text-indigo-300 text-[10px] font-medium flex items-center gap-1 cursor-pointer"
            >
              <BookOpen className="w-3 h-3" />
              <span>Режим чтения</span>
            </button>
            <button
              onClick={toggleSpeech}
              className={`p-1 rounded-lg transition-colors cursor-pointer ${
                isSpeaking ? "bg-indigo-600 text-white" : "bg-black/20 text-gray-300"
              }`}
              title={isSpeaking ? "Остановить" : "Озвучить"}
            >
              {isSpeaking ? <VolumeX className="w-3 h-3" /> : <Volume2 className="w-3 h-3" />}
            </button>
          </div>
        </div>
      )}

      {searchQuery && highlightText ? (
        <span className="whitespace-pre-wrap">{highlightText(text)}</span>
      ) : (
        <div className="prose prose-invert max-w-none text-[15px] leading-relaxed break-words">
          <Markdown
            remarkPlugins={[remarkGfm, remarkBreaks]}
            components={{
              code({ node, inline, className, children, ...props }: any) {
                const match = /language-(\w+)/.exec(className || "");
                const codeSource = String(children).replace(/\n$/, "");

                if (
                  !inline &&
                  match &&
                  (match[1] === "html" || match[1] === "website" || match[1] === "css" || match[1] === "javascript")
                ) {
                  return (
                    <div className="my-2 rounded-lg border border-[#2a2a38] overflow-hidden bg-white h-64">
                      <iframe
                        sandbox="allow-scripts allow-top-navigation allow-popups"
                        className="w-full h-full border-none text-black"
                        srcDoc={
                          match[1] === "html"
                            ? codeSource
                            : match[1] === "css"
                            ? `<html><head><style>${codeSource}</style></head><body><h1>Rendered CSS</h1><p>The styles have been successfully injected into this embedded document.</p></body></html>`
                            : `<html><body><script>${codeSource}</script><p>JavaScript Executed</p></body></html>`
                        }
                      />
                    </div>
                  );
                }

                return !inline && match ? (
                  <SyntaxHighlighter style={vscDarkPlus as any} language={match[1]} PreTag="div" {...props}>
                    {codeSource}
                  </SyntaxHighlighter>
                ) : (
                  <code className="bg-black/30 rounded px-1 py-0.5 font-mono text-sm" {...props}>
                    {children}
                  </code>
                );
              },
            }}
          >
            {text}
          </Markdown>
        </div>
      )}

      {/* Reader Modal */}
      <MessageReaderModal
        isOpen={isReaderOpen}
        onClose={() => setIsReaderOpen(false)}
        rawText={text}
        senderName={senderName}
        timestamp={timestamp}
      />
    </div>
  );
};

// Helper for rendering sublines with bullets and highlighted labels
function renderSubLines(text: string) {
  const lines = text.split("\n");
  return (
    <div className="space-y-1">
      {lines.map((l, i) => {
        const trimmed = l.trim();
        if (!trimmed) return null;

        if (trimmed.startsWith("—") || trimmed.startsWith("-") || trimmed.startsWith("•")) {
          return (
            <div key={i} className="flex items-start gap-1.5 pl-2">
              <span className="text-indigo-400 font-bold shrink-0">—</span>
              <span>{trimmed.replace(/^[—\-•]\s*/, "")}</span>
            </div>
          );
        }

        const colonIdx = trimmed.indexOf(":");
        if (colonIdx > 0 && colonIdx < 30 && !trimmed.startsWith("http")) {
          const label = trimmed.substring(0, colonIdx);
          const rest = trimmed.substring(colonIdx + 1);
          return (
            <div key={i} className="mt-0.5">
              <span className="font-semibold text-indigo-300">{label}:</span>
              <span className="ml-1">{rest}</span>
            </div>
          );
        }

        return <div key={i}>{trimmed}</div>;
      })}
    </div>
  );
}
