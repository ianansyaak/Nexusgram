// Ayugram Plugin Manager & Execution Runtime for NexusGram

export interface AyuPlugin {
  id: string;
  name: string;
  version: string;
  author: string;
  description: string;
  enabled: boolean;
  code?: string;
  category: "privacy" | "appearance" | "tools" | "network";
  dateInstalled: string;
  features: string[];
  executionStatus?: "running" | "idle" | "error";
  lastError?: string;
}

const DEFAULT_PLUGINS: AyuPlugin[] = [
  {
    id: "ayu-ghost-mode",
    name: "Ghost Mode (Режим невидимки)",
    version: "2.4.1",
    author: "Ayugram Team",
    description: "Не отправляет статус 'печатает' и не помечает сообщения прочитанными, скрывает онлайн.",
    enabled: true,
    category: "privacy",
    dateInstalled: "2026-09-14",
    features: ["Скрытие онлайна", "Блокировка отправки статуса 'печатает'", "Чтение без галочек"],
    code: `// AyuGram Ghost Mode Core
AyuGram.registerFeature("ghost_mode", {
  blockTyping: true,
  silentRead: true,
  stealthPresence: true
});
console.log("[AyuGram Core] Ghost Mode activated: typing notifications and read marks are blocked.");`
  },
  {
    id: "ayu-anti-recall",
    name: "Anti-Delete / No-Recall (Анти-удаление)",
    version: "2.0.0",
    author: "Ayugram OpenSource",
    description: "Сохраняет удалённые собеседником сообщения и медиа в локальный кэш с меткой [Удалено].",
    enabled: true,
    category: "privacy",
    dateInstalled: "2026-09-14",
    features: ["Локальное сохранение удалённых сообщений", "Красная плашка [Удалено]", "Защита истории чата"],
    code: `// AyuGram Anti-Recall Core
AyuGram.registerFeature("anti_recall", {
  saveDeletedMessages: true,
  renderDeletedBadge: true
});
console.log("[AyuGram Core] Anti-Recall activated: deleted messages will be preserved with [Удалено] tag.");`
  },
  {
    id: "ayu-media-recovery",
    name: "Media Stream & Offline Recovery",
    version: "1.5.0",
    author: "Nexus Devs",
    description: "Автоматически возобновляет недогруженные медиа-файлы и сообщения после выхода из приложения.",
    enabled: true,
    category: "tools",
    dateInstalled: "2026-09-14",
    features: ["Фоновое восстановление кэша", "Очередь недокачанных медиа", "Автоповтор при сбоях сети"],
    code: `// AyuGram Media Recovery
AyuGram.registerFeature("media_recovery", {
  autoResume: true,
  maxRetries: 5
});
console.log("[AyuGram Core] Media Recovery initialized.");`
  },
  {
    id: "ayu-data-saver",
    name: "Traffic Saver & Telemetry",
    version: "1.2.5",
    author: "AyuDev",
    description: "Оптимизирует трафик сотовой связи и выводит реальные метрики без симуляции.",
    enabled: true,
    category: "network",
    dateInstalled: "2026-09-14",
    features: ["Реальный учет трафика", "Сжатие изображений", "Без фейковых данных"],
    code: `// AyuGram Data Saver
AyuGram.registerFeature("data_saver", {
  compressUploads: true,
  realMetricsOnly: true
});
console.log("[AyuGram Core] Real Data Saver active.");`
  }
];

export function getInstalledPlugins(): AyuPlugin[] {
  try {
    const raw = localStorage.getItem("ayugram_plugins");
    if (raw) {
      const parsed: AyuPlugin[] = JSON.parse(raw);
      // Ensure default plugins are present
      const existingIds = new Set(parsed.map(p => p.id));
      let changed = false;
      DEFAULT_PLUGINS.forEach(def => {
        if (!existingIds.has(def.id)) {
          parsed.push(def);
          changed = true;
        }
      });
      // Remove deprecated virtual island plugin if present
      const cleaned = parsed.filter(p => p.id !== "ayu-dynamic-island");
      if (cleaned.length !== parsed.length || changed) {
        savePlugins(cleaned);
        return cleaned;
      }
      return parsed;
    }
  } catch (e) {
    console.error("Error reading plugins from localStorage", e);
  }
  // Initialize with defaults
  savePlugins(DEFAULT_PLUGINS);
  return DEFAULT_PLUGINS;
}

export function savePlugins(plugins: AyuPlugin[]) {
  try {
    localStorage.setItem("ayugram_plugins", JSON.stringify(plugins));
  } catch (e) {
    console.error("Error saving plugins to localStorage", e);
  }
}

export function togglePlugin(id: string, enabled: boolean): AyuPlugin[] {
  const list = getInstalledPlugins().map(p => p.id === id ? { ...p, enabled } : p);
  savePlugins(list);
  initPluginSystem();
  return list;
}

export function deletePlugin(id: string): AyuPlugin[] {
  const list = getInstalledPlugins().filter(p => p.id !== id);
  savePlugins(list);
  initPluginSystem();
  return list;
}

// Global AyuGram API Interface
interface AyuGramGlobalAPI {
  version: string;
  features: Record<string, any>;
  registerFeature: (name: string, config: any) => void;
  isGhostMode: () => boolean;
  isAntiRecall: () => boolean;
  isDataSaver: () => boolean;
  onMessageReceived: (fn: (msg: any) => void) => void;
  emitMessage: (msg: any) => void;
  plugins: AyuPlugin[];
}

declare global {
  interface Window {
    AyuGram?: AyuGramGlobalAPI;
  }
}

// Initialize and execute all enabled AyuGram plugins in the environment
export function initPluginSystem() {
  if (typeof window === "undefined") return;

  const plugins = getInstalledPlugins();

  const messageListeners: ((msg: any) => void)[] = [];

  const api: AyuGramGlobalAPI = {
    version: "2.4.1",
    features: {},
    registerFeature: (name: string, config: any) => {
      api.features[name] = config;
    },
    isGhostMode: () => {
      const p = getInstalledPlugins().find(x => x.id === "ayu-ghost-mode");
      return p ? p.enabled : true;
    },
    isAntiRecall: () => {
      const p = getInstalledPlugins().find(x => x.id === "ayu-anti-recall");
      return p ? p.enabled : true;
    },
    isDataSaver: () => {
      const p = getInstalledPlugins().find(x => x.id === "ayu-data-saver");
      return p ? p.enabled : false;
    },
    onMessageReceived: (fn: (msg: any) => void) => {
      messageListeners.push(fn);
    },
    emitMessage: (msg: any) => {
      messageListeners.forEach(fn => {
        try { fn(msg); } catch (e) { console.error("[AyuGram Hook Error]", e); }
      });
    },
    plugins
  };

  if (typeof window !== "undefined") {
    try {
      (window as any).AyuGram = api;
    } catch (e) {
      try {
        Object.defineProperty(window, "AyuGram", { value: api, writable: true, configurable: true });
      } catch (err) {}
    }
  }

  // Execute enabled plugins
  const updatedPlugins = plugins.map(plugin => {
    if (!plugin.enabled) {
      return { ...plugin, executionStatus: "idle" as const };
    }

    if (plugin.code && plugin.code.trim()) {
      try {
        const executor = new Function("AyuGram", "window", "document", plugin.code);
        executor(api, window, document);
        return { ...plugin, executionStatus: "running" as const, lastError: undefined };
      } catch (err: any) {
        console.error(`[AyuGram Plugin Error] ${plugin.name}:`, err);
        return { ...plugin, executionStatus: "error" as const, lastError: err?.message || String(err) };
      }
    }

    return { ...plugin, executionStatus: "running" as const };
  });

  savePlugins(updatedPlugins);
  console.log(`[AyuGram] Initialized ${plugins.filter(p => p.enabled).length} active plugins.`);
}

export function isGhostModeActive(): boolean {
  if (typeof window !== "undefined" && window.AyuGram?.isGhostMode) {
    return window.AyuGram.isGhostMode();
  }
  const p = getInstalledPlugins().find(x => x.id === "ayu-ghost-mode");
  return p ? p.enabled : true;
}

export function isAntiRecallActive(): boolean {
  if (typeof window !== "undefined" && window.AyuGram?.isAntiRecall) {
    return window.AyuGram.isAntiRecall();
  }
  const p = getInstalledPlugins().find(x => x.id === "ayu-anti-recall");
  return p ? p.enabled : true;
}

export async function parsePluginFile(file: File): Promise<AyuPlugin> {
  const text = await file.text();
  let parsedJson: any = null;

  try {
    parsedJson = JSON.parse(text);
  } catch (e) {
    // Extract metadata from JS headers (@name, @version, @description, @author)
    const nameMatch = text.match(/@name\s+(.+)/i) || text.match(/name:\s*['"](.+?)['"]/);
    const descMatch = text.match(/@description\s+(.+)/i) || text.match(/description:\s*['"](.+?)['"]/);
    const versionMatch = text.match(/@version\s+(.+)/i) || text.match(/version:\s*['"](.+?)['"]/);
    const authorMatch = text.match(/@author\s+(.+)/i) || text.match(/author:\s*['"](.+?)['"]/);

    parsedJson = {
      name: nameMatch ? nameMatch[1].trim() : file.name.replace(/\.(plugin|js|json)$/i, ""),
      description: descMatch ? descMatch[1].trim() : "Кастомный Ayugram плагин",
      version: versionMatch ? versionMatch[1].trim() : "1.0.0",
      author: authorMatch ? authorMatch[1].trim() : "Custom Developer",
      code: text
    };
  }

  const newPlugin: AyuPlugin = {
    id: `custom-plugin-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
    name: parsedJson.name || file.name.replace(/\.(plugin|js|json)$/i, ""),
    version: parsedJson.version || "1.0.0",
    author: parsedJson.author || "User Upload",
    description: parsedJson.description || "Пользовательский плагин для клиента",
    enabled: true,
    code: parsedJson.code || text,
    category: parsedJson.category || "tools",
    dateInstalled: new Date().toISOString().split("T")[0],
    features: parsedJson.features || ["Кастомный скрипт", "AyuGram хуки"],
    executionStatus: "idle"
  };

  const current = getInstalledPlugins();
  const updated = [newPlugin, ...current.filter(p => p.name !== newPlugin.name)];
  savePlugins(updated);
  initPluginSystem();
  return newPlugin;
}

export function testPlugin(pluginId: string): { success: boolean; message: string; logs: string[] } {
  const plugins = getInstalledPlugins();
  const target = plugins.find(p => p.id === pluginId);
  if (!target) {
    return { success: false, message: "Плагин не найден", logs: [] };
  }

  const logs: string[] = [];
  try {
    logs.push(`[Init] Тестирование плагина "${target.name}" v${target.version}...`);
    logs.push(`[Author] Автор: ${target.author}`);
    logs.push(`[Environment] AyuGram Global API доступен: ${!!window.AyuGram}`);
    
    // Sandbox test execution
    if (target.code && target.code.trim()) {
      const sandboxAyu = {
        ...window.AyuGram,
        testLog: (msg: string) => logs.push(`[Plugin Log] ${msg}`)
      };
      const testFn = new Function("AyuGram", "window", "document", target.code);
      testFn(sandboxAyu, window, document);
      logs.push(`[Execution] Код плагина успешно выполнен без ошибок.`);
    } else {
      logs.push(`[Execution] Плагин не содержит исполняемого JS-кода (декларативный модуль).`);
    }

    return {
      success: true,
      message: `Плагин "${target.name}" успешно прошел проверку и активен.`,
      logs
    };
  } catch (err: any) {
    logs.push(`[ERROR] Исключение во время работы плагина: ${err?.message || String(err)}`);
    return {
      success: false,
      message: `Ошибка выполнения плагина: ${err?.message || String(err)}`,
      logs
    };
  }
}

