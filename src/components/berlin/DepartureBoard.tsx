"use client";
// A split-flap departure board (Fallblatt) at the end of the line. Each row is a label and a run of flap cells;
// when the board comes into view every flap turns through the alphabet to its letter, and when a row's text
// changes (say, the visitor types into the box under it) its flaps turn again. Built from spans and one CSS
// keyframe per flap - no images, no library.
// For assistive technology it is one picture with one sentence (`label`); the flaps are hidden.
// Reduced motion, or no script: the board shows its final text, nothing turns.
// A row may carry a status in a static right-hand column ("3 d left"); `then` replaces it 1.2 s after the flaps
// have settled ("1 d late" becomes "1 d late -> deputy"), and `tone` colours the row (gold text, late, ok).
// Rows without a status render exactly as before.
import { useEffect, useRef, useState } from "react";
import { boardText, flapStep } from "./line";
import { useReducedMotion } from "./motion";
import { cn } from "@/lib/utils/cn";
import styles from "./DepartureBoard.module.css";

export type BoardRow = { label: string; text: string; tone?: "gold" | "late" | "ok"; status?: string; then?: string };

const THEN_MS = 1200; // how long a settled status stands before `then` replaces it

/**
 * rows      the board's rows, top to bottom: { label, text, tone?, status?, then? } - text is upper-cased; a long text
 *           shows its end; status is a static right-hand column, then its later value
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
  const later = useRef<number | null>(null);
  const [swapped, setSwapped] = useState(true); // server and reduced motion: the final status
  const hasThen = rows.some((r) => r.then);

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
        if (later.current === null) later.current = window.setTimeout(() => { later.current = null; setSwapped(true); }, THEN_MS);
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
        if (hasThen) setSwapped(false);
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
      if (later.current !== null) { window.clearTimeout(later.current); later.current = null; }
      seen.current = false;
    };
  }, [reduced, cells, hasThen]);

  const view = armed && !reduced ? shown : targets;
  const after = swapped || reduced || !armed;
  const hasStatus = rows.some((r) => r.status !== undefined);
  return (
    <div ref={root} className={cn(styles.board, className)} role="img" aria-label={label} data-status={hasStatus || undefined}
      style={{ "--n": cells } as React.CSSProperties}>
      <div className={styles.head} aria-hidden="true"><span><i />{caption}</span><span>{platform}</span></div>
      {rows.map((r, i) => (
        <div key={i} className={styles.row} data-tone={r.tone} data-i={i} data-then={r.then && after ? "" : undefined} aria-hidden="true">
          <span className={styles.label}>{r.label}</span>
          <span className={styles.cells}>
            {Array.from(view[i] ?? "", (c, k) => (
              <span key={k} className={styles.cell}><span key={c} className={styles.ch}>{c}</span></span>
            ))}
          </span>
          {hasStatus && (
            <span className={styles.status}>
              <span key={r.then && after ? "then" : "now"}>{(r.then && after ? r.then : r.status) ?? ""}</span>
            </span>
          )}
        </div>
      ))}
    </div>
  );
}
