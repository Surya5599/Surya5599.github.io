import { useEffect, useRef, useState } from "react";

// Reveal-on-entry: an element animates the first time it scrolls into view and
// then stays put. Scrolling back up never un-reveals anything.
//
// Anything that cannot animate resolves to revealed immediately — reduced
// motion, a browser without IntersectionObserver, or a print stylesheet. The
// hidden state is the exception, never the default.

const canAnimate = () =>
  typeof window !== "undefined" &&
  "IntersectionObserver" in window &&
  !window.matchMedia("(prefers-reduced-motion: reduce)").matches;

export function useReveal<T extends HTMLElement>(): { ref: React.RefObject<T | null>; shown: boolean } {
  const ref = useRef<T>(null);
  const [shown, setShown] = useState(() => !canAnimate());

  useEffect(() => {
    if (shown) return;
    const el = ref.current;
    if (!el) return;

    // Already in view on mount — a deep link, a restored scroll position, or a
    // short page. Reveal without waiting for a scroll that may never come.
    const box = el.getBoundingClientRect();
    if (box.top < window.innerHeight * 0.9 && box.bottom > 0) {
      setShown(true);
      return;
    }

    const io = new IntersectionObserver(
      (entries) => {
        if (entries.some((e) => e.isIntersecting)) {
          setShown(true);
          io.disconnect(); // reveal once
        }
      },
      { threshold: 0.12, rootMargin: "0px 0px -8% 0px" },
    );
    io.observe(el);
    return () => io.disconnect();
  }, [shown]);

  return { ref, shown };
}
