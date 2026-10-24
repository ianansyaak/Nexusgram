// Theme & Client Customization Manager for Nexusgram

export function applyClientAccent(color: string) {
  if (typeof document === "undefined") return;

  document.documentElement.style.setProperty("--client-accent-color", color);
  document.documentElement.style.setProperty("--nexus-accent", color);

  let styleTag = document.getElementById("nexus-dynamic-accent-style") as HTMLStyleElement;
  if (!styleTag) {
    styleTag = document.createElement("style");
    styleTag.id = "nexus-dynamic-accent-style";
    document.head.appendChild(styleTag);
  }

  styleTag.innerHTML = `
    :root {
      --client-accent-color: ${color};
      --client-accent-glow: ${color}55;
    }
    .nexus-accent-bg,
    .bg-indigo-600,
    .hover\\:bg-indigo-600:hover,
    .bg-indigo-500,
    .hover\\:bg-indigo-500:hover {
      background-color: ${color} !important;
    }
    .nexus-accent-text,
    .text-indigo-400,
    .text-indigo-500,
    .hover\\:text-indigo-300:hover {
      color: ${color} !important;
    }
    .nexus-accent-border,
    .border-indigo-500,
    .focus\\:border-indigo-500:focus,
    .focus\\:ring-indigo-500:focus {
      border-color: ${color} !important;
    }
  `;
}

export function applyClientTransparency(opacity: number, blur: number) {
  if (typeof document === "undefined") return;

  let styleTag = document.getElementById("nexus-dynamic-transparency-style") as HTMLStyleElement;
  if (!styleTag) {
    styleTag = document.createElement("style");
    styleTag.id = "nexus-dynamic-transparency-style";
    document.head.appendChild(styleTag);
  }

  const opPercent = Math.min(1, Math.max(0.15, opacity));
  const blurPx = Math.min(40, Math.max(0, blur));

  styleTag.innerHTML = `
    :root {
      --nexus-surface-op: ${opPercent};
      --nexus-surface-blur: ${blurPx}px;
    }
    .nexus-glass-panel,
    .telegram-chat-bg,
    aside,
    nav {
      backdrop-filter: blur(var(--nexus-surface-blur)) !important;
      -webkit-backdrop-filter: blur(var(--nexus-surface-blur)) !important;
    }
  `;
}

// Initialize on page load
if (typeof window !== "undefined") {
  const savedColor = localStorage.getItem("nexus_client_color") || "#2481cc";
  applyClientAccent(savedColor);

  const isGlass = localStorage.getItem("nexus_enable_ios_glass") === "true";
  const savedOp = parseFloat(localStorage.getItem("nexus_glass_opacity") || "0.85");
  const savedBlur = parseInt(localStorage.getItem("nexus_glass_blur") || "20");
  if (isGlass) {
    applyClientTransparency(savedOp, savedBlur);
  }
}
