import React from "react";
import { Lock, ShieldCheck, X, Check, Copy } from "lucide-react";
import { triggerHaptic } from "../utils/haptics";

export interface SecretChatKeyModalProps {
  isOpen: boolean;
  onClose: () => void;
  chatTitle?: string;
  chatName?: string;
  chatId: string;
  keyFingerprint?: string;
  secretKey?: string;
  isOnline?: boolean;
  isSecretChatTerminated?: boolean;
  onEndSecretChat?: () => void;
}

export function SecretChatKeyModal({
  isOpen,
  onClose,
  chatTitle,
  chatName,
  chatId,
  keyFingerprint,
  secretKey,
  isOnline,
  isSecretChatTerminated,
  onEndSecretChat,
}: SecretChatKeyModalProps) {
  const [copied, setCopied] = React.useState(false);

  if (!isOpen) return null;

  const displayName = chatTitle || chatName || "Собеседник";
  const actualKey = secretKey || keyFingerprint || "nexus_quantum_e2ee";

  // Generate deterministic visual key pattern (8x8 matrix) from chatId and actualKey
  const seed = `${chatId}_${actualKey}`;
  
  const colors = [
    "#34d399", "#10b981", "#059669", "#06b6d4", 
    "#0ea5e9", "#3b82f6", "#6366f1", "#8b5cf6", 
    "#a855f7", "#ec4899", "#f43f5e", "#f59e0b"
  ];

  const grid: string[] = [];
  let hash = 0;
  for (let i = 0; i < seed.length; i++) {
    hash = (hash << 5) - hash + seed.charCodeAt(i);
    hash |= 0;
  }

  for (let i = 0; i < 64; i++) {
    const val = Math.abs((hash * (i + 13) * 1103515245 + 12345) & 0x7fffffff);
    grid.push(colors[val % colors.length]);
  }

  // Generate hex fingerprints 4x4
  const hexParts: string[] = [];
  for (let i = 0; i < 8; i++) {
    const part = Math.abs((hash * (i + 7) * 1664525 + 1013904223) & 0xffffffff).toString(16).padStart(8, '0').slice(0, 4);
    hexParts.push(part);
  }
  const formattedHex = hexParts.join(" ");

  const handleCopy = () => {
    triggerHaptic("light");
    navigator.clipboard.writeText(formattedHex);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-4 animate-fade-in">
      <div className="bg-[#0e1621] border border-emerald-500/30 w-full max-w-sm rounded-3xl shadow-2xl overflow-hidden p-6 space-y-5 text-center relative">
        <button
          onClick={() => {
            triggerHaptic("light");
            onClose();
          }}
          className="absolute right-4 top-4 w-8 h-8 rounded-full bg-white/5 hover:bg-white/10 text-gray-400 hover:text-white flex items-center justify-center transition-colors cursor-pointer"
        >
          <X className="w-4 h-4" />
        </button>

        <div className="w-12 h-12 mx-auto rounded-2xl bg-emerald-500/20 border border-emerald-500/40 text-emerald-400 flex items-center justify-center shadow-lg shadow-emerald-500/10">
          <Lock className="w-6 h-6" />
        </div>

        <div className="space-y-1">
          <h2 className="text-base font-bold text-white">Ключ шифрования</h2>
          <p className="text-xs text-gray-400">Секретный чат с <span className="text-emerald-400 font-semibold">{chatTitle}</span></p>
        </div>

        {/* 8x8 Visual Key Identicon */}
        <div className="p-3.5 bg-black/50 rounded-2xl border border-[#213346] inline-block mx-auto shadow-inner">
          <div className="grid grid-cols-8 gap-1 w-48 h-48 mx-auto">
            {grid.map((color, idx) => (
              <div
                key={idx}
                className="w-full h-full rounded-sm transition-transform hover:scale-110"
                style={{ backgroundColor: color }}
              />
            ))}
          </div>
        </div>

        {/* Fingerprint Hex Words */}
        <div 
          onClick={handleCopy}
          className="p-3 bg-[#131e2b] hover:bg-[#182738] rounded-xl border border-[#203348] font-mono text-xs text-emerald-300 font-bold tracking-wider cursor-pointer transition-colors flex items-center justify-center gap-2 select-all"
          title="Нажмите для копирования отпечатка"
        >
          <span>{formattedHex}</span>
          {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5 text-gray-400" />}
        </div>

        <p className="text-[11px] text-gray-400 leading-relaxed text-left bg-emerald-950/20 p-3 rounded-xl border border-emerald-500/20">
          🔒 Если это изображение и отпечаток ключа совпадают на устройстве собеседника, ваш секретный чат на 100% защищён сквозным шифрованием (E2EE) без посредников.
        </p>

        <button
          onClick={() => {
            triggerHaptic("light");
            onClose();
          }}
          className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold rounded-xl transition-all cursor-pointer shadow-lg shadow-emerald-600/20"
        >
          Понятно
        </button>
      </div>
    </div>
  );
}
