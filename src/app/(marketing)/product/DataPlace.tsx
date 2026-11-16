"use client";
// "Where your data lives" in the Berlin line's language.
//   Separation  a small night board: the place as the rules' gold pin with its halo (RulesBento, rule 4), and under
//               it two lines that never meet - your NextUp to its own terminus, another company to its own. A
//               gold light rides each line to its own end and never crosses to the other.
//   DataStops   the spec sheet as a stop list: a 4px brand line down the left, one station ring per row, each ring
//               lighting as the line passes it on the screen (motion.ts onFrame).
// Reduced motion or no script: everything lit and still (the CSS default); the lights stand at their termini.
// The board is decorative (aria-hidden); the words are the h2 and the list.
import { useEffect, useRef } from "react";
import { clamp01, onFrame, useReducedMotion } from "@/components/berlin/motion";
import styles from "./DataPlace.module.css";

/** The night board: one place, two lines that never connect. */
export function Separation({ place }: { place: string }) {
  return (
    <figure className={styles.board} aria-hidden="true">
      <svg viewBox="0 0 360 236" className={styles.art} focusable="false">
        {/* The place: the gold pin and its halo. */}
        <circle className={styles.wave} cx={180} cy={62} r={7} />
        <circle className={`${styles.wave} ${styles.wave2}`} cx={180} cy={62} r={7} />
        <circle className={styles.halo} cx={180} cy={62} r={20} />
        <path className={styles.pin} d="M180 62c-8-10-12.6-16.4-12.6-22.6a12.6 12.6 0 1 1 25.2 0c0 6.2-4.6 12.6-12.6 22.6z" />
        <circle className={styles.pinDot} cx={180} cy={39.4} r={4.4} />
        <text className={styles.place} x={180} y={90} textAnchor="middle">{place.toUpperCase()}</text>

        {/* Your NextUp: its own line, from your plant to your own address. */}
        <g className={styles.lineA}>
          <rect className={styles.bullet} x={18} y={124} width={22} height={22} rx={6} />
          <text className={styles.bulletText} x={29} y={139.5} textAnchor="middle">N</text>
          <path className={styles.track} d="M52 135H316" />
          <rect className={styles.term} x={316} y={125} width={7} height={20} rx={3.5} />
          <circle className={styles.st} cx={52} cy={135} r={6} />
          <text className={styles.name} x={52} y={114}>YOUR NEXTUP</text>
          <text className={styles.end} x={323} y={114} textAnchor="end">YOUR ADDRESS</text>
          <g className={styles.ride}><circle className={styles.glow} cx={52} cy={135} r={10} /><circle className={styles.lamp} cx={52} cy={135} r={5} /></g>
        </g>

        {/* The gap between them: no track crosses it. */}
        <path className={styles.gap} d="M52 165H316" />
        <text className={styles.gapText} x={184} y={169} textAnchor="middle">NEVER CONNECTED</text>

        {/* Another company: a line of its own, to its own terminus. */}
        <g className={styles.lineB}>
          <rect className={styles.bullet} x={18} y={184} width={22} height={22} rx={6} />
          <text className={styles.bulletText} x={29} y={199.5} textAnchor="middle">B</text>
          <path className={styles.track} d="M52 195H316" />
          <rect className={styles.term} x={316} y={185} width={7} height={20} rx={3.5} />
          <circle className={styles.st} cx={52} cy={195} r={6} />
          <text className={styles.name} x={52} y={224}>ANOTHER COMPANY</text>
          <text className={styles.end} x={323} y={224} textAnchor="end">ITS OWN ADDRESS</text>
          <g className={styles.ride}><circle className={styles.glow} cx={52} cy={195} r={10} /><circle className={styles.lamp} cx={52} cy={195} r={5} /></g>
        </g>
      </svg>
    </figure>
  );
}

/** The spec sheet as a list of stops on one line. */
export function DataStops({ rows }: { rows: ReadonlyArray<readonly [string, string]> }) {
  const root = useRef<HTMLDListElement>(null);
  const reduced = useReducedMotion();

  useEffect(() => {
    const el = root.current;
    if (!el || reduced) return;
    const items = Array.from(el.querySelectorAll<HTMLDivElement>(":scope > div"));
    el.dataset.armed = "";
    let lit = -1;
    let stop: (() => void) | null = null;
    const job = () => {
      const vh = window.innerHeight;
      // A stop lights once its ring passes 80% of the screen; the line fills down to the last lit stop.
      const tops = items.map((d) => d.getBoundingClientRect().top);
      const n = tops.filter((t) => t + 24 < vh * 0.8).length;
      const r = el.getBoundingClientRect();
      const fill = clamp01((vh * 0.8 - r.top) / Math.max(1, r.height));
      return () => {
        el.style.setProperty("--fill", fill.toFixed(3));
        if (n !== lit) {
          lit = n;
          items.forEach((d, k) => { if (k < n) d.dataset.lit = ""; else delete d.dataset.lit; });
        }
      };
    };
    const near = new IntersectionObserver(([e]) => {
      if (e.isIntersecting && !stop) stop = onFrame(job);
      else if (!e.isIntersecting && stop) { stop(); stop = null; }
    }, { rootMargin: "20% 0px" });
    near.observe(el);
    return () => {
      near.disconnect(); stop?.();
      delete el.dataset.armed;
      el.style.removeProperty("--fill");
      items.forEach((d) => { delete d.dataset.lit; });
    };
  }, [reduced]);

  return (
    <dl ref={root} className={styles.stops}>
      {rows.map(([k, v]) => (
        <div key={k}>
          <i aria-hidden="true" />
          <dt className="nh-mono">{k}</dt>
          <dd>{v}</dd>
        </div>
      ))}
    </dl>
  );
}
