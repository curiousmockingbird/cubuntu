import type { Metadata } from 'next';
import Link from 'next/link';

export const metadata: Metadata = {
  title: 'Social Media',
  description: 'Follow and connect on social platforms.',
};

export default function SocialPage() {
  return (
    <section>
      <h2 className="mb-2 text-xl font-semibold">Redes sociales</h2>
      <p className="mb-2">Puedes seguirnos en estas plataformas:</p>
      <ul className="list-disc pl-6">
        <li>
          <Link className="text-blue-600 hover:underline" href="#" aria-disabled>
            Twitter/X
          </Link>
        </li>
        <li>
          <Link className="text-blue-600 hover:underline" href="#" aria-disabled>
            Instagram
          </Link>
        </li>
        <li>
          <Link className="text-blue-600 hover:underline" href="#" aria-disabled>
            GitHub
          </Link>
        </li>
        <li>
          <Link className="text-blue-600 hover:underline" href="#" aria-disabled>
            YouTube
          </Link>
        </li>
      </ul>
    </section>
  );
}
