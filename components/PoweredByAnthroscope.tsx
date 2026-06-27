import Link from "next/link";

type Variant = "light" | "dark" | "minimal";

export function PoweredByAnthroscope({
  variant = "light",
  className = "",
}: {
  variant?: Variant;
  className?: string;
}) {
  const isDark = variant === "dark";
  const isMinimal = variant === "minimal";

  if (isMinimal) {
    return (
      <p
        className={`text-[11px] tracking-[0.18em] uppercase ${className}`}
        style={{ color: "var(--ink-subtle)" }}
      >
        Powered by{" "}
        <span
          className="font-display italic"
          style={{ color: "var(--ink-muted)" }}
        >
          Anthroscope
        </span>
      </p>
    );
  }

  return (
    <div
      className={`flex items-center justify-center gap-2 ${className}`}
      aria-label="Powered by Anthroscope"
    >
      <span
        className="h-px w-8"
        style={{
          background: isDark
            ? "rgba(248,245,238,0.25)"
            : "var(--border-default)",
        }}
      />
      <p
        className="text-[10px] font-medium tracking-[0.22em] uppercase"
        style={{
          color: isDark ? "rgba(248,245,238,0.65)" : "var(--ink-subtle)",
          fontFamily: "var(--font-jetbrains), ui-monospace, monospace",
        }}
      >
        Powered by
      </p>
      <Link
        href="https://anthroscope.app"
        target="_blank"
        rel="noopener noreferrer"
        className="font-display text-sm italic transition-colors hover:opacity-80"
        style={{
          color: isDark ? "var(--gold-300)" : "var(--brand-700)",
          letterSpacing: "-0.01em",
        }}
      >
        Anthroscope
      </Link>
      <span
        className="h-px w-8"
        style={{
          background: isDark
            ? "rgba(248,245,238,0.25)"
            : "var(--border-default)",
        }}
      />
    </div>
  );
}
