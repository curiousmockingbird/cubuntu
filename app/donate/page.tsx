import type { Metadata } from 'next';
import Link from 'next/link';

export const metadata: Metadata = {
  title: 'Donate',
  description: 'Support the podcast and ongoing development.',
};

export default function DonatePage() {
  return (
    <section>
      <h2>Donate</h2>
      <p>
        If you enjoy the show, consider supporting it. Your contribution helps cover
        hosting, production, and development costs.
      </p>
      <ul>
        <li>
          <Link className="link" href="#" aria-disabled>
            Buy Me a Coffee
          </Link>
        </li>
        <li>
          <Link className="link" href="#" aria-disabled>
            Patreon
          </Link>
        </li>
        <li>
          <Link className="link" href="#" aria-disabled>
            PayPal
          </Link>
        </li>
      </ul>
      <p style={{ color: 'var(--muted)' }}>
        Replace the links above with your preferred funding options.
      </p>
    </section>
  );
}

