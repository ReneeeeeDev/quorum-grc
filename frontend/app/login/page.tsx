"use client";

import { FormEvent, useState } from "react";

import { Brand } from "@/components/app-shell";
import { LanguageSwitcher } from "@/components/language-switcher";
import { useAuth } from "@/lib/auth";
import { useI18n } from "@/lib/i18n";

const highlights = ["Policy lifecycle", "Decision register", "Action tracking", "Audit readiness"];

export default function LoginPage() {
  const { login } = useAuth();
  const { t } = useI18n();
  const [email, setEmail] = useState("admin@quorum.local");
  const [password, setPassword] = useState("Admin@123");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSubmitting(true);
    setError(null);
    try {
      await login(email, password);
    } catch (err) {
      setError(err instanceof Error ? err.message : t("Unable to sign in"));
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <main className="grid min-h-screen bg-canvas lg:grid-cols-[1.1fr_0.9fr]">
      <section className="relative flex items-center overflow-hidden bg-ink px-6 py-12 text-white lg:px-16">
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_top_left,rgba(99,102,241,0.45),transparent_55%),radial-gradient(ellipse_at_bottom_right,rgba(67,56,202,0.35),transparent_50%)]" />
        <div className="relative max-w-2xl">
          <Brand tone="dark" />
          <h1 className="mt-10 max-w-xl text-4xl font-semibold leading-tight">
            {t("Centralized governance operations for policies, decisions, actions, and audit readiness.")}
          </h1>
          <p className="mt-5 max-w-2xl text-base leading-7 text-white/70">
            {t("Replace spreadsheets, email approvals, and disconnected drives with one accountable governance control center.")}
          </p>
          <ul className="mt-8 flex flex-wrap gap-2">
            {highlights.map((item) => (
              <li key={item} className="rounded-full border border-white/15 bg-white/10 px-3 py-1 text-xs font-medium text-white/85">
                {t(item)}
              </li>
            ))}
          </ul>
        </div>
      </section>
      <section className="relative flex items-center justify-center px-6 py-10">
        <div className="absolute right-6 top-6">
          <LanguageSwitcher />
        </div>
        <form onSubmit={onSubmit} className="w-full max-w-md rounded-xl border border-line bg-panel p-6 shadow-panel">
          <div className="mb-6">
            <h2 className="text-xl font-semibold text-ink">{t("Sign in")}</h2>
            <p className="mt-1 text-sm text-muted">{t("Use a seeded MVP account to access the portal.")}</p>
          </div>
          <label className="block text-sm font-medium text-ink">
            {t("Email")}
            <input
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              className="mt-2 w-full rounded-lg border border-line px-3 py-2 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary-soft"
              type="email"
              required
            />
          </label>
          <label className="mt-4 block text-sm font-medium text-ink">
            {t("Password")}
            <input
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              className="mt-2 w-full rounded-lg border border-line px-3 py-2 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary-soft"
              type="password"
              required
            />
          </label>
          {error ? <div className="mt-4 rounded-lg bg-red-50 px-3 py-2 text-sm text-danger">{error}</div> : null}
          <button
            type="submit"
            disabled={submitting}
            className="mt-6 w-full rounded-lg bg-primary px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-primary-strong disabled:opacity-60"
          >
            {submitting ? t("Signing in...") : t("Sign in")}
          </button>
        </form>
      </section>
    </main>
  );
}
