import { useState, useMemo, useEffect, useRef } from "react";
import {
  ChevronLeft,
  Search,
  MoreVertical,
  FileText,
  Music,
  Mic,
  Film,
  Link as LinkIcon,
  Image as ImageIcon,
  MessageSquare,
  CheckCircle2,
  Star,
  Play,
  Download,
  Sparkles,
  RefreshCw,
  Send,
  ExternalLink,
  Copy,
  Check,
  Tag,
  ArrowRight,
} from "lucide-react";
import { getOptimizedMediaUrl } from "../utils/ecoStream";
import { triggerHaptic } from "../utils/haptics";

export interface SavedChatGroup {
  id: string;
  title: string;
  avatarBg?: string;
  avatarIcon?: string;
  messages: any[];
  lastMessage: string;
  lastTime: string;
  lastTimestamp: number;
}

export interface AiTopic {
  id: string;
  title: string;
  icon: string;
  description: string;
  keywords?: string[];
  messageIds: (number | string)[];
  count: number;
}

export function SavedMessagesProfileView({
  onClose,
  onSelectChatSource,
  messages = [],
}: {
  onClose: () => void;
  onSelectChatSource?: (sourceTitle: string) => void;
  messages?: any[];
}) {
  const [activeTab, setActiveTab] = useState<"chats" | "ai" | "media" | "files" | "music" | "voice">("chats");
  const [searchQuery, setSearchQuery] = useState("");
  const [isSearching, setIsSearching] = useState(false);

  // Active chat view inside dialog (when user taps on a chat source or an AI topic)
  const [activeConversation, setActiveConversation] = useState<{
    title: string;
    subtitle: string;
    messages: any[];
    icon?: string;
    avatarBg?: string;
  } | null>(null);

  // AI Section state
  const [aiTopics, setAiTopics] = useState<AiTopic[]>([]);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [aiSearchQuery, setAiSearchQuery] = useState("");
  const [isAiSearching, setIsAiSearching] = useState(false);
  const [aiSearchResults, setAiSearchResults] = useState<Array<{
    messageId: number | string;
    relevanceScore: number;
    explanation: string;
    message?: any;
  }>>([]);
  const [copiedId, setCopiedId] = useState<string | number | null>(null);

  // Real grouping of messages:
  // Separates messages by the chats they were forwarded from, and user's direct messages into "Мои заметки"
  const chatGroups = useMemo(() => {
    const groupsMap = new Map<string, SavedChatGroup>();

    // Initial "Мои заметки" group
    groupsMap.set("my_notes", {
      id: "my_notes",
      title: "Мои заметки",
      avatarBg: "bg-[#2481cc]",
      avatarIcon: "note",
      messages: [],
      lastMessage: "Нет заметок",
      lastTime: "Сегодня",
      lastTimestamp: 0,
    });

    const colors = [
      "bg-[#2481cc]",
      "bg-[#818cf8]",
      "bg-[#4ade80]",
      "bg-[#f59e0b]",
      "bg-[#ec4899]",
      "bg-[#14b8a6]",
      "bg-[#8b5cf6]",
      "bg-[#ef4444]",
    ];

    if (Array.isArray(messages) && messages.length > 0) {
      messages.forEach((msg) => {
        let sourceTitle = "";
        let isForwarded = false;

        if (msg.fwdFrom?.name && msg.fwdFrom.name !== "Unknown") {
          sourceTitle = msg.fwdFrom.name;
          isForwarded = true;
        } else if (msg.fwdFrom?.title) {
          sourceTitle = msg.fwdFrom.title;
          isForwarded = true;
        } else if (msg.forwardHeader?.chatName) {
          sourceTitle = msg.forwardHeader.chatName;
          isForwarded = true;
        } else if (msg.forwardHeader?.senderName) {
          sourceTitle = msg.forwardHeader.senderName;
          isForwarded = true;
        } else if (msg.fwd_from?.from_name) {
          sourceTitle = msg.fwd_from.from_name;
          isForwarded = true;
        } else if (msg.fwd_from?.title) {
          sourceTitle = msg.fwd_from.title;
          isForwarded = true;
        } else if (msg.forwardFromChat?.title) {
          sourceTitle = msg.forwardFromChat.title;
          isForwarded = true;
        } else if (msg.senderName && msg.senderName !== "You" && msg.senderName !== "Вы") {
          sourceTitle = msg.senderName;
          isForwarded = true;
        }

        const key = isForwarded && sourceTitle.trim() ? `chat_${sourceTitle.trim()}` : "my_notes";
        const title = isForwarded && sourceTitle.trim() ? sourceTitle.trim() : "Мои заметки";

        if (!groupsMap.has(key)) {
          let hash = 0;
          for (let i = 0; i < title.length; i++) hash = title.charCodeAt(i) + ((hash << 5) - hash);
          const bg = colors[Math.abs(hash) % colors.length];

          groupsMap.set(key, {
            id: key,
            title,
            avatarBg: key === "my_notes" ? "bg-[#2481cc]" : bg,
            avatarIcon: key === "my_notes" ? "note" : undefined,
            messages: [],
            lastMessage: "",
            lastTime: "",
            lastTimestamp: 0,
          });
        }

        const group = groupsMap.get(key)!;
        group.messages.push(msg);

        const msgTimestamp = msg.date
          ? (typeof msg.date === "number" ? msg.date * 1000 : new Date(msg.date).getTime())
          : Date.now();

        if (msgTimestamp >= group.lastTimestamp) {
          group.lastTimestamp = msgTimestamp;
          group.lastMessage = msg.text || (msg.media ? "[Медиафайл]" : "Сообщение");
          group.lastTime = new Date(msgTimestamp).toLocaleDateString([], { month: "2-digit", day: "2-digit" });
        }
      });
    }

    const list = Array.from(groupsMap.values());
    // If only empty my_notes exists, add helpful sample notes
    const notesGroup = list.find((g) => g.id === "my_notes");
    if (notesGroup && notesGroup.messages.length === 0) {
      notesGroup.lastMessage = "Личные заметки, мысли и ссылки";
    }

    // Sort by latest message date descending
    return list.sort((a, b) => b.lastTimestamp - a.lastTimestamp);
  }, [messages]);

  const filteredChats = useMemo(() => {
    if (!searchQuery.trim()) return chatGroups;
    const q = searchQuery.toLowerCase();
    return chatGroups.filter(
      (c) => c.title.toLowerCase().includes(q) || c.lastMessage.toLowerCase().includes(q)
    );
  }, [chatGroups, searchQuery]);

  // Load cached AI topics from server user file on mount
  useEffect(() => {
    fetch("/api/telegram/saved-messages/topics")
      .then((res) => res.json())
      .then((data) => {
        if (data.success && Array.isArray(data.topics) && data.topics.length > 0) {
          setAiTopics(data.topics);
        }
      })
      .catch((e) => console.warn("Could not load cached AI topics:", e));
  }, []);

  // Trigger AI topic analysis
  const runAiAnalysis = async (forceRefresh = false) => {
    if (messages.length === 0) return;
    setIsAnalyzing(true);
    triggerHaptic("medium");
    try {
      const res = await fetch("/api/telegram/saved-messages/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: messages.slice(-300),
          forceRefresh,
        }),
      });
      const data = await res.json();
      if (data.success && Array.isArray(data.topics)) {
        setAiTopics(data.topics);
        triggerHaptic("success");
      }
    } catch (err) {
      console.error("AI analysis error:", err);
    } finally {
      setIsAnalyzing(false);
    }
  };

  // Perform AI Semantic Search
  const handleAiSearch = async () => {
    if (!aiSearchQuery.trim()) return;
    setIsAiSearching(true);
    triggerHaptic("light");
    try {
      const res = await fetch("/api/telegram/saved-messages/search", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          query: aiSearchQuery.trim(),
          messages: messages.slice(-250),
        }),
      });
      const data = await res.json();
      if (data.success && Array.isArray(data.matches)) {
        // Hydrate matches with full message object
        const hydrated = data.matches.map((m: any) => ({
          ...m,
          message: messages.find((msg) => String(msg.id) === String(m.messageId)),
        }));
        setAiSearchResults(hydrated);
        triggerHaptic("success");
      }
    } catch (err) {
      console.error("AI search error:", err);
    } finally {
      setIsAiSearching(false);
    }
  };

  // Semantic categorization engine for Saved Messages:
  // Automatically digs through every single message in the chat and puts it into its proper themed chat
  const computedAiChats = useMemo(() => {
    const categoriesConfig: Record<string, { title: string; icon: string; desc: string; bg: string; regex?: RegExp; check?: (m: any) => boolean }> = {
      gifts: {
        title: "🎁 Подарки",
        icon: "🎁",
        desc: "Подарки, розыгрыши, поздравления и приятные сюрпризы",
        bg: "from-pink-500 to-rose-600",
        regex: /(подар|подаро|gift|present|звезд|star|nft|розыгрыш|бонус|приз|giveaway|праздник|сюрприз)/i,
      },
      crypto: {
        title: "💎 Криптовалюта и TON",
        icon: "💎",
        desc: "TON, криптовалюты, переводы, кошельки и блокчейн",
        bg: "from-blue-600 to-cyan-600",
        regex: /(ton|btc|eth|crypto|крипт|usdt|кошелек|wallet|airdrop|token|токен|бинанс|dex|blockchain)/i,
      },
      dev: {
        title: "💻 Разработка и код",
        icon: "💻",
        desc: "Программирование, GitHub, сниппеты кода, IT-заметки",
        bg: "from-indigo-600 to-violet-700",
        regex: /(github|git|npm|react|python|const |function|let |код |developer|deploy|api|endpoint|docker|bash|linux|typescript|css|html)/i,
      },
      passwords: {
        title: "🔑 Доступы и пароли",
        icon: "🔑",
        desc: "Учетные записи, пароли, ключи, seed-фразы и доступы",
        bg: "from-amber-500 to-orange-600",
        regex: /(парол|password|login|логин|ключ|secret|seed|pin|пин|auth|доступ|token)/i,
      },
      music: {
        title: "🎵 Музыка и аудио",
        icon: "🎵",
        desc: "Любимые треки, аудиофайлы, подкасты и голосовые записи",
        bg: "from-purple-600 to-pink-600",
        check: (m) => m.mimeType?.startsWith("audio/") || m.mediaType === "audio" || m.mediaType === "voice" || /(музык|песн|трек|mp3|sound|music|song|слушать|плейлист)/i.test(m.text || ""),
      },
      media: {
        title: "📸 Фото и медиа",
        icon: "📸",
        desc: "Сохраненные фотографии, скриншоты, видео и медиафайлы",
        bg: "from-teal-500 to-emerald-600",
        check: (m) => (m.media && (m.mediaType === "photo" || m.mediaType === "video" || m.mimeType?.startsWith("image/") || m.mimeType?.startsWith("video/"))) || /(фото|картинк|видео|мем|снимок)/i.test(m.text || ""),
      },
      shopping: {
        title: "🛒 Покупки и заказы",
        icon: "🛒",
        desc: "Товары, чеки, ссылки на покупки, маркетплейсы",
        bg: "from-orange-500 to-amber-600",
        regex: /(купить|заказ|цена|руб|usd|eur|shop|ozon|wb|wildberries|доставк|алиэкспресс|скидк|покупк)/i,
      },
      links: {
        title: "🔗 Полезные ссылки",
        icon: "🔗",
        desc: "Закладки, статьи, сайты и веб-ресурсы",
        bg: "from-sky-500 to-blue-600",
        check: (m) => /https?:\/\//i.test(m.text || "") || /(стать|новост|сайт|ссылк)/i.test(m.text || ""),
      },
      work: {
        title: "💼 Работа и задачи",
        icon: "💼",
        desc: "Деловые вопросы, проекты, отчеты, встречи",
        bg: "from-blue-700 to-indigo-800",
        regex: /(работа|задач|встреч|дедлайн|клиент|проект|отчет|звонок|договор|резюме)/i,
      },
      notes: {
        title: "💡 Заметки и идеи",
        icon: "💡",
        desc: "Личные мысли, черновики, идеи и вдохновение",
        bg: "from-yellow-500 to-amber-600",
      },
    };

    const buckets: Record<string, any[]> = {};
    Object.keys(categoriesConfig).forEach((k) => (buckets[k] = []));

    messages.forEach((m) => {
      const txt = m.text || "";
      let matched = false;

      for (const [key, cfg] of Object.entries(categoriesConfig)) {
        if (key === "notes") continue; // notes is default
        if (cfg.check && cfg.check(m)) {
          buckets[key].push(m);
          matched = true;
          break;
        }
        if (cfg.regex && cfg.regex.test(txt)) {
          buckets[key].push(m);
          matched = true;
          break;
        }
      }

      if (!matched) {
        buckets.notes.push(m);
      }
    });

    // Merge any additional AI topics from server if available
    const resultChats = Object.entries(categoriesConfig)
      .map(([key, cfg]) => {
        const msgs = buckets[key] || [];
        const serverTopic = aiTopics.find((t) => t.id === `topic_${key}` || t.title.toLowerCase().includes(cfg.title.toLowerCase()));
        
        let allMsgs = msgs;
        if (serverTopic && Array.isArray(serverTopic.messageIds)) {
          const serverMsgs = messages.filter((m) => serverTopic.messageIds.some((id) => String(id) === String(m.id)));
          const map = new Map<string, any>();
          [...allMsgs, ...serverMsgs].forEach((m) => map.set(String(m.id), m));
          allMsgs = Array.from(map.values());
        }

        const lastMsg = allMsgs[allMsgs.length - 1];
        const lastTimestamp = lastMsg?.date
          ? (typeof lastMsg.date === "number" ? lastMsg.date * 1000 : new Date(lastMsg.date).getTime())
          : 0;

        return {
          id: `ai_chat_${key}`,
          title: cfg.title,
          icon: cfg.icon,
          description: cfg.desc,
          bg: cfg.bg,
          messages: allMsgs,
          lastMessage: lastMsg?.text || (lastMsg?.media ? "[Медиа]" : cfg.desc),
          lastTime: lastTimestamp ? new Date(lastTimestamp).toLocaleDateString([], { month: "2-digit", day: "2-digit" }) : "",
          lastTimestamp,
        };
      })
      .filter((c) => c.messages.length > 0 || c.id === "ai_chat_gifts" || c.id === "ai_chat_notes")
      .sort((a, b) => b.lastTimestamp - a.lastTimestamp);

    return resultChats;
  }, [messages, aiTopics]);
  const mediaItems = useMemo(() => {
    return messages.filter(
      (m) =>
        m.media &&
        (m.mimeType?.startsWith("image/") ||
          m.mimeType?.startsWith("video/") ||
          m.mediaType === "photo" ||
          m.mediaType === "video")
    );
  }, [messages]);

  const fileItems = useMemo(() => {
    return messages.filter(
      (m) =>
        m.media &&
        m.mediaType === "document" &&
        !m.mimeType?.startsWith("audio/") &&
        !m.mimeType?.startsWith("video/")
    );
  }, [messages]);

  const musicItems = useMemo(() => {
    return messages.filter(
      (m) => m.mimeType?.startsWith("audio/") || m.mediaType === "audio"
    );
  }, [messages]);

  const voiceItems = useMemo(() => {
    return messages.filter(
      (m) => m.mimeType?.includes("ogg") || m.mediaType === "voice"
    );
  }, [messages]);

  const handleCopyText = (text: string, id: string | number) => {
    if (!text) return;
    navigator.clipboard?.writeText(text);
    setCopiedId(id);
    triggerHaptic("light");
    setTimeout(() => setCopiedId(null), 1500);
  };

  // ----------------------------------------------------
  // SUB-VIEW: Render gathered messages as a full Chat
  // ----------------------------------------------------
  if (activeConversation) {
    return (
      <div className="fixed inset-0 z-[100] bg-[#0e1621] text-white flex flex-col animate-in fade-in duration-150">
        {/* Chat Header */}
        <div className="flex items-center justify-between px-3 py-2.5 border-b border-white/5 bg-[#17212b] sticky top-0 z-10 shadow-sm">
          <button
            onClick={() => {
              triggerHaptic("light");
              setActiveConversation(null);
            }}
            className="flex items-center gap-1 text-[#2481cc] hover:text-[#3894e0] active:scale-95 transition-all cursor-pointer font-medium text-sm py-1 pr-2"
          >
            <ChevronLeft className="w-6 h-6 stroke-[2.5]" />
            <span>Назад</span>
          </button>

          <div className="flex flex-col items-center flex-1 mx-2 min-w-0">
            <div className="flex items-center gap-1.5 max-w-full">
              {activeConversation.icon && (
                <span className="text-base">{activeConversation.icon}</span>
              )}
              <h2 className="text-sm font-semibold text-white truncate text-center">
                {activeConversation.title}
              </h2>
            </div>
            <span className="text-[11px] text-gray-400 font-normal">
              {activeConversation.subtitle}
            </span>
          </div>

          <div className="w-16 flex justify-end">
            <button
              onClick={() => {
                triggerHaptic("light");
                if (onSelectChatSource) onSelectChatSource(activeConversation.title);
                onClose();
              }}
              className="p-1.5 rounded-full hover:bg-white/10 text-gray-300 hover:text-white transition-colors"
              title="Открыть в чате"
            >
              <ExternalLink className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Chat Messages Flow */}
        <div className="flex-1 overflow-y-auto p-3 space-y-3 bg-[#0e1621]">
          {activeConversation.messages.length === 0 ? (
            <div className="py-24 text-center text-gray-400">
              <MessageSquare className="w-12 h-12 mx-auto mb-3 opacity-30 text-[#2481cc]" />
              <p className="text-sm font-medium">В этой подборке пока нет сообщений</p>
            </div>
          ) : (
            activeConversation.messages.map((msg, index) => {
              const msgDate = msg.date
                ? new Date(typeof msg.date === "number" ? msg.date * 1000 : msg.date).toLocaleTimeString([], {
                    hour: "2-digit",
                    minute: "2-digit",
                  })
                : "";

              return (
                <div key={msg.id || index} className="flex flex-col max-w-[85%] sm:max-w-[70%] mr-auto">
                  <div className="bg-[#182533] border border-white/5 rounded-2xl rounded-tl-sm p-3 shadow-md relative group text-left">
                    {/* Forward Header */}
                    {msg.forwardHeader && (
                      <div className="mb-1.5 pb-1.5 border-b border-white/10 text-xs text-[#2481cc] font-medium flex items-center gap-1">
                        <span>Переслано из:</span>
                        <span className="font-semibold text-white">
                          {msg.forwardHeader.chatName || msg.forwardHeader.senderName}
                        </span>
                      </div>
                    )}

                    {/* Media Thumbnail */}
                    {msg.media && (msg.url || msg.mediaType === "photo" || msg.mimeType?.startsWith("image/")) && (
                      <div className="rounded-xl overflow-hidden mb-2 max-h-72 bg-black/40">
                        <img
                          src={getOptimizedMediaUrl(msg.url || `/api/telegram/media/${msg.chatId || "me"}/${msg.id}`, true)}
                          alt=""
                          className="w-full h-auto object-cover max-h-72"
                          loading="lazy"
                        />
                      </div>
                    )}

                    {/* Message Text */}
                    {msg.text && (
                      <p className="text-[14px] text-gray-100 whitespace-pre-wrap break-words leading-relaxed select-text">
                        {msg.text}
                      </p>
                    )}

                    {/* Audio / Voice Indicator */}
                    {(msg.mimeType?.startsWith("audio/") || msg.mediaType === "audio" || msg.mediaType === "voice") && (
                      <div className="flex items-center gap-2.5 p-2 bg-black/30 rounded-xl mt-1">
                        <div className="w-8 h-8 rounded-full bg-[#2481cc] text-white flex items-center justify-center shrink-0">
                          <Play className="w-4 h-4 ml-0.5" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-xs text-white truncate font-medium">{msg.title || "Аудиозапись"}</p>
                          <p className="text-[10px] text-gray-400">{msg.duration ? `${msg.duration}с` : "Звук"}</p>
                        </div>
                      </div>
                    )}

                    {/* Footer Date & Actions */}
                    <div className="flex items-center justify-between mt-2 pt-1 border-t border-white/5 text-[11px] text-gray-400">
                      <span>{msgDate}</span>
                      <div className="flex items-center gap-1 opacity-80 group-hover:opacity-100 transition-opacity">
                        {msg.text && (
                          <button
                            onClick={() => handleCopyText(msg.text, msg.id)}
                            className="p-1 hover:text-white rounded hover:bg-white/10"
                            title="Скопировать текст"
                          >
                            {copiedId === msg.id ? (
                              <Check className="w-3.5 h-3.5 text-emerald-400" />
                            ) : (
                              <Copy className="w-3.5 h-3.5" />
                            )}
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
    );
  }

  // ----------------------------------------------------
  // MAIN VIEW: Tabs, Source Chats list & AI section
  // ----------------------------------------------------
  return (
    <div className="fixed inset-0 z-[100] bg-[#0e1621] text-white flex flex-col animate-in fade-in duration-150">
      {/* Top Header */}
      <div className="flex items-center justify-between px-3 py-2.5 border-b border-white/5 bg-[#17212b]/90 backdrop-blur-md sticky top-0 z-10">
        <button
          onClick={() => {
            triggerHaptic("light");
            onClose();
          }}
          className="w-10 h-10 rounded-full flex items-center justify-center text-gray-200 hover:text-white hover:bg-white/10 active:scale-95 transition-all cursor-pointer"
          title="Назад"
        >
          <ChevronLeft className="w-7 h-7" />
        </button>

        <div className="flex flex-col items-center flex-1 mx-2">
          <h1 className="text-base font-semibold text-white tracking-tight leading-tight">
            Избранное
          </h1>
          <span className="text-[12px] text-gray-400 font-normal">
            {chatGroups.length} источников • {messages.length} сообщений
          </span>
        </div>

        <div className="flex items-center gap-1">
          <button
            onClick={() => {
              triggerHaptic("light");
              setIsSearching(!isSearching);
            }}
            className={`w-10 h-10 rounded-full flex items-center justify-center transition-all cursor-pointer ${
              isSearching ? "text-[#2481cc] bg-[#2481cc]/15" : "text-gray-300 hover:text-white hover:bg-white/10"
            }`}
            title="Поиск"
          >
            <Search className="w-5 h-5" />
          </button>
          <button
            onClick={() => triggerHaptic("light")}
            className="w-10 h-10 rounded-full flex items-center justify-center text-gray-300 hover:text-white hover:bg-white/10 transition-all cursor-pointer"
            title="Меню"
          >
            <MoreVertical className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Search Bar when toggled */}
      {isSearching && (
        <div className="px-3 py-2 bg-[#17212b] border-b border-white/5 flex items-center gap-2 animate-in slide-in-from-top-2 duration-150">
          <Search className="w-4 h-4 text-gray-400 shrink-0" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Поиск по чатам и сообщениям..."
            autoFocus
            className="flex-1 bg-transparent text-sm text-white placeholder-gray-500 focus:outline-none"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery("")}
              className="text-xs text-gray-400 hover:text-white px-1.5 py-0.5"
            >
              Очистить
            </button>
          )}
        </div>
      )}

      {/* Horizontal Pill Tabs including Нейросеть */}
      <div className="flex items-center gap-2 px-3 py-2.5 overflow-x-auto no-scrollbar border-b border-white/5 bg-[#0e1621] shrink-0">
        <button
          onClick={() => {
            triggerHaptic("light");
            setActiveTab("chats");
          }}
          className={`px-4 py-1.5 rounded-full text-sm font-medium transition-all cursor-pointer shrink-0 ${
            activeTab === "chats"
              ? "bg-white/20 text-white font-semibold shadow-sm"
              : "text-gray-400 hover:text-gray-200 hover:bg-white/5"
          }`}
        >
          Чаты
        </button>

        {/* Нейросеть Tab */}
        <button
          onClick={() => {
            triggerHaptic("light");
            setActiveTab("ai");
            if (aiTopics.length === 0 && !isAnalyzing) {
              runAiAnalysis(false);
            }
          }}
          className={`px-4 py-1.5 rounded-full text-sm font-medium transition-all cursor-pointer shrink-0 flex items-center gap-1.5 ${
            activeTab === "ai"
              ? "bg-gradient-to-r from-purple-600 to-indigo-600 text-white font-semibold shadow-md shadow-purple-500/20"
              : "text-purple-300 hover:text-white hover:bg-purple-500/10 border border-purple-500/20"
          }`}
        >
          <Sparkles className="w-3.5 h-3.5 text-purple-300" />
          <span>Нейросеть</span>
        </button>

        <button
          onClick={() => {
            triggerHaptic("light");
            setActiveTab("media");
          }}
          className={`px-4 py-1.5 rounded-full text-sm font-medium transition-all cursor-pointer shrink-0 ${
            activeTab === "media"
              ? "bg-white/20 text-white font-semibold shadow-sm"
              : "text-gray-400 hover:text-gray-200 hover:bg-white/5"
          }`}
        >
          Медиа
        </button>

        <button
          onClick={() => {
            triggerHaptic("light");
            setActiveTab("files");
          }}
          className={`px-4 py-1.5 rounded-full text-sm font-medium transition-all cursor-pointer shrink-0 ${
            activeTab === "files"
              ? "bg-white/20 text-white font-semibold shadow-sm"
              : "text-gray-400 hover:text-gray-200 hover:bg-white/5"
          }`}
        >
          Файлы
        </button>

        <button
          onClick={() => {
            triggerHaptic("light");
            setActiveTab("music");
          }}
          className={`px-4 py-1.5 rounded-full text-sm font-medium transition-all cursor-pointer shrink-0 ${
            activeTab === "music"
              ? "bg-white/20 text-white font-semibold shadow-sm"
              : "text-gray-400 hover:text-gray-200 hover:bg-white/5"
          }`}
        >
          Музыка
        </button>

        <button
          onClick={() => {
            triggerHaptic("light");
            setActiveTab("voice");
          }}
          className={`px-4 py-1.5 rounded-full text-sm font-medium transition-all cursor-pointer shrink-0 ${
            activeTab === "voice"
              ? "bg-white/20 text-white font-semibold shadow-sm"
              : "text-gray-400 hover:text-gray-200 hover:bg-white/5"
          }`}
        >
          Голосовые
        </button>
      </div>

      {/* Content Body */}
      <div className="flex-1 overflow-y-auto">
        {/* 1. Chats Tab: Grouped by Forward Source & "Мои заметки" */}
        {activeTab === "chats" && (
          <div className="divide-y divide-white/5">
            {filteredChats.map((group) => (
              <div
                key={group.id}
                onClick={() => {
                  triggerHaptic("light");
                  setActiveConversation({
                    title: group.title,
                    subtitle: `${group.messages.length} сообщений`,
                    messages: group.messages,
                    avatarBg: group.avatarBg,
                    icon: group.avatarIcon === "note" ? "📝" : undefined,
                  });
                }}
                className="flex items-center gap-3.5 px-4 py-3 hover:bg-white/5 active:bg-white/10 transition-colors cursor-pointer group"
              >
                {/* Avatar */}
                <div className="relative shrink-0">
                  <div
                    className={`w-13 h-13 rounded-full flex items-center justify-center overflow-hidden text-white font-bold text-lg shadow-md ${
                      group.avatarBg || "bg-[#2481cc]"
                    }`}
                  >
                    {group.avatarIcon === "note" ? (
                      <FileText className="w-6 h-6 text-white" />
                    ) : (
                      <span>{group.title.charAt(0).toUpperCase()}</span>
                    )}
                  </div>
                </div>

                {/* Info Text */}
                <div className="flex-1 min-w-0 pr-1">
                  <div className="flex items-center justify-between gap-1 mb-0.5">
                    <h3 className="text-[15px] font-semibold text-gray-100 truncate group-hover:text-white">
                      {group.title}
                    </h3>
                    <span className="text-[12px] text-gray-400 shrink-0 font-normal">
                      {group.lastTime}
                    </span>
                  </div>

                  <div className="flex items-center justify-between gap-2">
                    <p className="text-[13px] text-gray-400 truncate leading-snug">
                      {group.lastMessage}
                    </p>
                    {group.messages.length > 0 && (
                      <span className="px-2 py-0.5 rounded-full text-[11px] font-semibold bg-[#2481cc]/20 text-[#2481cc] border border-[#2481cc]/30 shrink-0">
                        {group.messages.length}
                      </span>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* 2. Нейросеть Tab: AI Topic Clustering & Semantic Search */}
        {activeTab === "ai" && (
          <div className="p-4 space-y-5">
            {/* Header banner with trigger */}
            <div className="bg-gradient-to-r from-purple-900/30 via-indigo-900/30 to-blue-900/20 border border-purple-500/25 rounded-2xl p-4 shadow-lg">
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-center gap-2.5">
                  <div className="w-10 h-10 rounded-xl bg-purple-500/20 text-purple-300 flex items-center justify-center shrink-0 shadow-inner">
                    <Sparkles className="w-5 h-5 text-purple-400" />
                  </div>
                  <div>
                    <h3 className="text-sm font-semibold text-white flex items-center gap-1.5">
                      <span>ИИ-Кластеризация Избранного</span>
                    </h3>
                    <p className="text-xs text-gray-300 mt-0.5">
                      Нейросеть анализирует смысл всех сообщений и распределяет их по тематикам
                    </p>
                  </div>
                </div>

                <button
                  onClick={() => runAiAnalysis(true)}
                  disabled={isAnalyzing}
                  className="px-3 py-1.5 rounded-xl bg-purple-600 hover:bg-purple-500 text-white text-xs font-medium flex items-center gap-1.5 active:scale-95 transition-all shadow-md shrink-0 disabled:opacity-50"
                  title="Переанализировать с нуля"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${isAnalyzing ? "animate-spin" : ""}`} />
                  <span>{isAnalyzing ? "Анализ..." : "Обновить"}</span>
                </button>
              </div>
            </div>

            {/* AI Thematic Chats List: Every message sorted into its proper chat */}
            <div className="space-y-2">
              <div className="flex items-center justify-between px-1">
                <h4 className="text-xs font-semibold text-gray-400 uppercase tracking-wider">
                  Тематические чаты от нейросети ({computedAiChats.length})
                </h4>
                <span className="text-[11px] text-purple-400 font-medium">
                  Разложено по полочкам
                </span>
              </div>

              <div className="divide-y divide-white/5 bg-[#17212b]/60 rounded-2xl border border-white/5 overflow-hidden">
                {computedAiChats.map((chat) => (
                  <div
                    key={chat.id}
                    onClick={() => {
                      triggerHaptic("light");
                      setActiveConversation({
                        title: chat.title,
                        subtitle: `Нейросеть • ${chat.messages.length} сообщений`,
                        messages: chat.messages,
                        icon: chat.icon,
                      });
                    }}
                    className="flex items-center gap-3.5 px-4 py-3 hover:bg-white/5 active:bg-white/10 transition-colors cursor-pointer group"
                  >
                    {/* Themed Avatar */}
                    <div className="relative shrink-0">
                      <div
                        className={`w-12 h-12 rounded-full flex items-center justify-center text-2xl shadow-md bg-gradient-to-tr ${chat.bg} text-white`}
                      >
                        {chat.icon}
                      </div>
                    </div>

                    {/* Chat Content */}
                    <div className="flex-1 min-w-0 pr-1">
                      <div className="flex items-center justify-between gap-1 mb-0.5">
                        <h3 className="text-[15px] font-semibold text-gray-100 truncate group-hover:text-purple-300 transition-colors">
                          {chat.title}
                        </h3>
                        {chat.lastTime && (
                          <span className="text-[11px] text-gray-400 shrink-0 font-normal">
                            {chat.lastTime}
                          </span>
                        )}
                      </div>

                      <div className="flex items-center justify-between gap-2">
                        <p className="text-[13px] text-gray-400 truncate leading-snug">
                          {chat.lastMessage}
                        </p>
                        <span className="px-2 py-0.5 rounded-full text-[11px] font-semibold bg-purple-500/20 text-purple-300 border border-purple-500/30 shrink-0">
                          {chat.messages.length}
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* AI Semantic Search Results if any */}
            {aiSearchResults.length > 0 && (
              <div className="space-y-2 pt-2 border-t border-white/10">
                <h4 className="text-xs font-semibold text-purple-400 uppercase tracking-wider flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>Результаты семантического поиска ({aiSearchResults.length})</span>
                </h4>

                <div className="space-y-2">
                  {aiSearchResults.map((match, i) => (
                    <div
                      key={i}
                      onClick={() => {
                        if (match.message) {
                          triggerHaptic("light");
                          setActiveConversation({
                            title: `Результат поиска`,
                            subtitle: match.explanation,
                            messages: [match.message],
                          });
                        }
                      }}
                      className="p-3 rounded-xl bg-[#17212b] border border-purple-500/20 hover:border-purple-500/40 cursor-pointer transition-all"
                    >
                      <div className="flex items-center justify-between gap-2 mb-1">
                        <span className="text-xs font-semibold text-purple-300">
                          {match.explanation}
                        </span>
                        <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-purple-500/20 text-purple-300">
                          {Math.round(match.relevanceScore * 100)}% совпадение
                        </span>
                      </div>
                      <p className="text-xs text-gray-300 line-clamp-2">
                        {match.message?.text || "[Вложение]"}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Bottom Semantic Search Input Bar */}
            <div className="pt-2 sticky bottom-0 bg-[#0e1621] pb-2">
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  handleAiSearch();
                }}
                className="flex items-center gap-2 p-1.5 bg-[#17212b] border border-purple-500/30 rounded-2xl shadow-xl focus-within:border-purple-400 transition-colors"
              >
                <Sparkles className="w-4 h-4 text-purple-400 ml-2.5 shrink-0" />
                <input
                  type="text"
                  value={aiSearchQuery}
                  onChange={(e) => setAiSearchQuery(e.target.value)}
                  placeholder="Спросите у нейросети (например: 'ссылки на github' или 'пароли')..."
                  className="flex-1 bg-transparent text-xs text-white placeholder-gray-500 focus:outline-none py-1.5"
                />
                <button
                  type="submit"
                  disabled={isAiSearching || !aiSearchQuery.trim()}
                  className="px-3.5 py-1.5 rounded-xl bg-purple-600 hover:bg-purple-500 text-white text-xs font-semibold flex items-center gap-1 disabled:opacity-40 transition-all cursor-pointer shadow-md shrink-0"
                >
                  {isAiSearching ? (
                    <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                  ) : (
                    <Send className="w-3.5 h-3.5" />
                  )}
                  <span>Найти</span>
                </button>
              </form>
            </div>
          </div>
        )}

        {/* 3. Media Tab */}
        {activeTab === "media" && (
          <div className="p-3">
            {mediaItems.length > 0 ? (
              <div className="grid grid-cols-3 gap-1.5">
                {mediaItems.map((m, idx) => (
                  <div key={idx} className="aspect-square rounded-lg bg-black/40 overflow-hidden relative group">
                    <img
                      src={getOptimizedMediaUrl(m.url || `/api/telegram/media/${m.chatId || "me"}/${m.id}`, true)}
                      alt=""
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                    />
                  </div>
                ))}
              </div>
            ) : (
              <div className="py-20 text-center text-gray-400">
                <ImageIcon className="w-12 h-12 mx-auto mb-3 opacity-30 text-[#2481cc]" />
                <p className="text-sm font-medium">Нет сохраненных фото и видео</p>
              </div>
            )}
          </div>
        )}

        {/* 4. Files Tab */}
        {activeTab === "files" && (
          <div className="p-3 divide-y divide-white/5">
            {fileItems.length > 0 ? (
              fileItems.map((f, idx) => (
                <div key={idx} className="flex items-center gap-3 py-2.5">
                  <div className="w-10 h-10 rounded-xl bg-[#2481cc]/20 text-[#2481cc] flex items-center justify-center">
                    <FileText className="w-5 h-5" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-white truncate">{f.name || f.text || "Документ"}</p>
                    <p className="text-xs text-gray-400">{f.size ? `${(f.size / 1024).toFixed(1)} KB` : "Файл"}</p>
                  </div>
                  <button className="p-2 text-gray-400 hover:text-white rounded-lg hover:bg-white/10">
                    <Download className="w-4 h-4" />
                  </button>
                </div>
              ))
            ) : (
              <div className="py-20 text-center text-gray-400">
                <FileText className="w-12 h-12 mx-auto mb-3 opacity-30 text-[#2481cc]" />
                <p className="text-sm font-medium">Нет сохраненных файлов</p>
              </div>
            )}
          </div>
        )}

        {/* 5. Music Tab */}
        {activeTab === "music" && (
          <div className="p-3 divide-y divide-white/5">
            {musicItems.length > 0 ? (
              musicItems.map((m, idx) => (
                <div key={idx} className="flex items-center gap-3 py-2.5">
                  <div className="w-10 h-10 rounded-xl bg-purple-500/20 text-purple-400 flex items-center justify-center">
                    <Music className="w-5 h-5" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-white truncate">{m.title || m.name || "Аудиозапись"}</p>
                    <p className="text-xs text-gray-400">{m.performer || "Исполнитель неизвестен"}</p>
                  </div>
                  <button className="w-8 h-8 rounded-full bg-[#2481cc] text-white flex items-center justify-center">
                    <Play className="w-4 h-4 ml-0.5" />
                  </button>
                </div>
              ))
            ) : (
              <div className="py-20 text-center text-gray-400">
                <Music className="w-12 h-12 mx-auto mb-3 opacity-30 text-[#2481cc]" />
                <p className="text-sm font-medium">Нет сохраненной музыки</p>
              </div>
            )}
          </div>
        )}

        {/* 6. Voice Tab */}
        {activeTab === "voice" && (
          <div className="p-3 divide-y divide-white/5">
            {voiceItems.length > 0 ? (
              voiceItems.map((v, idx) => (
                <div key={idx} className="flex items-center gap-3 py-2.5">
                  <div className="w-10 h-10 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center">
                    <Mic className="w-5 h-5" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-white truncate">Голосовое сообщение</p>
                    <p className="text-xs text-gray-400">{v.duration ? `${v.duration} сек` : "Аудио"}</p>
                  </div>
                  <button className="w-8 h-8 rounded-full bg-emerald-500 text-white flex items-center justify-center">
                    <Play className="w-4 h-4 ml-0.5" />
                  </button>
                </div>
              ))
            ) : (
              <div className="py-20 text-center text-gray-400">
                <Mic className="w-12 h-12 mx-auto mb-3 opacity-30 text-[#2481cc]" />
                <p className="text-sm font-medium">Нет голосовых сообщений</p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
