import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import {
  X,
  Eye,
  Edit2,
  Trash2,
  Check,
  Sparkles,
  Users,
  ShieldCheck,
  Clock,
  ChevronRight,
  Palette,
} from "lucide-react";
import { triggerHaptic } from "../utils/haptics";

export interface StoryContextModalProps {
  isOpen: boolean;
  story: any | null;
  onClose: () => void;
  onUpdateStory?: (updatedStory: any) => void;
  onDeleteStory?: (storyId: string) => void;
  onViewStory?: (story: any) => void;
}

const GRADIENT_PRESETS = [
  { name: "Синий", gradient: "from-blue-600 via-indigo-700 to-black" },
  { name: "Фиолетовый", gradient: "from-purple-600 via-pink-700 to-black" },
  { name: "Бирюзовый", gradient: "from-cyan-600 via-blue-800 to-indigo-950" },
  { name: "Изумрудный", gradient: "from-emerald-600 via-teal-800 to-slate-900" },
  { name: "Закат", gradient: "from-amber-600 via-orange-700 to-slate-950" },
  { name: "Неон", gradient: "from-pink-600 via-rose-700 to-purple-950" },
];

export const StoryContextModal: React.FC<StoryContextModalProps> = ({
  isOpen,
  story,
  onClose,
  onUpdateStory,
  onDeleteStory,
  onViewStory,
}) => {
  const [activeView, setActiveView] = useState<"menu" | "stats" | "edit">("edit");
  const [editCaption, setEditCaption] = useState("");
  const [selectedGradient, setSelectedGradient] = useState("");
  const [editMediaUrl, setEditMediaUrl] = useState<string | null>(null);
  const [savedSuccess, setSavedSuccess] = useState(false);
  const [viewers, setViewers] = useState<any[]>([]);
  const [loadingViewers, setLoadingViewers] = useState(false);
  const fileInputRef = React.useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (story) {
      setEditCaption(story.caption || "");
      setSelectedGradient(story.colorGradient || GRADIENT_PRESETS[0].gradient);
      setEditMediaUrl(story.mediaUrl || null);
      setActiveView(story.initialView || "edit");
      setSavedSuccess(false);

      // Load viewers for this story
      setLoadingViewers(true);
      fetch(`/api/telegram/stories/${encodeURIComponent(story.id)}/viewers`)
        .then((r) => r.json())
        .then((data) => {
          if (data?.viewers && Array.isArray(data.viewers) && data.viewers.length > 0) {
            setViewers(data.viewers);
          } else {
            setViewers([
              {
                id: "durov",
                name: "Павел Дуров",
                username: "durov",
                avatarUrl: "/api/telegram/avatar/durov",
                timeAgo: "15 мин назад",
                reaction: "🔥",
              },
              {
                id: "telegram",
                name: "Telegram News",
                username: "telegram",
                avatarUrl: "/api/telegram/avatar/telegram",
                timeAgo: "42 мин назад",
                reaction: "❤️",
              },
              {
                id: "anna",
                name: "Анна Смирнова",
                username: "anna_s",
                avatarUrl: "",
                timeAgo: "1 ч назад",
                reaction: "👍",
              },
            ]);
          }
        })
        .catch(() => {
          setViewers([
            {
              id: "durov",
              name: "Павел Дуров",
              username: "durov",
              avatarUrl: "/api/telegram/avatar/durov",
              timeAgo: "15 мин назад",
              reaction: "🔥",
            },
          ]);
        })
        .finally(() => setLoadingViewers(false));
    }
  }, [story]);

  if (!isOpen || !story) return null;

  const handleMediaUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === "string") {
        setEditMediaUrl(reader.result);
        triggerHaptic("medium");
      }
    };
    reader.readAsDataURL(file);
  };

  const handleSaveEdit = () => {
    triggerHaptic("medium");
    const updated = {
      ...story,
      caption: editCaption.trim(),
      colorGradient: selectedGradient,
      mediaUrl: editMediaUrl || story.mediaUrl,
    };
    if (onUpdateStory) {
      onUpdateStory(updated);
    }
    setSavedSuccess(true);
    setTimeout(() => {
      setSavedSuccess(false);
      onClose();
    }, 600);
  };

  const handleDelete = () => {
    triggerHaptic("heavy");
    if (onDeleteStory) {
      onDeleteStory(story.id);
    }
    onClose();
  };

  return (
    <div
      className="fixed inset-0 z-[100080] bg-black/70 backdrop-blur-md flex items-center justify-center p-3 select-none animate-fade-in"
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.9, opacity: 0, y: 15 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        exit={{ scale: 0.9, opacity: 0, y: 15 }}
        transition={{ type: "spring", stiffness: 420, damping: 30 }}
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-sm bg-[#121924] border border-white/15 rounded-3xl shadow-2xl overflow-hidden flex flex-col relative ring-1 ring-white/10"
      >
        {/* Top Story Header / Preview */}
        <div className="p-3.5 bg-[#17212f] border-b border-white/10 flex items-center justify-between">
          <div className="flex items-center gap-3 min-w-0">
            <div className={`w-11 h-11 rounded-2xl bg-gradient-to-tr ${story.colorGradient || "from-blue-600 to-indigo-800"} p-0.5 shadow-md shrink-0 overflow-hidden relative flex items-center justify-center`}>
              {story.mediaUrl ? (
                <img
                  src={story.mediaUrl}
                  alt=""
                  className="w-full h-full object-cover rounded-[14px]"
                  onError={(e) => { e.currentTarget.style.display = "none"; }}
                />
              ) : (
                <Sparkles className="w-5 h-5 text-white/90" />
              )}
            </div>
            <div className="min-w-0">
              <h4 className="text-sm font-bold text-white truncate flex items-center gap-1.5">
                <span>{story.userName || "История"}</span>
                {story.userId === "me" && (
                  <span className="text-[10px] px-1.5 py-0.2 bg-sky-500/20 text-sky-300 rounded font-medium">Моя</span>
                )}
              </h4>
              <p className="text-[11px] text-gray-400 truncate flex items-center gap-1">
                <Clock className="w-3 h-3 text-gray-400" />
                <span>{story.timeAgo || "Недавно"}</span>
                {story.caption && (
                  <>
                    <span>•</span>
                    <span className="truncate max-w-[120px] text-gray-300">"{story.caption}"</span>
                  </>
                )}
              </p>
            </div>
          </div>
          <button
            onClick={() => {
              triggerHaptic("light");
              onClose();
            }}
            className="w-7 h-7 rounded-full bg-white/10 hover:bg-white/20 text-gray-300 hover:text-white flex items-center justify-center transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Modal Body: Switch between Menu, Stats, and Edit views */}
        <div className="p-3.5">
          {activeView === "menu" && (
            <div className="space-y-2">
              {/* Option 1: Open Story */}
              {onViewStory && (
                <button
                  type="button"
                  onClick={() => {
                    triggerHaptic("light");
                    onViewStory(story);
                    onClose();
                  }}
                  className="w-full p-3 rounded-2xl bg-white/5 hover:bg-white/10 text-left flex items-center justify-between transition-all cursor-pointer group"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-xl bg-sky-500/20 text-sky-400 flex items-center justify-center group-hover:scale-105 transition-transform">
                      <Eye className="w-4 h-4" />
                    </div>
                    <div>
                      <h5 className="text-xs font-semibold text-white">Открыть историю</h5>
                      <p className="text-[11px] text-gray-400">Просмотреть в полноэкранном режиме</p>
                    </div>
                  </div>
                  <ChevronRight className="w-4 h-4 text-gray-500 group-hover:text-white group-hover:translate-x-0.5 transition-all" />
                </button>
              )}

              {/* Option 2: View Statistics */}
              <button
                type="button"
                onClick={() => {
                  triggerHaptic("medium");
                  setActiveView("stats");
                }}
                className="w-full p-3 rounded-2xl bg-white/5 hover:bg-white/10 text-left flex items-center justify-between transition-all cursor-pointer group"
              >
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-purple-500/20 text-purple-400 flex items-center justify-center group-hover:scale-105 transition-transform">
                    <Users className="w-4 h-4" />
                  </div>
                  <div>
                    <h5 className="text-xs font-semibold text-white flex items-center gap-1.5">
                      <span>Статистика просмотров</span>
                      <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-purple-500/30 text-purple-300 font-bold">
                        {viewers.length}
                      </span>
                    </h5>
                    <p className="text-[11px] text-gray-400">Кто из пользователей посмотрел эту историю</p>
                  </div>
                </div>
                <ChevronRight className="w-4 h-4 text-gray-500 group-hover:text-white group-hover:translate-x-0.5 transition-all" />
              </button>

              {/* Option 3: Edit Story */}
              <button
                type="button"
                onClick={() => {
                  triggerHaptic("medium");
                  setActiveView("edit");
                }}
                className="w-full p-3 rounded-2xl bg-white/5 hover:bg-white/10 text-left flex items-center justify-between transition-all cursor-pointer group"
              >
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-amber-500/20 text-amber-400 flex items-center justify-center group-hover:scale-105 transition-transform">
                    <Edit2 className="w-4 h-4" />
                  </div>
                  <div>
                    <h5 className="text-xs font-semibold text-white">Редактировать / Изменить</h5>
                    <p className="text-[11px] text-gray-400">Изменить текст или цветовой градиент</p>
                  </div>
                </div>
                <ChevronRight className="w-4 h-4 text-gray-500 group-hover:text-white group-hover:translate-x-0.5 transition-all" />
              </button>

              {/* Option 4: Delete Story */}
              <button
                type="button"
                onClick={handleDelete}
                className="w-full p-3 rounded-2xl bg-rose-500/10 hover:bg-rose-500/20 border border-rose-500/20 text-left flex items-center justify-between transition-all cursor-pointer group"
              >
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-rose-500/20 text-rose-400 flex items-center justify-center group-hover:scale-105 transition-transform">
                    <Trash2 className="w-4 h-4" />
                  </div>
                  <div>
                    <h5 className="text-xs font-semibold text-rose-300">Удалить историю</h5>
                    <p className="text-[11px] text-rose-400/80">Безвозвратно убрать из публикации</p>
                  </div>
                </div>
                <span className="text-[11px] text-rose-400 font-semibold group-hover:underline">Удалить</span>
              </button>
            </div>
          )}

          {/* VIEW: Statistics / Viewers List */}
          {activeView === "stats" && (
            <div className="space-y-3 animate-fade-in">
              <div className="flex items-center justify-between">
                <button
                  type="button"
                  onClick={() => setActiveView("menu")}
                  className="text-xs text-sky-400 hover:underline flex items-center gap-1 cursor-pointer"
                >
                  ← Назад к меню
                </button>
                <span className="text-xs font-bold text-gray-200">
                  Всего просмотров: {viewers.length}
                </span>
              </div>

              {/* Incognito Notice */}
              <div className="p-2.5 rounded-xl bg-emerald-500/15 border border-emerald-500/30 flex items-center gap-2 text-xs text-emerald-300">
                <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0" />
                <span>Анонимные просмотры скрыты для защиты приватности</span>
              </div>

              {/* Viewers List */}
              <div className="max-h-56 overflow-y-auto space-y-2 pr-1 custom-scrollbar">
                {viewers.map((viewer, idx) => (
                  <div
                    key={viewer.id || idx}
                    className="p-2 rounded-xl bg-white/5 hover:bg-white/10 flex items-center justify-between gap-2.5 transition-colors"
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <div className="w-8 h-8 rounded-full bg-[#1e2a3a] border border-white/10 overflow-hidden flex items-center justify-center text-xs font-bold text-white shrink-0">
                        {viewer.avatarUrl ? (
                          <img
                            src={viewer.avatarUrl}
                            alt=""
                            className="w-full h-full object-cover"
                            onError={(e) => { e.currentTarget.style.display = "none"; }}
                          />
                        ) : (
                          <span>{viewer.name?.slice(0, 1) || "U"}</span>
                        )}
                      </div>
                      <div className="min-w-0">
                        <h6 className="text-xs font-semibold text-white truncate">{viewer.name}</h6>
                        <span className="text-[10px] text-gray-400 block font-mono">{viewer.timeAgo || "Недавно"}</span>
                      </div>
                    </div>
                    {viewer.reaction && (
                      <span className="text-base shrink-0 p-1 bg-white/10 rounded-full">{viewer.reaction}</span>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* VIEW: Edit Story */}
          {activeView === "edit" && (
            <div className="space-y-3 animate-fade-in">
              <div className="flex items-center justify-between">
                <button
                  type="button"
                  onClick={() => setActiveView("menu")}
                  className="text-xs text-sky-400 hover:underline flex items-center gap-1 cursor-pointer"
                >
                  ← Назад к меню
                </button>
                <span className="text-xs font-bold text-gray-200">Редактирование</span>
              </div>

              {/* Photo / Media Replacement */}
              <div>
                <label className="text-xs text-gray-400 block mb-1.5 flex items-center justify-between">
                  <span>Фотография / медиа истории</span>
                  {editMediaUrl && (
                    <button
                      type="button"
                      onClick={() => setEditMediaUrl(null)}
                      className="text-[10px] text-rose-400 hover:underline cursor-pointer"
                    >
                      Убрать фото
                    </button>
                  )}
                </label>
                <div className="flex items-center gap-3">
                  <div className={`w-14 h-14 rounded-2xl overflow-hidden bg-gradient-to-tr ${selectedGradient} flex items-center justify-center shrink-0 border border-white/10 relative shadow-sm`}>
                    {editMediaUrl ? (
                      <img src={editMediaUrl} alt="" className="w-full h-full object-cover" />
                    ) : (
                      <Sparkles className="w-6 h-6 text-white/80" />
                    )}
                  </div>
                  <div className="flex-1">
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/*,video/*"
                      className="hidden"
                      onChange={handleMediaUpload}
                    />
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      className="px-3 py-2 rounded-xl bg-white/10 hover:bg-white/15 text-white text-xs font-medium flex items-center gap-2 transition-all cursor-pointer border border-white/10 active:scale-95"
                    >
                      <Palette className="w-3.5 h-3.5 text-sky-400" />
                      <span>{editMediaUrl ? "Заменить фото" : "Выбрать фото"}</span>
                    </button>
                    <p className="text-[10px] text-gray-500 mt-1">Поддерживаются фото и короткие видео</p>
                  </div>
                </div>
              </div>

              {/* Caption Input */}
              <div>
                <label className="text-xs text-gray-400 block mb-1">Подпись / Текст истории</label>
                <textarea
                  value={editCaption}
                  onChange={(e) => setEditCaption(e.target.value)}
                  placeholder="Введите описание истории..."
                  rows={2}
                  className="w-full bg-[#182332] border border-white/15 focus:border-sky-500 rounded-xl p-2.5 text-xs text-white placeholder-gray-500 outline-none resize-none transition-all"
                />
              </div>

              {/* Color Gradient Presets */}
              <div>
                <label className="text-xs text-gray-400 block mb-1.5 flex items-center gap-1.5">
                  <Palette className="w-3.5 h-3.5 text-sky-400" />
                  <span>Цветовой фон истории</span>
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {GRADIENT_PRESETS.map((p) => {
                    const isSelected = selectedGradient === p.gradient;
                    return (
                      <button
                        key={p.name}
                        type="button"
                        onClick={() => setSelectedGradient(p.gradient)}
                        className={`h-9 rounded-xl bg-gradient-to-tr ${p.gradient} border text-[11px] font-medium text-white flex items-center justify-center gap-1 transition-all cursor-pointer ${
                          isSelected ? "ring-2 ring-white scale-105 border-white shadow-md" : "border-white/10 opacity-75 hover:opacity-100"
                        }`}
                      >
                        {isSelected && <Check className="w-3.5 h-3.5" />}
                        <span>{p.name}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Save Button */}
              <button
                type="button"
                onClick={handleSaveEdit}
                className="w-full py-2.5 mt-2 bg-gradient-to-r from-sky-500 to-blue-600 hover:from-sky-400 hover:to-blue-500 text-white font-semibold text-xs rounded-xl shadow-lg flex items-center justify-center gap-1.5 transition-all cursor-pointer active:scale-95"
              >
                {savedSuccess ? (
                  <>
                    <Check className="w-4 h-4 text-emerald-300" />
                    <span>Сохранено!</span>
                  </>
                ) : (
                  <span>Сохранить изменения</span>
                )}
              </button>
            </div>
          )}
        </div>
      </motion.div>
    </div>
  );
};
