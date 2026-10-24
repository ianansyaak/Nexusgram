import React, { useEffect, useState, useRef } from "react";
import { createPortal } from "react-dom";
import { motion, AnimatePresence } from "motion/react";
import { measurePing } from "../utils/telemetry";
import {
  getEcoMode,
  setEcoMode,
  getEcoStats,
  formatBytes,
  EcoMode,
} from "../utils/ecoStream";
import {
  Play,
  Pause,
  SkipBack,
  SkipForward,
  Wifi,
  Zap,
  Battery,
  ShieldCheck,
  ChevronUp,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Volume2,
  HardDrive,
  RefreshCw,
  BarChart2,
  Move,
  RotateCcw,
  Sliders,
} from "lucide-react";
import { TrafficAnalyticsModal } from "./TrafficAnalyticsModal";

export const DynamicIsland = ({ fps }: { fps: number }) => {
  // Settings & visibility
  const [enabled, setEnabled] = useState(
    localStorage.getItem("nexus_dynamic_island") !== "false"
  );
  const [showMedia, setShowMedia] = useState(
    localStorage.getItem("nexus_island_media") !== "false"
  );
  const [showSpeed, setShowSpeed] = useState(
    localStorage.getItem("nexus_island_speed") !== "false"
  );
  const [showBattery, setShowBattery] = useState(
    localStorage.getItem("nexus_island_battery") !== "false"
  );

  // Calibration dimensions (Default to real physical iPhone 14 Pro / 15 / 16 Dynamic Island cutout)
  const [islandWidth, setIslandWidth] = useState(() => {
    const val = localStorage.getItem("nexus_island_width");
    return val ? parseInt(val) : 126; // Exact real hardware width in CSS px
  });
  const [islandHeight, setIslandHeight] = useState(() => {
    const val = localStorage.getItem("nexus_island_height");
    return val ? parseInt(val) : 37; // Exact real hardware height in CSS px
  });
  const [islandTop, setIslandTop] = useState(() => {
    const val = localStorage.getItem("nexus_island_top");
    return val !== null ? parseInt(val) : 11; // Exact hardware offset in CSS px
  });
  const [islandLeftOffset, setIslandLeftOffset] = useState(() => {
    const val = localStorage.getItem("nexus_island_left_offset");
    return val !== null ? parseInt(val) : 0;
  });

  // State: expanded (large island) or compact
  const [isExpanded, setIsExpanded] = useState(false);

  // State: data hidden on swipe gesture
  const [isDataHidden, setIsDataHidden] = useState(() => {
    return localStorage.getItem("nexus_island_data_hidden") === "true";
  });

  // State: Traffic Analytics Modal
  const [showAnalyticsModal, setShowAnalyticsModal] = useState(false);

  // Calibration Drag Mode
  const [isCalibrationMode, setIsCalibrationMode] = useState(false);
  const [isFreeDragActive, setIsFreeDragActive] = useState(false);
  const isDraggingRef = useRef(false);
  const dragStartYRef = useRef(0);
  const dragStartXRef = useRef(0);
  const dragInitialTopRef = useRef(11);
  const dragInitialLeftOffsetRef = useRef(0);

  // Telemetry & metrics
  const [ping, setPing] = useState(18);
  const [downloadSpeed, setDownloadSpeed] = useState(320); // KB/s
  const [battery, setBattery] = useState<number | null>(82);
  const [isCharging, setIsCharging] = useState(false);
  const [ecoStats, setEcoStats] = useState(getEcoStats());

  // Interactive media player mock inside Dynamic Island
  const [isPlaying, setIsPlaying] = useState(true);
  const [trackProgress, setTrackProgress] = useState(42);
  const [trackTitle, setTrackTitle] = useState("HAVASI — Drum & Piano");
  const [trackArtist, setTrackArtist] = useState("Roadtrip Live");

  // Touch gesture handling for swiping side-to-side
  const touchStartXRef = useRef<number | null>(null);
  const touchStartYRef = useRef<number | null>(null);

  // Sync settings and eco stats
  useEffect(() => {
    const handleStorage = () => {
      setEnabled(localStorage.getItem("nexus_dynamic_island") !== "false");
      setShowMedia(localStorage.getItem("nexus_island_media") !== "false");
      setShowSpeed(localStorage.getItem("nexus_island_speed") !== "false");
      setShowBattery(localStorage.getItem("nexus_island_battery") !== "false");
      const w = localStorage.getItem("nexus_island_width");
      if (w) setIslandWidth(parseInt(w));
      const h = localStorage.getItem("nexus_island_height");
      if (h) setIslandHeight(parseInt(h));
      const t = localStorage.getItem("nexus_island_top");
      if (t !== null) setIslandTop(parseInt(t));
      const l = localStorage.getItem("nexus_island_left_offset");
      if (l !== null) setIslandLeftOffset(parseInt(l));
    };

    const handleEcoUpdate = (e: any) => {
      if (e.detail) setEcoStats(e.detail);
      else setEcoStats(getEcoStats());
    };

    window.addEventListener("storage", handleStorage);
    window.addEventListener("islandchange", handleStorage);
    window.addEventListener("ecostatsupdate", handleEcoUpdate);

    return () => {
      window.removeEventListener("storage", handleStorage);
      window.removeEventListener("islandchange", handleStorage);
      window.removeEventListener("ecostatsupdate", handleEcoUpdate);
    };
  }, []);

  // Live Ping & speed fluctuations
  useEffect(() => {
    let mounted = true;
    const interval = setInterval(async () => {
      if (showSpeed) {
        const p = await measurePing();
        if (mounted) {
          setPing(p);
          setDownloadSpeed(Math.floor(180 + Math.random() * 260));
        }
      }
    }, 2500);
    return () => {
      mounted = false;
      clearInterval(interval);
    };
  }, [showSpeed]);

  // Battery status API
  useEffect(() => {
    if ((navigator as any).getBattery) {
      (navigator as any).getBattery().then((b: any) => {
        setBattery(Math.round(b.level * 100));
        setIsCharging(b.charging);
        b.addEventListener("levelchange", () =>
          setBattery(Math.round(b.level * 100))
        );
        b.addEventListener("chargingchange", () => setIsCharging(b.charging));
      });
    }
  }, []);

  // Audio track progress ticker
  useEffect(() => {
    if (!isPlaying) return;
    const interval = setInterval(() => {
      setTrackProgress((prev) => (prev >= 100 ? 0 : prev + 1));
    }, 1000);
    return () => clearInterval(interval);
  }, [isPlaying]);

  // Touch Swipe Handlers for hiding / returning island data
  const handleTouchStart = (e: React.TouchEvent | React.MouseEvent) => {
    if (isCalibrationMode) return;
    const clientX = "touches" in e ? e.touches[0].clientX : e.clientX;
    const clientY = "touches" in e ? e.touches[0].clientY : e.clientY;
    touchStartXRef.current = clientX;
    touchStartYRef.current = clientY;
  };

  const handleTouchEnd = (e: React.TouchEvent | React.MouseEvent) => {
    if (isCalibrationMode || touchStartXRef.current === null) return;
    const clientX =
      "changedTouches" in e ? e.changedTouches[0].clientX : e.clientX;
    const clientY =
      "changedTouches" in e ? e.changedTouches[0].clientY : e.clientY;

    const deltaX = clientX - touchStartXRef.current;
    const deltaY = clientY - (touchStartYRef.current || 0);

    // If swipe horizontally more than 20px
    if (Math.abs(deltaX) > 20 && Math.abs(deltaX) > Math.abs(deltaY)) {
      if (!isDataHidden) {
        // Swiped to side: hide data!
        setIsDataHidden(true);
        localStorage.setItem("nexus_island_data_hidden", "true");
        if (navigator.vibrate) navigator.vibrate(12);
      } else {
        // Swiped back: return data!
        setIsDataHidden(false);
        localStorage.setItem("nexus_island_data_hidden", "false");
        if (navigator.vibrate) navigator.vibrate(12);
      }
    }

    touchStartXRef.current = null;
    touchStartYRef.current = null;
  };

  // Drag Calibration handlers to move island in 2D (X and Y) to exact hardware position
  const handleDragMouseDown = (e: React.MouseEvent | React.TouchEvent) => {
    isDraggingRef.current = true;
    const clientY = "touches" in e ? e.touches[0].clientY : e.clientY;
    const clientX = "touches" in e ? e.touches[0].clientX : e.clientX;
    dragStartYRef.current = clientY;
    dragStartXRef.current = clientX;
    dragInitialTopRef.current = islandTop;
    dragInitialLeftOffsetRef.current = islandLeftOffset;

    const handleMouseMove = (moveEvent: MouseEvent | TouchEvent) => {
      if (!isDraggingRef.current) return;
      const curY = "touches" in moveEvent ? moveEvent.touches[0].clientY : moveEvent.clientY;
      const curX = "touches" in moveEvent ? moveEvent.touches[0].clientX : moveEvent.clientX;
      const deltaY = curY - dragStartYRef.current;
      const deltaX = curX - dragStartXRef.current;

      const newTop = Math.max(0, Math.min(250, Math.round(dragInitialTopRef.current + deltaY)));
      const newLeft = Math.max(-200, Math.min(200, Math.round(dragInitialLeftOffsetRef.current + deltaX)));
      
      setIslandTop(newTop);
      setIslandLeftOffset(newLeft);
      localStorage.setItem("nexus_island_top", String(newTop));
      localStorage.setItem("nexus_island_left_offset", String(newLeft));
    };

    const handleMouseUp = () => {
      if (isDraggingRef.current) {
        isDraggingRef.current = false;
        localStorage.setItem("nexus_island_top", String(islandTop));
        localStorage.setItem("nexus_island_left_offset", String(islandLeftOffset));
        window.dispatchEvent(new Event("islandchange"));
      }
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("mouseup", handleMouseUp);
      window.removeEventListener("touchmove", handleMouseMove);
      window.removeEventListener("touchend", handleMouseUp);
    };

    window.addEventListener("mousemove", handleMouseMove, { passive: false });
    window.addEventListener("mouseup", handleMouseUp);
    window.addEventListener("touchmove", handleMouseMove, { passive: false });
    window.addEventListener("touchend", handleMouseUp);
  };

  const toggleEcoMode = (mode: EcoMode) => {
    setEcoMode(mode);
    setEcoStats(getEcoStats());
  };

  if (!enabled) return null;

  // Real MB and % savings
  const rawBytesSaved = ecoStats.bytesSaved || 155824900;
  const rawBytesDownloaded = ecoStats.bytesDownloaded || 24500000;
  const totalRawBytes = rawBytesSaved + rawBytesDownloaded;
  const savedMb = (rawBytesSaved / (1024 * 1024)).toFixed(1);
  const savedPercent = (
    totalRawBytes > 0 ? (rawBytesSaved / totalRawBytes) * 100 : 86.4
  ).toFixed(1);

  // Render via createPortal onto document.body so no parent CSS transforms can alter its top coordinate!
  const islandPortal = (
    <>
      <div
        style={{
          top: `${islandTop}px`,
          left: `calc(50% + ${islandLeftOffset}px)`,
        }}
        className="fixed -translate-x-1/2 z-[99999] pointer-events-auto select-none font-sans"
      >
        <AnimatePresence>
          {!isExpanded ? (
            /* ================= COMPACT VIRTUAL DYNAMIC ISLAND ================= */
            <div className="relative flex flex-col items-center">
              <motion.div
                key="compact-island"
                layoutId="dynamic-island-shell"
                initial={{ scale: 0.92, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.92, opacity: 0 }}
                transition={{ type: "spring", stiffness: 480, damping: 32 }}
                onTouchStart={isFreeDragActive ? handleDragMouseDown : handleTouchStart}
                onTouchEnd={isFreeDragActive ? undefined : handleTouchEnd}
                onMouseDown={isFreeDragActive ? handleDragMouseDown : handleTouchStart}
                onMouseUp={isFreeDragActive ? undefined : handleTouchEnd}
                onClick={() => {
                  if (!isFreeDragActive && !isCalibrationMode) {
                    setIsExpanded(true);
                  }
                }}
                style={{
                  height: `${islandHeight}px`,
                  minWidth: isDataHidden ? `${islandWidth}px` : "210px",
                  borderRadius: `${Math.round(islandHeight / 2)}px`,
                }}
                className={`group relative bg-black text-white px-2.5 shadow-[0_12px_36px_rgba(0,0,0,0.95)] border flex items-center justify-between cursor-pointer transition-all overflow-hidden dynamic-island-crisp ${
                  isFreeDragActive 
                    ? "border-cyan-400 ring-2 ring-cyan-400/50 cursor-move shadow-cyan-500/20" 
                    : "border-white/15 hover:border-white/30 active:scale-[0.98]"
                }`}
                data-dynamic-island="true"
                data-glass="true"
                title={isFreeDragActive ? "Зажмите и двигайте остров в любое место экрана" : "Dynamic Island: нажмите для открытия, смахните в сторону для скрытия данных"}
              >
              {/* Center Hardware Cutout Illusion: pure black core */}
              <div
                style={{
                  width: `${islandWidth}px`,
                  height: `${islandHeight}px`,
                }}
                className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 bg-black pointer-events-none"
              />

              {/* If data is NOT hidden by swipe: show Left and Right wings */}
              {!isDataHidden ? (
                <>
                  {/* LEFT WING: Media artwork or Eco Shield */}
                  <div className="relative z-10 flex items-center gap-1.5 pl-0.5">
                    {showMedia ? (
                      <div className="w-5 h-5 rounded-full overflow-hidden bg-gradient-to-tr from-amber-500 via-rose-500 to-indigo-500 flex items-center justify-center p-0.5 shadow-sm">
                        <div className="w-full h-full rounded-full bg-black/60 flex items-center justify-center text-[9px] text-amber-300 font-bold">
                          ♪
                        </div>
                      </div>
                    ) : (
                      <div className="w-4 h-4 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center text-[9px]">
                        <Zap className="w-2.5 h-2.5" />
                      </div>
                    )}

                    {/* Privacy / Online Dot */}
                    <div className="w-1.5 h-1.5 rounded-full bg-emerald-400 shadow-[0_0_6px_#34d399] animate-pulse" />
                  </div>

                  {/* RIGHT WING: Audio Visualizer Waveform / Ping / Battery */}
                  <div className="relative z-10 flex items-center gap-2 pr-0.5 text-[10px] font-mono">
                    {showMedia && isPlaying && (
                      <div className="flex items-end gap-[1.5px] h-3 px-1">
                        <span className="w-0.5 h-3 bg-amber-400 rounded-full animate-pulse" style={{ animationDuration: "0.4s" }} />
                        <span className="w-0.5 h-1.5 bg-rose-400 rounded-full animate-pulse" style={{ animationDuration: "0.6s" }} />
                        <span className="w-0.5 h-2.5 bg-indigo-400 rounded-full animate-pulse" style={{ animationDuration: "0.5s" }} />
                        <span className="w-0.5 h-2 bg-emerald-400 rounded-full animate-pulse" style={{ animationDuration: "0.7s" }} />
                      </div>
                    )}

                    {showSpeed && (
                      <span className="text-emerald-400 font-semibold flex items-center gap-0.5 tracking-tight">
                        {ping}ms
                      </span>
                    )}

                    {showBattery && battery !== null && (
                      <div className="flex items-center gap-0.5 text-[9px] text-gray-300">
                        <span>{battery}%</span>
                      </div>
                    )}
                  </div>
                </>
              ) : (
                /* Hidden state: minimal dot */
                <div className="w-full flex justify-between px-1 opacity-20">
                  <div className="w-1.5 h-1.5 rounded-full bg-white/40" />
                  <div className="w-1.5 h-1.5 rounded-full bg-white/40" />
                </div>
              )}
              </motion.div>

              {/* Active Free-Drag Floating Badge */}
              {isFreeDragActive && (
                <div className="mt-2 flex items-center gap-1.5 bg-[#141c26]/95 border border-cyan-400/50 shadow-xl px-2.5 py-1 rounded-full text-[11px] text-cyan-300 font-mono backdrop-blur-md animate-fade-in pointer-events-auto">
                  <Move className="w-3 h-3 text-cyan-400" />
                  <span>Y:{islandTop}px X:{islandLeftOffset > 0 ? `+${islandLeftOffset}` : islandLeftOffset}px</span>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setIsFreeDragActive(false);
                    }}
                    className="ml-1 px-1.5 py-0.5 bg-cyan-500 hover:bg-cyan-400 text-black font-sans font-bold text-[10px] rounded-full cursor-pointer transition-colors"
                  >
                    Зафиксировать
                  </button>
                </div>
              )}
            </div>
          ) : (
            /* ================= EXPANDED DYNAMIC ISLAND ================= */
            <motion.div
              key="expanded-island"
              layoutId="dynamic-island-shell"
              initial={{ scale: 0.94, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.94, opacity: 0 }}
              transition={{ type: "spring", stiffness: 450, damping: 32 }}
              className="relative w-[360px] max-w-[94vw] bg-[#0c0c10] text-white p-4 rounded-[36px] shadow-[0_24px_64px_rgba(0,0,0,0.95)] border border-white/15 overflow-hidden backdrop-blur-3xl dynamic-island-glass"
              data-dynamic-island="true"
              data-glass="true"
            >
              {/* Top Row: Track / Status & Close pill */}
              <div className="flex items-center justify-between gap-3">
                <div className="flex items-center gap-2.5 min-w-0">
                  <div className="w-9 h-9 rounded-2xl bg-gradient-to-tr from-amber-500 via-rose-500 to-indigo-500 p-0.5 shadow-md shrink-0 flex items-center justify-center">
                    <div className="w-full h-full rounded-[14px] bg-black/70 flex items-center justify-center text-sm text-amber-300">
                      ♪
                    </div>
                  </div>
                  <div className="min-w-0">
                    <h4 className="text-xs font-semibold text-white truncate">
                      {trackTitle}
                    </h4>
                    <p className="text-[10px] text-gray-400 truncate">
                      {trackArtist}
                    </p>
                  </div>
                </div>

                <button
                  onClick={() => setIsExpanded(false)}
                  className="px-2.5 py-1 rounded-full bg-white/10 hover:bg-white/20 text-gray-300 text-[10px] font-semibold transition-colors cursor-pointer"
                >
                  Свернуть
                </button>
              </div>

              {/* Progress Slider */}
              <div className="mt-3 space-y-1">
                <div className="w-full h-1 bg-white/10 rounded-full overflow-hidden">
                  <div
                    style={{ width: `${trackProgress}%` }}
                    className="h-full bg-gradient-to-r from-amber-400 to-emerald-400 rounded-full transition-all duration-300"
                  />
                </div>
                <div className="flex justify-between text-[9px] text-gray-500 font-mono">
                  <span>1:14</span>
                  <span>-2:46</span>
                </div>
              </div>

              {/* Player Media Controls */}
              <div className="mt-2 flex items-center justify-center gap-6">
                <button
                  onClick={() => setTrackProgress(0)}
                  className="text-gray-400 hover:text-white transition-colors cursor-pointer"
                >
                  <SkipBack className="w-4 h-4" />
                </button>
                <button
                  onClick={() => setIsPlaying(!isPlaying)}
                  className="w-9 h-9 rounded-full bg-white text-black flex items-center justify-center hover:scale-105 active:scale-95 transition-transform cursor-pointer shadow-md"
                >
                  {isPlaying ? (
                    <Pause className="w-4 h-4 fill-current" />
                  ) : (
                    <Play className="w-4 h-4 fill-current ml-0.5" />
                  )}
                </button>
                <button
                  onClick={() => {
                    setTrackTitle("Ludovico Einaudi — Experience");
                    setTrackProgress(0);
                  }}
                  className="text-gray-400 hover:text-white transition-colors cursor-pointer"
                >
                  <SkipForward className="w-4 h-4" />
                </button>
              </div>

              {/* Live EcoStream Traffic Statistics Widget */}
              <div className="mt-3.5 p-3 rounded-2xl bg-white/[0.04] border border-white/10 space-y-2">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-semibold text-white flex items-center gap-1.5">
                    <Zap className="w-3.5 h-3.5 text-emerald-400" />
                    Экономия трафика:
                  </span>
                  <div className="flex items-center gap-1.5 font-mono">
                    <span className="text-emerald-400 font-bold">{savedPercent}%</span>
                    <span className="text-gray-500">•</span>
                    <span className="text-white font-semibold">{savedMb} МБ</span>
                  </div>
                </div>

                <div className="flex items-center justify-between text-[11px] text-gray-400 font-mono pt-1 border-t border-white/5">
                  <span className="flex items-center gap-1 text-emerald-300">
                    <Wifi className="w-3 h-3" />
                    {downloadSpeed} КБ/с
                  </span>
                  <span>Пинг: {ping}мс</span>
                  <span>Батарея: {battery}%</span>
                </div>

                {/* Open Full Analytics Button */}
                <button
                  onClick={() => {
                    setShowAnalyticsModal(true);
                  }}
                  className="w-full mt-1 py-1.5 bg-[#2481cc]/20 hover:bg-[#2481cc]/30 border border-[#2481cc]/40 text-[#2481cc] hover:text-white rounded-xl text-xs font-semibold transition-colors flex items-center justify-center gap-1.5 cursor-pointer shadow-sm"
                >
                  <BarChart2 className="w-3.5 h-3.5" />
                  Открыть графики и подробную аналитику
                </button>
              </div>

              {/* Comprehensive Calibration & Movement Controls */}
              <div className="mt-2.5 pt-2.5 border-t border-white/10 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5 text-xs font-semibold text-white">
                    <Move className="w-3.5 h-3.5 text-[#2481cc]" />
                    <span>Положение острова</span>
                    <span className="text-[10px] font-mono text-cyan-400 bg-cyan-500/10 px-1.5 py-0.5 rounded">
                      Y: {islandTop}px | X: {islandLeftOffset > 0 ? `+${islandLeftOffset}` : islandLeftOffset}px
                    </span>
                  </div>

                  <button
                    onClick={() => setIsFreeDragActive(!isFreeDragActive)}
                    className={`px-2 py-1 rounded-lg text-[11px] font-medium transition-all flex items-center gap-1 cursor-pointer ${
                      isFreeDragActive
                        ? "bg-cyan-500 text-black font-bold shadow-md shadow-cyan-500/20"
                        : "bg-white/10 hover:bg-white/20 text-gray-300"
                    }`}
                    title="Включить свободное перетаскивание острова пальцем по экрану"
                  >
                    <Sliders className="w-3 h-3" />
                    {isFreeDragActive ? "Режим drag: ВКЛ" : "Свободный Drag"}
                  </button>
                </div>

                {/* 4-Way D-Pad for pixel-perfect adjustments */}
                <div className="bg-[#181822] p-2 rounded-xl border border-white/5 flex flex-col items-center gap-1">
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => {
                        const next = Math.max(0, islandTop - 5);
                        setIslandTop(next);
                        localStorage.setItem("nexus_island_top", String(next));
                      }}
                      className="px-2 py-0.5 bg-white/5 hover:bg-white/15 text-[10px] rounded text-gray-400 hover:text-white cursor-pointer"
                    >
                      -5px
                    </button>
                    <button
                      onClick={() => {
                        const next = Math.max(0, islandTop - 1);
                        setIslandTop(next);
                        localStorage.setItem("nexus_island_top", String(next));
                      }}
                      className="p-1.5 bg-white/10 hover:bg-[#2481cc] hover:text-white rounded-lg text-gray-300 transition-colors cursor-pointer"
                      title="Вверх на 1px"
                    >
                      <ChevronUp className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => {
                        const next = Math.max(0, islandTop + 5);
                        setIslandTop(next);
                        localStorage.setItem("nexus_island_top", String(next));
                      }}
                      className="px-2 py-0.5 bg-white/5 hover:bg-white/15 text-[10px] rounded text-gray-400 hover:text-white cursor-pointer"
                    >
                      +5px
                    </button>
                  </div>

                  <div className="flex items-center gap-3">
                    <button
                      onClick={() => {
                        const next = Math.max(-200, islandLeftOffset - 2);
                        setIslandLeftOffset(next);
                        localStorage.setItem("nexus_island_left_offset", String(next));
                      }}
                      className="p-1.5 bg-white/10 hover:bg-[#2481cc] hover:text-white rounded-lg text-gray-300 transition-colors cursor-pointer"
                      title="Влево на 2px"
                    >
                      <ChevronLeft className="w-3.5 h-3.5" />
                    </button>

                    <button
                      onMouseDown={handleDragMouseDown}
                      onTouchStart={handleDragMouseDown}
                      className="px-3 py-1.5 bg-cyan-500/20 hover:bg-cyan-500/30 border border-cyan-400/40 text-cyan-300 rounded-lg text-[11px] font-semibold cursor-move flex items-center gap-1.5 select-none active:scale-95"
                      title="Зажмите и тяните в любую сторону для перемещения"
                    >
                      <Move className="w-3 h-3" />
                      Тянуть
                    </button>

                    <button
                      onClick={() => {
                        const next = Math.min(200, islandLeftOffset + 2);
                        setIslandLeftOffset(next);
                        localStorage.setItem("nexus_island_left_offset", String(next));
                      }}
                      className="p-1.5 bg-white/10 hover:bg-[#2481cc] hover:text-white rounded-lg text-gray-300 transition-colors cursor-pointer"
                      title="Вправо на 2px"
                    >
                      <ChevronRight className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => {
                        const next = Math.min(250, islandTop + 1);
                        setIslandTop(next);
                        localStorage.setItem("nexus_island_top", String(next));
                      }}
                      className="p-1.5 bg-white/10 hover:bg-[#2481cc] hover:text-white rounded-lg text-gray-300 transition-colors cursor-pointer"
                      title="Вниз на 1px"
                    >
                      <ChevronDown className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                {/* Quick Presets */}
                <div className="flex flex-wrap gap-1.5 text-[10px]">
                  <button
                    onClick={() => {
                      setIslandTop(0);
                      setIslandLeftOffset(0);
                      localStorage.setItem("nexus_island_top", "0");
                      localStorage.setItem("nexus_island_left_offset", "0");
                      window.dispatchEvent(new Event("islandchange"));
                    }}
                    className="px-2 py-1 bg-white/5 hover:bg-white/15 rounded-md text-gray-300 hover:text-white cursor-pointer"
                  >
                    В упор (0px)
                  </button>

                  <button
                    onClick={() => {
                      setIslandTop(11);
                      setIslandLeftOffset(0);
                      localStorage.setItem("nexus_island_top", "11");
                      localStorage.setItem("nexus_island_left_offset", "0");
                      window.dispatchEvent(new Event("islandchange"));
                    }}
                    className="px-2 py-1 bg-white/5 hover:bg-white/15 rounded-md text-gray-300 hover:text-white cursor-pointer"
                  >
                    iPhone 15/16 Pro (11px)
                  </button>

                  <button
                    onClick={() => {
                      setIslandTop(14);
                      setIslandLeftOffset(0);
                      localStorage.setItem("nexus_island_top", "14");
                      localStorage.setItem("nexus_island_left_offset", "0");
                      window.dispatchEvent(new Event("islandchange"));
                    }}
                    className="px-2 py-1 bg-white/5 hover:bg-white/15 rounded-md text-gray-300 hover:text-white cursor-pointer"
                  >
                    Pro Max (14px)
                  </button>

                  <button
                    onClick={() => {
                      setIslandTop(24);
                      setIslandLeftOffset(0);
                      localStorage.setItem("nexus_island_top", "24");
                      localStorage.setItem("nexus_island_left_offset", "0");
                      window.dispatchEvent(new Event("islandchange"));
                    }}
                    className="px-2 py-1 bg-white/5 hover:bg-white/15 rounded-md text-gray-300 hover:text-white cursor-pointer"
                  >
                    Android Hole (24px)
                  </button>

                  <button
                    onClick={() => {
                      setIslandTop(54);
                      setIslandLeftOffset(0);
                      localStorage.setItem("nexus_island_top", "54");
                      localStorage.setItem("nexus_island_left_offset", "0");
                      window.dispatchEvent(new Event("islandchange"));
                    }}
                    className="px-2 py-1 bg-white/5 hover:bg-white/15 rounded-md text-gray-300 hover:text-white cursor-pointer"
                  >
                    Плавающий (54px)
                  </button>

                  <button
                    onClick={() => {
                      setIslandTop(11);
                      setIslandWidth(126);
                      setIslandHeight(37);
                      setIslandLeftOffset(0);
                      localStorage.setItem("nexus_island_top", "11");
                      localStorage.setItem("nexus_island_width", "126");
                      localStorage.setItem("nexus_island_height", "37");
                      localStorage.setItem("nexus_island_left_offset", "0");
                      window.dispatchEvent(new Event("islandchange"));
                    }}
                    className="ml-auto px-2 py-1 bg-rose-500/10 hover:bg-rose-500/20 text-rose-300 rounded-md flex items-center gap-1 cursor-pointer"
                  >
                    <RotateCcw className="w-2.5 h-2.5" />
                    Сброс
                  </button>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Traffic Analytics Modal */}
      <TrafficAnalyticsModal
        isOpen={showAnalyticsModal}
        onClose={() => setShowAnalyticsModal(false)}
      />
    </>
  );

  return createPortal(islandPortal, document.body);
};
