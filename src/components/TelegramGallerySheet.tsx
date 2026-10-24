import React, { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import {
  X,
  Camera,
  Check,
  Send,
  Image as ImageIcon,
  FileText,
  MapPin,
  BarChart2,
  User,
  Music,
  ChevronDown,
  UploadCloud,
  Trash2,
} from "lucide-react";

interface TelegramGallerySheetProps {
  isOpen: boolean;
  onClose: () => void;
  onSendMedia: (files: File[], caption?: string) => void;
  chatName?: string;
}

interface GalleryItem {
  id: string;
  url: string;
  file?: File;
  name: string;
  isCamera?: boolean;
}

// No pre-filled or demo photos - only real device / uploaded media
const INITIAL_SAMPLE_PHOTOS: { id: string; url: string; name: string }[] = [];

export const TelegramGallerySheet: React.FC<TelegramGallerySheetProps> = ({
  isOpen,
  onClose,
  onSendMedia,
  chatName,
}) => {
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [caption, setCaption] = useState("");
  const [activeTab, setActiveTab] = useState<"gallery" | "location">("gallery");
  const [albumDropdownOpen, setAlbumDropdownOpen] = useState(false);
  const [selectedAlbum, setSelectedAlbum] = useState("Недавние");

  const [items, setItems] = useState<GalleryItem[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);
  const documentInputRef = useRef<HTMLInputElement>(null);

  // Initialize items from device photos + sample photos + uploaded items
  useEffect(() => {
    if (!isOpen) return;

    let isMounted = true;

    async function loadDevicePhotos() {
      // 1. Load cached user uploads
      let cachedUserPhotos: GalleryItem[] = [];
      try {
        const stored = localStorage.getItem("nexus_cached_gallery_photos");
        if (stored) {
          cachedUserPhotos = JSON.parse(stored);
        }
      } catch {}

      // 2. Fetch real media and photos from server storage (/api/device-photos)
      let serverDevicePhotos: GalleryItem[] = [];
      try {
        const res = await fetch("/api/device-photos");
        if (res.ok) {
          const data = await res.json();
          if (Array.isArray(data.photos)) {
            serverDevicePhotos = data.photos.map((p: any) => ({
              id: `device-${p.id}`,
              url: p.url,
              name: p.name,
            }));
          }
        }
      } catch (err) {
        console.warn("[Gallery] Failed to fetch device photos from server:", err);
      }

      if (!isMounted) return;

      const cameraItem: GalleryItem = {
        id: "camera-trigger",
        url: "",
        name: "Камера",
        isCamera: true,
      };

      // Combine: Camera -> User's real phone photos -> Server photos
      setItems([
        cameraItem,
        ...cachedUserPhotos,
        ...serverDevicePhotos,
      ]);
    }

    loadDevicePhotos();

    return () => {
      isMounted = false;
    };
  }, [isOpen]);

  const handleDeleteItem = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setItems((prev) => prev.filter((item) => item.id !== id));
    setSelectedIds((prev) => prev.filter((selectedId) => selectedId !== id));
    try {
      const stored = localStorage.getItem("nexus_cached_gallery_photos");
      if (stored) {
        const cached = JSON.parse(stored);
        if (Array.isArray(cached)) {
          const updated = cached.filter((c: any) => c.id !== id);
          localStorage.setItem("nexus_cached_gallery_photos", JSON.stringify(updated));
        }
      }
    } catch (err) {}
  };

  // Handle local file picking from phone storage
  const handleFilesAdded = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || e.target.files.length === 0) return;
    const newFiles = Array.from(e.target.files);

    const newItems: GalleryItem[] = newFiles.map((file, idx) => ({
      id: `local-${Date.now()}-${idx}`,
      url: URL.createObjectURL(file),
      file,
      name: file.name,
    }));

    // Cache lightweight metadata in localStorage
    try {
      const stored = localStorage.getItem("nexus_cached_gallery_photos");
      const currentCached: any[] = stored ? JSON.parse(stored) : [];
      const updatedCached = [
        ...newItems.map((item) => ({ id: item.id, url: item.url, name: item.name })),
        ...currentCached,
      ].slice(0, 30);
      localStorage.setItem("nexus_cached_gallery_photos", JSON.stringify(updatedCached));
    } catch {}

    setItems((prev) => {
      const camera = prev.find((i) => i.isCamera);
      const rest = prev.filter((i) => !i.isCamera);
      return [camera!, ...newItems, ...rest];
    });

    // Automatically select the newly added files
    setSelectedIds((prev) => [...prev, ...newItems.map((i) => i.id)]);
  };

  const toggleSelect = (id: string, e?: React.MouseEvent) => {
    e?.stopPropagation();
    setSelectedIds((prev) => {
      if (prev.includes(id)) {
        return prev.filter((i) => i !== id);
      } else {
        return [...prev, id];
      }
    });
  };

  const handleSend = async () => {
    if (selectedIds.length === 0) return;

    const filesToSend: File[] = [];

    for (const id of selectedIds) {
      const item = items.find((i) => i.id === id);
      if (!item) continue;

      if (item.file) {
        filesToSend.push(item.file);
      } else if (item.url) {
        // Convert sample image URL to a File blob
        try {
          const resp = await fetch(item.url);
          const blob = await resp.blob();
          const file = new File([blob], item.name || "photo.jpg", {
            type: blob.type || "image/jpeg",
          });
          filesToSend.push(file);
        } catch (err) {
          console.warn("Failed to fetch photo blob:", err);
        }
      }
    }

    if (filesToSend.length > 0) {
      onSendMedia(filesToSend, caption.trim() || undefined);
      setSelectedIds([]);
      setCaption("");
      onClose();
    }
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[150] flex flex-col justify-end">
        {/* Backdrop */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.1 }}
          onClick={onClose}
          className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        />

        {/* Bottom Sheet Modal */}
        <motion.div
          initial={{ y: "100%" }}
          animate={{ y: 0 }}
          exit={{ y: "100%" }}
          transition={{ type: "spring", stiffness: 450, damping: 35 }}
          className="relative w-full max-w-lg mx-auto bg-[#1c1c24] border-t border-white/10 rounded-t-[32px] shadow-2xl flex flex-col max-h-[85vh] overflow-hidden select-none z-10"
        >
          {/* Top Drag Indicator */}
          <div className="w-12 h-1.5 bg-gray-500/40 rounded-full mx-auto mt-3 mb-1" />

          {/* Header */}
          <div className="px-4 py-2 flex items-center justify-between border-b border-white/5">
            {/* Close Button */}
            <button
              onClick={onClose}
              className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 active:scale-95 text-gray-300 hover:text-white flex items-center justify-center transition-all cursor-pointer"
              title="Закрыть"
            >
              <X className="w-4 h-4" />
            </button>

            {/* Album Selector Title */}
            <div className="relative">
              <button
                onClick={() => setAlbumDropdownOpen(!albumDropdownOpen)}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-full hover:bg-white/10 text-white font-semibold text-sm transition-colors cursor-pointer"
              >
                <span>{selectedAlbum}</span>
                <ChevronDown className="w-3.5 h-3.5 text-gray-400" />
              </button>

              {albumDropdownOpen && (
                <div className="absolute top-full left-1/2 -translate-x-1/2 mt-1 w-44 bg-[#232330] border border-white/10 rounded-2xl shadow-2xl py-1 z-30 overflow-hidden">
                  {["Недавние", "Галерея", "Избранное", "Загрузки", "Снимки экрана"].map(
                    (album) => (
                      <button
                        key={album}
                        onClick={() => {
                          setSelectedAlbum(album);
                          setAlbumDropdownOpen(false);
                        }}
                        className={`w-full text-left px-4 py-2 text-xs transition-colors ${
                          selectedAlbum === album
                            ? "bg-[#2481cc] text-white font-semibold"
                            : "text-gray-300 hover:bg-white/5"
                        }`}
                      >
                        {album}
                      </button>
                    )
                  )}
                </div>
              )}
            </div>

            {/* Top Right Action: Device File Picker or Send */}
            {selectedIds.length > 0 ? (
              <button
                onClick={handleSend}
                className="px-3.5 py-1.5 bg-[#2481cc] hover:bg-[#288ddf] text-white font-semibold text-xs rounded-full flex items-center gap-1.5 shadow-md active:scale-95 transition-all cursor-pointer"
              >
                <span>Отправить</span>
                <span className="w-4 h-4 rounded-full bg-white text-[#2481cc] font-bold text-[10px] flex items-center justify-center">
                  {selectedIds.length}
                </span>
              </button>
            ) : (
              <button
                onClick={() => fileInputRef.current?.click()}
                className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 text-gray-300 hover:text-white flex items-center justify-center transition-colors cursor-pointer"
                title="Выбрать с устройства"
              >
                <UploadCloud className="w-4 h-4" />
              </button>
            )}
          </div>

          {/* Hidden File Inputs */}
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*,video/*"
            multiple
            className="hidden"
            onChange={handleFilesAdded}
          />
          <input
            ref={cameraInputRef}
            type="file"
            accept="image/*"
            capture="environment"
            className="hidden"
            onChange={handleFilesAdded}
          />
          <input
            ref={documentInputRef}
            type="file"
            multiple
            className="hidden"
            onChange={handleFilesAdded}
          />

          {/* Main Content Area */}
          <div className="flex-1 overflow-y-auto custom-scrollbar p-1.5">
            {activeTab === "gallery" && (
              <div className="grid grid-cols-3 gap-1">
                {/* One-tap Real Phone Photo Importer Banner */}
                <div 
                  onClick={() => fileInputRef.current?.click()}
                  className="col-span-3 p-2.5 mb-1.5 bg-gradient-to-r from-blue-600/25 via-cyan-600/20 to-indigo-600/25 hover:from-blue-600/35 hover:to-indigo-600/35 border border-cyan-500/30 rounded-xl flex items-center justify-between cursor-pointer transition-all active:scale-[0.99] shadow-sm"
                  title="Выбрать реальные фото из памяти телефона или компьютера"
                >
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-lg bg-[#2481cc] flex items-center justify-center text-white shrink-0 shadow-md">
                      <UploadCloud className="w-4 h-4" />
                    </div>
                    <div>
                      <div className="text-xs font-semibold text-white flex items-center gap-1.5">
                        <span>Подгрузить все фото с устройства</span>
                        <span className="text-[10px] bg-cyan-500/20 text-cyan-300 px-1.5 py-0.2 rounded font-normal">Галерея</span>
                      </div>
                      <div className="text-[10px] text-gray-300">
                        Выбрать оригинальные фотографии, скриншоты или видео из памяти
                      </div>
                    </div>
                  </div>
                  <span className="text-[11px] bg-cyan-500 hover:bg-cyan-400 text-black px-2.5 py-1 rounded-full font-bold shrink-0 transition-colors">
                    Выбрать
                  </span>
                </div>

                {items.map((item) => {
                  if (item.isCamera) {
                    return (
                      <div
                        key={item.id}
                        onClick={() => cameraInputRef.current?.click()}
                        className="aspect-square bg-[#121217] hover:bg-[#181822] active:scale-98 rounded-xl flex flex-col items-center justify-center gap-2 cursor-pointer border border-white/5 transition-all text-gray-400 hover:text-white group"
                      >
                        <div className="w-10 h-10 rounded-full bg-white/10 group-hover:bg-[#2481cc]/20 group-hover:text-[#2481cc] flex items-center justify-center transition-all">
                          <Camera className="w-5 h-5" />
                        </div>
                        <span className="text-[11px] font-medium">Камера</span>
                      </div>
                    );
                  }

                  const isSelected = selectedIds.includes(item.id);
                  const selectedIndex = selectedIds.indexOf(item.id) + 1;

                  return (
                    <div
                      key={item.id}
                      onClick={() => toggleSelect(item.id)}
                      className={`relative aspect-square rounded-xl overflow-hidden cursor-pointer group select-none bg-[#121217] ${
                        isSelected ? "ring-2 ring-[#2481cc]" : ""
                      }`}
                    >
                      {/* Image Thumbnail */}
                      <img
                        src={item.url}
                        alt={item.name}
                        className={`w-full h-full object-cover transition-transform duration-200 group-hover:scale-105 ${
                          isSelected ? "brightness-90 scale-95" : ""
                        }`}
                        loading="lazy"
                      />

                      {/* Top Right Telegram Selection Circle */}
                      <div
                        onClick={(e) => toggleSelect(item.id, e)}
                        className={`absolute top-2 right-2 w-6 h-6 rounded-full flex items-center justify-center font-bold text-xs transition-all shadow-md ${
                          isSelected
                            ? "bg-[#2481cc] text-white border-2 border-white scale-105"
                            : "bg-black/40 border-2 border-white/80 hover:border-white text-transparent group-hover:scale-110"
                        }`}
                      >
                        {isSelected ? selectedIndex : ""}
                      </div>

                      {/* Delete recent/uploaded photo button */}
                      <button
                        type="button"
                        onClick={(e) => handleDeleteItem(item.id, e)}
                        className="absolute bottom-2 left-2 p-1.5 bg-black/60 hover:bg-red-500/90 text-gray-300 hover:text-white rounded-full transition-all shadow-md active:scale-90 opacity-70 hover:opacity-100 z-10 cursor-pointer"
                        title="Удалить недавнее фото"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  );
                })}
              </div>
            )}

            {activeTab === "location" && (
              <div className="p-6 text-center space-y-4">
                <div className="w-16 h-16 rounded-full bg-emerald-500/10 text-emerald-400 flex items-center justify-center mx-auto">
                  <MapPin className="w-8 h-8" />
                </div>
                <div>
                  <h4 className="text-white font-semibold text-sm">
                    Геолокация
                  </h4>
                  <p className="text-gray-400 text-xs mt-1">
                    Отправить текущее местоположение или координаты
                  </p>
                </div>
                <button
                  onClick={() => {
                    navigator.geolocation?.getCurrentPosition((pos) => {
                      onSendMedia(
                        [],
                        `📍 Геопозиция: https://maps.google.com/?q=${pos.coords.latitude},${pos.coords.longitude}`
                      );
                      onClose();
                    });
                  }}
                  className="px-6 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-semibold shadow-lg cursor-pointer active:scale-95 transition-all"
                >
                  Поделиться геопозицией
                </button>
              </div>
            )}
          </div>

          {/* Caption Input & Send Bar if items selected */}
          {selectedIds.length > 0 && (
            <div className="p-2.5 bg-[#171720] border-t border-white/10 flex items-center gap-2">
              <input
                type="text"
                value={caption}
                onChange={(e) => setCaption(e.target.value)}
                placeholder="Добавить подпись..."
                className="flex-1 bg-black/30 border border-white/10 text-white text-xs rounded-xl px-3 py-2.5 focus:outline-none focus:border-[#2481cc] placeholder-gray-500"
                onKeyDown={(e) => {
                  if (e.key === "Enter") handleSend();
                }}
              />
              <button
                onClick={handleSend}
                className="p-2.5 bg-[#2481cc] hover:bg-[#288ddf] text-white rounded-xl active:scale-95 transition-all cursor-pointer shadow-md"
                title="Отправить"
              >
                <Send className="w-4 h-4" />
              </button>
            </div>
          )}

          {/* Bottom Tabs Dock: Only Gallery and Geolocation */}
          <div className="px-4 py-2 bg-[#121217] border-t border-white/5 flex items-center justify-around text-xs font-medium text-gray-400">
            <button
              onClick={() => setActiveTab("gallery")}
              className={`flex flex-col items-center gap-1 px-5 py-1.5 rounded-xl transition-all cursor-pointer ${
                activeTab === "gallery"
                  ? "bg-[#2481cc]/20 text-[#2481cc] font-semibold"
                  : "hover:text-gray-200"
              }`}
            >
              <div
                className={`p-1.5 rounded-lg ${
                  activeTab === "gallery"
                    ? "bg-[#2481cc] text-white"
                    : "bg-white/5 text-gray-400"
                }`}
              >
                <ImageIcon className="w-4 h-4" />
              </div>
              <span>Галерея</span>
            </button>

            <button
              onClick={() => setActiveTab("location")}
              className={`flex flex-col items-center gap-1 px-5 py-1.5 rounded-xl transition-all cursor-pointer ${
                activeTab === "location"
                  ? "bg-[#2481cc]/20 text-[#2481cc] font-semibold"
                  : "hover:text-gray-200"
              }`}
            >
              <div
                className={`p-1.5 rounded-lg ${
                  activeTab === "location"
                    ? "bg-[#2481cc] text-white"
                    : "bg-white/5 text-gray-400"
                }`}
              >
                <MapPin className="w-4 h-4" />
              </div>
              <span>Геолокация</span>
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
