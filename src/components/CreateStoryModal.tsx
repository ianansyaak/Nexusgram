import React, { useState, useRef } from "react";
import { motion, AnimatePresence } from "motion/react";
import { 
  X, 
  Upload, 
  Sparkles, 
  Send, 
  Eye, 
  Globe, 
  Lock, 
  ShieldCheck, 
  Radio, 
  Palette,
  Image as ImageIcon,
  Check
} from "lucide-react";
import { triggerHaptic } from "../utils/haptics";

export interface CreatedStoryData {
  id: string;
  mediaUrl?: string;
  isVideo?: boolean;
  caption: string;
  colorGradient: string;
  mode: "all" | "local" | "telegram_api" | "stealth";
}

interface CreateStoryModalProps {
  isOpen: boolean;
  onClose: () => void;
  onPublish: (story: CreatedStoryData) => void;
}

const GRADIENT_PRESETS = [
  { id: "cosmic", label: "Космос", gradient: "from-blue-600 via-indigo-700 to-black" },
  { id: "neon", label: "Неон", gradient: "from-pink-600 via-purple-700 to-slate-950" },
  { id: "sunset", label: "Закат", gradient: "from-amber-500 via-rose-600 to-indigo-950" },
  { id: "emerald", label: "Изумруд", gradient: "from-emerald-600 via-teal-800 to-slate-900" },
  { id: "stealth", label: "Стелс", gradient: "from-zinc-800 via-zinc-900 to-black" },
  { id: "cyan", label: "Лазурь", gradient: "from-cyan-600 via-blue-800 to-indigo-950" },
];

export const CreateStoryModal: React.FC<CreateStoryModalProps> = ({
  isOpen,
  onClose,
  onPublish,
}) => {
  const [caption, setCaption] = useState("");
  const [selectedGradient, setSelectedGradient] = useState(GRADIENT_PRESETS[0].gradient);
  const [mediaFile, setMediaFile] = useState<File | null>(null);
  const [mediaPreviewUrl, setMediaPreviewUrl] = useState<string | null>(null);
  const [isVideo, setIsVideo] = useState(false);
  const [publishMode, setPublishMode] = useState<"all" | "local" | "telegram_api" | "stealth">("all");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!isOpen) return null;

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    triggerHaptic("light");
    setMediaFile(file);
    setIsVideo(file.type.startsWith("video/"));
    const url = URL.createObjectURL(file);
    setMediaPreviewUrl(url);
  };

  const handleRemoveMedia = () => {
    triggerHaptic("light");
    setMediaFile(null);
    setMediaPreviewUrl(null);
    setIsVideo(false);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!caption.trim() && !mediaPreviewUrl) return;

    triggerHaptic("medium");
    setIsSubmitting(true);

    try {
      let finalMediaUrl = mediaPreviewUrl || undefined;

      // If Telegram API mode and file exists, upload to Telegram
      if (publishMode === "telegram_api" && mediaFile) {
        try {
          const fd = new FormData();
          fd.append("files", mediaFile);
          fd.append("chatId", "me");
          fd.append("caption", caption);
          await fetch("/api/telegram/upload", { method: "POST", body: fd });
        } catch (e) {
          console.error("Telegram API story upload error:", e);
        }
      }

      const newStory: CreatedStoryData = {
        id: `story_custom_${Date.now()}`,
        mediaUrl: finalMediaUrl,
        isVideo,
        caption: caption.trim(),
        colorGradient: selectedGradient,
        mode: publishMode,
      };

      onPublish(newStory);
      onClose();
    } catch (err) {
      console.error(err);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[100060] flex items-center justify-center bg-black/85 backdrop-blur-md p-4 animate-fade-in select-none">
      <div 
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-md bg-[#0e1621] border border-[#1e2c3e] rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[92vh]"
      >
        {/* Header */}
        <div className="px-5 py-4 border-b border-[#1e2c3e] flex items-center justify-between bg-[#131d2b]">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-2xl bg-indigo-500/20 text-indigo-400 border border-indigo-500/30 flex items-center justify-center">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white leading-tight">Создать историю</h2>
              <p className="text-[11px] text-gray-400">Поделитесь моментом с контактами</p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => {
              triggerHaptic("light");
              onClose();
            }}
            className="w-8 h-8 rounded-full bg-white/5 hover:bg-white/10 text-gray-400 hover:text-white flex items-center justify-center transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Scrollable body */}
        <form onSubmit={handleSubmit} className="p-5 overflow-y-auto space-y-5 flex-1 custom-scrollbar">
          {/* Visual Canvas Preview */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold text-gray-300">Предпросмотр истории</label>
              {mediaPreviewUrl && (
                <button
                  type="button"
                  onClick={handleRemoveMedia}
                  className="text-xs text-rose-400 hover:text-rose-300 transition-colors cursor-pointer"
                >
                  Удалить медиа
                </button>
              )}
            </div>

            <div
              className={`w-full h-56 rounded-2xl bg-gradient-to-b ${selectedGradient} relative overflow-hidden flex flex-col justify-end p-4 border border-white/15 shadow-inner`}
            >
              {mediaPreviewUrl ? (
                isVideo ? (
                  <video
                    src={mediaPreviewUrl}
                    autoPlay
                    loop
                    muted
                    playsInline
                    className="absolute inset-0 w-full h-full object-cover"
                  />
                ) : (
                  <img
                    src={mediaPreviewUrl}
                    alt="Preview"
                    className="absolute inset-0 w-full h-full object-cover"
                  />
                )
              ) : null}

              {/* Readability shadow overlay */}
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-black/20 pointer-events-none" />

              <div className="relative z-10 space-y-1">
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-white/20 text-white font-medium backdrop-blur-md inline-block">
                  {publishMode === "all" && "🌍 Всем"}
                  {publishMode === "local" && "🔒 Лично себе"}
                  {publishMode === "telegram_api" && "✈️ Telegram API"}
                  {publishMode === "stealth" && "🛡️ Поверхностно (E2EE)"}
                </span>
                <p className="text-white font-bold text-sm sm:text-base leading-snug line-clamp-3 drop-shadow">
                  {caption.trim() || "Ваш текст истории..."}
                </p>
              </div>
            </div>
          </div>

          {/* Media upload button */}
          <div className="flex items-center gap-2">
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*,video/*"
              className="hidden"
              onChange={handleFileSelect}
            />
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="flex-1 py-2.5 px-3 rounded-xl bg-[#152332] hover:bg-[#1c2e42] border border-[#23354a] text-xs font-semibold text-gray-200 flex items-center justify-center gap-2 transition-all cursor-pointer"
            >
              <ImageIcon className="w-4 h-4 text-sky-400" />
              <span>{mediaFile ? "Заменить фото/видео" : "Прикрепить фото или видео"}</span>
            </button>
          </div>

          {/* Gradient picker (when no photo or for backdrop) */}
          <div className="space-y-2">
            <label className="text-xs font-bold text-gray-300 flex items-center gap-1.5">
              <Palette className="w-3.5 h-3.5 text-indigo-400" />
              <span>Цветовая гамма фона</span>
            </label>
            <div className="grid grid-cols-6 gap-2">
              {GRADIENT_PRESETS.map((preset) => (
                <button
                  key={preset.id}
                  type="button"
                  onClick={() => {
                    triggerHaptic("light");
                    setSelectedGradient(preset.gradient);
                  }}
                  className={`h-9 rounded-xl bg-gradient-to-tr ${preset.gradient} border transition-transform cursor-pointer relative ${
                    selectedGradient === preset.gradient
                      ? "scale-105 border-white ring-2 ring-indigo-500/50"
                      : "border-white/10 hover:scale-102"
                  }`}
                  title={preset.label}
                >
                  {selectedGradient === preset.gradient && (
                    <Check className="w-3.5 h-3.5 text-white absolute inset-0 m-auto stroke-[3]" />
                  )}
                </button>
              ))}
            </div>
          </div>

          {/* Caption text */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-gray-300">Подпись к истории</label>
            <textarea
              value={caption}
              onChange={(e) => setCaption(e.target.value)}
              placeholder="Расскажите о чем эта история..."
              rows={3}
              maxLength={280}
              className="w-full bg-[#121c27] border border-[#213346] rounded-2xl p-3 text-xs text-white placeholder-gray-500 outline-none focus:border-indigo-500 resize-none transition-colors"
            />
            <div className="flex justify-end text-[10px] text-gray-500 font-mono">
              {caption.length}/280
            </div>
          </div>

          {/* Publication Mode selector (User brief specific requirement) */}
          <div className="space-y-2">
            <label className="text-xs font-bold text-gray-300 flex items-center gap-1.5">
              <Radio className="w-3.5 h-3.5 text-indigo-400" />
              <span>Как опубликовать историю:</span>
            </label>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {[
                {
                  id: "all" as const,
                  title: "Всем",
                  desc: "Видна всем контактам в списке историй",
                  icon: Globe,
                  color: "text-blue-400",
                },
                {
                  id: "local" as const,
                  title: "Лично себе локально",
                  desc: "Сохраняется только на вашем устройстве",
                  icon: Lock,
                  color: "text-amber-400",
                },
                {
                  id: "telegram_api" as const,
                  title: "Через API Telegram",
                  desc: "Публикация в официальный Telegram профиль",
                  icon: Send,
                  color: "text-sky-400",
                },
                {
                  id: "stealth" as const,
                  title: "Поверхностно (E2EE)",
                  desc: "Шифрование как в секретном чате",
                  icon: ShieldCheck,
                  color: "text-emerald-400",
                },
              ].map((opt) => {
                const Icon = opt.icon;
                const isSelected = publishMode === opt.id;
                return (
                  <div
                    key={opt.id}
                    onClick={() => {
                      triggerHaptic("light");
                      setPublishMode(opt.id);
                    }}
                    className={`p-3 rounded-2xl border transition-all cursor-pointer flex items-start gap-2.5 ${
                      isSelected
                        ? "bg-[#182637] border-indigo-500 shadow-md ring-1 ring-indigo-500/30"
                        : "bg-[#121c27] border-[#1e2d3e] hover:bg-[#152332]"
                    }`}
                  >
                    <div className={`p-1.5 rounded-xl bg-black/30 ${opt.color} shrink-0 mt-0.5`}>
                      <Icon className="w-4 h-4" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-white">{opt.title}</span>
                        {isSelected && <Check className="w-3.5 h-3.5 text-indigo-400 stroke-[3]" />}
                      </div>
                      <p className="text-[10px] text-gray-400 leading-tight mt-0.5">{opt.desc}</p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Footer Submit Button */}
          <div className="pt-2">
            <button
              type="submit"
              disabled={isSubmitting || (!caption.trim() && !mediaPreviewUrl)}
              className="w-full py-3 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 disabled:opacity-40 text-white font-bold text-xs rounded-2xl transition-all shadow-lg flex items-center justify-center gap-2 cursor-pointer active:scale-[0.99]"
            >
              <Send className="w-4 h-4" />
              <span>{isSubmitting ? "Публикация..." : "Опубликовать историю"}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
