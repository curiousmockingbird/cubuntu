"use client";

import { FormEvent, useState } from "react";
import Link from "next/link";

type Hit = {
  slug: string;
  title: string;
  date: string;
  score: number;
  snippet: string;
};

type ApiResponse = {
  mode: "ai" | "fallback";
  hits: Hit[];
  answer: string | null;
};

export default function AISearch() {
  const [query, setQuery] = useState("");
  const [withAnswer, setWithAnswer] = useState(true);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<ApiResponse | null>(null);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    const q = query.trim();
    if (!q) return;
    setIsLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/ai/search", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ query: q, withAnswer, topK: 5 }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error || "Search failed");
      setResult(data as ApiResponse);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Search failed");
      setResult(null);
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <section className="mb-6 rounded-xl border border-slate-200 bg-white p-4 sm:p-5">
      <h2 className="text-base font-semibold">Ask the podcast (AI)</h2>
      <p className="mt-1 text-sm text-slate-600">
        Busca temas en lenguaje natural y, si quieres, genera una respuesta resumida con fuentes.
      </p>

      <form onSubmit={onSubmit} className="mt-3 space-y-3">
        <textarea
          className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
          rows={2}
          placeholder="Ej: ¿En qué episodios hablan de emprender en otro país?"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
        />
        <label className="inline-flex items-center gap-2 text-sm text-slate-700">
          <input
            type="checkbox"
            checked={withAnswer}
            onChange={(e) => setWithAnswer(e.target.checked)}
          />
          Generar respuesta asistida
        </label>
        <div>
          <button
            type="submit"
            disabled={isLoading || query.trim().length === 0}
            className="rounded-md border border-blue-600 bg-blue-600 px-4 py-2 text-sm text-white disabled:opacity-60"
          >
            {isLoading ? "Buscando..." : "Buscar"}
          </button>
        </div>
      </form>

      {error && <p className="mt-3 text-sm text-red-600">{error}</p>}

      {result && (
        <div className="mt-4 space-y-3">
          <div className="text-xs text-slate-500">
            Modo: {result.mode === "ai" ? "Embeddings (AI)" : "Fallback por palabras clave"}
          </div>
          {withAnswer && (
            <div
              className={
                result.answer
                  ? "rounded-lg border border-emerald-200 bg-emerald-50 p-3 text-sm text-slate-800"
                  : "rounded-lg border border-red-300 bg-red-50 p-3 text-sm text-red-900"
              }
            >
              {result.answer ||
                (result.hits.length === 0
                  ? "No se pudo generar una respuesta: no se encontraron resultados para tu consulta."
                  : "No se pudo generar una respuesta asistida (verifica la configuración de OPENAI_API_KEY).")}
            </div>
          )}
          <ul className="space-y-2">
            {result.hits.map((hit) => (
              <li key={`${hit.slug}-${hit.score}`} className="rounded-lg border border-slate-200 p-3">
                <div className="flex items-center justify-between gap-3">
                  <Link href={`/episodes/${hit.slug}`} className="font-medium text-blue-700 hover:underline">
                    {hit.title}
                  </Link>
                  <span className="text-xs text-slate-500">
                    Score: {hit.score.toFixed(3)}
                  </span>
                </div>
                <p className="mt-1 text-xs text-slate-500">
                  {new Date(hit.date).toLocaleDateString()}
                </p>
                <p className="mt-2 text-sm text-slate-700">{hit.snippet}</p>
              </li>
            ))}
          </ul>
        </div>
      )}
    </section>
  );
}
