"use client";
// The turn, beat 1: one owner. The demo company's routing map (features/demo/routes ROUTES) drawn as a night
// transit network: one interchange where requests are raised, eight lines R1 to R8 (one per kind of request) in
// 45-degree geometry, three termini (one per owner role) each with a smaller deputy platform under it.
//   draw     when the figure is 30% in view the lines draw in once, one after another, the labels last
//   ride     a gold token rides the chosen example's line with the scroll (motion.ts onFrame); every path is
//            sampled once into 64 points from its own geometry, so a frame writes one transform and nothing else
//   arrive   the other lines dim, the terminus lights and pulses twice, and the owner's card opens
//   chips    the three examples of the tower's story (features/tower/story EXAMPLES, routed by the product's own
//            matcher) switch the line, by click only; after the arrival the token rides the new line by itself
// Text equivalents: the polite live region names the proposed owner, the numbered legend lists every line.
// Reduced motion or no script: every line drawn, the token on its terminus, the card open (the server markup).
// Below 760px the tall layout: the interchange on top, lines running down, the termini side by side at the foot,
// and the line labels move into the legend.
import { useEffect, useRef, useState } from "react";
import { Avatar, Clock, Pill } from "@/components/product/elements";
import { SITE } from "@/config/site";
import { ROUTES, type Route } from "@/features/demo/routes";
import { EXAMPLES } from "@/features/tower/story";
import { cn } from "@/lib/utils/cn";
import { clamp01, onFrame, useReducedMotion } from "./motion";
import { Turn } from "./Turn";
import styles from "./RoutingNetwork.module.css";

const P = SITE.promiseDays;

// Short names for the map's rows, as a line carries them. Keyed by ROUTES id; keep in step with routes.ts.
const SHORT: Record<string, string> = {
  r1: "Spend under €5k", r2: "Test-rig time", r3: "Quality data", r4: "Logins and IT",
  r5: "Changes in the field", r6: "Shifts and staffing", r7: "Fixtures and layout", r8: "Paperwork done twice",
};
// The product's own tones, brightened for the night ground. Not a transit operator's colours.
const COLOURS = ["#3fc1c9", "#5b9dff", "#f07fb3", "#b08cf2", "#f2a65a", "#62d394", "#ff8a7a", "#9ad8f5"];

type Pt = [number, number];
type Geo = {
  w: number; h: number; tall: boolean;
  hubU: number; hubV: number;  // the interchange, in flow coordinates (u along the lines, v across)
  s: number;                   // line spacing
  bend: number;                // where the bundles turn off at 45 degrees
  termU: number;               // the termini
  groupV: number[];            // each terminus across the flow
  labelU: number;              // where the line labels stand (wide only)
  r: number;                   // corner radius
};
const WIDE: Geo = { w: 1200, h: 480, tall: false, hubU: 112, hubV: 240, s: 18, bend: 236, termU: 860, groupV: [80, 240, 400], labelU: 520, r: 22 };
const TALL: Geo = { w: 360, h: 660, tall: true, hubU: 92, hubV: 180, s: 12, bend: 160, termU: 500, groupV: [62, 180, 298], labelU: 0, r: 16 };

// The roles in the order the map names them, and the lines grouped by role: that is the order at the interchange.
const ROLES = [...new Set(ROUTES.map((r) => r.owner.role))];
type Line = { route: Route; i: number; g: number; k: number; n: number; colour: string; no: number };
const LINES: Line[] = ROLES.flatMap((role, g) => {
  const rows = ROUTES.filter((r) => r.owner.role === role);
  return rows.map((route, k) => ({ route, g, k, n: rows.length, i: 0, colour: COLOURS[ROUTES.indexOf(route) % COLOURS.length], no: ROUTES.indexOf(route) + 1 }));
}).map((l, i) => ({ ...l, i }));

const round = (n: number) => Math.round(n * 10) / 10;

/** A polyline moved sideways by `o` (miter joins), in flow coordinates. */
function offset(pts: Pt[], o: number): Pt[] {
  const nrm = (a: Pt, b: Pt): Pt => { const dx = b[0] - a[0], dy = b[1] - a[1], l = Math.hypot(dx, dy) || 1; return [-dy / l, dx / l]; };
  return pts.map((p, i) => {
    if (i === 0) { const m = nrm(p, pts[1]); return [p[0] + o * m[0], p[1] + o * m[1]]; }
    if (i === pts.length - 1) { const m = nrm(pts[i - 1], p); return [p[0] + o * m[0], p[1] + o * m[1]]; }
    const a = nrm(pts[i - 1], p), b = nrm(p, pts[i + 1]);
    const k = o / (1 + a[0] * b[0] + a[1] * b[1]);
    return [p[0] + (a[0] + b[0]) * k, p[1] + (a[1] + b[1]) * k];
  });
}

type Shape = { d: string; samples: Pt[]; end: Pt; label: Pt };

/** One line's path (rounded corners) and 64 points spaced evenly along it, from the same geometry. */
function shape(geo: Geo, line: Line): Shape {
  const xy = (p: Pt): Pt => (geo.tall ? [p[1], p[0]] : [p[0], p[1]]);
  const N = LINES.length;
  const hubOf = (i: number) => geo.hubV + (i - (N - 1) / 2) * geo.s;
  const members = LINES.filter((l) => l.g === line.g);
  const hubC = members.reduce((n, l) => n + hubOf(l.i), 0) / members.length;
  const target = geo.groupV[line.g];
  const dv = target - hubC;
  const centre: Pt[] = Math.abs(dv) < 0.5
    ? [[geo.hubU, hubC], [geo.termU, target]]
    : [[geo.hubU, hubC], [geo.bend, hubC], [geo.bend + Math.abs(dv), target], [geo.termU, target]];
  const o = hubOf(line.i) - hubC;
  const pts = offset(centre, o).map(xy);

  // Path and dense points: straight runs, and a quadratic curve at every corner.
  let d = `M${round(pts[0][0])} ${round(pts[0][1])}`;
  const dense: Pt[] = [pts[0]];
  for (let i = 1; i < pts.length - 1; i++) {
    const [a, q, b] = [pts[i - 1], pts[i], pts[i + 1]];
    const la = Math.hypot(q[0] - a[0], q[1] - a[1]), lb = Math.hypot(b[0] - q[0], b[1] - q[1]);
    const r = Math.min(geo.r, la / 2, lb / 2);
    const s0: Pt = [q[0] - ((q[0] - a[0]) / la) * r, q[1] - ((q[1] - a[1]) / la) * r];
    const s1: Pt = [q[0] + ((b[0] - q[0]) / lb) * r, q[1] + ((b[1] - q[1]) / lb) * r];
    d += `L${round(s0[0])} ${round(s0[1])}Q${round(q[0])} ${round(q[1])} ${round(s1[0])} ${round(s1[1])}`;
    dense.push(s0);
    for (let k = 1; k <= 10; k++) {
      const t = k / 10, m = 1 - t;
      dense.push([m * m * s0[0] + 2 * m * t * q[0] + t * t * s1[0], m * m * s0[1] + 2 * m * t * q[1] + t * t * s1[1]]);
    }
  }
  const end = pts[pts.length - 1];
  d += `L${round(end[0])} ${round(end[1])}`;
  dense.push(end);

  const acc = [0];
  for (let i = 1; i < dense.length; i++) acc.push(acc[i - 1] + Math.hypot(dense[i][0] - dense[i - 1][0], dense[i][1] - dense[i - 1][1]));
  const total = acc[acc.length - 1];
  const samples: Pt[] = [];
  let j = 1;
  for (let k = 0; k < 64; k++) {
    const want = (k / 63) * total;
    while (j < dense.length - 1 && acc[j] < want) j++;
    const span = acc[j] - acc[j - 1] || 1;
    const t = clamp01((want - acc[j - 1]) / span);
    samples.push([dense[j - 1][0] + (dense[j][0] - dense[j - 1][0]) * t, dense[j - 1][1] + (dense[j][1] - dense[j - 1][1]) * t]);
  }
  return { d, samples, end, label: xy([geo.labelU, target + o]) };
}

const SHAPES = { wide: LINES.map((l) => shape(WIDE, l)), tall: LINES.map((l) => shape(TALL, l)) };

/** Where along the 64 samples `t` (0..1) is. */
function pointAt(samples: Pt[], t: number): Pt {
  const f = clamp01(t) * (samples.length - 1);
  const i = Math.min(samples.length - 2, Math.floor(f));
  const k = f - i;
  return [samples[i][0] + (samples[i + 1][0] - samples[i][0]) * k, samples[i][1] + (samples[i + 1][1] - samples[i][1]) * k];
}

const smooth = (t: number) => t * t * (3 - 2 * t);

// Which line each example rides: the map row the product's matcher chose for it.
const LINE_OF = EXAMPLES.map((ex) => Math.max(0, LINES.findIndex((l) => l.route.type === ex.type)));

function Net({ geo, active, deputy }: { geo: Geo; active: number; deputy: string }) {
  const layout = geo.tall ? "tall" : "wide";
  const shapes = SHAPES[layout];
  const xy = (u: number, v: number): Pt => (geo.tall ? [v, u] : [u, v]);
  const N = LINES.length;
  const half = ((N - 1) / 2) * geo.s + 14;
  const [hx, hy] = xy(geo.hubU, geo.hubV);
  const on = LINES[active];
  const end = shapes[active].end;

  return (
    <svg className={cn(styles.svg, geo.tall ? styles.tall : styles.wide)} viewBox={`0 0 ${geo.w} ${geo.h}`} aria-hidden="true" focusable="false">
      {/* The lines, each with its bullet and short name on the wide map. */}
      {LINES.map((l, i) => {
        const s = shapes[i];
        const text = SHORT[l.route.id] ?? l.route.type;
        const tw = text.length * 6.9 + 6;
        return (
          <g key={l.route.id} className={styles.line} data-on={i === active || undefined} style={{ "--c": l.colour, "--i": i } as React.CSSProperties}>
            <path className={styles.path} d={s.d} pathLength={1} />
            {!geo.tall && (
              <g className={styles.late} transform={`translate(${round(s.label[0])} ${round(s.label[1])})`}>
                <rect className={styles.ko} x={-6} y={-9} width={44 + tw} height={18} />
                <rect className={styles.bullet} x={0} y={-8} width={30} height={16} rx={4} />
                <text className={styles.bulletText} x={15} y={3.6} textAnchor="middle">R{l.no}</text>
                <text className={styles.lab} x={38} y={4}>{text}</text>
              </g>
            )}
          </g>
        );
      })}

      {/* The termini: one bar per owner role, the role's name, and the deputy's smaller platform. */}
      {ROLES.map((role, g) => {
        const members = LINES.filter((l) => l.g === g);
        const v = geo.groupV[g];
        const reach = ((members.length - 1) / 2) * geo.s + 11;
        const lit = on?.g === g;
        const [w0, w1] = [v - reach, v + reach];
        if (!geo.tall) {
          const u = geo.termU;
          return (
            <g key={role} className={styles.term} data-on={lit || undefined}>
              <path className={styles.depLink} d={`M${u} ${w1}V${w1 + 16}`} />
              <rect className={styles.depBar} x={u - 5} y={w1 + 16} width={10} height={20} rx={4} />
              <rect className={styles.glow} x={u - 14} y={w0 - 8} width={28} height={w1 - w0 + 16} rx={14} />
              <rect className={styles.bar} x={u - 7} y={w0} width={14} height={w1 - w0} rx={7} />
              <g className={styles.late}>
                <text className={styles.kind} x={u + 30} y={v - 12}>OWNER</text>
                <text className={styles.role} x={u + 30} y={v + 9}>{role}</text>
                <text className={styles.dep} x={u + 18} y={w1 + 30}>Deputy{lit ? ` · ${deputy}` : ""}</text>
              </g>
            </g>
          );
        }
        const u = geo.termU;
        const words = role.split(/,?\s+/);
        const lines = words.length > 1 ? [words.slice(0, -1).join(" "), words[words.length - 1]] : [role];
        if (role.includes(",")) lines[0] += ",";
        return (
          <g key={role} className={styles.term} data-on={lit || undefined}>
            <rect className={styles.glow} x={w0 - 8} y={u - 14} width={w1 - w0 + 16} height={28} rx={14} />
            <rect className={styles.bar} x={w0} y={u - 7} width={w1 - w0} height={14} rx={7} />
            <g className={styles.late}>
              {lines.map((t, k) => <text key={k} className={styles.roleS} x={v} y={u + 32 + k * 17} textAnchor="middle">{t}</text>)}
              <path className={styles.depLink} d={`M${v} ${u + 7}V${u + 16}M${v} ${u + 56}V${u + 70}`} />
              <rect className={styles.depBar} x={v - 14} y={u + 70} width={28} height={8} rx={4} />
              <text className={styles.dep} x={v} y={u + 96} textAnchor="middle">Deputy</text>
              {lit && <text className={styles.depName} x={v} y={u + 112} textAnchor="middle">{deputy}</text>}
            </g>
          </g>
        );
      })}

      {/* The interchange where every request is raised: a white ring across the bundle, one dot per line. */}
      <g className={styles.hub}>
        <rect
          x={geo.tall ? hx - half : hx - 16} y={geo.tall ? hy - 16 : hy - half}
          width={geo.tall ? half * 2 : 32} height={geo.tall ? 32 : half * 2} rx={16}
        />
        {LINES.map((l) => {
          const [x, y] = xy(geo.hubU, geo.hubV + (l.i - (N - 1) / 2) * geo.s);
          return <circle key={l.route.id} cx={x} cy={y} r={geo.tall ? 2.6 : 3.2} />;
        })}
      </g>
      <text className={styles.hubLabel} x={hx} y={geo.tall ? hy - 30 : hy - half - 16} textAnchor="middle">RAISED ON THE FLOOR</text>

      {/* The terminus pulses when the token arrives; the token itself is placed by the script. */}
      <circle className={styles.pulse} cx={end[0]} cy={end[1]} r={14} />
      <g className={styles.token} data-token={layout} transform={`translate(${round(end[0])} ${round(end[1])})`}>
        <circle className={styles.halo} r={geo.tall ? 13 : 17} />
        <circle className={styles.disc} r={geo.tall ? 7 : 9} />
        <circle className={styles.core} r={geo.tall ? 2.4 : 3} />
      </g>
    </svg>
  );
}

/** The network figure with its chips, the owner's card, the live region and the legend. */
export function RoutingNetwork() {
  const [ex, setEx] = useState(0);
  const reduced = useReducedMotion();
  const root = useRef<HTMLDivElement>(null);
  const ctl = useRef<{ line: (i: number) => void } | null>(null);
  const example = EXAMPLES[ex];
  const active = LINE_OF[ex] ?? 0;

  useEffect(() => {
    const el = root.current;
    if (!el || reduced) return;
    el.dataset.armed = "";
    delete el.dataset.arrived;
    const tokens = Array.from(el.querySelectorAll<SVGGElement>("[data-token]"));
    let line = LINE_OF[ex] ?? 0;
    let scrollT = 0;
    let arrived = false;
    let ride: number | null = null; // when a click ride started
    let raf = 0;

    const place = (t: number) => {
      for (const tk of tokens) {
        const shapes = SHAPES[tk.dataset.token === "tall" ? "tall" : "wide"];
        const [x, y] = pointAt(shapes[line].samples, t);
        tk.style.transform = `translate(${x.toFixed(1)}px, ${y.toFixed(1)}px)`;
      }
      const now = t >= 0.985;
      if (now !== arrived) {
        arrived = now;
        if (now) el.dataset.arrived = ""; else delete el.dataset.arrived;
      }
    };
    const apply = () => {
      let t = smooth(scrollT);
      if (ride !== null) {
        const k = clamp01((performance.now() - ride) / 1300);
        t = Math.min(t, smooth(k));
        if (k >= 1) ride = null;
      }
      place(t);
    };
    const loop = () => { raf = 0; apply(); if (ride !== null) raf = requestAnimationFrame(loop); };

    ctl.current = {
      line: (i) => {
        if (i === line) return;
        line = i;
        if (scrollT >= 1) { ride = performance.now(); if (!raf) raf = requestAnimationFrame(loop); } else apply();
      },
    };

    const draw = new IntersectionObserver(([e]) => {
      if (e.isIntersecting) { el.dataset.drawn = ""; draw.disconnect(); }
    }, { threshold: 0.3 });
    draw.observe(el);

    // The token follows the scroll only while the figure is near the screen.
    let stop: (() => void) | null = null;
    const near = new IntersectionObserver(([e]) => {
      if (e.isIntersecting && !stop) {
        stop = onFrame(() => {
          const r = el.getBoundingClientRect();
          const vh = window.innerHeight;
          const t = clamp01((vh * 0.85 - r.top) / (vh * 0.25 + r.height * 0.38));
          return () => { scrollT = t; if (ride === null) apply(); };
        });
      } else if (!e.isIntersecting && stop) { stop(); stop = null; }
    }, { rootMargin: "25% 0px" });
    near.observe(el);

    return () => {
      draw.disconnect(); near.disconnect(); stop?.();
      if (raf) cancelAnimationFrame(raf);
      ctl.current = null;
      for (const tk of tokens) tk.style.transform = "";
      delete el.dataset.armed; delete el.dataset.drawn; el.dataset.arrived = "";
    };
    // The example is read once on arming; later switches go through ctl.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [reduced]);

  useEffect(() => { ctl.current?.line(active); }, [active]);

  const owner = example?.owner;
  const deputy = example?.deputy.name ?? "";
  return (
    <div ref={root} className={styles.fig} data-arrived="">
      <div className={styles.stage} role="img" aria-label="The demo company's routing map: eight kinds of request, each on its own line to one of three owner roles, each role with a deputy.">
        <Net geo={WIDE} active={active} deputy={deputy} />
        <Net geo={TALL} active={active} deputy={deputy} />
      </div>

      <ol className={styles.legend}>
        {LINES.map((l) => (
          <li key={l.route.id} style={{ "--c": l.colour } as React.CSSProperties}>
            <b aria-hidden="true">R{l.no}</b>
            <span>{SHORT[l.route.id] ?? l.route.type}</span>
            <small>→ {l.route.owner.role}</small>
          </li>
        ))}
      </ol>

      <div className={styles.row}>
        <div className={styles.send}>
          <p className={styles.sendLabel} id="owner-send">Send one through:</p>
          <div className={styles.chips} role="group" aria-labelledby="owner-send">
            {EXAMPLES.map((e, i) => (
              <button key={e.id} type="button" className={styles.chip} aria-pressed={i === ex} onClick={() => setEx(i)}>
                <i aria-hidden="true" style={{ "--c": LINES[LINE_OF[i] ?? 0]?.colour } as React.CSSProperties}>R{LINES[LINE_OF[i] ?? 0]?.no}</i>
                {e.short}
              </button>
            ))}
          </div>
        </div>

        {owner && (
          <div className={styles.card} aria-hidden="true">
            <p className={styles.cardKind}><i />Terminus · R{LINES[active]?.no} {SHORT[LINES[active]?.route.id ?? ""] ?? example.type}</p>
            <div className={styles.cardOwner}>
              <Avatar name={owner.name} size={44} />
              <span><strong>{owner.name}</strong><small>{owner.role}</small></span>
            </div>
            <div className={styles.cardFoot}>
              <Pill status="clock"><Clock size={11} />Due in {P} working days</Pill>
              <span className={styles.cardDep}><Avatar name={deputy} size={22} />Deputy: {deputy}</span>
            </div>
          </div>
        )}
      </div>

      <p className="nh-sr" aria-live="polite">
        {owner ? `Proposed owner: ${owner.name}, ${owner.role}. Deputy: ${deputy}.` : ""}
      </p>
    </div>
  );
}

/** The section #owner: the turn's first beat, on the night ground. */
export function OwnerBeat() {
  return (
    <section className={cn("section", styles.owner)} id="owner" data-ground="night" aria-labelledby="owner-h">
      <div className="wrap">
        <div className={styles.head}>
          <div className={styles.headTitle}>
            <Turn at={1} dark />
            <h2 id="owner-h" className={styles.title}>One owner.</h2>
          </div>
          <div className={styles.copy}>
            <p>NextUp reads the request against your routing map and names the role that decides it, with a deputy. A role, not a name, so it holds through holidays and job changes.</p>
            <p>The map is one table: which kind of request goes to which role, and who stands in. We build it with your people in the pilot. The owner confirms the route or hands it on.</p>
          </div>
        </div>
        <RoutingNetwork />
        <p className={styles.caption}>The demo company&rsquo;s map: eight kinds of request, three roles, each with a deputy. Fictional people.</p>
      </div>
    </section>
  );
}
