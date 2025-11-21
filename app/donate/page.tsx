import type { Metadata } from 'next';
import Link from 'next/link';

export const metadata: Metadata = {
  title: 'Donate',
  description: 'Support the podcast and ongoing development.',
};

export default function DonatePage() {
  return (
    <section>
      <h2 className="mb-2 text-xl font-semibold">Donate</h2>
      <p className="mb-2">
        If you enjoy the show, consider supporting it. Your contribution helps cover
        hosting, production, and development costs.
      </p>
      <ul className="list-disc pl-6">
        <li>
          <Link className="text-blue-600 hover:underline" href="#" aria-disabled>
            Buy Me a Coffee
          </Link>
        </li>
        <li>
          <Link className="text-blue-600 hover:underline" href="#" aria-disabled>
            Patreon
          </Link>
        </li>
        <li>
          <Link className="text-blue-600 hover:underline" href="#" aria-disabled>
            PayPal
          </Link>
        </li>
      </ul>
      <p className="muted mt-2">
        Replace the links above with your preferred funding options.
      </p>
    </section>
  );
}
