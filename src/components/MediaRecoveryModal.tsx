import React, { useState, useEffect } from "react";
import { X, Download, RefreshCw, CheckCircle2, AlertCircle, Trash2, FileText, Image, Mic, Video, ArrowDown } from "lucide-react";
import { mediaSync, MediaSyncState, PendingMediaItem } from "../utils/mediaSyncManager";

interface MediaRecoveryModalProps {
  onClose: () => void;
}

export const MediaRecoveryModal: React.FC<MediaRecoveryModalProps> = ({ onClose }) => {
  const [state, setState] = useState<MediaSyncState>(mediaSync.getState());

  useEffect(() => {
    return mediaSync.subscribe(setState);
  }, []);

  const formatBytes = (bytes: number) => {
    if (!bytes || bytes === 0) return "0 B";
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
  };

  const getMediaIcon = (type: string) => {
    switch (type) {
      case "photo": return <Image className="w-4 h-4 text-emerald-400" />;
      case "voice": return <Mic className="w-4 h-4 text-sky-400" />;
      case "video": return <Video className="w-4 h-4 text-purple-400" />;
      default: return <FileText className="w-4 h-4 text-amber-400" />;
    }
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-3 animate-fade-in">
      <div className="bg-[#17212b] border border-[#242f3d] rounded-2xl w-full max-w-md shadow-2xl overflow-hidden flex flex-col max-h-[85vh]">
        {/* Header */}
        <div className="p-4 border-b border-[#242f3d] flex items-center justify-between bg-[#111922]">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-[#2481cc]/20 border border-[#2481cc]/40 flex items-center justify-center text-[#2481cc]">
              <ArrowDown className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-semibold text-white text-sm">Загрузка данных и медиа</h3>
              <p className="text-[11px] text-gray-400">
                {state.pendingCount > 0
                  ? `Осталось загрузить: ${state.pendingCount} (загружено ${state.progressPercent}%)`
                  : "Все медиа успешно загружены"}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-gray-400 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Global Progress Bar */}
        <div className="px-4 py-3 bg-black/20 border-b border-[#242f3d]">
          <div className="flex items-center justify-between text-xs mb-1.5">
            <span className="text-gray-300 font-medium">Общий прогресс</span>
            <span className="text-sky-400 font-mono font-bold">
              {formatBytes(state.loadedBytes)} / {formatBytes(state.totalBytes)} ({state.progressPercent}%)
            </span>
          </div>
          <div className="w-full h-2 bg-black/40 rounded-full overflow-hidden">
            <div 
              className="h-full bg-gradient-to-r from-[#2481cc] to-sky-400 transition-all duration-300"
              style={{ width: `${state.progressPercent}%` }}
            />
          </div>
          <p className="text-[10px] text-gray-400 mt-1.5">
            Файлы, которые не успели загрузиться до закрытия приложения, автоматически восстанавливаются в кэш.
          </p>
        </div>

        {/* Items List */}
        <div className="p-4 overflow-y-auto flex-1 space-y-2.5 divide-y divide-white/5">
          {state.items.length === 0 ? (
            <div className="py-8 text-center text-gray-400 text-xs space-y-2">
              <CheckCircle2 className="w-10 h-10 mx-auto text-emerald-400 opacity-80" />
              <p className="font-medium text-gray-300">Очередь загрузки пуста</p>
              <p className="text-[11px]">Все медиафайлы и сообщения полностью синхронизированы с устройством.</p>
            </div>
          ) : (
            state.items.map((item) => (
              <div key={item.id} className="pt-2.5 first:pt-0 flex items-center justify-between gap-3 text-xs">
                <div className="flex items-center gap-2.5 min-w-0">
                  <div className="w-8 h-8 rounded-lg bg-black/30 border border-white/5 flex items-center justify-center shrink-0">
                    {getMediaIcon(item.type)}
                  </div>
                  <div className="min-w-0">
                    <p className="text-white font-medium truncate">{item.name}</p>
                    <p className="text-[10px] text-gray-400 font-mono">
                      {item.status === "downloading" ? (
                        <span className="text-sky-400">
                          Загрузка: {formatBytes(item.loadedBytes)} / {formatBytes(item.totalBytes)}
                        </span>
                      ) : item.status === "completed" ? (
                        <span className="text-emerald-400">✓ Загружено ({formatBytes(item.totalBytes)})</span>
                      ) : item.status === "failed" ? (
                        <span className="text-rose-400">Ошибка: {item.error || "Прервано"}</span>
                      ) : (
                        <span className="text-gray-400">Ожидание очереди...</span>
                      )}
                    </p>
                  </div>
                </div>

                <div className="shrink-0 flex items-center gap-2">
                  {item.status === "downloading" && (
                    <div className="w-4 h-4 border-2 border-sky-400 border-t-transparent rounded-full animate-spin" />
                  )}
                  {item.status === "completed" && (
                    <span className="text-emerald-400 text-xs">Готово</span>
                  )}
                  {item.status === "failed" && (
                    <button
                      onClick={() => mediaSync.retryFailed()}
                      className="p-1 text-sky-400 hover:text-sky-300 rounded cursor-pointer"
                      title="Повторить"
                    >
                      <RefreshCw className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              </div>
            ))
          )}
        </div>

        {/* Footer Actions */}
        <div className="p-3 border-t border-[#242f3d] bg-[#111922] flex items-center justify-between gap-2">
          {state.failedCount > 0 && (
            <button
              onClick={() => mediaSync.retryFailed()}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-sky-600/20 hover:bg-sky-600/30 border border-sky-500/30 text-sky-300 text-xs rounded-xl transition-all cursor-pointer"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              Повторить сбои ({state.failedCount})
            </button>
          )}

          <div className="ml-auto flex items-center gap-2">
            {state.items.some(i => i.status === "completed") && (
              <button
                onClick={() => mediaSync.clearCompleted()}
                className="px-3 py-1.5 text-gray-400 hover:text-gray-200 text-xs transition-colors cursor-pointer"
              >
                Очистить готовые
              </button>
            )}
            <button
              onClick={onClose}
              className="px-4 py-1.5 bg-[#2481cc] hover:bg-[#288ddf] text-white text-xs font-semibold rounded-xl transition-all shadow cursor-pointer"
            >
              Закрыть
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
