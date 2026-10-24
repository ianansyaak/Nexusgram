import React, { useState } from "react";
import { motion } from "motion/react";
import { X, Check, Search, FolderPlus, Trash2 } from "lucide-react";
import { triggerHaptic } from "../utils/haptics";

export interface CustomCategorySection {
  id: string;
  name: string;
  emoji: string;
  chatIds: string[];
}

interface CreateSectionModalProps {
  dialogs: any[];
  existingSection?: CustomCategorySection | null;
  onSave: (section: CustomCategorySection) => void;
  onDelete?: (id: string) => void;
  onClose: () => void;
}

const EMOJI_PRESETS = ["📁", "💼", "💎", "🚀", "💬", "🎮", "⭐️", "🔥", "📱", "📚", "🎵", "🍔", "⚡️", "❤️"];

export const CreateSectionModal: React.FC<CreateSectionModalProps> = ({
  dialogs,
  existingSection = null,
  onSave,
  onDelete,
  onClose,
}) => {
  const [name, setName] = useState(existingSection?.name || "");
  const [emoji, setEmoji] = useState(existingSection?.emoji || "📁");
  const [selectedIds, setSelectedIds] = useState<string[]>(existingSection?.chatIds || []);
  const [searchFilter, setSearchFilter] = useState("");

  const toggleChat = (id: string) => {
    triggerHaptic("light");
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  const handleSave = () => {
    if (!name.trim()) return;
    triggerHaptic("medium");
    const section: CustomCategorySection = {
      id: existingSection?.id || `section_${Date.now()}`,
      name: name.trim(),
      emoji,
      chatIds: selectedIds,
    };
    onSave(section);
    onClose();
  };

  const filteredDialogs = dialogs.filter((d) =>
    (d.name || "").toLowerCase().includes(searchFilter.toLowerCase())
  );

  return (
    <div className="fixed inset-0 z-[100060] flex items-center justify-center p-3 sm:p-4 bg-black/80 backdrop-blur-md animate-fade-in select-none">
      <motion.div
        initial={{ scale: 0.95, opacity: 0, y: 15 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        exit={{ scale: 0.95, opacity: 0, y: 15 }}
        transition={{ type: "spring", stiffness: 400, damping: 30 }}
        className="w-full max-w-lg bg-[#111722] border border-[#243144] rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[85vh]"
      >
        {/* Modal Header */}
        <div className="p-4 sm:p-5 border-b border-[#243144] bg-[#172230] flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-indigo-500/20 text-indigo-400 border border-indigo-500/30 flex items-center justify-center shrink-0">
              <FolderPlus className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white">
                {existingSection ? "Редактировать раздел" : "Создать новый раздел"}
              </h3>
              <p className="text-xs text-gray-400">
                Сгруппируйте выбранные чаты в отдельную вкладку
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-gray-400 hover:text-white rounded-xl hover:bg-white/10 transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-4 sm:p-5 space-y-4 overflow-y-auto flex-1 scrollbar-thin">
          {/* Section Name & Emoji */}
          <div className="space-y-2">
            <label className="text-xs font-semibold text-gray-300">Название раздела</label>
            <div className="flex items-center gap-2">
              <div className="relative">
                <span className="text-xl p-2.5 rounded-2xl bg-[#1b2737] border border-[#26374d] inline-block text-center w-12 h-12 flex items-center justify-center">
                  {emoji}
                </span>
              </div>
              <input
                type="text"
                placeholder="Например: Работа, Семья, Крипта..."
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="flex-1 bg-[#16202c] border border-[#26374d] rounded-2xl px-4 py-3 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
              />
            </div>

            {/* Emoji Presets */}
            <div className="flex flex-wrap gap-1.5 pt-1">
              {EMOJI_PRESETS.map((em) => (
                <button
                  key={em}
                  type="button"
                  onClick={() => {
                    setEmoji(em);
                    triggerHaptic("light");
                  }}
                  className={`w-8 h-8 rounded-xl flex items-center justify-center text-sm transition-transform active:scale-90 cursor-pointer ${
                    emoji === em
                      ? "bg-indigo-600 ring-2 ring-indigo-400"
                      : "bg-[#1b2737] hover:bg-[#253549] text-gray-300"
                  }`}
                >
                  {em}
                </button>
              ))}
            </div>
          </div>

          {/* Select Chats */}
          <div className="space-y-2 pt-2">
            <div className="flex items-center justify-between">
              <label className="text-xs font-semibold text-gray-300">
                Выберите чаты ({selectedIds.length} выбрано)
              </label>
              {selectedIds.length > 0 && (
                <button
                  type="button"
                  onClick={() => setSelectedIds([])}
                  className="text-xs text-indigo-400 hover:text-indigo-300"
                >
                  Сбросить выбор
                </button>
              )}
            </div>

            {/* Filter */}
            <div className="relative">
              <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
              <input
                type="text"
                placeholder="Поиск по чатам..."
                value={searchFilter}
                onChange={(e) => setSearchFilter(e.target.value)}
                className="w-full bg-[#16202c] border border-[#26374d] rounded-xl pl-9 pr-3 py-2 text-xs text-white placeholder-gray-500 focus:outline-none focus:border-indigo-500"
              />
            </div>

            {/* Chat List */}
            <div className="max-h-56 overflow-y-auto space-y-1 pr-1 scrollbar-thin">
              {filteredDialogs.length === 0 ? (
                <p className="text-xs text-gray-500 text-center py-4">Чаты не найдены</p>
              ) : (
                filteredDialogs.map((dialog) => {
                  const isChecked = selectedIds.includes(String(dialog.id));
                  return (
                    <div
                      key={dialog.id}
                      onClick={() => toggleChat(String(dialog.id))}
                      className={`flex items-center justify-between p-2.5 rounded-xl cursor-pointer transition-colors border ${
                        isChecked
                          ? "bg-indigo-600/15 border-indigo-500/40 text-white"
                          : "bg-[#16202c] border-transparent hover:bg-[#1b2737] text-gray-300"
                      }`}
                    >
                      <div className="flex items-center gap-2.5 min-w-0">
                        <div className="w-8 h-8 rounded-full bg-[#233346] flex items-center justify-center font-bold text-xs text-indigo-300 shrink-0">
                          {dialog.name?.slice(0, 1) || "💬"}
                        </div>
                        <span className="text-xs font-medium truncate">{dialog.name}</span>
                      </div>
                      <div
                        className={`w-5 h-5 rounded-md flex items-center justify-center border transition-all ${
                          isChecked
                            ? "bg-indigo-600 border-indigo-600 text-white"
                            : "border-gray-600 bg-transparent"
                        }`}
                      >
                        {isChecked && <Check className="w-3.5 h-3.5 stroke-[3]" />}
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="p-4 bg-[#172230] border-t border-[#243144] flex items-center justify-between">
          {existingSection && onDelete ? (
            <button
              type="button"
              onClick={() => {
                if (confirm(`Удалить раздел "${existingSection.name}"?`)) {
                  onDelete(existingSection.id);
                  onClose();
                }
              }}
              className="px-3 py-2 rounded-xl text-xs font-semibold text-rose-400 hover:bg-rose-500/10 transition-colors flex items-center gap-1.5 cursor-pointer"
            >
              <Trash2 className="w-4 h-4" />
              <span>Удалить</span>
            </button>
          ) : (
            <div />
          )}

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl text-xs font-semibold text-gray-400 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
            >
              Отмена
            </button>
            <button
              type="button"
              onClick={handleSave}
              disabled={!name.trim()}
              className="px-5 py-2 rounded-xl text-xs font-semibold bg-indigo-600 hover:bg-indigo-500 disabled:opacity-40 text-white shadow-md transition-all active:scale-95 cursor-pointer"
            >
              {existingSection ? "Сохранить" : "Создать раздел"}
            </button>
          </div>
        </div>
      </motion.div>
    </div>
  );
};
