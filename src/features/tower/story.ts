// The story the tower tells, as data and as one pure function: scroll progress in, the state of the scene out.
// An employee raises a request, today it wanders, with NextUp the routing map proposes its owner, it travels
// there, the answer comes back. Examples reuse the product's own matcher on the demo company's routing map.
// Everything here is illustrative and the people are fictional. No React, no DOM, no three.js.
import { ROUTES, type Route } from "@/features/demo/routes";
import { propose } from "@/features/routing";
import { CORE, FLOOR_H, HALF_X, HALF_Z, floorY, topFloor } from "./building";
import { EASE, clamp01, during, lerp, pathOf, pointAt, sampleVec, span, type Path, type VecKey } from "./timeline";

export type Vec3 = readonly [number, number, number];
export type Layout = "wide" | "tall";

/* ---------------------------------------------------------------------------------------------------------------
   Chapters. `from`/`to` are scroll progress; `rest` is where a chapter button lands: the frame that chapter holds. */
export type ChapterId = "arrive" | "raise" | "company" | "route" | "answer" | "product";
export type Chapter = { id: ChapterId; label: string; from: number; to: number; rest: number };
export const CHAPTERS: readonly Chapter[] = [
  { id: "arrive", label: "Arrive", from: 0, to: 0.1, rest: 0 },
  { id: "raise", label: "The idea", from: 0.1, to: 0.28, rest: 0.245 },
  { id: "company", label: "Today", from: 0.28, to: 0.5, rest: 0.47 },
  { id: "route", label: "The route", from: 0.5, to: 0.7, rest: 0.685 },
  { id: "answer", label: "The answer", from: 0.7, to: 0.89, rest: 0.87 },
  { id: "product", label: "The product", from: 0.89, to: 1, rest: 1 },
];
export const SCREENS = 8; // how many screens tall the scene's scroll track is

export function chapterAt(p: number) {
  let i = 0;
  while (i < CHAPTERS.length - 1 && p >= CHAPTERS[i + 1].from) i++;
  return i;
}

// The beats inside the chapters, in scroll progress. One place, so the pictures and the words agree.
export const BEAT = {
  approach: [0.1, 0.2],      // the camera eases to the sender's floor
  open: [0.15, 0.225],       // the facade draws open
  emerge: [0.2, 0.265],      // the idea rises from the desk
  widen: [0.28, 0.345],      // the opening grows over the whole face, the camera steps back
  wander: [0.36, 0.47],      // today: desk to desk
  reset: [0.485, 0.515],     // the same request again, this time with NextUp
  read: [0.515, 0.555],      // the map reads it, the route lights up
  travel: [0.56, 0.665],     // the idea goes to its owner
  land: [0.665, 0.7],        // on the owner's desk: owner, deadline
  decide: [0.715, 0.76],     // the office lights, the owner answers
  back: [0.765, 0.85],       // the answer goes back down
  closed: [0.85, 0.885],     // the loop is closed
  leave: [0.895, 1],         // the camera leaves, the page takes over
} as const satisfies Record<string, readonly [number, number]>;

/* ---------------------------------------------------------------------------------------------------------------
   The fictional company, floor by floor. Floor height is a storytelling device: who decides depends on the
   request, not on how high up somebody sits. Only fully glazed floors are used (building.ts OPEN_FLOORS). */
export const FLOOR = { shift: 9, sender: 10, purchasing: 16, engineering: 17, finance: 23, production: 24, quality: 30, head: 32 } as const;
const DEPT: Record<string, { floor: number; name: string }> = {
  PRD: { floor: FLOOR.production, name: "Production" },
  ENG: { floor: FLOOR.engineering, name: "Engineering" },
  QUA: { floor: FLOOR.quality, name: "Quality" },
};

export type Desk = { floor: number; x: number; z: number };
const NEAR_GLASS = HALF_X - 4.4;
export const SENDER: Desk = { floor: FLOOR.sender, x: NEAR_GLASS, z: 7.2 };
const deskOf = (floor: number, z = -6.4): Desk => ({ floor, x: NEAR_GLASS, z });
/** Where a signal hovers over a desk. */
export const over = (d: Desk): Vec3 => [d.x, floorY(d.floor) + 1.55, d.z];

/* ---------------------------------------------------------------------------------------------------------------
   Examples: what a visitor can send through the building. The owner, the deputy and the request type come from
   the product's matcher (features/routing) on the demo routing map (features/demo/routes), exactly as the raise
   box does it. */
export type Example = {
  id: string; text: string; short: string; from: string;
  type: string; confidence: number;
  owner: { name: string; role: string; dept: string; floor: number; desk: Desk };
  deputy: { name: string; role: string; dept: string; floor: number; desk: Desk };
};

const REQUESTS: Array<{ id: string; text: string; short: string; from: string }> = [
  { id: "spend", text: "Night shift has no one who can sign a €300 parts order", short: "A €300 parts order", from: "Night shift, 4-series" },
  { id: "access", text: "Two apprentices have had no system login for four weeks", short: "Logins for apprentices", from: "Night shift, 4-series" },
  { id: "quality", text: "Tolerance drift on station 7 - who owns the gauge calibration?", short: "Tolerance drift, station 7", from: "Night shift, 4-series" },
];

function person(name: string, routes: readonly Route[]) {
  const row = routes.find((r) => r.owner.name === name);
  const dept = row ? DEPT[row.owner.dept] : undefined;
  return { name, role: row?.owner.role ?? "Deputy", dept: dept?.name ?? "", floor: dept?.floor ?? FLOOR.head };
}

export function buildExamples(routes: readonly Route[] = ROUTES): Example[] {
  return REQUESTS.flatMap((req) => {
    const proposal = propose(req.text, routes);
    if (!proposal?.route) return [];
    const route = proposal.route;
    const owner = person(route.owner.name, routes), deputy = person(route.deputy, routes);
    return [{
      ...req, type: route.type, confidence: proposal.confidence,
      owner: { ...owner, desk: deskOf(owner.floor) },
      deputy: { ...deputy, desk: deskOf(deputy.floor, 5.8) },
    }];
  });
}
export const EXAMPLES = buildExamples();

/* ---------------------------------------------------------------------------------------------------------------
   Today: the request wanders. The same five hops as the page's wait ledger (WaitScene): where it lies, for how
   many days, and why it moves on. Illustrative. */
export type Hop = { to: Desk; where: string; reason: string; days: number; work?: boolean };
export const HOPS: readonly Hop[] = [
  { to: deskOf(FLOOR.shift, -9.5), where: "Shift lead", reason: "not responsible", days: 2 },
  { to: deskOf(FLOOR.purchasing, 9.5), where: "Purchasing", reason: "wrong department", days: 5 },
  { to: deskOf(FLOOR.finance, -10.5), where: "Finance", reason: "is it important", days: 6 },
  { to: SENDER, where: "Back to the sender", reason: "no time, returned", days: 3 },
  { to: deskOf(FLOOR.head, 3), where: "Head of Production", reason: "answered", days: 3, work: true },
];
export const TODAY_DAYS = HOPS.reduce((n, h) => n + h.days, 0);            // 19
export const TODAY_WORK = HOPS.filter((h) => h.work).reduce((n, h) => n + h.days, 0); // 3
export const ANSWERED_DAY = 2; // with NextUp, the day the owner answers in this story (the demo's median)

/* ---------------------------------------------------------------------------------------------------------------
   Paths through the building. A signal leaves a desk toward the core, takes a riser on the core's east wall,
   and comes out on the other floor. Corners are rounded so that it never turns on the spot. */
const RISER_X = CORE.halfX + 1.1;
const RISERS = [0, -11.5, 12] as const; // z of the main riser (the route's) and of two side stairs (the detours')

function rounded(points: Vec3[], radius = 1.3, steps = 5): Vec3[] {
  const out: Vec3[] = [points[0]];
  for (let i = 1; i < points.length - 1; i++) {
    const a = points[i - 1], b = points[i], c = points[i + 1];
    const ab = Math.hypot(b[0] - a[0], b[1] - a[1], b[2] - a[2]), bc = Math.hypot(c[0] - b[0], c[1] - b[1], c[2] - b[2]);
    const r = Math.min(radius, ab / 2, bc / 2);
    if (r < 0.05) { out.push(b); continue; }
    const p0: Vec3 = [b[0] + ((a[0] - b[0]) / ab) * r, b[1] + ((a[1] - b[1]) / ab) * r, b[2] + ((a[2] - b[2]) / ab) * r];
    const p1: Vec3 = [b[0] + ((c[0] - b[0]) / bc) * r, b[1] + ((c[1] - b[1]) / bc) * r, b[2] + ((c[2] - b[2]) / bc) * r];
    for (let s = 0; s <= steps; s++) {
      const t = s / steps, u = 1 - t; // a quadratic curve through the corner
      out.push([u * u * p0[0] + 2 * u * t * b[0] + t * t * p1[0], u * u * p0[1] + 2 * u * t * b[1] + t * t * p1[1], u * u * p0[2] + 2 * u * t * b[2] + t * t * p1[2]]);
    }
  }
  out.push(points[points.length - 1]);
  return out;
}

/** From one desk to another by a riser. */
export function passage(a: Desk, b: Desk, riserZ: number = RISERS[0]): Vec3[] {
  const from = over(a), to = over(b);
  if (a.floor === b.floor) return [from, to];
  return rounded([from, [RISER_X, from[1], from[2]], [RISER_X, from[1], riserZ], [RISER_X, to[1], riserZ], [RISER_X, to[1], to[2]], to]);
}

export type Paths = { route: Path; wander: Path; detour: Path; wanderStops: number[] };

export function pathsFor(example: Example): Paths {
  const route = pathOf(passage(SENDER, example.owner.desk));
  const detour = pathOf(passage(example.owner.desk, example.deputy.desk, RISERS[1]));
  // The wander: every hop takes another way, which is the point.
  const points: Vec3[] = [];
  const stops: number[] = [];
  let at = SENDER;
  HOPS.forEach((hop, i) => {
    const leg = passage(at, hop.to, RISERS[(i % 2) + 1]);
    points.push(...(i === 0 ? leg : leg.slice(1)));
    stops.push(points.length - 1);
    at = hop.to;
  });
  const wander = pathOf(points);
  return { route, wander, detour, wanderStops: stops.map((i) => wander.lengths[i] / wander.total) };
}

/* ---------------------------------------------------------------------------------------------------------------
   The state of the scene. The renderer draws exactly this, every frame. */
export type Line = { shown: number; head: number; glow: number; back?: boolean };
export type Tone = "idea" | "answer" | "late" | "stale";
export type SceneState = {
  cam: number[];                       // position xyz, target xyz, field of view
  shift: readonly [number, number];    // where the target sits on screen, as a share of the view from its centre
  cut: { z0: number; z1: number; y0: number; y1: number; open: number };
  floorLight: number[];                // lamp level per floor, index = floor number
  route: Line; wander: Line; detour: Line;
  spark: { at: Vec3; dir: Vec3; power: number; tone: Tone; size: number };
  attention: { sender: number; owner: number; deputy: number };
  day: number;                         // 0 blue hour .. 1 the page's own light ground
};

export type Input = { example: Example; paths: Paths; layout: Layout; overdue: number };

// Camera stations. Every one aims at something; the layout decides from how far and where it sits on screen.
type Station = { at: number; target: Vec3; from: Vec3; fov: number; shift: readonly [number, number]; ease?: (t: number) => number };

const AMBIENT = 0.55;
const EAST = HALF_X;

function stations(input: Input): Station[] {
  const { example, layout } = input;
  const wide = layout === "wide";
  const ySend = floorY(FLOOR.sender) + 2, yOwn = floorY(example.owner.floor) + 2;
  const yMid = (ySend + yOwn) / 2;
  const far = wide ? 1 : 1.42; // a phone stands further back and looks through a taller frame
  const view = (target: Vec3, dir: Vec3, dist: number): Vec3 => [target[0] + dir[0] * dist * far, target[1] + dir[1] * dist * far, target[2] + dir[2] * dist * far];
  const sx = wide ? 0.17 : 0, sy = wide ? 0 : 0.15;
  const hero: Vec3 = [-4, 70, 0];
  const whole: Vec3 = [EAST, floorY(21), 0];
  return [
    { at: 0, target: hero, from: view(hero, [0.648, -0.085, 0.757], 352), fov: wide ? 30 : 34, shift: [wide ? 0.17 : 0, wide ? -0.03 : 0.11] },
    { at: BEAT.approach[0], target: hero, from: view(hero, [0.67, -0.08, 0.737], 330), fov: wide ? 30 : 34, shift: [wide ? 0.17 : 0, wide ? -0.03 : 0.11], ease: EASE.linear },
    { at: BEAT.approach[1], target: [EAST, ySend, 5.5], from: view([EAST, ySend, 5.5], [0.86, 0.09, 0.5], 62), fov: 28, shift: [sx, sy] },
    { at: BEAT.emerge[1] + 0.012, target: [EAST, ySend + 0.4, 5.5], from: view([EAST, ySend + 0.4, 5.5], [0.875, 0.08, 0.477], 57), fov: 28, shift: [sx, sy], ease: EASE.linear },
    { at: BEAT.widen[1], target: whole, from: view(whole, [0.9, 0.05, 0.433], 212), fov: 30, shift: [sx, sy * 0.6] },
    { at: BEAT.wander[1], target: whole, from: view(whole, [0.915, 0.05, 0.4], 208), fov: 30, shift: [sx, sy * 0.6], ease: EASE.linear },
    { at: BEAT.read[0], target: [EAST, ySend + 6, 2], from: view([EAST, ySend + 6, 2], [0.88, 0.07, 0.47], 104), fov: 29, shift: [sx, sy] },
    { at: BEAT.travel[0], target: [EAST, ySend + 8, 1], from: view([EAST, ySend + 8, 1], [0.885, 0.07, 0.46], 100), fov: 29, shift: [sx, sy], ease: EASE.linear },
    { at: BEAT.travel[1], target: [EAST, yOwn - 1, -3], from: view([EAST, yOwn - 1, -3], [0.9, 0.06, 0.43], 74), fov: 28, shift: [sx, sy] },
    { at: BEAT.decide[1], target: [EAST, yOwn - 0.5, -4], from: view([EAST, yOwn - 0.5, -4], [0.91, 0.06, 0.41], 66), fov: 28, shift: [sx, sy], ease: EASE.linear },
    { at: BEAT.back[1], target: [EAST, yMid, 1], from: view([EAST, yMid, 1], [0.9, 0.04, 0.435], 96 + (yOwn - ySend) * 1.25), fov: 30, shift: [sx, sy * 0.6] },
    { at: BEAT.closed[1], target: [EAST, yMid, 1], from: view([EAST, yMid, 1], [0.905, 0.04, 0.425], 98 + (yOwn - ySend) * 1.25), fov: 30, shift: [sx, sy * 0.6], ease: EASE.linear },
    { at: 1, target: [0, 92, 0], from: view([0, 92, 0], [0.66, -0.2, 0.72], 330), fov: 32, shift: [0, 0] },
  ];
}

function camera(input: Input, p: number) {
  const st = stations(input);
  const keys: VecKey[] = st.map((s) => [s.at, [...s.from, ...s.target, s.fov, s.shift[0], s.shift[1]], s.ease]);
  return sampleVec(keys, p);
}

/** The scene at scroll progress p. */
export function stateAt(p: number, input: Input): SceneState {
  const { example, paths, overdue } = input;
  const cam = camera(input, p);
  const shift: [number, number] = [cam[7], cam[8]];
  cam.length = 7;

  // The opening in the east face: first the sender's office, then the whole face up to the lowest roof.
  const grow = span(p, BEAT.widen[0], BEAT.widen[1], EASE.inOut);
  const ySend = floorY(FLOOR.sender);
  const cut = {
    z0: lerp(SENDER.z - 8.5, -HALF_Z + 1.2, grow), z1: lerp(SENDER.z + 8.5, HALF_Z - 1.2, grow),
    y0: lerp(ySend + 0.25, floorY(FLOOR.shift) + 0.25, grow), y1: lerp(ySend + FLOOR_H - 0.3, floorY(topFloor(0) + 1) - 0.3, grow),
    open: span(p, BEAT.open[0], BEAT.open[1], EASE.inOut) * (1 - span(p, BEAT.leave[0], BEAT.leave[0] + 0.05)),
  };

  // The idea's own clock inside each beat.
  const emerge = span(p, BEAT.emerge[0], BEAT.emerge[1], EASE.out);
  const wander = span(p, BEAT.wander[0], BEAT.wander[1], EASE.linear);
  const reset = span(p, BEAT.reset[0], BEAT.reset[1]);
  const read = span(p, BEAT.read[0], BEAT.read[1], EASE.inOut);
  const travel = span(p, BEAT.travel[0], BEAT.travel[1], EASE.launch);
  const decide = span(p, BEAT.decide[0], BEAT.decide[1]);
  const back = span(p, BEAT.back[0], BEAT.back[1], EASE.inOut);
  const closed = span(p, BEAT.closed[0], BEAT.closed[1]);
  const inWander = p >= BEAT.wander[0] - 0.012 && p < BEAT.reset[0] + 0.012;
  const late = clamp01(overdue);

  // Where the signal is, and what it is.
  const lift: Vec3 = [SENDER.x, floorY(SENDER.floor) + 0.95 + emerge * 0.6, SENDER.z];
  let at: Vec3 = lift, dir: Vec3 = REST, power = emerge, tone: Tone = "idea", size = 1;
  const state: { route: Line; wander: Line; detour: Line } = {
    route: { shown: 0, head: -1, glow: 0 }, wander: { shown: 0, head: -1, glow: 0 }, detour: { shown: 0, head: -1, glow: 0 },
  };
  if (inWander && p < BEAT.reset[0]) {
    // Today: it moves, it lies, it moves. Each stop costs its days; the light goes out of it.
    const u = wanderAt(wander, paths);
    at = pointAt(paths.wander, u);
    dir = heading(paths.wander, u);
    state.wander = { shown: u, head: u, glow: 1 - 0.55 * wander };
    power = 1 - 0.62 * wander;
    tone = "stale";
    size = 1 - 0.25 * wander;
  } else if (p >= BEAT.reset[0]) {
    state.wander = { shown: 1, head: -1, glow: 0.4 * (1 - reset) };
    state.route = { shown: read, head: travel > 0 && back === 0 ? travel : -1, glow: 0.55 + 0.45 * read };
    at = pointAt(paths.route, travel);
    dir = heading(paths.route, travel);
    power = 0.9 + 0.6 * Math.sin(Math.PI * travel);
    size = 1 + 0.5 * Math.sin(Math.PI * travel);
    if (late > 0) {
      // Nobody answered: the clock runs out on the owner's desk, then the request moves to the deputy.
      const go = span(late, 0.4, 0.86, EASE.inOut);
      state.detour = { shown: span(late, 0.32, 0.5), head: go > 0 && go < 1 ? go : -1, glow: 1 };
      at = go > 0 ? pointAt(paths.detour, go) : pointAt(paths.route, 1);
      dir = go > 0 ? heading(paths.detour, go) : REST;
      tone = late < 0.4 ? "late" : "idea";
      power = 1 + 0.4 * Math.sin(Math.PI * go);
    } else if (decide > 0) {
      // The owner answers; the answer goes back the way the idea came.
      at = pointAt(paths.route, 1 - back);
      dir = heading(paths.route, 1 - back);
      tone = decide >= 0.5 ? "answer" : "idea";
      power = (0.9 + 0.5 * Math.sin(Math.PI * back)) * (1 - 0.35 * closed);
      size = 1 + 0.4 * Math.sin(Math.PI * back);
      state.route = { shown: 1, head: back > 0 && back < 1 ? 1 - back : -1, glow: 1, back: decide >= 0.5 };
    }
  }
  if (p < BEAT.emerge[0]) power = 0;
  const leaving = span(p, BEAT.leave[0], BEAT.leave[0] + 0.04);
  power *= 1 - leaving;

  // Lamps. Every floor glows a little; the floors of the story glow when it is their turn.
  const floorLight = new Array<number>(40).fill(AMBIENT);
  const lit = (floor: number, level: number) => { floorLight[floor] = Math.max(floorLight[floor], level); };
  const opened = span(p, BEAT.open[0], BEAT.open[1]);
  lit(FLOOR.sender, AMBIENT + 0.6 * opened + 0.5 * closed * (1 - late));
  if (inWander) HOPS.forEach((hop, i) => lit(hop.to.floor, AMBIENT + 0.45 * during(wander, stopAt(i) - 0.04, stopAt(i) + 0.12, 0.03)));
  lit(example.owner.floor, AMBIENT + 0.35 * read + 0.4 * span(p, BEAT.land[0], BEAT.land[1]) + 0.75 * decide * (1 - 0.5 * late));
  if (late > 0) lit(example.deputy.floor, AMBIENT + 0.35 * span(late, 0.3, 0.5) + 0.9 * span(late, 0.86, 1));

  return {
    cam, shift, cut, floorLight, ...state,
    spark: { at, dir, power, tone, size },
    attention: {
      sender: Math.max(during(p, BEAT.emerge[0], BEAT.widen[0] + 0.02, 0.02), closed * (1 - late)),
      owner: Math.max(span(p, BEAT.land[0], BEAT.land[1]) * (1 - span(p, BEAT.leave[0], BEAT.leave[1])), 0),
      deputy: span(late, 0.86, 1),
    },
    day: span(p, BEAT.leave[0] + 0.03, 1, EASE.inOut),
  };
}

// A signal at rest lies across the view; under way it points where it goes.
const REST: Vec3 = [0, 0, 1];
function heading(path: Path, u: number): Vec3 {
  const a = pointAt(path, u - 0.004), b = pointAt(path, u + 0.004);
  const d = [b[0] - a[0], b[1] - a[1], b[2] - a[2]];
  const len = Math.hypot(d[0], d[1], d[2]) || 1;
  const k = span(u, 0, 0.03) * (1 - span(u, 0.97, 1));
  return [lerp(REST[0], d[0] / len, k), lerp(REST[1], d[1] / len, k), lerp(REST[2], d[2] / len, k)];
}

// Where hop i ends, as a share of the wander's clock: it travels for a moment, then lies there for its days.
function stopAt(i: number) {
  let days = 0;
  for (let k = 0; k <= i; k++) days += HOPS[k].days;
  return (days - HOPS[i].days * 0.72) / TODAY_DAYS;
}

// The wander's clock (0..1, linear in days) to a position on its path: quick between desks, still on them.
function wanderAt(clock: number, paths: Paths) {
  let start = 0, from = 0;
  for (let i = 0; i < HOPS.length; i++) {
    const end = start + HOPS[i].days / TODAY_DAYS;
    const to = paths.wanderStops[i];
    if (clock < end || i === HOPS.length - 1) {
      const moving = span(clock, start, start + (end - start) * 0.28, EASE.inOut);
      return lerp(from, to, moving);
    }
    start = end; from = to;
  }
  return 1;
}

/* ---------------------------------------------------------------------------------------------------------------
   What the words need to know: a handful of facts that change a few times, never per frame. */
export type View = {
  chapter: number;
  day: number;                 // the day counter of the wander (0..19), or of the route (0, then the answer's day)
  hop: number;                 // how many hops of the wander have started
  mode: "calm" | "today" | "next";
  owner: boolean;              // the owner's card shows
  answered: boolean;
  floors: boolean;             // the floor labels show
  late: 0 | 1 | 2;             // overdue scenario: off, the clock ran out, moved to the deputy
};

export function viewAt(p: number, overdue: number): View {
  const wander = span(p, BEAT.wander[0], BEAT.wander[1], EASE.linear);
  const today = p >= BEAT.widen[1] - 0.01 && p < BEAT.reset[0] + 0.015;
  const next = p >= BEAT.reset[0] + 0.015 && p < BEAT.leave[0] + 0.02;
  const answered = p >= (BEAT.decide[0] + BEAT.decide[1]) / 2;
  let hop = 0, days = 0;
  if (today) for (const h of HOPS) { if (wander * TODAY_DAYS > days) hop++; days += h.days; }
  return {
    chapter: chapterAt(p),
    day: today ? Math.min(TODAY_DAYS, Math.floor(wander * TODAY_DAYS + 1e-4)) : next && answered && overdue === 0 ? ANSWERED_DAY : 0,
    hop,
    mode: today ? "today" : next ? "next" : "calm",
    owner: p >= BEAT.land[0] && p < BEAT.leave[0] + 0.02,
    answered: answered && p < BEAT.leave[0] + 0.02,
    floors: p >= BEAT.widen[1] - 0.02 && p < BEAT.leave[0],
    late: overdue <= 0 ? 0 : overdue < 0.4 ? 1 : 2,
  };
}
export const sameView = (a: View, b: View) =>
  a.chapter === b.chapter && a.day === b.day && a.hop === b.hop && a.mode === b.mode && a.owner === b.owner && a.answered === b.answered && a.floors === b.floors && a.late === b.late;

/* ---------------------------------------------------------------------------------------------------------------
   Where the labels hang: points in the scene that the page pins words to. */
export type Anchor = { id: string; at: Vec3 };
const edge = (floor: number, up = 0.5): Vec3 => [EAST + 0.4, floorY(floor) + FLOOR_H * up, -HALF_Z - 0.6];

export function anchorsFor(example: Example): Anchor[] {
  return [
    { id: "sender", at: edge(FLOOR.sender, 0.72) },
    { id: "owner", at: edge(example.owner.floor) },
    { id: "deputy", at: edge(example.deputy.floor) },
    { id: "shift", at: edge(FLOOR.shift, 0.2) },
    { id: "purchasing", at: edge(FLOOR.purchasing) },
    { id: "finance", at: edge(FLOOR.finance) },
    { id: "head", at: edge(FLOOR.head) },
  ];
}
