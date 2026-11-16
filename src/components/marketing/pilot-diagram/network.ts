// The routing diagram as data: who raises ideas, who owns them, the four ideas that ride the loop, and two
// drawings of one transit network (wide: left to right; tall: top to bottom, for a phone). Lines are octilinear
// (flat, upright and 45 degrees) with rounded bends, as on a network map. Every line is kept as an SVG path and
// as a dense polyline, so the moving ideas can be placed by arc length without asking the DOM.
// No DOM here: pure numbers.

export type Pt = readonly [number, number];
export type Route = { d: string; pts: Pt[]; cum: number[]; len: number };

const f = (n: number) => Math.round(n * 10) / 10;

/** A polyline with every inner corner rounded by `r`: the path and its dense samples (by arc length). */
export function route(points: Pt[], r = 10): Route {
  let d = `M${f(points[0][0])} ${f(points[0][1])}`;
  const pts: Pt[] = [points[0]];
  for (let i = 1; i < points.length - 1; i++) {
    const [x0, y0] = points[i - 1], [x1, y1] = points[i], [x2, y2] = points[i + 1];
    const l1 = Math.hypot(x1 - x0, y1 - y0), l2 = Math.hypot(x2 - x1, y2 - y1);
    const k = Math.min(r, l1 / 2, l2 / 2);
    const a: Pt = [x1 - ((x1 - x0) / l1) * k, y1 - ((y1 - y0) / l1) * k];
    const b: Pt = [x1 + ((x2 - x1) / l2) * k, y1 + ((y2 - y1) / l2) * k];
    d += ` L${f(a[0])} ${f(a[1])} Q${f(x1)} ${f(y1)} ${f(b[0])} ${f(b[1])}`;
    pts.push(a);
    for (let s = 1; s <= 8; s++) {
      const t = s / 8, u = 1 - t;
      pts.push([u * u * a[0] + 2 * u * t * x1 + t * t * b[0], u * u * a[1] + 2 * u * t * y1 + t * t * b[1]]);
    }
  }
  const last = points[points.length - 1];
  d += ` L${f(last[0])} ${f(last[1])}`;
  pts.push(last);
  const cum = [0];
  for (let i = 1; i < pts.length; i++) cum.push(cum[i - 1] + Math.hypot(pts[i][0] - pts[i - 1][0], pts[i][1] - pts[i - 1][1]));
  return { d, pts, cum, len: cum[cum.length - 1] };
}

/** The point at fraction `p` (0..1) of the route's length. */
export function pointAt(rt: Route, p: number): Pt {
  const want = Math.max(0, Math.min(1, p)) * rt.len;
  let lo = 0, hi = rt.cum.length - 1;
  while (hi - lo > 1) {
    const mid = (lo + hi) >> 1;
    if (rt.cum[mid] < want) lo = mid; else hi = mid;
  }
  const span = rt.cum[hi] - rt.cum[lo] || 1;
  const t = (want - rt.cum[lo]) / span;
  return [rt.pts[lo][0] + (rt.pts[hi][0] - rt.pts[lo][0]) * t, rt.pts[lo][1] + (rt.pts[hi][1] - rt.pts[lo][1]) * t];
}

/** Flat, one 45-degree jog centred on `bendX`, flat again. */
const octiH = (a: Pt, b: Pt, bendX: number): Pt[] => {
  const h = Math.abs(b[1] - a[1]) / 2;
  return h === 0 ? [a, b] : [a, [bendX - h, a[1]], [bendX + h, b[1]], b];
};
/** Upright, one 45-degree jog centred on `bendY`, upright again. */
const octiV = (a: Pt, b: Pt, bendY: number): Pt[] => {
  const h = Math.abs(b[0] - a[0]) / 2;
  return h === 0 ? [a, b] : [a, [a[0], bendY - h], [b[0], bendY + h], b];
};

/* ---------------------------------------------------------------------------------------------------------- */

export type Source = { name: string; short: string; note: string };
export type Owner = { role: string; owner: string; deputy: string; line: string };
export type Idea = { title: string; from: number; to: number };

/** Where ideas start: the people on the floor, at the line and in the offices. */
export const SOURCES: Source[] = [
  { name: "Shift teams", short: "Shifts", note: "ON THE FLOOR" },
  { name: "Assembly lines", short: "Lines", note: "AT THE LINE" },
  { name: "Offices", short: "Offices", note: "IN THE OFFICE" },
];

/** The roles that own a kind of idea, each with a deputy (the demo company's fictional people). */
export const OWNERS: Owner[] = [
  { role: "Team lead, 4-series", owner: "T. Vogel", deputy: "M. Roth", line: "R1" },
  { role: "Head of Plant Quality", owner: "H. Sander", deputy: "M. Hoffmann", line: "R2" },
  { role: "Inbound Logistics", owner: "N. Demir", deputy: "T. Vogel", line: "R3" },
  { role: "Team lead, paint shop", owner: "M. Roth", deputy: "H. Sander", line: "R4" },
];

/** The ideas that ride the loop, one to each owner, so an owner's clock never overlaps itself. */
export const IDEAS: Idea[] = [
  { title: "€300 parts order", from: 0, to: 0 },
  { title: "Torque records", from: 1, to: 1 },
  { title: "Reusable crates", from: 2, to: 2 },
  { title: "Paint booth filter", from: 1, to: 3 },
];

/** The picture without motion: every owner lit, each clock at a different day. */
export const STILL: Array<{ state: "due" | "answered"; left: number; status: string }> = [
  { state: "answered", left: 3, status: "Answered in 2 d" },
  { state: "due", left: 3, status: "3 d left" },
  { state: "due", left: 5, status: "Due in 5 d" },
  { state: "due", left: 4, status: "4 d left" },
];

/* ---------------------------------------------------------------------------------------------------------- */

export type Label = { x: number; y: number; anchor: "start" | "middle" | "end" };
export type Layout = {
  key: "wide" | "tall";
  /** The drawing's box: its width, its height and the top it starts at (the viewBox's y). */
  w: number; h: number; top: number;
  sources: Array<{ at: Pt; label: Label }>;
  hub: { x: number; y: number; w: number; h: number; cx: number; cy: number; horizontal: boolean };
  ports: Pt[];
  board: { x: number; y: number; w: number; h: number };
  owners: Array<{ at: Pt; label: Label }>;
  ins: Route[];
  outs: Route[];
};

/* Wide: sources on the left, the hub in the middle, the owners on the right. Drawn on 640 x 560; the box shown
   is 640 x 444 from y 68, so the card has no empty band above the first label or under the last status. */
function wide(): Layout {
  const hub = { x: 222, y: 198, w: 104, h: 184, cx: 274, cy: 290, horizontal: false };
  const src: Pt[] = [[40, 140], [40, 290], [40, 440]];
  const entries = [245, 290, 335];
  const ins = src.map((s, i) => route([...octiH([s[0] + 9, s[1]], [hub.x, entries[i]], 160), [hub.cx, entries[i]]]));
  const own: Pt[] = [[440, 100], [440, 230], [440, 350], [440, 480]];
  const exits = [230, 270, 310, 350];
  const outs = [
    route([[274, 230], [340, 230], [360, 210], [360, 120], [380, 100], [440, 100]]),
    route([[274, 270], [370, 270], [410, 230], [440, 230]]),
    route([[274, 310], [370, 310], [410, 350], [440, 350]]),
    route([[274, 350], [340, 350], [360, 370], [360, 460], [380, 480], [440, 480]]),
  ];
  const ports: Pt[] = [...entries.map((y) => [hub.x, y] as Pt), ...exits.map((y) => [hub.x + hub.w, y] as Pt)];
  return {
    key: "wide", w: 640, h: 444, top: 68, hub, ports, ins, outs,
    sources: src.map((at) => ({ at, label: { x: at[0] - 12, y: at[1] - 30, anchor: "start" } })),
    board: { x: 162, y: 404, w: 188, h: 48 },
    owners: own.map((at) => ({ at, label: { x: at[0] + 26, y: at[1], anchor: "start" } })),
  };
}

/* Tall: sources across the top, the hub under them, the owners as rows, their lines down the right. 360 x 620. */
function tall(): Layout {
  const hub = { x: 100, y: 196, w: 160, h: 56, cx: 180, cy: 224, horizontal: true };
  const src: Pt[] = [[60, 76], [180, 76], [300, 76]];
  const entries = [150, 180, 210];
  const ins = src.map((s, i) => route([...octiV([s[0], s[1] + 9], [entries[i], hub.y], 140), [entries[i], hub.cy]]));
  const rows = [372, 442, 512, 582];
  const outs = rows.map((y, j) => {
    const lane = 300 + 12 * j, ey = 246 - 11 * j;
    return route([[180, ey], [lane, ey], [lane, y], [278, y]], 10);
  });
  const ports: Pt[] = [...entries.map((x) => [x, hub.y] as Pt), ...[246, 235, 224, 213].map((y) => [hub.x + hub.w, y] as Pt)];
  return {
    key: "tall", w: 360, h: 620, top: 0, hub, ports, ins, outs,
    sources: src.map((at) => ({ at, label: { x: at[0], y: at[1] - 40, anchor: "middle" } })),
    board: { x: 20, y: 272, w: 262, h: 48 },
    owners: rows.map((y) => ({ at: [278, y] as Pt, label: { x: 20, y, anchor: "start" } })),
  };
}

export const LAYOUTS: Layout[] = [wide(), tall()];

/* ---------------------------------------------------------------------------------------------------------- */
/* The loop's timetable, in ms. An idea leaves its source, rides into the hub, waits there while NextUp reads
   it, rides out to its owner, and the owner's 5-day clock ticks until the answer. A new idea leaves every GAP. */
export const T = {
  in: 1500,
  hub: 520,
  out: 1300,
  day: 900,
  hold: 1500,
  gap: 2200,
};
export const ARRIVE = T.in + T.hub + T.out;
export const CYCLE = IDEAS.length * T.gap;

export const ease = (t: number) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);
