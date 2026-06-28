"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

type Lang = "es" | "en";

export function DashboardLangToggle() {
  const router = useRouter();
  const [lang, setLang] = useState<Lang>("es");

  useEffect(() => {
    const stored = localStorage.getItem("anthroscope_lang");
    if (stored === "en" || stored === "es") setLang(stored);
  }, []);

  function toggle() {
    const newLang: Lang = lang === "es" ? "en" : "es";
    setLang(newLang);
    localStorage.setItem("anthroscope_lang", newLang);
    // Keep the existing locale system (cookie + LocaleProvider) in sync so
    // server-rendered strings switch too.
    localStorage.setItem("locale", newLang);
    document.cookie = `locale=${newLang}; max-age=31536000; path=/`;
    document.documentElement.lang = newLang;
    router.refresh();
  }

  return (
    <button
      type="button"
      onClick={toggle}
      aria-label="Cambiar idioma / Change language"
      className="flex items-center gap-1 px-3 py-1.5 rounded-full border border-[#c9a961]/40 text-[#c9a961] text-sm font-medium hover:bg-[#c9a961]/10 transition-colors"
    >
      {lang === "es" ? "🇺🇸 EN" : "🇲🇽 ES"}
    </button>
  );
}
