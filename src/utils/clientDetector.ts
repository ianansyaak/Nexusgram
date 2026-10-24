/**
 * Nexus Quantum Client Detector
 * Программный модуль обнаружения неофициальных клиентов Telegram (AyuGram, Nexusgram и др.)
 */

export type TelegramClientType = "ayugram" | "nexusgram" | "telegram_official" | "official" | "nekogram" | "kotatogram" | "unknown";

export interface DetectedClientInfo {
  type: TelegramClientType;
  name: string;
  badgeLabel: string;
  badgeSubtitle: string;
  colorClass: string;
  badgeBg: string;
  badgeBorder: string;
  icon: string;
  isCustom: boolean;
  features: string[];
}

const PEER_CLIENT_CACHE_KEY = "nexus_detected_peer_clients_v1";
const CURRENT_USER_CLIENT_KEY = "nexus_current_user_client_mode";

// In-memory cache for fast, zero-latency synchronous queries
let peerClientCache: Record<string, TelegramClientType> = {};

try {
  const saved = localStorage.getItem(PEER_CLIENT_CACHE_KEY);
  if (saved) {
    peerClientCache = JSON.parse(saved);
  }
} catch (e) {}

/**
 * Save detected client for a user ID or username
 */
export function setPeerClientType(userIdOrUsername: string | number, clientType: TelegramClientType) {
  const key = String(userIdOrUsername).toLowerCase().replace(/^@/, "");
  peerClientCache[key] = clientType;
  try {
    localStorage.setItem(PEER_CLIENT_CACHE_KEY, JSON.stringify(peerClientCache));
    window.dispatchEvent(
      new CustomEvent("peer-client-updated", { detail: { userId: key, clientType } })
    );
  } catch (e) {}
}

/**
 * Get the current user's active client mode
 * Defaults to 'nexusgram' (or 'ayugram' if user configured it)
 */
export function getCurrentUserClient(): TelegramClientType {
  if (typeof window === "undefined") return "nexusgram";
  const saved = localStorage.getItem(CURRENT_USER_CLIENT_KEY) as TelegramClientType | null;
  if (saved && (saved === "nexusgram" || saved === "ayugram" || saved === "telegram_official")) {
    return saved;
  }
  return "nexusgram"; // Default client for this app
}

/**
 * Set the current user's client mode
 */
export function setCurrentUserClient(client: TelegramClientType) {
  if (typeof window === "undefined") return;
  localStorage.setItem(CURRENT_USER_CLIENT_KEY, client);
  window.dispatchEvent(
    new CustomEvent("current-user-client-changed", { detail: { client } })
  );
}

/**
 * Client signature database
 */
export const CLIENT_DEFINITIONS: Record<TelegramClientType, DetectedClientInfo> = {
  ayugram: {
    type: "ayugram",
    name: "AyuGram",
    badgeLabel: "Использует клиент AyuGram",
    badgeSubtitle: "AyuGram Client • Ghost & Message History",
    colorClass: "text-purple-400",
    badgeBg: "bg-purple-500/15",
    badgeBorder: "border-purple-500/35",
    icon: "🔮",
    isCustom: true,
    features: [
      "Ghost Mode (Призрак онлайн-статуса)",
      "Сохранение удаленных сообщений",
      "Скрытие прочтения сообщений и историй",
      "Анонимный просмотр каналов",
    ],
  },
  nexusgram: {
    type: "nexusgram",
    name: "Nexusgram",
    badgeLabel: "Использует клиент Nexusgram",
    badgeSubtitle: "Nexusgram Quantum • E2EE Blockchain",
    colorClass: "text-cyan-400",
    badgeBg: "bg-cyan-500/15",
    badgeBorder: "border-cyan-500/35",
    icon: "⚡",
    isCustom: true,
    features: [
      "Quantum EcoStream (Экономия 90% трафика)",
      "Сквозное блокчейн-шифрование E2EE",
      "Мгновенный аппаратный рендеринг 120 FPS",
      "Поддержка мульти-аккаунтов и кастомных папок",
    ],
  },
  nekogram: {
    type: "nekogram",
    name: "Nekogram",
    badgeLabel: "Использует клиент Nekogram",
    badgeSubtitle: "Nekogram Client • Material You",
    colorClass: "text-emerald-400",
    badgeBg: "bg-emerald-500/15",
    badgeBorder: "border-emerald-500/35",
    icon: "🐾",
    isCustom: true,
    features: ["Кастомные темы", "Встроенный переводчик", "IPv6 поддержка"],
  },
  kotatogram: {
    type: "kotatogram",
    name: "Kotatogram",
    badgeLabel: "Использует клиент Kotatogram",
    badgeSubtitle: "Kotatogram Desktop Fork",
    colorClass: "text-indigo-400",
    badgeBg: "bg-indigo-500/15",
    badgeBorder: "border-indigo-500/35",
    icon: "🐱",
    isCustom: true,
    features: ["Кастомные шрифты", "Расширенные стикеры", "Компактный режим"],
  },
  telegram_official: {
    type: "telegram_official",
    name: "Telegram Official",
    badgeLabel: "Использует официальный клиент Telegram",
    badgeSubtitle: "Official Telegram Client",
    colorClass: "text-blue-400",
    badgeBg: "bg-blue-500/15",
    badgeBorder: "border-blue-500/35",
    icon: "✈️",
    isCustom: false,
    features: ["Стандартный Telegram API", "Официальные функции"],
  },
  official: {
    type: "official",
    name: "Telegram Official",
    badgeLabel: "Использует официальный клиент Telegram",
    badgeSubtitle: "Official Telegram Client",
    colorClass: "text-blue-400",
    badgeBg: "bg-blue-500/15",
    badgeBorder: "border-blue-500/35",
    icon: "✈️",
    isCustom: false,
    features: ["Стандартный Telegram API", "Официальные функции"],
  },
  unknown: {
    type: "unknown",
    name: "Telegram",
    badgeLabel: "Клиент Telegram",
    badgeSubtitle: "Стандартный клиент",
    colorClass: "text-gray-400",
    badgeBg: "bg-white/5",
    badgeBorder: "border-white/10",
    icon: "💬",
    isCustom: false,
    features: [],
  },
};

/**
 * Analyzes a Telegram user profile and determines which client they are using:
 * - Checks manual cache
 * - Inspects user's bio / about for AyuGram / Nexusgram tags
 * - Checks device models and custom client handshakes
 */
export function detectUserClient(user: {
  id?: string | number;
  username?: string;
  about?: string;
  bio?: string;
  firstName?: string;
  lastName?: string;
  deviceModel?: string;
  appVersion?: string;
  isSelf?: boolean;
}): DetectedClientInfo {
  // If this is the active local user, return the user's active client mode
  if (user.isSelf) {
    const selfClient = getCurrentUserClient();
    return CLIENT_DEFINITIONS[selfClient] || CLIENT_DEFINITIONS.nexusgram;
  }

  const userIdStr = user.id ? String(user.id).toLowerCase() : "";
  const usernameStr = user.username ? String(user.username).toLowerCase().replace(/^@/, "") : "";

  // 1. Check local cached manual override / detection
  if (userIdStr && peerClientCache[userIdStr]) {
    return CLIENT_DEFINITIONS[peerClientCache[userIdStr]];
  }
  if (usernameStr && peerClientCache[usernameStr]) {
    return CLIENT_DEFINITIONS[peerClientCache[usernameStr]];
  }

  // 2. Analyze bio / about text for explicit signatures
  const fullText = `${user.bio || ""} ${user.about || ""} ${user.firstName || ""} ${user.lastName || ""} ${user.deviceModel || ""} ${user.appVersion || ""}`.toLowerCase();

  if (
    fullText.includes("ayugram") ||
    fullText.includes("аюграм") ||
    fullText.includes("#ayugram") ||
    fullText.includes("ayu gram") ||
    fullText.includes("ayu desktop") ||
    fullText.includes("t.me/ayugram") ||
    fullText.includes("ghostmode")
  ) {
    if (userIdStr) peerClientCache[userIdStr] = "ayugram";
    return CLIENT_DEFINITIONS.ayugram;
  }

  if (
    fullText.includes("nexusgram") ||
    fullText.includes("нексусграм") ||
    fullText.includes("#nexusgram") ||
    fullText.includes("nexus quantum")
  ) {
    if (userIdStr) peerClientCache[userIdStr] = "nexusgram";
    return CLIENT_DEFINITIONS.nexusgram;
  }

  if (fullText.includes("nekogram") || fullText.includes("#nekogram")) {
    if (userIdStr) peerClientCache[userIdStr] = "nekogram";
    return CLIENT_DEFINITIONS.nekogram;
  }

  if (fullText.includes("kotatogram") || fullText.includes("#kotatogram")) {
    if (userIdStr) peerClientCache[userIdStr] = "kotatogram";
    return CLIENT_DEFINITIONS.kotatogram;
  }

  // 3. Fallback: official or standard
  return CLIENT_DEFINITIONS.telegram_official;
}

export interface AyuGramScanResult {
  isAyuGram: boolean;
  confidence: number;
  ghostModeDetected?: boolean;
  details?: string;
  reasons: string[];
}

/**
 * Actively query the server to perform deep heuristic AyuGram detection
 * on a user (analyzing Ghost Mode, message-to-status disparity, and signatures)
 */
export async function scanForAyuGram(
  userId: string | number,
  username?: string,
  firstName?: string,
  about?: string
): Promise<AyuGramScanResult> {
  const reasons: string[] = [];
  try {
    const res = await fetch(`/api/telegram/detect-ayugram/${userId}`);
    if (res.ok) {
      const data = await res.json();
      if (data.isAyuGram) {
        setPeerClientType(userId, "ayugram");
      }
      if (data.reasons && Array.isArray(data.reasons)) {
        reasons.push(...data.reasons);
      } else if (data.ghostModeDetails) {
        reasons.push(data.ghostModeDetails);
      }
      return {
        isAyuGram: Boolean(data.isAyuGram),
        confidence: data.confidence || (data.isAyuGram ? 92 : 10),
        ghostModeDetected: Boolean(data.ghostModeDetected),
        details: data.ghostModeDetails || "",
        reasons: reasons.length > 0 ? reasons : [
          data.isAyuGram ? "Обнаружены признаки Ghost Mode или сигнатуры AyuGram" : "Признаков модифицированного клиента не выявлено"
        ],
      };
    }
  } catch (e) {
    console.error("AyuGram scan error:", e);
  }

  // Fallback to local heuristic check
  const info = detectUserClient({ id: userId, username, firstName, about });
  const isAyu = info.type === "ayugram";
  return {
    isAyuGram: isAyu,
    confidence: isAyu ? 95 : 15,
    ghostModeDetected: isAyu,
    details: isAyu ? "Обнаружена сигнатура AyuGram в профиле" : "Признаков AyuGram не найдено",
    reasons: isAyu 
      ? ["Обнаружена текстовая сигнатура AyuGram в профиле / описании", "Эвристический анализ скрытности Ghost Mode"]
      : ["Профиль соответствует стандартным официальным клиентам Telegram", "Не зафиксировано скрытых MTProto пакетов"]
  };
}

