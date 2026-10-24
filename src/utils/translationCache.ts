// Centralized translation cache & persistent store
// Key: targetLang:textHash -> translatedText

const CACHE_PREFIX = "nexus_tr_";

export function getCachedTranslation(targetLang: string, text: string): string | null {
  if (!text) return null;
  try {
    const key = `${CACHE_PREFIX}${targetLang}_${hashString(text.trim())}`;
    return localStorage.getItem(key);
  } catch (e) {
    return null;
  }
}

export function setCachedTranslation(targetLang: string, text: string, translation: string) {
  if (!text || !translation) return;
  try {
    const key = `${CACHE_PREFIX}${targetLang}_${hashString(text.trim())}`;
    localStorage.setItem(key, translation);
  } catch (e) {
    // If quota exceeded, clear old translations
    try {
      for (let i = 0; i < localStorage.length; i++) {
        const k = localStorage.key(i);
        if (k && k.startsWith(CACHE_PREFIX)) {
          localStorage.removeItem(k);
        }
      }
      const key = `${CACHE_PREFIX}${targetLang}_${hashString(text.trim())}`;
      localStorage.setItem(key, translation);
    } catch (_) {}
  }
}

function hashString(str: string): string {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const chr = str.charCodeAt(i);
    hash = (hash << 5) - hash + chr;
    hash |= 0;
  }
  return Math.abs(hash).toString(36);
}
