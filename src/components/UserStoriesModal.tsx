import React, { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "motion/react";
import { X, ChevronLeft, ChevronRight, Eye, EyeOff, Sparkles, CheckCircle2, Send, Heart, Trash2, Users, MoreVertical } from "lucide-react";
import { triggerHaptic } from "../utils/haptics";
import { StoryContextModal } from "./StoryContextModal";

export interface UserStory {
  id: string;
  userId: string;
  userName: string;
  userAvatar?: string;
  timeAgo: string;
  mediaUrl?: string;
  isVideo?: boolean;
  caption: string;
  colorGradient: string;
  hasViewed?: boolean;
}

export const SAMPLE_STORIES: UserStory[] = [
  {
    id: "story-1",
    userId: "durov",
    userName: "Павел Дуров",
    userAvatar: "/api/telegram/avatar/durov",
    timeAgo: "2 ч назад",
    caption: "Nexusgram работает быстрее света. Новая эра кастомизации мессенджеров 🚀",
    colorGradient: "from-blue-600 via-indigo-700 to-black",
  },
  {
    id: "story-2",
    userId: "telegram",
    userName: "Telegram News",
    userAvatar: "/api/telegram/avatar/telegram",
    timeAgo: "4 ч назад",
    caption: "Обновление: поддержка кастомных разделов, плавные жесты и режим инкогнито!",
    colorGradient: "from-cyan-600 via-blue-800 to-indigo-950",
  },
  {
    id: "story-3",
    userId: "nexus_team",
    userName: "Nexus Architecture",
    userAvatar: "",
    timeAgo: "6 ч назад",
    caption: "iOS Liquid Glass + Android Punch Hole Cutout. Идеальная физика капли ✨",
    colorGradient: "from-purple-600 via-pink-700 to-black",
  },
  {
    id: "story-4",
    userId: "designer",
    userName: "UX Lab",
    userAvatar: "",
    timeAgo: "8 ч назад",
    caption: "Анонимный просмотр историй без отметок в статистике автора теперь доступен в один клик 👁️",
    colorGradient: "from-emerald-600 via-teal-800 to-slate-900",
  },
];

interface UserStoriesModalProps {
  initialStoryIndex?: number;
  stories?: UserStory[];
  onClose: () => void;
  onOpenChat?: (chatId: string, chatName: string) => void;
}

export const UserStoriesModal: React.FC<UserStoriesModalProps> = ({
  initialStoryIndex = 0,
  stories: passedStories,
  onClose,
  onOpenChat,
}) => {
  const [storiesList, setStoriesList] = useState<UserStory[]>(() => {
    if (passedStories && passedStories.length > 0) return passedStories;
    return [];
  });
  const [currentIndex, setCurrentIndex] = useState(initialStoryIndex);
  const [progress, setProgress] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const [isAnonymous, setIsAnonymous] = useState<boolean>(() => {
    return localStorage.getItem("nexus_anonymous_stories") !== "false";
  });
  const [replyText, setReplyText] = useState("");
  const [sentToast, setSentToast] = useState(false);
  const [showViewersModal, setShowViewersModal] = useState(false);
  const [viewersList, setViewersList] = useState<any[]>([]);
  const [loadingViewers, setLoadingViewers] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [showStoryContextModal, setShowStoryContextModal] = useState(false);
  const storyCanvasHoldTimerRef = useRef<number | null>(null);

  const currentStory = storiesList[currentIndex] || storiesList[0];
  const isOwnStory = Boolean(currentStory && (currentStory.userId === "me" || (currentStory as any).isOwn || currentStory.userName === "Моя история"));

  // Mark active story as read / viewed
  useEffect(() => {
    if (!currentStory) return;
    try {
      const read = JSON.parse(localStorage.getItem("nexus_read_stories") || "[]");
      const idsToAdd = [String(currentStory.id), String(currentStory.userId)].filter(Boolean);
      let changed = false;
      idsToAdd.forEach((id) => {
        if (!read.includes(id)) {
          read.push(id);
          changed = true;
        }
      });
      if (changed) {
        localStorage.setItem("nexus_read_stories", JSON.stringify(read));
        window.dispatchEvent(new CustomEvent("nexus-story-viewed", { detail: { storyId: currentStory.id, userId: currentStory.userId } }));
      }
    } catch {}
  }, [currentIndex, currentStory]);

  const fetchViewers = async (storyId: string) => {
    setLoadingViewers(true);
    try {
      const res = await fetch(`/api/telegram/stories/${encodeURIComponent(storyId)}/viewers`);
      const data = await res.json();
      if (data?.viewers) {
        setViewersList(data.viewers);
      }
    } catch (e) {
      console.warn("Failed to load viewers:", e);
    } finally {
      setLoadingViewers(false);
    }
  };

  const handleDeleteStory = async () => {
    if (!currentStory) return;
    triggerHaptic("heavy");
    const storyId = currentStory.id;
    try {
      await fetch(`/api/telegram/stories/${encodeURIComponent(storyId)}`, { method: "DELETE" });
    } catch {}

    try {
      const saved = JSON.parse(localStorage.getItem("nexus_my_stories") || "[]");
      const updated = saved.filter((s: any) => s.id !== storyId);
      localStorage.setItem("nexus_my_stories", JSON.stringify(updated));
    } catch {}

    window.dispatchEvent(new CustomEvent("story-deleted", { detail: { id: storyId } }));
    window.dispatchEvent(new CustomEvent("dialog-update", {}));

    const nextList = storiesList.filter((s) => s.id !== storyId);
    setStoriesList(nextList);
    setShowDeleteConfirm(false);
    setIsPaused(false);
    if (nextList.length === 0) {
      onClose();
    } else if (currentIndex >= nextList.length) {
      setCurrentIndex(nextList.length - 1);
      setProgress(0);
    } else {
      setProgress(0);
    }
  };

  const handleSendReply = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!replyText.trim()) return;
    triggerHaptic("medium");
    try {
      if (currentStory.userId) {
        await fetch(`/api/telegram/messages/${encodeURIComponent(currentStory.userId)}`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ message: `[Ответ на историю]: ${replyText}` }),
        });
      }
    } catch {}
    setReplyText("");
    setSentToast(true);
    setTimeout(() => setSentToast(false), 2000);
  };

  const handleQuickReaction = async (emoji: string) => {
    triggerHaptic("light");
    try {
      if (currentStory.userId) {
        await fetch(`/api/telegram/messages/${encodeURIComponent(currentStory.userId)}`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ message: `[Реакция на историю]: ${emoji}` }),
        });
      }
    } catch {}
    setSentToast(true);
    setTimeout(() => setSentToast(false), 2000);
  };

  useEffect(() => {
    if (passedStories && passedStories.length > 0) {
      setStoriesList(passedStories);
      return;
    }
    fetch("/api/telegram/stories")
      .then((r) => r.json())
      .then((data) => {
        if (data?.stories && data.stories.length > 0) {
          setStoriesList(data.stories);
        }
      })
      .catch(() => {});
  }, [passedStories]);

  const timerRef = useRef<number | null>(null);

  // Auto-advance timer
  useEffect(() => {
    setProgress(0);
    if (isPaused) return;

    const interval = 50; // ms
    const duration = 5000; // 5 seconds per story
    const step = (interval / duration) * 100;

    timerRef.current = window.setInterval(() => {
      setProgress((prev) => {
        if (prev >= 100) {
          if (currentIndex < storiesList.length - 1) {
            setCurrentIndex((c) => c + 1);
            return 0;
          } else {
            onClose();
            return 100;
          }
        }
        return prev + step;
      });
    }, interval);

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [currentIndex, isPaused, onClose, storiesList.length]);

  const toggleAnonymous = (e: React.MouseEvent) => {
    e.stopPropagation();
    triggerHaptic("medium");
    const next = !isAnonymous;
    setIsAnonymous(next);
    localStorage.setItem("nexus_anonymous_stories", String(next));
    if (next) {
      fetch("/api/telegram/stories/stealth", { method: "POST" }).catch(() => {});
    }
  };

  const handlePrev = (e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    triggerHaptic("light");
    if (currentIndex > 0) {
      setCurrentIndex((c) => c - 1);
      setProgress(0);
    }
  };

  const handleNext = (e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    triggerHaptic("light");
    if (currentIndex < storiesList.length - 1) {
      setCurrentIndex((c) => c + 1);
      setProgress(0);
    } else {
      onClose();
    }
  };

  if (!currentStory || storiesList.length === 0) {
    return (
      <div className="fixed inset-0 z-[100050] flex items-center justify-center bg-black/90 backdrop-blur-2xl p-4 select-none" onClick={onClose}>
        <div className="bg-[#182332] border border-white/10 rounded-2xl p-6 text-center text-white max-w-sm" onClick={(e) => e.stopPropagation()}>
          <p className="text-base font-semibold mb-2">Нет историй</p>
          <p className="text-xs text-gray-400 mb-5">В данный момент нет доступных историй от контактов.</p>
          <button onClick={onClose} className="px-5 py-2 bg-indigo-600 hover:bg-indigo-500 rounded-xl text-xs font-semibold cursor-pointer">
            Закрыть
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-[100050] flex items-center justify-center bg-black/90 backdrop-blur-2xl animate-fade-in select-none">
      {/* Background click to close */}
      <div className="absolute inset-0" onClick={onClose} />

      {/* Main Story Container Card */}
      <motion.div
        initial={{ scale: 0.94, opacity: 0, y: 20 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        exit={{ scale: 0.94, opacity: 0, y: 20 }}
        transition={{ type: "spring", stiffness: 420, damping: 32 }}
        className="relative w-full max-w-[430px] h-full sm:h-[88vh] sm:max-h-[820px] bg-black sm:rounded-[36px] overflow-hidden flex flex-col shadow-2xl border border-white/10 z-10"
        onMouseDown={() => setIsPaused(true)}
        onMouseUp={() => setIsPaused(false)}
        onTouchStart={() => setIsPaused(true)}
        onTouchEnd={() => setIsPaused(false)}
      >
        {/* Progress Bar Segments */}
        <div className="absolute top-3 inset-x-3 z-30 flex items-center gap-1.5 pt-[env(safe-area-inset-top,0px)]">
          {storiesList.map((_, idx) => (
            <div
              key={idx}
              className="flex-1 h-1 rounded-full bg-white/25 overflow-hidden backdrop-blur-md"
            >
              <div
                className="h-full bg-white rounded-full transition-all duration-75"
                style={{
                  width:
                    idx < currentIndex
                      ? "100%"
                      : idx === currentIndex
                      ? `${progress}%`
                      : "0%",
                }}
              />
            </div>
          ))}
        </div>

        {/* Top Header Row with Creator Info and Anonymous Button */}
        <div className="absolute top-8 inset-x-3 z-30 flex items-center justify-between pt-[env(safe-area-inset-top,0px)]">
          <div 
            onClick={() => {
              if (onOpenChat && currentStory.userId) {
                onOpenChat(currentStory.userId, currentStory.userName);
                onClose();
              }
            }}
            className="flex items-center gap-2.5 cursor-pointer group active:opacity-80 transition-opacity"
            title="Открыть диалог"
          >
            <div className="w-10 h-10 rounded-full p-[2px] bg-gradient-to-tr from-amber-400 via-pink-500 to-purple-600 shadow-md group-hover:scale-105 transition-transform">
              <div className="w-full h-full rounded-full bg-[#181824] overflow-hidden flex items-center justify-center text-white font-bold text-xs relative">
                {currentStory.userAvatar ? (
                  <img
                    src={currentStory.userAvatar}
                    alt=""
                    className="w-full h-full object-cover"
                    onError={(e) => { e.currentTarget.style.display = "none"; }}
                  />
                ) : null}
                <span className={currentStory.userAvatar ? "sr-only" : ""}>
                  {currentStory.userName.slice(0, 1)}
                </span>
              </div>
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <span className="text-white text-sm font-semibold leading-tight drop-shadow-md group-hover:underline">
                  {currentStory.userName}
                </span>
                <CheckCircle2 className="w-3.5 h-3.5 text-sky-400 fill-sky-400/20" />
              </div>
              <span className="text-[11px] text-white/70 drop-shadow-sm">
                {currentStory.timeAgo}
              </span>
            </div>
          </div>

          {/* Header Action Buttons */}
          <div className="flex items-center gap-2">
            {isOwnStory ? (
              <button
                onClick={() => {
                  setIsPaused(true);
                  setShowDeleteConfirm(true);
                }}
                className="w-9 h-9 rounded-full bg-rose-600/30 hover:bg-rose-600/50 border border-rose-400/40 text-rose-300 flex items-center justify-center transition-all active:scale-90 cursor-pointer"
                title="Удалить историю"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            ) : (
              <button
                onClick={toggleAnonymous}
                className={`px-3 py-1.5 rounded-full text-xs font-semibold flex items-center gap-1.5 transition-all shadow-lg active:scale-95 cursor-pointer backdrop-blur-xl border ${
                  isAnonymous
                    ? "bg-emerald-500/25 border-emerald-400/60 text-emerald-300 shadow-emerald-500/20"
                    : "bg-black/50 border-white/20 text-white/80 hover:text-white"
                }`}
                title={
                  isAnonymous
                    ? "Анонимный режим включен: просмотр скрыт от автора"
                    : "Нажмите для включения анонимного просмотра"
                }
              >
                {isAnonymous ? (
                  <>
                    <EyeOff className="w-3.5 h-3.5 text-emerald-400 animate-pulse" />
                    <span className="text-[11px]">Анонимно</span>
                  </>
                ) : (
                  <>
                    <Eye className="w-3.5 h-3.5 text-gray-300" />
                    <span className="text-[11px]">Обычно</span>
                  </>
                )}
              </button>
            )}

            {/* Context Menu Button */}
            <button
              onClick={() => {
                setIsPaused(true);
                triggerHaptic("medium");
                setShowStoryContextModal(true);
              }}
              className="w-9 h-9 rounded-full bg-black/40 hover:bg-black/60 border border-white/15 text-white flex items-center justify-center transition-transform active:scale-90 cursor-pointer"
              title="Меню управления историей, статистика и настройки"
            >
              <MoreVertical className="w-4 h-4" />
            </button>

            {/* Close Button */}
            <button
              onClick={onClose}
              className="w-9 h-9 rounded-full bg-black/40 hover:bg-black/60 border border-white/15 text-white flex items-center justify-center transition-transform active:scale-90 cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Story Visual Canvas */}
        <div
          onPointerDown={() => {
            setIsPaused(true);
            storyCanvasHoldTimerRef.current = window.setTimeout(() => {
              triggerHaptic("heavy");
              setShowStoryContextModal(true);
            }, 420);
          }}
          onPointerUp={() => {
            if (storyCanvasHoldTimerRef.current) clearTimeout(storyCanvasHoldTimerRef.current);
            if (!showStoryContextModal) setIsPaused(false);
          }}
          onPointerCancel={() => {
            if (storyCanvasHoldTimerRef.current) clearTimeout(storyCanvasHoldTimerRef.current);
            if (!showStoryContextModal) setIsPaused(false);
          }}
          onContextMenu={(e) => {
            e.preventDefault();
            triggerHaptic("heavy");
            setShowStoryContextModal(true);
            setIsPaused(true);
          }}
          className={`flex-1 w-full bg-gradient-to-b ${currentStory.colorGradient} flex flex-col justify-end p-6 relative overflow-hidden select-none`}
        >
          {currentStory?.mediaUrl && (
            currentStory.isVideo || currentStory.mediaUrl.endsWith(".mp4") ? (
              <video
                src={currentStory.mediaUrl}
                autoPlay
                playsInline
                loop
                muted={false}
                className="absolute inset-0 w-full h-full object-cover z-0"
              />
            ) : (
              <img
                src={currentStory.mediaUrl}
                alt=""
                className="absolute inset-0 w-full h-full object-cover z-0"
                onError={(e) => { e.currentTarget.style.display = "none"; }}
              />
            )
          )}

          {/* Dark gradient overlay for text readability when media is present */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/30 to-black/40 z-10 pointer-events-none" />

          {/* Subtle glowing orb accent */}
          <div className="absolute top-1/3 left-1/2 -translate-x-1/2 w-64 h-64 rounded-full bg-white/10 blur-3xl pointer-events-none" />

          {/* Story Main Body Content */}
          <div className="relative z-20 space-y-4 pb-8">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/15 backdrop-blur-md border border-white/20 text-white text-xs font-medium">
              <Sparkles className="w-3.5 h-3.5 text-amber-300" />
              <span>История Nexusgram</span>
            </div>

            <p className="text-white text-xl sm:text-2xl font-bold leading-snug drop-shadow-lg">
              {currentStory.caption}
            </p>

            {isAnonymous && (
              <div className="p-2.5 rounded-2xl bg-black/40 border border-emerald-500/30 backdrop-blur-md flex items-center gap-2">
                <span className="text-emerald-400 text-xs">🛡️</span>
                <span className="text-[11px] text-emerald-200 font-medium">
                  Режим инкогнито активен. Ваш просмотр не учитывается в статистике автора.
                </span>
              </div>
            )}
          </div>

          {/* Tap Areas for Navigation */}
          <div
            className="absolute inset-y-0 left-0 w-1/3 z-10 cursor-pointer"
            onClick={handlePrev}
            title="Предыдущая"
          />
          <div
            className="absolute inset-y-0 right-0 w-1/3 z-10 cursor-pointer"
            onClick={handleNext}
            title="Следующая"
          />
        </div>

        {/* Story Bottom Controls & Reply Bar */}
        <div className="p-3 bg-black/85 backdrop-blur-xl border-t border-white/10 flex flex-col gap-2 z-30">
          {/* Reaction Emojis & Prev/Next */}
          <div className="flex items-center justify-between gap-2">
            <button
              onClick={handlePrev}
              disabled={currentIndex === 0}
              className="p-1.5 text-white/70 hover:text-white disabled:opacity-30 cursor-pointer transition-colors"
              title="Предыдущая"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>

            {/* Quick Reactions */}
            <div className="flex items-center gap-1 sm:gap-2">
              {["❤️", "🔥", "👍", "👏", "😂"].map((emoji) => (
                <button
                  key={emoji}
                  onClick={() => handleQuickReaction(emoji)}
                  className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 active:scale-90 transition-transform flex items-center justify-center text-sm cursor-pointer"
                  title={`Отправить ${emoji}`}
                >
                  {emoji}
                </button>
              ))}
            </div>

            <span className="text-[11px] text-white/60 font-mono shrink-0">
              {currentIndex + 1} / {storiesList.length}
            </span>

            <button
              onClick={handleNext}
              className="p-1.5 text-white/70 hover:text-white cursor-pointer transition-colors"
              title="Следующая"
            >
              <ChevronRight className="w-5 h-5" />
            </button>
          </div>

          {/* Quick Reply Form or Own Story Controls */}
          {isOwnStory ? (
            <div className="flex items-center gap-2 pt-1">
              <button
                type="button"
                onClick={() => {
                  setIsPaused(true);
                  fetchViewers(currentStory.id);
                  setShowViewersModal(true);
                  triggerHaptic("medium");
                }}
                className="flex-1 py-2 px-3 rounded-full bg-white/10 hover:bg-white/20 border border-white/15 flex items-center justify-center gap-2 text-white font-medium text-xs transition-all cursor-pointer active:scale-95 shadow-sm"
              >
                <Eye className="w-4 h-4 text-sky-400" />
                <span>Просмотры {viewersList.length > 0 ? `(${viewersList.length})` : ""}</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  setIsPaused(true);
                  setShowDeleteConfirm(true);
                  triggerHaptic("heavy");
                }}
                className="py-2 px-4 rounded-full bg-rose-600/30 hover:bg-rose-600/50 border border-rose-500/40 flex items-center justify-center gap-1.5 text-rose-200 font-medium text-xs transition-all cursor-pointer active:scale-95"
              >
                <Trash2 className="w-4 h-4" />
                <span>Удалить</span>
              </button>
            </div>
          ) : (
            <form onSubmit={handleSendReply} className="flex items-center gap-2">
              <input
                type="text"
                value={replyText}
                onChange={(e) => setReplyText(e.target.value)}
                onFocus={() => setIsPaused(true)}
                onBlur={() => setIsPaused(false)}
                placeholder="Ответить на историю..."
                className="flex-1 bg-white/10 border border-white/15 rounded-full px-3.5 py-1.5 text-xs text-white placeholder-white/40 focus:outline-none focus:border-indigo-400 focus:bg-white/15 transition-all"
              />
              <button
                type="submit"
                disabled={!replyText.trim()}
                className="w-8 h-8 rounded-full bg-indigo-600 hover:bg-indigo-500 disabled:opacity-40 disabled:hover:bg-indigo-600 text-white flex items-center justify-center transition-all cursor-pointer shrink-0 active:scale-95 shadow-md"
                title="Отправить ответ"
              >
                <Send className="w-3.5 h-3.5" />
              </button>
            </form>
          )}

          {/* Toast Notification */}
          <AnimatePresence>
            {sentToast && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 10 }}
                className="absolute -top-10 left-1/2 -translate-x-1/2 px-4 py-1.5 rounded-full bg-emerald-600/90 text-white text-xs font-medium shadow-lg backdrop-blur-md pointer-events-none"
              >
                Отправлено автору!
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </motion.div>

      {/* Delete Confirmation Modal */}
      <AnimatePresence>
        {showDeleteConfirm && (
          <div className="fixed inset-0 z-[100060] flex items-center justify-center p-4 bg-black/80 backdrop-blur-md select-none animate-fade-in">
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-[#182332] border border-white/10 rounded-3xl p-6 max-w-xs w-full text-center space-y-4 shadow-2xl"
            >
              <div className="w-12 h-12 rounded-2xl bg-rose-500/20 border border-rose-500/30 text-rose-400 flex items-center justify-center mx-auto">
                <Trash2 className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-base font-bold text-white">Удалить историю?</h3>
                <p className="text-xs text-gray-400 mt-1">
                  Эта история будет безвозвратно удалена из вашего профиля.
                </p>
              </div>
              <div className="flex gap-2 pt-1">
                <button
                  onClick={() => {
                    setShowDeleteConfirm(false);
                    setIsPaused(false);
                  }}
                  className="flex-1 py-2.5 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-gray-300 text-xs font-semibold cursor-pointer"
                >
                  Отмена
                </button>
                <button
                  onClick={handleDeleteStory}
                  className="flex-1 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-500 text-white text-xs font-semibold shadow-lg shadow-rose-600/30 cursor-pointer"
                >
                  Удалить
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Viewers List Modal */}
      <AnimatePresence>
        {showViewersModal && (
          <div className="fixed inset-0 z-[100060] flex items-end sm:items-center justify-center sm:p-4 bg-black/80 backdrop-blur-md select-none animate-fade-in">
            <motion.div
              initial={{ y: 50, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: 50, opacity: 0 }}
              className="bg-[#16212e] border border-white/10 rounded-t-3xl sm:rounded-3xl p-5 max-w-sm w-full max-h-[75vh] flex flex-col shadow-2xl"
            >
              <div className="flex items-center justify-between pb-3 border-b border-white/10">
                <div className="flex items-center gap-2">
                  <Eye className="w-4 h-4 text-sky-400" />
                  <h3 className="text-sm font-bold text-white">
                    Просмотры истории ({viewersList.length})
                  </h3>
                </div>
                <button
                  onClick={() => {
                    setShowViewersModal(false);
                    setIsPaused(false);
                  }}
                  className="p-1 rounded-full text-gray-400 hover:text-white cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="flex-1 overflow-y-auto py-3 space-y-2.5 custom-scrollbar min-h-[160px]">
                {loadingViewers ? (
                  <div className="py-12 text-center text-xs text-gray-400 space-y-2">
                    <div className="w-5 h-5 border-2 border-sky-400 border-t-transparent rounded-full animate-spin mx-auto" />
                    <p>Загрузка зрителей...</p>
                  </div>
                ) : viewersList.length === 0 ? (
                  <div className="py-12 text-center text-xs text-gray-400 space-y-1">
                    <Users className="w-8 h-8 text-gray-500 mx-auto mb-2" />
                    <p className="font-semibold text-gray-300">Пока никто не просмотрел</p>
                    <p className="text-[11px] text-gray-500">Здесь появится список пользователей, посмотревших эту историю</p>
                  </div>
                ) : (
                  viewersList.map((viewer) => (
                    <div
                      key={viewer.id}
                      className="flex items-center justify-between p-2 rounded-2xl bg-white/5 border border-white/5 hover:border-white/10 transition-colors"
                    >
                      <div className="flex items-center gap-2.5 min-w-0">
                        <div className="w-9 h-9 rounded-full bg-gradient-to-tr from-indigo-600 to-sky-500 text-white font-bold flex items-center justify-center text-xs overflow-hidden shrink-0 border border-white/10">
                          {viewer.avatar ? (
                            <img
                              src={viewer.avatar}
                              alt=""
                              className="w-full h-full object-cover"
                              onError={(e) => { e.currentTarget.style.display = "none"; }}
                            />
                          ) : null}
                          <span>{(viewer.name || "U").slice(0, 1).toUpperCase()}</span>
                        </div>
                        <div className="min-w-0">
                          <p className="text-xs font-semibold text-white truncate">
                            {viewer.name}
                          </p>
                          {viewer.username && (
                            <p className="text-[10px] text-sky-400 truncate">
                              @{viewer.username}
                            </p>
                          )}
                        </div>
                      </div>

                      <div className="flex items-center gap-2 shrink-0 ml-2">
                        {viewer.reaction && (
                          <span className="text-sm">{viewer.reaction}</span>
                        )}
                        <span className="text-[10px] text-gray-400">
                          {viewer.date ? new Date(viewer.date).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }) : "Недавно"}
                        </span>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Story Context Modal (Long Press on Canvas or More Button) */}
      <StoryContextModal
        isOpen={showStoryContextModal}
        story={currentStory}
        onClose={() => {
          setShowStoryContextModal(false);
          setIsPaused(false);
        }}
        onUpdateStory={(updated) => {
          setStoriesList((prev) => prev.map((s) => (s.id === updated.id ? updated : s)));
          try {
            const saved = JSON.parse(localStorage.getItem("nexus_my_stories") || "[]");
            const nextSaved = saved.map((s: any) => (s.id === updated.id ? updated : s));
            localStorage.setItem("nexus_my_stories", JSON.stringify(nextSaved));
          } catch {}
          window.dispatchEvent(new CustomEvent("story-updated", { detail: updated }));
        }}
        onDeleteStory={handleDeleteStory}
      />
    </div>
  );
};
