import React, { useState, useRef, useEffect } from "react";
import { motion } from "motion/react";
import {
  X,
  Bold,
  Italic,
  Strikethrough,
  Code,
  EyeOff,
  Quote,
  Table,
  BarChart2,
  Image,
  Link,
  List,
  ListOrdered,
  Send,
  ArrowDownToLine,
  Eye,
  Edit3,
  Sparkles,
  Smile,
  Check,
} from "lucide-react";
import { triggerHaptic } from "../utils/haptics";

interface RichMessageModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialText: string;
  chatName: string;
  onSendMessage: (formattedText: string) => Promise<void> | void;
  onApplyToInput: (formattedText: string) => void;
}

export function RichMessageModal({
  isOpen,
  onClose,
  initialText,
  chatName,
  onSendMessage,
  onApplyToInput,
}: RichMessageModalProps) {
  const [content, setContent] = useState(initialText);
  const [activeTab, setActiveTab] = useState<"editor" | "preview">("editor");
  const [isSending, setIsSending] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (isOpen) {
      setContent(initialText);
      setActiveTab("editor");
    }
  }, [isOpen, initialText]);

  if (!isOpen) return null;

  // Insert helper to wrap or insert text around current selection
  const insertFormatting = (prefix: string, suffix: string = prefix, defaultPlaceholder = "текст") => {
    triggerHaptic("light");
    const textarea = textareaRef.current;
    if (!textarea) {
      setContent((prev) => prev + prefix + defaultPlaceholder + suffix);
      return;
    }

    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const current = textarea.value;
    const selectedText = current.substring(start, end) || defaultPlaceholder;

    const before = current.substring(0, start);
    const after = current.substring(end);

    const replacement = `${prefix}${selectedText}${suffix}`;
    const nextText = `${before}${replacement}${after}`;
    setContent(nextText);

    setTimeout(() => {
      textarea.focus();
      const newCursorPos = start + prefix.length + selectedText.length;
      textarea.setSelectionRange(newCursorPos, newCursorPos);
    }, 10);
  };

  const insertTable = () => {
    triggerHaptic("medium");
    const tableTemplate = `\n| Колонка 1 | Колонка 2 | Колонка 3 |\n| :--- | :---: | ---: |\n| Данные A | Значение B | 100 |\n| Данные C | Значение D | 250 |\n`;
    insertFormatting("", "", tableTemplate);
  };

  const insertPoll = () => {
    triggerHaptic("medium");
    const pollTemplate = `\n📊 Опрос: Какой вариант выберем?\n▫️ 1. Вариант первый\n▫️ 2. Вариант второй\n▫️ 3. Свой вариант в комментариях\n`;
    insertFormatting("", "", pollTemplate);
  };

  const insertInlineButton = () => {
    triggerHaptic("light");
    insertFormatting("[🔘 Перейти на сайт](", ")", "https://example.com");
  };

  const insertImage = () => {
    triggerHaptic("light");
    insertFormatting("![🖼️ Изображение](", ")", "https://picsum.photos/600/400");
  };

  const handleSend = async () => {
    if (!content.trim() || isSending) return;
    setIsSending(true);
    triggerHaptic("medium");
    try {
      await onSendMessage(content.trim());
      onClose();
    } catch (e) {
      console.error("Failed to send formatted message", e);
    } finally {
      setIsSending(false);
    }
  };

  const handleApply = () => {
    triggerHaptic("light");
    onApplyToInput(content);
    onClose();
  };

  // Quick markdown preview parser for preview tab
  const renderPreview = (text: string) => {
    if (!text.trim()) {
      return <p className="text-gray-500 italic text-center py-8">Пустое сообщение</p>;
    }

    const lines = text.split("\n");
    return (
      <div className="space-y-1.5 text-[14px] leading-relaxed break-words">
        {lines.map((line, idx) => {
          if (line.startsWith("|") && line.endsWith("|")) {
            return (
              <pre key={idx} className="bg-black/30 p-1.5 rounded text-xs font-mono overflow-x-auto text-blue-200">
                {line}
              </pre>
            );
          }
          if (line.startsWith("> ")) {
            return (
              <blockquote key={idx} className="border-l-2 border-blue-400 pl-2 text-gray-300 italic my-1">
                {line.slice(2)}
              </blockquote>
            );
          }
          return (
            <div key={idx} className="min-h-[1.2em]">
              {line}
            </div>
          );
        })}
      </div>
    );
  };

  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center p-3 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
      <motion.div
        initial={{ scale: 0.95, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.95, opacity: 0 }}
        className="w-full max-w-xl bg-[#141c26] border border-[#26374a] rounded-3xl overflow-hidden shadow-2xl flex flex-col max-h-[90vh]"
      >
        {/* Header */}
        <div className="px-5 py-3.5 bg-[#182332] border-b border-[#26374a] flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-blue-500/20 border border-blue-500/30 flex items-center justify-center text-blue-400">
              <Edit3 className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                Форматирование сообщения
              </h3>
              <p className="text-[11px] text-gray-400">Получатель: {chatName}</p>
            </div>
          </div>

          <div className="flex items-center gap-1 bg-[#101720] p-1 rounded-xl border border-white/5">
            <button
              onClick={() => {
                triggerHaptic("light");
                setActiveTab("editor");
              }}
              className={`px-3 py-1 rounded-lg text-xs font-medium transition-all cursor-pointer ${
                activeTab === "editor" ? "bg-[#2481cc] text-white shadow-sm" : "text-gray-400 hover:text-white"
              }`}
            >
              Редактор
            </button>
            <button
              onClick={() => {
                triggerHaptic("light");
                setActiveTab("preview");
              }}
              className={`px-3 py-1 rounded-lg text-xs font-medium transition-all cursor-pointer flex items-center gap-1 ${
                activeTab === "preview" ? "bg-[#2481cc] text-white shadow-sm" : "text-gray-400 hover:text-white"
              }`}
            >
              <Eye className="w-3.5 h-3.5" />
              Предпросмотр
            </button>
            <button
              onClick={onClose}
              className="ml-1 w-7 h-7 rounded-lg hover:bg-white/10 text-gray-400 hover:text-white flex items-center justify-center transition-colors cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Toolbar (Editor Mode) */}
        {activeTab === "editor" && (
          <div className="px-4 py-2 bg-[#121922] border-b border-[#26374a] flex items-center gap-1 overflow-x-auto custom-scrollbar select-none">
            {/* Bold */}
            <button
              type="button"
              onClick={() => insertFormatting("**", "**", "жирный")}
              className="p-2 rounded-lg bg-white/5 hover:bg-white/10 text-gray-300 hover:text-white cursor-pointer transition-colors"
              title="Жирный шрифт (**текст**)"
            >
              <Bold className="w-4 h-4" />
            </button>

            {/* Italic */}
            <button
              type="button"
              onClick={() => insertFormatting("*", "*", "курсив")}
              className="p-2 rounded-lg bg-white/5 hover:bg-white/10 text-gray-300 hover:text-white cursor-pointer transition-colors"
              title="Курсив (*текст*)"
            >
              <Italic className="w-4 h-4" />
            </button>

            {/* Strikethrough */}
            <button
              type="button"
              onClick={() => insertFormatting("~~", "~~", "зачеркнутый")}
              className="p-2 rounded-lg bg-white/5 hover:bg-white/10 text-gray-300 hover:text-white cursor-pointer transition-colors"
              title="Зачеркнутый (~~текст~~)"
            >
              <Strikethrough className="w-4 h-4" />
            </button>

            {/* Code */}
            <button
              type="button"
              onClick={() => insertFormatting("`", "`", "код")}
              className="p-2 rounded-lg bg-white/5 hover:bg-white/10 text-gray-300 hover:text-white cursor-pointer transition-colors font-mono text-xs"
              title="Моноширинный (`код`)"
            >
              <Code className="w-4 h-4" />
            </button>

            {/* Spoiler */}
            <button
              type="button"
              onClick={() => insertFormatting("||", "||", "скрытый спойлер")}
              className="p-2 rounded-lg bg-white/5 hover:bg-white/10 text-purple-300 hover:text-purple-200 cursor-pointer transition-colors"
              title="Спойлер (||скрытый текст||)"
            >
              <EyeOff className="w-4 h-4" />
            </button>

            {/* Quote */}
            <button
              type="button"
              onClick={() => insertFormatting("\n> ", "\n", "цитата")}
              className="p-2 rounded-lg bg-white/5 hover:bg-white/10 text-gray-300 hover:text-white cursor-pointer transition-colors"
              title="Цитата (> текст)"
            >
              <Quote className="w-4 h-4" />
            </button>

            <div className="w-px h-5 bg-white/10 mx-1" />

            {/* Table */}
            <button
              type="button"
              onClick={insertTable}
              className="px-2.5 py-1.5 rounded-lg bg-indigo-500/15 hover:bg-indigo-500/25 border border-indigo-500/30 text-indigo-300 text-xs flex items-center gap-1.5 cursor-pointer font-medium"
              title="Вставить таблицу"
            >
              <Table className="w-3.5 h-3.5" />
              <span>Таблица</span>
            </button>

            {/* Poll */}
            <button
              type="button"
              onClick={insertPoll}
              className="px-2.5 py-1.5 rounded-lg bg-amber-500/15 hover:bg-amber-500/25 border border-amber-500/30 text-amber-300 text-xs flex items-center gap-1.5 cursor-pointer font-medium"
              title="Вставить опрос"
            >
              <BarChart2 className="w-3.5 h-3.5" />
              <span>Опрос</span>
            </button>

            {/* Inline Button */}
            <button
              type="button"
              onClick={insertInlineButton}
              className="px-2.5 py-1.5 rounded-lg bg-emerald-500/15 hover:bg-emerald-500/25 border border-emerald-500/30 text-emerald-300 text-xs flex items-center gap-1.5 cursor-pointer font-medium"
              title="Вставить кнопку со ссылкой"
            >
              <Link className="w-3.5 h-3.5" />
              <span>Кнопка</span>
            </button>

            {/* Image */}
            <button
              type="button"
              onClick={insertImage}
              className="px-2.5 py-1.5 rounded-lg bg-pink-500/15 hover:bg-pink-500/25 border border-pink-500/30 text-pink-300 text-xs flex items-center gap-1.5 cursor-pointer font-medium"
              title="Вставить картинку"
            >
              <Image className="w-3.5 h-3.5" />
              <span>Картинка</span>
            </button>

            {/* Lists */}
            <button
              type="button"
              onClick={() => insertFormatting("\n• ", "", "пункт списка")}
              className="p-2 rounded-lg bg-white/5 hover:bg-white/10 text-gray-300 hover:text-white cursor-pointer transition-colors"
              title="Маркированный список"
            >
              <List className="w-4 h-4" />
            </button>
            <button
              type="button"
              onClick={() => insertFormatting("\n1. ", "", "первый пункт")}
              className="p-2 rounded-lg bg-white/5 hover:bg-white/10 text-gray-300 hover:text-white cursor-pointer transition-colors"
              title="Нумерованный список"
            >
              <ListOrdered className="w-4 h-4" />
            </button>
          </div>
        )}

        {/* Body Area */}
        <div className="flex-1 p-4 overflow-y-auto custom-scrollbar flex flex-col min-h-[260px]">
          {activeTab === "editor" ? (
            <textarea
              ref={textareaRef}
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="Введите текст сообщения... Используйте кнопки в панели выше для добавления таблиц, опросов, кнопок, картинок и стилей оформления..."
              className="w-full flex-1 bg-[#101720] border border-[#223142] focus:border-[#2481cc] text-gray-100 rounded-2xl p-4 text-sm focus:outline-none resize-none leading-relaxed font-sans"
              rows={10}
              autoFocus
            />
          ) : (
            <div className="flex-1 bg-[#101720] border border-[#223142] rounded-2xl p-4 overflow-y-auto">
              <div className="max-w-md mx-auto bg-[#182533] p-4 rounded-2xl border border-white/5 shadow-md">
                <div className="text-[11px] font-semibold text-blue-400 mb-1 flex items-center justify-between">
                  <span>Nexusgram Formatted Message</span>
                  <span className="text-gray-400 font-normal">Сейчас</span>
                </div>
                {renderPreview(content)}
              </div>
            </div>
          )}
        </div>

        {/* Footer with Actions */}
        <div className="px-5 py-3.5 bg-[#182332] border-t border-[#26374a] flex items-center justify-between gap-3">
          <div className="text-xs text-gray-400">
            Символов: <span className="font-mono text-gray-200">{content.length}</span>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleApply}
              className="px-4 py-2 rounded-xl bg-white/5 hover:bg-white/10 text-gray-300 hover:text-white text-xs font-medium flex items-center gap-1.5 transition-all cursor-pointer"
              title="Перенести оформленный текст в поле ввода"
            >
              <ArrowDownToLine className="w-3.5 h-3.5 text-blue-400" />
              <span>Вставить в поле</span>
            </button>

            <button
              type="button"
              onClick={handleSend}
              disabled={!content.trim() || isSending}
              className="px-5 py-2 rounded-xl bg-[#2481cc] hover:bg-[#288ddf] text-white text-xs font-semibold transition-all shadow-md active:scale-95 cursor-pointer disabled:opacity-50 flex items-center gap-1.5"
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
