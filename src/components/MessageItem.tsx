import { motion, AnimatePresence } from "motion/react";
import { Message } from "../types";
import { Copy, Check, CheckCheck, Edit2, Trash2, File, Play, X, User, Code, Pin, Loader2, Maximize2, Eye, Forward, Volume2, VolumeX, CornerUpLeft, Globe, ShieldCheck, Lock, Send } from "lucide-react";
import { useState, useRef, useEffect, memo } from "react";
import Markdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { Prism as SyntaxHighlighter } from "react-syntax-highlighter";
import { vscDarkPlus } from "react-syntax-highlighter/dist/esm/styles/prism";
import { getCachedTranslation, setCachedTranslation } from "../utils/translationCache";
import { triggerHaptic } from "../utils/haptics";
import { getOptimizedMediaUrl } from "../utils/ecoStream";
import { TelegramSticker } from "./TelegramSticker";
import { MessageReadInfoModal } from "./MessageReadInfoModal";
import { 
  isNexusBlockMessage, 
  decryptAndVerifyBlockData, 
  getCachedDecryptedMessage, 
  setCachedDecryptedMessage,
  NexusBlockData,
  DecryptedMessagePayload
} from "../utils/nexusBlockchain";


interface MessageItemProps {
  message: Message;
  key?: string | number;
  onDelete?: (id: string) => void;
  onEdit?: (id: string, newText: string) => void;
  onReply?: (id: string) => void;
  onPin?: (id: string) => void;
  onSelect?: (id: string) => void;
  isSelectMode?: boolean;
  isSelected?: boolean;
  searchQuery?: string;
  isPinned?: boolean;
  onSelectUser?: (userId: string, userName: string) => void;
  isChannel?: boolean;
  isContact?: boolean;
  translationLanguage?: string | null;
}

function MessageItemComponent({ 
  message, 
  onDelete, 
  onEdit, 
  onReply, 
  onPin, 
  onSelect,
  isSelectMode = false,
  isSelected = false,
  searchQuery = "", 
  isPinned = false, 
  onSelectUser,
  isChannel = false,
  isContact = false,
  translationLanguage = null
}: MessageItemProps) {
  const isUser = message.role === "user";
  const [copied, setCopied] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editText, setEditText] = useState(message.text);
  const [showActions, setShowActions] = useState(false);
  const [menuPosition, setMenuPosition] = useState<'above' | 'below'>('below');
  const [reactions, setReactions] = useState(message.reactions || []);
  const bubbleRef = useRef<HTMLDivElement>(null);
  const reactionHoldTimerRef = useRef<number | null>(null);
  const isReactionHeldRef = useRef<boolean>(false);

  const handleReactionPressStart = (emoticon: string) => {
    isReactionHeldRef.current = false;
    if (reactionHoldTimerRef.current) clearTimeout(reactionHoldTimerRef.current);
    reactionHoldTimerRef.current = window.setTimeout(() => {
      isReactionHeldRef.current = true;
      triggerHaptic("heavy");
      setShowActions(false);
      window.dispatchEvent(
        new CustomEvent("open-reaction-details", {
          detail: {
            messageId: message.id,
            chatId: (message as any).chatId || (window as any).__activeChatId || (typeof sessionStorage !== "undefined" ? sessionStorage.getItem("nexus_active_chat_id") : undefined),
            reactions,
            initialEmoji: emoticon,
          },
        })
      );
    }, 350);
  };

  const handleReactionPressEnd = () => {
    if (reactionHoldTimerRef.current) {
      clearTimeout(reactionHoldTimerRef.current);
      reactionHoldTimerRef.current = null;
    }
  };

  useEffect(() => {
    setReactions(message.reactions || []);
  }, [message.reactions]);

  const openActionsMenu = () => {
    if (bubbleRef.current) {
      const rect = bubbleRef.current.getBoundingClientRect();
      const spaceBelow = window.innerHeight - rect.bottom;
      if (spaceBelow < 280 && rect.top > 280) {
        setMenuPosition('above');
      } else {
        setMenuPosition('below');
      }
    }
    window.dispatchEvent(new CustomEvent('close-message-actions', { detail: { id: message.id } }));
    setShowActions(true);
  };

  const isSticker = Boolean(
    message.isSticker || 
    message.isAnimatedSticker || 
    message.mimeType === 'application/x-tgsticker' || 
    (message.mimeType === 'image/webp' && !message.text && !message.groupedItems)
  );
  const isPureMedia = Boolean(
    (message.media || message.mediaType || (message as any).fileName) &&
    (!message.text || !message.text.trim()) &&
    !message.fwdFrom &&
    !message.replyToMsgId
  );
  const hasHeader = Boolean(message.fwdFrom || (!isUser && message.senderName) || message.replyToMsgId);
  const [isMarkdownMode, setIsMarkdownMode] = useState(true);
  const [transcription, setTranscription] = useState<string | null>(null);
  const [transcribing, setTranscribing] = useState(false);
  const [showAsAudio, setShowAsAudio] = useState(false);
  const [translatedText, setTranslatedText] = useState<string | null>(null);
  const [translationLoading, setTranslationLoading] = useState(false);
  const [selectedLang, setSelectedLang] = useState<string | null>(null);
  const [showLangPicker, setShowLangPicker] = useState(false);
  const [lastClickTime, setLastClickTime] = useState(0);
  const [videoCircleExpanded, setVideoCircleExpanded] = useState(false);
  const [videoCircleMuted, setVideoCircleMuted] = useState(true);
  const [videoMuted, setVideoMuted] = useState(true);
  const [bursts, setBursts] = useState<{ id: string; emoji: string; tx: number; ty: number }[]>([]);
  const [showLangPickerActions, setShowLangPickerActions] = useState(false);

  // Message indicators style customization: "corner-float" | "top-side" | "bottom-inline" | "side-vertical"
  const [indicatorStyle, setIndicatorStyle] = useState<"corner-float" | "top-side" | "bottom-inline" | "side-vertical">(() => {
    return (localStorage.getItem("nexus_message_indicators_style") as any) || "corner-float";
  });

  const [showReadInfoModal, setShowReadInfoModal] = useState(false);
  const bubbleHoldTimerRef = useRef<number | null>(null);
  const isBubbleHoldTriggeredRef = useRef(false);

  useEffect(() => {
    const handleCustomizationChange = (e: any) => {
      if (e.detail?.key === "messageIndicatorsStyle") {
        setIndicatorStyle(e.detail.value);
      } else {
        const saved = (localStorage.getItem("nexus_message_indicators_style") as any) || "corner-float";
        setIndicatorStyle(saved);
      }
    };
    window.addEventListener("nexus-customization-changed", handleCustomizationChange);
    return () => window.removeEventListener("nexus-customization-changed", handleCustomizationChange);
  }, []);

  // Nexus Blockchain Vault decryption state
  const [decryptedBlock, setDecryptedBlock] = useState<{
    block: NexusBlockData;
    payload: DecryptedMessagePayload;
    isValid: boolean;
  } | null>(() => getCachedDecryptedMessage(message.id));
  const [decrypting, setDecrypting] = useState(false);
  const [decryptError, setDecryptError] = useState<string | null>(null);

  useEffect(() => {
    const isNexus = isNexusBlockMessage({
      fileName: (message as any).fileName || message.text,
      text: message.text,
      mimeType: message.mimeType,
      media: message.media,
    });

    if (isNexus && !decryptedBlock && !decrypting) {
      const cached = getCachedDecryptedMessage(message.id);
      if (cached) {
        setDecryptedBlock(cached);
        return;
      }

      setDecrypting(true);
      setDecryptError(null);
      (async () => {
        try {
          let rawData: string | ArrayBuffer = "";
          if (message.text && (message.text.startsWith("🔒 NX1:") || message.text.startsWith("NX1:") || message.text.startsWith("NXBLKC1\n"))) {
            rawData = message.text;
          } else if (message.chatId) {
            const res = await fetch(`/api/telegram/media/${message.chatId}/${message.id}`);
            if (!res.ok) throw new Error(`HTTP ${res.status}`);
            rawData = await res.arrayBuffer();
          }

          const result = await decryptAndVerifyBlockData(rawData);
          setCachedDecryptedMessage(message.id, result.payload, result.block);
          setDecryptedBlock(result);
        } catch (err: any) {
          console.warn("Nexus block decrypt notice:", err?.message || err);
          setDecryptError(err?.message || "Invalid or missing master key");
        } finally {
          setDecrypting(false);
        }
      })();
    }
  }, [message.id, message.text, message.mimeType, message.chatId]);

  const getFormattedVidDuration = (msgId: string) => {
    const numId = parseInt(msgId.replace(/\D/g, "") || "45") || 45;
    const secs = (numId % 40) + 12;
    const minutes = Math.floor(secs / 60);
    const remSeconds = secs % 60;
    return `${minutes}:${remSeconds.toString().padStart(2, '0')}`;
  };

  const getFormattedVidSize = (msgId: string) => {
    const numId = parseInt(msgId.replace(/\D/g, "") || "1200") || 1200;
    const sizeKB = (numId % 8000) + 1200;
    if (sizeKB > 1024) {
      return `${(sizeKB / 1024).toFixed(1)} MB (${sizeKB} KB)`;
    }
    return `${sizeKB} KB`;
  };

  const [touchStartX, setTouchStartX] = useState<number | null>(null);
  const [touchTranslation, setTouchTranslation] = useState<number>(0);
  const [isSwipingActive, setIsSwipingActive] = useState<boolean>(false);

  const handleTouchStart = (e: React.TouchEvent) => {
    setTouchStartX(e.touches[0].clientX);
    setIsSwipingActive(true);
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (touchStartX === null) return;
    const currentX = e.touches[0].clientX;
    const diff = currentX - touchStartX;
    if (diff < 0) {
      const translation = Math.max(-85, diff);
      setTouchTranslation(translation);
    }
  };

  const handleTouchEnd = () => {
    if (touchTranslation <= -55) {
      if (isChannel) {
        window.dispatchEvent(new CustomEvent('forward-to-contact-request', { 
          detail: { 
            messageId: message.id, 
            text: message.text || "[Вложение]"
          } 
        }));
        triggerHaptic("swipe");
      } else {
        if (onReply) {
          onReply(message.id);
          triggerHaptic("swipe");
        }
      }
    }
    setTouchTranslation(0);
    setTouchStartX(null);
    setIsSwipingActive(false);
  };

  const getLanguageName = (code: string | null) => {
    if (!code) return "";
    const names: Record<string, string> = {
      ru: "Русский",
      en: "English",
      es: "Español",
      zh: "中文",
      de: "Deutsch",
      fr: "Français",
      it: "Italiano"
    };
    return names[code] || code;
  };

  const handleTranslate = (langCode?: string) => {
    const finalLanguage = langCode || translationLanguage || localStorage.getItem("nexus_lang") || "ru";
    if (!finalLanguage || !message.text) return;

    setSelectedLang(finalLanguage);

    // Instant lookup from persistent client cache for maximum speed
    const cached = getCachedTranslation(finalLanguage, message.text);
    if (cached) {
      setTranslatedText(cached);
      setTranslationLoading(false);
      triggerHaptic("light");
      return;
    }

    setTranslationLoading(true);
    fetch("/api/telegram/translate", {
      headers: {
        "Content-Type": "application/json",
        "x-gemini-key": localStorage.getItem("nexus_ai_api_key") || ""
      },
      method: "POST",
      body: JSON.stringify({
        text: message.text,
        targetLanguage: finalLanguage
      })
    })
      .then((res) => {
        if (!res.ok) throw new Error("Translation failed");
        return res.json();
      })
      .then((data) => {
        if (data && data.translatedText) {
          setTranslatedText(data.translatedText);
          // Persist translation immediately
          setCachedTranslation(finalLanguage, message.text, data.translatedText);
          triggerHaptic("success");
        } else {
          setTranslatedText("[Ошибка перевода]");
        }
        setTranslationLoading(false);
      })
      .catch((err) => {
        console.error(err);
        setTranslatedText("[Не удалось перевести]");
        setTranslationLoading(false);
      });
  };


  useEffect(() => {
    if (!translationLanguage) {
      setTranslatedText(null);
    } else {
      handleTranslate(translationLanguage);
    }
  }, [translationLanguage]);

  const triggerBurst = (emoji: string) => {
    const newBursts = Array.from({ length: 8 }).map((_, i) => {
      const angle = (i * (360 / 8) * Math.PI) / 180 + (Math.random() * 0.4 - 0.2);
      const distance = 40 + Math.random() * 30; // Random distance
      const tx = Math.cos(angle) * distance;
      const ty = Math.sin(angle) * distance;
      return {
        id: `${Date.now()}-${i}-${Math.random()}`,
        emoji,
        tx,
        ty
      };
    });
    setBursts(prev => [...prev, ...newBursts]);
    setTimeout(() => {
      setBursts(prev => prev.filter(b => !newBursts.some(nb => nb.id === b.id)));
    }, 800);
  };

  useEffect(() => {
    const handleClose = (e: any) => {
      if (e.detail?.id !== message.id) {
        setShowActions(false);
      }
    };
    window.addEventListener('close-message-actions', handleClose);
    return () => window.removeEventListener('close-message-actions', handleClose);
  }, [message.id]);

  const handleTranscribe = async (e: any) => {
    e.stopPropagation();
    if (transcribing || !message.chatId) return;
    setTranscribing(true);
    try {
      const res = await fetch(`/api/telegram/transcribe/${message.chatId}/${message.id}`, {
                            headers: { "x-gemini-key": localStorage.getItem("nexus_ai_api_key") || "" }, method: 'POST' });
      const data = await res.json();
      if (data.text) {
        setTranscription(data.text);
      } else {
        setTranscription("[Speech transcription failed]");
      }
    } catch(err) {
      setTranscription("[Transcription error occurred]");
    } finally {
      setTranscribing(false);
    }
  };

  // Helper to highlight search query
  const highlightText = (text: string) => {
    if (!searchQuery) return text;
    const parts = text.split(new RegExp(`(${searchQuery})`, 'gi'));
    return parts.map((part, i) => 
      part.toLowerCase() === searchQuery.toLowerCase() ? <span key={i} className="bg-yellow-500/50 text-yellow-100">{part}</span> : part
    );
  };
  
  const handleReact = async (emoticon: string) => {
    setShowActions(false);
    if (!message.chatId) return;

    // Trigger explosive little reaction clones
    triggerBurst(emoticon);

    // Optimistic UI update
    let remove = false;
    setReactions(prev => {
      const next = prev.map(r => ({ ...r }));
      const existing = next.find(r => r.emoticon === emoticon);
      if (existing) {
        if (existing.chosenOrder !== undefined && existing.chosenOrder !== null) {
          existing.count = Math.max(0, existing.count - 1);
          existing.chosenOrder = null;
          remove = true;
        } else {
          existing.count += 1;
          existing.chosenOrder = 0;
        }
      } else {
        next.push({ emoticon, count: 1, chosenOrder: 0 });
      }
      return next.filter(r => r.count > 0);
    });

    try {
      await fetch('/api/telegram/messages/react', {
        method: 'POST',
        headers: {'Content-Type': 'application/json'},
        body: JSON.stringify({ chatId: message.chatId, messageId: message.id, emoticon, remove })
      });
    } catch(err) { console.error(err); }
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(message.text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const timeFormatted = new Intl.DateTimeFormat('en-GB', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: false
  }).format(new Date(message.timestamp));

  // Check if message is explicitly marked read
  const isRead = message.read === true;

  const handleSaveEdit = () => {
    if (onEdit && editText !== message.text) {
      onEdit(message.id, editText);
    }
    setIsEditing(false);
  };

  useEffect(() => {
    if (showActions) {
      setTimeout(() => {
        const el = document.getElementById(`actions-${message.id}`);
        if (el) {
          el.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
        }
      }, 50);
    }
  }, [showActions]);

  return (
    <div 
      className={`flex w-full mb-1 ${isUser ? "justify-end" : "justify-start"} relative py-0.5 px-1 -mx-1 rounded-2xl transition-colors ${isSelected ? 'bg-indigo-500/20' : ''}`}
      id={`message-${message.id}`}
    >
      {isSelectMode && (
        <div 
          onClick={(e) => {
            e.stopPropagation();
            if (onSelect) onSelect(message.id);
          }}
          className="flex items-center justify-center cursor-pointer px-3 shrink-0 self-center"
        >
          <div className={`w-5 h-5 rounded-full border border-indigo-500/40 flex items-center justify-center transition-all ${isSelected ? 'bg-indigo-600 border-indigo-600 scale-110' : 'bg-transparent hover:border-indigo-400/80'}`}>
            {isSelected && (
              <Check className="w-3 h-3 text-white stroke-[4]" />
            )}
          </div>
        </div>
      )}
      {!isUser && (
        <div 
          onClick={(e) => {
            e.stopPropagation();
            if (message.senderId && onSelectUser) {
              onSelectUser(message.senderId, message.senderName || "User");
            }
          }}
          className="w-8 h-8 rounded-full bg-[#1c1c28] flex items-center justify-center shrink-0 mr-3 mt-auto border border-[#2c2c3e] overflow-hidden relative cursor-pointer hover:scale-105 active:scale-95 transition-transform"
          title={`View chat with ${message.senderName || "User"}`}
        >
          <span className="text-indigo-400 text-[10px] font-bold uppercase">{message.senderName ? message.senderName.substring(0, 1) : "✨"}</span>
          {message.senderId && (
            <img 
              src={getOptimizedMediaUrl(`/api/telegram/avatar/${message.senderId}`, true)} 
              alt={message.senderName || "User"} 
              className="w-full h-full object-cover absolute inset-0" 
              onError={(e) => { e.currentTarget.style.display = 'none'; }} 
            />
          )}
        </div>
      )}
      
      <div 
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
        style={{ 
          transform: `translateX(${touchTranslation}px)`, 
          transition: isSwipingActive ? 'none' : 'transform 0.4s cubic-bezier(0.16, 1, 0.3, 1)' 
        }}
        className={`flex flex-col ${isUser ? "items-end" : "items-start"} ${
          message.media || decryptedBlock?.payload?.mediaBase64 
            ? "max-w-[94%] sm:max-w-[85%] md:max-w-[660px]" 
            : "max-w-[80%] sm:max-w-[70%]"
        } gap-1.5 relative`}
      >
        {/* Floating springy reply swipe indicator on the right side */}
        {touchTranslation < 0 && (
          <div 
            style={{ 
              opacity: Math.min(1, Math.abs(touchTranslation) / 60),
              transform: `scale(${Math.min(1.2, Math.abs(touchTranslation) / 45)})`,
              right: `-${32 + Math.min(15, Math.abs(touchTranslation) * 0.1)}px`
            }}
            className="absolute top-1/2 -translate-y-1/2 w-7 h-7 rounded-full bg-indigo-500 text-white flex items-center justify-center font-bold text-xs shadow-lg transition-transform z-20 pointer-events-none select-none select-none"
          >
            {isChannel ? "➡️" : "↩"}
          </div>
        )}
        <div 
          ref={bubbleRef}
          onPointerDown={(e) => {
            isBubbleHoldTriggeredRef.current = false;
            bubbleHoldTimerRef.current = window.setTimeout(() => {
              isBubbleHoldTriggeredRef.current = true;
              triggerHaptic("heavy");
              setShowReadInfoModal(true);
            }, 380);
          }}
          onPointerUp={() => {
            if (bubbleHoldTimerRef.current) {
              clearTimeout(bubbleHoldTimerRef.current);
              bubbleHoldTimerRef.current = null;
            }
          }}
          onPointerCancel={() => {
            if (bubbleHoldTimerRef.current) {
              clearTimeout(bubbleHoldTimerRef.current);
              bubbleHoldTimerRef.current = null;
            }
          }}
          onClick={(e) => {
            if (isBubbleHoldTriggeredRef.current) {
              isBubbleHoldTriggeredRef.current = false;
              return;
            }
            if (isSelectMode) {
              e.stopPropagation();
              if (onSelect) onSelect(message.id);
              return;
            }
            
            // Visual ripply click effect highlighting the message
            const t = e.currentTarget;
            t.classList.add('bg-white/10', 'scale-[1.02]');
            setTimeout(() => {
               t.classList.remove('bg-white/10', 'scale-[1.02]');
            }, 250);

            openActionsMenu();
          }}
          onDoubleClick={(e) => {
            e.stopPropagation();
            handleReact("❤️");
          }}
          onContextMenu={(e) => { 
            e.preventDefault(); 
            openActionsMenu(); 
          }}
          className={`relative w-full rounded-2xl ${
            isSticker && !message.text
              ? "bg-transparent border-none shadow-none !p-1"
              : isPureMedia
                ? "bg-transparent border-0 shadow-none !p-0"
                : isUser 
                  ? isPinned
                    ? "bg-[#2b5278] text-white rounded-br-[4px] border-t-[0.75px] border-t-sky-400/40 border-x-0 border-b-0 px-3.5 py-2"
                    : "bg-[#2b5278] hover:bg-[#2f5a84] text-white rounded-br-[4px] border-t-[0.75px] border-t-white/15 border-x-0 border-b-0 px-3.5 py-2" 
                  : isPinned
                    ? "bg-[#182533] border-t-[0.75px] border-t-sky-500/40 border-x-0 border-b-0 text-gray-100 rounded-bl-[4px] px-3.5 py-2"
                    : "bg-[#182533] border-t-[0.75px] border-t-white/10 border-x-0 border-b-0 text-gray-100 rounded-bl-[4px] px-3.5 py-2"
          } shadow-sm group overflow-hidden transition-colors message-bubble ${
            isUser ? "message-bubble-out" : "message-bubble-in"
          }`}
          data-glass="true"
        >
        {message.fwdFrom && (
          <div 
            className="mb-2 flex items-center gap-1.5 px-2.5 py-1.5 bg-white/10 hover:bg-white/20 rounded-xl text-xs font-semibold text-white border-t border-t-white/20 border-x-0 border-b-0 w-fit cursor-pointer transition-all active:scale-95 shadow-sm group/fwd"
            onClick={(e) => {
              e.stopPropagation();
              const target = message.fwdFrom?.peerId || message.fwdFrom?.name;
              if (target && onSelectUser) {
                onSelectUser(target, message.fwdFrom?.name || "Chat");
              }
            }}
            title={`Перейти к источнику: ${message.fwdFrom.name}`}
          >
            <Forward className="w-3.5 h-3.5 text-sky-400 group-hover/fwd:translate-x-0.5 transition-transform shrink-0" />
            <span className="text-white/60 font-normal">Переслано от:</span>
            <span className="text-sky-300 group-hover/fwd:underline font-medium truncate max-w-[220px]">
              {message.fwdFrom.name}
            </span>
          </div>
        )}
        {!isUser && message.senderName && (
          <div 
            onClick={(e) => {
              e.stopPropagation();
              if (message.senderId && onSelectUser) {
                onSelectUser(message.senderId, message.senderName || "User");
              }
            }}
            className="text-xs font-semibold text-indigo-400 mb-1.5 leading-none tracking-wide truncate max-w-xs select-none hover:underline cursor-pointer"
            title={`Профиль: ${message.senderName}`}
          >
            {message.senderName}
          </div>
        )}
        {message.replyToMsgId && (
          <div 
            onClick={(e) => {
              e.stopPropagation();
              const el = document.getElementById(`message-${message.replyToMsgId}`);
              if (el) {
                el.scrollIntoView({ behavior: 'smooth', block: 'center' });
                el.classList.add('bg-blue-500/20', 'transition-colors', 'duration-500');
                setTimeout(() => el.classList.remove('bg-blue-500/20'), 1500);
              }
            }}
            className="mb-2 pt-1.5 px-2.5 pb-1 border-t-2 border-t-white/35 border-x-0 border-b-0 text-xs text-white/70 italic bg-black/15 rounded-b-md cursor-pointer hover:bg-black/25 transition-colors"
          >
            <div className="font-medium text-white/90 truncate">{message.replyToSender || "Ответ"}</div>
            <div className="truncate opacity-75 line-clamp-1">
              {message.replyToMsgText ? message.replyToMsgText : "Original message..."}
            </div>
          </div>
        )}

        {decryptError && (
          <div className="mb-2 p-2 bg-rose-950/40 border-t border-t-rose-500/30 border-x-0 border-b-0 rounded-xl text-rose-300 text-xs flex items-center justify-between gap-2 font-mono">
            <div className="flex items-center gap-1.5 truncate">
              <Lock className="w-3.5 h-3.5 text-rose-400 shrink-0" />
              <span>Зашифрованное сообщение</span>
            </div>
            <button
              onClick={(e) => {
                e.stopPropagation();
                window.dispatchEvent(new CustomEvent("open-nexus-blockchain-modal"));
              }}
              className="text-[10px] text-rose-300 hover:text-white underline cursor-pointer shrink-0"
            >
              Ввести ключ
            </button>
          </div>
        )}

        {/* Decrypted Media Content if available */}
        {decryptedBlock?.payload && decryptedBlock.payload.type !== "text" && (
          <div className="mb-2 rounded-xl overflow-hidden bg-black/20 border-0">
            {decryptedBlock.payload.type === "photo" && decryptedBlock.payload.mediaBase64 && (
              <div 
                className="relative cursor-pointer max-w-full overflow-hidden" 
                onClick={() => {
                  const event = new CustomEvent('view-media-request', { detail: { url: decryptedBlock.payload.mediaBase64, type: 'image' } });
                  window.dispatchEvent(event);
                }}
              >
                <img 
                  src={decryptedBlock.payload.mediaBase64} 
                  alt="Decrypted Photo" 
                  className="w-full max-w-[560px] sm:max-w-[640px] max-h-[580px] object-cover block rounded-xl border-0 shadow-sm" 
                />
              </div>
            )}

            {decryptedBlock.payload.type === "video" && decryptedBlock.payload.mediaBase64 && (
              <div className="relative max-w-full overflow-hidden rounded-xl">
                <video 
                  src={decryptedBlock.payload.mediaBase64} 
                  controls 
                  playsInline 
                  className="w-full max-w-[560px] sm:max-w-[640px] max-h-[580px] rounded-xl border-0 shadow-sm" 
                />
              </div>
            )}

            {(decryptedBlock.payload.type === "voice" || decryptedBlock.payload.type === "audio") && decryptedBlock.payload.mediaBase64 && (
              <div className="p-3 bg-black/30 flex flex-col gap-1.5">
                <audio src={decryptedBlock.payload.mediaBase64} controls className="w-full" />
              </div>
            )}

            {decryptedBlock.payload.type === "sticker" && decryptedBlock.payload.mediaBase64 && (
              <div className="relative cursor-pointer max-w-[220px] py-1 flex items-center justify-center p-2">
                <img 
                  src={decryptedBlock.payload.mediaBase64} 
                  alt="Decrypted Sticker" 
                  className="w-48 h-48 object-contain" 
                />
              </div>
            )}

            {decryptedBlock.payload.type === "file" && (
              <a 
                href={decryptedBlock.payload.mediaBase64} 
                download={decryptedBlock.payload.fileName || "decrypted_file"} 
                className="flex items-center gap-3 p-3 bg-black/20 border-[0.5px] border-white/10 rounded-xl text-sky-300 hover:bg-white/5 transition-colors cursor-pointer"
              >
                <File className="w-6 h-6 text-sky-400 shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate text-white">{decryptedBlock.payload.fileName || "Файл"}</p>
                  <p className="text-[10px] text-white/50 font-mono">
                    {decryptedBlock.payload.fileSize ? `${Math.round(decryptedBlock.payload.fileSize / 1024)} KB` : "Файл"} • Скачать
                  </p>
                </div>
              </a>
            )}
          </div>
        )}

        {message.media && message.chatId && !decryptedBlock && (
          <div className={`mb-2 relative group/media ${
            isSticker
              ? "bg-transparent flex justify-center py-1"
              : hasHeader
                ? "w-full rounded-xl overflow-hidden bg-black/20 border border-white/5"
                : "-mx-4 -mt-2.5 rounded-t-2xl overflow-hidden bg-black/20 border-b border-white/10"
          }`}>
            {message.videoNote ? (
               <div className="flex justify-center p-4 bg-black/15">
                <div 
                  className={`rounded-full overflow-hidden border border-indigo-500/30 shadow-xl relative bg-black aspect-square flex items-center justify-center group/circle cursor-pointer transition-all duration-300 hover:scale-105 active:scale-110 ${videoCircleExpanded ? 'w-64 h-64 shadow-indigo-500/30' : 'w-48 h-48 shadow-lg'}`}
                  onClick={(e) => {
                    e.stopPropagation();
                    setVideoCircleExpanded(prev => !prev);
                    const event = new CustomEvent('view-media-request', { detail: { url: `/api/telegram/media/${message.chatId}/${message.id}`, type: 'video' } });
                    window.dispatchEvent(event);
                  }}
                >
                  <video 
                    src={`/api/telegram/media/${message.chatId}/${message.id}`} 
                    className="w-full h-full object-cover rounded-full pointer-events-none"
                    loop
                    autoPlay
                    muted={videoCircleMuted}
                    playsInline
                    preload="auto"
                  />
                  <div className="absolute inset-0 rounded-full border border-indigo-500/30 pointer-events-none z-10" />
                  
                  {/* Video duration and size */}
                  <div className="absolute top-4 left-4 px-2 py-1 bg-black/60 rounded-full text-white text-[9px] font-mono border border-white/10 flex items-center gap-1 backdrop-blur-sm z-25">
                    <span>{getFormattedVidDuration(message.id)}</span>
                    <span className="opacity-50">•</span>
                    <span>{getFormattedVidSize(message.id)}</span>
                  </div>

                  {/* Volume Icon in Right Corner of Video Circle */}
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setVideoCircleMuted(p => !p);
                    }}
                    className="absolute top-4 right-4 p-1.5 bg-black/60 hover:bg-black/80 rounded-full text-white/90 cursor-pointer border border-white/15 z-20 transition-transform active:scale-95"
                    title={videoCircleMuted ? "Unmute" : "Mute"}
                  >
                    {videoCircleMuted ? <VolumeX className="w-3.5 h-3.5" /> : <Volume2 className="w-3.5 h-3.5" />}
                  </button>

                  <div className="absolute bottom-1.5 right-1.5 p-1 bg-black/50 backdrop-blur-inner rounded-md pointer-events-none text-[8px] text-gray-300 font-mono tracking-widest uppercase z-20">
                    Circle
                  </div>
                </div>
              </div>
            ) : (message.mimeType === 'application/x-ian' || message.text?.includes('.ian') || message.mimeType?.includes('ian') || message.mediaType === 'MessageMediaDocument' && !message.mimeType?.startsWith('image/')) ? (
              message.mimeType?.startsWith('video/') ? (
                showAsAudio ? (
                  <div className="w-full max-w-sm p-4 bg-[#1e1e2d] border-b border-white/10 flex flex-col gap-3 animate-fade-in text-left">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-indigo-500/10 flex items-center justify-center animate-pulse">
                        <Volume2 className="w-5 h-5 text-indigo-400" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-semibold text-indigo-400">Преобразовано из видео</p>
                        <p className="text-[10px] text-gray-400 truncate">{message.text || "Видео сообщение"}</p>
                      </div>
                    </div>
                    
                    <audio 
                      src={`/api/telegram/media/${message.chatId}/${message.id}`} 
                      controls 
                      autoPlay
                      className="w-full mt-1"
                    />

                    {transcribing ? (
                      <div className="flex items-center gap-2 text-xs text-gray-400 py-1">
                        <Loader2 className="w-3.5 h-3.5 animate-spin text-indigo-400" />
                        <span>Расшифровка аудио...</span>
                      </div>
                    ) : transcription ? (
                      <div className="bg-black/35 px-3 py-2 rounded-xl border border-white/5 mt-1">
                        <p className="text-[9px] text-[#a5b4fc] font-bold uppercase tracking-wider mb-1 font-mono">Транскрипция</p>
                        <p className="text-xs text-gray-200 whitespace-pre-wrap leading-relaxed select-text">{transcription}</p>
                      </div>
                    ) : null}

                    <div className="flex items-center gap-2 mt-1">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setShowAsAudio(false);
                        }}
                        className="px-2.5 py-1 bg-white/10 hover:bg-white/15 text-indigo-300 text-[10px] font-bold rounded-lg border border-indigo-500/20 transition-all cursor-pointer"
                      >
                        Вернуть в видео
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="relative group/vid">
                    <video 
                      onClick={(e) => {
                        e.stopPropagation();
                        setVideoMuted(prev => !prev);
                      }}
                      src={`/api/telegram/media/${message.chatId}/${message.id}`} 
                      className="w-full max-w-sm max-h-[300px] object-cover border-b border-white/10 cursor-pointer"
                      autoPlay
                      loop
                      muted={videoMuted}
                      playsInline
                    />
                    {/* Mute toggle icon in right corner of video */}
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setVideoMuted(p => !p);
                      }}
                      className="absolute top-2 right-12 p-1.5 bg-black/60 hover:bg-black/80 rounded border border-white/10 text-white backdrop-blur-sm cursor-pointer z-30 transition-colors"
                      title={videoMuted ? "Unmute" : "Mute"}
                    >
                      {videoMuted ? <VolumeX className="w-3.5 h-3.5" /> : <Volume2 className="w-3.5 h-3.5" />}
                    </button>
                    <button 
                      onClick={(e) => {
                        e.stopPropagation();
                        const event = new CustomEvent('view-media-request', { detail: { url: `/api/telegram/media/${message.chatId}/${message.id}`, type: 'video' } });
                        window.dispatchEvent(event);
                      }}
                      className="absolute top-2 right-2 p-1.5 bg-black/60 hover:bg-black/80 rounded border border-white/10 text-white opacity-0 group-hover/vid:opacity-100 transition-opacity backdrop-blur-sm cursor-pointer z-35"
                      title="Fullscreen"
                    >
                      <Maximize2 className="w-3.5 h-3.5" />
                    </button>

                    {/* Transcribe Button */}
                    <button
                      onClick={async (e) => {
                        e.stopPropagation();
                        setShowAsAudio(true);
                        if (!transcription && !transcribing) {
                          setTranscribing(true);
                          try {
                            const res = await fetch(`/api/telegram/transcribe/${message.chatId}/${message.id}`, {
                            headers: { "x-gemini-key": localStorage.getItem("nexus_ai_api_key") || "" },
                              method: "POST"
                            });
                            const data = await res.json();
                            if (data && data.text) {
                              setTranscription(data.text);
                            } else {
                              setTranscription("[Не удалось расшифровать видео]");
                            }
                          } catch (err) {
                            console.error(err);
                            setTranscription("[Ошибка при связи с сервером]");
                          } finally {
                            setTranscribing(false);
                          }
                        }
                      }}
                      className="absolute bottom-2 left-2 px-3 py-1 bg-black/70 hover:bg-black/90 text-indigo-400 font-bold text-[10px] uppercase rounded-lg border border-indigo-500/30 shadow-md flex items-center gap-1 cursor-pointer transition-transform active:scale-95 z-20"
                    >
                      <span>🎬</span> Транскрипция
                    </button>
                  </div>
                )
              ) : message.mimeType?.startsWith('audio/') ? (
                <div className="flex flex-col bg-black/10 border-b border-white/10 p-4 gap-2">
                  <audio 
                    src={`/api/telegram/media/${message.chatId}/${message.id}`} 
                    controls 
                    className="w-full"
                  />
                  <div className="flex justify-between items-center text-[10px] text-gray-400 px-1 font-mono">
                    <span>🎵 Аудиофайл</span>
                    <span>{getFormattedVidSize(message.id)}</span>
                  </div>
                </div>
              ) : (message.mimeType === 'application/x-ian' || message.text?.includes('.ian') || message.mimeType?.includes('ian')) ? (
                <div className="w-full p-6 border-b border-white/10 flex flex-col items-center justify-center gap-3 bg-[#111116] border border-white/10 text-center rounded-2xl m-2 max-w-[95%]">
                  <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center shadow-lg shadow-indigo-500/30">
                    <span className="font-display font-bold text-white text-xl">.IAN</span>
                  </div>
                  <h3 className="font-medium text-white">Custom Ian File ({getFormattedVidSize(message.id)})</h3>
                  <button 
                    onClick={(e) => { 
                      e.stopPropagation(); 
                      const filename = message.text || "custom_file.ian";
                      const event = new CustomEvent('view-media-request', { 
                        detail: { 
                          url: `/api/telegram/media/${message.chatId}/${message.id}`, 
                          type: 'document',
                          mimeType: message.mimeType || 'application/x-ian',
                          name: filename
                        } 
                      });
                      window.dispatchEvent(event);
                    }} 
                    className="mt-2 px-4 py-2 bg-white/10 hover:bg-white/20 rounded-lg text-sm text-white font-medium transition-colors cursor-pointer"
                  >
                    Open in Internal Viewer
                  </button>
                </div>
              ) : (
                isNexusBlockMessage({ fileName: (message as any).fileName || message.text, text: message.text, mimeType: message.mimeType, media: message.media }) && !decryptError ? null : (
                  <button 
                    onClick={(e) => {
                      e.stopPropagation();
                      const filename = message.text || "attached_file";
                      const event = new CustomEvent('view-media-request', { 
                        detail: { 
                          url: `/api/telegram/media/${message.chatId}/${message.id}`, 
                          type: 'document',
                          mimeType: message.mimeType,
                          name: filename
                        } 
                      });
                      window.dispatchEvent(event);
                    }}
                    className="w-full p-4 border-b border-white/10 flex items-center gap-3 hover:bg-black/20 transition-colors text-left cursor-pointer"
                  >
                    <div className="w-10 h-10 rounded-lg bg-blue-500/20 flex items-center justify-center">
                      <File className="w-5 h-5 text-blue-400" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-200 truncate">File Attached ({getFormattedVidSize(message.id)})</p>
                      <p className="text-xs text-gray-400">{message.mimeType || "Binary data"}</p>
                    </div>
                  </button>
                )
              )
            ) : isSticker || message.mimeType === 'image/webp' || message.mimeType === 'application/x-tgsticker' ? (
              <div className="relative cursor-pointer max-w-[220px] py-1 flex items-center justify-center">
                <TelegramSticker
                  src={`/api/telegram/media/${message.chatId}/${message.id}`}
                  mimeType={message.mimeType}
                  isAnimated={message.isAnimatedSticker}
                  emoji={message.stickerEmoji}
                  className="w-48 h-48"
                  onClick={() => {
                    const event = new CustomEvent('view-media-request', { 
                      detail: { 
                        url: `/api/telegram/media/${message.chatId}/${message.id}`, 
                        type: message.mimeType?.includes('video') ? 'video' : 'image',
                        mimeType: message.mimeType
                      } 
                    });
                    window.dispatchEvent(event);
                  }}
                />
              </div>
            ) : message.groupedItems ? (
              <div className={`grid gap-0.5 border-b border-white/10 ${message.groupedItems.length >= 3 ? 'grid-cols-3' : 'grid-cols-2'}`}>
                {message.groupedItems.map((gi) => (
                  <div key={gi.id} className="relative cursor-pointer aspect-square bg-black/10" onClick={() => {
                       const type = gi.mimeType?.startsWith('video/') ? 'video' : 'image';
                       const event = new CustomEvent('view-media-request', { detail: { url: `/api/telegram/media/${message.chatId}/${gi.id}`, type } });
                       window.dispatchEvent(event);
                     }}>
                    {gi.mimeType?.startsWith('video/') ? (
                      <video src={`/api/telegram/media/${message.chatId}/${gi.id}`} className="w-full h-full object-cover" autoPlay loop muted playsInline />
                    ) : (
                      <img 
                        src={getOptimizedMediaUrl(`/api/telegram/media/${message.chatId}/${gi.id}`, true)} 
                        alt="Attached Media" 
                        className="w-full h-full object-cover" 
                        loading="lazy" 
                        onError={(e) => {
                          const target = e.currentTarget;
                          if (!target.getAttribute("data-tried")) {
                            target.setAttribute("data-tried", "1");
                            target.src = `/uploads/media_${message.chatId}_${gi.id}_eco.webp`;
                          }
                        }}
                      />
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <div className="relative cursor-pointer max-w-full overflow-hidden" onClick={() => {
                   const event = new CustomEvent('view-media-request', { detail: { url: `/api/telegram/media/${message.chatId}/${message.id}`, type: 'image' } });
                   window.dispatchEvent(event);
                 }}>
                <img 
                  src={getOptimizedMediaUrl(`/api/telegram/media/${message.chatId}/${message.id}`, false)} 
                  alt="Attached Media"
                  className="w-full max-w-[560px] sm:max-w-[640px] max-h-[580px] object-cover block rounded-2xl border-0 shadow-sm"
                  loading="lazy"
                  onError={(e) => {
                    const target = e.currentTarget;
                    if (!target.getAttribute("data-tried")) {
                      target.setAttribute("data-tried", "1");
                      target.src = `/uploads/media_${message.chatId}_${message.id}_eco.webp`;
                    }
                  }}
                />
                {isUser && onEdit && (
                  <button 
                    onClick={(e) => {
                        e.stopPropagation();
                        const event = new CustomEvent('edit-image-request', { detail: `/api/telegram/media/${message.chatId}/${message.id}` });
                        window.dispatchEvent(event);
                    }}
                    className="absolute top-2 right-2 p-2 bg-black/60 hover:bg-black/80 rounded-lg text-white opacity-0 group-hover/media:opacity-100 transition-opacity backdrop-blur-sm"
                    title="Edit Image"
                  >
                    <Edit2 className="w-4 h-4" />
                  </button>
                )}
              </div>
            )}
          </div>
        )}
        
        {isEditing ? (
          <div className="w-full mt-1">
            <textarea 
              value={editText}
              onChange={(e) => setEditText(e.target.value)}
              className="w-full bg-black/20 text-white rounded-lg p-2 text-sm focus:outline-none focus:ring-1 focus:ring-blue-500/50 resize-none min-h-[60px]"
            />
            <div className="flex justify-end gap-2 mt-2">
              <button 
                onClick={() => setIsEditing(false)}
                className="px-3 py-1 text-xs rounded-full bg-white/10 hover:bg-white/20 transition-colors"
              >
                Cancel
              </button>
              <button 
                onClick={handleSaveEdit}
                className="px-3 py-1 text-xs rounded-full bg-blue-500 hover:bg-blue-600 text-white transition-colors"
              >
                Save
              </button>
            </div>
          </div>
        ) : (
          <div className="text-[15px] leading-relaxed break-words space-y-2 prose prose-invert max-w-none">
            {translationLoading ? (
              <div className="flex flex-col gap-2 py-2 w-full min-w-[200px] animate-pulse">
                <div className="h-3 w-3/4 bg-indigo-500/10 rounded" />
                <div className="h-3 w-5/6 bg-indigo-500/10 rounded" />
                <div className="h-3 w-1/2 bg-indigo-500/10 rounded" />
                <p className="text-[10px] text-indigo-400 font-mono tracking-wider">Перевод на выбранный язык...</p>
              </div>
            ) : (() => {
              let textToDisplay = decryptedBlock 
                ? (decryptedBlock.payload.text || "") 
                : (translatedText !== null 
                    ? translatedText 
                    : (isNexusBlockMessage({ fileName: (message as any).fileName || message.text, text: message.text, mimeType: message.mimeType, media: message.media }) && !decryptError
                        ? ""
                        : (message.text || "")));

              // Remove any placeholder media text when media is present
              const isMediaPlaceholder = (str?: string) => {
                if (!str) return true;
                const s = str.trim().toLowerCase();
                return (
                  s === "[media attached]" ||
                  s === "[media attachment]" ||
                  s === "media attachment" ||
                  s === "media attached" ||
                  s === "[прикрепленное медиа]" ||
                  s === "приложенное медиа" ||
                  s === "[приложенное медиа]" ||
                  s === "прикрепленное медиа" ||
                  s === "[прикрепленный файл]" ||
                  s === "прикрепленный файл" ||
                  s === "[вложение]" ||
                  s === "вложение" ||
                  s === "[вложение без подписи]"
                );
              };

              if (Boolean(message.media || message.mediaType || (message as any).fileName) && isMediaPlaceholder(textToDisplay)) {
                textToDisplay = "";
              }

              if (!textToDisplay) {
                return null;
              }
              return (
                <>
                  {translatedText !== null && (
                    <div className="flex items-center justify-between text-[9px] font-mono font-bold text-indigo-400 select-none border-b border-indigo-400/10 pb-1 mb-1.5">
                      <span className="flex items-center gap-1">🌐 Переведено на {getLanguageName(selectedLang || translationLanguage)}</span>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setTranslatedText(null);
                        }}
                        className="text-[8px] text-indigo-400/60 hover:text-indigo-300 transition-colors uppercase font-sans tracking-wide cursor-pointer underline select-none"
                      >
                        Оригинал
                      </button>
                    </div>
                  )}
                  {searchQuery ? (
                    <span className="whitespace-pre-wrap">{highlightText(textToDisplay)}</span>
                  ) : isMarkdownMode ? (
                    <Markdown
                      remarkPlugins={[remarkGfm]}
                      components={{
                        code({ node, inline, className, children, ...props }: any) {
                          const match = /language-(\w+)/.exec(className || "");
                          const codeSource = String(children).replace(/\n$/, "");
                          
                          if (!inline && match && (match[1] === "html" || match[1] === "website" || match[1] === "css" || match[1] === "javascript")) {
                            return (
                              <div className="my-2 rounded-lg border border-[#2a2a38] overflow-hidden bg-white h-64">
                                 <iframe 
                                     sandbox="allow-scripts allow-top-navigation allow-popups"
                                     className="w-full h-full border-none text-black"
                                     srcDoc={
                                       match[1] === 'html' ? codeSource : 
                                       match[1] === 'css' ? `<html><head><style>${codeSource}</style></head><body><h1>Rendered CSS</h1><p>The styles have been successfully injected into this embedded document.</p></body></html>` : 
                                       `<html><body><script>${codeSource}</script><p>JavaScript Executed</p></body></html>`
                                     }
                                 />
                              </div>
                            );
                          }
                          
                          return !inline && match ? (
                            <SyntaxHighlighter
                              style={vscDarkPlus as any}
                              language={match[1]}
                              PreTag="div"
                              {...props}
                            >
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
                      {textToDisplay}
                    </Markdown>
                  ) : (
                    <span className="whitespace-pre-wrap">{textToDisplay}</span>
                  )}

                  {/* Text clearance spacer so floating corner indicator never overlaps message text */}
                  {(indicatorStyle === "corner-float" || !indicatorStyle) && (
                    <span className="inline-block w-14 h-3.5 align-baseline pointer-events-none select-none opacity-0" aria-hidden="true">
                      &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;
                    </span>
                  )}

                  
                    </>
              );
            })()}
          </div>
        )}

        {((message.media && (message.voiceNote || message.videoNote)) || message.mimeType?.startsWith('audio/')) && (
          <div className="mt-2 text-xs">
            {transcription ? (
              <div className="mt-2 p-2.5 bg-black/35 border-l-2 border-indigo-500 text-gray-200 font-mono text-xs rounded-r-lg max-w-sm whitespace-pre-wrap">
                🗣️ Transcription: {transcription}
              </div>
            ) : (
              <button 
                onClick={handleTranscribe} 
                disabled={transcribing}
                className="mt-1 px-3 py-1 bg-indigo-500/10 hover:bg-indigo-500/30 border border-indigo-500/20 text-indigo-300 rounded-full font-medium transition-colors cursor-pointer flex items-center gap-1 shrink-0"
              >
                {transcribing ? <Loader2 className="w-3 h-3 animate-spin inline-block text-indigo-400" /> : null}
                🗣️ Transcribe Audio
              </button>
            )}
          </div>
        )}
        
        {reactions && reactions.length > 0 && (
          <div className={`flex flex-wrap items-center gap-1 mt-1.5 ${isUser ? 'justify-end' : 'justify-start'}`}>
            <AnimatePresence>
            {reactions.map((r, i) => (
              <motion.button 
                key={r.emoticon} 
                layout
                initial={{ opacity: 0, scale: 0.5 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.5 }}
                whileTap={{ scale: 0.9 }}
                onTouchStart={() => handleReactionPressStart(r.emoticon)}
                onTouchEnd={handleReactionPressEnd}
                onTouchCancel={handleReactionPressEnd}
                onMouseDown={() => handleReactionPressStart(r.emoticon)}
                onMouseUp={handleReactionPressEnd}
                onMouseLeave={handleReactionPressEnd}
                onContextMenu={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  handleReactionPressEnd();
                  triggerHaptic("heavy");
                  window.dispatchEvent(
                    new CustomEvent("open-reaction-details", {
                      detail: {
                        messageId: message.id,
                        chatId: (message as any).chatId,
                        reactions,
                        initialEmoji: r.emoticon,
                      },
                    })
                  );
                }}
                onClick={(e) => {
                  e.stopPropagation();
                  if (isReactionHeldRef.current) {
                    isReactionHeldRef.current = false;
                    return;
                  }
                  handleReact(r.emoticon);
                }}
                className={`relative flex items-center gap-1 rounded-full px-1.5 py-0.5 text-xs border cursor-pointer transition-colors ${
                  r.chosenOrder !== undefined && r.chosenOrder !== null 
                  ? 'bg-indigo-900/40 border-indigo-500/30 text-indigo-200 hover:bg-indigo-900/60' 
                  : (isUser ? 'bg-[#1a1a24] border-[#22222d] text-gray-300' : 'bg-[#1a1a24] border-[#2a2a38] text-gray-300 hover:bg-[#22222d]')
                }`}
                title="Нажмите для реакции или зажмите для просмотра пользователей"
              >
                <span>{r.emoticon}</span>
                {r.count > 1 && <span>{r.count}</span>}

                {/* Flying reaction clone particles bursting precisely around the clicked reaction */}
                {bursts.filter(b => b.emoji === r.emoticon).map(b => (
                  <motion.span
                    key={b.id}
                    initial={{ scale: 0.2, opacity: 1, x: 0, y: 0, rotate: 0 }}
                    animate={{ 
                      scale: [0.2, 1.4, 0.8], 
                      opacity: [1, 1, 0], 
                      x: b.tx, 
                      y: b.ty, 
                      rotate: [0, Math.random() * 360 - 180] 
                    }}
                    transition={{
                      duration: 0.85,
                      ease: "easeOut",
                    }}
                    className="absolute z-50 text-lg select-none pointer-events-none"
                    style={{ left: '35%', top: '25%' }}
                  >
                    {b.emoji}
                  </motion.span>
                ))}
              </motion.button>
            ))}
            </AnimatePresence>
          </div>
        )}

        {/* Message Indicators (Time, read checkmarks, pinned, edited, views) customizable by user */}
        {(() => {
          const indicatorsInner = (
            <>
              {isPinned && <Pin className="w-2.5 h-2.5 text-sky-400 shrink-0" />}
              {message.isDeleted && (
                <span className="text-[9px] bg-rose-500/20 text-rose-300 px-1 py-0.2 rounded border border-rose-500/30 flex items-center gap-0.5 font-medium shrink-0" title="Сообщение было удалено">
                  <Trash2 className="w-2.5 h-2.5 text-rose-400" />
                </span>
              )}
              {message.edited && <span className="text-[9px] italic opacity-75 shrink-0">ред.</span>}
              {isChannel && message.views !== undefined && (
                <span className="text-[9px] flex items-center gap-0.5 opacity-80 shrink-0" title="Просмотры">
                  <Eye className="w-2.5 h-2.5" />
                  {message.views > 1000 ? (message.views / 1000).toFixed(1) + 'k' : message.views}
                </span>
              )}
              {isContact && (
                <span className="text-[9px] flex items-center gap-0.5 opacity-80 text-indigo-300 font-bold shrink-0" title="Ответы">
                  <CornerUpLeft className="w-2.5 h-2.5" />
                  {message.replies?.replies ?? (parseInt(message.id.toString()) % 3 + 1)}
                </span>
              )}
              {message.forwards !== undefined && message.forwards > 0 && (
                <span className="text-[9px] flex items-center gap-0.5 opacity-80 shrink-0">
                  <Forward className="w-2.5 h-2.5" />
                  {message.forwards}
                </span>
              )}
              <span className="text-[10px] tracking-wide flex items-center gap-1 shrink-0 font-sans">
                {timeFormatted}
                {isUser && (
                  isRead ? <CheckCheck className="w-3.5 h-3.5 text-[#53bdeb]" /> : <Check className="w-3.5 h-3.5 text-white/70" />
                )}
              </span>
            </>
          );

          if (indicatorStyle === "side-vertical") {
            return (
              <>
                {/* Time and read checkmark at the bottom of the message */}
                <div className={`flex items-center gap-1 mt-1.5 text-[10px] font-sans ${isUser ? 'justify-end text-white/80' : 'justify-start text-gray-400'} select-none`}>
                  <span>{timeFormatted}</span>
                  {isUser && (
                    isRead ? <CheckCheck className="w-3.5 h-3.5 text-[#53bdeb]" /> : <Check className="w-3.5 h-3.5 text-white/70" />
                  )}
                </div>

                {/* Indicators vertically running upwards on the outside side of the bubble */}
                <div className={`absolute ${isUser ? '-left-7 sm:-left-8' : '-right-7 sm:-right-8'} bottom-1 flex flex-col-reverse items-center gap-1.5 z-20 pointer-events-none select-none`}>
                  {isPinned && (
                    <span className="p-1 rounded-md bg-black/60 text-sky-400 backdrop-blur-[2px] shadow-sm">
                      <Pin className="w-3 h-3 text-sky-400" />
                    </span>
                  )}
                  {message.isDeleted && (
                    <span className="p-1 rounded-md bg-black/60 text-rose-400 backdrop-blur-[2px] shadow-sm">
                      <Trash2 className="w-3 h-3 text-rose-400" />
                    </span>
                  )}
                  {message.edited && (
                    <span className="text-[8px] bg-black/70 px-1 py-0.5 rounded text-gray-300 font-sans backdrop-blur-[2px] shadow-sm">
                      ред.
                    </span>
                  )}
                  {isChannel && message.views !== undefined && (
                    <span className="text-[8px] flex flex-col items-center text-gray-300 bg-black/70 px-1 py-0.5 rounded backdrop-blur-[2px] shadow-sm">
                      <Eye className="w-2.5 h-2.5 text-indigo-400" />
                      <span>{message.views > 1000 ? (message.views / 1000).toFixed(1) + 'k' : message.views}</span>
                    </span>
                  )}
                  {isContact && (
                    <span className="text-[8px] text-indigo-300 font-bold bg-black/70 px-1 py-0.5 rounded backdrop-blur-[2px] shadow-sm flex items-center justify-center">
                      <CornerUpLeft className="w-2.5 h-2.5 text-indigo-400" />
                    </span>
                  )}
                  {message.forwards !== undefined && message.forwards > 0 && (
                    <span className="text-[8px] text-emerald-400 bg-black/70 px-1 py-0.5 rounded backdrop-blur-[2px] shadow-sm flex items-center justify-center">
                      <Forward className="w-2.5 h-2.5 text-emerald-400" />
                    </span>
                  )}
                </div>
              </>
            );
          }

          if (isPureMedia || (indicatorStyle === "corner-float" && message.media)) {
            return (
              <div className="absolute bottom-1.5 right-2 px-1.5 py-0.5 rounded-lg bg-black/60 backdrop-blur-[3px] flex items-center gap-1 text-[10px] text-white/95 z-20 shadow-sm pointer-events-none select-none">
                {indicatorsInner}
              </div>
            );
          }

          // Clean bottom inline layout: NEVER overlaps text, neatly placed under message content
          return (
            <div className={`flex items-center gap-1.5 mt-1 pt-0.5 ${isUser ? 'justify-end text-white/80' : 'justify-end text-gray-400'} select-none leading-none`}>
              {indicatorsInner}
            </div>
          );
        })()}
      </div>

        {(message.repliesCount > 0 || (message.replies && typeof message.replies.replies === 'number')) && (
          <button 
            onClick={(e) => {
              e.stopPropagation();
              const event = new CustomEvent('open-comments', { detail: { messageId: message.id, channelId: message.chatId } });
              window.dispatchEvent(event);
            }}
            className="mt-2 w-full py-1.5 bg-[#1e1e2c] hover:bg-[#252538] border border-indigo-500/15 text-indigo-300 rounded-xl font-medium transition-colors cursor-pointer flex items-center justify-center gap-2 text-xs"
          >
            💬 {isChannel ? "Комментарии" : "Ответы"} ({message.repliesCount || message.replies?.replies})
          </button>
        )}

      {message.replyMarkup && message.replyMarkup.rows && (
        <div className="mt-2 flex flex-col gap-1.5 w-full max-w-sm">
          {message.replyMarkup.rows.map((row: any, rIdx: number) => (
            <div key={rIdx} className="flex gap-1.5 w-full">
              {row.buttons.map((btn: any, bIdx: number) => {
                const isUrl = !!btn.url;
                const handleClickBtn = async (e: any) => {
                  e.stopPropagation();
                  if (isUrl) {
                    window.open(btn.url, "_blank");
                  } else if (btn.data) {
                    try {
                      await fetch("/api/telegram/messages/callback", {
                        method: "POST",
                        headers: { "Content-Type": "application/json" },
                        body: JSON.stringify({
                          chatId: message.chatId,
                          messageId: message.id,
                          data: btn.data
                        })
                      });
                    } catch (err) {
                      console.error("Failed to click callback button", err);
                    }
                  }
                };
                return (
                  <button 
                    key={bIdx}
                    onClick={handleClickBtn}
                    className="flex-1 py-1.5 px-3 bg-[#1e1e2c] hover:bg-[#252538] border border-indigo-500/10 hover:border-indigo-500/30 text-indigo-200 hover:text-white text-[11px] font-medium rounded-xl text-center shadow-md cursor-pointer transition-all active:scale-95"
                  >
                    {btn.text}
                  </button>
                );
              })}
            </div>
          ))}
        </div>
      )}
    </div>

      <AnimatePresence>
      {showActions && (
        <>
          <div 
            className="fixed inset-0 bg-black/45 backdrop-blur-[2px] z-[190]" 
            onClick={(e) => {
              e.stopPropagation();
              setShowActions(false);
            }} 
          />
          <motion.div 
            id={`actions-${message.id}`}
            initial={{ opacity: 0, scale: 0.95, y: menuPosition === 'above' ? 8 : -8 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: menuPosition === 'above' ? 8 : -8 }}
            transition={{ type: "spring", stiffness: 450, damping: 28 }}
            className={`absolute ${isUser ? 'right-0' : 'left-0'} ${
              menuPosition === 'above' ? 'bottom-full mb-2' : 'top-full mt-2'
            } z-[200] bg-[#1a1c26]/95 border border-white/20 rounded-2xl shadow-2xl flex flex-col p-2 gap-1.5 backdrop-blur-2xl min-w-[280px] max-w-[320px] select-none`}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between px-2 py-1.5 border-b border-white/10 mb-1">
               {['👍', '👎', '❤️', '🔥', '😂', '👏', '⚡️'].map((emoji, index) => (
                 <motion.button 
                   key={emoji} 
                   initial={{ opacity: 0, scale: 0.5 }}
                   animate={{ opacity: 1, scale: 1 }}
                   transition={{ delay: index * 0.03 }}
                   onTouchStart={() => handleReactionPressStart(emoji)}
                   onTouchEnd={(e) => {
                     handleReactionPressEnd();
                     if (isReactionHeldRef.current) {
                       e.stopPropagation();
                     }
                   }}
                   onTouchCancel={handleReactionPressEnd}
                   onMouseDown={() => handleReactionPressStart(emoji)}
                   onMouseUp={handleReactionPressEnd}
                   onMouseLeave={handleReactionPressEnd}
                   onContextMenu={(e) => {
                     e.preventDefault();
                     e.stopPropagation();
                     handleReactionPressEnd();
                     setShowActions(false);
                     triggerHaptic("heavy");
                     window.dispatchEvent(
                       new CustomEvent("open-reaction-details", {
                         detail: {
                           messageId: message.id,
                           chatId: (message as any).chatId,
                           reactions,
                           initialEmoji: emoji,
                         },
                       })
                     );
                   }}
                   onClick={(e) => {
                     e.stopPropagation();
                     if (isReactionHeldRef.current) {
                       isReactionHeldRef.current = false;
                       return;
                     }
                     handleReact(emoji);
                     setShowActions(false);
                   }} 
                   whileHover={{ scale: 1.35 }}
                   whileTap={{ scale: 0.9 }}
                   className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-white/15 transition-all text-xl cursor-pointer"
                   title="Нажмите для реакции или зажмите для просмотра"
                 >
                   {emoji}
                 </motion.button>
               ))}
            </div>

            <div className="grid grid-cols-2 gap-1">
              {onReply && (
                <button 
                  onClick={(e) => { e.stopPropagation(); onReply(message.id); setShowActions(false); }} 
                  className="px-2.5 py-2 rounded-xl hover:bg-white/10 text-gray-200 hover:text-white transition-colors flex items-center gap-2 text-xs font-medium cursor-pointer"
                >
                  <CornerUpLeft className="w-4 h-4 text-sky-400 shrink-0" />
                  <span>Ответить</span>
                </button>
              )}

              <button 
                onClick={(e) => { 
                  e.stopPropagation(); 
                  setShowActions(false); 
                  setShowReadInfoModal(true);
                  triggerHaptic("medium");
                }} 
                className="px-2.5 py-2 rounded-xl hover:bg-sky-500/20 text-sky-300 hover:text-sky-200 transition-colors flex items-center gap-2 text-xs font-medium cursor-pointer"
                title="Посмотреть точное время прочтения сообщения"
              >
                <CheckCheck className="w-4 h-4 text-sky-400 shrink-0" />
                <span>Когда прочитано</span>
              </button>
              
              <button 
                onClick={(e) => { 
                  e.stopPropagation(); 
                  window.dispatchEvent(new CustomEvent('forward-to-contact-request', { 
                    detail: { 
                      messageId: message.id, 
                      text: message.text || "[Вложение]"
                    }
                  }));
                  setShowActions(false); 
                }} 
                className="px-2.5 py-2 rounded-xl hover:bg-white/10 text-gray-200 hover:text-white transition-colors flex items-center gap-2 text-xs font-medium cursor-pointer"
              >
                <Forward className="w-4 h-4 text-emerald-400 shrink-0" />
                <span>Переслать</span>
              </button>

              <button 
                onClick={(e) => { e.stopPropagation(); handleCopy(); setShowActions(false); }} 
                className="px-2.5 py-2 rounded-xl hover:bg-white/10 text-gray-200 hover:text-white transition-colors flex items-center gap-2 text-xs font-medium cursor-pointer"
              >
                {copied ? <Check className="w-4 h-4 text-green-400 shrink-0" /> : <Copy className="w-4 h-4 text-gray-400 shrink-0" />}
                <span>{copied ? "Скопировано" : "Копировать"}</span>
              </button>

              {onPin && (
                <button 
                  onClick={(e) => { e.stopPropagation(); onPin(message.id); setShowActions(false); }} 
                  className="px-2.5 py-2 rounded-xl hover:bg-white/10 text-gray-200 hover:text-white transition-colors flex items-center gap-2 text-xs font-medium cursor-pointer"
                >
                  <Pin className="w-4 h-4 text-amber-400 shrink-0" />
                  <span>{isPinned ? "Открепить" : "Закрепить"}</span>
                </button>
              )}

              <button 
                onClick={(e) => { 
                  e.stopPropagation(); 
                  if (onSelect) onSelect(message.id); 
                  setShowActions(false); 
                }} 
                className="px-2.5 py-2 rounded-xl hover:bg-white/10 text-gray-200 hover:text-white transition-colors flex items-center gap-2 text-xs font-medium cursor-pointer"
              >
                <Check className="w-4 h-4 text-indigo-400 shrink-0" />
                <span>Выбрать</span>
              </button>

              {message.text && (
                <button 
                  onClick={(e) => { 
                    e.stopPropagation(); 
                    setShowActions(false); 
                    handleTranslate(); 
                  }} 
                  className="px-2.5 py-2 rounded-xl hover:bg-indigo-500/20 text-indigo-300 hover:text-indigo-200 transition-colors flex items-center gap-2 text-xs font-medium cursor-pointer"
                >
                  <Globe className="w-4 h-4 text-indigo-400 shrink-0" />
                  <span>Перевести</span>
                </button>
              )}

              <button 
                onClick={(e) => { e.stopPropagation(); setIsMarkdownMode(!isMarkdownMode); setShowActions(false); }} 
                className="px-2.5 py-2 rounded-xl hover:bg-white/10 text-gray-200 hover:text-white transition-colors flex items-center gap-2 text-xs font-medium cursor-pointer"
              >
                <Code className="w-4 h-4 text-purple-400 shrink-0" />
                <span>{isMarkdownMode ? 'Текст' : 'Формат'}</span>
              </button>

              {isUser && onEdit && !message.media && (
                <button 
                  onClick={(e) => { e.stopPropagation(); setIsEditing(true); setShowActions(false); }}
                  className="px-2.5 py-2 rounded-xl hover:bg-white/10 text-gray-200 hover:text-white transition-colors flex items-center gap-2 text-xs font-medium cursor-pointer"
                >
                  <Edit2 className="w-4 h-4 text-cyan-400 shrink-0" />
                  <span>Изменить</span>
                </button>
              )}

              {onDelete && (
                <button 
                  onClick={(e) => { e.stopPropagation(); onDelete(message.id); setShowActions(false); }}
                  className="px-2.5 py-2 rounded-xl hover:bg-red-500/20 text-red-400 hover:text-red-300 transition-colors flex items-center gap-2 text-xs font-medium cursor-pointer col-span-2"
                >
                  <Trash2 className="w-4 h-4 text-red-400 shrink-0" />
                  <span>Удалить сообщение</span>
                </button>
              )}
            </div>
          </motion.div>
        </>
      )}
      </AnimatePresence>

      {/* Message Read Info Modal (When long-pressed or selected from menu) */}
      <MessageReadInfoModal
        isOpen={showReadInfoModal}
        onClose={() => setShowReadInfoModal(false)}
        message={message}
        chatName={message.senderName}
        isChannel={isChannel}
      />
    </div>
  );
}

export const MessageItem = memo(MessageItemComponent);
