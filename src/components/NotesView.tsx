import React, { useState, useEffect, useRef } from "react";
import { ArrowLeft, Trash2, ImagePlus, Check, Loader2, FileText, X } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { useI18n } from "../utils/i18n";

export interface NoteData {
  id: string;
  title: string;
  content: string;
  images: string[];
  createdAt: number;
  updatedAt: number;
}

interface NotesViewProps {
  noteId: string;
  onBack: () => void;
  onDeleteNote?: (id: string) => void;
  onNoteUpdated?: (note: NoteData) => void;
}

export function NotesView({ noteId, onBack, onDeleteNote, onNoteUpdated }: NotesViewProps) {
  const { strings } = useI18n();
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [images, setImages] = useState<string[]>([]);
  const [isSaving, setIsSaving] = useState(false);
  const [saveStatus, setSaveStatus] = useState<"saved" | "saving" | "idle">("idle");
  const [isLoading, setIsLoading] = useState(true);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const saveTimeoutRef = useRef<any>(null);
  const isInitialMount = useRef(true);

  // Swipe-to-back state
  const [touchStart, setTouchStart] = useState<number | null>(null);
  const [touchDelta, setTouchDelta] = useState(0);

  // Load note from server
  useEffect(() => {
    let isMounted = true;
    setIsLoading(true);

    fetch("/api/notes")
      .then((res) => res.json())
      .then((data) => {
        if (!isMounted) return;
        if (data.success && Array.isArray(data.notes)) {
          const found = data.notes.find((n: NoteData) => n.id === noteId);
          if (found) {
            setTitle(found.title || "");
            setContent(found.content || "");
            setImages(found.images || []);
          } else {
            // New note initialization
            const newTitle = "";
            setTitle(newTitle);
            setContent("");
            setImages([]);
          }
        }
      })
      .catch((err) => console.error("Error loading note:", err))
      .finally(() => {
        if (isMounted) {
          setIsLoading(false);
          isInitialMount.current = false;
        }
      });

    return () => {
      isMounted = false;
    };
  }, [noteId]);

  // Debounced auto-save function
  const saveNoteToServer = (newTitle: string, newContent: string, newImages: string[]) => {
    if (isInitialMount.current) return;
    setIsSaving(true);
    setSaveStatus("saving");

    // Dynamic title: if title is empty, derive from the first words of content
    const effectiveTitle =
      newTitle.trim() ||
      (newContent.trim() ? newContent.trim().slice(0, 45).split("\n")[0] : strings.newNote || "Новая заметка");

    fetch("/api/notes", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        id: noteId,
        title: effectiveTitle,
        content: newContent,
        images: newImages,
      }),
    })
      .then((res) => res.json())
      .then((data) => {
        if (data.success && data.note) {
          setSaveStatus("saved");
          if (onNoteUpdated) onNoteUpdated(data.note);
        }
      })
      .catch((err) => {
        console.error("Failed to auto-save note:", err);
        setSaveStatus("idle");
      })
      .finally(() => {
        setIsSaving(false);
      });
  };

  const handleTitleChange = (val: string) => {
    setTitle(val);
    if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current);
    saveTimeoutRef.current = setTimeout(() => {
      saveNoteToServer(val, content, images);
    }, 600);
  };

  const handleContentChange = (val: string) => {
    setContent(val);
    if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current);
    saveTimeoutRef.current = setTimeout(() => {
      saveNoteToServer(title, val, images);
    }, 600);
  };

  // Image Upload handler
  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      const formData = new FormData();
      formData.append("image", file);

      try {
        setIsSaving(true);
        const res = await fetch("/api/notes/upload-image", {
          method: "POST",
          body: formData,
        });
        const data = await res.json();
        if (data.success && data.url) {
          const updatedImages = [...images, data.url];
          setImages(updatedImages);
          saveNoteToServer(title, content, updatedImages);
        }
      } catch (err) {
        console.error("Failed to upload note image:", err);
      } finally {
        setIsSaving(false);
      }
    }
  };

  const removeImage = (indexToRemove: number) => {
    const updated = images.filter((_, idx) => idx !== indexToRemove);
    setImages(updated);
    saveNoteToServer(title, content, updated);
  };

  const handleDelete = () => {
    if (window.confirm(strings.deleteNoteConfirm || "Удалить эту заметку?")) {
      fetch(`/api/notes/${noteId}`, { method: "DELETE" })
        .then(() => {
          if (onDeleteNote) onDeleteNote(noteId);
          onBack();
        })
        .catch((err) => console.error("Failed to delete note:", err));
    }
  };

  // Touch handlers for swipe-to-back
  const handleTouchStart = (e: React.TouchEvent) => {
    setTouchStart(e.touches[0].clientX);
    setTouchDelta(0);
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (touchStart === null) return;
    const currentX = e.touches[0].clientX;
    const diff = currentX - touchStart;
    if (diff > 0) {
      setTouchDelta(diff);
    }
  };

  const handleTouchEnd = () => {
    if (touchDelta > 90) {
      onBack();
    }
    setTouchStart(null);
    setTouchDelta(0);
  };

  const displayHeaderTitle =
    title.trim() ||
    (content.trim() ? content.trim().slice(0, 35).split("\n")[0] : strings.newNote || "Заметка");

  return (
    <motion.div
      id="nexus-notes-view"
      className="flex flex-col h-full w-full bg-[#0e1621] text-gray-100 overflow-hidden select-text relative will-change-transform"
      style={{
        transform: touchDelta > 0 ? `translateX(${touchDelta}px)` : undefined,
        transition: touchStart === null ? "transform 0.25s cubic-bezier(0.16, 1, 0.3, 1)" : "none",
      }}
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
    >
      {/* Top Header: Simple and elegant without profile clutter or input fields */}
      <div className="h-16 shrink-0 border-b border-[#1c242f] bg-[#17212b]/90 backdrop-blur-md flex items-center justify-between px-4 sm:px-6 z-10">
        <div className="flex items-center gap-3 min-w-0">
          <button
            onClick={onBack}
            className="p-2 -ml-2 text-gray-400 hover:text-white rounded-xl hover:bg-white/5 active:scale-95 transition-all cursor-pointer"
            title={strings.back || "Назад"}
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div className="w-9 h-9 rounded-xl bg-amber-500/15 border border-amber-500/30 flex items-center justify-center text-amber-400 shrink-0">
            <FileText className="w-5 h-5" />
          </div>
          <div className="flex flex-col min-w-0">
            <h1 className="font-semibold text-sm sm:text-base text-gray-100 truncate max-w-[200px] sm:max-w-md">
              {displayHeaderTitle}
            </h1>
            <div className="flex items-center gap-1.5 text-[11px] text-gray-400">
              {saveStatus === "saving" || isSaving ? (
                <span className="flex items-center gap-1 text-indigo-400 font-medium animate-pulse">
                  <Loader2 className="w-3 h-3 animate-spin" />
                  {strings.noteSaving || "Сохранение..."}
                </span>
              ) : saveStatus === "saved" ? (
                <span className="flex items-center gap-1 text-emerald-400">
                  <Check className="w-3 h-3" />
                  {strings.noteSaved || "Сохранено в файл"}
                </span>
              ) : (
                <span>{strings.notesFileSaved || "Nexus Vault Storage"}</span>
              )}
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="flex items-center gap-1.5 px-3 py-2 text-xs font-medium bg-[#2481cc]/15 text-[#2481cc] hover:bg-[#2481cc]/25 rounded-xl border border-[#2481cc]/30 transition-all active:scale-95 cursor-pointer"
            title={strings.addPhoto || "Добавить фото"}
          >
            <ImagePlus className="w-4 h-4" />
            <span className="hidden sm:inline">{strings.addPhoto || "Фото"}</span>
          </button>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            multiple
            className="hidden"
            onChange={handleImageUpload}
          />

          <button
            type="button"
            onClick={handleDelete}
            className="p-2 text-gray-400 hover:text-red-400 hover:bg-red-500/10 rounded-xl transition-all active:scale-95 cursor-pointer"
            title={strings.delete || "Удалить"}
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Main Content Page - pure writing canvas without profiles or bottom input bar */}
      <div className="flex-1 overflow-y-auto px-4 sm:px-8 py-6 max-w-4xl mx-auto w-full custom-scrollbar space-y-5">
        {isLoading ? (
          <div className="h-64 flex flex-col items-center justify-center gap-3 text-gray-400">
            <Loader2 className="w-8 h-8 animate-spin text-indigo-500" />
            <span className="text-xs">Загрузка заметки...</span>
          </div>
        ) : (
          <>
            {/* Title Input */}
            <input
              type="text"
              value={title}
              onChange={(e) => handleTitleChange(e.target.value)}
              placeholder={strings.noteTitlePlaceholder || "Заголовок заметки..."}
              className="w-full bg-transparent text-xl sm:text-2xl font-bold text-white placeholder-gray-500 focus:outline-none border-b border-white/5 pb-2"
            />

            {/* Images Grid */}
            {images.length > 0 && (
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 pt-2">
                {images.map((imgUrl, index) => (
                  <div
                    key={index}
                    className="relative group aspect-video sm:aspect-square rounded-xl overflow-hidden bg-black/40 border border-white/10"
                  >
                    <img
                      src={imgUrl}
                      alt={`Note attachment ${index + 1}`}
                      className="w-full h-full object-cover cursor-pointer group-hover:scale-105 transition-transform duration-300"
                      onClick={() => setSelectedImage(imgUrl)}
                    />
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        removeImage(index);
                      }}
                      className="absolute top-1.5 right-1.5 p-1.5 bg-black/70 hover:bg-red-600 text-white rounded-lg opacity-0 group-hover:opacity-100 transition-all cursor-pointer shadow-md"
                      title="Удалить картинку"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))}
              </div>
            )}

            {/* Content Textarea */}
            <textarea
              value={content}
              onChange={(e) => handleContentChange(e.target.value)}
              placeholder={strings.noteContentPlaceholder || "Начните писать здесь или прикрепите изображение..."}
              className="w-full min-h-[450px] bg-transparent text-gray-200 text-base leading-relaxed placeholder-gray-600 focus:outline-none resize-none border-none py-2"
            />
          </>
        )}
      </div>

      {/* Full-screen Image Preview Modal */}
      <AnimatePresence>
        {selectedImage && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setSelectedImage(null)}
            className="fixed inset-0 z-50 bg-black/90 flex items-center justify-center p-4 backdrop-blur-sm cursor-zoom-out"
          >
            <img
              src={selectedImage}
              alt="Full preview"
              className="max-w-full max-h-full object-contain rounded-xl shadow-2xl"
            />
            <button
              onClick={() => setSelectedImage(null)}
              className="absolute top-6 right-6 p-2 rounded-full bg-black/60 text-white hover:bg-black/80 transition-colors"
            >
              <X className="w-6 h-6" />
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
