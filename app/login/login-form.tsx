"use client";

import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { createBrowserClient } from "@supabase/ssr";

export default function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const next = searchParams.get("next") ?? "/";

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const supabase = createBrowserClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL ?? process.env.NEXT_PUBLIC_STORAGE_CV_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? process.env.NEXT_PUBLIC_STORAGE_CV_SUPABASE_ANON_KEY ?? process.env.NEXT_PUBLIC_STORAGE_CV_SUPABASE_PUBLISHABLE_KEY!,
    );

    const { error } = await supabase.auth.signInWithPassword({ email, password });

    if (error) {
      setError("Ongeldig e-mailadres of wachtwoord.");
      setLoading(false);
      return;
    }

    router.push(next);
    router.refresh();
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4">
      <div className="flex flex-col gap-1.5">
        <label htmlFor="email" className="text-sm font-medium text-ink">E-mailadres</label>
        <input
          id="email"
          type="email"
          autoComplete="email"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="rounded-lg border border-line px-3 py-2 text-sm text-ink outline-none focus:border-moss focus:ring-2 focus:ring-moss/20"
        />
      </div>

      <div className="flex flex-col gap-1.5">
        <label htmlFor="password" className="text-sm font-medium text-ink">Wachtwoord</label>
        <input
          id="password"
          type="password"
          autoComplete="current-password"
          required
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="rounded-lg border border-line px-3 py-2 text-sm text-ink outline-none focus:border-moss focus:ring-2 focus:ring-moss/20"
        />
      </div>

      {error && (
        <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600">{error}</p>
      )}

      <button
        type="submit"
        disabled={loading}
        className="rounded-lg bg-moss px-4 py-2 text-sm font-medium text-white transition hover:bg-moss-dark disabled:opacity-60"
      >
        {loading ? "Bezig…" : "Inloggen"}
      </button>
    </form>
  );
}
