import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'About',
  description: 'Learn more about this podcast and the project.',
};

export default function AboutPage() {
  return (
    <section>
      <h2 className="mb-2 text-xl font-semibold">About</h2>
      <p className="mb-2">
        This is a minimal podcast website built with Next.js. It showcases an episodes
        list, episode detail pages with show notes, an in-browser audio player, and an
        RSS feed for podcast apps.
      </p>
      <p>
        Customize this page with the story behind your show, who you are, and where to
        find more information.
      </p>
    </section>
  );
}
