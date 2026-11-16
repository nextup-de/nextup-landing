"use client";
// How a plant pays, drawn as a line: the paid pilot's three phases (PILOT_PHASES), then the change to per-seat
// pricing. When the line comes into view a train rides it once from Scope to the interchange, the line fills in
// teal behind it and each stop lights as it passes; then it stands at "Per seat". Below 760px the line stands
// upright and only the stops light, one after another.
// No script or reduced motion: the line is drawn complete and lit, nothing moves.
import { useEffect, useRef } from "react";
import { useReducedMotion } from "@/components/berlin/motion";
import { PILOT_PHASES } from "@/config/site";
import styles from "./FareLine.module.css";

const STOPS = [
  ...PILOT_PHASES.map(([phase, title], i) => ({ kicker: `Phase ${i + 1} · ${phase}`, title, kind: "stop" as const })),
  { kicker: "After the pilot · Per seat", title: "One seat per person who uses NextUp", kind: "interchange" as const },
];

export function FareLine() {
  const root = useRef<HTMLDivElement>(null);
  const reduced = useReducedMotion();

  useEffect(() => {
    const el = root.current;
    if (!el || reduced) return;
    el.dataset.armed = "";
    const io = new IntersectionObserver(([e]) => {
      if (e.isIntersecting) { el.dataset.run = ""; io.disconnect(); }
    }, { threshold: 0.6 });
    io.observe(el);
    return () => { io.disconnect(); delete el.dataset.armed; };
  }, [reduced]);

  return (
    <div ref={root} className={styles.fare}>
      <p className={styles.spans} aria-hidden="true">
        <span className={styles.pilot}>Paid pilot · scope and price by agreement</span>
        <span className={styles.seats}>Per seat · price on request</span>
      </p>
      <div className={styles.track}>
        <span className={styles.line} aria-hidden="true" />
        <span className={styles.fill} aria-hidden="true" />
        <span className={styles.run} aria-hidden="true"><i className={styles.train} /></span>
        <ol className={styles.stops} aria-label="From the pilot to per-seat pricing">
          {STOPS.map((s, i) => (
            <li key={s.kicker} data-kind={s.kind} style={{ "--i": i } as React.CSSProperties}>
              <i className={styles.dot} aria-hidden="true" />
              <span className={styles.kicker}>{s.kicker}</span>
              <span className={styles.title}>{s.title}</span>
            </li>
          ))}
        </ol>
      </div>
    </div>
  );
}
