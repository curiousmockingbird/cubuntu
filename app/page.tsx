import Link from "next/link";
import Image from "next/image";
import AudioPlayer from "../components/AudioPlayer";
import { getAllEpisodes } from "../lib/episodes";
import AudioDuration from "../components/AudioDuration";

export const revalidate = 3600;

export const metadata = {
  title: "Episodes • Podcast MVP",
  description: "Browse and play the latest podcast episodes.",
};

export default async function HomePage() {
  const episodes = await getAllEpisodes();
  return (
    <section className="home-page">
      {/* Hero image at the top */}
      <div className="relative mb-8 overflow-hidden rounded-xl border border-slate-200 h-40 sm:h-56 md:h-72">
        <Image
          src="/images/hero_new.svg"
          alt="Podcast hero"
          fill
          priority
          sizes="(max-width: 768px) 100vw, (max-width: 1200px) 768px, 1024px"
          className="object-cover"
        />
      </div>

      <h2 className="mb-6 text-sm font-semibold tracking-tight">Todos los episodios</h2>

      {/* List-style layout inspired by the screenshot */}
      <div className="divide-y divide-slate-200 rounded-xl border border-slate-200 bg-white">
        {episodes.map((ep) => (
          <article key={ep.slug} className="group flex flex-col md:flex-row gap-4 p-4 sm:p-5">
            {/* Cover */}
            <Link
              href={`/episodes/${ep.slug}`}
              className="relative overflow-hidden rounded-lg bg-slate-100 w-full md:w-auto"
            >
              <Image
                src={ep.image || "/images/placeholder.svg"}
                alt={ep.title}
                width={192}
                height={192}
                sizes="(max-width: 768px) 100vw, 192px"
                className="h-40 w-full md:h-32 md:w-32 object-cover transition-transform duration-300 ease-out group-hover:scale-[1.02]"
              />
            </Link>

            {/* Main content */}
            <div className="min-w-0 flex-1">
              <h3 className="text-lg sm:text-xl font-semibold leading-snug">
                <Link
                  className="text-slate-900 hover:text-blue-700"
                  href={`/episodes/${ep.slug}`}
                >
                  {ep.title}
                </Link>
              </h3>

              {/* Description (clamped to 3 lines) + Details link */}
              <p className="mt-2 text-slate-700 text-sm sm:text-base line-clamp-3">
                {ep.description}
              </p>
              <div className="mt-1">
                <Link href={`/episodes/${ep.slug}`} className="text-blue-600 hover:underline text-sm">
                  Leer más &rarr;
                </Link>
              </div>

              {/* Meta + progress hint */}
              <div className="mt-3 flex items-center gap-3 text-sm text-slate-600">
                <span>{new Date(ep.date).toLocaleDateString()}</span>
                <span>•</span>
                <span>⏱️ <AudioDuration src={ep.audioUrl} /></span>
                <span className="hidden sm:block">•</span>
                {/* Decorative thin progress bar for visual parity */}
                <span className="hidden sm:block h-1 w-28 rounded bg-slate-200" aria-hidden />
              </div>
            </div>

            {/* Actions / Play */}
            <div className="flex shrink-0 md:flex-col items-center md:items-end justify-between gap-3 mt-3 md:mt-0">
              {/* Add button placeholder */}
              <button
                type="button"
                className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-slate-200 text-red-700 hover:bg-slate-50"
                aria-label="Save episode"
                title="Save episode"
              >
                +
              </button>

              <div className="w-full md:w-auto md:self-end">
                <AudioPlayer src={ep.audioUrl} compact />
              </div>
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}
