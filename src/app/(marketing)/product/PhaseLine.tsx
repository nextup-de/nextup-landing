"use client";
// The pilot's three phases (PILOT_PHASES) as one short line in the pricing hero's language (FareLine): a 4px brand
// line, a numbered square badge per phase, the phase and its title in ink. A small gold train rides the line with
// the scroll (motion.ts onFrame): it stands at Scope when the line enters the screen and reaches Run as the line
// nears the top; each phase it reaches lights. Below 760px the line stands upright and the train rides down it.
// Reduced motion or no script: the train stands at Run and every phase is lit.
import { useEffect, useRef } from "react";
import { clamp01, onFrame, useReducedMotion } from "@/components/berlin/motion";
import { PILOT_PHASES } from "@/config/site";
import styles from "./PhaseLine.module.css";

export function PhaseLine() {
  const root = useRef<HTMLDivElement>(null);
  const reduced = useReducedMotion();

  useEffect(() => {
    const el = root.current;
    if (!el || reduced) return;
    const items = Array.from(el.querySelectorAll<HTMLLIElement>("li"));
    el.dataset.armed = "";
    let at = -1;
    let stop: (() => void) | null = null;
    const job = () => {
      const r = el.getBoundingClientRect();
      const vh = window.innerHeight;
      const p = clamp01((vh * 0.95 - r.top) / (vh * 0.4));
      const n = Math.min(items.length - 1, Math.floor(p * (items.length - 1) + 0.15));
      return () => {
        el.style.setProperty("--t", p.toFixed(3));
        if (n !== at) {
          at = n;
          items.forEach((li, k) => { if (k <= n) li.dataset.lit = ""; else delete li.dataset.lit; });
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
      el.style.removeProperty("--t");
      items.forEach((li) => { delete li.dataset.lit; });
    };
  }, [reduced]);

  return (
    <div ref={root} className={styles.phases}>
      <span className={styles.line} aria-hidden="true"><span className={styles.fill} /></span>
      <span className={styles.run} aria-hidden="true"><i className={styles.train} /></span>
      <ol className={styles.stops} aria-label="The three phases of a pilot">
        {PILOT_PHASES.map(([phase, title], i) => (
          <li key={phase}>
            <span className={styles.badge} aria-hidden="true">{i + 1}</span>
            <span className={styles.kicker}>Phase {i + 1} · {phase}</span>
            <span className={styles.title}>{title}</span>
          </li>
        ))}
      </ol>
    </div>
  );
}
