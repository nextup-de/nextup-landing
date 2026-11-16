"use client";
// A run of split-flap cells (Fallblatt), the Berlin board's letters on their own: the ring's day counter, the
// clock's count-down. The text is shown through boardText (upper case, cut or padded to `cells`). The first time
// the run is 40% in view it turns from blank to its text; when `text` changes after that, every flap that is not on
// its letter turns one step each `step` ms (flapStep) until the run reads the new text. A turning flap is the
// cell's top half falling over on its hinge (rotateX), showing the letter that was there before.
// Out of view nothing turns: a change while hidden is simply there when the run comes back.
// Decorative: the cells are hidden from assistive technology, so the caller says the text in words.
// Reduced motion, or no script: the final text, nothing turns.
import { useEffect, useRef, useState } from "react";
import { cn } from "@/lib/utils/cn";
import { boardText, flapStep } from "./line";
import { useReducedMotion } from "./motion";
import styles from "./Flaps.module.css";

type View = { now: string; was: string };

/**
 * text       what the run reads (upper-cased; a long text shows its end)
 * cells      how many flaps
 * size       s 15px · m 24px · l 64px (44 on a phone) · xl 120px (88 on a phone); a caller can set --fs instead
 * tone       gold letters, ok (green faces) or late (red letters); default warm white on the board's near-black
 * step       ms between two turns of a flap
 */
export function Flaps({ text, cells, size = "m", tone, step = 45, className }: {
  text: string; cells: number; size?: "s" | "m" | "l" | "xl"; tone?: "gold" | "ok" | "late"; step?: number; className?: string;
}) {
  const target = boardText(text, cells);
  const reduced = useReducedMotion();
  const root = useRef<HTMLSpanElement>(null);
  const [view, setView] = useState<View>({ now: target, was: target });
  const [live, setLive] = useState(false);
  const want = useRef(target);
  const cur = useRef(target);
  const seen = useRef(false);
  const visible = useRef(false);
  const timer = useRef<number | null>(null);
  const stepMs = useRef(step);

  useEffect(() => { stepMs.current = step; }, [step]);

  // One timer for the whole run: one step for every flap that is off its letter, until none is.
  const stopTimer = () => {
    if (timer.current !== null) { window.clearInterval(timer.current); timer.current = null; }
  };
  const turn = useRef(() => {
    if (timer.current !== null) return;
    timer.current = window.setInterval(() => {
      const was = cur.current;
      const next = flapStep(was, want.current);
      cur.current = next;
      setView({ now: next, was });
      if (next === want.current) stopTimer();
    }, stepMs.current);
  });

  // A new text: turn to it while in view and seen, else just be it.
  useEffect(() => {
    want.current = target;
    if (seen.current && visible.current && !reduced) {
      turn.current();
    } else if (cur.current !== target) {
      stopTimer();
      cur.current = target;
      setView({ now: target, was: target });
    }
  }, [target, reduced]);

  useEffect(() => {
    const el = root.current;
    if (!el || reduced) return;
    const blank = " ".repeat(cells);
    const io = new IntersectionObserver(([e]) => {
      visible.current = e.isIntersecting;
      if (!seen.current) {
        if (e.intersectionRatio >= 0.4) {
          seen.current = true;
          cur.current = blank;
          setView({ now: blank, was: blank });
          setLive(true);
          turn.current();
        }
        return;
      }
      if (!e.isIntersecting) {
        // Leaving: no timer runs off screen; the run settles on its text.
        stopTimer();
        if (cur.current !== want.current) { cur.current = want.current; setView({ now: want.current, was: want.current }); }
      }
    }, { threshold: [0, 0.4] });
    io.observe(el);
    return () => { io.disconnect(); stopTimer(); };
  }, [reduced, cells]);

  const now = live && !reduced ? view.now : target;
  const was = live && !reduced ? view.was : target;
  return (
    <span ref={root} className={cn(styles.flaps, styles[size], tone && styles[tone], className)} data-live={live && !reduced ? "" : undefined}
      aria-hidden="true" style={{ "--n": cells, "--step": `${Math.max(90, step * 2.6)}ms` } as React.CSSProperties}>
      {Array.from(now, (c, k) => (
        <span key={k} className={styles.cell}>
          <span key={c} className={styles.ch}>{c}</span>
          {was[k] !== c && <span key={`l${c}`} className={styles.leaf}><span>{was[k]}</span></span>}
        </span>
      ))}
    </span>
  );
}
