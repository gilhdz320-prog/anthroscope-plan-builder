"use client";

import {
  createContext,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react";

export type Locale = "es" | "en";

interface LocaleContextValue {
  locale: Locale;
  setLocale: (next: Locale) => void;
}

const LocaleContext = createContext<LocaleContextValue>({
  locale: "es",
  setLocale: () => {},
});

function readCookieLocale(): Locale | null {
  const match = document.cookie.match(/(?:^|;\s*)locale=(es|en)/);
  return (match?.[1] as Locale) ?? null;
}

export function LocaleProvider({ children }: { children: ReactNode }) {
  const [locale, setLocaleState] = useState<Locale>("es");

  // On load: localStorage first, then cookie, then default 'es'.
  useEffect(() => {
    const stored = localStorage.getItem("locale");
    const fromStorage = stored === "es" || stored === "en" ? stored : null;
    const resolved = fromStorage ?? readCookieLocale() ?? "es";
    setLocaleState(resolved);
    document.documentElement.lang = resolved;
  }, []);

  function setLocale(next: Locale) {
    setLocaleState(next);
    localStorage.setItem("locale", next);
    document.cookie = `locale=${next}; max-age=31536000; path=/`;
    document.documentElement.lang = next;
  }

  return (
    <LocaleContext.Provider value={{ locale, setLocale }}>
      {children}
    </LocaleContext.Provider>
  );
}

export function useLocale(): LocaleContextValue {
  return useContext(LocaleContext);
}
