import { motion, AnimatePresence } from "motion/react";
import { MessageSquare, Search, Settings, User, Bot, Archive, Pin, PinOff, X, Edit2, Upload, Loader2, Save, BellOff, Bell, Folder, FolderPlus, Plus, ChevronLeft, ChevronRight, ChevronDown, ArrowRight, Clock, Trash, Share2, Check, Copy, Key, LogOut, Menu, DownloadCloud, Image, Video, Mic, RefreshCw, RotateCcw, Sliders, CheckCircle2, Star, Zap, FileText, StickyNote, Sparkles, Eye, History, WifiOff, Globe, Filter, Radio, Users, ShieldCheck } from "lucide-react";
import { useState, useEffect, useRef, useCallback, useMemo } from "react";
import { io } from "socket.io-client";
import { SettingsModal } from "./SettingsModal";
import { ProxySettingsModal } from "./ProxySettingsModal";
import { mediaSync, formatBytes, MediaSyncState } from "../utils/mediaSyncManager";
import { triggerHaptic } from "../utils/haptics";
import { getOptimizedMediaUrl } from "../utils/ecoStream";
import { resetAllAppSettings, resetDesignSettings } from "../utils/resetSettings";
import { useI18n } from "../utils/i18n";
import { isUserNexusgramClient } from "../utils/nexusBlockchain";
import { MainProfileModal } from "./MainProfileModal";
import { UserStoriesModal, SAMPLE_STORIES } from "./UserStoriesModal";
import { CreateSectionModal, CustomCategorySection } from "./CreateSectionModal";
import { SectionActionModal, SectionInfo } from "./SectionActionModal";
import { CreateStoryModal, CreatedStoryData } from "./CreateStoryModal";
import { StoryContextModal } from "./StoryContextModal";


function ProfileDialog({ onClose }: { onClose: () => void }) {
  const [profile, setProfile] = useState<{ id: string, firstName: string, lastName: string, username: string, about: string } | null>(null);
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [about, setAbout] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [avatarBust, setAvatarBust] = useState(Date.now());
  const [hasVideo, setHasVideo] = useState(true);
  const [sessionStr, setSessionStr] = useState("");
  const [copiedSession, setCopiedSession] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);
  const [syncState, setSyncState] = useState<MediaSyncState>(mediaSync.getState());
  const [resetStatus, setResetStatus] = useState<string | null>(null);

  useEffect(() => {
    return mediaSync.subscribe(setSyncState);
  }, []);

  const handleResetDesign = () => {
    resetDesignSettings();
    setResetStatus("Дизайн и Liquid Glass сброшены!");
    setTimeout(() => setResetStatus(null), 3000);
  };

  const handleResetAll = () => {
    if (window.confirm("Сбросить все настройки оформления и приложения к исходным? (Ваша авторизация в Telegram сохранится)")) {
      resetAllAppSettings();
      setResetStatus("Все настройки успешно сброшены к исходным!");
      setTimeout(() => setResetStatus(null), 3500);
    }
  };

  const publicUrl = typeof window !== "undefined"
    ? window.location.origin
    : "";

  useEffect(() => {
    fetch('/api/telegram/me')
      .then(res => res.json())
      .then(data => {
        if (!data.error) {
          setProfile(data);
          setFirstName(data.firstName || "");
          setLastName(data.lastName || "");
          setAbout(data.about || "");
        }
        setLoading(false);
      })
      .catch(() => setLoading(false));

    fetch('/api/telegram/session')
      .then(res => res.json())
      .then(data => {
        if (data.session) {
          setSessionStr(data.session);
        } else {
          setSessionStr(localStorage.getItem("telegram_session") || "");
        }
      })
      .catch(() => {
        setSessionStr(localStorage.getItem("telegram_session") || "");
      });
  }, []);

  const handleCopyPublicUrl = async () => {
    try {
      await navigator.clipboard.writeText(publicUrl);
      setCopiedLink(true);
      setTimeout(() => setCopiedLink(false), 2000);
    } catch {
      prompt("Публичная ссылка:", publicUrl);
    }
  };

  const handleCopySession = async () => {
    if (!sessionStr) return;
    try {
      await navigator.clipboard.writeText(sessionStr);
      setCopiedSession(true);
      setTimeout(() => setCopiedSession(false), 2000);
    } catch {
      prompt("Строка сессии:", sessionStr);
    }
  };

  const handleLogout = async () => {
    if (confirm("Вы уверены, что хотите выйти из сессии Telegram?")) {
      try {
        await fetch('/api/telegram/session/clear', { method: 'POST' });
        localStorage.removeItem("telegram_session");
        window.location.reload();
      } catch (e) {
        console.error(e);
      }
    }
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      await fetch('/api/telegram/profile', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ firstName, lastName, about })
      });
      onClose();
    } catch (e) {
      console.error(e);
    }
    setSaving(false);
  };

  const handleAvatarChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const formData = new FormData();
    formData.append("file", file);
    setSaving(true);
    try {
      await fetch('/api/telegram/profile/avatar', {
        method: "POST",
        body: formData
      });
      // Force reload image & video state
      setAvatarBust(Date.now());
      setHasVideo(true);
      if (profile) setProfile({...profile});
    } catch(err) {
      console.error(err);
    }
    setSaving(false);
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4">
      <motion.div 
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="w-full max-w-md max-h-[88vh] flex flex-col bg-[#111116] border border-[#2a2a38] rounded-2xl shadow-2xl relative overflow-hidden"
      >
        <div className="shrink-0 flex justify-between items-center px-5 py-4 border-b border-[#2a2a38] bg-[#15151e]/95 backdrop-blur-md">
          <div className="flex items-center gap-2">
            <User className="w-5 h-5 text-blue-400" />
            <div>
              <h2 className="text-white font-semibold text-sm">Мой Профиль Telegram</h2>
              {profile?.username && (
                <p className="text-[11px] text-blue-400 font-mono">@{profile.username}</p>
              )}
            </div>
          </div>
          <button onClick={onClose} className="p-1 rounded-lg text-gray-400 hover:text-white hover:bg-white/5 transition-colors cursor-pointer">
            <X className="w-5 h-5" />
          </button>
        </div>

        {loading ? (
          <div className="p-12 flex flex-col items-center justify-center gap-3">
            <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
            <span className="text-xs text-gray-400">Загрузка данных профиля...</span>
          </div>
        ) : (
          <>
            <div className="flex-1 overflow-y-auto px-5 py-4 space-y-4 custom-scrollbar">
              {resetStatus && (
                <div className="p-2.5 bg-emerald-500/15 border border-emerald-500/30 rounded-xl text-xs text-emerald-300 flex items-center gap-2 animate-fade-in">
                  <Check className="w-4 h-4 text-emerald-400 shrink-0" />
                  <span>{resetStatus}</span>
                </div>
              )}

              <div className="flex justify-center relative w-32 h-32 mx-auto">
                <div className="w-32 h-32 rounded-full overflow-hidden bg-gray-600 border-2 border-blue-500/30 relative shadow-xl">
                  <div className="absolute inset-0 flex items-center justify-center bg-gray-500">
                    <svg viewBox="0 0 100 100" className="w-full h-full text-gray-700 fill-current">
                      <circle cx="50" cy="35" r="20" />
                      <path d="M 20 100 A 30 30 0 0 1 80 100" strokeWidth="10" stroke="currentColor" fill="none"/>
                    </svg>
                  </div>
                  {profile && profile.id && (
                    <>
                      {hasVideo && (
                        <video
                          src={`/api/telegram/avatar-video/${profile.id}?t=${avatarBust}`}
                          autoPlay
                          loop
                          muted
                          playsInline
                          className="w-full h-full object-cover absolute inset-0 z-10"
                          onError={() => setHasVideo(false)}
                        />
                      )}
                      <img 
                        src={`/api/telegram/avatar/${profile.id}?t=${avatarBust}`} 
                        alt="avatar" 
                        className="w-full h-full object-cover absolute inset-0 z-0" 
                        onError={e => e.currentTarget.style.display='none'} 
                      />
                    </>
                  )}
                </div>
                <label className="absolute bottom-0 right-0 w-9 h-9 bg-blue-600 hover:bg-blue-500 rounded-full flex items-center justify-center cursor-pointer shadow-lg border-2 border-[#111116] z-10 hover:scale-105 transition-transform" title="Change Avatar">
                  <Edit2 className="w-4 h-4 text-white" />
                  <input type="file" accept="image/*,video/*" className="hidden" onChange={handleAvatarChange} />
                </label>
              </div>

              <div className="space-y-3">
                <div>
                  <label className="text-xs text-gray-400 mb-1 block">First Name</label>
                  <input type="text" value={firstName} onChange={e => setFirstName(e.target.value)} className="w-full bg-[#1a1a24] border border-[#2a2a38] rounded-lg px-3 py-2 text-white text-sm outline-none focus:border-blue-500/50" />
                </div>
                <div>
                  <label className="text-xs text-gray-400 mb-1 block">Last Name</label>
                  <input type="text" value={lastName} onChange={e => setLastName(e.target.value)} className="w-full bg-[#1a1a24] border border-[#2a2a38] rounded-lg px-3 py-2 text-white text-sm outline-none focus:border-blue-500/50" />
                </div>
                <div>
                  <label className="text-xs text-gray-400 mb-1 block">Bio / About</label>
                  <textarea value={about} onChange={e => setAbout(e.target.value)} className="w-full bg-[#1a1a24] border border-[#2a2a38] rounded-lg px-3 py-2 text-white text-sm outline-none focus:border-blue-500/50 resize-none h-20" />
                </div>
              </div>

              {/* Public Link Card */}
              <div className="bg-[#151520] border border-indigo-500/20 rounded-xl p-3 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-indigo-400 flex items-center gap-1.5">
                    <Share2 className="w-3.5 h-3.5" /> Публичная ссылка
                  </span>
                  <button
                    type="button"
                    onClick={handleCopyPublicUrl}
                    className="px-2.5 py-1 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-[11px] font-medium flex items-center gap-1 transition-all cursor-pointer shadow"
                  >
                    {copiedLink ? <><Check className="w-3 h-3 text-emerald-300" /> Скопировано</> : <><Copy className="w-3 h-3" /> Копировать</>}
                  </button>
                </div>
                <p className="text-[10px] text-gray-400 font-mono break-all bg-black/30 p-1.5 rounded-lg select-all border border-white/5">
                  {publicUrl}
                </p>
              </div>

              {/* Session Autosave Info */}
              <div className="bg-[#151520] border border-emerald-500/20 rounded-xl p-3 space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                    <span className="text-xs font-semibold text-emerald-400 flex items-center gap-1">
                      <Key className="w-3.5 h-3.5" /> Автосохранение сессии
                    </span>
                  </div>
                  {sessionStr && (
                    <button
                      type="button"
                      onClick={handleCopySession}
                      className="px-2.5 py-1 bg-[#222230] hover:bg-[#2a2a3c] text-gray-300 hover:text-white rounded-lg text-[11px] font-medium flex items-center gap-1 transition-all cursor-pointer border border-white/5"
                    >
                      {copiedSession ? <><Check className="w-3 h-3 text-emerald-400" /> Скопировано</> : <><Copy className="w-3 h-3" /> Сессия</>}
                    </button>
                  )}
                </div>
                <p className="text-[11px] text-gray-400 leading-snug">
                  Сессия надежно сохраняется в файл <code className="text-gray-300">.telegram_session</code> на сервере и в кэше браузера. При перезапуске авторизация восстанавливается автоматически!
                </p>
              </div>

              {/* Reset Settings & Design Card */}
              <div className="bg-[#151520] border border-amber-500/20 rounded-xl p-3.5 space-y-2.5">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-amber-400 flex items-center gap-1.5">
                    <RotateCcw className="w-3.5 h-3.5" /> Сброс настроек и оформления
                  </span>
                </div>
                <p className="text-[11px] text-gray-400 leading-snug">
                  Если вы хотите вернуть интерфейс к первоначальному виду, сбросьте параметры стекла Liquid Glass или все пользовательские настройки.
                </p>
                <div className="grid grid-cols-2 gap-2 pt-1">
                  <button
                    type="button"
                    onClick={handleResetDesign}
                    className="px-2.5 py-2 bg-white/5 hover:bg-white/10 border border-white/10 rounded-lg text-xs font-medium text-gray-200 flex items-center justify-center gap-1.5 transition-all cursor-pointer hover:border-amber-400/40"
                  >
                    <Sliders className="w-3.5 h-3.5 text-amber-400" />
                    Сбросить дизайн
                  </button>
                  <button
                    type="button"
                    onClick={handleResetAll}
                    className="px-2.5 py-2 bg-amber-500/10 hover:bg-amber-500/20 border border-amber-500/30 rounded-lg text-xs font-medium text-amber-300 flex items-center justify-center gap-1.5 transition-all cursor-pointer"
                  >
                    <RotateCcw className="w-3.5 h-3.5" />
                    Полный сброс
                  </button>
                </div>
              </div>

              {/* Media & Data Recovery Section */}
              <div className="bg-[#151520] border border-blue-500/20 rounded-xl p-3 space-y-2.5">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-blue-400 flex items-center gap-1.5">
                    <DownloadCloud className="w-3.5 h-3.5" /> Загрузка и восстановление медиа
                  </span>
                  <span className="text-[11px] text-gray-400 font-mono">
                    {syncState.pendingCount > 0 ? `${syncState.pendingCount} в очереди` : "Все синхронизировано"}
                  </span>
                </div>

                {/* Progress bar */}
                <div className="space-y-1">
                  <div className="flex justify-between text-[10px] text-gray-400">
                    <span>{formatBytes(syncState.loadedBytes)} из {formatBytes(syncState.totalBytes || syncState.loadedBytes)}</span>
                    <span>{syncState.progressPercent}%</span>
                  </div>
                  <div className="w-full h-1.5 bg-black/40 rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-blue-500 rounded-full transition-all duration-300"
                      style={{ width: `${Math.max(syncState.progressPercent, syncState.pendingCount > 0 ? 5 : 0)}%` }}
                    />
                  </div>
                </div>

                {/* Interrupted / Failed downloads alert */}
                {syncState.interruptedCount > 0 && (
                  <div className="p-2 bg-amber-500/10 border border-amber-500/20 rounded-lg text-[11px] text-amber-300 flex items-center justify-between">
                    <span className="flex items-center gap-1.5">
                      <RefreshCw className="w-3 h-3 animate-spin text-amber-400" />
                      Не загрузились при выходе: {syncState.interruptedCount}
                    </span>
                    <button
                      type="button"
                      onClick={() => mediaSync.retryFailed()}
                      className="px-2 py-0.5 bg-amber-500/20 hover:bg-amber-500/30 text-amber-200 text-[10px] rounded font-medium cursor-pointer"
                    >
                      Возобновить
                    </button>
                  </div>
                )}

                {/* Active & pending items list preview */}
                {syncState.items.length > 0 ? (
                  <div className="max-h-32 overflow-y-auto space-y-1.5 pr-1 text-xs">
                    {syncState.items.slice(0, 6).map(item => (
                      <div key={item.id} className="flex items-center justify-between p-1.5 bg-black/30 rounded border border-white/5 text-[11px]">
                        <div className="flex items-center gap-2 truncate pr-2">
                          {item.type === "video" ? <Video className="w-3.5 h-3.5 text-blue-400 shrink-0" /> :
                           item.type === "voice" ? <Mic className="w-3.5 h-3.5 text-emerald-400 shrink-0" /> :
                           <Image className="w-3.5 h-3.5 text-purple-400 shrink-0" />}
                          <span className="text-gray-300 truncate">{item.name}</span>
                        </div>
                        <div className="shrink-0 flex items-center gap-1.5">
                          {item.status === "downloading" && (
                            <span className="text-blue-400 text-[10px] flex items-center gap-1">
                              <Loader2 className="w-3 h-3 animate-spin" /> {Math.round((item.loadedBytes / (item.totalBytes || 1)) * 100)}%
                            </span>
                          )}
                          {item.status === "pending" && item.interruptedFromPreviousSession && (
                            <span className="text-amber-400 text-[10px]">Прервано</span>
                          )}
                          {item.status === "pending" && !item.interruptedFromPreviousSession && (
                            <span className="text-gray-400 text-[10px]">В очереди</span>
                          )}
                          {item.status === "failed" && (
                            <span className="text-rose-400 text-[10px]">Сбой</span>
                          )}
                          {item.status === "completed" && (
                            <span className="text-emerald-400 text-[10px]">Готово</span>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-[11px] text-gray-500 italic text-center py-1">
                    Нет незавершенных загрузок. Все медиа синхронизированы.
                  </p>
                )}
              </div>
            </div>

            {/* Sticky bottom actions */}
            <div className="shrink-0 p-4 border-t border-[#2a2a38] bg-[#15151e]/95 backdrop-blur-md flex gap-2">
              <button disabled={saving} onClick={handleSave} className="flex-1 py-2.5 bg-blue-600 hover:bg-blue-500 rounded-xl text-white font-medium flex items-center justify-center gap-2 transition-colors disabled:opacity-50 cursor-pointer shadow-lg">
                {saving ? <Loader2 className="w-5 h-5 animate-spin" /> : <><Save className="w-4 h-4"/> Сохранить профиль</>}
              </button>
              <button 
                type="button" 
                onClick={handleLogout} 
                className="px-3.5 py-2.5 bg-red-500/10 hover:bg-red-500/20 text-red-400 rounded-xl text-xs font-medium flex items-center gap-1.5 transition-colors cursor-pointer border border-red-500/20"
                title="Выйти из сессии"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          </>
        )}
      </motion.div>
    </div>
  );
}

function AlbumsManagerDialog({ 
  onClose, 
  onSelectAlbum, 
  dialogs,
  albums,
  setAlbums
}: { 
  onClose: () => void; 
  onSelectAlbum: (id: string) => void;
  dialogs: any[];
  albums: any[];
  setAlbums: React.Dispatch<React.SetStateAction<any[]>>;
}) {
  const [isCreating, setIsCreating] = useState(false);
  const [newAlbumName, setNewAlbumName] = useState("");
  const [selectedChats, setSelectedChats] = useState<string[]>([]);

  const handleCreateAlbum = () => {
    if (!newAlbumName.trim()) return;
    const newAlbum = {
      id: Date.now().toString(),
      name: newAlbumName.trim(),
      chatIds: selectedChats
    };
    const updated = [...albums, newAlbum];
    setAlbums(updated);
    localStorage.setItem("nexus_albums", JSON.stringify(updated));
    setNewAlbumName("");
    setSelectedChats([]);
    setIsCreating(false);
  };

  const handleDeleteAlbum = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const updated = albums.filter(a => a.id !== id);
    setAlbums(updated);
    localStorage.setItem("nexus_albums", JSON.stringify(updated));
  };

  const toggleSelectChat = (chatId: string) => {
    setSelectedChats(prev => 
      prev.includes(chatId) ? prev.filter(id => id !== chatId) : [...prev, chatId]
    );
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4">
      <motion.div 
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="w-full max-w-md bg-[#111116] border border-[#2a2a38] rounded-2xl overflow-hidden shadow-2xl relative flex flex-col max-h-[85vh]"
      >
        <div className="flex justify-between items-center p-4 border-b border-[#2a2a38]">
          <h2 className="text-white font-medium flex items-center gap-2">
            <Folder className="w-5 h-5 text-indigo-400" />
            Albums / Folders
          </h2>
          <button onClick={onClose} className="text-gray-400 hover:text-white transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-4 flex-1 overflow-y-auto space-y-4">
          {!isCreating ? (
            <>
              <button 
                onClick={() => setIsCreating(true)}
                className="w-full py-3 bg-indigo-600 hover:bg-indigo-500 rounded-xl text-white font-medium flex items-center justify-center gap-2 transition-all hover:scale-[1.01]"
              >
                <FolderPlus className="w-5 h-5" />
                Create New Album
              </button>

              <div className="space-y-2">
                <p className="text-xs text-gray-500 font-medium">YOUR ALBUMS ({albums.length})</p>
                {albums.length === 0 ? (
                  <p className="text-sm text-gray-400 text-center py-6">No albums created yet</p>
                ) : (
                  albums.map(a => (
                    <div 
                      key={a.id}
                      onClick={() => {
                        onSelectAlbum(a.id);
                        onClose();
                      }}
                      className="flex items-center justify-between p-3 bg-[#1a1a24] hover:bg-[#20202c] border border-[#232332] rounded-xl cursor-pointer transition-all animate-none"
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <Folder className="w-5 h-5 text-indigo-400 shrink-0" />
                        <div className="min-w-0">
                          <p className="text-sm text-white font-medium truncate">{a.name}</p>
                          <p className="text-xs text-gray-500">{a.chatIds?.length || 0} chats</p>
                        </div>
                      </div>
                      <button 
                        onClick={(e) => handleDeleteAlbum(a.id, e)}
                        className="p-1.5 hover:bg-red-500/10 rounded-lg text-gray-500 hover:text-red-400 transition-colors"
                      >
                        <Trash className="w-4 h-4" />
                      </button>
                    </div>
                  ))
                )}
              </div>
            </>
          ) : (
            <div className="space-y-4">
              <div>
                <label className="text-xs text-gray-400 mb-1 block">Album Name</label>
                <input 
                  type="text" 
                  value={newAlbumName} 
                  onChange={e => setNewAlbumName(e.target.value)} 
                  placeholder="e.g. Work, Family"
                  className="w-full bg-[#1a1a24] border border-[#2a2a38] rounded-xl px-4 py-2 text-white text-sm outline-none focus:border-indigo-500/50"
                />
              </div>

              <div>
                <label className="text-xs text-gray-400 mb-1 block">Select Chats to Add</label>
                <div className="border border-[#2a2a38] rounded-xl max-h-48 overflow-y-auto bg-[#1a1a24] p-2 space-y-1">
                  {dialogs.map(d => (
                    <div 
                      key={d.id}
                      onClick={() => toggleSelectChat(d.id)}
                      className={`flex items-center gap-3 p-2 rounded-lg cursor-pointer transition-colors ${
                        selectedChats.includes(d.id) ? "bg-indigo-500/20 text-white" : "hover:bg-[#20202e] text-gray-300"
                      }`}
                    >
                      <input 
                        type="checkbox" 
                        checked={selectedChats.includes(d.id)}
                        onChange={() => {}} // handled by click
                        className="rounded bg-gray-800 border-gray-700 text-indigo-500 accent-indigo-505"
                      />
                      <span className="text-xs font-medium truncate">{d.name || d.title}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="flex gap-2">
                <button 
                  onClick={() => setIsCreating(false)}
                  className="flex-1 py-1 bg-gray-850 hover:bg-gray-800 rounded-lg text-gray-300 text-xs font-medium transition-colors"
                >
                  Cancel
                </button>
                <button 
                  onClick={handleCreateAlbum}
                  disabled={!newAlbumName.trim()}
                  className="flex-1 py-1 bg-indigo-600 hover:bg-indigo-500 rounded-lg text-white text-xs font-medium transition-colors disabled:opacity-50"
                >
                  Create
                </button>
              </div>
            </div>
          )}
        </div>
      </motion.div>
    </div>
  );
}

export function Sidebar({ 
  onSelectChat, 
  activeId,
  isTelegramConnected,
  onSearchChange,
  fps = 60
}: { 
  onSelectChat: (id: string, type: "ai" | "telegram" | "notes", name: string, canSend?: boolean) => void;
  activeId: string;
  isTelegramConnected: boolean;
  onSearchChange?: (query: string) => void;
  fps?: number;
}) {
  const { strings } = useI18n();
  const [dialogs, setDialogs] = useState<any[]>([]);
  const [notesList, setNotesList] = useState<any[]>([]);
  const [viewArchived, setViewArchived] = useState(false);
  const [swipedId, setSwipedId] = useState<string | null>(null);
  const [activeDragOffset, setActiveDragOffset] = useState<{ id: string; x: number } | null>(null);
  const [showProfile, setShowProfile] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [isSyncing, setIsSyncing] = useState(true);
  const [typingUsers, setTypingUsers] = useState<Record<string, NodeJS.Timeout>>({});
  const [activeCategory, setActiveCategory] = useState("All");
  const [searchQuery, setSearchQuery] = useState("");
  const [searchFilter, setSearchFilter] = useState<"all" | "chats" | "messages" | "channels" | "media" | "global">("all");
  const [globalSearchResults, setGlobalSearchResults] = useState<any[]>([]);
  const [globalChatResults, setGlobalChatResults] = useState<any[]>([]);
  const [localMessageResults, setLocalMessageResults] = useState<any[]>([]);
  const [globalMessageResults, setGlobalMessageResults] = useState<any[]>([]);
  const [searchMode, setSearchMode] = useState<'local' | 'global'>('local');
  const [isSearchingGlobal, setIsSearchingGlobal] = useState(false);
  const [isSearchingMessages, setIsSearchingMessages] = useState(false);
  const [, setUpdateTick] = useState(0);

  // Section Action Modal state
  const [isSectionActionModalOpen, setIsSectionActionModalOpen] = useState(false);
  const [selectedSectionForAction, setSelectedSectionForAction] = useState<SectionInfo | null>(null);

  // Dynamic header and search states based on scroll and pull
  const [isHeaderHidden, setIsHeaderHidden] = useState(false);
  const [isSearchExpanded, setIsSearchExpanded] = useState(false);
  const searchInputRef = useRef<HTMLInputElement>(null);
  const lastScrollTopRef = useRef<number>(0);
  const touchStartYRef = useRef<number>(0);
  const touchStartXRef = useRef<number>(0);
  const isPullingRef = useRef<boolean>(false);

  // Hide chat notes in all chats setting
  const [hideAllChatNotes, setHideAllChatNotes] = useState<boolean>(() => localStorage.getItem("nexus_hide_all_chat_notes") === "true");

  // Customization settings states
  const [showProfileBorders, setShowProfileBorders] = useState<boolean>(() => localStorage.getItem("nexus_show_profile_borders") !== "false");
  const [clientColor, setClientColor] = useState<string>(() => localStorage.getItem("nexus_client_color") || "#6366f1");
  const [nameColor, setNameColor] = useState<string>(() => localStorage.getItem("nexus_name_color") || "#f3f4f6");
  const [showNameEmojis, setShowNameEmojis] = useState<boolean>(() => localStorage.getItem("nexus_show_name_emojis") !== "false");
  const [unreadBadgeLocation, setUnreadBadgeLocation] = useState<"avatar" | "timestamp">(() => (localStorage.getItem("nexus_unread_badge_location") as any) || "timestamp");
  const [savedMessagesMode, setSavedMessagesMode] = useState<"saved" | "notes" | "profile" | "custom">(() => (localStorage.getItem("nexus_saved_messages_mode") as any) || "saved");
  const [savedMessagesCustomTitle, setSavedMessagesCustomTitle] = useState<string>(() => localStorage.getItem("nexus_saved_messages_custom_title") || "");
  const [myProfileName, setMyProfileName] = useState<string>(() => localStorage.getItem("nexus_my_profile_name") || "");

  // AI Semantic Search State
  const [isAiSearchActive, setIsAiSearchActive] = useState<boolean>(false);
  const [aiSearchResults, setAiSearchResults] = useState<any[]>([]);
  const [isSearchingAi, setIsSearchingAi] = useState<boolean>(false);

  // Virtual Peek Chat Modal State (read-only chat preview on long-press)
  const [peekChat, setPeekChat] = useState<{ id: string; name: string; avatarUrl?: string; canSend?: boolean } | null>(null);
  const [peekMessages, setPeekMessages] = useState<any[]>([]);
  const [loadingPeekMessages, setLoadingPeekMessages] = useState(false);
  const peekContainerRef = useRef<HTMLDivElement>(null);
  const chatLongPressTimerRef = useRef<number | null>(null);
  const chatTouchStartPosRef = useRef<{ x: number; y: number } | null>(null);

  // Proxy state and modal
  const [showProxyModal, setShowProxyModal] = useState(false);
  const [proxyConfig, setProxyConfig] = useState<{ enabled: boolean; ping?: number }>({ enabled: true, ping: 34 });

  // Custom Sections created by user (+ button)
  const [customSections, setCustomSections] = useState<CustomCategorySection[]>(() => {
    try {
      const saved = localStorage.getItem("nexus_custom_sections");
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });
  const [isSectionModalOpen, setIsSectionModalOpen] = useState(false);
  const [editingSection, setEditingSection] = useState<CustomCategorySection | null>(null);

  // Category order: Channels & Groups on 1st & 2nd, Archive strictly on the last position!
  const [categoryOrder, setCategoryOrder] = useState<string[]>(() => {
    try {
      const saved = localStorage.getItem("nexus_category_order");
      if (saved) {
        const parsed: string[] = JSON.parse(saved);
        const withoutArchive = parsed.filter(c => c !== "Archive");
        return [...withoutArchive, "Archive"];
      }
    } catch {}
    return ["Channels", "Groups", "All", "Bots", "Albums", "Notes", "Personal", "Archive"];
  });

  const [draggedCategory, setDraggedCategory] = useState<string | null>(null);

  // Top Action Button ("search" | "stories" | "menu")
  const [topActionBtn, setTopActionBtn] = useState<"search" | "stories" | "menu">(() => {
    return (localStorage.getItem("nexus_top_action_btn") as any) || "search";
  });

  // Stories
  const [activeStoryIndex, setActiveStoryIndex] = useState<number | null>(null);
  const [showStoriesBar, setShowStoriesBar] = useState(true);
  const [showCreateStoryModal, setShowCreateStoryModal] = useState(false);
  const [realStories, setRealStories] = useState<any[]>(() => {
    try {
      const saved = JSON.parse(localStorage.getItem("nexus_my_stories") || "[]");
      if (Array.isArray(saved) && saved.length > 0) {
        const ids = new Set(saved.map((s: any) => s.id));
        const rest = SAMPLE_STORIES.filter((s) => !ids.has(s.id));
        return [...saved, ...rest];
      }
      return SAMPLE_STORIES;
    } catch {
      return SAMPLE_STORIES;
    }
  });

  const [readStoriesVersion, setReadStoriesVersion] = useState(0);

  useEffect(() => {
    const handleStoryViewed = () => {
      setReadStoriesVersion((v) => v + 1);
    };
    window.addEventListener("nexus-story-viewed", handleStoryViewed);
    return () => window.removeEventListener("nexus-story-viewed", handleStoryViewed);
  }, []);

  // Custom avatars for Saved Messages and Notes from settings
  const [customSavedMessagesAvatar, setCustomSavedMessagesAvatar] = useState<string>(
    () => localStorage.getItem("nexus_saved_messages_avatar") || "/assets/avatar-saved-messages.svg"
  );
  const [customNotesAvatar, setCustomNotesAvatar] = useState<string>(
    () => localStorage.getItem("nexus_notes_avatar") || "/assets/avatar-notes.svg"
  );
  const [showNotesInChats, setShowNotesInChats] = useState<boolean>(
    () => localStorage.getItem("nexus_show_notes_in_chats") !== "false"
  );

  const [sectionAnchorPos, setSectionAnchorPos] = useState<{ x: number; y: number } | null>(null);

  // Fetch real stories from Telegram account and merge with local
  useEffect(() => {
    fetch("/api/telegram/stories")
      .then((r) => r.json())
      .then((data) => {
        if (data?.stories && Array.isArray(data.stories)) {
          setRealStories((prev) => {
            const myLocal = prev.filter((s) => s.userId === "me");
            const ids = new Set(myLocal.map((s) => s.id));
            const newFromApi = data.stories.filter((s: any) => !ids.has(s.id));
            return [...myLocal, ...newFromApi];
          });
        }
      })
      .catch(() => {});

    const handleCustomizationChanged = (e: any) => {
      if (e.detail?.key === "savedMessagesAvatar") {
        setCustomSavedMessagesAvatar(e.detail.value);
      }
      if (e.detail?.key === "notesAvatar") {
        setCustomNotesAvatar(e.detail.value);
      }
      if (e.detail?.key === "showNotesInChats") {
        setShowNotesInChats(e.detail.value);
      }
    };
    window.addEventListener("nexus-customization-changed", handleCustomizationChanged);
    return () => window.removeEventListener("nexus-customization-changed", handleCustomizationChanged);
  }, []);

  const handlePublishStory = (storyData: CreatedStoryData) => {
    const newStory = {
      id: storyData.id,
      userId: "me",
      userName: "Моя история",
      userAvatar: "/api/telegram/avatar/me",
      timeAgo: "Только что",
      mediaUrl: storyData.mediaUrl,
      isVideo: storyData.isVideo,
      caption: storyData.caption,
      colorGradient: storyData.colorGradient,
      mode: storyData.mode,
    };
    const updated = [newStory, ...realStories];
    setRealStories(updated);
    try {
      const saved = JSON.parse(localStorage.getItem("nexus_my_stories") || "[]");
      localStorage.setItem("nexus_my_stories", JSON.stringify([newStory, ...saved]));
      const read = JSON.parse(localStorage.getItem("nexus_read_stories") || "[]");
      const filtered = read.filter((id: string) => id !== "me" && id !== newStory.id);
      localStorage.setItem("nexus_read_stories", JSON.stringify(filtered));
      setReadStoriesVersion((v) => v + 1);
    } catch {}
    triggerHaptic("heavy");
  };

  const [selectedContextStory, setSelectedContextStory] = useState<any | null>(null);
  const storyLongPressTimerRef = useRef<number | null>(null);

  const handleUpdateStory = (updatedStory: any) => {
    setRealStories((prev) => {
      const updated = prev.map((s) => (s.id === updatedStory.id ? updatedStory : s));
      try {
        const mySaved = updated.filter((s) => s.userId === "me" || s.isOwn);
        localStorage.setItem("nexus_my_stories", JSON.stringify(mySaved));
      } catch {}
      return updated;
    });
  };

  const handleDeleteStory = (storyId: string) => {
    setRealStories((prev) => {
      const updated = prev.filter((s) => s.id !== storyId);
      try {
        const mySaved = updated.filter((s) => s.userId === "me" || s.isOwn);
        localStorage.setItem("nexus_my_stories", JSON.stringify(mySaved));
      } catch {}
      return updated;
    });
    try {
      fetch(`/api/telegram/stories/${encodeURIComponent(storyId)}`, { method: "DELETE" });
    } catch {}
  };

  // Small search visible (minor scroll down) vs Full search expanded (strong pull down)
  const [isSmallSearchVisible, setIsSmallSearchVisible] = useState(false);

  // Coordinate-based category drag states
  const [activeDragCategory, setActiveDragCategory] = useState<string | null>(null);
  const [dragPointerPos, setDragPointerPos] = useState<{ x: number; y: number } | null>(null);
  const categoryLongPressTimerRef = useRef<number | null>(null);
  const pointerStartPosRef = useRef<{ x: number; y: number } | null>(null);
  const categoriesContainerRef = useRef<HTMLDivElement>(null);

  // Archive state tracking
  const [archivedChatIds, setArchivedChatIds] = useState<string[]>(() => {
    try {
      return JSON.parse(localStorage.getItem("nexus_archived_chat_ids") || "[]");
    } catch {
      return [];
    }
  });
  const [animatingArchiveId, setAnimatingArchiveId] = useState<string | null>(null);
  const hasTriggeredArchiveHapticRef = useRef(false);

  const isChatArchived = useCallback((dialog: any) => {
    const strId = String(dialog?.id || "");
    return Boolean(dialog?.archived || archivedChatIds.includes(strId));
  }, [archivedChatIds]);

  // Frequent contacts/channels with whom the user communicates or spends time most
  const frequentDialogs = useMemo(() => {
    return [...dialogs]
      .filter((d) => !isChatArchived(d))
      .sort((a, b) => {
        const unreadA = a.unreadCount || 0;
        const unreadB = b.unreadCount || 0;
        if (unreadB !== unreadA) return unreadB - unreadA;
        return (b.date || 0) - (a.date || 0);
      })
      .slice(0, 16);
  }, [dialogs, isChatArchived]);

  const handleToggleArchive = async (chatId: string, shouldArchive: boolean) => {
    triggerHaptic("medium");
    const strId = String(chatId);

    setArchivedChatIds((prev) => {
      const next = shouldArchive
        ? Array.from(new Set([...prev, strId]))
        : prev.filter((id) => id !== strId);
      localStorage.setItem("nexus_archived_chat_ids", JSON.stringify(next));
      return next;
    });

    setDialogs((prev) =>
      prev.map((d) => (String(d.id) === strId ? { ...d, archived: shouldArchive } : d))
    );

    setSwipedId(null);
    setActiveDragOffset(null);

    try {
      await fetch(`/api/telegram/dialogs/${encodeURIComponent(strId)}/archive`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ archived: shouldArchive }),
      });
    } catch (e) {
      console.warn("Failed to toggle archive remotely:", e);
    }
  };

  // Coordinate-based category drag and drop effect
  useEffect(() => {
    if (!activeDragCategory) return;

    let rafId: number | null = null;
    const handlePointerMove = (e: PointerEvent) => {
      e.preventDefault();
      if (rafId) return;
      rafId = requestAnimationFrame(() => {
        rafId = null;
        setDragPointerPos({ x: e.clientX, y: e.clientY });
        setIsSectionActionModalOpen(false);
        setSelectedSectionForAction(null);

        if (categoriesContainerRef.current) {
          const tabElements = categoriesContainerRef.current.querySelectorAll<HTMLElement>("[data-category]");
          for (const el of tabElements) {
            const catId = el.getAttribute("data-category");
            if (!catId || catId === "Archive" || catId === activeDragCategory) continue;
            const rect = el.getBoundingClientRect();
            if (e.clientX >= rect.left && e.clientX <= rect.right) {
              setCategoryOrder((prev) => {
                const list = prev.filter((item) => item !== "Archive");
                const fromIdx = list.indexOf(activeDragCategory);
                const toIdx = list.indexOf(catId);
                if (fromIdx === -1 || toIdx === -1 || fromIdx === toIdx) return prev;
                list.splice(fromIdx, 1);
                list.splice(toIdx, 0, activeDragCategory);
                const next = [...list, "Archive"];
                localStorage.setItem("nexus_category_order", JSON.stringify(next));
                triggerHaptic("light");
                return next;
              });
              break;
            }
          }
        }
      });
    };

    const handlePointerUp = () => {
      if (rafId) {
        cancelAnimationFrame(rafId);
        rafId = null;
      }
      if (categoryLongPressTimerRef.current) {
        clearTimeout(categoryLongPressTimerRef.current);
        categoryLongPressTimerRef.current = null;
      }
      pointerStartPosRef.current = null;
      setActiveDragCategory(null);
      setDragPointerPos(null);
      triggerHaptic("medium");
    };

    window.addEventListener("pointermove", handlePointerMove, { passive: false });
    window.addEventListener("pointerup", handlePointerUp);
    window.addEventListener("pointercancel", handlePointerUp);

    return () => {
      if (rafId) cancelAnimationFrame(rafId);
      window.removeEventListener("pointermove", handlePointerMove);
      window.removeEventListener("pointerup", handlePointerUp);
      window.removeEventListener("pointercancel", handlePointerUp);
    };
  }, [activeDragCategory]);

  // Recent searches list (starts empty, only stores real searched items)
  const [recentSearches, setRecentSearches] = useState<any[]>(() => {
    try {
      const saved = localStorage.getItem("nexus_recent_searches");
      if (saved) return JSON.parse(saved);
    } catch {}
    return [];
  });

  useEffect(() => {
    fetch("/api/proxy/stats")
      .then(res => res.json())
      .then(data => {
        if (data) setProxyConfig({ enabled: Boolean(data.enabled), ping: data.ping || 34 });
      })
      .catch(() => {});

    fetch("/api/telegram/me")
      .then(res => res.json())
      .then(data => {
        if (data && !data.error) {
          const full = `${data.firstName || ""} ${data.lastName || ""}`.trim() || data.username || "Мой профиль";
          setMyProfileName(full);
          localStorage.setItem("nexus_my_profile_name", full);
        }
      })
      .catch(() => {});

    const handleProxyUpdated = (e: any) => {
      const detail = e.detail;
      if (detail) {
        setProxyConfig({ enabled: Boolean(detail.enabled), ping: detail.activeProxy?.ping || 34 });
      }
    };

    const handleNotesVisibility = (e: any) => {
      setHideAllChatNotes(Boolean(e.detail?.hide));
    };
    const handleCustomization = (e: any) => {
      const { key, value } = e.detail || {};
      if (key === "showProfileBorders") setShowProfileBorders(value);
      if (key === "clientColor") setClientColor(value);
      if (key === "nameColor") setNameColor(value);
      if (key === "showNameEmojis") setShowNameEmojis(value);
      if (key === "unreadBadgeLocation") setUnreadBadgeLocation(value);
      if (key === "hideAllChatNotes") setHideAllChatNotes(value);
      if (key === "topActionBtn") setTopActionBtn(value);
      if (key === "savedMessagesMode") setSavedMessagesMode(value);
      if (key === "savedMessagesCustomTitle") setSavedMessagesCustomTitle(value);
    };
    window.addEventListener("nexus-customization-changed", handleCustomization);
    window.addEventListener("proxy-updated", handleProxyUpdated);
    return () => {
      window.removeEventListener("nexus-chat-notes-visibility", handleNotesVisibility);
      window.removeEventListener("nexus-customization-changed", handleCustomization);
      window.removeEventListener("proxy-updated", handleProxyUpdated);
    };
  }, []);

  // Fetch messages for virtual peek chat
  useEffect(() => {
    if (!peekChat) {
      setPeekMessages([]);
      return;
    }
    setLoadingPeekMessages(true);
    fetch(`/api/telegram/messages/${encodeURIComponent(peekChat.id)}?limit=25`)
      .then((r) => r.json())
      .then((data) => {
        if (Array.isArray(data)) {
          setPeekMessages(data.slice(-25));
        } else if (data?.messages && Array.isArray(data.messages)) {
          setPeekMessages(data.messages.slice(-25));
        }
      })
      .catch((err) => console.warn("Failed to load peek messages:", err))
      .finally(() => {
        setLoadingPeekMessages(false);
        setTimeout(() => {
          if (peekContainerRef.current) {
            peekContainerRef.current.scrollTop = peekContainerRef.current.scrollHeight;
          }
        }, 100);
      });
  }, [peekChat]);

  const handleSaveSection = (newSec: CustomCategorySection) => {
    const existingIdx = customSections.findIndex((s) => s.id === newSec.id);
    let updated: CustomCategorySection[];
    if (existingIdx !== -1) {
      updated = [...customSections];
      updated[existingIdx] = newSec;
    } else {
      updated = [...customSections, newSec];
      setCategoryOrder((prev) => {
        const filtered = prev.filter((c) => c !== newSec.id && c !== "Archive");
        const next = [...filtered, newSec.id, "Archive"];
        localStorage.setItem("nexus_category_order", JSON.stringify(next));
        return next;
      });
    }
    setCustomSections(updated);
    localStorage.setItem("nexus_custom_sections", JSON.stringify(updated));
    setActiveCategory(newSec.id);
  };

  const handleDeleteSection = (id: string) => {
    const updated = customSections.filter((s) => s.id !== id);
    setCustomSections(updated);
    localStorage.setItem("nexus_custom_sections", JSON.stringify(updated));
    setCategoryOrder((prev) => {
      const next = prev.filter((c) => c !== id);
      localStorage.setItem("nexus_category_order", JSON.stringify(next));
      return next;
    });
    if (activeCategory === id) setActiveCategory("Channels");
  };

  const recordRecentSearch = (item: {
    title: string;
    subtitle?: string;
    type: "chat" | "message" | "channel" | "query";
    avatar?: string;
    chatId?: string;
  }) => {
    const newRecent = [
      {
        id: `search_${Date.now()}_${Math.random().toString(36).substr(2, 4)}`,
        title: item.title,
        subtitle: item.subtitle,
        type: item.type,
        avatar: item.avatar,
        chatId: item.chatId,
      },
      ...recentSearches.filter((r) => (item.chatId ? r.chatId !== item.chatId : r.title !== item.title)).slice(0, 9),
    ];
    setRecentSearches(newRecent);
    localStorage.setItem("nexus_recent_searches", JSON.stringify(newRecent));
  };

  const performAiSearch = async (queryText: string) => {
    if (!queryText.trim()) {
      setAiSearchResults([]);
      return;
    }
    setIsSearchingAi(true);
    try {
      const res = await fetch("/api/telegram/search-ai", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ query: queryText }),
      });
      const data = await res.json();
      if (data?.matches) {
        setAiSearchResults(data.matches);
      }
    } catch (e) {
      console.warn("AI search error:", e);
    } finally {
      setIsSearchingAi(false);
    }
  };

  const handleCategoryDrop = (targetCategory: string) => {
    if (!draggedCategory || draggedCategory === targetCategory) return;
    if (targetCategory === "Archive") return;

    const list = categoryOrder.filter((c) => c !== "Archive");
    const dragIdx = list.indexOf(draggedCategory);
    const targetIdx = list.indexOf(targetCategory);
    if (dragIdx === -1 || targetIdx === -1) return;

    list.splice(dragIdx, 1);
    list.splice(targetIdx, 0, draggedCategory);

    const reordered = [...list, "Archive"];
    setCategoryOrder(reordered);
    localStorage.setItem("nexus_category_order", JSON.stringify(reordered));
    setDraggedCategory(null);
    triggerHaptic("medium");
  };

  useEffect(() => {
    setViewArchived(activeCategory === "Archive");
  }, [activeCategory]);

  // Load and refresh notes from backend
  const fetchNotes = useCallback(() => {
    const myId = localStorage.getItem("telegram_my_id");
    const headers: Record<string, string> = {};
    if (myId) headers["x-user-id"] = myId;

    fetch("/api/notes", { headers })
      .then((res) => res.json())
      .then((data) => {
        if (data.success && Array.isArray(data.notes)) {
          setNotesList(data.notes);
        }
      })
      .catch((err) => console.error("Could not fetch notes:", err));
  }, []);

  useEffect(() => {
    if (activeCategory === "Notes") {
      fetchNotes();
    }
  }, [activeCategory, fetchNotes]);

  // Albums management states
  const [albums, setAlbums] = useState<any[]>(() => {
    try {
      return JSON.parse(localStorage.getItem("nexus_albums") || "[]");
    } catch(e) { return []; }
  });
  const [activeAlbumId, setActiveAlbumId] = useState<string | null>(null);
  const [showAlbumsManager, setShowAlbumsManager] = useState(false);
  const [newAlbumName, setNewAlbumName] = useState("");
  const [selectingChatsForAlbum, setSelectingChatsForAlbum] = useState<string[]>([]);
  const [isCreatingAlbum, setIsCreatingAlbum] = useState(false);
  const [isOnline, setIsOnline] = useState(navigator.onLine);

  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  const [dismissedIcons, setDismissedIcons] = useState<Record<string, boolean>>(() => {
    try {
      return JSON.parse(localStorage.getItem("dismissedChatTypeIcons") || "{}");
    } catch {
      return {};
    }
  });

  const [copiedPublicLink, setCopiedPublicLink] = useState(false);
  const handleCopyPublicLinkHeader = async () => {
    const activeSharedUrl = typeof window !== "undefined"
      ? window.location.origin
      : "";
    try {
      await navigator.clipboard.writeText(activeSharedUrl);
      setCopiedPublicLink(true);
      setTimeout(() => setCopiedPublicLink(false), 2000);
    } catch {
      prompt("Публичная ссылка на приложение:", activeSharedUrl);
    }
  };

  const handleDismissIcon = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();
    const updated = { ...dismissedIcons, [id]: true };
    setDismissedIcons(updated);
    localStorage.setItem("dismissedChatTypeIcons", JSON.stringify(updated));
  };

  const getChatTypeIcon = (dialog: any) => {
    const dIdStr = dialog.id?.toString() || "";
    const dTitle = (dialog.name || dialog.title || "").toLowerCase();
    
    if (dIdStr === "ai-assistant" || dIdStr === "ai" || dTitle.includes("assistant") || dTitle.includes("ai ")) {
      return "🤖";
    }
    if (dialog.isBot || dTitle.includes("bot") || dIdStr.endsWith("bot") || dialog.username?.toLowerCase().endsWith("bot")) {
      return "🤖";
    }
    if (dialog.isForum || isForumDialog(dialog)) {
      return "📑";
    }
    if (dialog.isChannel || dialog.type === "channel" || dialog.category === "Channels") {
      return "📣";
    }
    if (dialog.isGroup || dialog.type === "group" || dialog.category === "Groups" || dIdStr.startsWith("-")) {
      return "👥";
    }
    if (dialog.isUser || dialog.type === "user" || dialog.category === "Personal") {
      return "👤";
    }
    return "👤";
  };

  const sidebarListRef = useRef<HTMLDivElement>(null);
  const sidebarTrackRef = useRef<HTMLDivElement>(null);
  const sidebarThumbRef = useRef<HTMLDivElement>(null);
  const [isScrubbing, setIsScrubbing] = useState(false);

  const handleSidebarScroll = () => {
    const el = sidebarListRef.current;
    if (!el) return;
    const maxScroll = el.scrollHeight - el.clientHeight;
    if (sidebarThumbRef.current && maxScroll > 0) {
      const ratio = el.scrollTop / maxScroll;
      const heightPercent = Math.max(10, Math.min(75, (el.clientHeight / el.scrollHeight) * 100));
      sidebarThumbRef.current.style.top = `${ratio * (100 - heightPercent)}%`;
      sidebarThumbRef.current.style.height = `${heightPercent}%`;
    }

    const currentScrollTop = el.scrollTop;
    const delta = currentScrollTop - lastScrollTopRef.current;

    // 1. "если скролить вниз то должно появиться маленькое поле"
    if (delta > 8 && currentScrollTop > 15 && !searchQuery) {
      if (!isSmallSearchVisible && !isSearchExpanded) {
        setIsHeaderHidden(true);
        setIsSmallSearchVisible(true);
        setShowStoriesBar(false);
      }
    } else if (currentScrollTop <= 3 && !searchQuery && !isSearchExpanded && !showStoriesBar) {
      if (isHeaderHidden || isSmallSearchVisible) {
        setIsHeaderHidden(false);
        setIsSmallSearchVisible(false);
      }
    }
    lastScrollTopRef.current = currentScrollTop;
  };

  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartXRef.current = e.touches[0].clientX;
    touchStartYRef.current = e.touches[0].clientY;
    isPullingRef.current = (sidebarListRef.current?.scrollTop || 0) <= 5;
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (!isPullingRef.current) return;
    const currentY = e.touches[0].clientY;
    const dy = currentY - touchStartYRef.current;
    
    // Pulling down from the top (dy > 0):
    if (dy > 0) {
      // 2. "если слегка протянуть вниз то должно появиться истории"
      if (dy >= 20 && dy <= 85) {
        if (!showStoriesBar && !isSearchExpanded) {
          setShowStoriesBar(true);
          setIsSmallSearchVisible(false);
          setIsSearchExpanded(false);
          setIsHeaderHidden(false);
          triggerHaptic("light");
        }
      } 
      // 3. "а если сильно вниз то большое поле, также красивое плавное анимация"
      else if (dy > 85) {
        if (!isSearchExpanded) {
          setShowStoriesBar(false);
          setIsHeaderHidden(true);
          setIsSmallSearchVisible(true);
          setIsSearchExpanded(true);
          triggerHaptic("medium");
          setTimeout(() => searchInputRef.current?.focus(), 60);
        }
      }
    } 
    // Pulling / swiping back up (dy < -20): hide search/stories, restore normal categories
    else if (dy < -20) {
      if ((isSmallSearchVisible || isSearchExpanded || showStoriesBar) && !searchQuery) {
        setIsHeaderHidden(false);
        setIsSmallSearchVisible(false);
        setIsSearchExpanded(false);
        setShowStoriesBar(false);
        if (searchInputRef.current) searchInputRef.current.blur();
        triggerHaptic("light");
      }
    }
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    isPullingRef.current = false;
    const touch = e.changedTouches[0];
    if (!touch) return;
    const dx = touch.clientX - touchStartXRef.current;
    const dy = touch.clientY - touchStartYRef.current;

    // Horizontal page swipe to switch sections (not vertical pull, and not swiping a chat card)
    if (Math.abs(dx) > 48 && Math.abs(dx) > Math.abs(dy) * 1.5 && activeDragOffset === null && swipedId === null) {
      if (isSearchExpanded && searchMode === "global") {
        // Switch global search category tabs
        const searchTabs = ["all", "chats", "messages", "channels", "media"] as const;
        const currentIdx = searchTabs.indexOf(searchFilter as any);
        if (dx < 0 && currentIdx < searchTabs.length - 1) {
          setSearchFilter(searchTabs[currentIdx + 1]);
          triggerHaptic("light");
        } else if (dx > 0 && currentIdx > 0) {
          setSearchFilter(searchTabs[currentIdx - 1]);
          triggerHaptic("light");
        }
      } else if (!isSearchExpanded && !isSmallSearchVisible) {
        // Switch regular sections in categoryOrder
        const currentIdx = categoryOrder.indexOf(activeCategory);
        if (dx < 0 && currentIdx < categoryOrder.length - 1) {
          // Swiped left -> Switch to next section
          const nextCat = categoryOrder[currentIdx + 1];
          setActiveCategory(nextCat);
          triggerHaptic("light");
          setTimeout(() => {
            const el = categoriesContainerRef.current?.querySelector(`[data-category="${nextCat}"]`);
            el?.scrollIntoView({ behavior: "smooth", block: "nearest", inline: "center" });
          }, 40);
        } else if (dx > 0 && currentIdx > 0) {
          // Swiped right -> Switch to previous section
          const prevCat = categoryOrder[currentIdx - 1];
          setActiveCategory(prevCat);
          triggerHaptic("light");
          setTimeout(() => {
            const el = categoriesContainerRef.current?.querySelector(`[data-category="${prevCat}"]`);
            el?.scrollIntoView({ behavior: "smooth", block: "nearest", inline: "center" });
          }, 40);
        }
      }
    }
  };

  const handleWheel = (e: React.WheelEvent) => {
    const el = sidebarListRef.current;
    if (!el) return;

    // 1. "если скролить вниз то должно появиться маленькое поле"
    if (e.deltaY > 15 && !searchQuery && !isSearchExpanded) {
      if (!isSmallSearchVisible) {
        setIsHeaderHidden(true);
        setIsSmallSearchVisible(true);
        setShowStoriesBar(false);
      }
    }
    // Pulling down at top of list (deltaY < 0):
    else if (el.scrollTop <= 0 && e.deltaY < 0) {
      // 2. "если слегка протянуть вниз то должно появиться истории"
      if (e.deltaY <= -15 && e.deltaY >= -75) {
        if (!showStoriesBar && !isSearchExpanded) {
          setShowStoriesBar(true);
          setIsSmallSearchVisible(false);
          setIsSearchExpanded(false);
          setIsHeaderHidden(false);
          triggerHaptic("light");
        }
      }
      // 3. "а если сильно вниз то большое поле, также красивое плавное анимация"
      else if (e.deltaY < -75) {
        if (!isSearchExpanded) {
          setShowStoriesBar(false);
          setIsHeaderHidden(true);
          setIsSmallSearchVisible(true);
          setIsSearchExpanded(true);
          triggerHaptic("medium");
          setTimeout(() => searchInputRef.current?.focus(), 60);
        }
      }
    }
    // Scrolling back up when search/stories open and no query typed
    else if (e.deltaY < -20 && (isHeaderHidden || isSearchExpanded || isSmallSearchVisible || showStoriesBar) && !searchQuery && el.scrollTop <= 0) {
      setIsHeaderHidden(false);
      setIsSmallSearchVisible(false);
      setIsSearchExpanded(false);
      setShowStoriesBar(false);
      if (searchInputRef.current) searchInputRef.current.blur();
    }
  };

  const handleSidebarScrub = (clientY: number) => {
    const track = sidebarTrackRef.current;
    const el = sidebarListRef.current;
    if (!track || !el) return;
    const rect = track.getBoundingClientRect();
    let relativeY = clientY - rect.top;
    relativeY = Math.max(0, Math.min(rect.height, relativeY));
    const ratio = relativeY / rect.height;
    const maxScroll = el.scrollHeight - el.clientHeight;
    el.scrollTop = ratio * maxScroll;
    if (sidebarThumbRef.current) {
      const heightPercent = Math.max(10, Math.min(75, (el.clientHeight / el.scrollHeight) * 100));
      sidebarThumbRef.current.style.top = `${ratio * (100 - heightPercent)}%`;
    }
  };

  const onSidebarScrubStart = (e: any) => {
    e.preventDefault();
    setIsScrubbing(true);
    const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY;
    handleSidebarScrub(clientY);
  };

  useEffect(() => {
    if (!isScrubbing) return;
    const handleMove = (e: any) => {
      const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY;
      handleSidebarScrub(clientY);
    };
    const handleEnd = () => {
      setIsScrubbing(false);
    };
    window.addEventListener('mousemove', handleMove);
    window.addEventListener('mouseup', handleEnd);
    window.addEventListener('touchmove', handleMove);
    window.addEventListener('touchend', handleEnd);
    return () => {
      window.removeEventListener('mousemove', handleMove);
      window.removeEventListener('mouseup', handleEnd);
      window.removeEventListener('touchmove', handleMove);
      window.removeEventListener('touchend', handleEnd);
    };
  }, [isScrubbing]);

  useEffect(() => {
    handleSidebarScroll();
  }, [dialogs, searchQuery, activeCategory]);

  const formatDialogTime = (timestamp?: number) => {
    if (!timestamp) return "";
    const date = new Date(timestamp > 1e11 ? timestamp : timestamp * 1000);
    const now = new Date();
    if (date.toDateString() === now.toDateString()) {
      return date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
    }
    return date.toLocaleDateString([], { month: "short", day: "numeric" });
  };

  const getCategoryEmoji = (c: string) => {
    const customSec = customSections.find((s) => s.id === c);
    if (customSec?.emoji) return customSec.emoji;
    switch (c) {
      case "All": return "🌟";
      case "Archive": return "📦";
      case "Albums": return "📁";
      case "Notes": return "📝";
      case "Personal": return "👤";
      case "Groups": return "👥";
      case "Channels": return "📢";
      case "Bots": return "🤖";
      default: return "📁";
    }
  };

  const highlightText = (text: string, query: string) => {
    if (!query || !query.trim() || !text) return text;
    const cleanQ = query.trim().replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    const regex = new RegExp(`(${cleanQ})`, "gi");
    const parts = text.split(regex);
    return parts.map((part, i) =>
      part.toLowerCase() === query.trim().toLowerCase() ? (
        <mark key={i} className="bg-amber-400/30 text-amber-200 font-semibold rounded px-0.5">
          {part}
        </mark>
      ) : (
        part
      )
    );
  };

  const openSectionActionModal = (c: string, x?: number, y?: number) => {
    const isCustom = customSections.some((s) => s.id === c);
    // Standard Telegram sections cannot be edited or deleted - do nothing!
    if (!isCustom) {
      return;
    }
    triggerHaptic("heavy");
    if (x !== undefined && y !== undefined) {
      setSectionAnchorPos({ x, y });
    } else {
      setSectionAnchorPos(null);
    }
    const customSec = customSections.find((s) => s.id === c);

    let chatCount = 0;
    let unreadCount = 0;

    if (isCustom && customSec) {
      const matching = dialogs.filter((d) => customSec.chatIds.includes(String(d.id)));
      chatCount = matching.length;
      unreadCount = matching.reduce((sum, d) => sum + (d.unreadCount || 0), 0);
    } else if (c === "All") {
      chatCount = dialogs.length;
      unreadCount = dialogs.reduce((sum, d) => sum + (d.unreadCount || 0), 0);
    } else if (c === "Archive") {
      const matching = dialogs.filter((d) => isChatArchived(d));
      chatCount = matching.length;
      unreadCount = matching.reduce((sum, d) => sum + (d.unreadCount || 0), 0);
    } else if (c === "Notes") {
      chatCount = notesList.length;
    } else if (c === "Albums") {
      chatCount = albums.length;
    } else {
      const matching = dialogs.filter((d) => d.category === c);
      chatCount = matching.length;
      unreadCount = matching.reduce((sum, d) => sum + (d.unreadCount || 0), 0);
    }

    const rawLabel = getCategoryLabel(c);
    const cleanLabel = rawLabel.replace(/^[\p{Extended_Pictographic}\u{1F300}-\u{1F9FF}]\s*/u, "");

    setSelectedSectionForAction({
      id: c,
      name: cleanLabel || c,
      emoji: isCustom && customSec ? customSec.emoji : getCategoryEmoji(c),
      isCustom,
      chatCount,
      unreadCount,
    });
    setIsSectionActionModalOpen(true);
  };

  const performSearch = useCallback(async (query: string, filter: typeof searchFilter) => {
    if (!query.trim()) {
      setLocalMessageResults([]);
      setGlobalMessageResults([]);
      setGlobalChatResults([]);
      return;
    }

    setIsSearchingMessages(true);
    setIsSearchingGlobal(true);

    try {
      const term = query.toLowerCase().trim();

      // 1. Local messages matching in loaded dialogs
      const localMatches: any[] = [];
      dialogs.forEach((d) => {
        if (d.lastMessage && d.lastMessage.toLowerCase().includes(term)) {
          localMatches.push({
            id: `msg_dialog_${d.id}`,
            chatId: String(d.id),
            chatTitle: getLocalProfile(d.id)?.name || d.name || d.title,
            chatUsername: d.username,
            senderName: d.title || d.name || "Собеседник",
            text: d.lastMessage,
            date: d.date ? d.date * 1000 : Date.now(),
            chatAvatar: `/api/telegram/avatar/${d.id}`,
            isGlobal: false,
          });
        }
      });
      setLocalMessageResults(localMatches);

      // 2. Global message and channels search
      let typeParam = "";
      if (filter === "media") typeParam = "&type=media";
      else if (filter === "channels") typeParam = "&type=channels";
      else if (filter === "chats") typeParam = "&type=chats";

      const [messagesRes, chatsRes] = await Promise.allSettled([
        fetch(`/api/telegram/search-messages?q=${encodeURIComponent(query)}&global=true${typeParam}`),
        fetch(`/api/telegram/search?q=${encodeURIComponent(query)}&global=true`),
      ]);

      if (messagesRes.status === "fulfilled" && messagesRes.value.ok) {
        const data = await messagesRes.value.json();
        if (data.messages && Array.isArray(data.messages)) {
          setGlobalMessageResults(data.messages.map((m: any) => ({ ...m, isGlobal: true })));
        }
      }

      if (chatsRes.status === "fulfilled" && chatsRes.value.ok) {
        const data = await chatsRes.value.json();
        if (Array.isArray(data)) {
          setGlobalChatResults(data);
          setGlobalSearchResults(data);
        }
      }
    } catch (e) {
      console.error("Search error:", e);
    } finally {
      setIsSearchingMessages(false);
      setIsSearchingGlobal(false);
    }
  }, [dialogs, searchFilter]);

  useEffect(() => {
    if (onSearchChange) {
      onSearchChange(searchQuery);
    }
    if (!searchQuery.trim()) {
      setSearchMode('local');
      setGlobalSearchResults([]);
      setLocalMessageResults([]);
      setGlobalMessageResults([]);
      setGlobalChatResults([]);
      return;
    }

    const timer = setTimeout(() => {
      performSearch(searchQuery, searchFilter);
    }, 280);

    return () => clearTimeout(timer);
  }, [searchQuery, searchFilter, onSearchChange, performSearch]);

  const performGlobalSearch = async () => {
    if (!searchQuery) return;
    setSearchMode('global');
    performSearch(searchQuery, "global");
  };
  const fetchDialogs = () => {
    fetch(`/api/telegram/dialogs?archived=${viewArchived}`)
      .then(res => res.json())
      .then(data => {
        if (Array.isArray(data)) setDialogs(data);
      })
      .catch(console.error);
  };

  useEffect(() => {
    if (isTelegramConnected) {
      fetchDialogs();
      
      const socket = io();
      socket.on('new_message', (msg) => {
        const msgChatId = msg.chatId?.toString();
        const msgSenderId = msg.senderId?.toString();
        const msgPeerId = msg.peerId?.toString();
        if (msgChatId) localStorage.setItem(`last_online_${msgChatId}`, Date.now().toString());
        if (!msg.out) {
          triggerHaptic("message");
        }
        setDialogs(prev => {
          const updated = [...prev];
          const idx = updated.findIndex(d => {
            const did = d.id?.toString();
            return did === msgChatId ||
                   did === msgSenderId ||
                   did === msgPeerId ||
                   did === `-${msgChatId}` ||
                   did === `-100${msgChatId}` ||
                   `-${did}` === msgChatId ||
                   `-100${did}` === msgChatId;
          });
          if (idx !== -1) {
            updated[idx] = {
              ...updated[idx],
              lastMessage: msg.text || (msg.media ? "[Media]" : ""),
              date: msg.date,
              unreadCount: msg.out ? updated[idx].unreadCount : (updated[idx].unreadCount || 0) + 1
            };
            return updated;
          } else {
            setTimeout(fetchDialogs, 800);
            return prev;
          }
        });
      });

      socket.on('user_typing', (data) => {
         const cid = data?.chatId?.toString();
         if (!cid) return;
         if (data?.isTyping === false) {
           setTypingUsers(current => {
             const newTyping = {...current};
             delete newTyping[cid];
             return newTyping;
           });
           return;
         }
         setTypingUsers(prev => {
            const next = {...prev};
            if (next[cid]) clearTimeout(next[cid]);
            next[cid] = setTimeout(() => {
               setTypingUsers(current => {
                 const newTyping = {...current};
                 delete newTyping[cid];
                 return newTyping;
               });
            }, 6000);
            return next;
         });
      });

      socket.on('user_status_update', (data) => {
        const uId = data?.userId?.toString();
        if (!uId) return;
        setDialogs(prev => {
          const updated = [...prev];
          const idx = updated.findIndex(d => {
            const dId = d.id?.toString();
            return dId === uId || dId === `-${uId}` || dId === `-100${uId}` || (dId && uId === dId.replace(/^-/, "").replace(/^-100/, ""));
          });
          if (idx !== -1) {
            updated[idx] = {
              ...updated[idx],
              isOnline: Boolean(data.isOnline),
              statusStr: data.statusStr
            };
            return updated;
          }
          return prev;
        });
      });

      const interval = setInterval(fetchDialogs, 30000);

      const handleVisibilityChange = () => {
        if (document.visibilityState === "visible") {
          fetchDialogs();
        }
      };
      document.addEventListener("visibilitychange", handleVisibilityChange);

      return () => {
        socket.disconnect();
        clearInterval(interval);
        document.removeEventListener("visibilitychange", handleVisibilityChange);
      };
    }
  }, [isTelegramConnected, viewArchived]);

  useEffect(() => {
    const handleLocalDialogUpdate = (e: any) => {
      const { chatId, text, date } = e.detail;
      setDialogs(prev => {
        const updated = [...prev];
        const idx = updated.findIndex(d => d.id === chatId);
        if (idx !== -1) {
          updated[idx] = {
            ...updated[idx],
            lastMessage: text,
            date: date / 1000
          };
          return updated;
        }
        return prev;
      });
    };
    window.addEventListener("dialog-update", handleLocalDialogUpdate);
    const handleExtraUpdates = () => {
      setUpdateTick((t) => t + 1);
    };
    window.addEventListener("nexus-users-updated", handleExtraUpdates);
    window.addEventListener("chat-note-updated", handleExtraUpdates);
    window.addEventListener("nexus-draft-updated", handleExtraUpdates);
    window.addEventListener("storage", handleExtraUpdates);
    return () => {
      window.removeEventListener("dialog-update", handleLocalDialogUpdate);
      window.removeEventListener("nexus-users-updated", handleExtraUpdates);
      window.removeEventListener("chat-note-updated", handleExtraUpdates);
      window.removeEventListener("nexus-draft-updated", handleExtraUpdates);
      window.removeEventListener("storage", handleExtraUpdates);
    };
  }, []);

  useEffect(() => {
    if (activeId && activeId !== "ai-assistant" && isTelegramConnected) {
      setDialogs((prev) => {
        const activeDialog = prev.find((d) => d.id === activeId);
        if (activeDialog && activeDialog.unreadCount > 0) {
          if (activeDialog.isContact) {
            // Mark as read remotely on the server for Telegram contacts
            fetch(`/api/telegram/messages/${activeId}/read`, {
              method: "POST",
            }).catch(console.error);
          }
          // Instantly update local dialogue's unreadCount to 0 so badge disappears
          return prev.map((d) => (d.id === activeId ? { ...d, unreadCount: 0 } : d));
        }
        return prev;
      });
    }
  }, [activeId, isTelegramConnected]);

  const togglePin = async (chatId: string, pinned: boolean) => {
    try {
      const res = await fetch(`/api/telegram/dialogs/${chatId}/pin`, {
        method: "POST",
        headers:{ "Content-Type" : "application/json" },
        body: JSON.stringify({ pinned: !pinned })
      });
      if (res.ok) {
        setDialogs(prev => prev.map(d => d.id === chatId ? { ...d, pinned: !pinned } : d));
        setSwipedId(null);
      }
    } catch(e) { console.error(e); }
  };

  const getDialogInitials = (title: string) => {
    return title.substring(0, 2).toUpperCase();
  };

  const getDialogColor = (id: string) => {
    const colors = ["bg-red-500", "bg-blue-500", "bg-green-500", "bg-yellow-500", "bg-purple-500", "bg-pink-500", "bg-indigo-500", "bg-teal-500"];
    let hash = 0;
    for (let i = 0; i < id.length; i++) hash = id.charCodeAt(i) + ((hash << 5) - hash);
    return colors[Math.abs(hash) % colors.length];
  };

  const getLocalProfile = (id: string) => {
    try {
      const data = localStorage.getItem(`local_profile_${id}`);
      return data ? JSON.parse(data) : null;
    } catch(e) { return null; }
  };

  const isForumDialog = (d: any) => Boolean(
    d?.isForum || 
    d?.forum || 
    d?.category === "Forum" || 
    d?.type === "forum" ||
    (d?.entity && ((d.entity as any).forum || ((d.entity as any).flags & 1048576))) ||
    (typeof d?.title === "string" && (
      d.title.toLowerCase().includes("forum") || 
      d.title.toLowerCase().includes("форум")
    ))
  );

  const activeAlbum = albums.find(a => a.id === activeAlbumId);
  const sortedDialogs = [...dialogs]
    .filter(d => {
      const isArchived = isChatArchived(d);
      if (activeCategory === "Archive") {
        return isArchived;
      }
      if (isArchived) {
        return false;
      }

      if (activeAlbumId) {
        return activeAlbum?.chatIds?.includes(d.id);
      }
      if (activeCategory === "Albums" || activeCategory === "Notes") {
        return false; // rendered as custom sections below, not as direct dialogue items
      }
      const customSec = customSections.find((s) => s.id === activeCategory);
      if (customSec) {
        return customSec.chatIds.includes(String(d.id));
      }
      return activeCategory === "All" || d.category === activeCategory;
    })
    .filter(d => {
      if (!searchQuery) return true;
      const term = searchQuery.toLowerCase();
      const local = getLocalProfile(d.id);
      const title = local?.name || d.name || d.title;
      return (title && title.toLowerCase().includes(term)) || 
             (d.lastMessage && d.lastMessage.toLowerCase().includes(term));
    })
    .sort((a, b) => {
      // In Archive section, there are NO pinned chats (per user directive)
      if (activeCategory !== "Archive") {
        const localA = getLocalProfile(a.id);
        const localB = getLocalProfile(b.id);
        const pinA = localA?.pinned !== undefined ? localA.pinned : a.pinned;
        const pinB = localB?.pinned !== undefined ? localB.pinned : b.pinned;
        if (pinA !== pinB) return pinA ? -1 : 1;
      }

      // Draft priority: chats with unsent drafts rise to the top just like new incoming messages
      const draftA = localStorage.getItem(`draft_${a.id}`) || "";
      const draftB = localStorage.getItem(`draft_${b.id}`) || "";
      const hasDraftA = Boolean(draftA.trim());
      const hasDraftB = Boolean(draftB.trim());

      const draftTimeA = hasDraftA ? parseInt(localStorage.getItem(`draft_time_${a.id}`) || `${Date.now()}`, 10) : 0;
      const draftTimeB = hasDraftB ? parseInt(localStorage.getItem(`draft_time_${b.id}`) || `${Date.now()}`, 10) : 0;

      const effectiveDateA = Math.max(a.date || 0, Math.floor(draftTimeA / 1000));
      const effectiveDateB = Math.max(b.date || 0, Math.floor(draftTimeB / 1000));

      if (hasDraftA !== hasDraftB) {
        return hasDraftA ? -1 : 1;
      }

      return (effectiveDateB || 0) - (effectiveDateA || 0);
    });

  const getCategoryLabel = (c: string) => {
    const customSec = customSections.find((s) => s.id === c);
    if (customSec) return `${customSec.emoji} ${customSec.name}`;

    switch (c) {
      case "All": return strings.categoryAll || "Все";
      case "Archive": return strings.archive || "Архив";
      case "Albums": return strings.categoryAlbums || "Альбомы";
      case "Notes": return strings.categoryNotes || "Заметки";
      case "Personal": return strings.categoryPersonal || "Личные";
      case "Groups": return strings.categoryGroups || "Группы";
      case "Channels": return strings.categoryChannels || "Каналы";
      case "Bots": return strings.categoryBots || "Боты";
      default: return c;
    }
  };

  return (
    <div className="w-full border-r border-[#0e1621] bg-[#0e1621] flex flex-col h-full z-10 select-none sidebar-glass" data-glass="true">
      {showProfile && (
        <MainProfileModal
          onClose={() => setShowProfile(false)}
          onOpenSettings={() => {
            setShowProfile(false);
            setShowSettings(true);
          }}
          onOpenChat={(chatId, chatType, chatName) => onSelectChat(chatId, chatType, chatName)}
        />
      )}
      {showSettings && <SettingsModal onClose={() => setShowSettings(false)} fps={fps} />}
      {showProxyModal && (
        <ProxySettingsModal
          isOpen={showProxyModal}
          onClose={() => setShowProxyModal(false)}
        />
      )}
      {showAlbumsManager && (
        <AlbumsManagerDialog 
          dialogs={dialogs} 
          albums={albums}
          setAlbums={setAlbums}
          onSelectAlbum={(id) => {
            setActiveAlbumId(id);
            setActiveCategory("Albums");
          }} 
          onClose={() => setShowAlbumsManager(false)} 
        />
      )}

      {/* Stories Modal with real Telegram account stories */}
      {activeStoryIndex !== null && (
        <UserStoriesModal
          initialStoryIndex={activeStoryIndex}
          stories={realStories}
          onClose={() => setActiveStoryIndex(null)}
          onOpenChat={(chatId, chatName) => onSelectChat(chatId, "telegram", chatName)}
        />
      )}

      {/* Create Story Modal */}
      {showCreateStoryModal && (
        <CreateStoryModal
          isOpen={showCreateStoryModal}
          onClose={() => setShowCreateStoryModal(false)}
          onPublish={handlePublishStory}
        />
      )}

      {/* Story Context Modal (Long Press: Edit, Delete, Statistics) */}
      <StoryContextModal
        isOpen={Boolean(selectedContextStory)}
        story={selectedContextStory}
        onClose={() => setSelectedContextStory(null)}
        onUpdateStory={handleUpdateStory}
        onDeleteStory={handleDeleteStory}
        onViewStory={(st) => {
          const matchedIdx = realStories.findIndex((s) => s.id === st.id);
          setActiveStoryIndex(matchedIdx !== -1 ? matchedIdx : 0);
        }}
      />

      {/* Create / Edit Custom Section Modal */}
      {isSectionModalOpen && (
        <CreateSectionModal
          existingSection={editingSection || undefined}
          dialogs={dialogs}
          onSave={(sec) => {
            handleSaveSection(sec);
            setIsSectionModalOpen(false);
          }}
          onDelete={(id) => {
            handleDeleteSection(id);
            setIsSectionModalOpen(false);
          }}
          onClose={() => setIsSectionModalOpen(false)}
        />
      )}

      {/* Section Action Modal (Triggered on long-press or context menu on any category) */}
      {selectedSectionForAction && (
        <SectionActionModal
          isOpen={isSectionActionModalOpen}
          onClose={() => {
            setIsSectionActionModalOpen(false);
            setSectionAnchorPos(null);
          }}
          anchorPosition={sectionAnchorPos}
          section={selectedSectionForAction}
          onEditSection={(sectionId) => {
            const isCustom = customSections.some((s) => s.id === sectionId);
            if (isCustom) {
              const sec = customSections.find((s) => s.id === sectionId);
              if (sec) {
                setEditingSection(sec);
                setIsSectionModalOpen(true);
              }
            } else {
              const matchingChats = dialogs.filter((d) => d.category === sectionId).map((d) => String(d.id));
              setEditingSection({
                id: `custom_${sectionId.toLowerCase()}`,
                name: getCategoryLabel(sectionId).replace(/^[\p{Extended_Pictographic}\u{1F300}-\u{1F9FF}]\s*/u, ""),
                emoji: getCategoryEmoji(sectionId),
                chatIds: matchingChats,
              });
              setIsSectionModalOpen(true);
            }
          }}
          onAddNewSection={() => {
            setEditingSection(null);
            setIsSectionModalOpen(true);
          }}
          onDeleteSection={(sectionId) => {
            handleDeleteSection(sectionId);
          }}
          onMoveSection={(sectionId, direction) => {
            setCategoryOrder((prev) => {
              const withoutArchive = prev.filter((c) => c !== "Archive");
              const idx = withoutArchive.indexOf(sectionId);
              if (idx === -1) return prev;
              const list = [...withoutArchive];
              list.splice(idx, 1);
              if (direction === "first") {
                list.unshift(sectionId);
              } else if (direction === "last") {
                list.push(sectionId);
              } else if (direction === "left") {
                const newIdx = Math.max(0, idx - 1);
                list.splice(newIdx, 0, sectionId);
              } else if (direction === "right") {
                const newIdx = Math.min(list.length, idx + 1);
                list.splice(newIdx, 0, sectionId);
              }
              const result = [...list, "Archive"];
              localStorage.setItem("nexus_category_order", JSON.stringify(result));
              return result;
            });
            triggerHaptic("medium");
          }}
          onMarkAllAsRead={(sectionId) => {
            triggerHaptic("success");
            setDialogs((prev) =>
              prev.map((d) => {
                let matches = false;
                if (sectionId === "All") matches = true;
                else if (sectionId === "Archive") matches = isChatArchived(d);
                else {
                  const customSec = customSections.find((s) => s.id === sectionId);
                  if (customSec) {
                    matches = customSec.chatIds.includes(String(d.id));
                  } else {
                    matches = d.category === sectionId;
                  }
                }
                return matches ? { ...d, unreadCount: 0 } : d;
              })
            );
          }}
        />
      )}
      
      {/* Top Safe Area Spacing for iOS status bar */}
      <div className="w-full shrink-0 h-[env(safe-area-inset-top,0px)] bg-transparent" />
      
      {/* Top Header: Centered Nexusgram and Minimalist Stories Button (hidden when search is active) */}
      {!isSmallSearchVisible && !isSearchExpanded && (
        <div className="p-3 sm:p-4 flex items-center justify-center border-b border-[#17212b]/60 relative select-none">
          {/* Optional Left Action if menu mode is active */}
          <div className="absolute left-3 sm:left-4 flex items-center gap-1.5 z-10">
            {topActionBtn === "menu" && (
              <button
                onClick={() => setShowSettings(true)}
                className="px-3.5 py-1.5 text-gray-300 hover:text-white hover:bg-white/10 rounded-xl transition-all active:scale-90 cursor-pointer"
                title="Главное меню"
              >
                <Menu className="w-5 h-5 text-gray-200" />
              </button>
            )}
          </div>

          {/* Center: Minimalist Stories Button on the LEFT + "Nexusgram" Brand text */}
          <div className="flex items-center justify-center gap-2.5 z-10">
            {/* Minimalist Stories Button (to the LEFT of Nexusgram) */}
            {topActionBtn === "stories" && !showStoriesBar && (
              <motion.button
                layoutId="nexusgram-stories-flow"
                onClick={() => {
                  if (!isOnline || !isTelegramConnected) {
                    triggerHaptic("error");
                    return;
                  }
                  setShowStoriesBar(true);
                  triggerHaptic("medium");
                }}
                whileTap={{ scale: 0.92 }}
                whileHover={{ scale: 1.05 }}
                className={`p-2 rounded-full transition-all cursor-pointer flex items-center justify-center shadow-sm select-none ${
                  !isOnline || !isTelegramConnected
                    ? "bg-amber-500/10 border border-amber-500/30 text-amber-400 shadow-[0_0_12px_rgba(245,158,11,0.2)]"
                    : "bg-white/5 hover:bg-white/10 border border-white/10 text-gray-300 hover:text-white"
                }`}
                title={
                  !isOnline || !isTelegramConnected
                    ? "Нет интернета • Загрузка данных..."
                    : "Истории пользователей (Свайпните легко вверх для открытия)"
                }
              >
                {!isOnline || !isTelegramConnected ? (
                  <div className="flex items-center gap-1.5 px-1">
                    <Loader2 className="w-4 h-4 text-amber-400 animate-spin" />
                    <span className="text-[10px] font-semibold text-amber-400 whitespace-nowrap animate-pulse">
                      Загрузка данных...
                    </span>
                  </div>
                ) : (
                  <Sparkles className="w-4 h-4 text-indigo-400" />
                )}
              </motion.button>
            )}

            <h1 className="font-display font-bold text-gray-100 text-lg tracking-wide bg-gradient-to-r from-white via-indigo-100 to-indigo-300 bg-clip-text text-transparent">
              Nexusgram
            </h1>

            {topActionBtn === "search" && (
              <button
                onClick={() => {
                  setIsHeaderHidden(true);
                  setIsSmallSearchVisible(true);
                  setIsSearchExpanded(false);
                  triggerHaptic("medium");
                  setTimeout(() => searchInputRef.current?.focus(), 50);
                }}
                className="p-1.5 bg-indigo-600/20 hover:bg-indigo-600/30 text-indigo-400 rounded-full transition-transform active:scale-95 flex items-center justify-center cursor-pointer ml-1"
                title="Поиск"
              >
                <Search className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>
      )}

      {/* Stories Bar - Centered without extra text, smooth spring transition from button */}
      <AnimatePresence>
        {showStoriesBar && !isSmallSearchVisible && !isSearchExpanded && (
          <motion.div
            layoutId="nexusgram-stories-flow"
            initial={{ height: 0, opacity: 0, scale: 0.96 }}
            animate={{ height: "auto", opacity: 1, scale: 1 }}
            exit={{ height: 0, opacity: 0, scale: 0.96 }}
            transition={{ type: "spring", stiffness: 380, damping: 28 }}
            className="overflow-hidden border-b border-[#182332]/60 bg-[#101724]/90 backdrop-blur-md px-4 py-3 flex items-center justify-center select-none"
          >
              <div className="flex items-center justify-start sm:justify-center gap-4 overflow-x-auto py-1 px-3 scrollbar-hide max-w-full">
                {/* "+" Create Story Button on the left */}
                <motion.div
                  whileHover={{ scale: 1.06 }}
                  whileTap={{ scale: 0.94 }}
                  onClick={() => {
                    triggerHaptic("medium");
                    setShowCreateStoryModal(true);
                  }}
                  className="flex flex-col items-center gap-1.5 cursor-pointer shrink-0 transition-transform"
                  title="Создать историю"
                >
                  <div className="w-13 h-13 rounded-full p-[2px] border-2 border-dashed border-indigo-400/80 bg-gradient-to-tr from-indigo-600/30 to-blue-500/20 shadow-md flex items-center justify-center relative hover:border-indigo-300">
                    <div className="w-full h-full rounded-full bg-[#181824] flex items-center justify-center text-indigo-400 hover:text-white transition-colors">
                      <Plus className="w-5 h-5 stroke-[2.5]" />
                    </div>
                  </div>
                  <span className="text-[11px] text-indigo-300 max-w-[62px] truncate text-center font-medium">
                    Создать
                  </span>
                </motion.div>

                {realStories.map((story, idx) => {
                  const readIds = (() => {
                    try {
                      return JSON.parse(localStorage.getItem("nexus_read_stories") || "[]");
                    } catch {
                      return [];
                    }
                  })();
                  const isStoryRead = readIds.includes(String(story.id)) || readIds.includes(String(story.userId));
                  return (
                  <motion.div
                    key={story.id}
                    whileHover={{ scale: 1.06 }}
                    whileTap={{ scale: 0.94 }}
                    onClick={() => {
                      setActiveStoryIndex(idx);
                      triggerHaptic("medium");
                    }}
                    onPointerDown={() => {
                      storyLongPressTimerRef.current = window.setTimeout(() => {
                        triggerHaptic("heavy");
                        setSelectedContextStory({ ...story, initialView: "edit" });
                      }, 350);
                    }}
                    onPointerUp={() => {
                      if (storyLongPressTimerRef.current) clearTimeout(storyLongPressTimerRef.current);
                    }}
                    onPointerCancel={() => {
                      if (storyLongPressTimerRef.current) clearTimeout(storyLongPressTimerRef.current);
                    }}
                    onContextMenu={(e) => {
                      e.preventDefault();
                      triggerHaptic("heavy");
                      setSelectedContextStory({ ...story, initialView: "edit" });
                    }}
                    className="flex flex-col items-center gap-1.5 cursor-pointer shrink-0 transition-transform select-none"
                    title={isStoryRead ? "История просмотрена (нажмите для просмотра)" : "Новая история (нажмите для просмотра)"}
                  >
                    <div className="relative">
                      <div className={`w-13 h-13 rounded-full ${
                        isStoryRead
                          ? "p-[2px] border-2 border-dashed border-gray-500 bg-transparent opacity-80"
                          : "p-[2.5px] bg-gradient-to-tr from-amber-400 via-pink-500 to-indigo-600 shadow-md ring-1 ring-pink-500/40"
                      }`}>
                        <div className="w-full h-full rounded-full bg-[#181824] overflow-hidden flex items-center justify-center text-white font-bold text-xs relative">
                          {story.userAvatar ? (
                            <img 
                              src={story.userAvatar} 
                              alt={story.userName} 
                              className="w-full h-full object-cover" 
                              onError={(e) => { e.currentTarget.style.display = "none"; }} 
                            />
                          ) : null}
                          <span className="opacity-90">{story.userName.slice(0, 1)}</span>
                        </div>
                      </div>

                      {/* Story indicator: Initially FULL (vivid dot), EMPTY (hollow circle) when read */}
                      <div
                        className={`absolute -top-1 -right-1 w-4 h-4 rounded-full flex items-center justify-center border-2 border-[#101724] z-20 shadow-sm ${
                          isStoryRead
                            ? "bg-[#101724]/90 border-dashed border-gray-400/90"
                            : "bg-gradient-to-tr from-amber-400 via-pink-500 to-indigo-600 shadow-pink-500/50"
                        }`}
                        title={isStoryRead ? "История просмотрена (пустой индикатор)" : "Новая история (полный индикатор)"}
                      >
                        {isStoryRead ? (
                          <span className="w-1.5 h-1.5 rounded-full border border-gray-400 bg-transparent pointer-events-none" />
                        ) : (
                          <span className="w-1.5 h-1.5 rounded-full bg-white shadow-sm pointer-events-none" />
                        )}
                      </div>
                    </div>
                    <span className={`text-[11px] max-w-[62px] truncate text-center font-medium ${isStoryRead ? "text-gray-400" : "text-gray-200"}`}>
                      {story.userName.split(" ")[0]}
                    </span>
                  </motion.div>
                  );
                })}
              </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Search Input - Appears when swiping down (Small) or strong swipe up (Large) */}
      <AnimatePresence>
        {(isSmallSearchVisible || isSearchExpanded) && (
          <motion.div
            initial={{ height: 0, opacity: 0, y: -10 }}
            animate={{ height: "auto", opacity: 1, y: 0 }}
            exit={{ height: 0, opacity: 0, y: -10 }}
            transition={{ type: "spring", stiffness: 400, damping: 30 }}
            className={`overflow-hidden border-b border-[#182332] bg-[#0e1621] relative ${
              isSearchExpanded ? "px-4 py-3" : "px-3 py-2"
            }`}
          >
            {/* Shimmer light effect */}
            <div className="absolute inset-0 pointer-events-none bg-gradient-to-r from-transparent via-indigo-500/5 to-transparent animate-pulse" />

            <div className="flex items-center gap-2 relative z-10">
              <div className={`relative flex-1 ${isSearchExpanded ? "text-sm" : "text-xs"}`}>
                <Search className={`absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 ${
                  isSearchExpanded ? "w-5 h-5 left-3.5 text-indigo-400" : "w-4 h-4"
                }`} />
                <input
                  ref={searchInputRef}
                  type="text"
                  placeholder={isSearchExpanded ? "Поиск по чатам, сообщениям и контактам..." : "Поиск..."}
                  value={searchQuery}
                  onChange={(e) => {
                    const val = e.target.value;
                    setSearchQuery(val);
                    if (isAiSearchActive && val.trim()) {
                      performAiSearch(val);
                    }
                  }}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && searchQuery.trim()) {
                      recordRecentSearch({
                        title: searchQuery.trim(),
                        subtitle: "Поисковый запрос",
                        type: "query",
                      });
                    }
                  }}
                  className={`w-full bg-[#172230] border text-gray-200 placeholder-gray-500 focus:outline-none focus:border-indigo-500 transition-all ${
                    isSearchExpanded
                      ? "rounded-2xl py-2.5 pl-11 pr-9 text-sm border-indigo-500/40 shadow-lg shadow-indigo-500/10 ring-1 ring-indigo-500/20"
                      : "rounded-xl py-1.5 pl-9 pr-8 text-xs border-[#243346]"
                  }`}
                />
                {searchQuery && (
                  <button
                    onClick={() => {
                      setSearchQuery("");
                      setAiSearchResults([]);
                    }}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-white p-0.5 rounded-full cursor-pointer"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>

              {/* AI Semantic Search Button */}
              {isSearchExpanded && (
                <button
                  type="button"
                  onClick={() => {
                    triggerHaptic("medium");
                    const next = !isAiSearchActive;
                    setIsAiSearchActive(next);
                    if (next && searchQuery.trim()) {
                      performAiSearch(searchQuery);
                    }
                  }}
                  className={`px-3 py-2 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer shrink-0 border shadow-sm ${
                    isAiSearchActive
                      ? "bg-gradient-to-r from-purple-600 via-indigo-600 to-blue-600 text-white border-purple-400 shadow-purple-500/25 ring-1 ring-purple-400/50"
                      : "bg-[#172230] text-gray-400 hover:text-white border-[#243346] hover:bg-[#1f2d40]"
                  }`}
                  title="Семантический поиск нейросетью по смыслу"
                >
                  <Sparkles className={`w-3.5 h-3.5 ${isAiSearchActive ? "text-amber-300 animate-pulse" : "text-gray-400"}`} />
                  <span className="hidden sm:inline">Нейросеть</span>
                </button>
              )}

              <button
                onClick={() => {
                  setIsSearchExpanded(false);
                  setIsSmallSearchVisible(false);
                  setIsHeaderHidden(false);
                  setSearchQuery("");
                  setIsAiSearchActive(false);
                  setAiSearchResults([]);
                  searchInputRef.current?.blur();
                  triggerHaptic("light");
                }}
                className="text-xs font-semibold text-indigo-400 hover:text-indigo-300 px-3 py-2 rounded-xl bg-indigo-500/10 hover:bg-indigo-500/20 cursor-pointer shrink-0 transition-colors"
              >
                Отмена
              </button>
            </div>

            {/* If expanded search and NOT yet in global search: show horizontal avatar list of frequent contacts/channels */}
            {isSearchExpanded && searchMode !== "global" && (
              <div className="pt-2 border-t border-[#182332]/80 mt-2">
                <span className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider px-1 block mb-1.5">
                  Частые контакты и каналы
                </span>
                <div className="flex items-center gap-3 overflow-x-auto scrollbar-hide py-1 px-1 select-none touch-pan-x">
                  {frequentDialogs.map((d) => {
                    const local = getLocalProfile(d.id);
                    const title = local?.name || d.name || d.title || "Чат";
                    return (
                      <div
                        key={`freq_${d.id}`}
                        onClick={() => {
                          triggerHaptic("light");
                          onSelectChat(d.id, "telegram", title, true);
                          recordRecentSearch({
                            title,
                            subtitle: d.lastMessage || `@${d.username}`,
                            type: "chat",
                            avatar: `/api/telegram/avatar/${d.id}`,
                            chatId: d.id,
                          });
                        }}
                        className="flex flex-col items-center gap-1.5 cursor-pointer shrink-0 group active:scale-95 transition-transform"
                      >
                        <div className="relative w-16 h-16 rounded-full bg-[#181824] border-0 flex items-center justify-center overflow-hidden shadow-md">
                          <span className="text-sm font-bold text-gray-200">
                            {getDialogInitials(title)}
                          </span>
                          <img
                            src={`/api/telegram/avatar/${d.id}`}
                            className="w-full h-full object-cover absolute inset-0"
                            onError={(e) => {
                              e.currentTarget.style.display = "none";
                            }}
                          />
                          {d.isOnline && (
                            <span className="absolute bottom-0.5 right-0.5 w-3.5 h-3.5 bg-emerald-500 rounded-full border-2 border-[#0e1621]" />
                          )}
                        </div>
                        <span className="text-[11px] text-gray-300 font-medium truncate max-w-[68px] text-center">
                          {title}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Tabs / Categories Row - Horizontally scrollable, long-press to manage, drag to reposition */}
      {!isSmallSearchVisible && !isSearchExpanded && (
        <div 
          ref={categoriesContainerRef}
          onWheel={(e) => {
            if (e.deltaY !== 0) {
              e.currentTarget.scrollLeft += e.deltaY;
            }
          }}
          className="px-3 sm:px-4 py-2.5 flex items-center gap-2 overflow-x-auto scrollbar-hide border-b border-[#17212b]/60 select-none relative touch-pan-x"
          style={{ WebkitOverflowScrolling: "touch" }}
        >
          {/* Slot: Profile button with gradient ring */}
          <div className="relative shrink-0 flex items-center gap-1.5">
            <div className="p-[1.5px] rounded-full bg-gradient-to-tr from-blue-500 via-indigo-500 to-purple-600 shadow-sm">
              <button
                onClick={() => isTelegramConnected && setShowProfile(true)}
                className="w-8 h-8 rounded-full bg-[#2481cc] flex items-center justify-center text-white text-xs font-bold hover:scale-105 transition-transform active:scale-90 cursor-pointer"
                title="Профиль"
              >
                <User className="w-4 h-4" />
              </button>
            </div>

            {/* Proxy Indicator next to profile button */}
            {proxyConfig.enabled && (
              <button
                onClick={() => {
                  triggerHaptic("light");
                  setShowProxyModal(true);
                }}
                className="h-8 px-2.5 rounded-full bg-emerald-500/15 border border-emerald-500/35 text-emerald-400 hover:bg-emerald-500/25 flex items-center gap-1.5 shadow-sm transition-all cursor-pointer hover:scale-105 active:scale-95 shrink-0"
                title="Прокси подключен: нажмите для настроек и статистики серверов"
              >
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-400 animate-pulse" />
                <span className="text-[10px] font-mono font-bold text-emerald-300">
                  {proxyConfig.ping || 34}ms
                </span>
              </button>
            )}
          </div>

          {/* Horizontally scrollable categories: long-press opens SectionActionModal, dragging reorders */}
          {categoryOrder.map((c) => {
            const isCustom = customSections.some((s) => s.id === c);
            const label = getCategoryLabel(c);
            const isActive = activeCategory === c;
            const isDraggingThis = activeDragCategory === c;

            return (
              <div
                key={c}
                data-category={c}
                onTouchStart={(e) => {
                  const touch = e.touches[0];
                  if (!touch) return;
                  pointerStartPosRef.current = { x: touch.clientX, y: touch.clientY };
                  if (categoryLongPressTimerRef.current) clearTimeout(categoryLongPressTimerRef.current);
                  categoryLongPressTimerRef.current = window.setTimeout(() => {
                    pointerStartPosRef.current = null;
                    openSectionActionModal(c, touch.clientX, touch.clientY);
                  }, 350);
                }}
                onTouchMove={(e) => {
                  if (pointerStartPosRef.current) {
                    const touch = e.touches[0];
                    if (!touch) return;
                    const dx = touch.clientX - pointerStartPosRef.current.x;
                    const dy = touch.clientY - pointerStartPosRef.current.y;
                    if (Math.abs(dx) > 8 || Math.abs(dy) > 8) {
                      if (categoryLongPressTimerRef.current) {
                        clearTimeout(categoryLongPressTimerRef.current);
                        categoryLongPressTimerRef.current = null;
                      }
                      setIsSectionActionModalOpen(false);
                      setSelectedSectionForAction(null);
                      if (c !== "Archive" && !activeDragCategory) {
                        setActiveDragCategory(c);
                        triggerHaptic("medium");
                      }
                    }
                  } else {
                    // Already held and now moved: dismiss popup immediately!
                    setIsSectionActionModalOpen(false);
                    setSelectedSectionForAction(null);
                    if (c !== "Archive" && !activeDragCategory) {
                      setActiveDragCategory(c);
                    }
                  }
                }}
                onTouchEnd={() => {
                  if (categoryLongPressTimerRef.current) {
                    clearTimeout(categoryLongPressTimerRef.current);
                    categoryLongPressTimerRef.current = null;
                  }
                  pointerStartPosRef.current = null;
                  if (activeDragCategory) {
                    setActiveDragCategory(null);
                    setDragPointerPos(null);
                  }
                }}
                onTouchCancel={() => {
                  if (categoryLongPressTimerRef.current) {
                    clearTimeout(categoryLongPressTimerRef.current);
                    categoryLongPressTimerRef.current = null;
                  }
                  pointerStartPosRef.current = null;
                  if (activeDragCategory) {
                    setActiveDragCategory(null);
                    setDragPointerPos(null);
                  }
                }}
                onMouseDown={(e) => {
                  if (e.button !== 0) return;
                  pointerStartPosRef.current = { x: e.clientX, y: e.clientY };
                  if (categoryLongPressTimerRef.current) clearTimeout(categoryLongPressTimerRef.current);
                  categoryLongPressTimerRef.current = window.setTimeout(() => {
                    pointerStartPosRef.current = null;
                    openSectionActionModal(c, e.clientX, e.clientY);
                  }, 350);
                }}
                onMouseMove={(e) => {
                  if (pointerStartPosRef.current) {
                    const dx = e.clientX - pointerStartPosRef.current.x;
                    const dy = e.clientY - pointerStartPosRef.current.y;
                    if (Math.abs(dx) > 8 || Math.abs(dy) > 8) {
                      if (categoryLongPressTimerRef.current) {
                        clearTimeout(categoryLongPressTimerRef.current);
                        categoryLongPressTimerRef.current = null;
                      }
                      setIsSectionActionModalOpen(false);
                      setSelectedSectionForAction(null);
                      if (c !== "Archive" && !activeDragCategory) {
                        setActiveDragCategory(c);
                        triggerHaptic("medium");
                      }
                    }
                  } else if (activeDragCategory) {
                    setIsSectionActionModalOpen(false);
                    setSelectedSectionForAction(null);
                  }
                }}
                onMouseUp={() => {
                  if (categoryLongPressTimerRef.current) {
                    clearTimeout(categoryLongPressTimerRef.current);
                    categoryLongPressTimerRef.current = null;
                  }
                  pointerStartPosRef.current = null;
                  if (activeDragCategory) {
                    setActiveDragCategory(null);
                    setDragPointerPos(null);
                  }
                }}
                onMouseLeave={() => {
                  if (categoryLongPressTimerRef.current) {
                    clearTimeout(categoryLongPressTimerRef.current);
                    categoryLongPressTimerRef.current = null;
                  }
                  pointerStartPosRef.current = null;
                }}
                onClick={() => {
                  if (!activeDragCategory) {
                    setActiveCategory(c);
                    triggerHaptic("light");
                  }
                }}
                onContextMenu={(e) => {
                  e.preventDefault();
                  if (categoryLongPressTimerRef.current) {
                    clearTimeout(categoryLongPressTimerRef.current);
                    categoryLongPressTimerRef.current = null;
                  }
                  openSectionActionModal(c);
                }}
                className={`px-4 py-2 rounded-2xl text-sm font-semibold whitespace-nowrap transition-all cursor-pointer shrink-0 select-none flex items-center gap-1.5 touch-pan-x ${
                  isDraggingThis
                    ? "bg-indigo-500/80 text-white scale-105 shadow-xl ring-2 ring-indigo-400 z-20"
                    : isActive
                    ? "bg-indigo-600 text-white shadow-md shadow-indigo-600/30"
                    : "bg-[#182332] text-gray-300 hover:text-white hover:bg-[#202e42]"
                }`}
                title={isCustom ? "Нажмите для выбора, зажмите для настройки папки, потяните для перемещения" : "Нажмите для выбора, зажмите для информации и управления, потяните для перемещения"}
              >
                <span>{label}</span>
              </div>
            );
          })}

          {/* "+" Button to create custom sections */}
          <button
            onClick={() => {
              setEditingSection(null);
              setIsSectionModalOpen(true);
              triggerHaptic("medium");
            }}
            className="w-9 h-9 rounded-2xl bg-indigo-600/20 hover:bg-indigo-600/30 text-indigo-400 border border-indigo-500/30 flex items-center justify-center shrink-0 transition-all active:scale-90 cursor-pointer ml-1"
            title="Создать свой раздел (сгруппировать чаты)"
          >
            <Plus className="w-4 h-4 stroke-[2.5]" />
          </button>
        </div>
      )}

      {activeAlbumId && (
        <div className="mx-4 my-2 px-3 py-2 bg-indigo-500/10 border border-indigo-500/20 rounded-xl flex items-center justify-between">
          <div className="flex items-center gap-2 min-w-0">
            <button onClick={() => setActiveAlbumId(null)} className="p-1 hover:bg-[#161622] rounded-lg text-indigo-400 hover:text-indigo-350 transition-colors">
              <ChevronLeft className="w-4 h-4" />
            </button>
            <div className="min-w-0">
              <span className="text-[9px] text-indigo-400 font-bold uppercase tracking-wide block leading-none">Альбом</span>
              <span className="text-gray-100 font-medium text-xs truncate block mt-0.5">{activeAlbum?.name}</span>
            </div>
          </div>
          <button 
            onClick={() => {
              if (confirm(`Удалить альбом "${activeAlbum?.name}"?`)) {
                const refreshed = albums.filter(a => a.id !== activeAlbumId);
                setAlbums(refreshed);
                localStorage.setItem("nexus_albums", JSON.stringify(refreshed));
                setActiveAlbumId(null);
              }
            }}
            className="p-1 hover:bg-red-500/10 rounded text-gray-500 hover:text-red-400 transition-colors"
          >
            <Trash className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* Chat List */}
      <div className="flex-1 relative overflow-hidden flex flex-col">
        <div 
          ref={sidebarListRef}
          onScroll={handleSidebarScroll}
          onTouchStart={handleTouchStart}
          onTouchMove={handleTouchMove}
          onTouchEnd={handleTouchEnd}
          onWheel={handleWheel}
          className="flex-1 overflow-y-auto overflow-x-hidden gpu-accelerated scrollbar-thin scrollbar-thumb-zinc-800 pb-1.5"
          style={{ WebkitOverflowScrolling: 'touch' }}
        >
        {searchQuery.trim() ? (
          /* ================= UNIFIED SEARCH RESULTS (CHATS + LOCAL MESSAGES + GLOBAL MESSAGES + CHANNELS) ================= */
          <div className="p-2 space-y-3 animate-fade-in pb-2">
            {/* Loading indicator */}
            {(isSearchingMessages || isSearchingGlobal || isSearchingAi) && (
              <div className="flex items-center justify-center gap-2 p-3 text-xs text-indigo-400 bg-indigo-500/10 rounded-2xl border border-indigo-500/20 mx-1">
                <Loader2 className="w-4 h-4 animate-spin" />
                <span className="font-medium">
                  {isSearchingAi ? "Нейросеть ищет смысловые совпадения..." : "Ищем сообщения и каналы в Telegram..."}
                </span>
              </div>
            )}

            {/* AI Semantic Search Results */}
            {isAiSearchActive && (
              <div className="space-y-2 p-3 bg-gradient-to-br from-purple-950/40 via-[#131728] to-[#0e1621] border border-purple-500/35 rounded-2xl shadow-lg">
                <div className="flex items-center justify-between px-1">
                  <span className="flex items-center gap-1.5 text-xs font-bold text-purple-300 uppercase tracking-wider">
                    <Sparkles className="w-3.5 h-3.5 text-amber-300 animate-pulse" />
                    Поиск нейросетью ({aiSearchResults.length})
                  </span>
                  {isSearchingAi && (
                    <div className="flex items-center gap-1 text-[11px] text-purple-300">
                      <Loader2 className="w-3 h-3 animate-spin text-purple-400" />
                      <span>Анализ...</span>
                    </div>
                  )}
                </div>

                {isSearchingAi ? (
                  <div className="py-6 flex flex-col items-center justify-center gap-2 text-xs text-purple-300">
                    <Loader2 className="w-6 h-6 animate-spin text-indigo-400" />
                    <span>Нейросеть сканирует контекст сообщений...</span>
                  </div>
                ) : aiSearchResults.length === 0 ? (
                  <div className="py-4 px-3 text-center text-xs text-gray-400 bg-black/20 rounded-xl">
                    <p>По запросу «{searchQuery}» нейросеть не нашла косвенных совпадений.</p>
                  </div>
                ) : (
                  <div className="space-y-2">
                    {aiSearchResults.map((match, idx) => (
                      <div
                        key={`ai_match_${match.id || idx}`}
                        onClick={() => {
                          triggerHaptic("light");
                          onSelectChat(match.chatId || "ai-assistant", "telegram", match.chatTitle || "Чат", true);
                          recordRecentSearch({
                            title: match.chatTitle || "Сообщение",
                            subtitle: match.text || match.explanation,
                            type: "message",
                            avatar: match.chatId ? `/api/telegram/avatar/${match.chatId}` : undefined,
                            chatId: match.chatId,
                          });
                        }}
                        className="p-3 rounded-2xl bg-[#141b26] hover:bg-[#1a2434] border border-purple-500/25 hover:border-purple-500/50 transition-all cursor-pointer space-y-1.5 shadow-sm"
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2.5 min-w-0">
                            <div className="w-8 h-8 rounded-full bg-purple-900/50 flex items-center justify-center text-xs font-bold text-purple-200 overflow-hidden shrink-0 border border-purple-500/30">
                              {match.chatId && (
                                <img
                                  src={`/api/telegram/avatar/${match.chatId}`}
                                  className="w-full h-full object-cover"
                                  onError={(e) => { e.currentTarget.style.display = 'none'; }}
                                />
                              )}
                              <span>{(match.chatTitle || "Ч").slice(0, 1).toUpperCase()}</span>
                            </div>
                            <div className="min-w-0">
                              <span className="text-xs font-bold text-white truncate block">{match.chatTitle || "Чат"}</span>
                              {match.sender && <span className="text-[10px] text-gray-400 truncate block">{match.sender}</span>}
                            </div>
                          </div>
                          {match.relevanceScore && (
                            <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-purple-500/20 text-purple-300 border border-purple-500/30 shrink-0">
                              {Math.round(match.relevanceScore * 100)}% релевантность
                            </span>
                          )}
                        </div>
                        {match.text && (
                          <p className="text-xs text-gray-200 line-clamp-2 pl-2.5 border-l-2 border-purple-400 leading-relaxed">
                            {match.text}
                          </p>
                        )}
                        {match.explanation && (
                          <div className="text-[11px] text-amber-300/95 bg-amber-400/10 px-2.5 py-1 rounded-xl flex items-center gap-1.5">
                            <Sparkles className="w-3 h-3 text-amber-400 shrink-0" />
                            <span>{match.explanation}</span>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* SECTION 1: Matching Local Chats & Contacts */}
            {(searchFilter === "all" || searchFilter === "chats") && sortedDialogs.length > 0 && (
              <div className="space-y-1">
                <div className="flex items-center justify-between px-3 py-1 text-xs font-bold text-gray-400 uppercase tracking-wider">
                  <span className="flex items-center gap-1.5">
                    <Users className="w-3.5 h-3.5 text-indigo-400" />
                    Чаты и контакты ({sortedDialogs.length})
                  </span>
                </div>
                {sortedDialogs.map((d) => {
                  const local = getLocalProfile(d.id);
                  const title = local?.name || d.name || d.title;
                  return (
                    <motion.div
                      key={`local_chat_${d.id}`}
                      onClick={() => {
                        triggerHaptic("light");
                        onSelectChat(d.id, "telegram", title, true);
                        recordRecentSearch({
                          title,
                          subtitle: d.lastMessage || `@${d.username}`,
                          type: "chat",
                          avatar: `/api/telegram/avatar/${d.id}`,
                          chatId: d.id,
                        });
                      }}
                      className={`flex items-center gap-3 p-3 rounded-2xl cursor-pointer transition-all border ${
                        activeId === d.id
                          ? "bg-indigo-600/20 border-indigo-500/30"
                          : "border-transparent hover:bg-[#151f2c] hover:border-[#223145]"
                      }`}
                    >
                      <div className="w-12 h-12 rounded-full bg-[#181824] flex items-center justify-center shrink-0 border-0 text-gray-300 relative overflow-hidden">
                        <span className="text-white font-semibold text-sm">{getDialogInitials(title || "U")}</span>
                        <img
                          src={`/api/telegram/avatar/${d.id}`}
                          className="w-full h-full object-cover absolute inset-0"
                          onError={(e) => { e.currentTarget.style.display = 'none'; }}
                        />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between">
                          <h4 className="font-bold text-gray-100 text-sm truncate">
                            {highlightText(title, searchQuery)}
                          </h4>
                          {d.date && (
                            <span className="text-[11px] text-gray-400 shrink-0 ml-2">
                              {formatDialogTime(d.date)}
                            </span>
                          )}
                        </div>
                        <p className="text-xs text-gray-400 truncate mt-0.5">
                          {d.lastMessage ? highlightText(d.lastMessage, searchQuery) : d.username ? `@${d.username}` : "Нет сообщений"}
                        </p>
                      </div>
                      {d.unreadCount > 0 && (
                        <span className="text-xs px-2 py-0.5 rounded-full bg-indigo-600 text-white font-bold shrink-0">
                          {d.unreadCount}
                        </span>
                      )}
                    </motion.div>
                  );
                })}
              </div>
            )}

            {/* Prominent Global Search Button when in local search mode */}
            {isSearchExpanded && searchMode !== "global" && (
              <button
                onClick={() => {
                  setSearchMode("global");
                  performSearch(searchQuery, "all");
                  triggerHaptic("medium");
                }}
                className="w-full py-3 px-4 rounded-2xl bg-indigo-600/20 hover:bg-indigo-600/30 text-indigo-300 border border-indigo-500/30 font-semibold text-xs flex items-center justify-center gap-2 cursor-pointer transition-all active:scale-[0.98] shadow-lg shadow-indigo-600/10 my-2"
              >
                <Globe className="w-4 h-4 text-indigo-400" />
                <span>Глобальный поиск</span>
              </button>
            )}

            {/* Global Search Results - Only visible when global search is activated */}
            {isSearchExpanded && searchMode === "global" && (
              <>
                {/* SECTION 2: Messages in Local Chats */}
                {(searchFilter === "all" || searchFilter === "messages") && localMessageResults.length > 0 && (
                  <div className="space-y-1 pt-1">
                    <div className="flex items-center justify-between px-3 py-1 text-xs font-bold text-gray-400 uppercase tracking-wider">
                      <span className="flex items-center gap-1.5">
                        <MessageSquare className="w-3.5 h-3.5 text-blue-400" />
                        Сообщения в чатах ({localMessageResults.length})
                      </span>
                    </div>
                    {localMessageResults.map((msg) => (
                      <div
                        key={`loc_msg_${msg.id}_${msg.chatId}`}
                        onClick={() => {
                          triggerHaptic("light");
                          onSelectChat(msg.chatId, "telegram", msg.chatTitle, true);
                          recordRecentSearch({
                            title: msg.chatTitle,
                            subtitle: msg.text,
                            type: "message",
                            avatar: msg.chatAvatar || `/api/telegram/avatar/${msg.chatId}`,
                            chatId: msg.chatId,
                          });
                        }}
                        className="p-3 rounded-2xl bg-[#141e2b]/70 hover:bg-[#1a283a] border border-[#213246]/60 transition-all cursor-pointer space-y-1.5"
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2.5 min-w-0">
                            <div className="w-8 h-8 rounded-full bg-[#182332] text-white font-bold flex items-center justify-center text-xs overflow-hidden shrink-0 border border-[#2a3c52]">
                              <img
                                src={msg.chatAvatar || `/api/telegram/avatar/${msg.chatId}`}
                                className="w-full h-full object-cover"
                                onError={(e) => { e.currentTarget.style.display = 'none'; }}
                              />
                              <span className="opacity-90">{msg.chatTitle.slice(0, 1).toUpperCase()}</span>
                            </div>
                            <div className="min-w-0">
                              <h4 className="text-xs font-bold text-white truncate">{msg.chatTitle}</h4>
                              <span className="text-[11px] text-gray-400 block truncate">{msg.senderName}</span>
                            </div>
                          </div>
                          <span className="text-[11px] text-gray-400 shrink-0 ml-2">
                            {new Date(msg.date).toLocaleDateString([], { month: 'short', day: 'numeric' })}
                          </span>
                        </div>
                        <p className="text-xs text-gray-300 line-clamp-2 leading-relaxed pl-3 border-l-2 border-indigo-500/50">
                          {highlightText(msg.text, searchQuery)}
                        </p>
                      </div>
                    ))}
                  </div>
                )}

                {/* SECTION 3: Global Messages across Telegram */}
                {(searchFilter === "all" || searchFilter === "messages" || searchFilter === "global" || searchFilter === "media") && globalMessageResults.length > 0 && (
                  <div className="space-y-1 pt-1">
                    <div className="flex items-center justify-between px-3 py-1 text-xs font-bold text-indigo-400 uppercase tracking-wider">
                      <span className="flex items-center gap-1.5">
                        <Globe className="w-3.5 h-3.5 text-indigo-400" />
                        Глобальные сообщения ({globalMessageResults.length})
                      </span>
                    </div>
                    {globalMessageResults.map((msg) => (
                      <div
                        key={`glob_msg_${msg.id}_${msg.chatId}`}
                        onClick={() => {
                          triggerHaptic("light");
                          onSelectChat(msg.chatId, "telegram", msg.chatTitle, true);
                          recordRecentSearch({
                            title: msg.chatTitle,
                            subtitle: msg.text || (msg.mediaType ? `[${msg.mediaType}]` : "Медиафайл"),
                            type: "message",
                            avatar: msg.chatAvatar,
                            chatId: msg.chatId,
                          });
                        }}
                        className="p-3 rounded-2xl bg-[#131c28] hover:bg-[#192638] border border-indigo-500/20 hover:border-indigo-500/40 transition-all cursor-pointer space-y-1.5"
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2.5 min-w-0">
                            <div className="w-8 h-8 rounded-full bg-indigo-900/40 text-indigo-200 font-bold flex items-center justify-center text-xs overflow-hidden shrink-0 border border-indigo-500/30">
                              {msg.chatAvatar ? (
                                <img
                                  src={msg.chatAvatar}
                                  className="w-full h-full object-cover"
                                  onError={(e) => { e.currentTarget.style.display = 'none'; }}
                                />
                              ) : (
                                <span>{msg.chatTitle.slice(0, 1).toUpperCase()}</span>
                              )}
                            </div>
                            <div className="min-w-0">
                              <h4 className="text-xs font-bold text-white truncate flex items-center gap-1.5">
                                {msg.chatTitle}
                                <span className="text-[9px] px-1.5 py-0.2 rounded bg-indigo-500/20 text-indigo-300 font-medium">
                                  Публичный
                                </span>
                              </h4>
                              {msg.chatUsername && (
                                <span className="text-[11px] text-indigo-400 block truncate">
                                  @{msg.chatUsername}
                                </span>
                              )}
                            </div>
                          </div>
                          <div className="text-right shrink-0 ml-2">
                            <span className="text-[11px] text-gray-400 block">
                              {new Date(msg.date).toLocaleDateString([], { month: 'short', day: 'numeric' })}
                            </span>
                            {msg.mediaType && (
                              <span className="text-[10px] text-indigo-300 font-medium capitalize">
                                {msg.mediaType === "photo" ? "📷 Фото" : msg.mediaType === "video" ? "🎥 Видео" : msg.mediaType === "audio" ? "🎵 Аудио" : "📎 Файл"}
                              </span>
                            )}
                          </div>
                        </div>
                        <p className="text-xs text-gray-300 line-clamp-2 leading-relaxed pl-3 border-l-2 border-indigo-400/60">
                          {highlightText(msg.text || (msg.mediaType ? `[${msg.mediaType}]` : "Медиафайл"), searchQuery)}
                        </p>
                      </div>
                    ))}
                  </div>
                )}

                {/* SECTION 4: Public Channels, Groups & Bots */}
                {(searchFilter === "all" || searchFilter === "channels" || searchFilter === "global" || searchFilter === "chats") && globalChatResults.length > 0 && (
                  <div className="space-y-1 pt-1">
                    <div className="flex items-center justify-between px-3 py-1 text-xs font-bold text-gray-400 uppercase tracking-wider">
                      <span className="flex items-center gap-1.5">
                        <Radio className="w-3.5 h-3.5 text-pink-400" />
                        Публичные каналы и боты ({globalChatResults.length})
                      </span>
                    </div>
                    {globalChatResults.map((result) => (
                      <motion.div
                        key={`glob_chat_${result.id}`}
                        onClick={() => {
                          triggerHaptic("light");
                          onSelectChat(result.id, "telegram", result.name, true);
                          recordRecentSearch({
                            title: result.name,
                            subtitle: result.username ? `@${result.username}` : (result.isChannel ? "Канал" : "Чат"),
                            type: "channel",
                            avatar: `/api/telegram/avatar/${result.id}`,
                            chatId: result.id,
                          });
                        }}
                        className="flex items-center gap-3 p-3 rounded-2xl cursor-pointer transition-all border border-transparent hover:bg-[#151f2c] hover:border-[#223145]"
                      >
                        <div className="w-12 h-12 rounded-full bg-[#181824] flex items-center justify-center shrink-0 border border-[#2a2a38] text-gray-300 relative overflow-hidden">
                          <span className="text-white font-semibold text-sm">{getDialogInitials(result.name || "U")}</span>
                          <img
                            src={`/api/telegram/avatar/${result.id}`}
                            className="w-full h-full object-cover absolute inset-0"
                            onError={(e) => { e.currentTarget.style.display = 'none'; }}
                          />
                        </div>
                        <div className="flex-1 min-w-0">
                          <h3 className="font-bold text-gray-200 text-sm truncate">
                            {highlightText(result.name, searchQuery)}
                          </h3>
                          {result.username && (
                            <p className="text-xs text-indigo-400 truncate mt-0.5">
                              @{highlightText(result.username, searchQuery)}
                            </p>
                          )}
                        </div>
                      </motion.div>
                    ))}
                  </div>
                )}
              </>
            )}

            {/* Empty state if nothing matches */}
            {!isSearchingMessages && !isSearchingGlobal &&
              sortedDialogs.length === 0 &&
              localMessageResults.length === 0 &&
              globalMessageResults.length === 0 &&
              globalChatResults.length === 0 && (
                <div className="text-center py-16 px-4 space-y-3 select-none">
                  <div className="w-14 h-14 mx-auto rounded-full bg-[#16212e] flex items-center justify-center text-gray-400">
                    <Search className="w-6 h-6 text-gray-400" />
                  </div>
                  <h3 className="text-sm font-bold text-gray-200">Ничего не найдено</h3>
                  <p className="text-xs text-gray-400 max-w-xs mx-auto">
                    По запросу «{searchQuery}» ничего не найдено. Попробуйте сменить фильтр или ключевые слова.
                  </p>
                  {searchMode !== "global" && (
                    <button
                      onClick={() => {
                        setSearchMode("global");
                        performSearch(searchQuery, "all");
                        triggerHaptic("medium");
                      }}
                      className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold rounded-xl transition-all cursor-pointer active:scale-95 shadow-md shadow-indigo-600/30 inline-flex items-center gap-2"
                    >
                      <Globe className="w-3.5 h-3.5" />
                      Искать глобально по всему Telegram
                    </button>
                  )}
                </div>
            )}
          </div>
        ) : isSearchExpanded && !searchQuery ? (
          /* ================= RECENT SEARCHES LIST ================= */
          <div className="p-2 space-y-1 animate-fade-in">
            <div className="flex items-center justify-between px-3 py-2 text-xs font-semibold text-gray-400">
              <span className="flex items-center gap-1.5">
                <History className="w-3.5 h-3.5 text-indigo-400" />
                Недавние поиски
              </span>
              {recentSearches.length > 0 && (
                <button
                  onClick={() => {
                    setRecentSearches([]);
                    localStorage.removeItem("nexus_recent_searches");
                    triggerHaptic("light");
                  }}
                  className="text-[11px] text-gray-500 hover:text-rose-400 transition-colors cursor-pointer"
                >
                  Очистить
                </button>
              )}
            </div>

            {recentSearches.length === 0 ? (
              <div className="text-center py-12 text-gray-500 text-xs select-none">
                История поиска пуста
              </div>
            ) : (
              recentSearches.map((item) => (
                <div
                  key={item.id}
                  onClick={() => {
                    if (item.chatId) {
                      onSelectChat(item.chatId, "telegram", item.title, true);
                    } else if (item.query) {
                      setSearchQuery(item.query);
                    }
                    triggerHaptic("light");
                  }}
                  className="flex items-center justify-between p-3 rounded-2xl hover:bg-[#151f2c] cursor-pointer transition-colors border border-transparent hover:border-[#223145] relative group"
                >
                  <div className="flex items-center gap-3 min-w-0 flex-1">
                    <div className="w-13 h-13 rounded-full bg-[#1d2b3c] flex items-center justify-center shrink-0 border border-[#2b3c50] overflow-hidden relative">
                      {item.avatar ? (
                        <img src={item.avatar} className="w-full h-full object-cover" onError={(e) => { e.currentTarget.style.display = "none"; }} />
                      ) : (
                        <span className="text-white font-bold text-base">{getDialogInitials(item.title)}</span>
                      )}
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center justify-between pr-2">
                        <h4 className="text-sm font-semibold text-white truncate">{item.title}</h4>
                        {/* Corner match ratio for message searches */}
                        {item.type === "message" && (
                          <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-md bg-indigo-600/30 text-indigo-300 border border-indigo-500/20">
                            {item.matchRatio || "1/1"}
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-gray-400 truncate mt-0.5">
                        {item.subtitle || item.lastMessage || "История поиска"}
                      </p>
                    </div>
                  </div>

                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      const updated = recentSearches.filter((r) => r.id !== item.id);
                      setRecentSearches(updated);
                      localStorage.setItem("nexus_recent_searches", JSON.stringify(updated));
                      triggerHaptic("light");
                    }}
                    className="p-2 text-gray-500 hover:text-white rounded-xl hover:bg-white/5 transition-colors cursor-pointer ml-1"
                    title="Удалить из недавних"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              ))
            )}
          </div>
        ) : (
          activeCategory === "Albums" && !activeAlbumId ? (
              <div className="space-y-2 animate-fade-in py-2">
                <button 
                  onClick={() => setShowAlbumsManager(true)}
                  className="w-full py-4 px-4 bg-indigo-600/10 hover:bg-indigo-600/20 text-indigo-400 border border-dashed border-indigo-500/30 rounded-2xl text-xs font-semibold flex items-center justify-center gap-2 cursor-pointer transition-all active:scale-[0.98]"
                >
                  <FolderPlus className="w-5 h-5 text-indigo-450" />
                  Create or Manage Albums
                </button>
                {albums.length === 0 ? (
                  <div className="p-8 text-center bg-[#111116] border border-[#22222d] rounded-2xl text-gray-500 text-xs">
                    No custom albums found. Create your first folder using the button above!
                  </div>
                ) : (
                  albums.map(album => (
                    <div 
                      key={album.id}
                      onClick={() => {
                        setActiveAlbumId(album.id);
                      }}
                      className="group flex items-center justify-between p-3.5 bg-[#111116] hover:bg-indigo-600/10 border border-[#22222d] hover:border-indigo-500/30 rounded-2xl cursor-pointer transition-all active:scale-[0.99]"
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <div className="w-10 h-10 rounded-xl bg-indigo-500/10 flex items-center justify-center text-indigo-400 group-hover:scale-105 transition-transform">
                          <Folder className="w-5 h-5 fill-indigo-400/20" />
                        </div>
                        <div className="min-w-0">
                          <p className="text-sm font-semibold text-gray-200 group-hover:text-white transition-colors truncate">{album.name}</p>
                          <p className="text-xs text-gray-400 mt-0.5">{album.chatIds?.length || 0} chats grouped</p>
                        </div>
                      </div>
                      <div className="flex gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button 
                          onClick={(e) => {
                            e.stopPropagation();
                            if (confirm(`Remove custom album "${album.name}"?`)) {
                              const refreshed = albums.filter(a => a.id !== album.id);
                              setAlbums(refreshed);
                              localStorage.setItem("nexus_albums", JSON.stringify(refreshed));
                              if (activeAlbumId === album.id) setActiveAlbumId(null);
                            }
                          }}
                          className="p-1 px-2.5 bg-red-500/10 border border-red-500/20 rounded-lg text-[10px] uppercase font-bold text-red-400 hover:bg-red-500 hover:text-white transition-all cursor-pointer"
                        >
                          Delete
                        </button>
                      </div>
                    </div>
                  ))
                )}
              </div>
            ) : activeCategory === "Notes" ? (
              <div className="space-y-3 animate-fade-in py-2">
                {/* Single prominent Plus button */}
                <button 
                  onClick={() => {
                    const newNoteId = `note_${Date.now()}`;
                    onSelectChat(newNoteId, "notes", strings.newNote || "Новая заметка", true);
                  }}
                  className="w-full py-3.5 px-4 bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white rounded-2xl text-sm font-semibold flex items-center justify-center gap-2 cursor-pointer shadow-lg shadow-amber-500/25 transition-all active:scale-[0.98]"
                  title={strings.createNote || "Создать заметку"}
                >
                  <Plus className="w-5 h-5 stroke-[2.5]" />
                  <span>{strings.createNote || "Добавить заметку"}</span>
                </button>

                {/* List of user notes */}
                {notesList.length === 0 ? (
                  <div className="p-8 text-center bg-[#111116] border border-[#22222d] rounded-2xl text-gray-500 text-xs">
                    <FileText className="w-8 h-8 text-amber-400/40 mx-auto mb-2" />
                    {strings.emptyNotes || "У вас пока нет заметок. Нажмите кнопку выше, чтобы создать заметку."}
                  </div>
                ) : (
                  <div className="space-y-1.5">
                    {notesList.map((note) => {
                      const noteDisplayTitle = note.title?.trim() || (note.content?.trim() ? note.content.trim().slice(0, 35).split("\n")[0] : strings.newNote || "Заметка");
                      return (
                        <div
                          key={note.id}
                          onClick={() => onSelectChat(note.id, "notes", noteDisplayTitle, true)}
                          className={`group flex items-center justify-between p-3 rounded-2xl cursor-pointer transition-all border ${
                            activeId === note.id
                              ? "bg-[#2b5278] border-[#2b5278] text-white shadow-md"
                              : "bg-[#17212b] border-[#17212b] hover:bg-[#202b36] text-gray-200"
                          }`}
                        >
                          <div className="flex items-center gap-3 min-w-0">
                            <div className="w-11 h-11 rounded-xl bg-amber-500/15 border border-amber-500/30 flex items-center justify-center text-amber-400 shrink-0 overflow-hidden">
                              {note.images && note.images.length > 0 ? (
                                <img src={note.images[0]} alt="img" className="w-full h-full object-cover" />
                              ) : (
                                <FileText className="w-5 h-5" />
                              )}
                            </div>
                            <div className="min-w-0">
                              <p className="text-sm font-semibold truncate group-hover:text-white transition-colors">
                                {noteDisplayTitle}
                              </p>
                              <p className="text-xs text-gray-400 truncate mt-0.5">
                                {note.content ? note.content.slice(0, 60) : "Пустая заметка..."}
                              </p>
                            </div>
                          </div>
                          <div className="flex items-center gap-1 shrink-0 ml-2">
                            <span className="text-[10px] text-gray-400">
                              {new Date(note.updatedAt || note.createdAt || Date.now()).toLocaleDateString([], { month: "numeric", day: "numeric" })}
                            </span>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                if (window.confirm(strings.deleteNoteConfirm || "Удалить эту заметку?")) {
                                  const myId = localStorage.getItem("telegram_my_id");
                                  const headers: Record<string, string> = {};
                                  if (myId) headers["x-user-id"] = myId;
                                  fetch(`/api/notes/${note.id}`, { method: "DELETE", headers })
                                    .then(() => fetchNotes())
                                    .catch(console.error);
                                }
                              }}
                              className="opacity-0 group-hover:opacity-100 p-1 text-gray-400 hover:text-red-400 transition-opacity ml-1 cursor-pointer"
                              title={strings.delete || "Удалить"}
                            >
                              <Trash className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            ) : (
              <>
                {!viewArchived && activeCategory !== "Albums" && activeCategory !== "Notes" && (
                  <motion.div 
                    onClick={() => onSelectChat("ai-assistant", "ai", "AI Assistant")}
                    className={`flex items-center gap-3.5 px-3.5 py-3 mx-2 my-1.5 rounded-2xl cursor-pointer transition-colors border border-transparent ${
                      activeId === "ai-assistant" 
                        ? "bg-[#2b5278] border-[#2b5278] text-white shadow-sm" 
                        : "bg-[#0e1621] hover:bg-[#17212b]"
                    }`}
                  >
                    <div className="w-16 h-16 rounded-full bg-[#181824] flex items-center justify-center shrink-0 border border-[#2a2a38] relative overflow-hidden">
                      <div className="absolute inset-0 bg-gradient-to-br from-indigo-500/20 to-purple-500/20" />
                      <Bot className="w-6 h-6 text-indigo-400" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between mb-1">
                        <h3 className="font-bold text-indigo-50 text-sm truncate">AI Assistant</h3>
                      </div>
                      {localStorage.getItem("draft_ai_assistant")?.trim() ? (
                        <p className="text-xs truncate">
                          <span className="text-[#e53935] font-semibold">{strings.draft || "Черновик"}: </span>
                          <span className="text-indigo-200">{localStorage.getItem("draft_ai_assistant")?.trim()}</span>
                        </p>
                      ) : (
                        <p className="text-xs text-indigo-300/80 truncate">Always here to help...</p>
                      )}
                    </div>
                  </motion.div>
                )}

        {isTelegramConnected && sortedDialogs.map((dialog) => {
          const isOwnChat = Boolean((dialog as any)?.isSelf || dialog.id === "me" || dialog.name === "Saved Messages" || dialog.name === "Избранное");
          const local = getLocalProfile(dialog.id);
          const title = (isOwnChat && savedMessagesMode === "profile")
            ? (myProfileName || "Мой профиль")
            : (isOwnChat && savedMessagesMode === "notes")
            ? "Мои заметки"
            : (isOwnChat && savedMessagesMode === "custom" && savedMessagesCustomTitle.trim())
            ? savedMessagesCustomTitle.trim()
            : (local?.name || (isOwnChat ? "Избранное" : dialog.name));
          const avatarUrl = (isOwnChat && savedMessagesMode === "profile")
            ? "/api/telegram/avatar/me"
            : (isOwnChat ? customSavedMessagesAvatar : (local?.avatarUrl || `/api/telegram/avatar/${dialog.id}`));
          const chatNote = localStorage.getItem(`chat_note_${dialog.id}`) || local?.note || (dialog as any)?.note || "";
          const hasNexusClient = isUserNexusgramClient(dialog.id) || Boolean((dialog as any)?.isNexusClient);
          const isArchived = isChatArchived(dialog);
          const displayPinned = activeCategory === "Archive" ? false : (local?.pinned !== undefined ? local.pinned : dialog.pinned);
          const displayMuted = local?.muted === true || dialog.muted === true;
          const draftText = localStorage.getItem(`draft_${dialog.id}`) || "";
          
          const localActivityStr = localStorage.getItem(`last_online_${dialog.id}`);
          const localActivityVal = localActivityStr ? parseInt(localActivityStr, 10) : 0;
          const lastMsgDateVal = dialog.date || 0;
          const maxActivity = Math.max(lastMsgDateVal, localActivityVal);
          const isOnlineRecently = (Date.now() - maxActivity) < 15 * 60 * 1000;
          const showGreenIndicator = dialog.isOnline || isOnlineRecently;

          // Story Indicator logic: Only show indicator for chats with recent/fresh stories (<24h)
          const isStoryRecent = (story: any) => {
            if (!story) return false;
            if (story.timestamp) {
              const age = Date.now() - Number(story.timestamp);
              return age >= 0 && age < 24 * 60 * 60 * 1000;
            }
            if (story.date) {
              const d = story.date > 1e11 ? story.date : story.date * 1000;
              const age = Date.now() - d;
              return age >= 0 && age < 24 * 60 * 60 * 1000;
            }
            if (story.timeAgo) {
              const t = String(story.timeAgo).toLowerCase();
              if (t.includes("только что") || t.includes("мин") || t.includes("ч назад") || t.includes("час")) {
                return true;
              }
              if (t.includes("дн") || t.includes("нед") || t.includes("мес") || t.includes("yesterday") || t.includes("вчера")) {
                return false;
              }
            }
            return true;
          };

          const matchingDialogStories = realStories.filter((s) =>
            String(s.userId) === String(dialog.id) ||
            (dialog.username && String(s.userId).toLowerCase() === String(dialog.username).toLowerCase()) ||
            (dialog.username && s.username && String(s.username).toLowerCase() === String(dialog.username).toLowerCase()) ||
            (isOwnChat && (s.userId === "me" || s.isOwn || s.userName === "Моя история"))
          );
          const recentStory = matchingDialogStories.find((s) => isStoryRecent(s)) || matchingDialogStories[0];
          // Indicator is strictly only for chats that have a fresh/active story in the top stories bar
          const hasRecentStory = Boolean(recentStory);
          const readStoryIds = (() => {
            try {
              return JSON.parse(localStorage.getItem("nexus_read_stories") || "[]");
            } catch {
              return [];
            }
          })();
          const isStoryRead = hasRecentStory && (
            readStoryIds.includes(String(dialog.id)) ||
            (recentStory && readStoryIds.includes(String(recentStory.id))) ||
            (recentStory && readStoryIds.includes(String(recentStory.userId)))
          );
          const isStoryUnread = hasRecentStory && !isStoryRead;

          const isDraggingThis = activeDragOffset?.id === dialog.id;
          const currentDragX = isDraggingThis ? -activeDragOffset.x : (swipedId === dialog.id ? 180 : 0);
          const isStrongArchiveSwipe = currentDragX > 170;

          return (
          <div key={dialog.id} className="relative group mx-2 my-1.5">
            {/* The swipe actions wrapper behind */}
            <div className="absolute inset-y-0 right-1 flex items-center gap-1.5 z-0">
              {/* Mute button */}
              <motion.button 
                initial={false}
                animate={{
                  scale: currentDragX >= 70 && !isStrongArchiveSwipe ? 1 : Math.max(0, (currentDragX - 40) / 30),
                  opacity: currentDragX >= 40 && !isStrongArchiveSwipe ? 1 : 0,
                  width: isStrongArchiveSwipe ? 0 : 54,
                }}
                transition={{ type: "spring", stiffness: 450, damping: 26 }}
                onClick={() => {
                  const newMuted = !displayMuted;
                  const currentParams = getLocalProfile(dialog.id) || {};
                  localStorage.setItem(`local_profile_${dialog.id}`, JSON.stringify({ ...currentParams, muted: newMuted }));
                  setSearchQuery(searchQuery + " "); setTimeout(() => setSearchQuery(searchQuery), 0);
                }} 
                className="h-16 aspect-square text-white bg-[#333a46] hover:bg-[#3d4554] rounded-2xl flex flex-col items-center justify-center gap-0.5 transition-colors cursor-pointer shadow-md shrink-0 overflow-hidden"
                title={displayMuted ? "Включить звук" : "Без звука"}
              >
                <div className="flex flex-col items-center justify-center">
                  {displayMuted ? <Bell className="w-5 h-5"/> : <BellOff className="w-5 h-5"/>}
                  <span className="text-[10px] font-medium leading-none mt-1">{displayMuted ? "Звук" : "Без звука"}</span>
                </div>
              </motion.button>

              {/* Pin button */}
              <motion.button 
                initial={false}
                animate={{
                  scale: currentDragX >= 110 && !isStrongArchiveSwipe ? 1 : Math.max(0, (currentDragX - 70) / 40),
                  opacity: currentDragX >= 70 && !isStrongArchiveSwipe ? 1 : 0,
                  width: isStrongArchiveSwipe ? 0 : 54,
                }}
                transition={{ type: "spring", stiffness: 450, damping: 26 }}
                onClick={() => {
                  const newPinned = !displayPinned;
                  const currentParams = getLocalProfile(dialog.id) || {};
                  localStorage.setItem(`local_profile_${dialog.id}`, JSON.stringify({ ...currentParams, pinned: newPinned }));
                  togglePin(dialog.id, newPinned);
                  setSearchQuery(searchQuery + " "); setTimeout(() => setSearchQuery(searchQuery), 0);
                }} 
                className="h-16 aspect-square text-white bg-[#2481cc] hover:bg-[#288fdc] rounded-2xl flex flex-col items-center justify-center gap-0.5 transition-colors cursor-pointer shadow-md shrink-0 overflow-hidden"
                title={displayPinned ? "Открепить" : "Закрепить"}
              >
                <div className="flex flex-col items-center justify-center">
                  {displayPinned ? <PinOff className="w-5 h-5"/> : <Pin className="w-5 h-5"/>}
                  <span className="text-[10px] font-medium leading-none mt-1">{displayPinned ? "Открепить" : "Закрепить"}</span>
                </div>
              </motion.button>

              {/* 3rd Button: Archive (animates into view beside Pin, and on strong swipe expands to fill the entire row!) */}
              <motion.button 
                initial={false}
                animate={{
                  scale: currentDragX >= 140 ? 1 : Math.max(0, (currentDragX - 110) / 30),
                  opacity: currentDragX >= 110 ? 1 : 0,
                  width: isStrongArchiveSwipe ? Math.min(320, currentDragX + 20) : (currentDragX >= 140 ? 54 : 0),
                }}
                transition={{ type: "spring", stiffness: 450, damping: 26 }}
                onClick={() => {
                  handleToggleArchive(dialog.id, !isArchived);
                }} 
                className={`h-16 text-white rounded-2xl flex items-center justify-center transition-all cursor-pointer shadow-md shrink-0 overflow-hidden ${
                  isStrongArchiveSwipe 
                    ? "bg-gradient-to-r from-[#20527c] to-[#2c6ea6] px-4 gap-2 font-semibold text-xs" 
                    : "aspect-square bg-[#2c6ea6] hover:bg-[#347bb8] flex-col gap-0.5 py-1"
                }`}
                title={isArchived ? "Вернуть из архива" : "Отправить в архив"}
              >
                <Archive className="w-5 h-5 shrink-0" />
                <span className={`${isStrongArchiveSwipe ? "text-xs font-semibold whitespace-nowrap" : "text-[10px] font-medium leading-none whitespace-nowrap mt-1"}`}>
                  {isArchived ? "Из архива" : "В архив"}
                </span>
              </motion.button>
            </div>

            <motion.div 
              drag="x"
              dragDirectionLock={true}
              dragElastic={0.1}
              dragConstraints={{ left: -260, right: 0 }}
              onDrag={(e, info) => {
                if (chatLongPressTimerRef.current) {
                  clearTimeout(chatLongPressTimerRef.current);
                  chatLongPressTimerRef.current = null;
                }
                if (info.offset.x < 0) {
                  setActiveDragOffset({ id: dialog.id, x: info.offset.x });
                  if (info.offset.x < -170 && !hasTriggeredArchiveHapticRef.current) {
                    hasTriggeredArchiveHapticRef.current = true;
                    triggerHaptic("heavy");
                  } else if (info.offset.x >= -170) {
                    hasTriggeredArchiveHapticRef.current = false;
                  }
                }
              }}
              onPointerDown={(e) => {
                chatTouchStartPosRef.current = { x: e.clientX, y: e.clientY };
                if (chatLongPressTimerRef.current) clearTimeout(chatLongPressTimerRef.current);
                chatLongPressTimerRef.current = window.setTimeout(() => {
                  triggerHaptic("heavy");
                  setPeekChat({
                    id: String(dialog.id),
                    name: title,
                    avatarUrl,
                    canSend: false,
                  });
                }, 500);
              }}
              onPointerMove={(e) => {
                if (chatTouchStartPosRef.current) {
                  const dx = e.clientX - chatTouchStartPosRef.current.x;
                  const dy = e.clientY - chatTouchStartPosRef.current.y;
                  if (Math.abs(dx) > 10 || Math.abs(dy) > 10) {
                    if (chatLongPressTimerRef.current) {
                      clearTimeout(chatLongPressTimerRef.current);
                      chatLongPressTimerRef.current = null;
                    }
                  }
                }
              }}
              onPointerUp={() => {
                if (chatLongPressTimerRef.current) {
                  clearTimeout(chatLongPressTimerRef.current);
                  chatLongPressTimerRef.current = null;
                }
              }}
              onPointerLeave={() => {
                if (chatLongPressTimerRef.current) {
                  clearTimeout(chatLongPressTimerRef.current);
                  chatLongPressTimerRef.current = null;
                }
              }}
              animate={{ 
                x: animatingArchiveId === dialog.id 
                  ? -450 
                  : (swipedId === dialog.id ? -180 : 0) 
              }}
              transition={{ type: "tween", duration: 0.2, ease: "easeOut" }}
              onDragEnd={(e, info) => {
                setActiveDragOffset(null);
                hasTriggeredArchiveHapticRef.current = false;
                if (info.offset.x < -170) {
                  // Strong swipe: fill space and chat leaves to Archive!
                  setAnimatingArchiveId(dialog.id);
                  triggerHaptic("medium");
                  setTimeout(() => {
                    handleToggleArchive(dialog.id, !isArchived);
                    setAnimatingArchiveId(null);
                  }, 220);
                } else if (info.offset.x < -65) {
                  setSwipedId(dialog.id);
                  triggerHaptic("light");
                } else {
                  setSwipedId(null);
                }
              }}
              onClick={(e) => {
                 if (swipedId === dialog.id) setSwipedId(null);
                 else onSelectChat(dialog.id, "telegram", title, dialog.canSend);
              }}
              className={`relative flex items-center gap-3.5 px-3.5 py-3 rounded-2xl cursor-pointer transition-colors border z-10 touch-pan-y will-change-transform ${
                activeId === dialog.id 
                  ? "bg-[#2b5278] border-[#2b5278] text-white shadow-sm" 
                  : displayPinned 
                    ? "bg-[#17212b] border-[#17212b] hover:bg-[#202b36]" 
                    : "bg-[#0e1621] border-[#0e1621] hover:bg-[#17212b]"
              }`}
            >
              <div className={`relative w-16 h-16 shrink-0 ${
                hasRecentStory
                  ? isStoryUnread
                    // Полный яркий индикатор для свежей непрочитанной истории
                    ? "p-[2.5px] rounded-full bg-gradient-to-tr from-sky-400 via-indigo-500 to-purple-600 shadow-[0_0_12px_rgba(56,189,248,0.5)] ring-1 ring-sky-400/60"
                    // Не полный (пунктирный/не сплошной) индикатор для прочитанной истории
                    : "p-[2px] rounded-full border-2 border-dashed border-gray-500 opacity-80"
                  : ""
              }`}>
                <div className={`w-full h-full ${isForumDialog(dialog) ? 'rounded-2xl ring-1 ring-cyan-500/30 shadow-sm' : 'rounded-full'} bg-[#181824] flex items-center justify-center border-0 text-gray-300 text-base font-bold relative overflow-hidden transition-all duration-75 ease-out`}>
                  <div className={`absolute inset-0 flex items-center justify-center ${getDialogColor(dialog.id)}`}>
                    <span className="text-white font-semibold text-sm opacity-90 tracking-wide">{getDialogInitials(title || "U")}</span>
                  </div>
                  <img 
                    src={getOptimizedMediaUrl(avatarUrl, true)} 
                    alt={title} 
                    className="w-full h-full object-cover absolute inset-0 transition-opacity duration-75" 
                    onError={(e) => { e.currentTarget.style.display = 'none'; }} 
                  />
                </div>

                {/* Story Indicator: Initially FULL (solid filled vibrant gradient), EMPTY (hollow circle) when read */}
                {hasRecentStory && (
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      triggerHaptic("medium");
                      const matchedIdx = realStories.findIndex((s) =>
                        String(s.userId) === String(dialog.id) ||
                        (dialog.username && String(s.userId).toLowerCase() === String(dialog.username).toLowerCase()) ||
                        (dialog.username && s.username && String(s.username).toLowerCase() === String(dialog.username).toLowerCase()) ||
                        (isOwnChat && (s.userId === "me" || s.isOwn || s.userName === "Моя история"))
                      );
                      setActiveStoryIndex(matchedIdx !== -1 ? matchedIdx : 0);
                    }}
                    onPointerDown={(e) => {
                      storyLongPressTimerRef.current = window.setTimeout(() => {
                        triggerHaptic("heavy");
                        const targetStory = recentStory || matchingDialogStories[0] || {
                          id: `story-${dialog.id}`,
                          userId: dialog.id,
                          userName: title,
                          userAvatar: avatarUrl,
                          timeAgo: "Недавно",
                          caption: "История пользователя",
                          colorGradient: "from-blue-600 via-indigo-700 to-black",
                        };
                        setSelectedContextStory({ ...targetStory, initialView: "edit" });
                      }, 350);
                    }}
                    onPointerUp={() => {
                      if (storyLongPressTimerRef.current) clearTimeout(storyLongPressTimerRef.current);
                    }}
                    onPointerCancel={() => {
                      if (storyLongPressTimerRef.current) clearTimeout(storyLongPressTimerRef.current);
                    }}
                    onContextMenu={(e) => {
                      e.preventDefault();
                      triggerHaptic("heavy");
                      const targetStory = recentStory || matchingDialogStories[0] || {
                        id: `story-${dialog.id}`,
                        userId: dialog.id,
                        userName: title,
                        userAvatar: avatarUrl,
                        timeAgo: "Недавно",
                        caption: "История пользователя",
                        colorGradient: "from-blue-600 via-indigo-700 to-black",
                      };
                      setSelectedContextStory({ ...targetStory, initialView: "edit" });
                    }}
                    className={`absolute -top-1 -left-1 w-5 h-5 rounded-full flex items-center justify-center border-2 border-[#0e1621] z-20 shadow-md cursor-pointer transition-transform hover:scale-115 active:scale-95 ${
                      isStoryUnread
                        ? "bg-gradient-to-tr from-sky-400 via-indigo-500 to-purple-600 text-white shadow-sky-500/50"
                        : "bg-[#0e1621]/90 border-dashed border-gray-400/80"
                    }`}
                    title={isStoryUnread ? "Свежая история (полный индикатор, нажмите для просмотра)" : "История просмотрена (пустой индикатор, нажмите для повтора)"}
                  >
                    {isStoryUnread ? (
                      <span className="w-2 h-2 rounded-full bg-white shadow-sm pointer-events-none" />
                    ) : (
                      <span className="w-2 h-2 rounded-full border border-gray-400/60 bg-transparent pointer-events-none" />
                    )}
                  </button>
                )}
                {showGreenIndicator && (
                  <div className="absolute bottom-0 right-0 w-3.5 h-3.5 bg-green-500 rounded-full border-2 border-[#0e1621] z-20"></div>
                )}
                {unreadBadgeLocation === "avatar" && dialog.unreadCount > 0 && (
                  <div className={`absolute -top-1 -right-1 ${displayMuted ? 'bg-gray-600' : 'bg-blue-500'} text-white text-[10px] font-bold min-w-[20px] h-[20px] px-1 rounded-full flex items-center justify-center border border-[#0e1621] shadow-md z-20`}>
                    {dialog.unreadCount}
                  </div>
                )}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between mb-1">
                  <h3 className="font-bold text-sm truncate flex items-center gap-1.5 leading-tight" style={{ color: nameColor || "#f3f4f6" }}>
                    {showNameEmojis && (
                      <span 
                        className="text-xs select-none shrink-0 inline-flex items-center"
                        title={
                          (dialog.isBot || (dialog.name || "").toLowerCase().includes("bot")) ? "Бот" :
                          (dialog.isForum || isForumDialog(dialog)) ? "Форум" :
                          (dialog.isChannel || dialog.category === "Channels") ? "Канал" :
                          (dialog.isGroup || dialog.category === "Groups" || dialog.id?.toString().startsWith("-")) ? "Группа" : "Пользователь"
                        }
                      >
                        {getChatTypeIcon(dialog)}
                      </span>
                    )}
                    <span className="truncate">{title}</span>
                    {!hideAllChatNotes && chatNote && (title || "").length <= 14 && (
                      <span className="text-[11px] font-medium text-amber-400/90 shrink-0 ml-1 truncate max-w-[130px]" title={`Заметка: ${chatNote}`}>
                        ({chatNote})
                      </span>
                    )}
                    {dialog.verified && (
                      <CheckCircle2 className="w-3.5 h-3.5 text-blue-400 fill-blue-400 shrink-0 inline ml-0.5" />
                    )}
                    {dialog.premium && (
                      <Star className="w-3.5 h-3.5 text-purple-400 fill-purple-400 shrink-0 inline ml-0.5" />
                    )}
                    {dialog.fake && (
                      <span className="px-1 py-0.2 text-[9px] font-bold bg-red-500/20 text-red-400 border border-red-500/40 rounded shrink-0 inline ml-0.5">FAKE</span>
                    )}
                    {dialog.scam && (
                      <span className="px-1 py-0.2 text-[9px] font-bold bg-red-500/20 text-red-400 border border-red-500/40 rounded shrink-0 inline ml-0.5">SCAM</span>
                    )}
                  </h3>
                  <div className="flex items-center gap-1 shrink-0 ml-1">
                    {isArchived && (
                      <span title="В архиве">
                        <Archive className="w-3 h-3 text-indigo-400 shrink-0" />
                      </span>
                    )}
                    {displayMuted && <BellOff className="w-3 h-3 text-gray-600" />}
                    {displayPinned && <Pin className="w-3 h-3 text-gray-500" />}
                    {dialog.date && (
                      <span className="text-[10px] text-gray-500">
                        {new Intl.DateTimeFormat('en-GB', {hour: '2-digit', minute: '2-digit', hour12: false}).format(new Date(dialog.date))}
                      </span>
                    )}
                  </div>
                </div>

                {!hideAllChatNotes && chatNote && (title || "").length > 14 && (
                  <div className="text-[11px] text-amber-400/90 font-medium truncate flex items-center gap-1 -mt-0.5 mb-1" title={`Заметка: ${chatNote}`}>
                    <span className="truncate">({chatNote})</span>
                  </div>
                )}
                <div className="flex items-center justify-between mt-0.5">
                  {typingUsers[dialog.id] || typingUsers[dialog.id?.replace(/^-/, "")] || typingUsers[dialog.id?.replace(/^-100/, "")] ? (
                    <div className="flex items-center gap-1.5 text-xs text-[#2481cc] font-medium animate-fade-in">
                      <div className="flex gap-0.5 items-center">
                        <span className="w-1 h-1 bg-[#2481cc] rounded-full animate-bounce [animation-delay:-0.32s]" />
                        <span className="w-1 h-1 bg-[#2481cc] rounded-full animate-bounce [animation-delay:-0.16s]" />
                        <span className="w-1 h-1 bg-[#2481cc] rounded-full animate-bounce" />
                      </div>
                      <span className="animate-pulse">печатает...</span>
                    </div>
                  ) : draftText.trim() ? (
                    <div className="flex items-center gap-1.5 min-w-0 flex-1">
                      <p className="text-xs line-clamp-1 whitespace-pre-wrap leading-tight break-words truncate">
                        <span className="text-[#e53935] font-semibold">{strings.draft || "Черновик"}: </span>
                        <span className="text-gray-300 font-normal">{draftText.trim()}</span>
                      </p>
                    </div>
                  ) : (() => {
                    let rawText = dialog.lastMessage || "";
                    const lower = rawText.toLowerCase();
                    if (
                      lower.includes("приложенное медиа") ||
                      lower.includes("прикрепленное медиа") ||
                      lower.includes("media attachment") ||
                      lower.includes("media attached")
                    ) {
                      rawText = "";
                    }

                    const isVideo = Boolean(
                      (dialog as any).hasLastMessageVideo ||
                      (dialog as any).lastMessageVideoUrl ||
                      lower.includes("видео") ||
                      lower.includes("video")
                    );

                    const isSticker = !isVideo && Boolean(
                      (dialog as any).isLastMessageSticker ||
                      (dialog as any).lastMessageStickerEmoji ||
                      rawText.includes("Стикер") ||
                      rawText.includes("Sticker")
                    );
                    const stickerEmoji = (dialog as any).lastMessageStickerEmoji || rawText.replace(/[A-Za-zА-Яа-яЁё\s]/g, "").trim() || "✨";

                    const isDoc = !isVideo && Boolean(
                      (dialog as any).isLastMessageDoc ||
                      (dialog as any).lastMessageFileName ||
                      rawText.startsWith("📄") ||
                      rawText.startsWith("📁") ||
                      rawText.startsWith("📎") ||
                      rawText.includes(".pdf") ||
                      rawText.includes(".doc") ||
                      rawText.includes(".zip") ||
                      rawText.includes(".apk") ||
                      rawText.includes(".jpg") ||
                      rawText.includes(".png")
                    );

                    let cleanDocName = (dialog as any).lastMessageFileName || rawText.replace(/^[📁📄📎]\s*/, "").trim();
                    if (!cleanDocName || cleanDocName === "Document" || cleanDocName === "Документ" || cleanDocName === "attached_file") {
                      cleanDocName = "Файл";
                    }

                    const isVideoGeneric = !rawText || ["видео", "видеозапись", "video", "🎥 видеосообщение", "📹 видео"].includes(rawText.trim().toLowerCase());
                    const videoDisplayText = isVideoGeneric ? "Видео" : rawText;

                    return (
                      <div className="flex items-center gap-1.5 min-w-0 flex-1">
                        {isVideo ? (
                          <div className="w-5 h-5 rounded shrink-0 overflow-hidden bg-black/60 border border-white/10 relative flex items-center justify-center">
                            {dialog.lastMessagePhotoUrl ? (
                              <img
                                src={dialog.lastMessagePhotoUrl}
                                alt=""
                                className="w-full h-full object-cover"
                                onError={(e) => { e.currentTarget.style.display = 'none'; }}
                              />
                            ) : (dialog as any).lastMessageVideoUrl ? (
                              <video
                                src={(dialog as any).lastMessageVideoUrl}
                                preload="metadata"
                                muted
                                playsInline
                                className="w-full h-full object-cover pointer-events-none"
                              />
                            ) : (
                              <Video className="w-3 h-3 text-sky-400" />
                            )}
                            <div className="absolute inset-0 bg-black/30 flex items-center justify-center">
                              <span className="text-[7px] text-white">▶</span>
                            </div>
                          </div>
                        ) : dialog.hasLastMessagePhoto && dialog.lastMessagePhotoUrl ? (
                          <div className="w-5 h-5 rounded shrink-0 overflow-hidden bg-black/40 border border-white/10 relative">
                            <img
                              src={dialog.lastMessagePhotoUrl}
                              alt=""
                              className="w-full h-full object-cover"
                              onError={(e) => { e.currentTarget.style.display = 'none'; }}
                            />
                          </div>
                        ) : isDoc ? (
                          <div className="w-5 h-5 rounded shrink-0 bg-sky-500/20 text-sky-400 border border-sky-500/30 flex items-center justify-center">
                            <FileText className="w-3 h-3" />
                          </div>
                        ) : null}
                        <p className="text-xs text-gray-400 line-clamp-1 whitespace-pre-wrap leading-tight break-words truncate">
                          {isDoc ? (
                            <span className="text-gray-200 font-medium">{cleanDocName}</span>
                          ) : isVideo ? (
                            <span className="text-gray-200">{videoDisplayText}</span>
                          ) : isSticker ? (
                            <span className="text-sm leading-none inline-block">{stickerEmoji}</span>
                          ) : rawText ? (
                            rawText
                          ) : dialog.hasLastMessagePhoto ? (
                            "Фотография"
                          ) : (
                            "Нет сообщений"
                          )}
                        </p>
                      </div>
                    );
                  })()}

                  {unreadBadgeLocation === "timestamp" && dialog.unreadCount > 0 && (
                    <div className={`ml-1.5 shrink-0 ${displayMuted ? 'bg-gray-600' : 'bg-blue-500'} text-white text-[10px] font-bold min-w-[18px] h-[18px] px-1.5 rounded-full flex items-center justify-center shadow-sm`}>
                      {dialog.unreadCount}
                    </div>
                  )}
                </div>
              </div>
            </motion.div>
          </div>
        )})}

        {/* Empty state for Archive tab */}
        {activeCategory === "Archive" && sortedDialogs.length === 0 && (
          <div className="flex flex-col items-center justify-center py-20 px-6 text-center text-gray-400 animate-fade-in">
            <div className="w-16 h-16 rounded-full bg-[#182533] border border-[#242f3d] flex items-center justify-center mb-3 text-[#2481cc]">
              <Archive className="w-8 h-8" />
            </div>
            <h3 className="font-semibold text-gray-200 text-base mb-1">{strings.archiveEmpty || "В архиве пока пусто"}</h3>
            <p className="text-xs text-gray-400 max-w-xs">{strings.archiveEmptyDesc || "Здесь будут отображаться заархивированные чаты"}</p>
          </div>
        )}
        
        {!isTelegramConnected && !viewArchived && [
          { name: "Dev Team", msg: "Checking the latest build.", time: "10:42 AM", emoji: "👨‍💻" },
          { name: "Design Updates", msg: "Just uploaded the new assets.", time: "Yesterday", emoji: "🎨" },
        ].map((chat, i) => (
          <div key={i} className="flex items-center gap-3 p-3 rounded-2xl hover:bg-[#111116] cursor-pointer transition-colors border border-transparent opacity-50">
            <div className="w-16 h-16 rounded-full bg-[#181824] flex items-center justify-center shrink-0 border border-[#2a2a38]">
              <span className="text-gray-400 text-lg">{chat.emoji}</span>
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between mb-1">
                <h3 className="font-bold text-gray-200 text-sm truncate">{chat.name}</h3>
                <span className="text-[10px] text-gray-500">{chat.time}</span>
              </div>
              <p className="text-xs text-gray-500 truncate">{chat.msg}</p>
            </div>
          </div>
        ))}
          </>
        ))
      }
        </div>

        {/* Scrubber scroll indicators */}
        <div 
          ref={sidebarTrackRef}
          onMouseDown={onSidebarScrubStart}
          onTouchStart={onSidebarScrubStart}
          className={`absolute right-0.5 top-2 bottom-2 w-3 z-40 cursor-ns-resize flex items-center justify-center select-none transition-opacity duration-300 ${
            isScrubbing ? 'opacity-100' : 'opacity-0 hover:opacity-100'
          }`}
        >
          <div className={`w-0.5 h-full rounded-full transition-colors ${isScrubbing ? 'bg-indigo-500/20' : 'bg-white/5'}`}>
            <div 
              ref={sidebarThumbRef}
              className={`absolute w-1 rounded-full cursor-ns-resize shadow-sm transition-colors ${
                isScrubbing ? 'bg-indigo-500 scale-110' : 'bg-gray-600 hover:bg-indigo-400'
              }`}
              style={{ 
                height: "15%", 
                top: "0%",
                left: '1px'
              }}
            />
          </div>
        </div>
      </div>

      {/* Virtual Peek Chat Modal (Read-only on long-press, scroll down arrow is the only interactive action) */}
      <AnimatePresence>
        {peekChat && (
          <div
            className="fixed inset-0 z-[120] bg-black/65 backdrop-blur-md flex items-center justify-center p-3 sm:p-4 select-none animate-fade-in"
            onClick={() => setPeekChat(null)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.9, opacity: 0, y: 20 }}
              transition={{ type: "spring", damping: 25, stiffness: 350 }}
              onClick={(e) => e.stopPropagation()}
              className="w-full max-w-sm h-[72vh] max-h-[580px] bg-[#101722] border border-white/15 rounded-3xl shadow-2xl flex flex-col overflow-hidden relative ring-1 ring-white/10"
            >
              {/* Header */}
              <div className="px-4 py-3 bg-[#172230] border-b border-white/10 flex items-center justify-between shrink-0 shadow-sm">
                <div className="flex items-center gap-2.5 min-w-0">
                  <div className="w-10 h-10 rounded-full bg-[#1e2c3d] flex items-center justify-center overflow-hidden border border-white/10 text-white font-bold text-xs shrink-0 shadow-inner">
                    {peekChat.avatarUrl ? (
                      <img
                        src={peekChat.avatarUrl}
                        alt=""
                        className="w-full h-full object-cover"
                        onError={(e) => { e.currentTarget.style.display = 'none'; }}
                      />
                    ) : (
                      <span>{peekChat.name.slice(0, 1).toUpperCase()}</span>
                    )}
                  </div>
                  <div className="min-w-0">
                    <h4 className="text-xs font-bold text-white truncate">{peekChat.name}</h4>
                    <span className="text-[10px] text-sky-400 font-medium flex items-center gap-1">
                      <span className="w-1.5 h-1.5 rounded-full bg-sky-400 animate-pulse" />
                      Виртуальный чат (только просмотр)
                    </span>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setPeekChat(null)}
                  className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 text-gray-300 hover:text-white flex items-center justify-center transition-colors cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Messages area (read-only, no inputs or reaction buttons) */}
              <div
                ref={peekContainerRef}
                className="flex-1 overflow-y-auto p-3.5 space-y-2.5 bg-[#0b1017] scrollbar-thin scrollbar-thumb-zinc-800"
              >
                {loadingPeekMessages ? (
                  <div className="flex flex-col items-center justify-center h-full text-gray-400 gap-2">
                    <Loader2 className="w-6 h-6 animate-spin text-indigo-400" />
                    <span className="text-xs">Загрузка сообщений...</span>
                  </div>
                ) : peekMessages.length === 0 ? (
                  <div className="flex flex-col items-center justify-center h-full text-gray-500 text-xs">
                    <span>Нет сообщений для отображения</span>
                  </div>
                ) : (
                  peekMessages.map((m: any, idx: number) => {
                    const isOut = Boolean(m.out);
                    return (
                      <div
                        key={m.id || idx}
                        className={`flex flex-col ${isOut ? "items-end" : "items-start"}`}
                      >
                        <div
                          className={`max-w-[85%] rounded-2xl px-3.5 py-2 text-xs select-text shadow-sm ${
                            isOut
                              ? "bg-[#2b5278] text-white rounded-br-none"
                              : "bg-[#182332] text-gray-200 border border-white/5 rounded-bl-none"
                          }`}
                        >
                          {m.mediaType && (
                            <div className="text-[10px] text-sky-300 font-mono mb-1">
                              {m.mediaType === "photo" ? "📷 Фото" : m.mediaType === "video" ? "🎬 Видео" : "📎 Файл"}
                            </div>
                          )}
                          <p className="whitespace-pre-wrap break-words leading-relaxed">
                            {m.text || m.message || (m.mediaType ? `[${m.mediaType}]` : "")}
                          </p>
                          <span className="text-[9px] opacity-60 text-right block mt-1 font-mono">
                            {m.date ? new Date(m.date > 1e11 ? m.date : m.date * 1000).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : ""}
                          </span>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>

              {/* Floating Scroll Down Arrow: the only interactive tool in this virtual window */}
              <button
                type="button"
                onClick={() => {
                  triggerHaptic("light");
                  if (peekContainerRef.current) {
                    peekContainerRef.current.scrollTo({
                      top: peekContainerRef.current.scrollHeight,
                      behavior: "smooth",
                    });
                  }
                }}
                className="absolute bottom-4 right-4 w-10 h-10 rounded-full bg-indigo-600 hover:bg-indigo-500 text-white shadow-xl flex items-center justify-center cursor-pointer transition-transform active:scale-90 z-20 border border-indigo-400/50"
                title="В самый низ"
              >
                <ChevronDown className="w-5 h-5" />
              </button>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
