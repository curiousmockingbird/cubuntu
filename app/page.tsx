import Link from "next/link";
import Image from "next/image";
import AudioPlayer from "../components/AudioPlayer";
import { getAllEpisodes } from "../lib/episodes";

export const revalidate = 3600;

export const metadata = {
  title: "Episodes • Podcast MVP",
  description: "Browse and play the latest podcast episodes.",
};

export default async function HomePage() {
  const episodes = await getAllEpisodes();
  return (
    <section>
      <h2 className="mb-4 text-2xl font-semibold tracking-tight">
        Latest Episodes
      </h2>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {episodes.map((ep) => (
          <article
            key={ep.slug}
            className="group grid grid-cols-[160px_1fr] gap-4 rounded-xl border border-slate-200 bg-white p-4 shadow-sm transition-shadow hover:shadow-md sm:grid-cols-1"
          >
            <div className="relative w-full overflow-hidden rounded-lg bg-slate-100">
              <Link href={`/episodes/${ep.slug}`}>
                <Image
                  src={ep.image || "/images/placeholder.svg"}
                  alt={ep.title}
                  width={160}
                  height={160}
                  sizes="(max-width: 640px) 100vw, 160px"
                  className="h-full w-full object-cover transform transition-transform duration-300 ease-out group-hover:scale-[1.02]"
                />
              </Link>
            </div>
            <div className="flex flex-col gap-2">
              <h3 className="text-xl font-semibold">
                <Link
                  className="text-slate-900 hover:text-blue-700"
                  href={`/episodes/${ep.slug}`}
                >
                  {ep.title}
                </Link>
              </h3>
              <div className="flex flex-wrap items-center gap-2 text-sm">
                <span className="inline-flex items-center gap-1 rounded-full bg-slate-100 px-2 py-0.5 text-slate-700">
                  📅 {new Date(ep.date).toLocaleDateString()}
                </span>
                <span className="inline-flex items-center gap-1 rounded-full bg-slate-100 px-2 py-0.5 text-slate-700">
                  ⏱️ {ep.duration}
                </span>
              </div>
              <p className="text-slate-700">{ep.description}</p>
              <div className="mt-1 flex items-center gap-3">
                <AudioPlayer src={ep.audioUrl} compact />
                <Link
                  className="inline-flex items-center gap-1 rounded-md border border-slate-200 px-3 py-1.5 text-blue-700 hover:bg-slate-50"
                  href={`/episodes/${ep.slug}`}
                >
                  Detalles
                  <span aria-hidden>→</span>
                </Link>
              </div>
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}
