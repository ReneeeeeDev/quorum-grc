"use client";

import { ShieldCheck } from "lucide-react";
import { FormEvent, useState } from "react";

import { useAuth } from "@/lib/auth";

export default function LoginPage() {
  const { login } = useAuth();
  const [email, setEmail] = useState("admin@gmp.local");
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
      setError(err instanceof Error ? err.message : "Unable to sign in");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <main className="grid min-h-screen bg-canvas lg:grid-cols-[1.1fr_0.9fr]">
      <section className="flex items-center px-6 py-10 lg:px-16">
        <div className="max-w-2xl">
          <div className="mb-8 flex h-12 w-12 items-center justify-center rounded bg-primary text-white">
            <ShieldCheck className="h-6 w-6" />
          </div>
          <h1 className="max-w-xl text-4xl font-semibold leading-tight text-ink">
            Centralized governance operations for policies, decisions, actions, and audit readiness.
          </h1>
          <p className="mt-5 max-w-2xl text-base leading-7 text-muted">
            Replace spreadsheets, email approvals, and disconnected drives with one accountable governance control center.
          </p>
        </div>
      </section>
      <section className="flex items-center justify-center border-l border-line bg-panel px-6 py-10">
        <form onSubmit={onSubmit} className="w-full max-w-md rounded border border-line bg-white p-6 shadow-panel">
          <div className="mb-6">
            <h2 className="text-xl font-semibold text-ink">Sign in</h2>
            <p className="mt-1 text-sm text-muted">Use a seeded MVP account to access the portal.</p>
          </div>
          <label className="block text-sm font-medium text-ink">
            Email
            <input
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              className="mt-2 w-full rounded border border-line px-3 py-2 text-sm outline-none focus:border-primary"
              type="email"
              required
            />
          </label>
          <label className="mt-4 block text-sm font-medium text-ink">
            Password
            <input
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              className="mt-2 w-full rounded border border-line px-3 py-2 text-sm outline-none focus:border-primary"
              type="password"
              required
            />
          </label>
          {error ? <div className="mt-4 rounded bg-red-50 px-3 py-2 text-sm text-danger">{error}</div> : null}
          <button
            type="submit"
            disabled={submitting}
            className="mt-6 w-full rounded bg-primary px-4 py-2.5 text-sm font-semibold text-white hover:bg-teal-800 disabled:opacity-60"
          >
            {submitting ? "Signing in..." : "Sign in"}
          </button>
        </form>
      </section>
    </main>
  );
}

