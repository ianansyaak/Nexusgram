import { useState, useEffect, useCallback, useRef } from "react";
import { Sidebar } from "./components/Sidebar";
import { ChatWindow } from "./components/ChatWindow";
import { TelegramLogin } from "./components/TelegramLogin";
import { TelegramChatWindow } from "./components/TelegramChatWindow";
import { NotesView } from "./components/NotesView";
import { createFpsTracker, measurePing } from "./utils/telemetry";
import { applyTheme, useI18n } from "./utils/i18n";
import { initPluginSystem } from "./utils/pluginManager";
import { getLiquidGlassConfig, applyLiquidGlassStyles } from "./utils/liquidGlassTheme";
import { motion, AnimatePresence } from "motion/react";
import { ArrowLeft, Home } from "lucide-react";
import { triggerHaptic } from "./utils/haptics";

import { DynamicIsland } from "./components/DynamicIsland";
import { DynamicIslandMergeEffect } from "./components/DynamicIslandMergeEffect";
import { ReactionDetailsModal } from "./components/ReactionDetailsModal";

export default function App() {
  const { language } = useI18n();
  const [activeChatId, setActiveChatId] = useState("ai-assistant");
  const [activeChatType, setActiveChatType] = useState<"ai" | "telegram" | "notes">("ai");
  const [activeChatName, setActiveChatName] = useState("AI Assistant");
  const [activeChatCanSend, setActiveChatCanSend] = useState(true);
  // Detect PWA / standalone mode to remove overlay blocks and provide full-screen chat
  const [isPWA, setIsPWA] = useState(() => {
    if (typeof window === "undefined") return false;
    return (
      window.matchMedia("(display-mode: standalone)").matches ||
      (window.navigator as any).standalone === true ||
      document.referrer.includes("android-app://")
    );
  });

  useEffect(() => {
    const checkPWA = () => {
      const match = window.matchMedia("(display-mode: standalone)").matches ||
        (window.navigator as any).standalone === true ||
        document.referrer.includes("android-app://");
      setIsPWA(match);
    };
    window.addEventListener("resize", checkPWA);
    return () => window.removeEventListener("resize", checkPWA);
  }, []);

  const [activeSearchQuery, setActiveSearchQuery] = useState("");
  const [isTelegramConnected, setIsTelegramConnected] = useState(false);
  const [mobileView, setMobileView] = useState<"sidebar" | "chat">("sidebar");
  const [isMobile, setIsMobile] = useState(false);
  const [fps, setFps] = useState(60);
  const [ping, setPing] = useState(38);
  const [, setForceRender] = useState(0);

  // Global reaction details modal state
  const [reactionModalData, setReactionModalData] = useState<{
    isOpen: boolean;
    messageId?: string;
    chatId?: string;
    reactions?: any[];
    initialEmoji?: string;
  }>({ isOpen: false });

  useEffect(() => {
    const handleOpenReactionDetails = (e: any) => {
      if (e.detail) {
        setReactionModalData({
          isOpen: true,
          messageId: e.detail.messageId,
          chatId: e.detail.chatId || activeChatId,
          reactions: e.detail.reactions || [],
          initialEmoji: e.detail.initialEmoji,
        });
      }
    };
    window.addEventListener("open-reaction-details", handleOpenReactionDetails);
    return () => window.removeEventListener("open-reaction-details", handleOpenReactionDetails);
  }, [activeChatId]);

  // Live swipe-back state and scaling buttons
  const [swipeStartX, setSwipeStartX] = useState<number | null>(null);
  const [swipeDeltaX, setSwipeDeltaX] = useState(0);
  const [isDraggingBack, setIsDraggingBack] = useState(false);

  // Initialize theme, liquid glass, plugins and dynamic favicon on launch
  useEffect(() => {
    const savedTheme = localStorage.getItem("nexus_theme") || "dark";
    applyTheme(savedTheme);
    applyLiquidGlassStyles(getLiquidGlassConfig());
    initPluginSystem();

    const savedCoverUrl = localStorage.getItem("nexus_custom_icon_url") || "/app-icon.jpg";
    const linkIcon = document.querySelector("link[rel*='icon']") as HTMLLinkElement;
    const linkApple = document.querySelector("link[rel='apple-touch-icon']") as HTMLLinkElement;
    if (linkIcon) linkIcon.href = savedCoverUrl;
    if (linkApple) linkApple.href = savedCoverUrl;

    const handleStorage = (e: StorageEvent) => {
      if (e.key === "nexus_theme" && e.newValue) {
        applyTheme(e.newValue);
      }
      if (e.key === "nexus_liquidglass_config") {
        applyLiquidGlassStyles(getLiquidGlassConfig());
        setForceRender(prev => prev + 1);
      }
    };
    
    const handleThemeChange = () => {
      applyTheme(localStorage.getItem("nexus_theme") || "dark");
    };

    const handleLiquidGlassChange = () => {
      setForceRender(prev => prev + 1);
    };

    const handleLanguageChange = () => {
      setForceRender(prev => prev + 1);
    };

    window.addEventListener("storage", handleStorage);
    window.addEventListener("themechange", handleThemeChange);
    window.addEventListener("liquidglass-change", handleLiquidGlassChange);
    window.addEventListener("languagechange", handleLanguageChange);
    
    return () => {
      window.removeEventListener("storage", handleStorage);
      window.removeEventListener("themechange", handleThemeChange);
      window.removeEventListener("liquidglass-change", handleLiquidGlassChange);
      window.removeEventListener("languagechange", handleLanguageChange);
    };
  }, []);

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 1024);
    };
    checkMobile();
    window.addEventListener("resize", checkMobile, { passive: true });
    return () => window.removeEventListener("resize", checkMobile);
  }, []);

  // Track live FPS and Ping
  useEffect(() => {
    const cleanupFps = createFpsTracker((currentFps) => {
      setFps(currentFps);
    });

    const pingInterval = setInterval(async () => {
      const p = await measurePing();
      setPing(p);
    }, 3000);

    return () => {
      cleanupFps();
      clearInterval(pingInterval);
    };
  }, []);

  const handleSelectChat = useCallback((id: string, type: "ai" | "telegram" | "notes", name: string, canSend: boolean = true) => {
    setActiveChatId(id);
    setActiveChatType(type);
    setActiveChatName(name);
    setActiveChatCanSend(canSend);
    setMobileView("chat");
  }, []);

  const handleBack = useCallback(() => {
    triggerHaptic("light");
    setMobileView("sidebar");
    setSwipeDeltaX(0);
    setSwipeStartX(null);
    setIsDraggingBack(false);
  }, []);

  const touchStartYRef = useRef<number>(0);
  const isHorizontalGestureRef = useRef<boolean | null>(null);

  // Global capture phase touch handler for reliable left-edge swipe back
  useEffect(() => {
    if (mobileView !== "chat") return;

    let localStartX: number | null = null;
    let localStartY: number = 0;
    let localStartTime: number = 0;
    let isHorizontal: boolean | null = null;
    let hasTriggeredHaptic = false;
    let latestDeltaX = 0;
    let latestVelocity = 0;

    const onTouchStartCapture = (e: TouchEvent) => {
      const touch = e.touches[0];
      if (!touch) return;
      // Generous comfortable left zone (up to 220px or 50% of screen)
      if (touch.clientX <= Math.max(220, window.innerWidth * 0.5)) {
        localStartX = touch.clientX;
        localStartY = touch.clientY;
        localStartTime = Date.now();
        isHorizontal = null;
        hasTriggeredHaptic = false;
        latestDeltaX = 0;
        latestVelocity = 0;
        setSwipeStartX(touch.clientX);
        touchStartYRef.current = touch.clientY;
        isHorizontalGestureRef.current = null;
        setSwipeDeltaX(0);
      } else {
        localStartX = null;
      }
    };

    const onTouchMove = (e: TouchEvent) => {
      if (localStartX === null) return;
      const touch = e.touches[0];
      if (!touch) return;

      const diffX = touch.clientX - localStartX;
      const diffY = touch.clientY - localStartY;
      const elapsed = Math.max(1, Date.now() - localStartTime);
      latestVelocity = diffX / elapsed;

      if (isHorizontal === null) {
        if (Math.abs(diffX) > 3 || Math.abs(diffY) > 3) {
          // If flicking right with good angle or high velocity
          if (diffX > 3 && (diffX > Math.abs(diffY) * 0.5 || latestVelocity > 0.3)) {
            isHorizontal = true;
            isHorizontalGestureRef.current = true;
            setIsDraggingBack(true);
          } else if (Math.abs(diffY) > 10 && diffX < 6) {
            isHorizontal = false;
            isHorizontalGestureRef.current = false;
          }
        }
      }

      if (isHorizontal === true) {
        if (e.cancelable) e.preventDefault();
        const currentDelta = Math.max(0, diffX);
        latestDeltaX = currentDelta;
        setSwipeDeltaX(currentDelta);

        if (currentDelta > 35 && !hasTriggeredHaptic) {
          hasTriggeredHaptic = true;
          triggerHaptic("medium");
        }
      }
    };

    const onTouchEnd = () => {
      if (localStartX === null) return;
      if (isHorizontal === true) {
        if (latestDeltaX > 35 || latestVelocity > 0.35) {
          handleBack();
        } else {
          setSwipeDeltaX(0);
        }
      }
      localStartX = null;
      isHorizontal = null;
      setSwipeStartX(null);
      setIsDraggingBack(false);
      isHorizontalGestureRef.current = null;
    };

    window.addEventListener("touchstart", onTouchStartCapture, { capture: true, passive: true });
    window.addEventListener("touchmove", onTouchMove, { capture: true, passive: false });
    window.addEventListener("touchend", onTouchEnd, { passive: true });
    window.addEventListener("touchcancel", onTouchEnd, { passive: true });

    return () => {
      window.removeEventListener("touchstart", onTouchStartCapture, { capture: true });
      window.removeEventListener("touchmove", onTouchMove, { capture: true });
      window.removeEventListener("touchend", onTouchEnd);
      window.removeEventListener("touchcancel", onTouchEnd);
    };
  }, [mobileView, handleBack]);

  const handleMouseDown = (e: React.MouseEvent) => {
    if (mobileView !== "chat" && !isMobile) return;
    const x = e.clientX;
    const y = e.clientY;
    const maxStartX = 90;
    if (x <= maxStartX) {
      setSwipeStartX(x);
      touchStartYRef.current = y;
      isHorizontalGestureRef.current = null;
      setSwipeDeltaX(0);
    }
  };

  useEffect(() => {
    if (swipeStartX === null) return;
    const onMouseMove = (e: MouseEvent) => {
      const diffX = e.clientX - swipeStartX;
      const diffY = e.clientY - touchStartYRef.current;
      if (isHorizontalGestureRef.current === null) {
        if (Math.abs(diffX) > 8 || Math.abs(diffY) > 8) {
          if (diffX > 8 && diffX > Math.abs(diffY) * 1.1) {
            isHorizontalGestureRef.current = true;
            setIsDraggingBack(true);
          } else {
            isHorizontalGestureRef.current = false;
          }
        }
      }
      if (isHorizontalGestureRef.current === true) {
        setSwipeDeltaX(Math.max(0, diffX));
      }
    };
    const onMouseUp = () => {
      if (swipeDeltaX > 50) {
        handleBack();
      } else {
        setSwipeDeltaX(0);
      }
      setSwipeStartX(null);
      setIsDraggingBack(false);
      isHorizontalGestureRef.current = null;
    };
    window.addEventListener("mousemove", onMouseMove);
    window.addEventListener("mouseup", onMouseUp);
    return () => {
      window.removeEventListener("mousemove", onMouseMove);
      window.removeEventListener("mouseup", onMouseUp);
    };
  }, [swipeStartX, swipeDeltaX, handleBack]);

  // Scaling calculation for the 2 buttons:
  // Button 1 (Back): scales up first from 0 to 1 as swipeDeltaX moves from 15px to 55px
  const btn1Scale = Math.min(1, Math.max(0, (swipeDeltaX - 15) / 40));
  // Button 2 (Home): scales up second right next to it as swipeDeltaX moves from 40px to 80px
  const btn2Scale = Math.min(1, Math.max(0, (swipeDeltaX - 40) / 40));

  return (
    <div className="flex w-full h-[100dvh] h-full p-0 m-0 bg-[#0e1621] text-gray-200 overflow-hidden font-sans selection:bg-[#2481cc]/30 select-none relative app-main-view">
      {/* Sidebar - Always rendered, stays beneath on mobile */}
      <div 
        className={`flex-shrink-0 h-full border-r border-[#0e1621] will-change-transform sidebar-glass
          ${isMobile ? "w-full absolute inset-0 z-0" : "w-80 relative block"}
        `}
        data-glass="true"
      >
        <Sidebar 
          onSelectChat={handleSelectChat} 
          activeId={activeChatId}
          isTelegramConnected={isTelegramConnected}
          onSearchChange={setActiveSearchQuery}
          fps={fps}
        />
      </div>

      {/* Chat Window - Slidable on mobile, interactive swipe back with 2 scaling buttons */}
      <AnimatePresence initial={false} mode="popLayout">
        {(!isMobile || mobileView === 'chat') && (
          <motion.div
            key="chat-view"
            className={`flex-1 h-full min-w-0 bg-[#0e1621] will-change-transform chat-surface-container relative overflow-hidden ultra-smooth-gpu
              ${isMobile ? "absolute inset-0 z-10 shadow-2xl" : "relative block"}
            `}
            initial={isMobile ? { x: "100%", opacity: 1 } : false}
            animate={
              isMobile && isDraggingBack
                ? { x: swipeDeltaX, opacity: 1 }
                : isMobile
                  ? { x: 0, opacity: 1 }
                  : undefined
            }
            exit={isMobile ? { x: "100%", opacity: 1 } : undefined}
            transition={{ type: "spring", stiffness: 420, damping: 32, mass: 0.6 }}
            onMouseDown={handleMouseDown}
          >
            {/* Live Swipe-back 2 Scaling Buttons (First button appears from small to large, then 2nd button next to it) */}
            {isDraggingBack && swipeDeltaX > 15 && (
              <div className="absolute left-3 top-1/2 -translate-y-1/2 flex items-center gap-2 z-50 pointer-events-none">
                {/* Button 1: Appears first, growing from small to large */}
                <div 
                  className="w-11 h-11 rounded-full bg-[#2481cc] text-white shadow-xl shadow-[#2481cc]/40 flex items-center justify-center border border-white/20 transition-transform"
                  style={{
                    transform: `scale(${btn1Scale})`,
                    opacity: btn1Scale,
                  }}
                >
                  <ArrowLeft className="w-5 h-5 stroke-[2.5]" />
                </div>

                {/* Button 2: Appears second right next to it, growing from small to large */}
                <div 
                  className="w-11 h-11 rounded-full bg-[#17212b] text-indigo-400 shadow-xl border border-indigo-500/40 flex items-center justify-center transition-transform"
                  style={{
                    transform: `scale(${btn2Scale})`,
                    opacity: btn2Scale,
                  }}
                >
                  <Home className="w-5 h-5" />
                </div>
              </div>
            )}

            {activeChatType === "ai" ? (
              <ChatWindow onBack={handleBack} />
            ) : activeChatType === "notes" ? (
              <NotesView 
                noteId={activeChatId} 
                onBack={handleBack} 
                onDeleteNote={() => {
                  handleBack();
                }}
              />
            ) : (
              <TelegramChatWindow 
                key={activeChatId} 
                chatId={activeChatId} 
                chatName={activeChatName} 
                canSend={activeChatCanSend} 
                searchQuery={activeSearchQuery} 
                onBack={handleBack} 
                onSelectUser={(userId, userName) => {
                  handleSelectChat(userId, "telegram", userName, true);
                }}
              />
            )}
          </motion.div>
        )}
      </AnimatePresence>

      <TelegramLogin onStatusChange={() => setIsTelegramConnected(true)} />

      {/* Global Reaction Details Modal (works across all chats and message types) */}
      <ReactionDetailsModal
        isOpen={reactionModalData.isOpen}
        onClose={() => setReactionModalData((prev) => ({ ...prev, isOpen: false }))}
        chatId={reactionModalData.chatId}
        messageId={reactionModalData.messageId}
        summaryReactions={reactionModalData.reactions}
        initialEmoticon={reactionModalData.initialEmoji}
        onSelectUser={(userId, userName) => {
          handleSelectChat(userId, "telegram", userName, true);
        }}
      />
    </div>
  );
}
