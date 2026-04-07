import type { Metadata } from 'next';
import Link from 'next/link';

export const metadata: Metadata = {
  title: 'Donate',
  description: 'Support the podcast and ongoing development.',
};

export default function DonatePage() {
  return (
    <section>
      <h2 className="mb-2 text-xl font-semibold">Donar</h2>
      <p className="mb-2">
        Si disfrutas el programa, considera apoyarlo. Tu contribución ayuda a cubrir los costos de hosting, producción y desarrollo.
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
    </section>
  );
}
