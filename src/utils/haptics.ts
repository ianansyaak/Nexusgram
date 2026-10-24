// Haptic feedback & vibration manager for iOS/Android & browsers
// Supports standard navigator.vibrate as well as WebKit/Telegram WebApp haptics

export type HapticType = "light" | "medium" | "heavy" | "success" | "warning" | "error" | "message" | "swipe";

export function triggerHaptic(type: HapticType = "light") {
  if (typeof window === "undefined") return;

  // 1. Try Telegram WebApp HapticFeedback if running inside Telegram WebApp
  const tgHaptic = (window as any).Telegram?.WebApp?.HapticFeedback;
  if (tgHaptic) {
    try {
      if (type === "success" || type === "warning" || type === "error") {
        tgHaptic.notificationOccurred(type);
      } else if (type === "light" || type === "medium" || type === "heavy") {
        tgHaptic.impactOccurred(type);
      } else {
        tgHaptic.impactOccurred("light");
      }
      return;
    } catch (_) {}
  }

  // 2. Standard navigator.vibrate
  if (typeof navigator !== "undefined" && typeof navigator.vibrate === "function") {
    try {
      switch (type) {
        case "swipe":
          navigator.vibrate(12);
          break;
        case "message":
          navigator.vibrate([20, 50, 20]);
          break;
        case "success":
          navigator.vibrate([15, 30, 25]);
          break;
        case "warning":
          navigator.vibrate([30, 50, 30]);
          break;
        case "error":
          navigator.vibrate([50, 100, 50]);
          break;
        case "heavy":
          navigator.vibrate(40);
          break;
        case "medium":
          navigator.vibrate(25);
          break;
        case "light":
        default:
          navigator.vibrate(10);
          break;
      }
    } catch (_) {}
  }

  // 3. WebKit messageHandlers haptic bridge if native iOS container
  const webkitHaptic = (window as any).webkit?.messageHandlers?.haptic;
  if (webkitHaptic && typeof webkitHaptic.postMessage === "function") {
    try {
      webkitHaptic.postMessage({ type });
    } catch (_) {}
  }
}
