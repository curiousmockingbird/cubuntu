"use client";

import { useState, useEffect } from "react";

type Props = {
  href: string; // relative path like "/episodes/slug"
  className?: string;
  label?: string;
};

export default function ShareButton({ href, className = "", label = "Share" }: Props) {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (!open) return;
    const t = setTimeout(() => setOpen(false), 1800);
    return () => clearTimeout(t);
  }, [open]);

  const onShare = async () => {
    try {
      const origin = typeof window !== "undefined" ? window.location.origin : "";
      const url = origin ? new URL(href, origin).toString() : href;
      await navigator.clipboard.writeText(url);
      setOpen(true);
    } catch (e) {
      // Fallback: try legacy execCommand
      try {
        const origin = typeof window !== "undefined" ? window.location.origin : "";
        const url = origin ? new URL(href, origin).toString() : href;
        const ta = document.createElement("textarea");
        ta.value = url;
        ta.style.position = "fixed";
        ta.style.left = "-9999px";
        document.body.appendChild(ta);
        ta.select();
        document.execCommand("copy");
        document.body.removeChild(ta);
        setOpen(true);
      } catch {
        // Ignore
      }
    }
  };

  return (
    <>
      <button
        type="button"
        onClick={onShare}
        className={`inline-flex h-9 w-9 items-center justify-center rounded-full border border-slate-200 text-red-700 hover:bg-slate-50 ${className}`}
        aria-label={label}
        title={label}
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          width="200"
          height="200"
          viewBox="0 0 24 24"
        >
          <path
            fill="none"
            stroke="#000000"
            stroke-linecap="round"
            stroke-linejoin="round"
            stroke-width="2"
            d="M4 12v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8m-4-6l-4-4l-4 4m4-4v13"
          />
        </svg>
      </button>

      {open && (
        <div className="fixed inset-0 z-50" role="dialog" aria-modal="true">
          <div className="absolute inset-0 bg-black/20" aria-hidden />
          <div className="absolute inset-0 flex items-center justify-center p-4">
            <div className="w-full max-w-sm rounded-lg border border-slate-200 bg-white p-4 shadow-lg text-center">
              <p className="font-medium">Link copied and ready to share</p>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

