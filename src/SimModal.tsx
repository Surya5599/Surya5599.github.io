import { useEffect, useRef } from "react";

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

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-ink/50 p-4 sm:p-8"
      onMouseDown={(e) => {
        if (!panelRef.current?.contains(e.target as Node)) onClose();
      }}
      role="dialog"
      aria-modal="true"
      aria-label={title}
    >
      <div
        ref={panelRef}
        className="flex h-[80vh] w-full max-w-3xl flex-col border border-pane-edge bg-pane text-pane-text shadow-2xl"
      >
        <header className="flex items-center justify-between border-b border-pane-edge px-4 py-2 font-mono text-xs text-pane-dim">
          <span>{title}</span>
          <button
            onClick={onClose}
            className="cursor-pointer px-1 text-pane-dim hover:text-pane-text"
            aria-label="Close simulation"
          >
            ✕ esc
          </button>
        </header>
        {children}
      </div>
    </div>
  );
}
