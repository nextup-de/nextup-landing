"use client";
// A stretch of Berlin between two sections, drawn in line. Each strip is a different part of the city, chosen for
// the section it leads into: the Oberbaumbrücke with a U-Bahn on it after the tower at Warschauer Strasse, the
// Alexanderplatz before every idea in the plant, Museum Island before the five steps, the government quarter
// before the rules, industrial Berlin before the pilot, and the whole skyline at the end of the line.
// The lines draw themselves in when the strip comes into view; a train crosses its viaduct or bridge with the
// scroll (the terminus train pulls in and stops at the buffer). Decorative: hidden from assistive technology.
// Reduced motion: drawn complete, the train stands still.
import { useEffect, useRef } from "react";
import {
  AEG, CHIMNEY, DOM, FERNSEHTURM, GASOMETER, GLASS_TOWER, MOLECULE_MAN, RATHAUS, REICHSTAG, SIEGESSAULE, TOR,
  crane, oberbaum, plattenbau, viaduct, type Mark,
} from "./landmarks";
import { clamp01, onFrame, passage, useReducedMotion } from "./motion";
import { cn } from "@/lib/utils/cn";
import styles from "./SkylineStrip.module.css";

const W = 1440, H = 220, G = 200;

type Spot = { m: Mark; x?: number; y?: number; s?: number; far?: boolean; front?: boolean };
type Scene = { places: Spot[]; water?: [number, number]; ground?: Array<[number, number]>; track?: number; rest: number; arrive?: boolean };

const ALTES_MUSEUM: Mark = {
  sil: "M-110 0V-36H-30V-44H30V-36H110V0Z",
  lines: [
    "M-114 0H114M-112-4H112",
    Array.from({ length: 18 }, (_, i) => `M${-102 + i * 12}-4V-30`).join(""),
    "M-110-30H110V-36H-110Z",
    "M-30-36V-44H30V-36",
  ],
};

const STATION_ROOF: Mark = {
  sil: "M0 96H250V101H0Z",
  lines: ["M0 96H250M0 101H244L250 96M30 101V118M110 101V118M190 101V118"],
};

/** East of the bridge the U-Bahn runs on, on slender steel posts. */
const STEEL_DECK: Mark = {
  sil: "M1110 116H1440V126H1110Z",
  lines: ["M1110 120H1440M1110 124H1440M1372 124V200M1380 124V200M1372 140H1380"],
};

/** A row of park trees: trunk and round crown. */
function trees(xs: number[]): Mark {
  return {
    sil: xs.map((x, i) => { const k = 7 + (i % 3) * 2; return `M${x - k} ${G - 10 - k}A${k} ${k} 0 1 0 ${x + k} ${G - 10 - k}A${k} ${k} 0 1 0 ${x - k} ${G - 10 - k}Z`; }).join(""),
    lines: [xs.map((x, i) => { const k = 7 + (i % 3) * 2; return `M${x} ${G}V${G - 10}M${x - k} ${G - 10 - k}A${k} ${k} 0 1 0 ${x + k} ${G - 10 - k}A${k} ${k} 0 1 0 ${x - k} ${G - 10 - k}`; }).join("")],
  };
}

/** A concrete frame going up: slabs and columns, the top floor still open. */
const FRAME: Mark = {
  sil: "M-70 0V-90H70V0Z",
  lines: [
    "M-70 0V-90M70 0V-75M-42 0V-90M-14 0V-90M14 0V-90M42 0V-75",
    "M-74-15H74M-74-30H74M-74-45H74M-74-60H74M-74-75H74M-74-90H14",
    "M-78 0V-80M-78-20H-70M-78-40H-70M-78-60H-70",
  ],
};

const BUFFER: Mark = {
  sil: "M1384 200V182H1398V200Z",
  lines: ["M1384 200V182H1398V200M1380 188H1402M1391 182V176"],
  gold: ["M1388 172.5A3 3 0 1 0 1394 172.5A3 3 0 1 0 1388 172.5Z"],
};

const RAILS: Mark = {
  lines: ["M0 200H1388" + Array.from({ length: 58 }, (_, i) => `M${8 + i * 24} 200v4`).join("")],
};

const SCENES = {
  // After the tower: Warschauer Strasse's platform roof, the glass tower, the U-Bahn over the Oberbaumbrücke,
  // the Fernsehturm far down the river and the Molecule Man standing in the Spree.
  bridge: {
    places: [
      { m: FERNSEHTURM, x: 540, y: G - 30, s: 0.85, far: true },
      { m: GLASS_TOWER, x: 112 },
      { m: viaduct(0, 320, 124, G, 64) },
      { m: STATION_ROOF },
      { m: STEEL_DECK },
      { m: oberbaum(330, 1110, G, 146, 120) },
      { m: MOLECULE_MAN, x: 1252, y: 210, s: 1.3 },
    ],
    ground: [[0, 320]], water: [320, 1440], track: 120, rest: 640,
  },
  // Alexanderplatz: the Fernsehturm over the Rotes Rathaus and the slab blocks, a few windows lit, the city
  // railway's viaduct in front.
  alex: {
    places: [
      { m: plattenbau(110, 15, [[2, 9], [6, 4]]), x: 160 },
      { m: plattenbau(150, 10, [[4, 6], [9, 3], [11, 8]]), x: 330 },
      { m: RATHAUS, x: 520, s: 1.25, front: true },
      { m: FERNSEHTURM, x: 724, s: 0.92 },
      { m: plattenbau(200, 11, [[3, 7], [12, 4]]), x: 1000 },
      { m: plattenbau(120, 17, [[5, 12], [2, 5], [8, 14]]), x: 1212 },
      { m: plattenbau(110, 9, [[4, 3]]), x: 1366 },
      { m: viaduct(-24, 1464, 172, G, 44) },
    ],
    track: 168, rest: 820,
  },
  // Museum Island: the Altes Museum's columns, the Berliner Dom, the Fernsehturm behind, the viaduct by the Spree.
  museum: {
    places: [
      { m: FERNSEHTURM, x: 1080, s: 0.8, far: true },
      { m: ALTES_MUSEUM, x: 400, s: 1.3, front: true },
      { m: DOM, x: 760, s: 1.75 },
      { m: trees([180, 214, 250, 1150, 1186, 1226, 1262, 1300]), front: true },
      { m: viaduct(-40, 1480, 172, G, 56) },
    ],
    water: [0, 1440], track: 168, rest: 300,
  },
  // The government quarter: the Siegessäule over the Tiergarten, the Reichstag, the Brandenburger Tor.
  government: {
    places: [
      { m: SIEGESSAULE, x: 250, s: 1.5 },
      { m: REICHSTAG, x: 620, s: 2.15 },
      { m: TOR, x: 1010, s: 1.9 },
      { m: trees([70, 104, 150, 330, 372, 1180, 1226, 1290, 1340, 1396]), front: true },
    ],
    ground: [[0, W]], rest: 0,
  },
  // Industrial Berlin: Behrens' turbine hall, a works chimney, the gasometer, a crane over a new frame, the ring
  // railway in front.
  works: {
    places: [
      { m: CHIMNEY, x: 560, s: 1.35 },
      { m: GASOMETER, x: 720, s: 1.6 },
      { m: crane(168, 190, 140, 70), x: 930 },
      { m: FRAME, x: 1090, s: 1.25 },
      { m: AEG, x: 190, s: 1.75, front: true },
      { m: plattenbau(110, 6, [[3, 2]]), x: 1300 },
      { m: viaduct(-48, 1488, 172, G, 64) },
    ],
    track: 168, rest: 980,
  },
  // The end of the line: the whole skyline, the track running into its buffer stop.
  terminus: {
    places: [
      { m: SIEGESSAULE, x: 110 },
      { m: TOR, x: 284, s: 1.2 },
      { m: REICHSTAG, x: 480, s: 1.15 },
      { m: FERNSEHTURM, x: 690, s: 0.95 },
      { m: DOM, x: 880, s: 1.1 },
      { m: RATHAUS, x: 1050, s: 0.95 },
      { m: GLASS_TOWER, x: 1236, s: 0.82 },
      { m: RAILS },
      { m: BUFFER },
    ],
    track: G, rest: 1226, arrive: true,
  },
} satisfies Record<string, Scene>;

export type Stretch = keyof typeof SCENES;

function water(a: number, b: number): string {
  let d = "";
  for (let row = 0; row < 3; row++) {
    const y = G + 5 + row * 5;
    for (let x = a + ((row * 37) % 50); x < b - 20; x += 64 + ((x * 7 + row * 13) % 40)) d += `M${x} ${y}h${18 + ((x + row * 11) % 22)}`;
  }
  return d;
}

function Place({ p, i }: { p: Spot; i: number }) {
  const sc = p.s ?? 1;
  return (
    <g className={p.far ? styles.far : undefined}
      transform={p.x === undefined ? undefined : `translate(${p.x} ${p.y ?? G}) scale(${sc})`}
      style={{ "--s": sc, "--i": i } as React.CSSProperties}>
      {p.m.sil && <path className={styles.sil} d={p.m.sil} />}
      {p.m.lines.map((d, k) => <path key={k} className={styles.ln} pathLength={1} d={d} style={{ "--k": k } as React.CSSProperties} />)}
      {p.m.gold?.map((d, k) => <path key={`o${k}`} className={styles.gold} d={d} />)}
    </g>
  );
}

function Train() {
  const car = (x: number, nose: boolean) => (
    <g>
      <path className={styles.car} d={nose
        ? `M${x} -2H${x + 62}L${x + 72} -9V-14Q${x + 71} -20 ${x + 64} -20H${x + 3}Q${x} -20 ${x} -17Z`
        : `M${x} -2H${x + 72}V-17Q${x + 72} -20 ${x + 69} -20H${x + 3}Q${x} -20 ${x} -17Z`} />
      <path className={styles.win} d={[6, 19, 32, 45, 58].map((w) => `M${x + w} -16h${nose && w === 58 ? 6 : 8}v5h-${nose && w === 58 ? 6 : 8}Z`).join("")} />
      <path className={styles.car} d={`M${x + 2} -7H${x + (nose ? 66 : 70)}`} />
      <path className={styles.car} d={`M${x + 12} 0a1.8 1.8 0 1 0 0.1 0M${x + 22} 0a1.8 1.8 0 1 0 0.1 0M${x + 50} 0a1.8 1.8 0 1 0 0.1 0M${x + 60} 0a1.8 1.8 0 1 0 0.1 0`} />
    </g>
  );
  return (
    <>
      {car(0, false)}
      {car(76, true)}
      <circle className={styles.glow} cx="146" cy="-7" r="9" />
      <circle className={styles.lamp} cx="146" cy="-7" r="2" />
    </>
  );
}

/**
 * stretch  which part of Berlin: bridge | alex | museum | government | works | terminus
 * ground   the ground of the section it leads into ("main" #fbfcfd or "alt" #f0f5f9); the strip wears it
 * at       "between" (default) reaches into the next section's top padding; "close" stands on its own, transparent
 */
export function SkylineStrip({ stretch, ground = "main", at = "between" }: { stretch: Stretch; ground?: "main" | "alt"; at?: "between" | "close" }) {
  const s: Scene = SCENES[stretch];
  const root = useRef<HTMLDivElement>(null);
  const train = useRef<SVGGElement>(null);
  const reduced = useReducedMotion();

  useEffect(() => {
    const el = root.current;
    if (!el || reduced) return;
    el.dataset.armed = "";
    let stop: (() => void) | null = null;
    const draw = new IntersectionObserver(([e]) => {
      if (e.isIntersecting) { el.dataset.drawn = ""; draw.disconnect(); }
    }, { threshold: 0.25 });
    draw.observe(el);
    // The train only listens to the scroll while its strip is near the screen.
    const near = new IntersectionObserver(([e]) => {
      if (e.isIntersecting && !stop && s.track !== undefined) {
        stop = onFrame(() => {
          const r = el.getBoundingClientRect();
          const vh = window.innerHeight;
          let x: number;
          if (s.arrive) {
            const p = clamp01((vh - r.top) / (vh * 0.55));
            x = -170 + (1 - (1 - p) ** 3) * (s.rest + 170);
          } else {
            x = -170 + passage(r, vh) * (W + 340);
          }
          return () => { if (train.current) train.current.style.transform = `translate(${x.toFixed(1)}px, 0)`; };
        });
      } else if (!e.isIntersecting && stop) { stop(); stop = null; }
    }, { rootMargin: "25% 0px" });
    near.observe(el);
    return () => { draw.disconnect(); near.disconnect(); stop?.(); delete el.dataset.armed; };
  }, [reduced, s]);

  return (
    <div ref={root} className={cn(styles.strip, at === "close" && styles.close)} data-ground={ground} aria-hidden="true">
      <svg viewBox={`0 0 ${W} ${H}`} preserveAspectRatio="xMidYMax slice" focusable="false">
        {s.ground?.map(([a, b]) => <path key={`g${a}`} className={styles.ln} pathLength={1} d={`M${a} ${G}H${b}`} />)}
        {s.water && <path className={styles.water} d={water(s.water[0], s.water[1])} />}
        {s.places.map((p, i) => !p.front && <Place key={i} p={p} i={i} />)}
        {s.track !== undefined && (
          <g transform={`translate(0 ${s.track})`}>
            <g ref={train} className={styles.train} style={{ transform: `translate(${reduced || s.arrive ? s.rest : -170}px, 0)` }}>
              <Train />
            </g>
          </g>
        )}
        {s.places.map((p, i) => p.front && <Place key={i} p={p} i={i} />)}
      </svg>
    </div>
  );
}
