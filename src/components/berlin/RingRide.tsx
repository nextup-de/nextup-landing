"use client";
// The ring: the problem, felt. A request nobody owns rides a loop line while a day counter climbs, and the only
// way off the ring is someone finally taking it. One pinned screen (the page system's data-pin): the scroll is
// the story's clock, read, never written.
//
// The drawing is an information graphic first: arc length is time. The sender's stop sits at the top; the four
// waiting hops (HOPS without the work) split the whole loop in proportion to their days, so the ring is the
// waiting days. One straight spur leaves the ring at the sender's stop to Head of Production: the days of work,
// in brand teal. The request (a gold disc) darts to each desk in its first 0.9 day and rests there for the rest,
// while the counter turns; its trail is red (waiting). When it closes the loop at the sender, the ring pulses
// once. At the end the whole stage fades out first, then the sum rises in on the section's own ground, left on the
// page's text column: 19 days on the ring, 3 days of work.
// Every number comes from HOPS, TODAY_DAYS and TODAY_WORK (features/tower/story, read-only); the stage says the
// request is fictional.
//
// The server markup is the complete picture (the ring drawn, the disc at Head of Production, DAY 19, the five
// captions as a list, the end frame), and so is reduced motion or a screen under 560px tall. Only when motion is
// allowed does an effect pin the section and arm the start state. The stage is hidden from assistive technology;
// a visually hidden list says the same in words.
import { useEffect, useRef, useState } from "react";
import { HOPS, TODAY_DAYS, TODAY_WORK } from "@/features/tower/story";
import { cn } from "@/lib/utils/cn";
import { Flaps } from "./Flaps";
import { clamp01, onFrame, useReducedMotion } from "./motion";
import styles from "./RingRide.module.css";

/* ---------------------------------------------------------------------------------------------------------------
   The numbers. RING are the hops that wait (they make the loop), WORK the one that answers (the spur). */
const RING = HOPS.filter((h) => !h.work);
const RING_DAYS = RING.reduce((n, h) => n + h.days, 0); // 16
/** The day each hop starts: when the desk before it passed the request on. */
const STARTS = HOPS.map((_, i) => HOPS.slice(0, i).reduce((n, h) => n + h.days, 0)); // 0 2 7 13 16
/** Where each ring stop sits on the loop (0..1, clockwise from the sender at the top). */
const STOPS = [0, ...RING.map((_, i) => RING.slice(0, i + 1).reduce((n, h) => n + h.days, 0) / RING_DAYS)];
const TRAVEL = 0.9; // the share of a day the disc takes to reach a desk

// The board line under the counter: the desk the request lies on and what it hears there (HOPS[].where and
// .reason). Every line fits its flaps whole (a cut board line would show its end, "…HASING · WRONG DEPARTMENT"):
// the long names and reasons have a short board form.
const BOARD_CELLS = 25;
const DESK: Record<string, string> = { "Back to the sender": "Sender", "Head of Production": "Head of prod." };
const REASON: Record<string, string> = { "not responsible": "not mine", "wrong department": "wrong dept.", "no time, returned": "no time" };
const BOARD = HOPS.map((h) => `${DESK[h.where] ?? h.where} · ${REASON[h.reason] ?? h.reason}`);
const BOARD_START = "Night shift · €300 order";

// The captions, one per hop (the same hop that drives the counter, the board and the lit stop), with the day the
// request reached that desk: each says where it lies now and what it hears there.
const CAPTIONS = [
  "Night shift needs a €300 parts order signed. The shift lead: not responsible.",
  "On to Purchasing: wrong department.",
  "On to Finance: is it important?",
  "Back to the night shift. Nobody has time.",
  `Up to the head of production, who answers on day ${TODAY_DAYS}.`,
].map((text, i) => ({ day: STARTS[i], text }));

const END_LINE = "The rest was waiting for someone to say: this one is mine.";

/* ---------------------------------------------------------------------------------------------------------------
   The geometry (viewBox 640 x 640). The loop is a rounded "dog's head" like Berlin's Ringbahn: a superellipse with
   a snout to the east and a dip above it, sampled once into points, so the stops and the trail agree with the
   path exactly - on the server as well. */
const VB = 640;
const CX = 316, CY = 368, AX = 232, AY = 206;
const N = 240;
type Pt = { x: number; y: number };
const r1 = (v: number) => Math.round(v * 10) / 10;
const r2 = (v: number) => Math.round(v * 100) / 100;

function ringPoints(): Pt[] {
  const pts: Pt[] = [];
  const bump = (d: number, w: number) => Math.exp(-((d / w) ** 2));
  for (let i = 0; i < N; i++) {
    const th = -Math.PI / 2 + (i / N) * Math.PI * 2;
    const c = Math.cos(th), s = Math.sin(th);
    const e = 2 / 2.7;
    const f = 1 + 0.11 * bump(th - 0.42, 0.34) - 0.055 * bump(th + 0.5, 0.24) + 0.03 * bump(th - 2.5, 0.5);
    // Rounded to 0.1, so the server and the browser draw the same numbers (their Math can differ in the last bits).
    pts.push({ x: r1(CX + Math.sign(c) * Math.abs(c) ** e * AX * f), y: r1(CY + Math.sign(s) * Math.abs(s) ** e * AY * f) });
  }
  return pts;
}

function measure(pts: Pt[], closed: boolean) {
  const len = [0];
  const n = closed ? pts.length + 1 : pts.length;
  for (let i = 1; i < n; i++) {
    const a = pts[i - 1], b = pts[i % pts.length];
    len.push(len[i - 1] + Math.hypot(b.x - a.x, b.y - a.y));
  }
  const total = len[len.length - 1];
  /** The point and its outward normal at `f` (0..1) of the length. */
  const at = (f: number): Pt & { nx: number; ny: number } => {
    const want = clamp01(f) * total;
    let i = 1;
    while (i < len.length - 1 && len[i] < want) i++;
    const a = pts[i - 1], b = pts[i % pts.length];
    const t = len[i] === len[i - 1] ? 0 : (want - len[i - 1]) / (len[i] - len[i - 1]);
    const dx = b.x - a.x, dy = b.y - a.y, dl = Math.hypot(dx, dy) || 1;
    return { x: r2(a.x + dx * t), y: r2(a.y + dy * t), nx: r2(dy / dl), ny: r2(-dx / dl) };
  };
  return { at, total };
}

const RING_PTS = ringPoints();
const RING_D = "M" + RING_PTS.map((p) => `${p.x} ${p.y}`).join("L") + "Z";
const ring = measure(RING_PTS, true);
// The spur: up from the sender's stop, a 45-degree bend, out to the terminus bar.
const SENDER = ring.at(0);
const SPUR_PTS: Pt[] = [
  { x: SENDER.x, y: SENDER.y }, { x: SENDER.x, y: SENDER.y - 44 }, { x: SENDER.x + 46, y: SENDER.y - 90 }, { x: SENDER.x + 150, y: SENDER.y - 90 },
];
const SPUR_D = "M" + SPUR_PTS.map((p) => `${p.x} ${p.y}`).join("L");
const spur = measure(SPUR_PTS, false);
const TERMINUS = SPUR_PTS[SPUR_PTS.length - 1];

// The loop runs clockwise on screen (y down), so measure's normal (dy, -dx) points outward.
const out = (f: number) => ring.at(f);
const DAY_TICKS = Array.from({ length: RING_DAYS }, (_, i) => out(i / RING_DAYS)).filter((_, i) => !STOPS.includes(i / RING_DAYS));
const STATIONS = STOPS.slice(0, -1).map((f, i) => ({ ...out(f), i }));

/** Where the request is on day `d`: on the ring (0..1 of the loop) or on the spur (0..1), and which hop it is in. */
function where(d: number) {
  const ease = (t: number) => (t < 0.5 ? 2 * t * t : 1 - (-2 * t + 2) ** 2 / 2);
  let hop = 0;
  for (let i = 0; i < HOPS.length; i++) if (d >= STARTS[i]) hop = i;
  const t = ease(clamp01((d - STARTS[hop]) / TRAVEL));
  if (HOPS[hop].work) return { hop, ring: 1, spur: t };
  return { hop, ring: STOPS[hop] + (STOPS[hop + 1] - STOPS[hop]) * t, spur: 0 };
}

const pct = (v: number) => `${((v / VB) * 100).toFixed(3)}%`;

function Label({ x, y, nx, ny, on, past, children, cls }: {
  x: number; y: number; nx: number; ny: number; on: boolean; past: boolean; children: React.ReactNode; cls?: string;
}) {
  const side = Math.abs(nx) > 0.55 ? (nx > 0 ? "e" : "w") : ny < 0 ? "n" : "s";
  const d = 26;
  return (
    <span className={cn(styles.label, cls)} data-side={side} data-on={on || undefined} data-past={past || undefined}
      style={{ left: pct(x + nx * d), top: pct(y + ny * d) }}>
      {children}
    </span>
  );
}

export function RingRide() {
  const root = useRef<HTMLElement>(null);
  const disc = useRef<SVGGElement>(null);
  const trail = useRef<SVGPathElement>(null);
  const spurTrail = useRef<SVGPathElement>(null);
  const scene = useRef<HTMLDivElement>(null);
  const end = useRef<HTMLDivElement>(null);
  const reduced = useReducedMotion();
  const [tall, setTall] = useState(false);
  // The integer day and the hop: the only things React renders from the scroll (a few dozen times per ride).
  const [at, setAt] = useState<{ day: number; hop: number; started: boolean } | null>(null);
  const armed = tall && !reduced;

  useEffect(() => {
    const mq = window.matchMedia("(min-height: 561px)");
    const set = () => setTall(mq.matches);
    set();
    mq.addEventListener("change", set);
    return () => mq.removeEventListener("change", set);
  }, []);

  useEffect(() => {
    const el = root.current;
    if (!el || !armed) { setAt(null); return; }
    const discEl = disc.current, trailEl = trail.current, spurEl = spurTrail.current, sceneEl = scene.current, endEl = end.current;
    let stop: (() => void) | null = null;
    let lastDay = -1, lastHop = -1, lastStarted = false, closed = false;
    const job = () => {
      const r = el.getBoundingClientRect();
      const vh = window.innerHeight;
      const p = clamp01(-r.top / Math.max(1, r.height - vh));
      // The ride (0.05-0.74), then in sequence: the stage goes (0.78-0.86), the sum comes (0.86-0.94).
      const d = clamp01((p - 0.05) / 0.69) * TODAY_DAYS;
      const w = where(d);
      const outT = clamp01((p - 0.78) / 0.08);
      const endT = clamp01((p - 0.86) / 0.08);
      const day = Math.min(TODAY_DAYS, Math.floor(d + 1e-6));
      const started = p >= 0.06;
      const pos = w.spur > 0 ? spur.at(w.spur) : ring.at(w.ring);
      const nowClosed = w.ring >= 1;
      return () => {
        if (discEl) discEl.style.transform = `translate3d(${pos.x.toFixed(2)}px, ${pos.y.toFixed(2)}px, 0)`;
        if (trailEl) trailEl.style.strokeDashoffset = (1 - w.ring).toFixed(4);
        if (spurEl) spurEl.style.strokeDashoffset = (1 - w.spur).toFixed(4);
        // The whole stage goes before the sum comes: never both on screen at once.
        if (sceneEl) {
          sceneEl.style.opacity = (1 - outT).toFixed(3);
          sceneEl.style.transform = outT > 0 ? `translate3d(0, ${(-outT * 24).toFixed(1)}px, 0) scale(${(1 - outT * 0.03).toFixed(4)})` : "";
          sceneEl.style.visibility = outT >= 1 ? "hidden" : "visible";
        }
        if (endEl) {
          endEl.style.opacity = endT.toFixed(3);
          endEl.style.transform = `translate3d(0, ${((1 - endT) * 28).toFixed(1)}px, 0)`;
          endEl.style.visibility = endT > 0 ? "visible" : "hidden";
        }
        if (nowClosed !== closed) { closed = nowClosed; if (closed) el.dataset.closed = ""; else delete el.dataset.closed; }
        if (day !== lastDay || w.hop !== lastHop || started !== lastStarted) {
          lastDay = day; lastHop = w.hop; lastStarted = started;
          setAt({ day, hop: w.hop, started });
        }
      };
    };
    // The ride only listens to the scroll while the section is near the screen.
    const near = new IntersectionObserver(([e]) => {
      if (e.isIntersecting && !stop) stop = onFrame(job);
      else if (!e.isIntersecting && stop) { stop(); stop = null; }
    }, { rootMargin: "50% 0px" });
    near.observe(el);
    return () => {
      near.disconnect(); stop?.();
      delete el.dataset.closed;
      const fin = spur.at(1);
      if (discEl) discEl.style.transform = `translate3d(${fin.x.toFixed(2)}px, ${fin.y.toFixed(2)}px, 0)`;
      if (trailEl) trailEl.style.strokeDashoffset = "";
      if (spurEl) spurEl.style.strokeDashoffset = "";
      for (const n of [sceneEl, endEl]) n?.removeAttribute("style");
    };
  }, [armed]);

  // What the stage shows: the live state while armed, the end of the story otherwise.
  const live = armed && at !== null;
  const day = live ? at.day : TODAY_DAYS;
  const hop = live ? at.hop : HOPS.length - 1;
  const started = live ? at.started : true;
  const board = started ? BOARD[hop] : BOARD_START;
  const cap = started ? hop : 0;
  // Station 0 is the sender (lit before the ride starts and when the request comes back); station i the desk of hop i-1.
  const deskOn = (i: number) => (i === 0 ? live && (!started || hop === RING.length - 1) : started && hop === i - 1);
  const finalDisc = spur.at(1);

  return (
    <section ref={root} id="ring" className={cn("section", styles.ring)} aria-labelledby="ring-h" data-ground="alt"
      data-pin={armed ? "" : undefined} data-armed={armed ? "" : undefined}>
      <div className={styles.stage}>
        <div ref={scene} className={cn("wrap", styles.scene)}>
          <header className={styles.head}>
            <p className={cn("nh-mono", styles.kicker)}><i aria-hidden="true" />Today · Night shift, 4-series</p>
            <h2 id="ring-h">A request nobody owns rides in circles.</h2>
          </header>

          <ol className={styles.caps} aria-hidden="true">
            {CAPTIONS.map((c, i) => (
              <li key={i} data-on={!armed || i === cap ? "" : undefined}>
                <b className="nh-mono">Day {c.day}.</b> {c.text}
              </li>
            ))}
          </ol>
          <p className={cn("nh-mono", styles.foot)} aria-hidden="true">One fictional request. The days are illustrative.</p>

          <div className={styles.ringBox} aria-hidden="true">
            <span className={styles.bullet}><b>?</b><small className="nh-mono">no last stop</small></span>
            <svg viewBox={`0 0 ${VB} ${VB}`} className={styles.art} focusable="false">
              {/* Day ticks outside the loop: one per waiting day. */}
              <path className={styles.ticks} d={DAY_TICKS.map((t) => `M${(t.x + t.nx * 9).toFixed(1)} ${(t.y + t.ny * 9).toFixed(1)}l${(t.nx * 8).toFixed(1)} ${(t.ny * 8).toFixed(1)}`).join("")} />
              <path className={styles.base} d={RING_D} />
              <path className={styles.pulse} d={RING_D} />
              <path ref={trail} className={styles.trail} d={RING_D} pathLength={1} />
              <path className={styles.spurBase} d={SPUR_D} />
              <path ref={spurTrail} className={styles.spurTrail} d={SPUR_D} pathLength={1} />
              <path className={styles.bar} d={`M${TERMINUS.x} ${TERMINUS.y - 16}V${TERMINUS.y + 16}`} />
              {STATIONS.map((s) => (
                <g key={s.i} className={styles.stop} data-on={deskOn(s.i) ? "" : undefined}>
                  <circle className={styles.stopGlow} cx={s.x} cy={s.y} r={18} />
                  <circle className={styles.stopDot} cx={s.x} cy={s.y} r={9} />
                </g>
              ))}
              <g ref={disc} className={styles.disc} style={{ transform: `translate3d(${finalDisc.x.toFixed(2)}px, ${finalDisc.y.toFixed(2)}px, 0)` }}>
                <circle className={styles.halo} r={20} />
                <circle className={styles.dot} r={9} />
              </g>
            </svg>

            {STATIONS.map((s) => {
              const h = s.i === 0 ? null : RING[s.i - 1];
              return (
                <Label key={s.i} {...s} on={deskOn(s.i)} past={s.i > 0 && started && hop > s.i - 1} cls={s.i === 0 ? styles.sender : undefined}>
                  <b>{h ? h.where : "Night shift"}</b>
                  <small className="nh-mono">{h ? `${h.days} d · ${h.reason}` : `sender · back here: ${RING[RING.length - 1].days} d`}</small>
                </Label>
              );
            })}
            <Label x={TERMINUS.x} y={TERMINUS.y} nx={1} ny={0} on={started && hop === HOPS.length - 1} past={false} cls={styles.work}>
              <b>Head of Production</b>
              <small className="nh-mono">{TODAY_WORK} d · the work</small>
            </Label>

            <div className={styles.counter}>
              <small className="nh-mono">Days on the way</small>
              <Flaps text={`Day ${String(day).padStart(2, "0")}`} cells={6} size="l" step={40} className={styles.dayFlaps} />
            </div>
          </div>
          <div className={styles.boardLine} aria-hidden="true">
            <Flaps text={board} cells={BOARD_CELLS} size="s" step={30} tone="gold" className={styles.boardFlaps} />
          </div>
        </div>

        <div ref={end} className={styles.end} aria-hidden="true">
          <p className={cn("nh-mono", styles.endKicker)}><i />Day {TODAY_DAYS} · answered</p>
          <p className={styles.endBig}>
            <span>{TODAY_DAYS} days on the ring.</span>
            <span className={styles.endWork}>{TODAY_WORK} days of work.</span>
          </p>
          <p className={styles.endRest}>{END_LINE}</p>
        </div>
      </div>

      <ol className="nh-sr">
        {CAPTIONS.map((c, i) => <li key={i}>Day {c.day}. {c.text}</li>)}
        <li>{TODAY_DAYS} days on the ring, {TODAY_WORK} days of work. {END_LINE} One fictional request; the days are illustrative.</li>
      </ol>
    </section>
  );
}
