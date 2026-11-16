"use client";
// A split-flap departure board (Fallblatt) at the end of the line. Each row is a label and a run of flap cells;
// when the board comes into view every flap turns through the alphabet to its letter, and when a row's text
// changes (say, the visitor types into the box under it) its flaps turn again. Built from spans and one CSS
// keyframe per flap - no images, no library.
// For assistive technology it is one picture with one sentence (`label`); the flaps are hidden.
// Reduced motion, or no script: the board shows its final text, nothing turns.
import { useEffect, useRef, useState } from "react";
import { boardText, flapStep } from "./line";
import { useReducedMotion } from "./motion";
import { cn } from "@/lib/utils/cn";
import styles from "./DepartureBoard.module.css";

export type BoardRow = { label: string; text: string; tone?: "gold" };

/**
 * rows      the board's rows, top to bottom: { label, text, tone? } - text is upper-cased; a long text shows its end
 * label     the one sentence a screen reader hears for the whole board
 * caption   the small line across the board's top (left), e.g. "Departures"
 * platform  the small line across the board's top (right), e.g. "Platform 1"
 * cells     flaps per row (default 22)
 */
export function DepartureBoard({ rows, label, caption = "Departures", platform = "Platform 1", cells = 22, className }: {
  rows: BoardRow[]; label: string; caption?: string; platform?: string; cells?: number; className?: string;
}) {
  const targets = rows.map((r) => boardText(r.text, cells));
  const key = targets.join("\n");
  const reduced = useReducedMotion();
  const root = useRef<HTMLDivElement>(null);
  const [shown, setShown] = useState<string[]>(targets);
  const [armed, setArmed] = useState(false);
  const want = useRef<string[]>(targets);
  const cur = useRef<string[]>(targets);
  const seen = useRef(false);
  const timer = useRef<number | null>(null);

  // One timer turns every flap that is not on its letter, one step each 55 ms, and stops when all are.
  const run = useRef(() => {
    if (timer.current !== null) return;
    timer.current = window.setInterval(() => {
      const next = want.current.map((t, i) => flapStep(cur.current[i] ?? "", t));
      cur.current = next;
      setShown(next);
      if (next.every((row, i) => row === want.current[i]) && timer.current !== null) {
        window.clearInterval(timer.current);
        timer.current = null;
      }
    }, 55);
  });

  useEffect(() => {
    want.current = key.split("\n");
    if (seen.current) run.current();
  }, [key]);

  useEffect(() => {
    const el = root.current;
    if (!el || reduced) return;
    const blank = " ".repeat(cells);
    const io = new IntersectionObserver(([e]) => {
      if (!cur.current.every((r) => r === blank) && !seen.current) {
        cur.current = want.current.map(() => blank);
        setShown(cur.current);
        setArmed(true);
      }
      if (e.isIntersecting && !seen.current) {
        seen.current = true;
        run.current();
        io.disconnect();
      }
    }, { threshold: 0.4 });
    io.observe(el);
    return () => {
      io.disconnect();
      if (timer.current !== null) { window.clearInterval(timer.current); timer.current = null; }
      seen.current = false;
    };
  }, [reduced, cells]);

  const view = armed && !reduced ? shown : targets;
  return (
    <div ref={root} className={cn(styles.board, className)} role="img" aria-label={label} style={{ "--n": cells } as React.CSSProperties}>
      <div className={styles.head} aria-hidden="true"><span><i />{caption}</span><span>{platform}</span></div>
      {rows.map((r, i) => (
        <div key={i} className={styles.row} data-tone={r.tone} aria-hidden="true">
          <span className={styles.label}>{r.label}</span>
          <span className={styles.cells}>
            {Array.from(view[i] ?? "", (c, k) => (
              <span key={k} className={styles.cell}><span key={c} className={styles.ch}>{c}</span></span>
            ))}
          </span>
        </div>
      ))}
    </div>
  );
}
