// The tower scene's clockwork: everything on screen is a pure function of one number, the scroll progress p
// (0 at the top of the scene, 1 at its end). Nothing is accumulated from frame to frame, so scrolling back
// plays the same pictures in reverse. No React, no DOM, no three.js here.

export type Ease = (t: number) => number;

export const clamp01 = (n: number) => Math.min(1, Math.max(0, n));
export const lerp = (a: number, b: number, t: number) => a + (b - a) * t;

export const EASE = {
  linear: (t: number) => t,
  in: (t: number) => t * t,
  out: (t: number) => 1 - (1 - t) * (1 - t),
  inOut: (t: number) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2),
  smooth: (t: number) => t * t * (3 - 2 * t),
  expoOut: (t: number) => (t >= 1 ? 1 : 1 - Math.pow(2, -10 * t)),
  // Slow start, long acceleration: the idea leaving the desk.
  launch: (t: number) => t * t * t * (t * (6 * t - 15) + 10),
} as const satisfies Record<string, Ease>;

/** How far v has come from a to b: 0 before a, 1 after b, eased in between. */
export function span(v: number, a: number, b: number, ease: Ease = EASE.smooth) {
  if (b <= a) return v >= b ? 1 : 0;
  return ease(clamp01((v - a) / (b - a)));
}

/** 1 while v is inside [a, b], fading in over `fade` after a and out over `fade` before b. */
export function during(v: number, a: number, b: number, fade = 0.012) {
  return Math.min(span(v, a, a + fade), 1 - span(v, b - fade, b));
}

// A keyframe track: [at, value, ease]. The ease shapes the stretch that arrives at its key.
export type Key = readonly [at: number, value: number, ease?: Ease];
export type VecKey = readonly [at: number, value: readonly number[], ease?: Ease];

function segment(keys: readonly (Key | VecKey)[], p: number) {
  let i = 0;
  while (i < keys.length - 1 && p >= keys[i + 1][0]) i++;
  const a = keys[i], b = keys[Math.min(i + 1, keys.length - 1)];
  const t = a === b ? 0 : span(p, a[0], b[0], b[2] ?? EASE.inOut);
  return { i, j: Math.min(i + 1, keys.length - 1), t };
}

export function sample(keys: readonly Key[], p: number) {
  if (p <= keys[0][0]) return keys[0][1];
  const s = segment(keys, p);
  return lerp(keys[s.i][1], keys[s.j][1], s.t);
}

export function sampleVec(keys: readonly VecKey[], p: number, out: number[] = []) {
  const s = p <= keys[0][0] ? { i: 0, j: 0, t: 0 } : segment(keys, p);
  const a = keys[s.i][1], b = keys[s.j][1];
  for (let k = 0; k < a.length; k++) out[k] = lerp(a[k], b[k], s.t);
  out.length = a.length;
  return out;
}

/** Frame-rate independent approach to a target: the same curve at 30, 60 or 120 frames a second. */
export function damp(current: number, target: number, lambda: number, dt: number) {
  return lerp(current, target, 1 - Math.exp(-lambda * dt));
}

// A polyline with its running length, for anything that travels: the route, a street, a rail.
export type Path = { points: readonly (readonly [number, number, number])[]; lengths: number[]; total: number };

export function pathOf(points: readonly (readonly [number, number, number])[]): Path {
  const lengths = [0];
  for (let i = 1; i < points.length; i++) {
    const a = points[i - 1], b = points[i];
    lengths.push(lengths[i - 1] + Math.hypot(b[0] - a[0], b[1] - a[1], b[2] - a[2]));
  }
  return { points, lengths, total: lengths[lengths.length - 1] };
}

/** The point at fraction u (0..1) of a path's length. */
export function pointAt(path: Path, u: number, out: [number, number, number] = [0, 0, 0]) {
  const d = clamp01(u) * path.total;
  let i = 1;
  while (i < path.lengths.length - 1 && path.lengths[i] < d) i++;
  const a = path.points[i - 1], b = path.points[i];
  const len = path.lengths[i] - path.lengths[i - 1];
  const t = len > 0 ? (d - path.lengths[i - 1]) / len : 0;
  out[0] = lerp(a[0], b[0], t); out[1] = lerp(a[1], b[1], t); out[2] = lerp(a[2], b[2], t);
  return out;
}
