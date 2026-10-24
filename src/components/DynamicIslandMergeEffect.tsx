import React, { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { triggerHaptic } from "../utils/haptics";

export interface IslandMergeState {
  isActive: boolean;
  hasClient?: boolean;
  avatarX: number;
  avatarY: number;
  avatarRadius: number;
  dragDeltaY: number;
}

// Global listener hook
let globalMergeListeners: ((state: IslandMergeState) => void)[] = [];

export function dispatchIslandMergeState(state: IslandMergeState) {
  globalMergeListeners.forEach((l) => l(state));
}

export const DynamicIslandMergeEffect: React.FC = () => {
  const [mergeState, setMergeState] = useState<IslandMergeState>({
    isActive: false,
    hasClient: false,
    avatarX: typeof window !== "undefined" ? window.innerWidth / 2 : 190,
    avatarY: 100,
    avatarRadius: 48,
    dragDeltaY: 0,
  });

  const [hasMergedOnce, setHasMergedOnce] = useState(false);
  const [deviceType, setDeviceType] = useState<"ios" | "android">(() => {
    const saved = localStorage.getItem("nexus_island_device_type");
    if (saved === "android" || saved === "ios") return saved;
    return typeof navigator !== "undefined" && /android/i.test(navigator.userAgent) ? "android" : "ios";
  });

  useEffect(() => {
    const handler = (s: IslandMergeState) => {
      setMergeState(s);
    };
    globalMergeListeners.push(handler);

    const onIslandChange = () => {
      const saved = localStorage.getItem("nexus_island_device_type");
      if (saved === "android" || saved === "ios") setDeviceType(saved);
    };
    window.addEventListener("islandchange", onIslandChange);

    return () => {
      globalMergeListeners = globalMergeListeners.filter((l) => l !== handler);
      window.removeEventListener("islandchange", onIslandChange);
    };
  }, []);

  if (!mergeState.isActive) return null;

  // Dimensions of Cutout / Dynamic Island
  const isAndroid = deviceType === "android";
  const isPWA =
    typeof window !== "undefined" &&
    (window.matchMedia("(display-mode: standalone)").matches ||
      (window.navigator as unknown as { standalone?: boolean }).standalone === true);

  // Android: circular camera punch-hole (14x14 dot)
  // iOS: Dynamic Island pill (126x37)
  const islandWidth = isAndroid ? 16 : parseInt(localStorage.getItem("nexus_island_width") || "126");
  const islandHeight = isAndroid ? 16 : parseInt(localStorage.getItem("nexus_island_height") || "37");
  const islandTop = parseInt(
    localStorage.getItem("nexus_island_top") || (isAndroid ? "10" : (isPWA ? "11" : "10"))
  );
  const islandCenterX = typeof window !== "undefined" ? window.innerWidth / 2 : 190;
  const islandBottomY = islandTop + islandHeight;

  // Avatar positions including pull delta
  const currentAvatarCenterY = mergeState.avatarY + mergeState.dragDeltaY;
  const currentAvatarTop = currentAvatarCenterY - mergeState.avatarRadius;
  const distance = currentAvatarTop - islandBottomY;

  // Continuous fluid liquid connection
  const maxDistance = isAndroid ? 280 : 220;
  const clampedDistance = Math.max(0, distance);
  const rawProgress = Math.max(0, Math.min(1, (maxDistance - clampedDistance) / maxDistance));
  const progress = distance <= 0 ? 1 : Math.pow(rawProgress, isAndroid ? 1.3 : 1.15);

  const isConnected = progress > 0.03;
  const isFullyMerged = distance <= (isAndroid ? 14 : 20) || progress > 0.88;

  // Trigger haptic once when merging
  if (isFullyMerged && !hasMergedOnce) {
    setHasMergedOnce(true);
    triggerHaptic("medium");
  } else if (!isFullyMerged && hasMergedOnce) {
    setHasMergedOnce(false);
  }

  // Geometric coordinates for organic fluid drop connection
  const islandHalfW = isAndroid 
    ? Math.min(islandWidth / 2, 8 + progress * 6)
    : Math.min(islandWidth / 2, 42 + progress * 32);

  const avatarTopX = mergeState.avatarX || islandCenterX;
  // Thickness of the liquid neck connecting Cutout/Island with the avatar
  const neckWidth = isAndroid
    ? Math.max(3, progress * (islandHalfW * 1.1))
    : Math.max(8, progress * (islandHalfW * 0.85));

  const p1x = islandCenterX - islandHalfW * (isAndroid ? 0.95 : 0.85);
  const p1y = islandBottomY - 0.5;
  const p2x = islandCenterX + islandHalfW * (isAndroid ? 0.95 : 0.85);
  const p2y = islandBottomY - 0.5;

  const a1x = avatarTopX - neckWidth;
  const a1y = Math.max(islandBottomY, currentAvatarTop + (isAndroid ? 10 : 14));
  const a2x = avatarTopX + neckWidth;
  const a2y = Math.max(islandBottomY, currentAvatarTop + (isAndroid ? 10 : 14));

  const midY = (p1y + a1y) / 2;

  const liquidBridgePath = `
    M ${p1x} ${p1y}
    C ${p1x} ${midY}, ${a1x} ${midY}, ${a1x} ${a1y}
    L ${a2x} ${a2y}
    C ${a2x} ${midY}, ${p2x} ${midY}, ${p2x} ${p2y}
    Z
  `;

  return createPortal(
    <div
      className="fixed inset-x-0 top-0 pointer-events-none z-[100000] select-none"
      style={{
        height: Math.max(340, currentAvatarCenterY + mergeState.avatarRadius + 30),
        touchAction: "none",
        willChange: "transform",
      }}
    >
      <svg
        className="w-full h-full"
        style={{
          filter: "drop-shadow(0 4px 14px rgba(0, 0, 0, 0.45))",
        }}
      >
        <defs>
          {/* Hardware-accelerated local scoped gooey liquid filter */}
          <filter id="nexus-liquid-gooey-fast" x="-20%" y="-20%" width="140%" height="140%">
            <feGaussianBlur in="SourceGraphic" stdDeviation={isAndroid ? "3.5" : "5"} result="blur" />
            <feColorMatrix
              in="blur"
              mode="matrix"
              values="1 0 0 0 0  0 1 0 0 0  0 0 1 0 0  0 0 0 18 -8"
              result="goo"
            />
            <feComposite in="SourceGraphic" in2="goo" operator="atop" />
          </filter>

          {/* Liquid droplet specular highlight gradient */}
          <linearGradient id="nexus-sheen" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#ffffff" stopOpacity="0.4" />
            <stop offset="60%" stopColor="#ffffff" stopOpacity="0.05" />
            <stop offset="100%" stopColor="#ffffff" stopOpacity="0" />
          </linearGradient>
        </defs>

        {/* 1. Fluid organic droplet connecting Island/Dot to Avatar */}
        {isConnected && (
          <g filter="url(#nexus-liquid-gooey-fast)">
            {/* Cutout base: Android circle dot or iPhone pill */}
            {isAndroid ? (
              <circle
                cx={islandCenterX}
                cy={islandTop + islandHeight / 2}
                r={islandHeight / 2}
                fill="#000000"
              />
            ) : (
              <rect
                x={islandCenterX - islandWidth / 2}
                y={islandTop}
                width={islandWidth}
                height={islandHeight}
                rx={islandHeight / 2}
                fill="#000000"
              />
            )}

            {/* Liquid stretching neck */}
            <path
              d={liquidBridgePath}
              fill="#000000"
              opacity={Math.min(1, progress * 1.15)}
            />

            {/* Avatar droplet anchor ring */}
            <circle
              cx={avatarTopX}
              cy={currentAvatarCenterY}
              r={mergeState.avatarRadius + 2}
              fill="#000000"
            />
          </g>
        )}

        {/* 2. Absolute crisp Cutout overlay (pill or dot) */}
        {isAndroid ? (
          <circle
            cx={islandCenterX}
            cy={islandTop + islandHeight / 2}
            r={islandHeight / 2}
            fill="#000000"
            className="shadow-md"
          />
        ) : (
          <rect
            x={islandCenterX - islandWidth / 2}
            y={islandTop}
            width={islandWidth}
            height={islandHeight}
            rx={islandHeight / 2}
            fill="#000000"
          />
        )}

        {/* 3. Smooth liquid specular reflection (water sheen) */}
        {isConnected && progress > 0.15 && (
          <g opacity={Math.min(0.4, (progress - 0.12) * 0.55)}>
            <path
              d={`M ${p1x + 3} ${p1y + 2} C ${p1x + 5} ${midY}, ${a1x + 4} ${midY}, ${a1x + 3} ${a1y - 4}`}
              fill="none"
              stroke="#ffffff"
              strokeWidth="2"
              strokeLinecap="round"
            />
            <path
              d={`M ${p2x - 3} ${p2y + 2} C ${p2x - 5} ${midY}, ${a2x - 4} ${midY}, ${a2x - 3} ${a2y - 4}`}
              fill="none"
              stroke="#ffffff"
              strokeWidth="1.2"
              strokeLinecap="round"
            />
          </g>
        )}
      </svg>
    </div>,
    document.body
  );
};
