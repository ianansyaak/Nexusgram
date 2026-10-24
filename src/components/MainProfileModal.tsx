import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "motion/react";
import {
  User,
  X,
  Edit2,
  Share2,
  Check,
  Copy,
  Key,
  RotateCcw,
  Sliders,
  DownloadCloud,
  RefreshCw,
  LogOut,
  Gift,
  Settings,
  Plus,
  Trash2,
  Sparkles,
  Palette,
  Star,
  CheckCircle2,
  ChevronRight,
  ChevronUp,
  Phone,
  Info,
  ShieldCheck,
  Smile,
  ArrowLeftRight,
  Send,
  Loader2,
  Lock,
  ExternalLink,
  Flame,
  Menu,
  StickyNote,
} from "lucide-react";
import { triggerHaptic } from "../utils/haptics";
import { mediaSync, formatBytes, MediaSyncState } from "../utils/mediaSyncManager";
import { resetAllAppSettings, resetDesignSettings } from "../utils/resetSettings";
import { getOptimizedMediaUrl } from "../utils/ecoStream";
import {
  detectUserClient,
  getCurrentUserClient,
  setCurrentUserClient,
  TelegramClientType,
  CLIENT_DEFINITIONS,
} from "../utils/clientDetector";
import {
  REAL_TELEGRAM_NFT_GIFTS,
  TelegramNftGift,
  getSavedPinnedNft,
  setSavedPinnedNft,
} from "../data/telegramNftGifts";
import { detectCountryByPhone, COUNTRIES } from "../utils/countryFlags";
import { CreateStoryModal, CreatedStoryData } from "./CreateStoryModal";
import { UserStoriesModal } from "./UserStoriesModal";

// Preset Profile Banner Themes
const BANNER_THEMES = [
  { id: "telegram_blue", name: "Telegram Blue", gradient: "from-[#2481cc] via-[#1d6fa5] to-[#17212b]" },
  { id: "royal_purple", name: "Royal Purple", gradient: "from-[#7c3aed] via-[#581c87] to-[#1e1b4b]" },
  { id: "cyber_neon", name: "Cyber Neon", gradient: "from-[#ec4899] via-[#8b5cf6] to-[#0f172a]" },
  { id: "emerald_mint", name: "Emerald Mint", gradient: "from-[#059669] via-[#065f46] to-[#064e3b]" },
  { id: "sunset_orange", name: "Sunset Flame", gradient: "from-[#ea580c] via-[#b91c1c] to-[#4c0519]" },
  { id: "midnight_black", name: "Midnight Stealth", gradient: "from-[#1e293b] via-[#0f172a] to-[#020617]" },
  { id: "golden_luxury", name: "Golden Star", gradient: "from-[#d97706] via-[#92400e] to-[#451a03]" },
];

// Preset Banner Patterns / Floating Gifts
const BANNER_PATTERNS = [
  { id: "none", name: "Без узора", icon: "—" },
  { id: "gifts", name: "Подарки", icon: "🎁" },
  { id: "stars", name: "Звезды", icon: "✨" },
  { id: "diamonds", name: "Алмазы", icon: "💎" },
  { id: "ducks", name: "Утята", icon: "🦆" },
  { id: "rockets", name: "Ракеты", icon: "🚀" },
  { id: "hearts", name: "Сердца", icon: "💖" },
];

// Preset Status Badges
const PRESET_BADGES = [
  { id: "none", emoji: "", name: "Без значка" },
  { id: "star", emoji: "⭐", name: "Telegram Star" },
  { id: "diamond", emoji: "💎", name: "Rare Diamond" },
  { id: "lightning", emoji: "⚡", name: "Nexus Lightning" },
  { id: "crown", emoji: "👑", name: "Royal Crown" },
  { id: "fire", emoji: "🔥", name: "On Fire" },
  { id: "rocket", emoji: "🚀", name: "Cosmic Rocket" },
  { id: "unicorn", emoji: "🦄", name: "Mythic Unicorn" },
  { id: "crystal_heart", emoji: "💖", name: "Crystal Heart" },
  { id: "saturn", emoji: "🪐", name: "Cosmic Saturn" },
  { id: "trophy", emoji: "🏆", name: "Champion" },
];

interface AccountItem {
  id: string;
  name: string;
  phone: string;
  username: string;
  session: string;
  avatarUrl?: string;
  isActive: boolean;
}

export function MainProfileModal({
  onClose,
  onOpenChat,
  onOpenSettings,
}: {
  onClose: () => void;
  onOpenChat?: (chatId: string, chatType: "telegram", chatName: string) => void;
  onOpenSettings?: () => void;
}) {
  // Tabs: "profile" | "gifts" | "settings"
  const [activeTab, setActiveTab] = useState<"profile" | "gifts" | "settings">("profile");

  // Avatar container ref for Dynamic Island merge target tracking
  const avatarContainerRef = useRef<HTMLDivElement>(null);

  // Real-time Gifts from Telegram API
  const [realGifts, setRealGifts] = useState<any[]>([]);
  const [loadingRealGifts, setLoadingRealGifts] = useState(false);

  // Profile data
  const [profile, setProfile] = useState<any>(null);
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [about, setAbout] = useState("");
  const [phone, setPhone] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [avatarBust, setAvatarBust] = useState(Date.now());
  const [hasVideo, setHasVideo] = useState(true);
  const [sessionStr, setSessionStr] = useState("");
  const [userClientType, setUserClientType] = useState<TelegramClientType>(() => getCurrentUserClient());

  // Telegram Stickers for emoji status
  const [stickers, setStickers] = useState<any[]>([]);
  const [showBadgePicker, setShowBadgePicker] = useState(false);

  // Customization: Profile banner, pattern, status badge
  const [bannerTheme, setBannerTheme] = useState(() => localStorage.getItem("nexus_profile_banner_theme") || "telegram_blue");
  const [bannerPattern, setBannerPattern] = useState(() => localStorage.getItem("nexus_profile_banner_pattern") || "gifts");
  const [selectedBadge, setSelectedBadge] = useState(() => localStorage.getItem("nexus_profile_badge") || "⚡");
  const [selectedStickerBadge, setSelectedStickerBadge] = useState<string | null>(() => localStorage.getItem("nexus_profile_sticker_badge") || null);

  // Real NFT Gifts state
  const [selectedNft, setSelectedNft] = useState<TelegramNftGift | null>(null);
  const [pinnedNft, setPinnedNft] = useState<TelegramNftGift | null>(() => getSavedPinnedNft());
  const [nftFilter, setNftFilter] = useState<"all" | "Legendary" | "Mythic" | "Rare">("all");

  // Multi-account management
  const [accounts, setAccounts] = useState<AccountItem[]>(() => {
    try {
      const saved = localStorage.getItem("nexus_multi_accounts");
      if (saved) return JSON.parse(saved);
    } catch {}
    return [];
  });
  const [showAddAccountModal, setShowAddAccountModal] = useState(false);

  // Add Account Flow State
  const [authStep, setAuthStep] = useState<"phone" | "code" | "2fa" | "session">("phone");
  const [authPhone, setAuthPhone] = useState("");
  const [authCode, setAuthCode] = useState("");
  const [authCodeHash, setAuthCodeHash] = useState("");
  const [authPassword, setAuthPassword] = useState("");
  const [authHint, setAuthHint] = useState("");
  const [authLoading, setAuthLoading] = useState(false);
  const [authError, setAuthError] = useState("");
  const [authIsCodeViaApp, setAuthIsCodeViaApp] = useState(false);
  const [rawSessionInput, setRawSessionInput] = useState("");
  const [manualAccountName, setManualAccountName] = useState("");

  // Status messages & utilities
  const [personalNote, setPersonalNote] = useState(() => localStorage.getItem("nexus_personal_profile_note") || "");
  const [isEditingPersonalNote, setIsEditingPersonalNote] = useState(false);
  const [copiedSession, setCopiedSession] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);
  const [resetStatus, setResetStatus] = useState<string | null>(null);
  const [syncState, setSyncState] = useState<MediaSyncState>(mediaSync.getState());
  const [isOnline, setIsOnline] = useState(typeof navigator !== "undefined" ? navigator.onLine : true);

  // Swipe-down photo expansion and profile stories
  const [isPhotoExpanded, setIsPhotoExpanded] = useState(false);
  const [profilePullY, setProfilePullY] = useState(0);
  const [showCreateStory, setShowCreateStory] = useState(false);
  const [viewingStoryIdx, setViewingStoryIdx] = useState<number | null>(null);
  const [myStories, setMyStories] = useState<any[]>(() => {
    try {
      return JSON.parse(localStorage.getItem("nexus_my_stories") || "[]");
    } catch {
      return [];
    }
  });
  const touchStartYRef = useRef<number | null>(null);

  const modalRef = useRef<HTMLDivElement>(null);
  const publicUrl = "https://ais-pre-ick7smocmch5wsjc23jx6i-178090609278.europe-west2.run.app";

  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);
    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);
    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, []);

  useEffect(() => {
    return mediaSync.subscribe(setSyncState);
  }, []);

  // Fetch current Telegram user profile
  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const res = await fetch("/api/telegram/me");
        if (res.ok) {
          const data = await res.json();
          setProfile(data);
          setFirstName(data.firstName || "");
          setLastName(data.lastName || "");
          setAbout(data.about || "");
          setPhone(data.phone || "");

          // Update active account item if accounts exist
          setAccounts((prev) => {
            const currentAcc: AccountItem = {
              id: data.id || "current",
              name: `${data.firstName || ""} ${data.lastName || ""}`.trim() || data.username || "Мой аккаунт",
              phone: data.phone || "",
              username: data.username || "",
              session: localStorage.getItem("telegram_session") || "",
              avatarUrl: `/api/telegram/avatar/${data.id}`,
              isActive: true,
            };
            if (prev.length === 0) {
              const initial = [currentAcc];
              localStorage.setItem("nexus_multi_accounts", JSON.stringify(initial));
              return initial;
            }
            const exists = prev.some((a) => a.id === data.id);
            if (!exists) {
              const updated = [...prev.map((a) => ({ ...a, isActive: false })), currentAcc];
              localStorage.setItem("nexus_multi_accounts", JSON.stringify(updated));
              return updated;
            }
            return prev;
          });
        }

        // Fetch Session string
        const sessionRes = await fetch("/api/telegram/session");
        if (sessionRes.ok) {
          const sData = await sessionRes.json();
          if (sData.session) setSessionStr(sData.session);
        }

        // Load premium sticker packs for status badge
        const stickersRes = await fetch("/api/telegram/stickers");
        if (stickersRes.ok) {
          const stData = await stickersRes.json();
          if (Array.isArray(stData)) setStickers(stData.slice(0, 36));
        }
      } catch (err) {
        console.error("Failed to load profile:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchProfile();

    // Fetch real-time Telegram gifts
    const fetchUserGifts = async () => {
      try {
        setLoadingRealGifts(true);
        const res = await fetch("/api/telegram/gifts");
        if (res.ok) {
          const data = await res.json();
          if (Array.isArray(data.gifts)) {
            setRealGifts(data.gifts);
          }
        }
      } catch (e) {
        console.warn("Failed to fetch user gifts:", e);
      } finally {
        setLoadingRealGifts(false);
      }
    };
    fetchUserGifts();
  }, []);

  // Handlers for Customization
  const updateBannerTheme = (themeId: string) => {
    setBannerTheme(themeId);
    localStorage.setItem("nexus_profile_banner_theme", themeId);
    triggerHaptic("light");
  };

  const updateBannerPattern = (patId: string) => {
    setBannerPattern(patId);
    localStorage.setItem("nexus_profile_banner_pattern", patId);
    triggerHaptic("light");
  };

  const selectStatusBadge = (emoji: string) => {
    setSelectedBadge(emoji);
    setSelectedStickerBadge(null);
    localStorage.setItem("nexus_profile_badge", emoji);
    localStorage.removeItem("nexus_profile_sticker_badge");
    setShowBadgePicker(false);
    triggerHaptic("light");
  };

  const selectStickerStatusBadge = (stickerUrl: string) => {
    setSelectedStickerBadge(stickerUrl);
    setSelectedBadge("");
    localStorage.setItem("nexus_profile_sticker_badge", stickerUrl);
    localStorage.removeItem("nexus_profile_badge");
    setShowBadgePicker(false);
    triggerHaptic("light");
  };

  const handlePinNft = (nft: TelegramNftGift) => {
    if (pinnedNft?.id === nft.id) {
      setPinnedNft(null);
      setSavedPinnedNft(null);
      triggerHaptic("light");
    } else {
      setPinnedNft(nft);
      setSavedPinnedNft(nft.id);
      triggerHaptic("medium");
    }
  };

  // Avatar file upload
  const handleAvatarChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    triggerHaptic("light");
    const formData = new FormData();
    formData.append("avatar", file);

    try {
      setLoading(true);
      const res = await fetch("/api/telegram/profile/photo", {
        method: "POST",
        body: formData,
      });
      if (res.ok) {
        setAvatarBust(Date.now());
        triggerHaptic("medium");
      }
    } catch (err) {
      console.error("Failed to upload avatar:", err);
    } finally {
      setLoading(false);
    }
  };

  // Multi-account: Send Code for new account
  const handleSendCode = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!authPhone.trim()) return;
    setAuthLoading(true);
    setAuthError("");
    triggerHaptic("light");

    try {
      const res = await fetch("/api/telegram/auth/sendCode", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phoneNumber: authPhone.trim() }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Ошибка отправки кода");

      setAuthCodeHash(data.phoneCodeHash);
      setAuthIsCodeViaApp(Boolean(data.isCodeViaApp));
      setAuthStep("code");
      triggerHaptic("medium");
    } catch (err: any) {
      setAuthError(err.message);
    } finally {
      setAuthLoading(false);
    }
  };

  // Multi-account: Verify Code
  const handleVerifyCode = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!authCode.trim()) return;
    setAuthLoading(true);
    setAuthError("");
    triggerHaptic("light");

    try {
      const res = await fetch("/api/telegram/auth/signIn", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          phoneNumber: authPhone.trim(),
          phoneCodeHash: authCodeHash,
          phoneCode: authCode.trim(),
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Ошибка проверки кода");

      if (data.requires2FA) {
        setAuthHint(data.hint || "");
        setAuthStep("2fa");
        return;
      }

      await finishAccountLogin(data.session);
    } catch (err: any) {
      setAuthError(err.message);
    } finally {
      setAuthLoading(false);
    }
  };

  // Multi-account: Verify 2FA Password
  const handleVerifyPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!authPassword.trim()) return;
    setAuthLoading(true);
    setAuthError("");
    triggerHaptic("light");

    try {
      const res = await fetch("/api/telegram/auth/checkPassword", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password: authPassword.trim() }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Неверный пароль 2FA");

      await finishAccountLogin(data.session);
    } catch (err: any) {
      setAuthError(err.message);
    } finally {
      setAuthLoading(false);
    }
  };

  // Multi-account: Import session directly
  const handleImportSession = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!rawSessionInput.trim()) return;
    setAuthLoading(true);
    setAuthError("");
    triggerHaptic("light");

    try {
      const res = await fetch("/api/telegram/session/restore", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ session: rawSessionInput.trim() }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Недействительная строка сессии");

      await finishAccountLogin(rawSessionInput.trim(), manualAccountName);
    } catch (err: any) {
      setAuthError(err.message);
    } finally {
      setAuthLoading(false);
    }
  };

  // Save new account into state and localStorage
  const finishAccountLogin = async (newSession: string, customName?: string) => {
    try {
      const meRes = await fetch("/api/telegram/me");
      const meData = meRes.ok ? await meRes.json() : null;

      const accName =
        customName?.trim() ||
        (meData ? `${meData.firstName || ""} ${meData.lastName || ""}`.trim() || meData.username : "") ||
        "Дополнительный аккаунт";

      const newAcc: AccountItem = {
        id: meData?.id || `acc_${Date.now()}`,
        name: accName,
        phone: meData?.phone || authPhone || "",
        username: meData?.username || "",
        session: newSession,
        avatarUrl: meData?.id ? `/api/telegram/avatar/${meData.id}` : undefined,
        isActive: true,
      };

      const updated = [...accounts.map((a) => ({ ...a, isActive: false })), newAcc];
      setAccounts(updated);
      localStorage.setItem("nexus_multi_accounts", JSON.stringify(updated));
      localStorage.setItem("telegram_session", newSession);

      setShowAddAccountModal(false);
      resetAuthFields();
      triggerHaptic("medium");
      window.location.reload();
    } catch (e) {
      console.error(e);
    }
  };

  const resetAuthFields = () => {
    setAuthStep("phone");
    setAuthPhone("");
    setAuthCode("");
    setAuthCodeHash("");
    setAuthPassword("");
    setAuthError("");
    setRawSessionInput("");
    setManualAccountName("");
  };

  // Switch between existing accounts
  const handleSwitchAccount = async (account: AccountItem) => {
    if (account.isActive) return;
    triggerHaptic("medium");
    if (account.session) {
      try {
        await fetch("/api/telegram/session/restore", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ session: account.session }),
        });
        localStorage.setItem("telegram_session", account.session);
      } catch (e) {
        console.error(e);
      }
    }
    const updated = accounts.map((a) => ({
      ...a,
      isActive: a.id === account.id,
    }));
    setAccounts(updated);
    localStorage.setItem("nexus_multi_accounts", JSON.stringify(updated));
    window.location.reload();
  };

  // Save profile changes (Name, About)
  const handleSaveProfile = async () => {
    setSaving(true);
    try {
      await fetch("/api/telegram/profile", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ firstName, lastName, about }),
      });
      triggerHaptic("medium");
    } catch (err) {
      console.error("Failed to save profile:", err);
    } finally {
      setSaving(false);
    }
  };

  // Copy session
  const handleCopySession = () => {
    if (!sessionStr) return;
    navigator.clipboard.writeText(sessionStr);
    setCopiedSession(true);
    triggerHaptic("light");
    setTimeout(() => setCopiedSession(false), 2000);
  };

  // Copy public profile link
  const handleCopyLink = () => {
    navigator.clipboard.writeText(publicUrl);
    setCopiedLink(true);
    triggerHaptic("light");
    setTimeout(() => setCopiedLink(false), 2000);
  };

  // Logout
  const handleLogout = async () => {
    if (window.confirm("Вы действительно хотите выйти из аккаунта Telegram?")) {
      try {
        await fetch("/api/telegram/logout", { method: "POST" });
        localStorage.removeItem("telegram_session");
        window.location.reload();
      } catch (err) {
        console.error(err);
      }
    }
  };

  const activeThemeObj = BANNER_THEMES.find((t) => t.id === bannerTheme) || BANNER_THEMES[0];
  const activePatternObj = BANNER_PATTERNS.find((p) => p.id === bannerPattern) || BANNER_PATTERNS[0];

  const filteredNfts = REAL_TELEGRAM_NFT_GIFTS.filter((nft) => {
    if (nftFilter === "all") return true;
    return nft.rarity === nftFilter;
  });

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-0 sm:p-3 bg-black/70 backdrop-blur-md animate-in fade-in">
      <motion.div
        ref={modalRef}
        initial={{ opacity: 0, scale: 0.96 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.96 }}
        className="w-full max-w-xl h-full sm:h-[95vh] max-h-[96vh] flex flex-col bg-[#111116] border border-[#2a2a38] rounded-t-3xl sm:rounded-3xl shadow-2xl relative overflow-hidden"
      >
        {/* Top Drag Handle & Header */}
        <div className="shrink-0 flex flex-col border-b border-white/10 bg-[#17212b]/95 backdrop-blur-md z-20">
          <div className="w-12 h-1 bg-white/20 rounded-full mx-auto my-1.5 cursor-grab" />
          <div className="flex justify-between items-center px-4 py-2">
            <div className="flex items-center gap-2.5">
              <button
                onClick={() => {
                  triggerHaptic("medium");
                  if (onOpenSettings) onOpenSettings();
                  else setActiveTab("settings");
                }}
                className="px-3.5 py-1.5 rounded-2xl text-xs font-semibold flex items-center justify-center gap-1.5 bg-[#182332] text-gray-300 hover:text-white hover:bg-[#202e42] transition-all active:scale-95 cursor-pointer shrink-0 border border-white/5"
                title="Настройки (Три полоски)"
              >
                <Menu className="w-4 h-4 text-gray-200" />
              </button>
              <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-blue-500 to-purple-600 flex items-center justify-center text-white shadow-md">
                <User className="w-4 h-4" />
              </div>
              <div>
                <h2 className="text-white font-semibold text-sm leading-tight flex items-center gap-1.5">
                  Профиль аккаунта
                  {selectedBadge && <span className="text-sm">{selectedBadge}</span>}
                  {selectedStickerBadge && (
                    <img src={selectedStickerBadge} alt="" className="w-4 h-4 object-contain inline-block" />
                  )}
                </h2>
                <span className="text-[11px] text-gray-400 font-mono">
                  {profile?.username ? `@${profile.username}` : "Telegram User"}
                </span>
              </div>
            </div>
            <button
              onClick={() => {
                triggerHaptic("light");
                onClose();
              }}
              className="p-1.5 rounded-xl text-gray-400 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Categories: Профиль | Файлы | Подарки (NFT) | Настройки */}
        <div className="flex items-center gap-1.5 px-3 sm:px-4 py-2 bg-[#0e1621] border-b border-white/5 shrink-0 z-10 overflow-x-auto no-scrollbar">
          <button
            onClick={() => {
              triggerHaptic("medium");
              if (onOpenSettings) onOpenSettings();
              else setActiveTab("settings");
            }}
            className="px-3.5 py-1.5 rounded-2xl text-xs font-semibold flex items-center justify-center gap-1.5 bg-[#182332] text-gray-300 hover:text-white hover:bg-[#202e42] transition-all active:scale-95 cursor-pointer shrink-0 border border-white/5"
            title="Настройки (Три полоски)"
          >
            <Menu className="w-4 h-4 text-gray-200" />
          </button>
          <button
            onClick={() => {
              triggerHaptic("light");
              setActiveTab("profile");
            }}
            className={`flex-1 min-w-[70px] py-1.5 rounded-full text-xs font-medium flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
              activeTab === "profile"
                ? "bg-[#2481cc] text-white shadow-sm font-semibold"
                : "text-gray-400 hover:text-gray-200 hover:bg-white/5"
            }`}
          >
            <User className="w-3.5 h-3.5" />
            Профиль
          </button>

          <button
            onClick={() => {
              triggerHaptic("light");
              setActiveTab("gifts");
            }}
            className={`flex-1 min-w-[85px] py-1.5 rounded-full text-xs font-medium flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
              activeTab === "gifts"
                ? "bg-gradient-to-r from-amber-500 via-yellow-500 to-amber-600 text-black font-bold shadow-md shadow-amber-500/20"
                : "text-amber-400 hover:text-amber-300 hover:bg-amber-400/10"
            }`}
          >
            <Gift className="w-3.5 h-3.5" />
            <span>Подарки</span>
            {realGifts.length > 0 ? (
              <span className="text-[10px] px-1.5 py-0.2 bg-amber-400/30 text-amber-200 rounded-full font-bold">
                {realGifts.length}
              </span>
            ) : (
              <span className="text-[9px] px-1 py-0.2 bg-black/40 text-amber-300 rounded font-mono">NFT</span>
            )}
          </button>

          <button
            onClick={() => {
              triggerHaptic("light");
              setActiveTab("settings");
            }}
            className={`flex-1 min-w-[75px] py-1.5 rounded-full text-xs font-medium flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
              activeTab === "settings"
                ? "bg-[#2481cc] text-white shadow-sm font-semibold"
                : "text-gray-400 hover:text-gray-200 hover:bg-white/5"
            }`}
          >
            <Settings className="w-3.5 h-3.5" />
            Настройки
          </button>
        </div>

        {/* Offline Network Warning Banner */}
        {!isOnline && (
          <div className="bg-amber-500/20 border-b border-amber-500/30 px-4 py-2 flex items-center justify-between text-xs text-amber-200 animate-pulse shrink-0">
            <div className="flex items-center gap-2">
              <RefreshCw className="w-3.5 h-3.5 animate-spin text-amber-400" />
              <span>Ожидание сети... Нет подключения к интернету</span>
            </div>
            <span className="text-[10px] bg-black/40 px-2 py-0.5 rounded text-amber-300 font-mono">Offline</span>
          </div>
        )}

        {/* Scrollable Body Content */}
        <div 
          onTouchStart={(e) => {
            touchStartYRef.current = e.touches[0].clientY;
          }}
          onTouchMove={(e) => {
            if (touchStartYRef.current !== null) {
              const dy = e.touches[0].clientY - touchStartYRef.current;
              if (dy > 25 && (e.currentTarget.scrollTop <= 5 || isPhotoExpanded)) {
                setProfilePullY(dy);
              }
            }
          }}
          onTouchEnd={() => {
            if (profilePullY > 40) {
              triggerHaptic("medium");
              setIsPhotoExpanded(true);
            }
            setProfilePullY(0);
            touchStartYRef.current = null;
          }}
          className="flex-1 overflow-y-auto custom-scrollbar"
        >
          {/* TAB 1: ПРОФИЛЬ */}
          {activeTab === "profile" && (
            <div className="space-y-4 pb-6">
              {/* Profile Hero Avatar Area with Fluid Morphing between Square (Half-Screen) and Round Avatar Banner */}
              {isPhotoExpanded ? (
                /* FULL-WIDTH SQUARE AVATAR VIEW (Half-Screen height, aspect-square) */
                <motion.div
                  layout
                  initial={{ opacity: 0, scale: 0.98 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.98 }}
                  transition={{ duration: 0.05, ease: [0.15, 0.85, 0.35, 1] }}
                  className="w-full aspect-square relative flex items-center justify-center cursor-pointer bg-black select-none overflow-hidden touch-pan-y shadow-2xl transition-all duration-50 ease-out"
                  onClick={() => {
                    triggerHaptic("light");
                    setIsPhotoExpanded(false);
                  }}
                  onTouchStart={(e) => {
                    touchStartYRef.current = e.touches[0].clientY;
                  }}
                  onTouchEnd={(e) => {
                    if (touchStartYRef.current !== null) {
                      const dy = e.changedTouches[0].clientY - touchStartYRef.current;
                      if (dy < -20) {
                        // Слегка смахнуть вверх чтобы вернуть обратно в круг
                        triggerHaptic("medium");
                        setIsPhotoExpanded(false);
                      }
                    }
                    touchStartYRef.current = null;
                  }}
                  title="Нажмите или смахните вверх, чтобы свернуть в круг"
                >
                  {profile?.id && (
                    <>
                      {hasVideo && (
                        <video
                          src={`/api/telegram/avatar/${profile.id}?video=1`}
                          autoPlay
                          loop
                          muted
                          playsInline
                          className="w-full h-full object-cover absolute inset-0 z-0 pointer-events-none"
                          onError={() => setHasVideo(false)}
                        />
                      )}
                      <img
                        src={`/api/telegram/avatar/${profile.id}?t=${avatarBust}`}
                        alt="avatar"
                        className="w-full h-full object-cover absolute inset-0 z-0 pointer-events-none"
                        onError={(e) => (e.currentTarget.style.display = "none")}
                      />
                    </>
                  )}
                  <span className="text-6xl font-bold text-white -z-10">
                    {firstName ? firstName.charAt(0).toUpperCase() : "U"}
                  </span>

                  {/* Dark gradient backdrop in corner */}
                  <div className="absolute inset-x-0 bottom-0 h-36 bg-gradient-to-t from-black/90 via-black/40 to-transparent pointer-events-none z-10" />

                  {/* Swipe up hint pill at top */}
                  <div className="absolute top-3 inset-x-0 flex justify-center pointer-events-none z-20">
                    <div className="bg-black/60 backdrop-blur-md px-3.5 py-1 rounded-full text-xs text-white/90 flex items-center gap-1.5 shadow-lg border border-white/10">
                      <ChevronUp className="w-3.5 h-3.5 text-sky-400 animate-bounce" />
                      <span>Смахните вверх, чтобы свернуть в круг</span>
                    </div>
                  </div>

                  {/* Name and badge positioned at bottom-left corner of the square */}
                  <motion.div
                    layoutId="profile-modal-user-corner-name"
                    initial={{ opacity: 0, y: 15 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: 15 }}
                    transition={{ type: "spring", stiffness: 380, damping: 28 }}
                    className="absolute bottom-4 left-4 right-4 z-20 text-left pointer-events-none"
                  >
                    <div className="flex items-center gap-2">
                      <h2 className="text-2xl font-bold text-white drop-shadow-xl truncate">
                        {firstName} {lastName}
                      </h2>
                      {selectedBadge && <span className="text-base">{selectedBadge}</span>}
                      {selectedStickerBadge && (
                        <img src={selectedStickerBadge} alt="" className="w-5 h-5 object-contain inline-block" />
                      )}
                      <CheckCircle2 className="w-5 h-5 text-blue-400 fill-blue-400 shrink-0 inline" />
                    </div>
                    <span className="text-xs text-sky-300 font-mono drop-shadow-md">
                      {profile?.username ? `@${profile.username}` : "Telegram User"}
                    </span>
                  </motion.div>
                </motion.div>
              ) : (
                /* NORMAL PROFILE BACKGROUND BANNER WITH CIRCLE AVATAR */
                <motion.div
                  layout
                  className={`relative min-h-[180px] bg-gradient-to-tr ${activeThemeObj.gradient} overflow-hidden shadow-inner flex flex-col justify-end p-4 transition-all duration-50 select-none`}
                >
                  {/* Decorative Background Pattern / Floating Gifts */}
                  {activePatternObj.id !== "none" && (
                    <div className="absolute inset-0 pointer-events-none select-none opacity-25 overflow-hidden flex flex-wrap gap-6 p-4 justify-around items-center">
                      {Array.from({ length: 18 }).map((_, i) => (
                        <span
                          key={i}
                          className="text-2xl transform rotate-12 filter drop-shadow animate-pulse"
                          style={{ animationDelay: `${i * 180}ms` }}
                        >
                          {activePatternObj.icon}
                        </span>
                      ))}
                    </div>
                  )}

                  {/* Banner Customization Toolbar */}
                  <div className="absolute top-3 right-3 flex items-center gap-1.5 z-10">
                    {/* Theme Color Palette */}
                    <div className="flex items-center gap-1 bg-black/40 backdrop-blur-md p-1 rounded-full border border-white/10">
                      {BANNER_THEMES.map((theme) => (
                        <button
                          key={theme.id}
                          onClick={() => updateBannerTheme(theme.id)}
                          className={`w-5 h-5 rounded-full bg-gradient-to-tr ${theme.gradient} border transition-all ${
                            bannerTheme === theme.id
                              ? "scale-110 border-white ring-2 ring-white/50"
                              : "border-transparent opacity-70 hover:opacity-100"
                          }`}
                          title={theme.name}
                        />
                      ))}
                    </div>

                    {/* Pattern Picker Button */}
                    <div className="relative group">
                      <button
                        className="px-2 py-1 bg-black/40 backdrop-blur-md rounded-full text-xs text-white border border-white/10 flex items-center gap-1 hover:bg-black/60"
                        title="Фоновые узоры"
                      >
                        <Sparkles className="w-3 h-3 text-amber-300" />
                        <span>{activePatternObj.icon}</span>
                      </button>
                      <div className="absolute right-0 top-full mt-1 hidden group-hover:flex flex-col bg-[#17212b] border border-white/10 rounded-xl p-1 shadow-xl z-30 min-w-[130px]">
                        {BANNER_PATTERNS.map((pat) => (
                          <button
                            key={pat.id}
                            onClick={() => updateBannerPattern(pat.id)}
                            className="px-2 py-1 text-xs text-left text-gray-200 hover:bg-white/10 rounded-lg flex items-center justify-between"
                          >
                            <span>{pat.name}</span>
                            <span>{pat.icon}</span>
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* Avatar with Blue-Violet Gradient Frame */}
                  <div className="relative z-10 flex items-end gap-3.5">
                    <div 
                      ref={avatarContainerRef} 
                      className="relative group cursor-pointer"
                      onClick={() => {
                        triggerHaptic("medium");
                        setIsPhotoExpanded(true);
                      }}
                      title="Свайпните вниз или нажмите, чтобы открыть квадратное фото"
                    >
                      <div className="p-[3.5px] rounded-full bg-gradient-to-tr from-[#2481cc] via-[#7c3aed] to-[#a855f7] shadow-[0_0_18px_rgba(124,58,237,0.6)] ring-2 ring-purple-500/40">
                        <div className="w-22 h-22 rounded-full overflow-hidden bg-[#181824] relative shadow-2xl flex items-center justify-center">
                          {profile?.id && (
                            <>
                              {hasVideo && (
                                <video
                                  src={`/api/telegram/avatar/${profile.id}?video=1`}
                                  autoPlay
                                  loop
                                  muted
                                  playsInline
                                  className="w-full h-full object-cover absolute inset-0 z-10"
                                  onError={() => setHasVideo(false)}
                                />
                              )}
                              <img
                                src={`/api/telegram/avatar/${profile.id}?t=${avatarBust}`}
                                alt="avatar"
                                className="w-full h-full object-cover absolute inset-0 z-0"
                                onError={(e) => (e.currentTarget.style.display = "none")}
                              />
                            </>
                          )}
                          <span className="text-2xl font-bold text-white">
                            {firstName ? firstName.charAt(0).toUpperCase() : "U"}
                          </span>
                        </div>
                      </div>

                      <label
                        className="absolute bottom-0 right-0 w-7 h-7 bg-[#2481cc] hover:bg-blue-500 rounded-full flex items-center justify-center cursor-pointer shadow-lg border-2 border-[#111116] z-20 hover:scale-110 transition-transform"
                        title="Сменить аватарку"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <Edit2 className="w-3.5 h-3.5 text-white" />
                        <input type="file" accept="image/*,video/*" className="hidden" onChange={handleAvatarChange} />
                      </label>
                    </div>

                    {/* Name, Status Badge & Verified */}
                    <motion.div
                      layoutId="profile-modal-user-corner-name"
                      transition={{ type: "spring", stiffness: 380, damping: 28 }}
                      className="flex-1 min-w-0 pb-1"
                    >
                      <div className="flex items-center gap-2">
                        <h2 className="text-xl font-bold text-white truncate drop-shadow-md">
                          {firstName} {lastName}
                        </h2>
                        <button
                          onClick={() => setShowBadgePicker(true)}
                          className="px-2 py-0.5 rounded-full bg-black/40 hover:bg-black/60 border border-white/20 text-white text-sm flex items-center gap-1 transition-transform active:scale-95 cursor-pointer shadow"
                          title="Выбрать статус-значок"
                        >
                          {selectedBadge && <span>{selectedBadge}</span>}
                          {selectedStickerBadge && (
                            <img src={selectedStickerBadge} alt="" className="w-4 h-4 object-contain inline-block" />
                          )}
                          {!selectedBadge && !selectedStickerBadge && <Smile className="w-3.5 h-3.5 text-amber-300" />}
                        </button>
                        <CheckCircle2 className="w-4 h-4 text-[#2481cc] fill-[#2481cc] text-white shrink-0" />
                      </div>

                    {/* Dynamic Client Indicator under avatar */}
                    <div className="relative mt-1.5 mb-1 flex items-center gap-1.5 flex-wrap">
                      <button
                        type="button"
                        onClick={() => {
                          const next: TelegramClientType = userClientType === "nexusgram" ? "ayugram" : "nexusgram";
                          setUserClientType(next);
                          setCurrentUserClient(next);
                          triggerHaptic("medium");
                        }}
                        className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold border shadow-md transition-all active:scale-95 cursor-pointer backdrop-blur-sm ${
                          userClientType === "ayugram"
                            ? "bg-gradient-to-r from-purple-600/35 via-violet-600/30 to-fuchsia-600/35 border-purple-400/60 text-purple-200 shadow-purple-500/25 ring-1 ring-purple-400/30"
                            : "bg-gradient-to-r from-cyan-600/35 via-blue-600/30 to-indigo-600/35 border-cyan-400/60 text-cyan-200 shadow-cyan-500/25 ring-1 ring-cyan-400/30"
                        }`}
                        title="Нажмите для переключения подписи клиента (AyuGram / Nexusgram)"
                      >
                        <span className="text-sm">{userClientType === "ayugram" ? "🔮" : "⚡"}</span>
                        <span>{userClientType === "ayugram" ? "Использует клиент AyuGram" : "Использует клиент Nexusgram"}</span>
                      </button>
                    </div>

                    <p className="text-xs text-blue-200/90 font-mono drop-shadow">
                      {profile?.username ? `@${profile.username}` : "@telegram"}
                    </p>

                    {/* Pinned Real NFT Gift Showcase Badge */}
                    {pinnedNft && (
                      <div
                        onClick={() => setSelectedNft(pinnedNft)}
                        className="mt-1.5 inline-flex items-center gap-2 px-3 py-1 rounded-full bg-gradient-to-r from-amber-500/25 via-purple-600/25 to-blue-500/25 border border-amber-400/50 backdrop-blur-md cursor-pointer hover:border-amber-300 transition-all shadow-md group"
                        title="Закрепленный коллекционный NFT подарок"
                      >
                        <span className="text-base group-hover:scale-110 transition-transform">{pinnedNft.icon}</span>
                        <div className="flex flex-col">
                          <div className="flex items-center gap-1.5 leading-none">
                            <span className="text-xs font-bold text-amber-200">{pinnedNft.name}</span>
                            <span className="text-[10px] font-mono text-amber-300 bg-black/50 px-1 py-0.2 rounded">
                              {pinnedNft.number}
                            </span>
                          </div>
                        </div>
                        <span className="text-[9px] font-extrabold uppercase px-1.5 py-0.5 rounded-full bg-amber-400 text-black">
                          NFT
                        </span>
                      </div>
                    )}
                  </motion.div>
                </div>
              </motion.div>
            )}

              {/* Stories Section in Profile */}
              <div className="mx-4 p-4 rounded-2xl bg-[#17212b] border border-[#242f3d] space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Sparkles className="w-4 h-4 text-indigo-400" />
                    <span className="text-sm font-semibold text-white">Истории профиля</span>
                    <span className="text-xs px-2 py-0.5 rounded-full bg-indigo-500/20 text-indigo-300 font-mono">
                      {myStories.length}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    {myStories.length > 0 && (
                      <button
                        type="button"
                        onClick={() => {
                          triggerHaptic("light");
                          setViewingStoryIdx(0);
                        }}
                        className="text-xs font-semibold text-indigo-400 hover:text-indigo-300 flex items-center gap-1 px-2.5 py-1 rounded-lg bg-indigo-500/10 hover:bg-indigo-500/20 transition-all cursor-pointer"
                      >
                        Все истории <ChevronRight className="w-3.5 h-3.5" />
                      </button>
                    )}
                    <button
                      type="button"
                      onClick={() => {
                        triggerHaptic("medium");
                        setShowCreateStory(true);
                      }}
                      className="px-3 py-1 bg-indigo-600 hover:bg-indigo-500 text-white rounded-full text-xs font-medium flex items-center gap-1 cursor-pointer transition-transform active:scale-95 shadow"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span>Опубликовать</span>
                    </button>
                  </div>
                </div>

                {myStories.length === 0 ? (
                  <div className="py-3 text-center">
                    <p className="text-xs text-gray-400">У вас пока нет историй</p>
                    <button
                      type="button"
                      onClick={() => setShowCreateStory(true)}
                      className="mt-1.5 text-xs text-sky-400 hover:text-sky-300 font-medium cursor-pointer"
                    >
                      + Создать первую историю
                    </button>
                  </div>
                ) : (
                  <div className="flex items-center gap-3 overflow-x-auto py-1 scrollbar-hide">
                    {myStories.map((story, sIdx) => (
                      <div
                        key={story.id || sIdx}
                        onClick={() => {
                          triggerHaptic("medium");
                          setViewingStoryIdx(sIdx);
                        }}
                        className="flex flex-col items-center gap-1.5 cursor-pointer shrink-0"
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
                        <span className="text-[10px] text-gray-300 max-w-[62px] truncate text-center font-medium">
                          {story.caption || story.timeAgo || "История"}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Status Badge & Sticker Picker Modal */}
              {showBadgePicker && (
                <div className="mx-4 p-4 bg-[#17212b] border border-white/10 rounded-2xl space-y-3">
                  <div className="flex justify-between items-center">
                    <h4 className="text-xs font-bold text-gray-300 uppercase tracking-wider flex items-center gap-1.5">
                      <Sparkles className="w-4 h-4 text-amber-400" /> Выберите значок статуса Telegram
                    </h4>
                    <button onClick={() => setShowBadgePicker(false)} className="text-gray-400 hover:text-white">
                      <X className="w-4 h-4" />
                    </button>
                  </div>

                  <div className="flex flex-wrap gap-2">
                    {PRESET_BADGES.map((b) => (
                      <button
                        key={b.id}
                        onClick={() => selectStatusBadge(b.emoji)}
                        className={`px-3 py-1.5 rounded-xl text-xs flex items-center gap-1.5 border transition-all cursor-pointer ${
                          selectedBadge === b.emoji
                            ? "bg-[#2481cc] text-white border-blue-400 shadow-sm"
                            : "bg-[#111116] border-white/5 text-gray-300 hover:bg-white/10"
                        }`}
                      >
                        <span>{b.emoji || "❌"}</span>
                        <span>{b.name}</span>
                      </button>
                    ))}
                  </div>

                  {stickers.length > 0 && (
                    <div className="pt-2 border-t border-white/5">
                      <p className="text-[11px] text-gray-400 mb-2">Или выберите премиальный анимированный эмодзи:</p>
                      <div className="grid grid-cols-6 gap-2 max-h-40 overflow-y-auto no-scrollbar">
                        {stickers.map((st, i) => (
                          <button
                            key={i}
                            onClick={() => selectStickerStatusBadge(st.thumbUrl || st.url)}
                            className="p-1.5 bg-[#111116] hover:bg-white/10 rounded-xl border border-white/5 flex items-center justify-center hover:scale-110 transition-transform cursor-pointer"
                          >
                            <img src={st.thumbUrl || st.url} alt="" className="w-7 h-7 object-contain" />
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Bio & Phone Cards */}
              <div className="px-4 space-y-2.5">
                <div className="p-3.5 bg-[#17212b] border border-white/5 rounded-2xl space-y-1">
                  <span className="text-[11px] text-gray-400 font-medium">О себе</span>
                  <p className="text-sm text-gray-100 whitespace-pre-wrap leading-relaxed">
                    {about || "Напишите что-нибудь о себе в настройках..."}
                  </p>
                </div>

                <div className="p-3.5 bg-[#17212b] border border-white/5 rounded-2xl flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-blue-400">
                      <Phone className="w-4 h-4" />
                    </div>
                    <div>
                      <span className="text-[10px] text-gray-400 uppercase tracking-wider block font-semibold">Телефон</span>
                      <span className="text-sm font-mono text-gray-100">{phone || "+7 (999) 000-00-00"}</span>
                    </div>
                  </div>
                  <span className="text-xs text-gray-400 bg-white/5 px-2.5 py-1 rounded-lg">Личный</span>
                </div>

                {/* Личная приватная заметка к профилю (только для личного пользования) */}
                <div className="p-3.5 bg-gradient-to-br from-[#17212b] to-[#141b24] border border-amber-500/20 rounded-2xl space-y-2 relative shadow-sm">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="w-7 h-7 rounded-lg bg-amber-400/10 border border-amber-400/20 flex items-center justify-center text-amber-400">
                        <StickyNote className="w-3.5 h-3.5" />
                      </div>
                      <div>
                        <span className="text-xs font-semibold text-amber-400 flex items-center gap-1.5">
                          Личная заметка к профилю
                          <span className="text-[10px] px-1.5 py-0.2 rounded bg-amber-400/20 text-amber-300 font-normal">Приватно</span>
                        </span>
                        <span className="text-[10px] text-gray-400 block">Уникальна и доступна только вам на этом устройстве</span>
                      </div>
                    </div>
                    {!isEditingPersonalNote && (
                      <button
                        onClick={() => setIsEditingPersonalNote(true)}
                        className="text-xs text-[#2481cc] hover:underline cursor-pointer font-medium"
                      >
                        {personalNote ? "Изменить" : "+ Заметка"}
                      </button>
                    )}
                  </div>

                  {isEditingPersonalNote ? (
                    <div className="space-y-2 pt-1">
                      <textarea
                        value={personalNote}
                        onChange={(e) => setPersonalNote(e.target.value)}
                        placeholder="Напишите личную заметку для себя (пароли, напоминания, мысли)... Никто кроме вас её не увидит."
                        className="w-full bg-[#101720] border border-amber-500/30 text-white rounded-xl p-3 text-xs focus:outline-none min-h-[70px] resize-none"
                      />
                      <div className="flex justify-end gap-2">
                        <button
                          onClick={() => {
                            setPersonalNote(localStorage.getItem("nexus_personal_profile_note") || "");
                            setIsEditingPersonalNote(false);
                          }}
                          className="px-3 py-1 rounded-lg text-xs text-gray-400 hover:text-white bg-white/5 cursor-pointer"
                        >
                          Отмена
                        </button>
                        <button
                          onClick={() => {
                            localStorage.setItem("nexus_personal_profile_note", personalNote.trim());
                            setIsEditingPersonalNote(false);
                            triggerHaptic("medium");
                          }}
                          className="px-3 py-1 rounded-lg text-xs font-medium text-black bg-amber-400 hover:bg-amber-300 cursor-pointer"
                        >
                          Сохранить
                        </button>
                      </div>
                    </div>
                  ) : (
                    personalNote ? (
                      <p className="text-xs text-gray-200 whitespace-pre-wrap leading-relaxed bg-[#101720]/60 p-2.5 rounded-xl border border-white/5 font-mono">
                        {personalNote}
                      </p>
                    ) : (
                      <p className="text-[11px] text-gray-500 italic">
                        Заметка не добавлена. Вы можете сохранить любую личную информацию только для себя.
                      </p>
                    )
                  )}
                </div>
              </div>

              {/* Real-time Gifts Showcase on Profile */}
              <div className="mx-4 p-4 bg-gradient-to-br from-[#1a2332] to-[#121924] border border-amber-500/25 rounded-2xl space-y-3 relative overflow-hidden shadow-lg">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-xl bg-amber-400/15 border border-amber-400/25 flex items-center justify-center text-amber-400 shadow-inner">
                      <Gift className="w-4 h-4" />
                    </div>
                    <div>
                      <h4 className="text-xs font-bold text-white flex items-center gap-1.5">
                        Подарки профиля
                        <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 flex items-center gap-1">
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping" />
                          Live
                        </span>
                      </h4>
                      <span className="text-[11px] text-gray-400">
                        {realGifts.length > 0 ? `Получено подарков: ${realGifts.length}` : "Официальные подарки Telegram и NFT"}
                      </span>
                    </div>
                  </div>
                  <button
                    onClick={() => {
                      triggerHaptic("light");
                      setActiveTab("gifts");
                    }}
                    className="text-xs font-semibold text-amber-400 hover:text-amber-300 flex items-center gap-1 px-2.5 py-1 rounded-lg bg-amber-400/10 hover:bg-amber-400/20 transition-all cursor-pointer"
                  >
                    Все подарки <ChevronRight className="w-3.5 h-3.5" />
                  </button>
                </div>

                {loadingRealGifts ? (
                  <div className="py-4 flex items-center justify-center gap-2 text-xs text-gray-400">
                    <Loader2 className="w-4 h-4 animate-spin text-amber-400" />
                    <span>Синхронизация подарков Telegram...</span>
                  </div>
                ) : realGifts.length > 0 ? (
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5 pt-1">
                    {realGifts.slice(0, 6).map((g: any, idx: number) => (
                      <div
                        key={g.id || idx}
                        onClick={() => {
                          triggerHaptic("light");
                          setActiveTab("gifts");
                        }}
                        className="p-2.5 rounded-xl bg-[#131922] border border-amber-400/20 hover:border-amber-400/40 transition-all flex flex-col items-center text-center cursor-pointer group hover:scale-[1.02]"
                      >
                        <div className="w-12 h-12 rounded-xl bg-amber-400/10 flex items-center justify-center text-2xl mb-1.5 group-hover:rotate-6 transition-transform">
                          {g.emoji || "🎁"}
                        </div>
                        <span className="text-xs font-bold text-gray-100 truncate w-full">
                          {g.title || `Подарок #${g.num || idx + 1}`}
                        </span>
                        <span className="text-[10px] text-amber-300 font-mono mt-0.5">
                          {g.stars ? `⭐️ ${g.stars}` : "NFT"}
                        </span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="p-3 rounded-xl bg-black/20 border border-white/5 flex items-center justify-between">
                    <div className="flex items-center gap-2.5 text-gray-300 text-xs">
                      <Sparkles className="w-4 h-4 text-amber-400 shrink-0" />
                      <span>У вас пока нет активных подарков в этом профиле</span>
                    </div>
                    <button
                      onClick={() => {
                        triggerHaptic("light");
                        setActiveTab("gifts");
                      }}
                      className="px-2.5 py-1 bg-gradient-to-r from-amber-500 to-yellow-500 text-black text-xs font-bold rounded-lg shrink-0 cursor-pointer font-semibold"
                    >
                      Каталог NFT
                    </button>
                  </div>
                )}
              </div>

              {/* Multi-Account Switching Card */}
              <div className="mx-4 p-4 bg-[#17212b] border border-white/5 rounded-2xl space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <ArrowLeftRight className="w-4 h-4 text-[#2481cc]" />
                    <h3 className="text-sm font-bold text-white">Переключение аккаунтов</h3>
                  </div>
                  <button
                    onClick={() => {
                      resetAuthFields();
                      setShowAddAccountModal(true);
                    }}
                    className="px-3 py-1 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-semibold flex items-center gap-1 shadow transition-all cursor-pointer"
                  >
                    <Plus className="w-3.5 h-3.5" /> Добавить
                  </button>
                </div>

                {/* Accounts List */}
                <div className="space-y-2">
                  {accounts.map((acc) => (
                    <div
                      key={acc.id}
                      onClick={() => handleSwitchAccount(acc)}
                      className={`p-2.5 rounded-xl border flex items-center justify-between cursor-pointer transition-all ${
                        acc.isActive
                          ? "bg-blue-500/15 border-blue-500/50 text-white shadow-sm"
                          : "bg-[#111116] border-white/5 hover:border-white/20 text-gray-300"
                      }`}
                    >
                      <div className="flex items-center gap-2.5">
                        <div className="w-9 h-9 rounded-full bg-gradient-to-tr from-blue-500 to-indigo-600 flex items-center justify-center text-white font-bold text-sm overflow-hidden">
                          {acc.name ? acc.name.charAt(0).toUpperCase() : "A"}
                        </div>
                        <div>
                          <div className="flex items-center gap-1.5">
                            <span className="text-xs font-bold text-white">{acc.name}</span>
                            {acc.isActive && (
                              <span className="text-[10px] px-1.5 py-0.2 bg-blue-500 text-white rounded-full font-semibold">
                                Активен
                              </span>
                            )}
                          </div>
                          <span className="text-[11px] text-gray-400 font-mono block">
                            {acc.phone || (acc.username ? `@${acc.username}` : "Telegram")}
                          </span>
                        </div>
                      </div>
                      <ChevronRight className="w-4 h-4 text-gray-400" />
                    </div>
                  ))}
                </div>
              </div>

              {/* Add Account Modal Wizard */}
              {showAddAccountModal && (
                <div className="mx-4 p-4 bg-[#1c2733] border border-indigo-500/50 rounded-2xl space-y-3 shadow-xl animate-in slide-in-from-top-2">
                  <div className="flex items-center justify-between">
                    <h4 className="text-sm font-bold text-white flex items-center gap-2">
                      <Plus className="w-4 h-4 text-indigo-400" /> Вход в новый аккаунт Telegram
                    </h4>
                    <button onClick={() => setShowAddAccountModal(false)} className="text-gray-400 hover:text-white">
                      <X className="w-4 h-4" />
                    </button>
                  </div>

                  {authError && (
                    <div className="p-2.5 bg-red-500/15 border border-red-500/30 rounded-xl text-xs text-red-300">
                      {authError}
                    </div>
                  )}

                  {/* Wizard Mode Tabs */}
                  <div className="flex gap-2 p-1 bg-black/40 rounded-xl">
                    <button
                      type="button"
                      onClick={() => setAuthStep("phone")}
                      className={`flex-1 py-1 rounded-lg text-xs font-medium ${
                        authStep !== "session" ? "bg-indigo-600 text-white" : "text-gray-400 hover:text-white"
                      }`}
                    >
                      По телефону
                    </button>
                    <button
                      type="button"
                      onClick={() => setAuthStep("session")}
                      className={`flex-1 py-1 rounded-lg text-xs font-medium ${
                        authStep === "session" ? "bg-indigo-600 text-white" : "text-gray-400 hover:text-white"
                      }`}
                    >
                      По строке сессии
                    </button>
                  </div>

                  {/* Step 1: Phone input with detected country flag */}
                  {authStep === "phone" && (
                    <form onSubmit={handleSendCode} className="space-y-3">
                      {(() => {
                        const detected = detectCountryByPhone(authPhone);
                        return (
                          <div className="relative flex items-center">
                            <div className="absolute left-3 flex items-center gap-1.5 pointer-events-none select-none z-10">
                              <span className="text-lg">{detected.flag}</span>
                              {detected.code !== "UN" && (
                                <span className="text-xs font-mono font-semibold text-gray-400">
                                  {detected.dialCode}
                                </span>
                              )}
                            </div>
                            <input
                              type="tel"
                              placeholder="+7 999 123-45-67"
                              value={authPhone}
                              onChange={(e) => setAuthPhone(e.target.value)}
                              className={`w-full bg-[#111116] border border-white/10 rounded-xl py-2.5 pr-4 text-sm text-white focus:outline-none focus:border-indigo-500 font-mono ${
                                detected.code !== "UN" ? "pl-20" : "pl-11"
                              }`}
                            />
                          </div>
                        );
                      })()}
                      <p className="text-[11px] text-gray-400 leading-snug">
                        Telegram пришлет код подтверждения в официальное приложение на телефон или компьютер.
                      </p>
                      <button
                        type="submit"
                        disabled={authLoading || !authPhone.trim()}
                        className="w-full py-2.5 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white font-semibold text-xs rounded-xl flex items-center justify-center gap-2 transition-all cursor-pointer shadow"
                      >
                        {authLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : "Получить код в Telegram"}
                      </button>
                    </form>
                  )}

                  {/* Step 2: Code input */}
                  {authStep === "code" && (
                    <form onSubmit={handleVerifyCode} className="space-y-3">
                      <div className="p-2.5 bg-blue-500/10 border border-blue-500/20 rounded-xl text-xs text-blue-300">
                        {authIsCodeViaApp ? "Код отправлен в приложение Telegram" : "Код отправлен по SMS"} на{" "}
                        <span className="font-mono font-bold">{authPhone}</span>
                      </div>
                      <input
                        type="text"
                        placeholder="Код (5 цифр)"
                        value={authCode}
                        onChange={(e) => setAuthCode(e.target.value)}
                        className="w-full bg-[#111116] border border-white/10 rounded-xl py-2.5 px-3 text-center text-lg tracking-widest text-white focus:outline-none focus:border-indigo-500 font-mono"
                      />
                      <button
                        type="submit"
                        disabled={authLoading || !authCode.trim()}
                        className="w-full py-2.5 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white font-semibold text-xs rounded-xl flex items-center justify-center gap-2 transition-all cursor-pointer shadow"
                      >
                        {authLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : "Подтвердить код"}
                      </button>
                    </form>
                  )}

                  {/* Step 3: 2FA Password input */}
                  {authStep === "2fa" && (
                    <form onSubmit={handleVerifyPassword} className="space-y-3">
                      <div className="p-2.5 bg-amber-500/10 border border-amber-500/20 rounded-xl text-xs text-amber-300">
                        Требуется двухфакторный пароль (2FA).
                        {authHint && <p className="mt-1 text-[11px] text-gray-400">Подсказка: {authHint}</p>}
                      </div>
                      <input
                        type="password"
                        placeholder="Облачный пароль 2FA"
                        value={authPassword}
                        onChange={(e) => setAuthPassword(e.target.value)}
                        className="w-full bg-[#111116] border border-white/10 rounded-xl py-2.5 px-3 text-sm text-white focus:outline-none focus:border-indigo-500"
                      />
                      <button
                        type="submit"
                        disabled={authLoading || !authPassword.trim()}
                        className="w-full py-2.5 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white font-semibold text-xs rounded-xl flex items-center justify-center gap-2 transition-all cursor-pointer shadow"
                      >
                        {authLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : "Войти с 2FA"}
                      </button>
                    </form>
                  )}

                  {/* Step Session: StringSession direct paste */}
                  {authStep === "session" && (
                    <form onSubmit={handleImportSession} className="space-y-3">
                      <input
                        type="text"
                        placeholder="Название аккаунта (например: Рабочий)"
                        value={manualAccountName}
                        onChange={(e) => setManualAccountName(e.target.value)}
                        className="w-full bg-[#111116] border border-white/10 rounded-xl py-2 px-3 text-xs text-white focus:outline-none focus:border-indigo-500"
                      />
                      <textarea
                        placeholder="Вставьте готовую строку сессии (StringSession)..."
                        value={rawSessionInput}
                        onChange={(e) => setRawSessionInput(e.target.value)}
                        className="w-full bg-[#111116] border border-white/10 rounded-xl p-2.5 text-xs text-white focus:outline-none focus:border-indigo-500 resize-none h-20 font-mono"
                      />
                      <button
                        type="submit"
                        disabled={authLoading || !rawSessionInput.trim()}
                        className="w-full py-2.5 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white font-semibold text-xs rounded-xl flex items-center justify-center gap-2 transition-all cursor-pointer shadow"
                      >
                        {authLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : "Подключить сессию"}
                      </button>
                    </form>
                  )}
                </div>
              )}
            </div>
          )}

          {/* TAB 3: ПОДАРКИ (РЕАЛЬНЫЕ И NFT НА TON) */}
          {activeTab === "gifts" && (
            <div className="p-4 space-y-4">
              {/* If user has real gifts received, show them at the top! */}
              {realGifts.length > 0 && (
                <div className="p-4 rounded-2xl bg-gradient-to-r from-amber-500/20 via-yellow-500/10 to-transparent border border-amber-400/30 space-y-2.5">
                  <div className="flex items-center justify-between">
                    <h4 className="text-xs font-bold text-amber-300 flex items-center gap-1.5 uppercase tracking-wider">
                      <Gift className="w-4 h-4 text-amber-400" /> Ваши реальные подарки в Telegram ({realGifts.length})
                    </h4>
                    <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                      Синхронизировано
                    </span>
                  </div>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                    {realGifts.map((g: any, i: number) => (
                      <div
                        key={g.id || i}
                        className="p-2.5 bg-[#121922] border border-amber-400/20 rounded-xl flex flex-col items-center text-center"
                      >
                        <span className="text-2xl mb-1">{g.emoji || "🎁"}</span>
                        <span className="text-xs font-bold text-white truncate w-full">{g.title || `Подарок #${i + 1}`}</span>
                        <span className="text-[10px] text-amber-400 mt-0.5">{g.stars ? `⭐️ ${g.stars} звёзд` : "NFT Gift"}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div>
                  <h3 className="text-base font-extrabold text-white flex items-center gap-2">
                    <Gift className="w-5 h-5 text-amber-400" /> Официальные NFT подарки Telegram
                  </h3>
                  <p className="text-xs text-gray-400">
                    Реальные коллекционные подарки на блокчейне TON с серийными номерами и атрибутами
                  </p>
                </div>
                {/* Rarity filter pills */}
                <div className="flex gap-1 bg-[#17212b] p-1 rounded-xl border border-white/5">
                  {(["all", "Legendary", "Mythic", "Rare"] as const).map((r) => (
                    <button
                      key={r}
                      onClick={() => setNftFilter(r)}
                      className={`px-2.5 py-1 rounded-lg text-[11px] font-semibold transition-all cursor-pointer ${
                        nftFilter === r ? "bg-amber-400 text-black shadow" : "text-gray-400 hover:text-white"
                      }`}
                    >
                      {r === "all" ? "Все NFT" : r}
                    </button>
                  ))}
                </div>
              </div>

              {/* Holographic NFT Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                {filteredNfts.map((nft) => {
                  const isPinned = pinnedNft?.id === nft.id;
                  return (
                    <div
                      key={nft.id}
                      onClick={() => {
                        triggerHaptic("light");
                        setSelectedNft(nft);
                      }}
                      className={`group p-4 rounded-3xl border transition-all relative overflow-hidden flex flex-col justify-between cursor-pointer transform hover:-translate-y-1 hover:shadow-2xl ${
                        isPinned
                          ? "bg-gradient-to-br from-amber-500/20 via-purple-600/15 to-stone-900 border-amber-400/60 shadow-lg ring-1 ring-amber-400/40"
                          : "bg-[#17212b] border-white/5 hover:border-white/20"
                      }`}
                    >
                      {/* Holographic reflection effect on hover */}
                      <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000 pointer-events-none" />

                      <div className="flex items-start justify-between">
                        <div
                          className={`w-14 h-14 rounded-2xl bg-gradient-to-tr ${nft.gradientBg} flex items-center justify-center text-3xl shadow-lg border border-white/10 group-hover:scale-105 transition-transform`}
                        >
                          {nft.icon}
                        </div>
                        <div className="flex flex-col items-end gap-1">
                          <span className="text-xs font-mono font-bold text-amber-300 bg-black/60 px-2 py-0.5 rounded-full border border-amber-400/30">
                            {nft.number}
                          </span>
                          <span
                            className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${nft.rarityBadgeColor}`}
                          >
                            {nft.rarity}
                          </span>
                        </div>
                      </div>

                      <div className="mt-3.5">
                        <h4 className="text-sm font-extrabold text-white group-hover:text-amber-300 transition-colors flex items-center gap-1.5">
                          {nft.name}
                          <CheckCircle2 className="w-3.5 h-3.5 text-[#2481cc] fill-[#2481cc] text-white" />
                        </h4>
                        <p className="text-[11px] text-gray-400 line-clamp-1 mt-0.5">{nft.description}</p>
                      </div>

                      {/* Floor Price & Pin Action */}
                      <div className="mt-3 pt-3 border-t border-white/10 flex items-center justify-between">
                        <div>
                          <span className="text-[10px] text-gray-400 uppercase font-semibold block">Floor Price</span>
                          <span className="text-xs font-bold text-emerald-400 font-mono">
                            {nft.tonPrice.toLocaleString()} TON{" "}
                            <span className="text-gray-400 text-[10px]">({nft.starsPrice.toLocaleString()} ⭐)</span>
                          </span>
                        </div>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handlePinNft(nft);
                          }}
                          className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer shadow ${
                            isPinned
                              ? "bg-amber-400 text-black hover:bg-amber-300"
                              : "bg-white/10 hover:bg-white/20 text-white"
                          }`}
                        >
                          {isPinned ? "В профиле ⭐" : "Закрепить"}
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* TAB 3: НАСТРОЙКИ */}
          {activeTab === "settings" && (
            <div className="p-4 space-y-4">
              {resetStatus && (
                <div className="p-3 bg-emerald-500/15 border border-emerald-500/30 rounded-2xl text-xs text-emerald-300 flex items-center gap-2">
                  <Check className="w-4 h-4 text-emerald-400 shrink-0" />
                  <span>{resetStatus}</span>
                </div>
              )}

              {/* Profile Editing form */}
              <div className="bg-[#17212b] border border-white/5 rounded-2xl p-4 space-y-3">
                <h4 className="text-xs font-semibold text-gray-300 uppercase tracking-wider">Редактирование профиля</h4>
                <div>
                  <label className="text-xs text-gray-400 mb-1 block">Имя</label>
                  <input
                    type="text"
                    value={firstName}
                    onChange={(e) => setFirstName(e.target.value)}
                    className="w-full bg-[#111116] border border-[#2a2a38] rounded-xl px-3 py-2 text-white text-sm outline-none focus:border-blue-500/50"
                  />
                </div>
                <div>
                  <label className="text-xs text-gray-400 mb-1 block">Фамилия</label>
                  <input
                    type="text"
                    value={lastName}
                    onChange={(e) => setLastName(e.target.value)}
                    className="w-full bg-[#111116] border border-[#2a2a38] rounded-xl px-3 py-2 text-white text-sm outline-none focus:border-blue-500/50"
                  />
                </div>
                <div>
                  <label className="text-xs text-gray-400 mb-1 block">О себе / Bio</label>
                  <textarea
                    value={about}
                    onChange={(e) => setAbout(e.target.value)}
                    className="w-full bg-[#111116] border border-[#2a2a38] rounded-xl px-3 py-2 text-white text-sm outline-none focus:border-blue-500/50 resize-none h-20"
                  />
                </div>
                <button
                  onClick={handleSaveProfile}
                  disabled={saving}
                  className="w-full py-2.5 bg-[#2481cc] hover:bg-blue-500 text-white font-semibold text-sm rounded-xl transition-all shadow cursor-pointer disabled:opacity-50"
                >
                  {saving ? "Сохранение..." : "Сохранить данные профиля"}
                </button>
              </div>

              {/* Public Link Card */}
              <div className="bg-[#17212b] border border-indigo-500/20 rounded-2xl p-3.5 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-indigo-400 flex items-center gap-1.5">
                    <Share2 className="w-3.5 h-3.5" /> Публичная ссылка
                  </span>
                  <button
                    type="button"
                    onClick={handleCopyLink}
                    className="px-2.5 py-1 bg-indigo-600/20 hover:bg-indigo-600/30 text-indigo-300 rounded-lg text-[11px] font-medium flex items-center gap-1 transition-all cursor-pointer border border-indigo-500/30"
                  >
                    {copiedLink ? <><Check className="w-3 h-3" /> Скопировано</> : <><Copy className="w-3 h-3" /> Копировать</>}
                  </button>
                </div>
                <p className="text-[11px] text-gray-400 leading-snug">
                  Поделитесь ссылкой на ваш веб-клиент Nexusgram для быстрого доступа с любого устройства.
                </p>
              </div>

              {/* Telegram Session Storage */}
              <div className="bg-[#17212b] border border-white/5 rounded-2xl p-3.5 space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Key className="w-3.5 h-3.5 text-emerald-400" />
                    <span className="text-xs font-semibold text-gray-300">Telegram StringSession</span>
                  </div>
                  {sessionStr && (
                    <button
                      type="button"
                      onClick={handleCopySession}
                      className="px-2.5 py-1 bg-[#222230] hover:bg-[#2a2a3c] text-gray-300 hover:text-white rounded-lg text-[11px] font-medium flex items-center gap-1 transition-all cursor-pointer border border-white/5"
                    >
                      {copiedSession ? <><Check className="w-3 h-3 text-emerald-400" /> Скопировано</> : <><Copy className="w-3 h-3" /> Сессия</>}
                    </button>
                  )}
                </div>
                <p className="text-[11px] text-gray-400 leading-snug">
                  Сессия надежно сохраняется в файл <code className="text-gray-300">.telegram_session</code> на сервере и в кэше браузера.
                </p>
              </div>

              {/* Reset Settings & Design Card */}
              <div className="bg-[#17212b] border border-amber-500/20 rounded-2xl p-3.5 space-y-2.5">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-amber-400 flex items-center gap-1.5">
                    <RotateCcw className="w-3.5 h-3.5" /> Сброс настроек и оформления
                  </span>
                </div>
                <div className="grid grid-cols-2 gap-2 pt-1">
                  <button
                    type="button"
                    onClick={() => {
                      resetDesignSettings();
                      setResetStatus("Дизайн успешно сброшен!");
                      setTimeout(() => setResetStatus(null), 2500);
                    }}
                    className="px-2.5 py-2 bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl text-xs font-medium text-gray-200 flex items-center justify-center gap-1.5 transition-all cursor-pointer hover:border-amber-400/40"
                  >
                    <Sliders className="w-3.5 h-3.5 text-amber-400" />
                    Сбросить дизайн
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      if (window.confirm("Сбросить все настройки к исходным?")) {
                        resetAllAppSettings();
                        setResetStatus("Все настройки сброшены!");
                        setTimeout(() => setResetStatus(null), 2500);
                      }
                    }}
                    className="px-2.5 py-2 bg-amber-500/10 hover:bg-amber-500/20 border border-amber-500/30 rounded-xl text-xs font-medium text-amber-300 flex items-center justify-center gap-1.5 transition-all cursor-pointer"
                  >
                    <RotateCcw className="w-3.5 h-3.5" />
                    Полный сброс
                  </button>
                </div>
              </div>

              {/* Media Sync */}
              <div className="bg-[#17212b] border border-blue-500/20 rounded-2xl p-3.5 space-y-2.5">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-blue-400 flex items-center gap-1.5">
                    <DownloadCloud className="w-3.5 h-3.5" /> Синхронизация медиа
                  </span>
                  <span className="text-[11px] text-gray-400 font-mono">
                    {syncState.pendingCount > 0 ? `${syncState.pendingCount} в очереди` : "Синхронизировано"}
                  </span>
                </div>
                <div className="space-y-1">
                  <div className="flex justify-between text-[10px] text-gray-400">
                    <span>{formatBytes(syncState.loadedBytes)} из {formatBytes(syncState.totalBytes || syncState.loadedBytes)}</span>
                    <span>{syncState.progressPercent}%</span>
                  </div>
                  <div className="w-full h-1.5 bg-black/40 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-blue-500 rounded-full transition-all duration-300"
                      style={{ width: `${Math.max(syncState.progressPercent, syncState.pendingCount > 0 ? 5 : 0)}%` }}
                    />
                  </div>
                </div>
              </div>

              {/* Logout Button */}
              <div className="pt-2">
                <button
                  onClick={handleLogout}
                  className="w-full py-2.5 bg-red-500/10 hover:bg-red-500/20 border border-red-500/30 text-red-400 text-xs font-semibold rounded-xl flex items-center justify-center gap-2 transition-colors cursor-pointer"
                >
                  <LogOut className="w-4 h-4" />
                  Выйти из аккаунта Telegram
                </button>
              </div>
            </div>
          )}
        </div>
      </motion.div>

      {/* NFT Gift Details Modal (Passport / Attributes) */}
      <AnimatePresence>
        {selectedNft && (
          <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/80 backdrop-blur-lg animate-in fade-in">
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="w-full max-w-md bg-[#17212b] border border-amber-500/40 rounded-3xl p-6 shadow-2xl relative overflow-hidden"
            >
              <div className="flex justify-between items-center pb-3 border-b border-white/10">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-mono font-bold text-amber-400 bg-amber-400/10 px-2.5 py-1 rounded-full border border-amber-400/30">
                    {selectedNft.number}
                  </span>
                  <span className="text-xs font-semibold text-gray-300">{selectedNft.collection}</span>
                </div>
                <button
                  onClick={() => setSelectedNft(null)}
                  className="p-1 rounded-full text-gray-400 hover:text-white hover:bg-white/10 cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* 3D Visual Showcase */}
              <div className="my-6 flex flex-col items-center">
                <div
                  className={`w-28 h-28 rounded-3xl bg-gradient-to-tr ${selectedNft.gradientBg} flex items-center justify-center text-6xl shadow-2xl border-2 border-white/20 relative group`}
                >
                  <span className="drop-shadow-2xl animate-bounce [animation-duration:3s]">{selectedNft.icon}</span>
                  <span className="absolute -bottom-3 px-3 py-0.5 rounded-full text-[11px] font-extrabold uppercase bg-black text-amber-300 border border-amber-400/50 shadow">
                    {selectedNft.rarity}
                  </span>
                </div>
                <h3 className="text-xl font-extrabold text-white mt-5 flex items-center gap-2">
                  {selectedNft.name}
                  <CheckCircle2 className="w-4 h-4 text-[#2481cc] fill-[#2481cc] text-white" />
                </h3>
                <p className="text-xs text-gray-400 text-center mt-1 px-4">{selectedNft.description}</p>
              </div>

              {/* Attributes Chips */}
              <div className="space-y-2">
                <span className="text-[11px] font-bold text-gray-400 uppercase tracking-wider block">
                  Характеристики и Редкость:
                </span>
                <div className="grid grid-cols-2 gap-2">
                  {selectedNft.attributes.map((attr, i) => (
                    <div key={i} className="p-2.5 bg-[#111116] border border-white/5 rounded-xl">
                      <span className="text-[10px] text-gray-400 block">{attr.trait_type}</span>
                      <span className="text-xs font-bold text-white block truncate">{attr.value}</span>
                      <span className="text-[10px] font-mono font-semibold text-amber-300 mt-0.5 block">
                        редкость {attr.rarity_percent}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              {/* TON Blockchain Contract Info */}
              <div className="mt-4 p-3 bg-black/40 border border-white/5 rounded-xl flex items-center justify-between text-xs">
                <div>
                  <span className="text-[10px] text-gray-400 block font-mono">Контракт TON</span>
                  <span className="text-[11px] font-mono text-blue-400 truncate max-w-[200px] block">
                    {selectedNft.contractAddress}
                  </span>
                </div>
                <div className="text-right">
                  <span className="text-[10px] text-gray-400 block">Тираж</span>
                  <span className="font-bold text-white">{selectedNft.totalMinted} шт.</span>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="mt-6 flex gap-2.5">
                <button
                  onClick={() => {
                    handlePinNft(selectedNft);
                    setSelectedNft(null);
                  }}
                  className={`flex-1 py-3 rounded-2xl text-xs font-bold transition-all shadow cursor-pointer flex items-center justify-center gap-1.5 ${
                    pinnedNft?.id === selectedNft.id
                      ? "bg-red-500/20 text-red-300 border border-red-500/40 hover:bg-red-500/30"
                      : "bg-amber-400 hover:bg-amber-300 text-black font-extrabold shadow-amber-400/20"
                  }`}
                >
                  <Star className="w-4 h-4" />
                  {pinnedNft?.id === selectedNft.id ? "Открепить от профиля" : "Закрепить в шапке профиля"}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Story Creator Modal */}
      {showCreateStory && (
        <CreateStoryModal
          isOpen={showCreateStory}
          onClose={() => setShowCreateStory(false)}
          onPublish={(newStory) => {
            const storyObj = {
              ...newStory,
              userName: `${firstName} ${lastName}`.trim() || profile?.username || "Я",
              userAvatar: `/api/telegram/avatar/${profile?.id || 'me'}`,
              timeAgo: "Только что",
            };
            const updated = [storyObj, ...myStories];
            setMyStories(updated);
            try {
              localStorage.setItem("nexus_my_stories", JSON.stringify(updated));
            } catch {}
            triggerHaptic("heavy");
          }}
        />
      )}

      {/* Story Viewer Modal */}
      {viewingStoryIdx !== null && (
        <UserStoriesModal
          initialStoryIndex={viewingStoryIdx}
          stories={myStories}
          onClose={() => setViewingStoryIdx(null)}
        />
      )}
    </div>
  );
}
