import Link from 'next/link';
import AudioPlayer from '../components/AudioPlayer';
import { episodes } from '../data/episodes/index';

export const revalidate = 3600;

export const metadata = {
  title: 'Episodes • Podcast MVP',
  description: 'Browse and play the latest podcast episodes.',
};

export default function HomePage() {
  return (
    <section>
      <h2>Latest Episodes</h2>
      <div className="episode-list">
        {episodes.map((ep) => (
          <article key={ep.slug} className="episode-card">
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
          </article>
        ))}
      </div>
    </section>
  );
}
