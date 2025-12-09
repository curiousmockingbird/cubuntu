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
      <span className="text-slate-600">Hi, {user.name || user.email}</span>
      <SignOutButton />
    </div>
  ) : (
    <Link className="text-red-600 hover:underline" href="/auth" onClick={() => setOpen(false)}>
      Inicia sesión
    </Link>
  );

  return (
    <nav className="mt-2" aria-label="Primary">
      {/* Desktop */}
      <div className="hidden md:flex items-center gap-4">
        {NavLinks}
        <span className="flex-1" />
        {UserArea}
      </div>

      {/* Mobile toggle */}
      <div className="md:hidden">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            {/* Keep space balanced; brand is above in header */}
          </div>
          <button
            type="button"
            aria-label="Toggle menu"
            aria-expanded={open}
            onClick={() => setOpen((v) => !v)}
            className="inline-flex items-center justify-center rounded-md border border-slate-200 bg-white p-2 text-slate-700 shadow-sm hover:bg-slate-50"
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

        {/* Mobile menu panel (overlay) */}
        {open && (
          <div className="fixed inset-0 z-50">
            {/* Backdrop */}
            <div
              className="absolute inset-0 bg-black/20"
              onClick={() => setOpen(false)}
              aria-hidden
            />
            {/* Aligned content within page container width */}
            <div className="relative mx-auto max-w-4xl px-4 pt-4">
              <div className="relative rounded-lg border border-slate-200 bg-white p-4 shadow-lg">
                {/* Close button */}
                <button
                  type="button"
                  aria-label="Close menu"
                  onClick={() => setOpen(false)}
                  className="absolute right-2 top-2 inline-flex h-9 w-9 items-center justify-center rounded-md text-slate-600 hover:bg-slate-100 focus:outline-none focus:ring-2 focus:ring-red-600"
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
                <div className="flex flex-col gap-3">
                  {NavLinks}
                  <hr className="my-2 border-slate-200" />
                  {UserArea}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </nav>
  );
}
