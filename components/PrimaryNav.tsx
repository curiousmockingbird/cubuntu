"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import SignOutButton from "./SignOutButton";

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
      <Link className="text-red-600 hover:underline" href="/about" onClick={() => setOpen(false)}>
        Quiémes somos
      </Link>
      <Link className="text-red-600 hover:underline" href="/social" onClick={() => setOpen(false)}>
        Nuestras redes
      </Link>
      <Link className="text-red-600 hover:underline" href="/donate" onClick={() => setOpen(false)}>
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
      Sign in
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

        {/* Mobile menu panel */}
        {open && (
          <div className="mt-3 rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
            <div className="flex flex-col gap-3">
              {NavLinks}
              <hr className="my-2 border-slate-200" />
              {UserArea}
            </div>
          </div>
        )}
      </div>
    </nav>
  );
}

