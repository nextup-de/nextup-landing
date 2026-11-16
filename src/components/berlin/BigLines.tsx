"use client";
// Lines in huge type, passed like stations. Each line rises out of its own slot the first time it crosses 80% of
// the screen; with `strike`, a line is struck through (a red bar drawn left to right, the words going grey) when
// the next one arrives, and the last one shortly after it arrived. Nothing moves twice.
// Server markup, no script and reduced motion: every line there, and struck if `strike`.
import { useEffect, useRef } from "react";
import { cn } from "@/lib/utils/cn";
import { useReducedMotion } from "./motion";
import styles from "./BigLines.module.css";

/**
 * lines   the lines, top to bottom (plain text)
 * strike  strike each line through as the reader passes it
 */
export function BigLines({ lines, strike = false, className }: { lines: readonly string[]; strike?: boolean; className?: string }) {
  const root = useRef<HTMLUListElement>(null);
  const reduced = useReducedMotion();

  useEffect(() => {
    const el = root.current;
    if (!el || reduced) return;
    const items = Array.from(el.querySelectorAll<HTMLLIElement>(":scope > li"));
    const shown = items.map(() => false);
    let lastTimer = 0;
    el.dataset.armed = "";
    const show = (i: number) => {
      // A fast scroll can skip lines: every line above the one that arrived arrives with it.
      for (let k = 0; k <= i; k++) {
        if (shown[k]) continue;
        shown[k] = true;
        items[k].dataset.in = "";
        if (strike && k > 0) items[k - 1].dataset.struck = "";
      }
      if (strike && i === items.length - 1 && !lastTimer) {
        lastTimer = window.setTimeout(() => { items[i].dataset.struck = ""; }, 900);
      }
    };
    const io = new IntersectionObserver((entries) => {
      for (const e of entries) {
        if (e.isIntersecting || e.boundingClientRect.top < 0) show(items.indexOf(e.target as HTMLLIElement));
      }
      if (shown.every(Boolean)) io.disconnect();
    }, { rootMargin: "0px 0px -20% 0px" });
    items.forEach((li) => io.observe(li));
    return () => {
      io.disconnect();
      window.clearTimeout(lastTimer);
      delete el.dataset.armed;
      items.forEach((li) => { delete li.dataset.in; delete li.dataset.struck; });
    };
  }, [reduced, strike]);

  return (
    <ul ref={root} role="list" className={cn(styles.lines, strike && styles.strike, className)}>
      {lines.map((l) => (
        <li key={l} className={styles.line}><span className={styles.inner}>{l}</span></li>
      ))}
    </ul>
  );
}
