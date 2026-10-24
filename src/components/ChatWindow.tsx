import { motion, AnimatePresence } from "motion/react";
import { useState, useRef, useEffect } from "react";
import { Message } from "../types";
import { MessageItem } from "./MessageItem";
import { Send, Hash, MoreVertical, Loader2, ArrowLeft, Bot, Sparkles, Plus, Clock, MessageSquare, Trash2, CheckCircle2, ChevronRight, X, Settings } from "lucide-react";
import { useI18n } from "../utils/i18n";
import { triggerHaptic } from "../utils/haptics";
import { AiSettingsModal, getStoredAiSettings, AiSettings } from "./AiSettingsModal";

export interface AiChatSession {
  id: string;
  title: string;
  createdAt: number;
  updatedAt: number;
  messages: Message[];
}

export function ChatWindow({ onBack }: { onBack?: () => void }) {
  const { strings } = useI18n();

  // Load and manage AI chat sessions from localStorage
  const [sessions, setSessions] = useState<AiChatSession[]>(() => {
    try {
      const saved = localStorage.getItem("nexus_ai_sessions");
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) {
          return parsed.map((s: any) => ({
            ...s,
            messages: (s.messages || []).map((m: any) => ({
              ...m,
              timestamp: new Date(m.timestamp)
            }))
          }));
        }
      }
    } catch (e) {
      console.error("Failed to load AI sessions", e);
    }

    return [{
      id: "session_1",
      title: "Основной диалог с ИИ",
      createdAt: Date.now(),
      updatedAt: Date.now(),
      messages: [
        {
          id: "welcome-1",
          text: "Привет! Я твой персональный ИИ-ассистент Nexus.\nЧем могу помочь?",
          role: "model",
          timestamp: new Date()
        }
      ]
    }];
  });

  const [activeSessionId, setActiveSessionId] = useState<string>(() => {
    const savedActiveId = localStorage.getItem("nexus_ai_active_session_id");
    if (savedActiveId && sessions.some(s => s.id === savedActiveId)) {
      return savedActiveId;
    }
    return sessions[0]?.id || "session_1";
  });

  const [showHistoryModal, setShowHistoryModal] = useState<boolean>(false);

  // Active session messages
  const activeSession = sessions.find(s => s.id === activeSessionId) || sessions[0];
  const messages = activeSession ? activeSession.messages : [];

  // Update localStorage whenever sessions change
  useEffect(() => {
    try {
      localStorage.setItem("nexus_ai_sessions", JSON.stringify(sessions));
      localStorage.setItem("nexus_ai_active_session_id", activeSessionId);
    } catch (e) {
      console.error("Failed to save AI sessions", e);
    }
  }, [sessions, activeSessionId]);

  const [input, setInput] = useState(() => localStorage.getItem("draft_ai_assistant") || "");

  // Auto-save draft for AI chat
  useEffect(() => {
    if (input.trim()) {
      localStorage.setItem("draft_ai_assistant", input);
      localStorage.setItem("draft_time_ai_assistant", Date.now().toString());
      window.dispatchEvent(new CustomEvent("nexus-draft-updated", { detail: { chatId: "ai-assistant", text: input, time: Date.now() } }));
    } else {
      localStorage.removeItem("draft_ai_assistant");
      localStorage.removeItem("draft_time_ai_assistant");
      window.dispatchEvent(new CustomEvent("nexus-draft-updated", { detail: { chatId: "ai-assistant", text: "", time: 0 } }));
    }
  }, [input]);

  const [files, setFiles] = useState<File[]>([]);
  const [isDragging, setIsDragging] = useState(false);
  const [isTyping, setIsTyping] = useState(false);
  const [showSettingsModal, setShowSettingsModal] = useState(false);
  const [aiSettings, setAiSettings] = useState<AiSettings>(getStoredAiSettings);

  useEffect(() => {
    const handleSettingsUpdate = (e: any) => {
      if (e.detail) setAiSettings(e.detail);
      else setAiSettings(getStoredAiSettings());
    };
    window.addEventListener("nexus-ai-settings-updated", handleSettingsUpdate);
    return () => window.removeEventListener("nexus-ai-settings-updated", handleSettingsUpdate);
  }, []);
  const bottomRef = useRef<HTMLDivElement>(null);
  const chatAreaRef = useRef<HTMLDivElement>(null);
  const trackRef = useRef<HTMLDivElement>(null);
  const thumbRef = useRef<HTMLDivElement>(null);
  const [isScrubbing, setIsScrubbing] = useState(false);

  // Switch to or continue an existing session
  const handleSelectSession = (sessionId: string) => {
    triggerHaptic("light");
    setActiveSessionId(sessionId);
    setShowHistoryModal(false);
  };

  // Create a fresh new chat session
  const handleCreateNewSession = () => {
    triggerHaptic("medium");
    const newSessionId = `session_${Date.now()}`;
    const newSession: AiChatSession = {
      id: newSessionId,
      title: `Диалог #${sessions.length + 1}`,
      createdAt: Date.now(),
      updatedAt: Date.now(),
      messages: [
        {
          id: `welcome-${Date.now()}`,
          text: "Привет! Новый диалог начат. Чем я могу помочь?",
          role: "model",
          timestamp: new Date()
        }
      ]
    };
    setSessions(prev => [newSession, ...prev]);
    setActiveSessionId(newSessionId);
    setShowHistoryModal(false);
  };

  // Delete an existing session
  const handleDeleteSession = (sessionId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    triggerHaptic("light");
    if (sessions.length <= 1) {
      const reset: AiChatSession[] = [{
        id: "session_1",
        title: "Новый диалог",
        createdAt: Date.now(),
        updatedAt: Date.now(),
        messages: [{
          id: `welcome-${Date.now()}`,
          text: "Привет! Начат новый диалог с ИИ.",
          role: "model",
          timestamp: new Date()
        }]
      }];
      setSessions(reset);
      setActiveSessionId("session_1");
      return;
    }
    const updated = sessions.filter(s => s.id !== sessionId);
    setSessions(updated);
    if (activeSessionId === sessionId) {
      setActiveSessionId(updated[0].id);
    }
  };

  const handleScroll = () => {
    const el = chatAreaRef.current;
    if (!el) return;
    const maxScroll = el.scrollHeight - el.clientHeight;
    if (thumbRef.current && maxScroll > 0) {
      const ratio = el.scrollTop / maxScroll;
      const heightPercent = Math.max(15, Math.min(75, (el.clientHeight / el.scrollHeight) * 100));
      thumbRef.current.style.top = `${ratio * (100 - heightPercent)}%`;
      thumbRef.current.style.height = `${heightPercent}%`;
    }
  };

  const handleScrub = (clientY: number) => {
    const track = trackRef.current;
    const el = chatAreaRef.current;
    if (!track || !el) return;
    const rect = track.getBoundingClientRect();
    let relativeY = clientY - rect.top;
    relativeY = Math.max(0, Math.min(rect.height, relativeY));
    const ratio = relativeY / rect.height;
    const maxScroll = el.scrollHeight - el.clientHeight;
    el.scrollTop = ratio * maxScroll;
    if (thumbRef.current) {
      const heightPercent = Math.max(15, Math.min(75, (el.clientHeight / el.scrollHeight) * 100));
      thumbRef.current.style.top = `${ratio * (100 - heightPercent)}%`;
    }
  };

  const onScrubStart = (e: any) => {
    e.preventDefault();
    setIsScrubbing(true);
    const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY;
    handleScrub(clientY);
  };

  useEffect(() => {
    if (!isScrubbing) return;
    const handleMove = (e: any) => {
      const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY;
      handleScrub(clientY);
    };
    const handleEnd = () => {
      setIsScrubbing(false);
    };
    window.addEventListener('mousemove', handleMove);
    window.addEventListener('mouseup', handleEnd);
    window.addEventListener('touchmove', handleMove);
    window.addEventListener('touchend', handleEnd);
    return () => {
      window.removeEventListener('mousemove', handleMove);
      window.removeEventListener('mouseup', handleEnd);
      window.removeEventListener('touchmove', handleMove);
      window.removeEventListener('touchend', handleEnd);
    };
  }, [isScrubbing]);

  useEffect(() => {
    handleScroll();
  }, [messages]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isTyping]);

  
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      setFiles((prev) => [...prev, ...(Array.from(e.dataTransfer.files) as File[])]);
    }
  };

  const handleFileChange = (e: any) => {
    if (e.target.files && e.target.files.length > 0) {
      setFiles((prev) => [...prev, ...(Array.from(e.target.files) as File[])]);
    }
  };

  const handleSend = async () => {
    if (!input.trim() || isTyping) return;

    const userText = input.trim();
    const userMessage: Message = {
      id: Date.now().toString(),
      text: userText,
      role: "user",
      timestamp: new Date()
    };

    const currentMessages = [...messages, userMessage];

    // Auto title if first user message or default
    const shouldUpdateTitle = activeSession.title.startsWith("Диалог #") || activeSession.title === "Новый диалог" || activeSession.title === "Основной диалог с ИИ";
    const newTitle = shouldUpdateTitle ? (userText.slice(0, 32) + (userText.length > 32 ? "..." : "")) : activeSession.title;

    setSessions(prev => prev.map(s => {
      if (s.id === activeSessionId) {
        return {
          ...s,
          title: newTitle,
          updatedAt: Date.now(),
          messages: currentMessages
        };
      }
      return s;
    }));

    setInput("");
    localStorage.removeItem("draft_ai_assistant");
    localStorage.removeItem("draft_time_ai_assistant");
    window.dispatchEvent(new CustomEvent("nexus-draft-updated", { detail: { chatId: "ai-assistant", text: "", time: 0 } }));
    setIsTyping(true);

    try {
      const history = currentMessages.map(m => ({ role: m.role, text: m.text }));
      const settings = getStoredAiSettings();
      const response = await fetch("/api/chat", {
        headers: {
          "Content-Type": "application/json",
          "x-ai-provider": settings.provider,
          "x-gemini-key": settings.geminiKey,
          "x-openai-key": settings.openaiKey,
          "x-ai-model": settings.provider === "openai" ? settings.openaiModel : settings.geminiModel,
        },
        method: "POST",
        body: JSON.stringify({
          message: userMessage.text,
          history: history
        })
      });

      if (!response.ok) {
        throw new Error("Failed to send message");
      }

      const data = await response.json();
      
      const modelMessage: Message = {
        id: (Date.now() + 1).toString(),
        text: data.text,
        role: "model",
        timestamp: new Date()
      };

      setSessions(prev => prev.map(s => {
        if (s.id === activeSessionId) {
          return {
            ...s,
            updatedAt: Date.now(),
            messages: [...currentMessages, modelMessage]
          };
        }
        return s;
      }));
    } catch (error) {
      console.error(error);
      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        text: "Произошла ошибка при отправке запроса к ИИ. Попробуйте еще раз.",
        role: "model",
        timestamp: new Date()
      };

      setSessions(prev => prev.map(s => {
        if (s.id === activeSessionId) {
          return {
            ...s,
            updatedAt: Date.now(),
            messages: [...currentMessages, errorMessage]
          };
        }
        return s;
      }));
    } finally {
      setIsTyping(false);
    }
  };

  const handleKeyDown = (e: any) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div 
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
      className="flex-1 flex flex-col h-full telegram-chat-bg relative select-none">
      {/* Background elegant overlay */}
      <AnimatePresence>
        {isDragging && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 z-50 bg-black/60 backdrop-blur-sm border-2 border-dashed border-indigo-500 rounded-xl flex items-center justify-center pointer-events-none m-2"
          >
            <div className="text-center">
              <div className="w-16 h-16 bg-indigo-500/20 text-indigo-400 rounded-full flex items-center justify-center mx-auto mb-3">
                <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path><polyline points="17 8 12 3 7 8"></polyline><line x1="12" y1="3" x2="12" y2="15"></line></svg>
              </div>
              <p className="text-white font-medium">Перетащите файлы сюда</p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
      <div className="absolute inset-0 bg-black/20 pointer-events-none" />

      {/* Header with Clickable AI Profile & History Access */}
      <div className="border-b border-[#0e1621] bg-[#17212b]/95 backdrop-blur-md flex flex-col z-10 sticky top-0 shadow-sm">
        {/* iOS Status Bar Safe Area Spacer */}
        <div className="w-full shrink-0 h-[env(safe-area-inset-top,0px)] bg-[#17212b]" />
        <div className="h-16 flex items-center justify-between px-3 md:px-6">
          <div className="flex items-center gap-2 md:gap-3 min-w-0">
            {onBack && (
              <button onClick={onBack} className="md:hidden p-2 -ml-2 text-gray-400 hover:text-gray-200 transition-colors cursor-pointer">
                <ArrowLeft className="w-6 h-6" />
              </button>
            )}
            
            {/* Clickable Profile Button to open AI History & Sessions */}
            <div 
              onClick={() => {
                triggerHaptic("light");
                setShowHistoryModal(true);
              }}
              className="flex items-center gap-3 cursor-pointer hover:opacity-90 active:scale-[0.98] transition-all p-1 -m-1 rounded-xl group/aiprofile"
              title="Нажмите, чтобы открыть историю диалогов и профиль ИИ"
            >
              <div className="relative w-10 h-10 rounded-full bg-gradient-to-tr from-indigo-500 via-purple-500 to-pink-500 p-[2px] shadow-md shadow-indigo-500/30 shrink-0">
                <div className="w-full h-full rounded-full bg-[#181824] flex items-center justify-center text-indigo-400 group-hover/aiprofile:bg-[#202030] transition-colors">
                  <Bot className="w-5 h-5 text-indigo-300" />
                </div>
                <span className="absolute bottom-0 right-0 w-3 h-3 bg-emerald-500 rounded-full border-2 border-[#17212b]" />
              </div>
              <div className="flex flex-col min-w-0">
                <div className="flex items-center gap-2">
                  <h1 className="font-display font-semibold text-gray-100 text-sm truncate group-hover/aiprofile:text-indigo-200 transition-colors">
                    AI Assistant
                  </h1>
                  <span className="px-1.5 py-0.2 rounded-full bg-indigo-500/20 text-indigo-300 text-[10px] font-medium border border-indigo-500/30 flex items-center gap-1 shrink-0">
                    <Sparkles className="w-2.5 h-2.5" />
                    <span>История</span>
                  </span>
                </div>
                <p className="text-[11px] text-gray-400 truncate max-w-[200px] sm:max-w-xs">
                  {activeSession?.title || "Нажмите для истории диалогов"}
                </p>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-1">
            <button
              onClick={() => {
                triggerHaptic("light");
                setShowSettingsModal(true);
              }}
              className="p-2 text-purple-300 hover:text-white hover:bg-purple-500/20 rounded-xl transition-colors flex items-center gap-1.5 text-xs font-medium cursor-pointer"
              title="Настройки нейросети и свои API ключи"
            >
              <Settings className="w-4 h-4" />
              <span className="hidden sm:inline">Настройки ИИ</span>
            </button>
            <button 
              onClick={handleCreateNewSession}
              className="p-2 text-indigo-300 hover:text-white hover:bg-indigo-500/20 rounded-xl transition-colors flex items-center gap-1.5 text-xs font-medium cursor-pointer"
              title="Начать новый диалог с ИИ"
            >
              <Plus className="w-4 h-4" />
              <span className="hidden sm:inline">Новый чат</span>
            </button>
            <button 
              onClick={() => {
                triggerHaptic("light");
                setShowHistoryModal(true);
              }}
              className="text-gray-400 hover:text-gray-200 transition-colors p-2 rounded-xl hover:bg-[#1a1a24] cursor-pointer"
              title="История диалогов с ИИ"
            >
              <Clock className="w-5 h-5" />
            </button>
          </div>
        </div>
      </div>

      {/* AI Assistant Profile & History Modal */}
      <AnimatePresence>
        {showHistoryModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/75 backdrop-blur-md animate-fade-in">
            <motion.div
              initial={{ scale: 0.95, opacity: 0, y: 15 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.95, opacity: 0, y: 15 }}
              transition={{ type: "spring", stiffness: 400, damping: 30 }}
              className="w-full max-w-lg bg-[#111720] border border-[#242f3d] rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[85vh]"
            >
              {/* Modal Header */}
              <div className="p-4 sm:p-5 border-b border-[#242f3d] bg-[#17212b] flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-11 h-11 rounded-2xl bg-gradient-to-tr from-indigo-600 via-purple-600 to-pink-500 p-[2px] shadow-lg shadow-indigo-500/20 shrink-0">
                    <div className="w-full h-full rounded-2xl bg-[#0e1621] flex items-center justify-center">
                      <Bot className="w-6 h-6 text-indigo-400" />
                    </div>
                  </div>
                  <div>
                    <h2 className="text-base font-bold text-white flex items-center gap-2">
                      <span>ИИ Ассистент Nexus</span>
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                        ОНЛАЙН
                      </span>
                    </h2>
                    <p className="text-xs text-gray-400">
                      Модель: Gemini 2.5 Flash • Память диалогов
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => setShowHistoryModal(false)}
                  className="p-2 text-gray-400 hover:text-white rounded-xl hover:bg-white/10 transition-colors cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Action Banner: New Chat Button */}
              <div className="p-4 bg-[#141d27] border-b border-[#242f3d] flex items-center justify-between gap-3">
                <div>
                  <h3 className="text-xs font-semibold text-gray-200">
                    История бесед с ИИ
                  </h3>
                  <p className="text-[11px] text-gray-400">
                    Всего сохранено диалогов: {sessions.length}
                  </p>
                </div>
                <button
                  onClick={handleCreateNewSession}
                  className="px-3.5 py-2 rounded-xl bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-400 hover:to-purple-500 text-white font-semibold text-xs shadow-md shadow-indigo-500/20 flex items-center gap-1.5 transition-all cursor-pointer shrink-0 active:scale-95"
                >
                  <Plus className="w-4 h-4" />
                  <span>Новый диалог</span>
                </button>
              </div>

              {/* Sessions List */}
              <div className="flex-1 overflow-y-auto p-3 sm:p-4 space-y-2">
                {sessions.map((session) => {
                  const isCurrent = session.id === activeSessionId;
                  const lastMsg = session.messages[session.messages.length - 1];
                  const formattedDate = new Intl.DateTimeFormat('ru-RU', {
                    day: 'numeric',
                    month: 'short',
                    hour: '2-digit',
                    minute: '2-digit'
                  }).format(new Date(session.updatedAt || session.createdAt));

                  return (
                    <div
                      key={session.id}
                      onClick={() => handleSelectSession(session.id)}
                      className={`p-3 rounded-xl border transition-all cursor-pointer flex items-center justify-between gap-3 group/session ${
                        isCurrent
                          ? "bg-indigo-500/15 border-indigo-500/50 shadow-md shadow-indigo-500/10"
                          : "bg-[#17212b] border-[#242f3d] hover:bg-[#1e2a38] hover:border-gray-600"
                      }`}
                    >
                      <div className="flex items-start gap-3 min-w-0 flex-1">
                        <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 mt-0.5 ${
                          isCurrent ? "bg-indigo-500 text-white" : "bg-white/5 text-gray-400"
                        }`}>
                          <MessageSquare className="w-4 h-4" />
                        </div>
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-2 mb-0.5">
                            <h4 className={`text-xs font-bold truncate ${isCurrent ? "text-indigo-300" : "text-gray-200"}`}>
                              {session.title}
                            </h4>
                            {isCurrent && (
                              <span className="text-[9px] font-bold px-1.5 py-0.2 rounded-full bg-indigo-500/30 text-indigo-300 border border-indigo-500/40 shrink-0">
                                Активен
                              </span>
                            )}
                          </div>
                          <p className="text-[11px] text-gray-400 truncate line-clamp-1">
                            {lastMsg ? lastMsg.text : "Пустой диалог"}
                          </p>
                          <div className="flex items-center gap-3 mt-1 text-[10px] text-gray-500">
                            <span>{formattedDate}</span>
                            <span>•</span>
                            <span>{session.messages.length} сообщ.</span>
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-1.5 shrink-0">
                        {isCurrent ? (
                          <div className="w-7 h-7 rounded-lg bg-indigo-500/20 text-indigo-400 flex items-center justify-center">
                            <CheckCircle2 className="w-4 h-4" />
                          </div>
                        ) : (
                          <span className="text-xs text-indigo-400 group-hover/session:translate-x-0.5 transition-transform flex items-center gap-0.5 font-medium">
                            <span>Продолжить</span>
                            <ChevronRight className="w-3.5 h-3.5" />
                          </span>
                        )}
                        <button
                          onClick={(e) => handleDeleteSession(session.id, e)}
                          className="p-1.5 rounded-lg text-gray-500 hover:text-red-400 hover:bg-red-500/10 transition-colors ml-1 cursor-pointer"
                          title="Удалить диалог"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Modal Footer info */}
              <div className="p-3 bg-[#17212b] border-t border-[#242f3d] flex items-center justify-between text-xs text-gray-400">
                <span>Переключайтесь между диалогами в любой момент</span>
                <button
                  onClick={() => setShowHistoryModal(false)}
                  className="px-3 py-1.5 rounded-lg bg-white/10 hover:bg-white/15 text-white font-medium text-xs transition-colors cursor-pointer"
                >
                  Закрыть
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Scrubber scroll indicators */}
      <div 
        ref={trackRef}
        onMouseDown={onScrubStart}
        onTouchStart={onScrubStart}
        className="absolute right-1 top-20 bottom-24 w-8 z-40 cursor-ns-resize flex items-center justify-center opacity-20 hover:opacity-100 transition-opacity select-none group/scrub"
      >
        <div className="w-1.5 h-full bg-white/5 rounded-full relative flex justify-center">
          <div 
            ref={thumbRef}
            className="absolute w-2.5 bg-indigo-500/80 hover:bg-indigo-400 rounded-full cursor-ns-resize shadow-md transition-colors"
            style={{ 
              height: "20%", 
              top: "0%" 
            }}
          />
        </div>
      </div>

      {/* Chat Area */}
      <div 
        ref={chatAreaRef}
        onScroll={handleScroll}
        className="flex-1 overflow-y-auto px-4 md:px-10 py-6 z-0 gpu-accelerated scrollbar-thin scrollbar-thumb-zinc-800"
        style={{ overflowAnchor: 'auto', WebkitOverflowScrolling: 'touch' }}
      >
        <div className="max-w-3xl mx-auto flex flex-col min-h-full justify-start pb-1">
          <div className="flex flex-col">
            {messages.map(msg => (
              <MessageItem key={msg.id} message={msg} />
            ))}
            
            {isTyping && (
              <div className="flex items-center gap-3 text-gray-500 mb-6 text-sm">
                <div className="w-8 h-8 rounded-full bg-[#181824] flex items-center justify-center shrink-0 border border-[#2a2a38]">
                  <Loader2 className="w-4 h-4 text-indigo-400 animate-spin" />
                </div>
                <span className="font-mono text-xs">AI печатает ответ...</span>
              </div>
            )}
            <div ref={bottomRef} className="h-1" />
          </div>
        </div>
      </div>

      {/* Input Area: Flush at absolute bottom of screen */}
      <div className="sticky bottom-0 inset-x-0 z-30 px-2 sm:px-3 pt-1 pb-[max(2px,env(safe-area-inset-bottom,2px))] bg-[#0e1621] border-t border-white/5">
        <div className="max-w-3xl mx-auto relative group">
          
          {files.length > 0 && (
            <div className="mb-2 flex flex-wrap gap-2">
              {files.map((file, i) => (
                <div key={i} className="flex items-center gap-2 bg-[#2a2a38] text-white px-3 py-1.5 rounded-xl text-xs">
                  <span className="truncate max-w-[120px]">{file.name}</span>
                  <button onClick={() => setFiles(f => f.filter((_, idx) => idx !== i))} className="text-gray-400 hover:text-white cursor-pointer"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg></button>
                </div>
              ))}
            </div>
          )}
          
          <div className="relative flex items-end gap-1.5 bg-[#17212b] border border-[#242f3d] rounded-2xl p-1.5 shadow-lg transition-all focus-within:border-[#2481cc]/60 focus-within:ring-1 focus-within:ring-[#2481cc]/30">
            {/* Left corner: Media button */}
            <label className="p-2.5 text-gray-400 hover:text-[#2481cc] transition-colors cursor-pointer rounded-full hover:bg-[#1a1a24] mb-0.5 ml-0.5 shrink-0" title="Галерея и медиа">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect><circle cx="8.5" cy="8.5" r="1.5"></circle><polyline points="21 15 16 10 5 21"></polyline></svg>
              <input type="file" accept="image/*,video/*" multiple className="hidden" onChange={handleFileChange} />
            </label>

            {/* Extra tools appear when typing */}
            {input.trim().length > 0 && (
              <label className="p-2.5 text-gray-400 hover:text-blue-400 transition-colors cursor-pointer rounded-full hover:bg-[#1a1a24] mb-0.5 shrink-0 animate-fade-in" title="Прикрепить любой файл">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21.44 11.05l-9.19 9.19a6 6 0 0 1-8.49-8.49l9.19-9.19a4 4 0 0 1 5.66 5.66l-9.2 9.19a2 2 0 0 1-2.83-2.83l8.49-8.48"></path></svg>
                <input type="file" multiple className="hidden" onChange={handleFileChange} />
              </label>
            )}

            <textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder={strings.aiPromptPlaceholder || "Спросить ИИ ассистента..."}
              className="flex-1 bg-transparent text-gray-200 py-3 px-3 resize-none focus:outline-none max-h-32 min-h-[52px] text-[15px] placeholder-gray-500 font-sans"
              rows={1}
            />

            {/* Right corner: When empty, audio/video buttons. When typing, send button. */}
            {!input.trim() ? (
              <div className="flex items-center gap-0.5 mb-0.5 mr-0.5 shrink-0">
                <button
                  type="button"
                  onClick={() => triggerHaptic("light")}
                  className="p-2.5 rounded-full text-gray-400 hover:text-indigo-400 hover:bg-[#1a1a24] transition-all cursor-pointer"
                  title="Голосовое сообщение"
                >
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 2a3 3 0 0 0-3 3v7a3 3 0 0 0 6 0V5a3 3 0 0 0-3-3Z"></path><path d="M19 10v2a7 7 0 0 1-14 0v-2"></path><line x1="12" x2="12" y1="19" y2="22"></line></svg>
                </button>
                <button
                  type="button"
                  onClick={() => triggerHaptic("light")}
                  className="p-2.5 rounded-full text-gray-400 hover:text-cyan-400 hover:bg-[#1a1a24] transition-all cursor-pointer"
                  title="Видео-кружочек"
                >
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polygon points="23 7 16 12 23 17 23 7"></polygon><rect x="1" y="5" width="15" height="14" rx="2" ry="2"></rect></svg>
                </button>
              </div>
            ) : (
              <button 
                onClick={handleSend}
                disabled={!input.trim() || isTyping}
                className="p-3 mb-0.5 mr-0.5 rounded-xl bg-[#2481cc] hover:bg-[#288ddf] text-white transition-all disabled:opacity-50 disabled:hover:bg-[#2481cc] flex items-center justify-center shadow-md cursor-pointer active:scale-95 shrink-0 animate-fade-in"
                title="Отправить"
              >
                <Send className="w-4 h-4" />
              </button>
            )}
          </div>
          <div className="text-center mt-2">
            <span className="text-[10px] text-gray-500">
              {aiSettings.provider === "openai" ? `Model: ChatGPT (${aiSettings.openaiModel})` : aiSettings.provider === "gemini" ? `Model: Gemini (${aiSettings.geminiModel})` : "Model: Nexus AI (gemini-2.5-flash) • Встроенный"}
            </span>
          </div>
        </div>
      </div>

      {/* AI Settings Modal */}
      <AiSettingsModal
        isOpen={showSettingsModal}
        onClose={() => setShowSettingsModal(false)}
      />
    </div>
  );
}
