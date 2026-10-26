import Link from "next/link";
import { PoweredByAnthroscope } from "@/components/PoweredByAnthroscope";

type Section = { title: string; body: React.ReactNode };

export function LegalLayout({
  eyebrow,
  title,
  updatedAt,
  intro,
  sections,
}: {
  eyebrow: string;
  title: string;
  updatedAt: string;
  intro: React.ReactNode;
  sections: Section[];
}) {
  return (
    <main className="min-h-screen" style={{ background: "var(--paper)" }}>
      <div className="mx-auto max-w-3xl px-5 py-14">
        <Link href="/" className="eyebrow" style={{ color: "var(--gold)" }}>
          ← Inicio
        </Link>

        <h1
          className="font-display mt-6"
          style={{
            fontSize: "clamp(30px,4vw,42px)",
            lineHeight: 1.05,
            letterSpacing: "-0.02em",
            color: "var(--ink-strong)",
          }}
        >
          {title}
        </h1>
        <p className="eyebrow mt-3" style={{ color: "var(--ink-subtle)" }}>
          {eyebrow} · Actualizado el {updatedAt}
        </p>

        <div
          className="mt-8 space-y-3 text-sm leading-relaxed"
          style={{ color: "var(--ink-muted)" }}
        >
          {intro}
        </div>

        <div className="mt-10 space-y-8">
          {sections.map((section, index) => (
            <section key={section.title}>
              <h2
                className="text-base font-semibold"
                style={{ color: "var(--ink-strong)" }}
              >
                {index + 1}. {section.title}
              </h2>
              <div
                className="mt-2 space-y-2.5 text-sm leading-relaxed"
                style={{ color: "var(--ink-muted)" }}
              >
                {section.body}
              </div>
            </section>
          ))}
        </div>

        <div
          className="mt-12 border-t pt-6"
          style={{ borderColor: "var(--border, #ECE6D8)" }}
        >
          <p className="text-[11px]" style={{ color: "var(--ink-subtle)" }}>
            ¿Dudas sobre este documento? Escríbenos a{" "}
            <a href="mailto:hola@anthroscope.pro" className="underline underline-offset-2">
              hola@anthroscope.pro
            </a>
            .
          </p>
          <div className="mt-4">
            <PoweredByAnthroscope variant="minimal" />
          </div>
        </div>
      </div>
    </main>
  );
}
