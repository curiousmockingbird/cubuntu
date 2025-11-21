import Link from 'next/link';
import Image from 'next/image';
import AudioPlayer from '../components/AudioPlayer';
import { getAllEpisodes } from '../lib/episodes';
import styles from './page.module.css';

export const revalidate = 3600;

export const metadata = {
  title: 'Episodes • Podcast MVP',
  description: 'Browse and play the latest podcast episodes.',
};

export default async function HomePage() {
  const episodes = await getAllEpisodes();
  return (
    <section>
      <h2>Latest Episodes</h2>
      <div className="episode-list">
        {episodes.map((ep) => (
          <article key={ep.slug} className={styles.card}>
            <div className={styles.imageWrap}>
              <Link href={`/episodes/${ep.slug}`}>
                <Image
                  src={ep.image || '/images/placeholder.svg'}
                  alt={ep.title}
                  width={800}
                  height={800}
                  style={{ width: '100%', height: 'auto' }}
                />
              </Link>
            </div>
            <div className={styles.content}>
              <h3>
                <Link className="link" href={`/episodes/${ep.slug}`}>
                  {ep.title}
                </Link>
              </h3>
              <p className="episode-meta">
                {new Date(ep.date).toLocaleDateString()} • {ep.duration}
              </p>
              <p>{ep.description}</p>
              <div className="episode-actions">
                <AudioPlayer src={ep.audioUrl} />
                <Link className="link" href={`/episodes/${ep.slug}`}>
                  Show notes →
                </Link>
              </div>
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}
