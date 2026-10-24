import React, { useEffect } from "react";
import { 
  Edit3, 
  Trash2
} from "lucide-react";
import { triggerHaptic } from "../utils/haptics";

export interface SectionInfo {
  id: string;
  name: string;
  emoji?: string;
  isCustom: boolean;
  chatCount: number;
  unreadCount?: number;
}

interface SectionActionModalProps {
  isOpen: boolean;
  onClose: () => void;
  section: SectionInfo | null;
  onEditSection: (sectionId: string) => void;
  onAddNewSection?: () => void;
  onDeleteSection: (sectionId: string) => void;
  onMoveSection?: (sectionId: string, direction: "left" | "right" | "first" | "last") => void;
  onOpenFoldersSettings?: () => void;
  onMarkAllAsRead?: (sectionId: string) => void;
  anchorPosition?: { x: number; y: number } | null;
}

export const SectionActionModal: React.FC<SectionActionModalProps> = ({
  isOpen,
  onClose,
  section,
  onEditSection,
  onDeleteSection,
  anchorPosition,
}) => {
  useEffect(() => {
    if (!isOpen) return;

    // If user begins dragging or moves their touch anywhere, close immediately!
    const handleMove = () => {
      onClose();
    };

    window.addEventListener("touchmove", handleMove, { passive: true });
    window.addEventListener("mousemove", handleMove, { passive: true });
    return () => {
      window.removeEventListener("touchmove", handleMove);
      window.removeEventListener("mousemove", handleMove);
    };
  }, [isOpen, onClose]);

  if (!isOpen || !section) return null;

  return (
    <div
      className="fixed inset-0 z-[100080] flex items-center justify-center p-3 bg-black/40 backdrop-blur-[2px] animate-fade-in select-none"
      onClick={onClose}
    >
      {/* Very compact popup - exactly matching the message reaction & action menu */}
      <div
        className="w-44 bg-[#18222d]/95 backdrop-blur-xl border border-white/10 rounded-2xl shadow-2xl p-1.5 flex flex-col gap-1 text-white animate-in zoom-in-95 duration-100 ring-1 ring-white/10"
        onClick={(e) => e.stopPropagation()}
        style={
          anchorPosition
            ? {
                position: "absolute",
                left: Math.min(window.innerWidth - 185, Math.max(10, anchorPosition.x - 70)),
                top: Math.min(window.innerHeight - 100, Math.max(50, anchorPosition.y + 10)),
              }
            : undefined
        }
      >
        {/* Edit item */}
        <button
          onClick={() => {
            triggerHaptic("light");
            onEditSection(section.id);
            onClose();
          }}
          className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-semibold text-gray-200 hover:text-white hover:bg-white/10 transition-colors cursor-pointer text-left"
        >
          <Edit3 className="w-4 h-4 text-sky-400 shrink-0" />
          <span>Изменить</span>
        </button>

        {/* Delete item */}
        <button
          onClick={() => {
            triggerHaptic("heavy");
            onDeleteSection(section.id);
            onClose();
          }}
          className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-semibold text-rose-400 hover:text-rose-300 hover:bg-rose-500/15 transition-colors cursor-pointer text-left"
        >
          <Trash2 className="w-4 h-4 text-rose-400 shrink-0" />
          <span>Удалить</span>
        </button>
      </div>
    </div>
  );
};
