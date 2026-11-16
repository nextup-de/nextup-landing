"use client";
// The pilot as a Berlin building site. As the reader scrolls past it, the three phases happen to one building:
//   Scope  the plan is drawn on the ground: its outline, the surveyor's stakes
//   Build  a tower crane lifts the floors in, one by one
//   Run    the lights come on floor by floor and the line's flag goes up on the roof
// The phases stand under it as three stations on one line, each with its title and sentence: the station of the
// phase being built lights gold, the phases already done get a filled stop and a "done" mark, and no text is ever
// dimmed. The current phase is also written on the enclosing <section> (data-phase="1|2|3").
// Decorative: the picture is hidden from assistive technology; the phases below it are a plain ordered list.
// Reduced motion: the building stands finished and lit, every phase reached, nothing on the section.
import { useEffect, useRef } from "react";
import { cn } from "@/lib/utils/cn";
import { clamp01, onFrame, useReducedMotion } from "./motion";
import styles from "./PilotSite.module.css";

const GROUND = 250;
const FLOORS = 8;
const FH = 24;
const X0 = 480, X1 = 720;
const TROLLEY_REST = 820;
const JIB_Y = 34;

const floorTop = (k: number) => GROUND - FH * (k + 1);

/** Splits the site's progress (0..1) into the three phases' own progress. */
export function siteStages(p: number) {
  const scope = clamp01(p / 0.28);
  const build = clamp01((p - 0.28) / 0.5);
  const run = clamp01((p - 0.78) / 0.2);
  const phase = p < 0.28 ? 0 : p < 0.78 ? 1 : 2;
  return { scope, build, run, phase };
}

function Floor({ k }: { k: number }) {
  const y = floorTop(k);
  const wins = [0, 1, 2, 3, 4].map((i) => (k === 0 && i === 2
    ? <path key={i} className={styles.door} d={`M${588} ${GROUND}V${y + 7}H${612}V${GROUND}`} />
    : <rect key={i} className={styles.win} x={494 + i * 46} y={y + 6} width={30} height={12} rx={1.5} />));
  return (
    <g className={styles.floor} data-k={k}>
      <rect className={styles.body} x={X0} y={y} width={X1 - X0} height={FH} />
      <path className={styles.slab} d={`M${X0 - 6} ${y}H${X1 + 6}`} />
      {wins}
    </g>
  );
}

/**
 * phases   the pilot's phases as [short name, title, body] (PILOT_PHASES): one station each, with title and body
 * className  extra class on the figure
 */
export function PilotSite({ phases, className }: { phases: ReadonlyArray<readonly [string, string, string]>; className?: string }) {
  const root = useRef<HTMLDivElement>(null);
  const svg = useRef<SVGSVGElement>(null);
  const reduced = useReducedMotion();

  useEffect(() => {
    const el = root.current;
    const s = svg.current;
    if (!el || !s || reduced) return;
    const section = el.closest("section");
    const plan = s.querySelector<SVGPathElement>(`.${styles.plan}`);
    const stakes = s.querySelector<SVGGElement>(`.${styles.stakes}`);
    const floors = Array.from(s.querySelectorAll<SVGGElement>(`.${styles.floor}`));
    const trolley = s.querySelector<SVGGElement>(`.${styles.trolley}`);
    const cable = s.querySelector<SVGLineElement>(`.${styles.cable}`);
    const load = s.querySelector<SVGRectElement>(`.${styles.load}`);
    const flag = s.querySelector<SVGGElement>(`.${styles.flag}`);
    let lastPhase = -1, lastBuilt = -1, lastLit = -1;
    el.dataset.live = "";

    const stop = onFrame(() => {
      const r = el.getBoundingClientRect();
      const vh = window.innerHeight;
      const p = clamp01((vh * 0.95 - r.top) / (r.height + vh * 0.45));
      const { scope, build, run, phase } = siteStages(p);
      return () => {
        el.style.setProperty("--p", p.toFixed(3));
        if (plan) plan.style.strokeDashoffset = (1 - scope).toFixed(3);
        if (stakes) stakes.dataset.on = String(scope > 0.6);
        // Build: floor k is lifted during its share of the build, then stands.
        const t = build * FLOORS;
        const built = Math.min(FLOORS, Math.floor(t));
        const frac = t - built;
        if (built !== lastBuilt) { lastBuilt = built; floors.forEach((f, k) => { f.dataset.on = String(k < built); }); }
        const lifting = build > 0 && built < FLOORS;
        const tx = lifting ? 600 : TROLLEY_REST;
        const target = floorTop(built);
        const ly = lifting ? 46 + (target - 46) * Math.min(1, frac * 1.15) : 46;
        if (trolley) trolley.style.transform = `translate(${tx - TROLLEY_REST}px, 0)`;
        if (cable) { cable.setAttribute("x1", String(tx)); cable.setAttribute("x2", String(tx)); cable.setAttribute("y2", ly.toFixed(1)); }
        if (load) { load.style.transform = `translate(${tx - 600}px, ${(ly - 46).toFixed(1)}px)`; load.style.opacity = lifting ? "1" : "0"; }
        const lit = Math.floor(run * FLOORS + (run > 0 ? 0.5 : 0));
        if (lit !== lastLit) { lastLit = lit; floors.forEach((f, k) => { f.dataset.lit = String(k < lit); }); }
        if (flag) flag.dataset.on = String(run >= 0.98);
        if (phase !== lastPhase) {
          lastPhase = phase;
          el.dataset.phase = String(phase + 1);
          if (section) section.dataset.phase = String(phase + 1);
        }
      };
    });
    return () => {
      stop();
      delete el.dataset.live;
      delete el.dataset.phase;
      if (section) delete section.dataset.phase;
    };
  }, [reduced]);

  return (
    <div ref={root} className={cn(styles.site, className)}>
      <svg ref={svg} className={styles.art} viewBox="0 0 1200 280" aria-hidden="true" focusable="false">
        {/* Scope: the plan on the ground and the stakes at its corners, a surveyor's tripod beside it. */}
        <path className={styles.plan} pathLength={1}
          d={`M${X0} ${GROUND}V${floorTop(FLOORS - 1)}H${X1}V${GROUND}M${X0} ${floorTop(3)}H${X1}M${X0 - 10} ${GROUND}H${X1 + 10}`} />
        <g className={styles.stakes}>
          {[X0 - 8, X1 + 8].map((x) => <path key={x} d={`M${x} ${GROUND}V${GROUND - 22}l10 4-10 4`} />)}
          <path d="M360 250L372 214L384 250M372 214V250M366 208h12v6h-12Z" />
        </g>

        {/* Build: the floors, the crane over them. */}
        <g className={styles.floors}>{Array.from({ length: FLOORS }, (_, k) => <Floor key={k} k={k} />)}</g>
        <g className={styles.flag}>
          <path className={styles.pole} d={`M${X1 - 22} ${floorTop(FLOORS - 1)}V${floorTop(FLOORS - 1) - 34}`} />
          <path className={styles.cloth} d={`M${X1 - 22} ${floorTop(FLOORS - 1) - 34}h26v16h-26Z`} />
        </g>
        <g className={styles.crane}>
          <path d={`M856 ${GROUND}V${JIB_Y}M868 ${GROUND}V${JIB_Y}` + Array.from({ length: 18 }, (_, i) => `M856 ${GROUND - i * 12}L868 ${GROUND - (i + 1) * 12}`).join("")} />
          <path d={`M380 ${JIB_Y}H952M392 ${JIB_Y + 6}H856M380 ${JIB_Y}L392 ${JIB_Y + 6}M862 ${JIB_Y}V${JIB_Y - 22}L520 ${JIB_Y}M862 ${JIB_Y - 22}L952 ${JIB_Y}`} />
          <path d={`M920 ${JIB_Y}v14h28v-14M868 ${JIB_Y + 4}h16v14h-16Z`} />
          <g className={styles.trolley}><path d={`M${TROLLEY_REST - 8} ${JIB_Y + 6}h16v6h-16Z`} /></g>
          <line className={styles.cable} x1={TROLLEY_REST} y1={JIB_Y + 12} x2={TROLLEY_REST} y2={46} />
          <rect className={styles.load} x={600 - 124} y={46} width={248} height={7} rx={1} />
        </g>

        {/* The site's ground, its fence and the hut. */}
        <path className={styles.ground} d="M0 250H1200" />
        <path className={styles.fence} d={"M300 250V236H440M760 236H1000V250" + Array.from({ length: 13 }, (_, i) => `M${300 + i * 20} 250V236`).join("") + Array.from({ length: 13 }, (_, i) => `M${760 + i * 20} 250V236`).join("")} />
        <path className={styles.hut} d="M1030 250V214H1110V250M1030 214H1110M1044 224h22v12h-22ZM1084 250V226h16V250" />
      </svg>
      <ol className={styles.stops}>
        {phases.map(([name, title, body], i) => (
          <li key={name} data-i={i + 1}>
            <i aria-hidden="true" />
            <span className={styles.ph}>
              Phase {i + 1} · {name}
              <small className={styles.state} aria-hidden="true"><em data-s="done">Done</em><em data-s="now">Now</em><em data-s="next">Next</em></small>
            </span>
            <h3>{title}</h3>
            <p>{body}</p>
          </li>
        ))}
      </ol>
    </div>
  );
}
