// Utility for resetting app settings, design, and user preferences

import { DEFAULT_LIQUID_GLASS, saveLiquidGlassConfig } from "./liquidGlassTheme";
import { applyTheme } from "./i18n";
import { setEcoMode } from "./ecoStream";

export interface ResetOptions {
  resetDesignOnly?: boolean;
  resetIslandOnly?: boolean;
  resetAll?: boolean;
}

export function resetDesignSettings() {
  try {
    // 1. Reset Liquid Glass to Apple Crystal standard
    localStorage.removeItem("nexus_liquidglass_config");
    saveLiquidGlassConfig({ ...DEFAULT_LIQUID_GLASS, enabled: true });

    // 2. Reset Theme to Dark
    localStorage.setItem("nexus_theme", "dark");
    applyTheme("dark");

    // 3. Reset App Cover & Custom Icons
    localStorage.removeItem("nexus_app_icon");
    localStorage.removeItem("nexus_custom_icon_url");

    // Dispatch global events
    window.dispatchEvent(new Event("themechange"));
    window.dispatchEvent(new Event("liquidglass-change"));
    window.dispatchEvent(new Event("storage"));

    return true;
  } catch (e) {
    console.error("Failed to reset design settings:", e);
    return false;
  }
}

export function resetDynamicIslandSettings() {
  try {
    localStorage.removeItem("nexus_dynamic_island");
    localStorage.removeItem("nexus_island_top");
    localStorage.removeItem("nexus_island_left_offset");
    localStorage.removeItem("nexus_island_width");
    localStorage.removeItem("nexus_island_height");
    localStorage.removeItem("nexus_island_media");
    localStorage.removeItem("nexus_island_battery");
    localStorage.removeItem("nexus_island_speed");
    localStorage.removeItem("nexus_island_calls");
    localStorage.removeItem("nexus_island_data_hidden");

    window.dispatchEvent(new Event("storage"));
    return true;
  } catch (e) {
    console.error("Failed to reset dynamic island:", e);
    return false;
  }
}

export function resetAllAppSettings() {
  try {
    // Preserve Telegram login session!
    const savedTelegramSession = localStorage.getItem("telegram_session");

    // Reset design
    resetDesignSettings();

    // Reset Island
    resetDynamicIslandSettings();

    // Reset EcoStream / bandwidth mode
    setEcoMode("ultra");

    // Reset Language
    localStorage.setItem("nexus_lang", "ru");

    // Reset other UI preferences
    localStorage.removeItem("dismissedChatTypeIcons");
    localStorage.removeItem("current_facing_mode");
    localStorage.removeItem("nexus_cached_gallery_photos");

    if (savedTelegramSession) {
      localStorage.setItem("telegram_session", savedTelegramSession);
    }

    window.dispatchEvent(new Event("themechange"));
    window.dispatchEvent(new Event("liquidglass-change"));
    window.dispatchEvent(new Event("languagechange"));
    window.dispatchEvent(new Event("storage"));

    return true;
  } catch (e) {
    console.error("Failed to reset all app settings:", e);
    return false;
  }
}
