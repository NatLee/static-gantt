'use client';

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useLayoutEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';
import {
  DEFAULT_LOCALE,
  LOCALE_STORAGE_KEY,
  resolveInitialLocale,
  type Locale,
} from './config';
import { catalogs, en, type MessageKey } from './messages';

type Vars = Record<string, string | number>;
export type TFunction = (key: MessageKey, vars?: Vars) => string;

interface I18nContextValue {
  locale: Locale;
  setLocale: (locale: Locale) => void;
  t: TFunction;
}

const I18nContext = createContext<I18nContextValue | null>(null);

// Run the locale-resolution effect synchronously before paint on the client
// (so there's no English flash), but fall back to useEffect during static
// prerender where useLayoutEffect would warn.
const useIsomorphicLayoutEffect =
  typeof window !== 'undefined' ? useLayoutEffect : useEffect;

function interpolate(template: string, vars?: Vars): string {
  if (!vars) return template;
  return template.replace(/\{(\w+)\}/g, (_, key) =>
    key in vars ? String(vars[key]) : `{${key}}`
  );
}

export function I18nProvider({ children }: { children: ReactNode }) {
  // Start at the deterministic default so the static prerender and the first
  // client render agree (no hydration mismatch); resolve the real locale in a
  // layout effect before the first paint.
  const [locale, setLocaleState] = useState<Locale>(DEFAULT_LOCALE);

  useIsomorphicLayoutEffect(() => {
    setLocaleState(resolveInitialLocale());
  }, []);

  useEffect(() => {
    if (typeof document !== 'undefined') {
      document.documentElement.lang = locale;
    }
  }, [locale]);

  const setLocale = useCallback((next: Locale) => {
    setLocaleState(next);
    try {
      window.localStorage.setItem(LOCALE_STORAGE_KEY, next);
    } catch {
      // ignore persistence failures
    }
  }, []);

  const t = useMemo<TFunction>(() => {
    const dict = catalogs[locale] ?? en;
    return (key, vars) => interpolate(dict[key] ?? en[key] ?? key, vars);
  }, [locale]);

  const value = useMemo(() => ({ locale, setLocale, t }), [locale, setLocale, t]);

  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>;
}

export function useI18n(): I18nContextValue {
  const ctx = useContext(I18nContext);
  if (!ctx) throw new Error('useI18n must be used within an I18nProvider');
  return ctx;
}

/** Convenience hook when you only need the translate function. */
export function useT(): TFunction {
  return useI18n().t;
}
