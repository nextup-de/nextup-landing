"use client";
// What a pilot builds, as one picture: the plant's own org chart, routing and rules go into NextUp, and every idea
// comes out on the desk of the department that owns it. Pulses run along the lines (one 3.2 s cycle); the disc
// pauses them, and with reduced motion they rest. Positions are data: the same numbers draw the lines and place
// the labels, so the picture keeps its shape at every width.
import { useEffect, useRef, useState, useSyncExternalStore } from "react";
import { Avatar } from "@/components/product/elements";
import { cn } from "@/lib/utils/cn";
import styles from "./PilotDiagram.module.css";

const W = 700, H = 460;
const HUB: [number, number] = [360, 230];
const INPUTS: Array<[string, string, number]> = [["Your org chart", "org", 110], ["Your routing map", "map", 230], ["Your rules", "rules", 350]];
const OWNERS: Array<[string, string, number]> = [["Production", "T. Vogel", 80], ["Quality", "H. Sander", 180], ["Engineering", "M. Roth", 280], ["Logistics", "N. Demir", 380]];
const IN_X = 205, OUT_X = 512;
const REDUCED = "(prefers-reduced-motion: reduce)";

const curve = (a: [number, number], b: [number, number]) => {
  const mx = (a[0] + b[0]) / 2;
  return `M${a[0]} ${a[1]} C${mx} ${a[1]} ${mx} ${b[1]} ${b[0]} ${b[1]}`;
};
const IN_PATHS = INPUTS.map(([, , y]) => curve([IN_X, y], [HUB[0] - 54, HUB[1]]));
const OUT_PATHS = OWNERS.map(([, , y]) => curve([HUB[0] + 54, HUB[1]], [OUT_X, y]));

function Icon({ kind }: { kind: string }) {
  const d = kind === "org" ? "M12 4v4M6 14v-3h12v3M4 14h4v5H4zM10 14h4v5h-4zM16 14h4v5h-4zM9 3h6v5H9z"
    : kind === "map" ? "M4 6l5-2 6 2 5-2v14l-5 2-6-2-5 2zM9 4v14M15 6v14"
    : "M5 4h10l4 4v12H5zM14 4v5h5M8 13h8M8 17h5";
  return <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d={d} /></svg>;
}

const never = () => () => {};

export function PilotDiagram() {
  const svg = useRef<SVGSVGElement>(null);
  const [paused, setPaused] = useState(false);
  const reduced = useSyncExternalStore(never, () => window.matchMedia(REDUCED).matches, () => false);

  useEffect(() => {
    const el = svg.current;
    if (!el) return;
    if (paused || reduced) el.pauseAnimations(); else el.unpauseAnimations();
  }, [paused, reduced]);

  const at = (x: number, y: number) => ({ "--x": `${(x / W) * 100}%`, "--y": `${(y / H) * 100}%` }) as React.CSSProperties;

  return (
    <div className={cn("nh-lit", styles.frame)} role="img"
      aria-label="Your org chart, your routing map and your rules go into NextUp; every idea comes out on the desk of the department that owns it.">
      <div className={styles.box} aria-hidden="true">
        <svg ref={svg} className={styles.lines} viewBox={`0 0 ${W} ${H}`}>
          {[...IN_PATHS, ...OUT_PATHS].map((d, i) => <path key={i} id={`pilot-line-${i}`} d={d} />)}
          {[...IN_PATHS, ...OUT_PATHS].map((_, i) => (
            <circle key={i} r="4" className={i < IN_PATHS.length ? styles.pulseIn : styles.pulseOut}>
              <animateMotion dur="3.2s" repeatCount="indefinite" begin={`${(i % 4) * 0.8}s`} keyPoints="0;1" keyTimes="0;1" calcMode="linear">
                <mpath href={`#pilot-line-${i}`} />
              </animateMotion>
            </circle>
          ))}
        </svg>
        {INPUTS.map(([label, kind, y]) => (
          <span key={kind} className={styles.input} style={at(IN_X, y)}><i><Icon kind={kind} /></i>{label}</span>
        ))}
        <span className={styles.hub} style={at(HUB[0], HUB[1])}><b>NextUp</b><small>routes every idea</small></span>
        {OWNERS.map(([dept, name, y]) => (
          <span key={dept} className={styles.owner} style={at(OUT_X, y)}>
            <Avatar name={name} size={26} /><span><strong>{dept}</strong><small>{name}</small></span>
          </span>
        ))}
      </div>
      {!reduced && (
        <button type="button" className={cn("nh-pause", styles.pause)} onClick={() => setPaused((p) => !p)}
          aria-label={paused ? "Play the diagram" : "Pause the diagram"} aria-pressed={paused}>
          {paused
            ? <svg width="12" height="12" viewBox="0 0 12 12" aria-hidden="true"><path d="M3 1.8v8.4L10 6z" fill="currentColor" /></svg>
            : <svg width="12" height="12" viewBox="0 0 12 12" aria-hidden="true"><path d="M3 2h2v8H3zM7 2h2v8H7z" fill="currentColor" /></svg>}
        </button>
      )}
    </div>
  );
}
