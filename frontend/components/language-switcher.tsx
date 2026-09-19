"use client";

import { languages, useI18n } from "@/lib/i18n";

export function LanguageSwitcher({ tone = "light" }: { tone?: "light" | "dark" }) {
  const { lang, setLang, t } = useI18n();
  const shell = tone === "dark" ? "border-white/15 bg-white/10" : "border-line bg-panel";
  const active = tone === "dark" ? "bg-white text-ink" : "bg-primary text-white";
  const idle = tone === "dark" ? "text-white/70 hover:text-white" : "text-muted hover:text-ink";

  return (
    <div role="group" aria-label={t("Language")} className={`inline-flex h-9 items-center gap-0.5 rounded-lg border p-0.5 ${shell}`}>
      {languages.map((language) => (
        <button
          key={language.code}
          type="button"
          lang={language.code}
          title={language.nativeName}
          aria-pressed={language.code === lang}
          onClick={() => setLang(language.code)}
          className={`rounded-md px-2 text-xs font-semibold leading-7 transition ${language.code === lang ? active : idle}`}
        >
          {language.label}
        </button>
      ))}
    </div>
  );
}
