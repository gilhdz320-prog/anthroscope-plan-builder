"use client";

import { useEffect, useState } from "react";

const OFFER_WINDOW_MS = 24 * 60 * 60 * 1000;

function pad(n: number) {
  return String(n).padStart(2, "0");
}

export function Countdown({ label }: { label?: string }) {
  const [remaining, setRemaining] = useState<number | null>(null);

  useEffect(() => {
    const KEY = "pb_offer_deadline";
    const now = Date.now();
    const stored = Number(localStorage.getItem(KEY));
    let deadline = stored;
    if (!stored || Number.isNaN(stored) || stored <= now) {
      deadline = now + OFFER_WINDOW_MS;
      localStorage.setItem(KEY, String(deadline));
    }
    const tick = () => setRemaining(Math.max(0, deadline - Date.now()));
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, []);

  const total = remaining ?? 0;
  const hours = Math.floor(total / 3_600_000);
  const minutes = Math.floor((total % 3_600_000) / 60_000);
  const seconds = Math.floor((total % 60_000) / 1000);

  return (
    <span className="inline-flex items-center gap-2">
      {label && (
        <span className="eyebrow" style={{ color: "var(--gold-600)" }}>
          {label}
        </span>
      )}
      <span
        className="font-mono-tabular"
        style={{
          color: "var(--gold-600)",
          fontSize: "16px",
          fontWeight: 600,
          letterSpacing: "0.04em",
        }}
      >
        {pad(hours)}:{pad(minutes)}:{pad(seconds)}
      </span>
    </span>
  );
}
