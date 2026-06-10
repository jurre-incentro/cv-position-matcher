"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowLeft, Loader2 } from "lucide-react";
import { useState } from "react";

type InputMode = "url" | "text";

export default function NewScanPage() {
  const router = useRouter();
  const [mode, setMode] = useState<InputMode>("url");
  const [url, setUrl] = useState("");
  const [subject, setSubject] = useState("");
  const [text, setText] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const body = mode === "url" ? { url } : { subject, text };
      const res = await fetch("/api/scans", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Er is iets misgegaan");
      router.push(`/scans/${data.id}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Er is iets misgegaan");
      setLoading(false);
    }
  }

  const canSubmit = mode === "url" ? Boolean(url.trim()) : Boolean(text.trim());

  return (
    <main className="min-h-screen">
      <header className="border-b border-line bg-white">
        <div className="mx-auto max-w-6xl px-5 py-6">
          <Link href="/" className="inline-flex items-center gap-2 text-sm font-medium text-moss">
            <ArrowLeft className="h-4 w-4" />
            Terug naar scans
          </Link>
          <h1 className="mt-5 text-2xl font-semibold text-ink">Nieuwe scan</h1>
          <p className="mt-1 text-sm text-ink/60">
            Plak een vacaturelink. De pagina wordt gelezen, CV's worden gesynchroniseerd met Google Drive en daarna gematcht.
          </p>
        </div>
      </header>

      <section className="mx-auto max-w-3xl px-5 py-8">
        <form onSubmit={handleSubmit} className="rounded-lg border border-line bg-white p-6 shadow-soft">
          <div className="flex flex-col gap-5">
            <div className="grid grid-cols-2 rounded-lg border border-line bg-mist p-1 text-sm font-medium">
              <button
                type="button"
                onClick={() => setMode("url")}
                className={`rounded-md px-3 py-2 transition ${mode === "url" ? "bg-white text-ink shadow-soft" : "text-ink/60 hover:text-ink"}`}
              >
                Vacaturelink
              </button>
              <button
                type="button"
                onClick={() => setMode("text")}
                className={`rounded-md px-3 py-2 transition ${mode === "text" ? "bg-white text-ink shadow-soft" : "text-ink/60 hover:text-ink"}`}
              >
                Tekst plakken
              </button>
            </div>

            {mode === "url" ? (
              <div>
                <label className="mb-1.5 block text-sm font-medium text-ink" htmlFor="url">
                  Vacaturelink
                </label>
                <input
                  id="url"
                  type="url"
                  value={url}
                  onChange={(e) => setUrl(e.target.value)}
                  placeholder="https://www.fixedtoday.nl/vacature/FT-006927"
                  className="w-full rounded-md border border-line bg-mist px-3 py-2 text-sm text-ink placeholder:text-ink/40 focus:border-moss focus:outline-none focus:ring-1 focus:ring-moss"
                  required={mode === "url"}
                />
                <p className="mt-2 text-xs leading-5 text-ink/55">
                  Werkt voor publiek toegankelijke vacaturepagina's waarvan de tekst server-side in de HTML staat.
                </p>
              </div>
            ) : (
              <>
                <div>
                  <label className="mb-1.5 block text-sm font-medium text-ink" htmlFor="subject">
                    Onderwerp
                  </label>
                  <input
                    id="subject"
                    type="text"
                    value={subject}
                    onChange={(e) => setSubject(e.target.value)}
                    placeholder="bijv. Senior Java Developer - Amsterdam"
                    className="w-full rounded-md border border-line bg-mist px-3 py-2 text-sm text-ink placeholder:text-ink/40 focus:border-moss focus:outline-none focus:ring-1 focus:ring-moss"
                  />
                </div>

                <div>
                  <label className="mb-1.5 block text-sm font-medium text-ink" htmlFor="text">
                    Aanvraagtekst
                  </label>
                  <textarea
                    id="text"
                    value={text}
                    onChange={(e) => setText(e.target.value)}
                    rows={12}
                    placeholder="Plak hier de volledige aanvraag of e-mailtekst..."
                    className="w-full rounded-md border border-line bg-mist px-3 py-2 text-sm text-ink placeholder:text-ink/40 focus:border-moss focus:outline-none focus:ring-1 focus:ring-moss"
                    required={mode === "text"}
                  />
                </div>
              </>
            )}

            {error ? (
              <div className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-800">{error}</div>
            ) : null}

            <button
              type="submit"
              disabled={loading || !canSubmit}
              className="flex items-center justify-center gap-2 rounded-md bg-moss px-4 py-2.5 text-sm font-medium text-white transition hover:bg-moss-dark disabled:cursor-not-allowed disabled:opacity-50"
            >
              {loading ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Bezig met scrapen en matchen...
                </>
              ) : (
                "Start matching"
              )}
            </button>
          </div>
        </form>
      </section>
    </main>
  );
}
