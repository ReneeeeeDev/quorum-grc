"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";

import { es } from "@/lib/locales/es";
import { pt } from "@/lib/locales/pt";

export type Lang = "en" | "es" | "pt";
export type Dictionary = Record<string, string>;
export type TranslateVars = Record<string, string | number>;
export type Translate = (key: string, vars?: TranslateVars) => string;

export const DEFAULT_LANG: Lang = "en";
export const LANG_STORAGE_KEY = "quorum_lang";

export const languages: { code: Lang; label: string; nativeName: string; locale: string }[] = [
  { code: "en", label: "EN", nativeName: "English", locale: "en-US" },
  { code: "es", label: "ES", nativeName: "Español", locale: "es" },
  { code: "pt", label: "PT", nativeName: "Português", locale: "pt-BR" },
];

// English is the source language: its strings are the dictionary keys, so it needs no table of its own.
export const dictionaries: Record<Lang, Dictionary> = { en: {}, es, pt };

type I18nContextValue = {
  lang: Lang;
  locale: string;
  setLang: (lang: Lang) => void;
  t: Translate;
};

const I18nContext = createContext<I18nContextValue | null>(null);

export function isLang(value: unknown): value is Lang {
  return languages.some((language) => language.code === value);
}

export function translate(lang: Lang, key: string, vars?: TranslateVars): string {
  const template = dictionaries[lang][key] ?? key;
  if (!vars) return template;
  return template.replace(/\{(\w+)\}/g, (match, name: string) => (name in vars ? String(vars[name]) : match));
}

function detectLang(): Lang {
  try {
    const stored = window.localStorage.getItem(LANG_STORAGE_KEY);
    if (isLang(stored)) return stored;
  } catch {
    // Storage can be unavailable (private mode, blocked cookies); fall through to browser detection.
  }
  const browserLang = window.navigator.language?.slice(0, 2).toLowerCase();
  return isLang(browserLang) ? browserLang : DEFAULT_LANG;
}

export function I18nProvider({ children }: { children: React.ReactNode }) {
  // Always render English on the server and on the first client pass so hydration matches, then switch.
  const [lang, setLangState] = useState<Lang>(DEFAULT_LANG);

  useEffect(() => {
    setLangState(detectLang());
  }, []);

  useEffect(() => {
    document.documentElement.lang = lang;
  }, [lang]);

  const setLang = useCallback((next: Lang) => {
    setLangState(next);
    try {
      window.localStorage.setItem(LANG_STORAGE_KEY, next);
    } catch {
      // Ignore storage failures; the choice still applies for this page view.
    }
  }, []);

  const value = useMemo<I18nContextValue>(() => {
    const locale = languages.find((language) => language.code === lang)?.locale ?? "en-US";
    return { lang, locale, setLang, t: (key, vars) => translate(lang, key, vars) };
  }, [lang, setLang]);

  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>;
}

export function useI18n() {
  const context = useContext(I18nContext);
  if (!context) throw new Error("useI18n must be used inside I18nProvider");
  return context;
}

const statusLabels: Record<string, string> = {
  draft: "Draft",
  review: "Review",
  approval: "Approval",
  published: "Published",
  archived: "Archived",
  open: "Open",
  in_progress: "In progress",
  complete: "Complete",
  overdue: "Overdue",
  unread: "Unread",
  read: "Read",
  pending: "Pending",
  approved: "Approved",
  rejected: "Rejected",
  configured: "Configured",
  disabled: "Disabled",
  enabled: "Enabled",
  not_started: "Not started",
  compliant: "Compliant",
  non_compliant: "Non compliant",
  mitigating: "Mitigating",
  closed: "Closed",
  low: "Low",
  medium: "Medium",
  high: "High",
  critical: "Critical",
  meeting: "Meeting",
  audit: "Audit",
  renewal: "Renewal",
};

// Backend enum values ("in_progress") become translatable labels ("In progress"); unknown values pass through.
export function statusLabel(t: Translate, value: string): string {
  const label = statusLabels[value];
  return label ? t(label) : value.replaceAll("_", " ");
}
