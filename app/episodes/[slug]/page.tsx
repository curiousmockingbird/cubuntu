import { notFound } from 'next/navigation';
import type { Metadata } from 'next';
import Image from 'next/image';
import AudioPlayer from '../../../components/AudioPlayer';
import { getEpisodeBySlug, getEpisodeSlugs } from '../../../lib/episodes';
import styles from './page.module.css';

type Params = { params: { slug: string } };

export default async function EpisodePage({ params }: Params) {
  const episode = await getEpisodeBySlug(params.slug);
  if (!episode) return notFound();

  return (
    <>
    <article className={styles.card}>
      <div className={styles.imageWrap}>
        <Image
          src={episode.image || '/images/placeholder.svg'}
          alt={episode.title}
          width={800}
          height={800}
          style={{ width: '100%', height: 'auto' }}
          priority
        />
      </div>
      <div className={styles.content}>
        <h2>{episode.title}</h2>
        <p className="episode-meta">
          {new Date(episode.date).toLocaleDateString()} • {episode.duration}
        </p>
        <AudioPlayer src={episode.audioUrl} />
      </div>
    </article>
        <section style={{ marginTop: 8 }}>
          <p>{episode.description}</p>
          {episode.showNotes && episode.showNotes.map((p, i) => (
            <p key={i}>{p}</p>
          ))}
        </section>
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
