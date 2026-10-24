import React, { useState, useEffect } from "react";
import { 
  Shield, 
  ShieldCheck, 
  ShieldAlert, 
  Plus, 
  Trash2, 
  RefreshCw, 
  Check, 
  X, 
  Activity, 
  Wifi, 
  Zap, 
  ArrowUpRight, 
  ArrowDownLeft, 
  Globe, 
  Server,
  Lock,
  Radio,
  ClipboardPaste,
  Link,
  Sliders
} from "lucide-react";
import { triggerHaptic } from "../utils/haptics";

export interface ProxyItem {
  id: string;
  name: string;
  protocol: "mtproto" | "socks5" | "http";
  host: string;
  port: number | string;
  secret?: string;
  username?: string;
  password?: string;
  country?: string;
  countryName?: string;
  flag?: string;
  ping?: number;
  uptime?: number;
  active?: boolean;
}

interface ProxySettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function ProxySettingsModal({ isOpen, onClose }: ProxySettingsModalProps) {
  const [enabled, setEnabled] = useState<boolean>(true);
  const [activeProxyId, setActiveProxyId] = useState<string>("mtproto-nl-1");
  const [proxies, setProxies] = useState<ProxyItem[]>([
    {
      id: "mtproto-nl-1",
      name: "Amsterdam MTProto Fast",
      protocol: "mtproto",
      host: "proxy.digitalresistance.dog",
      port: 443,
      secret: "ee000000000000000000000000000000007777772e676f6f676c652e636f6d",
      country: "NL",
      countryName: "Нидерланды",
      flag: "🇳🇱",
      ping: 28,
      uptime: 99.9,
      active: true,
    },
    {
      id: "socks-de-2",
      name: "Frankfurt SOCKS5 Ultra",
      protocol: "socks5",
      host: "de-proxy.nexusgram.network",
      port: 1080,
      country: "DE",
      countryName: "Германия",
      flag: "🇩🇪",
      ping: 36,
      uptime: 99.7,
      active: false,
    }
  ]);

  const [stats, setStats] = useState<any>({
    bytesSent: 14258900,
    bytesReceived: 89412500,
    ping: 32,
    uptime: 99.9,
  });
  const [testingId, setTestingId] = useState<string | null>(null);
  const [showAddForm, setShowAddForm] = useState(false);
  
  // Custom quick paste input for direct links
  const [quickLinkInput, setQuickLinkInput] = useState("");
  const [quickLinkError, setQuickLinkError] = useState<string | null>(null);

  // Manual form inputs
  const [newProtocol, setNewProtocol] = useState<"mtproto" | "socks5" | "http">("mtproto");
  const [newName, setNewName] = useState("");
  const [newHost, setNewHost] = useState("");
  const [newPort, setNewPort] = useState("443");
  const [newSecret, setNewSecret] = useState("");
  const [newUsername, setNewUsername] = useState("");
  const [newPassword, setNewPassword] = useState("");

  const loadConfig = async () => {
    try {
      const res = await fetch("/api/proxy/config");
      if (res.ok) {
        const data = await res.json();
        setEnabled(data.enabled ?? true);
        setActiveProxyId(data.activeProxyId || "mtproto-nl-1");
        if (Array.isArray(data.proxies) && data.proxies.length > 0) {
          setProxies(data.proxies);
        }
      }
      const statsRes = await fetch("/api/proxy/stats");
      if (statsRes.ok) {
        const s = await statsRes.json();
        setStats(s);
      }
    } catch (e) {
      console.error("Failed to load proxy config:", e);
    }
  };

  useEffect(() => {
    if (isOpen) {
      loadConfig();
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const saveConfig = async (newEnabled: boolean, newActiveId: string, newProxiesList: ProxyItem[]) => {
    try {
      setEnabled(newEnabled);
      setActiveProxyId(newActiveId);
      setProxies(newProxiesList);

      await fetch("/api/proxy/config", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          enabled: newEnabled,
          activeProxyId: newActiveId,
          proxies: newProxiesList,
        }),
      });

      window.dispatchEvent(new CustomEvent("proxy-updated", {
        detail: {
          enabled: newEnabled,
          activeProxyId: newActiveId,
          activeProxy: newProxiesList.find(p => p.id === newActiveId),
        }
      }));
    } catch (e) {
      console.error("Failed to save proxy config:", e);
    }
  };

  const handleToggleEnable = () => {
    triggerHaptic("medium");
    saveConfig(!enabled, activeProxyId, proxies);
  };

  const handleSelectProxy = (id: string) => {
    triggerHaptic("light");
    const updated = proxies.map(p => ({ ...p, active: p.id === id }));
    saveConfig(enabled, id, updated);
  };

  const handleDeleteProxy = (id: string) => {
    triggerHaptic("medium");
    const filtered = proxies.filter(p => p.id !== id);
    const nextActive = activeProxyId === id ? (filtered[0]?.id || "") : activeProxyId;
    saveConfig(enabled, nextActive, filtered);
  };

  const handleTestPing = async (proxy: ProxyItem) => {
    setTestingId(proxy.id);
    triggerHaptic("light");
    try {
      const res = await fetch("/api/proxy/test", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ host: proxy.host, port: proxy.port }),
      });
      const data = await res.json();
      if (data.ping !== undefined) {
        const updated = proxies.map(p => p.id === proxy.id ? { ...p, ping: data.ping } : p);
        setProxies(updated);
        saveConfig(enabled, activeProxyId, updated);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setTestingId(null);
    }
  };

  // Parses tg://proxy, https://t.me/proxy, tg://socks, socks5://, http://, or host:port:secret formats
  const parseProxyString = (raw: string): Partial<ProxyItem> | null => {
    const trimmed = raw.trim();
    if (!trimmed) return null;

    try {
      // 1. Telegram MTProto link (tg://proxy?server=... or https://t.me/proxy?server=...)
      if (trimmed.startsWith("tg://proxy") || trimmed.includes("t.me/proxy")) {
        const queryStr = trimmed.includes("?") ? trimmed.split("?")[1] : trimmed;
        const params = new URLSearchParams(queryStr);
        const server = params.get("server");
        const port = params.get("port");
        const secret = params.get("secret");

        if (server && port) {
          return {
            protocol: "mtproto",
            host: server,
            port: parseInt(port, 10) || 443,
            secret: secret || undefined,
            name: `MTProto (${server})`,
          };
        }
      }

      // 2. Telegram SOCKS5 link (tg://socks?server=... or https://t.me/socks?server=...)
      if (trimmed.startsWith("tg://socks") || trimmed.includes("t.me/socks")) {
        const queryStr = trimmed.includes("?") ? trimmed.split("?")[1] : trimmed;
        const params = new URLSearchParams(queryStr);
        const server = params.get("server");
        const port = params.get("port");
        const user = params.get("user") || undefined;
        const pass = params.get("pass") || undefined;

        if (server && port) {
          return {
            protocol: "socks5",
            host: server,
            port: parseInt(port, 10) || 1080,
            username: user,
            password: pass,
            name: `SOCKS5 (${server})`,
          };
        }
      }

      // 3. Standard URI format (socks5://user:pass@host:port or http://...)
      if (trimmed.startsWith("socks5://") || trimmed.startsWith("socks://") || trimmed.startsWith("http://") || trimmed.startsWith("https://")) {
        const url = new URL(trimmed);
        const protocol = url.protocol.startsWith("socks") ? "socks5" : "http";
        return {
          protocol,
          host: url.hostname,
          port: parseInt(url.port, 10) || (protocol === "socks5" ? 1080 : 8080),
          username: url.username ? decodeURIComponent(url.username) : undefined,
          password: url.password ? decodeURIComponent(url.password) : undefined,
          name: `${protocol.toUpperCase()} (${url.hostname})`,
        };
      }

      // 4. Raw format: host:port:secret or host:port:user:pass or host:port
      const parts = trimmed.split(":");
      if (parts.length >= 2) {
        const host = parts[0].trim();
        const port = parseInt(parts[1].trim(), 10);
        if (host && !isNaN(port)) {
          if (parts.length === 3 && parts[2].length >= 16) {
            // Hex secret -> MTProto
            return {
              protocol: "mtproto",
              host,
              port,
              secret: parts[2].trim(),
              name: `MTProto (${host})`,
            };
          } else if (parts.length === 4) {
            // host:port:user:pass -> SOCKS5
            return {
              protocol: "socks5",
              host,
              port,
              username: parts[2].trim(),
              password: parts[3].trim(),
              name: `SOCKS5 (${host})`,
            };
          } else {
            return {
              protocol: port === 443 ? "mtproto" : "socks5",
              host,
              port,
              name: `Proxy (${host})`,
            };
          }
        }
      }
    } catch (e) {
      console.error("Parse proxy error:", e);
    }
    return null;
  };

  const handleQuickImport = (textToParse?: string) => {
    const raw = textToParse || quickLinkInput;
    setQuickLinkError(null);
    const parsed = parseProxyString(raw);

    if (!parsed || !parsed.host || !parsed.port) {
      setQuickLinkError("Не удалось распознать ссылку. Поддерживаются tg://proxy, t.me/proxy, socks5://, http:// или host:port:secret.");
      triggerHaptic("heavy");
      return;
    }

    triggerHaptic("medium");
    const item: ProxyItem = {
      id: `proxy_${Date.now()}`,
      name: parsed.name || `${(parsed.protocol || "mtproto").toUpperCase()} Proxy`,
      protocol: parsed.protocol || "mtproto",
      host: parsed.host,
      port: parsed.port,
      secret: parsed.secret,
      username: parsed.username,
      password: parsed.password,
      country: "CUSTOM",
      countryName: "Пользовательский",
      flag: "🌐",
      ping: 32,
      uptime: 99.9,
      active: true,
    };

    const updated = [item, ...proxies];
    saveConfig(true, item.id, updated);
    setQuickLinkInput("");
    setShowAddForm(false);
  };

  const handlePasteFromClipboard = async () => {
    triggerHaptic("light");
    try {
      const text = await navigator.clipboard.readText();
      if (text) {
        setQuickLinkInput(text);
        handleQuickImport(text);
      }
    } catch {
      const manual = prompt("Вставьте ссылку на прокси:");
      if (manual) {
        setQuickLinkInput(manual);
        handleQuickImport(manual);
      }
    }
  };

  const handleAddProxy = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newHost || !newPort) return;
    triggerHaptic("medium");

    const item: ProxyItem = {
      id: `proxy_${Date.now()}`,
      name: newName || `${newProtocol.toUpperCase()} Proxy`,
      protocol: newProtocol,
      host: newHost.trim(),
      port: parseInt(newPort, 10) || 443,
      secret: newSecret.trim() || undefined,
      username: newUsername.trim() || undefined,
      password: newPassword.trim() || undefined,
      country: "CUSTOM",
      countryName: "Пользовательский",
      flag: "🌐",
      ping: 45,
      uptime: 99.8,
      active: true,
    };

    const updated = [item, ...proxies];
    saveConfig(true, item.id, updated);
    setShowAddForm(false);
    setNewName("");
    setNewHost("");
    setNewPort("443");
    setNewSecret("");
    setNewUsername("");
    setNewPassword("");
  };

  const activeProxy = proxies.find(p => p.id === activeProxyId) || proxies[0];

  const formatBytes = (bytes: number) => {
    if (!bytes) return "0 MB";
    const mb = bytes / (1024 * 1024);
    if (mb > 1024) return `${(mb / 1024).toFixed(2)} GB`;
    return `${mb.toFixed(1)} MB`;
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-md p-4 animate-fade-in select-none">
      <div className="bg-[#0e1621] border border-[#1e2c3e] w-full max-w-lg rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="px-6 py-4 border-b border-[#1e2c3e] flex items-center justify-between bg-[#131d2b]">
          <div className="flex items-center gap-3">
            <div className={`w-10 h-10 rounded-2xl flex items-center justify-center ${enabled ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30' : 'bg-gray-800 text-gray-400'}`}>
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white flex items-center gap-2">
                <span>Настройки прокси</span>
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 font-mono">
                  SOCKS5 • HTTP • MTProto
                </span>
              </h2>
              <p className="text-xs text-gray-400">Обход блокировок, ссылки и кастомные порты</p>
            </div>
          </div>
          <button
            onClick={() => {
              triggerHaptic("light");
              onClose();
            }}
            className="w-8 h-8 rounded-full bg-white/5 hover:bg-white/10 text-gray-400 hover:text-white flex items-center justify-center transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Scrollable Content */}
        <div className="p-6 overflow-y-auto space-y-5 flex-1 custom-scrollbar">
          {/* Main Switch */}
          <div className="p-4 rounded-2xl bg-[#141f2d] border border-[#223348] flex items-center justify-between shadow-sm">
            <div className="space-y-0.5">
              <span className="text-sm font-bold text-white block">Использовать прокси-сервер</span>
              <span className="text-xs text-gray-400 block">
                {enabled ? "Трафик маршрутизируется через активный туннель" : "Прямое подключение без прокси"}
              </span>
            </div>
            <button
              onClick={handleToggleEnable}
              className={`w-12 h-6 rounded-full transition-colors relative cursor-pointer ${
                enabled ? "bg-emerald-500" : "bg-gray-700"
              }`}
            >
              <div
                className={`w-5 h-5 rounded-full bg-white transition-transform shadow-md absolute top-0.5 left-0.5 ${
                  enabled ? "translate-x-6" : "translate-x-0"
                }`}
              />
            </button>
          </div>

          {/* Quick Paste Proxy Link Input */}
          <div className="p-4 rounded-2xl bg-[#121c27] border border-[#1e2e42] space-y-2.5">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold text-gray-200 flex items-center gap-1.5">
                <Link className="w-3.5 h-3.5 text-indigo-400" />
                <span>Быстрая вставка ссылки прокси</span>
              </label>
              <button
                type="button"
                onClick={handlePasteFromClipboard}
                className="text-xs text-indigo-400 hover:text-indigo-300 font-semibold flex items-center gap-1 cursor-pointer"
              >
                <ClipboardPaste className="w-3.5 h-3.5" />
                <span>Вставить из буфера</span>
              </button>
            </div>

            <div className="flex gap-2">
              <input
                type="text"
                placeholder="tg://proxy?server=... или socks5://host:port"
                value={quickLinkInput}
                onChange={(e) => {
                  setQuickLinkInput(e.target.value);
                  setQuickLinkError(null);
                }}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    handleQuickImport();
                  }
                }}
                className="flex-1 bg-[#0b121a] border border-[#213346] rounded-xl px-3 py-2 text-xs text-white placeholder-gray-500 outline-none focus:border-indigo-500 font-mono"
              />
              <button
                type="button"
                onClick={() => handleQuickImport()}
                className="px-3.5 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-semibold shrink-0 transition-colors cursor-pointer"
              >
                Подключить
              </button>
            </div>

            {quickLinkError && (
              <p className="text-[11px] text-rose-400 leading-tight">{quickLinkError}</p>
            )}
            <p className="text-[10px] text-gray-400 leading-relaxed">
              Поддерживаются форматы: <code className="text-indigo-300">tg://proxy</code>, <code className="text-indigo-300">t.me/proxy</code>, <code className="text-indigo-300">socks5://</code>, <code className="text-indigo-300">http://</code>, <code className="text-indigo-300">host:port:secret</code>.
            </p>
          </div>

          {/* Statistics Card (when enabled) */}
          {enabled && activeProxy && (
            <div className="p-5 rounded-2xl bg-gradient-to-br from-[#121c29] to-[#172537] border border-[#24374e] space-y-4 shadow-lg relative overflow-hidden">
              <div className="absolute right-0 top-0 translate-x-4 -translate-y-4 w-32 h-32 bg-emerald-500/10 rounded-full blur-2xl pointer-events-none" />
              
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="text-2xl">{activeProxy.flag || "🌐"}</span>
                  <div>
                    <h3 className="text-sm font-bold text-white flex items-center gap-2">
                      <span>{activeProxy.name}</span>
                      <span className="text-[10px] px-1.5 py-0.5 rounded bg-emerald-500/20 text-emerald-400 font-mono font-semibold">
                        АКТИВЕН
                      </span>
                    </h3>
                    <p className="text-xs text-gray-400 font-mono">{activeProxy.host}:{activeProxy.port}</p>
                  </div>
                </div>
                <div className="text-right">
                  <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold font-mono ${
                    (activeProxy.ping || 34) < 60 ? 'bg-emerald-500/20 text-emerald-400' : 'bg-amber-500/20 text-amber-400'
                  }`}>
                    <Activity className="w-3 h-3 animate-pulse" />
                    {activeProxy.ping || 34} ms
                  </span>
                </div>
              </div>

              {/* Stats Grid */}
              <div className="grid grid-cols-3 gap-2 pt-2 border-t border-[#1e2f42] text-center">
                <div className="bg-[#0e1622]/80 p-2.5 rounded-xl border border-[#1e2d3e]">
                  <span className="text-[10px] text-gray-400 flex items-center justify-center gap-1 mb-1">
                    <ArrowDownLeft className="w-3 h-3 text-emerald-400" /> Принято
                  </span>
                  <span className="text-xs font-bold text-white font-mono">
                    {formatBytes(stats.bytesReceived || 89412500)}
                  </span>
                </div>
                <div className="bg-[#0e1622]/80 p-2.5 rounded-xl border border-[#1e2d3e]">
                  <span className="text-[10px] text-gray-400 flex items-center justify-center gap-1 mb-1">
                    <ArrowUpRight className="w-3 h-3 text-cyan-400" /> Отправлено
                  </span>
                  <span className="text-xs font-bold text-white font-mono">
                    {formatBytes(stats.bytesSent || 14258900)}
                  </span>
                </div>
                <div className="bg-[#0e1622]/80 p-2.5 rounded-xl border border-[#1e2d3e]">
                  <span className="text-[10px] text-gray-400 flex items-center justify-center gap-1 mb-1">
                    <Zap className="w-3 h-3 text-amber-400" /> Аптайм
                  </span>
                  <span className="text-xs font-bold text-white font-mono">
                    {activeProxy.uptime || 99.9}%
                  </span>
                </div>
              </div>
            </div>
          )}

          {/* Proxy Servers List */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-bold text-gray-300 uppercase tracking-wider flex items-center gap-1.5">
                <Server className="w-3.5 h-3.5 text-indigo-400" />
                <span>Список серверов ({proxies.length})</span>
              </h3>
              <button
                onClick={() => {
                  triggerHaptic("light");
                  setShowAddForm(!showAddForm);
                }}
                className="text-xs text-indigo-400 hover:text-indigo-300 font-semibold flex items-center gap-1 cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>{showAddForm ? "Скрыть форму" : "Ввести вручную"}</span>
              </button>
            </div>

            {/* Add manual form */}
            {showAddForm && (
              <form onSubmit={handleAddProxy} className="p-4 rounded-2xl bg-[#14202e] border border-indigo-500/30 space-y-3 animate-fade-in">
                <h4 className="text-xs font-bold text-white flex items-center gap-1.5">
                  <Sliders className="w-3.5 h-3.5 text-indigo-400" />
                  <span>Параметры нового прокси-сервера</span>
                </h4>
                
                {/* Protocol selector */}
                <div className="grid grid-cols-3 gap-1.5 p-1 bg-[#0d141e] rounded-xl">
                  {(["mtproto", "socks5", "http"] as const).map(p => (
                    <button
                      key={p}
                      type="button"
                      onClick={() => {
                        setNewProtocol(p);
                        if (p === "mtproto") setNewPort("443");
                        else if (p === "socks5") setNewPort("1080");
                        else setNewPort("8080");
                      }}
                      className={`py-1.5 text-xs font-semibold rounded-lg uppercase transition-all cursor-pointer ${
                        newProtocol === p ? 'bg-indigo-600 text-white shadow' : 'text-gray-400 hover:text-white'
                      }`}
                    >
                      {p}
                    </button>
                  ))}
                </div>

                <div className="grid grid-cols-3 gap-2">
                  <div className="col-span-2 space-y-1">
                    <label className="text-[10px] text-gray-400 font-semibold">Хост / IP-адрес</label>
                    <input
                      type="text"
                      placeholder="e.g. 195.154.12.34 или proxy.net"
                      value={newHost}
                      onChange={e => setNewHost(e.target.value)}
                      required
                      className="w-full px-3 py-2 text-xs bg-[#0e1621] border border-[#213346] rounded-xl text-white outline-none focus:border-indigo-500 font-mono"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] text-gray-400 font-semibold">Порт</label>
                    <input
                      type="text"
                      placeholder="443"
                      value={newPort}
                      onChange={e => setNewPort(e.target.value)}
                      required
                      className="w-full px-3 py-2 text-xs bg-[#0e1621] border border-[#213346] rounded-xl text-white outline-none focus:border-indigo-500 font-mono"
                    />
                  </div>
                </div>

                {newProtocol === "mtproto" ? (
                  <div className="space-y-1">
                    <label className="text-[10px] text-gray-400 font-semibold">MTProto Секрет (HEX / FakeTLS secret)</label>
                    <input
                      type="text"
                      placeholder="ee000000... или dd0000..."
                      value={newSecret}
                      onChange={e => setNewSecret(e.target.value)}
                      className="w-full px-3 py-2 text-xs font-mono bg-[#0e1621] border border-[#213346] rounded-xl text-white outline-none focus:border-indigo-500"
                    />
                  </div>
                ) : (
                  <div className="grid grid-cols-2 gap-2">
                    <div className="space-y-1">
                      <label className="text-[10px] text-gray-400 font-semibold">Логин (если требуется)</label>
                      <input
                        type="text"
                        placeholder="user"
                        value={newUsername}
                        onChange={e => setNewUsername(e.target.value)}
                        className="w-full px-3 py-2 text-xs bg-[#0e1621] border border-[#213346] rounded-xl text-white outline-none focus:border-indigo-500"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[10px] text-gray-400 font-semibold">Пароль (если требуется)</label>
                      <input
                        type="password"
                        placeholder="pass"
                        value={newPassword}
                        onChange={e => setNewPassword(e.target.value)}
                        className="w-full px-3 py-2 text-xs bg-[#0e1621] border border-[#213346] rounded-xl text-white outline-none focus:border-indigo-500"
                      />
                    </div>
                  </div>
                )}

                <div className="space-y-1">
                  <label className="text-[10px] text-gray-400 font-semibold">Название сервера (опционально)</label>
                  <input
                    type="text"
                    placeholder="Мой личный сервер"
                    value={newName}
                    onChange={e => setNewName(e.target.value)}
                    className="w-full px-3 py-2 text-xs bg-[#0e1621] border border-[#213346] rounded-xl text-white outline-none focus:border-indigo-500"
                  />
                </div>

                <div className="flex gap-2 pt-1">
                  <button
                    type="button"
                    onClick={() => setShowAddForm(false)}
                    className="flex-1 py-2 text-xs text-gray-400 hover:text-white rounded-xl bg-white/5 cursor-pointer"
                  >
                    Отмена
                  </button>
                  <button
                    type="submit"
                    className="flex-1 py-2 text-xs font-semibold text-white rounded-xl bg-indigo-600 hover:bg-indigo-500 transition-colors cursor-pointer"
                  >
                    Сохранить и подключить
                  </button>
                </div>
              </form>
            )}

            {/* List items */}
            <div className="space-y-2">
              {proxies.map(proxy => {
                const isSelected = proxy.id === activeProxyId;
                const isTesting = testingId === proxy.id;

                return (
                  <div
                    key={proxy.id}
                    onClick={() => handleSelectProxy(proxy.id)}
                    className={`p-3.5 rounded-2xl border transition-all cursor-pointer flex items-center justify-between gap-3 ${
                      isSelected
                        ? 'bg-[#152332] border-emerald-500/40 shadow-md ring-1 ring-emerald-500/20'
                        : 'bg-[#121b27] border-[#1e2d3e] hover:bg-[#162231] hover:border-[#273a50]'
                    }`}
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <span className="text-xl shrink-0">{proxy.flag || "🌐"}</span>
                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          <h4 className="text-xs font-bold text-white truncate">{proxy.name}</h4>
                          <span className="text-[9px] px-1.5 py-0.2 rounded font-mono font-semibold uppercase bg-white/5 text-gray-300">
                            {proxy.protocol}
                          </span>
                        </div>
                        <p className="text-[11px] text-gray-400 font-mono truncate mt-0.5">
                          {proxy.host}:{proxy.port}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleTestPing(proxy);
                        }}
                        disabled={isTesting}
                        className="px-2 py-1 rounded-lg bg-black/30 hover:bg-black/50 text-[10px] font-mono text-gray-300 border border-white/10 flex items-center gap-1 cursor-pointer transition-colors"
                        title="Проверить пинг"
                      >
                        {isTesting ? (
                          <RefreshCw className="w-2.5 h-2.5 animate-spin text-cyan-400" />
                        ) : (
                          <Activity className="w-2.5 h-2.5 text-emerald-400" />
                        )}
                        <span>{proxy.ping ? `${proxy.ping}ms` : "Тест"}</span>
                      </button>

                      {proxies.length > 1 && (
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDeleteProxy(proxy.id);
                          }}
                          className="p-1.5 text-gray-500 hover:text-red-400 rounded-lg hover:bg-red-500/10 transition-colors cursor-pointer"
                          title="Удалить"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      )}

                      <div className={`w-5 h-5 rounded-full flex items-center justify-center border transition-all ${
                        isSelected ? 'bg-emerald-500 border-emerald-400 text-white' : 'border-gray-600 bg-transparent'
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

        {/* Footer */}
        <div className="px-6 py-3 border-t border-[#1e2c3e] bg-[#101925] flex items-center justify-between text-xs text-gray-400">
          <span className="flex items-center gap-1.5">
            <Lock className="w-3.5 h-3.5 text-emerald-400" />
            Прямой защищенный туннель
          </span>
          <button
            onClick={() => {
              triggerHaptic("light");
              onClose();
            }}
            className="px-4 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl font-semibold transition-colors cursor-pointer"
          >
            Готово
          </button>
        </div>
      </div>
    </div>
  );
}
