"use client";
// The line through the page: a transit-map line with one station per section, from Warschauer Strasse (the
// scene at the top) to the terminus, "Your plant" (the close). A train rides it as the page scrolls - it is
// where the reader is, never a control of the scroll. The current station lights up and says its name; every
// station is a link to its section. On a wide screen the line stands in the left margin and its names open on
// hover or focus; on a narrow one it lies across the top under the header, after the scene.
// A station with `to` is an interchange to another page: its name carries a small change arrow.
// `tone="calm"` (on /product): a 1px line with no train, where only the stations light; wide screens only.
// Reduced motion: no train, the stations still light up.
import { useEffect, useRef, useState } from "react";
import { ride, type Station } from "./line";
import { onFrame, useReducedMotion } from "./motion";
import styles from "./LineRail.module.css";

/**
 * stations  the line's stations in page order: { id (the section's element id), name, kind, dark? }; while the
 *           reader is on a `dark` station the rail is drawn light (wide) or hidden (narrow)
 * label     the nav's accessible name
 * bullet    the line's name in its bullet above the first station
 * train     whether a train rides the line (default true; never under reduced motion or with tone "calm")
 * tone      "line" (default): the full line; "calm": a 1px line, no train, shown from 1024px only
 */
export function LineRail({ stations, label = "The line through this page", bullet = "N", train: withTrain = true, tone = "line" }: {
  stations: Station[]; label?: string; bullet?: string; train?: boolean; tone?: "line" | "calm";
}) {
  const LAST = Math.max(1, stations.length - 1);
  const track = useRef<HTMLDivElement>(null);
  const train = useRef<HTMLSpanElement>(null);
  const done = useRef<HTMLSpanElement>(null);
  const [at, setAt] = useState(0);
  const reduced = useReducedMotion();
  const calm = tone === "calm";
  const rides = withTrain && !calm && !reduced;

  useEffect(() => {
    const t = track.current;
    if (!t) return;
    let dirty = true;
    let tops: number[] = [];
    let len = 0;
    let vertical = true;
    let shown = -1;
    let lastY = -1;
    let dir = "down";

    // Section offsets change only with the layout, so they are measured then, not every frame.
    const ro = new ResizeObserver(() => { dirty = true; });
    ro.observe(document.body);
    ro.observe(t);

    const stop = onFrame(() => {
      const y = window.scrollY;
      const vh = window.innerHeight;
      if (dirty) {
        dirty = false;
        tops = stations.map((s) => {
          const el = document.getElementById(s.id);
          return el ? el.getBoundingClientRect().top + y : Number.POSITIVE_INFINITY;
        });
        const r = t.getBoundingClientRect();
        vertical = r.height >= r.width;
        len = vertical ? r.height : r.width;
      }
      const end = y + vh >= document.documentElement.scrollHeight - 2;
      const { index, along } = ride(tops, y + vh * 0.4, end);
      if (lastY >= 0 && y !== lastY) dir = y > lastY ? "down" : "up";
      lastY = y;
      const f = (index + along) / LAST;
      return () => {
        const pos = f * len;
        if (train.current) {
          train.current.style.transform = vertical ? `translate3d(0, ${pos}px, 0)` : `translate3d(${pos}px, 0, 0)`;
          train.current.dataset.dir = dir;
        }
        if (done.current) done.current.style.transform = vertical ? `scaleY(${f})` : `scaleX(${f})`;
        if (index !== shown) { shown = index; setAt(index); }
      };
    });
    return () => { stop(); ro.disconnect(); };
  }, [stations, LAST]);

  return (
    <nav className={styles.rail} aria-label={label} data-tone={stations[at]?.dark ? "dark" : "light"} data-calm={calm || undefined}>
      <span className={styles.bullet} aria-hidden="true">{bullet}</span>
      <span className={styles.now} aria-hidden="true">{stations[at]?.name}</span>
      <div ref={track} className={styles.track}>
        <span ref={done} className={styles.done} aria-hidden="true" />
        {rides && <span ref={train} className={styles.train} aria-hidden="true" />}
        <ol>
          {stations.map((s, i) => (
            <li key={s.id} data-kind={s.kind} data-on={i === at} data-past={i < at}
              style={{ "--f": i / LAST } as React.CSSProperties}>
              <a href={`#${s.id}`} aria-current={i === at ? "location" : undefined}>
                <i className={styles.dot} aria-hidden="true" />
                <span className={styles.name}>{s.name}{s.to && <i className={styles.to} aria-hidden="true">→</i>}</span>
              </a>
              <span className={styles.tag} aria-hidden="true">{s.name}</span>
            </li>
          ))}
        </ol>
      </div>
    </nav>
  );
}
