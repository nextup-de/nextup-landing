"use client";
// The questions before a pilot as an accordion, drawn as a line: each question is a stop on one thin teal line,
// numbered like a platform. A question is a button (aria-expanded, aria-controls) that opens its answer below
// it; the answer's row grows open and the text rises in, and the line beside an open answer lights up in teal.
// Any number can be open at once. A closed answer is inert, so neither focus nor a screen reader lands in it.
// Reduced motion: answers open and close at once.
// The answers are claims the pilot has to keep: they come from FAQ in config/site.ts unless a caller passes its
// own items.
import { useId, useState } from "react";
import { FAQ } from "@/config/site";
import { cn } from "@/lib/utils/cn";
import styles from "./FaqList.module.css";

export type FaqItem = readonly [question: string, answer: string];

/**
 * items   the questions and answers, in order (default: FAQ in config/site.ts)
 * level   the heading level of each question (default 3, under a section's h2)
 * open    the indexes open at first (default: none)
 */
export function FaqList({ items = FAQ, level = 3, open: initial = [], className }: {
  items?: ReadonlyArray<FaqItem>; level?: 2 | 3 | 4; open?: number[]; className?: string;
}) {
  const id = useId();
  const [open, setOpen] = useState<ReadonlySet<number>>(() => new Set(initial));
  const H = `h${level}` as "h2" | "h3" | "h4";
  const toggle = (i: number) => setOpen((o) => {
    const next = new Set(o);
    if (next.has(i)) next.delete(i); else next.add(i);
    return next;
  });

  return (
    <ol className={cn(styles.list, className)}>
      {items.map(([q, a], i) => {
        const on = open.has(i);
        const qid = `${id}-q${i}`;
        const aid = `${id}-a${i}`;
        return (
          <li key={q} className={styles.item} data-open={on}>
            <span className={styles.lit} aria-hidden="true" />
            <H className={styles.q}>
              <button id={qid} type="button" className={styles.toggle} aria-expanded={on} aria-controls={aid} onClick={() => toggle(i)}>
                <span className={styles.stop} aria-hidden="true" />
                <span className={styles.no} aria-hidden="true">{String(i + 1).padStart(2, "0")}</span>
                <span className={styles.text}>{q}</span>
                <span className={styles.icon} aria-hidden="true"><i /><i /></span>
              </button>
            </H>
            <div id={aid} role="region" aria-labelledby={qid} className={styles.panel} inert={!on}>
              <div className={styles.inner}>
                <p>{a}</p>
              </div>
            </div>
          </li>
        );
      })}
    </ol>
  );
}
