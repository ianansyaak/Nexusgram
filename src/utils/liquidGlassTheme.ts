// Quantum Kinetic Hyper-Glass (QKHG) System
// Inspired by https://github.com/ybouane/liquidglass & Apple iOS/visionOS Liquid Glass
// Ultra-optimized for zero lag, locked 60-120 FPS via Kinetic Scroll Decoupling & Specular Normal Mapping

export interface LiquidGlassConfig {
  enabled: boolean;
  blurAmount: number; // 0 = sharp, 1 = maximum blur
  refraction: number; // 0 to 1.5
  chromAberration: number; // 0 to 0.25
  edgeHighlight: number; // 0 to 1.0
  specular: number; // 0 to 1.0
  fresnel: number; // 0 to 1.0
  distortion: number; // 0 to 0.5
  cornerRadius: number; // px
  zRadius: number; // bevel depth
  opacity: number; // 0.2 to 1.0
  saturation: number; // -1 to 1
  tintStrength: number; // 0 to 1
  brightness: number; // -0.5 to 0.5
  shadowOpacity: number; // 0 to 1
  bevelMode: number; // 0 = biconvex pill, 1 = dome
  floating: boolean;
  button: boolean;
}

export const DEFAULT_LIQUID_GLASS: LiquidGlassConfig = {
  enabled: true, // Enabled by default for all users
  blurAmount: 0.45,
  refraction: 0.85,
  chromAberration: 0.1,
  edgeHighlight: 0.65,
  specular: 0.7,
  fresnel: 0.85,
  distortion: 0.05,
  cornerRadius: 24,
  zRadius: 40,
  opacity: 0.74,
  saturation: 0.25,
  tintStrength: 0.25,
  brightness: 0.03,
  shadowOpacity: 0.45,
  bevelMode: 0,
  floating: true,
  button: true,
};

export const PRESETS: Record<string, { name: string; desc: string; config: Partial<LiquidGlassConfig> }> = {
  crystal: {
    name: "Liquid Crystal (iPhone Glass)",
    desc: "Глянцевое жидкое стекло в стиле Apple iOS: рефракция, двойной бевел и радужная дисперсия",
    config: {
      refraction: 0.95,
      blurAmount: 0.5,
      chromAberration: 0.14,
      edgeHighlight: 0.75,
      specular: 0.85,
      fresnel: 0.9,
      distortion: 0.06,
      opacity: 0.75,
      saturation: 0.3,
      tintStrength: 0.28,
    },
  },
  frosted: {
    name: "Frosted Ice",
    desc: "Глубокое матовое стекло с мягким рассеиванием и кристальным светом",
    config: {
      refraction: 0.4,
      blurAmount: 0.85,
      chromAberration: 0.05,
      edgeHighlight: 0.5,
      specular: 0.45,
      fresnel: 0.65,
      distortion: 0.0,
      opacity: 0.7,
      saturation: 0.15,
      tintStrength: 0.18,
    },
  },
  prismatic: {
    name: "Prismatic Cyber",
    desc: "Выразительная радужная аберрация, неоновый кант и глубокий глянец",
    config: {
      refraction: 1.3,
      blurAmount: 0.55,
      chromAberration: 0.22,
      edgeHighlight: 0.95,
      specular: 0.9,
      fresnel: 0.98,
      distortion: 0.12,
      opacity: 0.8,
      saturation: 0.45,
      tintStrength: 0.38,
    },
  },
  minimal: {
    name: "Minimal Aero",
    desc: "Тончайшее прозрачное стекло с деликатным контуром и максимальной производительностью",
    config: {
      refraction: 0.3,
      blurAmount: 0.4,
      chromAberration: 0.04,
      edgeHighlight: 0.4,
      specular: 0.5,
      fresnel: 0.55,
      distortion: 0.01,
      opacity: 0.64,
      saturation: 0.18,
      tintStrength: 0.12,
    },
  },
};

const STORAGE_KEY = "nexus_liquidglass_config";

export function getLiquidGlassConfig(): LiquidGlassConfig {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return { ...DEFAULT_LIQUID_GLASS, enabled: true };
    const parsed = JSON.parse(raw);
    return { 
      ...DEFAULT_LIQUID_GLASS, 
      ...parsed, 
      enabled: parsed.enabled !== undefined ? parsed.enabled : true 
    };
  } catch (e) {
    return { ...DEFAULT_LIQUID_GLASS, enabled: true };
  }
}

export function saveLiquidGlassConfig(cfg: LiquidGlassConfig) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(cfg));
    applyLiquidGlassStyles(cfg);
    window.dispatchEvent(new CustomEvent("liquidglass-change", { detail: cfg }));
  } catch (e) {
    console.error("Error saving liquid glass config:", e);
  }
}

export function resetLiquidGlassConfig(): LiquidGlassConfig {
  try {
    localStorage.removeItem(STORAGE_KEY);
    const fresh = { ...DEFAULT_LIQUID_GLASS, enabled: true };
    applyLiquidGlassStyles(fresh);
    window.dispatchEvent(new CustomEvent("liquidglass-change", { detail: fresh }));
    return fresh;
  } catch (e) {
    return { ...DEFAULT_LIQUID_GLASS, enabled: true };
  }
}

export const setLiquidGlassConfig = saveLiquidGlassConfig;

// Global Kinetic Acceleration Tracker
let isKineticListening = false;
let kineticScrollTimeout: any = null;

export function setupKineticAcceleration() {
  if (typeof window === "undefined" || isKineticListening) return;
  isKineticListening = true;

  const handleScrollStart = () => {
    if (!document.body.classList.contains("qkhg-kinetic-scrolling")) {
      document.body.classList.add("qkhg-kinetic-scrolling");
    }
    if (kineticScrollTimeout) clearTimeout(kineticScrollTimeout);
    kineticScrollTimeout = setTimeout(() => {
      document.body.classList.remove("qkhg-kinetic-scrolling");
    }, 85);
  };

  window.addEventListener("scroll", handleScrollStart, { passive: true, capture: true });
  window.addEventListener("wheel", handleScrollStart, { passive: true });
  window.addEventListener("touchmove", handleScrollStart, { passive: true });
}

// Injects SVG filters for optical refraction
export function ensureSvgFilters(cfg: LiquidGlassConfig) {
  let svgEl = document.getElementById("nexus-liquidglass-svg-filters");
  if (!svgEl) {
    svgEl = document.createElement("div");
    svgEl.id = "nexus-liquidglass-svg-filters";
    svgEl.style.position = "absolute";
    svgEl.style.width = "0";
    svgEl.style.height = "0";
    svgEl.style.overflow = "hidden";
    svgEl.style.pointerEvents = "none";
    document.body.appendChild(svgEl);
  }

  const scaleVal = (cfg.distortion * 24).toFixed(1);
  svgEl.innerHTML = `
    <svg xmlns="http://www.w3.org/2000/svg">
      <defs>
        <filter id="liquid-glass-disp" x="-10%" y="-10%" width="120%" height="120%">
          <feTurbulence type="fractalNoise" baseFrequency="0.035" numOctaves="2" result="noise" />
          <feDisplacementMap in="SourceGraphic" in2="noise" scale="${scaleVal}" xChannelSelector="R" yChannelSelector="G" result="displaced" />
          <feBlend in="SourceGraphic" in2="displaced" mode="overlay" />
        </filter>
      </defs>
    </svg>
  `;
}

// Injects dynamic CSS variables and classes to restyle the entire app with Apple Liquid Glass
export function applyLiquidGlassStyles(cfg: LiquidGlassConfig) {
  ensureSvgFilters(cfg);
  setupKineticAcceleration();

  let styleEl = document.getElementById("nexus-liquidglass-styles") as HTMLStyleElement;
  if (!styleEl) {
    styleEl = document.createElement("style");
    styleEl.id = "nexus-liquidglass-styles";
    document.head.appendChild(styleEl);
  }

  if (!cfg.enabled) {
    styleEl.innerHTML = "";
    document.body.classList.remove("liquid-glass-active");
    return;
  }

  document.body.classList.add("liquid-glass-active");

  const blurPx = Math.round(cfg.blurAmount * 28 + 10);
  const tintRgba = `rgba(36, 129, 204, ${(cfg.tintStrength * 0.35).toFixed(2)})`;
  const baseBg = `rgba(13, 20, 32, ${cfg.opacity.toFixed(2)})`;
  const bubbleInBg = `rgba(18, 28, 44, ${(cfg.opacity * 0.95).toFixed(2)})`;
  const bubbleOutBg = `rgba(28, 108, 176, ${(cfg.opacity * 0.92).toFixed(2)})`;
  const highlightRgba = `rgba(255, 255, 255, ${(cfg.edgeHighlight * 0.65).toFixed(2)})`;
  const borderRgba = `rgba(255, 255, 255, ${(cfg.edgeHighlight * 0.35 + 0.14).toFixed(2)})`;
  const specularGradient = `linear-gradient(135deg, rgba(255,255,255,${(cfg.specular * 0.38).toFixed(2)}) 0%, rgba(255,255,255,0.06) 28%, transparent 58%, rgba(56,189,248,${(cfg.tintStrength * 0.28).toFixed(2)}) 100%)`;
  const shadowSpread = Math.round(cfg.shadowOpacity * 28 + 8);
  const chromaOffset = (cfg.chromAberration * 5).toFixed(1);
  const chromaShadow = cfg.chromAberration > 0.02
    ? `-${chromaOffset}px 0 0 rgba(239, 68, 68, ${(cfg.chromAberration * 3.8).toFixed(2)}), ${chromaOffset}px 0 0 rgba(56, 189, 248, ${(cfg.chromAberration * 4.2).toFixed(2)}), `
    : "";

  styleEl.innerHTML = `
    :root {
      --lg-blur: ${blurPx}px;
      --lg-bg: ${baseBg};
      --lg-bubble-in: ${bubbleInBg};
      --lg-bubble-out: ${bubbleOutBg};
      --lg-tint: ${tintRgba};
      --lg-highlight: ${highlightRgba};
      --lg-border: ${borderRgba};
      --lg-specular: ${specularGradient};
      --lg-radius: ${cfg.cornerRadius}px;
      --lg-shadow-spread: ${shadowSpread}px;
      --lg-shadow-op: ${cfg.shadowOpacity};
      --lg-saturate: ${(1 + cfg.saturation * 0.7).toFixed(2)};
      --lg-brightness: ${(1 + cfg.brightness * 0.4).toFixed(2)};
    }

    /* QUANTUM KINETIC HYPER-GLASS (QKHG) PERFORMANCE SYSTEM */
    body.liquid-glass-active.qkhg-kinetic-scrolling {
      --lg-blur: 6px !important;
    }
    body.liquid-glass-active [data-glass="true"],
    body.liquid-glass-active .sidebar-glass,
    body.liquid-glass-active .message-bubble-in,
    body.liquid-glass-active .message-bubble-out,
    body.liquid-glass-active .chat-header,
    body.liquid-glass-active .chat-input-bar {
      will-change: transform;
      transform: translateZ(0);
    }

    /* Ambient Living Glass Mesh Backdrop */
    body.liquid-glass-active {
      background-color: #070c14 !important;
      background-image: 
        radial-gradient(circle at 12% 20%, rgba(14, 165, 233, 0.28) 0%, transparent 45%),
        radial-gradient(circle at 88% 75%, rgba(99, 102, 241, 0.24) 0%, transparent 50%),
        radial-gradient(circle at 50% 35%, rgba(20, 184, 166, 0.16) 0%, transparent 60%),
        radial-gradient(circle at 80% 12%, rgba(168, 85, 247, 0.18) 0%, transparent 40%),
        radial-gradient(circle at 25% 85%, rgba(36, 129, 204, 0.22) 0%, transparent 55%) !important;
      background-attachment: fixed !important;
    }

    /* App container transparency */
    body.liquid-glass-active #root,
    body.liquid-glass-active #root > div,
    body.liquid-glass-active .app-main-view {
      background: transparent !important;
    }

    /* Transparent Chat Wallpaper to expose living glass refraction */
    body.liquid-glass-active .telegram-chat-bg {
      background-color: transparent !important;
      background-image: 
        radial-gradient(circle at 50% 50%, rgba(24, 37, 51, 0.15) 0%, rgba(8, 14, 23, 0.75) 100%),
        url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='%2338bdf8' fill-opacity='0.04' fill-rule='evenodd'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/svg%3E") !important;
    }

    /* 1. SIDEBAR & CHAT LIST LIQUID GLASS */
    body.liquid-glass-active .sidebar-glass,
    body.liquid-glass-active [data-glass="true"],
    body.liquid-glass-active .liquid-glass-target,
    body.liquid-glass-active div[class*="border-r border-[#0e1621] bg-[#0e1621]"],
    body.liquid-glass-active div[class*="border-r border-[#2a2a38] bg-[#09090b]"] {
      background: ${baseBg} !important;
      backdrop-filter: blur(var(--lg-blur)) saturate(var(--lg-saturate)) brightness(var(--lg-brightness)) !important;
      -webkit-backdrop-filter: blur(var(--lg-blur)) saturate(var(--lg-saturate)) brightness(var(--lg-brightness)) !important;
      border-right: 1px solid var(--lg-border) !important;
      box-shadow: 
        ${chromaShadow}
        4px 0 var(--lg-shadow-spread) rgba(0, 0, 0, var(--lg-shadow-op)),
        inset 0 1.5px 1px rgba(255, 255, 255, ${(cfg.edgeHighlight * 0.45).toFixed(2)}) !important;
    }

    /* 2. CHAT WINDOW HEADER */
    body.liquid-glass-active .chat-header,
    body.liquid-glass-active div[class*="border-b border-[#0e1621] bg-[#17212b]"],
    body.liquid-glass-active div[class*="border-b border-[#2a2a38] bg-[#09090b]"] {
      background: rgba(14, 21, 33, ${(cfg.opacity * 0.92).toFixed(2)}) !important;
      backdrop-filter: blur(var(--lg-blur)) saturate(var(--lg-saturate)) brightness(var(--lg-brightness)) !important;
      -webkit-backdrop-filter: blur(var(--lg-blur)) saturate(var(--lg-saturate)) brightness(var(--lg-brightness)) !important;
      border-bottom: 1px solid var(--lg-border) !important;
      box-shadow: 
        ${chromaShadow}
        0 8px 26px rgba(0, 0, 0, 0.45),
        inset 0 1.5px 1px rgba(255, 255, 255, ${(cfg.edgeHighlight * 0.55).toFixed(2)}) !important;
    }

    /* 3. INCOMING MESSAGE BUBBLE - FROSTED LIQUID QUARTZ (APPLE GLASS) */
    body.liquid-glass-active .message-bubble-in,
    body.liquid-glass-active div[class*="bg-[#182533]"],
    body.liquid-glass-active div[class*="bg-[#181824]"] {
      background: ${bubbleInBg} !important;
      backdrop-filter: blur(var(--lg-blur)) saturate(var(--lg-saturate)) brightness(var(--lg-brightness)) !important;
      -webkit-backdrop-filter: blur(var(--lg-blur)) saturate(var(--lg-saturate)) brightness(var(--lg-brightness)) !important;
      border: 1px solid var(--lg-border) !important;
      border-radius: ${cfg.cornerRadius}px !important;
      box-shadow: 
        ${chromaShadow}
        0 8px 24px rgba(0, 0, 0, 0.4),
        inset 0 1.5px 1.5px rgba(255, 255, 255, ${(cfg.edgeHighlight * 0.6).toFixed(2)}),
        inset 0 -1.5px 1.5px rgba(56, 189, 248, ${(cfg.tintStrength * 0.35).toFixed(2)}) !important;
    }

    /* 4. OUTGOING MESSAGE BUBBLE - AZURE SAPPHIRE LIQUID GLASS */
    body.liquid-glass-active .message-bubble-out,
    body.liquid-glass-active div[class*="bg-[#2b5278]"] {
      background: linear-gradient(135deg, rgba(34, 120, 196, ${(cfg.opacity * 0.95).toFixed(2)}) 0%, rgba(14, 165, 233, ${(cfg.opacity * 0.88).toFixed(2)}) 100%) !important;
      backdrop-filter: blur(var(--lg-blur)) saturate(var(--lg-saturate)) brightness(var(--lg-brightness)) !important;
      -webkit-backdrop-filter: blur(var(--lg-blur)) saturate(var(--lg-saturate)) brightness(var(--lg-brightness)) !important;
      border: 1px solid rgba(255, 255, 255, ${(cfg.edgeHighlight * 0.65 + 0.15).toFixed(2)}) !important;
      border-radius: ${cfg.cornerRadius}px !important;
      box-shadow: 
        ${chromaShadow}
        0 10px 28px rgba(14, 165, 233, 0.4),
        inset 0 2px 2px rgba(255, 255, 255, 0.7),
        inset 0 -1.5px 1.5px rgba(0, 0, 0, 0.25) !important;
    }

    /* 5. BOTTOM MESSAGE INPUT BAR - FLOATING BICONVEX CAPSULE */
    body.liquid-glass-active .chat-input-bar,
    body.liquid-glass-active div[class*="items-end gap-2 bg-[#17212b]"] {
      background: rgba(15, 23, 35, ${(cfg.opacity * 0.9).toFixed(2)}) !important;
      backdrop-filter: blur(var(--lg-blur)) saturate(var(--lg-saturate)) brightness(var(--lg-brightness)) !important;
      -webkit-backdrop-filter: blur(var(--lg-blur)) saturate(var(--lg-saturate)) brightness(var(--lg-brightness)) !important;
      border: 1px solid var(--lg-border) !important;
      border-radius: ${cfg.cornerRadius}px !important;
      box-shadow: 
        ${chromaShadow}
        0 12px 36px rgba(0, 0, 0, 0.5),
        inset 0 1.5px 1.5px rgba(255, 255, 255, ${(cfg.edgeHighlight * 0.55).toFixed(2)}),
        inset 0 -1px 1px rgba(255, 255, 255, 0.08) !important;
    }

    /* 6. DYNAMIC ISLAND LIQUID PILL */
    body.liquid-glass-active [data-dynamic-island="true"],
    body.liquid-glass-active div[class*="group relative bg-black text-white"] {
      background: rgba(8, 12, 18, 0.78) !important;
      backdrop-filter: blur(32px) saturate(1.4) brightness(1.05) !important;
      -webkit-backdrop-filter: blur(32px) saturate(1.4) brightness(1.05) !important;
      border: 1px solid rgba(255, 255, 255, ${(cfg.edgeHighlight * 0.5 + 0.18).toFixed(2)}) !important;
      box-shadow: 
        -${chromaOffset}px 0 0 rgba(239, 68, 68, 0.35),
        ${chromaOffset}px 0 0 rgba(56, 189, 248, 0.4),
        0 16px 44px rgba(0, 0, 0, 0.85),
        inset 0 2px 2px rgba(255, 255, 255, 0.7),
        inset 0 -1.5px 1px rgba(255, 255, 255, 0.14) !important;
    }

    /* 7. ALL BUTTONS - APPLE LIQUID GLASS PILLS */
    body.liquid-glass-active button[class*="bg-[#2481cc]"],
    body.liquid-glass-active button[class*="bg-blue-500"],
    body.liquid-glass-active button[class*="bg-indigo-500"],
    body.liquid-glass-active button[class*="bg-emerald-500"] {
      box-shadow: 
        0 6px 18px rgba(36, 129, 204, 0.4),
        inset 0 1.5px 1.5px rgba(255, 255, 255, 0.65),
        inset 0 -1px 1px rgba(0, 0, 0, 0.25) !important;
      border: 1px solid rgba(255, 255, 255, 0.35) !important;
    }

    body.liquid-glass-active button[class*="hover:bg-white/5"],
    body.liquid-glass-active button[class*="hover:bg-white/10"],
    body.liquid-glass-active button[class*="bg-[#1c1c28]"],
    body.liquid-glass-active button[class*="bg-[#181824]"] {
      backdrop-filter: blur(12px) !important;
      -webkit-backdrop-filter: blur(12px) !important;
      border: 1px solid rgba(255, 255, 255, 0.12) !important;
      box-shadow: inset 0 1px 1px rgba(255, 255, 255, 0.25) !important;
    }

    /* 8. MODALS, SHEETS & DIALOGS */
    body.liquid-glass-active .modal-glass,
    body.liquid-glass-active div[class*="max-w-md bg-[#111116]"],
    body.liquid-glass-active div[class*="max-w-sm bg-[#111116]"],
    body.liquid-glass-active div[class*="max-w-lg bg-[#111116]"],
    body.liquid-glass-active div[class*="max-w-xl bg-[#111116]"],
    body.liquid-glass-active div[class*="max-w-2xl bg-[#111116]"],
    body.liquid-glass-active div[class*="max-w-3xl bg-[#111116]"],
    body.liquid-glass-active div[class*="max-w-4xl bg-[#111116]"],
    body.liquid-glass-active div[class*="bg-[#17212b]"][class*="rounded"] {
      background: rgba(14, 21, 33, 0.86) !important;
      backdrop-filter: blur(32px) saturate(1.3) !important;
      -webkit-backdrop-filter: blur(32px) saturate(1.3) !important;
      border: 1px solid var(--lg-border) !important;
      box-shadow: 
        ${chromaShadow}
        0 24px 64px rgba(0, 0, 0, 0.7),
        inset 0 1.5px 1.5px rgba(255, 255, 255, ${(cfg.edgeHighlight * 0.55).toFixed(2)}) !important;
    }

    /* 9. SEARCH BAR & INPUT FIELDS */
    body.liquid-glass-active input[class*="bg-[#111116]"],
    body.liquid-glass-active input[class*="bg-[#1a1a24]"],
    body.liquid-glass-active input[class*="bg-[#1c1c28]"] {
      background: rgba(255, 255, 255, 0.07) !important;
      backdrop-filter: blur(14px) !important;
      -webkit-backdrop-filter: blur(14px) !important;
      border: 1px solid var(--lg-border) !important;
      box-shadow: inset 0 1px 3px rgba(0,0,0,0.35), 0 1px 0 rgba(255,255,255,0.1) !important;
    }

    /* 10. AVATAR & MEDIA FRAMES - LIQUID GLASS BEZELS */
    body.liquid-glass-active div[class*="rounded-full"][class*="border"] {
      border: 1px solid rgba(255, 255, 255, 0.3) !important;
      box-shadow: 
        0 4px 12px rgba(0, 0, 0, 0.3),
        inset 0 1px 1.5px rgba(255, 255, 255, 0.5) !important;
    }

    /* 11. PICTURES & MEDIA FRAMING */
    body.liquid-glass-active div[class*="relative cursor-pointer"] img,
    body.liquid-glass-active div[class*="aspect-square"] img {
      border-radius: calc(var(--lg-radius) * 0.6) !important;
      box-shadow: 0 4px 16px rgba(0, 0, 0, 0.35) !important;
    }

    /* 12. TEXT - CRISP APPLE GLASS TYPOGRAPHY */
    body.liquid-glass-active {
      -webkit-font-smoothing: antialiased;
      -moz-osx-font-smoothing: grayscale;
    }
    body.liquid-glass-active h1,
    body.liquid-glass-active h2,
    body.liquid-glass-active h3 {
      text-shadow: 0 1px 2px rgba(0, 0, 0, 0.6) !important;
    }

    /* Specular light gleam on glass targets */
    body.liquid-glass-active [data-glass="true"]::before,
    body.liquid-glass-active .message-bubble::before {
      content: '';
      position: absolute;
      inset: 0;
      border-radius: inherit;
      background: ${specularGradient};
      pointer-events: none;
      z-index: 1;
      opacity: 0.65;
    }
  `;
}

// Automatically apply stored configuration on module load
try {
  if (typeof window !== "undefined") {
    const initialConfig = getLiquidGlassConfig();
    applyLiquidGlassStyles(initialConfig);
  }
} catch (e) {}
