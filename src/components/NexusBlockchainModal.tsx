import React, { useState, useEffect } from "react";
import { 
  ShieldCheck, 
  Lock, 
  Key, 
  Copy, 
  Check, 
  RefreshCw, 
  Download, 
  Upload, 
  Eye, 
  EyeOff, 
  Cpu, 
  CheckCircle2, 
  AlertTriangle, 
  X, 
  Share2, 
  FileText, 
  Radio, 
  Zap, 
  Hash, 
  Layers
} from "lucide-react";
import { 
  getMasterEncryptionKey, 
  setMasterEncryptionKey, 
  generateRandomMasterKey, 
  getLocalBlockchain, 
  validateBlockchainIntegrity, 
  isBlockchainEncryptionEnabled, 
  setBlockchainEncryptionEnabled, 
  isLiveKeystrokesViewEnabled, 
  setLiveKeystrokesViewEnabled, 
  NexusBlockData,
  exportBlockchainJson,
  importBlockchainJson
} from "../utils/nexusBlockchain";
import { triggerHaptic } from "../utils/haptics";

interface NexusBlockchainModalProps {
  onClose: () => void;
  selectedBlock?: NexusBlockData | null;
}

export const NexusBlockchainModal: React.FC<NexusBlockchainModalProps> = ({ onClose, selectedBlock: initialBlock }) => {
  const [masterKey, setMasterKey] = useState<string>(getMasterEncryptionKey());
  const [showKey, setShowKey] = useState<boolean>(false);
  const [copiedKey, setCopiedKey] = useState<boolean>(false);
  const [chain, setChain] = useState<NexusBlockData[]>([]);
  const [isEncEnabled, setIsEncEnabled] = useState<boolean>(isBlockchainEncryptionEnabled());
  const [isKeystrokesEnabled, setIsKeystrokesEnabled] = useState<boolean>(isLiveKeystrokesViewEnabled());
  
  const [inspectBlock, setInspectBlock] = useState<NexusBlockData | null>(initialBlock || null);
  const [activeTab, setActiveTab] = useState<"key" | "ledger" | "settings">("key");
  const [validationResult, setValidationResult] = useState<{ isValid: boolean; error?: string } | null>(null);
  const [validating, setValidating] = useState<boolean>(false);
  const [importText, setImportText] = useState<string>("");
  const [showImportDialog, setShowImportDialog] = useState<boolean>(false);
  const [importStatus, setImportStatus] = useState<string | null>(null);

  useEffect(() => {
    const currentChain = getLocalBlockchain();
    setChain(currentChain);
    if (!inspectBlock && currentChain.length > 0) {
      setInspectBlock(currentChain[currentChain.length - 1]);
    }
  }, []);

  const handleCopyKey = () => {
    navigator.clipboard.writeText(masterKey);
    setCopiedKey(true);
    triggerHaptic("medium");
    setTimeout(() => setCopiedKey(false), 2000);
  };

  const handleRegenerateKey = () => {
    if (window.confirm("Внимание! Генерация нового ключа заменит текущий Master Key. Сохраните старый ключ, иначе ранее зашифрованные сообщения станет невозможно расшифровать. Продолжить?")) {
      const newKey = generateRandomMasterKey();
      setMasterKey(newKey);
      setMasterEncryptionKey(newKey);
      triggerHaptic("heavy");
    }
  };

  const handleApplyCustomKey = (key: string) => {
    const trimmed = key.trim().toLowerCase();
    if (/^[0-9a-f]{64}$/.test(trimmed)) {
      setMasterKey(trimmed);
      setMasterEncryptionKey(trimmed);
      setImportStatus("Ключ успешно сохранен!");
      triggerHaptic("medium");
      setTimeout(() => {
        setShowImportDialog(false);
        setImportStatus(null);
      }, 1200);
    } else {
      setImportStatus("Ошибка: ключ должен быть 64-символьной шестнадцатеричной строкой (256 бит)");
    }
  };

  const handleVerifyChain = async () => {
    setValidating(true);
    triggerHaptic("medium");
    try {
      const res = await validateBlockchainIntegrity();
      setValidationResult(res);
    } catch (err: any) {
      setValidationResult({ isValid: false, error: err?.message });
    } finally {
      setValidating(false);
    }
  };

  const handleExportChain = () => {
    const jsonStr = exportBlockchainJson();
    const blob = new Blob([jsonStr], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `nexus_blockchain_ledger_${Date.now()}.json`;
    a.click();
    URL.revokeObjectURL(url);
    triggerHaptic("light");
  };

  const handleImportChainFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (ev) => {
        const text = ev.target?.result as string;
        if (text) {
          const res = importBlockchainJson(text);
          if (res.success) {
            setChain(getLocalBlockchain());
            alert(`Импортировано ${res.imported} новых блоков цепи!`);
          } else {
            alert(`Ошибка импорта цепи: ${res.error}`);
          }
        }
      };
      reader.readAsText(file);
    }
  };

  return (
    <div 
      className="fixed inset-0 bg-black/75 backdrop-blur-md flex items-center justify-center p-3 sm:p-5 z-[99999] animate-fade-in"
      onClick={onClose}
    >
      <div 
        className="bg-[#111722] border border-emerald-500/30 rounded-3xl w-full max-w-2xl overflow-hidden shadow-2xl shadow-emerald-950/50 flex flex-col max-h-[92vh] text-gray-200"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Top Header */}
        <div className="p-4 sm:p-5 border-b border-white/10 flex items-center justify-between bg-gradient-to-r from-emerald-950/40 via-[#111722] to-cyan-950/30">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-emerald-600 to-teal-500 flex items-center justify-center text-white shadow-lg shadow-emerald-500/20">
              <ShieldCheck className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-white flex items-center gap-2">
                Nexus Blockchain Vault
                <span className="text-[10px] uppercase font-mono px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/40">
                  AES-256-GCM
                </span>
              </h2>
              <p className="text-xs text-gray-400">
                Криптографическое шифрование & децентрализованная цепочка блоков
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl bg-white/5 hover:bg-white/10 text-gray-400 hover:text-white transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Navigation */}
        <div className="px-4 pt-3 flex items-center gap-2 border-b border-white/5 bg-[#0e141d]">
          {[
            { id: "key", label: "Ваш Master Key", icon: Key },
            { id: "ledger", label: `Реестр блоков (${chain.length})`, icon: Layers },
            { id: "settings", label: "Настройки шифрования", icon: Zap },
          ].map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`px-3.5 py-2 text-xs font-medium rounded-t-xl transition-all flex items-center gap-2 border-b-2 cursor-pointer ${
                  isActive
                    ? "border-emerald-400 text-emerald-300 bg-emerald-500/10 font-semibold"
                    : "border-transparent text-gray-400 hover:text-gray-200 hover:bg-white/5"
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>

        {/* Modal Body */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-6">

          {/* TAB 1: MASTER KEY */}
          {activeTab === "key" && (
            <div className="space-y-5 animate-fade-in">
              <div className="bg-emerald-950/20 border border-emerald-500/30 rounded-2xl p-4">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-bold uppercase tracking-wider text-emerald-400 flex items-center gap-1.5 font-mono">
                    <Key className="w-4 h-4" /> Ваш приватный ключ (Master Key)
                  </span>
                  <button
                    onClick={() => setShowKey(!showKey)}
                    className="text-xs text-emerald-400 hover:text-emerald-300 flex items-center gap-1 cursor-pointer font-mono"
                  >
                    {showKey ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                    <span>{showKey ? "Скрыть" : "Показать"}</span>
                  </button>
                </div>

                <div className="bg-black/50 border border-emerald-500/20 rounded-xl p-3 flex items-center justify-between gap-3 font-mono text-xs break-all select-all">
                  <span className="text-emerald-300 font-mono tracking-wider">
                    {showKey ? masterKey : `${masterKey.slice(0, 8)}${"•".repeat(48)}${masterKey.slice(-8)}`}
                  </span>
                  <button
                    onClick={handleCopyKey}
                    className="p-2 bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 rounded-lg shrink-0 transition-colors flex items-center gap-1 cursor-pointer"
                    title="Скопировать ключ"
                  >
                    {copiedKey ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
                    <span className="text-[11px] font-sans font-medium">{copiedKey ? "Скопирован!" : "Копировать"}</span>
                  </button>
                </div>

                <p className="text-[11px] text-gray-400 mt-2.5 leading-relaxed">
                  🔒 <strong className="text-emerald-300">Ключ хранится только на вашем устройстве</strong> в изолированном защищенном хранилище. Сервер и Telegram передают исключительно неразборчивые зашифрованные блоки AES-256-GCM.
                </p>
              </div>

              {/* Actions row */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <button
                  onClick={() => setShowImportDialog(true)}
                  className="p-3 bg-[#192230] hover:bg-[#202c3e] border border-white/10 rounded-2xl flex items-center gap-3 transition-colors text-left cursor-pointer"
                >
                  <div className="w-8 h-8 rounded-xl bg-cyan-500/20 flex items-center justify-center text-cyan-400">
                    <Upload className="w-4 h-4" />
                  </div>
                  <div>
                    <div className="text-xs font-semibold text-white">Импортировать ключ</div>
                    <div className="text-[10px] text-gray-400">Ввести ключ с другого клиента</div>
                  </div>
                </button>

                <button
                  onClick={handleRegenerateKey}
                  className="p-3 bg-[#192230] hover:bg-[#202c3e] border border-white/10 rounded-2xl flex items-center gap-3 transition-colors text-left cursor-pointer"
                >
                  <div className="w-8 h-8 rounded-xl bg-amber-500/20 flex items-center justify-center text-amber-400">
                    <RefreshCw className="w-4 h-4" />
                  </div>
                  <div>
                    <div className="text-xs font-semibold text-white">Сгенерировать новый</div>
                    <div className="text-[10px] text-gray-400">Создать 256-битный ключ</div>
                  </div>
                </button>
              </div>

              {/* Import Modal */}
              {showImportDialog && (
                <div className="p-4 bg-black/40 border border-cyan-500/40 rounded-2xl space-y-3 animate-fade-in">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-cyan-400 font-mono">Ввод мастер-ключа (HEX 64 символа)</span>
                    <button onClick={() => setShowImportDialog(false)} className="text-gray-400 hover:text-white">
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                  <input
                    type="text"
                    value={importText}
                    onChange={(e) => setImportText(e.target.value)}
                    placeholder="Вставьте 64-значный hex ключ..."
                    className="w-full bg-[#111722] border border-white/10 rounded-xl px-3 py-2 text-xs font-mono text-cyan-300 focus:outline-none focus:border-cyan-400"
                  />
                  {importStatus && (
                    <p className={`text-xs ${importStatus.includes("успешно") ? "text-emerald-400" : "text-rose-400"}`}>
                      {importStatus}
                    </p>
                  )}
                  <div className="flex justify-end gap-2">
                    <button
                      onClick={() => setShowImportDialog(false)}
                      className="px-3 py-1.5 rounded-xl text-xs bg-white/5 hover:bg-white/10 text-gray-300"
                    >
                      Отмена
                    </button>
                    <button
                      onClick={() => handleApplyCustomKey(importText)}
                      className="px-4 py-1.5 rounded-xl text-xs font-semibold bg-cyan-600 hover:bg-cyan-500 text-white shadow-md cursor-pointer"
                    >
                      Применить
                    </button>
                  </div>
                </div>
              )}

              {/* How it works banner */}
              <div className="bg-[#151c27] rounded-2xl p-4 border border-white/5 space-y-2">
                <h4 className="text-xs font-bold text-gray-200 flex items-center gap-1.5">
                  <Radio className="w-4 h-4 text-emerald-400" /> Как работает совместимость с Telegram?
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                  <div className="p-3 bg-black/20 rounded-xl border border-white/5 text-[11px] leading-relaxed">
                    <span className="font-bold text-sky-300 block mb-1">Официальный клиент Telegram:</span>
                    Сообщение отображается как стандартный прикрепленный файл <code className="text-gray-300 font-mono bg-white/10 px-1 rounded">nexus_vault_block.bin</code>. Сервер Telegram видит его как обычный двоичный документ.
                  </div>
                  <div className="p-3 bg-emerald-950/20 rounded-xl border border-emerald-500/20 text-[11px] leading-relaxed">
                    <span className="font-bold text-emerald-300 block mb-1">Клиент Nexusgram:</span>
                    Автоматически распознает сигнатуру блока, валидирует SHA-256 хеш цепи и мгновенно расшифровывает текст, фото, видео или стикер в оригинальный вид!
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: BLOCKCHAIN LEDGER */}
          {activeTab === "ledger" && (
            <div className="space-y-4 animate-fade-in">
              <div className="flex items-center justify-between flex-wrap gap-2">
                <div>
                  <h3 className="text-sm font-bold text-white flex items-center gap-1.5 font-mono">
                    <Hash className="w-4 h-4 text-emerald-400" /> Цепочка блоков Nexus
                  </h3>
                  <p className="text-[11px] text-gray-400">
                    Всего подтвержденных блоков в локальном реестре: {chain.length}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={handleVerifyChain}
                    disabled={validating}
                    className="px-3 py-1.5 bg-emerald-600/30 hover:bg-emerald-600/40 text-emerald-300 border border-emerald-500/40 rounded-xl text-xs font-semibold transition-colors flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                  >
                    {validating ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <CheckCircle2 className="w-3.5 h-3.5" />}
                    <span>Проверить цепь</span>
                  </button>
                  <button
                    onClick={handleExportChain}
                    className="p-1.5 bg-white/5 hover:bg-white/10 rounded-xl text-gray-300 hover:text-white"
                    title="Экспортировать цепь (.json)"
                  >
                    <Download className="w-4 h-4" />
                  </button>
                  <label className="p-1.5 bg-white/5 hover:bg-white/10 rounded-xl text-gray-300 hover:text-white cursor-pointer" title="Импортировать цепь (.json)">
                    <Upload className="w-4 h-4" />
                    <input type="file" accept=".json" onChange={handleImportChainFile} className="hidden" />
                  </label>
                </div>
              </div>

              {/* Validation notification banner */}
              {validationResult && (
                <div className={`p-3 rounded-xl border flex items-center gap-2 text-xs font-mono animate-fade-in ${
                  validationResult.isValid 
                    ? "bg-emerald-950/40 border-emerald-500/40 text-emerald-300"
                    : "bg-rose-950/40 border-rose-500/40 text-rose-300"
                }`}>
                  {validationResult.isValid ? <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" /> : <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0" />}
                  <span>
                    {validationResult.isValid 
                      ? "Целостность реестра подтверждена: все SHA-256 хеши блоков и связки валидны!" 
                      : `Ошибка целостности цепи: ${validationResult.error}`}
                  </span>
                </div>
              )}

              {/* Blocks list */}
              <div className="space-y-2 max-h-[340px] overflow-y-auto pr-1">
                {chain.length === 0 ? (
                  <div className="p-8 text-center text-gray-400 bg-black/20 rounded-2xl border border-white/5">
                    Блоков пока нет. Отправьте зашифрованное сообщение, чтобы создать первый блок цепи!
                  </div>
                ) : (
                  chain.map((b) => {
                    const isSelected = inspectBlock?.hash === b.hash;
                    return (
                      <div
                        key={b.hash}
                        onClick={() => setInspectBlock(b)}
                        className={`p-3 rounded-2xl border transition-all cursor-pointer ${
                          isSelected
                            ? "bg-emerald-950/30 border-emerald-500/50 shadow-md shadow-emerald-950/30"
                            : "bg-[#151c27] hover:bg-[#1a2332] border-white/5"
                        }`}
                      >
                        <div className="flex items-center justify-between text-xs mb-1">
                          <span className="font-mono font-bold text-emerald-400">
                            Block #{b.index}
                          </span>
                          <span className="text-[10px] text-gray-400 font-mono">
                            {new Date(b.timestamp).toLocaleTimeString()} • {new Date(b.timestamp).toLocaleDateString()}
                          </span>
                        </div>
                        <div className="font-mono text-[11px] text-gray-300 truncate">
                          Hash: <span className="text-emerald-300">{b.hash}</span>
                        </div>
                        <div className="font-mono text-[10px] text-gray-500 truncate mt-0.5">
                          Prev: {b.prevHash}
                        </div>
                      </div>
                    );
                  })
                )}
              </div>

              {/* Inspected Block Details Drawer */}
              {inspectBlock && (
                <div className="bg-black/40 border border-white/10 rounded-2xl p-4 space-y-2 text-xs font-mono">
                  <div className="flex items-center justify-between border-b border-white/10 pb-2">
                    <span className="font-bold text-emerald-400">
                      Инспекция Block #{inspectBlock.index}
                    </span>
                    <span className="text-[10px] px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300">
                      AES-256-GCM
                    </span>
                  </div>
                  <div className="grid grid-cols-2 gap-2 text-[11px]">
                    <div>
                      <span className="text-gray-500 block">SHA-256 Hash:</span>
                      <span className="text-emerald-300 break-all">{inspectBlock.hash}</span>
                    </div>
                    <div>
                      <span className="text-gray-500 block">Предыдущий Hash:</span>
                      <span className="text-gray-400 break-all">{inspectBlock.prevHash}</span>
                    </div>
                    <div>
                      <span className="text-gray-500 block">IV (Init Vector):</span>
                      <span className="text-gray-300">{inspectBlock.iv}</span>
                    </div>
                    <div>
                      <span className="text-gray-500 block">Auth Tag / Sig:</span>
                      <span className="text-gray-300">{inspectBlock.authTag || inspectBlock.signature?.slice(0, 32) || "Verified"}</span>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* TAB 3: SETTINGS */}
          {activeTab === "settings" && (
            <div className="space-y-4 animate-fade-in">
              <div className="p-4 bg-[#151c27] rounded-2xl border border-white/5 flex items-center justify-between">
                <div>
                  <h4 className="text-sm font-semibold text-white">
                    Сквозное блокчейн-шифрование
                  </h4>
                  <p className="text-xs text-gray-400 mt-0.5">
                    Все исходящие текстовые сообщения, фото, видео, голосовые и стикеры автоматически шифруются ключом AES-256-GCM и записываются в блокчейн.
                  </p>
                </div>
                <button
                  onClick={() => {
                    const next = !isEncEnabled;
                    setIsEncEnabled(next);
                    setBlockchainEncryptionEnabled(next);
                    triggerHaptic("medium");
                  }}
                  className={`w-12 h-6 rounded-full transition-colors relative cursor-pointer shrink-0 ml-4 ${
                    isEncEnabled ? "bg-emerald-500" : "bg-gray-700"
                  }`}
                >
                  <div
                    className={`w-5 h-5 bg-white rounded-full transition-transform absolute top-0.5 left-0.5 ${
                      isEncEnabled ? "transform translate-x-6" : ""
                    }`}
                  />
                </button>
              </div>

              <div className="p-4 bg-[#151c27] rounded-2xl border border-white/5 flex items-center justify-between">
                <div>
                  <h4 className="text-sm font-semibold text-white flex items-center gap-1.5">
                    <span>Живой просмотр печати в реальном времени</span>
                    <span className="text-[9px] px-1.5 py-0.5 rounded bg-cyan-500/20 text-cyan-300 font-mono">
                      Nexus Live Keystrokes
                    </span>
                  </h4>
                  <p className="text-xs text-gray-400 mt-0.5">
                    Позволяет видеть то, что собеседник с клиентом Nexusgram печатает в строке ввода прямо сейчас до отправки.
                  </p>
                </div>
                <button
                  onClick={() => {
                    const next = !isKeystrokesEnabled;
                    setIsKeystrokesEnabled(next);
                    setLiveKeystrokesViewEnabled(next);
                    triggerHaptic("medium");
                  }}
                  className={`w-12 h-6 rounded-full transition-colors relative cursor-pointer shrink-0 ml-4 ${
                    isKeystrokesEnabled ? "bg-cyan-500" : "bg-gray-700"
                  }`}
                >
                  <div
                    className={`w-5 h-5 bg-white rounded-full transition-transform absolute top-0.5 left-0.5 ${
                      isKeystrokesEnabled ? "transform translate-x-6" : ""
                    }`}
                  />
                </button>
              </div>
            </div>
          )}

        </div>

        {/* Modal Footer */}
        <div className="p-4 border-t border-white/10 bg-[#0e141d] flex items-center justify-between">
          <div className="flex items-center gap-2 text-xs text-emerald-400 font-mono">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            <span>Nexus Protocol v2.4 • Active</span>
          </div>
          <button
            onClick={onClose}
            className="px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-xs shadow-lg shadow-emerald-600/20 transition-all cursor-pointer"
          >
            Готово
          </button>
        </div>
      </div>
    </div>
  );
};
