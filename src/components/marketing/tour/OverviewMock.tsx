"use client";
// The manager's view: the numbers that go upward, before NextUp and with it, and where the waiting goes. The
// numbers run to their value when the screen comes into view and again whenever the side changes.
import { useEffect, useRef, useState } from "react";
import { STALL, TILES } from "@/features/demo/tour";
import styles from "./OverviewMock.module.css";

const RUN_MS = 700;
type Side = "before" | "now";

// A number that runs from where it was to where it is now.
function Count({ to, unit }: { to: number; unit: string }) {
  const [shown, setShown] = useState(to);
  const from = useRef(to);
  useEffect(() => {
    const start = from.current;
    if (start === to || window.matchMedia("(prefers-reduced-motion: reduce)").matches) { from.current = to; const t = setTimeout(() => setShown(to), 0); return () => clearTimeout(t); }
    let raf = 0;
    const t0 = performance.now();
    const step = (t: number) => {
      const k = Math.min(1, (t - t0) / RUN_MS);
      const v = start + (to - start) * (1 - Math.pow(1 - k, 3));
      setShown(Math.round(v));
      if (k < 1) raf = requestAnimationFrame(step);
      else from.current = to;
    };
    raf = requestAnimationFrame(step);
    return () => cancelAnimationFrame(raf);
  }, [to]);
  return <>{shown}<small>{unit === "%" ? "%" : ` ${unit}`}</small></>;
}

export function OverviewMock() {
  const root = useRef<HTMLDivElement>(null);
  const [side, setSide] = useState<Side>("before");
  const [seen, setSeen] = useState(false);

  // First time in view: start on "before", then show "with NextUp" - the numbers run on their own once.
  useEffect(() => {
    const el = root.current;
    if (!el) return;
    let timer: ReturnType<typeof setTimeout> | undefined;
    const io = new IntersectionObserver(([e]) => {
      if (!e.isIntersecting) return;
      io.disconnect();
      timer = setTimeout(() => { setSeen(true); setSide("now"); }, 600);
    }, { threshold: 0.4 });
    io.observe(el);
    return () => { io.disconnect(); if (timer) clearTimeout(timer); };
  }, []);

  const now = side === "now";
  const max = Math.max(...STALL.map(([, d]) => d));
  return (
    <div className={styles.mock} ref={root} data-side={side}>
      <div className={styles.top}>
        <span className={styles.title}>Overview</span>
        <div className={styles.toggle} role="group" aria-label="Show the numbers">
          <button type="button" aria-pressed={!now} onClick={() => { setSeen(true); setSide("before"); }}>Before NextUp</button>
          <button type="button" aria-pressed={now} onClick={() => { setSeen(true); setSide("now"); }}>With NextUp</button>
        </div>
      </div>

      <div className={styles.tiles}>
        {TILES.map((t) => {
          const [v, u] = now ? t.now : t.before;
          const better = now && t.before[0] > 0 && t.now[0] !== t.before[0]; // nothing to compare with when there was nothing before
          return (
            <div key={t.label} className={styles.tile}>
              <span className={styles.label}>{t.label}</span>
              {/* A tile whose unit changes with the side (9 d -> 26 h) swaps instead of running through the wrong unit. */}
              <strong className={styles.value}>{t.label === "Waiting days saved" && !now ? "—" : <Count key={u} to={v} unit={u} />}</strong>
              <span className={styles.note}>
                {better && <i>was {t.before[0]}{t.before[1] === "%" ? "%" : ` ${t.before[1]}`}</i>}
                {t.note}
              </span>
            </div>
          );
        })}
      </div>

      <div className={styles.waits}>
        <div className={styles.waitsHead}>
          <b>Where the waiting goes</b>
          <span>{now ? "waiting days, filed by reason" : "not counted"}</span>
        </div>
        {now ? (
          <ul>
            {STALL.map(([reason, days], i) => (
              <li key={reason}>
                <span>{reason}</span>
                <span className={styles.track}><i style={{ "--w": days / max, "--d": `${i * 90}ms` } as React.CSSProperties} data-first={i < 2 ? "true" : undefined} /></span>
                <span className={styles.days}>{days} d</span>
              </li>
            ))}
          </ul>
        ) : (
          <p className={styles.blank}>Before NextUp nobody could say where the waiting went: it was in inboxes, corridors and &ldquo;not me&rdquo;.</p>
        )}
      </div>
      <p className={styles.small}>{seen ? "Demo company figures. A pilot measures your own." : "Demo company figures."}</p>
    </div>
  );
}
