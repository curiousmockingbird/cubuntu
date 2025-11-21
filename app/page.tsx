import Link from 'next/link';
import Image from 'next/image';
import AudioPlayer from '../components/AudioPlayer';
import { getAllEpisodes } from '../lib/episodes';

export const revalidate = 3600;

export const metadata = {
  title: 'Episodes • Podcast MVP',
  description: 'Browse and play the latest podcast episodes.',
};

export default async function HomePage() {
  const episodes = await getAllEpisodes();
  return (
    <section>
      <h2 className="mb-4 text-xl font-semibold">Latest Episodes</h2>
      <div className="grid gap-4">
        {episodes.map((ep) => (
          <article key={ep.slug} className="grid grid-cols-[160px_1fr] gap-4 rounded-xl border border-slate-200 p-4 sm:grid-cols-1">
            <div className="w-full overflow-hidden rounded-lg bg-slate-100">
              <Link href={`/episodes/${ep.slug}`}>
                <Image
                  src={ep.image || '/images/placeholder.svg'}
                  alt={ep.title}
                  width={800}
                  height={800}
                  className="h-auto w-full"
                />
              </Link>
            </div>
            <div className="flex flex-col gap-2">
              <h3 className="text-lg font-medium">
                <Link className="text-blue-600 hover:underline" href={`/episodes/${ep.slug}`}>
                  {ep.title}
                </Link>
              </h3>
              <p className="muted">
                {new Date(ep.date).toLocaleDateString()} • {ep.duration}
              </p>
              <p>{ep.description}</p>
              <div className="mt-1 flex items-center gap-3">
                <AudioPlayer src={ep.audioUrl} />
                <Link className="text-blue-600 hover:underline" href={`/episodes/${ep.slug}`}>
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
