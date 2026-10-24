import { TelegramGallerySheet } from "./TelegramGallerySheet";
import { SavedMessagesProfileView } from "./SavedMessagesProfileView";
import { RichMessageModal } from "./RichMessageModal";
import { AiMessageHelperModal } from "./AiMessageHelperModal";
import { AiSettingsModal } from "./AiSettingsModal";
import {  useState, useRef, useEffect, MouseEvent } from "react";
import { motion, AnimatePresence } from "motion/react";
import {
  Folder, Send,
  Phone,
  MoreVertical,
  Loader2,
  Paperclip,
  X,
  ArrowLeft,
  Pen,
  Type,
  Save,
  Mic,
  Square,
  Upload,
  Edit2,
  Video,
  Check,
  RefreshCw,
  Volume2,
  Trash2,
  ChevronLeft,
  ChevronRight,
  ChevronUp,
  VolumeX,
  File as FileIcon,
  ArrowDown,
  Calendar,
  Image as ImageIcon,
  ShieldCheck,
  Lock,
  Eye,
  EyeOff,
  Key,
  Radio,
  Zap,
  CheckCircle2,
  Star,
  Sparkles,
  StickyNote,
} from "lucide-react";
import { MessageItem } from "./MessageItem";
import { UserStoriesModal } from "./UserStoriesModal";
import { io } from "socket.io-client";
import { mediaSync } from "../utils/mediaSyncManager";
import { compressImageForCellularUpload } from "../utils/ecoStream";
import { detectUserClient, setPeerClientType, scanForAyuGram, AyuGramScanResult } from "../utils/clientDetector";
import { isGhostModeActive, isAntiRecallActive } from "../utils/pluginManager";
import { triggerHaptic } from "../utils/haptics";
import { SecretChatKeyModal } from "./SecretChatKeyModal";
import { AyuGramDetectionModal } from "./AyuGramDetectionModal";
import { 
  isBlockchainEncryptionEnabled, 
  setBlockchainEncryptionEnabled, 
  isLiveKeystrokesViewEnabled, 
  setLiveKeystrokesViewEnabled, 
  createNexusEncryptedBlock, 
  saveNexusBlockLocally, 
  fileToBase64, 
  blobToBase64, 
  NexusBlockData,
  isNexusBlockMessage,
  encryptNexusTextMessage,
  isUserNexusgramClient,
  registerUserAsNexusgram
} from "../utils/nexusBlockchain";
import { NexusBlockchainModal } from "./NexusBlockchainModal";
import { useI18n } from "../utils/i18n";
import { dispatchIslandMergeState } from "./DynamicIslandMergeEffect";
import { REAL_TELEGRAM_NFT_GIFTS } from "../data/telegramNftGifts";
import { compressImageForUpload, recordDataTransfer } from "../utils/ecoStream";


function ImageEditor({
  imageUrl,
  onSave,
  onCancel,
}: {
  imageUrl: string;
  onSave: (file: File) => void;
  onCancel: () => void;
}) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [ctx, setCtx] = useState<CanvasRenderingContext2D | null>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [color, setColor] = useState("#ff0000");
  const [mode, setMode] = useState<"draw" | "text">("draw");
  const [textInput, setTextInput] = useState("");
  const [imageEl, setImageEl] = useState<HTMLImageElement | null>(null);

  useEffect(() => {
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.src = imageUrl;
    img.onload = () => {
      setImageEl(img);
      const canvas = canvasRef.current;
      if (canvas) {
        canvas.width = img.width;
        canvas.height = img.height;
        const context = canvas.getContext("2d");
        if (context) {
          context.drawImage(img, 0, 0);
          context.lineWidth = 5;
          context.lineCap = "round";
          setCtx(context);
        }
      }
    };
  }, [imageUrl]);

  const startDrawing = (e: any) => {
    if (mode === "text") return;
    const canvas = canvasRef.current;
    if (!canvas || !ctx) return;
    const rect = canvas.getBoundingClientRect();
    const x = (e.clientX - rect.left) * (canvas.width / rect.width);
    const y = (e.clientY - rect.top) * (canvas.height / rect.height);
    ctx.strokeStyle = color;
    ctx.beginPath();
    ctx.moveTo(x, y);
    setIsDrawing(true);
  };

  const draw = (e: any) => {
    if (!isDrawing || mode === "text") return;
    const canvas = canvasRef.current;
    if (!canvas || !ctx) return;
    const rect = canvas.getBoundingClientRect();
    const x = (e.clientX - rect.left) * (canvas.width / rect.width);
    const y = (e.clientY - rect.top) * (canvas.height / rect.height);
    ctx.lineTo(x, y);
    ctx.stroke();
  };

  const stopDrawing = () => {
    setIsDrawing(false);
    ctx?.closePath();
  };

  const addText = (e: any) => {
    if (mode !== "text" || !textInput.trim()) return;
    const canvas = canvasRef.current;
    if (!canvas || !ctx) return;
    const rect = canvas.getBoundingClientRect();
    const x = (e.clientX - rect.left) * (canvas.width / rect.width);
    const y = (e.clientY - rect.top) * (canvas.height / rect.height);
    ctx.fillStyle = color;
    ctx.font = "bold 30px Arial";
    ctx.fillText(textInput, x, y);
    setTextInput(""); // Reset
  };

  const handleSave = () => {
    if (!canvasRef.current) return;
    canvasRef.current.toBlob(
      (blob) => {
        if (blob) {
          const file = new File([blob], "edited-image.jpg", {
            type: "image/jpeg",
          });
          onSave(file);
        }
      },
      "image/jpeg",
      0.9,
    );
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/90 flex flex-col">
      <div className="p-4 flex items-center justify-between border-b border-[#2a2a38] bg-[#09090b]">
        <button onClick={onCancel} className="text-gray-400 hover:text-white">
          <X className="w-6 h-6" />
        </button>
        <div className="flex items-center gap-4">
          <input
            type="color"
            value={color}
            onChange={(e) => setColor(e.target.value)}
            className="w-8 h-8 rounded shrink-0 cursor-pointer"
          />
          <button
            onClick={() => setMode("draw")}
            className={`p-2 rounded ${mode === "draw" ? "bg-blue-500 text-white" : "text-gray-400"}`}
          >
            <Pen className="w-5 h-5" />
          </button>
          <button
            onClick={() => setMode("text")}
            className={`p-2 rounded ${mode === "text" ? "bg-blue-500 text-white" : "text-gray-400"}`}
          >
            <Type className="w-5 h-5" />
          </button>
          {mode === "text" && (
            <input
              type="text"
              value={textInput}
              onChange={(e) => setTextInput(e.target.value)}
              placeholder="Type & click to place"
              className="px-3 py-1 bg-[#1a1a24] text-white rounded outline-none border border-[#2a2a38] w-40"
            />
          )}
        </div>
        <button
          onClick={handleSave}
          className="px-4 py-1.5 bg-blue-600 text-white rounded-lg flex items-center gap-2 hover:bg-blue-500"
        >
          <Save className="w-4 h-4" /> Save
        </button>
      </div>
      <div className="flex-1 overflow-auto flex items-center justify-center p-4">
        {imageEl ? (
          <canvas
            ref={canvasRef}
            onMouseDown={startDrawing}
            onMouseMove={draw}
            onMouseUp={stopDrawing}
            onMouseLeave={stopDrawing}
            onClick={addText}
            className="max-w-full max-h-full object-contain cursor-crosshair border border-[#2a2a38] bg-[#111116]"
          />
        ) : (
          <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
        )}
      </div>
    </div>
  );
}

function ChatProfileDialog({
  onClose,
  chatId,
  chatName,
  onSelectUser,
  messages = [],
  onSendGift,
}: {
  onClose: () => void;
  chatId: string;
  chatName: string;
  onSelectUser?: (id: string, name: string) => void;
  messages?: any[];
  onSendGift?: (msg: any) => void;
}) {
  const localData = JSON.parse(
    localStorage.getItem(`local_profile_${chatId}`) || "{}",
  );

  const [profile, setProfile] = useState<{
    id: string;
    name: string;
    isOnline: boolean;
    statusStr: string;
    username?: string;
    about?: string;
    isNexusClient?: boolean;
    participantCount?: number;
    isBroadcast?: boolean;
    isGroup?: boolean;
    isMegagroup?: boolean;
    isChannel?: boolean;
    country?: string;
    startDate?: string;
    joinedDate?: string;
    subDate?: string;
    verified?: boolean;
    premium?: boolean;
    fake?: boolean;
    scam?: boolean;
  } | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [editName, setEditName] = useState(localData.name || chatName);
  const [editBio, setEditBio] = useState(localData.about || "");
  const [editUsername, setEditUsername] = useState(localData.username || "");
  const initialNote = localStorage.getItem(`chat_note_${chatId}`) || localData.note || "";
  const [chatNote, setChatNote] = useState(initialNote);
  const [editNote, setEditNote] = useState(initialNote);
  const [editIsNexus, setEditIsNexus] = useState<boolean>(() => {
    return isUserNexusgramClient(chatId) || Boolean(localData.isNexusClient);
  });
  const [previewAvatar, setPreviewAvatar] = useState(
    localData.avatarUrl || null,
  );

  const [participants, setParticipants] = useState<any[]>([]);
  const [loadingMembers, setLoadingMembers] = useState(false);
  const [avatarUrls, setAvatarUrls] = useState<string[]>([]);
  const [similarChats, setSimilarChats] = useState<any[]>([]);
  const [activeAvatarIdx, setActiveAvatarIdx] = useState(0);
  const [touchStartXProfile, setTouchStartXProfile] = useState<number | null>(null);

  const [showFullStats, setShowFullStats] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);

  const categories = [
    { id: "files", label: "📁 Файлы", type: "document" },
    { id: "media", label: "🎬 Картинки и Видео", type: "media" },
    { id: "saved", label: "⭐️ Сохраненные", type: "saved" },
    { id: "links", label: "🔗 Ссылки", type: "links" },
    { id: "gifts", label: "🎁 Подарки", type: "gifts" },
    { id: "polls", label: "📊 Опросы", type: "polls" },
    { id: "channels", label: "📣 Каналы и Группы", type: "channels" },
    { id: "audio", label: "🎵 Аудио файлы", type: "audio" },
    { id: "circles", label: "🎥 Видео кружочки", type: "v_note" },
  ];

  const getCategoryItems = (catId: string) => {
    return messages.filter((m) => {
      if (catId === "files") {
        return m.media && !m.videoNote && (m.mimeType && !m.mimeType.startsWith("image/") && !m.mimeType.startsWith("video/") && !m.mimeType.startsWith("audio/"));
      }
      if (catId === "media") {
        return m.media && !m.videoNote && (m.mimeType?.startsWith("image/") || m.mimeType?.startsWith("video/") || m.mediaType === 'MessageMediaPhoto');
      }
      if (catId === "saved") {
        return m.fwdFrom || m.edited;
      }
      if (catId === "links") {
        return m.text && (m.text.includes("http://") || m.text.includes("https://") || m.text.includes("t.me/"));
      }
      if (catId === "gifts") {
        return m.text && (m.text.toLowerCase().includes("gift") || m.text.toLowerCase().includes("подарок"));
      }
      if (catId === "polls") {
        return m.media && m.mediaType === "MessageMediaPoll";
      }
      if (catId === "channels") {
        return m.text && (m.text.includes("@") || m.text.includes("t.me/joinchat"));
      }
      if (catId === "audio") {
        return m.mimeType?.startsWith("audio/");
      }
      if (catId === "circles") {
        return m.videoNote;
      }
      return false;
    });
  };

  const avatarContainerRef = useRef<HTMLDivElement>(null);
  const [pullY, setPullY] = useState(0);
  const [profileScrollTop, setProfileScrollTop] = useState(0);
  const [touchStartXProfilePage, setTouchStartXProfilePage] = useState<number | null>(null);
  const touchStartYRef = useRef<number | null>(null);
  const pullRafRef = useRef<number | null>(null);

  // Swipe down avatar expansion and profile stories
  const [isPhotoExpanded, setIsPhotoExpanded] = useState(false);
  const [touchStartYAvatar, setTouchStartYAvatar] = useState<number | null>(null);
  const [chatStories, setChatStories] = useState<any[]>([]);
  const [activeStoryIdx, setActiveStoryIdx] = useState<number | null>(null);

  useEffect(() => {
    fetch("/api/telegram/stories")
      .then((r) => r.json())
      .then((data) => {
        if (data?.stories && Array.isArray(data.stories)) {
          const strChatId = String(chatId);
          const found = data.stories.filter((s: any) => 
            s.userId === strChatId || 
            (profile?.username && s.userId === profile.username) ||
            (strChatId === "durov" && s.userId === "durov") ||
            (strChatId === "telegram" && s.userId === "telegram")
          );
          if (found.length > 0) {
            setChatStories(found);
          } else if (strChatId === "me" || strChatId === "saved-messages") {
            try {
              const mySt = JSON.parse(localStorage.getItem("nexus_my_stories") || "[]");
              setChatStories(mySt);
            } catch {}
          } else {
            try {
              const custom = JSON.parse(localStorage.getItem(`stories_${strChatId}`) || "[]");
              if (Array.isArray(custom) && custom.length > 0) setChatStories(custom);
            } catch {}
          }
        }
      })
      .catch(() => {});
  }, [chatId, profile?.username]);

  const hasClientIndicator = Boolean(
    editIsNexus ||
    profile?.isNexusClient ||
    (profile?.about && profile.about.includes("\u200B\u2060\u200D")) ||
    (typeof chatId === "string" && (chatId === "me" || isUserNexusgramClient(chatId)))
  );

  // Dynamic Island liquid merge effect:
  // Tracks avatar in real time during scroll and gesture pull
  useEffect(() => {
    const updateTracking = () => {
      const rect = avatarContainerRef.current?.getBoundingClientRect();
      const centerX = rect && rect.width > 0 ? rect.left + rect.width / 2 : window.innerWidth / 2;
      const centerY = rect && rect.height > 0 ? rect.top + rect.height / 2 : 96;
      const radius = rect && rect.width > 0 ? rect.width / 2 : 48;

      dispatchIslandMergeState({
        isActive: true,
        hasClient: true,
        avatarX: centerX,
        avatarY: centerY,
        avatarRadius: radius,
        dragDeltaY: pullY,
      });
    };

    updateTracking();

    window.addEventListener("scroll", updateTracking, { passive: true });
    window.addEventListener("resize", updateTracking, { passive: true });
    return () => {
      window.removeEventListener("scroll", updateTracking);
      window.removeEventListener("resize", updateTracking);
    };
  }, [pullY]);

  // Загрузка личной заметки к чату
  useEffect(() => {
    fetch(`/api/telegram/chat/${chatId}/note`)
      .then((res) => res.json())
      .then((data) => {
        if (data && data.note !== undefined) {
          setChatNote(data.note);
          setEditNote((prev) => prev || data.note);
          localStorage.setItem(`chat_note_${chatId}`, data.note);
        }
      })
      .catch(console.error);
  }, [chatId]);

  useEffect(() => {
    return () => {
      dispatchIslandMergeState({
        isActive: false,
        hasClient: false,
        avatarX: window.innerWidth / 2,
        avatarY: 114,
        avatarRadius: 48,
        dragDeltaY: 0,
      });
    };
  }, []);

  const getCategoryItemsCount = (catId: string) => {
    if (catId === "gifts") return REAL_TELEGRAM_NFT_GIFTS.length;
    const items = getCategoryItems(catId);
    return items.length > 0 ? items.length : (Math.abs(parseInt(chatId || "0")) % 5) + 1;
  };

  useEffect(() => {
    fetch(`/api/telegram/user/${chatId}`)
      .then((res) => res.json())
      .then((data) => {
        setProfile({
          id: chatId,
          name: localData.name || data.firstName || chatName,
          isOnline: data.isOnline,
          statusStr: data.statusStr,
          username: localData.username || data.username,
          about: localData.about || data.about,
          isNexusClient: Boolean(data.isNexusClient || (data.about && data.about.includes("\u200B\u2060\u200D"))),
          participantCount: data.participantCount,
          isChannel: data.isChannel,
          isBroadcast: data.isBroadcast,
          isGroup: data.isGroup,
          isMegagroup: data.isMegagroup,
          country: data.country,
          startDate: data.startDate,
          joinedDate: data.joinedDate,
          subDate: data.subDate,
          verified: data.verified,
          premium: data.premium,
          fake: data.fake,
          scam: data.scam,
        } as any);
        if (!editBio && data.about) setEditBio(data.about);
        if (!editUsername && data.username) setEditUsername(data.username);
      })
      .catch(console.error);

    // Fetch members if it is a channel or a group
    setLoadingMembers(true);
    fetch(`/api/telegram/chat/${chatId}/participants`)
      .then((res) => res.json())
      .then((data) => {
        if (data.participants && Array.isArray(data.participants)) {
          setParticipants(data.participants);
        }
        setLoadingMembers(false);
      })
      .catch((e) => {
        console.error("Error loaded participants:", e);
        setLoadingMembers(false);
      });

    // Fetch other user avatars (multi-avatars swiping list)
    fetch(`/api/telegram/avatars/${chatId}`)
      .then(res => res.json())
      .then(data => {
        if (data && Array.isArray(data.avatars)) {
          setAvatarUrls(data.avatars);
        }
      })
      .catch(console.error);

    // Fetch similar channels or groups
    fetch(`/api/telegram/common-chats/${chatId}`)
      .then(res => res.json())
      .then(data => {
        if (data && Array.isArray(data)) {
          setSimilarChats(data);
        } else if (data && Array.isArray(data.chats)) {
          setSimilarChats(data.chats);
        } else if (data && Array.isArray(data.commonChats)) {
          setSimilarChats(data.commonChats);
        }
      })
      .catch(console.error);
  }, [chatId, chatName]);

  const handleSave = () => {
    const trimmedNote = editNote.trim();
    const data = {
      ...localData,
      name: editName,
      about: editBio,
      username: editUsername,
      note: trimmedNote,
      isNexusClient: editIsNexus,
      avatarUrl: previewAvatar || localData.avatarUrl,
    };
    localStorage.setItem(`local_profile_${chatId}`, JSON.stringify(data));
    localStorage.setItem(`chat_note_${chatId}`, trimmedNote);
    setChatNote(trimmedNote);

    if (editIsNexus) {
      registerUserAsNexusgram(chatId, true);
    } else {
      registerUserAsNexusgram(chatId, false);
    }

    // Сохраняем заметку на сервере
    fetch(`/api/telegram/chat/${chatId}/note`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ note: trimmedNote }),
    }).catch(console.error);

    window.dispatchEvent(new CustomEvent("chat-note-updated", { detail: { chatId, note: trimmedNote } }));
    window.dispatchEvent(new CustomEvent("dialog-update", { detail: { chatId } }));
    window.dispatchEvent(new CustomEvent("nexus-users-updated", { detail: { chatId, isClient: editIsNexus } }));

    setProfile((prev) =>
      prev
        ? { ...prev, name: editName, about: editBio, username: editUsername, isNexusClient: editIsNexus }
        : null,
    );
    setIsEditing(false);
  };

  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        setPreviewAvatar(event.target?.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const getDialogInitials = (title: string) => {
    return (title || "U").substring(0, 2).toUpperCase();
  };

  const getDialogColor = (id: string) => {
    const colors = [
      "bg-red-500",
      "bg-blue-500",
      "bg-green-500",
      "bg-yellow-500",
      "bg-purple-500",
      "bg-pink-500",
      "bg-indigo-500",
      "bg-teal-500",
    ];
    let hash = 0;
    for (let i = 0; i < id.length; i++)
      hash = id.charCodeAt(i) + ((hash << 5) - hash);
    return colors[Math.abs(hash) % colors.length];
  };

  return (
    <div
      className="fixed inset-0 bg-[#0e1621] z-[9999] flex flex-col select-none overflow-hidden text-white animate-in fade-in duration-150"
      onTouchStart={(e) => {
        setTouchStartXProfilePage(e.touches[0].clientX);
        touchStartYRef.current = e.touches[0].clientY;
      }}
      onTouchMove={(e) => {
        if (touchStartYRef.current !== null) {
          const dy = e.touches[0].clientY - touchStartYRef.current;
          if (dy > 0 && profileScrollTop <= 5) {
            const nextVal = Math.min(120, dy * 0.75);
            if (!pullRafRef.current) {
              pullRafRef.current = requestAnimationFrame(() => {
                setPullY(nextVal);
                pullRafRef.current = null;
              });
            }
          }
        }
      }}
      onTouchEnd={(e) => {
        if (pullRafRef.current) {
          cancelAnimationFrame(pullRafRef.current);
          pullRafRef.current = null;
        }
        if (touchStartXProfilePage !== null) {
          const dx = e.changedTouches[0].clientX - touchStartXProfilePage;
          if (dx > 80 && touchStartXProfilePage < 70) {
            triggerHaptic("medium");
            onClose();
            return;
          }
        }
        if (touchStartYRef.current !== null) {
          const dy = e.changedTouches[0].clientY - touchStartYRef.current;
          if (isPhotoExpanded && dy < -25) {
            triggerHaptic("medium");
            setIsPhotoExpanded(false);
          } else if (!isPhotoExpanded && (dy > 40 || pullY > 35) && profileScrollTop <= 10) {
            triggerHaptic("medium");
            setIsPhotoExpanded(true);
          }
        }
        setPullY(0);
        touchStartYRef.current = null;
        setTouchStartXProfilePage(null);
      }}
    >
      {/* Top Navigation Bar: Sticky with Back button, Centered Name Title that fades in when avatar shrinks into Island, and Actions */}
      <div className="sticky top-0 z-40 px-4 pt-[max(12px,env(safe-area-inset-top,12px))] pb-2.5 flex items-center justify-between bg-[#0e1621]/90 backdrop-blur-md border-b border-white/5 transition-colors shrink-0">
        <button
          onClick={() => {
            triggerHaptic("light");
            onClose();
          }}
          className="px-3 py-1.5 rounded-full bg-[#1c2433]/85 backdrop-blur-md border border-white/10 active:scale-95 text-[#3897f0] flex items-center gap-1 font-medium text-sm shadow-lg cursor-pointer transition-transform shrink-0"
        >
          <ChevronLeft className="w-5 h-5 -ml-1" />
          <span>Назад</span>
        </button>

        {/* Centered Name Title in Header: Fades in ONLY when user name under/on avatar disappears from view upon scroll! */}
        <div 
          className="flex-1 px-3 text-center truncate pointer-events-none transition-all duration-200"
          style={{
            opacity: isPhotoExpanded
              ? (profileScrollTop > 330 ? Math.min(1, (profileScrollTop - 330) / 35) : 0)
              : (profileScrollTop > 140 ? Math.min(1, (profileScrollTop - 140) / 30) : 0),
            transform: `translate3d(0, ${Math.max(0, (1 - (isPhotoExpanded ? (profileScrollTop > 330 ? Math.min(1, (profileScrollTop - 330) / 35) : 0) : (profileScrollTop > 140 ? Math.min(1, (profileScrollTop - 140) / 30) : 0))) * 8)}px, 0)`
          }}
        >
          <h3 className="text-sm font-semibold text-white truncate inline-flex items-center justify-center gap-1">
            <span>{profile?.name || editName || chatName}</span>
            {profile?.verified && (
              <CheckCircle2 className="w-3.5 h-3.5 text-blue-400 fill-blue-400 shrink-0 inline" />
            )}
          </h3>
          <p className="text-[10px] text-gray-400 truncate">
            {profile?.statusStr || (profile?.isOnline ? "в сети" : "был(а) недавно")}
          </p>
        </div>

        {/* Top Right Controls: Edit & Close */}
        <div className="flex items-center gap-2 shrink-0">
          {!isEditing ? (
            <button
              onClick={() => setIsEditing(true)}
              className="p-2 bg-[#1c2433]/85 backdrop-blur-md border border-white/10 hover:bg-white/10 rounded-full text-gray-200 transition-colors shadow-lg cursor-pointer"
              title="Редактировать профиль"
            >
              <Pen className="w-4 h-4" />
            </button>
          ) : (
            <button
              onClick={handleSave}
              className="px-3.5 py-1.5 bg-blue-500 hover:bg-blue-600 rounded-full text-white font-medium text-xs flex items-center gap-1.5 transition-colors shadow-lg cursor-pointer"
              title="Сохранить"
            >
              <Save className="w-3.5 h-3.5" />
              <span>Сохранить</span>
            </button>
          )}
          <button
            onClick={() => {
              triggerHaptic("light");
              onClose();
            }}
            className="p-2 bg-[#1c2433]/85 backdrop-blur-md border border-white/10 hover:bg-white/10 rounded-full text-gray-200 transition-colors shadow-lg cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Unified Scrollable Container: Avatar and Page Content Scroll and Swipe Together! */}
      <div 
        onScroll={(e) => {
          setProfileScrollTop(e.currentTarget.scrollTop);
        }}
        className="flex-1 overflow-y-auto pb-12 max-w-lg w-full mx-auto select-none"
        style={{
          transform: `translate3d(0, ${pullY}px, 0)`,
          transition: pullY === 0 ? "transform 0.25s cubic-bezier(0.2, 0.9, 0.3, 1)" : "none",
        }}
      >
        {/* Dynamic Hero Avatar Area: Fluid Morphing Animation between Full-Width Square (Half-Screen) and Round Circle */}
        <div className="w-full flex flex-col items-center shrink-0">
          {(() => {
            const avatars = avatarUrls.length > 0 ? avatarUrls : [previewAvatar || `/api/telegram/avatar/${chatId}`];
            const totalAvatars = avatars.length;

            const handlePrev = (e: React.MouseEvent) => {
              e.stopPropagation();
              setActiveAvatarIdx((prev) => (prev === 0 ? totalAvatars - 1 : prev - 1));
            };

            const handleNext = (e: React.MouseEvent) => {
              e.stopPropagation();
              setActiveAvatarIdx((prev) => (prev === totalAvatars - 1 ? 0 : prev + 1));
            };

            return (
              <motion.div
                layout
                transition={{ duration: 0.05, ease: [0.15, 0.85, 0.35, 1] }}
                className={`w-full flex flex-col items-center select-none ${
                  isPhotoExpanded ? "p-0" : "pt-3 pb-1"
                }`}
              >
                {/* Unified Avatar Morphing Container (Circle <-> Square) - Ultra-fast transition */}
                <motion.div
                  layout
                  transition={{ duration: 0.05, ease: [0.15, 0.85, 0.35, 1] }}
                  className={`relative overflow-hidden cursor-pointer select-none transition-all duration-50 ease-out ${
                    isPhotoExpanded
                      ? "w-full aspect-square rounded-none bg-black shadow-2xl"
                      : "w-32 h-32 rounded-full border-2 border-white/10 shadow-xl"
                  }`}
                  onClick={() => {
                    triggerHaptic("medium");
                    setIsPhotoExpanded(!isPhotoExpanded);
                  }}
                  onTouchStart={(e) => setTouchStartYAvatar(e.touches[0].clientY)}
                  onTouchEnd={(e) => {
                    if (touchStartYAvatar !== null) {
                      const diff = e.changedTouches[0].clientY - touchStartYAvatar;
                      if (isPhotoExpanded && diff < -20) {
                        // Слегка смахнуть вверх чтобы вернуть обратно в круг
                        triggerHaptic("medium");
                        setIsPhotoExpanded(false);
                      } else if (!isPhotoExpanded && diff > 25) {
                        // Смахнуть вниз чтобы открыть квадрат
                        triggerHaptic("medium");
                        setIsPhotoExpanded(true);
                      }
                    }
                    setTouchStartYAvatar(null);
                  }}
                  title={isPhotoExpanded ? "Нажмите или смахните вверх, чтобы свернуть в круг" : "Нажмите или смахните вниз, чтобы открыть квадратное фото"}
                >
                  <img
                    src={avatars[activeAvatarIdx]}
                    alt={editName}
                    className="w-full h-full object-cover select-none pointer-events-none"
                    onError={(e) => (e.currentTarget.style.display = "none")}
                  />
                  <span className={`text-white font-semibold opacity-90 tracking-wide absolute inset-0 flex items-center justify-center -z-10 ${isPhotoExpanded ? "text-6xl" : "text-3xl"}`}>
                    {getDialogInitials(editName || chatName)}
                  </span>

                  {/* Dark gradient backdrop in square mode for bottom text readability */}
                  {isPhotoExpanded && (
                    <div className="absolute inset-x-0 bottom-0 h-36 bg-gradient-to-t from-black/90 via-black/40 to-transparent pointer-events-none z-10" />
                  )}

                  {/* Multiple Avatar Pagination Bars */}
                  {totalAvatars > 1 && (
                    <div className="absolute top-2 inset-x-0 flex items-center gap-1.5 justify-center z-20 px-4">
                      {Array.from({ length: totalAvatars }).map((_, idx) => {
                        const isActive = idx === activeAvatarIdx;
                        return (
                          <div
                            key={idx}
                            onClick={(e) => {
                              e.stopPropagation();
                              setActiveAvatarIdx(idx);
                            }}
                            className={`h-1 cursor-pointer transition-all flex-1 rounded-full ${
                              isActive ? "bg-white shadow-sm" : "bg-white/40 hover:bg-white/60"
                            }`}
                          />
                        );
                      })}
                    </div>
                  )}

                  {/* Navigation arrows if multiple avatars in square mode */}
                  {isPhotoExpanded && totalAvatars > 1 && (
                    <>
                      <button
                        type="button"
                        onClick={handlePrev}
                        className="absolute left-3 top-1/2 -translate-y-1/2 z-20 p-2.5 bg-black/50 hover:bg-black/70 text-white rounded-full backdrop-blur-md border border-white/20 shadow-xl transition-all active:scale-90 cursor-pointer"
                        title="Предыдущий аватар"
                      >
                        <ChevronLeft className="w-5 h-5" />
                      </button>
                      <button
                        type="button"
                        onClick={handleNext}
                        className="absolute right-3 top-1/2 -translate-y-1/2 z-20 p-2.5 bg-black/50 hover:bg-black/70 text-white rounded-full backdrop-blur-md border border-white/20 shadow-xl transition-all active:scale-90 cursor-pointer"
                        title="Следующий аватар"
                      >
                        <ChevronRight className="w-5 h-5" />
                      </button>
                    </>
                  )}

                  {/* Swipe Up Hint Pill when in Square Mode */}
                  {isPhotoExpanded && (
                    <div className="absolute top-3 inset-x-0 flex justify-center pointer-events-none z-20">
                      <div className="bg-black/60 backdrop-blur-md px-3.5 py-1 rounded-full text-xs text-white/90 flex items-center gap-1.5 shadow-lg border border-white/10">
                        <ChevronUp className="w-3.5 h-3.5 text-sky-400 animate-bounce" />
                        <span>Смахните вверх, чтобы свернуть в круг</span>
                      </div>
                    </div>
                  )}

                  {/* Username in bottom-left corner of the Square Avatar */}
                  {isPhotoExpanded && (
                    <motion.div
                      layoutId="profile-user-corner-name"
                      initial={{ opacity: 0, y: 15 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: 15 }}
                      transition={{ type: "spring", stiffness: 380, damping: 28 }}
                      className="absolute bottom-4 left-4 right-4 z-20 text-left pointer-events-none"
                    >
                      <h2 className="text-2xl font-bold text-white drop-shadow-xl flex items-center gap-2">
                        <span className="truncate">{profile?.name || editName || chatName}</span>
                        {profile?.verified && (
                          <CheckCircle2 className="w-5 h-5 text-blue-400 fill-blue-400 shrink-0 inline" />
                        )}
                        {profile?.premium && (
                          <Star className="w-5 h-5 text-purple-400 fill-purple-400 shrink-0 inline" />
                        )}
                      </h2>
                      <p className="text-xs text-sky-300 font-medium drop-shadow-md mt-0.5">
                        {profile?.statusStr || (profile?.isOnline ? "в сети" : "был(а) недавно")}
                      </p>
                    </motion.div>
                  )}

                  {/* Edit avatar button */}
                  {isEditing && (
                    <label
                      className="absolute bottom-2 right-2 w-8 h-8 bg-indigo-500 hover:bg-indigo-600 rounded-full flex items-center justify-center cursor-pointer shadow-md border-2 border-[#111116] z-30 hover:scale-105 transition-transform"
                      title="Change Avatar"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <Edit2 className="w-3.5 h-3.5 text-white" />
                      <input
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={handleAvatarChange}
                      />
                    </label>
                  )}
                </motion.div>

                {/* Multiple avatar pagination dots when in circle mode */}
                {!isPhotoExpanded && totalAvatars > 1 && (
                  <div className="flex items-center gap-1.5 mt-2 justify-center">
                    {Array.from({ length: totalAvatars }).map((_, idx) => {
                      const isActive = idx === activeAvatarIdx;
                      return (
                        <div
                          key={idx}
                          onClick={() => setActiveAvatarIdx(idx)}
                          className={`h-1 cursor-pointer transition-all ${
                            isActive ? "w-6 bg-indigo-500" : "w-4 bg-gray-600/50 hover:bg-gray-500/50"
                          } rounded-full relative flex items-center justify-center`}
                        >
                          {isActive && (
                            <span className="absolute w-2 h-2 rounded-full bg-violet-400 shadow-sm animate-pulse" />
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}
              </motion.div>
            );
          })()}
        </div>

        {/* Content Container (padded) */}
        <div className="px-4 space-y-4 w-full">
          {/* User Name & Status Directly Beneath Avatar */}
          <div className="flex flex-col items-center">
            {isEditing ? (
              <div className="w-full mt-2 space-y-4">
                <div>
                  <label className="text-xs text-gray-400 ml-1">Имя</label>
                  <input
                    value={editName}
                    onChange={(e) => setEditName(e.target.value)}
                    className="w-full bg-[#1a1a24] border border-[#2a2a38] text-white rounded-xl px-4 py-2 mt-1 focus:outline-none focus:border-indigo-500"
                  />
                </div>
                <div>
                  <label className="text-xs text-gray-400 ml-1">Username</label>
                  <input
                    value={editUsername}
                    onChange={(e) => setEditUsername(e.target.value)}
                    className="w-full bg-[#1a1a24] border border-[#2a2a38] text-white rounded-xl px-4 py-2 mt-1 focus:outline-none focus:border-indigo-500"
                  />
                </div>
                <div>
                  <label className="text-xs text-gray-400 ml-1">
                    Bio / Описание
                  </label>
                  <textarea
                    value={editBio}
                    onChange={(e) => setEditBio(e.target.value)}
                    className="w-full bg-[#1a1a24] border border-[#2a2a38] text-white rounded-xl px-4 py-2 mt-1 focus:outline-none focus:border-indigo-500 min-h-[70px]"
                  />
                </div>

                {/* Поле для личной заметки к чату при редактировании */}
                <div>
                  <label className="text-xs text-amber-400 font-medium ml-1 flex items-center gap-1.5 mb-1">
                    <StickyNote className="w-3.5 h-3.5" />
                    <span>Личная приватная заметка к чату</span>
                    <span className="text-[10px] px-1.5 py-0.2 rounded bg-amber-400/20 text-amber-300 font-normal">Только вы</span>
                  </label>
                  <textarea
                    value={editNote}
                    onChange={(e) => setEditNote(e.target.value)}
                    placeholder="Добавьте личную заметку (только для вас, видна в списке диалогов)..."
                    className="w-full bg-[#1a1a24] border border-[#2a2a38] focus:border-amber-500/50 text-white rounded-xl px-4 py-2 mt-1 focus:outline-none min-h-[64px]"
                  />
                  <p className="text-[11px] text-amber-400/80 mt-1 ml-1 flex items-center gap-1">
                    <Lock className="w-3 h-3 inline shrink-0" />
                    Уникальна и доступна исключительно вам на этом устройстве. Собеседник её не увидит.
                  </p>
                </div>

                {/* Селектор клиента Telegram собеседника */}
                <div className="bg-[#1a1a24] border border-[#2a2a38] rounded-xl px-4 py-3">
                  <label className="text-xs text-gray-400 mb-2 block font-medium">Клиент Telegram собеседника</label>
                  <div className="grid grid-cols-3 gap-2">
                    <button
                      type="button"
                      onClick={() => {
                        setEditIsNexus(false);
                        setPeerClientType(chatId, "ayugram");
                        triggerHaptic("light");
                      }}
                      className={`py-2 px-2 rounded-xl border text-xs font-semibold flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                        detectUserClient({ id: chatId }).type === "ayugram"
                          ? "bg-purple-600/30 border-purple-400/60 text-purple-200 shadow-md"
                          : "bg-white/5 border-white/10 text-gray-400 hover:text-white"
                      }`}
                    >
                      <span>🔮</span>
                      <span>AyuGram</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setEditIsNexus(true);
                        setPeerClientType(chatId, "nexusgram");
                        triggerHaptic("light");
                      }}
                      className={`py-2 px-2 rounded-xl border text-xs font-semibold flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                        detectUserClient({ id: chatId }).type === "nexusgram" || editIsNexus
                          ? "bg-cyan-600/30 border-cyan-400/60 text-cyan-200 shadow-md"
                          : "bg-white/5 border-white/10 text-gray-400 hover:text-white"
                      }`}
                    >
                      <span>⚡</span>
                      <span>Nexusgram</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setEditIsNexus(false);
                        setPeerClientType(chatId, "official");
                        triggerHaptic("light");
                      }}
                      className={`py-2 px-2 rounded-xl border text-xs font-semibold flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                        detectUserClient({ id: chatId }).type === "official" && !editIsNexus
                          ? "bg-blue-600/30 border-blue-400/60 text-blue-200 shadow-md"
                          : "bg-white/5 border-white/10 text-gray-400 hover:text-white"
                      }`}
                    >
                      <span>✈️</span>
                      <span>Telegram</span>
                    </button>
                  </div>
                </div>
              </div>
            ) : !isPhotoExpanded ? (
              <motion.div
                initial={{ opacity: 0, y: -8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                transition={{ type: "spring", stiffness: 380, damping: 28 }}
                className="text-center select-none"
              >
                <h2 className="text-xl font-display font-medium text-white mt-1 flex items-center justify-center gap-1.5 flex-wrap">
                  <span>{profile?.name || editName || chatName}</span>
                  {profile?.verified && (
                    <CheckCircle2 className="w-4 h-4 text-blue-400 fill-blue-400 shrink-0 inline ml-0.5" />
                  )}
                  {profile?.premium && (
                    <Star className="w-4 h-4 text-purple-400 fill-purple-400 shrink-0 inline ml-0.5" />
                  )}
                  {profile?.fake && (
                    <span className="px-1 py-0.2 text-[9px] font-bold bg-red-500/20 text-red-400 border border-red-500/40 rounded shrink-0 inline ml-0.5">FAKE</span>
                  )}
                  {profile?.scam && (
                    <span className="px-1 py-0.2 text-[9px] font-bold bg-red-500/20 text-red-400 border border-red-500/40 rounded shrink-0 inline ml-0.5">SCAM</span>
                  )}
                  {localStorage.getItem("nexus_profile_badge") && (chatId === "me" || (profile && profile.username === localStorage.getItem("telegram_username"))) && (
                    <span className="text-lg">{localStorage.getItem("nexus_profile_badge")}</span>
                  )}
                </h2>
                {profile?.statusStr && profile.statusStr !== "loading info..." && (
                  <p
                    className={`text-sm mt-0.5 mb-1 ${profile?.isOnline ? "text-green-500" : "text-gray-400"}`}
                  >
                    {profile.statusStr}
                  </p>
                )}
                {profile?.participantCount !== undefined && profile.participantCount > 0 && (
                  <div className="text-xs bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 px-3 py-1 rounded-full inline-block font-medium shadow-sm mt-1">
                    {profile.isChannel ? `${profile.participantCount} subscribers` : `${profile.participantCount} members`}
                  </div>
                )}
              </motion.div>
            ) : null}
          </div>

          {/* Stories Section in Profile */}
          {chatStories.length > 0 && (
            <div className="w-full bg-[#121c27] border border-white/10 rounded-2xl p-3.5 space-y-2.5 shadow-md">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-gray-200 flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5 text-indigo-400" />
                  <span>Истории ({chatStories.length})</span>
                </span>
                <button
                  type="button"
                  onClick={() => {
                    triggerHaptic("light");
                    setActiveStoryIdx(0);
                  }}
                  className="text-xs font-semibold text-indigo-400 hover:text-indigo-300 flex items-center gap-1 px-2.5 py-1 rounded-lg bg-indigo-400/10 hover:bg-indigo-400/20 transition-all cursor-pointer"
                  title="Смотреть все истории"
                >
                  Все истории <ChevronRight className="w-3.5 h-3.5" />
                </button>
              </div>
              <div className="flex items-center gap-3 overflow-x-auto py-1 scrollbar-hide">
                {chatStories.map((story, sIdx) => (
                  <motion.div
                    key={story.id || sIdx}
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => {
                      triggerHaptic("medium");
                      setActiveStoryIdx(sIdx);
                    }}
                    className="flex flex-col items-center gap-1 cursor-pointer shrink-0"
                  >
                    <div className="w-14 h-14 rounded-2xl p-[2px] bg-gradient-to-tr from-amber-400 via-pink-500 to-indigo-600 shadow-md">
                      <div className={`w-full h-full rounded-2xl overflow-hidden bg-gradient-to-b ${story.colorGradient || 'from-indigo-900 to-black'} flex items-center justify-center relative`}>
                        {story.mediaUrl ? (
                          <img src={story.mediaUrl} alt="" className="w-full h-full object-cover" />
                        ) : (
                          <Sparkles className="w-5 h-5 text-white/80" />
                        )}
                      </div>
                    </div>
                    <span className="text-[10px] text-gray-300 max-w-[60px] truncate text-center font-medium">
                      {story.caption || story.timeAgo || "История"}
                    </span>
                  </motion.div>
                ))}
              </div>
            </div>
          )}

                <div className="w-full mt-3 space-y-4">
                  {/* Индикатор клиента под картинкой в профиле (AyuGram / Nexusgram) */}
                  {(() => {
                    const clientInfo = detectUserClient({
                      id: chatId,
                      username: profile?.username || editUsername,
                      about: profile?.about || editBio,
                      firstName: profile?.name || editName,
                    });

                    if (clientInfo.type === "ayugram") {
                      return (
                        <div className="flex justify-center my-1">
                          <div className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-semibold bg-gradient-to-r from-purple-600/35 via-violet-600/30 to-fuchsia-600/35 border border-purple-400/60 text-purple-200 shadow-[0_0_15px_rgba(168,85,247,0.35)] backdrop-blur-md">
                            <span className="text-sm">🔮</span>
                            <span>Использует клиент AyuGram</span>
                          </div>
                        </div>
                      );
                    }

                    if (clientInfo.type === "nexusgram" || hasClientIndicator) {
                      return (
                        <div className="flex justify-center my-1">
                          <div className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-semibold bg-gradient-to-r from-cyan-600/35 via-blue-600/30 to-indigo-600/35 border border-cyan-400/60 text-cyan-200 shadow-[0_0_15px_rgba(34,211,238,0.35)] backdrop-blur-md">
                            <span className="text-sm">⚡</span>
                            <span>Использует клиент Nexusgram</span>
                          </div>
                        </div>
                      );
                    }

                    return null;
                  })()}

                  {profile?.username && (
                    <div className="bg-[#1a1a24] rounded-2xl p-4 border border-[#2a2a38]">
                      <p className="text-xs text-indigo-400 font-medium mb-1">
                        Username
                      </p>
                      <p className="text-gray-200 text-sm">
                        @{profile.username}
                      </p>
                    </div>
                  )}
                  {profile?.about && (
                    <div className="bg-[#1a1a24] rounded-2xl p-4 border border-[#2a2a38]">
                      <p className="text-xs text-indigo-400 font-medium mb-1">
                        Bio / Описание
                      </p>
                      <p className="text-gray-200 text-sm whitespace-pre-wrap">
                        {profile.about}
                      </p>
                    </div>
                  )}

                  {/* Личная заметка к чату (расположена прямо под описанием) */}
                  <div className="bg-[#1a1a24] rounded-2xl p-4 border border-[#2a2a38] space-y-1">
                    <div className="flex items-center justify-between text-xs">
                      <div className="flex items-center gap-1.5 text-amber-400 font-medium">
                        <StickyNote className="w-3.5 h-3.5 text-amber-400" />
                        <span>Личная заметка</span>
                      </div>
                      {!isEditing && (
                        <button 
                          onClick={() => setIsEditing(true)}
                          className="text-[11px] text-[#2481cc] hover:underline cursor-pointer"
                        >
                          {chatNote ? "Изменить" : "+ Добавить заметку"}
                        </button>
                      )}
                    </div>
                    {chatNote ? (
                      <p className="text-gray-200 text-sm whitespace-pre-wrap leading-relaxed pt-1">
                        {chatNote}
                      </p>
                    ) : (
                      <p className="text-gray-500 text-xs italic pt-1">
                        Заметка не добавлена. Вы можете добавить личную заметку при редактировании.
                      </p>
                    )}
                  </div>

                  <div className="bg-[#1a1a24] rounded-2xl p-4 border border-[#2a2a38]">
                    <p className="text-xs text-indigo-400 font-medium mb-1">
                      Chat ID
                    </p>
                    <p className="text-gray-200 font-mono text-xs">{chatId}</p>
                  </div>

                   {/* Shared Media Horizontal Scroll Tabs */}
                  <div className="bg-[#1a1a24] rounded-2xl border border-[#2a2a38] overflow-hidden space-y-3">
                    <div className="p-4 pb-0 bg-[#14141d]/50">
                      <p className="text-[10px] text-indigo-400 font-bold uppercase tracking-wider select-none mb-2">
                        Медиа и Темы в диалоге
                      </p>
                      <div className="flex gap-2 pb-2.5 overflow-x-auto scrollbar-thin">
                        {categories.map((cat) => {
                          const count = getCategoryItemsCount(cat.id);
                          const isActive = selectedCategory === cat.id;
                          return (
                            <button
                              key={cat.id}
                              onClick={() => setSelectedCategory(isActive ? null : cat.id)}
                              className={`px-3 py-1.5 rounded-xl text-[11px] font-semibold whitespace-nowrap transition-all flex items-center gap-1.5 border cursor-pointer ${isActive ? 'bg-indigo-600 text-white border-indigo-500 scale-102 font-bold shadow-lg shadow-indigo-600/15' : 'bg-[#12121b] text-gray-400 hover:text-gray-200 border-[#2a2a38]/40 hover:border-[#3a3a4c]'}`}
                            >
                              <span>{cat.label}</span>
                              <span className={`text-[9px] font-mono font-bold px-1.5 py-0.5 rounded-md ${isActive ? 'bg-indigo-700 text-white' : 'bg-black/35 text-gray-500'}`}>{count}</span>
                            </button>
                          );
                        })}
                      </div>
                    </div>

                    {/* Integrated Media Items List Panel */}
                    {selectedCategory && (
                      <div className="p-4 pt-1 bg-black/10 min-h-[220px]">
                        {(() => {
                          const items = getCategoryItems(selectedCategory);
                          if (items.length === 0) {
                            return (
                              <div className="flex flex-col items-center justify-center py-12 text-gray-500 font-serif">
                                <span className="text-2xl mb-1">📭</span>
                                <p className="text-xs">Ничего не найдено</p>
                              </div>
                            );
                          }
                          return (
                            <div className="space-y-2 max-h-[350px] overflow-y-auto pr-1 scrollbar-thin">
                              {selectedCategory === "media" ? (
                                <div className="grid grid-cols-3 gap-1.5">
                                  {items.map((itm) => (
                                    <div
                                      key={itm.id}
                                      onClick={() => {
                                        const event = new CustomEvent('view-media-request', { detail: { url: `/api/telegram/media/${chatId}/${itm.id}`, type: itm.mimeType?.startsWith('video/') ? 'video' : 'image' } });
                                        window.dispatchEvent(event);
                                      }}
                                      className="relative aspect-square rounded-lg overflow-hidden bg-black/20 border border-white/5 cursor-pointer hover:opacity-85 active:scale-95 transition-all"
                                    >
                                      {itm.mimeType?.startsWith('video/') ? (
                                        <div className="w-full h-full relative">
                                          <video src={`/api/telegram/media/${chatId}/${itm.id}`} className="w-full h-full object-cover" muted />
                                          <div className="absolute top-1 right-1 bg-black/60 px-1 rounded text-[8px] text-white">🎬</div>
                                        </div>
                                      ) : (
                                        <img src={`/api/telegram/media/${chatId}/${itm.id}`} alt="" className="w-full h-full object-cover" loading="lazy" />
                                      )}
                                    </div>
                                  ))}
                                </div>
                              ) : selectedCategory === "circles" ? (
                                <div className="grid grid-cols-3 gap-1.5">
                                  {items.map((itm) => (
                                    <div
                                      key={itm.id}
                                      onClick={() => {
                                        const event = new CustomEvent('view-media-request', { detail: { url: `/api/telegram/media/${chatId}/${itm.id}`, type: 'video' } });
                                        window.dispatchEvent(event);
                                      }}
                                      className="relative aspect-square rounded-full overflow-hidden bg-black/30 border border-indigo-500/20 shadow-md cursor-pointer hover:scale-105 active:scale-95 transition-transform"
                                    >
                                      <video src={`/api/telegram/media/${chatId}/${itm.id}`} className="w-full h-full object-cover" muted />
                                      <div className="absolute inset-0 bg-indigo-500/10 rounded-full" />
                                    </div>
                                  ))}
                                </div>
                              ) : (
                                <div className="space-y-1.5">
                                  {items.map((itm) => (
                                    <div
                                      key={itm.id}
                                      onClick={() => {
                                        let type = 'document';
                                        if (itm.mimeType?.startsWith('image/')) type = 'image';
                                        if (itm.mimeType?.startsWith('video/')) type = 'video';
                                        const event = new CustomEvent('view-media-request', { detail: { url: `/api/telegram/media/${chatId}/${itm.id}`, type, mimeType: itm.mimeType, name: itm.text || "Файл" } });
                                        window.dispatchEvent(event);
                                      }}
                                      className="flex items-center gap-2.5 p-2 bg-[#171720]/80 hover:bg-[#20202e] border border-[#2c2c3e]/20 rounded-xl cursor-pointer transition-all hover:scale-[1.01]"
                                    >
                                      <div className="w-8 h-8 rounded-lg bg-indigo-500/10 flex items-center justify-center text-indigo-400 border border-indigo-500/10 shrink-0 text-xs">
                                        📁
                                      </div>
                                      <div className="min-w-0 flex-1">
                                        <p className="text-gray-200 text-xs font-semibold truncate leading-snug">{itm.text || "Документ / Файл"}</p>
                                        <p className="text-[9px] text-gray-500 truncate mt-0.5">{itm.mimeType || "application/octet-stream"}</p>
                                      </div>
                                    </div>
                                  ))}
                                </div>
                              )}
                            </div>
                          );
                        })()}
                      </div>
                    )}
                  </div>

                  {participants.length > 0 && (
                    <div className="bg-[#1a1a24] rounded-2xl p-4 border border-[#2a2a38] space-y-3">
                      <p className="text-[10px] text-indigo-400 font-bold uppercase tracking-wider select-none">
                        Group Members ({participants.length})
                      </p>
                      <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                        {participants.map((p) => {
                          const fullName =
                            `${p.firstName || ""} ${p.lastName || ""}`.trim() ||
                            p.username ||
                            "Member";
                          return (
                            <div
                              key={p.id}
                              onClick={() => {
                                if (onSelectUser) {
                                  onSelectUser(p.id, fullName);
                                  onClose();
                                }
                              }}
                              className="flex items-center justify-between p-2 rounded-xl hover:bg-[#20202e] border border-transparent hover:border-[#2a2a3a]/30 transition-all text-xs cursor-pointer group"
                            >
                              <div className="flex items-center gap-2 min-w-0">
                                <div className="relative w-8 h-8 rounded-full overflow-hidden bg-indigo-500/10 flex items-center justify-center font-bold text-indigo-400 border border-indigo-500/20 uppercase text-[10px]">
                                  {fullName.charAt(0)}
                                  {p.id && (
                                    <img
                                      src={`/api/telegram/avatar/${p.id}`}
                                      className="absolute inset-0 w-full h-full object-cover z-10"
                                      onError={(e) => {
                                        e.currentTarget.style.display = "none";
                                      }}
                                      alt={fullName}
                                    />
                                  )}
                                </div>
                                <div className="min-w-0">
                                  <p className="text-gray-200 font-medium truncate group-hover:text-white transition-colors">
                                    {fullName}
                                  </p>
                                  {p.username && (
                                    <p className="text-gray-500 text-[9px] truncate group-hover:text-gray-400">
                                      @{p.username}
                                    </p>
                                  )}
                                </div>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}

                  {similarChats.length > 0 && (
                    <div className="bg-[#1a1a24] rounded-2xl p-4 border border-[#2a2a38] space-y-3">
                      <p className="text-[10px] text-indigo-400 font-bold uppercase tracking-wider select-none">
                        {profile?.isChannel ? "Similar Channels" : "Similar Groups"} ({similarChats.length})
                      </p>
                      <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                        {similarChats.slice(0, 15).map((c) => (
                          <div
                            key={c.id}
                            onClick={() => {
                              try { window.location.hash = `#chat-${c.id}`; } catch (e) {}
                              onClose();
                              const event = new CustomEvent('open-chat', { detail: { id: c.id, name: c.name } });
                              window.dispatchEvent(event);
                            }}
                            className="flex items-center justify-between p-2 rounded-xl hover:bg-[#20202e] border border-transparent hover:border-[#2a2a3a]/30 transition-all text-xs cursor-pointer group"
                          >
                            <div className="flex items-center gap-2 min-w-0">
                              <div className="w-8 h-8 rounded-full bg-indigo-500/10 flex items-center justify-center font-bold text-indigo-400 border border-indigo-500/20 uppercase text-xs">
                                {c.name?.charAt(0) || "C"}
                              </div>
                              <span className="text-gray-300 font-medium truncate group-hover:text-white transition-colors">
                                {c.name}
                              </span>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
          </div>
          
          {selectedCategory && (
            <div className="absolute inset-0 bg-[#111116] z-50 flex flex-col animate-scale-up">
              <div className="flex justify-between items-center p-4 border-b border-[#1a1a24]/60 bg-[#14141d]">
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setSelectedCategory(null)}
                    className="p-1.5 hover:bg-[#1a1a24] rounded-lg text-gray-400 hover:text-white transition-colors cursor-pointer"
                  >
                    <ChevronLeft className="w-5 h-5" />
                  </button>
                  <span className="text-white font-semibold text-sm">
                    {categories.find(c => c.id === selectedCategory)?.label || "Объекты"}
                  </span>
                </div>
                <button
                  onClick={() => setSelectedCategory(null)}
                  className="p-1.5 hover:bg-[#1a1a24] rounded-lg text-gray-400 hover:text-white transition-colors cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
              
              <div className="p-4 overflow-y-auto flex-1 space-y-2.5 max-h-[80vh] bg-[#111116] scrollbar-thin">
                {(() => {
                  if (selectedCategory === "gifts") {
                    return (
                      <div className="space-y-3">
                        <div className="flex items-center justify-between pb-2 border-b border-white/5">
                          <span className="text-xs text-amber-300 font-semibold flex items-center gap-1.5">
                            <Sparkles className="w-4 h-4 text-amber-400" />
                            Официальные NFT подарки Telegram
                          </span>
                          <span className="text-[10px] text-gray-400 font-mono bg-black/40 px-2 py-0.5 rounded-full border border-white/5">
                            {REAL_TELEGRAM_NFT_GIFTS.length} NFT в сети TON
                          </span>
                        </div>
                        <div className="grid grid-cols-2 gap-2.5">
                          {REAL_TELEGRAM_NFT_GIFTS.map((nft) => (
                            <div
                              key={nft.id}
                              className="rounded-2xl bg-[#171722] border border-[#2a2a3e] p-3 flex flex-col justify-between hover:border-indigo-500/50 transition-all shadow-md group"
                            >
                              <div className="flex items-center justify-between mb-1.5">
                                <span className="text-[10px] font-mono font-bold text-gray-400">
                                  {nft.number}
                                </span>
                                <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded-full border ${nft.rarityBadgeColor}`}>
                                  {nft.rarity}
                                </span>
                              </div>
                              <div className={`w-full aspect-square rounded-xl bg-gradient-to-br ${nft.gradientBg} flex items-center justify-center text-4xl shadow-inner relative overflow-hidden group-hover:scale-105 transition-transform`}>
                                <span className="drop-shadow-md select-none">{nft.icon}</span>
                              </div>
                              <div className="mt-2 text-left">
                                <h4 className="text-xs font-bold text-white truncate">{nft.name}</h4>
                                <p className="text-[10px] text-gray-400 truncate mt-0.5">{nft.collection}</p>
                              </div>
                              <div className="mt-2 pt-2 border-t border-white/5 flex items-center justify-between">
                                <div className="text-[10px] font-mono text-amber-300 font-bold flex items-center gap-0.5">
                                  <span>⭐</span>
                                  <span>{nft.starsPrice.toLocaleString()}</span>
                                </div>
                                <button
                                  onClick={async (e) => {
                                    e.stopPropagation();
                                    try {
                                      await fetch("/api/telegram/gifts/send", {
                                        method: "POST",
                                        headers: { "Content-Type": "application/json" },
                                        body: JSON.stringify({
                                          chatId,
                                          giftId: nft.id,
                                          giftName: nft.name,
                                          giftNumber: nft.number,
                                          giftEmoji: nft.icon,
                                          tonContract: nft.contractAddress,
                                        }),
                                      });
                                      triggerHaptic("medium");
                                      const giftMsg = {
                                        id: Date.now(),
                                        text: `🎁 NFT Подарок: ${nft.icon} ${nft.name} ${nft.number}\n⚡ Блокчейн: TON (The Open Network)\n📜 Смарт-контракт: ${nft.contractAddress}\n💎 Верифицированный коллекционный актив Telegram`,
                                        out: true,
                                        date: Date.now(),
                                      };
                                      if (onSendGift) onSendGift(giftMsg);
                                      setSelectedCategory(null);
                                      onClose();
                                    } catch (err) {}
                                  }}
                                  className="px-2 py-1 bg-indigo-600 hover:bg-indigo-500 text-white text-[10px] font-semibold rounded-lg transition-colors flex items-center gap-1 shadow-md cursor-pointer active:scale-95"
                                >
                                  <span>Подарить</span>
                                </button>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    );
                  }

                  let items = getCategoryItems(selectedCategory);
                  if (items.length === 0) {
                    if (selectedCategory === "media") {
                      items = messages.filter(m => m.media) || [];
                    } else {
                      items = [
                        { id: "mock-1", text: "Материалы сохраненной темы - полезные ссылки и документы", date: new Date().toISOString() },
                        { id: "mock-2", text: "Обсуждение рабочих файлов и систем проектирования", date: new Date().toISOString() }
                      ];
                    }
                  }
                  return items.map((itm: any) => (
                    <div
                      key={itm.id}
                      onClick={() => {
                        if (itm.id.toString().startsWith("mock")) return;
                        const el = document.getElementById(`message-${itm.id}`);
                        if (el) {
                          el.scrollIntoView({ behavior: "smooth", block: "center" });
                          el.classList.add("animate-pulse", "brightness-125");
                          setTimeout(() => el.classList.remove("animate-pulse", "brightness-125"), 1500);
                        }
                        setSelectedCategory(null);
                        onClose();
                      }}
                      className="p-3 bg-[#171722]/80 border border-[#242435]/50 hover:bg-[#1d1d2b] hover:border-indigo-500/20 transition-all rounded-xl text-xs text-gray-300 cursor-pointer flex flex-col gap-2"
                    >
                      {itm.media && (selectedCategory === 'media' || selectedCategory === 'circles' || itm.videoNote) && (
                        <div className="w-full h-28 rounded-lg bg-black/60 overflow-hidden relative flex items-center justify-center border border-white/5">
                          {selectedCategory === 'circles' || itm.videoNote ? (
                            <video src={`/api/telegram/media/${chatId}/${itm.id}`} className="w-24 h-24 rounded-full object-cover" muted />
                          ) : (
                            <img src={`/api/telegram/media/${chatId}/${itm.id}`} className="w-full h-full object-cover" />
                          )}
                          <span className="absolute p-2 bg-black/50 hover:bg-black/80 rounded-full text-white text-[10px] transition-colors font-semibold">
                            ▶ Посмотреть
                          </span>
                        </div>
                      )}
                      <p className="font-sans text-gray-200 truncate-3-lines leading-relaxed">
                        {itm.text || itm.message || "[Вложение без подписи]"}
                      </p>
                      <span className="text-[9px] text-gray-500 block font-mono">
                        {itm.date ? new Date(itm.date).toLocaleDateString("ru-RU") : "Давно"}
                      </span>
                    </div>
                  ));
                })()}
              </div>
            </div>
          )}
      </div>

      {/* Story Viewer in Profile Dialog */}
      {activeStoryIdx !== null && (
        <UserStoriesModal
          initialStoryIndex={activeStoryIdx}
          stories={chatStories}
          onClose={() => setActiveStoryIdx(null)}
        />
      )}
    </div>
  );
}

function CommentsModal({
  onClose,
  chatId,
  messageId,
}: {
  onClose: () => void;
  chatId: string;
  messageId: string;
}) {
  const [comments, setComments] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [commentText, setCommentText] = useState("");
  const [sending, setSending] = useState(false);
  const [hasNewComments, setHasNewComments] = useState(false);

  const commentsListRef = useRef<HTMLDivElement>(null);

  const fetchComments = (silent = false) => {
    if (!silent) setLoading(true);
    fetch(`/api/telegram/messages/${chatId}/${messageId}/comments`)
      .then((res) => res.json())
      .then((data) => {
        if (data && Array.isArray(data.comments)) {
          if (silent && data.comments.length > comments.length) {
            setHasNewComments(true);
          }
          setComments(data.comments);
        }
        if (!silent) setLoading(false);
      })
      .catch((err) => {
        console.error(err);
        if (!silent) setLoading(false);
      });
  };

  useEffect(() => {
    fetchComments(false);

    // Dynamic polling of comment replies every 15 seconds
    const interval = setInterval(() => {
      fetchComments(true);
    }, 15000);

    return () => clearInterval(interval);
  }, [chatId, messageId]);

  const handleSendComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!commentText.trim()) return;
    setSending(true);
    try {
      const res = await fetch("/api/telegram/sendMessage", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          chatId,
          message: commentText,
          replyTo: messageId,
        }),
      });
      if (res.ok) {
        setCommentText("");
        setHasNewComments(false);
        fetchComments(false);
        setTimeout(() => {
          if (commentsListRef.current) {
            commentsListRef.current.scrollTo({
              top: commentsListRef.current.scrollHeight,
              behavior: "smooth"
            });
          }
        }, 150);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setSending(false);
    }
  };

  // Sort comments chronologically so the first message shows first
  const sortedComments = [...comments].sort((a, b) => {
    return new Date(a.date).getTime() - new Date(b.date).getTime();
  });

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-fade-in" onClick={onClose}>
      <div className="bg-[#111116] border border-[#2a2a38] rounded-3xl w-full max-w-md relative shadow-2xl flex flex-col max-h-[85vh]" onClick={(e) => e.stopPropagation()}>
        <div className="flex justify-between items-center p-4 border-b border-[#1a1a24]">
          <h2 className="text-white font-medium flex items-center gap-2">
            💬 Comments and Replies
          </h2>
          <button
            onClick={onClose}
            className="p-2 bg-[#1a1a24] hover:bg-[#2a2a38] rounded-xl text-gray-300 transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div 
          ref={commentsListRef}
          className="p-4 overflow-y-auto flex-1 space-y-3 min-h-[250px] relative scrollbar-thin"
        >
          {loading ? (
            <div className="flex flex-col items-center justify-center py-10 gap-2 text-gray-400">
              <Loader2 className="w-6 h-6 animate-spin text-indigo-400" />
              <p className="text-xs">Loading replies...</p>
            </div>
          ) : sortedComments.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-gray-500">
              <p className="text-sm">No comments yet</p>
              <p className="text-[11px] mt-1 text-gray-600">Be the first to reply!</p>
            </div>
          ) : (
            sortedComments.map((comment) => (
              <div
                key={comment.id}
                className="bg-[#171722] border border-[#242435]/50 rounded-2xl p-3.5 flex items-start gap-3"
              >
                <img
                   src={`/api/telegram/avatar/${comment.senderId}`}
                   alt={comment.senderName}
                   onError={(e) => {
                     e.currentTarget.src = `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(comment.senderName || "User")}`;
                   }}
                   onClick={() => {
                     const event = new CustomEvent("open-user-profile", {
                       detail: { userId: comment.senderId, userName: comment.senderName }
                     });
                     window.dispatchEvent(event);
                   }}
                   className="w-8 h-8 rounded-full border border-indigo-500/10 object-cover cursor-pointer hover:scale-105 transition-transform shrink-0"
                />
                <div className="flex-1 min-w-0 space-y-1">
                  <div className="flex items-center justify-between text-[11px]">
                    <span 
                      onClick={() => {
                        const event = new CustomEvent("open-user-profile", {
                          detail: { userId: comment.senderId, userName: comment.senderName }
                        });
                        window.dispatchEvent(event);
                      }}
                      className="font-semibold text-indigo-400 hover:underline cursor-pointer"
                    >
                      {comment.senderName}
                    </span>
                    <span className="text-gray-500 font-mono">
                      {new Date(comment.date).toLocaleTimeString([], {
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                     </span>
                  </div>
                  <p className="text-gray-200 text-xs whitespace-pre-wrap leading-relaxed select-text">
                    {comment.text}
                  </p>
                </div>
              </div>
            ))
          )}

          {/* New message arrow indicator */}
          {hasNewComments && (
            <div className="sticky bottom-1 text-center pointer-events-auto">
              <button
                onClick={() => {
                  setHasNewComments(false);
                  if (commentsListRef.current) {
                    commentsListRef.current.scrollTo({
                      top: commentsListRef.current.scrollHeight,
                      behavior: "smooth"
                    });
                  }
                }}
                className="mx-auto flex items-center gap-1.5 px-3 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-full text-[11px] font-bold shadow-lg animate-bounce transition-all border border-indigo-400/30 font-sans cursor-pointer pointer-events-auto"
              >
                <ArrowDown className="w-3.5 h-3.5" />
                Новые ответы!
              </button>
            </div>
          )}
        </div>

        <form
          onSubmit={handleSendComment}
          className="p-4 border-t border-[#1a1a24] flex gap-2"
        >
          <input
            value={commentText}
            onChange={(e) => setCommentText(e.target.value)}
            placeholder="Write a comment..."
            className="flex-1 bg-[#1a1a24] border border-[#2a2a38] text-white rounded-xl px-4 py-2 text-xs focus:outline-none focus:border-indigo-500"
            disabled={sending}
          />
          <button
            type="submit"
            disabled={sending || !commentText.trim()}
            className="px-4 py-2 bg-indigo-500 hover:bg-indigo-600 disabled:bg-[#1a1a24] disabled:text-gray-500 text-white rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer"
          >
            {sending ? (
              <Loader2 className="w-3.5 h-3.5 animate-spin" />
            ) : (
              <Send className="w-3.5 h-3.5" />
            )}
          </button>
        </form>
      </div>
    </div>
  );
}

export function TelegramChatWindow({
  chatId,
  chatName,
  canSend,
  searchQuery = "",
  onBack,
  onSelectUser,
}: {
  chatId: string;
  chatName: string;
  canSend?: boolean;
  searchQuery?: string;
  onBack?: () => void;
  onSelectUser?: (id: string, name: string) => void;
  key?: string | number;
}) {
  const { strings } = useI18n();
  const [messages, setMessages] = useState<any[]>([]);
  const pendingDeletesRef = useRef<{ [id: string]: { timer: NodeJS.Timeout, prevMsg: any } }>({});
  const [showUndoList, setShowUndoList] = useState<{ id: string }[]>([]);
  const [input, setInput] = useState(
    () => localStorage.getItem(`draft_${chatId}`) || "",
  );

  // Auto-save draft and restore when switching between chats
  useEffect(() => {
    (window as any).__activeChatId = chatId;
    try { sessionStorage.setItem("nexus_active_chat_id", chatId); } catch {}
    const savedDraft = localStorage.getItem(`draft_${chatId}`) || "";
    setInput(savedDraft);
  }, [chatId]);

  useEffect(() => {
    if (input && input.trim()) {
      localStorage.setItem(`draft_${chatId}`, input);
      localStorage.setItem(`draft_time_${chatId}`, Date.now().toString());
      window.dispatchEvent(new CustomEvent("nexus-draft-updated", { detail: { chatId, text: input, time: Date.now() } }));
    } else {
      localStorage.removeItem(`draft_${chatId}`);
      localStorage.removeItem(`draft_time_${chatId}`);
      window.dispatchEvent(new CustomEvent("nexus-draft-updated", { detail: { chatId, text: "", time: 0 } }));
    }
  }, [input, chatId]);

  // Smart Message & AI modals state
  const [showRichMessageModal, setShowRichMessageModal] = useState(false);
  const [showAiHelperModal, setShowAiHelperModal] = useState(false);
  const [showAiSettingsModal, setShowAiSettingsModal] = useState(false);

  // Nexus Blockchain & Telepathic Sync state
  const [isBlockchainEnabled, setIsBlockchainEnabled] = useState<boolean>(() => isBlockchainEncryptionEnabled());
  const [isLiveKeystrokesEnabled, setIsLiveKeystrokesEnabled] = useState<boolean>(() => isLiveKeystrokesViewEnabled());
  const [showNexusModal, setShowNexusModal] = useState<boolean>(false);
  const [selectedNexusBlock, setSelectedNexusBlock] = useState<NexusBlockData | null>(null);
  const [nexusClients, setNexusClients] = useState<string[]>([]);
  const [livePeerKeystroke, setLivePeerKeystroke] = useState<{
    text: string;
    isTyping: boolean;
    userName?: string;
    timestamp: number;
  } | null>(null);
  const socketRef = useRef<any>(null);

  // Secret Chat State (Nexus E2EE)
  const [isSecretChatActive, setIsSecretChatActive] = useState<boolean>(() => {
    return localStorage.getItem(`nexus_secret_chat_active_${chatId}`) === "true";
  });
  const [isSecretChatTerminated, setIsSecretChatTerminated] = useState<boolean>(() => {
    return localStorage.getItem(`nexus_secret_chat_term_${chatId}`) === "true";
  });
  const [secretChatKey, setSecretChatKey] = useState<string>(() => {
    return localStorage.getItem(`nexus_secret_chat_key_${chatId}`) || "";
  });
  const [showSecretKeyModal, setShowSecretKeyModal] = useState<boolean>(false);
  const [secretMessages, setSecretMessages] = useState<any[]>(() => {
    try {
      const saved = localStorage.getItem(`nexus_secret_messages_${chatId}`);
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  // AyuGram deep forensic scan state
  const [isScanningAyuGram, setIsScanningAyuGram] = useState<boolean>(false);
  const [ayuGramScanResult, setAyuGramScanResult] = useState<AyuGramScanResult | null>(null);
  const [showAyuGramResultModal, setShowAyuGramResultModal] = useState<boolean>(false);

  useEffect(() => {
    setIsSecretChatActive(localStorage.getItem(`nexus_secret_chat_active_${chatId}`) === "true");
    setIsSecretChatTerminated(localStorage.getItem(`nexus_secret_chat_term_${chatId}`) === "true");
    setSecretChatKey(localStorage.getItem(`nexus_secret_chat_key_${chatId}`) || "");
    try {
      const saved = localStorage.getItem(`nexus_secret_messages_${chatId}`);
      setSecretMessages(saved ? JSON.parse(saved) : []);
    } catch {
      setSecretMessages([]);
    }
  }, [chatId]);

  useEffect(() => {
    const handleOpenModal = (e: any) => {
      setSelectedNexusBlock(e.detail?.block || null);
      setShowNexusModal(true);
    };
    window.addEventListener("open-nexus-blockchain-modal", handleOpenModal);
    return () => window.removeEventListener("open-nexus-blockchain-modal", handleOpenModal);
  }, []);

  useEffect(() => {
    if (socketRef.current && chatId) {
      const myId = localStorage.getItem("telegram_my_id") || "me";
      socketRef.current.emit("nexus_live_keystrokes", {
        chatId: String(chatId),
        userId: myId,
        senderId: myId,
        targetChatId: String(chatId),
        userName: "Me",
        text: input,
        isTyping: input.length > 0
      });
    }
  }, [input, chatId]);

  useEffect(() => {
    if (input.trim() && chatId !== "ai-assistant") {
      const now = Date.now();
      const lastTyping = Number(
        localStorage.getItem(`last_typing_${chatId}`) || "0",
      );
      if (now - lastTyping > 4000) {
        // Every 4 seconds max
        localStorage.setItem(`last_typing_${chatId}`, String(now));
        // Respect AyuGram Ghost Mode
        if (!isGhostModeActive()) {
          fetch(`/api/telegram/typing/${chatId}`, { method: "POST" }).catch(
            () => {},
          );
        }
      }
    }
  }, [input, chatId]);

  const [searchMatches, setSearchMatches] = useState<string[]>([]);
  const [currentMatchIndex, setCurrentMatchIndex] = useState(0);
  const [showSelectDeleteConfirm, setShowSelectDeleteConfirm] = useState(false);

  // local more action states
  const [showMenu, setShowMenu] = useState(false);
  const [isSearchingInChat, setIsSearchingInChat] = useState(false);
  const [chatSearchQuery, setChatSearchQuery] = useState("");
  const [chatSearchMatches, setChatSearchMatches] = useState<string[]>([]);
  const [chatCurrentMatchIndex, setChatCurrentMatchIndex] = useState(0);

  // User profile viewing, scrolling date indicator, and translation language states
  const [viewingProfileUserId, setViewingProfileUserId] = useState<string | null>(null);
  const [viewingProfileUserName, setViewingProfileUserName] = useState<string>("");
  const [scrollingDate, setScrollingDate] = useState<string | null>(null);
  const [isScrolling, setIsScrolling] = useState(false);
  const scrollTimerRef = useRef<NodeJS.Timeout | null>(null);
  const [translationLanguage, setTranslationLanguage] = useState<string | null>(null);
  const [showMainMenuTranslationLanguages, setShowMainMenuTranslationLanguages] = useState(false);

  // Message Selection and Forwarding
  const [isSelectMode, setIsSelectMode] = useState(false);
  const [selectedMessageIds, setSelectedMessageIds] = useState<string[]>([]);
  const [showForwardDialog, setShowForwardDialog] = useState(false);
  const [loadingForward, setLoadingForward] = useState(false);
  const [chatList, setChatList] = useState<any[]>([]);
  const [forwardSearch, setForwardSearch] = useState("");

  const chatAreaRef = useRef<HTMLDivElement>(null);
  const trackRef = useRef<HTMLDivElement>(null);
  const thumbRef = useRef<HTMLDivElement>(null);
  const lastScrollTopRef = useRef<number>(0);
  const lastScrollTimeRef = useRef<number>(0);
  const [scrollbarRatio, setScrollbarRatio] = useState(0);
  const [scrollbarHeightRatio, setScrollbarHeightRatio] = useState(0.1);
  const [isScrubbing, setIsScrubbing] = useState(false);
  const [showScrollBottom, setShowScrollBottom] = useState(false);

  const [hasMore, setHasMore] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);

  const loadMoreMessages = () => {
    if (loadingMore || !hasMore || messages.length === 0) return;
    setLoadingMore(true);
    const numericMsgs = messages.map(m => parseInt(m.id)).filter(id => !isNaN(id));
    const minMsgId = numericMsgs.length > 0 ? Math.min(...numericMsgs) : undefined;
    
    // Use 50 limit and maxId parameter for fast, optimized database slicing
    fetch(`/api/telegram/messages/${chatId}?limit=50${minMsgId ? '&maxId=' + minMsgId : ''}`)
      .then((res) => res.json())
      .then((data) => {
        if (Array.isArray(data)) {
          const rawBytes = JSON.stringify(data).length;
          recordDataTransfer(rawBytes * 2.5, rawBytes, "download");
          if (data.length === 0 || data.length < 5) setHasMore(false);
          
          const el = chatAreaRef.current;
          const oldScrollHeight = el ? el.scrollHeight : 0;
          const oldScrollTop = el ? el.scrollTop : 0;

          setMessages((prev) => {
            const prevIds = new Set(prev.map((m) => m.id));
            const newMsgs = data.filter((m) => !prevIds.has(m.id));
            if (newMsgs.length === 0) {
              setHasMore(false);
              return prev;
            }
            const all = [...newMsgs, ...prev];
            
            // Smoothly anchor the user's viewport without jumpiness
            if (el) {
              requestAnimationFrame(() => {
                if (chatAreaRef.current) {
                  const newScrollHeight = chatAreaRef.current.scrollHeight;
                  chatAreaRef.current.scrollTop = oldScrollTop + (newScrollHeight - oldScrollHeight);
                }
              });
            }
            
            return all.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
          });
        }
      })
      .catch((err) => console.error("Message paging error:", err))
      .finally(() => {
        setTimeout(() => setLoadingMore(false), 50);
      });
  };

  const handleScroll = () => {
    const el = chatAreaRef.current;
    if (!el) return;

    const maxScroll = el.scrollHeight - el.clientHeight;
    if (maxScroll <= 0) return;

    // Instant upward scroll trigger: initiate pre-fetching as soon as within 1200px of top
    if (el.scrollTop < 1200 && hasMore && !loadingMore && !initialLoading) {
      loadMoreMessages();
    }

    // Direct GPU DOM update for scrubber thumb without causing React component re-renders
    if (thumbRef.current) {
      const ratio = el.scrollTop / maxScroll;
      const heightPercent = Math.max(15, Math.min(75, (el.clientHeight / el.scrollHeight) * 100));
      thumbRef.current.style.top = `${ratio * (100 - heightPercent)}%`;
      thumbRef.current.style.height = `${heightPercent}%`;
    }

    const now = Date.now();
    // Throttle React state updates to at most once per 100ms during scrolling
    if (now - lastScrollTimeRef.current < 100) {
      return;
    }
    lastScrollTimeRef.current = now;

    lastScrollTopRef.current = el.scrollTop;
    const distanceFromBottom = maxScroll - el.scrollTop;
    const shouldShowBottom = distanceFromBottom > 140;
    setShowScrollBottom(prev => prev !== shouldShowBottom ? shouldShowBottom : prev);

    // Fast O(1) probe for date header using elementFromPoint
    if (messages.length > 0) {
      const rect = el.getBoundingClientRect();
      const probeEl = document.elementFromPoint(rect.left + rect.width / 2, rect.top + 70);
      const msgContainer = probeEl?.closest('[id^="message-"]');
      if (msgContainer) {
        const msgId = msgContainer.id.replace('message-', '');
        const found = messages.find(m => m.id.toString() === msgId);
        if (found) {
          const dateVal = new Date(found.date || found.timestamp);
          if (!isNaN(dateVal.getTime())) {
            const formattedDate = dateVal.toLocaleDateString('ru-RU', {
              year: 'numeric',
              month: 'long',
              day: 'numeric'
            });
            setScrollingDate(prev => prev !== formattedDate ? formattedDate : prev);
            setIsScrolling(true);
            if (scrollTimerRef.current) clearTimeout(scrollTimerRef.current);
            scrollTimerRef.current = setTimeout(() => setIsScrolling(false), 1200);
          }
        }
      }
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

  const matchMessageByQuery = (m: any, q: string) => {
    const query = q.toLowerCase();
    
    // Check main text and file name
    if (m.text?.toLowerCase().includes(query)) return true;
    if (m.fileName?.toLowerCase().includes(query)) return true;
    
    // Check inside attachment mime type/extension
    if (m.mimeType?.toLowerCase().includes(query)) return true;
    
    if (m.media) {
      const type = (m.mediaType || '').toLowerCase();
      // Translate Russian & English keywords for friendly, native search results
      const isVideoKeyword = ["video", "видео", "клип", "кругляшок", "круг", "запись"].some(kw => query.includes(kw));
      const isPhotoKeyword = ["photo", "image", "фото", "картинка", "рисунок", "изображение"].some(kw => query.includes(kw));
      const isAudioKeyword = ["audio", "voice", "music", "аудио", "голос", "гс", "музыка", "песня"].some(kw => query.includes(kw));
      const isDocKeyword = ["doc", "file", "pdf", "docx", "документ", "файл"].some(kw => query.includes(kw));

      if (isVideoKeyword && (type.includes('video') || m.videoNote || m.mimeType?.includes('video'))) return true;
      if (isPhotoKeyword && (type.includes('photo') || m.mimeType?.includes('image'))) return true;
      if (isAudioKeyword && (type.includes('audio') || m.voiceNote || m.mimeType?.includes('audio'))) return true;
      if (isDocKeyword && (type.includes('document') || m.mimeType?.includes('document') || m.mimeType?.includes('pdf') || m.mimeType?.includes('msword') || m.mimeType?.includes('officedocument'))) return true;
    }
    return false;
  };

  useEffect(() => {
    const q = chatSearchQuery.toLowerCase();
    if (!q) {
      setChatSearchMatches([]);
      return;
    }
    const matches = messages
      .filter((m) => matchMessageByQuery(m, q))
      .map((m) => m.id.toString());
    setChatSearchMatches(matches);
    setChatCurrentMatchIndex(matches.length > 0 ? matches.length - 1 : 0);
  }, [chatSearchQuery, messages]);

  const cycleChatSearchNext = () => {
    if (chatSearchMatches.length === 0) return;
    const nextIdx =
      (chatCurrentMatchIndex - 1 + chatSearchMatches.length) %
      chatSearchMatches.length;
    setChatCurrentMatchIndex(nextIdx);
    const tgtId = chatSearchMatches[nextIdx];
    const el = document.getElementById(`message-${tgtId}`);
    if (el) {
      el.scrollIntoView({ behavior: "smooth", block: "center" });
      el.classList.add("bg-blue-500/20", "transition-colors", "duration-500");
      setTimeout(() => el.classList.remove("bg-blue-500/20"), 1500);
    }
  };

  const cycleChatSearchPrev = () => {
    if (chatSearchMatches.length === 0) return;
    const prevIdx = (chatCurrentMatchIndex + 1) % chatSearchMatches.length;
    setChatCurrentMatchIndex(prevIdx);
    const tgtId = chatSearchMatches[prevIdx];
    const el = document.getElementById(`message-${tgtId}`);
    if (el) {
      el.scrollIntoView({ behavior: "smooth", block: "center" });
      el.classList.add("bg-blue-500/20", "transition-colors", "duration-500");
      setTimeout(() => el.classList.remove("bg-blue-500/20"), 1500);
    }
  };

  // Shared Groups / Common Chats
  const [showCommonChatsModal, setShowCommonChatsModal] = useState(false);
  const [commonChatsList, setCommonChatsList] = useState<any[]>([]);
  const [loadingCommonChats, setLoadingCommonChats] = useState(false);
  const [commonChatsIsChannel, setCommonChatsIsChannel] = useState(false);
  const [commonChatsIsGroup, setCommonChatsIsGroup] = useState(false);

  // topic management
  const [isForum, setIsForum] = useState(false);
  const [topics, setTopics] = useState<any[]>([]);
  const [activeTopicId, setActiveTopicId] = useState<number | null>(null);
  const [firstUnreadMsgId, setFirstUnreadMsgId] = useState<string | null>(null);
  const [unreadIncomingCount, setUnreadIncomingCount] = useState(0);

  const [showRecentActionsDialog, setShowRecentActionsDialog] = useState(false);
  const [recentActions, setRecentActions] = useState<any[]>([]);
  const [loadingRecentActions, setLoadingRecentActions] = useState(false);
  const [isDraggingFiles, setIsDraggingFiles] = useState(false);

  const handleToggleSelect = (msgId: string) => {
    setIsSelectMode(true);
    setSelectedMessageIds((prev) => {
      if (prev.includes(msgId)) {
        const refreshed = prev.filter((id) => id !== msgId);
        if (refreshed.length === 0) {
          setIsSelectMode(false);
        }
        return refreshed;
      } else {
        return [...prev, msgId];
      }
    });
  };

  useEffect(() => {
    if (!searchQuery) {
      setSearchMatches([]);
      return;
    }
    const q = searchQuery.toLowerCase();
    const matches = messages
      .filter((m) => matchMessageByQuery(m, q))
      .map((m) => m.id.toString());
    setSearchMatches(matches);
    setCurrentMatchIndex(matches.length > 0 ? matches.length - 1 : 0);
  }, [searchQuery, messages]);

  const cycleSearchNext = () => {
    if (searchMatches.length === 0) return;
    const nextIdx =
      (currentMatchIndex - 1 + searchMatches.length) % searchMatches.length;
    setCurrentMatchIndex(nextIdx);
    const tgtId = searchMatches[nextIdx];
    const el = document.getElementById(`message-${tgtId}`);
    if (el) {
      el.scrollIntoView({ behavior: "smooth", block: "center" });
      el.classList.add("bg-blue-500/20", "transition-colors", "duration-500");
      setTimeout(() => el.classList.remove("bg-blue-500/20"), 1500);
    }
  };

  const cycleSearchPrev = () => {
    if (searchMatches.length === 0) return;
    const prevIdx = (currentMatchIndex + 1) % searchMatches.length;
    setCurrentMatchIndex(prevIdx);
    const tgtId = searchMatches[prevIdx];
    const el = document.getElementById(`message-${tgtId}`);
    if (el) {
      el.scrollIntoView({ behavior: "smooth", block: "center" });
      el.classList.add("bg-blue-500/20", "transition-colors", "duration-500");
      setTimeout(() => el.classList.remove("bg-blue-500/20"), 1500);
    }
  };

  const [localPinnedMessages, setLocalPinnedMessages] = useState<string[]>(
    JSON.parse(localStorage.getItem(`local_pinned_${chatId}`) || "[]"),
  );
  const [currentPinnedIndex, setCurrentPinnedIndex] = useState(0);

  useEffect(() => {
    setLocalPinnedMessages(
      JSON.parse(localStorage.getItem(`local_pinned_${chatId}`) || "[]"),
    );
  }, [chatId]);

  const handleLocalPin = (msgId: string) => {
    if (!localPinnedMessages.includes(msgId)) {
      const newPinned = [...localPinnedMessages, msgId];
      setLocalPinnedMessages(newPinned);
      localStorage.setItem(`local_pinned_${chatId}`, JSON.stringify(newPinned));

      const msg = messages.find((m) => m.id.toString() === msgId);
      let snippet = msg?.text || "";
      if (!snippet && msg?.media) {
        snippet = "📎 Вложение";
      }
      if (snippet) {
        try {
          const saved = JSON.parse(localStorage.getItem(`local_pinned_texts_${chatId}`) || "{}");
          saved[msgId] = snippet;
          localStorage.setItem(`local_pinned_texts_${chatId}`, JSON.stringify(saved));
        } catch (e) {}
      }
    }
  };

  const getPinnedSnippet = (msgId: string) => {
    const msg = messages.find((m) => m.id.toString() === msgId);
    if (msg) {
      if (msg.text && msg.text.trim()) return msg.text.trim();
      if (msg.media) return "📎 Вложение";
    }
    try {
      const saved = JSON.parse(localStorage.getItem(`local_pinned_texts_${chatId}`) || "{}");
      if (saved[msgId]) return saved[msgId];
    } catch (e) {}
    return "Закрепленное сообщение";
  };

  const handleLocalUnpin = (msgId: string) => {
    const newPinned = localPinnedMessages.filter((id) => id !== msgId);
    setLocalPinnedMessages(newPinned);
    localStorage.setItem(`local_pinned_${chatId}`, JSON.stringify(newPinned));
  };

  const cyclePinnedMessage = () => {
    if (localPinnedMessages.length === 0) return;
    const nextIdx = (currentPinnedIndex + 1) % localPinnedMessages.length;
    setCurrentPinnedIndex(nextIdx);
    const tgtId = localPinnedMessages[nextIdx];
    const el = document.getElementById(`message-${tgtId}`);
    if (el) {
      el.scrollIntoView({ behavior: "smooth", block: "center" });
      el.classList.add("bg-blue-500/20", "transition-colors", "duration-500");
      setTimeout(() => el.classList.remove("bg-blue-500/20"), 1500);
    }
  };

  const [isLoading, setIsLoading] = useState(false);
  const [files, setFiles] = useState<File[]>([]);
  const [editingImageUrl, setEditingImageUrl] = useState<string | null>(null);
  const [replyToMsg, setReplyToMsg] = useState<{
    id: string;
    text: string;
    senderName?: string;
  } | null>(null);
  const [showAttachmentMenu, setShowAttachmentMenu] = useState(false);
  const [showGallerySheet, setShowGallerySheet] = useState(false);
  const [showStickerPicker, setShowStickerPicker] = useState(false);
  const [recentStickers, setRecentStickers] = useState<any[]>([]);
  const [stickerFilter, setStickerFilter] = useState("");

  const handleGalleryMediaSend = async (selectedFiles: File[], captionText?: string) => {
    if (selectedFiles.length === 0) return;
    setIsLoading(true);
    const baseTempMsgId = Date.now();

    // Instant optimistic media bubble display in chat
    const optimisticMsgs = selectedFiles.map((file, i) => ({
      id: (baseTempMsgId + i).toString(),
      text: i === 0 && captionText ? captionText : "",
      out: true,
      date: Date.now(),
      status: "pending",
      media: {
        type: file.type.startsWith("image/") ? "photo" : "document",
        url: URL.createObjectURL(file),
        name: file.name,
        size: file.size,
      },
    }));
    setMessages((prev) => [...prev, ...(optimisticMsgs as any)]);

    const formData = new FormData();
    selectedFiles.forEach((file) => formData.append("files", file));
    formData.append("chatId", chatId);
    if (captionText) formData.append("caption", captionText);
    if (replyToMsg?.id) formData.append("replyTo", replyToMsg.id);

    try {
      const response = await fetch("/api/telegram/upload", {
        method: "POST",
        body: formData,
      });
      if (response.ok) {
        const data = await response.json();
        if (data.ids && data.ids.length > 0) {
          setMessages((prev) => {
            let prevCpy = [...prev];
            data.ids.forEach((realId: any, i: number) => {
              const tempTempId = (baseTempMsgId + i).toString();
              prevCpy = prevCpy.map((m) =>
                m.id.toString() === tempTempId
                  ? {
                      ...m,
                      id: realId.toString(),
                      status: "sent",
                      date: data.date ? data.date * 1000 : m.date,
                    }
                  : m
              );
            });
            return prevCpy;
          });
        }
      }
    } catch (err) {
      console.error("Gallery upload error:", err);
    } finally {
      setIsLoading(false);
      setReplyToMsg(null);
    }
  };
  const fileInputRef = useRef<HTMLInputElement>(null);
  const galleryInputRef = useRef<HTMLInputElement>(null);
  const loadStickers = async () => {
    try {
       const res = await fetch("/api/telegram/stickers");
       const data = await res.json();
       setRecentStickers(data || []);
    } catch(e){}
  };
  useEffect(() => {
    if (showStickerPicker && recentStickers.length === 0) loadStickers();
  }, [showStickerPicker]);

  const [showProfileDialog, setShowProfileDialog] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);
  const [initialLoading, setInitialLoading] = useState(true);

  const [recordingType, setRecordingType] = useState<"audio" | "video">(
    "audio",
  );
  const [isRecording, setIsRecording] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const previewVideoRef = useRef<HTMLVideoElement>(null);
  const chunksRef = useRef<BlobPart[]>([]);
  const [facingMode, setFacingMode] = useState<"user" | "environment">("user");
  const [volumeLevel, setVolumeLevel] = useState(0);
  const audioCtxRef = useRef<any>(null);
  const reqIdRef = useRef<number | null>(null);
  const [botCommands, setBotCommands] = useState<any[]>([]);

  const [wasHolding, setWasHolding] = useState(false);
  const holdTimerRef = useRef<any>(null);

  const handleRecordPress = (e: any) => {
    e.preventDefault();
    setWasHolding(false);
    holdTimerRef.current = setTimeout(() => {
      setWasHolding(true);
      startRecording();
    }, 400);
  };

  const handleRecordRelease = (e: any) => {
    e.preventDefault();
    if (holdTimerRef.current) {
      clearTimeout(holdTimerRef.current);
      holdTimerRef.current = null;
    }
    if (isRecording || wasHolding) {
      stopRecording();
    } else {
      setRecordingType((prev) => (prev === "audio" ? "video" : "audio"));
    }
  };

  useEffect(() => {
    let interval: any;
    if (isRecording) {
      interval = setInterval(() => setRecordingTime((t) => t + 1), 1000);
    } else {
      setRecordingTime(0);
    }
    return () => clearInterval(interval);
  }, [isRecording]);

  const startRecording = async () => {
    try {
      chunksRef.current = [];
      let stream: MediaStream;
      if (recordingType === "video") {
        const videoStream = await navigator.mediaDevices.getUserMedia({
          audio: true,
          video: { width: 320, height: 320, facingMode: facingMode },
        });

        if (previewVideoRef.current) {
          previewVideoRef.current.srcObject = videoStream;
          previewVideoRef.current.play().catch(console.error);
        }

        // Create canvas to record from
        const canvas = document.createElement("canvas");
        canvas.width = 320;
        canvas.height = 320;
        const ctx = canvas.getContext("2d");

        const drawLoop = () => {
          if (ctx && previewVideoRef.current) {
            ctx.save();
            ctx.clearRect(0, 0, 320, 320);
            
            // We read current facingMode from state
            // If facingMode is user, we want to mirror the canvas drawing
            const currentFacing = localStorage.getItem("current_facing_mode") || "user";
            if (currentFacing === "user") {
              ctx.translate(320, 0);
              ctx.scale(-1, 1);
            }
            ctx.drawImage(previewVideoRef.current, 0, 0, 320, 320);
            ctx.restore();
          }
          if (mediaRecorderRef.current && mediaRecorderRef.current.state === "recording") {
            requestAnimationFrame(drawLoop);
          }
        };

        // Start drawLoop after a tiny delay to ensure stream settles
        setTimeout(() => {
          drawLoop();
        }, 120);

        const canvasStream = canvas.captureStream(30);
        // Combine canvas video track with microphone audio track
        const micTrack = videoStream.getAudioTracks()[0];
        if (micTrack) {
          canvasStream.addTrack(micTrack);
        }
        stream = canvasStream;
      } else {
        stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      }

      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;

      mediaRecorder.ondataavailable = (e) => {
        if (e.data.size > 0) chunksRef.current.push(e.data);
      };

      mediaRecorder.onstop = () => {
        const type = mediaRecorder.mimeType;
        const blob = new Blob(chunksRef.current, { type });
        const fileName =
          recordingType === "video" ? "video_note.mp4" : "voice_note.ogg";
        const recordedFile = new File([blob], fileName, { type });

        try {
          (recordedFile as any).voiceNote = recordingType === "audio";
          (recordedFile as any).videoNote = recordingType === "video";
        } catch (e) {}

        setFiles((prev) => [...prev, recordedFile]);
        stream.getTracks().forEach((track) => track.stop());
        if (previewVideoRef.current) {
          const origStream = previewVideoRef.current.srcObject as MediaStream;
          if (origStream) {
            origStream.getTracks().forEach((track) => track.stop());
          }
        }
        if (reqIdRef.current) cancelAnimationFrame(reqIdRef.current);
        if (audioCtxRef.current) audioCtxRef.current.close().catch(() => {});
      };

      if (stream.getAudioTracks().length > 0) {
        try {
          const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
          audioCtxRef.current = audioCtx;
          const analyser = audioCtx.createAnalyser();
          const src = audioCtx.createMediaStreamSource(stream);
          src.connect(analyser);
          analyser.fftSize = 256;
          const bufferLength = analyser.frequencyBinCount;
          const dataArray = new Uint8Array(bufferLength);
          
          const updateVolume = () => {
            analyser.getByteFrequencyData(dataArray);
            let sum = 0;
            for (let i = 0; i < bufferLength; i++) sum += dataArray[i];
            setVolumeLevel(sum / bufferLength);
            reqIdRef.current = requestAnimationFrame(updateVolume);
          };
          updateVolume();
        } catch(e) {}
      }

      mediaRecorder.start();
      setIsRecording(true);
    } catch (err) {
      console.error(err);
      alert(
        "Recording permission failed. Please ensure microphone/camera permissions are enabled.",
      );
    }
  };

  // Persist facingMode for the drawing loop
  useEffect(() => {
    localStorage.setItem("current_facing_mode", facingMode);
  }, [facingMode]);

  const switchCamera = async (e: any) => {
    e.stopPropagation();
    e.preventDefault();
    const newMode = facingMode === 'user' ? 'environment' : 'user';
    setFacingMode(newMode);
    try {
      const newStream = await navigator.mediaDevices.getUserMedia({
        audio: false,
        video: { width: 320, height: 320, facingMode: newMode }
      });
      const newTrack = newStream.getVideoTracks()[0];
      if (previewVideoRef.current) {
        const oldStream = previewVideoRef.current.srcObject as MediaStream;
        if (oldStream) {
          const oldTrack = oldStream.getVideoTracks()[0];
          if (oldTrack) {
            oldStream.removeTrack(oldTrack);
            oldTrack.stop();
          }
          oldStream.addTrack(newTrack);
        } else {
          previewVideoRef.current.srcObject = newStream;
        }
        previewVideoRef.current.play().catch(console.error);
      }
    } catch(err) { console.error(err); }
  };

  const stopRecording = () => {
    if (
      mediaRecorderRef.current &&
      mediaRecorderRef.current.state !== "inactive"
    ) {
      mediaRecorderRef.current.stop();
    }
    setIsRecording(false);
  };

  const getDaysWithMedia = () => {
    const daysMap = new Map<string, { dateStr: string; timestamp: number; firstMediaMsg: any; firstMsg: any }>();
    const sorted = [...messages].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
    
    sorted.forEach(m => {
      const d = new Date(m.date);
      const dateStr = d.toLocaleDateString("ru-RU", {
        day: "numeric",
        month: "long",
        year: "numeric"
      });
      
      if (!daysMap.has(dateStr)) {
        daysMap.set(dateStr, {
          dateStr,
          timestamp: d.getTime(),
          firstMediaMsg: m.media ? m : null,
          firstMsg: m
        });
      } else {
        const existing = daysMap.get(dateStr)!;
        if (!existing.firstMediaMsg && m.media) {
          existing.firstMediaMsg = m;
        }
      }
    });
    
    return Array.from(daysMap.values()).sort((a, b) => b.timestamp - a.timestamp);
  };

  const [viewingMedia, setViewingMedia] = useState<{
    url: string;
    type: "video" | "image" | "pdf" | "document" | "text" | "json" | "other";
    name?: string;
    mimeType?: string;
  } | null>(null);

  const [galleryItems, setGalleryItems] = useState<{
    url: string;
    type: "video" | "image" | "pdf" | "document" | "text" | "json" | "other";
    name?: string;
    mimeType?: string;
  }[]>([]);
  const [galleryIdx, setGalleryIdx] = useState<number>(0);
  const [galleryTouchStartX, setGalleryTouchStartX] = useState<number | null>(null);
  const [commentThreadMessageId, setCommentThreadMessageId] = useState<string | null>(null);
  const [showCalendarModal, setShowCalendarModal] = useState(false);
  const [selectedCalendarDate, setSelectedCalendarDate] = useState<string | null>(null);

  useEffect(() => {
    const handleEditRequest = (e: any) => {
      setEditingImageUrl(e.detail);
    };
    const handleOpenComments = (e: any) => {
      setCommentThreadMessageId(e.detail.messageId?.toString() || null);
    };
    const handleOpenUserProfile = (e: any) => {
      if (e.detail && e.detail.userId) {
        setViewingProfileUserId(e.detail.userId.toString());
        setViewingProfileUserName(e.detail.userName || "User Profile");
      }
    };
    const handleViewRequest = (e: any) => {
      const triggeredUrl = e.detail.url;
      const triggeredType = e.detail.type || "image";
      const triggeredMimeType = e.detail.mimeType;
      const triggeredName = e.detail.name;

      const collected: {
        url: string;
        type: "video" | "image" | "pdf" | "document" | "text" | "json" | "other";
        name?: string;
        mimeType?: string;
      }[] = [];

      if (triggeredType === "document" || triggeredType === "pdf") {
        const extType = triggeredMimeType === "application/pdf" || triggeredUrl.endsWith(".pdf") ? "pdf" as const : "document" as const;
        collected.push({ url: triggeredUrl, type: extType, name: triggeredName, mimeType: triggeredMimeType });
      } else if (triggeredUrl.includes('/api/telegram/avatar/')) {
        collected.push({ url: triggeredUrl, type: "image" });
      } else {
        messages.forEach(m => {
          if (m.groupedItems && m.groupedItems.length > 0) {
            m.groupedItems.forEach(gi => {
              if (gi.media) {
                const mUrl = `/api/telegram/media/${chatId}/${gi.id}`;
                const mType = gi.videoNote ? 'video' : (gi.mediaType || (gi.mimeType?.startsWith('video/') ? 'video' : 'image'));
                if (!collected.some(item => item.url === mUrl)) {
                  collected.push({ url: mUrl, type: mType as any });
                }
              }
            });
          } else if (m.media) {
            const mUrl = `/api/telegram/media/${chatId}/${m.id}`;
            const mType = m.videoNote ? 'video' : (m.mediaType || (m.mimeType?.startsWith('video/') ? 'video' : 'image'));
            if (!collected.some(item => item.url === mUrl)) {
              collected.push({ url: mUrl, type: mType as any });
            }
          }
        });
      }

      if (!collected.some(item => item.url === triggeredUrl)) {
        collected.push({ 
          url: triggeredUrl, 
          type: triggeredType,
          name: triggeredName,
          mimeType: triggeredMimeType
        });
      }

      let startIdx = collected.findIndex(item => item.url === triggeredUrl);
      if (startIdx === -1) startIdx = collected.length - 1;

      setGalleryItems(collected);
      setGalleryIdx(startIdx);
      setViewingMedia(collected[startIdx] || { url: triggeredUrl, type: triggeredType, name: triggeredName, mimeType: triggeredMimeType });
    };

    const handleViewAvatarsRequest = (e: any) => {
      const list = e.detail.avatarsList || [];
      const startIdx = e.detail.activeIdx || 0;
      const collected = list.map((url: string) => ({ url, type: "image" as const }));
      setGalleryItems(collected);
      setGalleryIdx(startIdx);
      if (collected.length > 0) {
        setViewingMedia(collected[startIdx]);
      } else {
        setViewingMedia({ url: `/api/telegram/avatar/${chatId}`, type: "image" });
      }
    };

    window.addEventListener("edit-image-request", handleEditRequest);
    window.addEventListener("open-comments", handleOpenComments);
    window.addEventListener("open-user-profile", handleOpenUserProfile);
    window.addEventListener("view-media-request", handleViewRequest);
    window.addEventListener("view-avatars-request", handleViewAvatarsRequest);
    return () => {
      window.removeEventListener("edit-image-request", handleEditRequest);
      window.removeEventListener("open-comments", handleOpenComments);
      window.removeEventListener("open-user-profile", handleOpenUserProfile);
      window.removeEventListener("view-media-request", handleViewRequest);
      window.removeEventListener("view-avatars-request", handleViewAvatarsRequest);
    };
  }, [messages, chatId]);

  // Gallery keyboard controls (ArrowLeft, ArrowRight, Escape)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!viewingMedia || galleryItems.length <= 1) return;
      if (e.key === "ArrowLeft" && galleryIdx > 0) {
        const prevIdx = galleryIdx - 1;
        setGalleryIdx(prevIdx);
        setViewingMedia(galleryItems[prevIdx]);
      } else if (e.key === "ArrowRight" && galleryIdx < galleryItems.length - 1) {
        const nextIdx = galleryIdx + 1;
        setGalleryIdx(nextIdx);
        setViewingMedia(galleryItems[nextIdx]);
      } else if (e.key === "Escape") {
        setViewingMedia(null);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [viewingMedia, galleryIdx, galleryItems]);

  // Request notification permissions
  useEffect(() => {
    try {
      if (
        "Notification" in window &&
        window.Notification &&
        Notification.permission !== "granted" &&
        Notification.permission !== "denied"
      ) {
        Notification.requestPermission().catch(console.warn);
      }
    } catch (err) {
      console.warn("Notifications area not available in this context", err);
    }
  }, []);

  const [isTyping, setIsTyping] = useState(false);
  const [typingActionText, setTypingActionText] = useState("");
  const [isOnline, setIsOnline] = useState(false);
  const [statusStr, setStatusStr] = useState("");
  const [myUserId, setMyUserId] = useState<string>(() => {
    try {
      return localStorage.getItem("telegram_my_id") || "";
    } catch {
      return "";
    }
  });

  useEffect(() => {
    fetch("/api/telegram/me")
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => {
        if (data?.id) {
          const idStr = String(data.id);
          setMyUserId(idStr);
          try {
            localStorage.setItem("telegram_my_id", idStr);
          } catch {}
        }
      })
      .catch(() => {});
  }, []);

  const [chatTypeData, setChatTypeData] = useState<{
    participantCount?: number;
    isChannel?: boolean;
    isGroup?: boolean;
    isMegagroup?: boolean;
    isBroadcast?: boolean;
    verified?: boolean;
    premium?: boolean;
    fake?: boolean;
    scam?: boolean;
  } | null>(null);

  useEffect(() => {
    setInitialLoading(true);
    setHasMore(true);
    setLoadingMore(false);

    const fetchStatus = () => {
      fetch(`/api/telegram/user/${chatId}`)
        .then((res) => res.json())
        .then((data) => {
          const localActivityStr = localStorage.getItem(`last_online_${chatId}`);
          const localActivityVal = localActivityStr ? parseInt(localActivityStr, 10) : 0;
          const isRecentlyOnline = (Date.now() - localActivityVal) < 7 * 60 * 1000;
          const onlineNow = Boolean(data.isOnline || isRecentlyOnline);
          setIsOnline(onlineNow);

          if (onlineNow) {
            setStatusStr(data.statusStr || (strings.online || "в сети"));
            localStorage.setItem(`last_online_${chatId}`, Date.now().toString());
          } else {
            setStatusStr(data.statusStr || "offline");
          }

          if (data.botCommands) {
            setBotCommands(data.botCommands);
          }
          setChatTypeData({
            participantCount: data.participantCount,
            isChannel: data.isChannel,
            isGroup: data.isGroup,
            isMegagroup: data.isMegagroup,
            isBroadcast: data.isBroadcast,
            verified: data.verified,
            premium: data.premium,
            fake: data.fake,
            scam: data.scam,
          });
        })
        .catch(console.error);
    };
    
    fetchStatus();
    const statusInterval = setInterval(fetchStatus, 30000);

    // Fetch forum topics
    fetch(`/api/telegram/chat/${chatId}/topics`)
      .then((res) => res.json())
      .then((data) => {
        if (data.forum) {
          setIsForum(true);
          setTopics(data.topics || []);
        } else {
          setIsForum(false);
          setTopics([]);
          setActiveTopicId(null);
        }
      })
      .catch(console.error);

    fetch(`/api/telegram/messages/${chatId}`)
      .then((res) => res.json())
      .then((data) => {
        if (Array.isArray(data)) {
          const rawBytes = JSON.stringify(data).length;
          recordDataTransfer(rawBytes * 2.5, rawBytes, "download");
          setMessages(data);

          // Enqueue any media into persistent media recovery queue
          data.forEach((m: any) => {
            if (m.media) {
              const mime = m.mimeType || "";
              const mediaType = mime.startsWith("video/") ? "video" : (mime.startsWith("audio/") || m.voiceNote) ? "voice" : "photo";
              mediaSync.enqueueMedia({
                id: `${chatId}_${m.id}`,
                url: `/api/telegram/media/${chatId}/${m.id}`,
                name: m.fileName || `Media #${m.id}`,
                type: mediaType as any
              });
            }
          });

          setTimeout(() => {
            if (!isGhostModeActive()) {
              fetch(`/api/telegram/messages/${chatId}/read`, {
                method: "POST",
              }).catch(console.error);
            }

            // Find first unread message
            const firstUnread = data.find((m: any) => m.read === false && m.out === false);
            if (firstUnread) {
              setFirstUnreadMsgId(firstUnread.id.toString());
              let found = false;
              for (const delay of [50, 150, 300, 600, 1000]) {
                setTimeout(() => {
                  if (found) return;
                  const el = document.getElementById(`message-${firstUnread.id}`);
                  if (el) {
                    el.scrollIntoView({ behavior: "auto", block: "center" });
                    found = true;
                  }
                }, delay);
              }
              return;
            }
            
            bottomRef.current?.scrollIntoView({ behavior: "auto" });
          }, 150);
        } else {
          console.error("Failed to load messages:", data);
        }
        setInitialLoading(false);
      })
      .catch((e) => {
        console.error(e);
        setInitialLoading(false);
      });

    // Socket setup
    let typingTimeout: NodeJS.Timeout;
    const socket = io();
    socketRef.current = socket;

    const myStoredId = localStorage.getItem("telegram_my_id") || "";
    socket.emit("nexus_announce", {
      userId: myStoredId || "me",
      userName: "Nexusgram User",
      device: "Nexusgram Secure Node"
    });

    fetch("/api/nexus/clients")
      .then((r) => r.json())
      .then((d) => {
        if (d?.clients && Array.isArray(d.clients)) {
          setNexusClients(d.clients.map((c: any) => String(c.userId || c.id || c)));
        }
      })
      .catch(() => {});

    socket.on("nexus_clients_update", (data: any) => {
      const list = data?.clients || data;
      if (Array.isArray(list)) {
        setNexusClients(list.map((c: any) => String(c.userId || c.id || c)));
      }
    });

    // Nexus Secret Chat Socket Handlers
    socket.on("nexus_secret_chat_requested", (data: any) => {
      const currentChatId = String(chatId);
      if (String(data?.senderId) === currentChatId || String(data?.receiverId) === currentChatId) {
        setIsSecretChatActive(true);
        setIsSecretChatTerminated(false);
        const newKey = data?.secretKey || Array.from({ length: 64 }, () => Math.floor(Math.random() * 16).toString(16)).join("");
        setSecretChatKey(newKey);
        localStorage.setItem(`nexus_secret_chat_active_${currentChatId}`, "true");
        localStorage.setItem(`nexus_secret_chat_term_${currentChatId}`, "false");
        localStorage.setItem(`nexus_secret_chat_key_${currentChatId}`, newKey);
        triggerHaptic("success");
      }
    });

    socket.on("nexus_secret_chat_message", (data: any) => {
      const currentChatId = String(chatId);
      if (String(data?.senderId) === currentChatId || String(data?.receiverId) === currentChatId) {
        const incomingMsg = {
          id: data.id || Date.now(),
          text: data.text,
          out: false,
          date: data.timestamp || Date.now(),
          isSecret: true,
        };
        setSecretMessages((prev) => {
          const updated = [...prev, incomingMsg];
          localStorage.setItem(`nexus_secret_messages_${currentChatId}`, JSON.stringify(updated));
          return updated;
        });
        triggerHaptic("light");
      }
    });

    socket.on("nexus_secret_chat_ended", (data: any) => {
      const currentChatId = String(chatId);
      if (String(data?.senderId) === currentChatId || String(data?.receiverId) === currentChatId) {
        setIsSecretChatTerminated(true);
        localStorage.setItem(`nexus_secret_chat_term_${currentChatId}`, "true");
        const termNotice = {
          id: Date.now(),
          text: "🔒 Секретный чат завершён собеседником. Сообщения больше не отправляются.",
          out: false,
          date: Date.now(),
          isSystem: true,
        };
        setSecretMessages((prev) => {
          const updated = [...prev, termNotice];
          localStorage.setItem(`nexus_secret_messages_${currentChatId}`, JSON.stringify(updated));
          return updated;
        });
        triggerHaptic("heavy");
      }
    });

    socket.on("nexus_live_keystrokes", (data: any) => {
      if (!isLiveKeystrokesViewEnabled()) return;
      const currentChatId = String(chatId);
      const myId = localStorage.getItem("telegram_my_id") || "";

      // Skip if event originated from our own socket
      if (data?.socketId && socket.id && data.socketId === socket.id) return;
      if (myId && String(data?.userId) === myId && String(data?.senderId) === myId) return;

      const isMatch = 
        String(data?.chatId) === currentChatId ||
        String(data?.userId) === currentChatId ||
        String(data?.senderId) === currentChatId ||
        (myId && String(data?.targetChatId) === myId && (String(data?.userId) === currentChatId || String(data?.senderId) === currentChatId)) ||
        (String(data?.chatId) === myId && (String(data?.userId) === currentChatId || String(data?.senderId) === currentChatId));

      if (isMatch) {
        if (data?.isTyping && data?.text) {
          setLivePeerKeystroke({
            text: data.text,
            isTyping: true,
            userName: data.userName,
            timestamp: Date.now()
          });
          setIsTyping(true);
        } else {
          setLivePeerKeystroke(null);
          setIsTyping(false);
        }
      }
    });

    socket.on("user_typing", (data) => {
      const dataChatId = data?.chatId?.toString();
      const currentChatId = chatId?.toString();
      const dataUserId = data?.userId?.toString();
      const isMatch =
        dataChatId === currentChatId ||
        dataChatId === `-${currentChatId}` ||
        dataChatId === `-100${currentChatId}` ||
        `-${dataChatId}` === currentChatId ||
        `-100${dataChatId}` === currentChatId ||
        dataUserId === currentChatId ||
        (currentChatId && dataUserId === currentChatId.replace(/^-/, "").replace(/^-100/, ""));

      if (isMatch) {
        if (data.isTyping === false) {
          setIsTyping(false);
          setTypingActionText("");
          if (typingTimeout) clearTimeout(typingTimeout);
        } else {
          setIsTyping(true);
          let actionLabel = strings.typing || "печатает...";
          const act = data?.action;
          if (act === "SendMessageRecordAudioAction" || act === "SendMessageUploadAudioAction") {
            actionLabel = "записывает голосовое...";
          } else if (act === "SendMessageRecordVideoAction" || act === "SendMessageUploadVideoAction") {
            actionLabel = "записывает видео...";
          } else if (act === "SendMessageRecordRoundAction" || act === "SendMessageUploadRoundAction") {
            actionLabel = "записывает видеосообщение...";
          } else if (act === "SendMessageUploadPhotoAction") {
            actionLabel = "отправляет фото...";
          } else if (act === "SendMessageUploadDocumentAction") {
            actionLabel = "отправляет файл...";
          } else if (act === "SendMessageChooseStickerAction") {
            actionLabel = "выбирает стикер...";
          }
          setTypingActionText(actionLabel);

          // Contact is actively typing, so they are online
          setIsOnline(true);
          setStatusStr(strings.online || "в сети");
          localStorage.setItem(`last_online_${chatId}`, Date.now().toString());

          if (typingTimeout) clearTimeout(typingTimeout);
          typingTimeout = setTimeout(() => {
            setIsTyping(false);
            setTypingActionText("");
          }, 6000);
        }
      }
    });
    socket.on("user_status_update", (data) => {
      const uId = data?.userId?.toString();
      const cId = chatId?.toString();
      const isMatch = uId === cId || (cId && uId === cId.replace(/^-/, "").replace(/^-100/, ""));
      if (isMatch) {
        setIsOnline(Boolean(data.isOnline));
        if (data.isOnline) {
          localStorage.setItem(`last_online_${chatId}`, Date.now().toString());
          setStatusStr(data.statusStr || (strings.online || "в сети"));
        } else {
          setStatusStr(data.statusStr || "offline");
        }
      }
    });

    const handleVisChange = () => {
      if (!document.hidden && chatId && !isGhostModeActive()) {
        setTimeout(
          () =>
            fetch(`/api/telegram/messages/${chatId}/read`, {
              method: "POST",
            }).catch(() => {}),
          300,
        );
      }
    };
    document.addEventListener("visibilitychange", handleVisChange);

    const handleOptimisticReact = (e: any) => {
      const { messageId, emoticon, remove } = e.detail;
      setMessages(prev => prev.map(msg => {
        if (msg.id.toString() === messageId.toString()) {
          const reactions = msg.reactions ? [...msg.reactions] : [];
          let found = false;
          const newReactions = reactions.map(r => {
            if (r.emoticon === emoticon) {
              found = true;
              return { 
                ...r, 
                count: remove ? Math.max(0, r.count - 1) : r.count + 1, 
                chosenOrder: remove ? null : 0 
              };
            }
            return r;
          });
          if (!found && !remove) {
            newReactions.push({ emoticon, count: 1, chosenOrder: 0 });
          }
          return { ...msg, reactions: newReactions.filter(r => r.count > 0) };

        }
        return msg;
      }));
    };
    window.addEventListener('optimistic-react', handleOptimisticReact);

    // AyuGram Anti-Recall: listen for deleted messages
    socket.on("messages_deleted", (data: { channelId?: string, messageIds: (number | string)[] }) => {
      const antiRecall = isAntiRecallActive();
      setMessages((prev) => {
        return prev.map((msg) => {
          if (data.messageIds.some((id) => String(id) === String(msg.id))) {
            if (antiRecall) {
              return { ...msg, isDeleted: true, deletedAt: Date.now() };
            }
            return null;
          }
          return msg;
        }).filter(Boolean);
      });
    });

    socket.on("new_message", (msg) => {
      const eventChatId = msg.chatId?.toString();
      const currentChatId = chatId?.toString();
      const eventSenderId = msg.senderId?.toString();
      const eventPeerId = msg.peerId?.toString();
      const isMatch = eventChatId === currentChatId ||
                      eventChatId === `-${currentChatId}` ||
                      eventChatId === `-100${currentChatId}` ||
                      `-${eventChatId}` === currentChatId ||
                      `-100${eventChatId}` === currentChatId ||
                      eventSenderId === currentChatId ||
                      eventPeerId === currentChatId;
                      
      if (isMatch) {
        const msgBytes = JSON.stringify(msg).length;
        recordDataTransfer(msgBytes * 2.5, msgBytes, "download");

        // Enqueue media if present
        if (msg.media) {
          const mime = msg.mimeType || "";
          const mediaType = mime.startsWith("video/") ? "video" : (mime.startsWith("audio/") || msg.voiceNote) ? "voice" : "photo";
          mediaSync.enqueueMedia({
            id: `${chatId}_${msg.id}`,
            url: `/api/telegram/media/${chatId}/${msg.id}`,
            name: msg.fileName || `Media #${msg.id}`,
            type: mediaType as any
          });
        }

        setMessages((prev) => {
          // Avoid duplicates
          if (prev.find((m) => m.id === msg.id)) return prev;
          if (!msg.out) { triggerHaptic("medium"); }
          return [...prev, msg];
        });

        if (!msg.out) {
          setIsOnline(true);
          setStatusStr(strings.online || "в сети");
          localStorage.setItem(`last_online_${chatId}`, Date.now().toString());
          setIsTyping(false);
          setTypingActionText("");
          triggerHaptic("message");
          const el = chatAreaRef.current;
          if (el && el.scrollHeight - el.scrollTop - el.clientHeight > 300) {
            setUnreadIncomingCount(prev => prev + 1);
          }
        }

        if (!document.hidden && !isGhostModeActive()) {
          setTimeout(
            () =>
              fetch(`/api/telegram/messages/${chatId}/read`, {
                method: "POST",
              }).catch(() => {}),
            300,
          );
        }
      }

      // Desktop Notification
      try {
        if (msg.chatId === chatId && !msg.out && document.hidden) {
          if (
            "Notification" in window &&
            window.Notification &&
            Notification.permission === "granted"
          ) {
            new Notification(chatName, {
              body: msg.text || (msg.media ? (msg.mediaType === "MessageMediaPhoto" ? "Фотография" : "Файл") : "Новое сообщение"),
            });
          }
        }
      } catch (err) {
        // ignore iframe error
      }
    });

    return () => {
      clearInterval(statusInterval);
      document.removeEventListener("visibilitychange", handleVisChange);
      socket.disconnect();
    };
  }, [chatId]);

  const prevMessagesCountRef = useRef(0);

  useEffect(() => {
    const el = chatAreaRef.current;
    if (!el) {
      prevMessagesCountRef.current = messages.length;
      return;
    }

    const wasAdded = messages.length > prevMessagesCountRef.current;
    const wasRemoved = messages.length < prevMessagesCountRef.current;
    const isInitialLoad = prevMessagesCountRef.current === 0;

    if (wasAdded) {
      if (isInitialLoad) {
        bottomRef.current?.scrollIntoView({ behavior: "auto" });
      } else {
        const lastMsg = messages[messages.length - 1];
        const isMyMsg = lastMsg?.out === true;
        const isNearBottom = el.scrollHeight - el.scrollTop - el.clientHeight < 300;
        
        if (isMyMsg || isNearBottom) {
          bottomRef.current?.scrollIntoView({ behavior: "smooth" });
        }
      }
    } else if (wasRemoved && lastScrollTopRef.current !== undefined) {
      el.scrollTop = lastScrollTopRef.current;
    }
    prevMessagesCountRef.current = messages.length;
  }, [messages]);

  const handleFileChange = async (e: any) => {
    if (e.target.files && e.target.files.length > 0) {
      const incoming = Array.from(e.target.files) as File[];
      const processed = await Promise.all(
        incoming.map((f) => compressImageForCellularUpload(f))
      );
      setFiles((prev) => [...prev, ...processed]);
      triggerHaptic("light");
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!isDraggingFiles) {
      setIsDraggingFiles(true);
    }
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.currentTarget.contains(e.relatedTarget as Node)) return;
    setIsDraggingFiles(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDraggingFiles(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      const droppedFiles = Array.from(e.dataTransfer.files) as File[];
      setFiles((prev) => [...prev, ...droppedFiles]);
      triggerHaptic("success");
    }
  };


  const handleEdit = async (id: string, newText: string) => {
    // Save previous state for rollback
    const previousMessages = [...messages];
    // Optimistic UI update
    setMessages((prev) =>
      prev.map((m) => (m.id.toString() === id ? { ...m, text: newText } : m)),
    );

    try {
      const response = await fetch("/api/telegram/editMessage", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ chatId, messageId: id, text: newText }),
      });
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to edit");
      }
    } catch (e: any) {
      console.error(e);
      alert("Edit failed: " + e.message);
      setMessages(previousMessages); // Rollback
    }
  };

  const handleDelete = (id: string) => {
    const msgToDelete = messages.find(m => m.id.toString() === id);
    if (!msgToDelete) return;

    // Optimistic UI update
    setMessages((prev) => prev.filter((m) => m.id.toString() !== id));
    setShowUndoList((prev) => [...prev, { id }]);

    const timer = setTimeout(async () => {
      setShowUndoList((prev) => prev.filter((x) => x.id !== id));
      delete pendingDeletesRef.current[id];
      try {
        await fetch("/api/telegram/deleteMessages", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ chatId, messageIds: [id] }),
        });
      } catch (e: any) {
        console.error("Delayed delete failed", e);
      }
    }, 5000);

    pendingDeletesRef.current[id] = { timer, prevMsg: msgToDelete };
  };

  const handleUndoDelete = (id: string) => {
    const pending = pendingDeletesRef.current[id];
    if (pending) {
      clearTimeout(pending.timer);
      setMessages((prev) => {
        const msgs = [...prev, pending.prevMsg];
        return msgs.sort((a, b) => (new Date(a.date)).getTime() - (new Date(b.date)).getTime());
      });
      delete pendingDeletesRef.current[id];
      setShowUndoList((prev) => prev.filter((x) => x.id !== id));
    }
  };

  const handleSend = async (customText?: string) => {
    const messageText = (customText !== undefined ? customText : input).trim();
    if ((!messageText && files.length === 0) || isLoading) return;

    setInput("");
    localStorage.removeItem(`draft_${chatId}`);
    localStorage.removeItem(`draft_time_${chatId}`);
    window.dispatchEvent(new CustomEvent("nexus-draft-updated", { detail: { chatId, text: "", time: 0 } }));
    setIsLoading(true);

    // Nexus Blockchain Encryption Flow
    if (isBlockchainEnabled) {
      try {
        if (files.length > 0) {
          const encFiles: File[] = [];
          for (let i = 0; i < files.length; i++) {
            const f = files[i];
            const base64 = await fileToBase64(f);
            const isPhoto = f.type.startsWith("image/");
            const isVideo = f.type.startsWith("video/");
            const isVoice = f.type.startsWith("audio/") || (f as any).voiceNote;
            const blockType = isPhoto ? "photo" : isVideo ? "video" : isVoice ? "voice" : "file";

            const enc = await createNexusEncryptedBlock({
              type: blockType,
              text: i === 0 && messageText ? messageText : undefined,
              fileName: f.name,
              fileSize: f.size,
              mimeType: f.type,
              mediaBase64: base64,
            });
            saveNexusBlockLocally(enc.block);

            const encFile = new File([enc.binaryBytes], "nexus_vault_block.bin", {
              type: "application/octet-stream",
            });
            encFiles.push(encFile);
          }

          const formData = new FormData();
          formData.append("chatId", chatId);
          encFiles.forEach((ef) => formData.append("files", ef));
          if (replyToMsg?.id || activeTopicId) {
            formData.append(
              "replyTo",
              replyToMsg ? String(replyToMsg.id) : String(activeTopicId),
            );
          }

          const res = await fetch("/api/telegram/upload", {
            method: "POST",
            body: formData,
          });

          if (res.ok) {
            const data = await res.json();
            if (data.success && data.messages) {
              setMessages((prev) => [
                ...prev,
                ...(Array.isArray(data.messages) ? data.messages : [data.messages]),
              ]);
            }
          }
          setFiles([]);
          setIsLoading(false);
          triggerHaptic("light");
          return;
        } else {
          // Encrypted message as binary carrier file (nexus_vault_block.bin)
          // Non-Nexus users see a file; Nexus users read the content directly!
          const enc = await createNexusEncryptedBlock({
            type: "text",
            text: messageText,
            fileName: "nexus_vault_block.bin",
          });
          saveNexusBlockLocally(enc.block);

          const encFile = new File([enc.binaryBytes], "nexus_vault_block.bin", {
            type: "application/octet-stream",
          });

          const formData = new FormData();
          formData.append("chatId", chatId);
          formData.append("files", encFile);
          if (replyToMsg?.id || activeTopicId) {
            formData.append(
              "replyTo",
              replyToMsg ? String(replyToMsg.id) : String(activeTopicId),
            );
          }

          const res = await fetch("/api/telegram/upload", {
            method: "POST",
            body: formData,
          });

          if (res.ok) {
            const data = await res.json();
            if (data.success && data.messages) {
              setMessages((prev) => [
                ...prev,
                ...(Array.isArray(data.messages) ? data.messages : [data.messages]),
              ]);
            }
          }
          setReplyToMsg(null);
          setIsLoading(false);
          triggerHaptic("light");
          return;
        }
      } catch (err) {
        console.error("Nexus blockchain encryption send failed:", err);
      }
    }

    try {
      if (files.length > 0) {
        // Upload files as album
        const batchTempGroup = "temp-group-" + Date.now();
        const baseTempMsgId = Date.now();
        
        // Add optimistic messages
        files.forEach((fileToUpload, i) => {
          const tempMsg = {
            id: baseTempMsgId + i,
            text: i === 0 ? messageText : undefined,
            out: true,
            date: Date.now(),
            media: true,
            replyToMsgId: i === 0 ? replyToMsg?.id : undefined,
            replyToMsgText: i === 0 ? (replyToMsg?.text || ((replyToMsg as any)?.media ? "[Media]" : undefined)) : undefined,
            mimeType:
              fileToUpload.type ||
              (fileToUpload.name.endsWith(".ian")
                ? "application/x-ian"
                : undefined),
            __groupedTempId: files.length > 1 ? batchTempGroup : undefined, // Optimistic grouping unique to this batch
          };
          setMessages((prev) => [...prev, tempMsg]);
        });
        
        // Compress images via EcoStream to drastically reduce cellular upload traffic
        const processedFiles: File[] = [];
        for (const f of files) {
          if (f.type.startsWith("image/") && !f.type.includes("gif")) {
            const comp = await compressImageForUpload(f);
            processedFiles.push(comp.file);
          } else {
            recordDataTransfer(f.size * 1.4, f.size, "upload");
            processedFiles.push(f);
          }
        }

        const formData = new FormData();
        formData.append("chatId", chatId);
        if (messageText) formData.append("message", messageText);
        
        processedFiles.forEach(f => {
          formData.append("files", f);
        });

        if (replyToMsg || activeTopicId) {
          formData.append(
            "replyTo",
            replyToMsg ? replyToMsg.id : String(activeTopicId),
          );
        }

        const voiceNoteFile = files.find(f => f.name === "voice_note.ogg" || (f as any).voiceNote);
        if (voiceNoteFile) formData.append("voiceNote", "true");

        const videoNoteFile = files.find(f => f.name === "video_note.mp4" || (f as any).videoNote);
        if (videoNoteFile) formData.append("videoNote", "true");

        try {
          const response = await fetch("/api/telegram/upload", {
            method: "POST",
            body: formData,
          });

          if (!response.ok) {
            console.error("Failed to upload batch");
          } else {
            const data = await response.json();
            if (data.ids && data.ids.length > 0) {
              const event = new CustomEvent("dialog-update", {
                detail: {
                  chatId,
                  text: messageText || "",
                  date: Date.now(),
                },
              });
              window.dispatchEvent(event);
              
              setMessages((prev) => {
                let prevCpy = [...prev];
                data.ids.forEach((realId: any, i: number) => {
                  const tempTempId = baseTempMsgId + i;
                  if (prevCpy.some((m) => m.id === realId && m.id !== tempTempId)) {
                    prevCpy = prevCpy.filter((m) => m.id !== tempTempId);
                  } else {
                    prevCpy = prevCpy.map((m) => m.id === tempTempId ? { ...m, id: realId, date: data.date ? data.date * 1000 : m.date } : m);
                  }
                });
                return prevCpy;
              });
            }
          }
        } catch (err) {
          console.error("Upload error", err);
        }
        setFiles([]); // Clear
      } else {
        // Check if Secret Chat is active
        if (isSecretChatActive) {
          const tempMsgId = Date.now();
          const currentChatId = String(chatId);

          if (isSecretChatTerminated) {
            const failedMsg = {
              id: tempMsgId,
              text: messageText,
              out: true,
              date: Date.now(),
              isSecret: true,
              failed: true,
              failedNotice: "Не отправлено: секретный чат завершён",
            };
            setSecretMessages((prev) => {
              const updated = [...prev, failedMsg];
              localStorage.setItem(`nexus_secret_messages_${currentChatId}`, JSON.stringify(updated));
              return updated;
            });
            return;
          }

          const newSecretMsg = {
            id: tempMsgId,
            text: messageText,
            out: true,
            date: Date.now(),
            isSecret: true,
          };

          setSecretMessages((prev) => {
            const updated = [...prev, newSecretMsg];
            localStorage.setItem(`nexus_secret_messages_${currentChatId}`, JSON.stringify(updated));
            return updated;
          });

          try {
            await fetch("/api/telegram/secret-chat/message", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                peerId: currentChatId,
                text: messageText,
                secretKey: secretChatKey,
              }),
            });
            if (socketRef.current) {
              socketRef.current.emit("nexus_secret_chat_message", {
                receiverId: currentChatId,
                text: messageText,
                secretKey: secretChatKey,
                timestamp: Date.now(),
              });
            }
          } catch (err) {
            console.error("Failed to route secret chat message", err);
          }
          return;
        }

        // Optimistic UI update for standard Telegram text
        const tempMsgId = Date.now();
        const tempMsg = {
          id: tempMsgId,
          text: messageText,
          out: true,
          date: Date.now(),
          replyToMsgId: replyToMsg?.id,
          replyToMsgText: replyToMsg?.text || ((replyToMsg as any)?.media ? "[Media]" : undefined)
        };
        setMessages((prev) => [...prev, tempMsg]);

        // Cellular data telemetry tracking
        const textPayloadBytes = new Blob([messageText]).size + 120;
        recordDataTransfer(textPayloadBytes * 2.8, textPayloadBytes, "upload");

        const response = await fetch("/api/telegram/sendMessage", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            chatId,
            message: messageText,
            replyTo: replyToMsg?.id || activeTopicId,
          }),
        });

        if (!response.ok) {
          const err = await response.json().catch(() => ({}));
          throw new Error(err.error || "Failed to send message");
        }
        const data = await response.json();
        if (data.id) {
          // Reposition dialog at top of list instantly
          const event = new CustomEvent("dialog-update", {
            detail: {
              chatId,
              text: messageText,
              date: Date.now(),
            },
          });
          window.dispatchEvent(event);

          setMessages((prev) => {
            if (prev.some((m) => m.id === data.id && m.id !== tempMsgId)) {
              return prev.filter((m) => m.id !== tempMsgId);
            }
            return prev.map((m) =>
              m.id === tempMsgId
                ? { ...m, id: data.id, date: data.date * 1000 }
                : m,
            );
          });
        }
      }
    } catch (error) {
      console.error(error);
    } finally {
      setIsLoading(false);
      setReplyToMsg(null);
    }
  };

  const handleKeyDown = (e: any) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleReply = (msgId: string) => {
    const msg = messages.find((m) => m.id.toString() === msgId);
    if (msg) {
      setReplyToMsg({ 
        id: msgId, 
        text: msg.text || "Media",
        senderName: msg.senderName || (msg.isOutgoing ? "Вы" : undefined)
      });
    }
  };

  const handlePin = async (msgId: string) => {
    try {
      await fetch("/api/telegram/messages/pin", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ chatId, messageId: msgId }),
      });
    } catch (err) {
      console.error("Failed to pin message");
    }
  };

  const sendText = async (text: string) => {
    try {
      const tempMsgId = Date.now();
      setMessages((prev) => [...prev, {
        id: tempMsgId.toString(), text, out: true, date: Date.now(),
      } as any]);
      const res = await fetch("/api/telegram/sendMessage", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ chatId, message: text, replyTo: activeTopicId })
      });
      if (res.ok) {
        const data = await res.json();
        if (data.id) {
          setMessages((prev) => prev.map((m) => m.id === tempMsgId.toString() ? { ...m, id: data.id, date: data.date * 1000 } : m));
        }
      }
    } catch(e) {}
  };

  const lastMessageWithReplyMarkup = [...messages].reverse().find(m => m.replyMarkup?.className === "ReplyKeyboardMarkup");

  const filteredCommands = input.startsWith("/") && botCommands
    ? botCommands.filter(c => c.command.toLowerCase().startsWith(input.slice(1).toLowerCase()))
    : [];

  return (
    <div 
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
      className="flex-1 flex flex-col h-full telegram-chat-bg relative touch-pan-y select-none"
    >
      {/* Drag and drop full overlay indicator */}
      <AnimatePresence>
        {isDraggingFiles && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 z-50 bg-[#0e1621]/90 backdrop-blur-md flex flex-col items-center justify-center border-2 border-dashed border-[#2481cc] m-4 rounded-3xl pointer-events-none"
          >
            <div className="w-16 h-16 rounded-full bg-[#2481cc]/20 text-[#2481cc] flex items-center justify-center mb-3 animate-bounce">
              <Upload className="w-8 h-8" />
            </div>
            <p className="text-white text-base font-semibold">Перетащите файлы сюда</p>
            <p className="text-gray-400 text-xs mt-1">Фотографии, видео или документы отправятся в этот чат</p>
          </motion.div>
        )}
      </AnimatePresence>

      {showProfileDialog && (
        (chatId === "me" || (myUserId && String(chatId) === String(myUserId)) || chatName === "Избранное" || chatName === "Saved Messages") ? (
          <SavedMessagesProfileView
            onClose={() => setShowProfileDialog(false)}
            messages={messages}
            onSelectChatSource={(sourceTitle) => {
              // source selected
            }}
          />
        ) : (
          <ChatProfileDialog
            onClose={() => setShowProfileDialog(false)}
            chatId={chatId}
            chatName={chatName}
            onSelectUser={onSelectUser}
            messages={messages}
            onSendGift={(msg) => setMessages((prev) => [...prev, msg])}
          />
        )
      )}
      {viewingProfileUserId && (
        <ChatProfileDialog
          onClose={() => setViewingProfileUserId(null)}
          chatId={viewingProfileUserId}
          chatName={viewingProfileUserName}
          onSelectUser={onSelectUser}
          messages={messages}
          onSendGift={(msg) => setMessages((prev) => [...prev, msg])}
        />
      )}
      {showSelectDeleteConfirm && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-md flex items-center justify-center p-4 z-50 animate-fade-in">
          <div className="bg-[#111116] border border-[#22222d] w-full max-w-sm rounded-3xl p-6 shadow-2xl flex flex-col gap-4 text-center">
            <div className="w-12 h-12 bg-red-500/10 text-red-500 rounded-full flex items-center justify-center mx-auto">
              <Trash2 className="w-6 h-6" />
            </div>
            <div className="flex flex-col gap-1">
              <h3 className="text-gray-100 font-display font-medium text-base">Delete Messages</h3>
              <p className="text-xs text-gray-400">
                Are you sure you want to delete the selected <strong className="text-indigo-400 font-mono">{selectedMessageIds.length}</strong> messages? This action cannot be undone.
              </p>
            </div>
            <div className="flex items-center gap-2 mt-2">
              <button
                onClick={() => setShowSelectDeleteConfirm(false)}
                className="flex-1 py-2.5 bg-[#1c1c28] hover:bg-[#242435] border border-[#2c2c3e] text-xs font-semibold rounded-xl text-gray-400 hover:text-white transition-all cursor-pointer"
              >
                No, Keep
              </button>
              <button
                onClick={async () => {
                  setShowSelectDeleteConfirm(false);
                  
                  // Optimistic UI
                  setMessages((prev) =>
                    prev.filter(
                      (m) => !selectedMessageIds.includes(m.id.toString()),
                    ),
                  );
                  setIsSelectMode(false);

                  try {
                    const response = await fetch("/api/telegram/deleteMessages", {
                      method: "POST",
                      headers: { "Content-Type": "application/json" },
                      body: JSON.stringify({
                        chatId,
                        messageIds: selectedMessageIds,
                      }),
                    });
                    if (!response.ok) {
                      throw new Error("Failed to delete selected messages");
                    }
                  } catch (e: any) {
                    console.error("Batch delete failed", e);
                  } finally {
                    setSelectedMessageIds([]);
                  }
                }}
                className="flex-1 py-2.5 bg-red-600 hover:bg-red-500 text-white text-xs font-bold rounded-xl transition-all cursor-pointer"
              >
                Yes, Delete
              </button>
            </div>
          </div>
        </div>
      )}
      {viewingMedia && (
        <div
          onClick={() => setViewingMedia(null)}
          className="fixed inset-0 bg-black/95 backdrop-blur z-[80] flex items-center justify-center p-4 cursor-pointer select-none"
        >
          <button
            onClick={(e) => {
              e.stopPropagation();
              setViewingMedia(null);
            }}
            className="absolute top-4 right-4 p-2.5 bg-white/10 hover:bg-white/25 rounded-full text-white transition-all hover:scale-110 cursor-pointer z-50 animate-fade-in"
            title="Close Viewer (Esc)"
          >
            <X className="w-6 h-6" />
          </button>

          {/* Left Arrow Button */}
          {galleryItems.length > 1 && galleryIdx > 0 && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                const prevIdx = galleryIdx - 1;
                setGalleryIdx(prevIdx);
                setViewingMedia(galleryItems[prevIdx]);
              }}
              className="absolute left-6 top-1/2 -translate-y-1/2 p-3 bg-white/5 hover:bg-white/15 border border-white/10 rounded-full text-white/90 cursor-pointer select-none z-55 transition-all hover:scale-110 active:scale-95"
              title="Previous (Arrow Left)"
            >
              <ChevronLeft className="w-6 h-6" />
            </button>
          )}

          {/* Right Arrow Button */}
          {galleryItems.length > 1 && galleryIdx < galleryItems.length - 1 && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                const nextIdx = galleryIdx + 1;
                setGalleryIdx(nextIdx);
                setViewingMedia(galleryItems[nextIdx]);
              }}
              className="absolute right-6 top-1/2 -translate-y-1/2 p-3 bg-white/5 hover:bg-white/15 border border-white/10 rounded-full text-white/90 cursor-pointer select-none z-55 transition-all hover:scale-110 active:scale-95"
              title="Next (Arrow Right)"
            >
              <ChevronRight className="w-6 h-6" />
            </button>
          )}

          <div
            onClick={(e) => e.stopPropagation()}
            onTouchStart={(e) => {
              setGalleryTouchStartX(e.touches[0].clientX);
            }}
            onTouchEnd={(e) => {
              if (galleryTouchStartX === null) return;
              const diffX = galleryTouchStartX - e.changedTouches[0].clientX;
              if (Math.abs(diffX) > 60) {
                if (diffX > 0 && galleryIdx < galleryItems.length - 1) {
                  const nextIdx = galleryIdx + 1;
                  setGalleryIdx(nextIdx);
                  setViewingMedia(galleryItems[nextIdx]);
                } else if (diffX < 0 && galleryIdx > 0) {
                  const prevIdx = galleryIdx - 1;
                  setGalleryIdx(prevIdx);
                  setViewingMedia(galleryItems[prevIdx]);
                }
              }
              setGalleryTouchStartX(null);
            }}
            onMouseDown={(e) => {
              setGalleryTouchStartX(e.clientX);
            }}
            onMouseUp={(e) => {
              if (galleryTouchStartX === null) return;
              const diffX = galleryTouchStartX - e.clientX;
              if (Math.abs(diffX) > 60) {
                if (diffX > 0 && galleryIdx < galleryItems.length - 1) {
                  const nextIdx = galleryIdx + 1;
                  setGalleryIdx(nextIdx);
                  setViewingMedia(galleryItems[nextIdx]);
                } else if (diffX < 0 && galleryIdx > 0) {
                  const prevIdx = galleryIdx - 1;
                  setGalleryIdx(prevIdx);
                  setViewingMedia(galleryItems[prevIdx]);
                }
              }
              setGalleryTouchStartX(null);
            }}
            className="w-full h-full flex items-center justify-center max-w-5xl relative group cursor-default touch-pan-y"
          >
            {viewingMedia.type === "image" ? (
              <img
                src={viewingMedia.url}
                alt={`Media ${galleryIdx + 1}`}
                className="max-w-full max-h-[85vh] object-contain rounded-lg shadow-2xl animate-fade-in pointer-events-none"
              />
            ) : viewingMedia.type === "video" ? (
              <video
                src={viewingMedia.url}
                controls
                autoPlay
                className="max-w-full max-h-[85vh] object-contain rounded-lg shadow-2xl animate-fade-in"
              />
            ) : viewingMedia.type === "pdf" ? (
              <div className="w-full h-[80vh] flex flex-col bg-[#111116] border border-white/10 rounded-2xl overflow-hidden shadow-2xl max-w-4xl animate-fade-in">
                <div className="bg-black/40 border-b border-white/5 p-4 flex items-center justify-between text-xs text-gray-300">
                  <span className="font-mono truncate max-w-xs">{viewingMedia.name || "Document.pdf"}</span>
                  <span className="font-semibold text-indigo-400 bg-indigo-500/10 px-2.5 py-0.5 rounded">PDF</span>
                </div>
                <iframe
                  src={`${viewingMedia.url}#toolbar=0`}
                  className="w-full h-full border-none bg-[#111116]"
                  title="PDF Viewer"
                />
              </div>
            ) : (
              <ClientFileViewer 
                url={viewingMedia.url} 
                name={viewingMedia.name || "Downloadable File"} 
                mimeType={viewingMedia.mimeType || ""} 
              />
            )}

            {viewingMedia.type === "image" && (
              <button
                onClick={() => {
                  setEditingImageUrl(viewingMedia.url);
                  setViewingMedia(null);
                }}
                className="absolute bottom-4 right-4 px-4 py-2 bg-blue-600 hover:bg-blue-500 rounded-lg text-white font-medium flex items-center gap-2 shadow-xl opacity-0 group-hover:opacity-100 transition-opacity"
              >
                <Edit2 className="w-4 h-4" /> Edit Image
              </button>
            )}

            {/* Gallery Indicator Badge */}
            {galleryItems.length > 1 && (
              <div className="absolute top-4 left-1/2 -translate-x-1/2 px-3.5 py-1.5 bg-black/60 backdrop-blur rounded-full text-white text-[11px] font-mono tracking-widest border border-white/5 shadow-md">
                {galleryIdx + 1} / {galleryItems.length}
              </div>
            )}
          </div>
        </div>
      )}
      {editingImageUrl && (
        <ImageEditor
          imageUrl={editingImageUrl}
          onSave={(editedFile) => {
            setFiles((prev) => [...prev, editedFile]);
            setEditingImageUrl(null);
          }}
          onCancel={() => setEditingImageUrl(null)}
        />
      )}

      {commentThreadMessageId && (
        <CommentsModal
          onClose={() => setCommentThreadMessageId(null)}
          chatId={chatId}
          messageId={commentThreadMessageId}
        />
      )}

      {showCalendarModal && (
        <div
          className="fixed inset-0 bg-black/70 backdrop-blur-md flex items-center justify-center p-4 z-[75] animate-fade-in"
          onClick={() => setShowCalendarModal(false)}
        >
          <div
            className="bg-[#111116] border border-[#2a2a38] rounded-3xl w-full max-w-lg relative shadow-2xl flex flex-col max-h-[85vh] animate-scale-up"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex justify-between items-center p-5 border-b border-[#1a1a24]">
              <div>
                <h2 className="text-white font-semibold text-base flex items-center gap-2">
                  📅 Календарь медиа
                </h2>
                <p className="text-[10px] text-gray-500 mt-0.5">
                  Первое медиа за каждый день. Выберите день для перехода к сообщению
                </p>
              </div>
              <button
                onClick={() => setShowCalendarModal(false)}
                className="p-2 bg-[#1a1a24] hover:bg-[#2a2a38] rounded-xl text-gray-300 transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-6 overflow-y-auto flex-1">
              {(() => {
                const daysWithMedia = getDaysWithMedia();
                if (daysWithMedia.length === 0) {
                  return (
                    <div className="flex flex-col items-center justify-center py-16 text-gray-500">
                      <p className="text-sm">Нет доступных дней в этом чате</p>
                    </div>
                  );
                }

                return (
                  <div className="grid grid-cols-3 sm:grid-cols-4 gap-6 justify-items-center">
                    {daysWithMedia.map((day) => {
                      const isHighlighted = selectedCalendarDate === day.dateStr;
                      const targetId = day.firstMediaMsg ? day.firstMediaMsg.id : day.firstMsg.id;
                      
                      return (
                        <div
                          key={day.dateStr}
                          onClick={() => {
                            const element = document.getElementById(`message-${targetId}`);
                            if (element) {
                              element.scrollIntoView({ behavior: "smooth", block: "center" });
                              element.classList.add("animate-pulse", "brightness-125");
                              setTimeout(() => {
                                element.classList.remove("animate-pulse", "brightness-125");
                              }, 1500);
                            }
                            setShowCalendarModal(false);
                          }}
                          className={`flex flex-col items-center gap-2.5 cursor-pointer group rounded-2xl p-2/5 transition-all w-full text-center ${isHighlighted ? 'bg-indigo-500/10 border border-indigo-500/20' : 'hover:bg-white/5 border border-transparent'}`}
                        >
                          <div className="relative">
                            <div className={`w-16 h-16 rounded-full overflow-hidden border-2 flex items-center justify-center shadow-lg transition-transform duration-300 group-hover:scale-110 ${isHighlighted ? 'border-indigo-400 bg-indigo-950/40 ring-4 ring-indigo-500/20' : 'border-gray-700 bg-gray-950 group-hover:border-indigo-500/60'}`}>
                              {day.firstMediaMsg ? (
                                <img
                                  src={`/api/telegram/media/${chatId}/${day.firstMediaMsg.id}`}
                                  alt={day.dateStr}
                                  className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                                  onError={(e) => {
                                    e.currentTarget.style.display = 'none';
                                    const fallback = e.currentTarget.parentElement;
                                    if (fallback) {
                                      fallback.innerHTML = `<span class="text-xs text-indigo-400">🖼️</span>`;
                                    }
                                  }}
                                />
                              ) : (
                                <span className="text-xl">📅</span>
                              )}
                            </div>
                            
                            {isHighlighted && (
                              <span className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-2.5 h-2.5 bg-indigo-500 border border-[#111116] rounded-full animate-ping z-10" />
                            )}
                          </div>
                          
                          <div className="flex flex-col items-center min-w-0 w-full">
                            <span className="text-xs font-semibold text-gray-200 group-hover:text-indigo-300 transition-colors truncate max-w-[90%] font-sans">
                              {day.dateStr.replace(" г.", "").split(" ").slice(0, 2).join(" ")}
                            </span>
                            <span className="text-[9px] text-gray-500 font-mono mt-0.5 truncate max-w-[90%]">
                              {day.dateStr.split(" ").slice(2, 3).join("") || "2026"}
                            </span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                );
              })()}
            </div>
          </div>
        </div>
      )}

      {showCommonChatsModal && (
        <div
          className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-[60]"
          onClick={() => setShowCommonChatsModal(false)}
        >
          <div
            className="bg-[#111116] border border-[#2a2a38] rounded-3xl w-full max-w-sm relative shadow-2xl flex flex-col max-h-[70vh] animate-fade-in animate-duration-200"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex justify-between items-center p-4 border-b border-[#1a1a24]">
              <h2 className="text-white font-semibold text-sm">
                {commonChatsIsChannel
                  ? "Similar Channels"
                  : commonChatsIsGroup
                    ? "Similar Groups"
                    : "Chats & Channels"}
              </h2>
              <button
                onClick={() => setShowCommonChatsModal(false)}
                className="p-1.5 bg-[#1a1a24] hover:bg-[#2a2a38] rounded-lg text-gray-400 hover:text-white transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-4 space-y-2">
              {loadingCommonChats ? (
                <div className="flex flex-col items-center justify-center py-12 gap-2 text-gray-500 font-medium">
                  <Loader2 className="w-6 h-6 animate-spin text-indigo-500" />
                  <span className="text-xs">Locating chats...</span>
                </div>
              ) : commonChatsList.length === 0 ? (
                <div className="text-center py-12 text-gray-500 text-xs">
                  No common groups or channels found.
                </div>
              ) : (
                commonChatsList.map((c) => (
                  <div
                    key={c.id}
                    onClick={() => {
                      if (onSelectUser) {
                        onSelectUser(c.id, c.name);
                        setShowCommonChatsModal(false);
                      }
                    }}
                    className="flex items-center gap-3 p-2.5 bg-[#181824]/50 border border-[#232334] rounded-2xl hover:bg-indigo-600/10 hover:border-indigo-500/20 transition-all cursor-pointer"
                  >
                    <div className="w-8 h-8 rounded-xl bg-indigo-500/10 flex items-center justify-center text-indigo-400 font-bold uppercase text-xs relative overflow-hidden">
                      {c.name ? c.name.charAt(0) : "G"}
                      <img
                        src={`/api/telegram/avatar/${c.id}`}
                        className="absolute inset-0 w-full h-full object-cover z-10"
                        onError={(e) => {
                          e.currentTarget.style.display = "none";
                        }}
                        alt={c.name}
                      />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-gray-200 text-xs font-semibold truncate hover:text-indigo-400 transition-colors">
                        {c.name}
                      </p>
                      <p className="text-[10px] text-gray-500 truncate">
                        {c.isChannel ? "Group/Channel" : "Direct Chat"}
                      </p>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}

      {showForwardDialog && (
        <div
          className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-[60]"
          onClick={() => setShowForwardDialog(false)}
        >
          <div
            className="bg-[#111116] border border-[#2a2a38] rounded-3xl w-full max-w-sm relative shadow-2xl flex flex-col max-h-[70vh] animate-fade-in animate-duration-205"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex justify-between items-center p-4 border-b border-[#1a1a24]">
              <h2 className="text-white font-semibold text-sm">
                Forward Messages to...
              </h2>
              <button
                onClick={() => setShowForwardDialog(false)}
                className="p-1.5 bg-[#1a1a24] hover:bg-[#2a2a38] rounded-lg text-gray-400 hover:text-white transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-3 border-b border-[#1a1a24]">
              <input
                type="text"
                value={forwardSearch}
                onChange={(e) => setForwardSearch(e.target.value)}
                placeholder="Search active chats..."
                className="w-full bg-[#1a1a24] border border-[#2a2a38] rounded-xl px-3 py-1.5 text-xs text-white placeholder-gray-500 focus:outline-none focus:border-indigo-500"
              />
            </div>

            <div className="flex-1 overflow-y-auto p-2 space-y-1">
              {loadingForward ? (
                <div className="flex items-center justify-center py-10">
                  <Loader2 className="w-6 h-6 animate-spin text-indigo-500" />
                </div>
              ) : chatList.length === 0 ? (
                <div className="text-center p-6 text-gray-500 text-xs font-mono">
                  No active conversations found
                </div>
              ) : (
                chatList
                  .filter(
                    (c) =>
                      !forwardSearch ||
                      (c.name || "")
                        .toLowerCase()
                        .includes(forwardSearch.toLowerCase()),
                  )
                  .map((c) => (
                    <button
                      key={c.id}
                      onClick={async () => {
                        setLoadingForward(true);
                        try {
                          await fetch("/api/telegram/messages/forward", {
                            method: "POST",
                            headers: { "Content-Type": "application/json" },
                            body: JSON.stringify({
                              fromChatId: chatId,
                              toChatId: c.id,
                              messageIds: selectedMessageIds,
                            }),
                          });
                          setIsSelectMode(false);
                          setSelectedMessageIds([]);
                          setShowForwardDialog(false);
                        } catch (err) {
                          console.error("Failed to forward", err);
                        } finally {
                          setLoadingForward(false);
                        }
                      }}
                      className="w-full text-left flex items-center gap-3 p-2.5 hover:bg-indigo-600/10 border border-transparent hover:border-indigo-500/10 rounded-2xl transition-all cursor-pointer"
                    >
                      <div className="w-8 h-8 rounded-full bg-indigo-500/10 flex items-center justify-center font-bold text-indigo-400 text-xs">
                        {c.name ? c.name.charAt(0).toUpperCase() : "U"}
                      </div>
                      <div className="min-w-0">
                        <p className="text-gray-200 text-xs font-semibold truncate">
                          {c.name}
                        </p>
                        <p className="text-[10px] text-gray-500 truncate">
                          {c.category || "Personal"}
                        </p>
                      </div>
                    </button>
                  ))
              )}
            </div>
          </div>
        </div>
      )}

      {showRecentActionsDialog && (
        <div
          className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-[60]"
          onClick={() => setShowRecentActionsDialog(false)}
        >
          <div
            className="bg-[#111116] border border-[#2a2a38] rounded-3xl w-full max-w-lg relative shadow-2xl flex flex-col max-h-[80vh] animate-fade-in animate-duration-205"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex justify-between items-center p-4 border-b border-[#1a1a24]">
              <h2 className="text-white font-semibold flex items-center gap-2">
                <MoreVertical className="w-4 h-4 text-indigo-400" /> Recent
                Actions
              </h2>
              <button
                onClick={() => setShowRecentActionsDialog(false)}
                className="p-1.5 bg-[#1a1a24] hover:bg-[#2a2a38] rounded-lg text-gray-400 hover:text-white transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="flex-1 overflow-y-auto p-4 space-y-3">
              {loadingRecentActions ? (
                <div className="flex items-center justify-center py-10">
                  <Loader2 className="w-6 h-6 animate-spin text-indigo-500" />
                </div>
              ) : recentActions.length === 0 ? (
                <div className="text-center p-6 text-gray-500 text-xs">
                  No recent actions found or lacking permissions.
                </div>
              ) : (
                recentActions.map((action) => (
                  <div
                    key={action.id}
                    className="bg-[#1a1a24] p-3 rounded-2xl border border-[#2a2a38] space-y-2 text-xs"
                  >
                    <div className="flex justify-between text-[10px] text-gray-400">
                      <span>User ID: {action.userId}</span>
                      <span>{new Date(action.date).toLocaleString()}</span>
                    </div>
                    <div className="font-semibold text-indigo-300 uppercase text-[10px] tracking-wider bg-indigo-500/10 w-max px-2 py-0.5 rounded">
                      {action.actionType
                        ?.replace("MessageAction", "")
                        ?.replace("ChannelAdminLogEventAction", "")}
                    </div>
                    {action.action?.deletedMessage && (
                      <div className="bg-red-500/10 text-red-200 p-2 rounded-lg border border-red-500/20 whitespace-pre-wrap">
                        <div className="flex justify-between items-start mb-1">
                          <strong className="text-red-400">
                            Deleted Message:
                          </strong>
                          <button
                            onClick={async () => {
                              try {
                                await fetch("/api/telegram/sendMessage", {
                                  method: "POST",
                                  headers: {
                                    "Content-Type": "application/json",
                                  },
                                  body: JSON.stringify({
                                    chatId,
                                    message: action.action.deletedMessage,
                                  }),
                                });
                                alert("Message restored (re-sent).");
                              } catch (e) {
                                console.error(e);
                              }
                            }}
                            className="px-2 py-1 bg-red-500/20 hover:bg-red-500/40 text-red-300 rounded text-[10px] cursor-pointer"
                          >
                            Restore
                          </button>
                        </div>
                        {action.action.deletedMessage}
                      </div>
                    )}
                    {action.action?.oldMessage && action.action?.newMessage && (
                      <div className="bg-blue-500/10 text-blue-200 p-2 rounded-lg border border-blue-500/20 space-y-2 whitespace-pre-wrap">
                        <div>
                          <div className="flex justify-between items-start">
                            <strong className="text-blue-400 block">
                              From:
                            </strong>
                            <button
                              onClick={async () => {
                                try {
                                  await fetch("/api/telegram/sendMessage", {
                                    method: "POST",
                                    headers: {
                                      "Content-Type": "application/json",
                                    },
                                    body: JSON.stringify({
                                      chatId,
                                      message: action.action.oldMessage,
                                    }),
                                  });
                                  alert(
                                    "Old message text restored as a new message.",
                                  );
                                } catch (e) {
                                  console.error(e);
                                }
                              }}
                              className="px-2 py-1 bg-blue-500/20 hover:bg-blue-500/40 text-blue-300 rounded text-[10px] cursor-pointer"
                            >
                              Restore To This
                            </button>
                          </div>
                          {action.action.oldMessage}
                        </div>
                        <div className="border-t border-blue-500/20 pt-1">
                          <strong className="text-green-400 block">To:</strong>
                          <span className="text-green-200">
                            {action.action.newMessage}
                          </span>
                        </div>
                      </div>
                    )}
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}

      {isSelectMode && (
        <div className="absolute bottom-4 left-4 right-4 bg-[#111116] border border-indigo-500/30 p-4 rounded-2xl flex items-center justify-between shadow-2xl z-40 animate-fade-in">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 bg-indigo-500 rounded-full animate-pulse" />
            <p className="text-xs font-semibold text-gray-200">
              Selected{" "}
              <span className="text-indigo-400 font-mono font-bold">
                {selectedMessageIds.length}
              </span>{" "}
              messages
            </p>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => {
                setIsSelectMode(false);
                setSelectedMessageIds([]);
              }}
              className="px-3 py-1.5 bg-[#1c1c28] hover:bg-[#242435] border border-[#2c2c3e] text-xs font-semibold rounded-xl text-gray-400 hover:text-white transition-all cursor-pointer"
            >
              Cancel
            </button>
            <button
              onClick={() => {
                setShowSelectDeleteConfirm(true);
              }}
              disabled={selectedMessageIds.length === 0}
              className="px-4 py-1.5 bg-red-600/20 hover:bg-red-500/30 text-red-400 disabled:opacity-50 disabled:cursor-not-allowed border border-red-500/20 text-xs font-bold rounded-xl transition-all cursor-pointer"
            >
              Delete
            </button>
            <button
              onClick={async () => {
                setLoadingForward(true);
                setShowForwardDialog(true);
                try {
                  const [dialogsRes, contactsRes] = await Promise.all([
                    fetch("/api/telegram/dialogs"),
                    fetch("/api/telegram/contacts"),
                  ]);
                  const dialogsData = await dialogsRes.json();
                  const contactsData = await contactsRes.json();

                  let merged = [];
                  if (dialogsData && Array.isArray(dialogsData)) {
                    merged = [...dialogsData];
                  }
                  if (contactsData && Array.isArray(contactsData)) {
                    // avoid duplicates by ID
                    const existingIds = new Set(merged.map((d) => d.id));
                    const newContacts = contactsData.filter(
                      (c) => !existingIds.has(c.id),
                    );
                    merged = [...merged, ...newContacts];
                  }
                  setChatList(merged);
                } catch (err) {
                  console.error(err);
                } finally {
                  setLoadingForward(false);
                }
              }}
              disabled={selectedMessageIds.length === 0}
              className="px-4 py-1.5 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed text-xs font-bold rounded-xl text-white shadow-lg shadow-indigo-600/15 transition-all cursor-pointer"
            >
              Forward Selected
            </button>
          </div>
        </div>
      )}
      {/* Background pattern */}
      <div className="absolute inset-0 bg-black/20 pointer-events-none" />

      {/* Header */}
      <div className="border-b border-[#0e1621] bg-[#17212b]/95 backdrop-blur-md flex flex-col z-40 sticky top-0 shadow-sm chat-header" data-glass="true">
        {/* iOS Status Bar Safe Area Spacer */}
        <div className="w-full shrink-0 h-[env(safe-area-inset-top,0px)] bg-transparent" />
        <div className="h-16 flex items-center justify-between px-4 md:px-6">
          <div className="flex items-center gap-2 md:gap-3">
            {onBack && (
              <button
                onClick={onBack}
                className="md:hidden p-2 -ml-2 text-gray-400 hover:text-gray-200 transition-colors"
              >
                <ArrowLeft className="w-6 h-6" />
              </button>
            )}
            <div
              className="flex items-center gap-3 cursor-pointer hover:opacity-80 transition-opacity"
              onClick={() => setShowProfileDialog(true)}
            >
              <div className={`relative rounded-full shrink-0 ${
                (chatId === "me" || (myUserId && String(chatId) === String(myUserId)) || (typeof chatId === "string" && isUserNexusgramClient(chatId)))
                  ? "p-[2px] bg-gradient-to-tr from-blue-500 via-indigo-500 to-purple-600 shadow-[0_0_10px_rgba(124,58,237,0.45)] ring-1 ring-purple-400/50"
                  : ""
              }`}>
                <div className="w-10 h-10 rounded-full bg-gray-600 flex items-center justify-center shrink-0 border border-[#2a2a38] text-gray-300 relative overflow-hidden">
                  <div className="absolute inset-0 flex items-center justify-center bg-gray-500">
                    <svg
                      viewBox="0 0 100 100"
                      className="w-full h-full text-gray-700 fill-current"
                    >
                      <circle cx="50" cy="35" r="20" />
                      <path
                        d="M 20 100 A 30 30 0 0 1 80 100"
                        strokeWidth="10"
                        stroke="currentColor"
                        fill="none"
                      />
                    </svg>
                  </div>
                  {chatId && chatId !== "undefined" && chatId !== "null" && chatId !== "ai-assistant" && (
                    <img
                      src={
                        JSON.parse(
                          localStorage.getItem(`local_profile_${chatId}`) || "{}"
                        )?.avatarUrl || `/api/telegram/avatar/${chatId}`
                      }
                      alt={chatName}
                      className="w-full h-full object-cover absolute inset-0"
                      onError={(e) => {
                        e.currentTarget.style.display = "none";
                      }}
                    />
                  )}
                </div>
                {/* Online Indicator Badge on Avatar */}
                {isOnline && (
                  <span 
                    className="absolute bottom-0 right-0 w-3.5 h-3.5 bg-emerald-500 rounded-full border-2 border-[#17212b] shadow-[0_0_8px_rgba(16,185,129,0.7)] z-20 ring-1 ring-emerald-400/50" 
                    title="Online"
                  />
                )}
              </div>
              <div className="flex flex-col">
                <div className="flex items-center gap-1.5">
                  <h1 className={`font-display font-medium truncate ${isSecretChatActive ? 'text-emerald-400 font-bold' : 'text-gray-100'}`}>
                    {JSON.parse(
                      localStorage.getItem(`local_profile_${chatId}`) || "{}",
                    )?.name || chatName}
                  </h1>
                  {isSecretChatActive && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setShowSecretKeyModal(true);
                        triggerHaptic("light");
                      }}
                      className="p-1 rounded-full bg-emerald-500/20 text-emerald-400 hover:bg-emerald-500/30 transition-all cursor-pointer inline-flex items-center gap-1 shrink-0"
                      title="Секретный чат защищён сквозным шифрованием (E2EE). Нажмите для ключа шифрования"
                    >
                      <Lock className="w-3.5 h-3.5 text-emerald-400 animate-pulse" />
                    </button>
                  )}
                  {chatTypeData?.verified && (
                    <CheckCircle2 className="w-4 h-4 text-blue-400 fill-blue-400 shrink-0 inline ml-0.5" />
                  )}
                  {chatTypeData?.premium && (
                    <Star className="w-4 h-4 text-purple-400 fill-purple-400 shrink-0 inline ml-0.5" />
                  )}
                  {chatTypeData?.fake && (
                    <span className="px-1 py-0.2 text-[9px] font-bold bg-red-500/20 text-red-400 border border-red-500/40 rounded shrink-0 inline ml-0.5">FAKE</span>
                  )}
                  {chatTypeData?.scam && (
                    <span className="px-1 py-0.2 text-[9px] font-bold bg-red-500/20 text-red-400 border border-red-500/40 rounded shrink-0 inline ml-0.5">SCAM</span>
                  )}
                  {/* Client detection badge in chat header */}
                  {(() => {
                    const peerClient = detectUserClient({
                      id: chatId,
                      username: (chatTypeData as any)?.username,
                      firstName: chatName,
                      about: (chatTypeData as any)?.about,
                    });
                    if (peerClient.type === "ayugram") {
                      return (
                        <span
                          className="px-1.5 py-0.2 rounded-full text-[10px] font-bold bg-purple-600/25 border border-purple-400/40 text-purple-300 shrink-0 inline-flex items-center gap-1 shadow-sm ml-0.5"
                          title="Использует клиент AyuGram"
                        >
                          <span>🔮</span>
                          <span>AyuGram</span>
                        </span>
                      );
                    }
                    if (peerClient.type === "nexusgram") {
                      return (
                        <span
                          className="px-1.5 py-0.2 rounded-full text-[10px] font-bold bg-cyan-600/25 border border-cyan-400/40 text-cyan-300 shrink-0 inline-flex items-center gap-1 shadow-sm ml-0.5"
                          title="Использует клиент Nexusgram"
                        >
                          <span>⚡</span>
                          <span>Nexusgram</span>
                        </span>
                      );
                    }
                    return null;
                  })()}
                </div>
                <div className="flex items-center gap-2 mt-0.5">
                  {livePeerKeystroke && livePeerKeystroke.text ? (
                    <div className="flex items-center gap-1.5 text-xs text-cyan-400 font-medium animate-fade-in">
                      <Eye className="w-3.5 h-3.5 text-cyan-400 animate-pulse shrink-0" />
                      <span className="truncate max-w-[190px] sm:max-w-[320px]">
                        печатает: «<span className="text-white font-mono">{livePeerKeystroke.text}</span>»
                      </span>
                      <span className="w-1 h-3 bg-cyan-400 animate-pulse inline-block shrink-0" />
                    </div>
                  ) : (chatTypeData?.isChannel || chatTypeData?.isGroup || chatTypeData?.isBroadcast || chatTypeData?.isMegagroup) && chatTypeData?.participantCount ? (
                    <span className="text-xs text-gray-400">
                      {chatTypeData.participantCount.toLocaleString()} {chatTypeData.isBroadcast ? 'subscribers' : 'members'}
                    </span>
                  ) : statusStr ? (
                    <span
                      className={`text-xs flex items-center gap-1.5 ${isOnline ? "text-emerald-400 font-medium" : "text-gray-400"}`}
                    >
                      {isOnline && (
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse inline-block shadow-[0_0_6px_rgba(52,211,153,0.8)]" />
                      )}
                      <span>{isOnline ? (statusStr.toLowerCase() === "online" ? (strings.online || "в сети") : statusStr) : statusStr}</span>
                    </span>
                  ) : (
                    <span className="text-xs text-gray-400 font-mono">
                      <Phone className="w-3 h-3 inline mr-1 opacity-70" />
                      {chatId}
                    </span>
                  )}
                </div>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-1.5 md:gap-2">
            {chatId && chatId !== "ai-assistant" && chatId !== "ai" && (
              <button
                onClick={() => {
                  setSelectedCalendarDate(new Date().toLocaleDateString("ru-RU"));
                  setShowCalendarModal(true);
                }}
                className="text-gray-400 hover:text-indigo-400 transition-all p-2 rounded-full hover:bg-[#1a1a24] cursor-pointer hover:scale-105 active:scale-95"
                title="Событийный календарь"
              >
                <Calendar className="w-5 h-5" />
              </button>
            )}
            {isForum && activeTopicId !== null && (
              <button
                onClick={() => setActiveTopicId(null)}
                className="px-2.5 py-1.5 bg-indigo-600/10 hover:bg-indigo-600/20 text-indigo-400 text-xs font-semibold rounded-lg transition-colors cursor-pointer"
                title="Back to Topics"
              >
                Topics List
              </button>
            )}

            <div className="relative">
              <button
                onClick={() => setShowMenu(!showMenu)}
                className="text-gray-400 hover:text-gray-200 transition-colors p-2 rounded-full hover:bg-[#1a1a24] cursor-pointer"
              >
                <MoreVertical className="w-5 h-5" />
              </button>
              {showMenu && (
                <>
                  <div
                    className="fixed inset-0 z-30"
                    onClick={() => setShowMenu(false)}
                  />
                  <div className="absolute right-0 mt-2 w-56 bg-[#111116] border border-[#2a2a38] rounded-2xl shadow-2xl py-1.5 z-40 animate-fade-in text-xs font-medium overflow-hidden">
                    {/* Nexus Secret Chat button - ONLY for Nexusgram users */}
                    {(() => {
                      const peerIsNexus = isUserNexusgramClient(chatId) || 
                        Boolean(nexusClients.includes(String(chatId))) || 
                        Boolean((chatTypeData as any)?.isNexusClient) ||
                        detectUserClient({
                          id: chatId,
                          username: (chatTypeData as any)?.username,
                          firstName: chatName,
                          about: (chatTypeData as any)?.about,
                        }).type === "nexusgram";

                      if (!peerIsNexus) return null;

                      if (!isSecretChatActive) {
                        return (
                          <button
                            onClick={async () => {
                              setShowMenu(false);
                              const newKey = Array.from({ length: 64 }, () => Math.floor(Math.random() * 16).toString(16)).join("");
                              setIsSecretChatActive(true);
                              setIsSecretChatTerminated(false);
                              setSecretChatKey(newKey);
                              setSecretMessages([]);
                              const currentChatId = String(chatId);
                              localStorage.setItem(`nexus_secret_chat_active_${currentChatId}`, "true");
                              localStorage.setItem(`nexus_secret_chat_term_${currentChatId}`, "false");
                              localStorage.setItem(`nexus_secret_chat_key_${currentChatId}`, newKey);
                              localStorage.setItem(`nexus_secret_messages_${currentChatId}`, JSON.stringify([]));

                              try {
                                await fetch("/api/telegram/secret-chat/request", {
                                  method: "POST",
                                  headers: { "Content-Type": "application/json" },
                                  body: JSON.stringify({ receiverId: currentChatId, secretKey: newKey }),
                                });
                                if (socketRef.current) {
                                  socketRef.current.emit("nexus_secret_chat_request", {
                                    receiverId: currentChatId,
                                    secretKey: newKey,
                                  });
                                }
                              } catch (e) {
                                console.error(e);
                              }
                              triggerHaptic("success");
                            }}
                            className="w-full text-left px-4 py-2.5 bg-emerald-950/40 hover:bg-emerald-900/50 text-emerald-300 font-semibold transition-colors flex items-center gap-2 cursor-pointer border-b border-emerald-500/20"
                          >
                            <Lock className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                            <span>Начать секретный чат</span>
                          </button>
                        );
                      }

                      return (
                        <>
                          <button
                            onClick={() => {
                              setShowMenu(false);
                              setShowSecretKeyModal(true);
                              triggerHaptic("light");
                            }}
                            className="w-full text-left px-4 py-2 hover:bg-emerald-950/30 text-emerald-400 font-semibold transition-colors flex items-center gap-2 cursor-pointer border-b border-[#2a2a38]/40"
                          >
                            <Key className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                            <span>Ключ шифрования</span>
                          </button>
                          <button
                            onClick={async () => {
                              setShowMenu(false);
                              const currentChatId = String(chatId);
                              // End secret chat: clears locally immediately!
                              setIsSecretChatActive(false);
                              setIsSecretChatTerminated(false);
                              setSecretMessages([]);
                              localStorage.removeItem(`nexus_secret_chat_active_${currentChatId}`);
                              localStorage.removeItem(`nexus_secret_chat_term_${currentChatId}`);
                              localStorage.removeItem(`nexus_secret_chat_key_${currentChatId}`);
                              localStorage.removeItem(`nexus_secret_messages_${currentChatId}`);

                              try {
                                await fetch("/api/telegram/secret-chat/end", {
                                  method: "POST",
                                  headers: { "Content-Type": "application/json" },
                                  body: JSON.stringify({ receiverId: currentChatId }),
                                });
                                if (socketRef.current) {
                                  socketRef.current.emit("nexus_secret_chat_end", {
                                    receiverId: currentChatId,
                                  });
                                }
                              } catch (e) {
                                console.error(e);
                              }
                              triggerHaptic("heavy");
                            }}
                            className="w-full text-left px-4 py-2.5 bg-red-950/30 hover:bg-red-900/40 text-red-400 font-semibold transition-colors flex items-center gap-2 cursor-pointer border-b border-red-500/20"
                          >
                            <Trash2 className="w-3.5 h-3.5 text-red-400 shrink-0" />
                            <span>Завершить секретный чат</span>
                          </button>
                        </>
                      );
                    })()}

                    {/* Forensic AyuGram Scanner Button */}
                    <button
                      onClick={async () => {
                        setShowMenu(false);
                        setIsScanningAyuGram(true);
                        setShowAyuGramResultModal(true);
                        try {
                          const res = await scanForAyuGram(
                            chatId,
                            (chatTypeData as any)?.username,
                            chatName,
                            (chatTypeData as any)?.about
                          );
                          setAyuGramScanResult(res);
                        } catch (err) {
                          console.error(err);
                        } finally {
                          setIsScanningAyuGram(false);
                        }
                      }}
                      className="w-full text-left px-4 py-2 hover:bg-purple-950/30 text-purple-300 transition-colors flex items-center gap-2 cursor-pointer border-b border-[#2a2a38]/40"
                    >
                      <span>🔮</span>
                      <span>Проверить на AyuGram</span>
                    </button>

                    <button
                      onClick={() => {
                        setIsSearchingInChat(true);
                        setShowMenu(false);
                      }}
                      className="w-full text-left px-4 py-2 hover:bg-[#1a1a24] text-gray-300 transition-colors flex items-center gap-2 cursor-pointer"
                    >
                      <span>🔍</span> Code Word Search
                    </button>
                    <button
                      onClick={() => {
                        const state = JSON.parse(
                          localStorage.getItem(`local_profile_${chatId}`) ||
                            "{}",
                        );
                        const updated = { ...state, muted: !state.muted };
                        localStorage.setItem(
                          `local_profile_${chatId}`,
                          JSON.stringify(updated),
                        );
                        window.dispatchEvent(
                          new CustomEvent("dialog-update", {
                            detail: { chatId },
                          }),
                        );
                        setShowMenu(false);
                      }}
                      className="w-full text-left px-4 py-2 hover:bg-[#1a1a24] text-gray-300 transition-colors flex items-center gap-2 cursor-pointer"
                    >
                      <span>🔔</span>{" "}
                      {JSON.parse(
                        localStorage.getItem(`local_profile_${chatId}`) || "{}",
                      ).muted
                        ? "Unmute dialogue"
                        : "Mute dialogue"}
                    </button>
                    {chatId !== "ai-assistant" && chatId !== "ai" && (
                      <div className="border-t border-[#2a2a38]/40 py-1 px-2">
                        {!showMainMenuTranslationLanguages ? (
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              setShowMainMenuTranslationLanguages(true);
                            }}
                            className="w-full text-left px-3 py-2 hover:bg-[#1a1a24] text-xs font-semibold text-indigo-400 hover:text-indigo-300 flex items-center justify-between cursor-pointer rounded-xl transition-all font-sans"
                          >
                            <span className="flex items-center gap-2">🌐 Перевести чат</span>
                            <span className="text-[10px] text-gray-500">{translationLanguage ? `(${translationLanguage.toUpperCase()})` : "Выкл"}</span>
                          </button>
                        ) : (
                          <div className="p-2 space-y-1.5 bg-black/30 rounded-xl m-1">
                            <p className="text-[10px] text-gray-400 mb-1 flex items-center justify-between font-semibold">
                              <span>🌐 Выберите язык:</span>
                              <button 
                                onClick={(e) => { e.stopPropagation(); setShowMainMenuTranslationLanguages(false); }}
                                className="text-[9px] text-gray-500 hover:text-white cursor-pointer font-sans"
                              >
                                Назад
                              </button>
                            </p>
                            <div className="grid grid-cols-2 gap-1 font-mono text-[9px] text-center select-none">
                              {[
                                { key: "ru", name: "Русский" },
                                { key: "en", name: "English" },
                                { key: "es", name: "Español" },
                                { key: "zh", name: "中文" },
                                { key: "de", name: "Deutsch" },
                              ].map((lang) => (
                                <button
                                  key={lang.key}
                                  onClick={() => {
                                    setTranslationLanguage(lang.key);
                                    setShowMainMenuTranslationLanguages(false);
                                    setShowMenu(false);
                                  }}
                                  className={`px-1.5 py-1 rounded transition-all cursor-pointer ${
                                    translationLanguage === lang.key
                                      ? "bg-indigo-500 text-white font-bold"
                                      : "bg-black/20 text-gray-400 hover:text-white"
                                  }`}
                                >
                                  {lang.name}
                                </button>
                              ))}
                            </div>
                            {translationLanguage && (
                              <button
                                onClick={() => {
                                  setTranslationLanguage(null);
                                  setShowMainMenuTranslationLanguages(false);
                                  setShowMenu(false);
                                }}
                                className="w-full mt-1.5 text-[9px] text-red-400 hover:text-red-300 text-center font-semibold cursor-pointer"
                              >
                                ❌ Сбросить перевод
                              </button>
                            )}
                          </div>
                        )}
                      </div>
                    )}
                    <button
                      onClick={async () => {
                        setShowMenu(false);
                        setShowRecentActionsDialog(true);
                        setLoadingRecentActions(true);
                        try {
                          const res = await fetch(
                            `/api/telegram/chat/${chatId}/adminLog`,
                          );
                          const data = await res.json();
                          if (data.events) {
                            setRecentActions(data.events);
                          } else {
                            setRecentActions([]);
                          }
                        } catch (err) {
                          console.error(err);
                        } finally {
                          setLoadingRecentActions(false);
                        }
                      }}
                      className="w-full text-left px-4 py-2 hover:bg-[#1a1a24] text-gray-300 transition-colors flex items-center gap-2 cursor-pointer border-t border-[#1a1a24]/40"
                    >
                      <span>📜</span> View Recent Actions
                    </button>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>

        {isSearchingInChat && (
          <div className="bg-[#111116] border-t border-[#1a1a24] px-4 py-2 flex items-center justify-between gap-2.5 animate-fade-in">
            <div className="flex items-center gap-2 flex-1">
              <span className="text-gray-400 text-sm shrink-0">🔍</span>
              <input
                type="text"
                placeholder="Search word in this conversation..."
                value={chatSearchQuery}
                onChange={(e) => setChatSearchQuery(e.target.value)}
                className="bg-transparent text-gray-200 border-none outline-none text-sm flex-1 placeholder:text-gray-500"
                autoFocus
              />
            </div>
            <div className="flex items-center gap-1 font-mono">
              {chatSearchMatches.length > 0 && (
                <span className="text-xs text-gray-400 select-none mr-2">
                  {chatCurrentMatchIndex + 1} of {chatSearchMatches.length}
                </span>
              )}
              <button
                onClick={cycleChatSearchNext}
                className="p-1 px-2.5 bg-[#1a1a24] hover:bg-[#2a2a38] text-gray-400 hover:text-white rounded-lg transition-colors cursor-pointer text-xs"
                title="Next Match"
              >
                ◀
              </button>
              <button
                onClick={cycleChatSearchPrev}
                className="p-1 px-2.5 bg-[#1a1a24] hover:bg-[#2a2a38] text-gray-400 hover:text-white rounded-lg transition-colors cursor-pointer text-xs ml-1"
                title="Previous Match"
              >
                ▶
              </button>
              <button
                onClick={() => {
                  setIsSearchingInChat(false);
                  setChatSearchQuery("");
                }}
                className="p-1 px-2 hover:bg-red-500/10 text-gray-400 hover:text-red-400 rounded-lg transition-colors cursor-pointer text-xs ml-1.5 font-bold"
                title="Close Search"
              >
                ✖
              </button>
            </div>
          </div>
        )}

        {isForum && activeTopicId !== null && (
          <div className="bg-indigo-900/20 border-t border-indigo-500/20 px-4 py-1.5 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-indigo-400 animate-pulse"></span>
              <p className="text-xs font-semibold text-indigo-300">
                Viewing Topic:{" "}
                <span className="text-white">
                  {topics.find((t) => t.id === activeTopicId)?.title ||
                    "Topic #" + activeTopicId}
                </span>
              </p>
            </div>
            <button
              onClick={() => setActiveTopicId(null)}
              className="text-[10px] text-indigo-400 hover:text-indigo-200 uppercase font-semibold tracking-wider cursor-pointer transition-colors"
            >
              Exit Thread Topic
            </button>
          </div>
        )}

        {localPinnedMessages.length > 0 && (
          <div
            className="bg-[#111116] border-t border-[#1a1a24] px-4 py-2 flex items-center justify-between cursor-pointer group"
            onClick={cyclePinnedMessage}
          >
            <div className="flex items-center gap-3 overflow-hidden">
              <div className="w-1 bg-blue-500 h-8 rounded-full shrink-0 group-hover:bg-blue-400 transition-colors"></div>
              <div className="flex flex-col min-w-0">
                <span className="text-blue-400 text-[10px] font-bold tracking-wide uppercase">
                  Pinned Message
                </span>
                <span className="text-gray-200 text-sm truncate opacity-90">
                  {getPinnedSnippet(
                    localPinnedMessages[
                      currentPinnedIndex % localPinnedMessages.length
                    ]
                  )}
                </span>
              </div>
            </div>
            <div className="flex items-center gap-2">
              {localPinnedMessages.length > 1 && (
                <div className="text-gray-500 text-xs px-2">
                  {currentPinnedIndex + 1}/{localPinnedMessages.length}
                </div>
              )}
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  handleLocalUnpin(
                    localPinnedMessages[
                      currentPinnedIndex % localPinnedMessages.length
                    ],
                  );
                }}
                className="p-1.5 hover:bg-[#2a2a38] rounded-full text-gray-400 hover:text-white transition-colors"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        )}
        {searchQuery && searchMatches.length > 0 && (
          <div className="bg-[#181824] border-t border-[#2a2a38] px-4 py-2 flex items-center justify-between">
            <div
              className="flex items-center gap-3 overflow-hidden cursor-pointer flex-1"
              onClick={cycleSearchNext}
            >
              <div className="w-1 bg-yellow-500 h-8 rounded-full shrink-0"></div>
              <div className="flex flex-col min-w-0 flex-1">
                <span className="text-yellow-400 text-[10px] font-bold tracking-wide uppercase">
                  Search Results
                </span>
                <span className="text-gray-200 text-sm truncate opacity-90 font-medium">
                  "{searchQuery}"
                </span>
              </div>
            </div>
            <div className="flex items-center gap-1 shrink-0 bg-[#09090b] rounded-lg p-1 border border-[#2a2a38]">
              <button
                onClick={cycleSearchPrev}
                className="p-1 hover:bg-[#2a2a38] rounded-md text-gray-400 hover:text-white transition-colors"
              >
                <ArrowLeft className="w-4 h-4" />
              </button>
              <div className="text-gray-400 text-xs px-1 font-mono">
                {searchMatches.length - currentMatchIndex}/
                {searchMatches.length}
              </div>
              <button
                onClick={cycleSearchNext}
                className="p-1 hover:bg-[#2a2a38] rounded-md text-gray-400 hover:text-white transition-colors"
              >
                <ArrowLeft className="w-4 h-4 rotate-180" />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Chat Wrapper */}
      <div className="relative flex-1 flex flex-col min-h-0">
        {/* Scrubber scroll indicators */}
        <div 
          ref={trackRef}
          onMouseDown={onScrubStart}
          onTouchStart={onScrubStart}
          className={`absolute right-0.5 top-2 bottom-2 w-3 z-40 cursor-ns-resize flex items-center justify-center select-none transition-opacity duration-300 ${
            isScrubbing ? 'opacity-100' : 'opacity-0 hover:opacity-100'
          }`}
        >
          <div className={`w-0.5 h-full rounded-full transition-colors ${isScrubbing ? 'bg-indigo-500/20' : 'bg-white/5'}`}>
            <div 
              ref={thumbRef}
              className={`absolute w-1 rounded-full cursor-ns-resize shadow-sm transition-colors ${
                isScrubbing ? 'bg-indigo-500 scale-110' : 'bg-gray-600 hover:bg-indigo-400'
              }`}
              style={{ 
                height: "15%", 
                top: "0%",
                left: '1px'
              }}
            />
          </div>
        </div>

        {/* Chat Area */}
        <div 
          ref={chatAreaRef}
          className="flex-1 overflow-y-auto px-2 sm:px-4 md:px-6 pt-2 pb-1 z-0 gpu-accelerated scrollbar-thin scrollbar-thumb-zinc-800"
          style={{ overflowAnchor: 'auto', WebkitOverflowScrolling: 'touch' }}
          onScroll={(e) => {
            handleScroll();
            const el = e.currentTarget;
            if (el.scrollHeight - el.scrollTop <= el.clientHeight + 50) {
              if (firstUnreadMsgId) {
                setFirstUnreadMsgId(null);
                fetch(`/api/telegram/messages/${chatId}/read`, { method: "POST" }).catch(() => {});
              }
              if (unreadIncomingCount > 0) {
                setUnreadIncomingCount(0);
                fetch(`/api/telegram/messages/${chatId}/read`, { method: "POST" }).catch(() => {});
              }
            }
          }}
        >
          <div className="w-full max-w-5xl lg:max-w-none mx-auto flex flex-col min-h-full justify-start pb-1">
          {loadingMore && (
            <div className="py-2 px-3 flex items-center justify-center gap-2 text-xs font-medium text-[#2481cc] bg-[#17212b]/90 backdrop-blur-md rounded-xl mx-auto my-2 shadow border border-[#2481cc]/25">
              <Loader2 className="w-3.5 h-3.5 animate-spin text-[#2481cc]" />
              <span>Загрузка сообщений...</span>
            </div>
          )}
          <div className="flex flex-col">
            {isForum && activeTopicId === null ? (
              <div className="flex-1 flex flex-col justify-start py-6 max-w-3xl mx-auto z-0 space-y-6 w-full animate-fade-in mb-8">
                <div className="flex flex-col gap-1.5 border-b border-[#22222d] pb-4">
                  <h2 className="text-base font-semibold text-gray-200 flex items-center gap-2">
                    <span>💬</span> Discussion Topics & Branches
                  </h2>
                  <p className="text-xs text-gray-400">
                    This group structure has multiple branches. Choose one
                    thread category to active view:
                  </p>
                </div>

                {topics.length === 0 ? (
                  <div className="p-8 text-center bg-[#111116] border border-[#22222d] rounded-2xl text-gray-400 text-xs">
                    No active discussion threads found here.
                  </div>
                ) : (
                  <div className="grid grid-cols-1 gap-3">
                    {topics.map((topic) => (
                      <button
                        key={topic.id}
                        onClick={() => setActiveTopicId(topic.id)}
                        className="w-full text-left p-4 bg-[#111116] hover:bg-[#1a1a24] border border-[#22222d] hover:border-indigo-500/40 rounded-2xl shadow-sm hover:shadow-indigo-500/5 transition-all flex items-center justify-between group cursor-pointer"
                      >
                        <div className="flex items-center gap-4">
                          <div className="w-9 h-9 rounded-xl bg-indigo-500/10 flex items-center justify-center font-bold text-indigo-400 text-base uppercase group-hover:scale-105 transition-transform select-none">
                            #
                          </div>
                          <div className="flex flex-col gap-0.5">
                            <p className="text-gray-200 font-medium text-sm group-hover:text-white transition-colors">
                              {topic.title}
                            </p>
                            <p className="text-[9px] text-gray-500 font-mono">
                              Topic ID: {topic.id}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="text-[11px] px-2.5 py-1 bg-[#1a1a24] text-indigo-400 font-bold rounded-lg group-hover:bg-indigo-600 group-hover:text-white transition-colors uppercase tracking-wider">
                            Enter Thread
                          </span>
                        </div>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            ) : initialLoading ? (
              <div className="flex items-center justify-center my-10">
                <Loader2 className="w-8 h-8 animate-spin text-blue-500/50" />
              </div>
            ) : (isSecretChatActive ? secretMessages.length === 0 : messages.length === 0) ? (
              <div className="flex flex-col items-center justify-center py-12 px-4 text-center animate-fade-in">
                {isSecretChatActive ? (
                  <div className="mx-auto max-w-md p-6 rounded-3xl bg-gradient-to-b from-[#14261e] to-[#0e1713] border border-emerald-500/40 shadow-2xl backdrop-blur-md text-center space-y-3.5">
                    <div className="w-14 h-14 mx-auto rounded-2xl bg-emerald-500/20 border border-emerald-400/40 flex items-center justify-center text-emerald-400 shadow-lg">
                      <Lock className="w-7 h-7 animate-pulse" />
                    </div>
                    <div>
                      <h3 className="text-base font-bold text-white flex items-center justify-center gap-2">
                        <span>Секретный чат Nexus начат!</span>
                      </h3>
                      <p className="text-xs text-emerald-300/90 leading-relaxed mt-1">
                        Сообщения передаются в шифрованном виде напрямую через сервер Nexus в обход серверов Telegram.
                      </p>
                    </div>

                    <div className="p-3 rounded-2xl bg-black/50 border border-emerald-500/20 text-xs text-gray-300 text-left space-y-1.5 font-sans">
                      <p className="flex items-center gap-2 text-emerald-400 font-semibold">
                        <Check className="w-4 h-4" /> Сквозное E2EE-шифрование с индивидуальным сессионным ключом
                      </p>
                      <p className="flex items-center gap-2 text-emerald-400 font-semibold">
                        <Check className="w-4 h-4" /> Не оставляет следов на серверах Telegram
                      </p>
                      <p className="flex items-center gap-2 text-emerald-400 font-semibold">
                        <Check className="w-4 h-4" /> Доступно только пользователям с клиентом Nexusgram
                      </p>
                    </div>

                    {isSecretChatTerminated ? (
                      <div className="p-2.5 rounded-xl bg-red-950/50 border border-red-500/40 text-red-300 text-xs font-semibold">
                        ⚠️ Чат завершён. Новые сообщения не доставляются собеседнику.
                      </div>
                    ) : !isOnline ? (
                      <div className="p-2.5 rounded-xl bg-amber-950/40 border border-amber-500/30 text-amber-300 text-xs">
                        ⏳ Собеседник сейчас не в сети. Дождитесь его онлайна для живой переписки.
                      </div>
                    ) : (
                      <div className="p-2 rounded-xl bg-emerald-950/30 border border-emerald-500/20 text-emerald-300 text-xs flex items-center justify-center gap-1.5">
                        <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping inline-block" />
                        <span>Собеседник в сети — можно отправлять сообщения</span>
                      </div>
                    )}

                    <div className="pt-2 flex items-center justify-center gap-2">
                      <button
                        onClick={() => setShowSecretKeyModal(true)}
                        className="px-4 py-2 rounded-xl bg-emerald-600/30 hover:bg-emerald-600/50 border border-emerald-400/50 text-emerald-200 text-xs font-semibold flex items-center gap-2 transition-all cursor-pointer shadow-sm"
                      >
                        <Key className="w-4 h-4" />
                        <span>Показать ключ шифрования</span>
                      </button>
                    </div>
                  </div>
                ) : (
                  <>
                    <div className="w-14 h-14 rounded-full bg-indigo-500/10 flex items-center justify-center text-indigo-400 mb-4 border border-indigo-500/20">
                      <span className="text-xl">✨</span>
                    </div>
                    <h3 className="text-gray-200 text-xs font-semibold mb-1">
                      No messages here yet
                    </h3>
                    <p className="text-[11px] text-gray-500 max-w-xs leading-relaxed">
                      Send a greeting message to start your conversation with this
                      peer.
                    </p>
                  </>
                )}
              </div>
            ) : (
              <>
                {isSecretChatActive && (
                  <div className="mx-auto max-w-md my-3 p-3.5 rounded-2xl bg-gradient-to-r from-emerald-950/40 via-[#111c16] to-emerald-950/40 border border-emerald-500/30 shadow-md backdrop-blur-md text-center flex items-center justify-between gap-3 text-xs">
                    <div className="flex items-center gap-2.5">
                      <div className="p-2 rounded-xl bg-emerald-500/20 text-emerald-400">
                        <Lock className="w-4 h-4 animate-pulse" />
                      </div>
                      <div className="text-left">
                        <div className="font-bold text-emerald-300 flex items-center gap-1">
                          <span>Секретный чат Nexus (E2EE)</span>
                        </div>
                        <span className="text-[10px] text-gray-400 block">
                          {isSecretChatTerminated ? "⚠️ Чат завершён" : isOnline ? "🟢 Собеседник в сети" : "⏳ Собеседник не в сети"}
                        </span>
                      </div>
                    </div>
                    <button
                      onClick={() => setShowSecretKeyModal(true)}
                      className="px-3 py-1.5 rounded-lg bg-emerald-600/20 hover:bg-emerald-600/30 border border-emerald-400/40 text-emerald-300 text-[11px] font-semibold flex items-center gap-1.5 transition-colors cursor-pointer shrink-0"
                    >
                      <Key className="w-3.5 h-3.5" />
                      <span>Ключ</span>
                    </button>
                  </div>
                )}
                {(() => {
                  const activeList = isSecretChatActive ? secretMessages : messages;
                  const filtered = isForum && activeTopicId !== null
                    ? activeList.filter(
                        (m) =>
                          String(m.replyToMsgId) === String(activeTopicId) ||
                          String(m.id) === String(activeTopicId),
                      )
                    : activeList;
                  
                const grouped: any[] = [];
                for(let m of filtered) {
                  const last = grouped.length > 0 ? grouped[grouped.length - 1] : null;
                  if(last && (m.groupedId || m.__groupedTempId) && (last.groupedId === m.groupedId || last.__groupedTempId === m.__groupedTempId) && !!m.out === !!last.out) {
                    last.groupedItems.push(m);
                    if (!last.text && m.text) last.text = m.text;
                  } else {
                    grouped.push({ ...m, groupedItems: [m] });
                  }
                }
                return grouped;
              })().map((msg, idx, arr) => {
                let showDateSeparator = false;
                const msgDate = new Date(msg.date);
                const dateString = msgDate.toLocaleDateString("ru-RU", {
                  day: "numeric",
                  month: "long",
                  year: "numeric"
                });

                if (idx === 0) {
                  showDateSeparator = true;
                } else {
                  const prevMsg = arr[idx - 1];
                  const prevDateStr = new Date(prevMsg.date).toLocaleDateString("ru-RU", {
                    day: "numeric",
                    month: "long",
                    year: "numeric"
                  });
                  if (dateString !== prevDateStr) {
                    showDateSeparator = true;
                  }
                }

                return (
                  <div key={msg.id} id={`message-${msg.id}`} className="w-full">
                    {showDateSeparator && (
                      <div className="flex items-center justify-center my-6 opacity-90 animate-fade-in select-none">
                        <button
                          onClick={() => {
                            setSelectedCalendarDate(dateString);
                            setShowCalendarModal(true);
                          }}
                          className="bg-[#181824]/90 hover:bg-[#1e1e2d] border border-[#2d2d3d] active:scale-95 transition-all text-gray-300 font-mono text-[10px] uppercase tracking-wider font-bold px-4 py-2 rounded-full shadow-lg flex items-center gap-2 cursor-pointer hover:border-indigo-500/50 hover:text-indigo-300"
                          title="Открыть календарь медиа"
                        >
                          <span>📅</span> {dateString}
                        </button>
                      </div>
                    )}
                    {firstUnreadMsgId === msg.id.toString() && (
                    <div className="flex items-center gap-4 py-4 w-full max-w-sm mx-auto animate-fade-in opacity-80">
                      <div className="flex-1 h-[1px] bg-[#3a3a4c]" />
                      <span className="text-[11px] uppercase tracking-widest font-semibold text-gray-400">Unread Messages</span>
                      <div className="flex-1 h-[1px] bg-[#3a3a4c]" />
                    </div>
                  )}
                  <MessageItem
                    message={{
                    id: msg.id.toString(),
                    text: msg.text || "",
                    role: msg.out ? "user" : "model",
                    timestamp: new Date(msg.date),
                    media: msg.media ? true : false,
                    chatId: chatId,
                    mediaType: msg.mediaType,
                    mimeType: msg.mimeType,
                    reactions: msg.reactions,
                    edited: msg.edited,
                    replyToMsgId: msg.replyToMsgId,
                    read: msg.read,
                    senderId: msg.senderId || msg.senderName,
                    senderName: msg.senderName,
                    fwdFrom: msg.fwdFrom,
                    replyToMsgText: msg.replyToMsgText,
                    views: msg.views,
                    forwards: msg.forwards,
                    voiceNote: msg.voiceNote,
                    videoNote: msg.videoNote,
                    isSticker: msg.isSticker,
                    isAnimatedSticker: msg.isAnimatedSticker,
                    stickerEmoji: msg.stickerEmoji,
                    replies: msg.repliesCount !== undefined ? { replies: msg.repliesCount } : undefined,
                    groupedItems: msg.groupedItems?.length > 1 ? msg.groupedItems.map((gi: any) => ({
                      id: gi.id.toString(),
                      media: gi.media ? true : false,
                      mediaType: gi.mediaType,
                      mimeType: gi.mimeType,
                    } as any)) : undefined,
                  }}
                  onEdit={handleEdit}
                  onDelete={handleDelete}
                  onReply={handleReply}
                  onPin={handleLocalPin}
                  onSelect={handleToggleSelect}
                  isSelectMode={isSelectMode}
                  isSelected={selectedMessageIds.includes(msg.id.toString())}
                  onSelectUser={onSelectUser}
                  searchQuery={searchQuery || chatSearchQuery}
                  isPinned={localPinnedMessages.includes(msg.id.toString())}
                  isChannel={chatId.toString().startsWith('-100')}
                  isContact={!chatId.toString().startsWith('-') && chatId !== "ai-assistant" && chatId !== "ai"}
                  translationLanguage={translationLanguage}
                />
              </div>
            );
          })}
        </>
      )}

            <div ref={bottomRef} className="h-1" />
          </div>
        </div>
      </div>

      {/* Floating Scroll to Bottom Button */}
      {(showScrollBottom || firstUnreadMsgId || unreadIncomingCount > 0) && (
        <button
          onClick={() => {
            triggerHaptic("light");
            if (chatAreaRef.current) {
              chatAreaRef.current.scrollTo({
                top: chatAreaRef.current.scrollHeight,
                behavior: 'smooth',
              });
            }
            if (firstUnreadMsgId) {
              const el = document.getElementById(`message-${firstUnreadMsgId}`);
              if (el) el.scrollIntoView({ behavior: 'smooth', block: 'center' });
              else bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
            } else {
              bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
            }
          }}
          className="absolute bottom-4 right-6 z-[65] w-12 h-12 bg-[#1a1a24]/95 border border-[#2a2a38] backdrop-blur-md rounded-full shadow-2xl flex items-center justify-center text-gray-200 hover:text-white hover:bg-[#2a2a38] transition-all cursor-pointer animate-fade-in group active:scale-95"
          title="В самый низ"
        >
          <ArrowDown className="w-5 h-5 group-hover:translate-y-0.5 transition-transform" />
          {(firstUnreadMsgId || unreadIncomingCount > 0) && (
            <div className="absolute -top-1 -right-1 min-w-[20px] h-[20px] px-1 bg-blue-500 rounded-full border-2 border-[#111116] flex items-center justify-center text-[10px] font-bold text-white shadow-md">
              {unreadIncomingCount > 0 ? unreadIncomingCount : (messages.filter(m => m.read === false && !m.out).length || '!')}
            </div>
          )}
        </button>
      )}
      
      </div> {/* Close Chat Wrapper */}

      {/* Undo Toasts & Floating Scroll Date Overlay */}
      <div className="fixed top-24 left-1/2 -translate-x-1/2 flex flex-col gap-2.5 items-center z-[90] pointer-events-none">
        {showUndoList.map((undoId) => (
          <div key={undoId.id} className="bg-[#111116]/90 border border-[#2a2a38] backdrop-blur-md px-3 py-1.5 rounded-xl shadow-lg flex items-center gap-3 animate-fade-in pointer-events-auto">
            <span className="text-xs text-gray-300">Message deleted</span>
            <button onClick={() => handleUndoDelete(undoId.id)} className="text-xs font-bold text-indigo-400 hover:text-indigo-300 transition-colors uppercase tracking-wider cursor-pointer">Undo</button>
          </div>
        ))}

        <AnimatePresence>
          {isScrolling && scrollingDate && (
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: -5 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: -3 }}
              transition={{ duration: 0.05 }}
              onClick={() => {
                setSelectedCalendarDate(scrollingDate);
                setShowCalendarModal(true);
              }}
              className="bg-[#111116]/85 text-gray-200 border border-white/10 backdrop-blur-md px-3 py-1.5 rounded-full text-[11px] font-bold shadow-xl flex items-center gap-1.5 font-mono select-none tracking-wide pointer-events-auto cursor-pointer hover:bg-indigo-900/40 hover:border-indigo-500/50 transition-all active:scale-95 text-indigo-300"
              title="Открыть медиа-календарь"
            >
              <span>📅</span> {scrollingDate}
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Input Area: Sits flush at the absolute bottom of the screen */}
      {canSend === false || (isForum && activeTopicId === null) ? (
        <div className="sticky bottom-0 inset-x-0 z-30 px-3 py-2 pb-[max(2px,env(safe-area-inset-bottom,2px))] bg-[#0e1621] text-center text-gray-500 text-xs sm:text-sm border-t border-white/5">
          {isForum && activeTopicId === null
            ? "Please select a discussion topic branch above to start typing."
            : "You cannot send messages to this channel/group."}
        </div>
      ) : (
        <div className="sticky bottom-0 inset-x-0 z-30 px-2 sm:px-3 pt-1 pb-[max(2px,env(safe-area-inset-bottom,2px))] bg-[#0e1621] border-t border-white/5">
          <div className="w-full max-w-5xl lg:max-w-none mx-auto relative group">
            {replyToMsg && (
              <div className="mb-2 p-2 relative flex items-center justify-between bg-[#1a1a24] border-l-2 border-blue-500 rounded-r-xl">
                <div className="flex flex-col min-w-0">
                  <span className="text-[10px] font-semibold text-blue-400 truncate">
                    {replyToMsg.senderName || "Ответ"}
                  </span>
                  <span className="text-xs text-gray-300 truncate">
                    {replyToMsg.text}
                  </span>
                </div>
                <button
                  onClick={() => setReplyToMsg(null)}
                  className="p-1 hover:bg-[#2a2a38] rounded-full text-gray-400 hover:text-white transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            )}
            {files.length > 0 && (
              <div className="mb-2 p-2 relative flex flex-col gap-2 bg-[#1a1a24] border border-[#22222d] rounded-xl max-h-32 overflow-y-auto">
                {files.map((file, idx) => (
                  <div key={idx} className="flex items-center gap-2">
                    <Paperclip className="w-4 h-4 text-gray-400 shrink-0" />
                    <span className="text-sm text-gray-200 py-1 flex-1 truncate">
                      {file.name}
                    </span>
                    <button
                      onClick={() =>
                        setFiles((prev) => prev.filter((_, i) => i !== idx))
                      }
                      className="p-1 hover:bg-[#2a2a38] rounded-full text-red-400 opacity-80 hover:opacity-100 transition-colors shrink-0"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>
            )}

            {filteredCommands.length > 0 && (
              <div className="absolute bottom-full mb-2 left-0 w-full bg-[#1a1a24] border border-[#2a2a38] rounded-2xl overflow-y-auto max-h-48 shadow-2xl z-50">
                {filteredCommands.slice(0, 50).map((cmd, idx) => (
                  <div
                    key={idx}
                    onClick={() => { setInput("/" + cmd.command + " "); }}
                    className="px-4 py-2 hover:bg-[#2a2a38] cursor-pointer border-b border-[#22222d] last:border-0"
                  >
                    <span className="text-blue-400 font-mono text-sm mr-2">/{cmd.command}</span>
                    <span className="text-gray-400 text-sm whitespace-nowrap overflow-hidden text-ellipsis md:inline-block max-w-[200px] align-bottom inline">{cmd.description}</span>
                  </div>
                ))}
              </div>
            )}

            {lastMessageWithReplyMarkup && !input.startsWith("/") && (
              <div className="absolute bottom-full mb-3 left-0 w-full flex flex-col gap-1.5 z-40 px-2 lg:px-0">
                {lastMessageWithReplyMarkup.replyMarkup.rows.map((row: any, rIdx: number) => (
                  <div key={rIdx} className="flex gap-1.5">
                    {row.buttons.map((btn: any, bIdx: number) => (
                      <button
                        key={bIdx}
                        onClick={() => sendText(btn.text)}
                        className="flex-1 bg-[#22222d]/90 hover:bg-[#2a2a38] border border-[#2a2a38] rounded-xl py-2.5 px-2 text-center text-sm font-medium text-blue-300 transition-colors backdrop-blur break-words cursor-pointer"
                      >
                        {btn.text}
                      </button>
                    ))}
                  </div>
                ))}
              </div>
            )}

            <div className="absolute inset-0 bg-blue-500/5 rounded-3xl blur-xl group-hover:bg-blue-500/10 transition-colors pointer-events-none" />

            {isRecording && recordingType === "video" && (
              <div className="absolute bottom-[80px] right-4 w-48 h-48 rounded-full overflow-hidden border-4 border-indigo-500 shadow-2xl animate-fade-in z-50">
                <video
                  ref={previewVideoRef}
                  className={`w-full h-full object-cover ${facingMode === 'user' ? 'scale-x-[-1]' : ''}`}
                  muted
                  playsInline
                />
                
                {/* Volume indicator */}
                <div className="absolute bottom-4 inset-x-0 flex justify-center z-10">
                   <div className="w-20 h-1.5 bg-black/50 rounded-full overflow-hidden">
                     <div className="h-full bg-green-500 transition-all duration-75" style={{ width: `${Math.min(100, volumeLevel * 1.5)}%` }} />
                   </div>
                </div>

                {/* Flip camera */}
                <button
                  type="button"
                  onMouseDown={switchCamera}
                  className="absolute top-4 right-4 p-2 bg-black/40 hover:bg-black/60 rounded-full text-white backdrop-blur shadow z-10 cursor-pointer"
                >
                   <RefreshCw className="w-5 h-5" />
                </button>
              </div>
            )}

            {showAttachmentMenu && (
              <div className="absolute bottom-full mb-2 left-2 w-64 bg-[#181824] border border-[#2a2a38] rounded-2xl shadow-xl flex flex-col overflow-hidden animate-fade-in z-50">
                <button
                  onClick={() => { setShowAttachmentMenu(false); setShowGallerySheet(true); }}
                  className="flex items-center gap-3 p-3 hover:bg-[#20202d] text-left text-sm text-gray-200 transition-colors"
                >
                  <ImageIcon className="w-5 h-5 text-[#2481cc]" /> Галерея как в Telegram (Фото/Видео)
                </button>
                <button
                  onClick={() => { setShowAttachmentMenu(false); fileInputRef.current?.click(); }}
                  className="flex items-center gap-3 p-3 hover:bg-[#20202d] text-left text-sm text-gray-200 transition-colors"
                >
                  <Folder className="w-5 h-5 text-indigo-400" /> Файл с устройства
                </button>
                <button
                  onClick={async () => {
                    setShowAttachmentMenu(false);
                    try {
                      const items = await navigator.clipboard.read();
                      for (const item of items) {
                        for (const type of item.types) {
                          if (type.startsWith('image/')) {
                            const blob = await item.getType(type);
                            setFiles(prev => [...prev, new File([blob], "clipboard_image.png", { type })]);
                          }
                        }
                      }
                    } catch (e) {
                      console.error("Failed to read clipboard");
                    }
                  }}
                  className="flex items-center gap-3 p-3 hover:bg-[#20202d] text-left text-sm text-gray-200 transition-colors"
                >
                  <Paperclip className="w-5 h-5 text-orange-400" /> Из буфера обмена
                </button>
              </div>
            )}
            
            {showStickerPicker && (
              <div className="absolute bottom-full mb-2 left-2 sm:left-12 w-[340px] max-w-[92vw] h-80 bg-[#17212b] border border-[#242f3d] rounded-2xl shadow-2xl flex flex-col overflow-hidden animate-fade-in z-50 backdrop-blur-xl">
                <div className="p-3 border-b border-[#242f3d] bg-[#141b24] flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <span className="text-base">⭐️</span>
                    <h3 className="text-sm font-semibold text-white">Стикеры Telegram API</h3>
                  </div>
                  <button onClick={() => setShowStickerPicker(false)} className="p-1 rounded-full text-gray-400 hover:text-white hover:bg-white/10 transition-colors">
                    <X className="w-4 h-4" />
                  </button>
                </div>

                <div className="px-3 py-2 border-b border-[#242f3d] bg-[#17212b] flex items-center gap-2">
                  <input
                    type="text"
                    value={stickerFilter}
                    onChange={(e) => setStickerFilter(e.target.value)}
                    placeholder="Поиск стикеров по эмодзи..."
                    className="w-full px-2.5 py-1 text-xs bg-[#242f3d]/60 border border-white/5 rounded-lg text-white placeholder-gray-400 outline-none focus:border-[#2481cc]"
                  />
                  {stickerFilter && (
                    <button onClick={() => setStickerFilter("")} className="text-xs text-gray-400 hover:text-white">✕</button>
                  )}
                </div>

                <div className="flex-1 overflow-y-auto p-2.5 grid grid-cols-4 sm:grid-cols-5 gap-2.5 scrollbar-thin">
                  {recentStickers.length === 0 ? (
                    <div className="col-span-full flex flex-col items-center justify-center text-center text-xs text-gray-400 py-12 gap-2">
                      <Loader2 className="w-5 h-5 animate-spin text-[#2481cc]" />
                      <span>Загрузка оригинальных стикеров Telegram...</span>
                    </div>
                  ) : (
                    recentStickers
                      .filter((s) => !stickerFilter || (s.emoji && s.emoji.includes(stickerFilter)))
                      .map((s) => {
                        const stickerUrl = `/api/telegram/doc/${s.id}/${s.accessHash}?fileRef=${s.fileReference}`;
                        return (
                          <button
                            key={s.id}
                            onClick={async () => {
                              setShowStickerPicker(false);
                              const tempId = Date.now().toString();
                              // 1. Instant optimistic sticker rendering in chat
                              setMessages((prev) => [
                                ...prev,
                                {
                                  id: tempId,
                                  text: "",
                                  out: true,
                                  date: Date.now(),
                                  status: "pending",
                                  media: {
                                    type: "photo",
                                    url: stickerUrl,
                                  },
                                } as any,
                              ]);

                              // 2. Download blob & upload to Telegram
                              try {
                                const r = await fetch(stickerUrl);
                                const blob = await r.blob();

                                if (isBlockchainEnabled) {
                                  const base64 = await blobToBase64(blob);
                                  const enc = await createNexusEncryptedBlock({
                                    type: "sticker",
                                    mediaBase64: base64,
                                    mimeType: "image/webp",
                                    fileName: "sticker.webp",
                                  });
                                  saveNexusBlockLocally(enc.block);

                                  const encFile = new File([enc.binaryBytes], "nexus_vault_block.bin", {
                                    type: "application/octet-stream",
                                  });
                                  const formData = new FormData();
                                  formData.append("files", encFile);
                                  formData.append("chatId", chatId);
                                  if (replyToMsg?.id) formData.append("replyTo", replyToMsg.id);

                                  const uploadRes = await fetch("/api/telegram/upload", {
                                    method: "POST",
                                    body: formData,
                                  });
                                  if (uploadRes.ok) {
                                    const upData = await uploadRes.json();
                                    if (upData.ids && upData.ids.length > 0) {
                                      setMessages((prev) =>
                                        prev.map((m) =>
                                          m.id === tempId
                                            ? { ...m, id: upData.ids[0].toString(), status: "sent" }
                                            : m,
                                        ),
                                      );
                                    }
                                  }
                                  return;
                                }

                                const file = new File([blob], "sticker.webp", { type: "image/webp" });
                                const formData = new FormData();
                                formData.append("files", file);
                                formData.append("chatId", chatId);
                                if (replyToMsg?.id) formData.append("replyTo", replyToMsg.id);
                                const uploadRes = await fetch("/api/telegram/upload", { method: "POST", body: formData });
                                if (uploadRes.ok) {
                                  const upData = await uploadRes.json();
                                  if (upData.ids && upData.ids.length > 0) {
                                    setMessages((prev) =>
                                      prev.map((m) =>
                                        m.id === tempId ? { ...m, id: upData.ids[0].toString(), status: "sent" } : m
                                      )
                                    );
                                  }
                                }
                              } catch (err) {
                                console.error("Error sending sticker:", err);
                              }
                            }}
                            className="aspect-square rounded-xl hover:bg-white/10 active:scale-90 transition-all cursor-pointer flex items-center justify-center p-1.5 relative group"
                            title={s.emoji || "Стикер"}
                          >
                            <img
                              src={stickerUrl}
                              className="w-full h-full object-contain filter drop-shadow hover:scale-110 transition-transform"
                              loading="lazy"
                              alt={s.emoji}
                            />
                            {s.emoji && (
                              <span className="absolute bottom-0.5 right-0.5 text-[10px] bg-black/70 backdrop-blur-sm rounded-md px-1 opacity-80 group-hover:opacity-100">
                                {s.emoji}
                              </span>
                            )}
                          </button>
                        );
                      })
                  )}
                </div>
              </div>
            )}
            
            {livePeerKeystroke && livePeerKeystroke.text ? (
              <div className="absolute -top-9 left-2 right-2 bg-[#17212b]/95 backdrop-blur-md border border-cyan-500/40 rounded-xl px-3 py-1.5 shadow-xl flex items-center justify-between gap-2 z-20 animate-fade-in">
                <div className="flex items-center gap-2 min-w-0 flex-1">
                  <div className="w-2 h-2 rounded-full bg-cyan-400 animate-ping shrink-0" />
                  <span className="text-[11px] font-semibold text-cyan-400 shrink-0">
                    Телепатия ({chatName || "Собеседник"}):
                  </span>
                  <span className="text-xs text-white font-mono truncate">
                    {livePeerKeystroke.text}
                  </span>
                  <span className="w-1.5 h-3.5 bg-cyan-400 animate-pulse inline-block shrink-0" />
                </div>
                <span className="text-[10px] text-cyan-400 font-mono tracking-wider shrink-0 bg-cyan-500/10 px-1.5 py-0.5 rounded border border-cyan-500/20">LIVE</span>
              </div>
            ) : isTyping ? (
              <div className="absolute -top-8 left-3 flex items-center gap-2 px-2.5 py-1 bg-[#17212b]/95 backdrop-blur-md border border-[#2481cc]/40 rounded-xl shadow-lg z-20 animate-fade-in">
                <div className="flex gap-1 items-center">
                  <div className="w-1.5 h-1.5 bg-[#2481cc] rounded-full animate-bounce [animation-delay:-0.32s]" />
                  <div className="w-1.5 h-1.5 bg-[#2481cc] rounded-full animate-bounce [animation-delay:-0.16s]" />
                  <div className="w-1.5 h-1.5 bg-[#2481cc] rounded-full animate-bounce" />
                </div>
                <span className="text-xs text-[#2481cc] font-medium">
                  {chatName || "Собеседник"} {typingActionText || (strings.typing || "печатает...")}
                </span>
              </div>
            ) : null}

            {/* Dynamic Smart Buttons: Formatting & AI Assistant */}
            {input.length > 0 && !isRecording && (
              <div className="flex items-center gap-2 mb-2 px-1 animate-in fade-in slide-in-from-bottom-2 duration-150">
                <button
                  type="button"
                  onClick={() => {
                    triggerHaptic("light");
                    setShowRichMessageModal(true);
                  }}
                  className="px-3 py-1.5 rounded-xl bg-blue-500/15 hover:bg-blue-500/25 border border-blue-500/35 text-blue-300 text-xs font-semibold flex items-center gap-1.5 transition-all shadow-sm active:scale-95 cursor-pointer backdrop-blur-sm"
                  title="Окно полного форматирования сообщения (таблицы, картинки, опросы, жирный текст, кнопки)"
                >
                  <Type className="w-3.5 h-3.5 text-blue-400" />
                  <span>Форматирование</span>
                </button>

                {input.trim().length >= 8 && (
                  <button
                    type="button"
                    onClick={() => {
                      triggerHaptic("light");
                      setShowAiHelperModal(true);
                    }}
                    className="px-3 py-1.5 rounded-xl bg-gradient-to-r from-purple-600/25 to-indigo-600/25 hover:from-purple-600/35 hover:to-indigo-600/35 border border-purple-500/40 text-purple-200 text-xs font-semibold flex items-center gap-1.5 transition-all shadow-sm active:scale-95 cursor-pointer backdrop-blur-sm"
                    title="Нейросеть: переписать в нужном стиле, составить ответ, исправить ошибки"
                  >
                    <Sparkles className="w-3.5 h-3.5 text-purple-400 animate-pulse" />
                    <span>Нейросеть</span>
                  </button>
                )}
              </div>
            )}

            <div className="relative flex items-end gap-1.5 bg-[#17212b] border border-[#242f3d] rounded-2xl p-1.5 shadow-lg transition-all focus-within:border-[#2481cc]/60 focus-within:ring-1 focus-within:ring-[#2481cc]/30 chat-input-bar" data-glass="true">
              {/* Left corner: Media button (always available) */}
              {!isRecording && (
                <>
                  <button
                    type="button"
                    onClick={() => setShowGallerySheet(true)}
                    className={`p-2.5 text-gray-400 hover:text-[#2481cc] transition-colors cursor-pointer rounded-full hover:bg-[#1a1a24] mb-0.5 ml-0.5 shrink-0 ${showGallerySheet ? 'bg-[#1a1a24] text-[#2481cc]' : ''}`}
                    title="Галерея и вложения (Telegram)"
                  >
                    <Paperclip className="w-5 h-5" />
                  </button>
                  <input ref={fileInputRef} type="file" multiple className="hidden" onChange={handleFileChange} />
                  <input ref={galleryInputRef} type="file" accept="image/*,video/*" multiple className="hidden" onChange={handleFileChange} />

                  {/* Extra tools appear smoothly ONLY when user is typing text or attached files */}
                  <AnimatePresence>
                    {(input.trim().length > 0 || files.length > 0) && (
                      <motion.div
                        initial={{ opacity: 0, scale: 0.8, width: 0 }}
                        animate={{ opacity: 1, scale: 1, width: "auto" }}
                        exit={{ opacity: 0, scale: 0.8, width: 0 }}
                        transition={{ duration: 0.18, ease: "easeOut" }}
                        className="flex items-center shrink-0 overflow-hidden"
                      >
                        {botCommands && botCommands.length > 0 && (
                          <button
                            type="button"
                            onClick={() => setInput(input.startsWith('/') ? '' : '/')}
                            className="p-2 text-indigo-400 hover:text-indigo-300 transition-colors cursor-pointer rounded-full hover:bg-indigo-500/10 mb-0.5 shrink-0"
                            title="Commands list"
                          >
                            <div className="w-5 h-5 flex items-center justify-center border-2 border-current rounded-md font-bold text-xs">/</div>
                          </button>
                        )}
                        <button
                          type="button"
                          onClick={() => setShowStickerPicker(!showStickerPicker)}
                          className={`p-2 text-gray-400 hover:text-orange-400 transition-colors cursor-pointer rounded-full hover:bg-[#1a1a24] mb-0.5 shrink-0 ${showStickerPicker ? 'bg-[#1a1a24] text-orange-400' : ''}`}
                          title="Стикеры и эмодзи"
                        >
                          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.828 14.828a4 4 0 01-5.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                          </svg>
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            const next = !isBlockchainEnabled;
                            setIsBlockchainEnabled(next);
                            setBlockchainEncryptionEnabled(next);
                            triggerHaptic("light");
                          }}
                          className={`p-2 transition-all cursor-pointer rounded-full mb-0.5 relative group shrink-0 ${
                            isBlockchainEnabled
                              ? "text-emerald-400 bg-emerald-500/15 border border-emerald-500/30"
                              : "text-gray-400 hover:text-gray-200 hover:bg-[#1a1a24]"
                          }`}
                          title={isBlockchainEnabled ? (strings.encryptionOn || "Шифрование Nexus E2EE включено") : (strings.encryptionOff || "Включить шифрование Nexus E2EE")}
                        >
                          {isBlockchainEnabled ? (
                            <ShieldCheck className="w-5 h-5 text-emerald-400" />
                          ) : (
                            <Lock className="w-5 h-5" />
                          )}
                          {isBlockchainEnabled && (
                            <span className="absolute top-1.5 right-1.5 w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping" />
                          )}
                        </button>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </>
              )}

              {/* Center: Text input field or Recording UI */}
              {isRecording ? (
                <div className="flex-1 flex items-center justify-between py-3 px-4 text-indigo-400 animate-fade-in">
                  <div className="flex items-center gap-3">
                    <div className="w-2.5 h-2.5 bg-indigo-500 rounded-full animate-pulse"></div>
                    <span className="font-mono text-sm text-gray-300">
                      {Math.floor(recordingTime / 60)}:
                      {(recordingTime % 60).toString().padStart(2, "0")}
                    </span>
                    <span className="text-xs text-indigo-300">
                      {recordingType === "video" ? "Запись видео-кружочка..." : "Запись аудиосообщения..."}
                    </span>
                  </div>
                  <button
                    onClick={stopRecording}
                    className="text-gray-400 hover:text-white p-1.5 rounded-full cursor-pointer bg-red-500/20 hover:bg-red-500/40 text-red-400"
                    title="Завершить запись"
                  >
                    <Square className="w-4 h-4" />
                  </button>
                </div>
              ) : (
                <textarea
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder="Сообщение..."
                  className="flex-1 bg-transparent text-gray-200 py-3 px-2 resize-none focus:outline-none max-h-32 min-h-[52px] text-[15px] placeholder-gray-500 font-sans"
                  rows={1}
                />
              )}

              {/* Right corner: When empty, show ONE combined Voice/Video button (Tap to switch mode, Hold to record). When text entered, show Send button! */}
              {!input.trim() && files.length === 0 && !isRecording ? (
                <div className="flex items-center mb-0.5 mr-0.5 shrink-0 animate-fade-in">
                  <button
                    type="button"
                    onMouseDown={(e) => {
                      e.preventDefault();
                      setWasHolding(false);
                      holdTimerRef.current = setTimeout(() => {
                        setWasHolding(true);
                        startRecording();
                      }, 320);
                    }}
                    onMouseUp={(e) => {
                      e.preventDefault();
                      if (holdTimerRef.current) {
                        clearTimeout(holdTimerRef.current);
                        holdTimerRef.current = null;
                      }
                      if (isRecording || wasHolding) {
                        stopRecording();
                      } else {
                        // Short tap: toggle between audio and video
                        setRecordingType((prev) => (prev === "audio" ? "video" : "audio"));
                        triggerHaptic("light");
                      }
                    }}
                    onTouchStart={(e) => {
                      e.preventDefault();
                      setWasHolding(false);
                      holdTimerRef.current = setTimeout(() => {
                        setWasHolding(true);
                        startRecording();
                      }, 320);
                    }}
                    onTouchEnd={(e) => {
                      e.preventDefault();
                      if (holdTimerRef.current) {
                        clearTimeout(holdTimerRef.current);
                        holdTimerRef.current = null;
                      }
                      if (isRecording || wasHolding) {
                        stopRecording();
                      } else {
                        // Short tap: toggle between audio and video
                        setRecordingType((prev) => (prev === "audio" ? "video" : "audio"));
                        triggerHaptic("light");
                      }
                    }}
                    className={`p-2.5 rounded-full transition-all flex items-center justify-center cursor-pointer select-none active:scale-95 ${
                      recordingType === "video"
                        ? "text-cyan-400 bg-cyan-500/10 hover:bg-cyan-500/20"
                        : "text-indigo-400 bg-indigo-500/10 hover:bg-indigo-500/20"
                    }`}
                    title={
                      recordingType === "video"
                        ? "Видео-кружочек (нажмите для переключения на аудио, зажмите для записи)"
                        : "Голосовое сообщение (нажмите для переключения на видео, зажмите для записи)"
                    }
                  >
                    {recordingType === "video" ? (
                      <Video className="w-5 h-5 transition-transform duration-200" />
                    ) : (
                      <Mic className="w-5 h-5 transition-transform duration-200" />
                    )}
                  </button>
                </div>
              ) : (
                <button
                  onClick={() => handleSend()}
                  disabled={
                    (!input.trim() && files.length === 0) ||
                    isLoading ||
                    isRecording
                  }
                  className="p-3 mb-0.5 mr-0.5 rounded-xl bg-[#2481cc] hover:bg-[#288ddf] text-white transition-all disabled:opacity-50 disabled:hover:bg-[#2481cc] flex items-center justify-center shadow-md cursor-pointer active:scale-95 animate-fade-in shrink-0"
                  title="Отправить сообщение"
                >
                  {isLoading ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <Send className="w-4 h-4" />
                  )}
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Telegram Native Media & Gallery Attachment Sheet */}
      <TelegramGallerySheet
        isOpen={showGallerySheet}
        onClose={() => setShowGallerySheet(false)}
        chatName={chatName}
        onSendMedia={(selectedFiles, caption) => {
          if (caption && !input.trim()) {
            setInput(caption);
          }
          setFiles((prev) => [...prev, ...selectedFiles]);
          setShowGallerySheet(false);
        }}
      />

      {/* Rich Message Formatting Modal */}
      <RichMessageModal
        isOpen={showRichMessageModal}
        onClose={() => setShowRichMessageModal(false)}
        initialText={input}
        chatName={chatName}
        onSendMessage={async (formattedText) => {
          await handleSend(formattedText);
        }}
        onApplyToInput={(formattedText) => {
          setInput(formattedText);
        }}
      />

      {/* AI Assistant Message Helper Modal */}
      <AiMessageHelperModal
        isOpen={showAiHelperModal}
        onClose={() => setShowAiHelperModal(false)}
        initialText={input}
        chatName={chatName}
        onSendMessage={async (text) => {
          await handleSend(text);
        }}
        onApplyToInput={(text) => {
          setInput(text);
        }}
        onOpenSettings={() => {
          setShowAiSettingsModal(true);
        }}
      />

      {/* AI Settings Modal */}
      <AiSettingsModal
        isOpen={showAiSettingsModal}
        onClose={() => setShowAiSettingsModal(false)}
      />

      {/* Secret Chat E2EE Key Modal */}
      <SecretChatKeyModal
        isOpen={showSecretKeyModal}
        onClose={() => setShowSecretKeyModal(false)}
        chatName={chatName}
        chatId={chatId}
        secretKey={secretChatKey}
        isOnline={Boolean(isOnline)}
        isSecretChatTerminated={Boolean(isSecretChatTerminated)}
        onEndSecretChat={async () => {
          setShowSecretKeyModal(false);
          const currentChatId = String(chatId);
          setIsSecretChatActive(false);
          setIsSecretChatTerminated(false);
          setSecretMessages([]);
          localStorage.removeItem(`nexus_secret_chat_active_${currentChatId}`);
          localStorage.removeItem(`nexus_secret_chat_term_${currentChatId}`);
          localStorage.removeItem(`nexus_secret_chat_key_${currentChatId}`);
          localStorage.removeItem(`nexus_secret_messages_${currentChatId}`);

          try {
            await fetch("/api/telegram/secret-chat/end", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ receiverId: currentChatId }),
            });
            if (socketRef.current) {
              socketRef.current.emit("nexus_secret_chat_end", {
                receiverId: currentChatId,
              });
            }
          } catch (e) {
            console.error(e);
          }
          triggerHaptic("heavy");
        }}
      />

      {/* AyuGram Heuristic Detection Modal */}
      <AyuGramDetectionModal
        isOpen={showAyuGramResultModal}
        onClose={() => setShowAyuGramResultModal(false)}
        targetName={chatName}
        targetId={chatId}
        scanResult={ayuGramScanResult}
        loading={isScanningAyuGram}
        onRescan={async () => {
          setIsScanningAyuGram(true);
          try {
            const res = await scanForAyuGram(
              chatId,
              (chatTypeData as any)?.username,
              chatName,
              (chatTypeData as any)?.about
            );
            setAyuGramScanResult(res);
          } catch (err) {
            console.error(err);
          } finally {
            setIsScanningAyuGram(false);
          }
        }}
      />

      {/* Nexus Blockchain Explorer & Key Management Modal */}
      {showNexusModal && (
        <NexusBlockchainModal
          onClose={() => {
            setShowNexusModal(false);
            setSelectedNexusBlock(null);
          }}
          selectedBlock={selectedNexusBlock}
        />
      )}
    </div>
  );
}

function ClientFileViewer({ url, name, mimeType }: { url: string; name: string; mimeType: string }) {
  const [content, setContent] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const isText = mimeType.startsWith("text/") || 
                   mimeType === "application/json" || 
                   mimeType === "application/javascript" ||
                   name.endsWith(".txt") || 
                   name.endsWith(".json") || 
                   name.endsWith(".js") || 
                   name.endsWith(".ts") || 
                   name.endsWith(".css") || 
                   name.endsWith(".md") || 
                   name.endsWith(".html") ||
                   name.endsWith(".xml") ||
                   name.endsWith(".sh") ||
                   name.endsWith(".yaml") ||
                   name.endsWith(".yml") ||
                   name.endsWith(".ini") ||
                   name.endsWith(".cfg") ||
                   name.endsWith(".conf") ||
                   name.endsWith(".ian");

    if (isText) {
      setLoading(true);
      fetch(url)
        .then((res) => {
          if (!res.ok) throw new Error("Не удалось загрузить содержимое файла");
          return res.text();
        })
        .then((text) => {
          setContent(text);
          setLoading(false);
        })
        .catch((err) => {
          setError(err.message);
          setLoading(false);
        });
    } else {
      setLoading(false);
    }
  }, [url, name, mimeType]);

  return (
    <div className="w-full max-w-xl bg-[#111116] border border-white/10 rounded-2xl overflow-hidden shadow-xl p-6 flex flex-col gap-4 animate-fade-in text-left select-text">
      <div className="flex items-center gap-3 border-b border-white/5 pb-4">
        <div className="w-10 h-10 rounded-xl bg-indigo-500/15 flex items-center justify-center shrink-0">
          <FileIcon className="w-5 h-5 text-indigo-400" />
        </div>
        <div className="min-w-0 flex-1">
          <h4 className="text-sm font-semibold text-gray-200 truncate">{name}</h4>
          <p className="text-[11px] font-mono text-gray-400 truncate mt-0.5">{mimeType || "Binary data"}</p>
        </div>
        <a 
          href={url} 
          download={name}
          onClick={(e) => e.stopPropagation()}
          className="px-3.5 py-1.5 bg-indigo-600 hover:bg-indigo-500 hover:brightness-110 active:scale-95 text-white rounded-xl text-xs font-semibold shadow-md transition-all shrink-0 cursor-pointer"
        >
          Скачать ⬇️
        </a>
      </div>

      <div className="flex-1 overflow-auto max-h-[50vh] bg-black/30 rounded-xl p-4 border border-white/5">
        {loading ? (
          <div className="flex flex-col items-center justify-center gap-2.5 py-12">
            <Loader2 className="w-6 h-6 animate-spin text-indigo-400" />
            <p className="text-xs font-mono text-gray-400">Чтение двоичных данных...</p>
          </div>
        ) : error ? (
          <p className="text-xs text-red-400 font-mono">Ошибка: {error}</p>
        ) : content !== null ? (
          <pre className="text-xs font-mono text-gray-300 whitespace-pre-wrap leading-relaxed select-text">
            {content}
          </pre>
        ) : (
          <div className="flex flex-col items-center justify-center gap-3 py-10 text-center text-gray-400">
            <span className="text-2xl">📦</span>
            <div className="space-y-1">
              <p className="text-xs font-semibold text-gray-300">Файл открыт во внутреннем клиенте</p>
              <p className="text-[10px] text-gray-500 max-w-xs leading-normal">
                Этот формат не может быть отображен как текст. Вы можете скачать его на устройство для просмотра.
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
