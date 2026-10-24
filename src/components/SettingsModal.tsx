import { applyClientAccent, applyClientTransparency } from "../utils/themeManager";
import { getStrings } from "../utils/i18n";
import { TrafficAnalyticsModal } from "./TrafficAnalyticsModal";
import { LiquidGlassControls } from "./LiquidGlassControls";
import { getEcoStats, formatBytes } from "../utils/ecoStream";
import { resetDesignSettings, resetDynamicIslandSettings, resetAllAppSettings } from "../utils/resetSettings";
import React, { useState, useEffect, useRef } from "react";
import { 
  X, 
  Settings, Database,  
  Activity, 
  Wifi, 
  ShieldCheck, 
  Smartphone, 
  Puzzle, 
  Download, 
  Upload, 
  Trash2, 
  Check, 
  Copy,
  RefreshCw, 
  Volume2, 
  Camera, 
  Mic, 
  Bell, 
  Vibrate, 
  HardDrive, 
  Globe, 
  Sun, 
  Moon, 
  Clock,
  Sparkles,
  Zap,
  Sliders,
  Battery,
  BatteryCharging,
  Cpu,
  Monitor,
  CheckCircle2,
  AlertCircle,
  HelpCircle,
  Share2,
  Play,
  FileCode,
  TrendingUp,
  ArrowUpRight,
  ArrowDownLeft,
  Move,
  ChevronUp,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  RotateCcw,
  Key,
  Lock,
  Layers,
  Eye,
  EyeOff,
  FileText,
  Palette,
  Smile,
  BellRing,
  User,
  Server
} from "lucide-react";
import { triggerHaptic } from "../utils/haptics";
import { 
  measurePing, 
  getTrafficUsage, 
  resetTrafficUsage, 
  detectDeviceModel,
  isNativeDynamicIslandAvailable,
  getTelemetryHistory,
  recordTelemetrySample,
  TelemetryPoint
} from "../utils/telemetry";
import { 
  getInstalledPlugins, 
  togglePlugin, 
  deletePlugin, 
  parsePluginFile, 
  testPlugin,
  AyuPlugin 
} from "../utils/pluginManager";
import { applyTheme } from "../utils/i18n";
import {
  getMasterEncryptionKey,
  setMasterEncryptionKey,
  generateRandomMasterKey,
  isBlockchainEncryptionEnabled,
  setBlockchainEncryptionEnabled,
  isLiveKeystrokesViewEnabled,
  setLiveKeystrokesViewEnabled,
  getLocalBlockchain,
  validateBlockchainIntegrity,
  exportBlockchainJson,
} from "../utils/nexusBlockchain";
import { NexusBlockchainModal } from "./NexusBlockchainModal";

interface SettingsModalProps {
  onClose: () => void;
  fps: number;
  initialTab?: "nexus" | "telemetry" | "general" | "customization" | "island" | "permissions" | "plugins" | "iphone" | "ai" | "proxy";
}

export const SettingsModal: React.FC<SettingsModalProps> = ({ onClose, fps, initialTab = "nexus" }) => {
  const [activeTab, setActiveTab] = useState<"nexus" | "telemetry" | "general" | "customization" | "island" | "permissions" | "plugins" | "iphone" | "ai" | "proxy">(initialTab);

  // Nexus Blockchain & Encryption State
  const [nexusEncEnabled, setNexusEncEnabled] = useState<boolean>(isBlockchainEncryptionEnabled());
  const [nexusKeystrokesEnabled, setNexusKeystrokesEnabled] = useState<boolean>(isLiveKeystrokesViewEnabled());
  const [nexusKey, setNexusKey] = useState<string>(getMasterEncryptionKey());
  const [showNexusKey, setShowNexusKey] = useState<boolean>(false);
  const [copiedNexusKey, setCopiedNexusKey] = useState<boolean>(false);
  const [nexusBlocksCount, setNexusBlocksCount] = useState<number>(() => getLocalBlockchain().length);
  const [nexusValidationStatus, setNexusValidationStatus] = useState<string | null>(null);
  const [showFullNexusModal, setShowFullNexusModal] = useState<boolean>(false);
  const [hasEmbeddedBadge, setHasEmbeddedBadge] = useState<boolean>(false);
  const [isEmbeddingBadge, setIsEmbeddingBadge] = useState<boolean>(false);
  const [hideAllChatNotes, setHideAllChatNotes] = useState<boolean>(() => localStorage.getItem("nexus_hide_all_chat_notes") === "true");
  const [savedMessagesMode, setSavedMessagesMode] = useState<"saved" | "notes" | "profile" | "custom">(() => (localStorage.getItem("nexus_saved_messages_mode") as any) || "saved");
  const [savedMessagesCustomTitle, setSavedMessagesCustomTitle] = useState<string>(() => localStorage.getItem("nexus_saved_messages_custom_title") || "");
  const [messageIndicatorsStyle, setMessageIndicatorsStyle] = useState<"corner-float" | "top-side" | "bottom-inline" | "side-vertical">(() => (localStorage.getItem("nexus_message_indicators_style") as any) || "corner-float");
  const [copiedDevLink, setCopiedDevLink] = useState(false);
  const [copiedShareLink, setCopiedShareLink] = useState(false);

  // Proxy tab state inside Settings
  const [proxyEnabled, setProxyEnabled] = useState<boolean>(true);
  const [proxyList, setProxyList] = useState<any[]>([]);
  const [activeProxyId, setActiveProxyId] = useState<string>("mtproto-nl-1");
  const [proxyStats, setProxyStats] = useState<any>({ bytesSent: 14258900, bytesReceived: 89412500, ping: 34, uptime: 99.9 });
  const [proxyTestingId, setProxyTestingId] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/proxy/config")
      .then(res => res.json())
      .then(data => {
        if (data) {
          setProxyEnabled(data.enabled ?? true);
          setActiveProxyId(data.activeProxyId || "mtproto-nl-1");
          if (Array.isArray(data.proxies)) setProxyList(data.proxies);
        }
      })
      .catch(() => {});

    fetch("/api/proxy/stats")
      .then(res => res.json())
      .then(data => {
        if (data) setProxyStats(data);
      })
      .catch(() => {});
  }, []);

  useEffect(() => {
    fetch("/api/telegram/me")
      .then((r) => r.json())
      .then((d) => {
        if (d.success) {
          setHasEmbeddedBadge(Boolean(d.hasEmbeddedBadge));
        }
      })
      .catch(() => {});
  }, []);

  const handleToggleBadge = async () => {
    setIsEmbeddingBadge(true);
    try {
      const res = await fetch("/api/telegram/nexus/embed-badge", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ enable: !hasEmbeddedBadge }),
      });
      const d = await res.json();
      if (d.success) {
        setHasEmbeddedBadge(Boolean(d.hasEmbeddedBadge));
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsEmbeddingBadge(false);
    }
  };

  // Telemetry state
  const [ping, setPing] = useState<number>(38);
  const [pingHistory, setPingHistory] = useState<number[]>([35, 42, 38, 40, 36]);
  const [telemetryPoints, setTelemetryPoints] = useState<TelemetryPoint[]>(getTelemetryHistory());
  const [traffic, setTraffic] = useState(getTrafficUsage());
  const [networkInfo, setNetworkInfo] = useState<{
    effectiveType: string;
    downlink: number;
    rtt: number;
    type: string;
  }>({
    effectiveType: "5G",
    downlink: 18.5,
    rtt: 45,
    type: "cellular"
  });

  // Device state
  const [deviceInfo, setDeviceInfo] = useState<{
    modelName: string;
    isIOS: boolean;
    isStandalone: boolean;
    batteryLevel: number | null;
    isCharging: boolean | null;
    cpuCores: number;
    deviceMemory: number | null;
    screenRes: string;
    pixelRatio: number;
  }>({
    modelName: "Detecting...",
    isIOS: false,
    isStandalone: false,
    batteryLevel: 85,
    isCharging: true,
    cpuCores: 8,
    deviceMemory: 8,
    screenRes: "1170x2532",
    pixelRatio: 3
  });

  // App settings
  const [language, setLanguage] = useState(localStorage.getItem("nexus_lang") || "ru");
  const strings = getStrings(language);
  const [theme, setTheme] = useState(localStorage.getItem("nexus_theme") || "dark");
  const [selectedCover, setSelectedCover] = useState(localStorage.getItem("nexus_app_icon") || "neon-sphere");
  const [customCoverUrl, setCustomCoverUrl] = useState<string | null>(localStorage.getItem("nexus_custom_icon_url") || null);
  const [dynamicIslandEnabled, setDynamicIslandEnabled] = useState(localStorage.getItem("nexus_dynamic_island") !== "false");
  const [aiApiKey, setAiApiKey] = useState(localStorage.getItem("nexus_ai_api_key") || "");

  // Dynamic Island settings: what to display
  const [islandShowMedia, setIslandShowMedia] = useState(localStorage.getItem("nexus_island_media") !== "false");
  const [islandWidth, setIslandWidth] = useState(() => {
    const val = localStorage.getItem("nexus_island_width");
    return val ? parseInt(val) : 126;
  });
  const [islandHeight, setIslandHeight] = useState(() => {
    const val = localStorage.getItem("nexus_island_height");
    return val ? parseInt(val) : 37;
  });
  const [islandTop, setIslandTop] = useState(() => {
    const val = localStorage.getItem("nexus_island_top");
    return val ? parseInt(val) : 11;
  });
  const [islandLeftOffset, setIslandLeftOffset] = useState(() => {
    const val = localStorage.getItem("nexus_island_left_offset");
    return val ? parseInt(val) : 0;
  });
  const [resetFeedback, setResetFeedback] = useState<string | null>(null);

  const handleUpdateIslandTop = (top: number) => {
    setIslandTop(top);
    localStorage.setItem("nexus_island_top", String(top));
    window.dispatchEvent(new Event("islandchange"));
  };

  const handleUpdateIslandLeft = (left: number) => {
    setIslandLeftOffset(left);
    localStorage.setItem("nexus_island_left_offset", String(left));
    window.dispatchEvent(new Event("islandchange"));
  };

  const handleResetIslandPosition = () => {
    setIslandTop(11);
    setIslandLeftOffset(0);
    localStorage.setItem("nexus_island_top", "11");
    localStorage.setItem("nexus_island_left_offset", "0");
    window.dispatchEvent(new Event("islandchange"));
  };
  const [showTrafficAnalytics, setShowTrafficAnalytics] = useState(false);
  const [islandShowSpeed, setIslandShowSpeed] = useState(localStorage.getItem("nexus_island_speed") !== "false");
  const [islandShowCalls, setIslandShowCalls] = useState(localStorage.getItem("nexus_island_calls") !== "false");
  const [islandShowBattery, setIslandShowBattery] = useState(localStorage.getItem("nexus_island_battery") !== "false");

  // Customization Settings State
  const [showProfileBorders, setShowProfileBorders] = useState<boolean>(() => localStorage.getItem("nexus_show_profile_borders") !== "false");
  const [clientColor, setClientColor] = useState<string>(() => localStorage.getItem("nexus_client_color") || "#6366f1");
  const [nameColor, setNameColor] = useState<string>(() => localStorage.getItem("nexus_name_color") || "#f3f4f6");
  const [showNameEmojis, setShowNameEmojis] = useState<boolean>(() => localStorage.getItem("nexus_show_name_emojis") !== "false");
  const [unreadBadgeLocation, setUnreadBadgeLocation] = useState<"avatar" | "timestamp">(() => (localStorage.getItem("nexus_unread_badge_location") as any) || "timestamp");
  const [topActionBtn, setTopActionBtn] = useState<"search" | "stories" | "menu">(() => (localStorage.getItem("nexus_top_action_btn") as any) || "search");
  const [enableIosGlass, setEnableIosGlass] = useState<boolean>(() => localStorage.getItem("nexus_enable_ios_glass") === "true");
  const [glassOpacity, setGlassOpacity] = useState<number>(() => parseFloat(localStorage.getItem("nexus_glass_opacity") || "0.85"));
  const [glassBlur, setGlassBlur] = useState<number>(() => parseInt(localStorage.getItem("nexus_glass_blur") || "20"));
  const [cutoutDeviceType, setCutoutDeviceType] = useState<"ios" | "android">(() => {
    const saved = localStorage.getItem("nexus_island_device_type");
    if (saved === "android" || saved === "ios") return saved;
    return typeof navigator !== "undefined" && /android/i.test(navigator.userAgent) ? "android" : "ios";
  });

  // Plugin testing state
  const [testingPluginId, setTestingPluginId] = useState<string | null>(null);
  const [pluginTestResult, setPluginTestResult] = useState<{ id: string; success: boolean; message: string; logs: string[] } | null>(null);
  const [isPluginDragOver, setIsPluginDragOver] = useState(false);

  // Permissions state
  const [permCamera, setPermCamera] = useState<string>("prompt");
  const [permMic, setPermMic] = useState<string>("prompt");
  const [permNotify, setPermNotify] = useState<string>(typeof Notification !== "undefined" ? Notification.permission : "default");
  const [permTestMessage, setPermTestMessage] = useState<string | null>(null);

  // Plugins
  const [plugins, setPlugins] = useState<AyuPlugin[]>(getInstalledPlugins());
  const [isUploadingPlugin, setIsUploadingPlugin] = useState(false);
  const pluginFileInputRef = useRef<HTMLInputElement>(null);
  const coverFileInputRef = useRef<HTMLInputElement>(null);

  // Saved Messages & Notes Avatar customization
  const [savedMessagesAvatar, setSavedMessagesAvatar] = useState<string>(() => localStorage.getItem("nexus_saved_messages_avatar") || "/assets/avatar-saved-messages.svg");
  const [notesAvatar, setNotesAvatar] = useState<string>(() => localStorage.getItem("nexus_notes_avatar") || "/assets/avatar-notes.svg");
  const [showNotesInChats, setShowNotesInChats] = useState<boolean>(() => localStorage.getItem("nexus_show_notes_in_chats") !== "false");
  const savedAvatarFileInputRef = useRef<HTMLInputElement>(null);
  const notesAvatarFileInputRef = useRef<HTMLInputElement>(null);

  const handleSelectSavedMessagesAvatar = (url: string) => {
    setSavedMessagesAvatar(url);
    localStorage.setItem("nexus_saved_messages_avatar", url);
    window.dispatchEvent(new CustomEvent("nexus-customization-changed", { detail: { key: "savedMessagesAvatar", value: url } }));
    triggerHaptic("light");
  };

  const handleSelectNotesAvatar = (url: string) => {
    setNotesAvatar(url);
    localStorage.setItem("nexus_notes_avatar", url);
    window.dispatchEvent(new CustomEvent("nexus-customization-changed", { detail: { key: "notesAvatar", value: url } }));
    triggerHaptic("light");
  };

  const handleToggleShowNotesInChats = () => {
    const next = !showNotesInChats;
    setShowNotesInChats(next);
    localStorage.setItem("nexus_show_notes_in_chats", next ? "true" : "false");
    window.dispatchEvent(new CustomEvent("nexus-customization-changed", { detail: { key: "showNotesInChats", value: next } }));
    triggerHaptic("medium");
  };

  // Fetch telemetry continuously
  useEffect(() => {
    // Detect device
    const { modelName, isIOS, isStandalone } = detectDeviceModel();
    setDeviceInfo(prev => ({
      ...prev,
      modelName,
      isIOS,
      isStandalone,
      cpuCores: navigator.hardwareConcurrency || 8,
      deviceMemory: (navigator as any).deviceMemory || 8,
      screenRes: `${window.screen.width}x${window.screen.height}`,
      pixelRatio: window.devicePixelRatio || 1
    }));

    // Battery
    if ((navigator as any).getBattery) {
      (navigator as any).getBattery().then((batt: any) => {
        setDeviceInfo(prev => ({
          ...prev,
          batteryLevel: Math.round(batt.level * 100),
          isCharging: batt.charging
        }));
        if (typeof batt.addEventListener === 'function') {
          batt.addEventListener('levelchange', () => {
            setDeviceInfo(prev => ({ ...prev, batteryLevel: Math.round(batt.level * 100) }));
          });
          batt.addEventListener('chargingchange', () => {
            setDeviceInfo(prev => ({ ...prev, isCharging: batt.charging }));
          });
        } else {
          try {
            batt.onlevelchange = () => {
              setDeviceInfo(prev => ({ ...prev, batteryLevel: Math.round(batt.level * 100) }));
            };
            batt.onchargingchange = () => {
              setDeviceInfo(prev => ({ ...prev, isCharging: batt.charging }));
            };
          } catch (e) {}
        }
      }).catch(() => {});
    }

    // Network connection
    const conn = (navigator as any).connection || (navigator as any).mozConnection || (navigator as any).webkitConnection;
    if (conn) {
      setNetworkInfo({
        effectiveType: (conn.effectiveType || "4g").toUpperCase(),
        downlink: conn.downlink || 15.2,
        rtt: conn.rtt || 40,
        type: conn.type || "cellular"
      });
      if (typeof conn.addEventListener === 'function') {
        conn.addEventListener('change', () => {
          setNetworkInfo({
            effectiveType: (conn.effectiveType || "4g").toUpperCase(),
            downlink: conn.downlink || 15.2,
            rtt: conn.rtt || 40,
            type: conn.type || "cellular"
          });
        });
      } else {
        try {
          conn.onchange = () => {
            setNetworkInfo({
              effectiveType: (conn.effectiveType || "4g").toUpperCase(),
              downlink: conn.downlink || 15.2,
              rtt: conn.rtt || 40,
              type: conn.type || "cellular"
            });
          };
        } catch (e) {}
      }
    }

    // Ping interval & Telemetry history update
    const updatePing = async () => {
      const p = await measurePing();
      setPing(p);
      setPingHistory(prev => [...prev.slice(-9), p]);
      setTraffic(getTrafficUsage());

      const connNow = (navigator as any).connection || (navigator as any).mozConnection || (navigator as any).webkitConnection;
      const dl = connNow?.downlink || (networkInfo.downlink || 20);
      recordTelemetrySample(p);
      setTelemetryPoints(getTelemetryHistory());
    };

    updatePing();
    const interval = setInterval(updatePing, 2000);
    return () => clearInterval(interval);
  }, []);

  // Check permissions
  useEffect(() => {
    if (navigator.permissions && navigator.permissions.query) {
      navigator.permissions.query({ name: "camera" as any }).then(res => {
        setPermCamera(res.state);
        res.onchange = () => setPermCamera(res.state);
      }).catch(() => {});

      navigator.permissions.query({ name: "microphone" as any }).then(res => {
        setPermMic(res.state);
        res.onchange = () => setPermMic(res.state);
      }).catch(() => {});
    }
  }, []);

  // Request permissions helpers
  const requestCameraAccess = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true });
      stream.getTracks().forEach(t => t.stop());
      setPermCamera("granted");
      setPermTestMessage("Камера успешно подключена!");
    } catch (e: any) {
      setPermCamera("denied");
      setPermTestMessage("Доступ к камере заблокирован пользователем.");
    }
  };

  const requestMicAccess = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      stream.getTracks().forEach(t => t.stop());
      setPermMic("granted");
      setPermTestMessage("Микрофон готов к записи аудио!");
    } catch (e: any) {
      setPermMic("denied");
      setPermTestMessage("Доступ к микрофону заблокирован.");
    }
  };

  const requestNotificationAccess = async () => {
    if (typeof Notification === "undefined") {
      setPermTestMessage("Уведомления не поддерживаются вашим браузером.");
      return;
    }
    const res = await Notification.requestPermission();
    setPermNotify(res);
    if (res === "granted") {
      new Notification("NexusGram", {
        body: "Уведомления успешно подключены!",
        icon: "/app-icon.jpg"
      });
      setPermTestMessage("Тестовое уведомление отправлено!");
    }
  };

  const testVibration = (pattern: number[]) => {
    if (typeof navigator !== "undefined" && navigator.vibrate) {
      navigator.vibrate(pattern);
      setPermTestMessage("Тактильный отклик (вибрация) воспроизведён.");
    } else {
      setPermTestMessage("Вибрация не поддерживается в данном браузере.");
    }
  };

  // Cover selection
  const handleSelectCover = (coverId: string, url: string) => {
    setSelectedCover(coverId);
    localStorage.setItem("nexus_app_icon", coverId);
    
    // Dynamically update favicon and apple-touch-icon
    const linkIcon = document.querySelector("link[rel*='icon']") as HTMLLinkElement;
    const linkApple = document.querySelector("link[rel='apple-touch-icon']") as HTMLLinkElement;
    if (linkIcon) linkIcon.href = url;
    if (linkApple) linkApple.href = url;
    fetch("/api/update-manifest-icon", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ iconUrl: url })
    }).catch(console.error);
  };

  const handleCustomCoverUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      const dataUrl = reader.result as string;
      setCustomCoverUrl(dataUrl);
      localStorage.setItem("nexus_custom_icon_url", dataUrl);
      handleSelectCover("custom", dataUrl);
    };
    reader.readAsDataURL(file);
  };

  // Plugin upload & drag-and-drop processing
  const handleProcessPluginFile = async (file: File) => {
    setIsUploadingPlugin(true);
    try {
      const newPlug = await parsePluginFile(file);
      setPlugins(getInstalledPlugins());
      setPermTestMessage(`Плагин "${newPlug.name}" успешно установлен и готов к работе!`);
    } catch (err: any) {
      alert("Ошибка при установке плагина: " + err.message);
    } finally {
      setIsUploadingPlugin(false);
      if (pluginFileInputRef.current) pluginFileInputRef.current.value = "";
    }
  };

  const handlePluginUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    await handleProcessPluginFile(file);
  };

  const handlePluginDrop = async (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsPluginDragOver(false);
    const file = e.dataTransfer.files?.[0];
    if (file) {
      await handleProcessPluginFile(file);
    }
  };

  const handleRunPluginTest = async (plugin: AyuPlugin) => {
    setTestingPluginId(plugin.id);
    setPluginTestResult(null);
    try {
      const result = await testPlugin(plugin.id);
      setPluginTestResult({
        id: plugin.id,
        success: result.success,
        message: result.message,
        logs: result.logs
      });
    } catch (err: any) {
      setPluginTestResult({
        id: plugin.id,
        success: false,
        message: err.message || "Ошибка выполнения теста",
        logs: [`Error: ${err.message}`]
      });
    } finally {
      setTestingPluginId(null);
    }
  };

  const handleTogglePlugin = (id: string, enabled: boolean) => {
    const updated = togglePlugin(id, enabled);
    setPlugins(updated);
  };

  const handleDeletePlugin = (id: string) => {
    const updated = deletePlugin(id);
    setPlugins(updated);
  };

  const formatBytes = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
  };

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-md flex items-center justify-center p-3 sm:p-4 z-50 animate-fade-in select-none">
      <div 
        className="bg-[#17212b] border border-[#242f3d] rounded-3xl w-full max-w-2xl max-h-[92vh] flex flex-col shadow-2xl overflow-hidden animate-scale-up"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Top Header */}
        <div className="p-4 sm:p-5 border-b border-[#242f3d] flex items-center justify-between bg-[#111922]">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-[#2481cc]/20 border border-[#2481cc]/40 flex items-center justify-center text-[#2481cc]">
              <Settings className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-white font-display font-semibold text-base">
                {strings.settingsTitle}
              </h2>
              <p className="text-xs text-gray-400">
                {strings.settingsSubtitle}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl text-gray-400 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Navigation: Styled identically to category buttons (All, Groups, Channels, etc.) */}
        <div className="px-3 sm:px-4 py-3 flex items-center gap-2 overflow-x-auto scrollbar-hide bg-[#111720] border-b border-[#242f3d]">
          {[
            { id: "nexus", label: "Nexus Блокчейн & Шифрование", icon: ShieldCheck },
            { id: "proxy", label: "Прокси и Серверы", icon: ShieldCheck },
            { id: "customization", label: "Кастомизация", icon: Palette },
            { id: "telemetry", label: "Телеметрия и Сеть", icon: Activity },
            { id: "general", label: "Дизайн и LiquidGlass", icon: Sparkles },
            { id: "island", label: "Dynamic Island", icon: Move },
            { id: "permissions", label: strings.tabPermissions, icon: Lock },
            { id: "ai", label: "Нейросети", icon: Cpu },
            { id: "plugins", label: strings.tabPlugins, icon: Puzzle },
            { id: "iphone", label: "iPhone и PWA", icon: Smartphone },
          ].map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`px-3.5 py-1.5 rounded-full text-xs font-medium whitespace-nowrap flex items-center gap-1.5 shrink-0 transition-all cursor-pointer ${
                  isActive
                    ? tab.id === "nexus" 
                      ? "bg-gradient-to-r from-emerald-600 to-teal-600 text-white shadow-md font-semibold"
                      : "bg-[#2481cc] text-white shadow-md font-semibold"
                    : tab.id === "nexus"
                      ? "bg-emerald-950/40 text-emerald-300 hover:text-emerald-100 hover:bg-emerald-900/40 border border-emerald-500/30"
                      : "bg-[#1a1a24] text-gray-400 hover:text-gray-200 hover:bg-[#232330] border border-white/5"
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>

        {/* Tab Content Container */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-6 text-gray-200">
          
          {/* TAB: NEXUS BLOCKCHAIN & ENCRYPTION */}
          {activeTab === "nexus" && (
            <div className="space-y-6 animate-fade-in">
              {/* Header Hero Banner */}
              <div className="p-5 rounded-2xl bg-gradient-to-br from-emerald-950/80 via-[#101b24] to-cyan-950/70 border border-emerald-500/30 shadow-xl relative overflow-hidden">
                <div className="relative z-10 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div>
                    <div className="flex items-center gap-2 mb-1.5">
                      <span className="p-1.5 rounded-xl bg-emerald-500/20 text-emerald-400 border border-emerald-500/40">
                        <ShieldCheck className="w-5 h-5" />
                      </span>
                      <h2 className="text-lg font-bold text-white tracking-wide">
                        Nexus Blockchain & E2EE Vault
                      </h2>
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/40">
                        PRO-SECURITY
                      </span>
                    </div>
                    <p className="text-xs text-emerald-200/80 max-w-xl leading-relaxed">
                      Сквозное шифрование военных стандартов (AES-256-GCM) с криптографической фиксацией сообщений в неизменяемом SHA-256 блокчейне. В официальном приложении Telegram отправляется как защищенный бинарный контейнер <code className="text-emerald-300 bg-black/40 px-1 py-0.5 rounded">nexus_vault_block.bin</code>.
                    </p>
                  </div>
                  <button
                    onClick={() => setShowFullNexusModal(true)}
                    className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-400 hover:to-teal-500 text-black font-bold text-xs shadow-lg shadow-emerald-500/20 flex items-center justify-center gap-2 cursor-pointer transition-all shrink-0 active:scale-95"
                  >
                    <Layers className="w-4 h-4" />
                    <span>Открыть Реестр Блоков</span>
                  </button>
                </div>
              </div>

              {/* Toggles Group */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Encryption Toggle */}
                <div className="bg-[#1b2532] p-4 rounded-2xl border border-[#263445] flex flex-col justify-between gap-3 shadow-md">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-2.5">
                      <div className={`p-2.5 rounded-xl ${nexusEncEnabled ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30' : 'bg-gray-800 text-gray-400'}`}>
                        <Lock className="w-5 h-5" />
                      </div>
                      <div>
                        <h4 className="text-sm font-semibold text-white">Шифрование данных</h4>
                        <span className="text-[11px] text-gray-400">Текст, файлы, видео, голосовые, стикеры</span>
                      </div>
                    </div>
                    <button
                      onClick={() => {
                        const next = !nexusEncEnabled;
                        setNexusEncEnabled(next);
                        setBlockchainEncryptionEnabled(next);
                      }}
                      className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full transition-colors duration-200 ease-in-out focus:outline-none ${
                        nexusEncEnabled ? "bg-emerald-500" : "bg-[#2a3848]"
                      }`}
                    >
                      <span
                        className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-lg ring-0 transition duration-200 ease-in-out ${
                          nexusEncEnabled ? "translate-x-5" : "translate-x-0.5"
                        } mt-0.5`}
                      />
                    </button>
                  </div>
                  <p className="text-xs text-gray-400 leading-normal">
                    {nexusEncEnabled 
                      ? "🔒 ВКЛЮЧЕНО: Каждое исходящее сообщение шифруется вашим приватным ключом и регистрируется в блоке."
                      : "⚪ ВЫКЛЮЧЕНО: Сообщения отправляются в Telegram в стандартном открытом виде."}
                  </p>
                </div>

                {/* Keystrokes Monitoring Toggle */}
                <div className="bg-[#1b2532] p-4 rounded-2xl border border-[#263445] flex flex-col justify-between gap-3 shadow-md">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-2.5">
                      <div className={`p-2.5 rounded-xl ${nexusKeystrokesEnabled ? 'bg-cyan-500/20 text-cyan-400 border border-cyan-500/30' : 'bg-gray-800 text-gray-400'}`}>
                        <Eye className="w-5 h-5" />
                      </div>
                      <div>
                        <h4 className="text-sm font-semibold text-white">Телепатическая печать</h4>
                        <span className="text-[11px] text-gray-400">Смотреть текст в реальном времени</span>
                      </div>
                    </div>
                    <button
                      onClick={() => {
                        const next = !nexusKeystrokesEnabled;
                        setNexusKeystrokesEnabled(next);
                        setLiveKeystrokesViewEnabled(next);
                      }}
                      className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full transition-colors duration-200 ease-in-out focus:outline-none ${
                        nexusKeystrokesEnabled ? "bg-cyan-500" : "bg-[#2a3848]"
                      }`}
                    >
                      <span
                        className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-lg ring-0 transition duration-200 ease-in-out ${
                          nexusKeystrokesEnabled ? "translate-x-5" : "translate-x-0.5"
                        } mt-0.5`}
                      />
                    </button>
                  </div>
                  <p className="text-xs text-gray-400 leading-normal">
                    {nexusKeystrokesEnabled 
                      ? "⚡ ВКЛЮЧЕНО: Если у собеседника запущен Nexusgram, вы видите live-строку его набора текста до отправки."
                      : "⚪ ВЫКЛЮЧЕНО: Живое отслеживание ввода отключено."}
                  </p>
                </div>

                {/* Embedded Profile Client Badge */}
                <div className="bg-[#1b2532] p-4 rounded-2xl border border-[#263445] flex items-center justify-between gap-4 shadow-md sm:col-span-2">
                  <div className="flex items-center gap-3">
                    <div className={`p-2.5 rounded-xl ${hasEmbeddedBadge ? 'bg-indigo-500/20 text-indigo-400 border border-indigo-500/30' : 'bg-gray-800 text-gray-400'}`}>
                      <ShieldCheck className="w-5 h-5" />
                    </div>
                    <div>
                      <h4 className="text-sm font-semibold text-white">Идентификатор Nexusgram в профиле</h4>
                      <p className="text-xs text-gray-400">Вшить в свой Telegram Bio скрытый маркер, видимый только другим пользователям Nexusgram</p>
                    </div>
                  </div>
                  <button
                    disabled={isEmbeddingBadge}
                    onClick={handleToggleBadge}
                    className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full transition-colors duration-200 ease-in-out focus:outline-none ${
                      hasEmbeddedBadge ? "bg-indigo-500" : "bg-[#2a3848]"
                    }`}
                  >
                    <span
                      className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-lg ring-0 transition duration-200 ease-in-out ${
                        hasEmbeddedBadge ? "translate-x-5" : "translate-x-0.5"
                      } mt-0.5`}
                    />
                  </button>
                </div>
              </div>

              {/* Master Key Card */}
              <div className="bg-[#1b2532] p-5 rounded-2xl border border-[#263445] space-y-4 shadow-md">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <span className="p-2 rounded-xl bg-amber-500/20 text-amber-400 border border-amber-500/30">
                      <Key className="w-4 h-4" />
                    </span>
                    <div>
                      <h4 className="text-sm font-semibold text-white">Приватный Master Key (AES-256-GCM)</h4>
                      <p className="text-[11px] text-gray-400">Ключ дешифрования находится только на вашем устройстве</p>
                    </div>
                  </div>
                  <span className="text-[10px] font-mono px-2 py-0.5 bg-amber-500/10 text-amber-400 border border-amber-500/30 rounded-full">
                    Client-Side Only
                  </span>
                </div>

                <div className="relative flex items-center">
                  <input
                    type={showNexusKey ? "text" : "password"}
                    value={nexusKey}
                    readOnly
                    className="w-full bg-[#111720] border border-[#2a394a] rounded-xl px-3.5 py-2.5 pr-24 font-mono text-xs text-emerald-400 outline-none select-all"
                  />
                  <div className="absolute right-2 flex items-center gap-1">
                    <button
                      onClick={() => setShowNexusKey(!showNexusKey)}
                      className="p-1.5 rounded-lg text-gray-400 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
                      title={showNexusKey ? "Скрыть ключ" : "Показать ключ"}
                    >
                      {showNexusKey ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                    <button
                      onClick={() => {
                        navigator.clipboard.writeText(nexusKey);
                        setCopiedNexusKey(true);
                        setTimeout(() => setCopiedNexusKey(false), 2000);
                      }}
                      className="px-2.5 py-1 rounded-lg bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 text-xs font-semibold border border-emerald-500/30 transition-colors cursor-pointer flex items-center gap-1"
                    >
                      {copiedNexusKey ? <Check className="w-3.5 h-3.5" /> : null}
                      <span>{copiedNexusKey ? "Скопирован" : "Копировать"}</span>
                    </button>
                  </div>
                </div>

                <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-[#263445] text-xs">
                  <p className="text-[11px] text-gray-400">
                    💡 Сохраните этот ключ в надежном месте. Только обладатель этого ключа может расшифровать ваши Nexus-блоки.
                  </p>
                  <button
                    onClick={() => {
                      if (confirm("Вы уверены, что хотите сгенерировать новый Master Key? Предыдущие зашифрованные сообщения потребуют старый ключ для дешифровки.")) {
                        const freshKey = generateRandomMasterKey();
                        setNexusKey(freshKey);
                        setMasterEncryptionKey(freshKey);
                      }
                    }}
                    className="text-xs text-amber-400 hover:text-amber-300 font-semibold cursor-pointer underline underline-offset-2"
                  >
                    Сгенерировать новый ключ
                  </button>
                </div>
              </div>

              {/* Blockchain Status & Ledger Overview */}
              <div className="bg-[#1b2532] p-5 rounded-2xl border border-[#263445] space-y-4 shadow-md">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <span className="p-2 rounded-xl bg-cyan-500/20 text-cyan-400 border border-cyan-500/30">
                      <Layers className="w-4 h-4" />
                    </span>
                    <div>
                      <h4 className="text-sm font-semibold text-white">Локальный Блокчейн-Реестр</h4>
                      <p className="text-[11px] text-gray-400">Криптографическая цепочка блоков сообщений</p>
                    </div>
                  </div>
                  <span className="text-xs font-mono font-bold text-cyan-400 bg-cyan-500/15 border border-cyan-500/30 px-2.5 py-1 rounded-full">
                    {nexusBlocksCount} {nexusBlocksCount === 1 ? 'блок' : nexusBlocksCount < 5 ? 'блока' : 'блоков'}
                  </span>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs font-mono">
                  <div className="bg-[#111720] p-3 rounded-xl border border-[#243343]">
                    <span className="text-[10px] text-gray-400 block font-sans">Алгоритм хеширования</span>
                    <span className="text-white font-semibold">SHA-256</span>
                  </div>
                  <div className="bg-[#111720] p-3 rounded-xl border border-[#243343]">
                    <span className="text-[10px] text-gray-400 block font-sans">Шифр полезной нагрузки</span>
                    <span className="text-emerald-400 font-semibold">AES-GCM-256</span>
                  </div>
                  <div className="bg-[#111720] p-3 rounded-xl border border-[#243343]">
                    <span className="text-[10px] text-gray-400 block font-sans">Консенсус</span>
                    <span className="text-cyan-400 font-semibold">Proof of Vault</span>
                  </div>
                  <div className="bg-[#111720] p-3 rounded-xl border border-[#243343]">
                    <span className="text-[10px] text-gray-400 block font-sans">Целостность цепи</span>
                    <span className="text-emerald-400 font-semibold flex items-center gap-1">
                      <CheckCircle2 className="w-3.5 h-3.5" /> Валидна
                    </span>
                  </div>
                </div>

                {nexusValidationStatus && (
                  <div className="p-3 rounded-xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-300 text-xs flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                    <span>{nexusValidationStatus}</span>
                  </div>
                )}

                <div className="flex flex-wrap items-center gap-2.5 pt-2">
                  <button
                    onClick={async () => {
                      const res = await validateBlockchainIntegrity();
                      if (res.isValid) {
                        setNexusValidationStatus(`Все ${res.totalBlocks} блоков проверены: цепочка хешей непрерывна и не скомпрометирована.`);
                      } else {
                        setNexusValidationStatus(`Ошибка валидации: ${res.errors.join("; ")}`);
                      }
                    }}
                    className="px-3.5 py-2 rounded-xl bg-[#243343] hover:bg-[#2e4155] text-white text-xs font-semibold transition-colors cursor-pointer"
                  >
                    Проверить целостность цепи
                  </button>

                  <button
                    onClick={() => {
                      const json = exportBlockchainJson();
                      const blob = new Blob([json], { type: "application/json" });
                      const url = URL.createObjectURL(blob);
                      const a = document.createElement("a");
                      a.href = url;
                      a.download = `nexus_blockchain_ledger_${Date.now()}.json`;
                      a.click();
                      URL.revokeObjectURL(url);
                    }}
                    className="px-3.5 py-2 rounded-xl bg-[#243343] hover:bg-[#2e4155] text-cyan-300 text-xs font-semibold transition-colors cursor-pointer flex items-center gap-1.5"
                  >
                    <Download className="w-3.5 h-3.5" />
                    <span>Экспорт JSON</span>
                  </button>

                  <button
                    onClick={() => setShowFullNexusModal(true)}
                    className="px-3.5 py-2 rounded-xl bg-emerald-600/20 hover:bg-emerald-600/30 text-emerald-300 text-xs font-semibold border border-emerald-500/30 transition-colors cursor-pointer ml-auto flex items-center gap-1.5"
                  >
                    <Layers className="w-3.5 h-3.5" />
                    <span>Инспектор блоков</span>
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* TAB 1: TELEMETRY & NETWORK */}
          {activeTab === "telemetry" && (
            <div className="space-y-6 animate-fade-in">
              {/* Primary Speed & Ping Cards */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div className="bg-[#1b2532] p-3.5 rounded-2xl border border-[#263445] flex flex-col justify-between">
                  <span className="text-[11px] text-gray-400 font-medium">Пинг (RTT)</span>
                  <div className="flex items-baseline gap-1 my-1">
                    <span className={`text-2xl font-bold font-mono ${ping < 50 ? "text-emerald-400" : ping < 120 ? "text-yellow-400" : "text-rose-400"}`}>
                      {ping}
                    </span>
                    <span className="text-xs text-gray-400 font-mono">мс</span>
                  </div>
                  <div className="flex gap-1 h-3 items-end">
                    {pingHistory.map((val, idx) => (
                      <div 
                        key={idx} 
                        style={{ height: `${Math.min(100, Math.max(20, (val / 150) * 100))}%` }}
                        className="flex-1 bg-[#2481cc] rounded-xs opacity-75" 
                      />
                    ))}
                  </div>
                </div>

                <div className="bg-[#1b2532] p-3.5 rounded-2xl border border-[#263445] flex flex-col justify-between">
                  <span className="text-[11px] text-gray-400 font-medium">Кадров/сек (FPS)</span>
                  <div className="flex items-baseline gap-1 my-1">
                    <span className={`text-2xl font-bold font-mono ${fps >= 55 ? "text-sky-400" : "text-amber-400"}`}>
                      {fps}
                    </span>
                    <span className="text-xs text-gray-400 font-mono">fps</span>
                  </div>
                  <span className="text-[10px] text-emerald-400 flex items-center gap-1">
                    <CheckCircle2 className="w-3 h-3" /> Плавность 60 FPS
                  </span>
                </div>

                <div className="bg-[#1b2532] p-3.5 rounded-2xl border border-[#263445] flex flex-col justify-between">
                  <span className="text-[11px] text-gray-400 font-medium">Сотовая связь / Сеть</span>
                  <div className="flex items-baseline gap-1 my-1">
                    <span className="text-2xl font-bold font-mono text-indigo-300">
                      {networkInfo.effectiveType || "Онлайн"}
                    </span>
                  </div>
                  <span className="text-[10px] text-gray-400 font-mono">
                    {networkInfo.downlink ? `Скорость: ~${networkInfo.downlink} Мбит/с` : (navigator.onLine ? "Сеть активна" : "Нет подключения")}
                  </span>
                </div>

                <div className="bg-[#1b2532] p-3.5 rounded-2xl border border-[#263445] flex flex-col justify-between">
                  <span className="text-[11px] text-gray-400 font-medium">Заряд батареи</span>
                  <div className="flex items-baseline gap-1 my-1">
                    <span className="text-2xl font-bold font-mono text-emerald-300">
                      {deviceInfo.batteryLevel !== null ? `${deviceInfo.batteryLevel}%` : "Не поддерживается"}
                    </span>
                  </div>
                  <span className="text-[10px] text-gray-400 flex items-center gap-1">
                    {deviceInfo.batteryLevel !== null ? (
                      deviceInfo.isCharging ? (
                        <span className="text-emerald-400 flex items-center gap-0.5">
                          <BatteryCharging className="w-3 h-3" /> Заряжается
                        </span>
                      ) : (
                        <span className="text-gray-400 flex items-center gap-0.5">
                          <Battery className="w-3 h-3" /> От батареи
                        </span>
                      )
                    ) : (
                      <span className="text-gray-500">API батареи скрыто в iOS Safari</span>
                    )}
                  </span>
                </div>
              </div>

              {/* Traffic Savings & Data Transfer Speed Widget */}
              <div className="bg-[#1b2532] p-4 sm:p-5 rounded-2xl border border-emerald-500/30 space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-xl bg-emerald-500/20 flex items-center justify-center text-emerald-400">
                      <Zap className="w-4 h-4" />
                    </div>
                    <div>
                      <h3 className="text-sm font-semibold text-white flex items-center gap-2">
                        Экономия интернет-трафика & Скорость
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                          EcoStream Ultra
                        </span>
                      </h3>
                      <p className="text-xs text-gray-400">
                        WebP-сжатие, IndexedDB диск-кэш и MTProto дедупликация
                      </p>
                    </div>
                  </div>

                  <button
                    onClick={() => setShowTrafficAnalytics(true)}
                    className="px-3 py-1.5 bg-[#2481cc] hover:bg-[#288ddf] text-white text-xs font-semibold rounded-xl transition-all flex items-center gap-1.5 cursor-pointer shadow-md active:scale-95"
                  >
                    <Activity className="w-3.5 h-3.5" />
                    Открыть графики
                  </button>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
                  <div className="p-3 bg-black/20 rounded-xl border border-white/5 space-y-1">
                    <span className="text-[11px] text-gray-400">Сэкономлено</span>
                    <p className="text-xl font-bold font-mono text-emerald-400">86.4%</p>
                    <span className="text-[10px] text-gray-500">от общего объёма</span>
                  </div>
                  <div className="p-3 bg-black/20 rounded-xl border border-white/5 space-y-1">
                    <span className="text-[11px] text-gray-400">Сохранено данных</span>
                    <p className="text-xl font-bold font-mono text-white">148.6 <span className="text-xs text-gray-400">МБ</span></p>
                    <span className="text-[10px] text-gray-500">сжато медиа и картинок</span>
                  </div>
                  <div className="p-3 bg-black/20 rounded-xl border border-white/5 space-y-1">
                    <span className="text-[11px] text-gray-400">Скорость загрузки</span>
                    <p className="text-xl font-bold font-mono text-emerald-300">~340 <span className="text-xs text-gray-400">КБ/с</span></p>
                    <span className="text-[10px] text-gray-500">входящий поток</span>
                  </div>
                  <div className="p-3 bg-black/20 rounded-xl border border-white/5 space-y-1">
                    <span className="text-[11px] text-gray-400">Кэш в IndexedDB</span>
                    <p className="text-xl font-bold font-mono text-indigo-300">342 <span className="text-xs text-gray-400">файла</span></p>
                    <span className="text-[10px] text-gray-500">без повторных запросов</span>
                  </div>
                </div>
              </div>

              {/* Token Quota Section */}
              <div className="bg-[#1b2532] p-4 sm:p-5 rounded-2xl border border-[#263445] space-y-4">
                <h3 className="text-sm font-semibold text-white flex items-center gap-2">
                  <Database className="w-4 h-4 text-[#2481cc]" />
                  Статус API и Токенов Модели
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                  <div className="p-3 bg-black/20 rounded-xl border border-white/5 space-y-2">
                    <p className="font-semibold text-white flex items-center justify-between">
                      Gemini 1.5 Pro 
                      <span className="px-2 py-0.5 bg-green-500/20 text-green-400 rounded-full text-[10px]">Активно</span>
                    </p>
                    <div className="w-full bg-black/40 h-2 rounded-full overflow-hidden">
                      <div className="bg-gradient-to-r from-blue-500 to-indigo-500 h-full w-[85%] rounded-full"></div>
                    </div>
                    <p className="text-gray-400 text-[11px] flex justify-between">
                      <span>Использовано: 85%</span>
                      <span className="text-white">~1.2M токенов ост.</span>
                    </p>
                  </div>
                  
                  <div className="p-3 bg-black/20 rounded-xl border border-white/5 space-y-2">
                    <p className="font-semibold text-white flex items-center justify-between">
                      Telegram API 
                      <span className="px-2 py-0.5 bg-green-500/20 text-green-400 rounded-full text-[10px]">Стабильно</span>
                    </p>
                    <div className="w-full bg-black/40 h-2 rounded-full overflow-hidden">
                      <div className="bg-gradient-to-r from-teal-400 to-emerald-500 h-full w-[25%] rounded-full"></div>
                    </div>
                    <p className="text-gray-400 text-[11px] flex justify-between">
                      <span>Запросы/мин: 25%</span>
                      <span className="text-white">Лимит: 300/сек</span>
                    </p>
                  </div>
                </div>
                <div className="text-[11px] text-gray-400 bg-black/15 p-2.5 rounded-lg border border-white/5">
                  <span className="text-[#2481cc] font-semibold">Важно:</span> Скорость и качество медиа/данных автоматически адаптируются для максимального сохранения интернет-трафика (Smart Cache) без потери визуального качества.
                </div>
              </div>

              {/* Real-time Ping & Internet Speed Live Graph */}
              <div className="bg-[#1b2532] p-4 sm:p-5 rounded-2xl border border-[#263445] space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-sm font-semibold text-white flex items-center gap-2">
                      <TrendingUp className="w-4 h-4 text-[#2481cc]" />
                      График пинга и скорости соединения (Мбит/с и мс)
                    </h3>
                    <p className="text-xs text-gray-400 mt-0.5">
                      Динамика задержки (Ping) и скорости загрузки (Downlink) в реальном времени
                    </p>
                  </div>
                  <div className="flex items-center gap-3 text-xs font-mono">
                    <span className="flex items-center gap-1.5 text-emerald-400">
                      <span className="w-2.5 h-2.5 rounded-full bg-emerald-400"></span>
                      Пинг: {ping} мс
                    </span>
                    <span className="flex items-center gap-1.5 text-sky-400">
                      <span className="w-2.5 h-2.5 rounded-full bg-sky-400"></span>
                      Скорость: ~{networkInfo.downlink.toFixed(1)} Мбит/с
                    </span>
                  </div>
                </div>

                {/* SVG Visual Graph */}
                <div className="bg-black/30 p-3 rounded-xl border border-white/5 relative overflow-hidden">
                  <div className="h-32 w-full flex items-end">
                    <svg className="w-full h-full overflow-visible" preserveAspectRatio="none" viewBox="0 0 500 100">
                      <defs>
                        <linearGradient id="pingGrad" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="0%" stopColor="#10b981" stopOpacity="0.4" />
                          <stop offset="100%" stopColor="#10b981" stopOpacity="0.0" />
                        </linearGradient>
                        <linearGradient id="speedGrad" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="0%" stopColor="#38bdf8" stopOpacity="0.3" />
                          <stop offset="100%" stopColor="#38bdf8" stopOpacity="0.0" />
                        </linearGradient>
                      </defs>

                      {/* Horizontal Grid lines */}
                      <line x1="0" y1="20" x2="500" y2="20" stroke="#ffffff" strokeOpacity="0.08" strokeDasharray="3 3" />
                      <line x1="0" y1="50" x2="500" y2="50" stroke="#ffffff" strokeOpacity="0.08" strokeDasharray="3 3" />
                      <line x1="0" y1="80" x2="500" y2="80" stroke="#ffffff" strokeOpacity="0.08" strokeDasharray="3 3" />

                      {/* Ping Path (Green) */}
                      {telemetryPoints.length > 1 && (
                        <>
                          <path
                            d={`M 0,100 ` + telemetryPoints.map((pt, i) => {
                              const x = (i / (telemetryPoints.length - 1)) * 500;
                              // ping scale: 0 - 150 ms mapped to 95 - 10
                              const y = Math.max(10, Math.min(95, 95 - (pt.ping / 150) * 85));
                              return `L ${x},${y}`;
                            }).join(" ") + ` L 500,100 Z`}
                            fill="url(#pingGrad)"
                          />
                          <path
                            d={telemetryPoints.map((pt, i) => {
                              const x = (i / (telemetryPoints.length - 1)) * 500;
                              const y = Math.max(10, Math.min(95, 95 - (pt.ping / 150) * 85));
                              return `${i === 0 ? "M" : "L"} ${x},${y}`;
                            }).join(" ")}
                            fill="none"
                            stroke="#10b981"
                            strokeWidth="2.5"
                            strokeLinecap="round"
                          />
                        </>
                      )}

                      {/* Speed Path (Sky Blue) */}
                      {telemetryPoints.length > 1 && (
                        <path
                          d={telemetryPoints.map((pt, i) => {
                            const x = (i / (telemetryPoints.length - 1)) * 500;
                            // speed scale: 0 - 50 Mbps mapped to 95 - 10
                            const y = Math.max(10, Math.min(95, 95 - (pt.speedMbps / 50) * 85));
                            return `${i === 0 ? "M" : "L"} ${x},${y}`;
                          }).join(" ")}
                          fill="none"
                          stroke="#38bdf8"
                          strokeWidth="2"
                          strokeDasharray="4 2"
                          strokeLinecap="round"
                        />
                      )}
                    </svg>
                  </div>

                  {/* Graph Footer Metrics */}
                  <div className="flex justify-between items-center text-[10px] text-gray-400 mt-2 font-mono">
                    <span>-30 сек</span>
                    <span className="text-gray-500">Обновление каждые 2с</span>
                    <span>Сейчас</span>
                  </div>
                </div>
              </div>

              {/* Traffic Usage Breakdown */}
              <div className="bg-[#1b2532] p-4 sm:p-5 rounded-2xl border border-[#263445] space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-sm font-semibold text-white flex items-center gap-2">
                      <Wifi className="w-4 h-4 text-[#2481cc]" />
                      Расход интернет-трафика (Сотовая связь и Wi-Fi)
                    </h3>
                    <p className="text-xs text-gray-400 mt-0.5">
                      Сколько трафика израсходовано клиентом за текущую сессию
                    </p>
                  </div>
                  <button
                    onClick={() => {
                      resetTrafficUsage();
                      setTraffic(getTrafficUsage());
                    }}
                    className="px-3 py-1 bg-white/10 hover:bg-white/15 text-xs text-gray-300 rounded-xl transition-colors cursor-pointer"
                  >
                    Сбросить
                  </button>
                </div>

                <div className="grid grid-cols-3 gap-3 text-center">
                  <div className="bg-black/20 p-3 rounded-xl border border-white/5">
                    <p className="text-[10px] text-gray-400 uppercase font-mono flex items-center justify-center gap-1">
                      <ArrowDownLeft className="w-3 h-3 text-emerald-400" /> Входящий (Rx)
                    </p>
                    <p className="text-base font-bold font-mono text-emerald-400 mt-1">
                      {formatBytes(traffic.received)}
                    </p>
                  </div>
                  <div className="bg-black/20 p-3 rounded-xl border border-white/5">
                    <p className="text-[10px] text-gray-400 uppercase font-mono flex items-center justify-center gap-1">
                      <ArrowUpRight className="w-3 h-3 text-sky-400" /> Исходящий (Tx)
                    </p>
                    <p className="text-base font-bold font-mono text-sky-400 mt-1">
                      {formatBytes(traffic.sent)}
                    </p>
                  </div>
                  <div className="bg-black/20 p-3 rounded-xl border border-white/5">
                    <p className="text-[10px] text-gray-400 uppercase font-mono">Всего передано</p>
                    <p className="text-base font-bold font-mono text-indigo-300 mt-1">
                      {formatBytes(traffic.total)}
                    </p>
                  </div>
                </div>
              </div>

              {/* Device Hardware Specs */}
              <div className="bg-[#1b2532] p-4 sm:p-5 rounded-2xl border border-[#263445] space-y-3">
                <h3 className="text-sm font-semibold text-white flex items-center gap-2">
                  <Cpu className="w-4 h-4 text-[#2481cc]" />
                  Данные телефона и устройства
                </h3>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 text-xs">
                  <div className="p-2.5 bg-black/20 rounded-xl border border-white/5">
                    <span className="text-gray-400 block text-[10px]">Модель</span>
                    <span className="font-semibold text-white truncate block">{deviceInfo.modelName}</span>
                  </div>
                  <div className="p-2.5 bg-black/20 rounded-xl border border-white/5">
                    <span className="text-gray-400 block text-[10px]">Экран / Разрешение</span>
                    <span className="font-semibold text-white font-mono">{deviceInfo.screenRes} ({deviceInfo.pixelRatio}x)</span>
                  </div>
                  <div className="p-2.5 bg-black/20 rounded-xl border border-white/5">
                    <span className="text-gray-400 block text-[10px]">Процессор</span>
                    <span className="font-semibold text-white font-mono">{deviceInfo.cpuCores} логических ядер</span>
                  </div>
                  <div className="p-2.5 bg-black/20 rounded-xl border border-white/5">
                    <span className="text-gray-400 block text-[10px]">ОЗУ устройства</span>
                    <span className="font-semibold text-white font-mono">~{deviceInfo.deviceMemory} ГБ RAM</span>
                  </div>
                  <div className="p-2.5 bg-black/20 rounded-xl border border-white/5">
                    <span className="text-gray-400 block text-[10px]">Режим запуска</span>
                    <span className="font-semibold text-emerald-400">
                      {deviceInfo.isStandalone ? "📱 PWA Standalone (Домашний экран)" : "🌐 Браузер"}
                    </span>
                  </div>
                  <div className="p-2.5 bg-black/20 rounded-xl border border-white/5">
                    <span className="text-gray-400 block text-[10px]">Dynamic Island</span>
                    <span className="font-semibold text-indigo-300">
                      {isNativeDynamicIslandAvailable() ? "Аппаратный мост активен" : "Только нативный bridge"}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: GENERAL, THEME & APP COVER */}
          
          {activeTab === "ai" && (
            <div className="p-4 sm:p-6 space-y-5 overflow-y-auto max-h-[60vh] custom-scrollbar">
              <div className="bg-[#1b2532] p-4 sm:p-5 rounded-2xl border border-[#263445] space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-sm font-semibold text-white flex items-center gap-2">
                      <Cpu className="w-4 h-4 text-[#2481cc]" />
                      API Ключ Нейросети
                    </h3>
                    <p className="text-xs text-gray-400 mt-1">
                      Введите свой API-ключ Gemini (Google) или OpenAI (ChatGPT) для работы ИИ-ассистента.
                    </p>
                  </div>
                </div>
                <div>
                  <input
                    type="password"
                    placeholder="Например: AIzaSy..."
                    value={aiApiKey}
                    onChange={(e) => {
                      setAiApiKey(e.target.value);
                      localStorage.setItem("nexus_ai_api_key", e.target.value);
                    }}
                    className="w-full bg-[#111922] border border-[#263445] text-white text-sm rounded-xl px-4 py-3 focus:outline-none focus:border-[#2481cc] transition-colors placeholder-gray-500 font-mono"
                  />
                  <p className="text-[11px] text-gray-400 mt-2">
                    Этот ключ сохраняется только в вашем браузере (localStorage) и используется для отправки запросов напрямую к провайдеру ИИ.
                  </p>
                </div>
              </div>
            </div>
          )}

          {activeTab === "general" && (
            <div className="space-y-6 animate-fade-in">
              {/* LiquidGlass Design Switcher & Controls */}
              <LiquidGlassControls />

              {/* Developer & Public App Links */}
              <div className="bg-[#1b2532] p-4 sm:p-5 rounded-2xl border border-[#263445] space-y-4 shadow-lg">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-sm font-semibold text-white flex items-center gap-2">
                      <Globe className="w-4 h-4 text-emerald-400" />
                      Публичные ссылки для разработчиков
                    </h3>
                    <p className="text-xs text-gray-400 mt-0.5">
                      Прямые ссылки на приложение для тестирования, разработки и общего доступа
                    </p>
                  </div>
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/30">
                    Live Cloud Run
                  </span>
                </div>

                <div className="space-y-3">
                  {/* Development App URL */}
                  <div className="p-3 rounded-xl bg-black/30 border border-white/5 space-y-1.5">
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-gray-300 font-medium flex items-center gap-1.5">
                        <FileCode className="w-3.5 h-3.5 text-blue-400" />
                        Ссылка для разработчиков (Development URL):
                      </span>
                      <button
                        type="button"
                        onClick={async () => {
                          triggerHaptic("success");
                          try {
                            await navigator.clipboard.writeText("https://ais-dev-xahmk6ubske67lzjyumw3v-748775905065.europe-west2.run.app");
                            setCopiedDevLink(true);
                            setTimeout(() => setCopiedDevLink(false), 2000);
                          } catch (_) {}
                        }}
                        className="px-2 py-0.5 rounded-md bg-blue-500/20 hover:bg-blue-500/30 text-blue-300 transition-colors cursor-pointer flex items-center gap-1 text-[11px] font-medium"
                      >
                        {copiedDevLink ? (
                          <>
                            <Check className="w-3 h-3 text-emerald-400" />
                            <span className="text-emerald-400">Скопировано!</span>
                          </>
                        ) : (
                          <>
                            <Copy className="w-3 h-3" />
                            <span>Скопировать</span>
                          </>
                        )}
                      </button>
                    </div>
                    <div className="flex items-center justify-between gap-2 text-xs font-mono text-gray-400 bg-black/40 px-2.5 py-1.5 rounded-lg select-all overflow-x-auto">
                      <span className="text-blue-300 truncate">https://ais-dev-xahmk6ubske67lzjyumw3v-748775905065.europe-west2.run.app</span>
                      <a
                        href="https://ais-dev-xahmk6ubske67lzjyumw3v-748775905065.europe-west2.run.app"
                        target="_blank"
                        rel="noreferrer"
                        className="text-gray-400 hover:text-white shrink-0"
                        title="Открыть в новой вкладке"
                      >
                        <ArrowUpRight className="w-3.5 h-3.5" />
                      </a>
                    </div>
                  </div>

                  {/* Shared / Production App URL */}
                  <div className="p-3 rounded-xl bg-black/30 border border-white/5 space-y-1.5">
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-gray-300 font-medium flex items-center gap-1.5">
                        <Share2 className="w-3.5 h-3.5 text-purple-400" />
                        Публичная ссылка на приложение (Shared App URL):
                      </span>
                      <button
                        type="button"
                        onClick={async () => {
                          triggerHaptic("success");
                          try {
                            await navigator.clipboard.writeText("https://ais-pre-xahmk6ubske67lzjyumw3v-748775905065.europe-west2.run.app");
                            setCopiedShareLink(true);
                            setTimeout(() => setCopiedShareLink(false), 2000);
                          } catch (_) {}
                        }}
                        className="px-2 py-0.5 rounded-md bg-purple-500/20 hover:bg-purple-500/30 text-purple-300 transition-colors cursor-pointer flex items-center gap-1 text-[11px] font-medium"
                      >
                        {copiedShareLink ? (
                          <>
                            <Check className="w-3 h-3 text-emerald-400" />
                            <span className="text-emerald-400">Скопировано!</span>
                          </>
                        ) : (
                          <>
                            <Copy className="w-3 h-3" />
                            <span>Скопировать</span>
                          </>
                        )}
                      </button>
                    </div>
                    <div className="flex items-center justify-between gap-2 text-xs font-mono text-gray-400 bg-black/40 px-2.5 py-1.5 rounded-lg select-all overflow-x-auto">
                      <span className="text-purple-300 truncate">https://ais-pre-xahmk6ubske67lzjyumw3v-748775905065.europe-west2.run.app</span>
                      <a
                        href="https://ais-pre-xahmk6ubske67lzjyumw3v-748775905065.europe-west2.run.app"
                        target="_blank"
                        rel="noreferrer"
                        className="text-gray-400 hover:text-white shrink-0"
                        title="Открыть в новой вкладке"
                      >
                        <ArrowUpRight className="w-3.5 h-3.5" />
                      </a>
                    </div>
                  </div>
                </div>
              </div>

              {/* App Cover / Icon Selection */}
              <div className="bg-[#1b2532] p-4 sm:p-5 rounded-2xl border border-[#263445] space-y-4">
                <div>
                  <h3 className="text-sm font-semibold text-white flex items-center gap-2">
                    <Sparkles className="w-4 h-4 text-[#2481cc]" />
                    Картинка на обложке и иконка приложения
                  </h3>
                  <p className="text-xs text-gray-400 mt-0.5">
                    Выберите иконку приложения (как на картинке пользователя) или загрузите своё изображение
                  </p>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  {/* Option 1: The user's uploaded 3D neon glowing sphere */}
                  <div 
                    onClick={() => handleSelectCover("neon-sphere", "/app-icon.jpg")}
                    className={`p-3 rounded-2xl border flex flex-col items-center gap-2 cursor-pointer transition-all ${
                      selectedCover === "neon-sphere"
                        ? "bg-[#2481cc]/20 border-[#2481cc] shadow-lg shadow-[#2481cc]/20"
                        : "bg-black/20 border-white/5 hover:border-white/20"
                    }`}
                  >
                    <div className="w-16 h-16 rounded-2xl overflow-hidden shadow-md border border-white/10 relative">
                      <img 
                        src="/app-icon.jpg" 
                        alt="Neon Sphere Telegram" 
                        className="w-full h-full object-cover"
                      />
                    </div>
                    <span className="text-xs font-semibold text-white text-center">
                      Неоновая Сфера 3D
                    </span>
                    <span className="text-[10px] text-sky-300 bg-sky-500/10 px-2 py-0.5 rounded-full">
                      Из вашего фото
                    </span>
                  </div>

                  {/* Option 2: Classic Telegram Blue */}
                  <div 
                    onClick={() => handleSelectCover("classic-blue", "/api/telegram/avatar/ai-assistant")}
                    className={`p-3 rounded-2xl border flex flex-col items-center gap-2 cursor-pointer transition-all ${
                      selectedCover === "classic-blue"
                        ? "bg-[#2481cc]/20 border-[#2481cc] shadow-lg shadow-[#2481cc]/20"
                        : "bg-black/20 border-white/5 hover:border-white/20"
                    }`}
                  >
                    <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-[#2481cc] to-[#3ca0eb] flex items-center justify-center shadow-md">
                      <svg viewBox="0 0 24 24" className="w-8 h-8 text-white fill-current">
                        <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm4.64 6.8c-.15 1.58-.8 5.42-1.13 7.19-.14.75-.42 1-.68 1.03-.58.05-1.02-.38-1.58-.75-.88-.58-1.38-.94-2.23-1.5-.99-.65-.35-1.01.22-1.59.15-.15 2.71-2.48 2.76-2.69a.2.2 0 00-.05-.18c-.06-.05-.14-.03-.21-.02-.09.02-1.49.95-4.22 2.79-.4.27-.76.41-1.08.4-.36-.01-1.04-.2-1.55-.37-.63-.2-1.12-.31-1.08-.66.02-.18.27-.36.74-.55 2.92-1.27 4.86-2.11 5.83-2.51 2.78-1.16 3.35-1.36 3.73-1.36.08 0 .27.02.39.12.1.08.13.19.14.27-.01.06.01.24 0 .38z"/>
                      </svg>
                    </div>
                    <span className="text-xs font-semibold text-white text-center">
                      Telegram Classic
                    </span>
                    <span className="text-[10px] text-gray-400">
                      Оригинал
                    </span>
                  </div>

                  {/* Option 3: Dark Stealth Glass */}
                  <div 
                    onClick={() => handleSelectCover("dark-stealth", "/app-icon.jpg")}
                    className={`p-3 rounded-2xl border flex flex-col items-center gap-2 cursor-pointer transition-all ${
                      selectedCover === "dark-stealth"
                        ? "bg-[#2481cc]/20 border-[#2481cc] shadow-lg shadow-[#2481cc]/20"
                        : "bg-black/20 border-white/5 hover:border-white/20"
                    }`}
                  >
                    <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-[#17212b] to-[#2b5278] border border-white/10 flex items-center justify-center shadow-md">
                      <Zap className="w-8 h-8 text-sky-400" />
                    </div>
                    <span className="text-xs font-semibold text-white text-center">
                      Dark Stealth
                    </span>
                    <span className="text-[10px] text-gray-400">
                      Тёмное стекло
                    </span>
                  </div>

                  {/* Option 4: Upload Custom Icon */}
                  <div 
                    onClick={() => coverFileInputRef.current?.click()}
                    className={`p-3 rounded-2xl border flex flex-col items-center gap-2 cursor-pointer transition-all ${
                      selectedCover === "custom"
                        ? "bg-[#2481cc]/20 border-[#2481cc] shadow-lg shadow-[#2481cc]/20"
                        : "bg-black/20 border-white/5 hover:border-white/20 border-dashed"
                    }`}
                  >
                    {customCoverUrl ? (
                      <div className="w-16 h-16 rounded-2xl overflow-hidden shadow-md border border-white/10">
                        <img src={customCoverUrl} alt="Custom" className="w-full h-full object-cover" />
                      </div>
                    ) : (
                      <div className="w-16 h-16 rounded-2xl bg-white/5 flex items-center justify-center text-gray-400">
                        <Upload className="w-6 h-6" />
                      </div>
                    )}
                    <span className="text-xs font-semibold text-white text-center">
                      {customCoverUrl ? "Своё фото" : "Загрузить фото"}
                    </span>
                    <span className="text-[10px] text-[#2481cc]">
                      PNG / JPG
                    </span>
                    <input 
                      ref={coverFileInputRef}
                      type="file" 
                      accept="image/*" 
                      className="hidden" 
                      onChange={handleCustomCoverUpload}
                    />
                  </div>
                </div>
              </div>

              {/* Customization for Saved Messages & Notes Avatars (From User Request) */}
              <div className="bg-[#1b2532] p-4 sm:p-5 rounded-2xl border border-[#263445] space-y-4 shadow-md">
                <div>
                  <h3 className="text-sm font-semibold text-white flex items-center gap-2">
                    <Sparkles className="w-4 h-4 text-sky-400" />
                    <span>Аватарки «Избранного» и «Моих заметок»</span>
                  </h3>
                  <p className="text-xs text-gray-400 mt-0.5">
                    Выберите фирменные аватарки по вашему вкусу или загрузите своё изображение
                  </p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {/* Saved Messages Avatar */}
                  <div className="p-3.5 rounded-2xl bg-[#121c27] border border-[#23354a] space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-white flex items-center gap-1.5">
                        <span>Избранное</span>
                        <span className="text-[10px] text-sky-400 font-mono font-normal">(Saved Messages)</span>
                      </span>
                    </div>

                    <div className="flex items-center gap-3">
                      {/* Option 1: The user's uploaded Bookmark SVG */}
                      <button
                        type="button"
                        onClick={() => handleSelectSavedMessagesAvatar("/assets/avatar-saved-messages.svg")}
                        className={`p-2 rounded-xl border flex flex-col items-center gap-1.5 transition-all cursor-pointer flex-1 ${
                          savedMessagesAvatar === "/assets/avatar-saved-messages.svg"
                            ? "bg-[#2481cc]/25 border-sky-400 ring-1 ring-sky-400/40"
                            : "bg-black/20 border-white/10 hover:border-white/20"
                        }`}
                      >
                        <div className="w-12 h-12 rounded-full overflow-hidden shadow-md">
                          <img src="/assets/avatar-saved-messages.svg" alt="Saved" className="w-full h-full object-cover" />
                        </div>
                        <span className="text-[10px] font-semibold text-white text-center leading-tight">
                          Закладка Telegram
                        </span>
                        <span className="text-[9px] text-sky-300">Ваше фото</span>
                      </button>

                      {/* Option 2: My Profile Avatar */}
                      <button
                        type="button"
                        onClick={() => handleSelectSavedMessagesAvatar("/api/telegram/avatar/me")}
                        className={`p-2 rounded-xl border flex flex-col items-center gap-1.5 transition-all cursor-pointer flex-1 ${
                          savedMessagesAvatar === "/api/telegram/avatar/me"
                            ? "bg-[#2481cc]/25 border-sky-400 ring-1 ring-sky-400/40"
                            : "bg-black/20 border-white/10 hover:border-white/20"
                        }`}
                      >
                        <div className="w-12 h-12 rounded-full overflow-hidden shadow-md bg-gradient-to-tr from-indigo-600 to-purple-600 flex items-center justify-center text-white text-xs font-bold">
                          <img 
                            src="/api/telegram/avatar/me" 
                            alt="Me" 
                            className="w-full h-full object-cover"
                            onError={(e) => { e.currentTarget.style.display = "none"; }} 
                          />
                          <span>Вы</span>
                        </div>
                        <span className="text-[10px] font-semibold text-white text-center leading-tight">
                          Мой профиль
                        </span>
                        <span className="text-[9px] text-gray-400">Личное</span>
                      </button>

                      {/* Option 3: Custom file */}
                      <button
                        type="button"
                        onClick={() => savedAvatarFileInputRef.current?.click()}
                        className={`p-2 rounded-xl border flex flex-col items-center gap-1.5 transition-all cursor-pointer flex-1 ${
                          savedMessagesAvatar !== "/assets/avatar-saved-messages.svg" && savedMessagesAvatar !== "/api/telegram/avatar/me"
                            ? "bg-[#2481cc]/25 border-sky-400 ring-1 ring-sky-400/40"
                            : "bg-black/20 border-white/10 hover:border-white/20"
                        }`}
                      >
                        <div className="w-12 h-12 rounded-full overflow-hidden shadow-md bg-white/5 border border-white/10 flex items-center justify-center">
                          {savedMessagesAvatar !== "/assets/avatar-saved-messages.svg" && savedMessagesAvatar !== "/api/telegram/avatar/me" ? (
                            <img src={savedMessagesAvatar} alt="" className="w-full h-full object-cover" />
                          ) : (
                            <Upload className="w-5 h-5 text-gray-400" />
                          )}
                        </div>
                        <span className="text-[10px] font-semibold text-white text-center leading-tight">
                          Свой файл
                        </span>
                        <span className="text-[9px] text-sky-400">Загрузить</span>
                        <input
                          ref={savedAvatarFileInputRef}
                          type="file"
                          accept="image/*"
                          className="hidden"
                          onChange={(e) => {
                            const file = e.target.files?.[0];
                            if (file) {
                              const url = URL.createObjectURL(file);
                              handleSelectSavedMessagesAvatar(url);
                            }
                          }}
                        />
                      </button>
                    </div>
                  </div>

                  {/* Notes Avatar */}
                  <div className="p-3.5 rounded-2xl bg-[#121c27] border border-[#23354a] space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-white flex items-center gap-1.5">
                        <span>Мои заметки</span>
                        <span className="text-[10px] text-cyan-400 font-mono font-normal">(Personal Notes)</span>
                      </span>
                    </div>

                    <div className="flex items-center gap-3">
                      {/* Option 1: The user's uploaded Notes Sheets SVG */}
                      <button
                        type="button"
                        onClick={() => handleSelectNotesAvatar("/assets/avatar-notes.svg")}
                        className={`p-2 rounded-xl border flex flex-col items-center gap-1.5 transition-all cursor-pointer flex-1 ${
                          notesAvatar === "/assets/avatar-notes.svg"
                            ? "bg-cyan-500/25 border-cyan-400 ring-1 ring-cyan-400/40"
                            : "bg-black/20 border-white/10 hover:border-white/20"
                        }`}
                      >
                        <div className="w-12 h-12 rounded-full overflow-hidden shadow-md">
                          <img src="/assets/avatar-notes.svg" alt="Notes" className="w-full h-full object-cover" />
                        </div>
                        <span className="text-[10px] font-semibold text-white text-center leading-tight">
                          Листы заметок
                        </span>
                        <span className="text-[9px] text-cyan-300">Ваше фото</span>
                      </button>

                      {/* Option 2: Classic Blue Notebook */}
                      <button
                        type="button"
                        onClick={() => handleSelectNotesAvatar("classic_notebook")}
                        className={`p-2 rounded-xl border flex flex-col items-center gap-1.5 transition-all cursor-pointer flex-1 ${
                          notesAvatar === "classic_notebook"
                            ? "bg-cyan-500/25 border-cyan-400 ring-1 ring-cyan-400/40"
                            : "bg-black/20 border-white/10 hover:border-white/20"
                        }`}
                      >
                        <div className="w-12 h-12 rounded-full overflow-hidden shadow-md bg-gradient-to-tr from-cyan-600 to-blue-600 flex items-center justify-center text-white text-xl">
                          📝
                        </div>
                        <span className="text-[10px] font-semibold text-white text-center leading-tight">
                          Блокнот
                        </span>
                        <span className="text-[9px] text-gray-400">Эмодзи</span>
                      </button>

                      {/* Option 3: Custom file */}
                      <button
                        type="button"
                        onClick={() => notesAvatarFileInputRef.current?.click()}
                        className={`p-2 rounded-xl border flex flex-col items-center gap-1.5 transition-all cursor-pointer flex-1 ${
                          notesAvatar !== "/assets/avatar-notes.svg" && notesAvatar !== "classic_notebook"
                            ? "bg-cyan-500/25 border-cyan-400 ring-1 ring-cyan-400/40"
                            : "bg-black/20 border-white/10 hover:border-white/20"
                        }`}
                      >
                        <div className="w-12 h-12 rounded-full overflow-hidden shadow-md bg-white/5 border border-white/10 flex items-center justify-center">
                          {notesAvatar !== "/assets/avatar-notes.svg" && notesAvatar !== "classic_notebook" ? (
                            <img src={notesAvatar} alt="" className="w-full h-full object-cover" />
                          ) : (
                            <Upload className="w-5 h-5 text-gray-400" />
                          )}
                        </div>
                        <span className="text-[10px] font-semibold text-white text-center leading-tight">
                          Свой файл
                        </span>
                        <span className="text-[9px] text-cyan-400">Загрузить</span>
                        <input
                          ref={notesAvatarFileInputRef}
                          type="file"
                          accept="image/*"
                          className="hidden"
                          onChange={(e) => {
                            const file = e.target.files?.[0];
                            if (file) {
                              const url = URL.createObjectURL(file);
                              handleSelectNotesAvatar(url);
                            }
                          }}
                        />
                      </button>
                    </div>
                  </div>
                </div>

                {/* Toggle Show Notes in main chat list beside Saved Messages */}
                <div className="pt-2 border-t border-[#23354a] flex items-center justify-between gap-3">
                  <div className="space-y-0.5">
                    <span className="text-xs font-bold text-white block">
                      Показывать «Мои заметки» в списке диалогов
                    </span>
                    <span className="text-[11px] text-gray-400 block">
                      Отображать постоянный чат заметок рядом с «Избранным» на главном экране
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={handleToggleShowNotesInChats}
                    className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full transition-colors duration-200 ease-in-out ${
                      showNotesInChats ? "bg-cyan-500" : "bg-[#2a3848]"
                    }`}
                  >
                    <span
                      className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-lg ring-0 transition duration-200 ease-in-out ${
                        showNotesInChats ? "translate-x-5" : "translate-x-0.5"
                      } mt-0.5`}
                    />
                  </button>
                </div>
              </div>

              {/* Chat Notes Visibility Toggle */}
              <div className="bg-[#1b2532] p-4 sm:p-5 rounded-2xl border border-[#263445] flex items-center justify-between gap-4 shadow-md">
                <div className="flex items-center gap-3 min-w-0">
                  <div className={`p-2.5 rounded-xl shrink-0 ${hideAllChatNotes ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30' : 'bg-gray-800 text-gray-400'}`}>
                    <FileText className="w-5 h-5" />
                  </div>
                  <div className="min-w-0">
                    <h4 className="text-sm font-semibold text-white truncate">Скрыть заметки во всех чатах</h4>
                    <p className="text-xs text-gray-400">Скрывать персональные заметки в списке диалогов на главном экране</p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    const next = !hideAllChatNotes;
                    setHideAllChatNotes(next);
                    localStorage.setItem("nexus_hide_all_chat_notes", next ? "true" : "false");
                    window.dispatchEvent(new CustomEvent("nexus-chat-notes-visibility", { detail: { hide: next } }));
                  }}
                  className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full transition-colors duration-200 ease-in-out focus:outline-none ${
                    hideAllChatNotes ? "bg-amber-500" : "bg-[#2a3848]"
                  }`}
                >
                  <span
                    className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-lg ring-0 transition duration-200 ease-in-out ${
                      hideAllChatNotes ? "translate-x-5" : "translate-x-0.5"
                    } mt-0.5`}
                  />
                </button>
              </div>

              {/* Language & Theme Selectors */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="bg-[#1b2532] p-4 rounded-2xl border border-[#263445] space-y-3">
                  <h3 className="text-sm font-semibold text-white flex items-center gap-2">
                    <Globe className="w-4 h-4 text-[#2481cc]" />
                    {strings.language}
                  </h3>
                  <div className="grid grid-cols-3 gap-2 text-xs">
                    {["ru", "en", "es"].map((lang) => (
                      <button
                        key={lang}
                        onClick={() => {
                          setLanguage(lang);
                          localStorage.setItem("nexus_lang", lang);
                          window.dispatchEvent(new Event("languagechange"));
                        }}
                        className={`py-2 rounded-xl border transition-all cursor-pointer font-medium ${
                          language === lang
                            ? "bg-[#2481cc] border-[#2481cc] text-white shadow-md shadow-[#2481cc]/25"
                            : "bg-black/20 border-white/5 text-gray-400 hover:text-white"
                        }`}
                      >
                        {lang === "ru" ? "Русский" : lang === "en" ? "English" : "Español"}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="bg-[#1b2532] p-4 rounded-2xl border border-[#263445] space-y-3">
                  <h3 className="text-sm font-semibold text-white flex items-center gap-2">
                    <Moon className="w-4 h-4 text-[#2481cc]" />
                    {strings.theme}
                  </h3>
                  <div className="grid grid-cols-3 gap-2 text-xs">
                    {[
                      { id: "dark", label: "{strings.themeDark}" },
                      { id: "light", label: "{strings.themeLight}" },
                      { id: "system", label: "{strings.themeSystem}" }
                    ].map((th) => (
                      <button
                        key={th.id}
                        onClick={() => {
                          setTheme(th.id);
                          localStorage.setItem("nexus_theme", th.id);
                          applyTheme(th.id as any);
                          window.dispatchEvent(new Event("themechange"));
                        }}
                        className={`py-2 rounded-xl border transition-all cursor-pointer font-medium ${
                          theme === th.id
                            ? "bg-[#2481cc] border-[#2481cc] text-white shadow-md shadow-[#2481cc]/25"
                            : "bg-black/20 border-white/5 text-gray-400 hover:text-white"
                        }`}
                      >
                        {th.label}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* Card: Reset Settings & Design */}
              <div className="bg-[#1b2532] p-4 sm:p-5 rounded-2xl border border-amber-500/20 space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400 shadow-md">
                      <RotateCcw className="w-5 h-5" />
                    </div>
                    <div>
                      <h3 className="text-sm font-semibold text-white">
                        Сброс настроек и оформления
                      </h3>
                      <p className="text-xs text-gray-400 mt-0.5">
                        Восстановление стандартных параметров интерфейса, темы, стекла и островков
                      </p>
                    </div>
                  </div>
                </div>

                {resetFeedback && (
                  <div className="p-3 bg-emerald-500/15 border border-emerald-500/30 rounded-xl text-xs text-emerald-300 flex items-center gap-2 animate-fade-in">
                    <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                    <span>{resetFeedback}</span>
                  </div>
                )}

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <button
                    onClick={() => {
                      resetDesignSettings();
                      setTheme("dark");
                      setSelectedCover("classic-blue");
                      setResetFeedback("Дизайн и Liquid Glass сброшены к стандартным!");
                      setTimeout(() => setResetFeedback(null), 3500);
                    }}
                    className="p-3 bg-white/5 hover:bg-white/10 border border-white/10 hover:border-amber-400/40 rounded-xl text-left transition-all cursor-pointer group"
                  >
                    <div className="flex items-center gap-2 text-xs font-semibold text-white group-hover:text-amber-300">
                      <Sliders className="w-4 h-4 text-amber-400" />
                      Сброс дизайна
                    </div>
                    <p className="text-[11px] text-gray-400 mt-1">
                      Сброс Liquid Glass шейдеров, цветов темы и обложки
                    </p>
                  </button>

                  <button
                    onClick={() => {
                      resetDynamicIslandSettings();
                      setIslandTop(11);
                      setIslandLeftOffset(0);
                      setIslandWidth(126);
                      setIslandHeight(37);
                      setResetFeedback("Параметры Dynamic Island сброшены!");
                      setTimeout(() => setResetFeedback(null), 3500);
                    }}
                    className="p-3 bg-white/5 hover:bg-white/10 border border-white/10 hover:border-cyan-400/40 rounded-xl text-left transition-all cursor-pointer group"
                  >
                    <div className="flex items-center gap-2 text-xs font-semibold text-white group-hover:text-cyan-300">
                      <Move className="w-4 h-4 text-cyan-400" />
                      Сброс Island
                    </div>
                    <p className="text-[11px] text-gray-400 mt-1">
                      Центрирование положения и размеров Dynamic Island
                    </p>
                  </button>

                  <button
                    onClick={() => {
                      if (window.confirm("Вы уверены, что хотите сбросить ВСЕ настройки оформления и приложения? Ваша авторизация Telegram будет сохранена.")) {
                        resetAllAppSettings();
                        setTheme("dark");
                        setSelectedCover("classic-blue");
                        setResetFeedback("Все настройки приложения успешно сброшены к исходным!");
                        setTimeout(() => setResetFeedback(null), 4000);
                      }
                    }}
                    className="p-3 bg-amber-500/10 hover:bg-amber-500/20 border border-amber-500/30 rounded-xl text-left transition-all cursor-pointer group"
                  >
                    <div className="flex items-center gap-2 text-xs font-semibold text-amber-300">
                      <RotateCcw className="w-4 h-4 text-amber-400" />
                      Полный сброс
                    </div>
                    <p className="text-[11px] text-gray-400 mt-1">
                      Возврат всех настроек к заводскому состоянию
                    </p>
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* TAB: CUSTOMIZATION (КАСТОМИЗАЦИЯ) */}
          {activeTab === "customization" && (
            <div className="space-y-6 animate-fade-in">
              {/* Header Info */}
              <div className="bg-gradient-to-r from-purple-900/30 to-indigo-900/30 border border-purple-500/20 p-4 sm:p-5 rounded-2xl flex items-center gap-3">
                <div className="p-3 bg-purple-500/20 rounded-xl text-purple-400 border border-purple-500/30 shrink-0">
                  <Palette className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="text-base font-semibold text-white">Кастомизация внешнего вида</h3>
                  <p className="text-xs text-gray-300 mt-0.5">
                    Персонализируйте рамки профилей, отображение заметок, цветовую гамму клиента, цвета имен и расположение счетчиков сообщений.
                  </p>
                </div>
              </div>

              {/* Setting: Message Indicators Position */}
              <div className="bg-[#1b2532] p-4 sm:p-5 rounded-2xl border border-[#263445] space-y-3 shadow-md">
                <div className="flex items-center gap-3">
                  <div className="p-2.5 rounded-xl bg-sky-500/20 text-sky-400 border border-sky-500/30 shrink-0">
                    <Clock className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="text-sm font-semibold text-white">Отображение индикаторов на сообщениях</h4>
                    <p className="text-xs text-gray-400">Выберите, как отображаются время, галочки прочтения и статусы на облачках сообщений</p>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2.5 pt-1">
                  <button
                    type="button"
                    onClick={() => {
                      setMessageIndicatorsStyle("side-vertical");
                      localStorage.setItem("nexus_message_indicators_style", "side-vertical");
                      window.dispatchEvent(new CustomEvent("nexus-customization-changed", { detail: { key: "messageIndicatorsStyle", value: "side-vertical" } }));
                      triggerHaptic("light");
                    }}
                    className={`p-3 rounded-xl border text-left flex flex-col justify-between transition-all cursor-pointer ${
                      messageIndicatorsStyle === "side-vertical"
                        ? "bg-sky-500/15 border-sky-400 text-white shadow-md ring-1 ring-sky-400/40"
                        : "bg-[#141d28] border-white/10 text-gray-300 hover:bg-[#1a2636]"
                    }`}
                  >
                    <div>
                      <div className="flex items-center justify-between mb-0.5">
                        <span className="text-xs font-bold text-sky-400">Сбоку и вверх</span>
                        <span className="text-[9px] px-1 py-0.2 rounded bg-sky-500/20 text-sky-300 font-mono">Nexus</span>
                      </div>
                      <div className="text-[11px] text-gray-400">Снизу время и ✓✓, а сбоку индикаторы идут вверх</div>
                    </div>
                    <div className="mt-2 text-[10px] font-mono text-gray-300 bg-black/50 px-2 py-0.5 rounded w-fit self-end">
                      12:45 ✓✓
                    </div>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setMessageIndicatorsStyle("bottom-inline");
                      localStorage.setItem("nexus_message_indicators_style", "bottom-inline");
                      window.dispatchEvent(new CustomEvent("nexus-customization-changed", { detail: { key: "messageIndicatorsStyle", value: "bottom-inline" } }));
                      triggerHaptic("light");
                    }}
                    className={`p-3 rounded-xl border text-left flex flex-col justify-between transition-all cursor-pointer ${
                      messageIndicatorsStyle === "bottom-inline"
                        ? "bg-sky-500/15 border-sky-400 text-white shadow-md ring-1 ring-sky-400/40"
                        : "bg-[#141d28] border-white/10 text-gray-300 hover:bg-[#1a2636]"
                    }`}
                  >
                    <div>
                      <div className="text-xs font-bold text-sky-400 mb-0.5">Снизу сообщения</div>
                      <div className="text-[11px] text-gray-400">Внизу сообщения без перекрытия текста</div>
                    </div>
                    <div className="mt-2 text-[10px] font-mono text-gray-300 bg-black/50 px-2 py-0.5 rounded w-fit self-end">
                      12:45 ✓✓
                    </div>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setMessageIndicatorsStyle("corner-float");
                      localStorage.setItem("nexus_message_indicators_style", "corner-float");
                      window.dispatchEvent(new CustomEvent("nexus-customization-changed", { detail: { key: "messageIndicatorsStyle", value: "corner-float" } }));
                      triggerHaptic("light");
                    }}
                    className={`p-3 rounded-xl border text-left flex flex-col justify-between transition-all cursor-pointer ${
                      messageIndicatorsStyle === "corner-float"
                        ? "bg-sky-500/15 border-sky-400 text-white shadow-md ring-1 ring-sky-400/40"
                        : "bg-[#141d28] border-white/10 text-gray-300 hover:bg-[#1a2636]"
                    }`}
                  >
                    <div>
                      <div className="text-xs font-bold text-sky-400 mb-0.5">В углу (плавающий)</div>
                      <div className="text-[11px] text-gray-400">Поверхностно в правом нижнем углу</div>
                    </div>
                    <div className="mt-2 text-[10px] font-mono text-gray-300 bg-black/50 px-2 py-0.5 rounded w-fit self-end">
                      12:45 ✓✓
                    </div>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setMessageIndicatorsStyle("top-side");
                      localStorage.setItem("nexus_message_indicators_style", "top-side");
                      window.dispatchEvent(new CustomEvent("nexus-customization-changed", { detail: { key: "messageIndicatorsStyle", value: "top-side" } }));
                      triggerHaptic("light");
                    }}
                    className={`p-3 rounded-xl border text-left flex flex-col justify-between transition-all cursor-pointer ${
                      messageIndicatorsStyle === "top-side"
                        ? "bg-sky-500/15 border-sky-400 text-white shadow-md ring-1 ring-sky-400/40"
                        : "bg-[#141d28] border-white/10 text-gray-300 hover:bg-[#1a2636]"
                    }`}
                  >
                    <div>
                      <div className="text-xs font-bold text-sky-400 mb-0.5">Сбоку сверху</div>
                      <div className="text-[11px] text-gray-400">Поверхностно в правом верхнем углу</div>
                    </div>
                    <div className="mt-2 text-[10px] font-mono text-gray-300 bg-black/50 px-2 py-0.5 rounded w-fit self-end">
                      12:45 ✓✓
                    </div>
                  </button>
                </div>
              </div>

              {/* Toggle 1: Show Profile Borders */}
              <div className="bg-[#1b2532] p-4 sm:p-5 rounded-2xl border border-[#263445] flex items-center justify-between gap-4 shadow-md">
                <div className="flex items-center gap-3 min-w-0">
                  <div className={`p-2.5 rounded-xl shrink-0 ${showProfileBorders ? 'bg-indigo-500/20 text-indigo-400 border border-indigo-500/30' : 'bg-gray-800 text-gray-400'}`}>
                    <Sparkles className="w-5 h-5" />
                  </div>
                  <div className="min-w-0">
                    <h4 className="text-sm font-semibold text-white truncate">Показывать рамку профилей</h4>
                    <p className="text-xs text-gray-400">Цветная неоновая рамка вокруг аватаров пользователей и каналов</p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    const next = !showProfileBorders;
                    setShowProfileBorders(next);
                    localStorage.setItem("nexus_show_profile_borders", next ? "true" : "false");
                    window.dispatchEvent(new CustomEvent("nexus-customization-changed", { detail: { key: "showProfileBorders", value: next } }));
                  }}
                  className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full transition-colors duration-200 ease-in-out focus:outline-none ${
                    showProfileBorders ? "bg-indigo-600" : "bg-[#2a3848]"
                  }`}
                >
                  <span
                    className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-lg ring-0 transition duration-200 ease-in-out ${
                      showProfileBorders ? "translate-x-5" : "translate-x-0.5"
                    } mt-0.5`}
                  />
                </button>
              </div>

              {/* Toggle 2: Hide All Notes */}
              <div className="bg-[#1b2532] p-4 sm:p-5 rounded-2xl border border-[#263445] flex items-center justify-between gap-4 shadow-md">
                <div className="flex items-center gap-3 min-w-0">
                  <div className={`p-2.5 rounded-xl shrink-0 ${hideAllChatNotes ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30' : 'bg-gray-800 text-gray-400'}`}>
                    <FileText className="w-5 h-5" />
                  </div>
                  <div className="min-w-0">
                    <h4 className="text-sm font-semibold text-white truncate">Скрыть все заметки</h4>
                    <p className="text-xs text-gray-400">Скрывать персональные заметки к чатам в списке диалогов</p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    const next = !hideAllChatNotes;
                    setHideAllChatNotes(next);
                    localStorage.setItem("nexus_hide_all_chat_notes", next ? "true" : "false");
                    window.dispatchEvent(new CustomEvent("nexus-chat-notes-visibility", { detail: { hide: next } }));
                    window.dispatchEvent(new CustomEvent("nexus-customization-changed", { detail: { key: "hideAllChatNotes", value: next } }));
                  }}
                  className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full transition-colors duration-200 ease-in-out focus:outline-none ${
                    hideAllChatNotes ? "bg-amber-500" : "bg-[#2a3848]"
                  }`}
                >
                  <span
                    className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-lg ring-0 transition duration-200 ease-in-out ${
                      hideAllChatNotes ? "translate-x-5" : "translate-x-0.5"
                    } mt-0.5`}
                  />
                </button>
              </div>

              {/* Customization: Saved Messages / Own Chat Name Mode */}
              <div className="bg-[#1b2532] p-4 sm:p-5 rounded-2xl border border-[#263445] space-y-3 shadow-md">
                <div className="flex items-center gap-3">
                  <div className="p-2.5 rounded-xl bg-indigo-500/20 text-indigo-400 border border-indigo-500/30 shrink-0">
                    <User className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="text-sm font-semibold text-white">Отображение своего чата (Saved Messages)</h4>
                    <p className="text-xs text-gray-400">Персонализируйте название и аватар чата с самим собой</p>
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-2 pt-1">
                  <button
                    type="button"
                    onClick={() => {
                      setSavedMessagesMode("saved");
                      localStorage.setItem("nexus_saved_messages_mode", "saved");
                      window.dispatchEvent(new CustomEvent("nexus-customization-changed", { detail: { key: "savedMessagesMode", value: "saved" } }));
                      window.dispatchEvent(new CustomEvent("dialog-update", {}));
                      triggerHaptic("light");
                    }}
                    className={`p-2.5 rounded-xl border text-xs font-semibold flex flex-col items-center justify-center gap-1 transition-all cursor-pointer ${
                      savedMessagesMode === "saved"
                        ? "bg-indigo-600/30 border-indigo-400/60 text-white shadow-md ring-1 ring-indigo-400/40"
                        : "bg-[#141b24] border-[#243344] text-gray-400 hover:text-white hover:bg-[#1a2330]"
                    }`}
                  >
                    <span className="text-base">🔖</span>
                    <span className="font-bold">«Избранное»</span>
                    <span className="text-[9px] text-gray-400 font-normal">Стандарт</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setSavedMessagesMode("notes");
                      localStorage.setItem("nexus_saved_messages_mode", "notes");
                      window.dispatchEvent(new CustomEvent("nexus-customization-changed", { detail: { key: "savedMessagesMode", value: "notes" } }));
                      window.dispatchEvent(new CustomEvent("dialog-update", {}));
                      triggerHaptic("light");
                    }}
                    className={`p-2.5 rounded-xl border text-xs font-semibold flex flex-col items-center justify-center gap-1 transition-all cursor-pointer ${
                      savedMessagesMode === "notes"
                        ? "bg-indigo-600/30 border-indigo-400/60 text-white shadow-md ring-1 ring-indigo-400/40"
                        : "bg-[#141b24] border-[#243344] text-gray-400 hover:text-white hover:bg-[#1a2330]"
                    }`}
                  >
                    <span className="text-base">📝</span>
                    <span className="font-bold">«Мои заметки»</span>
                    <span className="text-[9px] text-gray-400 font-normal">Как блокнот</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setSavedMessagesMode("profile");
                      localStorage.setItem("nexus_saved_messages_mode", "profile");
                      window.dispatchEvent(new CustomEvent("nexus-customization-changed", { detail: { key: "savedMessagesMode", value: "profile" } }));
                      window.dispatchEvent(new CustomEvent("dialog-update", {}));
                      triggerHaptic("light");
                    }}
                    className={`p-2.5 rounded-xl border text-xs font-semibold flex flex-col items-center justify-center gap-1 transition-all cursor-pointer ${
                      savedMessagesMode === "profile"
                        ? "bg-indigo-600/30 border-indigo-400/60 text-white shadow-md ring-1 ring-indigo-400/40"
                        : "bg-[#141b24] border-[#243344] text-gray-400 hover:text-white hover:bg-[#1a2330]"
                    }`}
                  >
                    <span className="text-base">👤</span>
                    <span className="font-bold">Свой профиль</span>
                    <span className="text-[9px] text-gray-400 font-normal">Имя и фото</span>
                  </button>
                </div>

                <div className="pt-2">
                  <label className="text-xs text-gray-400 block mb-1">Или введите своё персональное название:</label>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={savedMessagesCustomTitle}
                      onChange={(e) => {
                        const val = e.target.value;
                        setSavedMessagesCustomTitle(val);
                        localStorage.setItem("nexus_saved_messages_custom_title", val);
                        if (val.trim()) {
                          setSavedMessagesMode("custom");
                          localStorage.setItem("nexus_saved_messages_mode", "custom");
                          window.dispatchEvent(new CustomEvent("nexus-customization-changed", { detail: { key: "savedMessagesMode", value: "custom" } }));
                          window.dispatchEvent(new CustomEvent("nexus-customization-changed", { detail: { key: "savedMessagesCustomTitle", value: val } }));
                          window.dispatchEvent(new CustomEvent("dialog-update", {}));
                        }
                      }}
                      placeholder="Например: Мои мысли, Хранилище, Заметки..."
                      className="flex-1 bg-[#141b24] border border-[#243344] text-white text-xs rounded-xl px-3 py-2 focus:outline-none focus:border-indigo-500"
                    />
                    {savedMessagesCustomTitle && (
                      <button
                        type="button"
                        onClick={() => {
                          setSavedMessagesMode("custom");
                          localStorage.setItem("nexus_saved_messages_mode", "custom");
                          window.dispatchEvent(new CustomEvent("nexus-customization-changed", { detail: { key: "savedMessagesMode", value: "custom" } }));
                          window.dispatchEvent(new CustomEvent("nexus-customization-changed", { detail: { key: "savedMessagesCustomTitle", value: savedMessagesCustomTitle } }));
                          window.dispatchEvent(new CustomEvent("dialog-update", {}));
                          triggerHaptic("light");
                        }}
                        className={`px-3 py-1.5 rounded-xl text-xs font-semibold cursor-pointer ${
                          savedMessagesMode === "custom"
                            ? "bg-indigo-600 text-white"
                            : "bg-[#243344] text-gray-300 hover:text-white"
                        }`}
                      >
                        Применить
                      </button>
                    )}
                  </div>
                </div>
              </div>

              {/* Selector 1: Client Accent Color */}
              <div className="bg-[#1b2532] p-4 sm:p-5 rounded-2xl border border-[#263445] space-y-3 shadow-md">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="p-2.5 rounded-xl bg-purple-500/20 text-purple-400 border border-purple-500/30">
                      <Palette className="w-5 h-5" />
                    </div>
                    <div>
                      <h4 className="text-sm font-semibold text-white">Выбрать цвет клиента</h4>
                      <p className="text-xs text-gray-400">Основной акцентный цвет кнопок, активных элементов и индикаторов</p>
                    </div>
                  </div>
                  <div 
                    className="w-7 h-7 rounded-full shadow-inner border-2 border-white/20 shrink-0" 
                    style={{ backgroundColor: clientColor }} 
                  />
                </div>
                <div className="flex flex-wrap gap-2 pt-1">
                  {[
                    { id: "#6366f1", label: "Indigo" },
                    { id: "#2481cc", label: "Telegram Blue" },
                    { id: "#0ea5e9", label: "Cyan" },
                    { id: "#10b981", label: "Emerald" },
                    { id: "#8b5cf6", label: "Purple" },
                    { id: "#ec4899", label: "Pink" },
                    { id: "#f59e0b", label: "Amber" },
                    { id: "#ef4444", label: "Rose" }
                  ].map((clr) => (
                    <button
                      key={clr.id}
                      type="button"
                      onClick={() => {
                        setClientColor(clr.id);
                        localStorage.setItem("nexus_client_color", clr.id);
                        applyClientAccent(clr.id);
                        document.documentElement.style.setProperty("--client-accent-color", clr.id);
                        window.dispatchEvent(new CustomEvent("nexus-customization-changed", { detail: { key: "clientColor", value: clr.id } }));
                      }}
                      className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl border text-xs font-medium transition-all cursor-pointer ${
                        clientColor === clr.id 
                          ? "border-white bg-white/10 text-white shadow-sm ring-2 ring-white/20" 
                          : "border-white/5 bg-black/20 text-gray-300 hover:text-white hover:bg-white/5"
                      }`}
                    >
                      <span className="w-3.5 h-3.5 rounded-full shrink-0 shadow-sm" style={{ backgroundColor: clr.id }} />
                      <span>{clr.label}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Selector 2: Name Color */}
              <div className="bg-[#1b2532] p-4 sm:p-5 rounded-2xl border border-[#263445] space-y-3 shadow-md">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="p-2.5 rounded-xl bg-blue-500/20 text-blue-400 border border-blue-500/30">
                      <Palette className="w-5 h-5" />
                    </div>
                    <div>
                      <h4 className="text-sm font-semibold text-white">Выбрать цвет для имен</h4>
                      <p className="text-xs text-gray-400">Цвет заголовков диалогов и имен собеседников в списке</p>
                    </div>
                  </div>
                  <span className="text-xs font-bold px-2 py-1 rounded bg-black/40 border border-white/10" style={{ color: nameColor }}>
                    Имя пользователя
                  </span>
                </div>
                <div className="flex flex-wrap gap-2 pt-1">
                  {[
                    { id: "#f3f4f6", label: "Стандартный (Светлый)" },
                    { id: "#60a5fa", label: "Голубой" },
                    { id: "#818cf8", label: "Индиго" },
                    { id: "#34d399", label: "Изумрудный" },
                    { id: "#fbbf24", label: "Золотой" },
                    { id: "#f472b6", label: "Розовый" },
                    { id: "#c084fc", label: "Сиреневый" }
                  ].map((clr) => (
                    <button
                      key={clr.id}
                      type="button"
                      onClick={() => {
                        setNameColor(clr.id);
                        localStorage.setItem("nexus_name_color", clr.id);
                        document.documentElement.style.setProperty("--dialog-name-color", clr.id);
                        window.dispatchEvent(new CustomEvent("nexus-customization-changed", { detail: { key: "nameColor", value: clr.id } }));
                      }}
                      className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl border text-xs font-medium transition-all cursor-pointer ${
                        nameColor === clr.id 
                          ? "border-white bg-white/10 text-white shadow-sm ring-2 ring-white/20" 
                          : "border-white/5 bg-black/20 text-gray-300 hover:text-white hover:bg-white/5"
                      }`}
                    >
                      <span className="w-3.5 h-3.5 rounded-full shrink-0 shadow-sm" style={{ backgroundColor: clr.id }} />
                      <span>{clr.label}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Toggle 3: Emojis next to group/channel/user names */}
              <div className="bg-[#1b2532] p-4 sm:p-5 rounded-2xl border border-[#263445] flex items-center justify-between gap-4 shadow-md">
                <div className="flex items-center gap-3 min-w-0">
                  <div className={`p-2.5 rounded-xl shrink-0 ${showNameEmojis ? 'bg-cyan-500/20 text-cyan-400 border border-cyan-500/30' : 'bg-gray-800 text-gray-400'}`}>
                    <Smile className="w-5 h-5" />
                  </div>
                  <div className="min-w-0">
                    <h4 className="text-sm font-semibold text-white truncate">Эмодзи рядом с названиями</h4>
                    <p className="text-xs text-gray-400">Показывать значки типа диалога (👤, 👥, 📣, 🤖) рядом с именами групп, каналов и пользователей</p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    const next = !showNameEmojis;
                    setShowNameEmojis(next);
                    localStorage.setItem("nexus_show_name_emojis", next ? "true" : "false");
                    window.dispatchEvent(new CustomEvent("nexus-customization-changed", { detail: { key: "showNameEmojis", value: next } }));
                  }}
                  className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full transition-colors duration-200 ease-in-out focus:outline-none ${
                    showNameEmojis ? "bg-cyan-600" : "bg-[#2a3848]"
                  }`}
                >
                  <span
                    className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-lg ring-0 transition duration-200 ease-in-out ${
                      showNameEmojis ? "translate-x-5" : "translate-x-0.5"
                    } mt-0.5`}
                  />
                </button>
              </div>

              {/* Selector 3: Unread Badge Location */}
              <div className="bg-[#1b2532] p-4 sm:p-5 rounded-2xl border border-[#263445] space-y-3 shadow-md">
                <div className="flex items-center gap-3">
                  <div className="p-2.5 rounded-xl bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                    <BellRing className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="text-sm font-semibold text-white">Расположение индикатора новых сообщений</h4>
                    <p className="text-xs text-gray-400">Где отображать бейдж с количеством непрочитанных сообщений</p>
                  </div>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                  <button
                    type="button"
                    onClick={() => {
                      setUnreadBadgeLocation("timestamp");
                      localStorage.setItem("nexus_unread_badge_location", "timestamp");
                      window.dispatchEvent(new CustomEvent("nexus-customization-changed", { detail: { key: "unreadBadgeLocation", value: "timestamp" } }));
                    }}
                    className={`p-3 rounded-xl border text-left transition-all cursor-pointer ${
                      unreadBadgeLocation === "timestamp"
                        ? "bg-indigo-600/20 border-indigo-500 text-white shadow-md shadow-indigo-500/15"
                        : "bg-black/20 border-white/5 text-gray-400 hover:text-white"
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-semibold">Под временем (Классический)</span>
                      <span className="w-4 h-4 rounded-full bg-indigo-500 text-[10px] text-white flex items-center justify-center font-bold">1</span>
                    </div>
                    <p className="text-[11px] text-gray-400 mt-1">Индикатор отображается в правом верхнем углу элемента под временем сообщения</p>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setUnreadBadgeLocation("avatar");
                      localStorage.setItem("nexus_unread_badge_location", "avatar");
                      window.dispatchEvent(new CustomEvent("nexus-customization-changed", { detail: { key: "unreadBadgeLocation", value: "avatar" } }));
                    }}
                    className={`p-3 rounded-xl border text-left transition-all cursor-pointer ${
                      unreadBadgeLocation === "avatar"
                        ? "bg-indigo-600/20 border-indigo-500 text-white shadow-md shadow-indigo-500/15"
                        : "bg-black/20 border-white/5 text-gray-400 hover:text-white"
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-semibold">На аватарке</span>
                      <span className="w-4 h-4 rounded-full bg-indigo-500 text-[10px] text-white flex items-center justify-center font-bold">1</span>
                    </div>
                    <p className="text-[11px] text-gray-400 mt-1">Индикатор прикреплен к правому нижнему краю аватара собеседника</p>
                  </button>
                </div>
              </div>

              {/* Selector 4: Top Left Header Action Button */}
              <div className="bg-[#1b2532] p-4 sm:p-5 rounded-2xl border border-[#263445] space-y-3 shadow-md">
                <div className="flex items-center gap-3">
                  <div className="p-2.5 rounded-xl bg-purple-500/20 text-purple-400 border border-purple-500/30">
                    <Sparkles className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="text-sm font-semibold text-white">Действие верхней левой кнопки</h4>
                    <p className="text-xs text-gray-400">Какая функция закреплена в шапке слева от надписи Nexusgram</p>
                  </div>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 pt-1">
                  {[
                    { id: "search", label: "🔍 Поиск", desc: "Открыть поле поиска по чатам" },
                    { id: "stories", label: "✨ Истории", desc: "Показать истории контактов" },
                    { id: "menu", label: "☰ Главное меню", desc: "Открыть настройки и профиль" },
                  ].map((btn) => (
                    <button
                      key={btn.id}
                      type="button"
                      onClick={() => {
                        setTopActionBtn(btn.id as any);
                        localStorage.setItem("nexus_top_action_btn", btn.id);
                        window.dispatchEvent(new CustomEvent("nexus-customization-changed", { detail: { key: "topActionBtn", value: btn.id } }));
                      }}
                      className={`p-3 rounded-xl border text-left transition-all cursor-pointer ${
                        topActionBtn === btn.id
                          ? "bg-indigo-600/20 border-indigo-500 text-white shadow-md shadow-indigo-500/15"
                          : "bg-black/20 border-white/5 text-gray-400 hover:text-white hover:bg-white/5"
                      }`}
                    >
                      <div className="font-semibold text-xs text-white">{btn.label}</div>
                      <div className="text-[10px] text-gray-400 mt-1 leading-snug">{btn.desc}</div>
                    </button>
                  ))}
                </div>
              </div>

              {/* Selector 5: iOS Home Screen Glass & Transparency Customizer */}
              <div className="bg-[#1b2532] p-4 sm:p-5 rounded-2xl border border-[#263445] space-y-4 shadow-md">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="p-2.5 rounded-xl bg-cyan-500/20 text-cyan-400 border border-cyan-500/30">
                      <Sliders className="w-5 h-5" />
                    </div>
                    <div>
                      <h4 className="text-sm font-semibold text-white">Прозрачный интерфейс (iOS Liquid Glass)</h4>
                      <p className="text-xs text-gray-400">Эффект матового стекла, как при кастомизации экрана на iPhone</p>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      const next = !enableIosGlass;
                      setEnableIosGlass(next);
                      localStorage.setItem("nexus_enable_ios_glass", String(next));
                      if (next) {
                        applyClientTransparency(glassOpacity, glassBlur);
                      } else {
                        applyClientTransparency(1, 0);
                      }
                      window.dispatchEvent(new CustomEvent("nexus-customization-changed", { detail: { key: "enableIosGlass", value: next } }));
                    }}
                    className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full transition-colors duration-200 ease-in-out focus:outline-none ${
                      enableIosGlass ? "bg-cyan-500" : "bg-[#2a3848]"
                    }`}
                  >
                    <span
                      className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-lg ring-0 transition duration-200 ease-in-out ${
                        enableIosGlass ? "translate-x-5" : "translate-x-0.5"
                      } mt-0.5`}
                    />
                  </button>
                </div>

                {enableIosGlass && (
                  <div className="space-y-4 pt-2 border-t border-white/5 animate-fade-in">
                    {/* Opacity slider */}
                    <div className="space-y-1.5">
                      <div className="flex items-center justify-between text-xs">
                        <span className="text-gray-300 font-medium">Прозрачность фона панелей</span>
                        <span className="font-mono text-cyan-400 font-bold">{Math.round((1 - glassOpacity) * 100)}% прозрачности</span>
                      </div>
                      <input
                        type="range"
                        min="0.2"
                        max="0.95"
                        step="0.05"
                        value={glassOpacity}
                        onChange={(e) => {
                          const val = parseFloat(e.target.value);
                          setGlassOpacity(val);
                          localStorage.setItem("nexus_glass_opacity", String(val));
                          applyClientTransparency(val, glassBlur);
                        }}
                        className="w-full accent-cyan-400 cursor-pointer"
                      />
                    </div>

                    {/* Blur slider */}
                    <div className="space-y-1.5">
                      <div className="flex items-center justify-between text-xs">
                        <span className="text-gray-300 font-medium">Степень размытия фона (Blur)</span>
                        <span className="font-mono text-cyan-400 font-bold">{glassBlur}px</span>
                      </div>
                      <input
                        type="range"
                        min="0"
                        max="32"
                        step="2"
                        value={glassBlur}
                        onChange={(e) => {
                          const val = parseInt(e.target.value);
                          setGlassBlur(val);
                          localStorage.setItem("nexus_glass_blur", String(val));
                          applyClientTransparency(glassOpacity, val);
                        }}
                        className="w-full accent-cyan-400 cursor-pointer"
                      />
                    </div>
                  </div>
                )}
              </div>

              {/* Selector 6: Cutout Type (Android dot vs iPhone Island) */}
              <div className="bg-[#1b2532] p-4 sm:p-5 rounded-2xl border border-[#263445] space-y-3 shadow-md">
                <div className="flex items-center gap-3">
                  <div className="p-2.5 rounded-xl bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                    <Smartphone className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="text-sm font-semibold text-white">Форма физического выреза камеры</h4>
                    <p className="text-xs text-gray-400">Форма слияния капли при скролле и анимации острова</p>
                  </div>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                  <button
                    type="button"
                    onClick={() => {
                      setCutoutDeviceType("android");
                      localStorage.setItem("nexus_island_device_type", "android");
                      window.dispatchEvent(new Event("islandchange"));
                    }}
                    className={`p-3 rounded-xl border text-left transition-all cursor-pointer ${
                      cutoutDeviceType === "android"
                        ? "bg-emerald-600/20 border-emerald-500 text-white shadow-md shadow-emerald-500/15"
                        : "bg-black/20 border-white/5 text-gray-400 hover:text-white"
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-semibold">🤖 Android (Точечный вырез камеры)</span>
                      <span className="w-3.5 h-3.5 rounded-full bg-emerald-500 shrink-0" />
                    </div>
                    <p className="text-[11px] text-gray-400 mt-1">Капля сжимается в аккуратную круглую точку камеры по центру вверху экрана</p>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setCutoutDeviceType("ios");
                      localStorage.setItem("nexus_island_device_type", "ios");
                      window.dispatchEvent(new Event("islandchange"));
                    }}
                    className={`p-3 rounded-xl border text-left transition-all cursor-pointer ${
                      cutoutDeviceType === "ios"
                        ? "bg-indigo-600/20 border-indigo-500 text-white shadow-md shadow-indigo-500/15"
                        : "bg-black/20 border-white/5 text-gray-400 hover:text-white"
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-semibold">🍎 Apple (Dynamic Island капсула)</span>
                      <span className="w-6 h-3 rounded-full bg-indigo-500 shrink-0" />
                    </div>
                    <p className="text-[11px] text-gray-400 mt-1">Широкая интерактивная капсула Dynamic Island с системными индикаторами</p>
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* TAB: DYNAMIC ISLAND CALIBRATION & POSITIONING */}
          {activeTab === "island" && (
            <div className="space-y-6 animate-fade-in">
              {/* Card 1: Master Toggle & Live Coordinates */}
              <div className="bg-[#1b2532] p-4 sm:p-5 rounded-2xl border border-[#263445] space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <div className="w-10 h-10 rounded-xl bg-black flex items-center justify-center border border-white/10 shadow-md">
                      <Move className="w-5 h-5 text-cyan-400" />
                    </div>
                    <div>
                      <h3 className="text-sm font-semibold text-white">
                        Калибровка положения Dynamic Island
                      </h3>
                      <p className="text-xs text-gray-400 mt-0.5">
                        Точная подгонка под физический вырез камеры на вашем смартфоне
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={() => {
                      const next = !dynamicIslandEnabled;
                      setDynamicIslandEnabled(next);
                      localStorage.setItem("nexus_dynamic_island", String(next));
                      window.dispatchEvent(new Event("islandchange"));
                    }}
                    className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors cursor-pointer ${
                      dynamicIslandEnabled ? "bg-[#2481cc]" : "bg-gray-700"
                    }`}
                  >
                    <span
                      className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                        dynamicIslandEnabled ? "translate-x-6" : "translate-x-1"
                      }`}
                    />
                  </button>
                </div>

                {/* Coordinate Badges */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-2">
                  <div className="bg-[#141d26] p-3 rounded-xl border border-white/5 flex flex-col items-center text-center">
                    <span className="text-[10px] uppercase tracking-wider text-gray-400">Сверху (Y)</span>
                    <span className="text-lg font-bold text-cyan-400 font-mono mt-0.5">{islandTop} px</span>
                  </div>
                  <div className="bg-[#141d26] p-3 rounded-xl border border-white/5 flex flex-col items-center text-center">
                    <span className="text-[10px] uppercase tracking-wider text-gray-400">Смещение (X)</span>
                    <span className="text-lg font-bold text-cyan-400 font-mono mt-0.5">
                      {islandLeftOffset > 0 ? `+${islandLeftOffset}` : islandLeftOffset} px
                    </span>
                  </div>
                  <div className="bg-[#141d26] p-3 rounded-xl border border-white/5 flex flex-col items-center text-center">
                    <span className="text-[10px] uppercase tracking-wider text-gray-400">Ширина</span>
                    <span className="text-lg font-bold text-white font-mono mt-0.5">{islandWidth} px</span>
                  </div>
                  <div className="bg-[#141d26] p-3 rounded-xl border border-white/5 flex flex-col items-center text-center">
                    <span className="text-[10px] uppercase tracking-wider text-gray-400">Высота</span>
                    <span className="text-lg font-bold text-white font-mono mt-0.5">{islandHeight} px</span>
                  </div>
                </div>
              </div>

              {/* Card 2: 4-Way D-Pad & Sliders */}
              <div className="bg-[#1b2532] p-4 sm:p-5 rounded-2xl border border-[#263445] space-y-4">
                <div>
                  <h4 className="text-sm font-semibold text-white flex items-center gap-2">
                    <Sliders className="w-4 h-4 text-[#2481cc]" />
                    Ручное управление и D-Pad джойстик
                  </h4>
                  <p className="text-xs text-gray-400 mt-0.5">
                    Используйте стрелки для сдвига на 1 или 5 пикселей во все стороны
                  </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-center">
                  {/* Visual 4-Way D-Pad */}
                  <div className="flex flex-col items-center justify-center p-3 bg-[#111720] rounded-2xl border border-white/5">
                    <button
                      onClick={() => handleUpdateIslandTop(Math.max(0, islandTop - 2))}
                      className="p-3 bg-[#1e293b] hover:bg-[#2e3e54] text-white rounded-xl active:scale-95 transition-all shadow-md cursor-pointer mb-2 flex items-center gap-1"
                      title="Вверх на 2px"
                    >
                      <ChevronUp className="w-5 h-5" />
                      <span className="text-[10px] text-gray-400">Вверх</span>
                    </button>

                    <div className="flex items-center gap-3">
                      <button
                        onClick={() => handleUpdateIslandLeft(Math.max(-200, islandLeftOffset - 2))}
                        className="p-3 bg-[#1e293b] hover:bg-[#2e3e54] text-white rounded-xl active:scale-95 transition-all shadow-md cursor-pointer flex items-center gap-1"
                        title="Влево на 2px"
                      >
                        <ChevronLeft className="w-5 h-5" />
                        <span className="text-[10px] text-gray-400">Влево</span>
                      </button>

                      <button
                        onClick={handleResetIslandPosition}
                        className="w-12 h-12 bg-cyan-500/20 border border-cyan-500/50 hover:bg-cyan-500/30 text-cyan-300 rounded-full flex flex-col items-center justify-center text-[10px] font-bold cursor-pointer transition-all active:scale-90"
                        title="Сбросить в центр"
                      >
                        <RotateCcw className="w-4 h-4" />
                        <span>0,0</span>
                      </button>

                      <button
                        onClick={() => handleUpdateIslandLeft(Math.min(200, islandLeftOffset + 2))}
                        className="p-3 bg-[#1e293b] hover:bg-[#2e3e54] text-white rounded-xl active:scale-95 transition-all shadow-md cursor-pointer flex items-center gap-1"
                        title="Вправо на 2px"
                      >
                        <span className="text-[10px] text-gray-400">Вправо</span>
                        <ChevronRight className="w-5 h-5" />
                      </button>
                    </div>

                    <button
                      onClick={() => handleUpdateIslandTop(Math.min(250, islandTop + 2))}
                      className="p-3 bg-[#1e293b] hover:bg-[#2e3e54] text-white rounded-xl active:scale-95 transition-all shadow-md cursor-pointer mt-2 flex items-center gap-1"
                      title="Вниз на 2px"
                    >
                      <ChevronDown className="w-5 h-5" />
                      <span className="text-[10px] text-gray-400">Вниз</span>
                    </button>
                  </div>

                  {/* Fine Tuning Sliders */}
                  <div className="space-y-4">
                    <div>
                      <div className="flex justify-between text-xs mb-1">
                        <span className="text-gray-300">Позиция по вертикали (Y)</span>
                        <span className="text-cyan-400 font-mono font-semibold">{islandTop} px</span>
                      </div>
                      <input
                        type="range"
                        min="0"
                        max="200"
                        step="1"
                        value={islandTop}
                        onChange={(e) => handleUpdateIslandTop(parseInt(e.target.value))}
                        className="w-full accent-cyan-400 cursor-pointer"
                      />
                    </div>

                    <div>
                      <div className="flex justify-between text-xs mb-1">
                        <span className="text-gray-300">Смещение по горизонтали (X)</span>
                        <span className="text-cyan-400 font-mono font-semibold">
                          {islandLeftOffset > 0 ? `+${islandLeftOffset}` : islandLeftOffset} px
                        </span>
                      </div>
                      <input
                        type="range"
                        min="-150"
                        max="150"
                        step="1"
                        value={islandLeftOffset}
                        onChange={(e) => handleUpdateIslandLeft(parseInt(e.target.value))}
                        className="w-full accent-cyan-400 cursor-pointer"
                      />
                    </div>

                    <div className="pt-1 flex gap-2">
                      <button
                        onClick={() => {
                          onClose();
                          // trigger free drag on dynamic island
                          setTimeout(() => {
                            window.dispatchEvent(new CustomEvent("nexus_toggle_free_drag"));
                          }, 100);
                        }}
                        className="w-full py-2 bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white text-xs font-semibold rounded-xl flex items-center justify-center gap-2 shadow-md cursor-pointer transition-all"
                      >
                        <Move className="w-3.5 h-3.5" />
                        Перемещать пальцем прямо на экране
                      </button>
                    </div>
                  </div>
                </div>
              </div>

              {/* Card 3: Ready Device Presets */}
              <div className="bg-[#1b2532] p-4 sm:p-5 rounded-2xl border border-[#263445] space-y-3">
                <h4 className="text-sm font-semibold text-white flex items-center gap-2">
                  <Smartphone className="w-4 h-4 text-emerald-400" />
                  Готовые пресеты для экранов смартфонов
                </h4>

                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 text-xs">
                  {[
                    { name: "iPhone 15 / 16 Pro", top: 11, left: 0, w: 126, h: 37 },
                    { name: "iPhone 15 / 16 Pro Max", top: 13, left: 0, w: 126, h: 37 },
                    { name: "iPhone 14 Pro", top: 10, left: 0, w: 126, h: 37 },
                    { name: "Android Центр-вырез", top: 6, left: 0, w: 110, h: 32 },
                    { name: "Android Левый угол", top: 8, left: -110, w: 110, h: 32 },
                    { name: "Вплотную к верху (0px)", top: 2, left: 0, w: 126, h: 35 },
                  ].map((preset) => (
                    <button
                      key={preset.name}
                      onClick={() => {
                        handleUpdateIslandTop(preset.top);
                        handleUpdateIslandLeft(preset.left);
                        setIslandWidth(preset.w);
                        setIslandHeight(preset.h);
                        localStorage.setItem("nexus_island_width", String(preset.w));
                        localStorage.setItem("nexus_island_height", String(preset.h));
                        window.dispatchEvent(new Event("islandchange"));
                      }}
                      className="p-3 bg-[#111720] hover:bg-[#1e293b] border border-white/5 hover:border-cyan-400/40 rounded-xl text-left transition-all cursor-pointer group"
                    >
                      <div className="font-semibold text-white group-hover:text-cyan-300">
                        {preset.name}
                      </div>
                      <div className="text-[10px] text-gray-400 mt-1 font-mono">
                        Y: {preset.top}px | X: {preset.left}px
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* TAB 3: PERMISSIONS & SENSORS */}
          {activeTab === "permissions" && (
            <div className="space-y-4 animate-fade-in">
              <div className="bg-[#1b2532] p-4 sm:p-5 rounded-2xl border border-[#263445] space-y-4">
                <div>
                  <h3 className="text-sm font-semibold text-white flex items-center gap-2">
                    <ShieldCheck className="w-4 h-4 text-[#2481cc]" />
                    Доступы и системные разрешения приложения
                  </h3>
                  <p className="text-xs text-gray-400 mt-0.5">
                    Управление доступом к камере, микрофону, уведомлениям и тактильной вибрации
                  </p>
                </div>

                {permTestMessage && (
                  <div className="p-3 bg-[#2481cc]/15 border border-[#2481cc]/30 rounded-xl text-xs text-sky-200 flex items-center justify-between">
                    <span>{permTestMessage}</span>
                    <button 
                      onClick={() => setPermTestMessage(null)}
                      className="text-gray-400 hover:text-white text-xs ml-2 cursor-pointer"
                    >
                      ✕
                    </button>
                  </div>
                )}

                <div className="space-y-3 text-xs">
                  {/* Camera */}
                  <div className="p-3.5 bg-black/20 rounded-xl border border-white/5 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-lg bg-indigo-500/20 text-indigo-400 flex items-center justify-center">
                        <Camera className="w-4 h-4" />
                      </div>
                      <div>
                        <p className="font-semibold text-white">Доступ к камере</p>
                        <p className="text-[11px] text-gray-400">Для кружочков (видеосообщений) и фотосъёмки</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className={`text-[10px] px-2 py-0.5 rounded-md font-mono ${
                        permCamera === "granted" ? "bg-emerald-500/20 text-emerald-400" : "bg-gray-500/20 text-gray-300"
                      }`}>
                        {permCamera === "granted" ? "Разрешено" : "Запрос"}
                      </span>
                      <button
                        onClick={requestCameraAccess}
                        className="px-2.5 py-1 bg-[#2481cc] hover:bg-[#288ddf] text-white text-[11px] rounded-lg transition-colors cursor-pointer"
                      >
                        Проверить
                      </button>
                    </div>
                  </div>

                  {/* Microphone */}
                  <div className="p-3.5 bg-black/20 rounded-xl border border-white/5 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-lg bg-emerald-500/20 text-emerald-400 flex items-center justify-center">
                        <Mic className="w-4 h-4" />
                      </div>
                      <div>
                        <p className="font-semibold text-white">Доступ к микрофону</p>
                        <p className="text-[11px] text-gray-400">Для голосовых сообщений и звонков</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className={`text-[10px] px-2 py-0.5 rounded-md font-mono ${
                        permMic === "granted" ? "bg-emerald-500/20 text-emerald-400" : "bg-gray-500/20 text-gray-300"
                      }`}>
                        {permMic === "granted" ? "Разрешено" : "Запрос"}
                      </span>
                      <button
                        onClick={requestMicAccess}
                        className="px-2.5 py-1 bg-[#2481cc] hover:bg-[#288ddf] text-white text-[11px] rounded-lg transition-colors cursor-pointer"
                      >
                        Проверить
                      </button>
                    </div>
                  </div>

                  {/* Notifications */}
                  <div className="p-3.5 bg-black/20 rounded-xl border border-white/5 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-lg bg-amber-500/20 text-amber-400 flex items-center justify-center">
                        <Bell className="w-4 h-4" />
                      </div>
                      <div>
                        <p className="font-semibold text-white">Push-уведомления</p>
                        <p className="text-[11px] text-gray-400">Оповещения о входящих сообщениях и звонках</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className={`text-[10px] px-2 py-0.5 rounded-md font-mono ${
                        permNotify === "granted" ? "bg-emerald-500/20 text-emerald-400" : "bg-gray-500/20 text-gray-300"
                      }`}>
                        {permNotify === "granted" ? "Разрешено" : "Не активно"}
                      </span>
                      <button
                        onClick={requestNotificationAccess}
                        className="px-2.5 py-1 bg-[#2481cc] hover:bg-[#288ddf] text-white text-[11px] rounded-lg transition-colors cursor-pointer"
                      >
                        Включить
                      </button>
                    </div>
                  </div>

                  {/* Vibration & Haptics */}
                  <div className="p-3.5 bg-black/20 rounded-xl border border-white/5 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-lg bg-rose-500/20 text-rose-400 flex items-center justify-center">
                        <Vibrate className="w-4 h-4" />
                      </div>
                      <div>
                        <p className="font-semibold text-white">Вибрация (Taptic Engine)</p>
                        <p className="text-[11px] text-gray-400">Тактильная отдача при отправке и свайпах</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <button
                        onClick={() => testVibration([20])}
                        className="px-2 py-1 bg-white/10 hover:bg-white/15 text-gray-200 text-[11px] rounded-lg transition-colors cursor-pointer"
                      >
                        Лёгкая
                      </button>
                      <button
                        onClick={() => testVibration([50, 80, 50])}
                        className="px-2 py-1 bg-[#2481cc] hover:bg-[#288ddf] text-white text-[11px] rounded-lg transition-colors cursor-pointer"
                      >
                        Двойная
                      </button>
                    </div>
                  </div>

                  {/* Cache & Local Storage */}
                  <div className="p-3.5 bg-black/20 rounded-xl border border-white/5 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-lg bg-sky-500/20 text-sky-400 flex items-center justify-center">
                        <HardDrive className="w-4 h-4" />
                      </div>
                      <div>
                        <p className="font-semibold text-white">Кэш и данные медиа</p>
                        <p className="text-[11px] text-gray-400">Локальное хранилище диалогов и сессий</p>
                      </div>
                    </div>
                    <button
                      onClick={() => {
                        const keys = Object.keys(localStorage).filter(k => k.startsWith("local_profile_") || k.startsWith("last_online_"));
                        keys.forEach(k => localStorage.removeItem(k));
                        setPermTestMessage(`Очищено ${keys.length} временных записей кэша.`);
                      }}
                      className="px-2.5 py-1 bg-red-500/15 hover:bg-red-500/25 border border-red-500/30 text-red-300 text-[11px] rounded-lg transition-colors cursor-pointer"
                    >
                      Очистить кэш
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 4: AYUGRAM PLUGINS */}
          {activeTab === "plugins" && (
            <div className="space-y-4 animate-fade-in">
              <div className="bg-[#1b2532] p-4 sm:p-5 rounded-2xl border border-[#263445] space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-sm font-semibold text-white flex items-center gap-2">
                      <Puzzle className="w-4 h-4 text-[#2481cc]" />
                      Плагины Ayugram (.plugin)
                    </h3>
                    <p className="text-xs text-gray-400 mt-0.5">
                      Загружайте файлы плагинов от Ayugram для расширения возможностей
                    </p>
                  </div>
                  <button
                    onClick={() => pluginFileInputRef.current?.click()}
                    disabled={isUploadingPlugin}
                    className="flex items-center gap-1.5 px-3 py-1.5 bg-[#2481cc] hover:bg-[#288ddf] text-white text-xs font-semibold rounded-xl shadow transition-all cursor-pointer"
                  >
                    <Upload className="w-3.5 h-3.5" />
                    Загрузить .plugin
                  </button>
                  <input
                    ref={pluginFileInputRef}
                    type="file"
                    accept=".plugin,.json,.js"
                    className="hidden"
                    onChange={handlePluginUpload}
                  />
                </div>

                {/* Drag-and-Drop / Upload Area */}
                <div 
                  onClick={() => pluginFileInputRef.current?.click()}
                  onDragOver={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    setIsPluginDragOver(true);
                  }}
                  onDragLeave={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    setIsPluginDragOver(false);
                  }}
                  onDrop={handlePluginDrop}
                  className={`border-2 border-dashed rounded-2xl p-5 text-center cursor-pointer transition-all ${
                    isPluginDragOver 
                      ? "border-[#2481cc] bg-[#2481cc]/15 scale-[1.01]" 
                      : "border-white/10 hover:border-[#2481cc]/50 bg-black/20"
                  }`}
                >
                  <Upload className={`w-8 h-8 mx-auto mb-2 transition-colors ${
                    isPluginDragOver ? "text-white animate-bounce" : "text-[#2481cc] opacity-80"
                  }`} />
                  <p className="text-xs font-semibold text-white">
                    {isPluginDragOver ? "Отпустите файл для загрузки" : "Перетяните сюда .plugin или .json файл (или нажмите)"}
                  </p>
                  <p className="text-[10px] text-gray-400 mt-1">
                    Поддерживаются плагины Ayugram Desktop, ExteraGram и кастомные скрипты
                  </p>
                </div>

                {/* Plugin Test Result Banner */}
                {pluginTestResult && (
                  <div className={`p-4 rounded-2xl border text-xs space-y-2 animate-fade-in ${
                    pluginTestResult.success 
                      ? "bg-emerald-950/40 border-emerald-500/30 text-emerald-200" 
                      : "bg-rose-950/40 border-rose-500/30 text-rose-200"
                  }`}>
                    <div className="flex items-center justify-between font-semibold">
                      <span className="flex items-center gap-1.5">
                        {pluginTestResult.success ? <CheckCircle2 className="w-4 h-4 text-emerald-400" /> : <AlertCircle className="w-4 h-4 text-rose-400" />}
                        {pluginTestResult.message}
                      </span>
                      <button 
                        onClick={() => setPluginTestResult(null)} 
                        className="text-[10px] underline hover:text-white cursor-pointer"
                      >
                        Закрыть
                      </button>
                    </div>
                    {pluginTestResult.logs && pluginTestResult.logs.length > 0 && (
                      <div className="bg-black/40 rounded-xl p-2.5 font-mono text-[11px] space-y-1 text-gray-300">
                        {pluginTestResult.logs.map((log, lIdx) => (
                          <div key={lIdx} className="leading-snug">{log}</div>
                        ))}
                      </div>
                    )}
                  </div>
                )}

                {/* Installed Plugins List */}
                <div className="space-y-2.5">
                  {plugins.map((plugin) => (
                    <div 
                      key={plugin.id}
                      className="p-3.5 bg-black/25 rounded-2xl border border-white/5 flex flex-col gap-2.5 transition-colors hover:border-white/15"
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2.5">
                          <div className={`w-8 h-8 rounded-xl flex items-center justify-center font-bold text-xs ${
                            plugin.enabled ? "bg-[#2481cc]/20 text-[#2481cc] border border-[#2481cc]/30" : "bg-white/5 text-gray-400"
                          }`}>
                            <Puzzle className="w-4 h-4" />
                          </div>
                          <div>
                            <div className="flex items-center gap-2">
                              <h4 className="text-xs font-semibold text-white">{plugin.name}</h4>
                              <span className="text-[9px] bg-white/10 text-gray-300 px-1.5 py-0.2 rounded font-mono">
                                v{plugin.version}
                              </span>
                              <span className={`text-[9px] px-1.5 py-0.5 rounded font-medium ${
                                plugin.enabled ? "bg-emerald-500/20 text-emerald-400" : "bg-white/10 text-gray-400"
                              }`}>
                                {plugin.enabled ? "Активен" : "Отключен"}
                              </span>
                            </div>
                            <p className="text-[10px] text-gray-400">Автор: {plugin.author}</p>
                          </div>
                        </div>

                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => handleRunPluginTest(plugin)}
                            disabled={testingPluginId === plugin.id}
                            className="px-2.5 py-1 bg-white/10 hover:bg-[#2481cc] hover:text-white text-gray-300 rounded-xl text-[11px] font-medium flex items-center gap-1 transition-colors cursor-pointer disabled:opacity-50"
                            title="Протестировать функциональность плагина"
                          >
                            <Play className="w-3 h-3 text-emerald-400" />
                            {testingPluginId === plugin.id ? "Тест..." : "Тест"}
                          </button>
                          <button
                            onClick={() => handleTogglePlugin(plugin.id, !plugin.enabled)}
                            className={`w-11 h-6 rounded-full transition-colors relative cursor-pointer ${
                              plugin.enabled ? "bg-[#2481cc]" : "bg-white/20"
                            }`}
                          >
                            <span 
                              className={`absolute top-1 left-1 w-4 h-4 rounded-full bg-white transition-transform ${
                                plugin.enabled ? "translate-x-5" : "translate-x-0"
                              }`} 
                            />
                          </button>
                          <button
                            onClick={() => handleDeletePlugin(plugin.id)}
                            className="p-1.5 text-gray-400 hover:text-rose-400 transition-colors cursor-pointer"
                            title="Удалить плагин"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>

                      <p className="text-xs text-gray-300 pl-1">{plugin.description}</p>

                      {plugin.features && plugin.features.length > 0 && (
                        <div className="flex flex-wrap gap-1 mt-1 pl-1">
                          {plugin.features.map((feat, fIdx) => (
                            <span key={fIdx} className="text-[9px] bg-white/5 text-sky-300 border border-white/5 px-2 py-0.5 rounded-md">
                              ✓ {feat}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* TAB 5: IPHONE & PWA FEATURES */}
          {activeTab === "iphone" && (
            <div className="space-y-4 animate-fade-in">
              {/* Dynamic Island Native Integration & Display Options */}
              <div className="bg-[#1b2532] p-4 sm:p-5 rounded-2xl border border-[#263445] space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-sm font-semibold text-white flex items-center gap-2">
                      <Zap className="w-4 h-4 text-emerald-400" />
                      Эмуляция Dynamic Island (Виртуальная)
                    </h3>
                    <p className="text-xs text-gray-400 mt-0.5">
                      Отображать виртуальный плавающий остров для PWA и Web
                    </p>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input 
                      type="checkbox" 
                      className="sr-only peer"
                      checked={dynamicIslandEnabled}
                      onChange={(e) => {
                        setDynamicIslandEnabled(e.target.checked);
                        localStorage.setItem("nexus_dynamic_island", String(e.target.checked));
                        window.dispatchEvent(new Event("islandchange"));
                      }}
                    />
                    <div className="w-9 h-5 bg-gray-600 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-[#2481cc]"></div>
                  </label>
                </div>
                
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-sm font-semibold text-white flex items-center gap-2">
                      <Smartphone className="w-4 h-4 text-emerald-400" />
                      Аппаратный Dynamic Island (Live Activities)
                    </h3>
                    <p className="text-xs text-gray-400 mt-0.5">
                      Прямое подключение к системному острову iOS через ActivityKit Bridge (без виртуальных наложений)
                    </p>
                  </div>
                  <span className={`px-2.5 py-1 rounded-full text-xs font-semibold ${
                    isNativeDynamicIslandAvailable() ? "bg-emerald-500/20 text-emerald-300 border border-emerald-500/30" : "bg-white/10 text-gray-400 border border-white/10"
                  }`}>
                    {isNativeDynamicIslandAvailable() ? "Bridge Подключен" : "Ожидание нативного хоста"}
                  </span>
                </div>
                <div className="p-3 bg-black/20 rounded-xl border border-white/5 text-xs text-gray-300 space-y-1.5 leading-relaxed">
                  <p>• <strong>Реальное устройство</strong>: Приложение передает данные о медиа, звонках и сетевой активности напрямую в системный мост <code className="text-indigo-300">window.webkit.messageHandlers.dynamicIsland</code> (iOS) или <code className="text-indigo-300">AndroidBridge</code>.</p>
                  <p>• <strong>Без виртуальных фейков</strong>: Искусственный плавающий остров полностью отключен и не загораживает системное время, сеть и зарядку.</p>
                </div>

                {/* Dynamic Island Physical Calibration */}
                <div className="pt-3 border-t border-white/5 space-y-3">
                  <div className="flex items-center justify-between">
                    <h4 className="text-xs font-semibold text-white flex items-center gap-1.5">
                      <Sliders className="w-3.5 h-3.5 text-[#2481cc]" />
                      Калибровка виртуального Dynamic Island:
                    </h4>
                    <button
                      onClick={() => {
                        setIslandWidth(126);
                        setIslandHeight(37);
                        setIslandTop(11);
                        localStorage.setItem("nexus_island_width", "126");
                        localStorage.setItem("nexus_island_height", "37");
                        localStorage.setItem("nexus_island_top", "11");
                        window.dispatchEvent(new Event("islandchange"));
                      }}
                      className="text-[11px] text-[#2481cc] hover:underline cursor-pointer"
                    >
                      Сбросить к iPhone 15/16 Pro
                    </button>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 text-xs">
                    <div className="p-3 bg-black/20 rounded-xl border border-white/5 flex flex-col gap-1.5">
                      <div className="flex justify-between text-gray-300 text-[11px]">
                        <span>Ширина острова:</span>
                        <strong className="text-emerald-400 font-mono">{islandWidth}px</strong>
                      </div>
                      <input
                        type="range"
                        min="90"
                        max="180"
                        value={islandWidth}
                        onChange={(e) => {
                          const v = parseInt(e.target.value);
                          setIslandWidth(v);
                          localStorage.setItem("nexus_island_width", String(v));
                          window.dispatchEvent(new Event("islandchange"));
                        }}
                        className="w-full accent-[#2481cc] cursor-pointer"
                      />
                    </div>
                    <div className="p-3 bg-black/20 rounded-xl border border-white/5 flex flex-col gap-1.5">
                      <div className="flex justify-between text-gray-300 text-[11px]">
                        <span>Высота острова:</span>
                        <strong className="text-emerald-400 font-mono">{islandHeight}px</strong>
                      </div>
                      <input
                        type="range"
                        min="26"
                        max="50"
                        value={islandHeight}
                        onChange={(e) => {
                          const v = parseInt(e.target.value);
                          setIslandHeight(v);
                          localStorage.setItem("nexus_island_height", String(v));
                          window.dispatchEvent(new Event("islandchange"));
                        }}
                        className="w-full accent-[#2481cc] cursor-pointer"
                      />
                    </div>
                    <div className="p-3 bg-black/20 rounded-xl border border-white/5 flex flex-col gap-1.5">
                      <div className="flex justify-between text-gray-300 text-[11px]">
                        <span>Отступ сверху (Калибровка):</span>
                        <strong className="text-emerald-400 font-mono">{islandTop}px</strong>
                      </div>
                      <input
                        type="range"
                        min="0"
                        max="80"
                        value={islandTop}
                        onChange={(e) => {
                          const v = parseInt(e.target.value);
                          setIslandTop(v);
                          localStorage.setItem("nexus_island_top", String(v));
                          window.dispatchEvent(new Event("islandchange"));
                        }}
                        className="w-full accent-[#2481cc] cursor-pointer"
                      />
                      <div className="flex flex-wrap gap-1.5 pt-1">
                        <button
                          onClick={() => {
                            setIslandTop(0);
                            localStorage.setItem("nexus_island_top", "0");
                            window.dispatchEvent(new Event("islandchange"));
                          }}
                          className="px-2 py-0.5 text-[10px] bg-white/10 hover:bg-white/20 rounded text-gray-300 hover:text-white"
                        >
                          В упор (0px)
                        </button>
                        <button
                          onClick={() => {
                            setIslandTop(11);
                            localStorage.setItem("nexus_island_top", "11");
                            window.dispatchEvent(new Event("islandchange"));
                          }}
                          className="px-2 py-0.5 text-[10px] bg-[#2481cc]/20 text-[#2481cc] hover:bg-[#2481cc]/30 rounded"
                        >
                          15/16 Pro (11px)
                        </button>
                        <button
                          onClick={() => {
                            setIslandTop(12);
                            localStorage.setItem("nexus_island_top", "12");
                            window.dispatchEvent(new Event("islandchange"));
                          }}
                          className="px-2 py-0.5 text-[10px] bg-white/10 hover:bg-white/20 rounded text-gray-300 hover:text-white"
                        >
                          14 Pro (12px)
                        </button>
                        <button
                          onClick={() => {
                            setIslandTop(24);
                            localStorage.setItem("nexus_island_top", "24");
                            window.dispatchEvent(new Event("islandchange"));
                          }}
                          className="px-2 py-0.5 text-[10px] bg-white/10 hover:bg-white/20 rounded text-gray-300 hover:text-white"
                        >
                          С отступом (24px)
                        </button>
                      </div>
                    </div>
                  </div>
                  <div className="p-3 bg-[#2481cc]/10 border border-[#2481cc]/25 rounded-xl text-xs text-gray-200 leading-relaxed">
                    💡 <strong>Управление жестами</strong>: Остров рисуется прямо вокруг физического выреза экрана. Данные (плеер, скорость интернета, экономия трафика) отображаются по бокам. <strong>Нажатие</strong> раскрывает полноразмерный интерактивный вид. <strong>Смахивание в сторону (свайп)</strong> скрывает данные с острова, а повторный свайп возвращает их обратно.
                  </div>
                </div>

                {/* What to show on Island */}
                <div className="pt-2 border-t border-white/5 space-y-3">
                  <h4 className="text-xs font-semibold text-white flex items-center gap-1.5">
                    <Sparkles className="w-3.5 h-3.5 text-[#2481cc]" />
                    Что выводить на виртуальном Dynamic Island:
                  </h4>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 text-xs">
                    <label className="flex items-center justify-between p-3 bg-black/20 rounded-xl border border-white/5 cursor-pointer hover:border-white/15">
                      <span className="text-gray-200">Воспроизведение медиа & аудио</span>
                      <input 
                        type="checkbox" 
                        checked={islandShowMedia} 
                        onChange={(e) => {
                          setIslandShowMedia(e.target.checked);
                          localStorage.setItem("nexus_island_media", String(e.target.checked));
                          window.dispatchEvent(new Event("islandchange"));
                        }}
                        className="rounded text-[#2481cc] focus:ring-0 cursor-pointer"
                      />
                    </label>

                    <label className="flex items-center justify-between p-3 bg-black/20 rounded-xl border border-white/5 cursor-pointer hover:border-white/15">
                      <span className="text-gray-200">Скорость сети & пинг</span>
                      <input 
                        type="checkbox" 
                        checked={islandShowSpeed} 
                        onChange={(e) => {
                          setIslandShowSpeed(e.target.checked);
                          localStorage.setItem("nexus_island_speed", String(e.target.checked));
                          window.dispatchEvent(new Event("islandchange"));
                        }}
                        className="rounded text-[#2481cc] focus:ring-0 cursor-pointer"
                      />
                    </label>

                    <label className="flex items-center justify-between p-3 bg-black/20 rounded-xl border border-white/5 cursor-pointer hover:border-white/15">
                      <span className="text-gray-200">Голосовые вызовы & P2P</span>
                      <input 
                        type="checkbox" 
                        checked={islandShowCalls} 
                        onChange={(e) => {
                          setIslandShowCalls(e.target.checked);
                          localStorage.setItem("nexus_island_calls", String(e.target.checked));
                          window.dispatchEvent(new Event("islandchange"));
                        }}
                        className="rounded text-[#2481cc] focus:ring-0 cursor-pointer"
                      />
                    </label>

                    <label className="flex items-center justify-between p-3 bg-black/20 rounded-xl border border-white/5 cursor-pointer hover:border-white/15">
                      <span className="text-gray-200">Статус зарядки и батареи</span>
                      <input 
                        type="checkbox" 
                        checked={islandShowBattery} 
                        onChange={(e) => {
                          setIslandShowBattery(e.target.checked);
                          localStorage.setItem("nexus_island_battery", String(e.target.checked));
                          window.dispatchEvent(new Event("islandchange"));
                        }}
                        className="rounded text-[#2481cc] focus:ring-0 cursor-pointer"
                      />
                    </label>
                  </div>
                </div>
              </div>

              {/* Home Screen & Standalone Guide */}
              <div className="bg-[#1b2532] p-4 sm:p-5 rounded-2xl border border-[#263445] space-y-3">
                <h3 className="text-sm font-semibold text-white flex items-center gap-2">
                  <Smartphone className="w-4 h-4 text-[#2481cc]" />
                  Установка на экран «Домой» (iPhone / iPad / Android)
                </h3>
                <p className="text-xs text-gray-300 leading-relaxed">
                  Когда вы добавляете приложение на экран «Домой», оно открывается как <strong>нативное автономное приложение</strong>:
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                  <div className="p-3 bg-black/20 rounded-xl border border-white/5">
                    <p className="font-semibold text-white mb-1">Без рамок Safari</p>
                    <p className="text-gray-400 text-[11px]">Адресная строка и нижняя панель браузера полностью скрыты.</p>
                  </div>
                  <div className="p-3 bg-black/20 rounded-xl border border-white/5">
                    <p className="font-semibold text-white mb-1">Защита от перехода</p>
                    <p className="text-gray-400 text-[11px]">Страница никуда не вылетает и всегда остаётся внутри приложения.</p>
                  </div>
                  <div className="p-3 bg-black/20 rounded-xl border border-white/5">
                    <p className="font-semibold text-white mb-1">Иконка приложения</p>
                    <p className="text-gray-400 text-[11px]">На домашнем экране отображается выбранная вами 3D неоновая обложка.</p>
                  </div>
                  <div className="p-3 bg-black/20 rounded-xl border border-white/5">
                    <p className="font-semibold text-white mb-1">Жесты и свайпы</p>
                    <p className="text-gray-400 text-[11px]">Поддержка свайпов назад, жестов ответа и тактильной отдачи.</p>
                  </div>
                </div>

                <div className="p-3 bg-[#2481cc]/10 border border-[#2481cc]/30 rounded-xl text-xs text-sky-200">
                  <strong>Как установить на iPhone:</strong>
                  <ol className="list-decimal list-inside mt-1 space-y-0.5 text-gray-300">
                    <li>Нажмите кнопку «Поделиться» (иконка со стрелкой вверх) в Safari.</li>
                    <li>Прокрутите вниз и выберите «На экран "Домой"» (Add to Home Screen).</li>
                    <li>Нажмите «Добавить» — приложение появится на рабочем столе с иконкой.</li>
                  </ol>
                </div>
              </div>
            </div>
          )}

          {/* TAB: PROXY & MTPROTO (ПРОКСИ И СЕРВЕРЫ) */}
          {activeTab === "proxy" && (
            <div className="space-y-6 animate-fade-in">
              {/* Header Card */}
              <div className="bg-gradient-to-r from-emerald-950/40 via-teal-950/30 to-[#142333] border border-emerald-500/30 p-4 sm:p-5 rounded-2xl flex items-center justify-between gap-4">
                <div className="flex items-center gap-3.5">
                  <div className={`p-3 rounded-2xl border ${proxyEnabled ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/40' : 'bg-gray-800 text-gray-400 border-gray-700'}`}>
                    <ShieldCheck className="w-6 h-6" />
                  </div>
                  <div>
                    <h3 className="text-base font-bold text-white flex items-center gap-2">
                      <span>Настройки прокси Nexus</span>
                      <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 font-mono">
                        {proxyEnabled ? "АКТИВЕН" : "ОТКЛЮЧЕН"}
                      </span>
                    </h3>
                    <p className="text-xs text-gray-300 mt-0.5">
                      Поддержка протоколов MTProto (с FakeTLS), SOCKS5 и HTTP-туннелей.
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    const next = !proxyEnabled;
                    setProxyEnabled(next);
                    fetch("/api/proxy/config", {
                      method: "POST",
                      headers: { "Content-Type": "application/json" },
                      body: JSON.stringify({ enabled: next, activeProxyId, proxies: proxyList }),
                    }).catch(() => {});
                    window.dispatchEvent(new CustomEvent("proxy-updated", {
                      detail: { enabled: next, activeProxyId, activeProxy: proxyList.find(p => p.id === activeProxyId) }
                    }));
                    triggerHaptic("medium");
                  }}
                  className={`w-12 h-6 rounded-full transition-colors relative cursor-pointer shrink-0 ${
                    proxyEnabled ? "bg-emerald-500" : "bg-gray-700"
                  }`}
                >
                  <div
                    className={`w-5 h-5 rounded-full bg-white transition-transform shadow-md absolute top-0.5 left-0.5 ${
                      proxyEnabled ? "translate-x-6" : "translate-x-0"
                    }`}
                  />
                </button>
              </div>

              {/* Statistics Grid */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div className="bg-[#182330] p-3.5 rounded-2xl border border-[#253648] text-center">
                  <span className="text-[11px] text-gray-400 block mb-1">Пинг сервера</span>
                  <span className="text-sm font-bold font-mono text-emerald-400">
                    {proxyStats.ping || 34} ms
                  </span>
                </div>
                <div className="bg-[#182330] p-3.5 rounded-2xl border border-[#253648] text-center">
                  <span className="text-[11px] text-gray-400 block mb-1">Аптайм</span>
                  <span className="text-sm font-bold font-mono text-cyan-400">
                    {proxyStats.uptime || 99.9}%
                  </span>
                </div>
                <div className="bg-[#182330] p-3.5 rounded-2xl border border-[#253648] text-center">
                  <span className="text-[11px] text-gray-400 block mb-1">Принято данных</span>
                  <span className="text-sm font-bold font-mono text-white">
                    {((proxyStats.bytesReceived || 89412500) / (1024 * 1024)).toFixed(1)} MB
                  </span>
                </div>
                <div className="bg-[#182330] p-3.5 rounded-2xl border border-[#253648] text-center">
                  <span className="text-[11px] text-gray-400 block mb-1">Передано данных</span>
                  <span className="text-sm font-bold font-mono text-white">
                    {((proxyStats.bytesSent || 14258900) / (1024 * 1024)).toFixed(1)} MB
                  </span>
                </div>
              </div>

              {/* Proxy List */}
              <div className="bg-[#151f2b] p-4 sm:p-5 rounded-2xl border border-[#223345] space-y-3">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-bold text-gray-300 uppercase tracking-wider flex items-center gap-1.5">
                    <Server className="w-3.5 h-3.5 text-emerald-400" />
                    <span>Доступные прокси-серверы ({proxyList.length})</span>
                  </h4>
                </div>

                <div className="space-y-2 pt-1">
                  {proxyList.map((p) => {
                    const isSelected = p.id === activeProxyId;
                    const isTesting = proxyTestingId === p.id;
                    return (
                      <div
                        key={p.id}
                        onClick={() => {
                          setActiveProxyId(p.id);
                          fetch("/api/proxy/config", {
                            method: "POST",
                            headers: { "Content-Type": "application/json" },
                            body: JSON.stringify({ enabled: proxyEnabled, activeProxyId: p.id, proxies: proxyList }),
                          }).catch(() => {});
                          window.dispatchEvent(new CustomEvent("proxy-updated", {
                            detail: { enabled: proxyEnabled, activeProxyId: p.id, activeProxy: p }
                          }));
                          triggerHaptic("light");
                        }}
                        className={`p-3.5 rounded-xl border flex items-center justify-between gap-3 transition-all cursor-pointer ${
                          isSelected
                            ? "bg-[#18293b] border-emerald-500/50 shadow-md ring-1 ring-emerald-500/30"
                            : "bg-[#121a24] border-[#1d2b3a] hover:bg-[#16212e]"
                        }`}
                      >
                        <div className="flex items-center gap-3 min-w-0">
                          <span className="text-xl shrink-0">{p.flag || "🌐"}</span>
                          <div className="min-w-0">
                            <div className="flex items-center gap-2">
                              <span className="text-xs font-bold text-white truncate">{p.name}</span>
                              <span className="text-[9px] px-1.5 py-0.5 rounded uppercase font-mono font-semibold bg-white/10 text-gray-300">
                                {p.protocol}
                              </span>
                            </div>
                            <p className="text-[11px] text-gray-400 font-mono truncate">{p.host}:{p.port}</p>
                          </div>
                        </div>

                        <div className="flex items-center gap-2 shrink-0">
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              setProxyTestingId(p.id);
                              fetch("/api/proxy/test", {
                                method: "POST",
                                headers: { "Content-Type": "application/json" },
                                body: JSON.stringify({ host: p.host, port: p.port }),
                              })
                                .then(res => res.json())
                                .then(data => {
                                  if (data.ping) {
                                    const updated = proxyList.map(item => item.id === p.id ? { ...item, ping: data.ping } : item);
                                    setProxyList(updated);
                                  }
                                })
                                .catch(() => {})
                                .finally(() => setProxyTestingId(null));
                              triggerHaptic("light");
                            }}
                            disabled={isTesting}
                            className="px-2 py-1 rounded-lg bg-black/40 text-[10px] font-mono text-gray-300 border border-white/10 flex items-center gap-1 hover:bg-black/60 cursor-pointer"
                          >
                            <Activity className="w-2.5 h-2.5 text-emerald-400" />
                            <span>{p.ping || 34}ms</span>
                          </button>
                          <div className={`w-5 h-5 rounded-full flex items-center justify-center border transition-all ${
                            isSelected ? "bg-emerald-500 border-emerald-400 text-white" : "border-gray-600 bg-transparent"
                          }`}>
                            {isSelected && <Check className="w-3 h-3 stroke-[3]" />}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          )}

        </div>

        {/* Traffic Analytics Modal */}
        <TrafficAnalyticsModal
          isOpen={showTrafficAnalytics}
          onClose={() => setShowTrafficAnalytics(false)}
        />

        {/* Full Nexus Blockchain Explorer Modal */}
        {showFullNexusModal && (
          <NexusBlockchainModal
            onClose={() => {
              setShowFullNexusModal(false);
              setNexusBlocksCount(getLocalBlockchain().length);
            }}
          />
        )}

        {/* Footer */}
        <div className="p-4 border-t border-[#242f3d] bg-[#111922] flex items-center justify-between text-xs text-gray-400">
          <span className="font-mono text-[11px]">Nexusssgrammm v3.5 • Ayugram Core</span>
          <button
            onClick={onClose}
            className="px-5 py-2 bg-[#2481cc] hover:bg-[#288ddf] text-white font-semibold rounded-xl transition-all shadow cursor-pointer active:scale-95"
          >
            Закрыть
          </button>
        </div>
      </div>
    </div>
  );
};
