import { useEffect, useRef } from "react";
import { createPortal } from "react-dom";

export default function SimModal({
  title,
  onClose,
  children,
}: {
  title: string;
  onClose: () => void;
  children: React.ReactNode;
}) {
  const panelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    document.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [onClose]);

  // Portal to <body>: no ancestor transform/animation/overflow can trap the
  // overlay, so it always covers and centers on the real viewport.
  return createPortal(
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center bg-ink/60 p-4 sm:p-8"
      onMouseDown={(e) => {
        if (!panelRef.current?.contains(e.target as Node)) onClose();
      }}
      role="dialog"
      aria-modal="true"
      aria-label={title}
    >
      <div
        ref={panelRef}
        className="flex h-[80vh] w-full max-w-3xl flex-col overflow-hidden rounded-xl border-2 border-ink bg-pane text-pane-text shadow-[6px_6px_0_var(--color-ink)]"
      >
        <header className="flex items-center justify-between border-b border-pane-edge px-4 py-2 font-mono text-xs text-pane-dim">
          <span>{title}</span>
          <button
            onClick={onClose}
            className="cursor-pointer rounded-full border border-pane-dim px-3 py-1 font-bold text-pane-text transition-colors hover:border-pane-text hover:bg-pane-edge"
            aria-label="Close simulation"
          >
            ✕ close
          </button>
        </header>
        <div className="flex min-h-0 flex-1 flex-col">{children}</div>
      </div>
    </div>,
    document.body,
  );
}
