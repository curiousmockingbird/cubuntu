"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import SignOutButton from "./SignOutButton";
import { usePathname } from "next/navigation";

export type SimpleUser = {
  name?: string | null;
  email?: string | null;
  image?: string | null;
} | null;

type Props = {
  user: SimpleUser;
};

export default function PrimaryNav({ user }: Props) {
  const [open, setOpen] = useState(false);
  const pathname = usePathname();

  const isActive = (href: string) => {
    if (!pathname) return false;
    return pathname === href || pathname.startsWith(`${href}/`);
  };

  const linkClass = (href: string) =>
    `text-red-600 hover:underline ${isActive(href) ? "md:underline" : ""}`;

  // Close the menu on route change (basic heuristic)
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  const NavLinks = (
    <>
      <Link className={linkClass("/about")} href="/about" onClick={() => setOpen(false)}>
        Quiémes somos
      </Link>
      <Link className={linkClass("/social")} href="/social" onClick={() => setOpen(false)}>
        Nuestras redes
      </Link>
      <Link className={linkClass("/donate")} href="/donate" onClick={() => setOpen(false)}>
        Donar
      </Link>
    </>
  );

  const UserArea = user ? (
    <div className="flex items-center gap-3 text-sm">
      {user.image ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={user.image}
          alt={(user.name || user.email || "User") as string}
          className="h-8 w-8 rounded-full object-cover border"
        />
      ) : (
        <div className="h-8 w-8 rounded-full bg-slate-200 text-slate-700 flex items-center justify-center font-medium">
          {((user.name || user.email || "U") as string).charAt(0).toUpperCase()}
        </div>
      )}
      <span className="text-slate-600">Hola, {user.name || user.email}</span>
      <SignOutButton />
    </div>
  ) : (
    <Link
      className="inline-flex items-center gap-2 px-4 py-2 rounded-md bg-brand text-white font-medium hover:bg-red-700 transition-colors"
      href="/auth"
      onClick={() => setOpen(false)}
    >
      <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      className="h-4 w-4"
      >
      <path strokeLinecap="round" strokeLinejoin="round" d="M11 16l-4-4m0 0l4-4m-4 4h14.5M9 20H5a2 2 0 01-2-2V6a2 2 0 012-2h4" />
      </svg>
      Inicia sesión
    </Link>
  );

  return (
    <nav aria-label="Primary">
      {/* Desktop */}
      <div className="hidden md:flex items-center gap-4">
        <Link href="/" className="inline-flex items-center " aria-label="Cubuntu home">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="/images/hero.svg"
            alt="Cubuntu logo"
            className="h-48 w-auto "
          />
        </Link>
        {NavLinks}
        <span className="flex-1" />
        {UserArea}
      </div>

      {/* Mobile header + sheet menu */}
      <div className="md:hidden">
        <div className="flex items-center justify-between px-4 py-3 sticky top-0 z-40 bg-white/80 backdrop-blur border-b border-slate-200">
          <div className="flex items-center gap-3">
            {/* Brand link for mobile */}
            <Link href="/" className="inline-flex items-center" aria-label="Cubuntu home">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src="/images/hero.svg"
                alt="Cubuntu logo"
                className="h-10 sm:h-12 w-auto"
              />
            </Link>
          </div>
          <button
            type="button"
            aria-label="Toggle menu"
            aria-expanded={open}
            onClick={() => setOpen((v) => !v)}
            className="inline-flex h-10 w-10 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-700 shadow-sm hover:bg-slate-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-600"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              className="h-5 w-5"
            >
              {open ? (
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              ) : (
                <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16" />
              )}
            </svg>
          </button>
        </div>

        {open && (
          <div className="fixed inset-0 z-50">
            {/* Backdrop */}
            <div
              className="absolute inset-0 bg-black/30"
              onClick={() => setOpen(false)}
              aria-hidden
            />
            {/* Full-width top sheet */}
            <div className="absolute inset-x-0 top-0 bottom-0 bg-white shadow-lg">
              <div className="flex items-center justify-between px-4 pt-[calc(env(safe-area-inset-top,0px)+12px)] pb-3 border-b border-slate-200">
                <Link href="/" aria-label="Cubuntu home" onClick={() => setOpen(false)} className="inline-flex items-center">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src="/images/hero.svg" alt="Cubuntu logo" className="h-10 sm:h-12 w-auto" />
                </Link>
                <button
                  type="button"
                  aria-label="Close menu"
                  onClick={() => setOpen(false)}
                  className="inline-flex h-10 w-10 items-center justify-center rounded-lg text-slate-600 hover:bg-slate-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-600"
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    className="h-5 w-5"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              <nav className="px-4 py-2">
                <div className="flex flex-col">
                  <Link className="block py-3 text-lg text-red-600 hover:underline" href="/about" onClick={() => setOpen(false)}>
                    Quiémes somos
                  </Link>
                  <Link className="block py-3 text-lg text-red-600 hover:underline" href="/social" onClick={() => setOpen(false)}>
                    Nuestras redes
                  </Link>
                  <Link className="block py-3 text-lg text-red-600 hover:underline" href="/donate" onClick={() => setOpen(false)}>
                    Donar
                  </Link>
                </div>
                <hr className="my-4 border-slate-200" />
                <div className="px-1">{UserArea}</div>
              </nav>
            </div>
          </div>
        )}
      </div>
    </nav>
  );
}
