import { useEffect, useRef, useState } from "react";

/**
 * Decides when a scroll-reveal element becomes visible.
 *
 * This deliberately does not use framer-motion's `whileInView`. That fires
 * only while an element *intersects* the viewport, which silently loses
 * content the page jumps over: a hash link like /services#automation,
 * the browser restoring a scroll position on back-navigation, or any
 * scrollTo — everything above the landing point never intersects and would
 * stay at `opacity: 0` permanently. That was reproducible; this is the fix.
 *
 * The condition here is monotonic instead: reveal once the element's top edge
 * has crossed the fold, which is true both for something scrolling into view
 * and for something the page jumped past. One shared rAF-throttled listener
 * serves every element on the page.
 */
type Watcher = { element: HTMLElement; reveal: () => void };

const watchers = new Set<Watcher>();
let frame = 0;
let listening = false;

/** An element counts as revealed once its top edge is above this line. */
const THRESHOLD = () => window.innerHeight - 64;

function check() {
  frame = 0;
  for (const watcher of [...watchers]) {
    if (watcher.element.getBoundingClientRect().top < THRESHOLD()) {
      watchers.delete(watcher);
      watcher.reveal();
    }
  }
  if (watchers.size === 0) stopListening();
}

function schedule() {
  if (frame === 0) frame = requestAnimationFrame(check);
}

function startListening() {
  if (listening) return;
  listening = true;
  window.addEventListener("scroll", schedule, { passive: true });
  window.addEventListener("resize", schedule, { passive: true });
}

function stopListening() {
  if (!listening) return;
  listening = false;
  window.removeEventListener("scroll", schedule);
  window.removeEventListener("resize", schedule);
}

export function useReveal<T extends HTMLElement>() {
  const ref = useRef<T>(null);
  const [revealed, setRevealed] = useState(false);

  useEffect(() => {
    const element = ref.current;
    if (!element) return;

    const watcher: Watcher = { element, reveal: () => setRevealed(true) };
    watchers.add(watcher);
    startListening();
    // Also check immediately, for anything already above the fold on load —
    // and once more on the next frame, after any hash or restored scroll has
    // been applied.
    schedule();
    const settle = setTimeout(schedule, 120);

    return () => {
      clearTimeout(settle);
      watchers.delete(watcher);
      if (watchers.size === 0) stopListening();
    };
  }, []);

  return { ref, revealed };
}
