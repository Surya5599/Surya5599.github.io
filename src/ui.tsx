import { useReveal } from "./scroll";

// Shared surface primitives. Two tiers only: `hud` earns the offset shadow,
// `hud-flat` keeps the paper and the ink line but sits back.

export function Card({
  title,
  aside,
  children,
  className = "",
  quiet = false,
  assemble = false,
  delay = 0,
}: {
  title?: string;
  aside?: React.ReactNode;
  children: React.ReactNode;
  className?: string;
  quiet?: boolean;
  assemble?: boolean;
  delay?: number;
}) {
  const { ref, shown } = useReveal<HTMLElement>();
  return (
    <section
      ref={ref}
      data-reveal={shown ? "shown" : "pending"}
      data-assemble={assemble ? "" : undefined}
      style={{ animationDelay: shown && delay ? `${delay}ms` : undefined }}
      className={`${quiet ? "hud-flat" : "hud"} min-w-0 p-5 ${className}`}
    >
      {(title || aside) && (
        <header className="mb-4 flex flex-wrap items-center justify-between gap-2">
          {title && <h2 className="text-[11px] font-extrabold uppercase tracking-[0.18em] text-clay-deep">{title}</h2>}
          {aside}
        </header>
      )}
      {children}
    </section>
  );
}

export function Chip({ on, onClick, children }: { on: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      onClick={onClick}
      className={`pill cursor-pointer px-3 py-1 text-[11px] font-extrabold ${on ? "bg-moss text-ink" : "bg-linen text-faded"}`}
    >
      {children}
    </button>
  );
}

// Section label used for the bands inside a view.
export function BandLabel({ children, aside }: { children: React.ReactNode; aside?: React.ReactNode }) {
  return (
    <div className="flex flex-wrap items-baseline justify-between gap-2">
      <h2 className="text-[11px] font-extrabold uppercase tracking-[0.18em] text-clay-deep">{children}</h2>
      {aside}
    </div>
  );
}

// For blocks that are not cards — a bare strip, a chip row, a stat panel.
export function Reveal({
  children,
  delay = 0,
  assemble = false,
  className = "",
}: {
  children: React.ReactNode;
  delay?: number;
  assemble?: boolean;
  className?: string;
}) {
  const { ref, shown } = useReveal<HTMLDivElement>();
  return (
    <div
      ref={ref}
      data-reveal={shown ? "shown" : "pending"}
      data-assemble={assemble ? "" : undefined}
      style={{ animationDelay: shown && delay ? `${delay}ms` : undefined }}
      className={className}
    >
      {children}
    </div>
  );
}
