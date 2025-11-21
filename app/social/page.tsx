import type { Metadata } from 'next';
import Link from 'next/link';

export const metadata: Metadata = {
  title: 'Social Media',
  description: 'Follow and connect on social platforms.',
};

export default function SocialPage() {
  return (
    <section>
      <h2>Social Media</h2>
      <p>Follow the show and reach out on these platforms:</p>
      <ul>
        <li>
          <Link className="link" href="#" aria-disabled>
            Twitter/X
          </Link>
        </li>
        <li>
          <Link className="link" href="#" aria-disabled>
            Instagram
          </Link>
        </li>
        <li>
          <Link className="link" href="#" aria-disabled>
            GitHub
          </Link>
        </li>
        <li>
          <Link className="link" href="#" aria-disabled>
            YouTube
          </Link>
        </li>
      </ul>
      <p style={{ color: 'var(--muted)' }}>
        Replace the links above with your actual profiles.
      </p>
    </section>
  );
}

