"use client";

import React from "react";

type Props = {
  text: string;
  className?: string;
};

// Minimal inline formatter supporting:
// - Bold: **text**
// - Italic: *text* or _text_
// - Underline: __text__ (non-standard Markdown, added for convenience)
// This is intentionally small and safe — it does not execute HTML.
export default function RichText({ text, className }: Props) {
  const parts = React.useMemo(() => tokenize(text), [text]);
  return (
    <span className={className}>
      {parts.map((p, i) => {
        if (typeof p === "string") return <React.Fragment key={i}>{p}</React.Fragment>;
        if (p.t === "b") return <strong key={i}>{p.c}</strong>;
        if (p.t === "i") return <em key={i}>{p.c}</em>;
        if (p.t === "u") return <span key={i} className="underline">{p.c}</span>;
        return <React.Fragment key={i}>{p.c}</React.Fragment>;
      })}
    </span>
  );
}

type Token = string | { t: "b" | "i" | "u"; c: string };

function tokenize(input: string): Token[] {
  const tokens: Token[] = [];
  if (!input) return tokens;
  const regex = /(\*\*[^*]+\*\*|__[^_]+__|\*[^*]+\*|_[^_]+_)/g;
  let lastIndex = 0;
  let match: RegExpExecArray | null;
  while ((match = regex.exec(input)) !== null) {
    if (match.index > lastIndex) {
      tokens.push(input.slice(lastIndex, match.index));
    }
    const m = match[0];
    if (m.startsWith("**") && m.endsWith("**")) {
      tokens.push({ t: "b", c: m.slice(2, -2) });
    } else if (m.startsWith("__") && m.endsWith("__")) {
      tokens.push({ t: "u", c: m.slice(2, -2) });
    } else if ((m.startsWith("*") && m.endsWith("*")) || (m.startsWith("_") && m.endsWith("_"))) {
      tokens.push({ t: "i", c: m.slice(1, -1) });
    } else {
      tokens.push(m);
    }
    lastIndex = regex.lastIndex;
  }
  if (lastIndex < input.length) {
    tokens.push(input.slice(lastIndex));
  }
  return tokens;
}

