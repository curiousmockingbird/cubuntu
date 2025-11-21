import { notFound } from 'next/navigation';
import type { Metadata } from 'next';
import Image from 'next/image';
import AudioPlayer from '../../../components/AudioPlayer';
import { getEpisodeBySlug, getEpisodeSlugs } from '../../../lib/episodes';

type Params = { params: { slug: string } };

export default async function EpisodePage({ params }: Params) {
  const episode = await getEpisodeBySlug(params.slug);
  if (!episode) return notFound();

  return (
    <article className="grid grid-cols-[280px_1fr] gap-4 rounded-xl border border-slate-200 p-4 md:grid-cols-1">
      <div className="w-full overflow-hidden rounded-lg bg-slate-100">
        <Image
          src={episode.image || '/images/placeholder.svg'}
          alt={episode.title}
          width={800}
          height={800}
          className="h-auto w-full"
          priority
        />
      </div>
      <div className="flex flex-col gap-2">
        <h2 className="text-xl font-semibold">{episode.title}</h2>
        <p className="muted">
          {new Date(episode.date).toLocaleDateString()} • {episode.duration}
        </p>
        <AudioPlayer src={episode.audioUrl} />
        <section className="mt-2">
          <p>{episode.description}</p>
          {episode.showNotes && episode.showNotes.map((p, i) => (
            <p key={i}>{p}</p>
          ))}
        </section>
      </div>
    </article>
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
  const title = `${episode.title} • Podcast MVP`;
  const description = episode.description;
  return {
    title,
    description,
    openGraph: {
      title,
      description,
      type: 'article',
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
    },
  };
}
