import { notFound } from "next/navigation";
import type { Metadata } from "next";
import Image from "next/image";
import PlayEpisodeButton from "../../../components/PlayEpisodeButton";
import AudioDuration from "../../../components/AudioDuration";
import RichText from "../../../components/RichText";
import Comments from "../../../components/Comments";
import { getEpisodeBySlug, getEpisodeSlugs } from "../../../lib/episodes";

type Params = { params: { slug: string } };

export default async function EpisodePage({ params }: Params) {
  const episode = await getEpisodeBySlug(params.slug);
  if (!episode) return notFound();

  return (
    <>
      <article className="rounded-xl border border-red-200 bg-white p-6 shadow-sm transition-shadow hover:shadow-md">
        {/* Row 1: image (left) and audio player (right) */}
        <div className="grid grid-cols-1 gap-6 md:grid-cols-[minmax(0,300px)_minmax(0,1fr)]">
          {/* Image */}
          <div className="w-full overflow-hidden rounded-lg bg-brand">
            <Image
              src={episode.image || "/images/placeholder.svg"}
              alt={episode.title}
              width={800}
              height={800}
              className="h-48 w-full object-cover md:h-auto"
              priority
            />
          </div>

          {/* Play control (global player continues across pages) */}
          <div className="flex items-center">
            <div className="w-full flex justify-start">
              <PlayEpisodeButton src={episode.audioUrl} title={episode.title} image={episode.image || "/images/placeholder.svg"} slug={params.slug} />
            </div>
          </div>
        </div>

        {/* Row 2: title, meta, description, show notes */}
        <div className="mt-6">
          <h1 className="text-2xl font-semibold tracking-tight">
            <RichText text={episode.title} />
          </h1>

          {/* Meta badges */}
          <div className="mt-2 flex flex-wrap items-center gap-2 text-sm">
            <span className="inline-flex items-center gap-1 rounded-full bg-slate-100 px-2 py-0.5 text-slate-700">
              📅 {new Date(episode.date).toLocaleDateString()}
            </span>
            <span className="inline-flex items-center gap-1 rounded-full bg-slate-100 px-2 py-0.5 text-slate-700">
              ⏱️ <AudioDuration src={episode.audioUrl} />
            </span>
          </div>

          {/* Description + show notes */}
          <section className="mt-4 space-y-2 text-slate-700">
            <p>
              <RichText text={episode.description} />
            </p>

            {episode.showNotes &&
              episode.showNotes.map((p, i) => (
                <p key={i}>
                  <RichText text={p} />
                </p>
              ))}
          </section>
        </div>
      </article>
      <Comments slug={params.slug} />
    </>
  );
}

export async function generateStaticParams() {
  const slugs = await getEpisodeSlugs();
  return slugs.map((slug) => ({ slug }));
}

export const dynamicParams = false;

export async function generateMetadata({ params }: Params): Promise<Metadata> {
  const episode = await getEpisodeBySlug(params.slug);
  if (!episode) return {};
  const title = `${episode.title} • Cubuntu`;
  const description = episode.description;
  const images = episode.image ? [episode.image] : undefined;
  return {
    title,
    description,
    openGraph: {
      title,
      description,
      type: "article",
      images,
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images,
    },
  };
}
