// Supported locales. English is always the fallback. Adding a locale = add it
// here, add a matching catalog under ./messages, and register it in
// ./messages/index.ts — everything else (detection, switcher) picks it up.
export const LOCALES = ['en', 'zh-TW', 'zh-CN', 'ja'] as const;
export type Locale = (typeof LOCALES)[number];

export const DEFAULT_LOCALE: Locale = 'en';

// Native display names for the language switcher.
export const LOCALE_LABELS: Record<Locale, string> = {
  en: 'English',
  'zh-TW': '繁體中文',
  'zh-CN': '简体中文',
  ja: '日本語',
};

// localStorage key holding an explicit user override. When absent, the locale
// follows the browser/system language on every load.
export const LOCALE_STORAGE_KEY = 'gantt-locale';

/** Map an arbitrary BCP-47 tag (e.g. "zh-Hant-HK", "ja-JP") to a supported locale. */
export function normalizeLocale(raw: string | null | undefined): Locale | null {
  if (!raw) return null;
  const lc = raw.toLowerCase();
  if (lc === 'en' || lc.startsWith('en-')) return 'en';
  if (lc.startsWith('ja')) return 'ja';
  // Traditional Chinese variants
  if (
    lc === 'zh-tw' ||
    lc === 'zh-hk' ||
    lc === 'zh-mo' ||
    lc.includes('hant')
  ) {
    return 'zh-TW';
  }
  // Simplified Chinese variants (and bare "zh")
  if (lc === 'zh' || lc.startsWith('zh')) return 'zh-CN';
  return null;
}

/** Best supported locale for the current browser/system, falling back to English. */
export function detectLocale(): Locale {
  if (typeof navigator === 'undefined') return DEFAULT_LOCALE;
  const langs =
    Array.isArray(navigator.languages) && navigator.languages.length > 0
      ? navigator.languages
      : [navigator.language];
  for (const l of langs) {
    const norm = normalizeLocale(l);
    if (norm) return norm;
  }
  return DEFAULT_LOCALE;
}

/** Resolve the active locale: explicit override (localStorage) → system → English. */
export function resolveInitialLocale(): Locale {
  if (typeof window !== 'undefined') {
    try {
      const stored = normalizeLocale(window.localStorage.getItem(LOCALE_STORAGE_KEY));
      if (stored) return stored;
    } catch {
      // localStorage unavailable — fall through to detection
    }
  }
  return detectLocale();
}
