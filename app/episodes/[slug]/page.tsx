import { notFound } from 'next/navigation';
import type { Metadata } from 'next';
import AudioPlayer from '../../../components/AudioPlayer';
import { episodes } from '../../../data/episodes';

type Params = { params: { slug: string } };

export default function EpisodePage({ params }: Params) {
  const episode = episodes.find((e) => e.slug === params.slug);
  if (!episode) return notFound();

  return (
    <article>
      <h2>{episode.title}</h2>
      <p className="episode-meta">
        {new Date(episode.date).toLocaleDateString()} • {episode.duration}
      </p>
      <AudioPlayer src={episode.audioUrl} />
      <section style={{ marginTop: 16 }}>
        <p>{episode.description}</p>
        {episode.showNotes && episode.showNotes.map((p, i) => (
          <p key={i}>{p}</p>
        ))}
      </section>
    </article>
  );
}

export async function generateStaticParams() {
  return episodes.map((e) => ({ slug: e.slug }));
}

export const dynamicParams = false;

export async function generateMetadata({ params }: Params): Promise<Metadata> {
  const episode = episodes.find((e) => e.slug === params.slug);
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

