// the photo, framed — nothing more
export function Avatar({ className }: { className?: string }) {
  return (
    <div
      className={
        className ??
        "relative h-12 w-12 shrink-0 overflow-hidden rounded-full border-2 border-ink shadow-[2px_2px_0_var(--color-ink)] lg:h-auto lg:w-full lg:aspect-square lg:rounded-2xl lg:shadow-[4px_4px_0_var(--color-ink)]"
      }
    >
      <img src="/surya.jpg" alt="Surya Singh" className="h-full w-full object-cover" />
    </div>
  );
}
