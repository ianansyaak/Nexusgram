import React from "react";
import { motion, AnimatePresence } from "motion/react";
import { X, ShieldAlert, CheckCircle2, Search, Terminal, AlertTriangle, EyeOff, Radio, Cpu } from "lucide-react";
import { AyuGramScanResult } from "../utils/clientDetector";

interface AyuGramDetectionModalProps {
  isOpen: boolean;
  onClose: () => void;
  targetName: string;
  targetId: string;
  scanResult: AyuGramScanResult | null;
  loading: boolean;
  onRescan: () => void;
}

export const AyuGramDetectionModal: React.FC<AyuGramDetectionModalProps> = ({
  isOpen,
  onClose,
  targetName,
  targetId,
  scanResult,
  loading,
  onRescan,
}) => {
  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-md">
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 10 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 10 }}
          className="relative w-full max-w-lg bg-[#12141c] border border-purple-500/30 rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]"
        >
          {/* Header */}
          <div className="p-5 border-b border-purple-500/20 bg-gradient-to-r from-purple-950/40 via-indigo-950/30 to-[#12141c] flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-2xl bg-purple-600/20 text-purple-300 border border-purple-500/40">
                <Search className="w-5 h-5 animate-pulse" />
              </div>
              <div>
                <h3 className="text-base font-bold text-white flex items-center gap-2">
                  <span>Детектор клиента AyuGram</span>
                  <span className="text-[10px] px-2 py-0.5 rounded-full bg-purple-500/20 text-purple-300 font-mono">
                    Ghost Mode Scanner
                  </span>
                </h3>
                <p className="text-xs text-gray-400 mt-0.5">
                  Эвристический анализ сигнатур Telegram MTProto и активности пользователя
                </p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-2 text-gray-400 hover:text-white rounded-xl hover:bg-white/10 transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Body */}
          <div className="p-5 overflow-y-auto space-y-4 text-xs font-sans">
            {/* Target info */}
            <div className="p-3.5 rounded-2xl bg-black/30 border border-white/5 flex items-center justify-between">
              <div>
                <span className="text-[11px] text-gray-400 block">Цель проверки:</span>
                <span className="text-sm font-bold text-white">{targetName}</span>
                <span className="text-[10px] text-gray-500 font-mono block mt-0.5">ID: {targetId}</span>
              </div>
              <button
                onClick={onRescan}
                disabled={loading}
                className="px-3 py-1.5 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-semibold text-xs transition-colors cursor-pointer flex items-center gap-1.5 disabled:opacity-50"
              >
                <Radio className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
                <span>{loading ? "Анализ..." : "Повторить"}</span>
              </button>
            </div>

            {loading ? (
              <div className="py-12 flex flex-col items-center justify-center gap-3">
                <div className="w-10 h-10 border-3 border-purple-500/30 border-t-purple-400 rounded-full animate-spin" />
                <p className="text-xs text-purple-300 font-mono animate-pulse">
                  Сканирование пакетов активности и скрытого статуса...
                </p>
                <p className="text-[10px] text-gray-500 max-w-xs text-center">
                  Проверяются паттерны Ghost Mode, скрытое чтение сообщений и эвристические маркеры AyuGram
                </p>
              </div>
            ) : scanResult ? (
              <>
                {/* Result verdict */}
                <div className={`p-4 rounded-2xl border flex items-start gap-3.5 ${
                  scanResult.isAyuGram
                    ? 'bg-purple-950/40 border-purple-500/50 text-purple-200 shadow-[0_0_20px_rgba(168,85,247,0.2)]'
                    : 'bg-emerald-950/30 border-emerald-500/30 text-emerald-200'
                }`}>
                  {scanResult.isAyuGram ? (
                    <ShieldAlert className="w-6 h-6 text-purple-400 shrink-0 mt-0.5 animate-bounce" />
                  ) : (
                    <CheckCircle2 className="w-6 h-6 text-emerald-400 shrink-0 mt-0.5" />
                  )}
                  <div className="flex-1">
                    <div className="flex items-center justify-between mb-1">
                      <h4 className="text-sm font-bold text-white">
                        {scanResult.isAyuGram ? "⚠️ ОБНАРУЖЕН КЛИЕНТ AYUGRAM!" : "Обычный официальный клиент"}
                      </h4>
                      <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded bg-black/40 border border-white/10">
                        Точность: {scanResult.confidence}%
                      </span>
                    </div>
                    <p className="text-xs text-gray-300 leading-relaxed">
                      {scanResult.isAyuGram
                        ? "Пользователь использует форк AyuGram Desktop / AyuGram Android с активными функциями скрытности (Ghost Mode) или сохранением удалённых сообщений."
                        : "Паттернов модифицированного клиента AyuGram не выявлено. Пользователь использует официальный Telegram или стандартный клиент."}
                    </p>
                  </div>
                </div>

                {/* Analysis Reasons */}
                <div className="space-y-2">
                  <span className="text-[11px] font-bold text-gray-400 uppercase tracking-wider block">
                    Выявленные маркеры и сигнатуры ({scanResult.reasons.length}):
                  </span>
                  <div className="space-y-1.5">
                    {scanResult.reasons.map((reason, idx) => (
                      <div
                        key={idx}
                        className="p-2.5 rounded-xl bg-black/40 border border-white/5 flex items-start gap-2 text-gray-300"
                      >
                        <span className="text-purple-400 font-mono shrink-0">[{idx + 1}]</span>
                        <span className="leading-snug">{reason}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Technical Forensics Box */}
                <div className="p-3.5 rounded-2xl bg-black/60 border border-purple-500/20 font-mono text-[10px] text-gray-400 space-y-1.5">
                  <div className="flex items-center gap-1.5 text-purple-300 font-bold">
                    <Terminal className="w-3.5 h-3.5" />
                    <span>AyuGram Forensics Heuristics:</span>
                  </div>
                  <p>• Ghost Mode detection: message delivery vs user status timestamp parity</p>
                  <p>• Read receipt suppression (messages delivered without read update mark)</p>
                  <p>• Bio & username signatures: ayugram.cc, radolyn, ayu desktop fingerprints</p>
                  <p>• Anti-Recall cache signature detection</p>
                </div>
              </>
            ) : null}
          </div>

          {/* Footer */}
          <div className="p-4 border-t border-purple-500/20 bg-[#0d0f17] flex justify-end">
            <button
              onClick={onClose}
              className="px-5 py-2 rounded-xl bg-[#242f3d] hover:bg-[#2e3b4d] text-white font-semibold text-xs transition-colors cursor-pointer"
            >
              Закрыть
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
